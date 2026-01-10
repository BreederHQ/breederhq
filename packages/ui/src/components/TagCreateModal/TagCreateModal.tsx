// packages/ui/src/components/TagCreateModal/TagCreateModal.tsx
// Shared modal for creating and editing tags, usable across all modules.

import * as React from "react";
import { Overlay } from "../OverlayShell";
import { Button } from "../Button";
import { Input } from "../Input";

export type TagModule =
  | "CONTACT"
  | "ORGANIZATION"
  | "ANIMAL"
  | "WAITLIST_ENTRY"
  | "OFFSPRING_GROUP"
  | "OFFSPRING"
  | "MESSAGE_THREAD"
  | "DRAFT"
  | "BREEDING_PLAN";

const MODULE_LABELS: Record<TagModule, string> = {
  CONTACT: "Contacts",
  ORGANIZATION: "Organizations",
  ANIMAL: "Animals",
  WAITLIST_ENTRY: "Waitlist Entries",
  OFFSPRING_GROUP: "Offspring Groups",
  OFFSPRING: "Offspring",
  MESSAGE_THREAD: "Message Threads",
  DRAFT: "Drafts",
  BREEDING_PLAN: "Breeding Plans",
};

const DEFAULT_MODULE_OPTIONS: TagModule[] = [
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

export type TagForEdit = {
  id: number;
  name: string;
  module: TagModule;
  color: string | null;
};

export type TagCreateModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "create" or "edit" mode */
  mode: "create" | "edit";
  /** Tag to edit (required when mode="edit") */
  tag?: TagForEdit;
  /** Called when tag is submitted. Receives name, module, and color. */
  onSubmit: (data: { name: string; module: TagModule; color: string | null }) => Promise<void>;
  /** If provided, the module selector is hidden and this module is used (create mode only) */
  fixedModule?: TagModule;
  /** Default module when modal opens in create mode (if not fixedModule) */
  defaultModule?: TagModule;
  /** Override the list of available modules in the dropdown */
  availableModules?: TagModule[];
  /** Description text shown below the form */
  description?: string;
};

export function TagCreateModal({
  open,
  onOpenChange,
  mode,
  tag,
  onSubmit,
  fixedModule,
  defaultModule = "CONTACT",
  availableModules = DEFAULT_MODULE_OPTIONS,
  description,
}: TagCreateModalProps) {
  const [name, setName] = React.useState("");
  const [module, setModule] = React.useState<TagModule>(fixedModule ?? defaultModule);
  const [color, setColor] = React.useState<string | null>(COLOR_PALETTE[0]);
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
        setModule(fixedModule ?? defaultModule);
        setColor(COLOR_PALETTE[0]);
      }
      setError(null);
    }
  }, [open, mode, tag, fixedModule, defaultModule]);

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
        module: fixedModule ?? module,
        color,
      });
      onOpenChange(false);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to save tag";
      const apiError = (err as any)?.body?.error || (err as any)?.body?.detail;
      setError(apiError || errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onOpenChange(false);
    }
  };

  // Determine if module selector should be shown
  const showModuleSelector = !fixedModule && mode === "create";

  // Build module options, ensuring tag's module is included in edit mode
  const moduleOptions = React.useMemo(() => {
    if (mode === "edit" && tag && !availableModules.includes(tag.module)) {
      return [...availableModules, tag.module];
    }
    return availableModules;
  }, [mode, tag, availableModules]);

  return (
    <Overlay open={open} onClose={handleClose} width={440}>
      <div>
        {/* Header */}
        <div className="px-4 py-3 border-b border-hairline">
          <h2 className="text-base font-semibold">
            {mode === "create" ? "Create Tag" : "Edit Tag"}
          </h2>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-3 space-y-3">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Name <span className="text-red-400">*</span>
              </label>
              <Input
                type="text"
                name="tag_name"
                autoComplete="off"
                data-1p-ignore="true"
                data-lpignore="true"
                data-form-type="other"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter tag name"
                autoFocus
                className="w-full"
              />
            </div>

            {/* Module - show selector in create mode (unless fixed), show disabled in edit mode */}
            {(showModuleSelector || mode === "edit") && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Module <span className="text-red-400">*</span>
                </label>
                <select
                  value={module}
                  onChange={(e) => setModule(e.target.value as TagModule)}
                  disabled={mode === "edit"}
                  className="w-full px-3 py-1.5 bg-surface border border-hairline rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {moduleOptions.map((mod) => (
                    <option key={mod} value={mod}>
                      {MODULE_LABELS[mod]}
                    </option>
                  ))}
                </select>
                {mode === "edit" && (
                  <p className="text-xs text-secondary mt-0.5">Module cannot be changed</p>
                )}
              </div>
            )}

            {/* Color */}
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <div className="grid grid-cols-9 gap-1">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded border-2 transition-all ${
                      color === c ? "border-white scale-110" : "border-transparent hover:border-hairline"
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* Description */}
            {description && (
              <p className="text-xs text-secondary">{description}</p>
            )}

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
              onClick={handleClose}
              disabled={submitting}
              size="sm"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} size="sm">
              {submitting ? "Saving..." : mode === "create" ? "Create" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}
