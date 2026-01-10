// apps/marketplace/src/messages/components/ThreadView.tsx
// Right panel showing conversation thread with messages and composer

import * as React from "react";
import { Link } from "react-router-dom";
import type { Conversation, Message } from "../types";
import { getCurrentUserId } from "../store";
import { ReportBreederButton } from "../../marketplace/components/ReportBreederModal";

interface ThreadViewProps {
  conversation: Conversation | null;
  messages: Message[];
  loading?: boolean;
  onSendMessage: (content: string) => Promise<void>;
  sending?: boolean;
}

export function ThreadView({
  conversation,
  messages,
  loading,
  onSendMessage,
  sending,
}: ThreadViewProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [draft, setDraft] = React.useState("");

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle send
  const handleSend = async () => {
    if (!draft.trim() || sending) return;
    const content = draft.trim();
    setDraft("");
    await onSendMessage(content);
  };

  // Handle key press (Enter to send, Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Empty state
  if (!conversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-portal-bg">
        <div className="w-16 h-16 rounded-full bg-border-default flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <p className="text-text-secondary text-sm">Select a conversation to view messages</p>
      </div>
    );
  }

  const otherParticipant = conversation.participants.find((p) => p.type !== "buyer");
  const currentUserId = getCurrentUserId();

  return (
    <div className="h-full flex flex-col bg-portal-bg">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border-subtle bg-portal-elevated">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-white">
              {otherParticipant?.name || "Unknown"}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <ContextChip context={conversation.context} />
              {otherParticipant?.slug && (
                <Link
                  to={`/programs/${otherParticipant.slug}`}
                  className="text-[12px] text-accent hover:text-accent-hover transition-colors"
                >
                  View profile
                </Link>
              )}
            </div>
          </div>

          {/* Report button - for breeder conversations */}
          {otherParticipant?.type === "breeder" && otherParticipant?.slug && (
            <ReportBreederButton
              breederTenantSlug={otherParticipant.slug}
              breederName={otherParticipant.name || "Unknown"}
              variant="text"
            />
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-border-default rounded w-20 mb-2" />
                <div className="h-16 bg-border-default rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-text-tertiary">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <MessageList messages={messages} currentUserId={currentUserId} />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="flex-shrink-0 p-4 border-t border-border-subtle bg-portal-elevated">
        <div className="flex gap-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            className="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 rounded-portal-sm bg-portal-card border border-border-subtle text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 resize-none transition-colors"
            disabled={sending}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            className="px-4 py-2 rounded-portal-xs bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            aria-label="Send message"
          >
            {sending ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-text-muted">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function ContextChip({ context }: { context: Conversation["context"] }) {
  let label = "";
  let href = "";

  if (context.type === "listing") {
    label = context.listingTitle || "Listing";
    if (context.programSlug && context.listingSlug) {
      href = `/programs/${context.programSlug}/offspring-groups/${context.listingSlug}`;
    }
  } else if (context.type === "service") {
    label = context.serviceName || "Service";
  } else {
    label = "General";
  }

  const chip = (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded bg-border-default text-text-secondary">
      {context.type === "listing" && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )}
      {context.type === "service" && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )}
      {context.type === "general" && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )}
      {label.length > 30 ? label.slice(0, 30) + "..." : label}
    </span>
  );

  if (href) {
    return (
      <Link to={href} className="hover:opacity-80 transition-opacity">
        {chip}
      </Link>
    );
  }

  return chip;
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

function MessageList({ messages, currentUserId }: MessageListProps) {
  // Group messages by day
  const grouped = groupMessagesByDay(messages);

  return (
    <div className="space-y-6">
      {grouped.map(({ date, messages: dayMessages }) => (
        <div key={date}>
          {/* Day separator */}
          <div className="flex items-center justify-center mb-4">
            <span className="px-3 py-1 text-[11px] font-medium text-text-muted bg-portal-elevated rounded-full">
              {formatDayLabel(date)}
            </span>
          </div>

          {/* Messages for this day */}
          <div className="space-y-3">
            {dayMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUserId}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const time = new Date(message.createdAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
          isOwn
            ? "bg-accent text-white rounded-br-md"
            : "bg-portal-card border border-border-subtle text-text-secondary rounded-bl-md"
        }`}
      >
        <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <p
          className={`mt-1 text-[10px] ${
            isOwn ? "text-white/60" : "text-text-muted"
          }`}
        >
          {time}
        </p>
      </div>
    </div>
  );
}

function groupMessagesByDay(
  messages: Message[]
): { date: string; messages: Message[] }[] {
  const groups: Record<string, Message[]> = {};

  for (const message of messages) {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
  }

  return Object.entries(groups).map(([date, msgs]) => ({
    date,
    messages: msgs,
  }));
}

function formatDayLabel(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
