// apps/offspring/src/components/OffspringCardView.tsx
// Card-based view for offspring (similar to AnimalCardView)

import * as React from "react";
import { DollarSign, FileCheck, Home, Users } from "lucide-react";
import { CollarSwatch } from "./CollarPicker";

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
};

// Placement state colors for left accent stripe
const PLACEMENT_COLORS: Record<string, string> = {
  UNASSIGNED: "hsl(210, 70%, 50%)",     // Blue - available
  OPTION_HOLD: "hsl(45, 90%, 50%)",     // Gold - on hold
  RESERVED: "hsl(25, 95%, 53%)",        // Orange - reserved
  PLACED: "hsl(142, 70%, 45%)",         // Green - placed
  RETURNED: "hsl(330, 70%, 50%)",       // Pink - returned
  TRANSFERRED: "hsl(270, 60%, 55%)",    // Purple - transferred
};

// Life state colors (used as override when deceased)
const LIFE_STATE_COLORS: Record<string, string> = {
  ALIVE: "hsl(142, 70%, 45%)",          // Green
  DECEASED: "hsl(0, 0%, 50%)",          // Gray
};

// Keeper intent badge colors
const KEEPER_INTENT_COLORS: Record<string, string> = {
  KEEP: "hsl(270, 60%, 55%)",           // Purple
  WITHHELD: "hsl(45, 90%, 50%)",        // Gold
  UNDER_EVALUATION: "hsl(195, 70%, 50%)", // Sky blue
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

// Sex indicator component
function SexIndicator({ sex }: { sex?: string | null }) {
  const sexUpper = (sex || "").toUpperCase();
  const isFemale = sexUpper === "FEMALE" || sexUpper.startsWith("F");
  const isMale = sexUpper === "MALE" || sexUpper.startsWith("M");

  if (isFemale) {
    return <span className="text-pink-400 text-lg">♀</span>;
  }
  if (isMale) {
    return <span className="text-blue-400 text-lg">♂</span>;
  }
  return null;
}


// Format date for display
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

// Format money
function formatMoney(cents?: number | null): string {
  if (cents == null) return "";
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(dollars);
}

type OffspringCardViewProps = {
  rows: OffspringRow[];
  loading: boolean;
  error: string | null;
  onRowClick?: (row: OffspringRow) => void;
};

function OffspringCard({ row, onClick }: { row: OffspringRow; onClick?: () => void }) {
  const placementKey = (row.placementState || "UNASSIGNED").toUpperCase();
  const lifeKey = (row.lifeState || "ALIVE").toUpperCase();
  const keeperKey = (row.keeperIntent || "").toUpperCase();

  // Use gray for deceased, otherwise use placement color
  const isDeceased = lifeKey === "DECEASED";
  const accentColor = isDeceased
    ? LIFE_STATE_COLORS.DECEASED
    : PLACEMENT_COLORS[placementKey] || PLACEMENT_COLORS.UNASSIGNED;

  const placementLabel = isDeceased
    ? "Deceased"
    : PLACEMENT_LABELS[placementKey] || placementKey;

  const displayName = row.name || row.placeholderLabel || "Unnamed";
  const dob = formatDate(row.dob);
  const groupLabel = row.groupLabel || row.groupName || row.groupCode;
  const price = formatMoney(row.price);

  // Financial state indicator
  const financialKey = (row.financialState || "").toUpperCase();
  const isPaidInFull = financialKey === "PAID_IN_FULL";
  const hasDeposit = financialKey === "DEPOSIT_PAID" || financialKey === "DEPOSIT_PENDING";

  // Paperwork state
  const paperworkKey = (row.paperworkState || "").toUpperCase();
  const paperworkComplete = paperworkKey === "COMPLETE" || paperworkKey === "SIGNED";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full text-left bg-surface border border-hairline rounded-lg p-4 pl-5 overflow-hidden transition-all duration-200 cursor-pointer hover:border-[hsl(var(--foreground)/0.2)] hover:bg-[hsl(var(--foreground)/0.03)] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/15"
    >
      {/* Left accent stripe - colored by placement/life state */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: accentColor }}
      />

      {/* Top row: Species Emoji + Name + Sex + Collar */}
      <div className="flex items-start gap-3">
        {/* Species Emoji */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center text-2xl">
          {speciesEmoji(row.species)}
        </div>

        {/* Name + Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-primary truncate">
              {displayName}
            </span>
            <SexIndicator sex={row.sex} />
            <CollarSwatch color={row.whelpingCollarColor} />
            {keeperKey === "KEEP" && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-purple-400 bg-purple-400/10">
                KEEPER
              </span>
            )}
          </div>
          <div className="text-xs text-secondary mt-0.5">
            {[row.color, row.breed].filter(Boolean).join(" • ")}
          </div>
          {dob && (
            <div className="text-xs text-secondary">
              Born {dob}
            </div>
          )}
        </div>
      </div>

      {/* Group + Buyer row */}
      <div className="mt-3 flex items-center gap-4 text-xs">
        {groupLabel && (
          <div className="flex items-center gap-1.5 text-secondary">
            <Users className="w-3 h-3" />
            <span className="truncate max-w-[100px]">{groupLabel}</span>
          </div>
        )}
        {row.buyerName && (
          <div className="flex items-center gap-1.5 text-secondary">
            <Home className="w-3 h-3 text-green-400" />
            <span className="truncate max-w-[100px]">{row.buyerName}</span>
          </div>
        )}
      </div>

      {/* Status badge + indicators */}
      <div className="mt-3 flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${accentColor}20`,
            color: accentColor,
          }}
        >
          <span
            className={`w-2 h-2 rounded-full ${placementKey === "RESERVED" || placementKey === "OPTION_HOLD" ? "animate-pulse" : ""}`}
            style={{ backgroundColor: accentColor }}
          />
          {placementLabel}
        </span>

        {/* Right side: Financial + Paperwork indicators */}
        <div className="flex items-center gap-2">
          {price && (
            <span className="text-xs text-secondary">{price}</span>
          )}
          {(isPaidInFull || hasDeposit) && (
            <span title={isPaidInFull ? "Paid in full" : "Deposit received"}>
              <DollarSign
                className={`w-3.5 h-3.5 ${isPaidInFull ? "text-green-400" : "text-amber-400"}`}
              />
            </span>
          )}
          {paperworkComplete && (
            <span title="Paperwork complete">
              <FileCheck className="w-3.5 h-3.5 text-green-400" />
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function OffspringCardView({ rows, loading, error, onRowClick }: OffspringCardViewProps) {
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

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rows.map((row) => (
          <OffspringCard
            key={row.id}
            row={row}
            onClick={() => onRowClick?.(row)}
          />
        ))}
      </div>
    </div>
  );
}
