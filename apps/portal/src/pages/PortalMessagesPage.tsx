// apps/portal/src/pages/PortalMessagesPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { PageScaffold } from "../design/PageScaffold";
import { PortalHero } from "../design/PortalHero";
import { PortalCard, CardRow } from "../design/PortalCard";
import { Button } from "../design/Button";
import { makeApi } from "@bhq/api";
import type { MessageThread, Message } from "@bhq/api";
import { isPortalMockEnabled } from "../dev/mockFlag";
import { mockThreads, mockThreadDetail, mockOffspring } from "../dev/mockData";
import { SubjectHeader } from "../components/SubjectHeader";

// Resolve API base URL
function getApiBase(): string {
  const envBase = (import.meta.env.VITE_API_BASE_URL as string) || "";
  if (envBase.trim()) {
    return normalizeBase(envBase);
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

function getCurrentPartyId(): number | null {
  const w = window as any;
  return w.platform?.currentOrgId || 200; // Default to mock party ID in demo
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
 * Thread Detail View - Flat, structured, action-oriented
 * ──────────────────────────────────────────────────────────────────────────── */

interface ThreadDetailProps {
  thread: any;
  currentPartyId: number | null;
  onBack: () => void;
  animalName: string;
  species: string | null;
  breed: string | null;
}

function ThreadDetail({ thread, currentPartyId, onBack, animalName, species, breed }: ThreadDetailProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);

  // Scroll to bottom on mount (show latest message)
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

  // Handle contact breeder action
  const handleContactBreeder = () => {
    // Could open email client, navigate to contact form, etc.
    // For now, we'll use a generic mailto if email is available
    const breederEmail = otherParticipant?.email || otherParticipant?.party?.email;
    if (breederEmail) {
      window.location.href = `mailto:${breederEmail}?subject=Re: ${thread.subject || animalName}`;
    } else {
      // Fallback: scroll to show the thread info
      alert(`Please contact ${otherName} to continue this conversation.`);
    }
  };

  return (
    <PageScaffold
      title={thread.subject || `Conversation with ${otherName}`}
      backLabel="Messages"
      onBack={onBack}
    >
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
                No messages in this conversation yet.
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

      {/* Action Footer - Sticky */}
      <div
        style={{
          marginTop: "var(--portal-space-3)",
          padding: "var(--portal-space-3)",
          background: "var(--portal-bg-card)",
          border: "1px solid var(--portal-border-subtle)",
          borderRadius: "var(--portal-radius-lg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--portal-space-3)",
        }}
      >
        <span
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-text-secondary)",
          }}
        >
          Need to reply?
        </span>
        <Button variant="primary" onClick={handleContactBreeder}>
          Contact {otherName}
        </Button>
      </div>
    </PageScaffold>
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
  const [threads, setThreads] = React.useState<any[]>([]);
  const [selectedThread, setSelectedThread] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [threadLoading, setThreadLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const currentPartyId = getCurrentPartyId();
  const mockEnabled = isPortalMockEnabled();

  // Get primary animal for context (species-aware)
  const offspring = mockEnabled ? mockOffspring() : [];
  const primaryAnimal = offspring[0];
  const animalName = primaryAnimal?.offspring?.name || "your puppy";
  const species = primaryAnimal?.offspring?.species || null;
  const breed = primaryAnimal?.offspring?.breed || null;

  const loadThreads = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.messages.threads.list();
      const fetchedThreads = res?.threads || [];

      // Use mock data if empty and demo mode enabled
      if (fetchedThreads.length === 0 && mockEnabled) {
        setThreads(mockThreads());
      } else {
        setThreads(fetchedThreads);
      }

      // Handle URL thread ID
      const urlThreadId = getThreadIdFromUrl();
      if (urlThreadId) {
        const allThreads = fetchedThreads.length === 0 && mockEnabled ? mockThreads() : fetchedThreads;
        const threadInList = allThreads.find((t: any) => t.id === urlThreadId);
        if (threadInList) {
          loadThread(urlThreadId);
        } else {
          setThreadIdInUrl(null);
        }
      }
    } catch (err: any) {
      console.error("[PortalMessagesPage] Failed to load threads:", err);
      if (mockEnabled) {
        setThreads(mockThreads());
      } else {
        setError("Failed to load messages");
      }
    } finally {
      setLoading(false);
    }
  }, [mockEnabled]);

  const loadThread = React.useCallback(async (id: number) => {
    setThreadLoading(true);
    try {
      const res = await api.messages.threads.get(id);
      if (!res?.thread) {
        if (mockEnabled) {
          setSelectedThread(mockThreadDetail(id));
        } else {
          throw new Error("Thread not found");
        }
      } else {
        setSelectedThread(res.thread);
      }
      setThreadIdInUrl(id);
    } catch (err: any) {
      console.error("[PortalMessagesPage] Failed to load thread:", err);
      if (mockEnabled) {
        setSelectedThread(mockThreadDetail(id));
        setThreadIdInUrl(id);
      } else {
        setError("Failed to load conversation");
      }
    } finally {
      setThreadLoading(false);
    }
  }, [mockEnabled]);

  React.useEffect(() => {
    loadThreads();
  }, [loadThreads]);

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
