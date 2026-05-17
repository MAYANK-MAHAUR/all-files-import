import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app/Sidebar";
import { Noise } from "@/components/fx/Noise";
import { AppThemeProvider } from "@/lib/app-theme-provider";
import { useAppTheme } from "@/lib/use-app-theme";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "PayMemo App" },
      { name: "description", content: "Private, verified stablecoin payment records." },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppThemeProvider>
      <AppShell />
    </AppThemeProvider>
  );
}

function AppShell() {
  const { isDark } = useAppTheme();

  return (
    <div className={`relative min-h-screen flex bg-background ${isDark ? "dark" : ""}`}>
      <Noise opacity={0.04} />
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.25]" />
      <AppSidebar />
      <div className="flex-1 min-w-0 relative">
        <Outlet />
      </div>
    </div>
  );
}
