// apps/marketplace/src/messages/hooks.ts
// React hooks for the messaging system

import * as React from "react";
import type { Conversation, Message, ContextRef, Participant } from "./types";
import { getMessagingAdapter } from "./adapter";
import * as store from "./store";

/**
 * Hook to get all conversations with real-time updates
 */
export function useConversations() {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const load = React.useCallback(async () => {
    try {
      const adapter = getMessagingAdapter();
      const data = await adapter.getConversations();
      setConversations(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    // Poll for updates every 2 seconds
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, [load]);

  return { conversations, loading, error, refresh: load };
}

/**
 * Hook to get a single conversation with messages
 */
export function useConversation(conversationId: string | null) {
  const [conversation, setConversation] = React.useState<Conversation | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const load = React.useCallback(async () => {
    if (!conversationId) {
      setConversation(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const adapter = getMessagingAdapter();
      const [conv, msgs] = await Promise.all([
        adapter.getConversation(conversationId),
        adapter.getMessages(conversationId),
      ]);
      setConversation(conv);
      setMessages(msgs);
      setError(null);

      // Mark as read when viewing
      if (conv && conv.unreadCount > 0) {
        await adapter.markConversationRead(conversationId);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  React.useEffect(() => {
    load();
    // Poll for updates every 2 seconds
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, [load]);

  return { conversation, messages, loading, error, refresh: load };
}

/**
 * Hook to send a message
 */
export function useSendMessage() {
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const sendMessage = React.useCallback(
    async (conversationId: string, content: string): Promise<Message | null> => {
      if (!content.trim()) return null;

      setSending(true);
      setError(null);

      try {
        const adapter = getMessagingAdapter();
        const message = await adapter.sendMessage(conversationId, content.trim());
        return message;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      } finally {
        setSending(false);
      }
    },
    []
  );

  return { sendMessage, sending, error };
}

/**
 * Hook to start or continue a conversation
 */
export function useStartConversation() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const startConversation = React.useCallback(
    async (params: {
      context: ContextRef;
      participant: Omit<Participant, "id">;
      initialMessage?: string;
    }): Promise<{ conversation: Conversation; message?: Message } | null> => {
      setLoading(true);
      setError(null);

      try {
        const adapter = getMessagingAdapter();
        const conversation = await adapter.getOrCreateConversation({
          context: params.context,
          participant: params.participant,
        });

        let message: Message | undefined;
        if (params.initialMessage?.trim()) {
          message = await adapter.sendMessage(
            conversation.id,
            params.initialMessage.trim()
          );
        }

        return { conversation, message };
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { startConversation, loading, error };
}

/**
 * Hook to get unread counts
 */
export function useUnreadCounts() {
  const [totalUnread, setTotalUnread] = React.useState(0);
  const [unreadConversations, setUnreadConversations] = React.useState<Conversation[]>([]);

  const load = React.useCallback(async () => {
    try {
      const adapter = getMessagingAdapter();
      const [count, convs] = await Promise.all([
        adapter.getTotalUnreadCount(),
        adapter.getUnreadConversations(),
      ]);
      setTotalUnread(count);
      setUnreadConversations(convs);
    } catch {
      // Silently fail
    }
  }, []);

  React.useEffect(() => {
    load();
    // Poll for updates every 2 seconds
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, [load]);

  return { totalUnread, unreadConversations, refresh: load };
}

/**
 * Hook to mark conversations as read
 */
export function useMarkRead() {
  const markRead = React.useCallback(async (conversationId: string) => {
    const adapter = getMessagingAdapter();
    await adapter.markConversationRead(conversationId);
  }, []);

  const markAllRead = React.useCallback(async () => {
    const adapter = getMessagingAdapter();
    await adapter.markAllRead();
  }, []);

  return { markRead, markAllRead };
}

/**
 * Hook for demo mode: add simulated breeder replies
 */
export function useAddDemoReply() {
  const addReply = React.useCallback(
    (conversationId: string, content: string): Message => {
      return store.addBreederReply(conversationId, content);
    },
    []
  );

  return { addReply };
}
