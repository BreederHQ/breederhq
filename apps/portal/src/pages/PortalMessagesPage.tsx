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
import { isDemoMode, generateDemoData } from "../demo/portalDemoData";

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
  tenantSlug: string | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mime: string | null): string {
  if (!mime) return "📎";
  if (mime.startsWith("image/")) return "🖼️";
  if (mime === "application/pdf") return "📄";
  if (mime.includes("word") || mime.includes("document")) return "📝";
  if (mime.includes("excel") || mime.includes("spreadsheet")) return "📊";
  return "📎";
}

function MessageBubble({ message, isOwn, senderName, tenantSlug }: MessageBubbleProps) {
  const timeStr = formatMessageTime(message.sentAt || message.createdAt);
  const attachment = message.attachment;

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
          {attachment && (
            <a
              href={tenantSlug ? `/api/v1/t/${tenantSlug}${attachment.url}` : attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--portal-space-2)",
                marginTop: message.body ? "var(--portal-space-2)" : 0,
                padding: "var(--portal-space-2)",
                background: isOwn ? "var(--portal-bg-card)" : "var(--portal-bg-elevated)",
                borderRadius: "var(--portal-radius-md)",
                textDecoration: "none",
                color: "var(--portal-text-primary)",
                border: "1px solid var(--portal-border-subtle)",
              }}
            >
              <span style={{ fontSize: "1.25rem" }}>{getFileIcon(attachment.mime)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "var(--portal-font-size-sm)",
                    fontWeight: "var(--portal-font-weight-medium)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {attachment.filename}
                </div>
                <div
                  style={{
                    fontSize: "var(--portal-font-size-xs)",
                    color: "var(--portal-text-tertiary)",
                  }}
                >
                  {formatFileSize(attachment.bytes)}
                </div>
              </div>
              <span style={{ color: "var(--portal-accent)", fontSize: "0.875rem" }}>↓</span>
            </a>
          )}
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
  animalName: string | null;
  species: string | null;
  breed: string | null;
  onMessageSent: (message: any) => void;
  portalFetch: <T>(endpoint: string, options?: RequestInit) => Promise<T>;
  tenantSlug: string | null;
}

function ThreadDetail({ thread, currentPartyId, onBack, animalName, species, breed, onMessageSent, portalFetch, tenantSlug }: ThreadDetailProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [replyText, setReplyText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [sendError, setSendError] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

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

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setSendError("File too large. Maximum size is 10MB.");
        return;
      }
      setSelectedFile(file);
      setSendError(null);
    }
  };

  // Clear selected file
  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle sending a reply (with optional attachment)
  const handleSendReply = async () => {
    const trimmedText = replyText.trim();
    if ((!trimmedText && !selectedFile) || sending) return;

    setSending(true);
    setSendError(null);

    try {
      let response: { ok: boolean; message: any };

      if (selectedFile) {
        // Send with file attachment using multipart form
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("body", trimmedText);

        const apiUrl = tenantSlug
          ? `/api/v1/t/${tenantSlug}/messages/threads/${thread.id}/messages/upload`
          : `/api/v1/messages/threads/${thread.id}/messages/upload`;

        const res = await fetch(apiUrl, {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Upload failed: ${res.status}`);
        }

        response = await res.json();
      } else {
        // Text-only message
        response = await portalFetch<{ ok: boolean; message: any }>(
          `/messages/threads/${thread.id}/messages`,
          {
            method: "POST",
            body: JSON.stringify({ body: trimmedText }),
          }
        );
      }

      if (response?.ok && response.message) {
        // Clear the input
        setReplyText("");
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
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

      {/* Subject Header - Only show when we have real placement data */}
      {animalName && (
        <SubjectHeader
          name={animalName}
          species={species}
          breed={breed}
          statusLabel={`with ${otherName}`}
          statusVariant="neutral"
          size="compact"
        />
      )}

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
                    tenantSlug={tenantSlug}
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
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          style={{ display: "none" }}
        />

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

        {/* Selected file preview */}
        {selectedFile && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--portal-space-2)",
              padding: "var(--portal-space-2) var(--portal-space-3)",
              background: "var(--portal-bg-elevated)",
              borderBottom: "1px solid var(--portal-border-subtle)",
            }}
          >
            <span style={{ fontSize: "1.25rem" }}>{getFileIcon(selectedFile.type)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "var(--portal-font-size-sm)",
                  fontWeight: "var(--portal-font-weight-medium)",
                  color: "var(--portal-text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {selectedFile.name}
              </div>
              <div style={{ fontSize: "var(--portal-font-size-xs)", color: "var(--portal-text-tertiary)" }}>
                {formatFileSize(selectedFile.size)}
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearFile}
              style={{
                all: "unset",
                cursor: "pointer",
                padding: "var(--portal-space-1)",
                color: "var(--portal-text-tertiary)",
                fontSize: "1rem",
              }}
              aria-label="Remove file"
            >
              ✕
            </button>
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

        {/* Footer with attachment and send buttons */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "var(--portal-space-2)" }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              style={{
                all: "unset",
                cursor: sending ? "not-allowed" : "pointer",
                padding: "var(--portal-space-1) var(--portal-space-2)",
                borderRadius: "var(--portal-radius-sm)",
                color: "var(--portal-text-secondary)",
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "var(--portal-space-1)",
                opacity: sending ? 0.5 : 1,
              }}
              aria-label="Attach file"
              title="Attach file"
            >
              📎
              <span style={{ fontSize: "var(--portal-font-size-xs)" }}>Attach</span>
            </button>
            <span
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-tertiary)",
              }}
            >
              Ctrl+Enter to send
            </span>
          </div>
          <Button
            variant="primary"
            onClick={handleSendReply}
            disabled={(!replyText.trim() && !selectedFile) || sending}
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

interface EmptyMessagesProps {
  breederName: string | null;
  onStartConversation: () => void;
}

function EmptyMessages({ breederName, onStartConversation }: EmptyMessagesProps) {
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
          {breederName
            ? `Start a conversation with ${breederName}.`
            : "Start a conversation with your breeder."}
        </p>
        <Button variant="primary" onClick={onStartConversation}>
          Send a Message
        </Button>
      </div>
    </PortalCard>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Compose Message View
 * ──────────────────────────────────────────────────────────────────────────── */

interface ComposeMessageProps {
  breederName: string | null;
  breederPartyId: number;
  onBack: () => void;
  onMessageSent: (thread: any) => void;
  portalFetch: <T>(endpoint: string, options?: RequestInit) => Promise<T>;
  tenantSlug: string | null;
}

function ComposeMessage({ breederName, breederPartyId, onBack, onMessageSent, portalFetch, tenantSlug }: ComposeMessageProps) {
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Focus textarea on mount
  React.useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError("File too large. Maximum size is 10MB.");
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  // Clear selected file
  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if ((!trimmedMessage && !selectedFile) || sending) return;

    setSending(true);
    setError(null);

    try {
      // First create the thread with the initial message
      const response = await portalFetch<{ ok: boolean; thread: any }>(
        "/messages/threads",
        {
          method: "POST",
          body: JSON.stringify({
            recipientPartyId: breederPartyId,
            subject: subject.trim() || undefined,
            initialMessage: trimmedMessage || "Sent an attachment",
          }),
        }
      );

      if (response?.ok && response.thread) {
        // If we have a file, send it as a follow-up message in the new thread
        if (selectedFile) {
          const formData = new FormData();
          formData.append("file", selectedFile);
          formData.append("body", ""); // Empty body since message was sent with thread creation

          const apiUrl = tenantSlug
            ? `/api/v1/t/${tenantSlug}/messages/threads/${response.thread.id}/messages/upload`
            : `/api/v1/messages/threads/${response.thread.id}/messages/upload`;

          const uploadRes = await fetch(apiUrl, {
            method: "POST",
            credentials: "include",
            body: formData,
          });

          if (!uploadRes.ok) {
            console.warn("[ComposeMessage] File upload failed, but thread was created");
          }
        }
        onMessageSent(response.thread);
      } else {
        setError("Failed to send message. Please try again.");
      }
    } catch (err: any) {
      console.error("[ComposeMessage] Failed to send:", err);
      setError(err?.message || "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
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
        ← Back to Messages
      </button>

      {/* Page title */}
      <h1
        style={{
          fontSize: "var(--portal-font-size-xl)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          margin: "0 0 var(--portal-space-4) 0",
        }}
      >
        New Message
      </h1>

      {/* Recipient info */}
      <div
        style={{
          padding: "var(--portal-space-3)",
          background: "var(--portal-bg-elevated)",
          borderRadius: "var(--portal-radius-lg)",
          marginBottom: "var(--portal-space-3)",
        }}
      >
        <div
          style={{
            fontSize: "var(--portal-font-size-xs)",
            color: "var(--portal-text-tertiary)",
            marginBottom: "var(--portal-space-1)",
          }}
        >
          To
        </div>
        <div
          style={{
            fontSize: "var(--portal-font-size-base)",
            color: "var(--portal-text-primary)",
            fontWeight: "var(--portal-font-weight-medium)",
          }}
        >
          {breederName || "Your Breeder"}
        </div>
      </div>

      {/* Subject input */}
      <div style={{ marginBottom: "var(--portal-space-3)" }}>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject (optional)"
          style={{
            width: "100%",
            padding: "var(--portal-space-3)",
            background: "var(--portal-bg-card)",
            border: "1px solid var(--portal-border-subtle)",
            borderRadius: "var(--portal-radius-lg)",
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-text-primary)",
            outline: "none",
          }}
        />
      </div>

      {/* Message composer */}
      <div
        style={{
          background: "var(--portal-bg-card)",
          border: "1px solid var(--portal-border-subtle)",
          borderRadius: "var(--portal-radius-lg)",
          overflow: "hidden",
        }}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          style={{ display: "none" }}
        />

        {error && (
          <div
            style={{
              padding: "var(--portal-space-2) var(--portal-space-3)",
              background: "var(--portal-error-soft)",
              color: "var(--portal-error)",
              fontSize: "var(--portal-font-size-sm)",
              borderBottom: "1px solid var(--portal-border-subtle)",
            }}
          >
            {error}
          </div>
        )}

        {/* Selected file preview */}
        {selectedFile && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--portal-space-2)",
              padding: "var(--portal-space-2) var(--portal-space-3)",
              background: "var(--portal-bg-elevated)",
              borderBottom: "1px solid var(--portal-border-subtle)",
            }}
          >
            <span style={{ fontSize: "1.25rem" }}>{getFileIcon(selectedFile.type)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "var(--portal-font-size-sm)",
                  fontWeight: "var(--portal-font-weight-medium)",
                  color: "var(--portal-text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {selectedFile.name}
              </div>
              <div style={{ fontSize: "var(--portal-font-size-xs)", color: "var(--portal-text-tertiary)" }}>
                {formatFileSize(selectedFile.size)}
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearFile}
              style={{
                all: "unset",
                cursor: "pointer",
                padding: "var(--portal-space-1)",
                color: "var(--portal-text-tertiary)",
                fontSize: "1rem",
              }}
              aria-label="Remove file"
            >
              ✕
            </button>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Write your message..."
          disabled={sending}
          style={{
            width: "100%",
            minHeight: "120px",
            maxHeight: "200px",
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
          rows={4}
        />

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
          <div style={{ display: "flex", alignItems: "center", gap: "var(--portal-space-2)" }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              style={{
                all: "unset",
                cursor: sending ? "not-allowed" : "pointer",
                padding: "var(--portal-space-1) var(--portal-space-2)",
                borderRadius: "var(--portal-radius-sm)",
                color: "var(--portal-text-secondary)",
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "var(--portal-space-1)",
                opacity: sending ? 0.5 : 1,
              }}
              aria-label="Attach file"
              title="Attach file"
            >
              📎
              <span style={{ fontSize: "var(--portal-font-size-xs)" }}>Attach</span>
            </button>
            <span
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-tertiary)",
              }}
            >
              Ctrl+Enter to send
            </span>
          </div>
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={(!message.trim() && !selectedFile) || sending}
          >
            {sending ? "Sending..." : "Send Message"}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ──────────────────────────────────────────────────────────────────────────── */

interface BreederInfo {
  partyId: number;
  name: string | null;
}

export default function PortalMessagesPage() {
  const { tenantSlug, isReady } = useTenantContext();
  const [threads, setThreads] = React.useState<any[]>([]);
  const [selectedThread, setSelectedThread] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [threadLoading, setThreadLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [primaryAnimal, setPrimaryAnimal] = React.useState<any>(null);
  const [breederInfo, setBreederInfo] = React.useState<BreederInfo | null>(null);
  const [isComposing, setIsComposing] = React.useState(false);
  const currentPartyId = getCurrentPartyId();

  // Create bound fetch function
  const portalFetch = React.useMemo(
    () => createPortalFetch(tenantSlug),
    [tenantSlug]
  );

  // Animal context from API - only set if we have real placement data
  const animalName = primaryAnimal?.offspring?.name || null;
  const species = primaryAnimal?.offspring?.species || primaryAnimal?.species || null;
  const breed = primaryAnimal?.offspring?.breed || primaryAnimal?.breed || null;

  // Load primary animal context and breeder info - wait for tenant context
  React.useEffect(() => {
    if (!isReady) return;

    let cancelled = false;

    async function loadContext() {
      try {
        // Load placements and breeder info in parallel
        const [placementsRes, breederRes] = await Promise.all([
          portalFetch<{ placements: any[] }>("/portal/placements").catch(() => null),
          portalFetch<{ breeder: { partyId: number; name: string } }>("/portal/breeder").catch(() => null),
        ]);

        if (cancelled) return;

        if (placementsRes?.placements && placementsRes.placements.length > 0) {
          setPrimaryAnimal(placementsRes.placements[0]);
        }

        if (breederRes?.breeder) {
          setBreederInfo({
            partyId: breederRes.breeder.partyId,
            name: breederRes.breeder.name,
          });
        }
      } catch (err) {
        // Silently ignore - context is optional for display
      }
    }
    loadContext();
    return () => { cancelled = true; };
  }, [portalFetch, isReady]);

  const loadThreads = React.useCallback(async () => {
    if (!isReady) return;

    setLoading(true);
    setError(null);

    // Check if demo mode is active
    if (isDemoMode()) {
      const demoData = generateDemoData();
      // Convert demo threads to match the expected format
      const demoThreads = demoData.threads.map((t) => ({
        id: t.id,
        subject: t.subject,
        participants: t.participants.map((p) => ({
          name: p,
          partyId: p === "You" ? 1 : 2,
        })),
        lastMessageAt: t.lastMessageAt,
        unreadCount: t.unreadCount,
        messages: t.messages.map((m) => ({
          id: m.id,
          body: m.content,
          senderId: m.senderId,
          senderName: m.senderName,
          sentAt: m.sentAt,
          read: m.read,
        })),
      }));
      setThreads(demoThreads);
      setPrimaryAnimal(demoData.placements[0]);

      // Handle URL thread ID
      const urlThreadId = getThreadIdFromUrl();
      if (urlThreadId) {
        const threadInList = demoThreads.find((t: any) => t.id === urlThreadId);
        if (threadInList) {
          setSelectedThread(threadInList);
          setThreadIdInUrl(urlThreadId);
        } else {
          setThreadIdInUrl(null);
        }
      }

      setLoading(false);
      return;
    }

    // Normal API fetch
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

    // Check if demo mode is active
    if (isDemoMode()) {
      const demoData = generateDemoData();
      const demoThreads = demoData.threads.map((t) => ({
        id: t.id,
        subject: t.subject,
        participants: t.participants.map((p) => ({
          name: p,
          partyId: p === "You" ? 1 : 2,
        })),
        lastMessageAt: t.lastMessageAt,
        unreadCount: t.unreadCount,
        messages: t.messages.map((m) => ({
          id: m.id,
          body: m.content,
          senderId: m.senderId,
          senderName: m.senderName,
          sentAt: m.sentAt,
          read: m.read,
        })),
      }));
      const thread = demoThreads.find((t) => t.id === id);
      if (thread) {
        setSelectedThread(thread);
        setThreadIdInUrl(id);
      }
      setThreadLoading(false);
      return;
    }

    // Normal API fetch
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
    setIsComposing(false);
    setThreadIdInUrl(null);
  };

  const handleStartCompose = () => {
    setIsComposing(true);
    setSelectedThread(null);
  };

  const handleNewThreadCreated = (thread: any) => {
    // Thread was created - switch to viewing it
    setIsComposing(false);
    setSelectedThread(thread);
    setThreadIdInUrl(thread.id);
    // Refresh the thread list
    loadThreads();
  };

  // Handle message sent from ThreadDetail - must be before early returns (React hooks rules)
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

  // Compose view
  if (isComposing && breederInfo) {
    return (
      <ComposeMessage
        breederName={breederInfo.name}
        breederPartyId={breederInfo.partyId}
        onBack={handleBack}
        onMessageSent={handleNewThreadCreated}
        portalFetch={portalFetch}
        tenantSlug={tenantSlug}
      />
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
        onMessageSent={handleMessageSent}
        portalFetch={portalFetch}
        tenantSlug={tenantSlug}
      />
    );
  }

  // Thread list view
  return (
    <PageContainer>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
        {/* Hero with New Message button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--portal-space-3)" }}>
          <PortalHero
            variant="page"
            title="Messages"
            subtitle={animalName ? `Stay connected about ${animalName}'s journey` : "Stay connected with your breeder"}
            animalContext={animalName ?? undefined}
            status={unreadCount > 0 ? "action" : undefined}
            statusLabel={unreadCount > 0 ? `${unreadCount} unread` : undefined}
          />
          {breederInfo && (
            <Button variant="primary" onClick={handleStartCompose}>
              New Message
            </Button>
          )}
        </div>

        {/* Subject Header - Only show when we have real placement data */}
        {animalName && (
          <SubjectHeader
            name={animalName}
            species={species}
            breed={breed}
            statusLabel={unreadCount > 0 ? `${unreadCount} unread` : "All read"}
            statusVariant={unreadCount > 0 ? "action" : "success"}
          />
        )}

        {/* Thread List */}
        {threads.length === 0 ? (
          <EmptyMessages
            breederName={breederInfo?.name || null}
            onStartConversation={handleStartCompose}
          />
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
