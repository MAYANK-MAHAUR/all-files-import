const ignoredPayMemo =
  (location.hostname === "127.0.0.1" || location.hostname === "localhost") &&
  location.port === "5174";

if (!ignoredPayMemo && !location.hostname.includes("paymemo")) {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("inpage.js");
  script.dataset.paymemo = "true";
  (document.documentElement || document.head).appendChild(script);
  script.remove();
}

const categories = [
  "Payroll",
  "Vendor Payment",
  "Invoice Payment",
  "Bridge",
  "Swap",
  "Business Expense",
  "Refund",
  "Personal",
  "Transfer to Self",
  "Income",
  "Subscription",
  "API Payment",
  "Agent Task Payment",
  "Tool Usage",
  "Other",
];

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shorten(value) {
  if (!value) return "unknown";
  const text = String(value);
  if (text.length <= 16) return text;
  return `${text.slice(0, 8)}...${text.slice(-6)}`;
}

function hexWeiToEth(value) {
  if (!value || typeof value !== "string" || !value.startsWith("0x")) return "";
  try {
    const wei = BigInt(value);
    const whole = wei / 10n ** 18n;
    const fraction = (wei % 10n ** 18n).toString().padStart(18, "0").slice(0, 6);
    return `${whole}.${fraction}`.replace(/\.?0+$/, "");
  } catch {
    return "";
  }
}

function parseTx(payload) {
  const tx = Array.isArray(payload.params) ? payload.params[0] || {} : {};
  const firstCall = Array.isArray(tx.calls) ? tx.calls[0] || {} : {};
  const to = tx.to || firstCall.to || "";
  const from = tx.from || payload.from || "";
  const rawValue = tx.value || firstCall.value || "";
  const ethAmount = hexWeiToEth(rawValue);

  return {
    provider: payload.providerLabel || "injected wallet",
    to,
    from,
    amount: ethAmount ? `${ethAmount} ETH` : "",
    token: "ETH",
    method: payload.method,
    rawValue,
    data: tx.data || firstCall.data || "",
  };
}

function defaultCategory(payload, tx) {
  const method = payload.method || "";
  if (method.includes("signTypedData")) return "Other";
  if (tx.data && tx.data !== "0x") return "Tool Usage";
  return "Vendor Payment";
}

function sendRuntimeMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => resolve(response || {}));
  });
}

function renderOverlay(payload) {
  return new Promise((resolve) => {
    const existing = document.querySelector("#paymemo-capture-root");
    if (existing) existing.remove();

    const root = document.createElement("div");
    root.id = "paymemo-capture-root";
    const shadow = root.attachShadow({ mode: "open" });
    const tx = parseTx(payload);
    const guessedCategory = defaultCategory(payload, tx);

    shadow.innerHTML = `
      <style>
        :host { all: initial; }
        * { box-sizing: border-box; }
        .wrap {
          position: fixed;
          inset: 0;
          z-index: 2147483647;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle at 15% 20%, rgba(92,255,130,.24), transparent 30%),
            radial-gradient(circle at 90% 80%, rgba(255,226,87,.18), transparent 30%),
            rgba(7,8,11,.76);
          color: #f7f8f2;
          font-family: Geist, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          backdrop-filter: blur(12px);
        }
        .panel {
          width: min(520px, calc(100vw - 28px));
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 28px;
          background: rgba(17,19,25,.96);
          box-shadow: 0 34px 95px rgba(0,0,0,.54);
        }
        .top {
          position: relative;
          padding: 18px 20px 16px;
          background:
            linear-gradient(120deg, rgba(92,255,130,.26), rgba(11,11,15,.98)),
            #0b0b0f;
          color: white;
        }
        .grain {
          position: absolute;
          inset: 0;
          opacity: .12;
          background-image: linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px);
          background-size: 18px 18px;
        }
        .top-inner { position: relative; display: flex; gap: 12px; align-items: center; }
        .logo {
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border-radius: 16px;
          border: 1px solid rgba(92,255,130,.38);
          background: rgba(92,255,130,.16);
          color: #5cff82;
          font-weight: 900;
          box-shadow: 0 18px 40px rgba(0,0,0,.25);
        }
        .eyebrow {
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .18em;
          text-transform: uppercase;
          color: rgba(255,255,255,.72);
        }
        h1 { margin: 4px 0 0; font-size: 21px; line-height: 1.14; letter-spacing: -0.01em; }
        .body { padding: 20px; }
        .summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 16px;
        }
        .cell {
          min-width: 0;
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 16px;
          background: rgba(255,255,255,.055);
          padding: 11px 12px;
        }
        .label {
          display: block;
          color: rgba(247,248,242,.52);
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .14em;
          text-transform: uppercase;
        }
        .value {
          display: block;
          margin-top: 5px;
          overflow: hidden;
          color: #f7f8f2;
          font-size: 12px;
          font-weight: 750;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .chips { display: flex; flex-wrap: wrap; gap: 7px; margin: 8px 0 16px; }
        .chip {
          border: 1px solid rgba(255,255,255,.11);
          border-radius: 999px;
          background: rgba(255,255,255,.075);
          color: rgba(247,248,242,.78);
          padding: 8px 10px;
          font: 800 11px/1 inherit;
          cursor: pointer;
        }
        .chip.active { border-color: #5cff82; background: #5cff82; color: #071009; }
        label {
          display: block;
          margin-top: 12px;
          color: rgba(247,248,242,.55);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .14em;
          text-transform: uppercase;
        }
        input, textarea {
          width: 100%;
          margin-top: 7px;
          border: 1px solid rgba(255,255,255,.11);
          border-radius: 16px;
          background: rgba(0,0,0,.28);
          color: #f7f8f2;
          padding: 12px 13px;
          font: 13px/1.35 inherit;
          outline: none;
          box-shadow: inset 0 0 0 1px transparent;
        }
        input:focus, textarea:focus {
          border-color: #5cff82;
          box-shadow: 0 0 0 3px rgba(92,255,130,.18);
        }
        textarea { min-height: 78px; resize: vertical; }
        .toggle-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
        .quick {
          border: 1px solid rgba(255,255,255,.11);
          border-radius: 14px;
          background: rgba(255,255,255,.075);
          color: #f7f8f2;
          padding: 10px;
          font: 850 12px/1 inherit;
          cursor: pointer;
        }
        .quick.active { background: rgba(92,255,130,.22); border-color: rgba(92,255,130,.45); }
        .lifecycle {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          color: rgba(247,248,242,.48);
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .12em;
          text-transform: uppercase;
        }
        .life-dot { height: 4px; border-radius: 99px; background: rgba(255,255,255,.12); margin-bottom: 7px; }
        .life-dot.on { background: #5cff82; box-shadow: 0 0 18px rgba(92,255,130,.6); }
        .actions { display: grid; grid-template-columns: 1fr 1.4fr; gap: 10px; margin-top: 18px; }
        button {
          border: 0;
          border-radius: 16px;
          padding: 13px 14px;
          font: 900 13px/1 inherit;
          cursor: pointer;
        }
        .primary { background: #5cff82; color: #071009; box-shadow: 0 18px 45px rgba(92,255,130,.18); }
        .ghost { background: rgba(255,255,255,.08); color: rgba(247,248,242,.76); }
        .hint { margin: 13px 0 0; color: rgba(247,248,242,.52); font-size: 11px; line-height: 1.45; }
      </style>
      <div class="wrap">
        <form class="panel">
          <div class="top">
            <div class="grain"></div>
            <div class="top-inner">
              <div class="logo">P</div>
              <div>
                <div class="eyebrow">PayMemo Wallet Assist</div>
                <h1>What is this transaction for?</h1>
              </div>
            </div>
          </div>
          <div class="body">
            <div class="summary">
              <div class="cell">
                <span class="label">Method</span>
                <span class="value">${escapeHtml(payload.method)}</span>
              </div>
              <div class="cell">
                <span class="label">Provider</span>
                <span class="value">${escapeHtml(shorten(tx.provider))}</span>
              </div>
              <div class="cell">
                <span class="label">Amount</span>
                <span class="value">${escapeHtml(tx.amount || "contract call")}</span>
              </div>
              <div class="cell">
                <span class="label">From</span>
                <span class="value">${escapeHtml(shorten(tx.from))}</span>
              </div>
              <div class="cell">
                <span class="label">To</span>
                <span class="value">${escapeHtml(shorten(tx.to))}</span>
              </div>
            </div>

            <span class="label">Category</span>
            <input type="hidden" name="category" value="${escapeHtml(guessedCategory)}" />
            <div class="chips">
              ${categories
                .slice(0, 10)
                .map(
                  (item) =>
                    `<button type="button" class="chip ${item === guessedCategory ? "active" : ""}" data-category="${escapeHtml(item)}">${escapeHtml(item)}</button>`,
                )
                .join("")}
            </div>

            <label>Counterparty</label>
            <input name="counterparty" placeholder="Vendor, wallet owner, protocol, API..." value="${escapeHtml(tx.to || "")}" />

            <div class="toggle-row">
              <button type="button" class="quick" data-kind="business">Mark as Business</button>
              <button type="button" class="quick" data-kind="personal">Mark as Personal</button>
            </div>

            <label>Private note</label>
            <textarea name="note" placeholder="Invoice, task, project, receipt, tax label..."></textarea>

            <label>Invoice, project, or task</label>
            <input name="project" placeholder="Project, task ID, client, workflow..." />

            <div class="lifecycle">
              <div><div class="life-dot on"></div>Intent</div>
              <div><div class="life-dot"></div>Sign</div>
              <div><div class="life-dot"></div>Verify</div>
              <div><div class="life-dot"></div>Ledger</div>
            </div>

            <div class="actions">
              <button class="ghost" type="button" data-skip>Skip</button>
              <button class="primary" type="submit">Save context and continue</button>
            </div>
            <p class="hint">PayMemo stores this context locally in the extension and tracks the tx hash if your wallet returns one.</p>
          </div>
        </form>
      </div>
    `;

    document.documentElement.appendChild(root);

    const categoryInput = shadow.querySelector('input[name="category"]');
    const chips = [...shadow.querySelectorAll(".chip")];
    const quicks = [...shadow.querySelectorAll(".quick")];

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chips.forEach((item) => item.classList.remove("active"));
        chip.classList.add("active");
        categoryInput.value = chip.dataset.category;
      });
    });

    quicks.forEach((button) => {
      button.addEventListener("click", () => {
        quicks.forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        if (button.dataset.kind === "personal") categoryInput.value = "Personal";
        if (button.dataset.kind === "business") categoryInput.value = "Business Expense";
        chips.forEach((item) => item.classList.remove("active"));
      });
    });

    const close = (record) => {
      root.remove();
      resolve(record);
    };

    shadow.querySelector("[data-skip]").addEventListener("click", () => close(null));
    shadow.querySelector("form").addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      close({
        source: window.location.origin,
        pageTitle: document.title,
        mode: "wallet-assist",
        status: "pending_signature",
        category: String(data.get("category")),
        counterparty: String(data.get("counterparty") || ""),
        note: String(data.get("note") || ""),
        project: String(data.get("project") || ""),
        to: tx.to || "unknown",
        from: tx.from || "",
        amount: tx.amount || "contract call",
        token: tx.token,
        method: tx.method,
        rawValue: tx.rawValue,
        provider: tx.provider,
      });
    });
  });
}

function extractTxHash(result) {
  if (typeof result === "string" && /^0x[a-fA-F0-9]{64}$/.test(result)) return result;
  if (typeof result?.result === "string" && /^0x[a-fA-F0-9]{64}$/.test(result.result)) {
    return result.result;
  }
  if (
    typeof result?.transactionHash === "string" &&
    /^0x[a-fA-F0-9]{64}$/.test(result.transactionHash)
  ) {
    return result.transactionHash;
  }
  if (Array.isArray(result)) {
    for (const item of result) {
      const txHash = extractTxHash(item);
      if (txHash) return txHash;
    }
  }
  return "";
}

window.addEventListener("message", async (event) => {
  if (event.source !== window) return;

  if (event.data?.type === "PAYMEMO_REQUEST_CONTEXT") {
    const record = await renderOverlay(event.data.payload);
    if (!record) {
      window.postMessage({ type: "PAYMEMO_CONTEXT_READY", id: event.data.id, skipped: true }, "*");
      return;
    }

    const response = await sendRuntimeMessage({ type: "PAYMEMO_SAVE_RECORD", record });
    window.postMessage(
      {
        type: "PAYMEMO_CONTEXT_READY",
        id: event.data.id,
        recordId: response.record?.id,
      },
      "*",
    );
  }

  if (event.data?.type === "PAYMEMO_REQUEST_RESULT") {
    const result = event.data.result;
    const txHash = extractTxHash(result);

    if (txHash) {
      chrome.runtime.sendMessage({
        type: "PAYMEMO_TX_SUBMITTED",
        recordId: event.data.recordId,
        txHash,
        method: event.data.method,
      });
      return;
    }

    chrome.runtime.sendMessage({
      type: "PAYMEMO_SIGNED",
      recordId: event.data.recordId,
      method: event.data.method,
    });
  }

  if (event.data?.type === "PAYMEMO_REQUEST_ERROR") {
    chrome.runtime.sendMessage({
      type: "PAYMEMO_REJECTED",
      recordId: event.data.recordId,
      method: event.data.method,
      error: event.data.error,
    });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "PAYMEMO_SHOW_CAPTURE_FOR_RECORD" || !message.record) return false;

  const record = message.record;
  const payload = {
    method: "morph-chain-watch",
    providerLabel: "Morph Chain Watch",
    params: [
      {
        from: record.from || "",
        to: record.to || "",
        value: record.rawValue || "0x0",
      },
    ],
  };

  renderOverlay(payload)
    .then((captured) => {
      if (!captured) {
        sendResponse({ ok: true, skipped: true });
        return null;
      }

      return sendRuntimeMessage({
        type: "PAYMEMO_UPDATE_RECORD",
        id: record.id,
        patch: {
          ...captured,
          status: record.status === "failed" ? "failed" : "needs-review",
          method: "morph-chain-watch",
          provider: "Morph Chain Watch",
          origin: record.origin || "Morph Hoodi chain watch",
        },
      }).then((response) => {
        sendResponse({ ok: Boolean(response.ok), record: response.record });
      });
    })
    .catch((error) => {
      sendResponse({ ok: false, error: error.message });
    });

  return true;
});
