import * as React from "react";
import type { OwnershipRow } from "../../utils";

export function OwnershipChips({ owners }: { owners: OwnershipRow[] }) {
  if (!owners || owners.length === 0) return <span className="text-secondary">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {owners.map((o, i) => {
        const fallbackId =
          o.partyId ??
          (o.partyType === "Organization" ? o.organizationId : o.contactId);
        const fallbackLabel =
          fallbackId != null
            ? o.partyType === "Organization"
              ? `Org #${fallbackId}`
              : `Contact #${fallbackId}`
            : o.partyType === "Organization"
            ? "Organization"
            : "Contact";
        const label = o.display_name || fallbackLabel;
        return (
          <span
            key={i}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-hairline"
            title={o.is_primary ? "Primary owner" : undefined}
          >
            {o.is_primary && <span aria-hidden>★</span>}
            <span className="truncate max-w-[180px]">{label}</span>
            {typeof o.percent === "number" && <span className="text-secondary">{o.percent}%</span>}
          </span>
        );
      })}
    </div>
  );
}
