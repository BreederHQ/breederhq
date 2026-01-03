// apps/platform/src/components/tags/TagCreateEditModal.tsx
import React from "react";
import { Overlay, Button, Input } from "@bhq/ui";

type TagModule = "CONTACT" | "ORGANIZATION" | "ANIMAL" | "WAITLIST_ENTRY" | "OFFSPRING_GROUP" | "OFFSPRING";

const MODULE_LABELS: Record<TagModule, string> = {
  CONTACT: "Contacts",
  ORGANIZATION: "Organizations",
  ANIMAL: "Animals",
  WAITLIST_ENTRY: "Waitlist Entries",
  OFFSPRING_GROUP: "Offspring Groups",
  OFFSPRING: "Offspring",
};

const MODULE_OPTIONS: TagModule[] = [
  "CONTACT",
  "ORGANIZATION",
  "ANIMAL",
  "WAITLIST_ENTRY",
  "OFFSPRING_GROUP",
  "OFFSPRING",
];

const COLOR_PALETTE = [
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
  "#64748b", // slate
  "#78716c", // stone
];

type Tag = {
  id: number;
  name: string;
  module: TagModule;
  color: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  tag?: Tag;
  onSubmit: (data: { name: string; module: TagModule; color: string | null }) => Promise<void>;
};

export function TagCreateEditModal({ open, onOpenChange, mode, tag, onSubmit }: Props) {
  const [name, setName] = React.useState("");
  const [module, setModule] = React.useState<TagModule>("CONTACT");
  const [color, setColor] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Initialize form when tag changes or modal opens
  React.useEffect(() => {
    if (open) {
      if (mode === "edit" && tag) {
        setName(tag.name);
        setModule(tag.module);
        setColor(tag.color);
      } else {
        setName("");
        setModule("CONTACT");
        setColor(COLOR_PALETTE[0]);
      }
      setError(null);
    }
  }, [open, mode, tag]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        module,
        color,
      });
      onOpenChange(false);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to save tag";
      // Parse API error if available
      const apiError = (err as any)?.body?.error || (err as any)?.body?.detail;
      setError(apiError || errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Overlay open={open} onOpenChange={onOpenChange} size="sm" ariaLabel={mode === "create" ? "Create Tag" : "Edit Tag"}>
      <div className="bg-surface rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-hairline">
          <h2 className="text-lg font-semibold">{mode === "create" ? "Create Tag" : "Edit Tag"}</h2>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Name <span className="text-red-400">*</span>
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter tag name"
                autoFocus
                className="w-full"
              />
            </div>

            {/* Module */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Module <span className="text-red-400">*</span>
              </label>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value as TagModule)}
                disabled={mode === "edit"} // Module is immutable after creation
                className="w-full px-3 py-2 bg-surface border border-hairline rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {MODULE_OPTIONS.map((mod) => (
                  <option key={mod} value={mod}>
                    {MODULE_LABELS[mod]}
                  </option>
                ))}
              </select>
              {mode === "edit" && (
                <p className="text-xs text-secondary mt-1">Module cannot be changed after creation</p>
              )}
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Color <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-9 gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-md border-2 transition-all ${
                      color === c ? "border-white scale-110" : "border-transparent hover:border-hairline"
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
              {color && (
                <div className="mt-2 text-xs text-secondary">
                  Selected: <span className="font-mono">{color}</span>
                </div>
              )}
            </div>

            {/* Error */}
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
              disabled={submitting}
              size="sm"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} size="sm">
              {submitting ? "Saving..." : mode === "create" ? "Create Tag" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}
