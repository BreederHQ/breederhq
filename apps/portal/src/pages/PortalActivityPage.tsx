// apps/portal/src/pages/PortalActivityPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { PortalHero } from "../design/PortalHero";
import { PortalCard, CardRow } from "../design/PortalCard";
import { usePortalTasks, type TaskCard } from "../tasks/taskSources";
import { usePortalNotifications, type Notification } from "../notifications/notificationSources";
import { SubjectHeader } from "../components/SubjectHeader";
import { createPortalFetch, useTenantContext } from "../derived/tenantContext";

/* ────────────────────────────────────────────────────────────────────────────
 * Activity Item Type (unified Tasks + Notifications)
 * ──────────────────────────────────────────────────────────────────────────── */

interface ActivityItem {
  id: string;
  type: "invoice" | "agreement" | "offspring" | "message" | "document";
  urgency: "overdue" | "action_required" | "update" | "completed";
  icon: { emoji: string; bg: string };
  title: string;
  subtitle: string;
  statusLabel: string;
  statusVariant: "error" | "action" | "neutral" | "success";
  href: string;
  timestamp?: string;
  note?: string;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Activity Icon Component
 * ──────────────────────────────────────────────────────────────────────────── */

function ActivityIcon({ icon }: { icon: { emoji: string; bg: string } }) {
  return (
    <div
      style={{
        width: "44px",
        height: "44px",
        borderRadius: "var(--portal-radius-lg)",
        background: icon.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.25rem",
        flexShrink: 0,
      }}
    >
      {icon.emoji}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Activity Status Badge
 * ──────────────────────────────────────────────────────────────────────────── */

function ActivityStatusBadge({ variant, label }: { variant: ActivityItem["statusVariant"]; label: string }) {
  const variantStyles = {
    error: {
      bg: "var(--portal-error-soft)",
      color: "var(--portal-error)",
      dotColor: "var(--portal-error)",
    },
    action: {
      bg: "var(--portal-accent-muted)",
      color: "var(--portal-accent)",
      dotColor: "var(--portal-accent)",
    },
    neutral: {
      bg: "var(--portal-bg-elevated)",
      color: "var(--portal-text-secondary)",
      dotColor: "var(--portal-text-secondary)",
    },
    success: {
      bg: "var(--portal-success-soft)",
      color: "var(--portal-success)",
      dotColor: "var(--portal-success)",
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        background: style.bg,
        borderRadius: "var(--portal-radius-full)",
      }}
    >
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: style.dotColor,
        }}
      />
      <span
        style={{
          fontSize: "var(--portal-font-size-xs)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: style.color,
          textTransform: "uppercase",
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Activity Row Component
 * ──────────────────────────────────────────────────────────────────────────── */

interface ActivityRowProps {
  activity: ActivityItem;
}

function ActivityRow({ activity }: ActivityRowProps) {
  const handleClick = () => {
    window.location.href = activity.href;
  };

  return (
    <CardRow onClick={handleClick}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--portal-space-3)" }}>
        <ActivityIcon icon={activity.icon} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--portal-space-2)",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                fontSize: "var(--portal-font-size-base)",
                fontWeight: "var(--portal-font-weight-semibold)",
                color: "var(--portal-text-primary)",
              }}
            >
              {activity.title}
            </div>
            <ActivityStatusBadge variant={activity.statusVariant} label={activity.statusLabel} />
          </div>

          <div
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-secondary)",
              marginBottom: activity.note ? "6px" : 0,
            }}
          >
            {activity.subtitle}
          </div>

          {activity.note && (
            <div
              style={{
                fontSize: "var(--portal-font-size-sm)",
                color: activity.urgency === "overdue" ? "var(--portal-error)" : "var(--portal-accent)",
                fontWeight: "var(--portal-font-weight-medium)",
              }}
            >
              {activity.note}
            </div>
          )}
        </div>

        <div
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-accent)",
            alignSelf: "center",
            flexShrink: 0,
          }}
        >
          →
        </div>
      </div>
    </CardRow>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Activity Group Section
 * ──────────────────────────────────────────────────────────────────────────── */

interface ActivityGroupProps {
  title: string;
  activities: ActivityItem[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

function ActivityGroup({ title, activities, collapsible = false, defaultCollapsed = false }: ActivityGroupProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  if (activities.length === 0) return null;

  return (
    <div style={{ marginBottom: "var(--portal-space-5)" }}>
      {collapsible ? (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            all: "unset",
            display: "flex",
            alignItems: "center",
            gap: "var(--portal-space-2)",
            width: "100%",
            cursor: "pointer",
            marginBottom: "var(--portal-space-3)",
          }}
        >
          <h2
            style={{
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-semibold)",
              textTransform: "uppercase",
              letterSpacing: "var(--portal-letter-spacing-wide)",
              color: "var(--portal-text-tertiary)",
              margin: 0,
            }}
          >
            {title}
          </h2>
          <span
            style={{
              fontSize: "var(--portal-font-size-xs)",
              color: "var(--portal-text-tertiary)",
              background: "var(--portal-bg-elevated)",
              padding: "2px 8px",
              borderRadius: "var(--portal-radius-full)",
            }}
          >
            {activities.length}
          </span>
          <span
            style={{
              fontSize: "var(--portal-font-size-xs)",
              color: "var(--portal-text-tertiary)",
            }}
          >
            {isCollapsed ? "▸" : "▾"}
          </span>
        </button>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--portal-space-2)",
            marginBottom: "var(--portal-space-3)",
          }}
        >
          <h2
            style={{
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-semibold)",
              textTransform: "uppercase",
              letterSpacing: "var(--portal-letter-spacing-wide)",
              color: "var(--portal-text-tertiary)",
              margin: 0,
            }}
          >
            {title}
          </h2>
          <span
            style={{
              fontSize: "var(--portal-font-size-xs)",
              color: "var(--portal-text-tertiary)",
              background: "var(--portal-bg-elevated)",
              padding: "2px 8px",
              borderRadius: "var(--portal-radius-full)",
            }}
          >
            {activities.length}
          </span>
        </div>
      )}

      {!isCollapsed && (
        <PortalCard variant="elevated" padding="none">
          {activities.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}
        </PortalCard>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Empty State
 * ──────────────────────────────────────────────────────────────────────────── */

function EmptyActivity() {
  return (
    <PortalCard variant="flat" padding="lg">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "var(--portal-space-6)",
          gap: "var(--portal-space-3)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "var(--portal-success-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
          }}
        >
          ✓
        </div>
        <h3
          style={{
            fontSize: "var(--portal-font-size-lg)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            margin: 0,
          }}
        >
          No action needed right now
        </h3>
        <p
          style={{
            fontSize: "var(--portal-font-size-base)",
            color: "var(--portal-text-secondary)",
            margin: 0,
            maxWidth: "320px",
          }}
        >
          We'll notify you when something requires your attention.
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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
      <div
        style={{
          height: "120px",
          background: "var(--portal-bg-elevated)",
          borderRadius: "var(--portal-radius-xl)",
        }}
      />
      {[1, 2, 3].map((i) => (
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

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <PortalCard variant="flat" padding="lg">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "var(--portal-space-6)",
          gap: "var(--portal-space-3)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "var(--portal-error-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            color: "var(--portal-error)",
          }}
        >
          !
        </div>
        <h3
          style={{
            fontSize: "var(--portal-font-size-lg)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            margin: 0,
          }}
        >
          Unable to load activity
        </h3>
        <p
          style={{
            fontSize: "var(--portal-font-size-base)",
            color: "var(--portal-text-secondary)",
            margin: 0,
          }}
        >
          {error}
        </p>
        <button
          onClick={onRetry}
          style={{
            padding: "var(--portal-space-2) var(--portal-space-4)",
            background: "var(--portal-accent)",
            color: "white",
            border: "none",
            borderRadius: "var(--portal-radius-md)",
            fontSize: "var(--portal-font-size-sm)",
            fontWeight: "var(--portal-font-weight-medium)",
            cursor: "pointer",
            transition: "opacity var(--portal-transition)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Try Again
        </button>
      </div>
    </PortalCard>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Convert Tasks & Notifications to Unified Activity Items
 * ──────────────────────────────────────────────────────────────────────────── */

function convertTaskToActivity(task: TaskCard): ActivityItem {
  const iconMap: Record<TaskCard["type"], { emoji: string; bg: string }> = {
    invoice: { emoji: "💳", bg: "var(--portal-accent-soft)" },
    contract: { emoji: "📝", bg: "var(--portal-info-soft)" },
    appointment: { emoji: "📅", bg: "var(--portal-success-soft)" },
    document: { emoji: "📄", bg: "var(--portal-warning-soft)" },
    offspring: { emoji: "🐕", bg: "var(--portal-accent-muted)" },
  };

  const icon = iconMap[task.type] || iconMap.document;

  // Map task status to activity status variant
  let statusVariant: ActivityItem["statusVariant"];
  let statusLabel: string;

  if (task.status === "overdue") {
    statusVariant = "error";
    statusLabel = "Overdue";
  } else if (task.urgency === "completed") {
    statusVariant = "success";
    statusLabel = "Complete";
  } else if (task.urgency === "action_required") {
    statusVariant = "action";
    statusLabel = "Action Required";
  } else {
    statusVariant = "neutral";
    statusLabel = "Upcoming";
  }

  return {
    id: `task-${task.id}`,
    type: task.type === "contract" ? "agreement" : task.type,
    urgency: task.urgency,
    icon,
    title: task.title,
    subtitle: task.subtitle,
    statusLabel,
    statusVariant,
    href: task.href,
    note: task.note,
  };
}

function convertNotificationToActivity(notification: Notification): ActivityItem {
  const iconMap: Record<Notification["type"], { emoji: string; bg: string }> = {
    message_received: { emoji: "💬", bg: "var(--portal-accent-soft)" },
    invoice_issued: { emoji: "💳", bg: "var(--portal-info-soft)" },
    invoice_overdue: { emoji: "⚠️", bg: "var(--portal-error-soft)" },
    agreement_sent: { emoji: "📝", bg: "var(--portal-warning-soft)" },
    agreement_signed: { emoji: "✅", bg: "var(--portal-success-soft)" },
    offspring_ready: { emoji: "🐕", bg: "var(--portal-accent-muted)" },
  };

  const icon = iconMap[notification.type] || { emoji: "📌", bg: "var(--portal-bg-elevated)" };

  // All notifications are "updates" unless they're overdue
  let urgency: ActivityItem["urgency"] = "update";
  let statusVariant: ActivityItem["statusVariant"] = "neutral";
  let statusLabel = "Update";

  if (notification.type === "invoice_overdue") {
    urgency = "overdue";
    statusVariant = "error";
    statusLabel = "Overdue";
  } else if (notification.type.includes("signed") || notification.type.includes("ready")) {
    statusVariant = "success";
    statusLabel = "Complete";
  }

  return {
    id: `notification-${notification.id}`,
    type: notification.type.includes("message") ? "message" : notification.type.includes("invoice") ? "invoice" : notification.type.includes("agreement") ? "agreement" : notification.type.includes("offspring") ? "offspring" : "document",
    urgency,
    icon,
    title: notification.title,
    subtitle: notification.subtitle,
    statusLabel,
    statusVariant,
    href: notification.href,
    timestamp: notification.timestamp,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ──────────────────────────────────────────────────────────────────────────── */

export default function PortalActivityPage() {
  const { tenantSlug, isReady } = useTenantContext();
  const { tasks, loading: tasksLoading, error: tasksError } = usePortalTasks();
  const { notifications, loading: notificationsLoading, error: notificationsError } = usePortalNotifications();
  const [primaryAnimal, setPrimaryAnimal] = React.useState<any>(null);

  // Animal context - only set if we have real placement data
  const animalName = primaryAnimal?.offspring?.name || null;
  const species = primaryAnimal?.offspring?.species || primaryAnimal?.species || null;
  const breed = primaryAnimal?.offspring?.breed || primaryAnimal?.breed || null;

  // Load primary animal context - wait for tenant context
  React.useEffect(() => {
    if (!isReady) return;

    const portalFetch = createPortalFetch(tenantSlug);
    let cancelled = false;

    async function loadAnimalContext() {
      try {
        const data = await portalFetch<{ placements: any[] }>("/portal/placements");
        if (cancelled) return;
        const placements = data.placements || [];
        if (placements.length > 0) {
          setPrimaryAnimal(placements[0]);
        }
      } catch (err) {
        // Silently ignore - animal context is optional for display
      }
    }
    loadAnimalContext();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug, isReady]);

  const handleRetry = () => {
    window.location.reload();
  };

  // Convert tasks and notifications to unified activity items
  const taskActivities = tasks.map(convertTaskToActivity);
  const notificationActivities = notifications.map(convertNotificationToActivity);

  // Merge and deduplicate by composite ID
  const allActivities = [...taskActivities, ...notificationActivities];
  const seenIds = new Set<string>();
  const uniqueActivities = allActivities.filter((activity) => {
    if (seenIds.has(activity.id)) return false;
    seenIds.add(activity.id);
    return true;
  });

  // Group activities by urgency
  const overdue = uniqueActivities.filter((a) => a.urgency === "overdue");
  const actionRequired = uniqueActivities.filter((a) => a.urgency === "action_required");
  const updates = uniqueActivities.filter((a) => a.urgency === "update");
  const completed = uniqueActivities.filter((a) => a.urgency === "completed");

  const actionCount = overdue.length + actionRequired.length;

  // Loading state
  const loading = tasksLoading || notificationsLoading;
  if (loading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  // Error state
  const error = tasksError || notificationsError;
  if (error) {
    return (
      <PageContainer>
        <ErrorState error={error} onRetry={handleRetry} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
        {/* Hero */}
        <PortalHero
          variant="page"
          title="Activity"
          subtitle={animalName ? `What needs your attention for ${animalName}` : "What needs your attention"}
          animalContext={animalName ?? undefined}
          status={actionCount > 0 ? "action" : "success"}
          statusLabel={actionCount > 0 ? `${actionCount} need attention` : "All caught up"}
          actionCount={actionCount > 0 ? actionCount : undefined}
          actionLabel={actionCount === 1 ? "item needs attention" : "items need attention"}
        />

        {/* Subject Header - Only show when we have real placement data */}
        {animalName && (
          <SubjectHeader
            name={animalName}
            species={species}
            breed={breed}
            statusLabel={actionCount > 0 ? `${actionCount} pending` : "All complete"}
            statusVariant={actionCount > 0 ? "action" : "success"}
          />
        )}

        {/* Activity Groups */}
        {uniqueActivities.length === 0 ? (
          <EmptyActivity />
        ) : (
          <>
            <ActivityGroup title="Overdue" activities={overdue} />
            <ActivityGroup title="Action Required" activities={actionRequired} />
            <ActivityGroup title="Updates" activities={updates} />
            <ActivityGroup
              title="Completed"
              activities={completed}
              collapsible
              defaultCollapsed={completed.length > 0 && (overdue.length > 0 || actionRequired.length > 0 || updates.length > 0)}
            />
          </>
        )}
      </div>
    </PageContainer>
  );
}
