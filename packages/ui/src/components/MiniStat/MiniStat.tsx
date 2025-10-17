import * as React from "react";

export function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded border border-hairline bg-surface px-3 py-2">
      <div className="text-xs text-secondary mb-1 uppercase tracking-wide">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
