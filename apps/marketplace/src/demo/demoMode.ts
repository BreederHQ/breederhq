// apps/marketplace/src/demo/demoMode.ts
// Demo mode utility for Marketplace end-to-end UX validation
import * as React from "react";

export const DEMO_MODE_KEY = "bhq_marketplace_demo_mode";

/**
 * Check if demo mode is enabled (reads localStorage).
 */
export function isDemoMode(): boolean {
  try {
    return localStorage.getItem(DEMO_MODE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Set demo mode state (writes localStorage).
 */
export function setDemoMode(on: boolean): void {
  try {
    if (on) {
      localStorage.setItem(DEMO_MODE_KEY, "true");
    } else {
      localStorage.removeItem(DEMO_MODE_KEY);
    }
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * React hook for demo mode state with enable/disable controls.
 */
export function useDemoMode(): {
  demoMode: boolean;
  enable: () => void;
  disable: () => void;
} {
  const [demoMode, setDemoModeState] = React.useState(() => isDemoMode());

  const enable = React.useCallback(() => {
    setDemoMode(true);
    setDemoModeState(true);
  }, []);

  const disable = React.useCallback(() => {
    setDemoMode(false);
    setDemoModeState(false);
  }, []);

  return { demoMode, enable, disable };
}
