// apps/contacts/src/components/BundlePicker.tsx
// Modal for selecting a document bundle to attach in EmailComposer

import * as React from "react";
import { createPortal } from "react-dom";
import { Button, Input } from "@bhq/ui";
import { X, Search, Package, ChevronRight, FileText } from "lucide-react";
import { getOverlayRoot, acquireOverlayHost } from "@bhq/ui/overlay";
import type { DocumentBundle, DocumentBundlesResource } from "@bhq/api";

interface BundlePickerProps {
  onClose: () => void;
  onSelect: (bundle: DocumentBundle) => void;
  api: {
    documentBundles: DocumentBundlesResource;
  };
}

export function BundlePicker({ onClose, onSelect, api }: BundlePickerProps) {
  const [bundles, setBundles] = React.useState<DocumentBundle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedBundle, setSelectedBundle] = React.useState<DocumentBundle | null>(null);

  const overlayRoot = getOverlayRoot();

  // Acquire overlay host for pointer events
  React.useEffect(() => {
    const release = acquireOverlayHost();
    return release;
  }, []);

  // Fetch bundles on mount
  React.useEffect(() => {
    async function fetchBundles() {
      try {
        setLoading(true);
        const res = await api.documentBundles.list({ status: "active" });
        setBundles(res.items);
      } catch (e: any) {
        setError(e?.message || "Failed to load bundles");
      } finally {
        setLoading(false);
      }
    }
    fetchBundles();
  }, [api]);

  // Filter bundles by search query
  const filteredBundles = React.useMemo(() => {
    if (!searchQuery.trim()) return bundles;
    const q = searchQuery.toLowerCase();
    return bundles.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.description?.toLowerCase().includes(q))
    );
  }, [bundles, searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (selectedBundle) {
        setSelectedBundle(null);
      } else {
        onClose();
      }
    }
  };

  const handleSelectBundle = () => {
    if (selectedBundle) {
      onSelect(selectedBundle);
      onClose();
    }
  };

  if (!overlayRoot) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bundle-picker-title"
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 2147483646 }}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-xl border border-hairline bg-surface shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
          <div>
            <h2 id="bundle-picker-title" className="text-lg font-semibold">
              {selectedBundle ? "Bundle Preview" : "Attach Document Bundle"}
            </h2>
            <div className="text-sm text-secondary mt-0.5">
              {selectedBundle
                ? "Review the bundle documents before attaching"
                : "Select a bundle to attach to your email"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md text-secondary hover:text-primary hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {selectedBundle ? (
            // Preview Mode
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              <button
                onClick={() => setSelectedBundle(null)}
                className="flex items-center gap-1 text-sm text-secondary hover:text-primary transition-colors"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                Back to bundles
              </button>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-secondary font-medium uppercase tracking-wide mb-1">
                    Bundle Name
                  </label>
                  <div className="text-sm text-primary font-medium">
                    {selectedBundle.name}
                  </div>
                </div>

                {selectedBundle.description && (
                  <div>
                    <label className="block text-xs text-secondary font-medium uppercase tracking-wide mb-1">
                      Description
                    </label>
                    <div className="text-sm text-secondary">
                      {selectedBundle.description}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-secondary font-medium uppercase tracking-wide mb-1">
                    Documents ({selectedBundle.documentCount})
                  </label>
                  {selectedBundle.documents && selectedBundle.documents.length > 0 ? (
                    <div className="space-y-1.5 mt-2">
                      {selectedBundle.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-md bg-surface-strong border border-hairline"
                        >
                          <FileText className="h-4 w-4 text-secondary flex-shrink-0" />
                          <span className="text-sm text-primary truncate">{doc.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-secondary italic">
                      {selectedBundle.documentCount} document{selectedBundle.documentCount !== 1 ? "s" : ""} in this bundle
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // List Mode
            <>
              {/* Search */}
              <div className="p-4 border-b border-hairline">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                    placeholder="Search bundles..."
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </div>

              {/* Bundle List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-sm text-secondary">
                    Loading bundles...
                  </div>
                ) : error ? (
                  <div className="p-8 text-center">
                    <div className="text-sm text-red-400 mb-2">{error}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.reload()}
                    >
                      Retry
                    </Button>
                  </div>
                ) : filteredBundles.length === 0 ? (
                  <div className="p-8 text-center text-sm text-secondary">
                    {searchQuery
                      ? "No bundles match your search"
                      : "No document bundles available. Create bundles in Marketing > Document Bundles."}
                  </div>
                ) : (
                  <div className="divide-y divide-hairline">
                    {filteredBundles.map((bundle) => (
                      <button
                        key={bundle.id}
                        onClick={() => setSelectedBundle(bundle)}
                        className="w-full px-5 py-4 text-left hover:bg-white/5 transition-colors flex items-start gap-3"
                      >
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center">
                          <Package className="h-4 w-4 text-[hsl(var(--brand-orange))]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-primary">
                            {bundle.name}
                          </div>
                          {bundle.description && (
                            <div className="text-xs text-secondary mt-0.5 line-clamp-1">
                              {bundle.description}
                            </div>
                          )}
                          <div className="text-xs text-secondary mt-1 flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {bundle.documentCount} document{bundle.documentCount !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-secondary flex-shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-hairline flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {selectedBundle && (
            <Button onClick={handleSelectBundle}>
              <Package className="h-4 w-4 mr-1.5" />
              Attach Bundle
            </Button>
          )}
        </div>
      </div>
    </div>,
    overlayRoot
  );
}
