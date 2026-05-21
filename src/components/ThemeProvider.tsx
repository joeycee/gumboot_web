"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const THEME_STORAGE_KEY = "gumboot-web-theme";
const THEME_EVENT = "gumboot-theme-change";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function readThemeFromDocument(): Theme {
  if (typeof document === "undefined") {
    return "dark";
  }

  const current = document.documentElement.dataset.theme;
  return current === "light" || current === "dark" ? current : "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  window.dispatchEvent(new Event(THEME_EVENT));
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleThemeChange = () => onStoreChange();
  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener(THEME_EVENT, handleThemeChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(THEME_EVENT, handleThemeChange);
    window.removeEventListener("storage", handleStorage);
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore<Theme>(subscribe, readThemeFromDocument, () => "dark");

  const setTheme = (nextTheme: Theme) => {
    applyTheme(nextTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}

export const themeScript = `
  (function () {
    var key = "${THEME_STORAGE_KEY}";
    var saved = window.localStorage.getItem(key);
    var theme = saved === "light" || saved === "dark"
      ? saved
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  })();
`;
