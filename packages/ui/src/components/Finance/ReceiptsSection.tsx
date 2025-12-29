// packages/ui/src/components/Finance/ReceiptsSection.tsx
// Simple reusable receipts/attachments component for finance entities

import * as React from "react";

export interface ReceiptsSectionProps {
  label?: string;
  entityId: number;
  attachments: {
    list: (entityId: number) => Promise<any[]>;
    create: (entityId: number, body: any) => Promise<any>;
    delete: (entityId: number, attachmentId: number) => Promise<any>;
  };
}

export function ReceiptsSection({ label = "Receipts", entityId, attachments }: ReceiptsSectionProps) {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadAttachments = React.useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await attachments.list(entityId);
      setItems(Array.isArray(result) ? result : []);
    } catch (e: any) {
      console.error("Failed to load attachments:", e);
      setError("Failed to load attachments");
    } finally {
      setLoading(false);
    }
  }, [entityId, attachments]);

  React.useEffect(() => {
    loadAttachments();
  }, [loadAttachments]);

  const handleUpload = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      // For simplicity, we'll use a mock storage approach
      // In production, this would upload to actual storage first
      const body = {
        kind: "RECEIPT",
        storageProvider: "local",
        storageKey: `receipts/${Date.now()}_${file.name}`,
        filename: file.name,
        mime: file.type || "application/octet-stream",
        bytes: file.size,
      };

      const created = await attachments.create(entityId, body);
      setItems((prev) => [created, ...prev]);
    } catch (e: any) {
      console.error("Upload failed:", e);
      setError(e?.message || "Upload failed");
    } finally {
      setUploading(false);
      ev.target.value = "";
    }
  };

  const handleRemove = async (att: any) => {
    if (!att?.id) return;
    if (!window.confirm(`Remove ${att.filename}?`)) return;

    try {
      await attachments.delete(entityId, att.id);
      setItems((prev) => prev.filter((x) => x.id !== att.id));
    } catch (e: any) {
      console.error("Failed to remove attachment:", e);
      setError(e?.message || "Failed to remove attachment");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <label className="inline-flex cursor-pointer items-center rounded border border-border bg-background px-2 py-1 text-xs font-medium hover:bg-accent">
          <span>{uploading ? "Uploading..." : "Upload"}</span>
          <input
            type="file"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
            accept="image/*,.pdf,.doc,.docx"
          />
        </label>
      </div>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {loading && <div className="text-xs text-muted-foreground">Loading...</div>}

      {!loading && items.length === 0 && (
        <div className="text-xs text-muted-foreground">No receipts yet.</div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-1">
          {items.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between gap-2 rounded border border-border bg-background px-2 py-1.5"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">{att.filename}</div>
                <div className="text-[10px] text-muted-foreground">
                  {formatBytes(att.bytes || 0)}
                  {att.createdAt && ` • ${formatDate(att.createdAt)}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(att)}
                className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] hover:bg-accent"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
