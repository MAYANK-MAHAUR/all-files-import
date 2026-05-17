import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/app/Topbar";
import { StatusBadge } from "@/components/app/StatusBadge";
import { payoutBatch } from "@/lib/mock-data";
import { Plus, Lock } from "lucide-react";

export const Route = createFileRoute("/app/batch")({
  head: () => ({ meta: [{ title: "Batch Payouts · PayMemo" }] }),
  component: Batch,
});

function Batch() {
  return (
    <>
      <Topbar title="Batch Payouts" subtitle="One signature, many recipients - fully reconciled." />
      <div className="p-6 lg:p-10 grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="rounded-3xl border border-ink/35 bg-white shadow-soft overflow-hidden">
          <div className="px-6 py-5 border-b border-ink/35 flex items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-ink/55">
                Batch name
              </div>
              <div className="mt-1 text-xl font-semibold tracking-tight">{payoutBatch.name}</div>
              <div className="mt-1 text-xs text-ink/55">
                {payoutBatch.rows.length} recipients · USDC
              </div>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-ink text-cream px-3 py-2 text-sm font-semibold">
              <Plus className="h-4 w-4" /> Add recipient
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-ink/50 bg-cream/60">
                {["Name", "Address", "Amount", "Status"].map((h) => (
                  <th key={h} className="text-left font-medium px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payoutBatch.rows.map((r) => (
                <tr key={r.id} className="border-t border-ink/30 hover:bg-cream/40">
                  <td className="px-5 py-3.5 font-medium">{r.name}</td>
                  <td className="px-5 py-3.5 font-mono text-xs">{r.address}</td>
                  <td className="px-5 py-3.5 font-mono">{r.amount.toLocaleString()} USDC</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-pink/30 bg-white p-6 shadow-glow-pink relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-aurora" />
            <div className="text-[10px] font-bold uppercase tracking-widest text-pink">
              Batch summary
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <Row k="Total recipients" v={String(payoutBatch.rows.length)} />
              <Row k="Total amount" v={`${payoutBatch.total.toLocaleString()} USDC`} mono />
              <Row k="Estimated gas" v="$2.40" />
              <Row k="Vault tag" v="Q4 · Engineering" />
            </div>
            <button className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-ink text-cream py-3 text-sm font-semibold">
              <Lock className="h-4 w-4" /> Sign & dispatch batch
            </button>
          </div>
          <div className="rounded-3xl border border-ink/35 bg-cream/60 p-5 text-xs text-ink/60">
            Each recipient gets a separate ledger entry, pre-tagged as{" "}
            <span className="font-semibold text-ink">Payroll</span>.
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-ink/30 pb-2">
      <span className="text-ink/55">{k}</span>
      <span className={mono ? "font-mono" : ""}>{v}</span>
    </div>
  );
}
