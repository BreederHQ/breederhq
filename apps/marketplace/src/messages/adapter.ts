// apps/marketplace/src/messages/adapter.ts
// Adapter interface for messaging - can be swapped for real API later

import type { Conversation, Message, ContextRef, Participant } from "./types";
import * as store from "./store";

/**
 * Messaging adapter interface for future API integration
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
 * This is the default implementation that persists to localStorage
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
 * In the future, this could check for backend availability and return a server adapter
 */
export function getMessagingAdapter(): MessagingAdapter {
  // For now, always return the local adapter
  // When backend is ready:
  // if (isServerAvailable()) return serverAdapter;
  return localAdapter;
}

/**
 * Check if messaging backend is available
 * Returns true if we can use real server endpoints
 */
export function isMessagingBackendAvailable(): boolean {
  // For now, always return false - no backend
  // When backend is ready, this will check for connectivity
  return false;
}
