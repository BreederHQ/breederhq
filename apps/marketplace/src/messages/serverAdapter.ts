// apps/marketplace/src/messages/serverAdapter.ts
// Server-backed messaging adapter that communicates with the real API

import type { Conversation, Message, ContextRef, Participant } from "./types";
import type { MessagingAdapter } from "./adapter";

// API base URL - uses Vite proxy in dev, origin in prod
function getApiBase(): string {
  if (import.meta.env.DEV) {
    return "/api/v1/marketplace";
  }
  return `${window.location.origin}/api/v1/marketplace`;
}

// Get CSRF token from cookie
function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Fetch wrapper with auth
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = getApiBase();
  const url = `${base}${path}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const csrf = getCsrfToken();
  if (csrf) {
    headers.set("x-csrf-token", csrf);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "unknown" }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Cache for breeder party IDs
const breederPartyCache = new Map<string, { partyId: number; tenantId: number; businessName: string }>();

// Get breeder's party ID by slug
async function getBreederPartyId(slug: string): Promise<{ partyId: number; tenantId: number; businessName: string }> {
  const cached = breederPartyCache.get(slug);
  if (cached) return cached;

  const data = await apiFetch<{
    tenantId: number;
    partyId: number;
    businessName: string;
  }>(`/breeders/${encodeURIComponent(slug)}/messaging`);

  const result = { partyId: data.partyId, tenantId: data.tenantId, businessName: data.businessName };
  breederPartyCache.set(slug, result);
  return result;
}

// Convert API thread to Conversation
function threadToConversation(thread: any): Conversation {
  // Find the "other" participant (not the current user)
  // The current user's party is the one that doesn't have a tenantId (global party)
  // OR we just pick the first non-CONTACT party as the breeder
  const participants: Participant[] = thread.participants.map((p: any) => {
    const party = p.party;
    // Determine participant type based on party type or context
    const isBreeder = party.type === "ORGANIZATION" || (thread.tenantId && party.tenantId === thread.tenantId);
    return {
      id: String(party.id),
      name: party.name,
      type: isBreeder ? "breeder" : "buyer",
      slug: party.slug,
    } as Participant;
  });

  // Build context from thread subject/metadata
  const context: ContextRef = {
    type: "general",
  };

  // Extract program name from subject if present
  if (thread.subject?.startsWith("Inquiry about ")) {
    context.type = "listing";
    context.programName = thread.subject.replace("Inquiry about ", "");
  }

  // Get last message for preview
  const lastMessage = thread.messages?.[0];

  return {
    id: String(thread.id),
    participants,
    context,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    lastMessagePreview: lastMessage?.body?.slice(0, 100),
    lastMessageAt: thread.lastMessageAt,
    unreadCount: thread.unreadCount || 0,
  };
}

// Convert API message to Message
function apiMessageToMessage(msg: any, conversationId: string): Message {
  return {
    id: String(msg.id),
    conversationId,
    senderId: String(msg.senderPartyId),
    senderType: msg.senderParty?.type === "ORGANIZATION" ? "breeder" : "buyer",
    content: msg.body,
    createdAt: msg.createdAt,
    readAt: null, // API doesn't track per-message read status
    attachment: msg.attachment || null,
  };
}

/**
 * Server-backed messaging adapter implementation
 */
export const serverAdapter: MessagingAdapter = {
  async getConversations(): Promise<Conversation[]> {
    const data = await apiFetch<{ threads: any[] }>("/messages/threads");
    return (data.threads || []).map(threadToConversation);
  },

  async getConversation(id: string): Promise<Conversation | null> {
    try {
      const data = await apiFetch<{ thread: any }>(`/messages/threads/${id}`);
      return data.thread ? threadToConversation(data.thread) : null;
    } catch {
      return null;
    }
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const data = await apiFetch<{ thread: any }>(`/messages/threads/${conversationId}`);
      const thread = data.thread;
      if (!thread?.messages) return [];
      return thread.messages.map((m: any) => apiMessageToMessage(m, conversationId));
    } catch {
      return [];
    }
  },

  async sendMessage(conversationId: string, content: string, file?: File): Promise<Message> {
    if (file) {
      // Upload with file attachment using multipart form
      const formData = new FormData();
      formData.append("file", file);
      formData.append("body", content);

      const base = getApiBase();
      const url = `${base}/messages/threads/${conversationId}/messages/upload`;

      const headers = new Headers();
      const csrf = getCsrfToken();
      if (csrf) {
        headers.set("x-csrf-token", csrf);
      }
      // Don't set Content-Type for FormData - browser will set it with boundary

      const response = await fetch(url, {
        method: "POST",
        headers,
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "unknown" }));
        throw new Error(error.error || error.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return apiMessageToMessage(data.message, conversationId);
    }

    // Text-only message
    const data = await apiFetch<{ ok: boolean; message: any }>(
      `/messages/threads/${conversationId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ body: content }),
      }
    );

    return apiMessageToMessage(data.message, conversationId);
  },

  async getOrCreateConversation(params: {
    context: ContextRef;
    participant: Omit<Participant, "id">;
  }): Promise<Conversation> {
    const { context, participant } = params;

    // Resolve the breeder's party ID from their slug
    if (!participant.slug) {
      throw new Error("Breeder slug is required to start a conversation");
    }

    const breederInfo = await getBreederPartyId(participant.slug);

    // Create or get existing thread
    const data = await apiFetch<{ ok: boolean; thread: any; reused?: boolean }>(
      "/messages/threads",
      {
        method: "POST",
        body: JSON.stringify({
          recipientPartyId: breederInfo.partyId,
          breederTenantId: breederInfo.tenantId,
          subject: context.programName ? `Inquiry about ${context.programName}` : null,
          initialMessage: `Hi! I'm interested in learning more about ${context.programName || "your program"}.`,
          context,
        }),
      }
    );

    return threadToConversation(data.thread);
  },

  async markConversationRead(conversationId: string): Promise<void> {
    // Reading a thread marks it as read on the server automatically
    await apiFetch(`/messages/threads/${conversationId}`);
  },

  async markAllRead(): Promise<void> {
    // Server doesn't have a bulk mark-all-read endpoint
    // Mark each conversation read individually
    const conversations = await this.getConversations();
    await Promise.all(
      conversations
        .filter((c) => c.unreadCount > 0)
        .map((c) => this.markConversationRead(c.id))
    );
  },

  async getTotalUnreadCount(): Promise<number> {
    const conversations = await this.getConversations();
    return conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  },

  async getUnreadConversations(): Promise<Conversation[]> {
    const conversations = await this.getConversations();
    return conversations.filter((c) => c.unreadCount > 0);
  },
};
