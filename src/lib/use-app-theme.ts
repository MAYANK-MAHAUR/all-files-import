import { useContext } from "react";
import { AppThemeContext, type AppTheme } from "./app-theme-context";

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (!context) {
    return {
      theme: "light" as AppTheme,
      isDark: false,
      toggleTheme: () => {},
    };
  }
  return context;
}
