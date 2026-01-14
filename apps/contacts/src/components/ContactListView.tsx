// apps/contacts/src/components/ContactListView.tsx
// Experimental list view - cleaner row-based UI for contacts

import * as React from "react";
import { Building2, MapPin, Mail, Phone, MessageCircle, ChevronRight, User } from "lucide-react";
import { TagChip } from "@bhq/ui";
import type { PartyTableRow } from "../App-Contacts";

type ColumnDef = { key: string; label: string };

type ContactListViewProps = {
  rows: PartyTableRow[];
  loading: boolean;
  error: string | null;
  onRowClick?: (row: PartyTableRow) => void;
  visibleColumns: ColumnDef[];
};

/**
 * Get initials from a display name (max 2 characters)
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Default avatar colors - distinct neutrals that won't conflict with tag colors
 * Tag palette uses: red, orange, amber, yellow, lime, green, emerald, teal,
 * cyan, sky, blue, indigo, violet, purple, fuchsia, pink, slate, stone
 */
const DEFAULT_CONTACT_COLOR = "#a8a29e"; // warm stone-400 for people
const DEFAULT_ORG_COLOR = "#57534e"; // warm stone-600 for organizations

/**
 * Column width configuration
 */
const COLUMN_WIDTHS: Record<string, string> = {
  kind: "w-28",
  displayName: "w-48",
  email: "w-48",
  phone: "w-36",
  whatsappE164: "w-36",
  firstName: "w-32",
  lastName: "w-32",
  nickname: "w-32",
  city: "w-28",
  state: "w-24",
  postalCode: "w-24",
  country: "w-28",
  status: "w-24",
  leadStatus: "w-28",
  tags: "flex-1 min-w-[120px]",
  notes: "w-48",
  created_at: "w-28",
  updated_at: "w-28",
};

/**
 * Render a cell value based on column key
 */
function CellValue({ row, colKey }: { row: PartyTableRow; colKey: string }) {
  const value = (row as any)[colKey];

  // Special rendering for specific columns
  switch (colKey) {
    case "kind":
      return (
        <span className="text-xs text-secondary uppercase tracking-wide">
          {value === "ORGANIZATION" ? "Org" : "Contact"}
        </span>
      );

    case "displayName":
      return (
        <span className="font-medium text-primary truncate block">
          {value || "-"}
        </span>
      );

    case "email":
      return value ? (
        <div className="flex items-center gap-1.5 text-sm text-secondary truncate">
          <Mail className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
          <span className="truncate">{value}</span>
        </div>
      ) : (
        <span className="text-sm text-secondary/50">-</span>
      );

    case "phone":
      return value ? (
        <div className="flex items-center gap-1.5 text-sm text-secondary truncate">
          <Phone className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
          <span className="truncate">{value}</span>
        </div>
      ) : (
        <span className="text-sm text-secondary/50">-</span>
      );

    case "whatsappE164":
      return value ? (
        <div className="flex items-center gap-1.5 text-sm text-secondary truncate">
          <MessageCircle className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
          <span className="truncate">{value}</span>
        </div>
      ) : (
        <span className="text-sm text-secondary/50">-</span>
      );

    case "city":
    case "state":
      // Combine into location if both visible, otherwise show individual
      return value ? (
        <div className="flex items-center gap-1.5 text-sm text-secondary truncate">
          <MapPin className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
          <span className="truncate">{value}</span>
        </div>
      ) : (
        <span className="text-sm text-secondary/50">-</span>
      );

    case "tags":
      const tags = row.tagObjects || row.tags?.map((t) => ({ id: t, name: t, color: undefined })) || [];
      return tags.length > 0 ? (
        <div className="flex items-center gap-1.5 overflow-hidden">
          {tags.slice(0, 3).map((tag) => (
            <TagChip
              key={typeof tag === "string" ? tag : tag.id}
              name={typeof tag === "string" ? tag : tag.name}
              color={typeof tag === "string" ? undefined : tag.color}
            />
          ))}
          {tags.length > 3 && (
            <span className="text-xs text-secondary flex-shrink-0">+{tags.length - 3}</span>
          )}
        </div>
      ) : (
        <span className="text-sm text-secondary/50">-</span>
      );

    case "created_at":
    case "updated_at":
      if (!value) return <span className="text-sm text-secondary/50">-</span>;
      const date = new Date(value);
      return (
        <span className="text-sm text-secondary">
          {date.toLocaleDateString()}
        </span>
      );

    default:
      // Generic text display
      if (Array.isArray(value)) {
        return <span className="text-sm text-secondary truncate">{value.join(", ") || "-"}</span>;
      }
      return <span className="text-sm text-secondary truncate">{value || "-"}</span>;
  }
}

function ContactListRow({
  row,
  onClick,
  visibleColumns,
}: {
  row: PartyTableRow;
  onClick?: () => void;
  visibleColumns: ColumnDef[];
}) {
  const isOrg = row.kind === "ORGANIZATION";

  // Use first tag color if available, otherwise use default based on type
  const firstTagColor = row.tagObjects?.[0]?.color;
  const defaultColor = isOrg ? DEFAULT_ORG_COLOR : DEFAULT_CONTACT_COLOR;
  const bgColor = firstTagColor || defaultColor;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left flex items-center gap-4 px-4 py-3 border-b border-hairline transition-colors hover:bg-[hsl(var(--brand-orange))]/8 cursor-pointer"
    >
      {/* Avatar - icon with colored ring */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white ring-2 ${
          isOrg ? "ring-[hsl(var(--brand-blue))]" : "ring-[hsl(var(--brand-orange))]"
        }`}
        style={{ backgroundColor: bgColor }}
      >
        {isOrg ? (
          <Building2 className="w-4 h-4" />
        ) : (
          <User className="w-4 h-4" />
        )}
      </div>

      {/* Dynamic columns */}
      {visibleColumns.map((col) => (
        <div
          key={col.key}
          className={`min-w-0 ${COLUMN_WIDTHS[col.key] || "w-32"}`}
        >
          <CellValue row={row} colKey={col.key} />
        </div>
      ))}

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-secondary/50 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

export function ContactListView({
  rows,
  loading,
  error,
  onRowClick,
  visibleColumns,
}: ContactListViewProps) {
  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-secondary">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-sm text-red-600">
        Error: {error}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-secondary">
        No entries found.
      </div>
    );
  }

  return (
    <div className="divide-y divide-hairline">
      {/* Header row */}
      <div className="flex items-center gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-secondary bg-surface-2">
        <div className="w-8" /> {/* Avatar spacer */}
        {visibleColumns.map((col) => (
          <div
            key={col.key}
            className={`min-w-0 ${COLUMN_WIDTHS[col.key] || "w-32"}`}
          >
            {col.label}
          </div>
        ))}
        <div className="w-4" /> {/* Chevron spacer */}
      </div>

      {/* Rows */}
      {rows.map((row) => (
        <ContactListRow
          key={`${row.kind}-${row.partyId}`}
          row={row}
          onClick={() => onRowClick?.(row)}
          visibleColumns={visibleColumns}
        />
      ))}
    </div>
  );
}
