// apps/portal/src/pages/PortalOffspringDetailPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { makeApi } from "@bhq/api";
import type { OffspringDetailDTO } from "@bhq/api";

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
 * Timeline Event Component
 * ──────────────────────────────────────────────────────────────────────────── */

interface TimelineEventProps {
  label: string;
  date: string | null;
  note?: string;
  isLast?: boolean;
}

function TimelineEvent({ label, date, note, isLast }: TimelineEventProps) {
  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "Not yet";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const hasDate = Boolean(date);

  return (
    <div style={{ display: "flex", gap: "var(--portal-space-3)" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "var(--portal-radius-full)",
            background: hasDate ? "var(--portal-accent)" : "var(--portal-border)",
          }}
        />
        {!isLast && (
          <div
            style={{
              width: "2px",
              flex: 1,
              background: "var(--portal-border-subtle)",
              marginTop: "4px",
              marginBottom: "4px",
              minHeight: "24px",
            }}
          />
        )}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : "var(--portal-space-4)" }}>
        <div
          style={{
            fontSize: "var(--portal-font-size-sm)",
            fontWeight: "var(--portal-font-weight-medium)",
            color: "var(--portal-text-primary)",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: "var(--portal-font-size-xs)",
            color: "var(--portal-text-secondary)",
            marginTop: "2px",
          }}
        >
          {formatDate(date)}
        </div>
        {note && (
          <div
            style={{
              fontSize: "var(--portal-font-size-xs)",
              color: "var(--portal-text-tertiary)",
              marginTop: "4px",
            }}
          >
            {note}
          </div>
        )}
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
      <div
        style={{
          height: "60px",
          background: "var(--portal-bg-elevated)",
          borderRadius: "var(--portal-radius-lg)",
        }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "var(--portal-space-4)",
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: "200px",
              background: "var(--portal-bg-elevated)",
              borderRadius: "var(--portal-radius-lg)",
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
  onBack: () => void;
}

function ErrorState({ onRetry, onBack }: ErrorStateProps) {
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
        This offspring may not exist or you may not have access to view it.
      </div>
      <div style={{ display: "flex", gap: "var(--portal-space-2)" }}>
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
        <button
          onClick={onBack}
          style={{
            padding: "var(--portal-space-2) var(--portal-space-4)",
            background: "transparent",
            color: "var(--portal-text-secondary)",
            border: "1px solid var(--portal-border)",
            borderRadius: "var(--portal-radius-md)",
            fontSize: "var(--portal-font-size-sm)",
            fontWeight: "var(--portal-font-weight-medium)",
            cursor: "pointer",
          }}
        >
          Back to Offspring
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ──────────────────────────────────────────────────────────────────────────── */

export default function PortalOffspringDetailPage() {
  const [offspring, setOffspring] = React.useState<OffspringDetailDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  // Extract offspring ID from URL path
  const offspringId = React.useMemo(() => {
    const path = window.location.pathname;
    const match = path.match(/\/portal\/offspring\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }, []);

  const fetchOffspring = React.useCallback(async () => {
    if (!offspringId) {
      setError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const data = await api.portalData.getOffspringDetail(offspringId);
      setOffspring(data.offspring);
    } catch (err: any) {
      console.error("[PortalOffspringDetailPage] Failed to fetch offspring:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [offspringId]);

  React.useEffect(() => {
    fetchOffspring();
  }, [fetchOffspring]);

  const handleBackClick = () => {
    window.history.pushState(null, "", "/portal/offspring");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleDocumentsClick = () => {
    window.history.pushState(null, "", "/portal/documents");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  function formatDate(date: string | null): string {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  // Error state
  if (error || !offspring) {
    return (
      <PageContainer>
        <ErrorState onRetry={fetchOffspring} onBack={handleBackClick} />
      </PageContainer>
    );
  }

  // Build parent context string
  let parentContext = "";
  if (offspring.dam && offspring.sire) {
    parentContext = `${offspring.dam.name} × ${offspring.sire.name}`;
  } else if (offspring.dam) {
    parentContext = `Dam: ${offspring.dam.name}`;
  } else if (offspring.sire) {
    parentContext = `Sire: ${offspring.sire.name}`;
  }

  const groupContext = offspring.groupName || "—";

  // Detail view
  return (
    <PageContainer>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
        {/* Back button */}
        <button
          onClick={handleBackClick}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-text-secondary)",
            cursor: "pointer",
            alignSelf: "flex-start",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--portal-accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--portal-text-secondary)";
          }}
        >
          ← Back to offspring
        </button>

        {/* Header */}
        <div>
          <h1
            style={{
              fontSize: "var(--portal-font-size-2xl)",
              fontWeight: "var(--portal-font-weight-semibold)",
              color: "var(--portal-text-primary)",
              margin: 0,
              marginBottom: "var(--portal-space-1)",
            }}
          >
            {offspring.name}
          </h1>
          <div
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-secondary)",
            }}
          >
            {offspring.sex || "—"} • {offspring.breed || offspring.species} • Born {formatDate(offspring.birthDate)}
          </div>
        </div>

        {/* Content sections in responsive grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "var(--portal-space-4)",
          }}
        >
          {/* Placement Timeline */}
          <div
            style={{
              background: "var(--portal-bg-elevated)",
              border: "1px solid var(--portal-border-subtle)",
              borderRadius: "var(--portal-radius-lg)",
              padding: "var(--portal-space-4)",
            }}
          >
            <h2
              style={{
                fontSize: "var(--portal-font-size-base)",
                fontWeight: "var(--portal-font-weight-semibold)",
                color: "var(--portal-text-primary)",
                marginBottom: "var(--portal-space-4)",
              }}
            >
              Placement Timeline
            </h2>
            <div>
              <TimelineEvent
                label="Contract Signed"
                date={offspring.contractSignedAt}
                note={offspring.contractSignedAt ? "Agreement complete" : "Pending signature"}
              />
              <TimelineEvent
                label="Paid in Full"
                date={offspring.paidInFullAt}
                note={offspring.paidInFullAt ? "Payment complete" : "Awaiting payment"}
              />
              <TimelineEvent
                label="Pickup"
                date={offspring.pickupAt}
                note={offspring.pickupAt ? "Pickup complete" : "Scheduled pickup"}
              />
              <TimelineEvent
                label="Placed"
                date={offspring.placedAt}
                note={offspring.placedAt ? "Placement complete" : "In progress"}
                isLast
              />
            </div>
          </div>

          {/* Basics */}
          <div
            style={{
              background: "var(--portal-bg-elevated)",
              border: "1px solid var(--portal-border-subtle)",
              borderRadius: "var(--portal-radius-lg)",
              padding: "var(--portal-space-4)",
            }}
          >
            <h2
              style={{
                fontSize: "var(--portal-font-size-base)",
                fontWeight: "var(--portal-font-weight-semibold)",
                color: "var(--portal-text-primary)",
                marginBottom: "var(--portal-space-4)",
              }}
            >
              Basics
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-secondary)" }}>
                  Name
                </span>
                <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-primary)", fontWeight: "var(--portal-font-weight-medium)" }}>
                  {offspring.name}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-secondary)" }}>
                  Sex
                </span>
                <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-primary)", fontWeight: "var(--portal-font-weight-medium)" }}>
                  {offspring.sex || "—"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-secondary)" }}>
                  Breed
                </span>
                <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-primary)", fontWeight: "var(--portal-font-weight-medium)" }}>
                  {offspring.breed || offspring.species}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-secondary)" }}>
                  Birth Date
                </span>
                <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-primary)", fontWeight: "var(--portal-font-weight-medium)" }}>
                  {formatDate(offspring.birthDate)}
                </span>
              </div>
              {parentContext && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-secondary)" }}>
                    Parents
                  </span>
                  <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-primary)", fontWeight: "var(--portal-font-weight-medium)" }}>
                    {parentContext}
                  </span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-secondary)" }}>
                  Group
                </span>
                <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-primary)", fontWeight: "var(--portal-font-weight-medium)" }}>
                  {groupContext}
                </span>
              </div>
            </div>
          </div>

          {/* Documents Preview */}
          <div
            style={{
              background: "var(--portal-bg-elevated)",
              border: "1px solid var(--portal-border-subtle)",
              borderRadius: "var(--portal-radius-lg)",
              padding: "var(--portal-space-4)",
            }}
          >
            <h2
              style={{
                fontSize: "var(--portal-font-size-base)",
                fontWeight: "var(--portal-font-weight-semibold)",
                color: "var(--portal-text-primary)",
                marginBottom: "var(--portal-space-4)",
              }}
            >
              Documents
            </h2>
            <div>
              <p
                style={{
                  fontSize: "var(--portal-font-size-sm)",
                  color: "var(--portal-text-secondary)",
                  margin: 0,
                  marginBottom: "var(--portal-space-3)",
                }}
              >
                No documents shared yet.
              </p>
              <button
                onClick={handleDocumentsClick}
                style={{
                  padding: 0,
                  background: "none",
                  border: "none",
                  fontSize: "var(--portal-font-size-sm)",
                  color: "var(--portal-accent)",
                  cursor: "pointer",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = "underline";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = "none";
                }}
              >
                View all documents →
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
