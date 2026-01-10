// apps/marketing/src/pages/CommunicationsHub.tsx
// Unified Communications Hub - The FIRE messaging experience for breeders

import * as React from "react";
import { makeApi } from "@bhq/api";
import type {
  MessageThread,
  Message,
  EmailTemplate,
  ContactDTO,
  CommunicationItem,
  CommunicationStatus,
  CommunicationChannel,
  InboxCounts,
  TagDTO,
} from "@bhq/api";
import { Button, Input, Badge } from "@bhq/ui";
import {
  Search,
  Plus,
  Inbox,
  Zap,
  Dog,
  ClipboardList,
  PartyPopper,
  Mail,
  MessageCircle,
  Tag,
  Filter,
  ArrowUpDown,
  X,
  Send,
  Paperclip,
  FileText,
  ChevronRight,
  Clock,
  Check,
  CheckCheck,
  MoreHorizontal,
  Star,
  Archive,
  Trash2,
  RefreshCw,
  Command,
  Phone,
  MapPin,
  Calendar,
  User,
  Building2,
  Hash,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   API SETUP
   ═══════════════════════════════════════════════════════════════════════════ */

const IS_DEV = import.meta.env.DEV;

function getApiBase(): string {
  // Resource files already include /api/v1 in their paths, so the base URL
  // should NOT include /api/v1 to avoid duplication.
  const envBase = (import.meta.env.VITE_API_BASE_URL as string) || "";
  if (envBase.trim()) return normalizeBase(envBase);
  const w = window as any;
  const windowBase = String(w.__BHQ_API_BASE__ || "").trim();
  if (windowBase) return normalizeBase(windowBase);
  if (IS_DEV) return ""; // Empty string = same origin, resource paths add /api/v1
  return normalizeBase(window.location.origin);
}

function normalizeBase(base: string): string {
  // Strip trailing slashes and any existing /api/v1 suffix
  return base.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
}

const API_BASE = getApiBase();
const api = makeApi(API_BASE);

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

type ChannelType = "all" | "email" | "dm";
type FolderType = "all" | "inbox" | "flagged" | "drafts" | "archived" | "email" | "dm";

interface UnifiedMessage {
  id: string; // Composite ID from backend: "thread:123" or "email:456" or "draft:789"
  channel: "email" | "dm";
  contactId: number | null;
  contactName: string;
  contactEmail?: string;
  subject?: string;
  preview: string;
  timestamp: Date;
  isUnread: boolean;
  isStarred: boolean;
  isArchived: boolean;
  tags?: string[];
  // For DM threads
  threadId?: number;
  // For emails
  emailId?: number;
  // For drafts
  draftId?: number;
  // Type from backend
  type: "email" | "dm" | "draft";
}

interface ConversationThread {
  id: string;
  channel: "email" | "dm";
  threadId?: number; // Numeric ID for API calls
  isFlagged: boolean;
  isArchived: boolean;
  contact: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    waitlistPosition?: number;
    tags?: string[];
    animals?: string[];
  };
  subject?: string;
  messages: Array<{
    id: string;
    body: string;
    timestamp: Date;
    isOwn: boolean;
    status?: "sent" | "delivered" | "read";
  }>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SMART FOLDER DEFINITIONS
   ═══════════════════════════════════════════════════════════════════════════ */

const SMART_FOLDERS: Array<{
  id: FolderType;
  label: string;
  icon: React.ReactNode;
  status?: CommunicationStatus;
  dividerAfter?: boolean;
}> = [
  { id: "all", label: "All Messages", icon: <Inbox className="w-4 h-4" />, status: "all" },
  { id: "inbox", label: "Inbox", icon: <Inbox className="w-4 h-4" />, status: "unread" },
  { id: "flagged", label: "Flagged", icon: <Star className="w-4 h-4" />, status: "flagged", dividerAfter: true },
  { id: "drafts", label: "Drafts", icon: <FileText className="w-4 h-4" />, status: "draft" },
  { id: "archived", label: "Archived", icon: <Archive className="w-4 h-4" />, status: "archived", dividerAfter: true },
  { id: "email", label: "Email", icon: <Mail className="w-4 h-4" />, status: "all" },
  { id: "dm", label: "Direct Messages", icon: <MessageCircle className="w-4 h-4" />, status: "all" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS HELP
   ═══════════════════════════════════════════════════════════════════════════ */

const KEYBOARD_SHORTCUTS = [
  { keys: ["j", "k"], action: "Navigate messages" },
  { keys: ["Enter"], action: "Open conversation" },
  { keys: ["r"], action: "Reply" },
  { keys: ["c"], action: "Compose new" },
  { keys: ["t"], action: "Insert template" },
  { keys: ["/"], action: "Search" },
  { keys: ["Esc"], action: "Close / Back" },
  { keys: ["s"], action: "Star message" },
  { keys: ["e"], action: "Archive" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   SIDEBAR COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

interface SidebarProps {
  activeFolder: FolderType;
  onFolderChange: (folder: FolderType) => void;
  folderCounts: Record<FolderType, number>;
  tags: TagDTO[];
  selectedTags: number[];
  onTagToggle: (tagId: number) => void;
  onManageTags: () => void;
  onCreateTag: () => void;
}

function Sidebar({
  activeFolder,
  onFolderChange,
  folderCounts,
  tags,
  selectedTags,
  onTagToggle,
  onManageTags,
  onCreateTag,
}: SidebarProps) {
  return (
    <div className="w-56 flex-shrink-0 border-r border-hairline bg-surface-strong/30 flex flex-col">
      {/* Folders */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
            Folders
          </span>
        </div>
        {SMART_FOLDERS.map((folder) => {
          const count = folderCounts[folder.id] || 0;
          const isActive = activeFolder === folder.id;
          return (
            <React.Fragment key={folder.id}>
              <button
                onClick={() => onFolderChange(folder.id)}
                className={`w-full px-3 py-2 flex items-center gap-2 text-sm transition-all ${
                  isActive
                    ? "bg-[hsl(var(--brand-orange))]/10 text-[hsl(var(--brand-orange))] border-r-2 border-[hsl(var(--brand-orange))]"
                    : "text-secondary hover:text-primary hover:bg-white/5"
                }`}
              >
                <span className={isActive ? "text-[hsl(var(--brand-orange))]" : ""}>{folder.icon}</span>
                <span className="flex-1 text-left truncate">{folder.label}</span>
                {count > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-[hsl(var(--brand-orange))]/20 text-[hsl(var(--brand-orange))]"
                        : "bg-surface-strong text-secondary"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
              {folder.dividerAfter && <div className="my-2 mx-3 border-t border-hairline" />}
            </React.Fragment>
          );
        })}

        {/* Tags Section */}
        <div className="my-2 mx-3 border-t border-hairline" />
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
            Tags
          </span>
          <button
            onClick={onManageTags}
            className="text-[10px] text-[hsl(var(--brand-orange))] hover:underline"
          >
            Manage
          </button>
        </div>
        {tags.length === 0 ? (
          <div className="px-3 py-2 text-xs text-secondary">
            No tags yet.{" "}
            <button onClick={onCreateTag} className="text-[hsl(var(--brand-orange))] hover:underline">
              Create one
            </button>
          </div>
        ) : (
          tags.map((tag) => {
            const isSelected = selectedTags.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => onTagToggle(tag.id)}
                className={`w-full px-3 py-1.5 flex items-center gap-2 text-sm transition-all ${
                  isSelected
                    ? "bg-[hsl(var(--brand-teal))]/10 text-[hsl(var(--brand-teal))]"
                    : "text-secondary hover:text-primary hover:bg-white/5"
                }`}
              >
                {tag.color ? (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                ) : (
                  <Hash className="w-3 h-3" />
                )}
                <span className="flex-1 text-left truncate">{tag.name}</span>
              </button>
            );
          })
        )}
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="p-3 border-t border-hairline">
        <div className="text-[10px] text-secondary flex items-center gap-1">
          <Command className="w-3 h-3" />
          <span>K for shortcuts</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONVERSATION LIST COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

interface ConversationListProps {
  messages: UnifiedMessage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  channelFilter: ChannelType;
  onChannelFilterChange: (channel: ChannelType) => void;
  // Bulk selection
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  // Bulk actions
  onBulkArchive: () => void;
  onBulkFlag: () => void;
  onBulkMarkRead: () => void;
  bulkActionLoading: boolean;
}

function ConversationList({
  messages,
  selectedId,
  onSelect,
  loading,
  searchQuery,
  onSearchChange,
  channelFilter,
  onChannelFilterChange,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onBulkArchive,
  onBulkFlag,
  onBulkMarkRead,
  bulkActionLoading,
}: ConversationListProps) {
  const hasSelection = selectedIds.size > 0;
  const allSelected = messages.length > 0 && selectedIds.size === messages.length;

  return (
    <div className="w-80 flex-shrink-0 border-r border-hairline flex flex-col bg-surface">
      {/* Bulk Actions Bar - shows when items are selected */}
      {hasSelection && (
        <div className="p-2 border-b border-hairline bg-[hsl(var(--brand-orange))]/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onClearSelection}
              className="p-1 rounded hover:bg-white/10 text-secondary hover:text-primary"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-primary">
              {selectedIds.size} selected
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onBulkMarkRead}
              disabled={bulkActionLoading}
              className="p-1.5 rounded text-secondary hover:text-primary hover:bg-white/10 disabled:opacity-50"
              title="Mark as read"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={onBulkFlag}
              disabled={bulkActionLoading}
              className="p-1.5 rounded text-secondary hover:text-yellow-500 hover:bg-white/10 disabled:opacity-50"
              title="Flag selected"
            >
              <Star className="w-4 h-4" />
            </button>
            <button
              onClick={onBulkArchive}
              disabled={bulkActionLoading}
              className="p-1.5 rounded text-secondary hover:text-primary hover:bg-white/10 disabled:opacity-50"
              title="Archive selected"
            >
              <Archive className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="p-3 border-b border-hairline space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search messages..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-surface-strong border border-hairline rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Channel Toggle with Select All */}
        <div className="flex items-center gap-2">
          <button
            onClick={allSelected ? onClearSelection : onSelectAll}
            className={`p-1.5 rounded transition-colors ${
              allSelected
                ? "text-[hsl(var(--brand-orange))]"
                : "text-secondary hover:text-primary"
            }`}
            title={allSelected ? "Deselect all" : "Select all"}
          >
            <CheckCheck className="w-4 h-4" />
          </button>
          <div className="flex-1 flex gap-1 p-1 bg-surface-strong rounded-lg">
            {(["all", "email", "dm"] as ChannelType[]).map((ch) => (
              <button
                key={ch}
                onClick={() => onChannelFilterChange(ch)}
                className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-all ${
                  channelFilter === ch
                    ? "bg-[hsl(var(--brand-orange))] text-black"
                    : "text-secondary hover:text-primary"
                }`}
              >
                {ch === "all" ? "All" : ch === "email" ? "Email" : "DMs"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-sm text-secondary">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center">
            <Inbox className="w-10 h-10 text-secondary/50 mx-auto mb-3" />
            <div className="text-sm text-secondary">No messages found</div>
            <div className="text-xs text-secondary mt-1">
              {searchQuery ? "Try a different search" : "Start a conversation!"}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isViewing = selectedId === msg.id;
            const isChecked = selectedIds.has(msg.id);
            return (
              <div
                key={msg.id}
                className={`w-full p-3 text-left border-b border-hairline transition-all group ${
                  isViewing
                    ? "bg-[hsl(var(--brand-orange))]/10 border-l-2 border-l-[hsl(var(--brand-orange))]"
                    : isChecked
                    ? "bg-[hsl(var(--brand-teal))]/10"
                    : msg.isUnread
                    ? "bg-[hsl(var(--brand-orange))]/5 hover:bg-[hsl(var(--brand-orange))]/10"
                    : "hover:bg-white/5"
                }`}
              >
                <div className="flex items-start gap-2">
                  {/* Checkbox for bulk selection */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelect(msg.id);
                    }}
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 rounded border transition-colors ${
                      isChecked
                        ? "bg-[hsl(var(--brand-orange))] border-[hsl(var(--brand-orange))]"
                        : "border-hairline group-hover:border-secondary"
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 text-black m-auto" />}
                  </button>

                  {/* Main content - clickable to view */}
                  <button
                    onClick={() => onSelect(msg.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    {/* Header Row */}
                    <div className="flex items-center gap-2">
                      {msg.isUnread && (
                        <div className="w-2 h-2 rounded-full bg-[hsl(var(--brand-orange))] flex-shrink-0" />
                      )}
                      <span
                        className={`font-medium text-sm truncate ${
                          msg.isUnread ? "text-primary" : "text-primary/80"
                        }`}
                      >
                        {msg.contactName}
                      </span>
                      <span
                        className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] rounded ${
                          msg.channel === "email"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-purple-500/20 text-purple-400"
                        }`}
                      >
                        {msg.channel === "email" ? "Email" : "DM"}
                      </span>
                      {msg.isStarred && (
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                    </div>

                    {/* Subject */}
                    {msg.subject && (
                      <div
                        className={`text-sm truncate mt-0.5 ${
                          msg.isUnread ? "text-primary font-medium" : "text-secondary"
                        }`}
                      >
                        {msg.subject}
                      </div>
                    )}

                    {/* Preview */}
                    <div className="text-xs text-secondary truncate mt-0.5">{msg.preview}</div>

                    {/* Footer Row */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-secondary">
                        {formatRelativeTime(msg.timestamp)}
                      </span>
                      {msg.tags && msg.tags.length > 0 && (
                        <div className="flex gap-1">
                          {msg.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-surface-strong text-secondary"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MESSAGE THREAD VIEW COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

interface ThreadViewProps {
  thread: ConversationThread | null;
  loading: boolean;
  onReply: (message: string) => void;
  onOpenTemplatePicker: () => void;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  sending: boolean;
  onToggleFlag: () => void;
  onToggleArchive: () => void;
  actionLoading: boolean;
}

function ThreadView({
  thread,
  loading,
  onReply,
  onOpenTemplatePicker,
  replyText,
  onReplyTextChange,
  sending,
  onToggleFlag,
  onToggleArchive,
  actionLoading,
}: ThreadViewProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-secondary" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <MessageCircle className="w-16 h-16 text-secondary/30 mb-4" />
        <div className="text-lg font-medium text-primary mb-1">Select a conversation</div>
        <div className="text-sm text-secondary">
          Choose a message from the list to view the conversation
        </div>
        <div className="mt-6 text-xs text-secondary">
          <span className="px-2 py-1 bg-surface-strong rounded">j</span> /{" "}
          <span className="px-2 py-1 bg-surface-strong rounded">k</span> to navigate
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Thread Header */}
      <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-surface">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[hsl(var(--brand-orange))]/20 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-[hsl(var(--brand-orange))]" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-primary truncate">{thread.contact.name}</div>
            {thread.subject && (
              <div className="text-sm text-secondary truncate">{thread.subject}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleFlag}
            disabled={actionLoading}
            className={`p-2 rounded-md transition-colors ${
              thread.isFlagged
                ? "text-yellow-500 hover:text-yellow-400"
                : "text-secondary hover:text-primary hover:bg-white/5"
            } ${actionLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            title={thread.isFlagged ? "Remove flag" : "Flag message"}
          >
            <Star className={`w-4 h-4 ${thread.isFlagged ? "fill-yellow-500" : ""}`} />
          </button>
          <button
            onClick={onToggleArchive}
            disabled={actionLoading}
            className={`p-2 rounded-md transition-colors ${
              thread.isArchived
                ? "text-[hsl(var(--brand-teal))]"
                : "text-secondary hover:text-primary hover:bg-white/5"
            } ${actionLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            title={thread.isArchived ? "Unarchive" : "Archive"}
          >
            <Archive className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-md text-secondary hover:text-primary hover:bg-white/5 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {thread.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] ${
                msg.isOwn ? "order-2" : "order-1"
              }`}
            >
              <div
                className={`px-4 py-2.5 rounded-2xl ${
                  msg.isOwn
                    ? "bg-[hsl(var(--brand-orange))] text-black rounded-br-md"
                    : "bg-surface-strong border border-hairline text-primary rounded-bl-md"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{msg.body}</div>
              </div>
              <div
                className={`flex items-center gap-1.5 mt-1 text-[10px] text-secondary ${
                  msg.isOwn ? "justify-end" : "justify-start"
                }`}
              >
                <span>{formatTime(msg.timestamp)}</span>
                {msg.isOwn && msg.status && (
                  <>
                    {msg.status === "sent" && <Check className="w-3 h-3" />}
                    {msg.status === "delivered" && <CheckCheck className="w-3 h-3" />}
                    {msg.status === "read" && (
                      <CheckCheck className="w-3 h-3 text-[hsl(var(--brand-teal))]" />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Box */}
      <div className="p-4 border-t border-hairline bg-surface">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={replyText}
              onChange={(e) => onReplyTextChange(e.target.value)}
              placeholder="Type your message... (Ctrl+Enter to send)"
              rows={3}
              className="w-full px-4 py-3 text-sm bg-surface-strong border border-hairline rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50 focus:border-transparent"
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  onReply(replyText);
                }
              }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <button
              className="p-2 rounded-md text-secondary hover:text-primary hover:bg-white/5 transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenTemplatePicker}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-secondary hover:text-primary hover:bg-white/5 transition-colors text-sm"
              title="Use template (t)"
            >
              <FileText className="w-4 h-4" />
              <span>Template</span>
            </button>
          </div>
          <Button
            onClick={() => onReply(replyText)}
            disabled={!replyText.trim() || sending}
            className="px-4"
          >
            {sending ? (
              "Sending..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-1.5" />
                Send
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONTACT CONTEXT PANEL
   ═══════════════════════════════════════════════════════════════════════════ */

interface ContactPanelProps {
  contact: ConversationThread["contact"] | null;
  isOpen: boolean;
  onClose: () => void;
}

function ContactPanel({ contact, isOpen, onClose }: ContactPanelProps) {
  if (!isOpen || !contact) return null;

  return (
    <div className="w-72 flex-shrink-0 border-l border-hairline bg-surface-strong/30 overflow-y-auto">
      <div className="p-4 border-b border-hairline flex items-center justify-between">
        <span className="font-semibold text-sm">Contact Info</span>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-secondary hover:text-primary hover:bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Avatar & Name */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[hsl(var(--brand-orange))]/20 flex items-center justify-center mx-auto mb-2">
            <User className="w-8 h-8 text-[hsl(var(--brand-orange))]" />
          </div>
          <div className="font-semibold text-primary">{contact.name}</div>
          {contact.waitlistPosition && (
            <div className="text-xs text-[hsl(var(--brand-teal))] mt-1">
              Waitlist #{contact.waitlistPosition}
            </div>
          )}
        </div>

        {/* Contact Details */}
        <div className="space-y-2">
          {contact.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-secondary" />
              <span className="text-primary truncate">{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-secondary" />
              <span className="text-primary">{contact.phone}</span>
            </div>
          )}
          {contact.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-secondary" />
              <span className="text-primary">{contact.location}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">
              Tags
            </div>
            <div className="flex flex-wrap gap-1">
              {contact.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs rounded-full bg-surface-strong text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Animals of Interest */}
        {contact.animals && contact.animals.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">
              Interested In
            </div>
            <div className="space-y-1">
              {contact.animals.map((animal) => (
                <div
                  key={animal}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-surface-strong text-sm"
                >
                  <Dog className="w-4 h-4 text-[hsl(var(--brand-orange))]" />
                  <span>{animal}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-2 border-t border-hairline space-y-2">
          <button className="w-full px-3 py-2 text-sm text-left rounded-md hover:bg-white/5 transition-colors flex items-center gap-2">
            <Calendar className="w-4 h-4 text-secondary" />
            <span>Schedule Follow-up</span>
          </button>
          <button className="w-full px-3 py-2 text-sm text-left rounded-md hover:bg-white/5 transition-colors flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-secondary" />
            <span>Add to Waitlist</span>
          </button>
          <button className="w-full px-3 py-2 text-sm text-left rounded-md hover:bg-white/5 transition-colors flex items-center gap-2">
            <User className="w-4 h-4 text-secondary" />
            <span>View Full Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPOSE MODAL
   ═══════════════════════════════════════════════════════════════════════════ */

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: { channel: "email" | "dm"; contactId: number; subject?: string; body: string }) => void;
  onSaveDraft: (data: { channel: "email" | "dm"; partyId?: number; subject?: string; body: string; draftId?: number }) => Promise<number | null>;
  templates: EmailTemplate[];
  contacts: Array<{ id: number; name: string; email?: string }>;
  editingDraft?: { id: number; channel: "email" | "dm"; partyId?: number; subject?: string; body: string } | null;
}

function ComposeModal({ isOpen, onClose, onSend, onSaveDraft, templates, contacts, editingDraft }: ComposeModalProps) {
  const [channel, setChannel] = React.useState<"email" | "dm">("email");
  const [selectedContact, setSelectedContact] = React.useState<number | null>(null);
  const [contactSearch, setContactSearch] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [showTemplates, setShowTemplates] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [draftId, setDraftId] = React.useState<number | null>(null);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);

  // Load draft data when editing
  React.useEffect(() => {
    if (editingDraft) {
      setChannel(editingDraft.channel);
      setSelectedContact(editingDraft.partyId ?? null);
      setSubject(editingDraft.subject ?? "");
      setBody(editingDraft.body);
      setDraftId(editingDraft.id);
    } else {
      // Reset form when opening fresh
      setChannel("email");
      setSelectedContact(null);
      setSubject("");
      setBody("");
      setDraftId(null);
      setLastSaved(null);
    }
  }, [editingDraft, isOpen]);

  // Auto-save draft after typing stops (debounce)
  React.useEffect(() => {
    if (!isOpen || !body.trim()) return;

    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        const newDraftId = await onSaveDraft({
          channel,
          partyId: selectedContact ?? undefined,
          subject: channel === "email" ? subject : undefined,
          body,
          draftId: draftId ?? undefined,
        });
        if (newDraftId) {
          setDraftId(newDraftId);
          setLastSaved(new Date());
        }
      } catch (e) {
        console.error("Failed to auto-save draft:", e);
      } finally {
        setSaving(false);
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [body, subject, selectedContact, channel, isOpen, draftId, onSaveDraft]);

  const filteredContacts = React.useMemo(() => {
    if (!contactSearch.trim()) return contacts.slice(0, 10);
    const q = contactSearch.toLowerCase();
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
    );
  }, [contacts, contactSearch]);

  const selectedContactData = contacts.find((c) => c.id === selectedContact);

  const handleTemplateSelect = (template: EmailTemplate) => {
    if (template.subject) setSubject(template.subject);
    setBody(template.bodyText);
    setShowTemplates(false);
  };

  const handleSend = () => {
    if (!selectedContact || !body.trim()) return;
    setSending(true);
    onSend({
      channel,
      contactId: selectedContact,
      subject: channel === "email" ? subject : undefined,
      body,
    });
    // Reset form
    setTimeout(() => {
      setSending(false);
      setSelectedContact(null);
      setSubject("");
      setBody("");
      onClose();
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-surface border border-hairline rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">New Message</h2>
            <div className="text-sm text-secondary mt-0.5">
              Compose a new email or direct message
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-secondary hover:text-primary hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Channel Toggle */}
          <div>
            <label className="block text-xs text-secondary font-medium uppercase tracking-wide mb-1.5">
              Channel
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setChannel("email")}
                className={`flex-1 px-4 py-2.5 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                  channel === "email"
                    ? "border-[hsl(var(--brand-orange))] bg-[hsl(var(--brand-orange))]/10 text-[hsl(var(--brand-orange))]"
                    : "border-hairline text-secondary hover:border-[hsl(var(--brand-orange))]/50"
                }`}
              >
                <Mail className="w-4 h-4" />
                <span className="font-medium">Email</span>
              </button>
              <button
                onClick={() => setChannel("dm")}
                className={`flex-1 px-4 py-2.5 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                  channel === "dm"
                    ? "border-[hsl(var(--brand-orange))] bg-[hsl(var(--brand-orange))]/10 text-[hsl(var(--brand-orange))]"
                    : "border-hairline text-secondary hover:border-[hsl(var(--brand-orange))]/50"
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span className="font-medium">Direct Message</span>
              </button>
            </div>
          </div>

          {/* Contact Selection */}
          <div>
            <label className="block text-xs text-secondary font-medium uppercase tracking-wide mb-1.5">
              To
            </label>
            {selectedContact ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-surface-strong border border-hairline rounded-lg">
                <User className="w-4 h-4 text-secondary" />
                <span className="flex-1">{selectedContactData?.name}</span>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="text-secondary hover:text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Search contacts..."
                  className="w-full pl-9 pr-3 py-2 bg-surface-strong border border-hairline rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
                />
                {contactSearch && filteredContacts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-hairline rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                    {filteredContacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => {
                          setSelectedContact(contact.id);
                          setContactSearch("");
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-secondary" />
                        <span>{contact.name}</span>
                        {contact.email && (
                          <span className="text-xs text-secondary ml-auto">{contact.email}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subject (Email only) */}
          {channel === "email" && (
            <div>
              <label className="block text-xs text-secondary font-medium uppercase tracking-wide mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject..."
                className="w-full px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
              />
            </div>
          )}

          {/* Message Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs text-secondary font-medium uppercase tracking-wide">
                Message
              </label>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-xs text-[hsl(var(--brand-orange))] hover:underline flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                {showTemplates ? "Hide Templates" : "Use Template"}
              </button>
            </div>

            {/* Template Picker */}
            {showTemplates && (
              <div className="mb-3 p-3 bg-surface-strong border border-hairline rounded-lg max-h-48 overflow-y-auto">
                {templates.length === 0 ? (
                  <div className="text-sm text-secondary text-center py-4">
                    No templates available
                  </div>
                ) : (
                  <div className="space-y-1">
                    {templates
                      .filter((t) => t.category === channel)
                      .map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template)}
                          className="w-full px-3 py-2 text-left rounded-md hover:bg-white/5 transition-colors"
                        >
                          <div className="font-medium text-sm">{template.name}</div>
                          {template.subject && (
                            <div className="text-xs text-secondary truncate">{template.subject}</div>
                          )}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={8}
              className="w-full px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-hairline flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-md text-secondary hover:text-primary hover:bg-white/5">
              <Paperclip className="w-4 h-4" />
            </button>
            {/* Draft status indicator */}
            {(saving || lastSaved) && (
              <div className="flex items-center gap-1.5 text-xs text-secondary">
                {saving ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <Check className="w-3 h-3 text-[hsl(var(--brand-teal))]" />
                    <span>Draft saved</span>
                  </>
                ) : null}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              {body.trim() ? "Save & Close" : "Cancel"}
            </Button>
            <Button onClick={handleSend} disabled={!selectedContact || !body.trim() || sending}>
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS MODAL
   ═══════════════════════════════════════════════════════════════════════════ */

function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border border-hairline rounded-xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
          <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-secondary hover:text-primary hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-2">
          {KEYBOARD_SHORTCUTS.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-secondary">{shortcut.action}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="px-2 py-1 text-xs font-mono bg-surface-strong border border-hairline rounded"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CREATE TAG MODAL (for MESSAGE_THREAD tags)
   ═══════════════════════════════════════════════════════════════════════════ */

const TAG_COLOR_PALETTE = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
];

interface CreateTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; color: string | null }) => Promise<void>;
}

function CreateTagModal({ isOpen, onClose, onSubmit }: CreateTagModalProps) {
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState<string | null>(TAG_COLOR_PALETTE[0]);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setName("");
      setColor(TAG_COLOR_PALETTE[0]);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Tag name is required");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), color });
      onClose();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to create tag";
      const apiError = (err as any)?.body?.error || (err as any)?.body?.detail;
      setError(apiError || errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface border border-hairline rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-hairline flex items-center justify-between">
          <h2 className="text-base font-semibold">Create Message Tag</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-secondary hover:text-primary hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs text-secondary font-medium uppercase tracking-wide mb-1.5">
                Tag Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., VIP, Follow-up, Hot Lead"
                autoFocus
                className="w-full px-3 py-2 text-sm bg-surface-strong border border-hairline rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50 focus:border-transparent"
              />
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-xs text-secondary font-medium uppercase tracking-wide mb-1.5">
                Color
              </label>
              <div className="grid grid-cols-8 gap-1.5">
                {TAG_COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-md border-2 transition-all ${
                      color === c
                        ? "border-white scale-110 shadow-lg"
                        : "border-transparent hover:border-white/30"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Info text */}
            <p className="text-xs text-secondary">
              This tag will be available for organizing message threads in the Communications Hub.
            </p>

            {/* Error */}
            {error && (
              <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-md">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-hairline flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Creating..." : "Create Tag"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
   ═══════════════════════════════════════════════════════════════════════════ */

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function CommunicationsHub() {
  // State
  const [activeFolder, setActiveFolder] = React.useState<FolderType>("inbox");
  const [channelFilter, setChannelFilter] = React.useState<ChannelType>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTags, setSelectedTags] = React.useState<number[]>([]);
  const [selectedMessageId, setSelectedMessageId] = React.useState<string | null>(null);
  const [showContactPanel, setShowContactPanel] = React.useState(true);
  const [showComposeModal, setShowComposeModal] = React.useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = React.useState(false);
  const [replyText, setReplyText] = React.useState("");
  const [sending, setSending] = React.useState(false);

  // Data state
  const [messages, setMessages] = React.useState<UnifiedMessage[]>([]);
  const [selectedThread, setSelectedThread] = React.useState<ConversationThread | null>(null);
  const [templates, setTemplates] = React.useState<EmailTemplate[]>([]);
  const [contacts, setContacts] = React.useState<Array<{ id: number; name: string; email?: string }>>([]);
  const [loading, setLoading] = React.useState(true);
  const [threadLoading, setThreadLoading] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [inboxCounts, setInboxCounts] = React.useState<InboxCounts>({ unreadCount: 0, flaggedCount: 0, draftCount: 0 });

  // Bulk selection state
  const [bulkSelectedIds, setBulkSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = React.useState(false);

  // Draft editing state
  const [editingDraft, setEditingDraft] = React.useState<{
    id: number;
    channel: "email" | "dm";
    partyId?: number;
    subject?: string;
    body: string;
  } | null>(null);

  // Tags state - loaded from API
  const [messageTags, setMessageTags] = React.useState<TagDTO[]>([]);

  // Create tag modal state
  const [showCreateTagModal, setShowCreateTagModal] = React.useState(false);

  // Folder counts - combine local message data with backend counts
  const folderCounts = React.useMemo<Record<FolderType, number>>(() => {
    return {
      all: messages.filter((m) => !m.isArchived).length,
      inbox: inboxCounts.unreadCount,
      flagged: inboxCounts.flaggedCount,
      drafts: inboxCounts.draftCount,
      archived: messages.filter((m) => m.isArchived).length,
      email: messages.filter((m) => m.channel === "email" && !m.isArchived).length,
      dm: messages.filter((m) => m.channel === "dm" && !m.isArchived).length,
    };
  }, [messages, inboxCounts]);

  // Filtered messages based on active folder
  const filteredMessages = React.useMemo(() => {
    let filtered = [...messages];

    // Folder filter
    switch (activeFolder) {
      case "all":
        // All non-archived messages
        filtered = filtered.filter((m) => !m.isArchived);
        break;
      case "inbox":
        // Unread, non-archived - sorted by unread first
        filtered = filtered.filter((m) => !m.isArchived);
        filtered.sort((a, b) => {
          if (a.isUnread && !b.isUnread) return -1;
          if (!a.isUnread && b.isUnread) return 1;
          return b.timestamp.getTime() - a.timestamp.getTime();
        });
        break;
      case "flagged":
        filtered = filtered.filter((m) => m.isStarred && !m.isArchived);
        break;
      case "drafts":
        filtered = filtered.filter((m) => m.type === "draft");
        break;
      case "archived":
        filtered = filtered.filter((m) => m.isArchived);
        break;
      case "email":
        filtered = filtered.filter((m) => m.channel === "email" && !m.isArchived);
        break;
      case "dm":
        filtered = filtered.filter((m) => m.channel === "dm" && !m.isArchived);
        break;
    }

    // Channel filter (applies on top of folder filter for all/inbox/flagged)
    if (channelFilter !== "all" && !["email", "dm", "drafts"].includes(activeFolder)) {
      filtered = filtered.filter((m) => m.channel === channelFilter);
    }

    // Tag filter - TODO: Need to load tags per message from backend
    // For now, tag filtering is disabled until we implement tag loading per thread
    // if (selectedTags.length > 0) {
    //   filtered = filtered.filter((m) => m.tagIds?.some((tagId) => selectedTags.includes(tagId)));
    // }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.contactName.toLowerCase().includes(q) ||
          m.subject?.toLowerCase().includes(q) ||
          m.preview.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [messages, activeFolder, channelFilter, selectedTags, searchQuery]);

  // Load inbox data using communications API
  const loadInboxData = React.useCallback(async () => {
    setLoading(true);
    try {
      // Load from communications inbox API - gets DMs, emails, and drafts
      const inboxRes = await api.communications.inbox.list({
        status: "all", // Get all items so we can filter locally
        limit: 200,
      });

      // Transform backend CommunicationItem to UnifiedMessage
      const unified: UnifiedMessage[] = (inboxRes.items || []).map((item: CommunicationItem) => {
        // Parse the composite ID to get the numeric ID
        const [itemType, itemId] = item.id.split(":");
        const numericId = parseInt(itemId, 10);

        return {
          id: item.id,
          channel: item.channel,
          contactId: item.partyId,
          contactName: item.partyName || "Unknown",
          subject: item.subject ?? undefined,
          preview: item.preview,
          timestamp: new Date(item.updatedAt),
          isUnread: !item.isRead,
          isStarred: item.flagged,
          isArchived: item.archived,
          type: item.type,
          threadId: itemType === "thread" ? numericId : undefined,
          emailId: itemType === "email" ? numericId : undefined,
          draftId: itemType === "draft" ? numericId : undefined,
        };
      });

      setMessages(unified);

      // Also load counts for badges
      try {
        const counts = await api.communications.counts.get();
        setInboxCounts(counts);
      } catch (e) {
        console.log("Counts not available");
      }

      // Load templates
      try {
        const templatesRes = await api.templates.list({ isActive: true });
        setTemplates(templatesRes.items || []);
      } catch (e) {
        console.log("Templates not available");
      }

      // Load contacts
      try {
        const contactsRes = await api.contacts.list({ limit: 100 });
        setContacts(
          (contactsRes.items || []).map((c: ContactDTO) => ({
            id: Number(c.id),
            name: [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email || `Contact ${c.id}`,
            email: c.email ?? undefined,
          }))
        );
      } catch (e) {
        console.log("Contacts not available");
      }

      // Load MESSAGE_THREAD tags for sidebar
      try {
        const tagsRes = await api.tags.list({ module: "MESSAGE_THREAD" });
        setMessageTags(tagsRes.items || []);
      } catch (e) {
        console.log("Tags not available");
      }
    } catch (e) {
      console.error("Failed to load inbox:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial data
  React.useEffect(() => {
    loadInboxData();
  }, [loadInboxData]);

  // Toggle flag (star) on current thread
  const handleToggleFlag = React.useCallback(async () => {
    if (!selectedThread?.threadId) return;

    setActionLoading(true);
    try {
      const newFlagged = !selectedThread.isFlagged;
      await api.messages.threads.update(selectedThread.threadId, { flagged: newFlagged });

      // Update local state
      setSelectedThread((prev) => (prev ? { ...prev, isFlagged: newFlagged } : null));

      // Update messages list
      setMessages((prev) =>
        prev.map((m) =>
          m.id === selectedThread.id ? { ...m, isStarred: newFlagged } : m
        )
      );

      // Refresh counts
      const counts = await api.communications.counts.get();
      setInboxCounts(counts);
    } catch (e) {
      console.error("Failed to toggle flag:", e);
    } finally {
      setActionLoading(false);
    }
  }, [selectedThread]);

  // Toggle archive on current thread
  const handleToggleArchive = React.useCallback(async () => {
    if (!selectedThread?.threadId) return;

    setActionLoading(true);
    try {
      const newArchived = !selectedThread.isArchived;
      await api.messages.threads.update(selectedThread.threadId, { archived: newArchived });

      // Update local state
      setSelectedThread((prev) => (prev ? { ...prev, isArchived: newArchived } : null));

      // Update messages list
      setMessages((prev) =>
        prev.map((m) =>
          m.id === selectedThread.id ? { ...m, isArchived: newArchived } : m
        )
      );

      // If we archived, clear selection if in non-archived view
      if (newArchived && activeFolder !== "archived") {
        setSelectedMessageId(null);
        setSelectedThread(null);
      }

      // Refresh counts
      const counts = await api.communications.counts.get();
      setInboxCounts(counts);
    } catch (e) {
      console.error("Failed to toggle archive:", e);
    } finally {
      setActionLoading(false);
    }
  }, [selectedThread, activeFolder]);

  // Load thread when selection changes
  React.useEffect(() => {
    if (!selectedMessageId) {
      setSelectedThread(null);
      return;
    }

    const message = messages.find((m) => m.id === selectedMessageId);
    if (!message) return;

    async function loadThread() {
      setThreadLoading(true);
      try {
        if (message?.threadId) {
          const res = await api.messages.threads.get(message.threadId);
          const thread = res.thread;
          const otherParticipant = thread.participants?.find(
            (p: any) => p.party?.type !== "ORGANIZATION"
          );
          const orgParticipant = thread.participants?.find(
            (p: any) => p.party?.type === "ORGANIZATION"
          );

          setSelectedThread({
            id: `thread:${thread.id}`,
            channel: "dm",
            threadId: thread.id,
            isFlagged: thread.flagged,
            isArchived: thread.archived,
            contact: {
              id: otherParticipant?.partyId || 0,
              name: otherParticipant?.party?.name || "Unknown",
              email: otherParticipant?.party?.email,
              tags: ["Inquiry"],
            },
            subject: thread.subject,
            messages: (thread.messages || []).map((msg: Message) => ({
              id: String(msg.id),
              body: msg.body,
              timestamp: new Date(msg.createdAt),
              isOwn: msg.senderPartyId === orgParticipant?.partyId,
              status: "delivered" as const,
            })),
          });
        }
      } catch (e) {
        console.error("Failed to load thread:", e);
      } finally {
        setThreadLoading(false);
      }
    }

    loadThread();
  }, [selectedMessageId, messages]);

  // Keyboard shortcuts
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if typing in input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      switch (e.key) {
        case "j":
          // Next message
          e.preventDefault();
          const currentIdx = filteredMessages.findIndex((m) => m.id === selectedMessageId);
          if (currentIdx < filteredMessages.length - 1) {
            setSelectedMessageId(filteredMessages[currentIdx + 1].id);
          }
          break;
        case "k":
          // Previous message
          e.preventDefault();
          const prevIdx = filteredMessages.findIndex((m) => m.id === selectedMessageId);
          if (prevIdx > 0) {
            setSelectedMessageId(filteredMessages[prevIdx - 1].id);
          }
          break;
        case "s":
          // Star/flag current message
          if (selectedThread?.threadId) {
            e.preventDefault();
            handleToggleFlag();
          }
          break;
        case "e":
          // Archive current message
          if (selectedThread?.threadId) {
            e.preventDefault();
            handleToggleArchive();
          }
          break;
        case "c":
          e.preventDefault();
          setShowComposeModal(true);
          break;
        case "/":
          e.preventDefault();
          document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus();
          break;
        case "Escape":
          setShowComposeModal(false);
          setShowShortcutsModal(false);
          break;
        case "?":
          if (e.shiftKey) {
            e.preventDefault();
            setShowShortcutsModal(true);
          }
          break;
      }

      // Cmd+K for shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowShortcutsModal(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredMessages, selectedMessageId, selectedThread, handleToggleFlag, handleToggleArchive]);

  const handleReply = async (text: string) => {
    if (!text.trim() || !selectedThread?.threadId) return;

    setSending(true);
    try {
      await api.messages.threads.sendMessage(selectedThread.threadId, { body: text });

      // Add message to thread locally
      setSelectedThread((prev) =>
        prev
          ? {
              ...prev,
              messages: [
                ...prev.messages,
                {
                  id: `temp-${Date.now()}`,
                  body: text,
                  timestamp: new Date(),
                  isOwn: true,
                  status: "sent",
                },
              ],
            }
          : null
      );
      setReplyText("");
    } catch (e) {
      console.error("Failed to send:", e);
    } finally {
      setSending(false);
    }
  };

  const handleCompose = async (data: {
    channel: "email" | "dm";
    contactId: number;
    subject?: string;
    body: string;
  }) => {
    // Create a new DM thread
    if (data.channel === "dm") {
      try {
        const result = await api.messages.threads.create({
          recipientPartyId: data.contactId,
          subject: data.subject,
          initialMessage: data.body,
        });
        // Refresh inbox to show new thread
        loadInboxData();
        // Select the new thread
        if (result.thread?.id) {
          setSelectedMessageId(`thread:${result.thread.id}`);
        }
      } catch (e) {
        console.error("Failed to create thread:", e);
      }
    } else {
      // TODO: Handle email composition via drafts
      console.log("Email composing not yet implemented:", data);
    }
  };

  const handleTagToggle = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  // Open tag management (navigate to tag settings or show modal)
  const handleManageTags = () => {
    // For now, navigate to the marketing home which has settings
    window.location.href = "/marketing";
  };

  // Create a new MESSAGE_THREAD tag
  const handleCreateTag = async (data: { name: string; color: string | null }) => {
    await api.tags.create({
      name: data.name,
      module: "MESSAGE_THREAD",
      color: data.color,
    });
    // Refresh tags list
    try {
      const tagsRes = await api.tags.list({ module: "MESSAGE_THREAD" });
      setMessageTags(tagsRes.items || []);
    } catch (e) {
      console.error("Failed to refresh tags:", e);
    }
  };

  // Bulk selection handlers
  const handleToggleSelectMessage = React.useCallback((id: string) => {
    setBulkSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = React.useCallback(() => {
    setBulkSelectedIds(new Set(filteredMessages.map((m) => m.id)));
  }, [filteredMessages]);

  const handleClearSelection = React.useCallback(() => {
    setBulkSelectedIds(new Set());
  }, []);

  // Bulk action handlers
  const handleBulkArchive = React.useCallback(async () => {
    if (bulkSelectedIds.size === 0) return;

    setBulkActionLoading(true);
    try {
      const ids = Array.from(bulkSelectedIds);
      await api.communications.bulk.action({ ids, action: "archive" });

      // Update local state
      setMessages((prev) =>
        prev.map((m) => (bulkSelectedIds.has(m.id) ? { ...m, isArchived: true } : m))
      );

      // Clear selection
      setBulkSelectedIds(new Set());

      // Refresh counts
      const counts = await api.communications.counts.get();
      setInboxCounts(counts);
    } catch (e) {
      console.error("Failed to bulk archive:", e);
    } finally {
      setBulkActionLoading(false);
    }
  }, [bulkSelectedIds]);

  const handleBulkFlag = React.useCallback(async () => {
    if (bulkSelectedIds.size === 0) return;

    setBulkActionLoading(true);
    try {
      const ids = Array.from(bulkSelectedIds);
      await api.communications.bulk.action({ ids, action: "flag" });

      // Update local state
      setMessages((prev) =>
        prev.map((m) => (bulkSelectedIds.has(m.id) ? { ...m, isStarred: true } : m))
      );

      // Clear selection
      setBulkSelectedIds(new Set());

      // Refresh counts
      const counts = await api.communications.counts.get();
      setInboxCounts(counts);
    } catch (e) {
      console.error("Failed to bulk flag:", e);
    } finally {
      setBulkActionLoading(false);
    }
  }, [bulkSelectedIds]);

  const handleBulkMarkRead = React.useCallback(async () => {
    if (bulkSelectedIds.size === 0) return;

    setBulkActionLoading(true);
    try {
      const ids = Array.from(bulkSelectedIds);
      await api.communications.bulk.action({ ids, action: "markRead" });

      // Update local state
      setMessages((prev) =>
        prev.map((m) => (bulkSelectedIds.has(m.id) ? { ...m, isUnread: false } : m))
      );

      // Clear selection
      setBulkSelectedIds(new Set());

      // Refresh counts
      const counts = await api.communications.counts.get();
      setInboxCounts(counts);
    } catch (e) {
      console.error("Failed to bulk mark read:", e);
    } finally {
      setBulkActionLoading(false);
    }
  }, [bulkSelectedIds]);

  // Save draft handler
  const handleSaveDraft = React.useCallback(
    async (data: {
      channel: "email" | "dm";
      partyId?: number;
      subject?: string;
      body: string;
      draftId?: number;
    }): Promise<number | null> => {
      try {
        if (data.draftId) {
          // Update existing draft
          await api.drafts.update(data.draftId, {
            partyId: data.partyId ?? null,
            subject: data.subject ?? null,
            bodyText: data.body,
          });
          return data.draftId;
        } else {
          // Create new draft
          const draft = await api.drafts.create({
            channel: data.channel,
            partyId: data.partyId,
            subject: data.subject,
            bodyText: data.body,
          });
          // Refresh inbox to show new draft
          loadInboxData();
          return draft.id;
        }
      } catch (e) {
        console.error("Failed to save draft:", e);
        return null;
      }
    },
    [loadInboxData]
  );

  // Handle opening a draft for editing
  const handleOpenDraft = React.useCallback(async (draftId: number) => {
    try {
      const draft = await api.drafts.get(draftId);
      setEditingDraft({
        id: draft.id,
        channel: draft.channel,
        partyId: draft.partyId ?? undefined,
        subject: draft.subject ?? undefined,
        body: draft.bodyText,
      });
      setShowComposeModal(true);
    } catch (e) {
      console.error("Failed to load draft:", e);
    }
  }, []);

  // Handle selecting a message - if it's a draft, open it for editing
  const handleSelectMessage = React.useCallback(
    (id: string) => {
      const message = messages.find((m) => m.id === id);
      if (message?.type === "draft" && message.draftId) {
        handleOpenDraft(message.draftId);
      } else {
        setSelectedMessageId(id);
      }
    },
    [messages, handleOpenDraft]
  );

  return (
    <div className="h-screen flex flex-col bg-canvas">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-hairline bg-surface flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--brand-orange))] to-[hsl(var(--brand-teal))] flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary">Communications Hub</h1>
            <p className="text-xs text-secondary">All your messages in one place</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowShortcutsModal(true)}>
            <Command className="w-4 h-4 mr-1" />
            <span className="text-xs">K</span>
          </Button>
          <Button onClick={() => setShowComposeModal(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Compose
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeFolder={activeFolder}
          onFolderChange={setActiveFolder}
          folderCounts={folderCounts}
          tags={messageTags}
          selectedTags={selectedTags}
          onManageTags={handleManageTags}
          onTagToggle={handleTagToggle}
          onCreateTag={() => setShowCreateTagModal(true)}
        />

        {/* Conversation List */}
        <ConversationList
          messages={filteredMessages}
          selectedId={selectedMessageId}
          onSelect={handleSelectMessage}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          channelFilter={channelFilter}
          onChannelFilterChange={setChannelFilter}
          selectedIds={bulkSelectedIds}
          onToggleSelect={handleToggleSelectMessage}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onBulkArchive={handleBulkArchive}
          onBulkFlag={handleBulkFlag}
          onBulkMarkRead={handleBulkMarkRead}
          bulkActionLoading={bulkActionLoading}
        />

        {/* Thread View */}
        <ThreadView
          thread={selectedThread}
          loading={threadLoading}
          onReply={handleReply}
          onOpenTemplatePicker={() => setShowComposeModal(true)}
          replyText={replyText}
          onReplyTextChange={setReplyText}
          sending={sending}
          onToggleFlag={handleToggleFlag}
          onToggleArchive={handleToggleArchive}
          actionLoading={actionLoading}
        />

        {/* Contact Panel */}
        <ContactPanel
          contact={selectedThread?.contact || null}
          isOpen={showContactPanel && !!selectedThread}
          onClose={() => setShowContactPanel(false)}
        />
      </div>

      {/* Modals */}
      <ComposeModal
        isOpen={showComposeModal}
        onClose={() => {
          setShowComposeModal(false);
          setEditingDraft(null);
        }}
        onSend={handleCompose}
        onSaveDraft={handleSaveDraft}
        templates={templates}
        contacts={contacts}
        editingDraft={editingDraft}
      />

      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      <CreateTagModal
        isOpen={showCreateTagModal}
        onClose={() => setShowCreateTagModal(false)}
        onSubmit={handleCreateTag}
      />
    </div>
  );
}
