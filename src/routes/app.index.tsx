import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/app/Topbar";
import { StatusBadge } from "@/components/app/StatusBadge";
import { transactions, kpis, monthly } from "@/lib/mock-data";
import type { LucideIcon } from "lucide-react";
import { ArrowDownLeft, ArrowUpRight, Activity, Layers, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard · PayMemo" }] }),
  component: Dashboard,
});

const stat = (l: string, v: string, sub: string, Icon: LucideIcon, ring: string) => ({
  l,
  v,
  sub,
  Icon,
  ring,
});
const cards = [
  stat(
    "Total Sent (30d)",
    `$${kpis.totalSent.toLocaleString()}`,
    "+12% vs prev",
    ArrowUpRight,
    "from-pink/20",
  ),
  stat(
    "Total Received",
    `$${kpis.totalReceived.toLocaleString()}`,
    "+34% vs prev",
    ArrowDownLeft,
    "from-mint/20",
  ),
  stat("Confirmed Records", String(kpis.confirmedRecords), "lifetime", Layers, "from-ink/15"),
  stat(
    "Pending Intents",
    String(kpis.pendingIntents),
    "awaiting signature",
    Activity,
    "from-papaya/30",
  ),
  stat("Needs Review", String(kpis.needsReview), "unlabeled", AlertCircle, "from-pink/20"),
];

function Dashboard() {
  return (
    <>
      <Topbar title="Good morning, Paymaster" subtitle="3 unlabeled transactions need review." />
      <div className="p-6 lg:p-10 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {cards.map((c, i) => (
            <motion.div
              key={c.l}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative overflow-hidden rounded-2xl border border-ink/35 bg-white p-5 shadow-soft`}
            >
              <div
                className={`absolute -inset-px bg-gradient-to-br ${c.ring} to-transparent pointer-events-none rounded-2xl`}
              />
              <div className="relative">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-ink/55">
                  {c.l}
                  <c.Icon className="h-4 w-4 text-ink/60" />
                </div>
                <div className="mt-3 text-3xl font-semibold tracking-tight">{c.v}</div>
                <div className="mt-1 text-xs text-ink/50">{c.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="rounded-3xl border border-ink/35 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Monthly volume</div>
              <div className="text-xs text-ink/50">Sent vs received · stablecoins</div>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-pink" />
                Sent
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-mint" />
                Received
              </span>
            </div>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPink" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF477E" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#FF477E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gMint" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06D6A0" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#06D6A0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="m"
                  stroke="#0B0B0F66"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <YAxis stroke="#0B0B0F66" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.1)" }} />
                <Area
                  type="monotone"
                  dataKey="sent"
                  stroke="#FF477E"
                  strokeWidth={2}
                  fill="url(#gPink)"
                />
                <Area
                  type="monotone"
                  dataKey="received"
                  stroke="#06D6A0"
                  strokeWidth={2}
                  fill="url(#gMint)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-ink/35 bg-white shadow-soft overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b border-ink/35">
            <div>
              <div className="text-sm font-semibold">Recent activity</div>
              <div className="text-xs text-ink/50">Latest entries from your private ledger</div>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-ink/50">
                <th className="text-left font-medium px-6 py-3">Date</th>
                <th className="text-left font-medium px-6 py-3">Type</th>
                <th className="text-left font-medium px-6 py-3">Counterparty / Note</th>
                <th className="text-left font-medium px-6 py-3">Category</th>
                <th className="text-left font-medium px-6 py-3">Amount</th>
                <th className="text-left font-medium px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-t border-ink/30 hover:bg-cream/50">
                  <td className="px-6 py-3.5 text-ink/60">{t.date}</td>
                  <td className="px-6 py-3.5">
                    {t.type === "Sent" ? (
                      <span className="inline-flex items-center gap-1 text-pink">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        Sent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-mint">
                        <ArrowDownLeft className="h-3.5 w-3.5" />
                        Received
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="font-medium">{t.counterparty}</div>
                    <div className="text-xs text-ink/50">{t.note}</div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="rounded-full border border-ink/35 bg-cream px-2 py-0.5 text-[10px] font-medium">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-mono">
                    {t.amount.toLocaleString()} {t.token}
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
