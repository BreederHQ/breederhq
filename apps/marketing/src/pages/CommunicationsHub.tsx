// apps/marketing/src/pages/CommunicationsHub.tsx
// Unified Communications Hub - The FIRE messaging experience for breeders

import * as React from "react";
import { makeApi } from "@bhq/api";
import { useWebSocket, type WebSocketEvent } from "../hooks/useWebSocket";
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
  EmailLookupMatch,
} from "@bhq/api";
import { Button, Input, Badge, TagCreateModal, Tabs, SectionCard, useToast } from "@bhq/ui";
import { TemplateCreateEditModal } from "../components/TemplateCreateEditModal";
import { createTemplatePreview } from "@bhq/ui/utils";
import type { TemplateCategory } from "@bhq/api";
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
  AlertCircle,
  Loader2,
  UserPlus,
  Edit2,
  AlertTriangle,
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
type FolderType = "all" | "inbox" | "sent" | "flagged" | "drafts" | "archived" | "email" | "dm" | "templates";

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
  // Direction for sent folder filtering
  direction?: "inbound" | "outbound";
  // Breeder meta - enriched contact insights
  meta?: {
    leadStatus?: "prospect" | "lead" | "customer" | "inactive" | string;
    waitlistPosition?: number | null;
    waitlistPlanName?: string | null; // e.g., "Spring 2025 Litter"
    hasActiveDeposit?: boolean;
    depositPlanName?: string | null;
    totalPurchases?: number; // lifetime value in cents
    animalsOwned?: number; // count of animals they own from this breeder
    lastContactedDaysAgo?: number | null;
    location?: string | null; // e.g., "Austin, TX"
  };
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
  { id: "sent", label: "Sent", icon: <Send className="w-4 h-4" />, status: "sent" },
  { id: "flagged", label: "Flagged", icon: <Star className="w-4 h-4" />, status: "flagged", dividerAfter: true },
  { id: "drafts", label: "Drafts", icon: <FileText className="w-4 h-4" />, status: "draft" },
  { id: "archived", label: "Archived", icon: <Archive className="w-4 h-4" />, status: "archived", dividerAfter: true },
  { id: "email", label: "Email", icon: <Mail className="w-4 h-4" />, status: "all" },
  { id: "dm", label: "Direct Messages", icon: <MessageCircle className="w-4 h-4" />, status: "all", dividerAfter: true },
  { id: "templates", label: "Templates", icon: <FileText className="w-4 h-4" /> },
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
   SIDEBAR COMPONENT - Refined visual design
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
    <div className="w-56 flex-shrink-0 border-r border-hairline bg-surface flex flex-col">
      {/* Folders */}
      <div className="flex-1 overflow-y-auto py-3">
        <div className="px-4 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Folders
          </span>
        </div>
        {SMART_FOLDERS.map((folder) => {
          const count = folderCounts[folder.id] || 0;
          const isActive = activeFolder === folder.id;
          const isInbox = folder.id === "inbox";
          return (
            <React.Fragment key={folder.id}>
              <button
                onClick={() => onFolderChange(folder.id)}
                className={`
                  w-full px-4 py-2 flex items-center gap-3 text-sm transition-all duration-150 relative
                  ${isActive
                    ? "text-white bg-white/[0.08]"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                  }
                `}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[hsl(var(--brand-orange))] rounded-r" />
                )}
                <span className={isActive ? "text-[hsl(var(--brand-orange))]" : "text-gray-500"}>
                  {folder.icon}
                </span>
                <span className="flex-1 text-left truncate">{folder.label}</span>
                {count > 0 && (
                  <span
                    className={`
                      text-[11px] tabular-nums min-w-[20px] text-center
                      ${isInbox && count > 0
                        ? "px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold"
                        : isActive
                        ? "text-gray-300"
                        : "text-gray-500"
                      }
                    `}
                  >
                    {count}
                  </span>
                )}
              </button>
              {folder.dividerAfter && <div className="my-2 mx-4 border-t border-hairline" />}
            </React.Fragment>
          );
        })}

        {/* Tags Section */}
        <div className="my-2 mx-4 border-t border-hairline" />
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Tags
          </span>
          <button
            onClick={onManageTags}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Manage
          </button>
        </div>
        {tags.length === 0 ? (
          <div className="px-4 py-2 text-xs text-gray-500">
            No tags yet.{" "}
            <button onClick={onCreateTag} className="text-cyan-400 hover:text-cyan-300 transition-colors">
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
                className={`
                  w-full px-4 py-1.5 flex items-center gap-3 text-sm transition-all duration-150
                  ${isSelected
                    ? "text-cyan-400 bg-cyan-500/10"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                  }
                `}
              >
                {tag.color ? (
                  <div
                    className="w-2.5 h-2.5 rounded-full ring-2 ring-white/10"
                    style={{ backgroundColor: tag.color }}
                  />
                ) : (
                  <Hash className="w-3.5 h-3.5 text-gray-500" />
                )}
                <span className="flex-1 text-left truncate">{tag.name}</span>
              </button>
            );
          })
        )}
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="p-4 border-t border-hairline">
        <div className="flex items-center gap-2 text-[11px] text-gray-500">
          <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded font-mono text-[10px]">
            <Command className="w-2.5 h-2.5 inline" />K
          </kbd>
          <span>Shortcuts</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TEMPLATES PANEL COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  email: "Email",
  dm: "Direct Messages",
  social: "Social Drafts",
};

const TAB_TO_CATEGORY: Record<string, TemplateCategory | null> = {
  all: null,
  email: "email",
  dm: "dm",
  social: "social",
};

interface TemplateItemProps {
  template: EmailTemplate;
  onEdit: () => void;
  onDelete: () => void;
}

function TemplateItem({ template, onEdit, onDelete }: TemplateItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  return (
    <div className="flex items-start justify-between py-4 px-4 rounded-lg border border-hairline bg-surface hover:border-[hsl(var(--brand-orange))]/30 transition-colors group">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center">
          <FileText className="h-4 w-4 text-[hsl(var(--brand-orange))]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-primary">{template.name}</div>
          <div className="text-xs text-secondary mt-0.5">
            {CATEGORY_LABELS[template.category]}
          </div>
          {template.subject && (
            <div className="text-xs text-secondary mt-1 truncate">
              Subject: {template.subject}
            </div>
          )}
          <div className="text-xs text-secondary mt-1 line-clamp-2">
            {createTemplatePreview(template.bodyText).substring(0, 120)}
            {template.bodyText.length > 120 && "..."}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 ml-3">
        {showDeleteConfirm ? (
          <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-md">
            <span className="text-xs text-red-400">Delete?</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeleteConfirm(false)}
              className="h-6 px-2 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onDelete}
              className="h-6 px-2 text-xs bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </div>
        ) : (
          <>
            <button
              onClick={onEdit}
              className="p-2 rounded-md text-secondary hover:text-primary hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"
              title="Edit template"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-md text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
              title="Delete template"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function TemplatesEmptyState({ category, onCreate }: { category: string | null; onCreate: () => void }) {
  const categoryLabel = category ? CATEGORY_LABELS[category as TemplateCategory] : "templates";

  return (
    <div className="py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-surface-strong mx-auto mb-4 flex items-center justify-center">
        <FileText className="h-6 w-6 text-secondary" />
      </div>
      <div className="text-sm text-primary font-medium mb-1">
        No {categoryLabel.toLowerCase()} templates yet
      </div>
      <p className="text-xs text-secondary mb-4 max-w-xs mx-auto">
        Create reusable templates to save time when communicating with contacts.
      </p>
      <Button size="sm" onClick={onCreate}>
        <Plus className="h-4 w-4 mr-1.5" />
        Create Template
      </Button>
    </div>
  );
}

interface TemplatesPanelProps {
  api: ReturnType<typeof makeApi>;
}

function TemplatesPanel({ api }: TemplatesPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState("all");
  const [templates, setTemplates] = React.useState<EmailTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Modal state
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<"create" | "edit">("create");
  const [editingTemplate, setEditingTemplate] = React.useState<EmailTemplate | undefined>();

  const tabItems = [
    { value: "all", label: "All" },
    { value: "email", label: "Email" },
    { value: "dm", label: "DMs" },
    { value: "social", label: "Social" },
  ];

  // Fetch templates
  const fetchTemplates = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const category = TAB_TO_CATEGORY[activeTab];
      const res = await api.templates.list(category ? { category } : undefined);
      setTemplates(res.items);
    } catch (e: any) {
      console.error("[TemplatesPanel] Failed to fetch templates:", e);
      setError(e?.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, [activeTab, api]);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Filter templates by search and active tab
  const filteredTemplates = React.useMemo(() => {
    const category = TAB_TO_CATEGORY[activeTab];
    let result = category ? templates.filter((t) => t.category === category) : templates;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.subject?.toLowerCase().includes(q) ||
          t.bodyText.toLowerCase().includes(q)
      );
    }

    return result;
  }, [templates, activeTab, searchQuery]);

  const handleCreateTemplate = () => {
    setModalMode("create");
    setEditingTemplate(undefined);
    setModalOpen(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setModalMode("edit");
    setEditingTemplate(template);
    setModalOpen(true);
  };

  const handleDeleteTemplate = async (template: EmailTemplate) => {
    try {
      await api.templates.delete(template.id);
      toast.success(`Template "${template.name}" deleted`);
      fetchTemplates();
    } catch (e: any) {
      console.error("[TemplatesPanel] Failed to delete template:", e);
      toast.error(e?.message || "Failed to delete template");
    }
  };

  const handleModalSuccess = () => {
    toast.success(modalMode === "create" ? "Template created" : "Template updated");
    fetchTemplates();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-hairline">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-primary">Templates</h2>
            <p className="text-xs text-secondary">Create and manage reusable message templates</p>
          </div>
          <Button size="sm" onClick={handleCreateTemplate}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Template
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-surface-strong border border-hairline rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50 focus:border-transparent"
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          items={tabItems}
          variant="underline-orange"
          size="sm"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="py-8 text-center text-sm text-secondary">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
            Loading templates...
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 mx-auto mb-4 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <div className="text-sm text-red-400 mb-2">{error}</div>
            <Button variant="outline" size="sm" onClick={fetchTemplates}>
              Retry
            </Button>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <TemplatesEmptyState
            category={TAB_TO_CATEGORY[activeTab]}
            onCreate={handleCreateTemplate}
          />
        ) : (
          <div className="space-y-2">
            {filteredTemplates.map((template) => (
              <TemplateItem
                key={template.id}
                template={template}
                onEdit={() => handleEditTemplate(template)}
                onDelete={() => handleDeleteTemplate(template)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <TemplateCreateEditModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        template={editingTemplate}
        api={{ templates: api.templates }}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONVERSATION LIST COMPONENT - Redesigned for clarity and visual hierarchy
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
  onBulkDelete: () => void;
  bulkActionLoading: boolean;
  // For showing delete button only when drafts are selected
  hasDraftsSelected: boolean;
}

// Lead status badge colors
const LEAD_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  customer: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  lead: { bg: "bg-cyan-500/20", text: "text-cyan-400" },
  prospect: { bg: "bg-amber-500/20", text: "text-amber-400" },
  inactive: { bg: "bg-gray-500/20", text: "text-gray-400" },
};

// Format currency for display
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// Message item component - card style like breeding plans
function MessageListItem({
  msg,
  isViewing,
  isChecked,
  onSelect,
  onToggleSelect,
}: {
  msg: UnifiedMessage;
  isViewing: boolean;
  isChecked: boolean;
  onSelect: () => void;
  onToggleSelect: () => void;
}) {
  const isUnread = msg.isUnread;
  const meta = msg.meta;
  // Channel accent color - blue for email, violet for DM (like status colors on breeding plan cards)
  const accentColor = msg.channel === "email" ? "#3b82f6" : "#8b5cf6";

  // Build meta chips to display - icons + labels for quick scanning
  const metaChips: { label: string; color: string; icon?: React.ReactNode }[] = [];

  // Lead status with icon
  if (meta?.leadStatus) {
    const colors = LEAD_STATUS_COLORS[meta.leadStatus] || LEAD_STATUS_COLORS.prospect;
    const icon = meta.leadStatus === "customer"
      ? <CheckCheck className="w-3 h-3" />
      : meta.leadStatus === "lead"
      ? <Zap className="w-3 h-3" />
      : <User className="w-3 h-3" />;
    metaChips.push({
      label: meta.leadStatus.charAt(0).toUpperCase() + meta.leadStatus.slice(1),
      color: `${colors.bg} ${colors.text}`,
      icon,
    });
  }

  // Waitlist position - high priority info for breeders
  if (meta?.waitlistPosition) {
    metaChips.push({
      label: `#${meta.waitlistPosition}`,
      color: "bg-violet-500/20 text-violet-400",
      icon: <ClipboardList className="w-3 h-3" />,
    });
  }

  // Active deposit - critical financial info
  if (meta?.hasActiveDeposit) {
    metaChips.push({
      label: meta.depositPlanName || "Deposit",
      color: "bg-green-500/20 text-green-400",
      icon: <Check className="w-3 h-3" />,
    });
  }

  // Animals owned - relationship depth indicator
  if (meta?.animalsOwned && meta.animalsOwned > 0) {
    metaChips.push({
      label: `${meta.animalsOwned}`,
      color: "bg-pink-500/20 text-pink-400",
      icon: <Dog className="w-3 h-3" />,
    });
  }

  // Lifetime value - $$$ indicator
  if (meta?.totalPurchases && meta.totalPurchases > 0) {
    metaChips.push({
      label: formatCurrency(meta.totalPurchases),
      color: "bg-teal-500/20 text-teal-400",
    });
  }

  // Location
  if (meta?.location) {
    metaChips.push({
      label: meta.location,
      color: "bg-slate-500/20 text-slate-400",
      icon: <MapPin className="w-3 h-3" />,
    });
  }

  // User-applied tags from the message
  if (msg.tags && msg.tags.length > 0) {
    msg.tags.slice(0, 2).forEach((tag) => {
      metaChips.push({
        label: tag,
        color: "bg-orange-500/20 text-orange-400",
        icon: <Tag className="w-3 h-3" />,
      });
    });
  }

  return (
    <div className="px-2 py-1 first:pt-2">
      <button
        onClick={onSelect}
        className={`
          group relative w-full text-left bg-surface border border-hairline rounded-lg
          p-3 pl-4 overflow-hidden transition-all duration-200 cursor-pointer
          hover:border-[hsl(var(--foreground)/0.2)] hover:bg-[hsl(var(--foreground)/0.03)]
          hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/15
          ${isViewing ? "border-[hsl(var(--brand-orange)/0.5)] bg-[hsl(var(--brand-orange)/0.05)]" : ""}
        `}
      >
        {/* Left accent stripe - colored by channel (like status colors on breeding plan cards) */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
          style={{ backgroundColor: isViewing ? "hsl(var(--brand-orange))" : accentColor }}
        />

        {/* Row 1: Sender + unread dot + star + timestamp */}
        <div className="flex items-center gap-2 mb-1">
          {isUnread && (
            <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
          )}
          <span
            className={`
              text-sm truncate flex-1
              ${isUnread ? "font-semibold text-primary" : "font-normal text-secondary"}
            `}
          >
            {msg.contactName}
          </span>
          {msg.isStarred && (
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
          )}
          <span className={`text-[11px] flex-shrink-0 tabular-nums ${isUnread ? "text-secondary" : "text-secondary/60"}`}>
            {formatRelativeTime(msg.timestamp)}
          </span>
        </div>

        {/* Row 2: Subject */}
        {msg.subject && (
          <div
            className={`
              text-sm truncate
              ${isUnread ? "text-primary/80" : "text-secondary"}
            `}
          >
            {msg.subject}
          </div>
        )}

        {/* Row 3: Preview */}
        <div className="text-xs text-secondary/60 truncate mt-1">
          {msg.preview}
        </div>

        {/* Row 4: Meta chips - breeder insights with icons */}
        {metaChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-hairline/50">
            {metaChips.slice(0, 4).map((chip, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${chip.color}`}
              >
                {chip.icon}
                {chip.label}
              </span>
            ))}
            {metaChips.length > 4 && (
              <span className="text-[10px] text-secondary/50">
                +{metaChips.length - 4}
              </span>
            )}
          </div>
        )}
      </button>
    </div>
  );
}

// Date group header component
function DateGroupHeader({ label }: { label: string }) {
  return (
    <div className="sticky top-0 z-10 px-3 py-2 bg-surface/95 backdrop-blur-sm">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </span>
    </div>
  );
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
  onBulkDelete,
  bulkActionLoading,
  hasDraftsSelected,
}: ConversationListProps) {
  const hasSelection = selectedIds.size > 0;
  const allSelected = messages.length > 0 && selectedIds.size === messages.length;

  // Group messages by date
  const groupedMessages = React.useMemo(() => {
    const groups: { label: string; messages: UnifiedMessage[] }[] = [];
    let currentGroup: string | null = null;

    messages.forEach((msg) => {
      const group = getDateGroup(msg.timestamp);
      if (group !== currentGroup) {
        groups.push({ label: group, messages: [msg] });
        currentGroup = group;
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  }, [messages]);

  // Count unread
  const unreadCount = messages.filter((m) => m.isUnread).length;

  return (
    <div className="w-[340px] flex-shrink-0 border-r border-hairline flex flex-col bg-surface">
      {/* Bulk Actions Bar */}
      {hasSelection && (
        <div className="flex-shrink-0 px-3 py-2 border-b border-hairline bg-cyan-500/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onClearSelection}
              className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-cyan-400">
              {selectedIds.size} selected
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={onBulkMarkRead}
              disabled={bulkActionLoading}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
              title="Mark as read"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={onBulkFlag}
              disabled={bulkActionLoading}
              className="p-2 rounded-md text-gray-400 hover:text-amber-400 hover:bg-white/10 disabled:opacity-50 transition-colors"
              title="Flag selected"
            >
              <Star className="w-4 h-4" />
            </button>
            <button
              onClick={onBulkArchive}
              disabled={bulkActionLoading}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
              title="Archive selected"
            >
              <Archive className="w-4 h-4" />
            </button>
            {hasDraftsSelected && (
              <button
                onClick={onBulkDelete}
                disabled={bulkActionLoading}
                className="p-2 rounded-md text-gray-400 hover:text-red-400 hover:bg-white/10 disabled:opacity-50 transition-colors"
                title="Delete selected drafts"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex-shrink-0 p-3 border-b border-hairline space-y-2">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search messages..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-white/5 border border-white/10 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50
                     placeholder:text-gray-500 text-white transition-all"
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Channel toggle + unread count */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex p-1 bg-white/5 rounded-lg">
            {(["all", "email", "dm"] as ChannelType[]).map((ch) => (
              <button
                key={ch}
                onClick={() => onChannelFilterChange(ch)}
                className={`
                  flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150
                  ${channelFilter === ch
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-300"
                  }
                `}
              >
                {ch === "all" ? "All" : ch === "email" ? "Email" : "DMs"}
              </button>
            ))}
          </div>

          {/* Unread badge */}
          {unreadCount > 0 && (
            <div className="flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-cyan-500/20 text-cyan-400">
              <span className="text-[11px] font-bold">{unreadCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Message List with date grouping */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-500 mb-3" />
            <span className="text-sm text-gray-500">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Inbox className="w-7 h-7 text-gray-500" />
            </div>
            <div className="text-sm font-medium text-gray-300 mb-1">No messages</div>
            <div className="text-xs text-gray-500 max-w-[200px]">
              {searchQuery
                ? "Try adjusting your search terms"
                : "When you receive messages, they'll appear here"
              }
            </div>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.label}>
              <DateGroupHeader label={group.label} />
              {group.messages.map((msg) => (
                <MessageListItem
                  key={msg.id}
                  msg={msg}
                  isViewing={selectedId === msg.id}
                  isChecked={selectedIds.has(msg.id)}
                  onSelect={() => onSelect(msg.id)}
                  onToggleSelect={() => onToggleSelect(msg.id)}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MESSAGE THREAD VIEW COMPONENT - Enhanced visual design
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

// Action button component for thread header
function ThreadActionButton({
  onClick,
  disabled,
  isActive,
  activeColor,
  icon: Icon,
  title,
}: {
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
  activeColor?: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        p-2 rounded-lg transition-all duration-150
        ${isActive
          ? `${activeColor || "text-cyan-400"} bg-white/5`
          : "text-gray-500 hover:text-white hover:bg-white/5"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
      title={title}
    >
      <Icon className={`w-4 h-4 ${isActive && activeColor?.includes("amber") ? "fill-amber-400" : ""}`} />
    </button>
  );
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
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-surface to-canvas">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
          <span className="text-sm text-gray-500">Loading conversation...</span>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-surface to-canvas">
        <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-5">
          <MessageCircle className="w-10 h-10 text-gray-600" />
        </div>
        <div className="text-lg font-semibold text-gray-300 mb-2">Select a conversation</div>
        <div className="text-sm text-gray-500 max-w-xs">
          Choose a message from the list to view the full conversation
        </div>
        <div className="mt-8 flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded font-mono">j</kbd>
            <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded font-mono">k</kbd>
          </div>
          <span>to navigate</span>
        </div>
      </div>
    );
  }

  // Derive initials for avatar
  const initials = thread.contact.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Email view - traditional email layout
  if (thread.channel === "email") {
    const emailMessage = thread.messages[0];
    return (
      <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-gradient-to-br from-surface to-canvas">
        {/* Email Header - Enhanced */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-hairline bg-surface/50 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold text-white mb-3 leading-tight">
                {thread.subject || "(No Subject)"}
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-blue-600/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blue-400">{initials}</span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white">
                    To: {thread.contact.email || thread.contact.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    {emailMessage && (
                      <span>{formatTime(emailMessage.timestamp)}</span>
                    )}
                    <span className="flex items-center gap-1 text-cyan-400">
                      <CheckCheck className="w-3 h-3" />
                      Sent
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <ThreadActionButton
                onClick={onToggleFlag}
                disabled={actionLoading}
                isActive={thread.isFlagged}
                activeColor="text-amber-400"
                icon={Star}
                title={thread.isFlagged ? "Remove flag" : "Flag message"}
              />
              <ThreadActionButton
                onClick={onToggleArchive}
                disabled={actionLoading}
                isActive={thread.isArchived}
                activeColor="text-cyan-400"
                icon={Archive}
                title={thread.isArchived ? "Unarchive" : "Archive"}
              />
              <ThreadActionButton
                onClick={() => {}}
                icon={MoreHorizontal}
                title="More options"
              />
            </div>
          </div>
        </div>

        {/* Email Body - Enhanced */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <div className="max-w-3xl">
            {emailMessage ? (
              <div className="whitespace-pre-wrap text-gray-200 leading-relaxed text-[15px]">
                {emailMessage.body}
              </div>
            ) : (
              <div className="text-gray-500 italic">No content</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // DM view - chat bubble layout
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-surface to-canvas">
      {/* Thread Header - Enhanced */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-hairline flex items-center justify-between bg-surface/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/30 to-violet-600/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-violet-400">{initials}</span>
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-white truncate">{thread.contact.name}</div>
            {thread.subject && (
              <div className="text-sm text-gray-400 truncate">{thread.subject}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThreadActionButton
            onClick={onToggleFlag}
            disabled={actionLoading}
            isActive={thread.isFlagged}
            activeColor="text-amber-400"
            icon={Star}
            title={thread.isFlagged ? "Remove flag" : "Flag message"}
          />
          <ThreadActionButton
            onClick={onToggleArchive}
            disabled={actionLoading}
            isActive={thread.isArchived}
            activeColor="text-cyan-400"
            icon={Archive}
            title={thread.isArchived ? "Unarchive" : "Archive"}
          />
          <ThreadActionButton
            onClick={() => {}}
            icon={MoreHorizontal}
            title="More options"
          />
        </div>
      </div>

      {/* Messages Area - Enhanced bubbles */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {thread.messages.map((msg, index) => {
          // Check if we should show date separator
          const prevMsg = thread.messages[index - 1];
          const showDateSeparator = !prevMsg ||
            getDateGroup(msg.timestamp) !== getDateGroup(prevMsg.timestamp);

          return (
            <React.Fragment key={msg.id}>
              {showDateSeparator && (
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-hairline" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                    {getDateGroup(msg.timestamp)}
                  </span>
                  <div className="flex-1 h-px bg-hairline" />
                </div>
              )}
              <div className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] ${msg.isOwn ? "order-2" : "order-1"}`}>
                  <div
                    className={`
                      px-4 py-3 rounded-2xl shadow-sm
                      ${msg.isOwn
                        ? "bg-gradient-to-br from-[hsl(var(--brand-orange))] to-[hsl(var(--brand-orange))]/90 text-black rounded-br-md"
                        : "bg-white/[0.08] border border-white/10 text-gray-100 rounded-bl-md"
                      }
                    `}
                  >
                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.body}</div>
                  </div>
                  <div
                    className={`
                      flex items-center gap-1.5 mt-1.5 text-[10px] text-gray-500
                      ${msg.isOwn ? "justify-end pr-1" : "justify-start pl-1"}
                    `}
                  >
                    <span>{formatTime(msg.timestamp)}</span>
                    {msg.isOwn && msg.status && (
                      <>
                        {msg.status === "sent" && <Check className="w-3 h-3" />}
                        {msg.status === "delivered" && <CheckCheck className="w-3 h-3" />}
                        {msg.status === "read" && (
                          <CheckCheck className="w-3 h-3 text-cyan-400" />
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Box - Enhanced */}
      <div className="flex-shrink-0 p-4 border-t border-hairline bg-surface/50 backdrop-blur-sm">
        <div className="flex gap-3">
          <div className="flex-1">
            <textarea
              value={replyText}
              onChange={(e) => onReplyTextChange(e.target.value)}
              placeholder="Type your message..."
              rows={2}
              className="
                w-full px-4 py-3 text-[15px] bg-white/5 border border-white/10 rounded-xl
                resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50
                placeholder:text-gray-500 text-white transition-all
              "
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  onReply(replyText);
                }
              }}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
            />
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            <button
              className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenTemplatePicker}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors text-sm"
              title="Use template (t)"
            >
              <FileText className="w-4 h-4" />
              <span>Template</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500">
              Ctrl+Enter to send
            </span>
            <Button
              onClick={() => onReply(replyText)}
              disabled={!replyText.trim() || sending}
              className="px-5"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                  Sending...
                </>
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
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONTACT CONTEXT PANEL - Streamlined for quick context
   ═══════════════════════════════════════════════════════════════════════════ */

interface ContactPanelProps {
  contact: ConversationThread["contact"] | null;
  isOpen: boolean;
  onClose: () => void;
}

function ContactPanel({ contact, isOpen, onClose }: ContactPanelProps) {
  if (!isOpen || !contact) return null;

  // Derive initials for avatar
  const initials = contact.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-64 flex-shrink-0 border-l border-hairline bg-surface flex flex-col">
      {/* Contact header - compact */}
      <div className="p-4 border-b border-hairline">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--brand-orange))]/30 to-[hsl(var(--brand-teal))]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white truncate">{contact.name}</div>
            {contact.email && (
              <div className="text-xs text-gray-500 truncate">{contact.email}</div>
            )}
            {contact.waitlistPosition && (
              <div className="inline-flex items-center gap-1 mt-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span className="text-[11px] font-medium text-cyan-400">
                  Waitlist #{contact.waitlistPosition}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-gray-600 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Animals of Interest - Most important context for breeders */}
        {contact.animals && contact.animals.length > 0 && (
          <div className="p-4 border-b border-hairline">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Interested In
            </div>
            <div className="space-y-1.5">
              {contact.animals.map((animal) => (
                <div
                  key={animal}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[hsl(var(--brand-orange))]/10 border border-[hsl(var(--brand-orange))]/20"
                >
                  <Dog className="w-4 h-4 text-[hsl(var(--brand-orange))] flex-shrink-0" />
                  <span className="text-sm text-white truncate">{animal}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact info - condensed */}
        <div className="p-4 border-b border-hairline space-y-2">
          {contact.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-gray-300 truncate">{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-gray-300">{contact.phone}</span>
            </div>
          )}
          {contact.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-gray-300 truncate">{contact.location}</span>
            </div>
          )}
        </div>

        {/* Tags - if any */}
        {contact.tags && contact.tags.length > 0 && (
          <div className="p-4 border-b border-hairline">
            <div className="flex flex-wrap gap-1.5">
              {contact.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs rounded-full bg-white/5 text-gray-400 border border-white/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions - Sticky footer */}
      <div className="flex-shrink-0 p-3 border-t border-hairline bg-surface space-y-1.5">
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white">
          <Calendar className="w-4 h-4" />
          <span>Schedule Follow-up</span>
        </button>
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white">
          <ClipboardList className="w-4 h-4" />
          <span>Add to Waitlist</span>
        </button>
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white">
          <User className="w-4 h-4" />
          <span>View Full Profile</span>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPOSE MODAL - Supports free-form email addresses with party lookup
   ═══════════════════════════════════════════════════════════════════════════ */

type RecipientStatus = "pending" | "matched" | "unmatched" | "invalid";

interface Recipient {
  email: string;
  status: RecipientStatus;
  match?: EmailLookupMatch;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

function parseEmails(input: string): string[] {
  return input
    .split(/[,;\s\n]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

interface RecipientChipProps {
  recipient: Recipient;
  onRemove: () => void;
  disabled?: boolean;
}

function RecipientChip({ recipient, onRemove, disabled }: RecipientChipProps) {
  const { email, status, match } = recipient;

  const statusStyles: Record<RecipientStatus, string> = {
    pending: "bg-white/5 border-hairline text-secondary",
    matched: "bg-green-500/10 border-green-500/30 text-green-400",
    unmatched: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    invalid: "bg-red-500/10 border-red-500/30 text-red-400",
  };

  const StatusIcon = () => {
    switch (status) {
      case "pending":
        return <Loader2 className="w-3 h-3 animate-spin" />;
      case "matched":
        return match?.partyKind === "ORGANIZATION" ? (
          <Building2 className="w-3 h-3" />
        ) : (
          <User className="w-3 h-3" />
        );
      case "unmatched":
        return <AlertCircle className="w-3 h-3" />;
      case "invalid":
        return <X className="w-3 h-3" />;
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-sm ${statusStyles[status]}`}
      title={
        status === "matched" && match
          ? `${match.partyKind}: ${match.partyName}`
          : status === "unmatched"
            ? "No matching contact or organization"
            : status === "invalid"
              ? "Invalid email address"
              : "Looking up..."
      }
    >
      <StatusIcon />
      <span className="max-w-[200px] truncate">
        {status === "matched" && match ? match.partyName : email}
      </span>
      {status === "matched" && match && (
        <span className="text-xs text-secondary">({email})</span>
      )}
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 p-0.5 rounded hover:bg-white/10 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: {
    channel: "email" | "dm";
    contactId?: number;
    toAddresses?: string[];
    ccAddresses?: string[];
    bccAddresses?: string[];
    subject?: string;
    body: string;
  }) => void;
  onSaveDraft: (data: { channel: "email" | "dm"; partyId?: number; subject?: string; body: string; draftId?: number }) => Promise<number | null>;
  onDiscardDraft: (draftId: number) => Promise<void>;
  templates: EmailTemplate[];
  contacts: Array<{ id: number; name: string; email?: string }>;
  editingDraft?: { id: number; channel: "email" | "dm"; partyId?: number; subject?: string; body: string } | null;
}

function ComposeModal({ isOpen, onClose, onSend, onSaveDraft, onDiscardDraft, templates, contacts, editingDraft }: ComposeModalProps) {
  const [channel, setChannel] = React.useState<"email" | "dm">("email");
  // For DM mode - still use contact selection
  const [selectedContact, setSelectedContact] = React.useState<number | null>(null);
  const [contactSearch, setContactSearch] = React.useState("");
  const [contactSearchFocused, setContactSearchFocused] = React.useState(false);
  // For email mode - free-form recipients (To, CC, BCC)
  const [recipients, setRecipients] = React.useState<Recipient[]>([]);
  const [ccRecipients, setCcRecipients] = React.useState<Recipient[]>([]);
  const [bccRecipients, setBccRecipients] = React.useState<Recipient[]>([]);
  const [emailInput, setEmailInput] = React.useState("");
  const [ccInput, setCcInput] = React.useState("");
  const [bccInput, setBccInput] = React.useState("");
  const [showCcBcc, setShowCcBcc] = React.useState(false);
  const [lookingUp, setLookingUp] = React.useState(false);

  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [showTemplates, setShowTemplates] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [discarding, setDiscarding] = React.useState(false);
  const [draftId, setDraftId] = React.useState<number | null>(null);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);

  const emailInputRef = React.useRef<HTMLInputElement>(null);
  const ccInputRef = React.useRef<HTMLInputElement>(null);
  const bccInputRef = React.useRef<HTMLInputElement>(null);

  // Load draft data when editing
  React.useEffect(() => {
    if (editingDraft) {
      setChannel(editingDraft.channel);
      setSelectedContact(editingDraft.partyId ?? null);
      setSubject(editingDraft.subject ?? "");
      setBody(editingDraft.body);
      setDraftId(editingDraft.id);
    } else if (isOpen) {
      // Reset form when opening fresh
      setChannel("email");
      setSelectedContact(null);
      setRecipients([]);
      setCcRecipients([]);
      setBccRecipients([]);
      setEmailInput("");
      setCcInput("");
      setBccInput("");
      setShowCcBcc(false);
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
        const partyId = channel === "dm" ? selectedContact : recipients.find(r => r.match)?.match?.partyId;
        const newDraftId = await onSaveDraft({
          channel,
          partyId: partyId ?? undefined,
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
    }, 2000);

    return () => clearTimeout(timer);
  }, [body, subject, selectedContact, recipients, channel, isOpen, draftId, onSaveDraft]);

  // Lookup emails when recipients change
  const handleLookupEmails = React.useCallback(async (emailsToLookup: string[]) => {
    if (emailsToLookup.length === 0) return;

    setLookingUp(true);
    try {
      const response = await api.messagingHub.lookupByEmail(emailsToLookup);
      const matches = response?.matches || [];
      const unmatched = response?.unmatched || [];

      setRecipients((prev) => {
        return prev.map((r) => {
          if (r.status !== "pending") return r;

          const match = matches.find(
            (m: EmailLookupMatch) => m.email.toLowerCase() === r.email.toLowerCase()
          );

          if (match) {
            return { ...r, status: "matched" as const, match };
          } else if (unmatched.includes(r.email.toLowerCase())) {
            return { ...r, status: "unmatched" as const };
          }
          // If not in matches or unmatched, mark as unmatched
          return { ...r, status: "unmatched" as const };
        });
      });
    } catch (err) {
      console.error("Failed to lookup emails:", err);
      // Mark all pending as unmatched on error
      setRecipients((prev) =>
        prev.map((r) =>
          r.status === "pending" ? { ...r, status: "unmatched" as const } : r
        )
      );
    } finally {
      setLookingUp(false);
    }
  }, []);

  // Generic function to add emails to any recipient list (To, CC, BCC)
  const createAddEmailsHandler = React.useCallback(
    (
      currentRecipients: Recipient[],
      setCurrentRecipients: React.Dispatch<React.SetStateAction<Recipient[]>>,
      setCurrentInput: React.Dispatch<React.SetStateAction<string>>
    ) => {
      return (input: string) => {
        const newEmails = parseEmails(input);
        if (newEmails.length === 0) return;

        // Check across all recipient lists for duplicates
        const allExisting = new Set([
          ...recipients.map((r) => r.email.toLowerCase()),
          ...ccRecipients.map((r) => r.email.toLowerCase()),
          ...bccRecipients.map((r) => r.email.toLowerCase()),
        ]);
        const uniqueNewEmails = newEmails.filter((e) => !allExisting.has(e));

        if (uniqueNewEmails.length === 0) {
          setCurrentInput("");
          return;
        }

        const newRecipientItems: Recipient[] = uniqueNewEmails.map((email) => ({
          email,
          status: isValidEmail(email) ? "pending" : "invalid",
        }));

        setCurrentRecipients([...currentRecipients, ...newRecipientItems]);
        setCurrentInput("");

        // Trigger lookup for valid pending emails
        const emailsToLookup = newRecipientItems
          .filter((r) => r.status === "pending")
          .map((r) => r.email);

        if (emailsToLookup.length > 0) {
          handleLookupEmails(emailsToLookup);
        }
      };
    },
    [recipients, ccRecipients, bccRecipients, handleLookupEmails]
  );

  const handleAddToEmails = createAddEmailsHandler(recipients, setRecipients, setEmailInput);
  const handleAddCcEmails = createAddEmailsHandler(ccRecipients, setCcRecipients, setCcInput);
  const handleAddBccEmails = createAddEmailsHandler(bccRecipients, setBccRecipients, setBccInput);

  // Generic key handler factory
  const createKeyDownHandler = (
    currentInput: string,
    currentRecipients: Recipient[],
    setCurrentRecipients: React.Dispatch<React.SetStateAction<Recipient[]>>,
    handleAddEmails: (input: string) => void
  ) => {
    return (e: React.KeyboardEvent<HTMLInputElement>) => {
      const { key } = e;
      if (["Enter", "Tab", ",", ";", " "].includes(key)) {
        if (currentInput.trim()) {
          e.preventDefault();
          handleAddEmails(currentInput);
        }
      }
      if (key === "Backspace" && !currentInput && currentRecipients.length > 0) {
        setCurrentRecipients(currentRecipients.slice(0, -1));
      }
    };
  };

  const handleToKeyDown = createKeyDownHandler(emailInput, recipients, setRecipients, handleAddToEmails);
  const handleCcKeyDown = createKeyDownHandler(ccInput, ccRecipients, setCcRecipients, handleAddCcEmails);
  const handleBccKeyDown = createKeyDownHandler(bccInput, bccRecipients, setBccRecipients, handleAddBccEmails);

  const handleToPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleAddToEmails(e.clipboardData.getData("text"));
  };
  const handleCcPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleAddCcEmails(e.clipboardData.getData("text"));
  };
  const handleBccPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleAddBccEmails(e.clipboardData.getData("text"));
  };

  const handleToBlur = () => { if (emailInput.trim()) handleAddToEmails(emailInput); };
  const handleCcBlur = () => { if (ccInput.trim()) handleAddCcEmails(ccInput); };
  const handleBccBlur = () => { if (bccInput.trim()) handleAddBccEmails(bccInput); };

  const handleRemoveToRecipient = (index: number) => setRecipients(recipients.filter((_, i) => i !== index));
  const handleRemoveCcRecipient = (index: number) => setCcRecipients(ccRecipients.filter((_, i) => i !== index));
  const handleRemoveBccRecipient = (index: number) => setBccRecipients(bccRecipients.filter((_, i) => i !== index));

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

  const handleSend = async () => {
    if (!body.trim()) return;

    if (channel === "dm") {
      if (!selectedContact) return;
      setSending(true);
      onSend({
        channel,
        contactId: selectedContact,
        body,
      });
    } else {
      // Email mode
      const validToRecipients = recipients.filter((r) => r.status !== "invalid");
      if (validToRecipients.length === 0) return;

      setSending(true);

      // Get all valid CC/BCC recipients
      const validCcRecipients = ccRecipients.filter((r) => r.status !== "invalid");
      const validBccRecipients = bccRecipients.filter((r) => r.status !== "invalid");

      // Check if all TO recipients are matched to the same party
      const matchedRecipients = validToRecipients.filter((r) => r.status === "matched");
      const allSameParty = matchedRecipients.length === validToRecipients.length &&
        matchedRecipients.every((r) => r.match?.partyId === matchedRecipients[0]?.match?.partyId);

      const toAddresses = validToRecipients.map((r) => r.email);
      const ccAddresses = validCcRecipients.map((r) => r.email);
      const bccAddresses = validBccRecipients.map((r) => r.email);
      const contactId = allSameParty && matchedRecipients[0]?.match?.partyId
        ? matchedRecipients[0].match.partyId
        : undefined;

      onSend({
        channel,
        contactId,
        toAddresses,
        ccAddresses: ccAddresses.length > 0 ? ccAddresses : undefined,
        bccAddresses: bccAddresses.length > 0 ? bccAddresses : undefined,
        subject,
        body,
      });
    }

    // Reset form
    setTimeout(() => {
      setSending(false);
      setSelectedContact(null);
      setRecipients([]);
      setCcRecipients([]);
      setBccRecipients([]);
      setEmailInput("");
      setCcInput("");
      setBccInput("");
      setShowCcBcc(false);
      setSubject("");
      setBody("");
      onClose();
    }, 500);
  };

  const handleDiscard = async () => {
    if (!draftId) {
      // No draft saved yet, just close
      onClose();
      return;
    }

    setDiscarding(true);
    try {
      await onDiscardDraft(draftId);
      // Reset form and close
      setSelectedContact(null);
      setRecipients([]);
      setCcRecipients([]);
      setBccRecipients([]);
      setEmailInput("");
      setCcInput("");
      setBccInput("");
      setShowCcBcc(false);
      setSubject("");
      setBody("");
      setDraftId(null);
      setLastSaved(null);
      onClose();
    } catch (e) {
      console.error("Failed to discard draft:", e);
    } finally {
      setDiscarding(false);
    }
  };

  // Check if we can send
  const canSend = React.useMemo(() => {
    if (!body.trim() || sending) return false;
    if (channel === "dm") return !!selectedContact;
    // Email mode: need at least one valid recipient (not invalid, not pending)
    return recipients.some((r) => r.status === "matched" || r.status === "unmatched");
  }, [body, sending, channel, selectedContact, recipients]);

  // Count unmatched recipients for warning (across To, CC, BCC)
  const unmatchedCount = [
    ...recipients.filter((r) => r.status === "unmatched"),
    ...ccRecipients.filter((r) => r.status === "unmatched"),
    ...bccRecipients.filter((r) => r.status === "unmatched"),
  ].length;

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
                className="flex-1 px-4 py-2.5 rounded-lg border-2 transition-all flex items-center justify-center gap-2"
                style={{
                  borderColor: "#60a5fa",
                  color: "#60a5fa",
                  backgroundColor: "transparent",
                }}
              >
                <Mail className="w-4 h-4" />
                <span className="font-medium">Email</span>
              </button>
              <button
                onClick={() => setChannel("dm")}
                className="flex-1 px-4 py-2.5 rounded-lg border-2 transition-all flex items-center justify-center gap-2"
                style={{
                  borderColor: "#a78bfa",
                  color: "#a78bfa",
                  backgroundColor: "transparent",
                }}
              >
                <MessageCircle className="w-4 h-4" />
                <span className="font-medium">Direct Message</span>
              </button>
            </div>
          </div>

          {/* Recipient Selection */}
          <div>
            {channel === "dm" && (
              <label className="block text-xs text-secondary font-medium uppercase tracking-wide mb-1.5">
                To
              </label>
            )}

            {channel === "dm" ? (
              // DM mode: Contact picker
              selectedContact ? (
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
                    onFocus={() => setContactSearchFocused(true)}
                    onBlur={() => setTimeout(() => setContactSearchFocused(false), 150)}
                    placeholder="Search contacts..."
                    className="w-full pl-9 pr-3 py-2 bg-surface-strong border border-hairline rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                  />
                  {contactSearchFocused && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-hairline rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                      {filteredContacts.length > 0 ? (
                        filteredContacts.map((contact) => (
                          <button
                            key={contact.id}
                            onClick={() => {
                              setSelectedContact(contact.id);
                              setContactSearch("");
                              setContactSearchFocused(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-2"
                          >
                            <User className="w-4 h-4 text-secondary" />
                            <span>{contact.name}</span>
                            {contact.email && (
                              <span className="text-xs text-secondary ml-auto">{contact.email}</span>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-secondary">
                          {contactSearch ? "No contacts match your search" : "No contacts available"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            ) : (
              // Email mode: Free-form email input with chips
              <div className="space-y-2">
                {/* To field */}
                <div className="flex items-start gap-2">
                  <span className="text-xs text-secondary font-medium uppercase w-8 pt-2.5 flex-shrink-0">To</span>
                  <div className="flex-1">
                    <div
                      className="min-h-[38px] px-3 py-1.5 rounded-lg border border-hairline bg-surface-strong flex flex-wrap items-center gap-1.5 cursor-text transition-colors focus-within:border-[hsl(var(--brand-orange))]"
                      onClick={() => emailInputRef.current?.focus()}
                    >
                      {recipients.map((recipient, index) => (
                        <RecipientChip
                          key={`to-${recipient.email}-${index}`}
                          recipient={recipient}
                          onRemove={() => handleRemoveToRecipient(index)}
                        />
                      ))}
                      <input
                        ref={emailInputRef}
                        type="text"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyDown={handleToKeyDown}
                        onPaste={handleToPaste}
                        onBlur={handleToBlur}
                        placeholder={recipients.length === 0 ? "Enter email addresses..." : ""}
                        className="chip-input-field flex-1 min-w-[150px] h-6 bg-transparent border-none text-sm text-primary placeholder:text-secondary"
                        autoComplete="off"
                        data-1p-ignore
                        data-lpignore="true"
                        data-form-type="other"
                      />
                    </div>
                  </div>
                  {!showCcBcc && (
                    <button
                      type="button"
                      onClick={() => setShowCcBcc(true)}
                      className="text-xs text-[hsl(var(--brand-orange))] hover:underline pt-2.5 flex-shrink-0"
                    >
                      Cc/Bcc
                    </button>
                  )}
                </div>

                {/* CC field */}
                {showCcBcc && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-secondary font-medium uppercase w-8 pt-2.5 flex-shrink-0">Cc</span>
                    <div className="flex-1">
                      <div
                        className="min-h-[38px] px-3 py-1.5 rounded-lg border border-hairline bg-surface-strong flex flex-wrap items-center gap-1.5 cursor-text transition-colors focus-within:border-[hsl(var(--brand-orange))]"
                        onClick={() => ccInputRef.current?.focus()}
                      >
                        {ccRecipients.map((recipient, index) => (
                          <RecipientChip
                            key={`cc-${recipient.email}-${index}`}
                            recipient={recipient}
                            onRemove={() => handleRemoveCcRecipient(index)}
                          />
                        ))}
                        <input
                          ref={ccInputRef}
                          type="text"
                          value={ccInput}
                          onChange={(e) => setCcInput(e.target.value)}
                          onKeyDown={handleCcKeyDown}
                          onPaste={handleCcPaste}
                          onBlur={handleCcBlur}
                          placeholder={ccRecipients.length === 0 ? "Add CC recipients..." : ""}
                          className="chip-input-field flex-1 min-w-[150px] h-6 bg-transparent border-none text-sm text-primary placeholder:text-secondary"
                          autoComplete="off"
                          data-1p-ignore
                          data-lpignore="true"
                          data-form-type="other"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* BCC field */}
                {showCcBcc && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-secondary font-medium uppercase w-8 pt-2.5 flex-shrink-0">Bcc</span>
                    <div className="flex-1">
                      <div
                        className="min-h-[38px] px-3 py-1.5 rounded-lg border border-hairline bg-surface-strong flex flex-wrap items-center gap-1.5 cursor-text transition-colors focus-within:border-[hsl(var(--brand-orange))]"
                        onClick={() => bccInputRef.current?.focus()}
                      >
                        {bccRecipients.map((recipient, index) => (
                          <RecipientChip
                            key={`bcc-${recipient.email}-${index}`}
                            recipient={recipient}
                            onRemove={() => handleRemoveBccRecipient(index)}
                          />
                        ))}
                        <input
                          ref={bccInputRef}
                          type="text"
                          value={bccInput}
                          onChange={(e) => setBccInput(e.target.value)}
                          onKeyDown={handleBccKeyDown}
                          onPaste={handleBccPaste}
                          onBlur={handleBccBlur}
                          placeholder={bccRecipients.length === 0 ? "Add BCC recipients..." : ""}
                          className="chip-input-field flex-1 min-w-[150px] h-6 bg-transparent border-none text-sm text-primary placeholder:text-secondary"
                          autoComplete="off"
                          data-1p-ignore
                          data-lpignore="true"
                          data-form-type="other"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Unmatched recipients warning */}
          {channel === "email" && unmatchedCount > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium">
                  {unmatchedCount} recipient{unmatchedCount > 1 ? "s" : ""} not linked to a contact
                </div>
                <div className="text-xs mt-0.5 text-amber-400/80">
                  Email will be sent but won't be linked to a contact record. You can link it later from the "Other Recipients" folder.
                </div>
              </div>
            </div>
          )}

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
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
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
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
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
            {lookingUp && (
              <div className="flex items-center gap-1.5 text-xs text-secondary">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Looking up recipients...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(draftId || body.trim()) && (
              <Button
                variant="outline"
                onClick={handleDiscard}
                disabled={discarding}
                className="text-red-400 hover:text-red-300 hover:border-red-400/50"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                {discarding ? "Discarding..." : "Discard"}
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              {body.trim() ? "Save & Close" : "Cancel"}
            </Button>
            <Button onClick={handleSend} disabled={!canSend}>
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
   UTILITY FUNCTIONS
   ═══════════════════════════════════════════════════════════════════════════ */

function getDateGroup(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (messageDate.getTime() === today.getTime()) return "Today";
  if (messageDate.getTime() === yesterday.getTime()) return "Yesterday";
  if (messageDate >= weekAgo) return "This Week";
  if (messageDate.getMonth() === now.getMonth() && messageDate.getFullYear() === now.getFullYear()) return "This Month";
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // Today: show time
  if (messageDate.getTime() === today.getTime()) {
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  // Yesterday: show "Yesterday"
  const yesterday = new Date(today.getTime() - 86400000);
  if (messageDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }
  // This week: show day name
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  if (messageDate >= weekAgo) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }
  // Older: show date
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
  const [inboxCounts, setInboxCounts] = React.useState<InboxCounts>({ unreadCount: 0, flaggedCount: 0, draftCount: 0, sentCount: 0 });

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
      sent: inboxCounts.sentCount || messages.filter((m) => m.direction === "outbound" && !m.isArchived).length,
      flagged: inboxCounts.flaggedCount,
      drafts: inboxCounts.draftCount,
      archived: messages.filter((m) => m.isArchived).length,
      email: messages.filter((m) => m.channel === "email" && !m.isArchived).length,
      dm: messages.filter((m) => m.channel === "dm" && !m.isArchived).length,
      templates: templates.length,
    };
  }, [messages, inboxCounts, templates]);

  // Filtered messages based on active folder
  const filteredMessages = React.useMemo(() => {
    let filtered = [...messages];

    // Folder filter
    switch (activeFolder) {
      case "all":
        // All non-archived inbound messages (exclude sent/outbound)
        filtered = filtered.filter((m) => !m.isArchived && m.direction !== "outbound");
        break;
      case "inbox":
        // Inbound, non-archived - sorted by unread first
        filtered = filtered.filter((m) => !m.isArchived && m.direction !== "outbound");
        filtered.sort((a, b) => {
          if (a.isUnread && !b.isUnread) return -1;
          if (!a.isUnread && b.isUnread) return 1;
          return b.timestamp.getTime() - a.timestamp.getTime();
        });
        break;
      case "sent":
        // Outbound emails only
        filtered = filtered.filter((m) => m.direction === "outbound" && !m.isArchived);
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
  const loadInboxData = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Load from multiple endpoints to get all data
      // 1. Main inbox (DMs, legacy emails) with status=all
      // 2. Sent items (PartyEmail, UnlinkedEmail) with status=sent
      // 3. Drafts with status=draft
      const [inboxRes, sentRes, draftsRes] = await Promise.all([
        api.communications.inbox.list({ status: "all", limit: 200 }),
        api.communications.inbox.list({ status: "sent", limit: 200 }),
        api.communications.inbox.list({ status: "draft", limit: 200 }),
      ]);

      // Helper to transform backend CommunicationItem to UnifiedMessage
      const transformItem = (item: CommunicationItem): UnifiedMessage => {
        const [itemType, itemId] = item.id.split(":");
        const numericId = parseInt(itemId, 10);

        // TODO: Backend should provide enriched contact meta - for now, generate sample data
        // This shows what the UI will look like when backend returns real data
        const sampleMeta = generateSampleMeta(item.partyId, item.partyName);

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
          emailId: ["email", "partyEmail", "unlinkedEmail"].includes(itemType) ? numericId : undefined,
          draftId: itemType === "draft" ? numericId : undefined,
          direction: item.direction,
          meta: sampleMeta,
        };
      };

      // Generate deterministic sample meta based on partyId or name for demo purposes
      // TODO: Remove when backend provides real enriched data via API
      function generateSampleMeta(partyId: number | null, partyName: string | null): UnifiedMessage["meta"] {
        // For demo: generate sample data for any identified contact
        // Use partyId if available, otherwise hash the name
        let seed: number;
        if (partyId) {
          seed = partyId % 10;
        } else if (partyName && partyName !== "Unknown") {
          // Simple hash of name for deterministic demo data
          seed = partyName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 10;
        } else {
          return undefined;
        }

        const statuses: Array<"customer" | "lead" | "prospect"> = ["customer", "lead", "prospect"];
        const locations = ["Austin, TX", "Denver, CO", "Portland, OR", "Seattle, WA", "Miami, FL", "Chicago, IL", "Nashville, TN", "Phoenix, AZ"];

        return {
          leadStatus: statuses[seed % 3],
          waitlistPosition: seed < 5 ? seed + 1 : undefined,
          waitlistPlanName: seed < 5 ? "Spring 2025 Litter" : undefined,
          hasActiveDeposit: seed % 3 === 0,
          depositPlanName: seed % 3 === 0 ? "Golden Litter #4" : undefined,
          totalPurchases: seed > 4 ? (seed * 450 + 1200) * 100 : undefined, // in cents
          animalsOwned: seed > 5 ? seed - 4 : undefined,
          location: locations[seed] ?? undefined,
        };
      }

      // Combine and deduplicate by id
      const allItems = [
        ...(inboxRes.items || []),
        ...(sentRes.items || []),
        ...(draftsRes.items || []),
      ];
      const uniqueItems = Array.from(new Map(allItems.map((item) => [item.id, item])).values());
      const unified: UnifiedMessage[] = uniqueItems.map(transformItem);

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

  // Load initial data and set up polling for real-time updates
  React.useEffect(() => {
    loadInboxData(); // Initial load shows spinner

    // Poll for new messages every 10 seconds (silent - no spinner)
    const pollInterval = setInterval(() => {
      loadInboxData(true);
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [loadInboxData]);

  // WebSocket handler for real-time updates
  const handleWebSocketMessage = React.useCallback((event: WebSocketEvent) => {
    if (event.event === "new_message") {
      const { threadId, message } = event.payload;
      console.log("[WS] New message received:", threadId, message.id);

      // Update messages list - refresh if this thread is visible
      // For now, trigger a silent reload to get the updated data
      loadInboxData(true);

      // If this thread is currently selected, add the message to the thread view
      if (selectedThread?.threadId === threadId) {
        setSelectedThread((prev) => {
          if (!prev) return null;
          // Check if message already exists
          if (prev.messages.some((m) => m.id === `msg:${message.id}`)) {
            return prev;
          }
          return {
            ...prev,
            messages: [
              ...prev.messages,
              {
                id: `msg:${message.id}`,
                body: message.body,
                timestamp: new Date(message.createdAt),
                isOwn: false, // Incoming message from WebSocket
                status: "delivered" as const,
              },
            ],
          };
        });
      }
    } else if (event.event === "thread_update") {
      const { threadId, isRead, flagged, archived } = event.payload;
      console.log("[WS] Thread update:", threadId, { isRead, flagged, archived });

      // Update messages list for flag/archive changes
      setMessages((prev) =>
        prev.map((m) => {
          if (m.threadId === threadId) {
            return {
              ...m,
              isUnread: isRead !== undefined ? !isRead : m.isUnread,
              isStarred: flagged !== undefined ? flagged : m.isStarred,
              isArchived: archived !== undefined ? archived : m.isArchived,
            };
          }
          return m;
        })
      );
    } else if (event.event === "new_email") {
      console.log("[WS] New email received:", event.payload);
      // Refresh inbox to show new email
      loadInboxData(true);
    }
  }, [loadInboxData, selectedThread?.threadId]);

  // Connect to WebSocket for real-time updates
  const { isConnected: wsConnected } = useWebSocket({
    onMessage: handleWebSocketMessage,
    onConnect: () => console.log("[WS] Connected to messaging"),
    onDisconnect: () => console.log("[WS] Disconnected from messaging"),
  });

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
  const loadSelectedThread = React.useCallback(
    async (messageId: string) => {
      setThreadLoading(true);
      setSelectedThread(null); // Clear previous thread immediately
      try {
        // Check ID pattern to determine type
        if (messageId.startsWith("thread:")) {
          // Load DM thread
          const threadId = Number(messageId.replace("thread:", ""));
          const res = await api.messages.threads.get(threadId);
          const thread = res?.thread;

          if (!thread) {
            console.error("Thread not found or invalid response:", res);
            return null;
          }

          const otherParticipant = (thread.participants || []).find(
            (p: any) => p.party?.type !== "ORGANIZATION"
          );
          const orgParticipant = (thread.participants || []).find(
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
              name: otherParticipant?.party?.name || thread.guestName || "Unknown",
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
        } else if (
          messageId.startsWith("partyEmail:") ||
          messageId.startsWith("unlinkedEmail:")
        ) {
          // Load email detail from new email system
          const res = await api.communications.email.get(messageId);
          const email = res.email;

          setSelectedThread({
            id: email.id,
            channel: "email",
            isFlagged: false,
            isArchived: false,
            contact: {
              id: email.partyId || 0,
              name: email.partyName || email.toEmail,
              email: email.toEmail,
              tags: [],
            },
            subject: email.subject,
            messages: [
              {
                id: email.id,
                body: email.body || email.bodyText || email.bodyHtml || "",
                timestamp: new Date(email.sentAt || email.createdAt),
                isOwn: true, // Sent emails are always from us
                status: "delivered" as const,
              },
            ],
          });

          // Mark as read in local state - done outside callback to avoid re-render loop
          return { markAsRead: messageId };
        } else if (messageId.startsWith("email:")) {
          // Legacy email from EmailSendLog - display from local message data
          // Use functional update to avoid dependency on messages
          setMessages((prev) => {
            const message = prev.find((m) => m.id === messageId);
            if (message) {
              setSelectedThread({
                id: messageId,
                channel: "email",
                isFlagged: message.isStarred,
                isArchived: message.isArchived,
                contact: {
                  id: message.contactId || 0,
                  name: message.contactName,
                  email: message.contactEmail,
                  tags: [],
                },
                subject: message.subject || undefined,
                messages: [
                  {
                    id: messageId,
                    body: message.preview, // Legacy emails only have preview
                    timestamp: message.timestamp,
                    isOwn: true,
                    status: "delivered" as const,
                  },
                ],
              });
            }
            return prev; // Don't actually change messages
          });
        }
      } catch (e) {
        console.error("Failed to load thread:", e);
      } finally {
        setThreadLoading(false);
      }
      return null;
    },
    [] // No dependencies - avoid re-creation loop
  );

  React.useEffect(() => {
    if (!selectedMessageId) {
      setSelectedThread(null);
      return;
    }
    loadSelectedThread(selectedMessageId).then((result) => {
      // Mark email as read after thread is loaded (separate from callback to avoid loop)
      if (result?.markAsRead) {
        setMessages((prev) =>
          prev.map((m) => (m.id === result.markAsRead ? { ...m, isUnread: false } : m))
        );
      }
    });
  }, [selectedMessageId, loadSelectedThread]);

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
    contactId?: number;
    toAddresses?: string[];
    ccAddresses?: string[];
    bccAddresses?: string[];
    subject?: string;
    body: string;
  }) => {
    // Create a new DM thread
    if (data.channel === "dm") {
      if (!data.contactId) return;
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
      // Email mode - use messagingHub API
      if (!data.toAddresses || data.toAddresses.length === 0) return;
      try {
        // Combine all addresses for the API (backend will handle CC/BCC separately in future)
        const allToAddresses = [
          ...data.toAddresses,
          ...(data.ccAddresses || []),
          ...(data.bccAddresses || []),
        ];
        await api.messagingHub.sendEmail({
          partyId: data.contactId ?? null,
          toAddresses: allToAddresses,
          subject: data.subject || "(No subject)",
          bodyText: data.body,
          // TODO: Pass CC/BCC separately when backend supports it
          metadata: {
            cc: data.ccAddresses,
            bcc: data.bccAddresses,
          },
        });
        // Refresh inbox to show new email
        loadInboxData();
      } catch (e) {
        console.error("Failed to send email:", e);
      }
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
  const handleCreateTag = async (data: { name: string; module: string; color: string | null }) => {
    await api.tags.create({
      name: data.name,
      module: data.module as "MESSAGE_THREAD",
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

  // Bulk delete drafts handler
  const handleBulkDeleteDrafts = React.useCallback(async () => {
    if (bulkSelectedIds.size === 0) return;

    // Filter to only draft IDs
    const draftIds = Array.from(bulkSelectedIds)
      .filter((id) => id.startsWith("draft:"))
      .map((id) => parseInt(id.replace("draft:", ""), 10));

    if (draftIds.length === 0) return;

    setBulkActionLoading(true);
    try {
      // Delete each draft
      await Promise.all(draftIds.map((id) => api.drafts.delete(id)));

      // Remove from local state
      setMessages((prev) => prev.filter((m) => !bulkSelectedIds.has(m.id)));

      // Clear selection
      setBulkSelectedIds(new Set());

      // Refresh counts
      const counts = await api.communications.counts.get();
      setInboxCounts(counts);
    } catch (e) {
      console.error("Failed to bulk delete drafts:", e);
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

  // Discard draft handler - permanently deletes the draft
  const handleDiscardDraft = React.useCallback(
    async (draftId: number): Promise<void> => {
      try {
        await api.drafts.delete(draftId);
        // Refresh inbox to remove the draft
        loadInboxData();
        // Clear editing state
        setEditingDraft(null);
      } catch (e) {
        console.error("Failed to discard draft:", e);
        throw e;
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
    <div className="flex-1 min-h-0 flex flex-col bg-canvas overflow-hidden rounded-xl border border-hairline">
      {/* Header - Refined */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-hairline bg-surface flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[hsl(var(--brand-orange))] to-[hsl(var(--brand-teal))] flex items-center justify-center shadow-lg shadow-[hsl(var(--brand-orange))]/20">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Communications Hub</h1>
            <p className="text-xs text-gray-400">All your messages in one place</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
          >
            <Command className="w-3.5 h-3.5" />
            <span className="text-xs">K</span>
          </button>
          <Button onClick={() => setShowComposeModal(true)} className="shadow-lg shadow-[hsl(var(--brand-orange))]/20">
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

        {/* Show Templates Panel or Message Views */}
        {activeFolder === "templates" ? (
          <TemplatesPanel api={api} />
        ) : (
          <>
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
              onBulkDelete={handleBulkDeleteDrafts}
              hasDraftsSelected={Array.from(bulkSelectedIds).some((id) => id.startsWith("draft:"))}
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
          </>
        )}
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
        onDiscardDraft={handleDiscardDraft}
        templates={templates}
        contacts={contacts}
        editingDraft={editingDraft}
      />

      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      <TagCreateModal
        open={showCreateTagModal}
        onOpenChange={setShowCreateTagModal}
        mode="create"
        fixedModule="MESSAGE_THREAD"
        onSubmit={handleCreateTag}
        description="This tag will be available for organizing message threads in the Communications Hub."
      />
    </div>
  );
}
