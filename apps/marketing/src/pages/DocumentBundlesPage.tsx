// apps/marketing/src/pages/DocumentBundlesPage.tsx
// Document bundle management page with full CRUD functionality

import * as React from "react";
import { PageHeader, SectionCard, Badge, Button, useToast } from "@bhq/ui";
import { makeApi } from "@bhq/api";
import type { DocumentBundle } from "@bhq/api";
import { Edit2, Trash2, Plus, Package, AlertTriangle, FileText, ChevronRight } from "lucide-react";
import { BundleCreateEditModal } from "../components/BundleCreateEditModal";

/* ---------------------- API Setup ---------------------- */

const IS_DEV = import.meta.env.DEV;

function getApiBase(): string {
  const envBase = (import.meta.env.VITE_API_BASE_URL as string) || "";
  if (envBase.trim()) return normalizeBase(envBase);
  const w = window as any;
  const windowBase = String(w.__BHQ_API_BASE__ || "").trim();
  if (windowBase) return normalizeBase(windowBase);
  if (IS_DEV) return "";
  return normalizeBase(window.location.origin);
}

function normalizeBase(base: string): string {
  return base.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
}

const API_BASE = getApiBase();
const api = makeApi(API_BASE);

/* ---------------------- Bundle List Item ---------------------- */

interface BundleItemProps {
  bundle: DocumentBundle;
  onEdit: () => void;
  onDelete: () => void;
  onManageDocuments: () => void;
}

function BundleItem({ bundle, onEdit, onDelete, onManageDocuments }: BundleItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  return (
    <div className="flex items-start justify-between py-4 px-4 rounded-lg border border-hairline bg-surface hover:border-[hsl(var(--brand-orange))]/30 transition-colors group">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center">
          <Package className="h-4 w-4 text-[hsl(var(--brand-orange))]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-primary">{bundle.name}</div>
          {bundle.description && (
            <div className="text-xs text-secondary mt-0.5 truncate">
              {bundle.description}
            </div>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-secondary">
              <FileText className="h-3 w-3" />
              {bundle.documentCount} {bundle.documentCount === 1 ? "document" : "documents"}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onManageDocuments();
              }}
              className="flex items-center gap-1 text-xs text-[hsl(var(--brand-orange))] hover:underline"
            >
              Manage Documents
              <ChevronRight className="h-3 w-3" />
            </button>
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
              title="Edit bundle"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-md text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
              title="Delete bundle"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------- Empty State ---------------------- */

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-surface-strong mx-auto mb-4 flex items-center justify-center">
        <Package className="h-6 w-6 text-secondary" />
      </div>
      <div className="text-sm text-primary font-medium mb-1">
        No document bundles yet
      </div>
      <p className="text-xs text-secondary mb-4 max-w-xs mx-auto">
        Create bundles to group documents together for easy email attachments.
        For example, create a "Go Home Document Bundle" with all paperwork new owners need.
      </p>
      <Button size="sm" onClick={onCreate}>
        <Plus className="h-4 w-4 mr-1.5" />
        Create Bundle
      </Button>
    </div>
  );
}

/* ---------------------- Main Component ---------------------- */

export default function DocumentBundlesPage() {
  const { toast } = useToast();
  const [bundles, setBundles] = React.useState<DocumentBundle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<"create" | "edit">("create");
  const [editingBundle, setEditingBundle] = React.useState<DocumentBundle | undefined>();

  // Document management state
  const [managingBundle, setManagingBundle] = React.useState<DocumentBundle | null>(null);

  // Fetch bundles
  const fetchBundles = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.documentBundles.list({ status: "active" });
      setBundles(res.items);
    } catch (e: any) {
      console.error("[DocumentBundlesPage] Failed to fetch bundles:", e);
      setError(e?.message || "Failed to load document bundles");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBundles();
  }, [fetchBundles]);

  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState(null, "", "/marketing");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleCreateBundle = () => {
    setModalMode("create");
    setEditingBundle(undefined);
    setModalOpen(true);
  };

  const handleEditBundle = (bundle: DocumentBundle) => {
    setModalMode("edit");
    setEditingBundle(bundle);
    setModalOpen(true);
  };

  const handleDeleteBundle = async (bundle: DocumentBundle) => {
    try {
      await api.documentBundles.delete(bundle.id);
      toast.success(`Bundle "${bundle.name}" deleted`);
      fetchBundles();
    } catch (e: any) {
      console.error("[DocumentBundlesPage] Failed to delete bundle:", e);
      toast.error(e?.message || "Failed to delete bundle");
    }
  };

  const handleManageDocuments = (bundle: DocumentBundle) => {
    setManagingBundle(bundle);
  };

  const handleModalSuccess = () => {
    toast.success(modalMode === "create" ? "Bundle created" : "Bundle updated");
    fetchBundles();
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
          title="Document Bundles"
          subtitle="Create named collections of documents to attach to emails"
        />
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border border-[hsl(var(--brand-orange))]/20 bg-[hsl(var(--brand-orange))]/5 px-4 py-3">
        <div className="flex items-start gap-3">
          <Package className="h-5 w-5 text-[hsl(var(--brand-orange))] flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-primary">Group your go-to documents</div>
            <p className="text-xs text-secondary mt-0.5">
              Create bundles like "Go Home Packet" or "Health Records" to quickly attach multiple
              documents when emailing clients. Each bundle can have a custom name that makes sense for your program.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <SectionCard
        title="Your Bundles"
        right={
          <Button size="sm" onClick={handleCreateBundle}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Bundle
          </Button>
        }
      >
        {loading ? (
          <div className="py-8 text-center text-sm text-secondary">
            Loading bundles...
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 mx-auto mb-4 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <div className="text-sm text-red-400 mb-2">{error}</div>
            <Button variant="outline" size="sm" onClick={fetchBundles}>
              Retry
            </Button>
          </div>
        ) : bundles.length === 0 ? (
          <EmptyState onCreate={handleCreateBundle} />
        ) : (
          <div className="space-y-2">
            {bundles.map((bundle) => (
              <BundleItem
                key={bundle.id}
                bundle={bundle}
                onEdit={() => handleEditBundle(bundle)}
                onDelete={() => handleDeleteBundle(bundle)}
                onManageDocuments={() => handleManageDocuments(bundle)}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Create/Edit Modal */}
      <BundleCreateEditModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        bundle={editingBundle}
        api={{ documentBundles: api.documentBundles }}
        onSuccess={handleModalSuccess}
      />

      {/* Document Management Drawer - placeholder for now */}
      {managingBundle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-surface rounded-xl border border-hairline p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Manage Documents</h3>
            <p className="text-sm text-secondary mb-4">
              Document management for "{managingBundle.name}" will be available once the backend
              document listing API is connected.
            </p>
            <div className="flex justify-end">
              <Button onClick={() => setManagingBundle(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
