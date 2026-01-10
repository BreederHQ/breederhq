// packages/api/src/resources/messages.ts
import type { Http } from "../http";

export interface MessageThread {
  id: number;
  tenantId: number;
  subject?: string;
  archived: boolean;
  flagged: boolean;
  flaggedAt?: string;
  guestName?: string;
  participants: MessageParticipant[];
  messages: Message[];
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessageParticipant {
  id: number;
  threadId: number;
  partyId: number;
  party: { id: number; name: string; email?: string; type?: "CONTACT" | "ORGANIZATION" };
  unreadCount: number;
}

export interface Message {
  id: number;
  threadId: number;
  senderPartyId: number;
  senderParty: { id: number; name: string };
  body: string;
  createdAt: string;
}

export interface CreateThreadRequest {
  recipientPartyId: number;
  subject?: string;
  initialMessage: string;
}

export interface SendMessageRequest {
  body: string;
}

export interface UpdateThreadRequest {
  flagged?: boolean;
  archived?: boolean;
}

export function makeMessages(http: Http) {
  const BASE = "/api/v1";

  return {
    threads: {
      async list(): Promise<{ threads: MessageThread[] }> {
        return http.get(`${BASE}/messages/threads`);
      },
      async get(id: number): Promise<{ thread: MessageThread }> {
        return http.get(`${BASE}/messages/threads/${id}`);
      },
      async create(params: CreateThreadRequest): Promise<{ ok: boolean; thread: MessageThread }> {
        return http.post(`${BASE}/messages/threads`, params);
      },
      async sendMessage(threadId: number, params: SendMessageRequest): Promise<{ ok: boolean; message: Message }> {
        return http.post(`${BASE}/messages/threads/${threadId}/messages`, params);
      },
      async update(threadId: number, params: UpdateThreadRequest): Promise<{ ok: boolean; thread: MessageThread }> {
        return http.patch(`${BASE}/messages/threads/${threadId}`, params);
      },
    },
  };
}

export type MessagesResource = ReturnType<typeof makeMessages>;
