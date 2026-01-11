// apps/portal/src/pages/PortalMessageThreadPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { SectionCard } from "../design/SectionCard";
import { Button } from "../design/Button";
import { PortalCard } from "../design/PortalCard";
import { useWebSocket, type WebSocketEvent } from "../hooks/useWebSocket";
import { createPortalFetch, useTenantContext } from "../derived/tenantContext";

function getCurrentPartyId(): number | null {
  const w = window as any;
  return w.platform?.currentOrgId || null;
}

// Extract thread ID from URL path (e.g., /messages/123 or /t/tenant/messages/123)
function getThreadIdFromUrl(): number | null {
  const pathname = window.location.pathname;
  // Match both /messages/:id and /t/:slug/messages/:id patterns
  const match = pathname.match(/\/messages\/(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
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

// Types
interface Message {
  id: number;
  body: string;
  senderPartyId: number;
  createdAt: string;
  sentAt?: string;
  isFromClient?: boolean;
}

interface Participant {
  partyId: number;
  party?: { id: number; name: string; email: string | null; type: string | null };
  name?: string;
}

interface Thread {
  id: number;
  subject: string | null;
  lastMessageAt: string | null;
  participants: Participant[];
  messages: Message[];
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
 * Message Bubble
 * ──────────────────────────────────────────────────────────────────────────── */

interface MessageBubbleProps {
  message: Message;
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
 * Back Button
 * ──────────────────────────────────────────────────────────────────────────── */

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: "none",
        border: "none",
        padding: 0,
        fontSize: "var(--portal-font-size-sm)",
        color: "var(--portal-text-secondary)",
        cursor: "pointer",
        transition: "color var(--portal-transition)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--portal-text-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--portal-text-secondary)";
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10 12L6 8L10 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back to Messages
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ──────────────────────────────────────────────────────────────────────────── */

export default function PortalMessageThreadPage() {
  const { tenantSlug, isReady } = useTenantContext();
  const [thread, setThread] = React.useState<Thread | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [sendError, setSendError] = React.useState<string | null>(null);

  const messagesContainerRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const threadId = getThreadIdFromUrl();
  const currentPartyId = getCurrentPartyId();

  // Create bound fetch function
  const portalFetch = React.useMemo(
    () => createPortalFetch(tenantSlug),
    [tenantSlug]
  );

  // Load thread data - wait for tenant context
  React.useEffect(() => {
    if (!isReady) return;

    async function loadThread() {
      if (!threadId) {
        setError("Invalid thread ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await portalFetch<{ thread: Thread }>(`/messages/threads/${threadId}`);
        if (!res?.thread) {
          throw new Error("Thread not found");
        }
        setThread(res.thread);
      } catch (err: any) {
        console.error("[PortalMessageThread] Failed to load:", err);
        setError(err?.message || "Failed to load conversation");
      } finally {
        setLoading(false);
      }
    }

    loadThread();
  }, [threadId, portalFetch, isReady]);

  // Scroll to bottom when messages update
  React.useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [thread?.messages]);

  // WebSocket handler for real-time updates
  const handleWebSocketMessage = React.useCallback(
    (event: WebSocketEvent) => {
      if (event.event === "new_message") {
        const { threadId: msgThreadId, message } = event.payload;
        console.log("[PortalMessageThread WS] New message:", msgThreadId, message.id);

        // Only handle messages for this thread
        if (msgThreadId === threadId) {
          setThread((prev) => {
            if (!prev) return null;
            // Check if message already exists
            if (prev.messages?.some((m) => m.id === message.id)) {
              return prev;
            }
            return {
              ...prev,
              messages: [
                ...prev.messages,
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
    },
    [threadId]
  );

  // Connect to WebSocket for real-time updates
  useWebSocket({
    onMessage: handleWebSocketMessage,
    onConnect: () => console.log("[PortalMessageThread] WebSocket connected"),
    onDisconnect: () => console.log("[PortalMessageThread] WebSocket disconnected"),
  });

  const handleBack = () => {
    window.history.pushState({}, "", "/messages");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  // Handle sending a reply
  const handleSendReply = async () => {
    const trimmedText = replyText.trim();
    if (!trimmedText || sending || !threadId) return;

    setSending(true);
    setSendError(null);

    try {
      const response = await portalFetch<{ ok: boolean; message: Message }>(
        `/messages/threads/${threadId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ body: trimmedText }),
        }
      );

      if (response?.ok && response.message) {
        // Clear the input
        setReplyText("");
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
        // Add message to thread
        setThread((prev) => {
          if (!prev) return null;
          // Check if message already exists
          if (prev.messages?.some((m) => m.id === response.message.id)) {
            return prev;
          }
          return {
            ...prev,
            messages: [
              ...prev.messages,
              {
                ...response.message,
                isFromClient: true,
              },
            ],
          };
        });
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
      console.error("[PortalMessageThread] Failed to send reply:", err);
      setSendError(err?.message || "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSendReply();
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <BackButton onClick={handleBack} />
        <div
          style={{
            height: "200px",
            background: "var(--portal-bg-elevated)",
            borderRadius: "var(--portal-radius-lg)",
            marginTop: "var(--portal-space-4)",
          }}
        />
      </PageContainer>
    );
  }

  // Error state
  if (error || !thread) {
    return (
      <PageContainer>
        <BackButton onClick={handleBack} />
        <SectionCard>
          <p style={{ color: "var(--portal-text-secondary)", margin: 0 }}>
            {error || "Conversation not found"}
          </p>
        </SectionCard>
      </PageContainer>
    );
  }

  // Get other participant info
  const otherParticipant = thread.participants?.find((p) => p.partyId !== currentPartyId);
  const otherName = otherParticipant?.party?.name || otherParticipant?.name || "Breeder";

  // Build messages with date separators
  const messagesWithSeparators: Array<
    { type: "date"; date: string } | { type: "message"; msg: Message; isOwn: boolean }
  > = [];
  let lastDateKey: string | null = null;

  for (const msg of thread.messages) {
    const dateKey = getDateKey(msg.sentAt || msg.createdAt);
    if (dateKey !== lastDateKey) {
      messagesWithSeparators.push({ type: "date", date: msg.sentAt || msg.createdAt });
      lastDateKey = dateKey;
    }
    const isOwn = msg.isFromClient || msg.senderPartyId === currentPartyId;
    messagesWithSeparators.push({ type: "message", msg, isOwn });
  }

  return (
    <PageContainer>
      <BackButton onClick={handleBack} />

      {/* Header */}
      <div
        style={{
          marginTop: "var(--portal-space-4)",
          marginBottom: "var(--portal-space-4)",
        }}
      >
        <h1
          style={{
            fontSize: "var(--portal-font-size-xl)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            margin: 0,
          }}
        >
          {thread.subject || `Conversation with ${otherName}`}
        </h1>
        <p
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-text-secondary)",
            margin: "4px 0 0 0",
          }}
        >
          with {otherName}
        </p>
      </div>

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
                No messages in this conversation yet. Send a message below to start.
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
            </>
          )}
        </div>
      </PortalCard>

      {/* Reply Input */}
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
          <Button variant="primary" onClick={handleSendReply} disabled={!replyText.trim() || sending}>
            {sending ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
