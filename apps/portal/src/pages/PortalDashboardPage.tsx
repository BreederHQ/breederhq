// apps/portal/src/pages/PortalDashboardPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { InlineNotice } from "../design/InlineNotice";
import { Button } from "../design/Button";
import { usePortalTasks } from "../tasks/taskSources";
import { usePortalNotifications } from "../notifications/notificationSources";
import { isPortalMockEnabled } from "../dev/mockFlag";
import { DemoBanner } from "../dev/DemoBanner";
import { mockOffspring } from "../dev/mockData";

const WELCOME_NOTICE_KEY = "portal_welcome_dismissed";

/* ────────────────────────────────────────────────────────────────────────────
 * Journey Hero Card - Primary visual anchor showing your next milestone
 * ──────────────────────────────────────────────────────────────────────────── */

interface JourneyHeroCardProps {
  offspringName: string;
  status: "reserved" | "placed" | "pending";
  nextMilestone: string;
  daysUntil?: number;
  onClick: () => void;
}

function JourneyHeroCard({ offspringName, status, nextMilestone, daysUntil, onClick }: JourneyHeroCardProps) {
  const statusConfig = {
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
  };

  const config = statusConfig[status];

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
          top: "-50%",
          right: "-20%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(255, 107, 53, 0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Status badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            background: config.bg,
            borderRadius: "var(--portal-radius-full)",
            marginBottom: "var(--portal-space-3)",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: config.dot,
              boxShadow: `0 0 8px ${config.dot}`,
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

        {/* Name - hero treatment */}
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
          {offspringName}
        </h1>

        {/* Next milestone */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "var(--portal-space-2)",
          }}
        >
          <span
            style={{
              fontSize: "var(--portal-font-size-lg)",
              color: "var(--portal-text-secondary)",
            }}
          >
            {nextMilestone}
          </span>
          {daysUntil !== undefined && (
            <span
              style={{
                fontSize: "var(--portal-font-size-sm)",
                color: "var(--portal-accent)",
                fontWeight: "var(--portal-font-weight-medium)",
              }}
            >
              {daysUntil === 0 ? "Today!" : `in ${daysUntil} days`}
            </span>
          )}
        </div>

        {/* View details prompt */}
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
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Quick Action Card - Secondary cards for tasks/notifications
 * ──────────────────────────────────────────────────────────────────────────── */

interface QuickActionCardProps {
  icon: string;
  title: string;
  count: number;
  subtitle: string;
  onClick: () => void;
}

function QuickActionCard({ icon, title, count, subtitle, onClick }: QuickActionCardProps) {
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
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--portal-space-3)" }}>
        {/* Icon container */}
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "var(--portal-radius-lg)",
            background: "var(--portal-accent-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-secondary)",
              marginBottom: "4px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "var(--portal-font-size-2xl)",
              fontWeight: "var(--portal-font-weight-bold)",
              color: "var(--portal-text-primary)",
              lineHeight: 1,
            }}
          >
            {count}
          </div>
          <div
            style={{
              fontSize: "var(--portal-font-size-xs)",
              color: "var(--portal-text-tertiary)",
              marginTop: "4px",
            }}
          >
            {subtitle}
          </div>
        </div>

        <div
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-accent)",
            alignSelf: "center",
          }}
        >
          →
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * All Set State - Shown when no actions needed
 * ──────────────────────────────────────────────────────────────────────────── */

function AllSetState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: "40vh",
        gap: "var(--portal-space-3)",
        padding: "var(--portal-space-6)",
      }}
    >
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "var(--portal-success-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2.5rem",
          marginBottom: "var(--portal-space-2)",
        }}
      >
        ✓
      </div>
      <h2
        style={{
          fontSize: "var(--portal-font-size-xl)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          margin: 0,
        }}
      >
        You're all set
      </h2>
      <p
        style={{
          fontSize: "var(--portal-font-size-base)",
          color: "var(--portal-text-secondary)",
          margin: 0,
          maxWidth: "320px",
        }}
      >
        New messages, tasks, and updates will appear here when they arrive.
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
      {/* Hero skeleton */}
      <div
        style={{
          height: "220px",
          background: "var(--portal-bg-elevated)",
          borderRadius: "var(--portal-radius-2xl)",
        }}
      />
      {/* Quick action skeletons */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "var(--portal-space-3)",
        }}
      >
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              height: "100px",
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
 * Main Component
 * ──────────────────────────────────────────────────────────────────────────── */

export default function PortalDashboardPage() {
  const [showWelcome, setShowWelcome] = React.useState(false);
  const { tasks, loading: tasksLoading } = usePortalTasks();
  const { notifications, loading: notificationsLoading } = usePortalNotifications();
  const mockEnabled = isPortalMockEnabled();

  React.useEffect(() => {
    const dismissed = localStorage.getItem(WELCOME_NOTICE_KEY);
    if (!dismissed) {
      setShowWelcome(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(WELCOME_NOTICE_KEY, "true");
    setShowWelcome(false);
  };

  const handleNavigate = (path: string) => {
    window.history.pushState(null, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  // Calculate summary counts
  const actionRequiredCount = tasks.filter((t) => t.urgency === "action_required").length;
  const notificationsCount = notifications.filter((n) => !n.read).length;

  const isLoading = tasksLoading || notificationsLoading;

  // Get primary offspring for hero card (demo mode or real data)
  const offspring = mockEnabled ? mockOffspring() : [];
  const primaryOffspring = offspring[0];

  // Determine next milestone for hero
  const getNextMilestone = (placement: any) => {
    if (!placement) return { text: "Getting started", days: undefined };
    if (placement.placementStatus === "placed") {
      return { text: "Welcome home!", days: undefined };
    }
    if (placement.paidInFullAt && !placement.pickupAt) {
      return { text: "Pickup scheduled", days: 14 };
    }
    if (placement.contractSignedAt && !placement.paidInFullAt) {
      return { text: "Final payment due", days: 7 };
    }
    return { text: "Contract ready to sign", days: 3 };
  };

  const milestone = getNextMilestone(primaryOffspring);

  return (
    <PageContainer>
      {mockEnabled && (
        <div style={{ marginBottom: "var(--portal-space-3)" }}>
          <DemoBanner />
        </div>
      )}

      {showWelcome && (
        <div style={{ marginBottom: "var(--portal-space-4)" }}>
          <InlineNotice type="info">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--portal-space-2)",
              }}
            >
              <div>
                <strong
                  style={{
                    display: "block",
                    marginBottom: "var(--portal-space-1)",
                  }}
                >
                  Welcome
                </strong>
                <span>
                  This is your private portal for messages, agreements, documents, and updates.
                </span>
              </div>
              <div>
                <Button
                  variant="ghost"
                  onClick={handleDismiss}
                  style={{
                    fontSize: "var(--portal-font-size-sm)",
                    padding: "var(--portal-space-1) var(--portal-space-2)",
                  }}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </InlineNotice>
        </div>
      )}

      {isLoading && <LoadingState />}

      {!isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
          {/* Journey Hero Card */}
          {primaryOffspring && (
            <JourneyHeroCard
              offspringName={primaryOffspring.offspring?.name || "Your puppy"}
              status={primaryOffspring.placementStatus as "reserved" | "placed" | "pending"}
              nextMilestone={milestone.text}
              daysUntil={milestone.days}
              onClick={() => handleNavigate(`/portal/offspring/${primaryOffspring.offspring?.id}`)}
            />
          )}

          {/* Quick Actions Grid */}
          {(actionRequiredCount > 0 || notificationsCount > 0) && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "var(--portal-space-3)",
              }}
            >
              {actionRequiredCount > 0 && (
                <QuickActionCard
                  icon="📋"
                  title="Tasks"
                  count={actionRequiredCount}
                  subtitle="need your attention"
                  onClick={() => handleNavigate("/tasks")}
                />
              )}
              {notificationsCount > 0 && (
                <QuickActionCard
                  icon="🔔"
                  title="Updates"
                  count={notificationsCount}
                  subtitle="unread notifications"
                  onClick={() => handleNavigate("/notifications")}
                />
              )}
            </div>
          )}

          {/* All Set State - only if no hero and no actions */}
          {!primaryOffspring && actionRequiredCount === 0 && notificationsCount === 0 && (
            <AllSetState />
          )}
        </div>
      )}
    </PageContainer>
  );
}
