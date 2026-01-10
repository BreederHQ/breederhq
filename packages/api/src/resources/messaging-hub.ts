// packages/api/src/resources/messaging-hub.ts
// API resource for MessagingHub - sending emails to any address with optional party linking

import type { Http } from "../http";
import type { ListResponse } from "../types/common";
import type {
  SendEmailInputV2,
  UnlinkedEmail,
  EmailLookupResponse,
  UnlinkedEmailListParams,
  PartyEmail,
} from "../types/party-crm";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SendEmailResult {
  ok: boolean;
  email?: PartyEmail;
  unlinkedEmail?: UnlinkedEmail;
  isLinked: boolean;
}

export interface LinkEmailResult {
  ok: boolean;
  unlinkedEmail: UnlinkedEmail;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resource Definition
// ─────────────────────────────────────────────────────────────────────────────

export type MessagingHubResource = {
  /**
   * Send an email to any address(es)
   * - If partyId is provided, stores as PartyEmail
   * - If partyId is null/undefined, stores as UnlinkedEmail
   */
  sendEmail(input: SendEmailInputV2): Promise<SendEmailResult>;

  /**
   * Lookup parties (contacts/organizations) by email addresses
   * Returns which emails have matching parties and which don't
   */
  lookupByEmail(emails: string[]): Promise<EmailLookupResponse>;

  /**
   * List unlinked emails (not associated with a party)
   */
  listUnlinked(params?: UnlinkedEmailListParams): Promise<ListResponse<UnlinkedEmail>>;

  /**
   * Get a single unlinked email by ID
   */
  getUnlinked(id: number): Promise<UnlinkedEmail>;

  /**
   * Link an unlinked email to a party (contact or organization)
   */
  linkEmail(emailId: number, partyId: number): Promise<LinkEmailResult>;

  /**
   * Unlink an email from a party (move back to unlinked)
   */
  unlinkEmail(emailId: number): Promise<LinkEmailResult>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Factory Function
// ─────────────────────────────────────────────────────────────────────────────

export function makeMessagingHub(http: Http): MessagingHubResource {
  const BASE = "/api/v1";

  return {
    async sendEmail(input: SendEmailInputV2): Promise<SendEmailResult> {
      const res = await http.post(`${BASE}/emails/send`, input);
      return res;
    },

    async lookupByEmail(emails: string[]): Promise<EmailLookupResponse> {
      const emailsParam = emails.join(",");
      const res = await http.get(`${BASE}/parties/lookup-by-email?emails=${encodeURIComponent(emailsParam)}`);
      return res;
    },

    async listUnlinked(params: UnlinkedEmailListParams = {}): Promise<ListResponse<UnlinkedEmail>> {
      const sp = new URLSearchParams();
      if (params.limit != null) sp.set("limit", String(params.limit));
      if (params.offset != null) sp.set("offset", String(params.offset));
      if (params.linkedStatus) sp.set("linkedStatus", params.linkedStatus);
      const qs = sp.toString();
      const res = await http.get(`${BASE}/emails/unlinked${qs ? `?${qs}` : ""}`);
      return normalizeList(res);
    },

    async getUnlinked(id: number): Promise<UnlinkedEmail> {
      const res = await http.get(`${BASE}/emails/unlinked/${id}`);
      return res.unlinkedEmail || res;
    },

    async linkEmail(emailId: number, partyId: number): Promise<LinkEmailResult> {
      const res = await http.post(`${BASE}/emails/unlinked/${emailId}/link`, { partyId });
      return res;
    },

    async unlinkEmail(emailId: number): Promise<LinkEmailResult> {
      const res = await http.post(`${BASE}/emails/unlinked/${emailId}/unlink`, {});
      return res;
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function normalizeList<T>(res: any): ListResponse<T> {
  if (Array.isArray(res)) {
    return { items: res as T[], total: res.length };
  }
  if (res && typeof res === "object") {
    if ("items" in res && "total" in res) {
      return res as ListResponse<T>;
    }
    if ("unlinkedEmails" in res) {
      const items = res.unlinkedEmails as T[];
      return { items, total: Number(res.total ?? items.length) };
    }
  }
  return { items: [], total: 0 };
}
