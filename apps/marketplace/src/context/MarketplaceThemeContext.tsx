// apps/marketplace/src/context/MarketplaceThemeContext.tsx
// Theme context for marketplace dark/light mode toggle
// Only affects public marketplace pages, not breeder portal pages

import * as React from "react";

type Theme = "light" | "dark";

interface MarketplaceThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  /** True when light mode is active (for passing to components) */
  isLightMode: boolean;
}

const MarketplaceThemeContext = React.createContext<MarketplaceThemeContextValue | null>(null);

const STORAGE_KEY = "bhq-marketplace-theme";

/**
 * Get initial theme from localStorage or system preference
 */
function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    // localStorage not available
  }

  // Default to light mode for marketplace
  return "light";
}

/**
 * Provider for marketplace theme state.
 * Stores preference in localStorage and provides toggle functionality.
 */
export function MarketplaceThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(getInitialTheme);

  // Persist theme changes to localStorage
  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // localStorage not available
    }
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  const value = React.useMemo<MarketplaceThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      isLightMode: theme === "light",
    }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <MarketplaceThemeContext.Provider value={value}>
      {children}
    </MarketplaceThemeContext.Provider>
  );
}

/**
 * Hook to access marketplace theme context.
 * Returns default values if used outside provider (for backwards compatibility).
 */
export function useMarketplaceTheme(): MarketplaceThemeContextValue {
  const context = React.useContext(MarketplaceThemeContext);

  // Return safe defaults if used outside provider
  if (!context) {
    return {
      theme: "light",
      setTheme: () => {},
      toggleTheme: () => {},
      isLightMode: true,
    };
  }

  return context;
}

/**
 * Hook that returns just the light mode boolean.
 * Convenience hook for components that just need to know if light mode is active.
 */
export function useIsLightMode(): boolean {
  const { isLightMode } = useMarketplaceTheme();
  return isLightMode;
}
