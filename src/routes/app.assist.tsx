import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/app/Topbar";
import { StatusBadge } from "@/components/app/StatusBadge";
import { assistIntents } from "@/lib/mock-data";
import type { LucideIcon } from "lucide-react";
import { BellRing, CheckCircle2, Eye, Lock, PlugZap, ShieldCheck, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/app/assist")({
  head: () => ({ meta: [{ title: "Wallet Assist | PayMemo" }] }),
  component: WalletAssist,
});

const connectors = [
  { name: "MetaMask", state: "Ready", detail: "window.ethereum and EIP-6963 capture" },
  { name: "Rabby", state: "Ready", detail: "EIP-6963 and injected provider capture" },
  { name: "Bitget", state: "Ready", detail: "window.bitkeep.ethereum capture" },
  { name: "Trust", state: "Ready", detail: "Trust Wallet injected EVM capture" },
  { name: "Phantom", state: "EVM ready", detail: "window.phantom.ethereum capture" },
  { name: "OKX", state: "Ready", detail: "OKX injected provider capture" },
  { name: "Coinbase", state: "Ready", detail: "Coinbase injected provider capture" },
  { name: "Binance", state: "Ready", detail: "Binance EVM provider capture" },
];

const pipelineSteps: { title: string; text: string; icon: LucideIcon }[] = [
  { title: "Detect", text: "Wallet or dApp sign request", icon: PlugZap },
  { title: "Ask", text: "Purpose, counterparty, tag", icon: BellRing },
  { title: "Confirm", text: "User approves meaning", icon: CheckCircle2 },
  { title: "Vault", text: "Record after onchain proof", icon: Lock },
];

type SyncedExtensionRecord = {
  id?: string;
  source?: string;
  provider?: string;
  txHash?: string;
  to: string;
  amount: string;
  token: string;
  category: string;
  counterparty?: string;
  note?: string;
  status: string;
  createdAt?: string;
};

function WalletAssist() {
  const [syncedRecords, setSyncedRecords] = useState<SyncedExtensionRecord[]>([]);

  useEffect(() => {
    let alive = true;

    async function loadSyncedRecords() {
      const response = await fetch("/api/extension-intent").catch(() => null);
      if (!response?.ok) return;
      const payload = (await response.json()) as { records?: SyncedExtensionRecord[] };
      if (alive) setSyncedRecords(payload.records ?? []);
    }

    void loadSyncedRecords();
    const timer = window.setInterval(loadSyncedRecords, 5000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <>
      <Topbar
        title="Wallet Assist"
        subtitle="Capture private context for payments that start outside PayMemo."
      />
      <div className="p-6 lg:p-10 space-y-6 pb-28 lg:pb-10">
        <div className="grid xl:grid-cols-[1fr_380px] gap-6">
          <section className="rounded-3xl border border-ink/35 bg-white p-6 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-pink">
                  Assist pipeline
                </div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  From wallet popup to private record
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
                  PayMemo watches supported wallet and dApp flows, asks for the missing meaning
                  before signature, then attaches that encrypted context after the transaction
                  confirms onchain.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint/10 px-3 py-1.5 text-xs font-semibold text-ink">
                <ShieldCheck className="h-3.5 w-3.5 text-mint" /> Local capture active
              </span>
            </div>

            <div className="mt-8 grid md:grid-cols-4 gap-3">
              {pipelineSteps.map((step, index) => (
                <div key={step.title} className="rounded-2xl border border-ink/30 bg-cream/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40">
                      0{index + 1}
                    </span>
                    <step.icon className="h-4 w-4 text-pink" />
                  </div>
                  <div className="mt-4 text-sm font-semibold">{step.title}</div>
                  <div className="mt-1 text-xs leading-5 text-ink/55">{step.text}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-pink/30 bg-white p-6 shadow-glow-pink">
            <div className="text-[10px] font-bold uppercase tracking-widest text-pink">
              Extension prompt
            </div>
            <div className="mt-4 rounded-2xl bg-ink p-5 text-cream">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs font-semibold">
                  <WalletCards className="h-4 w-4 text-pink" /> MetaMask
                </span>
                <span className="rounded-full bg-pink px-2 py-0.5 text-[10px] font-bold text-ink">
                  before sign
                </span>
              </div>
              <div className="mt-5 text-lg font-semibold">What is this transaction for?</div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {["Vendor", "Invoice", "Bridge", "Personal"].map((item, index) => (
                  <button
                    key={item}
                    className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold ${
                      index === 0
                        ? "border-pink bg-pink text-ink"
                        : "border-cream/20 bg-cream/10 text-cream/75"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-cream/10 p-3 text-xs text-cream/70">
                Project: Mercury-Revamp
                <br />
                Counterparty: Aether Studio
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-ink/35 bg-white shadow-soft overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/35 px-6 py-4">
            <div>
              <div className="text-sm font-semibold">Pending assisted intents</div>
              <div className="text-xs text-ink/50">
                Context captured before the wallet signs or confirms
              </div>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-2 text-sm font-semibold text-cream">
              <Eye className="h-4 w-4" /> Review queue
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="bg-cream/60 text-[10px] uppercase tracking-widest text-ink/50">
                  {["Source", "Action", "Chain", "Amount", "Category", "Confidence", "Status"].map(
                    (h) => (
                      <th key={h} className="px-5 py-3 text-left font-medium">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {assistIntents.map((intent) => (
                  <tr key={intent.id} className="border-t border-ink/30 hover:bg-cream/40">
                    <td className="px-5 py-3.5 font-medium">{intent.source}</td>
                    <td className="px-5 py-3.5">
                      <div>{intent.action}</div>
                      <div className="text-xs text-ink/50">{intent.to}</div>
                    </td>
                    <td className="px-5 py-3.5 text-ink/60">{intent.chain}</td>
                    <td className="px-5 py-3.5 font-mono">{intent.amount}</td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-full border border-ink/35 bg-cream px-2 py-0.5 text-[10px] font-medium">
                        {intent.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-ink/60">{intent.confidence}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={intent.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-mint/30 bg-white shadow-soft overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/35 px-6 py-4">
            <div>
              <div className="text-sm font-semibold">Synced extension captures</div>
              <div className="text-xs text-ink/50">
                Records pushed from the browser extension into this dApp session
              </div>
            </div>
            <span className="rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-ink">
              {syncedRecords.length} synced
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="bg-cream/60 text-[10px] uppercase tracking-widest text-ink/50">
                  {[
                    "Origin",
                    "Wallet",
                    "Amount",
                    "Category",
                    "Counterparty",
                    "Private note",
                    "Tx hash",
                    "Status",
                  ].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {syncedRecords.map((record) => (
                  <tr key={record.id} className="border-t border-ink/30 hover:bg-cream/40">
                    <td className="max-w-[180px] truncate px-5 py-3.5 text-ink/60">
                      {record.source ?? "browser-extension"}
                    </td>
                    <td className="max-w-[180px] truncate px-5 py-3.5 text-ink/60">
                      {record.provider ?? "injected EVM"}
                    </td>
                    <td className="px-5 py-3.5 font-mono">
                      {record.amount} <span className="text-ink/50">{record.token}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-full border border-ink/35 bg-cream px-2 py-0.5 text-[10px] font-medium">
                        {record.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">{record.counterparty ?? record.to}</td>
                    <td className="max-w-[260px] truncate px-5 py-3.5 text-ink/70">
                      {record.note ?? "No private note synced."}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs">{record.txHash ?? "pending"}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={record.status} />
                    </td>
                  </tr>
                ))}
                {syncedRecords.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-ink/50">
                      Use the extension popup's Sync button after capturing a transaction.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid md:grid-cols-4 gap-4">
          {connectors.map((connector) => (
            <div
              key={connector.name}
              className="rounded-2xl border border-ink/35 bg-white p-4 shadow-soft"
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold">{connector.name}</div>
                <span className="h-2 w-2 rounded-full bg-mint" />
              </div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-ink/40">
                {connector.state}
              </div>
              <p className="mt-3 text-xs leading-5 text-ink/60">{connector.detail}</p>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
