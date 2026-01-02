// apps/portal/src/components/SubjectHeader.tsx
// Reusable species-aware subject header for portal pages
// Shows name, species/breed, and optional status with minimal accent styling
import * as React from "react";
import { getSpeciesAccent } from "../ui/speciesTokens";

/* ────────────────────────────────────────────────────────────────────────────
 * Status Badge - Flat, subtle pill with optional species dot
 * ──────────────────────────────────────────────────────────────────────────── */

export type StatusVariant = "action" | "success" | "warning" | "error" | "neutral";

interface StatusBadgeProps {
  label: string;
  variant: StatusVariant;
  speciesAccent?: string;
}

const statusColors: Record<StatusVariant, { bg: string; color: string }> = {
  action: { bg: "var(--portal-accent-muted)", color: "var(--portal-accent)" },
  success: { bg: "var(--portal-success-soft)", color: "var(--portal-success)" },
  warning: { bg: "var(--portal-warning-soft)", color: "var(--portal-warning)" },
  error: { bg: "var(--portal-error-soft)", color: "var(--portal-error)" },
  neutral: { bg: "var(--portal-bg-elevated)", color: "var(--portal-text-secondary)" },
};

export function StatusBadge({ label, variant, speciesAccent }: StatusBadgeProps) {
  const colors = statusColors[variant] || statusColors.neutral;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "2px 8px",
        background: colors.bg,
        borderRadius: "var(--portal-radius-full)",
        fontSize: "var(--portal-font-size-xs)",
        fontWeight: "var(--portal-font-weight-semibold)",
        color: colors.color,
        textTransform: "uppercase",
        letterSpacing: "0.02em",
      }}
    >
      {speciesAccent && (
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: speciesAccent,
            flexShrink: 0,
          }}
        />
      )}
      {label}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * SubjectHeader - Main component
 * ──────────────────────────────────────────────────────────────────────────── */

export interface SubjectHeaderProps {
  /** Subject name (e.g., offspring name) */
  name: string;
  /** Species type - used for accent color */
  species?: string | null;
  /** Breed - shown alongside species */
  breed?: string | null;
  /** Status label (e.g., "Reserved", "Placed") */
  statusLabel?: string;
  /** Status variant for coloring */
  statusVariant?: StatusVariant;
  /** Right-side action slot (e.g., button, link) */
  action?: React.ReactNode;
  /** Size variant */
  size?: "default" | "compact";
}

export function SubjectHeader({
  name,
  species,
  breed,
  statusLabel,
  statusVariant = "neutral",
  action,
  size = "default",
}: SubjectHeaderProps) {
  const accent = getSpeciesAccent(species);

  // Build species line: "Species · Breed" or just "Species" or null
  const speciesLine = species
    ? breed
      ? `${species} · ${breed}`
      : species
    : null;

  const isCompact = size === "compact";

  return (
    <div
      style={{
        background: "var(--portal-bg-card)",
        border: "1px solid var(--portal-border-subtle)",
        borderLeft: `3px solid ${accent}`,
        borderRadius: "var(--portal-radius-lg)",
        padding: isCompact ? "var(--portal-space-3)" : "var(--portal-space-4)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--portal-space-3)",
          flexWrap: "wrap",
        }}
      >
        {/* Left: Name + Species + Status */}
        <div style={{ minWidth: 0, flex: "1 1 auto" }}>
          <div
            style={{
              fontSize: isCompact ? "var(--portal-font-size-base)" : "var(--portal-font-size-lg)",
              fontWeight: "var(--portal-font-weight-semibold)",
              color: "var(--portal-text-primary)",
              marginBottom: speciesLine || statusLabel ? "2px" : 0,
            }}
          >
            {name}
          </div>
          {speciesLine && (
            <div
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-tertiary)",
                marginBottom: statusLabel ? "var(--portal-space-2)" : 0,
              }}
            >
              {speciesLine}
            </div>
          )}
          {statusLabel && (
            <StatusBadge
              label={statusLabel}
              variant={statusVariant}
              speciesAccent={accent}
            />
          )}
        </div>

        {/* Right: Action slot */}
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
    </div>
  );
}

export default SubjectHeader;
