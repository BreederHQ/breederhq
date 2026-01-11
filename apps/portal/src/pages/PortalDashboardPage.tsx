// apps/portal/src/pages/PortalDashboardPage.tsx
// Overview archetype - calm, operational, species-aware
import * as React from "react";
import { PageScaffold, SectionHeader } from "../design/PageScaffold";
import { PortalCard } from "../design/PortalCard";
import { Button } from "../design/Button";
import { usePortalTasks } from "../tasks/taskSources";
import { usePortalNotifications } from "../notifications/notificationSources";
import { usePortalContext } from "../hooks/usePortalContext";
import { getSpeciesAccent } from "../ui/speciesTokens";
import { SubjectHeader, StatusBadge, type StatusVariant } from "../components/SubjectHeader";
import { createPortalFetch, useTenantContext } from "../derived/tenantContext";

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

type PlacementStatus = "reserved" | "active" | "placed" | "pending";

function getStatusLabel(status: string): { label: string; variant: "action" | "success" | "warning" | "neutral" } {
  switch (status) {
    case "reserved":
      return { label: "Reserved", variant: "action" };
    case "placed":
      return { label: "Placed", variant: "success" };
    case "active":
      return { label: "Active", variant: "action" };
    case "pending":
      return { label: "Pending", variant: "warning" };
    default:
      return { label: status, variant: "neutral" };
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Primary Context Strip - The main status area with species awareness
 * ──────────────────────────────────────────────────────────────────────────── */

interface ContextStripProps {
  name: string;
  species: string | null;
  breed: string | null;
  status: PlacementStatus;
  nextAction: string;
  ctaLabel: string;
  ctaPath: string;
  onNavigate: (path: string) => void;
}

function ContextStrip({
  name,
  species,
  breed,
  status,
  nextAction,
  ctaLabel,
  ctaPath,
  onNavigate,
}: ContextStripProps) {
  const statusInfo = getStatusLabel(status);
  const accent = getSpeciesAccent(species);

  // Build species line: "Species · Breed" or just "Species"
  const speciesLine = breed ? `${species || "Unknown"} · ${breed}` : species || null;

  return (
    <div
      style={{
        background: "var(--portal-bg-card)",
        border: "1px solid var(--portal-border-subtle)",
        borderLeft: `3px solid ${accent}`,
        borderRadius: "var(--portal-radius-lg)",
        padding: "var(--portal-space-4)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--portal-space-4)",
          flexWrap: "wrap",
        }}
      >
        {/* Left: Name + Species + Status */}
        <div style={{ minWidth: 0, flex: "1 1 200px" }}>
          <div
            style={{
              fontSize: "var(--portal-font-size-lg)",
              fontWeight: "var(--portal-font-weight-semibold)",
              color: "var(--portal-text-primary)",
              marginBottom: "2px",
            }}
          >
            {name}
          </div>
          {speciesLine && (
            <div
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-tertiary)",
                marginBottom: "var(--portal-space-2)",
              }}
            >
              {speciesLine}
            </div>
          )}
          <StatusBadge label={statusInfo.label} variant={statusInfo.variant as StatusVariant} speciesAccent={accent} />
        </div>

        {/* Center: Next action */}
        <div
          style={{
            flex: "1 1 150px",
            textAlign: "center",
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-text-secondary)",
          }}
        >
          {nextAction}
        </div>

        {/* Right: CTA */}
        <div style={{ flexShrink: 0 }}>
          <Button variant="primary" onClick={() => onNavigate(ctaPath)}>
            {ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Attention Card - Flat, count-focused
 * ──────────────────────────────────────────────────────────────────────────── */

interface AttentionCardProps {
  label: string;
  count: number;
  onClick: () => void;
}

function AttentionCard({ label, count, onClick }: AttentionCardProps) {
  return (
    <button
      onClick={onClick}
      style={{
        all: "unset",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--portal-space-3) var(--portal-space-4)",
        background: "var(--portal-bg-card)",
        border: "1px solid var(--portal-border-subtle)",
        borderRadius: "var(--portal-radius-lg)",
        cursor: "pointer",
        transition: "border-color var(--portal-transition)",
        width: "100%",
        boxSizing: "border-box",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--portal-border)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--portal-border-subtle)";
      }}
    >
      <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-secondary)" }}>{label}</span>
      <span
        style={{
          fontSize: "var(--portal-font-size-lg)",
          fontWeight: "var(--portal-font-weight-bold)",
          color: "var(--portal-text-primary)",
        }}
      >
        {count}
      </span>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Financial Due Card - Shows balance when due
 * ──────────────────────────────────────────────────────────────────────────── */

interface FinancialDueCardProps {
  amount: number;
  isOverdue: boolean;
  dueInDays: number | null;
  onClick: () => void;
}

function FinancialDueCard({ amount, isOverdue, dueInDays, onClick }: FinancialDueCardProps) {
  const dueText = isOverdue
    ? "Overdue"
    : dueInDays === 0
      ? "Due today"
      : dueInDays !== null
        ? `Due in ${dueInDays} days`
        : "Balance";

  return (
    <button
      onClick={onClick}
      style={{
        all: "unset",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--portal-space-3) var(--portal-space-4)",
        background: "var(--portal-bg-card)",
        border: `1px solid ${isOverdue ? "rgba(239, 68, 68, 0.3)" : "var(--portal-border-subtle)"}`,
        borderRadius: "var(--portal-radius-lg)",
        cursor: "pointer",
        transition: "border-color var(--portal-transition)",
        width: "100%",
        boxSizing: "border-box",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = isOverdue ? "rgba(239, 68, 68, 0.5)" : "var(--portal-border)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isOverdue ? "rgba(239, 68, 68, 0.3)" : "var(--portal-border-subtle)";
      }}
    >
      <div>
        <div style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-secondary)" }}>
          Payment due
        </div>
        <div
          style={{
            fontSize: "var(--portal-font-size-xs)",
            color: isOverdue ? "var(--portal-error)" : "var(--portal-text-tertiary)",
          }}
        >
          {dueText}
        </div>
      </div>
      <span
        style={{
          fontSize: "var(--portal-font-size-lg)",
          fontWeight: "var(--portal-font-weight-bold)",
          color: isOverdue ? "var(--portal-error)" : "var(--portal-accent)",
        }}
      >
        {formatCurrency(amount)}
      </span>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Secondary Links - Text-only navigation
 * ──────────────────────────────────────────────────────────────────────────── */

interface SecondaryLinksProps {
  onNavigate: (path: string) => void;
}

function SecondaryLinks({ onNavigate }: SecondaryLinksProps) {
  const links = [
    { label: "Documents", path: "/documents" },
    { label: "Agreements", path: "/agreements" },
    { label: "Profile", path: "/profile" },
    { label: "Offspring", path: "/offspring" },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--portal-space-4)",
        flexWrap: "wrap",
      }}
    >
      {links.map((link) => (
        <button
          key={link.path}
          onClick={() => onNavigate(link.path)}
          style={{
            all: "unset",
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-text-tertiary)",
            cursor: "pointer",
            transition: "color var(--portal-transition)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--portal-text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--portal-text-tertiary)";
          }}
        >
          {link.label}
        </button>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Empty State - When no reservation yet
 * ──────────────────────────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <PortalCard variant="flat">
      <div style={{ textAlign: "center", padding: "var(--portal-space-4)" }}>
        <h2
          style={{
            fontSize: "var(--portal-font-size-lg)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            margin: 0,
            marginBottom: "var(--portal-space-2)",
          }}
        >
          Welcome
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
          Your private portal for messages, documents, agreements, and updates.
        </p>
      </div>
    </PortalCard>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Loading State
 * ──────────────────────────────────────────────────────────────────────────── */

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
      <div
        style={{
          height: "100px",
          background: "var(--portal-bg-elevated)",
          borderRadius: "var(--portal-radius-lg)",
        }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "var(--portal-space-2)",
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: "60px",
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
 * Main Component
 * ──────────────────────────────────────────────────────────────────────────── */

export default function PortalDashboardPage() {
  const { tenantSlug, isReady } = useTenantContext();
  const { tasks, loading: tasksLoading } = usePortalTasks();
  const { notifications, loading: notificationsLoading } = usePortalNotifications();
  const { orgName, userEmail } = usePortalContext();

  // State for real API data
  const [placements, setPlacements] = React.useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = React.useState<any>(null);
  const [agreements, setAgreements] = React.useState<any[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = React.useState(0);
  const [dataLoading, setDataLoading] = React.useState(true);

  // Fetch real data from API - wait for tenant context
  React.useEffect(() => {
    if (!isReady) return;

    let cancelled = false;
    const portalFetch = createPortalFetch(tenantSlug);

    async function loadDashboardData() {
      setDataLoading(true);
      try {
        // Fetch placements, financials, and agreements in parallel
        const [placementsData, financialsData, agreementsData, threadsData] = await Promise.all([
          portalFetch<{ placements: any[] }>("/portal/placements").catch(() => null),
          portalFetch<any>("/portal/financials").catch(() => null),
          portalFetch<{ agreements: any[] }>("/portal/agreements").catch(() => null),
          portalFetch<{ threads: any[] }>("/portal/threads").catch(() => null),
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

        if (threadsData) {
          const threads = threadsData.threads || [];
          const unread = threads.reduce((sum: number, t: any) => sum + (t.unreadCount || 0), 0);
          setUnreadMessagesCount(unread);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("[PortalDashboard] Failed to load data:", err);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }

    loadDashboardData();
    return () => { cancelled = true; };
  }, [tenantSlug, isReady]);

  // Derive user's first name from email (before @ or +)
  const getUserFirstName = (): string | null => {
    if (!userEmail) return null;
    const localPart = userEmail.split("@")[0];
    // Handle email+tag format
    const name = localPart.split("+")[0];
    // Capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const firstName = getUserFirstName();
  const pageTitle = firstName ? `Welcome, ${firstName}` : "Welcome";

  const handleNavigate = (path: string) => {
    window.history.pushState(null, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  // Calculate counts
  const actionRequiredCount = tasks.filter((t) => t.urgency === "action_required").length;
  const notificationsCount = notifications.filter((n) => !n.read).length;
  const messagesCount = unreadMessagesCount;

  const isLoading = tasksLoading || notificationsLoading || dataLoading;

  // Get primary placement (offspring data includes species/breed)
  const primaryPlacement = placements[0];

  // Derive species and breed from placement data
  const species = primaryPlacement?.species || null;
  const breed = primaryPlacement?.breed || null;

  // Get pending agreements
  const pendingAgreements = agreements.filter((a: any) => a.status === "sent");

  // Determine next action and CTA using domain-neutral language
  const getNextActionAndCTA = (placement: any, financial: any, pendingAgreements: any[]) => {
    if (!placement) {
      return { nextAction: "Getting started", ctaLabel: "View", ctaPath: "/" };
    }

    // Check for overdue payments first
    if (financial?.overdueAmount > 0) {
      return {
        nextAction: "Payment overdue",
        ctaLabel: "Pay now",
        ctaPath: "/financials",
      };
    }

    // Check for pending agreements
    if (pendingAgreements.length > 0) {
      return {
        nextAction: "Agreement awaiting signature",
        ctaLabel: "Review",
        ctaPath: "/agreements",
      };
    }

    // Check for due payments
    if (financial?.totalDue > 0 && financial?.nextPaymentDueAt) {
      const days = getDaysUntil(financial.nextPaymentDueAt);
      return {
        nextAction: `Payment due ${days <= 0 ? "today" : `in ${days} days`}`,
        ctaLabel: "Pay now",
        ctaPath: "/financials",
      };
    }

    // Check for go-home scheduling (paid in full but no pickup date)
    if (placement.paidInFullAt && !placement.pickupAt) {
      return {
        nextAction: "Ready to schedule go-home",
        ctaLabel: "Schedule",
        ctaPath: "/tasks",
      };
    }

    // Placed = handoff complete
    if (placement.placementStatus === "placed") {
      return {
        nextAction: "Placement complete",
        ctaLabel: "View details",
        ctaPath: "/offspring",
      };
    }

    // Default = reservation confirmed
    return {
      nextAction: "Reservation confirmed",
      ctaLabel: "View details",
      ctaPath: "/offspring",
    };
  };

  const { nextAction, ctaLabel, ctaPath } = getNextActionAndCTA(
    primaryPlacement,
    financialSummary,
    pendingAgreements
  );

  // Determine page status
  const hasOverdue = (financialSummary?.overdueAmount ?? 0) > 0;
  const hasDue = (financialSummary?.totalDue ?? 0) > 0;
  const pageStatus = hasOverdue ? "error" : actionRequiredCount > 0 ? "action" : hasDue ? "warning" : undefined;
  const pageStatusLabel = hasOverdue
    ? "Action needed"
    : actionRequiredCount > 0
      ? `${actionRequiredCount} pending`
      : undefined;

  return (
    <PageScaffold title={pageTitle} status={pageStatus} statusLabel={pageStatusLabel}>
      {isLoading && <LoadingState />}

      {!isLoading && !primaryPlacement && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
          <EmptyState />
          <SecondaryLinks onNavigate={handleNavigate} />
        </div>
      )}

      {!isLoading && primaryPlacement && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
          {/* Primary Context Strip with species awareness */}
          <ContextStrip
            name={primaryPlacement.offspring?.name || "Your reservation"}
            species={species}
            breed={breed}
            status={primaryPlacement.placementStatus as PlacementStatus}
            nextAction={nextAction}
            ctaLabel={ctaLabel}
            ctaPath={ctaPath}
            onNavigate={handleNavigate}
          />

          {/* Attention Cards - only show if counts > 0 */}
          {(actionRequiredCount > 0 || notificationsCount > 0 || messagesCount > 0 || hasDue) && (
            <div>
              <SectionHeader title="Needs attention" />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "var(--portal-space-2)",
                }}
              >
                {actionRequiredCount > 0 && (
                  <AttentionCard label="Tasks" count={actionRequiredCount} onClick={() => handleNavigate("/tasks")} />
                )}
                {messagesCount > 0 && (
                  <AttentionCard label="Messages" count={messagesCount} onClick={() => handleNavigate("/messages")} />
                )}
                {notificationsCount > 0 && (
                  <AttentionCard
                    label="Notifications"
                    count={notificationsCount}
                    onClick={() => handleNavigate("/notifications")}
                  />
                )}
                {hasDue && financialSummary && (
                  <FinancialDueCard
                    amount={hasOverdue ? financialSummary.overdueAmount : financialSummary.totalDue}
                    isOverdue={hasOverdue}
                    dueInDays={
                      financialSummary.nextPaymentDueAt ? getDaysUntil(financialSummary.nextPaymentDueAt) : null
                    }
                    onClick={() => handleNavigate("/financials")}
                  />
                )}
              </div>
            </div>
          )}

          {/* Secondary Links */}
          <div style={{ paddingTop: "var(--portal-space-2)" }}>
            <SecondaryLinks onNavigate={handleNavigate} />
          </div>
        </div>
      )}
    </PageScaffold>
  );
}
