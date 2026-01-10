// apps/marketplace/src/messages/components/ConversationList.tsx
// Left sidebar showing all conversations

import * as React from "react";
import type { Conversation } from "../types";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  loading?: boolean;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  loading,
}: ConversationListProps) {
  // Filter conversations by search
  const filtered = React.useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const otherParticipant = c.participants.find((p) => p.type !== "buyer");
      const name = otherParticipant?.name?.toLowerCase() || "";
      const contextName =
        c.context.listingTitle?.toLowerCase() ||
        c.context.serviceName?.toLowerCase() ||
        c.context.programName?.toLowerCase() ||
        "";
      return name.includes(q) || contextName.includes(q);
    });
  }, [conversations, searchQuery]);

  return (
    <div className="h-full flex flex-col bg-portal-elevated border-r border-border-subtle">
      {/* Search header */}
      <div className="p-3 border-b border-border-subtle">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            className="w-full h-9 pl-9 pr-3 rounded-portal-xs bg-portal-card border border-border-subtle text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 rounded-portal-xs animate-pulse">
                <div className="h-4 bg-border-default rounded w-3/4 mb-2" />
                <div className="h-3 bg-border-default rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-text-tertiary">
              {searchQuery ? "No conversations match your search." : "No conversations yet."}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filtered.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                selected={conversation.id === selectedId}
                onClick={() => onSelect(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConversationRowProps {
  conversation: Conversation;
  selected: boolean;
  onClick: () => void;
}

function ConversationRow({ conversation, selected, onClick }: ConversationRowProps) {
  const otherParticipant = conversation.participants.find((p) => p.type !== "buyer");
  const name = otherParticipant?.name || "Unknown";

  // Format timestamp
  const timestamp = conversation.lastMessageAt
    ? formatRelativeTime(conversation.lastMessageAt)
    : "";

  // Context chip
  const contextLabel = getContextLabel(conversation.context);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-3 rounded-portal-xs transition-colors ${
        selected
          ? "bg-accent/10 border border-accent/30"
          : "hover:bg-portal-card-hover border border-transparent"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Name and unread badge */}
          <div className="flex items-center gap-2">
            <span
              className={`text-[14px] font-semibold truncate ${
                conversation.unreadCount > 0 ? "text-white" : "text-text-secondary"
              }`}
            >
              {name}
            </span>
            {conversation.unreadCount > 0 && (
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center">
                {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
              </span>
            )}
          </div>

          {/* Context chip */}
          {contextLabel && (
            <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-border-default text-text-tertiary">
              {contextLabel}
            </span>
          )}

          {/* Message preview */}
          {conversation.lastMessagePreview && (
            <p
              className={`mt-1 text-[13px] line-clamp-1 ${
                conversation.unreadCount > 0 ? "text-text-secondary" : "text-text-tertiary"
              }`}
            >
              {conversation.lastMessagePreview}
            </p>
          )}
        </div>

        {/* Timestamp */}
        {timestamp && (
          <span className="flex-shrink-0 text-[11px] text-text-muted">{timestamp}</span>
        )}
      </div>
    </button>
  );
}

function getContextLabel(context: { type: string; listingTitle?: string; serviceName?: string }): string {
  if (context.type === "listing" && context.listingTitle) {
    return context.listingTitle.length > 25
      ? context.listingTitle.slice(0, 25) + "..."
      : context.listingTitle;
  }
  if (context.type === "service" && context.serviceName) {
    return context.serviceName.length > 25
      ? context.serviceName.slice(0, 25) + "..."
      : context.serviceName;
  }
  if (context.type === "general") {
    return "General";
  }
  return "";
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
