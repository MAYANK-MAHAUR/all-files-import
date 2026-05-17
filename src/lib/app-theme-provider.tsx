import { useEffect, useMemo, useState } from "react";
import { AppThemeContext, type AppTheme, type AppThemeContextValue } from "./app-theme-context";

const THEME_KEY = "paymemo-app-theme";

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>("light");

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") setTheme(saved);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const value = useMemo<AppThemeContextValue>(
    () => ({
      theme,
      isDark: theme === "dark",
      toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
    }),
    [theme],
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}
