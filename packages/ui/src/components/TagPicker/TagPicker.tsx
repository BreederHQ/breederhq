// packages/ui/src/components/TagPicker/TagPicker.tsx
import * as React from "react";
import { TagChip } from "../TagChip";

export type TagOption = {
  id: number;
  name: string;
  color: string | null;
  isArchived?: boolean;
};

export type TagPickerProps = {
  /** All available tags for this module */
  availableTags: TagOption[];
  /** Currently selected/assigned tags */
  selectedTags: TagOption[];
  /** Called when a tag is selected (assigned) */
  onSelect: (tag: TagOption) => void;
  /** Called when a tag is removed (unassigned) */
  onRemove: (tag: TagOption) => void;
  /** Called to create a new tag - receives name, should return the created tag */
  onCreate?: (name: string) => Promise<TagOption>;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Placeholder text */
  placeholder?: string;
  /** Disable the picker */
  disabled?: boolean;
  /** Class name for container */
  className?: string;
};

export function TagPicker({
  availableTags,
  selectedTags,
  onSelect,
  onRemove,
  onCreate,
  loading = false,
  error = null,
  placeholder = "Add tags...",
  disabled = false,
  className = "",
}: TagPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Selected tag IDs for quick lookup
  const selectedIds = React.useMemo(
    () => new Set(selectedTags.map((t) => t.id)),
    [selectedTags]
  );

  // Filter available tags by query, exclude already selected, exclude archived
  const filteredTags = React.useMemo(() => {
    const unselected = availableTags.filter((t) => !selectedIds.has(t.id) && !t.isArchived);
    if (!query.trim()) return unselected;
    const q = query.toLowerCase();
    return unselected.filter((t) => t.name.toLowerCase().includes(q));
  }, [availableTags, selectedIds, query]);

  // Check if query matches an existing tag exactly
  const exactMatch = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return availableTags.some((t) => t.name.toLowerCase() === q);
  }, [availableTags, query]);

  // Can create new tag if query is non-empty, no exact match, and onCreate provided
  const canCreate = onCreate && query.trim() && !exactMatch;

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
        setCreateError(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (tag: TagOption) => {
    onSelect(tag);
    setQuery("");
    inputRef.current?.focus();
  };

  const handleCreate = async () => {
    if (!onCreate || !query.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const newTag = await onCreate(query.trim());
      onSelect(newTag);
      setQuery("");
    } catch (err: any) {
      // Handle 409 tag_archived error
      if (err?.status === 409 && err?.code === "tag_archived") {
        setCreateError("This tag is archived. Unarchive it in Settings to assign.");
      } else {
        const msg = err instanceof Error ? err.message : "Failed to create tag";
        setCreateError(msg);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canCreate && !creating) {
      e.preventDefault();
      handleCreate();
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Selected tags chips */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {selectedTags.map((tag) => (
          <TagChip
            key={tag.id}
            name={tag.name}
            color={tag.color}
            isArchived={tag.isArchived}
            onRemove={disabled ? undefined : () => onRemove(tag)}
          />
        ))}
      </div>

      {/* Input area */}
      <div
        className={`flex items-center gap-2 px-3 py-2 border border-hairline rounded-md bg-surface ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-text"
        } ${open ? "ring-2 ring-brand/50" : ""}`}
        onClick={() => {
          if (!disabled) {
            setOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        <svg className="w-4 h-4 text-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent text-sm outline-none placeholder-secondary"
        />
        {loading && (
          <svg className="w-4 h-4 animate-spin text-secondary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
      </div>

      {/* Error display */}
      {(error || createError) && (
        <p className="mt-1 text-xs text-red-400">{error || createError}</p>
      )}

      {/* Dropdown */}
      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-hairline rounded-md shadow-lg z-50 max-h-[240px] overflow-y-auto">
          {/* Tag options */}
          {filteredTags.length > 0 && (
            <div className="py-1">
              {filteredTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleSelect(tag)}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-surface-hover transition-colors text-left"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color || "#888" }}
                  />
                  <span className="text-sm truncate">{tag.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {filteredTags.length === 0 && !canCreate && (
            <div className="px-3 py-4 text-sm text-secondary text-center">
              {query.trim() ? "No matching tags" : "No tags available"}
            </div>
          )}

          {/* Create new option */}
          {canCreate && (
            <div className="border-t border-hairline">
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-surface-hover transition-colors text-left text-brand disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm">
                  {creating ? "Creating..." : `Create "${query.trim()}"`}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
