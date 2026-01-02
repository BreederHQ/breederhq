// apps/marketplace/src/messages/store.ts
// localStorage-backed message store with CRUD operations

import type {
  Conversation,
  Message,
  MessagesStore,
  ContextRef,
  Participant,
} from "./types";
import { generateId, getConversationKey } from "./types";

const MESSAGES_STORE_KEY = "bhq_marketplace_messages";
const CURRENT_USER_ID = "current-buyer"; // Fixed buyer ID for localStorage

/**
 * Get the current store from localStorage
 */
export function getStore(): MessagesStore {
  try {
    const data = localStorage.getItem(MESSAGES_STORE_KEY);
    if (!data) {
      return createEmptyStore();
    }
    const parsed = JSON.parse(data);
    // Validate structure
    if (!parsed.conversations || !parsed.messages) {
      return createEmptyStore();
    }
    return parsed as MessagesStore;
  } catch {
    return createEmptyStore();
  }
}

/**
 * Save store to localStorage
 */
function saveStore(store: MessagesStore): void {
  try {
    localStorage.setItem(MESSAGES_STORE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Create an empty store
 */
function createEmptyStore(): MessagesStore {
  return {
    conversations: [],
    messages: {},
    currentUserId: CURRENT_USER_ID,
  };
}

/**
 * Get all conversations sorted by most recent activity
 */
export function getConversations(): Conversation[] {
  const store = getStore();
  return [...store.conversations].sort((a, b) => {
    const dateA = a.lastMessageAt || a.updatedAt;
    const dateB = b.lastMessageAt || b.updatedAt;
    return dateB.localeCompare(dateA);
  });
}

/**
 * Get a conversation by ID
 */
export function getConversation(id: string): Conversation | null {
  const store = getStore();
  return store.conversations.find((c) => c.id === id) || null;
}

/**
 * Find existing conversation by context and participant
 */
export function findConversation(
  context: ContextRef,
  participantSlug: string
): Conversation | null {
  const store = getStore();
  const key = getConversationKey(context, participantSlug);

  return store.conversations.find((c) => {
    const participant = c.participants.find(
      (p) => p.type !== "buyer" && p.slug === participantSlug
    );
    if (!participant) return false;

    const cKey = getConversationKey(c.context, participantSlug);
    return cKey === key;
  }) || null;
}

/**
 * Get messages for a conversation
 */
export function getMessages(conversationId: string): Message[] {
  const store = getStore();
  return store.messages[conversationId] || [];
}

/**
 * Create or get existing conversation
 */
export function getOrCreateConversation(params: {
  context: ContextRef;
  participant: Omit<Participant, "id">;
}): Conversation {
  const { context, participant } = params;
  const participantSlug = participant.slug || participant.name;

  // Check for existing conversation
  const existing = findConversation(context, participantSlug);
  if (existing) {
    return existing;
  }

  // Create new conversation
  const store = getStore();
  const now = new Date().toISOString();

  const buyerParticipant: Participant = {
    id: CURRENT_USER_ID,
    name: "You",
    type: "buyer",
  };

  const otherParticipant: Participant = {
    id: generateId("participant"),
    ...participant,
  };

  const conversation: Conversation = {
    id: generateId("conv"),
    participants: [buyerParticipant, otherParticipant],
    context,
    createdAt: now,
    updatedAt: now,
    unreadCount: 0,
  };

  store.conversations.push(conversation);
  store.messages[conversation.id] = [];
  saveStore(store);

  return conversation;
}

/**
 * Send a message in a conversation
 */
export function sendMessage(params: {
  conversationId: string;
  content: string;
  senderType?: "buyer" | "breeder" | "service_provider";
  senderId?: string;
}): Message {
  const {
    conversationId,
    content,
    senderType = "buyer",
    senderId = CURRENT_USER_ID,
  } = params;

  const store = getStore();
  const now = new Date().toISOString();

  const message: Message = {
    id: generateId("msg"),
    conversationId,
    senderId,
    senderType,
    content,
    createdAt: now,
    readAt: senderType === "buyer" ? now : null, // Auto-read buyer's own messages
  };

  // Add message to conversation
  if (!store.messages[conversationId]) {
    store.messages[conversationId] = [];
  }
  store.messages[conversationId].push(message);

  // Update conversation metadata
  const convIndex = store.conversations.findIndex((c) => c.id === conversationId);
  if (convIndex !== -1) {
    store.conversations[convIndex] = {
      ...store.conversations[convIndex],
      updatedAt: now,
      lastMessageAt: now,
      lastMessagePreview: content.slice(0, 100),
      // Increment unread if message is from breeder/service provider
      unreadCount:
        senderType !== "buyer"
          ? store.conversations[convIndex].unreadCount + 1
          : store.conversations[convIndex].unreadCount,
    };
  }

  saveStore(store);
  return message;
}

/**
 * Mark all messages in a conversation as read
 */
export function markConversationRead(conversationId: string): void {
  const store = getStore();
  const now = new Date().toISOString();

  // Mark messages as read
  const messages = store.messages[conversationId];
  if (messages) {
    store.messages[conversationId] = messages.map((m) => ({
      ...m,
      readAt: m.readAt || now,
    }));
  }

  // Reset unread count and set lastReadAt
  const convIndex = store.conversations.findIndex((c) => c.id === conversationId);
  if (convIndex !== -1) {
    store.conversations[convIndex] = {
      ...store.conversations[convIndex],
      unreadCount: 0,
      lastReadAt: now,
    };
  }

  saveStore(store);
}

/**
 * Mark all conversations as read
 */
export function markAllRead(): void {
  const store = getStore();
  const now = new Date().toISOString();

  // Mark all messages as read
  for (const convId of Object.keys(store.messages)) {
    store.messages[convId] = store.messages[convId].map((m) => ({
      ...m,
      readAt: m.readAt || now,
    }));
  }

  // Reset all unread counts and set lastReadAt
  store.conversations = store.conversations.map((c) => ({
    ...c,
    unreadCount: 0,
    lastReadAt: now,
  }));

  saveStore(store);
}

/**
 * Get total unread count across all conversations
 */
export function getTotalUnreadCount(): number {
  const store = getStore();
  return store.conversations.reduce((sum, c) => sum + c.unreadCount, 0);
}

/**
 * Get conversations with unread messages
 */
export function getUnreadConversations(): Conversation[] {
  const store = getStore();
  return store.conversations.filter((c) => c.unreadCount > 0);
}

/**
 * Add a breeder reply to a conversation (for demo mode)
 */
export function addBreederReply(conversationId: string, content: string): Message {
  const store = getStore();
  const conversation = store.conversations.find((c) => c.id === conversationId);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // Find the breeder/service provider participant
  const breeder = conversation.participants.find((p) => p.type !== "buyer");

  if (!breeder) {
    throw new Error("No breeder participant found");
  }

  return sendMessage({
    conversationId,
    content,
    senderType: breeder.type as "breeder" | "service_provider",
    senderId: breeder.id,
  });
}

/**
 * Clear all messages (for testing/reset)
 */
export function clearAllMessages(): void {
  try {
    localStorage.removeItem(MESSAGES_STORE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Get the current user ID
 */
export function getCurrentUserId(): string {
  return CURRENT_USER_ID;
}
