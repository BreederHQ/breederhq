// packages/api/src/resources/drafts.ts
// Draft messages/emails API for Communications Hub

import type { Http } from "../http";

export type DraftChannel = "email" | "dm";

export interface Draft {
  id: number;
  tenantId: number;
  partyId: number | null;
  partyName: string | null;
  channel: DraftChannel;
  subject: string | null;
  toAddresses: string[];
  bodyText: string;
  bodyHtml: string | null;
  templateId: number | null;
  metadata: Record<string, unknown> | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DraftListParams {
  channel?: DraftChannel;
  partyId?: number;
  limit?: number;
  offset?: number;
}

export interface DraftListResponse {
  items: Draft[];
  total: number;
}

export interface CreateDraftRequest {
  channel: DraftChannel;
  partyId?: number;
  subject?: string;
  toAddresses?: string[];
  bodyText: string;
  bodyHtml?: string;
  templateId?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateDraftRequest {
  partyId?: number | null;
  subject?: string | null;
  toAddresses?: string[];
  bodyText?: string;
  bodyHtml?: string | null;
  templateId?: number | null;
  metadata?: Record<string, unknown>;
}

export interface SendDraftResponse {
  ok: boolean;
  channel: DraftChannel;
  threadId?: number;
  emailLogId?: number;
}

export function makeDrafts(http: Http) {
  return {
    async list(params?: DraftListParams): Promise<DraftListResponse> {
      const query = new URLSearchParams();
      if (params?.channel) query.set("channel", params.channel);
      if (params?.partyId) query.set("partyId", String(params.partyId));
      if (params?.limit) query.set("limit", String(params.limit));
      if (params?.offset) query.set("offset", String(params.offset));
      const qs = query.toString();
      return http.get(`/drafts${qs ? `?${qs}` : ""}`);
    },
    async get(id: number): Promise<Draft> {
      return http.get(`/drafts/${id}`);
    },
    async create(params: CreateDraftRequest): Promise<Draft> {
      return http.post("/drafts", params);
    },
    async update(id: number, params: UpdateDraftRequest): Promise<Draft> {
      return http.put(`/drafts/${id}`, params);
    },
    async delete(id: number): Promise<{ success: boolean }> {
      return http.delete(`/drafts/${id}`);
    },
    async send(id: number): Promise<SendDraftResponse> {
      return http.post(`/drafts/${id}/send`, {});
    },
  };
}

export type DraftsResource = ReturnType<typeof makeDrafts>;
