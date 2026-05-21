"use client";

import { useTheme } from "@/components/ThemeProvider";

type ThemeToggleProps = {
  compact?: boolean;
};

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, setTheme, toggleTheme } = useTheme();

  if (compact) {
    return (
      <button
        type="button"
        className="gb-theme-toggle gb-theme-toggle-compact"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        <span className="gb-theme-toggle-icon" aria-hidden="true">
          {theme === "dark" ? "☾" : "☀"}
        </span>
        <span className="gb-theme-toggle-text">{theme === "dark" ? "Dark" : "Light"}</span>
      </button>
    );
  }

  return (
    <div className="gb-theme-switcher" role="group" aria-label="Theme selection">
      <button
        type="button"
        className={`gb-theme-pill${theme === "light" ? " is-active" : ""}`}
        onClick={() => setTheme("light")}
        aria-pressed={theme === "light"}
      >
        <span aria-hidden="true">☀</span>
        Light
      </button>
      <button
        type="button"
        className={`gb-theme-pill${theme === "dark" ? " is-active" : ""}`}
        onClick={() => setTheme("dark")}
        aria-pressed={theme === "dark"}
      >
        <span aria-hidden="true">☾</span>
        Dark
      </button>
    </div>
  );
}
