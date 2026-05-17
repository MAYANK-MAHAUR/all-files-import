import { Search, Bell, ChevronDown, Moon, Sun } from "lucide-react";
import { useAppTheme } from "@/lib/use-app-theme";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { isDark, toggleTheme } = useAppTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-ink/35 bg-cream/80 backdrop-blur-xl">
      <div className="px-6 lg:px-10 py-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-sm text-ink/55 truncate">{subtitle}</p>}
        </div>

        <div className="hidden md:flex items-center gap-2 rounded-full border border-ink/35 bg-white px-3 py-1.5 w-72">
          <Search className="h-4 w-4 text-ink/50" />
          <input
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder="Search ledger, invoices..."
          />
          <kbd className="text-[10px] font-mono text-ink/40 bg-ink/5 rounded px-1.5 py-0.5">
            Ctrl K
          </kbd>
        </div>

        <button className="hidden sm:inline-flex items-center gap-2 rounded-full border border-ink/35 bg-white px-3 py-1.5 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-mint" /> Morph - Testnet{" "}
          <ChevronDown className="h-3 w-3" />
        </button>

        <button
          onClick={toggleTheme}
          className="grid h-9 w-9 place-items-center rounded-full border border-ink/35 bg-white text-ink/60 hover:text-ink"
          title={isDark ? "Use bright dashboard" : "Use night dashboard"}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button className="grid h-9 w-9 place-items-center rounded-full border border-ink/35 bg-white text-ink/60 hover:text-ink">
          <Bell className="h-4 w-4" />
        </button>

        <button className="inline-flex items-center gap-2 rounded-full bg-ink text-cream pl-2 pr-3 py-1.5 text-xs font-semibold">
          <span className="h-6 w-6 rounded-full bg-aurora" />
          0xVault...3e2
        </button>
      </div>
    </header>
  );
}
