import { createContext } from "react";

export type AppTheme = "light" | "dark";

export type AppThemeContextValue = {
  theme: AppTheme;
  isDark: boolean;
  toggleTheme: () => void;
};

export const AppThemeContext = createContext<AppThemeContextValue | null>(null);
