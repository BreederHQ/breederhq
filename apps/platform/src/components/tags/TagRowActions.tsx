// apps/platform/src/components/tags/TagRowActions.tsx
import React from "react";

type Tag = {
  id: number;
  name: string;
  module: string;
  color: string | null;
  isArchived?: boolean;
};

type Props = {
  tag: Tag;
  usageCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
};

export function TagRowActions({ tag, usageCount, onEdit, onDelete, onArchive, onUnarchive }: Props) {
  const canDelete = usageCount === 0;
  const isArchived = tag.isArchived ?? false;
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1 hover:bg-surface-hover rounded transition-colors"
        aria-label="Tag actions"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="13" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-surface border border-hairline rounded-md shadow-lg py-1 z-10 min-w-[140px]">
          <button
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-surface-hover transition-colors"
          >
            Edit
          </button>

          {isArchived ? (
            <button
              onClick={() => {
                setOpen(false);
                onUnarchive();
              }}
              className="w-full px-3 py-1.5 text-left text-sm text-brand hover:bg-surface-hover transition-colors"
            >
              Unarchive
            </button>
          ) : (
            <button
              onClick={() => {
                setOpen(false);
                onArchive();
              }}
              className="w-full px-3 py-1.5 text-left text-sm text-amber-400 hover:bg-surface-hover transition-colors"
            >
              Archive
            </button>
          )}

          <button
            disabled={!canDelete}
            onClick={canDelete ? () => {
              setOpen(false);
              onDelete();
            } : undefined}
            className={`w-full px-3 py-1.5 text-left text-sm ${
              canDelete
                ? "text-red-400 hover:bg-surface-hover transition-colors"
                : "text-secondary opacity-50 cursor-not-allowed"
            }`}
            title={canDelete ? "Delete this tag" : `Cannot delete: tag is used ${usageCount} time${usageCount === 1 ? "" : "s"}`}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
