// apps/marketplace/src/messages/types.ts
// Core types for the messaging system

/**
 * Participant in a conversation (buyer or breeder/service provider)
 */
export interface Participant {
  id: string;
  name: string;
  type: "buyer" | "breeder" | "service_provider";
  slug?: string; // For breeders: programSlug, for service providers: serviceId
}

/**
 * Context reference - what the conversation is about
 */
export interface ContextRef {
  type: "listing" | "service" | "general" | "program_inquiry";
  // For listing context
  listingSlug?: string;
  listingTitle?: string;
  programSlug?: string;
  programName?: string;
  breederSlug?: string;
  // For service context
  serviceId?: string;
  serviceName?: string;
}

/**
 * A single message in a conversation
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: "buyer" | "breeder" | "service_provider";
  content: string;
  createdAt: string;
  readAt?: string | null;
}

/**
 * A conversation thread between buyer and breeder/service provider
 */
export interface Conversation {
  id: string;
  participants: Participant[];
  context: ContextRef;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  lastReadAt?: string | null;
  unreadCount: number;
}

/**
 * Data store shape
 */
export interface MessagesStore {
  conversations: Conversation[];
  messages: Record<string, Message[]>; // keyed by conversationId
  currentUserId: string; // The buyer's ID
}

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = "id"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get a stable conversation key for deduplication
 */
export function getConversationKey(context: ContextRef, participantSlug: string): string {
  if (context.type === "listing" && context.programSlug && context.listingSlug) {
    return `listing:${context.programSlug}:${context.listingSlug}`;
  }
  if (context.type === "service" && context.serviceId) {
    return `service:${context.serviceId}`;
  }
  return `general:${participantSlug}`;
}
