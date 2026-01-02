// apps/portal/src/pages/PortalMessagesPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { makeApi } from "@bhq/api";
import type { MessageThread, Message } from "@bhq/api";

// Resolve API base URL (same pattern as taskSources)
function getApiBase(): string {
  const envBase = (import.meta.env.VITE_API_BASE_URL as string) || "";
  if (envBase.trim()) {
    return normalizeBase(envBase);
  }
  const w = window as any;
  const windowBase = String(w.__BHQ_API_BASE__ || "").trim();
  if (windowBase) {
    return normalizeBase(windowBase);
  }
  if (import.meta.env.DEV) {
    return "";
  }
  return normalizeBase(window.location.origin);
}

function normalizeBase(base: string): string {
  return base.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
}

const api = makeApi(getApiBase());

// Get current party ID from window context
function getCurrentPartyId(): number | null {
  const w = window as any;
  return w.platform?.currentOrgId || null;
}

// URL param handling
const THREAD_ID_PARAM = "threadId";

function getThreadIdFromUrl(): number | null {
  const params = new URLSearchParams(window.location.search);
  const val = params.get(THREAD_ID_PARAM);
  if (!val) return null;
  const parsed = parseInt(val, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function setThreadIdInUrl(threadId: number | null): void {
  const url = new URL(window.location.href);
  if (threadId != null) {
    url.searchParams.set(THREAD_ID_PARAM, String(threadId));
  } else {
    url.searchParams.delete(THREAD_ID_PARAM);
  }
  window.history.replaceState({}, "", url.toString());
}

// Format relative time
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

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Format message timestamp
function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Thread List Item Component
 * ────────────────────────────────────────────────────────────────────────── */

interface ThreadListItemProps {
  thread: MessageThread;
  isActive: boolean;
  onClick: () => void;
  currentPartyId: number | null;
}

function ThreadListItem({ thread, isActive, onClick, currentPartyId }: ThreadListItemProps) {
  const otherParticipant = thread.participants?.find(
    (p) => p.partyId !== currentPartyId
  );
  const otherName = otherParticipant?.party?.name || "Unknown contact";
  const lastMessage = thread.messages?.[thread.messages.length - 1];
  const preview = lastMessage?.body
    ? lastMessage.body.length > 80
      ? `${lastMessage.body.slice(0, 80)}...`
      : lastMessage.body
    : "No messages yet";
  const hasUnread = (thread.unreadCount ?? 0) > 0;
  const timeStr = lastMessage ? formatRelativeTime(lastMessage.createdAt) : "";

  return (
    <div
      onClick={onClick}
      style={{
        padding: "var(--portal-space-3)",
        borderBottom: "1px solid var(--portal-border-subtle)",
        cursor: "pointer",
        background: isActive ? "var(--portal-bg-elevated)" : "transparent",
        transition: "background var(--portal-transition)",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "var(--portal-bg-elevated)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      {hasUnread && (
        <div
          style={{
            position: "absolute",
            top: "var(--portal-space-3)",
            right: "var(--portal-space-3)",
            width: "8px",
            height: "8px",
            borderRadius: "var(--portal-radius-full)",
            background: "var(--portal-accent)",
          }}
        />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-1)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: "var(--portal-space-2)",
          }}
        >
          <div
            style={{
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-semibold)",
              color: "var(--portal-text-primary)",
            }}
          >
            {thread.subject || `Conversation with ${otherName}`}
          </div>
          {timeStr && (
            <div
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-tertiary)",
                whiteSpace: "nowrap",
              }}
            >
              {timeStr}
            </div>
          )}
        </div>
        <div
          style={{
            fontSize: "var(--portal-font-size-xs)",
            color: "var(--portal-text-secondary)",
          }}
        >
          {otherName}
        </div>
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
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Message Bubble Component
 * ────────────────────────────────────────────────────────────────────────── */

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const timeStr = formatMessageTime(message.createdAt);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isOwn ? "flex-end" : "flex-start",
        marginBottom: "var(--portal-space-3)",
      }}
    >
      <div
        style={{
          maxWidth: "70%",
          display: "flex",
          flexDirection: "column",
          alignItems: isOwn ? "flex-end" : "flex-start",
          gap: "var(--portal-space-1)",
        }}
      >
        <div
          style={{
            fontSize: "var(--portal-font-size-xs)",
            color: "var(--portal-text-tertiary)",
            paddingLeft: "var(--portal-space-2)",
            paddingRight: "var(--portal-space-2)",
          }}
        >
          {isOwn ? "You" : message.senderParty?.name || "Unknown"} · {timeStr}
        </div>
        <div
          style={{
            padding: "var(--portal-space-2) var(--portal-space-3)",
            borderRadius: "var(--portal-radius-lg)",
            fontSize: "var(--portal-font-size-sm)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            background: isOwn
              ? "rgba(211, 134, 91, 0.15)"
              : "var(--portal-bg-elevated)",
            border: `1px solid ${
              isOwn ? "rgba(211, 134, 91, 0.3)" : "var(--portal-border-subtle)"
            }`,
            color: "var(--portal-text-primary)",
          }}
        >
          {message.body}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Thread Detail View
 * ────────────────────────────────────────────────────────────────────────── */

interface ThreadDetailProps {
  thread: MessageThread;
  currentPartyId: number | null;
  onBack: () => void;
}

function ThreadDetail({ thread, currentPartyId, onBack }: ThreadDetailProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.messages]);

  const otherParticipant = thread.participants?.find(
    (p) => p.partyId !== currentPartyId
  );
  const otherName = otherParticipant?.party?.name || "Unknown contact";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "var(--portal-space-4)",
          borderBottom: "1px solid var(--portal-border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--portal-space-2)",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-text-secondary)",
            cursor: "pointer",
            alignSelf: "flex-start",
            transition: "color var(--portal-transition)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--portal-accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--portal-text-secondary)";
          }}
        >
          ← Back to messages
        </button>
        <div>
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
          <div
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-secondary)",
              marginTop: "var(--portal-space-1)",
            }}
          >
            {otherName}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "var(--portal-space-4)",
        }}
      >
        {thread.messages.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              minHeight: "200px",
              gap: "var(--portal-space-2)",
            }}
          >
            <div
              style={{
                fontSize: "var(--portal-font-size-base)",
                color: "var(--portal-text-secondary)",
              }}
            >
              No messages yet
            </div>
          </div>
        ) : (
          <>
            {thread.messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderPartyId === currentPartyId}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Footer - Read-only notice */}
      <div
        style={{
          padding: "var(--portal-space-4)",
          borderTop: "1px solid var(--portal-border-subtle)",
          background: "var(--portal-bg-elevated)",
        }}
      >
        <div
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-text-secondary)",
            textAlign: "center",
          }}
        >
          To reply to this message, please contact us directly
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Main Messages Page
 * ────────────────────────────────────────────────────────────────────────── */

export default function PortalMessagesPage() {
  const [threads, setThreads] = React.useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = React.useState<MessageThread | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [threadLoading, setThreadLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const currentPartyId = getCurrentPartyId();

  // Load threads list
  const loadThreads = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.messages.threads.list();
      const fetchedThreads = res?.threads || [];
      setThreads(fetchedThreads);

      // If URL has threadId, select it
      const urlThreadId = getThreadIdFromUrl();
      if (urlThreadId) {
        const threadInList = fetchedThreads.find((t) => t.id === urlThreadId);
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
  }, []);

  // Load single thread detail
  const loadThread = React.useCallback(async (id: number) => {
    setThreadLoading(true);
    try {
      const res = await api.messages.threads.get(id);
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
  }, []);

  // Initial load
  React.useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Handle thread selection
  const handleSelectThread = (thread: MessageThread) => {
    loadThread(thread.id);
  };

  const handleBack = () => {
    setSelectedThread(null);
    setThreadIdInUrl(null);
  };

  const handleRetry = () => {
    setError(null);
    loadThreads();
  };

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--portal-space-3)",
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                height: "80px",
                background: "var(--portal-bg-elevated)",
                borderRadius: "var(--portal-radius-lg)",
              }}
            />
          ))}
        </div>
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
          <div
            style={{
              fontSize: "var(--portal-font-size-base)",
              color: "var(--portal-text-secondary)",
            }}
          >
            {error}
          </div>
          <button
            onClick={handleRetry}
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

  // Empty state
  if (threads.length === 0) {
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
            gap: "var(--portal-space-2)",
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
            No messages
          </h1>
          <p
            style={{
              fontSize: "var(--portal-font-size-base)",
              color: "var(--portal-text-secondary)",
              margin: 0,
            }}
          >
            Messages from the breeder will appear here.
          </p>
        </div>
      </PageContainer>
    );
  }

  // Show thread detail if selected
  if (selectedThread) {
    if (threadLoading) {
      return (
        <PageContainer>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--portal-space-3)",
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: "60px",
                  background: "var(--portal-bg-elevated)",
                  borderRadius: "var(--portal-radius-lg)",
                }}
              />
            ))}
          </div>
        </PageContainer>
      );
    }

    return (
      <PageContainer>
        <ThreadDetail
          thread={selectedThread}
          currentPartyId={currentPartyId}
          onBack={handleBack}
        />
      </PageContainer>
    );
  }

  // Thread list view
  return (
    <PageContainer>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        {threads.map((thread) => (
          <ThreadListItem
            key={thread.id}
            thread={thread}
            isActive={false}
            onClick={() => handleSelectThread(thread)}
            currentPartyId={currentPartyId}
          />
        ))}
      </div>
    </PageContainer>
  );
}
