// apps/marketing/src/components/BundleDocumentPicker.tsx
// Component for selecting documents to add to a bundle

import * as React from "react";
import { Overlay, Button, Input } from "@bhq/ui";
import { Search, FileText, Check } from "lucide-react";
import type { DocumentBundle, BundleDocumentDTO, DocumentBundlesResource } from "@bhq/api";

interface Document {
  id: number;
  name: string;
  mimeType: string | null;
  sizeBytes: number | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bundle: DocumentBundle;
  api: {
    documentBundles: DocumentBundlesResource;
  };
  onSuccess: () => void;
  // For now, documents will be passed in - in future this could fetch from an API
  availableDocuments?: Document[];
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string | null): string {
  if (!mimeType) return "file";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("word") || mimeType.includes("document")) return "doc";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "spreadsheet";
  return "file";
}

export function BundleDocumentPicker({
  open,
  onOpenChange,
  bundle,
  api,
  onSuccess,
  availableDocuments = [],
}: Props) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Get IDs of documents already in the bundle
  const existingDocIds = React.useMemo(() => {
    return new Set(bundle.documents?.map((d) => d.documentId) || []);
  }, [bundle.documents]);

  // Filter out documents already in bundle and apply search
  const filteredDocuments = React.useMemo(() => {
    return availableDocuments
      .filter((doc) => !existingDocIds.has(doc.id))
      .filter((doc) => {
        if (!searchQuery.trim()) return true;
        return doc.name.toLowerCase().includes(searchQuery.toLowerCase());
      });
  }, [availableDocuments, existingDocIds, searchQuery]);

  // Reset state when modal opens
  React.useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
      setSearchQuery("");
      setError(null);
    }
  }, [open]);

  const toggleDocument = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddDocuments = async () => {
    if (selectedIds.size === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      await api.documentBundles.addDocuments(bundle.id, {
        documentIds: Array.from(selectedIds),
      });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to add documents";
      const apiError = (err as any)?.body?.error || (err as any)?.body?.detail;
      setError(apiError || errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Overlay open={open} onClose={() => onOpenChange(false)} width={560}>
      <div className="flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-hairline flex-shrink-0">
          <h2 className="text-lg font-semibold">Add Documents to Bundle</h2>
          <p className="text-sm text-secondary mt-0.5">
            Select documents to add to "{bundle.name}"
          </p>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-hairline flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {filteredDocuments.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="h-8 w-8 text-secondary mx-auto mb-3" />
              <p className="text-sm text-secondary">
                {searchQuery
                  ? "No documents match your search"
                  : availableDocuments.length === 0
                  ? "No documents available to add"
                  : "All available documents are already in this bundle"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredDocuments.map((doc) => {
                const isSelected = selectedIds.has(doc.id);
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => toggleDocument(doc.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors ${
                      isSelected
                        ? "bg-[hsl(var(--brand-orange))]/10 border border-[hsl(var(--brand-orange))]/30"
                        : "hover:bg-surface-strong border border-transparent"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border ${
                        isSelected
                          ? "bg-[hsl(var(--brand-orange))] border-[hsl(var(--brand-orange))]"
                          : "border-hairline"
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                    </div>
                    <div className="flex-shrink-0 w-8 h-8 rounded bg-surface-strong flex items-center justify-center">
                      <FileText className="h-4 w-4 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-primary truncate">
                        {doc.name}
                      </div>
                      <div className="text-xs text-secondary">
                        {formatFileSize(doc.sizeBytes)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 py-2 border-t border-hairline flex-shrink-0">
            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-md">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 border-t border-hairline flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-secondary">
            {selectedIds.size > 0 && (
              <span>{selectedIds.size} document{selectedIds.size > 1 ? "s" : ""} selected</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddDocuments}
              disabled={submitting || selectedIds.size === 0}
            >
              {submitting ? "Adding..." : `Add ${selectedIds.size > 0 ? selectedIds.size : ""} Document${selectedIds.size !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}
