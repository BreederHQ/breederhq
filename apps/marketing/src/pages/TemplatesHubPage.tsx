// apps/marketing/src/pages/TemplatesHubPage.tsx
// Template management page with full CRUD functionality

import * as React from "react";
import { PageHeader, Tabs, SectionCard, Badge, Button, useToast } from "@bhq/ui";
import { makeApi } from "@bhq/api";
import type { EmailTemplate, TemplateCategory } from "@bhq/api";
import { Edit2, Trash2, Plus, FileText, AlertTriangle } from "lucide-react";
import { TemplateCreateEditModal } from "../components/TemplateCreateEditModal";
import { createTemplatePreview } from "@bhq/ui/utils";

/* ───────────────── API Setup ───────────────── */

const IS_DEV = import.meta.env.DEV;

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

  if (IS_DEV) {
    return "/api/v1";
  }

  return normalizeBase(window.location.origin);
}

function normalizeBase(base: string): string {
  const b = base.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
  return `${b}/api/v1`;
}

const API_BASE = getApiBase();
const api = makeApi(API_BASE);

/* ───────────────── Category Helpers ───────────────── */

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

/* ───────────────── Template List Item ───────────────── */

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

/* ───────────────── Empty State ───────────────── */

function EmptyState({ category, onCreate }: { category: string | null; onCreate: () => void }) {
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

/* ───────────────── Main Component ───────────────── */

export default function TemplatesHubPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState("all");
  const [templates, setTemplates] = React.useState<EmailTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<"create" | "edit">("create");
  const [editingTemplate, setEditingTemplate] = React.useState<EmailTemplate | undefined>();

  const tabItems = [
    { value: "all", label: "All" },
    { value: "email", label: "Email" },
    { value: "dm", label: "Direct Messages" },
    { value: "social", label: "Social Drafts" },
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
      console.error("[TemplatesHubPage] Failed to fetch templates:", e);
      setError(e?.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Filter templates by active tab (client-side for "all" tab)
  const filteredTemplates = React.useMemo(() => {
    const category = TAB_TO_CATEGORY[activeTab];
    if (!category) return templates;
    return templates.filter((t) => t.category === category);
  }, [templates, activeTab]);

  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState(null, "", "/marketing");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

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
      console.error("[TemplatesHubPage] Failed to delete template:", e);
      toast.error(e?.message || "Failed to delete template");
    }
  };

  const handleModalSuccess = () => {
    toast.success(modalMode === "create" ? "Template created" : "Template updated");
    fetchTemplates();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={handleBackClick}
            className="text-secondary hover:text-primary transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <Badge variant="neutral" className="text-xs">ACTIVE</Badge>
        </div>
        <PageHeader
          title="Email and Message Templates"
          subtitle="Create and manage reusable templates for emails, direct messages, and social posts"
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        items={tabItems}
        variant="underline-orange"
        size="sm"
      />

      {/* Content */}
      <SectionCard
        title="Your Templates"
        right={
          <Button size="sm" onClick={handleCreateTemplate}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Template
          </Button>
        }
      >
        {loading ? (
          <div className="py-8 text-center text-sm text-secondary">
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
          <EmptyState
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
      </SectionCard>

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
