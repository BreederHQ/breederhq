// apps/portal/src/design/PortalHero.tsx
// Shared hero component for all portal pages
// Provides consistent visual anchor with journey context
import * as React from "react";

/* ────────────────────────────────────────────────────────────────────────────
 * Status Badge - Glowing status indicator
 * ──────────────────────────────────────────────────────────────────────────── */

type StatusType = "reserved" | "placed" | "pending" | "action" | "info" | "success";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

function StatusBadge({ status, label }: StatusBadgeProps) {
  const config: Record<StatusType, { label: string; bg: string; color: string; dot: string }> = {
    reserved: {
      label: label || "Reserved",
      bg: "var(--portal-accent-muted)",
      color: "var(--portal-accent)",
      dot: "var(--portal-accent)",
    },
    placed: {
      label: label || "Home",
      bg: "var(--portal-success-soft)",
      color: "var(--portal-success)",
      dot: "var(--portal-success)",
    },
    pending: {
      label: label || "Pending",
      bg: "var(--portal-warning-soft)",
      color: "var(--portal-warning)",
      dot: "var(--portal-warning)",
    },
    action: {
      label: label || "Action Required",
      bg: "var(--portal-accent-muted)",
      color: "var(--portal-accent)",
      dot: "var(--portal-accent)",
    },
    info: {
      label: label || "Info",
      bg: "var(--portal-info-soft)",
      color: "var(--portal-info)",
      dot: "var(--portal-info)",
    },
    success: {
      label: label || "Complete",
      bg: "var(--portal-success-soft)",
      color: "var(--portal-success)",
      dot: "var(--portal-success)",
    },
  };

  const c = config[status];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.375rem 0.875rem",
        background: c.bg,
        borderRadius: "var(--portal-radius-full)",
      }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: c.dot,
          boxShadow: `0 0 8px ${c.dot}`,
        }}
      />
      <span
        style={{
          fontSize: "var(--portal-font-size-sm)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: c.color,
          textTransform: "uppercase",
          letterSpacing: "var(--portal-letter-spacing-wide)",
        }}
      >
        {c.label}
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Hero Variants
 * ──────────────────────────────────────────────────────────────────────────── */

export type HeroVariant = "journey" | "page" | "compact";

interface BaseHeroProps {
  variant?: HeroVariant;
  children?: React.ReactNode;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Journey Hero - For offspring/dashboard with status and progress
 * ──────────────────────────────────────────────────────────────────────────── */

interface JourneyHeroProps extends BaseHeroProps {
  variant?: "journey";
  animalName: string;
  status: StatusType;
  statusLabel?: string;
  headline: string;
  subtext?: string;
  progress?: number; // 0-100
  onClick?: () => void;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Page Hero - For section pages with title and context
 * ──────────────────────────────────────────────────────────────────────────── */

interface PageHeroProps extends BaseHeroProps {
  variant: "page";
  title: string;
  subtitle?: string;
  status?: StatusType;
  statusLabel?: string;
  animalContext?: string;
  actionCount?: number;
  actionLabel?: string;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Compact Hero - For list pages with minimal footprint
 * ──────────────────────────────────────────────────────────────────────────── */

interface CompactHeroProps extends BaseHeroProps {
  variant: "compact";
  title: string;
  subtitle?: string;
  badge?: { status: StatusType; label: string };
}

export type PortalHeroProps = JourneyHeroProps | PageHeroProps | CompactHeroProps;

/* ────────────────────────────────────────────────────────────────────────────
 * Main Hero Component
 * ──────────────────────────────────────────────────────────────────────────── */

export function PortalHero(props: PortalHeroProps) {
  const variant = props.variant || "journey";

  if (variant === "compact") {
    return <CompactHero {...(props as CompactHeroProps)} />;
  }

  if (variant === "page") {
    return <PageHero {...(props as PageHeroProps)} />;
  }

  return <JourneyHero {...(props as JourneyHeroProps)} />;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Journey Hero Implementation
 * ──────────────────────────────────────────────────────────────────────────── */

function JourneyHero({
  animalName,
  status,
  statusLabel,
  headline,
  subtext,
  progress,
  onClick,
  children,
}: JourneyHeroProps) {
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--portal-gradient-hero), var(--portal-bg-card)",
        border: "1px solid var(--portal-border-glow)",
        borderRadius: "var(--portal-radius-2xl)",
        boxShadow: "var(--portal-shadow-hero)",
        padding: "var(--portal-space-6)",
        position: "relative",
        overflow: "hidden",
        cursor: isClickable ? "pointer" : "default",
        transition: isClickable ? "transform var(--portal-transition), box-shadow var(--portal-transition)" : "none",
      }}
      onMouseEnter={(e) => {
        if (isClickable) {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 12px 48px rgba(0, 0, 0, 0.6), 0 0 80px rgba(255, 107, 53, 0.15)";
        }
      }}
      onMouseLeave={(e) => {
        if (isClickable) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "var(--portal-shadow-hero)";
        }
      }}
    >
      {/* Decorative gradient orbs */}
      <div
        style={{
          position: "absolute",
          top: "-50%",
          right: "-20%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(255, 107, 53, 0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-30%",
          left: "-10%",
          width: "250px",
          height: "250px",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.04) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Status badge */}
        <div style={{ marginBottom: "var(--portal-space-3)" }}>
          <StatusBadge status={status} label={statusLabel} />
        </div>

        {/* Animal name - hero treatment */}
        <h1
          style={{
            fontSize: "var(--portal-font-size-hero)",
            fontWeight: "var(--portal-font-weight-bold)",
            color: "var(--portal-text-primary)",
            margin: 0,
            marginBottom: "var(--portal-space-2)",
            letterSpacing: "var(--portal-letter-spacing-tight)",
            lineHeight: "var(--portal-line-height-tight)",
          }}
        >
          {animalName}
        </h1>

        {/* Headline */}
        <div
          style={{
            fontSize: "var(--portal-font-size-lg)",
            color: "var(--portal-text-secondary)",
            marginBottom: subtext || progress !== undefined ? "var(--portal-space-2)" : 0,
          }}
        >
          {headline}
        </div>

        {/* Subtext */}
        {subtext && (
          <div
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-accent)",
              fontWeight: "var(--portal-font-weight-medium)",
            }}
          >
            {subtext}
          </div>
        )}

        {/* Progress bar */}
        {progress !== undefined && (
          <div style={{ marginTop: "var(--portal-space-4)" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--portal-space-1)",
              }}
            >
              <span
                style={{
                  fontSize: "var(--portal-font-size-xs)",
                  color: "var(--portal-text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "var(--portal-letter-spacing-wide)",
                }}
              >
                Journey Progress
              </span>
              <span
                style={{
                  fontSize: "var(--portal-font-size-sm)",
                  color: "var(--portal-accent)",
                  fontWeight: "var(--portal-font-weight-medium)",
                }}
              >
                {progress}%
              </span>
            </div>
            <div
              style={{
                height: "6px",
                background: "var(--portal-bg-elevated)",
                borderRadius: "var(--portal-radius-full)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "var(--portal-gradient-status-reserved)",
                  borderRadius: "var(--portal-radius-full)",
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>
        )}

        {/* View details prompt for clickable */}
        {isClickable && (
          <div
            style={{
              marginTop: "var(--portal-space-4)",
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-accent)",
              fontWeight: "var(--portal-font-weight-medium)",
            }}
          >
            View journey →
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Page Hero Implementation
 * ──────────────────────────────────────────────────────────────────────────── */

function PageHero({
  title,
  subtitle,
  status,
  statusLabel,
  animalContext,
  actionCount,
  actionLabel,
  children,
}: PageHeroProps) {
  return (
    <div
      style={{
        background: "var(--portal-gradient-card), var(--portal-bg-card)",
        border: "1px solid var(--portal-border-subtle)",
        borderRadius: "var(--portal-radius-xl)",
        boxShadow: "var(--portal-shadow-card)",
        padding: "var(--portal-space-5)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle gradient accent */}
      <div
        style={{
          position: "absolute",
          top: "-40%",
          right: "-15%",
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, rgba(255, 107, 53, 0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Animal context */}
        {animalContext && (
          <div
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-accent)",
              fontWeight: "var(--portal-font-weight-medium)",
              marginBottom: "var(--portal-space-2)",
            }}
          >
            {animalContext}
          </div>
        )}

        {/* Header row with title and optional status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "var(--portal-space-3)",
            marginBottom: subtitle || (actionCount !== undefined) ? "var(--portal-space-2)" : 0,
          }}
        >
          <h1
            style={{
              fontSize: "var(--portal-font-size-2xl)",
              fontWeight: "var(--portal-font-weight-semibold)",
              color: "var(--portal-text-primary)",
              margin: 0,
              letterSpacing: "var(--portal-letter-spacing-tight)",
            }}
          >
            {title}
          </h1>

          {status && <StatusBadge status={status} label={statusLabel} />}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div
            style={{
              fontSize: "var(--portal-font-size-base)",
              color: "var(--portal-text-secondary)",
            }}
          >
            {subtitle}
          </div>
        )}

        {/* Action count highlight */}
        {actionCount !== undefined && actionCount > 0 && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--portal-space-2)",
              marginTop: "var(--portal-space-3)",
              padding: "var(--portal-space-2) var(--portal-space-3)",
              background: "var(--portal-accent-soft)",
              borderRadius: "var(--portal-radius-md)",
            }}
          >
            <span
              style={{
                fontSize: "var(--portal-font-size-xl)",
                fontWeight: "var(--portal-font-weight-bold)",
                color: "var(--portal-accent)",
              }}
            >
              {actionCount}
            </span>
            <span
              style={{
                fontSize: "var(--portal-font-size-sm)",
                color: "var(--portal-text-secondary)",
              }}
            >
              {actionLabel || "need attention"}
            </span>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Compact Hero Implementation
 * ──────────────────────────────────────────────────────────────────────────── */

function CompactHero({ title, subtitle, badge, children }: CompactHeroProps) {
  return (
    <div
      style={{
        background: "var(--portal-bg-elevated)",
        borderRadius: "var(--portal-radius-lg)",
        padding: "var(--portal-space-4)",
        marginBottom: "var(--portal-space-4)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--portal-space-2)",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "var(--portal-font-size-xl)",
              fontWeight: "var(--portal-font-weight-semibold)",
              color: "var(--portal-text-primary)",
              margin: 0,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <div
              style={{
                fontSize: "var(--portal-font-size-sm)",
                color: "var(--portal-text-secondary)",
                marginTop: "var(--portal-space-1)",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {badge && <StatusBadge status={badge.status} label={badge.label} />}
      </div>

      {children}
    </div>
  );
}

export default PortalHero;
