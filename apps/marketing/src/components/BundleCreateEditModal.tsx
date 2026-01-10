// apps/marketing/src/components/BundleCreateEditModal.tsx
// Modal for creating and editing document bundles

import * as React from "react";
import { Overlay, Button, Input } from "@bhq/ui";
import type {
  DocumentBundle,
  CreateBundleInput,
  UpdateBundleInput,
  DocumentBundlesResource,
} from "@bhq/api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  bundle?: DocumentBundle;
  api: {
    documentBundles: DocumentBundlesResource;
  };
  onSuccess: () => void;
}

export function BundleCreateEditModal({
  open,
  onOpenChange,
  mode,
  bundle,
  api,
  onSuccess,
}: Props) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Initialize form when modal opens
  React.useEffect(() => {
    if (open) {
      if (mode === "edit" && bundle) {
        setName(bundle.name);
        setDescription(bundle.description || "");
      } else {
        setName("");
        setDescription("");
      }
      setError(null);
    }
  }, [open, mode, bundle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Bundle name is required");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "create") {
        const input: CreateBundleInput = {
          name: name.trim(),
          description: description.trim() || undefined,
        };
        await api.documentBundles.create(input);
      } else if (bundle) {
        const input: UpdateBundleInput = {
          name: name.trim(),
          description: description.trim() || undefined,
        };
        await api.documentBundles.update(bundle.id, input);
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to save bundle";
      const apiError = (err as any)?.body?.error || (err as any)?.body?.detail;
      setError(apiError || errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Overlay open={open} onClose={() => onOpenChange(false)} width={480}>
      <div>
        {/* Header */}
        <div className="px-5 py-4 border-b border-hairline">
          <h2 className="text-lg font-semibold">
            {mode === "create" ? "Create Document Bundle" : "Edit Bundle"}
          </h2>
          <p className="text-sm text-secondary mt-0.5">
            {mode === "create"
              ? "Create a named collection of documents to attach to emails"
              : "Update your bundle details"}
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Bundle Name <span className="text-red-400">*</span>
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Go Home Document Bundle"
                autoFocus
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
              />
              <p className="text-xs text-secondary mt-1">
                Give your bundle a name that describes the documents it contains
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description of what this bundle is for..."
                rows={3}
                className="w-full px-3 py-2 rounded-md bg-surface border border-hairline text-sm text-primary resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Info about adding documents */}
            {mode === "create" && (
              <div className="p-3 bg-surface-strong border border-hairline rounded-md">
                <p className="text-xs text-secondary">
                  After creating the bundle, you can add documents to it from the bundle management screen.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-hairline flex justify-end gap-2">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              variant="outline"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : mode === "create" ? "Create Bundle" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}
