// apps/portal/src/dev/mockFlag.ts
// Deterministic demo data mode flag
// Demo data is enabled when:
// - URL query param mock=1, OR
// - localStorage portal_mock === "1"

export function isPortalMockEnabled(): boolean {
  // Check URL query param first
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mock") === "1") {
      return true;
    }

    // Check localStorage
    try {
      if (localStorage.getItem("portal_mock") === "1") {
        return true;
      }
    } catch {
      // localStorage may not be available
    }
  }

  return false;
}
