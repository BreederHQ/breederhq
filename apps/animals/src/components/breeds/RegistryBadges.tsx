// src/components/breeds/RegistryBadges.tsx
import React from "react";

export type RegistryInfo = {
  code: string;
  url?: string | null;
  primary?: boolean | null;
  since?: string | number | null;
  statusText?: string | null;
};

export default function RegistryBadges({
  registries,
  compact = false,
}: {
  registries: RegistryInfo[] | undefined;
  compact?: boolean;
}) {
  if (!registries || registries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {registries.map((r, i) => {
        const title = [
          r.code,
          r.statusText ? `— ${r.statusText}` : null,
          r.since ? ` (since ${r.since})` : null,
          r.primary ? " [primary]" : null,
        ]
          .filter(Boolean)
          .join("");

        const base =
          "inline-flex items-center rounded-md border text-xs px-2 py-0.5";
        const cls = r.primary
          ? `${base} border-blue-300 bg-blue-50`
          : `${base} border-slate-300 bg-slate-50`;

        const badge = (
          <span key={i} className={cls} title={title}>
            {r.code}
            {r.statusText && !compact ? (
              <span className="ml-1 text-[10px] opacity-70">({r.statusText})</span>
            ) : null}
          </span>
        );

        if (r.url) {
          return (
            <a
              key={i}
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
              title={title}
            >
              {badge}
            </a>
          );
        }
        return badge;
      })}
    </div>
  );
}
