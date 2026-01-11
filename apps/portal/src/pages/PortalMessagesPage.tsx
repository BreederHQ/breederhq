// apps/portal/src/pages/PortalMessagesPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { PageScaffold } from "../design/PageScaffold";
import { PortalHero } from "../design/PortalHero";
import { PortalCard, CardRow } from "../design/PortalCard";
import { Button } from "../design/Button";
import type { MessageThread, Message } from "@bhq/api";
import { SubjectHeader } from "../components/SubjectHeader";
import { useWebSocket, type WebSocketEvent } from "../hooks/useWebSocket";
import { createPortalFetch, useTenantContext } from "../derived/tenantContext";

function getCurrentPartyId(): number | null {
  const w = window as any;
  return w.platform?.currentOrgId || null;
}

function getThreadIdFromUrl(): number | null {
  const params = new URLSearchParams(window.location.search);
  const val = params.get("threadId");
  if (!val) return null;
  const parsed = parseInt(val, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function setThreadIdInUrl(threadId: number | null): void {
  const url = new URL(window.location.href);
  if (threadId != null) {
    url.searchParams.set("threadId", String(threadId));
  } else {
    url.searchParams.delete("threadId");
  }
  window.history.replaceState({}, "", url.toString());
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (messageDate.getTime() === today.getTime()) return "Today";
  if (messageDate.getTime() === yesterday.getTime()) return "Yesterday";

  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function getDateKey(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Thread List Item
 * ──────────────────────────────────────────────────────────────────────────── */

interface ThreadListItemProps {
  thread: any;
  onClick: () => void;
  currentPartyId: number | null;
}

function ThreadListItem({ thread, onClick, currentPartyId }: ThreadListItemProps) {
  const otherParticipant = thread.participants?.find(
    (p: any) => p.partyId !== currentPartyId
  );
  const otherName = otherParticipant?.name || otherParticipant?.party?.name || "Breeder";
  const lastMessage = thread.messages?.[thread.messages.length - 1];
  const preview = lastMessage?.body
    ? lastMessage.body.length > 60
      ? `${lastMessage.body.slice(0, 60)}...`
      : lastMessage.body
    : "No messages yet";
  const hasUnread = (thread.unreadCount ?? 0) > 0;
  const timeStr = thread.lastMessageAt
    ? formatRelativeTime(thread.lastMessageAt)
    : "";

  return (
    <CardRow onClick={onClick}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--portal-space-3)" }}>
        {/* Avatar - flat design */}
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "var(--portal-bg-elevated)",
            border: "1px solid var(--portal-border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "var(--portal-font-size-base)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-secondary)",
            flexShrink: 0,
          }}
        >
          {otherName[0]?.toUpperCase() || "B"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--portal-space-2)",
              marginBottom: "2px",
            }}
          >
            <div
              style={{
                fontSize: "var(--portal-font-size-base)",
                fontWeight: "var(--portal-font-weight-semibold)",
                color: "var(--portal-text-primary)",
              }}
            >
              {thread.subject || `Conversation with ${otherName}`}
            </div>
            {hasUnread && (
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "var(--portal-accent)",
                  flexShrink: 0,
                }}
              />
            )}
          </div>

          <div
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-secondary)",
              marginBottom: "4px",
            }}
          >
            {otherName}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "var(--portal-space-2)",
            }}
          >
            <div
              style={{
                fontSize: "var(--portal-font-size-sm)",
                color: "var(--portal-text-tertiary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {preview}
            </div>
            {timeStr && (
              <div
                style={{
                  fontSize: "var(--portal-font-size-xs)",
                  color: "var(--portal-text-tertiary)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {timeStr}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-accent)",
            alignSelf: "center",
          }}
        >
          →
        </div>
      </div>
    </CardRow>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Date Separator
 * ──────────────────────────────────────────────────────────────────────────── */

function DateSeparator({ date }: { date: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--portal-space-3)",
        margin: "var(--portal-space-3) 0",
      }}
    >
      <div style={{ flex: 1, height: "1px", background: "var(--portal-border-subtle)" }} />
      <span
        style={{
          fontSize: "var(--portal-font-size-xs)",
          color: "var(--portal-text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {formatDateSeparator(date)}
      </span>
      <div style={{ flex: 1, height: "1px", background: "var(--portal-border-subtle)" }} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Message Bubble - Flat design, no gradients
 * ──────────────────────────────────────────────────────────────────────────── */

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  senderName: string;
}

function MessageBubble({ message, isOwn, senderName }: MessageBubbleProps) {
  const timeStr = formatMessageTime(message.sentAt || message.createdAt);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isOwn ? "flex-start" : "flex-end",
        marginBottom: "var(--portal-space-2)",
      }}
    >
      <div
        style={{
          maxWidth: "80%",
          display: "flex",
          flexDirection: "column",
          alignItems: isOwn ? "flex-start" : "flex-end",
        }}
      >
        <div
          style={{
            padding: "var(--portal-space-2) var(--portal-space-3)",
            borderRadius: "var(--portal-radius-lg)",
            fontSize: "var(--portal-font-size-sm)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            lineHeight: "1.5",
            background: isOwn ? "var(--portal-bg-elevated)" : "var(--portal-accent-muted)",
            border: "1px solid var(--portal-border-subtle)",
            color: "var(--portal-text-primary)",
          }}
        >
          {message.body}
        </div>
        <div
          style={{
            fontSize: "var(--portal-font-size-xs)",
            color: "var(--portal-text-tertiary)",
            marginTop: "2px",
            paddingLeft: "var(--portal-space-1)",
            paddingRight: "var(--portal-space-1)",
          }}
        >
          {isOwn ? "You" : senderName} · {timeStr}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Thread Detail View - Flat, structured, action-oriented with inline reply
 * ──────────────────────────────────────────────────────────────────────────── */

interface ThreadDetailProps {
  thread: any;
  currentPartyId: number | null;
  onBack: () => void;
  animalName: string;
  species: string | null;
  breed: string | null;
  onMessageSent: (message: any) => void;
  portalFetch: <T>(endpoint: string, options?: RequestInit) => Promise<T>;
}

function ThreadDetail({ thread, currentPartyId, onBack, animalName, species, breed, onMessageSent, portalFetch }: ThreadDetailProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [replyText, setReplyText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [sendError, setSendError] = React.useState<string | null>(null);

  // Scroll to bottom on mount and when new messages arrive
  React.useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [thread.messages]);

  const otherParticipant = thread.participants?.find(
    (p: any) => p.partyId !== currentPartyId
  );
  const otherName = otherParticipant?.name || otherParticipant?.party?.name || "Breeder";

  // Build messages with date separators
  const messagesWithSeparators: Array<{ type: "date"; date: string } | { type: "message"; msg: any; isOwn: boolean }> = [];
  let lastDateKey: string | null = null;

  for (const msg of thread.messages) {
    const dateKey = getDateKey(msg.sentAt || msg.createdAt);
    if (dateKey !== lastDateKey) {
      messagesWithSeparators.push({ type: "date", date: msg.sentAt || msg.createdAt });
      lastDateKey = dateKey;
    }
    const isOwn = msg.isFromClient || msg.senderPartyId === currentPartyId || msg.fromPartyId === currentPartyId;
    messagesWithSeparators.push({ type: "message", msg, isOwn });
  }

  // Handle sending a reply
  const handleSendReply = async () => {
    const trimmedText = replyText.trim();
    if (!trimmedText || sending) return;

    setSending(true);
    setSendError(null);

    try {
      const response = await portalFetch<{ ok: boolean; message: any }>(
        `/messages/threads/${thread.id}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ body: trimmedText }),
        }
      );

      if (response?.ok && response.message) {
        // Clear the input
        setReplyText("");
        // Notify parent to update the thread
        onMessageSent(response.message);
        // Scroll to bottom
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 100);
      } else {
        setSendError("Failed to send message. Please try again.");
      }
    } catch (err: any) {
      console.error("[PortalMessages] Failed to send reply:", err);
      setSendError(err?.message || "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Enter to send
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSendReply();
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyText(e.target.value);
    // Reset height to auto to get the correct scrollHeight
    e.target.style.height = "auto";
    // Set height to scrollHeight, capped at 150px
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  return (
    <PageContainer>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          all: "unset",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--portal-space-1)",
          color: "var(--portal-text-secondary)",
          fontSize: "var(--portal-font-size-sm)",
          marginBottom: "var(--portal-space-3)",
        }}
      >
        ← Messages
      </button>

      {/* Page title */}
      <h1
        style={{
          fontSize: "var(--portal-font-size-xl)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          margin: "0 0 var(--portal-space-3) 0",
        }}
      >
        {thread.subject || `Conversation with ${otherName}`}
      </h1>

      {/* Subject Header - Species-aware context */}
      <SubjectHeader
        name={animalName}
        species={species}
        breed={breed}
        statusLabel={`with ${otherName}`}
        statusVariant="neutral"
        size="compact"
      />

      {/* Messages Timeline */}
      <PortalCard variant="flat" padding="md">
        <div
          ref={messagesContainerRef}
          style={{
            maxHeight: "50vh",
            overflowY: "auto",
            paddingRight: "var(--portal-space-2)",
          }}
          role="log"
          aria-label="Message history"
        >
          {thread.messages.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "var(--portal-space-6)",
              }}
            >
              <div
                style={{
                  fontSize: "var(--portal-font-size-sm)",
                  color: "var(--portal-text-secondary)",
                }}
              >
                No messages in this conversation yet. Send a message below to start the conversation.
              </div>
            </div>
          ) : (
            <>
              {messagesWithSeparators.map((item, idx) => {
                if (item.type === "date") {
                  return <DateSeparator key={`date-${idx}`} date={item.date} />;
                }
                return (
                  <MessageBubble
                    key={item.msg.id}
                    message={item.msg}
                    isOwn={item.isOwn}
                    senderName={otherName}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </PortalCard>

      {/* Reply Input - Inline compose */}
      <div
        style={{
          marginTop: "var(--portal-space-3)",
          background: "var(--portal-bg-card)",
          border: "1px solid var(--portal-border-subtle)",
          borderRadius: "var(--portal-radius-lg)",
          overflow: "hidden",
        }}
      >
        {/* Error message */}
        {sendError && (
          <div
            style={{
              padding: "var(--portal-space-2) var(--portal-space-3)",
              background: "var(--portal-error-soft)",
              color: "var(--portal-error)",
              fontSize: "var(--portal-font-size-sm)",
              borderBottom: "1px solid var(--portal-border-subtle)",
            }}
          >
            {sendError}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={replyText}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={`Reply to ${otherName}...`}
          disabled={sending}
          style={{
            width: "100%",
            minHeight: "60px",
            maxHeight: "150px",
            padding: "var(--portal-space-3)",
            border: "none",
            outline: "none",
            resize: "none",
            fontFamily: "inherit",
            fontSize: "var(--portal-font-size-sm)",
            lineHeight: "1.5",
            color: "var(--portal-text-primary)",
            background: "transparent",
          }}
          rows={2}
        />

        {/* Footer with send button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--portal-space-2) var(--portal-space-3)",
            borderTop: "1px solid var(--portal-border-subtle)",
            background: "var(--portal-bg-elevated)",
          }}
        >
          <span
            style={{
              fontSize: "var(--portal-font-size-xs)",
              color: "var(--portal-text-tertiary)",
            }}
          >
            Press Ctrl+Enter to send
          </span>
          <Button
            variant="primary"
            onClick={handleSendReply}
            disabled={!replyText.trim() || sending}
          >
            {sending ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Loading State
 * ──────────────────────────────────────────────────────────────────────────── */

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
      <div
        style={{
          height: "120px",
          background: "var(--portal-bg-elevated)",
          borderRadius: "var(--portal-radius-xl)",
        }}
      />
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: "100px",
            background: "var(--portal-bg-elevated)",
            borderRadius: "var(--portal-radius-lg)",
          }}
        />
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Empty State
 * ──────────────────────────────────────────────────────────────────────────── */

function EmptyMessages({ animalName }: { animalName: string }) {
  return (
    <PortalCard variant="flat" padding="lg">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "var(--portal-space-6)",
          gap: "var(--portal-space-3)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "var(--portal-accent-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
          }}
        >
          💬
        </div>
        <h3
          style={{
            fontSize: "var(--portal-font-size-lg)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            margin: 0,
          }}
        >
          No messages yet
        </h3>
        <p
          style={{
            fontSize: "var(--portal-font-size-base)",
            color: "var(--portal-text-secondary)",
            margin: 0,
            maxWidth: "320px",
          }}
        >
          Messages about {animalName}'s journey will appear here when the breeder contacts you.
        </p>
      </div>
    </PortalCard>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ──────────────────────────────────────────────────────────────────────────── */

export default function PortalMessagesPage() {
  const { tenantSlug, isReady } = useTenantContext();
  const [threads, setThreads] = React.useState<any[]>([]);
  const [selectedThread, setSelectedThread] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [threadLoading, setThreadLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [primaryAnimal, setPrimaryAnimal] = React.useState<any>(null);
  const currentPartyId = getCurrentPartyId();

  // Create bound fetch function
  const portalFetch = React.useMemo(
    () => createPortalFetch(tenantSlug),
    [tenantSlug]
  );

  // Animal context from API
  const animalName = primaryAnimal?.offspring?.name || "your reservation";
  const species = primaryAnimal?.offspring?.species || primaryAnimal?.species || null;
  const breed = primaryAnimal?.offspring?.breed || primaryAnimal?.breed || null;

  // Load primary animal context - wait for tenant context
  React.useEffect(() => {
    if (!isReady) return;

    let cancelled = false;

    async function loadAnimalContext() {
      try {
        const res = await portalFetch<{ placements: any[] }>("/portal/placements");
        if (cancelled) return;
        const placements = res?.placements || [];
        if (placements.length > 0) {
          setPrimaryAnimal(placements[0]);
        }
      } catch (err) {
        // Silently ignore - animal context is optional for display
      }
    }
    loadAnimalContext();
    return () => { cancelled = true; };
  }, [portalFetch, isReady]);

  const loadThreads = React.useCallback(async () => {
    if (!isReady) return;

    setLoading(true);
    setError(null);
    try {
      const res = await portalFetch<{ threads: any[] }>("/messages/threads");
      const fetchedThreads = res?.threads || [];
      setThreads(fetchedThreads);

      // Handle URL thread ID
      const urlThreadId = getThreadIdFromUrl();
      if (urlThreadId) {
        const threadInList = fetchedThreads.find((t: any) => t.id === urlThreadId);
        if (threadInList) {
          loadThread(urlThreadId);
        } else {
          setThreadIdInUrl(null);
        }
      }
    } catch (err: any) {
      console.error("[PortalMessagesPage] Failed to load threads:", err);
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [portalFetch, isReady]);

  const loadThread = React.useCallback(async (id: number) => {
    setThreadLoading(true);
    try {
      const res = await portalFetch<{ thread: any }>(`/messages/threads/${id}`);
      if (!res?.thread) {
        throw new Error("Thread not found");
      }
      setSelectedThread(res.thread);
      setThreadIdInUrl(id);
    } catch (err: any) {
      console.error("[PortalMessagesPage] Failed to load thread:", err);
      setError("Failed to load conversation");
    } finally {
      setThreadLoading(false);
    }
  }, [portalFetch]);

  React.useEffect(() => {
    if (isReady) {
      loadThreads();
    }
  }, [loadThreads, isReady]);

  // WebSocket handler for real-time updates
  const handleWebSocketMessage = React.useCallback((event: WebSocketEvent) => {
    if (event.event === "new_message") {
      const { threadId, message } = event.payload;
      console.log("[Portal WS] New message received:", threadId, message.id);

      // Refresh thread list to show new message
      loadThreads();

      // If this thread is currently selected, add the message to the view
      if (selectedThread?.id === threadId) {
        setSelectedThread((prev: any) => {
          if (!prev) return null;
          // Check if message already exists
          if (prev.messages?.some((m: any) => m.id === message.id)) {
            return prev;
          }
          return {
            ...prev,
            messages: [
              ...(prev.messages || []),
              {
                id: message.id,
                body: message.body,
                senderPartyId: message.senderPartyId,
                createdAt: message.createdAt,
              },
            ],
          };
        });
      }
    }
  }, [loadThreads, selectedThread?.id]);

  // Connect to WebSocket for real-time updates
  useWebSocket({
    onMessage: handleWebSocketMessage,
    onConnect: () => console.log("[Portal] WebSocket connected"),
    onDisconnect: () => console.log("[Portal] WebSocket disconnected"),
  });

  const handleSelectThread = (thread: any) => {
    loadThread(thread.id);
  };

  const handleBack = () => {
    setSelectedThread(null);
    setThreadIdInUrl(null);
  };

  const unreadCount = threads.filter((t) => (t.unreadCount || 0) > 0).length;

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  // Error state
  if (error && !selectedThread) {
    return (
      <PageContainer>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            minHeight: "60vh",
            gap: "var(--portal-space-3)",
          }}
        >
          <div
            style={{
              fontSize: "var(--portal-font-size-xl)",
              fontWeight: "var(--portal-font-weight-semibold)",
              color: "var(--portal-text-primary)",
            }}
          >
            Unable to load messages
          </div>
          <button
            onClick={loadThreads}
            style={{
              padding: "var(--portal-space-2) var(--portal-space-4)",
              background: "var(--portal-accent)",
              color: "var(--portal-text-primary)",
              border: "none",
              borderRadius: "var(--portal-radius-md)",
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-medium)",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </PageContainer>
    );
  }

  // Handle message sent from ThreadDetail
  const handleMessageSent = React.useCallback((message: any) => {
    // Add message to selected thread's messages list
    setSelectedThread((prev: any) => {
      if (!prev) return null;
      // Check if message already exists
      if (prev.messages?.some((m: any) => m.id === message.id)) {
        return prev;
      }
      return {
        ...prev,
        messages: [
          ...(prev.messages || []),
          {
            id: message.id,
            body: message.body,
            senderPartyId: message.senderPartyId,
            createdAt: message.createdAt,
            isFromClient: true, // Mark as sent by portal user
          },
        ],
      };
    });
    // Also refresh threads list to update preview/timestamps
    loadThreads();
  }, [loadThreads]);

  // Thread detail view
  if (selectedThread) {
    if (threadLoading) {
      return (
        <PageContainer>
          <LoadingState />
        </PageContainer>
      );
    }

    return (
      <ThreadDetail
        thread={selectedThread}
        currentPartyId={currentPartyId}
        onBack={handleBack}
        animalName={animalName}
        species={species}
        breed={breed}
        onMessageSent={handleMessageSent}
        portalFetch={portalFetch}
      />
    );
  }

  // Thread list view
  return (
    <PageContainer>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
        {/* Hero */}
        <PortalHero
          variant="page"
          title="Messages"
          subtitle={`Stay connected about ${animalName}'s journey`}
          animalContext={animalName}
          status={unreadCount > 0 ? "action" : undefined}
          statusLabel={unreadCount > 0 ? `${unreadCount} unread` : undefined}
        />

        {/* Subject Header - Species-aware context */}
        <SubjectHeader
          name={animalName}
          species={species}
          breed={breed}
          statusLabel={unreadCount > 0 ? `${unreadCount} unread` : "All read"}
          statusVariant={unreadCount > 0 ? "action" : "success"}
        />

        {/* Thread List */}
        {threads.length === 0 ? (
          <EmptyMessages animalName={animalName} />
        ) : (
          <PortalCard variant="elevated" padding="none">
            {threads.map((thread, index) => (
              <ThreadListItem
                key={thread.id}
                thread={thread}
                onClick={() => handleSelectThread(thread)}
                currentPartyId={currentPartyId}
              />
            ))}
          </PortalCard>
        )}
      </div>
    </PageContainer>
  );
}
