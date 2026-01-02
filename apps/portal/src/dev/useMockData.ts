// apps/portal/src/dev/useMockData.ts
// Helper to prefer mock data when demo mode is enabled

import { isPortalMockEnabled } from "./mockFlag";

/**
 * Returns mock data if demo mode is enabled, otherwise returns real data.
 * In demo mode, mock data is ALWAYS preferred regardless of real data state.
 */
export function useMockOr<T>(mockData: T, realData: T): T {
  return isPortalMockEnabled() ? mockData : realData;
}

/**
 * Returns true if demo mode is enabled.
 * Use this to conditionally skip API calls or show mock UI.
 */
export function shouldUseMockData(): boolean {
  return isPortalMockEnabled();
}
