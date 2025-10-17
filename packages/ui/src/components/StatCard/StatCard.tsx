import React from "react";

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface p-4 shadow-sm">
      <div className="text-xs text-fg-muted">{label}</div>
      <div className="mt-1 text-3xl font-semibold tracking-tight">{value}</div>
      {hint ? <div className="mt-1 text-xs text-fg-muted">{hint}</div> : null}
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {children}
    </div>
  );
}
