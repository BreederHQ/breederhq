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
 * Offspring Row Component
 * ──────────────────────────────────────────────────────────────────────────── */

interface OffspringRowProps {
  placement: OffspringPlacementDTO;
  onClick: () => void;
}

function OffspringRow({ placement, onClick }: OffspringRowProps) {
  const offspringName = placement.offspring?.name || "Pending assignment";
  const sex = placement.offspring?.sex || "—";
  const breed = placement.breed || "—";
  const birthDate = placement.birthDate
    ? new Date(placement.birthDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  // Build parent context string
  let parentContext = "";
  if (placement.dam && placement.sire) {
    parentContext = `${placement.dam.name} × ${placement.sire.name}`;
  } else if (placement.dam) {
    parentContext = `Dam: ${placement.dam.name}`;
  } else if (placement.sire) {
    parentContext = `Sire: ${placement.sire.name}`;
  }

  // Group context
  const groupContext = placement.offspringGroupLabel || placement.offspringGroupCode;

  return (
    <div
      onClick={onClick}
      style={{
        padding: "var(--portal-space-4)",
        borderBottom: "1px solid var(--portal-border-subtle)",
        cursor: "pointer",
        transition: "background-color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--portal-bg-elevated)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--portal-space-3)" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "var(--portal-font-size-base)",
              fontWeight: "var(--portal-font-weight-semibold)",
              color: "var(--portal-text-primary)",
              marginBottom: "var(--portal-space-1)",
            }}
          >
            {offspringName}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--portal-space-2)",
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-secondary)",
            }}
          >
            <span>{sex}</span>
            <span>•</span>
            <span>{breed}</span>
            <span>•</span>
            <span>Born {birthDate}</span>
          </div>
          {parentContext && (
            <div
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-tertiary)",
                marginTop: "var(--portal-space-1)",
              }}
            >
              {parentContext}
            </div>
          )}
          {groupContext && (
            <div
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-tertiary)",
                marginTop: "2px",
              }}
            >
              Group: {groupContext}
            </div>
          )}
        </div>
        <div
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-accent)",
            flexShrink: 0,
          }}
        >
          View →
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Loading State
 * ──────────────────────────────────────────────────────────────────────────── */

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            height: "100px",
            background: "var(--portal-bg-elevated)",
            borderRadius: "var(--portal-radius-lg)",
          }}
        />
      ))}
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

        <div
          style={{
            border: "1px solid var(--portal-border-subtle)",
            borderRadius: "var(--portal-radius-lg)",
            overflow: "hidden",
          }}
        >
          {placements.map((placement) => (
            <OffspringRow
              key={placement.id}
              placement={placement}
              onClick={() => handleOffspringClick(placement.id)}
            />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
