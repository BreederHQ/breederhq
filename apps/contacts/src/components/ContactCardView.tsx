// apps/contacts/src/components/ContactCardView.tsx
// Experimental card-based view for contacts

import * as React from "react";
import { Building2, Mail, Phone, MapPin } from "lucide-react";
import type { PartyTableRow } from "../App-Contacts";

// Type accent colors
const TYPE_COLORS = {
  CONTACT: "hsl(210, 70%, 50%)",      // Blue
  ORGANIZATION: "hsl(270, 60%, 55%)", // Purple
} as const;

type ContactCardViewProps = {
  rows: PartyTableRow[];
  loading: boolean;
  error: string | null;
  onRowClick?: (row: PartyTableRow) => void;
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
 * Generate a consistent color from a string (for avatar backgrounds)
 */
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Use orange-ish hues to stay on brand
  const hue = 20 + (Math.abs(hash) % 30); // 20-50 range (orange to amber)
  const saturation = 60 + (Math.abs(hash >> 8) % 20); // 60-80%
  const lightness = 35 + (Math.abs(hash >> 16) % 15); // 35-50%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function ContactCard({ row, onClick }: { row: PartyTableRow; onClick?: () => void }) {
  const isOrg = row.kind === "ORGANIZATION";
  const bgColor = stringToColor(row.displayName);
  const accentColor = TYPE_COLORS[row.kind] || TYPE_COLORS.CONTACT;

  // Build location string from city/state
  const location = [row.city, row.state].filter(Boolean).join(", ");

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full text-left bg-surface border border-hairline rounded-lg p-4 pl-5 overflow-hidden transition-all duration-200 cursor-pointer hover:border-[hsl(var(--foreground)/0.2)] hover:bg-[hsl(var(--foreground)/0.03)] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/15"
    >
      {/* Left accent stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: accentColor }}
      />

      {/* Top row: Avatar + Name */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
          style={{ backgroundColor: bgColor }}
        >
          {isOrg ? (
            <Building2 className="w-5 h-5" />
          ) : (
            getInitials(row.displayName)
          )}
        </div>

        {/* Name + Type badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-primary truncate">
              {row.displayName}
            </span>
          </div>
          <span className="text-xs text-secondary">
            {isOrg ? "Organization" : "Contact"}
          </span>
        </div>
      </div>

      {/* Contact info */}
      <div className="mt-3 space-y-1.5 text-sm">
        {row.email && (
          <div className="flex items-center gap-2 text-secondary truncate">
            <Mail className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
            <span className="truncate">{row.email}</span>
          </div>
        )}
        {row.phone && (
          <div className="flex items-center gap-2 text-secondary truncate">
            <Phone className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
            <span className="truncate">{row.phone}</span>
          </div>
        )}
        {location && (
          <div className="flex items-center gap-2 text-secondary truncate">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
            <span className="truncate">{location}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {row.tags && row.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {row.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[hsl(var(--muted))] text-secondary"
            >
              {tag}
            </span>
          ))}
          {row.tags.length > 3 && (
            <span className="text-xs text-secondary">+{row.tags.length - 3}</span>
          )}
        </div>
      )}
    </button>
  );
}

export function ContactCardView({ rows, loading, error, onRowClick }: ContactCardViewProps) {
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
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rows.map((row) => (
          <ContactCard
            key={`${row.kind}-${row.partyId}`}
            row={row}
            onClick={() => onRowClick?.(row)}
          />
        ))}
      </div>
    </div>
  );
}
