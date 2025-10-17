// shared/table/TableHeaderCell.tsx
import * as React from "react";
import { useTable } from "./TableContext";

type Props<K extends string> = {
  columnKey: K;
  label: React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
};

export function TableHeaderCell<K extends string>({ columnKey, label, sortable = true, align = "left" }: Props<K>) {
  const { sort } = useTable<K>();
  const dir = sort.dirFor(columnKey); // "asc" | "desc" | null
  const ariaSort = dir ? (dir === "asc" ? "ascending" : "descending") : "none";

  return (
    <th className={`px-3 py-3 text-${align}`}>
      <button
        type="button"
        aria-sort={ariaSort as any}
        title={sortable ? (dir ? `${label} (${dir})` : `Sort by ${label}`) : undefined}
        onClick={(e) => sortable && sort.cycle(columnKey, e.shiftKey)}
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
