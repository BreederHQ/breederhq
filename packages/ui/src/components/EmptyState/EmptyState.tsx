import React from "react";

export function EmptyState({
  title = "Nothing here yet",
  hint = "Try adjusting filters or adding a new record.",
  action,
}: {
  title?: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-surface-border p-8 text-center">
      <div className="text-lg font-semibold tracking-tight">{title}</div>
      <div className="mt-1 text-sm text-fg-muted">{hint}</div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
