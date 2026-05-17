import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/app/Topbar";
import { StatusBadge } from "@/components/app/StatusBadge";
import { invoices } from "@/lib/mock-data";
import { Plus, Link2, Copy } from "lucide-react";

export const Route = createFileRoute("/app/invoices")({
  head: () => ({ meta: [{ title: "Invoices · PayMemo" }] }),
  component: Invoices,
});

function Invoices() {
  return (
    <>
      <Topbar title="Invoices" subtitle="Issue and reconcile stablecoin invoices." />
      <div className="p-6 lg:p-10 grid lg:grid-cols-[1fr_380px] gap-6">
        <div className="rounded-3xl border border-ink/35 bg-white shadow-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-ink/35 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">All invoices</div>
              <div className="text-xs text-ink/50">{invoices.length} total</div>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-ink text-cream px-3 py-2 text-sm font-semibold">
              <Plus className="h-4 w-4" /> New Invoice
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-ink/50 bg-cream/60">
                {["Number", "Client", "Amount", "Due", "Status", ""].map((h) => (
                  <th key={h} className="text-left font-medium px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id} className="border-t border-ink/30 hover:bg-cream/40">
                  <td className="px-5 py-3.5 font-mono">{i.number}</td>
                  <td className="px-5 py-3.5">{i.client}</td>
                  <td className="px-5 py-3.5 font-mono">
                    {i.amount.toLocaleString()} <span className="text-ink/50">{i.token}</span>
                  </td>
                  <td className="px-5 py-3.5 text-ink/60">{i.due}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={i.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="text-ink/60 hover:text-pink">
                      <Link2 className="h-4 w-4" />
                    </button>
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
              Create invoice
            </div>
            <div className="mt-3 space-y-3 text-sm">
              <Field label="Client name" v="Northwind DAO" />
              <Field label="Amount" v="8,400 USDC" mono />
              <Field label="Due date" v="Oct 22, 2026" />
              <Field label="Memo" v="Q4 audit retainer" />
            </div>
            <button className="mt-5 w-full rounded-2xl bg-ink text-cream py-3 text-sm font-semibold">
              Generate payment link
            </button>
          </div>

          <div className="rounded-3xl border border-ink/35 bg-cream/60 p-5 shadow-soft">
            <div className="text-[10px] font-bold uppercase tracking-widest text-mint">
              Payment link preview
            </div>
            <div className="mt-3 rounded-xl bg-white border border-ink/35 p-3 font-mono text-xs break-all flex items-center gap-2">
              <span className="flex-1">paymemo.app/pay/inv-205-northwind</span>
              <button className="text-ink/60 hover:text-ink">
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-3 text-xs text-ink/60">
              Anyone with this link can pay. Memo and category are pre-filled in their PayMemo
              intent.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, v, mono }: { label: string; v: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-ink/35 bg-cream/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-ink/55">{label}</div>
      <div className={`mt-0.5 ${mono ? "font-mono" : ""}`}>{v}</div>
    </div>
  );
}
