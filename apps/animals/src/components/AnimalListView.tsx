// apps/animals/src/components/AnimalListView.tsx
// List view for animals - cleaner row-based UI

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { Tooltip, TagChip } from "@bhq/ui";
import { VaccinationAlertBadge } from "@bhq/ui/components/VaccinationTracker";
import type { VaccinationAlertState } from "@bhq/ui/components/VaccinationTracker";
import { CycleAlertBadge } from "./CycleAnalysis";

type CycleAlertState = { daysUntilCycle: number; needsAttention: boolean; isOverdue: boolean };

type ColumnDef = { key: string; label: string };

type AnimalRow = {
  id: number;
  name: string;
  nickname?: string | null;
  species?: string | null;
  breed?: string | null;
  sex?: string | null;
  status?: string | null;
  ownerName?: string | null;
  photoUrl?: string | null;
  tags: string[];
  tagObjects?: Array<{ id: number; name: string; color?: string | null }>;
  titlePrefix?: string | null;
  titleSuffix?: string | null;
  microchip?: string | null;
  dob?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  _count?: {
    titles?: number;
    competitionEntries?: number;
  };
};

type AnimalListViewProps = {
  rows: AnimalRow[];
  loading: boolean;
  error: string | null;
  onRowClick?: (row: AnimalRow) => void;
  visibleColumns: ColumnDef[];
  vaccinationAlerts?: Record<number, VaccinationAlertState>;
  cycleAlerts?: Record<number, CycleAlertState>;
};

// Status colors
const STATUS_COLORS: Record<string, string> = {
  Active: "hsl(142, 70%, 45%)",
  Breeding: "hsl(270, 60%, 55%)",
  Unavailable: "hsl(25, 95%, 53%)",
  Retired: "hsl(210, 70%, 50%)",
  Deceased: "hsl(0, 0%, 50%)",
  Prospect: "hsl(195, 70%, 50%)",
};

// Default avatar color
const DEFAULT_AVATAR_COLOR = "#a8a29e";

// Species emoji helper
function speciesEmoji(species?: string | null): string {
  const s = (species || "").toLowerCase();
  if (s === "dog") return "🐶";
  if (s === "cat") return "🐱";
  if (s === "horse") return "🐴";
  if (s === "goat") return "🐐";
  if (s === "sheep") return "🐑";
  if (s === "rabbit") return "🐰";
  return "🐾";
}

// Column width configuration - pixel widths for grid
const COLUMN_WIDTHS_PX: Record<string, number> = {
  name: 180,
  species: 80,
  breed: 200,
  sex: 48,
  status: 100,
  ownerName: 128,
  microchip: 128,
  tags: 140,
  dob: 96,
  created_at: 96,
  updated_at: 96,
};

// Get grid template for visible columns
function getGridTemplate(columns: { key: string }[]): string {
  // Avatar (32px) + columns + chevron (auto to absorb extra space)
  const colWidths = columns.map((c) => {
    const width = COLUMN_WIDTHS_PX[c.key] || 112;
    return `${width}px`;
  }).join(" ");
  return `32px ${colWidths} auto`;
}

// Format date helper
function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleDateString();
}

// Sex indicator
function SexIndicator({ sex }: { sex?: string | null }) {
  const sexLower = (sex || "").toLowerCase();
  if (sexLower.startsWith("f")) return <span className="text-pink-400">♀</span>;
  if (sexLower.startsWith("m")) return <span className="text-blue-400">♂</span>;
  return <span className="text-secondary">-</span>;
}

function CellValue({ row, colKey, vaccinationAlert, cycleAlert }: { row: AnimalRow; colKey: string; vaccinationAlert?: VaccinationAlertState; cycleAlert?: CycleAlertState }) {
  const value = (row as any)[colKey];

  switch (colKey) {
    case "name":
      const hasTitles = row.titlePrefix || row.titleSuffix;
      return (
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <span className="font-medium text-primary truncate min-w-0">{value || "-"}</span>
          {hasTitles && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-[hsl(var(--brand-orange))] bg-[hsl(var(--brand-orange))]/10 shrink-0">
              🏆
            </span>
          )}
          {cycleAlert?.needsAttention && (
            <CycleAlertBadge
              daysUntilExpected={cycleAlert.daysUntilCycle}
              species={row.species || ""}
              size="sm"
            />
          )}
          {vaccinationAlert?.hasIssues && (
            <VaccinationAlertBadge
              expiredCount={vaccinationAlert.expiredCount}
              dueSoonCount={vaccinationAlert.dueSoonCount}
              size="sm"
            />
          )}
        </div>
      );

    case "species":
      return <span className="text-sm text-secondary">{value || "-"}</span>;

    case "breed":
      return <span className="text-sm text-secondary truncate">{value || "-"}</span>;

    case "sex":
      return <SexIndicator sex={value} />;

    case "status":
      const statusColor = STATUS_COLORS[value || "Active"] || STATUS_COLORS.Active;
      return value ? (
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${statusColor}20`,
            color: statusColor,
          }}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${value === "Breeding" ? "animate-pulse" : ""}`}
            style={{ backgroundColor: statusColor }}
          />
          {value}
        </span>
      ) : (
        <span className="text-sm text-secondary/50">-</span>
      );

    case "ownerName":
      return <span className="text-sm text-secondary truncate">{value || "-"}</span>;

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

    case "dob":
    case "created_at":
    case "updated_at":
      return <span className="text-sm text-secondary">{formatDate(value)}</span>;

    case "microchip":
      return <span className="text-sm text-secondary font-mono truncate">{value || "-"}</span>;

    default:
      if (Array.isArray(value)) {
        return <span className="text-sm text-secondary truncate">{value.join(", ") || "-"}</span>;
      }
      return <span className="text-sm text-secondary truncate">{value || "-"}</span>;
  }
}

// Sex-based ring colors
const SEX_RING_COLORS = {
  female: "rgb(244, 114, 182)", // pink-400
  male: "rgb(96, 165, 250)",    // blue-400
  unknown: "rgb(156, 163, 175)", // gray-400
};

function getSexRingColor(sex?: string | null): string {
  const s = (sex || "").toLowerCase();
  if (s.startsWith("f")) return SEX_RING_COLORS.female;
  if (s.startsWith("m")) return SEX_RING_COLORS.male;
  return SEX_RING_COLORS.unknown;
}

function AnimalListRow({
  row,
  onClick,
  visibleColumns,
  vaccinationAlert,
  cycleAlert,
}: {
  row: AnimalRow;
  onClick?: () => void;
  visibleColumns: ColumnDef[];
  vaccinationAlert?: VaccinationAlertState;
  cycleAlert?: CycleAlertState;
}) {
  // Use first tag color for background if available, otherwise use default (same as contacts)
  const firstTagColor = row.tagObjects?.[0]?.color;
  const bgColor = firstTagColor || DEFAULT_AVATAR_COLOR;

  // Ring color based on sex
  const ringColor = getSexRingColor(row.sex);

  const gridTemplate = getGridTemplate(visibleColumns);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left grid items-center gap-3 px-4 py-3 transition-colors hover:bg-[hsl(var(--brand-orange))]/8 cursor-pointer"
      style={{ gridTemplateColumns: gridTemplate }}
    >
      {/* Avatar - photo or species emoji with sex-colored ring */}
      {row.photoUrl ? (
        <img
          src={row.photoUrl}
          alt={row.name}
          className="w-8 h-8 rounded-full object-cover ring-2"
          style={{ ["--tw-ring-color" as any]: ringColor }}
        />
      ) : (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-base ring-2"
          style={{ backgroundColor: bgColor, ["--tw-ring-color" as any]: ringColor }}
        >
          {speciesEmoji(row.species)}
        </div>
      )}

      {/* Dynamic columns */}
      {visibleColumns.map((col) => (
        <div
          key={col.key}
          className="overflow-hidden"
        >
          <CellValue row={row} colKey={col.key} vaccinationAlert={vaccinationAlert} cycleAlert={cycleAlert} />
        </div>
      ))}

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-secondary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

export function AnimalListView({
  rows,
  loading,
  error,
  onRowClick,
  visibleColumns,
  vaccinationAlerts,
  cycleAlerts,
}: AnimalListViewProps) {
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
        No animals to display yet.
      </div>
    );
  }

  const gridTemplate = getGridTemplate(visibleColumns);

  return (
    <div className="overflow-x-auto">
      {/* Header row - uses same grid as data rows */}
      <div
        className="grid items-center gap-3 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-secondary bg-surface-2"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        <div /> {/* Avatar spacer */}
        {visibleColumns.map((col) => (
          <div key={col.key}>
            {col.label}
          </div>
        ))}
        <div /> {/* Chevron spacer */}
      </div>

      {/* Rows */}
      {rows.map((row) => (
        <AnimalListRow
          key={row.id}
          row={row}
          onClick={() => onRowClick?.(row)}
          visibleColumns={visibleColumns}
          vaccinationAlert={vaccinationAlerts?.[row.id]}
          cycleAlert={cycleAlerts?.[row.id]}
        />
      ))}
    </div>
  );
}
