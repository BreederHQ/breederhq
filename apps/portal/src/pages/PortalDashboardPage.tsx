// apps/portal/src/pages/PortalDashboardPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { InlineNotice } from "../design/InlineNotice";
import { Button } from "../design/Button";
import { usePortalTasks } from "../tasks/taskSources";
import { usePortalNotifications } from "../notifications/notificationSources";
import { isPortalMockEnabled } from "../dev/mockFlag";
import { DemoBanner } from "../dev/DemoBanner";
import { mockOffspring, mockFinancialSummary } from "../dev/mockData";

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
 * Welcome Hero Card - Premium empty state when no data yet
 * ──────────────────────────────────────────────────────────────────────────── */

function WelcomeHeroCard({ onEnableDemo }: { onEnableDemo: () => void }) {
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
        {/* Welcome badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            background: "var(--portal-accent-muted)",
            borderRadius: "var(--portal-radius-full)",
            marginBottom: "var(--portal-space-3)",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "var(--portal-accent)",
              boxShadow: "0 0 8px var(--portal-accent)",
            }}
          />
          <span
            style={{
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-semibold)",
              color: "var(--portal-accent)",
              textTransform: "uppercase",
              letterSpacing: "var(--portal-letter-spacing-wide)",
            }}
          >
            Your Portal
          </span>
        </div>

        {/* Title - hero treatment */}
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
          Welcome
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "var(--portal-font-size-lg)",
            color: "var(--portal-text-secondary)",
            margin: 0,
            marginBottom: "var(--portal-space-4)",
            maxWidth: "400px",
          }}
        >
          Your private portal for messages, documents, agreements, and updates from your breeder.
        </p>

        {/* Demo mode prompt */}
        <button
          onClick={onEnableDemo}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--portal-space-2)",
            padding: "var(--portal-space-2) var(--portal-space-4)",
            background: "var(--portal-accent)",
            color: "white",
            border: "none",
            borderRadius: "var(--portal-radius-md)",
            fontSize: "var(--portal-font-size-sm)",
            fontWeight: "var(--portal-font-weight-semibold)",
            cursor: "pointer",
            transition: "opacity var(--portal-transition), transform var(--portal-transition)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.9";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Preview with demo data →
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Quick Links Card - Navigation shortcuts
 * ──────────────────────────────────────────────────────────────────────────── */

interface QuickLinkItem {
  icon: string;
  label: string;
  href: string;
  description: string;
}

function QuickLinksCard({ onNavigate }: { onNavigate: (path: string) => void }) {
  const links: QuickLinkItem[] = [
    { icon: "💬", label: "Messages", href: "/messages", description: "Chat with your breeder" },
    { icon: "📋", label: "Tasks", href: "/tasks", description: "Things that need attention" },
    { icon: "📄", label: "Documents", href: "/documents", description: "Health records & files" },
    { icon: "📝", label: "Agreements", href: "/agreements", description: "Contracts & signatures" },
  ];

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
          fontSize: "var(--portal-font-size-sm)",
          fontWeight: "var(--portal-font-weight-semibold)",
          textTransform: "uppercase",
          letterSpacing: "var(--portal-letter-spacing-wide)",
          color: "var(--portal-text-tertiary)",
          margin: 0,
          marginBottom: "var(--portal-space-3)",
        }}
      >
        Explore Your Portal
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "var(--portal-space-2)",
        }}
      >
        {links.map((link) => (
          <button
            key={link.href}
            onClick={() => onNavigate(link.href)}
            style={{
              all: "unset",
              display: "flex",
              alignItems: "center",
              gap: "var(--portal-space-3)",
              padding: "var(--portal-space-3)",
              borderRadius: "var(--portal-radius-lg)",
              cursor: "pointer",
              transition: "background var(--portal-transition), transform var(--portal-transition)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--portal-bg-elevated)";
              e.currentTarget.style.transform = "translateX(4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.transform = "translateX(0)";
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--portal-radius-md)",
                background: "var(--portal-accent-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25rem",
                flexShrink: 0,
              }}
            >
              {link.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "var(--portal-font-size-base)",
                  color: "var(--portal-text-primary)",
                  fontWeight: "var(--portal-font-weight-medium)",
                }}
              >
                {link.label}
              </div>
              <div
                style={{
                  fontSize: "var(--portal-font-size-xs)",
                  color: "var(--portal-text-tertiary)",
                }}
              >
                {link.description}
              </div>
            </div>
            <span
              style={{
                fontSize: "var(--portal-font-size-sm)",
                color: "var(--portal-accent)",
              }}
            >
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Financial Summary Strip
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

interface FinancialSummaryStripProps {
  totalDue: number;
  totalPaid: number;
  nextPaymentAmount: number | null;
  nextPaymentDueAt: string | null;
  overdueAmount: number;
  onNavigate: (path: string) => void;
}

function FinancialSummaryStrip({
  totalDue,
  totalPaid,
  nextPaymentAmount,
  nextPaymentDueAt,
  overdueAmount,
  onNavigate,
}: FinancialSummaryStripProps) {
  const hasOverdue = overdueAmount > 0;
  const hasDue = totalDue > 0;
  const nextDueDays = nextPaymentDueAt ? getDaysUntil(nextPaymentDueAt) : null;

  return (
    <div
      onClick={() => onNavigate("/financials")}
      style={{
        background: hasOverdue
          ? "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%), var(--portal-bg-card)"
          : hasDue
            ? "linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 107, 53, 0.05) 100%), var(--portal-bg-card)"
            : "var(--portal-gradient-card), var(--portal-bg-card)",
        border: `1px solid ${hasOverdue ? "rgba(239, 68, 68, 0.3)" : "var(--portal-border-subtle)"}`,
        borderRadius: "var(--portal-radius-xl)",
        boxShadow: "var(--portal-shadow-card)",
        padding: "var(--portal-space-4)",
        cursor: "pointer",
        transition: "transform var(--portal-transition), box-shadow var(--portal-transition)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "var(--portal-shadow-lg)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--portal-shadow-card)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--portal-space-3)" }}>
        {/* Icon */}
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "var(--portal-radius-lg)",
            background: hasOverdue
              ? "var(--portal-error-soft)"
              : hasDue
                ? "var(--portal-accent-soft)"
                : "var(--portal-success-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            flexShrink: 0,
          }}
        >
          💳
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                fontSize: "var(--portal-font-size-sm)",
                color: "var(--portal-text-secondary)",
              }}
            >
              {hasOverdue ? "Payment Overdue" : hasDue ? "Balance Due" : "Payments"}
            </div>
            {hasOverdue && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "2px 8px",
                  background: "var(--portal-error-soft)",
                  borderRadius: "var(--portal-radius-full)",
                }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "var(--portal-error)",
                    boxShadow: "0 0 6px var(--portal-error)",
                  }}
                />
                <span
                  style={{
                    fontSize: "var(--portal-font-size-xs)",
                    fontWeight: "var(--portal-font-weight-semibold)",
                    color: "var(--portal-error)",
                    textTransform: "uppercase",
                  }}
                >
                  Overdue
                </span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "var(--portal-space-3)" }}>
            <div
              style={{
                fontSize: "var(--portal-font-size-xl)",
                fontWeight: "var(--portal-font-weight-bold)",
                color: hasOverdue
                  ? "var(--portal-error)"
                  : hasDue
                    ? "var(--portal-accent)"
                    : "var(--portal-success)",
              }}
            >
              {hasOverdue ? formatCurrency(overdueAmount) : hasDue ? formatCurrency(totalDue) : formatCurrency(totalPaid)}
            </div>
            <div
              style={{
                fontSize: "var(--portal-font-size-sm)",
                color: "var(--portal-text-tertiary)",
              }}
            >
              {hasOverdue
                ? "needs attention"
                : hasDue && nextDueDays !== null
                  ? nextDueDays < 0
                    ? "past due"
                    : nextDueDays === 0
                      ? "due today"
                      : `due in ${nextDueDays} days`
                  : "paid to date"}
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-accent)",
            flexShrink: 0,
          }}
        >
          →
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

  // Get financial summary (demo mode or real data)
  const financialSummary = mockEnabled ? mockFinancialSummary() : null;

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

          {/* Financial Summary Strip */}
          {primaryOffspring && financialSummary && (
            <FinancialSummaryStrip
              totalDue={financialSummary.totalDue}
              totalPaid={financialSummary.totalPaid}
              nextPaymentAmount={financialSummary.nextPaymentAmount}
              nextPaymentDueAt={financialSummary.nextPaymentDueAt}
              overdueAmount={financialSummary.overdueAmount}
              onNavigate={handleNavigate}
            />
          )}

          {/* Welcome Hero - shown when no offspring data yet */}
          {!primaryOffspring && (
            <>
              <WelcomeHeroCard
                onEnableDemo={() => {
                  localStorage.setItem("portal_mock", "1");
                  window.location.reload();
                }}
              />
              <QuickLinksCard onNavigate={handleNavigate} />
            </>
          )}
        </div>
      )}
    </PageContainer>
  );
}
