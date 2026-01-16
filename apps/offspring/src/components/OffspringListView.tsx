// apps/offspring/src/components/OffspringListView.tsx
// List view for individual offspring - cleaner row-based UI

import * as React from "react";
import { ChevronRight, DollarSign, FileCheck } from "lucide-react";
import { CollarSwatch } from "./CollarPicker";

type ColumnDef = { key: string; label: string };

type OffspringRow = {
  id: number;
  name: string;
  sex: string | null;
  species: string | null;
  breed: string | null;
  color: string | null;
  dob: string | null;
  placementState: string | null;
  lifeState: string | null;
  keeperIntent: string | null;
  financialState: string | null;
  paperworkState: string | null;
  buyerName: string | null;
  groupLabel: string | null;
  groupName?: string | null;
  groupCode?: string | null;
  price: number | null;
  whelpingCollarColor: string | null;
  placeholderLabel?: string | null;
  microchip?: string | null;
  registrationId?: string | null;
  placementDate?: string | null;
  status?: string | null;
};

type OffspringListViewProps = {
  rows: OffspringRow[];
  loading: boolean;
  error: string | null;
  onRowClick?: (row: OffspringRow) => void;
  visibleColumns: ColumnDef[];
};

// Placement state colors
const PLACEMENT_COLORS: Record<string, string> = {
  UNASSIGNED: "hsl(210, 70%, 50%)",
  OPTION_HOLD: "hsl(45, 90%, 50%)",
  RESERVED: "hsl(25, 95%, 53%)",
  PLACED: "hsl(142, 70%, 45%)",
  RETURNED: "hsl(330, 70%, 50%)",
  TRANSFERRED: "hsl(270, 60%, 55%)",
};

// Life state colors
const LIFE_STATE_COLORS: Record<string, string> = {
  ALIVE: "hsl(142, 70%, 45%)",
  DECEASED: "hsl(0, 0%, 50%)",
};

// Placement labels
const PLACEMENT_LABELS: Record<string, string> = {
  UNASSIGNED: "Available",
  OPTION_HOLD: "On Hold",
  RESERVED: "Reserved",
  PLACED: "Placed",
  RETURNED: "Returned",
  TRANSFERRED: "Transferred",
};

// Keeper intent labels
const KEEPER_LABELS: Record<string, string> = {
  KEEP: "Keeper",
  WITHHELD: "Withheld",
  UNDER_EVALUATION: "Evaluating",
};

// Financial state labels
const FINANCIAL_LABELS: Record<string, string> = {
  NONE: "-",
  DEPOSIT_PENDING: "Deposit Pending",
  DEPOSIT_PAID: "Deposit Paid",
  PAID_IN_FULL: "Paid",
  REFUNDED: "Refunded",
  CHARGEBACK: "Chargeback",
};

// Paperwork state labels
const PAPERWORK_LABELS: Record<string, string> = {
  NONE: "-",
  SENT: "Sent",
  SIGNED: "Signed",
  COMPLETE: "Complete",
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
  sex: 48,
  breed: 140,
  whelpingCollarColor: 64,
  group: 140,
  color: 100,
  buyer: 140,
  status: 100,
  lifeState: 80,
  placementState: 100,
  keeperIntent: 90,
  financialState: 100,
  paperworkState: 90,
  dob: 96,
  placementDate: 96,
  price: 80,
  microchip: 128,
  registrationId: 128,
  diedAt: 96,
  placedAt: 96,
  paidInFullAt: 96,
  contractSignedAt: 96,
  birthWeightOz: 80,
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
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

// Format money helper
function formatMoney(cents?: number | null): string {
  if (cents == null) return "-";
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(dollars);
}

// Sex-based ring colors
const SEX_RING_COLORS = {
  female: "rgb(244, 114, 182)", // pink-400
  male: "rgb(96, 165, 250)",    // blue-400
  unknown: "rgb(156, 163, 175)", // gray-400
};

function getSexRingColor(sex?: string | null): string {
  const s = (sex || "").toUpperCase();
  if (s === "FEMALE" || s.startsWith("F")) return SEX_RING_COLORS.female;
  if (s === "MALE" || s.startsWith("M")) return SEX_RING_COLORS.male;
  return SEX_RING_COLORS.unknown;
}

function CellValue({ row, colKey }: { row: OffspringRow; colKey: string }) {
  const value = (row as any)[colKey];

  switch (colKey) {
    case "name":
      const displayName = row.name || row.placeholderLabel || "Unnamed";
      const keeperKey = (row.keeperIntent || "").toUpperCase();
      return (
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <span className="font-medium text-primary truncate min-w-0">{displayName}</span>
          {keeperKey === "KEEP" && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-purple-400 bg-purple-400/10 shrink-0">
              KEEPER
            </span>
          )}
        </div>
      );

    case "sex":
      const sexUpper = (value || "").toUpperCase();
      if (sexUpper === "FEMALE" || sexUpper.startsWith("F")) {
        return <span className="text-pink-400">♀</span>;
      }
      if (sexUpper === "MALE" || sexUpper.startsWith("M")) {
        return <span className="text-blue-400">♂</span>;
      }
      return <span className="text-secondary">-</span>;

    case "breed":
      return <span className="text-sm text-secondary truncate">{value || "-"}</span>;

    case "whelpingCollarColor":
      return row.whelpingCollarColor ? (
        <CollarSwatch color={row.whelpingCollarColor} />
      ) : (
        <span className="text-sm text-secondary/50">-</span>
      );

    case "group":
      const groupLabel = row.groupLabel || row.groupName || row.groupCode;
      return <span className="text-sm text-secondary truncate">{groupLabel || "-"}</span>;

    case "color":
      return <span className="text-sm text-secondary truncate">{value || "-"}</span>;

    case "buyer":
      return row.buyerName ? (
        <span className="text-sm text-secondary truncate">{row.buyerName}</span>
      ) : (
        <span className="text-sm text-secondary/50">-</span>
      );

    case "placementState":
      const placementKey = (value || "UNASSIGNED").toUpperCase();
      const lifeKey = (row.lifeState || "ALIVE").toUpperCase();
      const isDeceased = lifeKey === "DECEASED";
      const placementColor = isDeceased
        ? LIFE_STATE_COLORS.DECEASED
        : PLACEMENT_COLORS[placementKey] || PLACEMENT_COLORS.UNASSIGNED;
      const placementLabel = isDeceased
        ? "Deceased"
        : PLACEMENT_LABELS[placementKey] || placementKey;
      return (
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${placementColor}20`,
            color: placementColor,
          }}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${["RESERVED", "OPTION_HOLD"].includes(placementKey) && !isDeceased ? "animate-pulse" : ""}`}
            style={{ backgroundColor: placementColor }}
          />
          {placementLabel}
        </span>
      );

    case "lifeState":
      const lifeStateKey = (value || "ALIVE").toUpperCase();
      const lifeColor = LIFE_STATE_COLORS[lifeStateKey] || LIFE_STATE_COLORS.ALIVE;
      return (
        <span className="text-sm" style={{ color: lifeColor }}>
          {lifeStateKey === "DECEASED" ? "Deceased" : "Alive"}
        </span>
      );

    case "keeperIntent":
      const keeper = (value || "").toUpperCase();
      if (!keeper || keeper === "NONE") return <span className="text-sm text-secondary/50">-</span>;
      const keeperLabel = KEEPER_LABELS[keeper] || keeper;
      const keeperColor = keeper === "KEEP" ? "text-purple-400" : "text-secondary";
      return <span className={`text-sm ${keeperColor}`}>{keeperLabel}</span>;

    case "financialState":
      const financialKey = (value || "").toUpperCase();
      if (!financialKey || financialKey === "NONE") return <span className="text-sm text-secondary/50">-</span>;
      const financialLabel = FINANCIAL_LABELS[financialKey] || financialKey;
      const isPaidInFull = financialKey === "PAID_IN_FULL";
      const hasDeposit = financialKey === "DEPOSIT_PAID";
      const financialColor = isPaidInFull ? "text-green-400" : hasDeposit ? "text-amber-400" : "text-secondary";
      return <span className={`text-sm ${financialColor}`}>{financialLabel}</span>;

    case "paperworkState":
      const paperKey = (value || "").toUpperCase();
      if (!paperKey || paperKey === "NONE") return <span className="text-sm text-secondary/50">-</span>;
      const paperLabel = PAPERWORK_LABELS[paperKey] || paperKey;
      const paperComplete = paperKey === "COMPLETE" || paperKey === "SIGNED";
      const paperColor = paperComplete ? "text-green-400" : "text-secondary";
      return <span className={`text-sm ${paperColor}`}>{paperLabel}</span>;

    case "dob":
    case "placementDate":
    case "diedAt":
    case "placedAt":
    case "paidInFullAt":
    case "contractSignedAt":
      return <span className="text-sm text-secondary">{formatDate(value)}</span>;

    case "price":
      return <span className="text-sm text-secondary">{formatMoney(value)}</span>;

    case "birthWeightOz":
      return value ? (
        <span className="text-sm text-secondary">{value} oz</span>
      ) : (
        <span className="text-sm text-secondary/50">-</span>
      );

    case "microchip":
    case "registrationId":
      return <span className="text-sm text-secondary font-mono truncate">{value || "-"}</span>;

    case "status":
      return <span className="text-sm text-secondary">{value || "-"}</span>;

    default:
      if (Array.isArray(value)) {
        return <span className="text-sm text-secondary truncate">{value.join(", ") || "-"}</span>;
      }
      return <span className="text-sm text-secondary truncate">{value || "-"}</span>;
  }
}

function OffspringListRow({
  row,
  onClick,
  visibleColumns,
}: {
  row: OffspringRow;
  onClick?: () => void;
  visibleColumns: ColumnDef[];
}) {
  const ringColor = getSexRingColor(row.sex);
  const gridTemplate = getGridTemplate(visibleColumns);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left grid items-center gap-3 px-4 py-3 border-b border-hairline transition-colors hover:bg-[hsl(var(--brand-orange))]/8 cursor-pointer"
      style={{ gridTemplateColumns: gridTemplate }}
    >
      {/* Avatar - species emoji with sex-colored ring */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-base ring-2"
        style={{ backgroundColor: DEFAULT_AVATAR_COLOR, ["--tw-ring-color" as any]: ringColor }}
      >
        {speciesEmoji(row.species)}
      </div>

      {/* Dynamic columns */}
      {visibleColumns.map((col) => (
        <div
          key={col.key}
          className="overflow-hidden"
        >
          <CellValue row={row} colKey={col.key} />
        </div>
      ))}

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-secondary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

export function OffspringListView({
  rows,
  loading,
  error,
  onRowClick,
  visibleColumns,
}: OffspringListViewProps) {
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
        No offspring to display yet.
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
        <OffspringListRow
          key={row.id}
          row={row}
          onClick={() => onRowClick?.(row)}
          visibleColumns={visibleColumns}
        />
      ))}
    </div>
  );
}
