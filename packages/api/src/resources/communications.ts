// packages/api/src/resources/communications.ts
// Communications Hub API - Unified inbox for DMs and emails

import type { Http } from "../http";

export type CommunicationChannel = "all" | "email" | "dm";
export type CommunicationStatus = "all" | "unread" | "sent" | "flagged" | "archived" | "draft";
export type CommunicationType = "email" | "dm" | "draft";
export type CommunicationSort = "newest" | "oldest" | "unread_first";
export type BulkAction = "archive" | "unarchive" | "flag" | "unflag" | "markRead" | "markUnread" | "delete";

export interface CommunicationItem {
  id: string; // "email:123" or "thread:456" or "draft:789"
  type: CommunicationType;
  partyId: number | null;
  partyName: string | null;
  toEmail?: string | null; // Email address for email items
  subject: string | null;
  preview: string;
  isRead: boolean;
  flagged: boolean;
  archived: boolean;
  channel: "email" | "dm";
  direction?: "inbound" | "outbound";
  createdAt: string;
  updatedAt: string;
}

export interface InboxParams {
  channel?: CommunicationChannel;
  status?: CommunicationStatus;
  partyId?: number;
  search?: string;
  sort?: CommunicationSort;
  limit?: number;
  offset?: number;
}

export interface InboxResponse {
  items: CommunicationItem[];
  total: number;
  unreadCount: number;
  flaggedCount: number;
}

export interface BulkActionRequest {
  ids: string[];
  action: BulkAction;
}

export interface BulkActionResponse {
  ok: boolean;
  processed: number;
  failed: number;
}

export interface InboxCounts {
  unreadCount: number;
  flaggedCount: number;
  draftCount: number;
  sentCount?: number;
}

export interface EmailDetail {
  id: string;
  type: "partyEmail" | "unlinkedEmail";
  partyId: number | null;
  partyName: string | null;
  partyEmail?: string | null;
  toEmail: string;
  fromEmail?: string;
  subject: string;
  body?: string;
  bodyText?: string | null;
  bodyHtml?: string | null;
  status: string;
  direction?: string;
  sentAt?: string;
  createdAt: string;
  isRead: boolean;
}

export interface EmailDetailResponse {
  email: EmailDetail;
}

export function makeCommunications(http: Http) {
  const BASE = "/api/v1";

  return {
    inbox: {
      async list(params?: InboxParams): Promise<InboxResponse> {
        const query = new URLSearchParams();
        if (params?.channel) query.set("channel", params.channel);
        if (params?.status) query.set("status", params.status);
        if (params?.partyId) query.set("partyId", String(params.partyId));
        if (params?.search) query.set("search", params.search);
        if (params?.sort) query.set("sort", params.sort);
        if (params?.limit) query.set("limit", String(params.limit));
        if (params?.offset) query.set("offset", String(params.offset));
        const qs = query.toString();
        return http.get(`${BASE}/communications/inbox${qs ? `?${qs}` : ""}`);
      },
    },
    bulk: {
      async action(params: BulkActionRequest): Promise<BulkActionResponse> {
        return http.post(`${BASE}/communications/bulk`, params);
      },
    },
    counts: {
      async get(): Promise<InboxCounts> {
        return http.get(`${BASE}/communications/counts`);
      },
    },
    email: {
      async get(compositeId: string): Promise<EmailDetailResponse> {
        return http.get(`${BASE}/communications/email/${encodeURIComponent(compositeId)}`);
      },
    },
  };
}

export type CommunicationsResource = ReturnType<typeof makeCommunications>;
