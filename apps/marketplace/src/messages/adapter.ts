// apps/marketplace/src/messages/adapter.ts
// Adapter interface for messaging - uses server backend

import type { Conversation, Message, ContextRef, Participant } from "./types";
import * as store from "./store";
import { serverAdapter } from "./serverAdapter";

// Track if we've cleaned up localStorage for this session
let localStorageCleanedUp = false;

/**
 * Messaging adapter interface for messaging backends
 */
export interface MessagingAdapter {
  getConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | null>;
  getMessages(conversationId: string): Promise<Message[]>;
  sendMessage(conversationId: string, content: string, file?: File): Promise<Message>;
  getOrCreateConversation(params: {
    context: ContextRef;
    participant: Omit<Participant, "id">;
  }): Promise<Conversation>;
  markConversationRead(conversationId: string): Promise<void>;
  markAllRead(): Promise<void>;
  getTotalUnreadCount(): Promise<number>;
  getUnreadConversations(): Promise<Conversation[]>;
}

/**
 * Get the current messaging adapter
 * Uses server adapter for real messaging
 */
export function getMessagingAdapter(): MessagingAdapter {
  // Clear any leftover localStorage data once per session
  // This prevents mixing local IDs (conv-xxx) with server IDs (numeric)
  if (!localStorageCleanedUp) {
    try {
      store.clearAllMessages();
      localStorageCleanedUp = true;
    } catch {
      // Ignore cleanup errors
    }
  }

  // Use the real server adapter for actual messaging
  return serverAdapter;
}

/**
 * Check if messaging backend is available
 * Always returns true - the server adapter handles errors gracefully
 */
export function isMessagingBackendAvailable(): boolean {
  return true;
}
