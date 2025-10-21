import React from "react";

export function EntityRow({
  title,
  subtitle,
  meta,
  onClick,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full border-b border-surface-border py-3 text-left transition-colors hover:bg-surface-2"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium">{title}</div>
          {subtitle ? <div className="text-xs text-fg-muted">{subtitle}</div> : null}
        </div>
        {meta ? <div className="shrink-0 text-xs text-fg-muted">{meta}</div> : null}
      </div>
    </button>
  );
}
