const STORAGE_KEY = "paymemo.records";
const SETTINGS_KEY = "paymemo.settings";
const WATCH_STATE_KEY = "paymemo.morphWatchState";
const MORPH_WATCH_ALARM = "paymemo-morph-watch";

const DEFAULT_SETTINGS = {
  appUrl: "http://127.0.0.1:5174",
  rpcUrl: "https://rpc-hoodi.morph.network",
  chainId: 2910,
  enabled: true,
  chainWatchEnabled: false,
  watchedAddresses: [],
  autoOpenChainWatchPrompt: true,
  morphWatchIntervalMs: 2500,
};

async function readSettings() {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] || {}) };
}

async function saveSettings(settings) {
  const next = { ...DEFAULT_SETTINGS, ...settings };
  await chrome.storage.local.set({ [SETTINGS_KEY]: next });
  await configureMorphWatch(next);
  return next;
}

async function readWatchState() {
  const result = await chrome.storage.local.get(WATCH_STATE_KEY);
  return {
    lastBlock: 0,
    seenTxHashes: [],
    ...(result[WATCH_STATE_KEY] || {}),
  };
}

async function writeWatchState(state) {
  await chrome.storage.local.set({ [WATCH_STATE_KEY]: state });
  return state;
}

async function readRecords() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
}

async function writeRecords(records) {
  await chrome.storage.local.set({ [STORAGE_KEY]: records });
  await chrome.action.setBadgeText({ text: records.length ? String(records.length) : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#5cff82" });
  return records;
}

async function upsertRecord(record) {
  const records = await readRecords();
  const id =
    record.id || `ext_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const nextRecord = {
    ...record,
    id,
    updatedAt: new Date().toISOString(),
    createdAt: record.createdAt || new Date().toISOString(),
  };
  const next = [nextRecord, ...records.filter((item) => item.id !== id)];
  await writeRecords(next);
  return nextRecord;
}

async function patchRecord(id, patch) {
  const records = await readRecords();
  const current = records.find((item) => item.id === id);
  if (!current) return null;
  const updated = { ...current, ...patch, updatedAt: new Date().toISOString() };
  await writeRecords([updated, ...records.filter((item) => item.id !== id)]);
  return updated;
}

function normalizeAddresses(addresses) {
  const values = Array.isArray(addresses) ? addresses : String(addresses || "").split(/[\s,]+/);
  return values
    .map((address) =>
      String(address || "")
        .trim()
        .toLowerCase(),
    )
    .filter((address) => /^0x[a-f0-9]{40}$/.test(address));
}

function hexToNumber(value) {
  if (!value) return 0;
  return Number.parseInt(value, 16);
}

function numberToHex(value) {
  return `0x${Math.max(0, value).toString(16)}`;
}

function formatEther(hexValue) {
  if (!hexValue || hexValue === "0x") return "0";
  try {
    const wei = BigInt(hexValue);
    const whole = wei / 10n ** 18n;
    const fraction = (wei % 10n ** 18n).toString().padStart(18, "0").slice(0, 6);
    return `${whole}.${fraction}`.replace(/\.?0+$/, "") || "0";
  } catch {
    return "0";
  }
}

async function morphRpc(method, params = []) {
  const settings = await readSettings();
  const response = await fetch(settings.rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    }),
  });

  if (!response.ok) throw new Error(`Morph RPC failed: ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error.message || "Morph RPC error");
  return payload.result;
}

async function getReceipt(txHash) {
  return morphRpc("eth_getTransactionReceipt", [txHash]).catch(() => null);
}

async function pollReceipt(recordId, txHash, attempt = 0) {
  if (!recordId || !txHash || attempt > 30) return;

  const receipt = await getReceipt(txHash).catch(() => null);
  if (receipt) {
    await patchRecord(recordId, {
      status: receipt.status === "0x1" ? "confirmed" : "failed",
      txHash,
      blockNumber: receipt.blockNumber,
      confirmedAt: new Date().toISOString(),
    });
    return;
  }

  setTimeout(() => {
    void pollReceipt(recordId, txHash, attempt + 1);
  }, 3000);
}

async function syncRecord(record) {
  const settings = await readSettings();
  const endpoint = `${settings.appUrl.replace(/\/$/, "")}/api/extension-intent`;
  const payload = {
    mode: "wallet-assist",
    status: record.status === "confirmed" ? "confirmed" : "intent",
    chainId: record.chainId || settings.chainId,
    chainName: record.chainName || "Morph Hoodi Testnet",
    txHash: record.txHash,
    from: record.from,
    to: record.to || "unknown",
    amount: record.amount || "contract call",
    token: record.token || "ETH",
    category: record.category || "Other",
    counterparty: record.counterparty,
    note: record.note,
    project: record.project,
    source: record.source || record.origin || "browser-extension",
    origin: record.origin,
    method: record.method,
    provider: record.provider,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error("PayMemo dApp sync failed.");
  const result = await response.json();
  await patchRecord(record.id, { syncStatus: "synced", syncedAt: new Date().toISOString() });
  return result;
}

async function openCaptureWindow(records) {
  const items = Array.isArray(records) ? records : [records];
  const ids = items.map((record) => record.id).filter(Boolean);
  const query =
    ids.length > 1
      ? `ids=${encodeURIComponent(ids.join(","))}`
      : `id=${encodeURIComponent(ids[0])}`;
  const focused = await chrome.windows.getLastFocused().catch(() => null);
  const width = 420;
  const height = ids.length > 1 ? 740 : 660;
  const left =
    focused?.left !== undefined && focused?.width
      ? Math.max(0, focused.left + focused.width - width - 24)
      : undefined;
  const top = focused?.top !== undefined ? Math.max(0, focused.top + 84) : undefined;

  const url = chrome.runtime.getURL(`capture.html?${query}`);
  await chrome.windows.create({
    focused: true,
    height,
    ...(left !== undefined ? { left } : {}),
    ...(top !== undefined ? { top } : {}),
    type: "popup",
    url,
    width,
  });
}

async function showChainWatchPrompt(records) {
  const settings = await readSettings();
  if (!settings.autoOpenChainWatchPrompt) return;
  const items = Array.isArray(records) ? records : [records];
  if (!items.length) return;

  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true }).catch(() => []);
  const tab = tabs?.[0];
  const canMessageTab = Boolean(tab?.id && /^https?:\/\//.test(tab.url || ""));

  if (items.length === 1 && canMessageTab) {
    const response = await chrome.tabs
      .sendMessage(tab.id, { type: "PAYMEMO_SHOW_CAPTURE_FOR_RECORD", record: items[0] })
      .catch(() => null);
    if (response?.ok) return;
  }

  await openCaptureWindow(items).catch(() => null);
}

async function createChainWatchRecord(tx, receipt, direction) {
  const failed = receipt?.status === "0x0";
  const amount = `${formatEther(tx.value)} ETH`;
  const counterparty =
    direction === "outgoing" ? tx.to || "contract interaction" : tx.from || "unknown sender";

  return upsertRecord({
    mode: "wallet-assist",
    status: failed ? "failed" : "needs-review",
    chainId: 2910,
    chainName: "Morph Hoodi Testnet",
    txHash: tx.hash,
    from: tx.from || "",
    to: tx.to || "contract interaction",
    amount,
    token: "ETH",
    category: "Other",
    counterparty,
    note: "Detected after a wallet-internal Morph testnet send. Add what this payment was for.",
    project: "Wallet internal send",
    origin: "Morph Hoodi chain watch",
    source: "Morph Hoodi chain watch",
    provider: "Morph Chain Watch",
    method: "morph-chain-watch",
    rawValue: tx.value || "0x0",
    blockNumber: receipt?.blockNumber,
    confirmedAt: receipt ? new Date().toISOString() : undefined,
    syncStatus: "local",
    detectionTiming: "post-broadcast",
    direction,
  });
}

async function scanMorphChainWatch({ forceRecent = false } = {}) {
  const settings = await readSettings();
  const watchedAddresses = normalizeAddresses(settings.watchedAddresses);

  if (!settings.chainWatchEnabled || !watchedAddresses.length) {
    return {
      ok: true,
      enabled: settings.chainWatchEnabled,
      watched: watchedAddresses.length,
      found: 0,
    };
  }

  const latestHex = await morphRpc("eth_blockNumber");
  const latestBlock = hexToNumber(latestHex);
  const state = await readWatchState();
  const seen = new Set((state.seenTxHashes || []).map((hash) => String(hash).toLowerCase()));
  const existingRecords = await readRecords();
  const existingTxHashes = new Set(
    existingRecords.map((record) => record.txHash?.toLowerCase()).filter(Boolean),
  );

  const startBlock = forceRecent
    ? Math.max(0, latestBlock - 8)
    : state.lastBlock
      ? Math.max(state.lastBlock + 1, latestBlock - 8)
      : Math.max(0, latestBlock - 2);

  const found = [];

  for (let blockNumber = startBlock; blockNumber <= latestBlock; blockNumber += 1) {
    const block = await morphRpc("eth_getBlockByNumber", [numberToHex(blockNumber), true]).catch(
      () => null,
    );
    const transactions = Array.isArray(block?.transactions) ? block.transactions : [];

    for (const tx of transactions) {
      const hash = String(tx.hash || "").toLowerCase();
      if (!hash || seen.has(hash) || existingTxHashes.has(hash)) continue;

      const from = String(tx.from || "").toLowerCase();
      const to = String(tx.to || "").toLowerCase();
      const isOutgoing = watchedAddresses.includes(from);
      const isIncoming = watchedAddresses.includes(to);
      if (!isOutgoing && !isIncoming) continue;

      const receipt = await getReceipt(tx.hash);
      const record = await createChainWatchRecord(
        tx,
        receipt,
        isOutgoing ? "outgoing" : "incoming",
      );
      found.push(record);
      seen.add(hash);
      existingTxHashes.add(hash);
    }
  }

  await writeWatchState({
    lastBlock: latestBlock,
    seenTxHashes: Array.from(seen).slice(-300),
    updatedAt: new Date().toISOString(),
  });

  if (found.length) await showChainWatchPrompt(found);

  return {
    ok: true,
    enabled: true,
    fromBlock: startBlock,
    latestBlock,
    watched: watchedAddresses.length,
    found: found.length,
    batch: found.length > 1,
  };
}

let liveWatchTimer = null;

function startLiveMorphWatch() {
  if (liveWatchTimer) clearTimeout(liveWatchTimer);

  const tick = async () => {
    const settings = await readSettings();
    if (!settings.chainWatchEnabled) {
      liveWatchTimer = null;
      return;
    }

    await scanMorphChainWatch().catch(() => null);
    liveWatchTimer = setTimeout(tick, Math.max(1500, settings.morphWatchIntervalMs || 2500));
  };

  liveWatchTimer = setTimeout(tick, 750);
}

async function configureMorphWatch(settings) {
  if (settings.chainWatchEnabled) {
    await chrome.alarms.create(MORPH_WATCH_ALARM, {
      delayInMinutes: 0.5,
      periodInMinutes: 0.5,
    });
    startLiveMorphWatch();
    return;
  }

  if (liveWatchTimer) clearTimeout(liveWatchTimer);
  liveWatchTimer = null;
  await chrome.alarms.clear(MORPH_WATCH_ALARM);
}

chrome.runtime.onInstalled.addListener(async () => {
  const records = await readRecords();
  const settings = await saveSettings(await readSettings());
  await configureMorphWatch(settings);
  await writeRecords(records);
});

chrome.runtime.onStartup?.addListener(async () => {
  await configureMorphWatch(await readSettings());
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === MORPH_WATCH_ALARM) {
    void scanMorphChainWatch().catch(() => null);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "PAYMEMO_GET_STATE") {
    Promise.all([readRecords(), readSettings()]).then(([records, settings]) => {
      sendResponse({ ok: true, records, settings });
    });
    return true;
  }

  if (message?.type === "PAYMEMO_SAVE_SETTINGS") {
    saveSettings(message.settings || {}).then((settings) => sendResponse({ ok: true, settings }));
    return true;
  }

  if (message?.type === "PAYMEMO_SCAN_MORPH_NOW") {
    scanMorphChainWatch({ forceRecent: true })
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "PAYMEMO_SAVE_RECORD") {
    readSettings().then(async (settings) => {
      if (!settings.enabled) {
        sendResponse({ ok: false, skipped: true });
        return;
      }

      const saved = await upsertRecord({
        mode: "wallet-assist",
        status: "pending_signature",
        origin: sender.tab?.url || message.origin || "unknown",
        syncStatus: "local",
        ...message.record,
      });
      sendResponse({ ok: true, record: saved });
    });
    return true;
  }

  if (message?.type === "PAYMEMO_TX_SUBMITTED") {
    patchRecord(message.recordId, {
      status: "pending_chain",
      txHash: message.txHash,
      method: message.method,
    }).then((record) => {
      if (record?.txHash) void pollReceipt(record.id, record.txHash);
      sendResponse({ ok: true, record });
    });
    return true;
  }

  if (message?.type === "PAYMEMO_UPDATE_RECORD") {
    patchRecord(message.id, message.patch || {}).then((record) =>
      sendResponse({ ok: Boolean(record), record }),
    );
    return true;
  }

  if (message?.type === "PAYMEMO_OPEN_CAPTURE") {
    readRecords()
      .then((records) => records.find((item) => item.id === message.id))
      .then((record) => (record ? openCaptureWindow(record) : null))
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "PAYMEMO_SIGNED") {
    patchRecord(message.recordId, {
      status: "signed",
      method: message.method,
    }).then((record) => sendResponse({ ok: true, record }));
    return true;
  }

  if (message?.type === "PAYMEMO_REJECTED") {
    patchRecord(message.recordId, {
      status: "rejected",
      error: message.error || "Wallet request rejected",
    }).then((record) => sendResponse({ ok: true, record }));
    return true;
  }

  if (message?.type === "PAYMEMO_SYNC_RECORD") {
    readRecords()
      .then((records) => records.find((item) => item.id === message.id))
      .then((record) => (record ? syncRecord(record) : null))
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "PAYMEMO_SYNC_ALL") {
    readRecords()
      .then(async (records) => {
        const results = [];
        for (const record of records) {
          try {
            results.push(await syncRecord(record));
          } catch (error) {
            await patchRecord(record.id, { syncStatus: "sync-failed", syncError: error.message });
          }
        }
        return results;
      })
      .then((results) => sendResponse({ ok: true, count: results.length }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "PAYMEMO_CLEAR_RECORDS") {
    chrome.storage.local.set({ [STORAGE_KEY]: [] }).then(async () => {
      await chrome.action.setBadgeText({ text: "" });
      sendResponse({ ok: true });
    });
    return true;
  }

  return false;
});

void readSettings()
  .then(configureMorphWatch)
  .catch(() => null);
