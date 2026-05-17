import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/app/Topbar";
import { monthly } from "@/lib/mock-data";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { Download, Calendar, Filter } from "lucide-react";

export const Route = createFileRoute("/app/reports")({
  head: () => ({ meta: [{ title: "Reports · PayMemo" }] }),
  component: Reports,
});

const breakdown = [
  { label: "Payroll", value: 38400, color: "#FF477E" },
  { label: "Vendor", value: 24200, color: "#FFB627" },
  { label: "Bridge/Swap", value: 18600, color: "#06D6A0" },
  { label: "Expenses", value: 9800, color: "#0B0B0F" },
];

function Reports() {
  return (
    <>
      <Topbar title="Reports" subtitle="Categorized exports for accounting." />
      <div className="p-6 lg:p-10 space-y-5">
        <div className="rounded-2xl border border-ink/35 bg-white p-4 shadow-soft flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-xl border border-ink/35 bg-cream/60 px-3 py-2 text-sm">
            <Calendar className="h-3.5 w-3.5" /> Q4 2026
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl border border-ink/35 bg-cream/60 px-3 py-2 text-sm">
            <Filter className="h-3.5 w-3.5" /> All categories
          </button>
          <button className="ml-auto inline-flex items-center gap-2 rounded-xl bg-ink text-cream px-3 py-2 text-sm font-semibold">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="rounded-3xl border border-ink/35 bg-white p-6 shadow-soft lg:col-span-2">
            <div className="text-sm font-semibold">Monthly volume</div>
            <div className="text-xs text-ink/50">Sent across all stablecoins</div>
            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <XAxis
                    dataKey="m"
                    stroke="#0B0B0F66"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                  />
                  <YAxis stroke="#0B0B0F66" tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.1)" }}
                  />
                  <Bar dataKey="sent" radius={[8, 8, 0, 0]} fill="#FF477E" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-ink/35 bg-white p-6 shadow-soft">
            <div className="text-sm font-semibold">Category breakdown</div>
            <div className="text-xs text-ink/50">Quarter to date</div>
            <ul className="mt-5 space-y-3">
              {breakdown.map((b) => {
                const total = breakdown.reduce((s, x) => s + x.value, 0);
                const pct = Math.round((b.value / total) * 100);
                return (
                  <li key={b.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: b.color }} />
                        {b.label}
                      </span>
                      <span className="font-mono">${b.value.toLocaleString()}</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-ink/5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: b.color }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="rounded-3xl border border-ink/35 bg-aurora-animated p-6 text-ink relative overflow-hidden">
          <div className="absolute inset-0 grain opacity-25" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold uppercase tracking-widest">Tax-ready export</div>
              <p className="text-sm mt-1 max-w-md">
                Categorized, decrypted ledger with USD conversions at time of confirmation.
              </p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-semibold">
              <Download className="h-4 w-4" /> Download FY26
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
