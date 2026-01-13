// apps/marketplace/src/marketplace/pages/InquiriesPage.tsx
// Full messaging UI with conversation list and thread view
// Mobile-first design with bottom sheet thread view on mobile

import * as React from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  useConversations,
  useConversation,
  useSendMessage,
  useWaitlistRequests,
  type WaitlistRequest,
} from "../../messages/hooks";
import type { Conversation, Message } from "../../messages/types";
import { getCurrentUserId } from "../../messages/store";
import { ReportBreederButton } from "../components/ReportBreederModal";

// =============================================================================
// Types
// =============================================================================

type InquiriesTab = "messages" | "waitlist";
type MessagesFilter = "all" | "unread";

// =============================================================================
// Icons
// =============================================================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M15 19l-7-7 7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PaperclipIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// =============================================================================
// Helpers
// =============================================================================

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

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
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

// =============================================================================
// Main Page Component
// =============================================================================

export function InquiriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [messagesFilter, setMessagesFilter] = React.useState<MessagesFilter>("all");

  // Get tab and selected conversation from URL
  const activeTab = (searchParams.get("tab") as InquiriesTab) || "messages";
  const selectedId = searchParams.get("c") || null;

  // Fetch conversations
  const { conversations, loading: loadingConversations, refresh: refreshConversations } = useConversations();

  // Fetch waitlist requests
  const { requests: waitlistRequests, loading: loadingWaitlist, refresh: refreshWaitlist } = useWaitlistRequests();

  // Fetch selected conversation and messages
  const { conversation, messages, loading: loadingThread } = useConversation(
    activeTab === "messages" ? selectedId : null
  );

  // Send message hook
  const { sendMessage, sending } = useSendMessage();

  // Refresh data when tab changes
  React.useEffect(() => {
    if (activeTab === "waitlist") {
      refreshWaitlist();
    } else if (activeTab === "messages") {
      refreshConversations();
    }
  }, [activeTab, refreshWaitlist, refreshConversations]);

  // Refresh data when page becomes visible
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (activeTab === "waitlist") {
          refreshWaitlist();
        } else {
          refreshConversations();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [activeTab, refreshWaitlist, refreshConversations]);

  // Handle tab change
  const handleTabChange = React.useCallback(
    (tab: InquiriesTab) => {
      setSearchParams({ tab }, { replace: true });
    },
    [setSearchParams]
  );

  // Handle conversation selection
  const handleSelect = React.useCallback(
    (id: string) => {
      setSearchParams({ tab: "messages", c: id }, { replace: true });
    },
    [setSearchParams]
  );

  // Handle back to list (mobile)
  const handleBack = React.useCallback(() => {
    setSearchParams({ tab: "messages" }, { replace: true });
  }, [setSearchParams]);

  // Handle send message
  const handleSendMessage = React.useCallback(
    async (content: string, file?: File) => {
      if (!selectedId) return;
      await sendMessage(selectedId, content, file);
    },
    [selectedId, sendMessage]
  );

  // Filter conversations
  const filteredConversations = React.useMemo(() => {
    let result = conversations;

    // Filter by unread
    if (messagesFilter === "unread") {
      result = result.filter((c) => c.unreadCount > 0);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => {
        const otherParticipant = c.participants.find((p) => p.type !== "buyer");
        const name = otherParticipant?.name?.toLowerCase() || "";
        const contextName =
          c.context.listingTitle?.toLowerCase() ||
          c.context.serviceName?.toLowerCase() ||
          c.context.programName?.toLowerCase() ||
          "";
        return name.includes(q) || contextName.includes(q);
      });
    }

    return result;
  }, [conversations, messagesFilter, searchQuery]);

  // Count unread
  const unreadCount = conversations.filter((c) => c.unreadCount > 0).length;

  // Count waitlist requests by status
  const waitlistCounts = React.useMemo(() => {
    const counts = { pending: 0, approved: 0, rejected: 0 };
    waitlistRequests.forEach((r) => {
      if (r.status in counts) {
        counts[r.status]++;
      }
    });
    return counts;
  }, [waitlistRequests]);

  // Determine if we're in thread view on mobile
  const showMobileThread = selectedId !== null;

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] -mx-4 md:-mx-6 flex flex-col">
      {/* Mobile Thread View */}
      {showMobileThread && (
        <div className="md:hidden fixed inset-0 z-40 bg-portal-bg flex flex-col">
          <MobileThreadView
            conversation={conversation}
            messages={messages}
            loading={loadingThread}
            onSendMessage={handleSendMessage}
            sending={sending}
            onBack={handleBack}
          />
        </div>
      )}

      {/* Tab Header */}
      <div className="flex-shrink-0 border-b border-border-subtle bg-portal-elevated px-4">
        <div className="flex gap-1">
          <TabButton
            active={activeTab === "messages"}
            onClick={() => handleTabChange("messages")}
            count={unreadCount}
          >
            Messages
          </TabButton>
          <TabButton
            active={activeTab === "waitlist"}
            onClick={() => handleTabChange("waitlist")}
            count={waitlistCounts.pending}
          >
            Waitlist
          </TabButton>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "messages" ? (
        <div className="flex-1 flex min-h-0">
          {/* Left sidebar - conversation list */}
          <div className="w-full md:w-80 flex-shrink-0 flex flex-col bg-portal-elevated md:border-r md:border-border-subtle">
            {/* Search and Filter */}
            <div className="p-3 space-y-2 border-b border-border-subtle">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                  className="w-full h-10 pl-10 pr-4 rounded-lg bg-portal-card border border-border-subtle text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMessagesFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    messagesFilter === "all"
                      ? "bg-accent/20 text-accent"
                      : "bg-portal-card text-text-secondary hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setMessagesFilter("unread")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    messagesFilter === "unread"
                      ? "bg-accent/20 text-accent"
                      : "bg-portal-card text-text-secondary hover:text-white"
                  }`}
                >
                  Unread
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-accent text-white text-[10px]">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {loadingConversations ? (
                <div className="p-3 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 rounded-lg animate-pulse">
                      <div className="h-4 bg-border-default rounded w-3/4 mb-2" />
                      <div className="h-3 bg-border-default rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <EmptyConversations searchQuery={searchQuery} filter={messagesFilter} />
              ) : (
                <div className="p-2 space-y-1">
                  {filteredConversations.map((conv) => (
                    <ConversationRow
                      key={conv.id}
                      conversation={conv}
                      selected={conv.id === selectedId}
                      onClick={() => handleSelect(conv.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel - thread view (desktop only) */}
          <div className="hidden md:flex flex-1 min-w-0">
            <DesktopThreadView
              conversation={conversation}
              messages={messages}
              loading={loadingThread}
              onSendMessage={handleSendMessage}
              sending={sending}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <WaitlistRequestsList requests={waitlistRequests} loading={loadingWaitlist} />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Tab Button
// =============================================================================

function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-4 py-3 text-sm font-medium transition-colors ${
        active ? "text-white" : "text-text-tertiary hover:text-text-secondary"
      }`}
    >
      <span className="flex items-center gap-2">
        {children}
        {count !== undefined && count > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-accent text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </span>
      {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
    </button>
  );
}

// =============================================================================
// Conversation Row
// =============================================================================

interface ConversationRowProps {
  conversation: Conversation;
  selected: boolean;
  onClick: () => void;
}

function ConversationRow({ conversation, selected, onClick }: ConversationRowProps) {
  const otherParticipant = conversation.participants.find((p) => p.type !== "buyer");
  const name = otherParticipant?.name || "Unknown";
  const timestamp = conversation.lastMessageAt ? formatRelativeTime(conversation.lastMessageAt) : "";
  const contextLabel = getContextLabel(conversation.context);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-colors ${
        selected
          ? "bg-accent/10 border border-accent/30"
          : "hover:bg-portal-card border border-transparent"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Avatar + Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-semibold truncate ${
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
              {contextLabel && (
                <span className="inline-block mt-0.5 text-[11px] text-text-tertiary">
                  {contextLabel}
                </span>
              )}
            </div>
          </div>

          {/* Message preview */}
          {conversation.lastMessagePreview && (
            <p
              className={`mt-2 text-[13px] line-clamp-1 ${
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

function getContextLabel(context: { type: string; listingTitle?: string; serviceName?: string; programName?: string }): string {
  if (context.type === "listing" && context.listingTitle) {
    return context.listingTitle.length > 30 ? context.listingTitle.slice(0, 30) + "..." : context.listingTitle;
  }
  if (context.type === "service" && context.serviceName) {
    return context.serviceName.length > 30 ? context.serviceName.slice(0, 30) + "..." : context.serviceName;
  }
  if (context.type === "program_inquiry" && context.programName) {
    return context.programName.length > 30 ? context.programName.slice(0, 30) + "..." : context.programName;
  }
  return "";
}

// =============================================================================
// Empty Conversations
// =============================================================================

function EmptyConversations({ searchQuery, filter }: { searchQuery: string; filter: MessagesFilter }) {
  return (
    <div className="p-6 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-border-default flex items-center justify-center">
        <MessageIcon className="w-7 h-7 text-text-muted" />
      </div>
      <h3 className="text-base font-semibold text-white mb-1">
        {searchQuery ? "No results" : filter === "unread" ? "All caught up!" : "No conversations yet"}
      </h3>
      <p className="text-sm text-text-tertiary max-w-xs mx-auto">
        {searchQuery
          ? "Try a different search term"
          : filter === "unread"
          ? "You've read all your messages"
          : "When you message a breeder, your conversations will appear here"}
      </p>
      {!searchQuery && filter === "all" && (
        <Link
          to="/breeders"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-[hsl(var(--brand-orange))] text-white text-sm font-medium hover:bg-[hsl(var(--brand-orange))]/90 transition-colors"
        >
          Browse Breeders
        </Link>
      )}
    </div>
  );
}

// =============================================================================
// Desktop Thread View
// =============================================================================

interface ThreadViewProps {
  conversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  onSendMessage: (content: string, file?: File) => Promise<void>;
  sending: boolean;
}

function DesktopThreadView({ conversation, messages, loading, onSendMessage, sending }: ThreadViewProps) {
  if (!conversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-portal-bg">
        <div className="w-16 h-16 rounded-full bg-border-default flex items-center justify-center mb-4">
          <MessageIcon className="w-8 h-8 text-text-muted" />
        </div>
        <p className="text-text-secondary text-sm">Select a conversation to view messages</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-portal-bg w-full">
      <ThreadHeader conversation={conversation} />
      <ThreadMessages messages={messages} loading={loading} />
      <ThreadComposer onSend={onSendMessage} sending={sending} />
    </div>
  );
}

// =============================================================================
// Mobile Thread View
// =============================================================================

interface MobileThreadViewProps extends ThreadViewProps {
  onBack: () => void;
}

function MobileThreadView({ conversation, messages, loading, onSendMessage, sending, onBack }: MobileThreadViewProps) {
  if (!conversation) {
    return null;
  }

  const otherParticipant = conversation.participants.find((p) => p.type !== "buyer");

  return (
    <>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 p-4 border-b border-border-subtle bg-portal-elevated">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg text-text-secondary hover:text-white hover:bg-portal-card transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-white truncate">
            {otherParticipant?.name || "Unknown"}
          </h2>
          <ContextChip context={conversation.context} />
        </div>
        {otherParticipant?.type === "breeder" && otherParticipant?.slug && (
          <ReportBreederButton
            breederTenantSlug={otherParticipant.slug}
            breederName={otherParticipant.name || "Unknown"}
            variant="icon"
          />
        )}
      </div>

      {/* Messages */}
      <ThreadMessages messages={messages} loading={loading} />

      {/* Composer */}
      <div className="pb-safe">
        <ThreadComposer onSend={onSendMessage} sending={sending} />
      </div>
    </>
  );
}

// =============================================================================
// Thread Header (Desktop)
// =============================================================================

function ThreadHeader({ conversation }: { conversation: Conversation }) {
  const otherParticipant = conversation.participants.find((p) => p.type !== "buyer");

  return (
    <div className="flex-shrink-0 p-4 border-b border-border-subtle bg-portal-elevated">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-white font-semibold">
            {(otherParticipant?.name || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-white">
              {otherParticipant?.name || "Unknown"}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <ContextChip context={conversation.context} />
              {otherParticipant?.slug && (
                <Link
                  to={`/breeders/${otherParticipant.slug}`}
                  className="text-[12px] text-accent hover:text-accent/80 transition-colors"
                >
                  View profile
                </Link>
              )}
            </div>
          </div>
        </div>

        {otherParticipant?.type === "breeder" && otherParticipant?.slug && (
          <ReportBreederButton
            breederTenantSlug={otherParticipant.slug}
            breederName={otherParticipant.name || "Unknown"}
            variant="text"
          />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Context Chip
// =============================================================================

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
  } else if (context.type === "program_inquiry") {
    label = context.programName || "Program";
  } else {
    label = "General";
  }

  const chip = (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded bg-border-default text-text-secondary">
      {label.length > 25 ? label.slice(0, 25) + "..." : label}
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

// =============================================================================
// Thread Messages
// =============================================================================

function ThreadMessages({ messages, loading }: { messages: Message[]; loading: boolean }) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const currentUserId = getCurrentUserId();

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-border-default rounded w-20 mb-2" />
              <div className="h-16 bg-border-default rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-text-tertiary">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  // Group messages by day
  const grouped = groupMessagesByDay(messages);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-6">
        {grouped.map(({ date, messages: dayMessages }) => (
          <div key={date}>
            <div className="flex items-center justify-center mb-4">
              <span className="px-3 py-1 text-[11px] font-medium text-text-muted bg-portal-elevated rounded-full">
                {formatDayLabel(date)}
              </span>
            </div>
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
      <div ref={messagesEndRef} />
    </div>
  );
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const time = new Date(message.createdAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const attachment = (message as any).attachment;

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] md:max-w-[70%] px-4 py-2.5 rounded-2xl ${
          isOwn
            ? "bg-[hsl(var(--brand-orange))] text-white rounded-br-md"
            : "bg-portal-card border border-border-subtle text-text-secondary rounded-bl-md"
        }`}
      >
        {message.content && (
          <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        )}
        {attachment && (
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 mt-2 p-2 rounded-lg transition-colors ${
              isOwn ? "bg-white/10 hover:bg-white/20" : "bg-portal-elevated hover:bg-border-default"
            }`}
          >
            <span className="text-xl">{getFileIcon(attachment.mime)}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{attachment.filename}</div>
              <div className={`text-[11px] ${isOwn ? "text-white/60" : "text-text-muted"}`}>
                {formatFileSize(attachment.bytes)}
              </div>
            </div>
          </a>
        )}
        <p className={`mt-1 text-[10px] ${isOwn ? "text-white/60" : "text-text-muted"}`}>
          {time}
        </p>
      </div>
    </div>
  );
}

function groupMessagesByDay(messages: Message[]): { date: string; messages: Message[] }[] {
  const groups: Record<string, Message[]> = {};
  for (const message of messages) {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
  }
  return Object.entries(groups).map(([date, msgs]) => ({ date, messages: msgs }));
}

function formatDayLabel(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

// =============================================================================
// Thread Composer
// =============================================================================

function ThreadComposer({
  onSend,
  sending,
}: {
  onSend: (content: string, file?: File) => Promise<void>;
  sending: boolean;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [draft, setDraft] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFileError("File too large. Maximum size is 10MB.");
        return;
      }
      setSelectedFile(file);
      setFileError(null);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async () => {
    if ((!draft.trim() && !selectedFile) || sending) return;
    const content = draft.trim();
    setDraft("");
    const file = selectedFile;
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    await onSend(content, file || undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-shrink-0 p-4 border-t border-border-subtle bg-portal-elevated">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
        className="hidden"
      />

      {fileError && (
        <div className="mb-2 px-3 py-2 text-sm text-red-400 bg-red-500/10 rounded-lg border border-red-500/20">
          {fileError}
        </div>
      )}

      {selectedFile && (
        <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-portal-card rounded-lg border border-border-subtle">
          <span className="text-xl">{getFileIcon(selectedFile.type)}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{selectedFile.name}</div>
            <div className="text-[11px] text-text-muted">{formatFileSize(selectedFile.size)}</div>
          </div>
          <button
            type="button"
            onClick={handleClearFile}
            className="p-1 text-text-muted hover:text-white transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          className="p-3 rounded-lg bg-portal-card border border-border-subtle text-text-secondary hover:text-white hover:border-border-default transition-colors disabled:opacity-50"
          title="Attach file"
        >
          <PaperclipIcon className="w-5 h-5" />
        </button>
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
          className="flex-1 min-h-[44px] max-h-[120px] px-4 py-3 rounded-lg bg-portal-card border border-border-subtle text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 resize-none transition-colors"
          disabled={sending}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={(!draft.trim() && !selectedFile) || sending}
          className="p-3 rounded-lg bg-[hsl(var(--brand-orange))] text-white hover:bg-[hsl(var(--brand-orange))]/90 transition-colors disabled:opacity-50"
          title="Send"
        >
          {sending ? (
            <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <SendIcon className="w-5 h-5" />
          )}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-text-muted hidden md:block">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}

// =============================================================================
// Waitlist Requests List
// =============================================================================

function WaitlistRequestsList({ requests, loading }: { requests: WaitlistRequest[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-border-subtle bg-portal-card animate-pulse">
            <div className="h-5 bg-border-default rounded w-1/3 mb-2" />
            <div className="h-4 bg-border-default rounded w-1/2 mb-2" />
            <div className="h-3 bg-border-default rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-border-default flex items-center justify-center">
          <ClipboardIcon className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No waitlist requests yet</h3>
        <p className="text-sm text-text-tertiary mb-6 max-w-md mx-auto">
          When you request to join a breeder's waitlist, you'll see the status of your requests here.
        </p>
        <Link
          to="/breeders"
          className="inline-flex items-center px-5 py-2.5 rounded-lg bg-[hsl(var(--brand-orange))] text-white text-sm font-medium hover:bg-[hsl(var(--brand-orange))]/90 transition-colors"
        >
          Browse breeders
        </Link>
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === "pending");
  const approved = requests.filter((r) => r.status === "approved");
  const rejected = requests.filter((r) => r.status === "rejected");

  return (
    <div className="space-y-8 max-w-3xl">
      {pending.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Pending ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map((request) => (
              <WaitlistRequestCard key={request.id} request={request} />
            ))}
          </div>
        </section>
      )}

      {approved.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Approved ({approved.length})
          </h3>
          <div className="space-y-3">
            {approved.map((request) => (
              <WaitlistRequestCard key={request.id} request={request} />
            ))}
          </div>
        </section>
      )}

      {rejected.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Declined ({rejected.length})
          </h3>
          <div className="space-y-3">
            {rejected.map((request) => (
              <WaitlistRequestCard key={request.id} request={request} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// =============================================================================
// Waitlist Request Card
// =============================================================================

function WaitlistRequestCard({ request }: { request: WaitlistRequest }) {
  const [payLoading, setPayLoading] = React.useState(false);

  const statusConfig = {
    pending: {
      label: "Pending Review",
      className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
      icon: <ClockIcon className="w-3.5 h-3.5" />,
    },
    approved: {
      label: "Approved",
      className: "bg-green-500/10 text-green-400 border-green-500/30",
      icon: <CheckIcon className="w-3.5 h-3.5" />,
    },
    rejected: {
      label: "Declined",
      className: "bg-red-500/10 text-red-400 border-red-500/30",
      icon: <XIcon className="w-3.5 h-3.5" />,
    },
  };

  const config = statusConfig[request.status];

  const submittedDate = new Date(request.submittedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handlePayNow = async () => {
    if (!request.invoice) return;
    setPayLoading(true);
    try {
      const base = import.meta.env.DEV ? "/api/v1/marketplace" : `${window.location.origin}/api/v1/marketplace`;
      const response = await fetch(`${base}/invoices/${request.invoice.id}/checkout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to create checkout session");
      const data = await response.json();
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    } catch (err) {
      console.error("Payment error:", err);
    } finally {
      setPayLoading(false);
    }
  };

  const invoiceConfig = getInvoiceStatusConfig(request.invoice);

  return (
    <div className="p-4 rounded-xl border border-border-subtle bg-portal-card hover:border-border-default transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {request.breederSlug ? (
              <Link
                to={`/breeders/${request.breederSlug}`}
                className="text-[15px] font-semibold text-white hover:text-accent transition-colors"
              >
                {request.breederName || "Unknown Breeder"}
              </Link>
            ) : (
              <span className="text-[15px] font-semibold text-white">
                {request.breederName || "Unknown Breeder"}
              </span>
            )}
          </div>

          {request.programName && (
            <p className="text-sm text-text-secondary mb-2">{request.programName}</p>
          )}

          <p className="text-xs text-text-muted">Submitted {submittedDate}</p>

          {request.status === "rejected" && request.rejectedReason && (
            <div className="mt-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
              <p className="text-xs font-medium text-red-400 mb-1">Reason:</p>
              <p className="text-sm text-text-secondary">{request.rejectedReason}</p>
            </div>
          )}

          {request.status === "approved" && request.approvedAt && (
            <p className="text-xs text-green-400 mt-2">
              Approved{" "}
              {new Date(request.approvedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}

          {request.invoice && invoiceConfig && (
            <div className="mt-3 p-3 rounded-lg bg-portal-elevated border border-border-subtle">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-text-secondary mb-0.5">Deposit Required</p>
                  <p className="text-sm font-semibold text-white">
                    {request.invoice.balanceCents > 0
                      ? formatCents(request.invoice.balanceCents)
                      : formatCents(request.invoice.totalCents)}
                  </p>
                  {request.invoice.dueAt && request.invoice.status !== "PAID" && (
                    <p className="text-xs text-text-muted mt-0.5">
                      Due{" "}
                      {new Date(request.invoice.dueAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${invoiceConfig.className}`}
                  >
                    {invoiceConfig.label}
                  </span>
                  {invoiceConfig.showPayButton && (
                    <button
                      type="button"
                      onClick={handlePayNow}
                      disabled={payLoading}
                      className="px-3 py-1.5 rounded-lg bg-[hsl(var(--brand-orange))] text-white text-xs font-medium hover:bg-[hsl(var(--brand-orange))]/90 transition-colors disabled:opacity-50"
                    >
                      {payLoading ? "..." : "Pay Now"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <span
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}
        >
          {config.icon}
          {config.label}
        </span>
      </div>
    </div>
  );
}

function getInvoiceStatusConfig(invoice: WaitlistRequest["invoice"]) {
  if (!invoice) return null;

  const isOverdue = invoice.dueAt && new Date(invoice.dueAt) < new Date() && invoice.status !== "PAID";
  const isPartial = invoice.paidCents > 0 && invoice.balanceCents > 0;

  if (invoice.status === "PAID") {
    return { label: "Paid", className: "bg-green-500/10 text-green-400 border-green-500/30", showPayButton: false };
  }
  if (isOverdue) {
    return { label: "Overdue", className: "bg-red-500/10 text-red-400 border-red-500/30", showPayButton: true };
  }
  if (isPartial) {
    const pct = Math.round((invoice.paidCents / invoice.totalCents) * 100);
    return {
      label: `Partial (${pct}%)`,
      className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      showPayButton: true,
    };
  }
  return { label: "Awaiting Payment", className: "bg-amber-500/10 text-amber-400 border-amber-500/30", showPayButton: true };
}

export default InquiriesPage;
