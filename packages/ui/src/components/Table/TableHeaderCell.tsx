// packages/ui/src/components/Table/TableHeaderCell.tsx
import * as React from "react";
import { useTable } from "./TableContext";

type Props<K extends string> = {
  columnKey: K;
  label: React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
};

export function TableHeaderCell<K extends string>({
  columnKey,
  label,
  sortable = true,
  align = "left",
}: Props<K>) {
  const ctrl = useTable<K>(); // controller exposes dirFor / toggleSort

  const dir: "asc" | "desc" | null = ctrl.dirFor?.(columnKey as K) ?? null;
  const ariaSort: "ascending" | "descending" | "none" =
    dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none";

  const onClick = sortable
    ? (e: React.MouseEvent) =>
        ctrl.toggleSort?.(columnKey as K, e.shiftKey || e.metaKey || e.ctrlKey)
    : undefined;

  const onKeyDown = sortable
    ? (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          ctrl.toggleSort?.(columnKey as K, e.shiftKey || e.metaKey || e.ctrlKey);
        }
      }
    : undefined;

  return (
    <th
      className={`px-3 py-3 text-${align}`}
      role="columnheader"
      aria-sort={ariaSort}
    >
      <button
        type="button"
        onClick={onClick}
        onKeyDown={onKeyDown}
        title={
          sortable
            ? dir
              ? `${String(label)} (${dir})`
              : `Sort by ${String(label)}`
            : undefined
        }
        className={[
          "inline-flex items-center gap-1 w-full select-none rounded-md px-2 py-1",
          sortable ? "hover:bg-white/5 focus:bg-white/5 focus:outline-none" : "",
          dir ? "text-primary" : "text-secondary",
        ].join(" ")}
      >
        <span className="truncate">{label}</span>
        <span
          aria-hidden
          className={[
            "inline-block h-1.5 w-1.5 rounded-full",
            dir ? "bg-[hsl(var(--brand-orange))]" : "bg-transparent",
          ].join(" ")}
        />
      </button>
    </th>
  );
}

export default TableHeaderCell;
