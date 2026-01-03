// packages/ui/src/legal/config.ts
// Shared legal configuration for Terms of Service versioning

/**
 * Current Terms of Service version.
 * Increment this when Terms are updated to trigger re-acceptance.
 */
export const CURRENT_TOS_VERSION = "1.0";

/**
 * Effective date of the current Terms of Service (ISO 8601).
 */
export const TOS_EFFECTIVE_DATE = "2026-01-03";

/**
 * Display-friendly effective date.
 */
export const TOS_EFFECTIVE_DATE_DISPLAY = "January 3, 2026";

/**
 * Check if a user's accepted ToS version is current.
 * @param acceptedVersion - The version the user accepted (null if never accepted)
 * @returns true if user needs to accept current ToS
 */
export function needsTosAcceptance(acceptedVersion: string | null | undefined): boolean {
  if (!acceptedVersion) return true;
  return acceptedVersion !== CURRENT_TOS_VERSION;
}

/**
 * Legal acceptance record interface.
 * This should match the backend schema for ToS acceptance tracking.
 */
export interface TosAcceptanceRecord {
  userId: string;
  version: string;
  acceptedAt: string; // ISO 8601 - stamped server-side
  ipAddress?: string;
  userAgent?: string;
  surface?: TosAcceptanceSurface;
  flow?: TosAcceptanceFlow;
}

/**
 * Surface where ToS was accepted.
 */
export type TosAcceptanceSurface = "marketplace" | "platform" | "portal";

/**
 * Flow in which ToS was accepted.
 */
export type TosAcceptanceFlow = "register" | "invite_signup" | "portal_activate";

/**
 * Payload for ToS acceptance API call.
 * Note: acceptedAt is NOT included - backend must stamp server-side for audit integrity.
 */
export interface TosAcceptancePayload {
  version: string;
  effectiveDate: string;
  surface: TosAcceptanceSurface;
  flow: TosAcceptanceFlow;
}

/**
 * Create a ToS acceptance payload for API submission.
 * Backend is responsible for stamping accepted_at server-side.
 */
export function createTosAcceptancePayload(
  surface: TosAcceptanceSurface,
  flow: TosAcceptanceFlow
): TosAcceptancePayload {
  return {
    version: CURRENT_TOS_VERSION,
    effectiveDate: TOS_EFFECTIVE_DATE,
    surface,
    flow,
  };
}
