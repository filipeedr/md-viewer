import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "md-viewer:theme";

// localStorage can throw (private-mode Safari, disabled storage); treat any
// failure or garbage value as "no stored choice" so the app silently falls
// back to following the system preference.
function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

/**
 * Theme state for the app. Initial value comes from the `data-theme`
 * attribute the inline boot script in index.html already stamped on <html>
 * before first paint (stored override if present, else system preference).
 *
 * The stored override is only written on an explicit toggle — never on
 * mount — so users who haven't chosen keep following live OS theme changes.
 */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );

  // Keep the attribute the CSS keys off of in sync with state.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Follow live OS theme changes, but only while no explicit choice exists.
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      if (readStoredTheme() === null) {
        setTheme(event.matches ? "dark" : "light");
      }
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const toggle = useCallback(() => {
    // Derived from state, not from the DOM attribute: state is the source of
    // truth here and the effect above pushes it to the attribute.
    const next: Theme = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore — the theme still applies for this session.
    }
    setTheme(next);
  }, [theme]);

  return [theme, toggle];
}
