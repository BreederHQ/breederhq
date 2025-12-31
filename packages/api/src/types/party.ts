// Party-first identity model for frontend
// This is the canonical identity model across all modules.
// Legacy contactId/organizationId fields are deprecated and will be removed in Phase 5.

import type { ID } from "./common";

/**
 * Party kind discriminator
 * Matches backend PartyKind enum
 */
export type PartyKind = "CONTACT" | "ORGANIZATION";

/**
 * Canonical Party identity reference
 * Use this as the single source of truth for identity across the frontend.
 */
export interface PartyRef {
  /** Canonical identity key - ALWAYS use this as the primary key */
  partyId: number;

  /** Kind discriminator */
  kind: PartyKind;

  /** Display name (returned by API) */
  displayName: string;

  /** Legacy backing IDs - ONLY use these for drawer routing, never as primary keys */
  contactId?: number | null;
  organizationId?: number | null;
}

/**
 * Party identity for table rows
 * Minimal shape for table display and selection
 */
export interface PartyTableRow {
  /** Row key MUST be partyId */
  partyId: number;

  /** Kind discriminator for badge/routing */
  kind: PartyKind;

  /** Display name */
  displayName: string;

  /** Optional subtitle (email, phone, etc.) */
  subtitle?: string | null;

  /** Legacy IDs for drawer routing only */
  contactId?: number | null;
  organizationId?: number | null;
}

/**
 * Party write payload
 * Use this when writing identity references to the backend.
 * Backend Phase 2+ expects partyId as the canonical field.
 */
export interface PartyWritePayload {
  /** REQUIRED: Canonical party reference */
  clientPartyId?: number | null;

  /** DEPRECATED: DO NOT USE in new code. Backend accepts for backward compat only. */
  contactId?: never;
  organizationId?: never;
  partyType?: never;
}

/**
 * Helper: Extract PartyRef from API response
 * Handles both Party-first and legacy response shapes
 */
export function extractPartyRef(data: any): PartyRef | null {
  // Prefer Party-first fields
  const partyId = data?.partyId ?? data?.party_id ?? data?.clientPartyId ?? data?.client_party_id;
  const kind = data?.partyKind ?? data?.party_kind;

  if (partyId && kind) {
    return {
      partyId: Number(partyId),
      kind: kind === "CONTACT" || kind === "Contact" ? "CONTACT" : "ORGANIZATION",
      displayName: data?.partyDisplayName ?? data?.party_display_name ?? data?.displayName ?? data?.display_name ?? `Party ${partyId}`,
      contactId: data?.contactId ?? data?.contact_id ?? null,
      organizationId: data?.organizationId ?? data?.organization_id ?? null,
    };
  }

  // Fallback: infer from legacy fields (backward compat only)
  const contactId = data?.contactId ?? data?.contact_id;
  const organizationId = data?.organizationId ?? data?.organization_id;

  if (contactId) {
    return {
      partyId: Number(contactId), // TEMPORARY: will break when backend stops dual-writing
      kind: "CONTACT",
      displayName: data?.displayName ?? data?.display_name ?? data?.contactName ?? `Contact ${contactId}`,
      contactId: Number(contactId),
      organizationId: null,
    };
  }

  if (organizationId) {
    return {
      partyId: Number(organizationId), // TEMPORARY: will break when backend stops dual-writing
      kind: "ORGANIZATION",
      displayName: data?.displayName ?? data?.display_name ?? data?.organizationName ?? data?.name ?? `Organization ${organizationId}`,
      contactId: null,
      organizationId: Number(organizationId),
    };
  }

  return null;
}

/**
 * Helper: Get drawer route for a Party
 * Returns the appropriate route based on kind
 */
export function getPartyDrawerRoute(party: PartyRef): { param: string; value: number } | null {
  if (party.kind === "CONTACT" && party.contactId) {
    return { param: "contactId", value: party.contactId };
  }
  if (party.kind === "ORGANIZATION" && party.organizationId) {
    return { param: "orgId", value: party.organizationId };
  }
  return null;
}

/**
 * Helper: Resolve Party from URL params
 * Supports legacy contactId/orgId and new partyId params
 */
export function resolvePartyFromParams(params: URLSearchParams, allParties: PartyRef[]): PartyRef | null {
  // Prefer canonical partyId param
  const partyId = params.get("partyId");
  if (partyId) {
    const found = allParties.find(p => p.partyId === Number(partyId));
    if (found) return found;
  }

  // Fallback: legacy params for deep link compatibility
  const contactId = params.get("contactId");
  if (contactId) {
    const found = allParties.find(p => p.kind === "CONTACT" && p.contactId === Number(contactId));
    if (found) return found;
  }

  const orgId = params.get("orgId");
  if (orgId) {
    const found = allParties.find(p => p.kind === "ORGANIZATION" && p.organizationId === Number(orgId));
    if (found) return found;
  }

  return null;
}
