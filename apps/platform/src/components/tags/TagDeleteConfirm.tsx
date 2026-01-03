// apps/platform/src/components/tags/TagDeleteConfirm.tsx
import React from "react";
import { Overlay, Button } from "@bhq/ui";

type Tag = {
  id: number;
  name: string;
  module: string;
  color: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag: Tag | null;
  onConfirm: () => Promise<void>;
};

export function TagDeleteConfirm({ open, onOpenChange, tag, onConfirm }: Props) {
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to delete tag";
      const apiError = (err as any)?.body?.error || (err as any)?.body?.detail;
      setError(apiError || errMsg);
    } finally {
      setDeleting(false);
    }
  };

  React.useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open]);

  if (!tag) return null;

  return (
    <Overlay open={open} onOpenChange={onOpenChange} size="sm" ariaLabel="Delete Tag">
      <div className="bg-surface rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-hairline">
          <h2 className="text-lg font-semibold text-red-400">Delete Tag</h2>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <p className="text-sm">
            Are you sure you want to delete the tag <span className="font-semibold">"{tag.name}"</span>?
          </p>
          <p className="text-sm text-secondary">
            This action cannot be undone.
          </p>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-hairline flex justify-end gap-3">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
            size="sm"
            variant="ghost"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            size="sm"
            variant="destructive"
          >
            {deleting ? "Deleting..." : "Delete Tag"}
          </Button>
        </div>
      </div>
    </Overlay>
  );
}
