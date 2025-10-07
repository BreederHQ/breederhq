import * as React from "react";

export type OwnerPartyType = "Contact" | "Organization";
export type OwnerRow = {
  id?: number;
  partyType: OwnerPartyType;
  contactId?: number | null;
  organizationId?: number | null;
  display_name: string;
  is_primary?: boolean;
  percent?: number | null; // 0..100 (optional)
};

export function OwnershipChips({ owners }: { owners?: OwnerRow[] | null }) {
  const list = owners ?? [];
  if (!list.length) {
    return <span className="text-sm text-secondary">No owners set</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((o, i) => {
        const bits: string[] = [];
        if (o.is_primary) bits.push("Primary");
        if (typeof o.percent === "number") bits.push(`${o.percent}%`);
        return (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-hairline bg-surface-strong text-xs"
            title={o.partyType}
          >
            <span className="font-medium">{o.display_name}</span>
            {!!bits.length && <span className="opacity-70">({bits.join(", ")})</span>}
          </span>
        );
      })}
    </div>
  );
}
