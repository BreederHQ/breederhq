// packages/ui/src/components/TagChip/TagChip.tsx
import * as React from "react";

export type TagChipProps = {
  name: string;
  color?: string | null;
  isArchived?: boolean;
  onRemove?: () => void;
  className?: string;
};

export function TagChip({ name, color, isArchived, onRemove, className = "" }: TagChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-surface-dimmed border border-hairline ${
        isArchived ? "opacity-60" : ""
      } ${className}`}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color || "#888" }}
      />
      <span className="truncate max-w-[120px]">{name}</span>
      {isArchived && (
        <span className="text-[10px] text-secondary">(archived)</span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:bg-surface-hover rounded-full p-0.5 transition-colors"
          aria-label={`Remove ${name}`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}
