// apps/marketplace/src/messages/adapter.ts
// Adapter interface for messaging - supports both local storage and server backends

import type { Conversation, Message, ContextRef, Participant } from "./types";
import * as store from "./store";
import { serverAdapter } from "./serverAdapter";
import { isDemoMode } from "../demo/demoMode";

// Track if we've cleaned up localStorage for this session
let localStorageCleanedUp = false;

/**
 * Messaging adapter interface for messaging backends
 */
export interface MessagingAdapter {
  getConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | null>;
  getMessages(conversationId: string): Promise<Message[]>;
  sendMessage(conversationId: string, content: string): Promise<Message>;
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
 * Local storage implementation of the messaging adapter
 * Used as fallback in demo mode or when server is unavailable
 */
export const localAdapter: MessagingAdapter = {
  async getConversations(): Promise<Conversation[]> {
    return store.getConversations();
  },

  async getConversation(id: string): Promise<Conversation | null> {
    return store.getConversation(id);
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    return store.getMessages(conversationId);
  },

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    return store.sendMessage({ conversationId, content });
  },

  async getOrCreateConversation(params: {
    context: ContextRef;
    participant: Omit<Participant, "id">;
  }): Promise<Conversation> {
    return store.getOrCreateConversation(params);
  },

  async markConversationRead(conversationId: string): Promise<void> {
    store.markConversationRead(conversationId);
  },

  async markAllRead(): Promise<void> {
    store.markAllRead();
  },

  async getTotalUnreadCount(): Promise<number> {
    return store.getTotalUnreadCount();
  },

  async getUnreadConversations(): Promise<Conversation[]> {
    return store.getUnreadConversations();
  },
};

/**
 * Get the current messaging adapter
 * Uses server adapter for real messaging, local adapter for demo mode
 */
export function getMessagingAdapter(): MessagingAdapter {
  // In demo mode, use local storage adapter
  if (isDemoMode()) {
    return localAdapter;
  }

  // When NOT in demo mode, clear any leftover localStorage data once per session
  // This prevents mixing local IDs (conv-xxx) with server IDs (numeric)
  if (!localStorageCleanedUp) {
    try {
      store.clearAllMessages();
      localStorageCleanedUp = true;
      console.log("[messaging] Cleared localStorage data (switching to server mode)");
    } catch {
      // Ignore cleanup errors
    }
  }

  // Use the real server adapter for actual messaging
  return serverAdapter;
}

/**
 * Check if messaging backend is available
 * Returns true if we can use real server endpoints
 */
export function isMessagingBackendAvailable(): boolean {
  return !isDemoMode();
}
