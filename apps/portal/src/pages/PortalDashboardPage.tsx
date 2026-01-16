// apps/portal/src/pages/PortalDashboardPage.tsx
// Premium Dashboard - Relationship-first, proactive transparency
import * as React from "react";
import { PageScaffold } from "../design/PageScaffold";
import { Button } from "../design/Button";
import { usePortalContext } from "../hooks/usePortalContext";
import { getSpeciesAccent } from "../ui/speciesTokens";
import { createPortalFetch, useTenantContext } from "../derived/tenantContext";
import { isDemoMode, generateDemoData, type DemoActivityEvent } from "../demo/portalDemoData";

/* ────────────────────────────────────────────────────────────────────────────
 * Utilities
 * ──────────────────────────────────────────────────────────────────────────── */

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDaysUntil(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Animal Status Card Hero - Large photo carousel with recent update
 * ──────────────────────────────────────────────────────────────────────────── */

interface AnimalStatusCardProps {
  name: string;
  species: string;
  breed: string;
  status: string;
  lastUpdate: {
    text: string;
    timestamp: string;
  } | null;
  photos: string[];
  onNavigate: (path: string) => void;
}

function AnimalStatusCard({
  name,
  species,
  breed,
  status,
  lastUpdate,
  photos,
  onNavigate,
}: AnimalStatusCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = React.useState(0);
  const accent = getSpeciesAccent(species);

  // Auto-advance photos every 5 seconds
  React.useEffect(() => {
    if (photos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [photos.length]);

  const handlePrevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  return (
    <div
      style={{
        background: "var(--portal-bg-card)",
        border: "1px solid var(--portal-border-subtle)",
        borderRadius: "var(--portal-radius-lg)",
        overflow: "hidden",
      }}
    >
      {/* Photo Carousel */}
      {photos.length > 0 && (
        <div style={{ position: "relative", width: "100%", height: "300px", background: "#000" }}>
          <img
            src={photos[currentPhotoIndex]}
            alt={`${name} - photo ${currentPhotoIndex + 1}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          {/* Photo navigation */}
          {photos.length > 1 && (
            <>
              <button
                onClick={handlePrevPhoto}
                style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(0, 0, 0, 0.6)",
                  border: "none",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  color: "white",
                  fontSize: "20px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0, 0, 0, 0.8)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)";
                }}
              >
                ‹
              </button>
              <button
                onClick={handleNextPhoto}
                style={{
                  position: "absolute",
                  right: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(0, 0, 0, 0.6)",
                  border: "none",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  color: "white",
                  fontSize: "20px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0, 0, 0, 0.8)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)";
                }}
              >
                ›
              </button>

              {/* Photo indicators */}
              <div
                style={{
                  position: "absolute",
                  bottom: "16px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: "8px",
                }}
              >
                {photos.map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: idx === currentPhotoIndex ? "white" : "rgba(255, 255, 255, 0.5)",
                      transition: "background 0.2s",
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "var(--portal-space-4)" }}>
        {/* Header */}
        <div style={{ marginBottom: "var(--portal-space-3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--portal-space-2)", marginBottom: "4px" }}>
            <h2
              style={{
                fontSize: "var(--portal-font-size-xl)",
                fontWeight: "var(--portal-font-weight-bold)",
                color: "var(--portal-text-primary)",
                margin: 0,
              }}
            >
              {name}
            </h2>
            <span
              style={{
                display: "inline-block",
                padding: "4px 12px",
                background: `${accent}15`,
                color: accent,
                fontSize: "var(--portal-font-size-xs)",
                fontWeight: "var(--portal-font-weight-semibold)",
                borderRadius: "var(--portal-radius-full)",
                textTransform: "capitalize",
              }}
            >
              {status}
            </span>
          </div>
          <div
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-tertiary)",
            }}
          >
            {breed} · {species.charAt(0).toUpperCase() + species.slice(1)}
          </div>
        </div>

        {/* Last Update */}
        {lastUpdate && (
          <div
            style={{
              padding: "var(--portal-space-3)",
              background: "var(--portal-bg-elevated)",
              borderRadius: "var(--portal-radius-md)",
              marginBottom: "var(--portal-space-3)",
            }}
          >
            <div
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-tertiary)",
                marginBottom: "var(--portal-space-2)",
              }}
            >
              Last Update: {formatRelativeTime(lastUpdate.timestamp)}
            </div>
            <div
              style={{
                fontSize: "var(--portal-font-size-sm)",
                color: "var(--portal-text-secondary)",
                lineHeight: "1.5",
              }}
            >
              {lastUpdate.text}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "var(--portal-space-2)", flexWrap: "wrap" }}>
          <Button variant="primary" onClick={() => onNavigate("/offspring")}>
            View Full Updates
          </Button>
          <Button variant="secondary" onClick={() => onNavigate("/messages")}>
            Message About {name}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Action Required Section - Prominent urgent actions
 * ──────────────────────────────────────────────────────────────────────────── */

interface ActionRequiredProps {
  overdueAmount: number;
  nextPaymentAmount: number;
  nextPaymentDueAt: string | null;
  pendingAgreements: number;
  onNavigate: (path: string) => void;
}

function ActionRequiredSection({
  overdueAmount,
  nextPaymentAmount,
  nextPaymentDueAt,
  pendingAgreements,
  onNavigate,
}: ActionRequiredProps) {
  const hasOverdue = overdueAmount > 0;
  const hasDue = nextPaymentAmount > 0 && nextPaymentDueAt;
  const hasAgreements = pendingAgreements > 0;

  if (!hasOverdue && !hasDue && !hasAgreements) {
    return null;
  }

  return (
    <div>
      <h3
        style={{
          fontSize: "var(--portal-font-size-lg)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          margin: 0,
          marginBottom: "var(--portal-space-3)",
          display: "flex",
          alignItems: "center",
          gap: "var(--portal-space-2)",
        }}
      >
        <span style={{ fontSize: "20px" }}>⚠️</span>
        Action Required
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-2)" }}>
        {/* Overdue payment */}
        {hasOverdue && (
          <div
            style={{
              padding: "var(--portal-space-4)",
              background: "var(--portal-bg-card)",
              border: "2px solid rgba(239, 68, 68, 0.4)",
              borderRadius: "var(--portal-radius-lg)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--portal-space-3)" }}>
              <div>
                <div
                  style={{
                    fontSize: "var(--portal-font-size-lg)",
                    fontWeight: "var(--portal-font-weight-semibold)",
                    color: "var(--portal-error)",
                    marginBottom: "4px",
                  }}
                >
                  💰 Payment Overdue
                </div>
                <div
                  style={{
                    fontSize: "var(--portal-font-size-sm)",
                    color: "var(--portal-text-secondary)",
                  }}
                >
                  {formatCurrency(overdueAmount)} overdue
                </div>
              </div>
              <div style={{ display: "flex", gap: "var(--portal-space-2)" }}>
                <Button variant="primary" onClick={() => onNavigate("/financials")}>
                  Pay Now
                </Button>
                <Button variant="secondary" onClick={() => onNavigate("/financials")}>
                  View Invoice
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Due payment */}
        {hasDue && !hasOverdue && nextPaymentDueAt && (
          <div
            style={{
              padding: "var(--portal-space-4)",
              background: "var(--portal-bg-card)",
              border: "1px solid var(--portal-border-subtle)",
              borderRadius: "var(--portal-radius-lg)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--portal-space-3)" }}>
              <div>
                <div
                  style={{
                    fontSize: "var(--portal-font-size-lg)",
                    fontWeight: "var(--portal-font-weight-semibold)",
                    color: "var(--portal-text-primary)",
                    marginBottom: "4px",
                  }}
                >
                  💰 Payment Due
                </div>
                <div
                  style={{
                    fontSize: "var(--portal-font-size-sm)",
                    color: "var(--portal-text-secondary)",
                  }}
                >
                  {formatCurrency(nextPaymentAmount)} due in {getDaysUntil(nextPaymentDueAt)} days
                </div>
              </div>
              <div style={{ display: "flex", gap: "var(--portal-space-2)" }}>
                <Button variant="primary" onClick={() => onNavigate("/financials")}>
                  Pay Now
                </Button>
                <Button variant="secondary" onClick={() => onNavigate("/financials")}>
                  View Invoice
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Pending agreements */}
        {hasAgreements && (
          <div
            style={{
              padding: "var(--portal-space-4)",
              background: "var(--portal-bg-card)",
              border: "1px solid var(--portal-border-subtle)",
              borderRadius: "var(--portal-radius-lg)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--portal-space-3)" }}>
              <div>
                <div
                  style={{
                    fontSize: "var(--portal-font-size-lg)",
                    fontWeight: "var(--portal-font-weight-semibold)",
                    color: "var(--portal-text-primary)",
                    marginBottom: "4px",
                  }}
                >
                  ✍️ Agreement Pending Signature
                </div>
                <div
                  style={{
                    fontSize: "var(--portal-font-size-sm)",
                    color: "var(--portal-text-secondary)",
                  }}
                >
                  {pendingAgreements} agreement{pendingAgreements > 1 ? "s" : ""} waiting for your signature
                </div>
              </div>
              <Button variant="primary" onClick={() => onNavigate("/agreements")}>
                Sign Agreement
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Activity Timeline - Recent activity feed
 * ──────────────────────────────────────────────────────────────────────────── */

interface ActivityTimelineProps {
  events: DemoActivityEvent[];
  onNavigate: (path: string) => void;
}

function ActivityTimeline({ events, onNavigate }: ActivityTimelineProps) {
  if (events.length === 0) return null;

  const getEventIcon = (type: string) => {
    switch (type) {
      case "message": return "💬";
      case "document": return "📄";
      case "payment": return "💰";
      case "update": return "📝";
      case "agreement": return "✍️";
      default: return "•";
    }
  };

  return (
    <div>
      <h3
        style={{
          fontSize: "var(--portal-font-size-lg)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          margin: 0,
          marginBottom: "var(--portal-space-3)",
          display: "flex",
          alignItems: "center",
          gap: "var(--portal-space-2)",
        }}
      >
        <span style={{ fontSize: "20px" }}>📬</span>
        Recent Activity
      </h3>

      <div
        style={{
          background: "var(--portal-bg-card)",
          border: "1px solid var(--portal-border-subtle)",
          borderRadius: "var(--portal-radius-lg)",
          padding: "var(--portal-space-4)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => event.relatedPath && onNavigate(event.relatedPath)}
              style={{
                all: "unset",
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--portal-space-3)",
                cursor: event.relatedPath ? "pointer" : "default",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => {
                if (event.relatedPath) e.currentTarget.style.opacity = "0.7";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              <span style={{ fontSize: "20px", flexShrink: 0 }}>{getEventIcon(event.type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "var(--portal-font-size-sm)",
                    color: "var(--portal-text-primary)",
                    marginBottom: "2px",
                  }}
                >
                  {event.title}
                </div>
                <div
                  style={{
                    fontSize: "var(--portal-font-size-xs)",
                    color: "var(--portal-text-tertiary)",
                  }}
                >
                  {formatRelativeTime(event.timestamp)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Financial Progress Bar - Visual progress toward total
 * ──────────────────────────────────────────────────────────────────────────── */

interface FinancialSnapshotProps {
  totalPaid: number;
  totalAmount: number;
  nextPaymentAmount: number;
  nextPaymentDueAt: string | null;
  onNavigate: (path: string) => void;
}

function FinancialSnapshot({
  totalPaid,
  totalAmount,
  nextPaymentAmount,
  nextPaymentDueAt,
  onNavigate,
}: FinancialSnapshotProps) {
  const progress = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

  return (
    <div>
      <h3
        style={{
          fontSize: "var(--portal-font-size-lg)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          margin: 0,
          marginBottom: "var(--portal-space-3)",
          display: "flex",
          alignItems: "center",
          gap: "var(--portal-space-2)",
        }}
      >
        <span style={{ fontSize: "20px" }}>📊</span>
        Financial Snapshot
      </h3>

      <div
        style={{
          background: "var(--portal-bg-card)",
          border: "1px solid var(--portal-border-subtle)",
          borderRadius: "var(--portal-radius-lg)",
          padding: "var(--portal-space-4)",
        }}
      >
        {/* Progress Bar */}
        <div style={{ marginBottom: "var(--portal-space-3)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "var(--portal-space-2)",
            }}
          >
            <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-secondary)" }}>
              Total Paid
            </span>
            <span style={{ fontSize: "var(--portal-font-size-sm)", fontWeight: "var(--portal-font-weight-semibold)", color: "var(--portal-text-primary)" }}>
              {formatCurrency(totalPaid)} of {formatCurrency(totalAmount)}
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: "8px",
              background: "var(--portal-bg-elevated)",
              borderRadius: "var(--portal-radius-full)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.min(progress, 100)}%`,
                height: "100%",
                background: "var(--portal-accent)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Next Payment */}
        {nextPaymentAmount > 0 && nextPaymentDueAt && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "var(--portal-space-3)",
              borderTop: "1px solid var(--portal-border-subtle)",
            }}
          >
            <div>
              <div style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-secondary)" }}>
                Next Payment
              </div>
              <div style={{ fontSize: "var(--portal-font-size-lg)", fontWeight: "var(--portal-font-weight-bold)", color: "var(--portal-text-primary)" }}>
                {formatCurrency(nextPaymentAmount)}
              </div>
              <div style={{ fontSize: "var(--portal-font-size-xs)", color: "var(--portal-text-tertiary)" }}>
                Due in {getDaysUntil(nextPaymentDueAt)} days
              </div>
            </div>
            <Button variant="secondary" onClick={() => onNavigate("/financials")}>
              View Financials →
            </Button>
          </div>
        )}

        {/* No next payment */}
        {nextPaymentAmount === 0 && (
          <div
            style={{
              paddingTop: "var(--portal-space-3)",
              borderTop: "1px solid var(--portal-border-subtle)",
              textAlign: "center",
            }}
          >
            <Button variant="secondary" onClick={() => onNavigate("/financials")}>
              View Financials →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Empty State
 * ──────────────────────────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div
      style={{
        background: "var(--portal-bg-card)",
        border: "1px solid var(--portal-border-subtle)",
        borderRadius: "var(--portal-radius-lg)",
        padding: "var(--portal-space-6)",
        textAlign: "center",
      }}
    >
      <h2
        style={{
          fontSize: "var(--portal-font-size-xl)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          margin: 0,
          marginBottom: "var(--portal-space-2)",
        }}
      >
        Welcome to Your Portal
      </h2>
      <p
        style={{
          fontSize: "var(--portal-font-size-sm)",
          color: "var(--portal-text-secondary)",
          margin: 0,
          maxWidth: "400px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        Your private portal for messages, documents, agreements, and updates about your animal.
      </p>
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
          height: "400px",
          background: "var(--portal-bg-elevated)",
          borderRadius: "var(--portal-radius-lg)",
        }}
      />
      <div
        style={{
          height: "200px",
          background: "var(--portal-bg-elevated)",
          borderRadius: "var(--portal-radius-lg)",
        }}
      />
      <div
        style={{
          height: "200px",
          background: "var(--portal-bg-elevated)",
          borderRadius: "var(--portal-radius-lg)",
        }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ──────────────────────────────────────────────────────────────────────────── */

export default function PortalDashboardPage() {
  const { tenantSlug, isReady } = useTenantContext();
  const { userEmail } = usePortalContext();

  // State for data
  const [placements, setPlacements] = React.useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = React.useState<any>(null);
  const [agreements, setAgreements] = React.useState<any[]>([]);
  const [activityEvents, setActivityEvents] = React.useState<DemoActivityEvent[]>([]);
  const [dataLoading, setDataLoading] = React.useState(true);

  // Fetch data
  React.useEffect(() => {
    if (!isReady) return;

    let cancelled = false;
    const portalFetch = createPortalFetch(tenantSlug);

    async function loadDashboardData() {
      setDataLoading(true);

      // Check if demo mode is active
      if (isDemoMode()) {
        const demoData = generateDemoData();
        if (!cancelled) {
          setPlacements(demoData.placements);
          setFinancialSummary(demoData.financialSummary);
          setAgreements(demoData.agreements);
          setActivityEvents(demoData.activityEvents);
          setDataLoading(false);
        }
        return;
      }

      // Normal API fetch
      try {
        const [placementsData, financialsData, agreementsData] = await Promise.all([
          portalFetch<{ placements: any[] }>("/portal/placements").catch(() => null),
          portalFetch<any>("/portal/financials").catch(() => null),
          portalFetch<{ agreements: any[] }>("/portal/agreements").catch(() => null),
        ]);

        if (cancelled) return;

        if (placementsData) {
          setPlacements(placementsData.placements || []);
        }

        if (financialsData) {
          setFinancialSummary(financialsData);
        }

        if (agreementsData) {
          setAgreements(agreementsData.agreements || []);
        }

        // TODO: Fetch real activity events from API
        setActivityEvents([]);
      } catch (err) {
        if (cancelled) return;
        console.error("[PortalDashboard] Failed to load data:", err);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug, isReady]);

  // Derive user's first name from email
  const getUserFirstName = (): string | null => {
    if (!userEmail) return null;
    const localPart = userEmail.split("@")[0];
    const name = localPart.split("+")[0];
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const firstName = getUserFirstName();
  const pageTitle = firstName ? `Welcome back, ${firstName}` : "Welcome back";

  const handleNavigate = (path: string) => {
    window.history.pushState(null, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  // Get primary placement
  const primaryPlacement = placements[0];
  const pendingAgreements = agreements.filter((a: any) => a.status === "sent");

  return (
    <PageScaffold title={pageTitle}>
      {dataLoading && <LoadingState />}

      {!dataLoading && !primaryPlacement && <EmptyState />}

      {!dataLoading && primaryPlacement && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
          {/* Animal Status Card Hero */}
          <AnimalStatusCard
            name={primaryPlacement.offspring?.name || "Your animal"}
            species={primaryPlacement.species || "dog"}
            breed={primaryPlacement.breed || ""}
            status={primaryPlacement.placementStatus || "active"}
            lastUpdate={primaryPlacement.lastUpdate || null}
            photos={primaryPlacement.photos || []}
            onNavigate={handleNavigate}
          />

          {/* Action Required Section */}
          <ActionRequiredSection
            overdueAmount={financialSummary?.overdueAmount || 0}
            nextPaymentAmount={financialSummary?.totalDue || 0}
            nextPaymentDueAt={financialSummary?.nextPaymentDueAt || null}
            pendingAgreements={pendingAgreements.length}
            onNavigate={handleNavigate}
          />

          {/* Activity Timeline */}
          <ActivityTimeline events={activityEvents} onNavigate={handleNavigate} />

          {/* Financial Snapshot */}
          <FinancialSnapshot
            totalPaid={financialSummary?.totalPaid || 0}
            totalAmount={financialSummary?.totalAmount || 0}
            nextPaymentAmount={financialSummary?.totalDue || 0}
            nextPaymentDueAt={financialSummary?.nextPaymentDueAt || null}
            onNavigate={handleNavigate}
          />
        </div>
      )}
    </PageScaffold>
  );
}
