const categories = [
  "Vendor Payment",
  "Invoice Payment",
  "Business Expense",
  "Payroll",
  "Personal",
  "Transfer to Self",
  "Refund",
  "Subscription",
  "Agent Task Payment",
  "Other",
];

const params = new URLSearchParams(location.search);
const ids = (params.get("ids") || params.get("id") || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

let records = [];

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

function shorten(value) {
  if (!value) return "-";
  const text = String(value);
  if (text.length <= 18) return text;
  return `${text.slice(0, 10)}...${text.slice(-8)}`;
}

function recordCard(record, index) {
  const category = record.category || "Other";
  return `
    <section class="tx-card" data-record="${escapeHtml(record.id)}">
      <div class="tx-top">
        <div>
          <span class="mini-label">Morph Hoodi transaction ${records.length > 1 ? index + 1 : ""}</span>
          <div class="amount">${escapeHtml(record.amount || "contract call")}</div>
          <p class="hint">Detected after broadcast from wallet-internal send.</p>
        </div>
        <span class="pill">${escapeHtml(record.status || "needs-review")}</span>
      </div>

      <div class="meta">
        <div>
          <span class="mini-label">To</span>
          <strong title="${escapeHtml(record.to)}">${escapeHtml(shorten(record.to))}</strong>
        </div>
        <div>
          <span class="mini-label">Tx hash</span>
          <strong title="${escapeHtml(record.txHash)}">${escapeHtml(shorten(record.txHash))}</strong>
        </div>
      </div>

      <input data-field="category" type="hidden" value="${escapeHtml(category)}" />
      <div class="chips">
        ${categories
          .map(
            (item) =>
              `<button type="button" class="${item === category ? "active" : ""}" data-category="${escapeHtml(item)}">${escapeHtml(item)}</button>`,
          )
          .join("")}
      </div>

      <div class="field-grid">
        <label>
          Counterparty
          <input data-field="counterparty" value="${escapeHtml(record.counterparty || record.to || "")}" />
        </label>
        <label>
          Private note
          <textarea data-field="note">${escapeHtml(record.note || "")}</textarea>
        </label>
        <label>
          Invoice, project, or task
          <input data-field="project" value="${escapeHtml(record.project || "")}" />
        </label>
      </div>
    </section>
  `;
}

function render() {
  const root = document.querySelector("#app");

  if (!records.length) {
    root.innerHTML = `
      <div class="shell">
        <header>
          <span class="logo">P</span>
          <div>
            <span class="eyebrow">PayMemo</span>
            <h1>No record found</h1>
            <p class="subtitle">Open the extension popup and scan Morph again.</p>
          </div>
        </header>
        <div class="empty">This memo prompt could not find the selected transaction.</div>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <div class="shell">
      <header>
        <span class="logo">P</span>
        <div>
          <span class="eyebrow">Morph Chain Watch</span>
          <h1>${records.length > 1 ? "Tag this batch" : "What was this for?"}</h1>
          <p class="subtitle">${
            records.length > 1
              ? `${records.length} Morph transactions detected. Save private context for each.`
              : "PayMemo detected a Morph tx from your watched wallet."
          }</p>
        </div>
      </header>
      <div class="scroll">
        ${records.map(recordCard).join("")}
      </div>
      <div class="actions">
        <button id="save" class="secondary" type="button">Save locally</button>
        <button id="sync" class="primary" type="button">Save & sync</button>
      </div>
    </div>
  `;

  root.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest("[data-record]");
      card.querySelector('[data-field="category"]').value = button.dataset.category;
      card.querySelectorAll("[data-category]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });

  root.querySelector("#save").addEventListener("click", () => {
    void save({ sync: false });
  });

  root.querySelector("#sync").addEventListener("click", () => {
    void save({ sync: true });
  });
}

async function load() {
  const state = await sendMessage({ type: "PAYMEMO_GET_STATE" });
  const all = state.records || [];
  records = ids.map((id) => all.find((item) => item.id === id)).filter(Boolean);
  render();
}

async function save({ sync = false } = {}) {
  const cards = [...document.querySelectorAll("[data-record]")];

  for (const card of cards) {
    const id = card.dataset.record;
    const source = records.find((item) => item.id === id);
    const patch = {
      category: card.querySelector('[data-field="category"]').value.trim() || "Other",
      counterparty: card.querySelector('[data-field="counterparty"]').value.trim(),
      note: card.querySelector('[data-field="note"]').value.trim(),
      project: card.querySelector('[data-field="project"]').value.trim(),
      status: source?.status === "failed" ? "failed" : "needs-review",
      provider: "Morph Chain Watch",
      method: "morph-chain-watch",
      reviewedAt: new Date().toISOString(),
    };

    await sendMessage({ type: "PAYMEMO_UPDATE_RECORD", id, patch });
    if (sync) await sendMessage({ type: "PAYMEMO_SYNC_RECORD", id });
  }

  window.close();
}

void load();
