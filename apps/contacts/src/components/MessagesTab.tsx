// apps/contacts/src/components/MessagesTab.tsx
// Messages tab showing conversation threads with a contact/organization

import * as React from "react";
import { SectionCard, Button } from "@bhq/ui";
import { MessageSquare, Send, ChevronRight, Mail } from "lucide-react";
import type { MessageThread, Message } from "@bhq/api";

interface MessagesTabProps {
  partyId: number;
  partyEmail?: string | null;
  partyName: string;
  api: {
    messages: {
      threads: {
        list: () => Promise<{ threads: MessageThread[] }>;
        get: (id: number) => Promise<{ thread: MessageThread }>;
        create: (input: { recipientPartyId: number; initialMessage: string }) => Promise<{ ok?: boolean; thread: MessageThread }>;
        sendMessage: (threadId: number, input: { body: string }) => Promise<{ ok?: boolean; message: Message }>;
      };
    };
  };
  onComposeEmail?: () => void;
}

export function MessagesTab({ partyId, partyEmail, partyName, api, onComposeEmail }: MessagesTabProps) {
  const [threads, setThreads] = React.useState<MessageThread[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Selected thread
  const [selectedThread, setSelectedThread] = React.useState<MessageThread | null>(null);
  const [threadLoading, setThreadLoading] = React.useState(false);

  // New message
  const [newMessage, setNewMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);

  // Composing new thread
  const [isComposing, setIsComposing] = React.useState(false);
  const [composeMessage, setComposeMessage] = React.useState("");

  const loadThreads = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.messages.threads.list();
      // Filter threads that include this party
      const relevantThreads = (res.threads || []).filter((t) =>
        t.participants?.some((p) => p.partyId === partyId)
      );
      // Sort by most recent activity
      relevantThreads.sort((a, b) => {
        const aDate = (a as any).lastMessageAt || a.updatedAt || a.createdAt;
        const bDate = (b as any).lastMessageAt || b.updatedAt || b.createdAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
      setThreads(relevantThreads);
    } catch (e: any) {
      setError(e?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [api, partyId]);

  React.useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const loadThread = async (threadId: number) => {
    setThreadLoading(true);
    try {
      const res = await api.messages.threads.get(threadId);
      setSelectedThread(res.thread);
    } catch (e: any) {
      setError(e?.message || "Failed to load thread");
    } finally {
      setThreadLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedThread || !newMessage.trim() || sending) return;
    setSending(true);
    try {
      const res = await api.messages.threads.sendMessage(selectedThread.id, {
        body: newMessage.trim(),
      });
      setSelectedThread((prev) =>
        prev ? { ...prev, messages: [...prev.messages, res.message] } : prev
      );
      setNewMessage("");
    } catch (e: any) {
      setError(e?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleCreateThread = async () => {
    if (!composeMessage.trim() || sending) return;
    setSending(true);
    try {
      const res = await api.messages.threads.create({
        recipientPartyId: partyId,
        initialMessage: composeMessage.trim(),
      });
      setThreads((prev) => [res.thread, ...prev]);
      setSelectedThread(res.thread);
      setIsComposing(false);
      setComposeMessage("");
    } catch (e: any) {
      setError(e?.message || "Failed to create conversation");
    } finally {
      setSending(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    }
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;

    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedThread?.messages]);

  return (
    <div className="space-y-3">
      <SectionCard
        title={
          <span className="inline-flex items-center gap-2">
            <span className="text-lg opacity-70">💬</span>
            <span>Messages</span>
          </span>
        }
        right={
          <div className="flex items-center gap-2">
            {partyEmail && onComposeEmail && (
              <Button size="sm" variant="outline" onClick={onComposeEmail}>
                <Mail className="h-3.5 w-3.5 mr-1" />
                Email
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setIsComposing(true)}>
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              New Message
            </Button>
          </div>
        }
      >
        {error && (
          <div className="mb-3 px-3 py-2 rounded-md bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {error}
            <button className="ml-2 underline" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        )}

        {/* Compose new thread */}
        {isComposing && (
          <div className="mb-4 p-4 rounded-lg border border-[hsl(var(--brand-orange))]/30 bg-[hsl(var(--brand-orange))]/5">
            <div className="text-sm font-medium mb-2">New conversation with {partyName}</div>
            <textarea
              autoFocus
              value={composeMessage}
              onChange={(e) => setComposeMessage(e.target.value)}
              placeholder="Type your message..."
              rows={3}
              className="w-full px-3 py-2 rounded-md bg-surface border border-hairline text-sm text-primary resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
            />
            <div className="mt-2 flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsComposing(false);
                  setComposeMessage("");
                }}
                disabled={sending}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateThread} disabled={sending || !composeMessage.trim()}>
                {sending ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-sm text-secondary">Loading messages...</div>
        ) : selectedThread ? (
          /* Thread view */
          <div className="flex flex-col h-[400px]">
            {/* Thread header */}
            <div className="pb-3 border-b border-hairline flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedThread(null)}
                className="text-xs text-secondary hover:text-primary"
              >
                &larr; Back
              </button>
              <span className="text-xs text-secondary">|</span>
              <span className="text-sm font-medium">
                {selectedThread.subject || `Conversation with ${partyName}`}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {threadLoading ? (
                <div className="text-center text-sm text-secondary">Loading...</div>
              ) : (
                <>
                  {selectedThread.messages?.map((msg) => {
                    const isOwn = msg.senderPartyId !== partyId;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
                          <div
                            className={`px-3 py-2 rounded-lg text-sm ${
                              isOwn
                                ? "bg-[hsl(var(--brand-orange))]/20 border border-[hsl(var(--brand-orange))]/30"
                                : "bg-surface-strong border border-hairline"
                            }`}
                          >
                            {msg.body}
                          </div>
                          <div className="text-xs text-secondary px-1">{formatDate(msg.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Compose reply */}
            <div className="pt-3 border-t border-hairline">
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  rows={2}
                  className="flex-1 px-3 py-2 rounded-md bg-surface border border-hairline text-sm text-primary resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : threads.length === 0 ? (
          <div className="py-8 text-center">
            <MessageSquare className="h-10 w-10 mx-auto text-secondary/50 mb-3" />
            <div className="text-sm text-secondary mb-2">No conversations yet</div>
            <div className="text-xs text-secondary mb-4">Start a conversation with {partyName}</div>
            <Button size="sm" onClick={() => setIsComposing(true)}>
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              Start Conversation
            </Button>
          </div>
        ) : (
          /* Thread list */
          <div className="divide-y divide-hairline">
            {threads.map((thread) => {
              const lastMessage = thread.messages?.[thread.messages.length - 1];
              const preview = lastMessage?.body
                ? lastMessage.body.length > 80
                  ? `${lastMessage.body.slice(0, 80)}...`
                  : lastMessage.body
                : "No messages";
              const hasUnread = (thread.unreadCount ?? 0) > 0;

              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => {
                    loadThread(thread.id);
                  }}
                  className={`w-full text-left px-3 py-3 hover:bg-white/5 transition-colors flex items-center gap-3 ${
                    hasUnread ? "bg-[hsl(var(--brand-orange))]/5" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${hasUnread ? "text-[hsl(var(--brand-orange))]" : ""}`}>
                      {thread.subject || `Conversation`}
                    </div>
                    <div className={`text-xs mt-0.5 line-clamp-1 ${hasUnread ? "text-primary" : "text-secondary"}`}>
                      {preview}
                    </div>
                    <div className="text-xs text-secondary mt-1">
                      {formatDate((thread as any).lastMessageAt || thread.updatedAt || thread.createdAt)}
                    </div>
                  </div>
                  {hasUnread && (
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[hsl(var(--brand-orange))]" />
                  )}
                  <ChevronRight className="h-4 w-4 text-secondary flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
