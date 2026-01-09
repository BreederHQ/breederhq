// packages/api/src/resources/communications.ts
// Communications Hub API - Unified inbox for DMs and emails

import type { Http } from "../http";

export type CommunicationChannel = "all" | "email" | "dm";
export type CommunicationStatus = "all" | "unread" | "flagged" | "archived" | "draft";
export type CommunicationType = "email" | "dm" | "draft";
export type CommunicationSort = "newest" | "oldest" | "unread_first";
export type BulkAction = "archive" | "unarchive" | "flag" | "unflag" | "markRead" | "markUnread" | "delete";

export interface CommunicationItem {
  id: string; // "email:123" or "thread:456" or "draft:789"
  type: CommunicationType;
  partyId: number | null;
  partyName: string | null;
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
}

export function makeCommunications(http: Http) {
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
        return http.get(`/communications/inbox${qs ? `?${qs}` : ""}`);
      },
    },
    bulk: {
      async action(params: BulkActionRequest): Promise<BulkActionResponse> {
        return http.post("/communications/bulk", params);
      },
    },
    counts: {
      async get(): Promise<InboxCounts> {
        return http.get("/communications/counts");
      },
    },
  };
}

export type CommunicationsResource = ReturnType<typeof makeCommunications>;
