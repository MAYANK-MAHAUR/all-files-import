import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Send, ScrollText, FileText, Layers, BarChart3, Settings, ShieldCheck, Bot } from "lucide-react";

const items: { to: string; label: string; icon: any; exact?: boolean }[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/send", label: "Send Payment", icon: Send },
  { to: "/app/ledger", label: "Ledger", icon: ScrollText },
  { to: "/app/invoices", label: "Invoices", icon: FileText },
  { to: "/app/batch", label: "Batch Payouts", icon: Layers },
  { to: "/app/agents", label: "AI Agents", icon: Bot },
  { to: "/app/reports", label: "Reports", icon: BarChart3 },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-ink/35 bg-white/70 backdrop-blur p-4 sticky top-0 h-screen">
      <Link to="/" className="flex items-center gap-2 px-2 py-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-aurora text-white font-bold">P</span>
        <span className="font-semibold tracking-tight">PayMemo</span>
      </Link>
      <nav className="mt-6 space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active = it.exact ? path === it.to : path.startsWith(it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${active ? "bg-ink text-cream shadow-soft" : "text-ink/70 hover:bg-ink/5 hover:text-ink"}`}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-2xl border border-mint/30 bg-mint/10 p-3 text-xs">
        <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-mint">
          <ShieldCheck className="h-3.5 w-3.5" /> Vault
        </div>
        <div className="mt-1 text-ink">Unlocked & syncing</div>
      </div>
    </aside>
  );
}
