// apps/portal/src/dev/mockFlag.ts
// Deterministic demo data mode flag
// Demo data is enabled when:
// - URL query param mock=1 (sets localStorage and returns true)
// - URL query param mock=0 (clears localStorage and returns false)
// - localStorage portal_mock === "1" (persists across navigation)
//
// PRODUCTION SAFETY: In production builds (!import.meta.env.DEV), demo mode
// is hard-disabled unless VITE_ALLOW_DEMO_MODE=1 is set at build time.

export function isPortalMockEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  // Production hard-disable: demo mode is only available in development
  // or when explicitly enabled via VITE_ALLOW_DEMO_MODE=1 build flag
  const allowDemoMode = import.meta.env.DEV || import.meta.env.VITE_ALLOW_DEMO_MODE === "1";
  if (!allowDemoMode) {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  const mockParam = params.get("mock");

  // If URL has ?mock=1, enable demo mode and persist
  if (mockParam === "1") {
    try {
      localStorage.setItem("portal_mock", "1");
    } catch {
      // Ignore localStorage errors
    }
    return true;
  }

  // If URL has ?mock=0, disable demo mode and clear persistence
  if (mockParam === "0") {
    try {
      localStorage.removeItem("portal_mock");
    } catch {
      // Ignore localStorage errors
    }
    return false;
  }

  // Otherwise, check localStorage for persisted state
  try {
    return localStorage.getItem("portal_mock") === "1";
  } catch {
    // localStorage may not be available
    return false;
  }
}
