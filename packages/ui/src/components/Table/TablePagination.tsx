// shared/table/TablePagination.tsx
import * as React from "react";
import { components } from "@bhq/ui";
import { useTable } from "./TableContext";

export function TablePagination() {
  const { pager } = useTable();
  return (
    <div className="flex items-center gap-2">
      <label className="hidden sm:flex items-center gap-2 text-xs text-secondary">
        <span>Rows</span>
        <div className="relative">
          <select
            className="appearance-none pr-8 bg-surface-strong border border-hairline rounded px-2 py-1 text-sm outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
            value={String(pager.pageSize)}
            onChange={(e) => pager.setPageSize(Number(e.currentTarget.value))}
          >
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M5.5 7.5l4.5 4 4.5-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </label>
      <components.Button variant="outline" size="sm" onClick={pager.prev} disabled={pager.page === 1}>Prev</components.Button>
      <div>Page {pager.page} of {pager.pageCount}</div>
      <components.Button variant="outline" size="sm" onClick={pager.next} disabled={pager.page === pager.pageCount}>Next</components.Button>
    </div>
  );
}
