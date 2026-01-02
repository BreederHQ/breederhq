// apps/portal/src/pages/PortalOffspringPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { PortalEmptyState } from "../design/PortalEmptyState";
import { makeApi } from "@bhq/api";
import type { OffspringPlacementDTO } from "@bhq/api";
import { isPortalMockEnabled } from "../dev/mockFlag";
import { DemoBanner } from "../dev/DemoBanner";
import { mockOffspring } from "../dev/mockData";

// Resolve API base URL
function getApiBase(): string {
  const envBase = (import.meta.env.VITE_API_BASE_URL as string) || "";
  if (envBase.trim()) {
    return envBase.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
  }
  if (import.meta.env.DEV) {
    return "";
  }
  return window.location.origin.replace(/\/+$/, "");
}

const api = makeApi(getApiBase());

/* ────────────────────────────────────────────────────────────────────────────
 * Status Badge Component
 * ──────────────────────────────────────────────────────────────────────────── */

interface StatusBadgeProps {
  status: "reserved" | "placed" | "pending";
  size?: "sm" | "md";
}

function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = {
    reserved: {
      label: "Reserved",
      bg: "var(--portal-accent-muted)",
      color: "var(--portal-accent)",
      dot: "var(--portal-accent)",
    },
    placed: {
      label: "Home",
      bg: "var(--portal-success-soft)",
      color: "var(--portal-success)",
      dot: "var(--portal-success)",
    },
    pending: {
      label: "Pending",
      bg: "var(--portal-warning-soft)",
      color: "var(--portal-warning)",
      dot: "var(--portal-warning)",
    },
  }[status];

  const isSmall = size === "sm";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: isSmall ? "0.375rem" : "0.5rem",
        padding: isSmall ? "0.25rem 0.625rem" : "0.375rem 0.875rem",
        background: config.bg,
        borderRadius: "var(--portal-radius-full)",
      }}
    >
      <div
        style={{
          width: isSmall ? "6px" : "8px",
          height: isSmall ? "6px" : "8px",
          borderRadius: "50%",
          background: config.dot,
          boxShadow: `0 0 6px ${config.dot}`,
        }}
      />
      <span
        style={{
          fontSize: isSmall ? "var(--portal-font-size-xs)" : "var(--portal-font-size-sm)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: config.color,
          textTransform: "uppercase",
          letterSpacing: "var(--portal-letter-spacing-wide)",
        }}
      >
        {config.label}
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Featured Offspring Card - Hero treatment for primary placement
 * ──────────────────────────────────────────────────────────────────────────── */

interface FeaturedOffspringCardProps {
  placement: OffspringPlacementDTO;
  onClick: () => void;
}

function FeaturedOffspringCard({ placement, onClick }: FeaturedOffspringCardProps) {
  const name = placement.offspring?.name || "Your puppy";
  const sex = placement.offspring?.sex || "—";
  const breed = placement.breed || "—";
  const birthDate = placement.birthDate
    ? new Date(placement.birthDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // Parent context
  let parentContext = "";
  if (placement.dam && placement.sire) {
    parentContext = `${placement.dam.name} × ${placement.sire.name}`;
  } else if (placement.dam) {
    parentContext = `Dam: ${placement.dam.name}`;
  } else if (placement.sire) {
    parentContext = `Sire: ${placement.sire.name}`;
  }

  const status = (placement as any).placementStatus || "reserved";

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--portal-gradient-hero), var(--portal-bg-card)",
        border: "1px solid var(--portal-border-glow)",
        borderRadius: "var(--portal-radius-2xl)",
        boxShadow: "var(--portal-shadow-hero)",
        padding: "var(--portal-space-6)",
        cursor: "pointer",
        transition: "transform var(--portal-transition), box-shadow var(--portal-transition)",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 48px rgba(0, 0, 0, 0.6), 0 0 80px rgba(255, 107, 53, 0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--portal-shadow-hero)";
      }}
    >
      {/* Decorative gradient orb */}
      <div
        style={{
          position: "absolute",
          top: "-40%",
          right: "-15%",
          width: "350px",
          height: "350px",
          background: "radial-gradient(circle, rgba(255, 107, 53, 0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Status badge */}
        <div style={{ marginBottom: "var(--portal-space-3)" }}>
          <StatusBadge status={status} />
        </div>

        {/* Name - hero size */}
        <h2
          style={{
            fontSize: "var(--portal-font-size-3xl)",
            fontWeight: "var(--portal-font-weight-bold)",
            color: "var(--portal-text-primary)",
            margin: 0,
            marginBottom: "var(--portal-space-2)",
            letterSpacing: "var(--portal-letter-spacing-tight)",
            lineHeight: "var(--portal-line-height-tight)",
          }}
        >
          {name}
        </h2>

        {/* Details row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "var(--portal-space-3)",
            fontSize: "var(--portal-font-size-base)",
            color: "var(--portal-text-secondary)",
            marginBottom: "var(--portal-space-2)",
          }}
        >
          <span>{sex}</span>
          <span style={{ color: "var(--portal-text-tertiary)" }}>•</span>
          <span>{breed}</span>
          {birthDate && (
            <>
              <span style={{ color: "var(--portal-text-tertiary)" }}>•</span>
              <span>Born {birthDate}</span>
            </>
          )}
        </div>

        {/* Parent context */}
        {parentContext && (
          <div
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-tertiary)",
              marginBottom: "var(--portal-space-3)",
            }}
          >
            {parentContext}
          </div>
        )}

        {/* View details prompt */}
        <div
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-accent)",
            fontWeight: "var(--portal-font-weight-medium)",
          }}
        >
          View journey →
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Offspring Card - Secondary placement cards
 * ──────────────────────────────────────────────────────────────────────────── */

interface OffspringCardProps {
  placement: OffspringPlacementDTO;
  onClick: () => void;
}

function OffspringCard({ placement, onClick }: OffspringCardProps) {
  const name = placement.offspring?.name || "Pending assignment";
  const sex = placement.offspring?.sex || "—";
  const breed = placement.breed || "—";
  const birthDate = placement.birthDate
    ? new Date(placement.birthDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  const status = (placement as any).placementStatus || "reserved";

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--portal-gradient-card), var(--portal-bg-card)",
        border: "1px solid var(--portal-border-subtle)",
        borderRadius: "var(--portal-radius-xl)",
        boxShadow: "var(--portal-shadow-card)",
        padding: "var(--portal-space-4)",
        cursor: "pointer",
        transition: "transform var(--portal-transition), box-shadow var(--portal-transition), border-color var(--portal-transition)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "var(--portal-shadow-lg)";
        e.currentTarget.style.borderColor = "var(--portal-border)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--portal-shadow-card)";
        e.currentTarget.style.borderColor = "var(--portal-border-subtle)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--portal-space-3)" }}>
        <StatusBadge status={status} size="sm" />
      </div>

      <h3
        style={{
          fontSize: "var(--portal-font-size-xl)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          margin: 0,
          marginBottom: "var(--portal-space-2)",
        }}
      >
        {name}
      </h3>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--portal-space-2)",
          fontSize: "var(--portal-font-size-sm)",
          color: "var(--portal-text-secondary)",
          marginBottom: "var(--portal-space-3)",
        }}
      >
        <span>{sex}</span>
        <span style={{ color: "var(--portal-text-tertiary)" }}>•</span>
        <span>{breed}</span>
        <span style={{ color: "var(--portal-text-tertiary)" }}>•</span>
        <span>Born {birthDate}</span>
      </div>

      <div
        style={{
          fontSize: "var(--portal-font-size-sm)",
          color: "var(--portal-accent)",
          fontWeight: "var(--portal-font-weight-medium)",
        }}
      >
        View details →
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Loading State
 * ──────────────────────────────────────────────────────────────────────────── */

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
      {/* Hero skeleton */}
      <div
        style={{
          height: "200px",
          background: "var(--portal-bg-elevated)",
          borderRadius: "var(--portal-radius-2xl)",
        }}
      />
      {/* Card skeletons */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "var(--portal-space-3)",
        }}
      >
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              height: "160px",
              background: "var(--portal-bg-elevated)",
              borderRadius: "var(--portal-radius-xl)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Error State
 * ──────────────────────────────────────────────────────────────────────────── */

interface ErrorStateProps {
  onRetry: () => void;
}

function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: "60vh",
        gap: "var(--portal-space-3)",
      }}
    >
      <div
        style={{
          fontSize: "var(--portal-font-size-xl)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
        }}
      >
        Unable to load offspring
      </div>
      <div
        style={{
          fontSize: "var(--portal-font-size-base)",
          color: "var(--portal-text-secondary)",
        }}
      >
        Something went wrong. Please try again.
      </div>
      <button
        onClick={onRetry}
        style={{
          padding: "var(--portal-space-2) var(--portal-space-4)",
          background: "var(--portal-accent)",
          color: "var(--portal-text-primary)",
          border: "none",
          borderRadius: "var(--portal-radius-md)",
          fontSize: "var(--portal-font-size-sm)",
          fontWeight: "var(--portal-font-weight-medium)",
          cursor: "pointer",
        }}
      >
        Retry
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ──────────────────────────────────────────────────────────────────────────── */

export default function PortalOffspringPage() {
  const [placements, setPlacements] = React.useState<OffspringPlacementDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const mockEnabled = isPortalMockEnabled();

  // Check if we're viewing offspring detail
  const isDetailView = window.location.pathname.match(/\/portal\/offspring\/\d+/);

  // If viewing detail, render detail page
  if (isDetailView) {
    const PortalOffspringDetailPage = React.lazy(() => import("./PortalOffspringDetailPage"));
    return (
      <React.Suspense fallback={<PageContainer><LoadingState /></PageContainer>}>
        <PortalOffspringDetailPage />
      </React.Suspense>
    );
  }

  const fetchPlacements = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.portalData.getOffspringPlacements();
      const fetchedPlacements = data.placements;

      // Use mock data if real data is empty and demo mode enabled
      if (fetchedPlacements.length === 0 && mockEnabled) {
        setPlacements(mockOffspring() as any);
      } else {
        setPlacements(fetchedPlacements);
      }
    } catch (err: any) {
      console.error("[PortalOffspringPage] Failed to fetch placements:", err);

      // If error and demo mode, use mock data
      if (mockEnabled) {
        setPlacements(mockOffspring() as any);
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [mockEnabled]);

  React.useEffect(() => {
    fetchPlacements();
  }, [fetchPlacements]);

  const handleOffspringClick = (placementId: number) => {
    const placement = placements.find((p) => p.id === placementId);
    if (placement?.offspring?.id) {
      window.history.pushState(null, "", `/portal/offspring/${placement.offspring.id}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <PageContainer>
        <ErrorState onRetry={fetchPlacements} />
      </PageContainer>
    );
  }

  // Empty state
  if (placements.length === 0) {
    return (
      <PageContainer>
        <PortalEmptyState
          title="No offspring yet"
          body="When your placement is confirmed, details will appear here."
        />
      </PageContainer>
    );
  }

  // Split placements: first one is featured, rest are secondary
  const [featured, ...others] = placements;

  // List view
  return (
    <PageContainer>
      {mockEnabled && (
        <div style={{ marginBottom: "var(--portal-space-3)" }}>
          <DemoBanner />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
        <h1
          style={{
            fontSize: "var(--portal-font-size-2xl)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            margin: 0,
          }}
        >
          My Offspring
        </h1>

        {/* Featured Card */}
        <FeaturedOffspringCard
          placement={featured}
          onClick={() => handleOffspringClick(featured.id)}
        />

        {/* Other offspring in grid */}
        {others.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "var(--portal-space-3)",
            }}
          >
            {others.map((placement) => (
              <OffspringCard
                key={placement.id}
                placement={placement}
                onClick={() => handleOffspringClick(placement.id)}
              />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
