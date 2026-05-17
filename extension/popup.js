const recordsRoot = document.querySelector("#records");
const enabledInput = document.querySelector("#enabled");
const enabledText = document.querySelector("#enabledText");
const appUrlInput = document.querySelector("#appUrl");
const rpcUrlInput = document.querySelector("#rpcUrl");
const chainWatchInput = document.querySelector("#chainWatchEnabled");
const chainWatchText = document.querySelector("#chainWatchText");
const watchedAddressesInput = document.querySelector("#watchedAddresses");
const autoOpenChainWatchPromptInput = document.querySelector("#autoOpenChainWatchPrompt");
const scanStatus = document.querySelector("#scanStatus");
const totalEl = document.querySelector("#total");
const pendingEl = document.querySelector("#pending");
const confirmedEl = document.querySelector("#confirmed");

let currentSettings = {};
let currentRecords = [];
let liveScanTimer = null;

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => resolve(response || {}));
  });
}

function statusText(status) {
  const map = {
    pending_signature: "waiting sign",
    pending_chain: "verifying",
    confirmed: "confirmed",
    failed: "failed",
    rejected: "rejected",
    signed: "signed",
    "needs-review": "needs review",
  };
  return map[status] || status || "intent";
}

function renderStats(records) {
  totalEl.textContent = String(records.length);
  pendingEl.textContent = String(
    records.filter((record) =>
      ["pending_signature", "pending_chain", "signed"].includes(record.status),
    ).length,
  );
  confirmedEl.textContent = String(
    records.filter((record) => record.status === "confirmed").length,
  );
}

function render(records) {
  currentRecords = records;
  renderStats(records);

  if (!records.length) {
    recordsRoot.innerHTML = `
      <div class="empty">
        No wallet-assisted records yet.<br>
        Start a transaction on a supported EVM dApp and PayMemo will ask what it is for.
      </div>
    `;
    return;
  }

  recordsRoot.innerHTML = records
    .map(
      (record) => `
        <article class="record">
          <div class="record-top">
            <div>
              <strong>${escapeHtml(record.category || "Uncategorized")} - ${escapeHtml(record.amount || "contract call")}</strong>
              <span>${escapeHtml(record.counterparty || record.to || "Unknown counterparty")}</span>
            </div>
            <span class="pill ${escapeHtml(record.status)}">${escapeHtml(statusText(record.status))}</span>
          </div>
          <p>${escapeHtml(record.note || "No private note captured.")}</p>
          <span>${escapeHtml(record.provider || "injected EVM provider")}</span>
          <span>${escapeHtml(record.txHash ? `${record.txHash.slice(0, 10)}...${record.txHash.slice(-8)}` : record.method || "wallet request")}</span>
          <div class="record-actions">
            <button class="secondary" data-memo="${escapeHtml(record.id)}">Memo</button>
            <button class="secondary" data-sync="${escapeHtml(record.id)}">${record.syncStatus === "synced" ? "Synced" : "Sync"}</button>
            <button class="secondary" data-copy="${escapeHtml(record.id)}">Copy JSON</button>
          </div>
        </article>
      `,
    )
    .join("");

  recordsRoot.querySelectorAll("[data-sync]").forEach((button) => {
    button.addEventListener("click", async () => {
      button.textContent = "Syncing";
      const response = await sendMessage({ type: "PAYMEMO_SYNC_RECORD", id: button.dataset.sync });
      button.textContent = response.ok ? "Synced" : "Failed";
      await load();
    });
  });

  recordsRoot.querySelectorAll("[data-memo]").forEach((button) => {
    button.addEventListener("click", async () => {
      await sendMessage({ type: "PAYMEMO_OPEN_CAPTURE", id: button.dataset.memo });
      window.close();
    });
  });

  recordsRoot.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const record = currentRecords.find((item) => item.id === button.dataset.copy);
      if (!record) return;
      await navigator.clipboard.writeText(JSON.stringify(record, null, 2));
      button.textContent = "Copied";
      setTimeout(() => {
        button.textContent = "Copy JSON";
      }, 1200);
    });
  });
}

function applySettings(settings) {
  currentSettings = settings;
  enabledInput.checked = Boolean(settings.enabled);
  enabledText.textContent = settings.enabled ? "Active" : "Paused";
  appUrlInput.value = settings.appUrl || "";
  rpcUrlInput.value = settings.rpcUrl || "";
  chainWatchInput.checked = Boolean(settings.chainWatchEnabled);
  chainWatchText.textContent = settings.chainWatchEnabled ? "Watching Morph" : "Paused";
  watchedAddressesInput.value = Array.isArray(settings.watchedAddresses)
    ? settings.watchedAddresses.join("\n")
    : settings.watchedAddresses || "";
  autoOpenChainWatchPromptInput.checked = settings.autoOpenChainWatchPrompt !== false;
  configureLivePopupScan();
}

async function load() {
  const response = await sendMessage({ type: "PAYMEMO_GET_STATE" });
  applySettings(response.settings || {});
  render(response.records || []);
}

function configureLivePopupScan() {
  if (liveScanTimer) {
    clearInterval(liveScanTimer);
    liveScanTimer = null;
  }

  if (!currentSettings.chainWatchEnabled) return;

  liveScanTimer = setInterval(async () => {
    const response = await sendMessage({ type: "PAYMEMO_SCAN_MORPH_NOW" });
    if (response.ok && response.result?.found) {
      scanStatus.textContent = `Detected ${response.result.found} new Morph tx${response.result.found === 1 ? "" : "s"}.`;
      await load();
    }
  }, 3500);
}

enabledInput.addEventListener("change", async () => {
  const settings = await sendMessage({
    type: "PAYMEMO_SAVE_SETTINGS",
    settings: { ...currentSettings, enabled: enabledInput.checked },
  });
  applySettings(settings.settings || {});
});

chainWatchInput.addEventListener("change", async () => {
  const settings = await sendMessage({
    type: "PAYMEMO_SAVE_SETTINGS",
    settings: {
      ...currentSettings,
      chainWatchEnabled: chainWatchInput.checked,
      watchedAddresses: watchedAddressesInput.value,
      autoOpenChainWatchPrompt: autoOpenChainWatchPromptInput.checked,
    },
  });
  applySettings(settings.settings || {});
});

document.querySelector("#saveSettings").addEventListener("click", async () => {
  const response = await sendMessage({
    type: "PAYMEMO_SAVE_SETTINGS",
    settings: {
      ...currentSettings,
      appUrl: appUrlInput.value.trim(),
      rpcUrl: rpcUrlInput.value.trim(),
      chainWatchEnabled: chainWatchInput.checked,
      watchedAddresses: watchedAddressesInput.value,
      autoOpenChainWatchPrompt: autoOpenChainWatchPromptInput.checked,
    },
  });
  applySettings(response.settings || {});
});

document.querySelector("#openApp").addEventListener("click", () => {
  const url = `${(currentSettings.appUrl || "http://127.0.0.1:5174").replace(/\/$/, "")}/app/assist`;
  chrome.tabs.create({ url });
});

document.querySelector("#openReview").addEventListener("click", () => {
  const url = `${(currentSettings.appUrl || "http://127.0.0.1:5174").replace(/\/$/, "")}/app/review`;
  chrome.tabs.create({ url });
});

document.querySelector("#scanMorphNow").addEventListener("click", async () => {
  scanStatus.textContent = "Scanning Morph Hoodi...";
  const response = await sendMessage({ type: "PAYMEMO_SCAN_MORPH_NOW" });
  if (!response.ok) {
    scanStatus.textContent = response.error || "Morph scan failed.";
    return;
  }

  const result = response.result || {};
  scanStatus.textContent = `Scanned Morph blocks ${result.fromBlock ?? "-"}-${result.latestBlock ?? "-"}; found ${result.found ?? 0}.`;
  await load();
});

document.querySelector("#syncAll").addEventListener("click", async () => {
  await sendMessage({ type: "PAYMEMO_SYNC_ALL" });
  await load();
});

document.querySelector("#clear").addEventListener("click", async () => {
  await sendMessage({ type: "PAYMEMO_CLEAR_RECORDS" });
  render([]);
});

void load();
