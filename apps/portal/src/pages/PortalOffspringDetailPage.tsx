// apps/portal/src/pages/PortalOffspringDetailPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { makeApi } from "@bhq/api";
import type { OffspringDetailDTO } from "@bhq/api";
import { isPortalMockEnabled } from "../dev/mockFlag";
import { DemoBanner } from "../dev/DemoBanner";
import { mockOffspringDetail } from "../dev/mockData";

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
}

function StatusBadge({ status }: StatusBadgeProps) {
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

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 1rem",
        background: config.bg,
        borderRadius: "var(--portal-radius-full)",
      }}
    >
      <div
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: config.dot,
          boxShadow: `0 0 10px ${config.dot}`,
        }}
      />
      <span
        style={{
          fontSize: "var(--portal-font-size-sm)",
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
 * Hero Header - Massive name-first presentation
 * ──────────────────────────────────────────────────────────────────────────── */

interface HeroHeaderProps {
  name: string;
  status: "reserved" | "placed" | "pending";
  sex: string;
  breed: string;
  birthDate: string | null;
  parentContext: string;
  onBack: () => void;
}

function HeroHeader({ name, status, sex, breed, birthDate, parentContext, onBack }: HeroHeaderProps) {
  const formattedBirthDate = birthDate
    ? new Date(birthDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div
      style={{
        background: "var(--portal-gradient-hero), var(--portal-bg-card)",
        border: "1px solid var(--portal-border-glow)",
        borderRadius: "var(--portal-radius-2xl)",
        boxShadow: "var(--portal-shadow-hero)",
        padding: "var(--portal-space-6)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative gradient orbs */}
      <div
        style={{
          position: "absolute",
          top: "-60%",
          right: "-20%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(255, 107, 53, 0.12) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-40%",
          left: "-10%",
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "var(--portal-space-1) var(--portal-space-2)",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--portal-border-subtle)",
            borderRadius: "var(--portal-radius-md)",
            color: "var(--portal-text-secondary)",
            fontSize: "var(--portal-font-size-sm)",
            cursor: "pointer",
            marginBottom: "var(--portal-space-4)",
            transition: "background-color 0.15s ease, color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
            e.currentTarget.style.color = "var(--portal-text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
            e.currentTarget.style.color = "var(--portal-text-secondary)";
          }}
        >
          ← Back
        </button>

        {/* Status badge */}
        <div style={{ marginBottom: "var(--portal-space-3)" }}>
          <StatusBadge status={status} />
        </div>

        {/* Name - hero treatment */}
        <h1
          style={{
            fontSize: "var(--portal-font-size-hero)",
            fontWeight: "var(--portal-font-weight-bold)",
            color: "var(--portal-text-primary)",
            margin: 0,
            marginBottom: "var(--portal-space-3)",
            letterSpacing: "var(--portal-letter-spacing-tight)",
            lineHeight: "var(--portal-line-height-tight)",
          }}
        >
          {name}
        </h1>

        {/* Details row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "var(--portal-space-3)",
            fontSize: "var(--portal-font-size-lg)",
            color: "var(--portal-text-secondary)",
          }}
        >
          <span>{sex}</span>
          <span style={{ color: "var(--portal-text-tertiary)" }}>•</span>
          <span>{breed}</span>
          {formattedBirthDate && (
            <>
              <span style={{ color: "var(--portal-text-tertiary)" }}>•</span>
              <span>Born {formattedBirthDate}</span>
            </>
          )}
        </div>

        {/* Parent context */}
        {parentContext && (
          <div
            style={{
              fontSize: "var(--portal-font-size-base)",
              color: "var(--portal-text-tertiary)",
              marginTop: "var(--portal-space-2)",
            }}
          >
            {parentContext}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Journey Timeline - Visual progress through milestones
 * ──────────────────────────────────────────────────────────────────────────── */

interface TimelineStep {
  id: string;
  label: string;
  date: string | null;
  completed: boolean;
  icon: string;
}

interface JourneyTimelineProps {
  steps: TimelineStep[];
}

function JourneyTimeline({ steps }: JourneyTimelineProps) {
  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div
      style={{
        background: "var(--portal-gradient-card), var(--portal-bg-card)",
        border: "1px solid var(--portal-border-subtle)",
        borderRadius: "var(--portal-radius-xl)",
        boxShadow: "var(--portal-shadow-card)",
        padding: "var(--portal-space-5)",
      }}
    >
      {/* Header with progress */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--portal-space-4)" }}>
        <h2
          style={{
            fontSize: "var(--portal-font-size-lg)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            margin: 0,
          }}
        >
          Your Journey
        </h2>
        <div
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-accent)",
            fontWeight: "var(--portal-font-weight-medium)",
          }}
        >
          {progressPercent}% complete
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: "6px",
          background: "var(--portal-bg-elevated)",
          borderRadius: "var(--portal-radius-full)",
          marginBottom: "var(--portal-space-5)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progressPercent}%`,
            height: "100%",
            background: "var(--portal-gradient-status-reserved)",
            borderRadius: "var(--portal-radius-full)",
            transition: "width 0.5s ease",
          }}
        />
      </div>

      {/* Timeline steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-1)" }}>
        {steps.map((step, index) => (
          <div key={step.id} style={{ display: "flex", alignItems: "stretch" }}>
            {/* Left column: icon and line */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "40px",
                flexShrink: 0,
              }}
            >
              {/* Icon circle */}
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: step.completed
                    ? "var(--portal-success)"
                    : "var(--portal-bg-elevated)",
                  border: step.completed
                    ? "none"
                    : "2px solid var(--portal-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: step.completed ? "1rem" : "1.2rem",
                  color: step.completed
                    ? "white"
                    : "var(--portal-text-tertiary)",
                  flexShrink: 0,
                  boxShadow: step.completed
                    ? "0 0 12px rgba(34, 197, 94, 0.4)"
                    : "none",
                }}
              >
                {step.completed ? "✓" : step.icon}
              </div>
              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div
                  style={{
                    width: "2px",
                    flex: 1,
                    minHeight: "24px",
                    background: step.completed
                      ? "var(--portal-success)"
                      : "var(--portal-border-subtle)",
                    marginTop: "4px",
                    marginBottom: "4px",
                  }}
                />
              )}
            </div>

            {/* Right column: content */}
            <div
              style={{
                flex: 1,
                paddingLeft: "var(--portal-space-3)",
                paddingBottom: index < steps.length - 1 ? "var(--portal-space-4)" : 0,
              }}
            >
              <div
                style={{
                  fontSize: "var(--portal-font-size-base)",
                  fontWeight: "var(--portal-font-weight-medium)",
                  color: step.completed
                    ? "var(--portal-text-primary)"
                    : "var(--portal-text-secondary)",
                }}
              >
                {step.label}
              </div>
              {step.date && (
                <div
                  style={{
                    fontSize: "var(--portal-font-size-sm)",
                    color: "var(--portal-text-tertiary)",
                    marginTop: "2px",
                  }}
                >
                  {new Date(step.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Info Card - For displaying grouped information
 * ──────────────────────────────────────────────────────────────────────────── */

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
}

function InfoCard({ title, children }: InfoCardProps) {
  return (
    <div
      style={{
        background: "var(--portal-gradient-card), var(--portal-bg-card)",
        border: "1px solid var(--portal-border-subtle)",
        borderRadius: "var(--portal-radius-xl)",
        boxShadow: "var(--portal-shadow-card)",
        padding: "var(--portal-space-4)",
      }}
    >
      <h3
        style={{
          fontSize: "var(--portal-font-size-base)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          margin: 0,
          marginBottom: "var(--portal-space-3)",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Info Row - Key/value display
 * ──────────────────────────────────────────────────────────────────────────── */

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--portal-space-2) 0" }}>
      <span
        style={{
          fontSize: "var(--portal-font-size-sm)",
          color: "var(--portal-text-secondary)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "var(--portal-font-size-sm)",
          fontWeight: "var(--portal-font-weight-medium)",
          color: "var(--portal-text-primary)",
        }}
      >
        {value}
      </span>
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
          height: "280px",
          background: "var(--portal-bg-elevated)",
          borderRadius: "var(--portal-radius-2xl)",
        }}
      />
      <div
        style={{
          height: "300px",
          background: "var(--portal-bg-elevated)",
          borderRadius: "var(--portal-radius-xl)",
        }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
        Unable to load details
      </div>
      <div
        style={{
          fontSize: "var(--portal-font-size-base)",
          color: "var(--portal-text-secondary)",
        }}
      >
        Something went wrong. Please try again.
      </div>
      <div style={{ display: "flex", gap: "var(--portal-space-2)" }}>
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
          Go back
        </button>
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
  const mockEnabled = isPortalMockEnabled();

  // Extract offspring ID from URL path
  const offspringId = React.useMemo(() => {
    const path = window.location.pathname;
    const match = path.match(/\/portal\/offspring\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }, []);

  const handleBack = () => {
    window.history.pushState(null, "", "/portal/offspring");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleDocumentsClick = () => {
    window.history.pushState(null, "", "/portal/documents");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

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

      // If error and demo mode, use mock data
      if (mockEnabled) {
        setOffspring(mockOffspringDetail(offspringId));
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [offspringId, mockEnabled]);

  React.useEffect(() => {
    fetchOffspring();
  }, [fetchOffspring]);

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
        <ErrorState onRetry={fetchOffspring} onBack={handleBack} />
      </PageContainer>
    );
  }

  // Build parent context
  let parentContext = "";
  if (offspring.dam && offspring.sire) {
    parentContext = `${offspring.dam.name} × ${offspring.sire.name}`;
  } else if (offspring.dam) {
    parentContext = `Dam: ${offspring.dam.name}`;
  } else if (offspring.sire) {
    parentContext = `Sire: ${offspring.sire.name}`;
  }

  // Build timeline steps
  const timelineSteps: TimelineStep[] = [
    {
      id: "reserved",
      label: "Reserved for you",
      date: offspring.createdAt,
      completed: true,
      icon: "🎯",
    },
    {
      id: "contract",
      label: "Contract signed",
      date: offspring.contractSignedAt,
      completed: !!offspring.contractSignedAt,
      icon: "📝",
    },
    {
      id: "paid",
      label: "Paid in full",
      date: offspring.paidInFullAt,
      completed: !!offspring.paidInFullAt,
      icon: "💳",
    },
    {
      id: "pickup",
      label: "Pickup scheduled",
      date: offspring.pickupAt,
      completed: !!offspring.pickupAt,
      icon: "📅",
    },
    {
      id: "home",
      label: "Welcome home!",
      date: offspring.placedAt,
      completed: !!offspring.placedAt,
      icon: "🏠",
    },
  ];

  const status = offspring.placementStatus || "reserved";

  return (
    <PageContainer>
      {mockEnabled && (
        <div style={{ marginBottom: "var(--portal-space-3)" }}>
          <DemoBanner />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
        {/* Hero Header */}
        <HeroHeader
          name={offspring.name || "Your puppy"}
          status={status as "reserved" | "placed" | "pending"}
          sex={offspring.sex || "—"}
          breed={offspring.breed || offspring.species || "—"}
          birthDate={offspring.birthDate}
          parentContext={parentContext}
          onBack={handleBack}
        />

        {/* Journey Timeline */}
        <JourneyTimeline steps={timelineSteps} />

        {/* Info Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "var(--portal-space-3)",
          }}
        >
          {/* Details Card */}
          <InfoCard title="Details">
            <div style={{ display: "flex", flexDirection: "column" }}>
              <InfoRow label="Species" value={offspring.species || "Dog"} />
              <InfoRow label="Breed" value={offspring.breed || "—"} />
              <InfoRow label="Sex" value={offspring.sex || "—"} />
              {offspring.birthDate && (
                <InfoRow
                  label="Birth date"
                  value={new Date(offspring.birthDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                />
              )}
            </div>
          </InfoCard>

          {/* Lineage Card */}
          {(offspring.dam || offspring.sire || offspring.groupName) && (
            <InfoCard title="Lineage">
              <div style={{ display: "flex", flexDirection: "column" }}>
                {offspring.dam && <InfoRow label="Dam" value={offspring.dam.name} />}
                {offspring.sire && <InfoRow label="Sire" value={offspring.sire.name} />}
                {offspring.groupName && <InfoRow label="Litter" value={offspring.groupName} />}
              </div>
            </InfoCard>
          )}

          {/* Documents Card */}
          <InfoCard title="Documents">
            <div>
              <p
                style={{
                  fontSize: "var(--portal-font-size-sm)",
                  color: "var(--portal-text-secondary)",
                  margin: 0,
                  marginBottom: "var(--portal-space-3)",
                }}
              >
                Health records, contracts, and certificates.
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
                  fontWeight: "var(--portal-font-weight-medium)",
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
          </InfoCard>
        </div>
      </div>
    </PageContainer>
  );
}
