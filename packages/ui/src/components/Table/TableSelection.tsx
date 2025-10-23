import * as React from "react";

/** Hook to manage row selection by id (string | number). */
export function useRowSelection<TId extends string | number>() {
  const [selected, setSelected] = React.useState<Set<TId>>(new Set());

  const clear = React.useCallback(() => setSelected(new Set()), []);
  const isSelected = React.useCallback((id: TId) => selected.has(id), [selected]);

  const toggleOne = React.useCallback((id: TId) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /** Toggle all currently visible ids (page-level “select all”). */
  const toggleAll = React.useCallback((ids: TId[]) => {
    setSelected(prev => {
      const allOn = ids.every(id => prev.has(id));
      if (allOn) {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  }, []);

  const selectedIds = React.useMemo(() => Array.from(selected), [selected]);
  const count = selected.size;

  return { selected, selectedIds, count, clear, isSelected, toggleOne, toggleAll, setSelected };
}

/** Small header checkbox that can drive page-level select-all. */
export function HeaderSelect({
  pageIds,
  onToggleAll,
  className,
  title = "Select all on page",
}: {
  pageIds: Array<string | number>;
  onToggleAll: (ids: Array<string | number>) => void;
  className?: string;
  title?: string;
}) {
  const [indeterminate, setIndeterminate] = React.useState(false);
  const ref = React.useRef<HTMLInputElement | null>(null);
  // caller controls indeterminate by passing the right class; we keep simple here
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  // NOTE: parent decides indeterminate/checked state via props it computes.
  return (
    <input
      ref={ref}
      type="checkbox"
      title={title}
      className={className || "h-4 w-4 rounded border border-hairline bg-surface"}
      onChange={() => onToggleAll(pageIds)}
    />
  );
}

/** Row checkbox */
export function RowSelect({
  checked,
  onChange,
  title = "Select row",
  className,
}: {
  checked: boolean;
  onChange: () => void;
  title?: string;
  className?: string;
}) {
  return (
    <input
      type="checkbox"
      title={title}
      checked={checked}
      onChange={onChange}
      className={className || "h-4 w-4 rounded border border-hairline bg-surface"}
    />
  );
}

/** Bulk actions bar that surfaces when anything is selected. */
export function BulkActionsBar({
  count,
  onClear,
  children,
}: {
  count: number;
  onClear: () => void;
  children?: React.ReactNode; // buttons you pass (Archive, Export, etc.)
}) {
  if (!count) return null;
  return (
    <div className="mx-2 mb-2 rounded-lg border border-hairline bg-surface-strong/70 px-3 py-2 flex items-center gap-2">
      <div className="text-sm">{count} selected</div>
      <div className="flex-1" />
      <div className="flex items-center gap-2">{children}</div>
      <button
        type="button"
        className="text-xs underline text-secondary hover:text-primary ml-2"
        onClick={onClear}
      >
        Clear selection
      </button>
    </div>
  );
}
