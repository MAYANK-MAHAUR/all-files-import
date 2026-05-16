import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Plus,
  Copy,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wallet,
  Plug,
  ShieldCheck,
  ExternalLink,
  Search,
  PauseCircle,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { Topbar } from "@/components/app/Topbar";
import { StatusBadge } from "@/components/app/StatusBadge";
import { agents, agentSpends, agentMonthly, type Agent } from "@/lib/mock-data";

export const Route = createFileRoute("/app/agents")({
  head: () => ({
    meta: [
      { title: "AI Agents · PayMemo" },
      {
        name: "description",
        content:
          "Create, connect, and monitor AI agents that spend stablecoins. Every payment intent and confirmed tx explained.",
      },
    ],
  }),
  component: AgentsPage,
});

function AgentsPage() {
  const [selectedId, setSelectedId] = useState<string>(agents[0].id);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Confirmed" | "Pending" | "Failed" | "Awaiting Sign">("all");

  const selected = agents.find((a) => a.id === selectedId) ?? agents[0];

  const allSpends = agentSpends;
  const selectedSpends = useMemo(
    () =>
      allSpends.filter(
        (s) =>
          s.agentId === selected.id &&
          (statusFilter === "all" || s.status === statusFilter) &&
          (query === "" ||
            [s.reason, s.recipient, s.tool, s.taskId, s.note]
              .join(" ")
              .toLowerCase()
              .includes(query.toLowerCase()))
      ),
    [selected.id, statusFilter, query, allSpends]
  );

  const totals = useMemo(() => {
    const all = allSpends;
    return {
      activeAgents: agents.filter((a) => a.status === "Active").length,
      pending: all.filter((s) => s.status === "Pending" || s.status === "Awaiting Sign").length,
      confirmed: all.filter((s) => s.status === "Confirmed").length,
      failed: all.filter((s) => s.status === "Failed").length,
      monthSpend: agents.reduce((acc, a) => acc + a.monthlySpend, 0),
    };
  }, [allSpends]);

  return (
    <>
      <Topbar
        title="AI Agents"
        subtitle="Agent finance control room · every spend has a reason, a task, a receipt."
      />

      <div className="px-6 lg:px-10 py-8 space-y-8">
        {/* KPIs */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Kpi
            icon={<Bot className="h-4 w-4" />}
            label="Active agents"
            value={`${totals.activeAgents} / ${agents.length}`}
            accent="ink"
          />
          <Kpi
            icon={<Clock className="h-4 w-4" />}
            label="Pending intents"
            value={totals.pending}
            accent="papaya"
          />
          <Kpi
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Confirmed · 30d"
            value={totals.confirmed}
            accent="mint"
          />
          <Kpi
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Failed · 30d"
            value={totals.failed}
            accent="pink"
          />
          <Kpi
            icon={<Wallet className="h-4 w-4" />}
            label="Agent spend · month"
            value={`$${totals.monthSpend.toLocaleString()}`}
            accent="ink"
          />
        </section>

        {/* Layout: agent list + detail */}
        <section className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
          {/* Agent list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-ink/55">
                Agents
              </h2>
              <button className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-3 py-1.5 text-xs font-semibold hover:bg-ink/90 transition-colors">
                <Plus className="h-3.5 w-3.5" /> New agent
              </button>
            </div>

            <div className="space-y-2">
              {agents.map((a) => (
                <AgentCard
                  key={a.id}
                  agent={a}
                  active={a.id === selected.id}
                  onSelect={() => setSelectedId(a.id)}
                />
              ))}
            </div>

            <ConnectionCard />
          </div>

          {/* Detail */}
          <div className="space-y-6 min-w-0">
            <AgentDetailHeader agent={selected} />
            <AgentInsights agent={selected} />

            {/* Spending history */}
            <div className="rounded-3xl border border-ink/15 bg-white/85 backdrop-blur-sm shadow-soft overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-ink/10">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-ink/55" />
                  <h3 className="text-sm font-bold uppercase tracking-widest">
                    Spending history
                  </h3>
                </div>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 rounded-full border border-ink/20 bg-white px-3 py-1.5 w-56">
                    <Search className="h-3.5 w-3.5 text-ink/40" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="flex-1 bg-transparent text-xs outline-none"
                      placeholder="Search reason, tool, task…"
                    />
                  </div>
                  <FilterPills value={statusFilter} onChange={setStatusFilter} />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-ink/[0.03] text-ink/55">
                    <tr className="text-left">
                      <Th>Task</Th>
                      <Th>Tool / API</Th>
                      <Th>Reason</Th>
                      <Th>Recipient</Th>
                      <Th className="text-right">Amount</Th>
                      <Th>Status</Th>
                      <Th>Tx hash</Th>
                      <Th>Category</Th>
                      <Th>When</Th>
                      <Th>Private note</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSpends.map((s) => (
                      <tr key={s.id} className="border-t border-ink/10 hover:bg-ink/[0.02]">
                        <Td>
                          <span className="font-mono text-[11px] text-ink/70">{s.taskId}</span>
                        </Td>
                        <Td>{s.tool}</Td>
                        <Td className="max-w-[260px]">
                          <div className="font-medium text-ink truncate">{s.reason}</div>
                          <div className="text-ink/45 text-[10px]">{selected.name}</div>
                        </Td>
                        <Td className="font-mono text-[11px] text-ink/75">{s.recipient}</Td>
                        <Td className="text-right">
                          <div className="font-semibold tabular-nums">
                            ${s.amount.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-ink/45">{s.token}</div>
                        </Td>
                        <Td>
                          <StatusBadge status={s.status} />
                        </Td>
                        <Td>
                          {s.txHash === "—" ? (
                            <span className="text-ink/35">—</span>
                          ) : (
                            <a
                              href="#"
                              className="inline-flex items-center gap-1 font-mono text-[11px] text-ink/70 hover:text-ink"
                            >
                              {s.txHash}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </Td>
                        <Td>
                          <span className="rounded-full bg-ink/5 border border-ink/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-ink/65">
                            {s.category}
                          </span>
                        </Td>
                        <Td className="whitespace-nowrap text-ink/60">{s.timestamp}</Td>
                        <Td className="max-w-[220px]">
                          <span className="text-ink/60 italic">{s.note}</span>
                        </Td>
                      </tr>
                    ))}
                    {selectedSpends.length === 0 && (
                      <tr>
                        <td colSpan={10} className="p-10 text-center text-ink/45">
                          No spending matches your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <MonthlyAgentSpend />
          </div>
        </section>
      </div>
    </>
  );
}

/* ============================ Subcomponents ============================ */

function Kpi({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: "ink" | "mint" | "papaya" | "pink";
}) {
  const accentMap = {
    ink: "text-ink",
    mint: "text-mint",
    papaya: "text-papaya",
    pink: "text-pink",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-ink/15 bg-white/85 backdrop-blur-sm p-4 shadow-soft"
    >
      <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${accentMap[accent]}`}>
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
    </motion.div>
  );
}

function AgentCard({
  agent,
  active,
  onSelect,
}: {
  agent: Agent;
  active: boolean;
  onSelect: () => void;
}) {
  const pct = Math.min(100, Math.round((agent.monthlySpend / agent.monthlyLimit) * 100));
  const statusDot =
    agent.status === "Active"
      ? "bg-mint"
      : agent.status === "Paused"
      ? "bg-ink/40"
      : "bg-papaya animate-pulse-glow";
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-2xl border p-4 transition-all ${
        active
          ? "border-ink bg-white shadow-soft ring-1 ring-ink/10"
          : "border-ink/15 bg-white/70 hover:border-ink/40 hover:bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-aurora text-white">
          <Bot className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate">{agent.name}</span>
            <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
            <span className="text-[10px] uppercase tracking-widest text-ink/45">
              {agent.status}
            </span>
          </div>
          <div className="text-[11px] text-ink/55 truncate">{agent.persona}</div>
          <div className="mt-1 font-mono text-[10px] text-ink/45 truncate">
            {agent.agentId}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-ink/50">
          <span>Month spend</span>
          <span className="tabular-nums text-ink/75">
            ${agent.monthlySpend.toLocaleString()} / ${agent.monthlyLimit.toLocaleString()}
          </span>
        </div>
        <div className="mt-1 h-1.5 rounded-full bg-ink/10 overflow-hidden">
          <div
            className={`h-full rounded-full ${
              pct > 80 ? "bg-pink" : pct > 50 ? "bg-papaya" : "bg-mint"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </button>
  );
}

function AgentDetailHeader({ agent }: { agent: Agent }) {
  return (
    <div className="rounded-3xl border border-ink/15 bg-white/85 backdrop-blur-sm shadow-soft p-6">
      <div className="flex flex-wrap items-start gap-5">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-aurora text-white shadow-soft">
          <Bot className="h-7 w-7" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-semibold tracking-tight">{agent.name}</h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-ink/20 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-ink/70">
              <Plug className="h-3 w-3" /> {agent.connection}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${
                agent.status === "Active"
                  ? "bg-mint/15 text-mint border-mint/30"
                  : agent.status === "Paused"
                  ? "bg-ink/10 text-ink/70 border-ink/30"
                  : "bg-papaya/15 text-papaya border-papaya/40"
              }`}
            >
              {agent.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink/60">{agent.persona}</p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Agent ID" value={agent.agentId} mono copyable />
            <Field label="Wallet" value={agent.wallet} mono copyable />
            <Field label="Last activity" value={agent.lastActivity} />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-white px-3 py-1.5 text-xs hover:bg-ink/5">
            {agent.status === "Active" ? (
              <>
                <PauseCircle className="h-3.5 w-3.5" /> Pause
              </>
            ) : (
              <>
                <PlayCircle className="h-3.5 w-3.5" /> Resume
              </>
            )}
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-3 py-1.5 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> Approve intent
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  copyable,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  return (
    <div className="rounded-xl border border-ink/10 bg-ink/[0.02] px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-ink/45">{label}</div>
      <div className={`mt-0.5 flex items-center justify-between gap-2 ${mono ? "font-mono text-[12px]" : "text-sm"}`}>
        <span className="truncate text-ink">{value}</span>
        {copyable && (
          <button
            onClick={() => navigator.clipboard?.writeText(value)}
            className="text-ink/40 hover:text-ink"
            aria-label="Copy"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function AgentInsights({ agent }: { agent: Agent }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MiniStat label="Pending intents" value={agent.pendingIntents} accent="papaya" icon={<Clock className="h-4 w-4" />} />
      <MiniStat label="Confirmed · 30d" value={agent.confirmed30d} accent="mint" icon={<CheckCircle2 className="h-4 w-4" />} />
      <MiniStat label="Failed · 30d" value={agent.failed30d} accent="pink" icon={<AlertTriangle className="h-4 w-4" />} />
      <MiniStat
        label="Budget used"
        value={`${Math.round((agent.monthlySpend / agent.monthlyLimit) * 100)}%`}
        accent="ink"
        icon={<ShieldCheck className="h-4 w-4" />}
      />
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  accent: "ink" | "mint" | "papaya" | "pink";
  icon: React.ReactNode;
}) {
  const accentMap = {
    ink: "text-ink",
    mint: "text-mint",
    papaya: "text-papaya",
    pink: "text-pink",
  };
  return (
    <div className="rounded-2xl border border-ink/15 bg-white/85 backdrop-blur-sm p-4 shadow-soft">
      <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${accentMap[accent]}`}>
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function FilterPills({
  value,
  onChange,
}: {
  value: "all" | "Confirmed" | "Pending" | "Failed" | "Awaiting Sign";
  onChange: (v: "all" | "Confirmed" | "Pending" | "Failed" | "Awaiting Sign") => void;
}) {
  const opts: { v: typeof value; label: string }[] = [
    { v: "all", label: "All" },
    { v: "Confirmed", label: "Confirmed" },
    { v: "Pending", label: "Pending" },
    { v: "Awaiting Sign", label: "Awaiting" },
    { v: "Failed", label: "Failed" },
  ];
  return (
    <div className="inline-flex rounded-full border border-ink/15 bg-white p-0.5">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full transition-colors ${
            value === o.v ? "bg-ink text-cream" : "text-ink/55 hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ConnectionCard() {
  return (
    <div className="rounded-2xl border border-ink/15 bg-gradient-to-br from-white to-mint/10 p-4 shadow-soft">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-mint">
        <Plug className="h-3.5 w-3.5" /> Connect an agent
      </div>
      <p className="mt-1 text-xs text-ink/65">
        Agents call PayMemo before they spend. Each intent carries reason, task,
        amount, recipient and category.
      </p>
      <div className="mt-3 space-y-2">
        <div className="rounded-xl border border-ink/15 bg-white p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Agent API</span>
            <span className="text-[10px] text-mint font-bold uppercase tracking-widest">Live</span>
          </div>
          <code className="mt-1 block font-mono text-[10px] text-ink/55 truncate">
            POST /v1/intents · Bearer agt_…
          </code>
        </div>
        <div className="rounded-xl border border-ink/15 bg-white p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">MCP Server</span>
            <span className="text-[10px] text-papaya font-bold uppercase tracking-widest">
              Preview
            </span>
          </div>
          <code className="mt-1 block font-mono text-[10px] text-ink/55 truncate">
            mcp://paymemo · tools: pay, intent, lookup
          </code>
        </div>
      </div>
    </div>
  );
}

function MonthlyAgentSpend() {
  const max = Math.max(...agentMonthly.map((m) => m.spend));
  return (
    <div className="rounded-3xl border border-ink/15 bg-white/85 backdrop-blur-sm shadow-soft p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest">
          Monthly agent expense
        </h3>
        <span className="text-[10px] text-ink/45 uppercase tracking-widest">All agents</span>
      </div>
      <div className="mt-5 flex items-end gap-3 h-40">
        {agentMonthly.map((m) => {
          const h = Math.max(8, Math.round((m.spend / max) * 100));
          return (
            <div key={m.m} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-ink to-aurora"
                style={{ height: `${h}%` }}
              />
              <div className="text-[10px] uppercase tracking-widest text-ink/55">{m.m}</div>
              <div className="text-[10px] tabular-nums text-ink/45">
                ${m.spend.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================ Table cells ============================ */

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-2.5 font-bold uppercase tracking-widest text-[10px] ${className}`}>
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}
