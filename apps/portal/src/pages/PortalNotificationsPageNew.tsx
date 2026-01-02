// apps/portal/src/pages/PortalNotificationsPageNew.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { PortalHero } from "../design/PortalHero";
import { PortalCard, CardRow } from "../design/PortalCard";
import { usePortalNotifications, type Notification } from "../notifications/notificationSources";
import { isPortalMockEnabled } from "../dev/mockFlag";
import { DemoBanner } from "../dev/DemoBanner";
import { mockOffspring } from "../dev/mockData";

/* ────────────────────────────────────────────────────────────────────────────
 * Notification Type Icon
 * ──────────────────────────────────────────────────────────────────────────── */

function NotificationIcon({ type }: { type: Notification["type"] }) {
  const iconMap: Record<Notification["type"], { emoji: string; bg: string }> = {
    message_received: { emoji: "💬", bg: "var(--portal-accent-soft)" },
    invoice_issued: { emoji: "💳", bg: "var(--portal-info-soft)" },
    invoice_overdue: { emoji: "⚠️", bg: "var(--portal-error-soft)" },
    agreement_sent: { emoji: "📝", bg: "var(--portal-warning-soft)" },
    agreement_signed: { emoji: "✅", bg: "var(--portal-success-soft)" },
    offspring_ready: { emoji: "🐕", bg: "var(--portal-accent-muted)" },
  };

  const config = iconMap[type] || { emoji: "📌", bg: "var(--portal-bg-elevated)" };

  return (
    <div
      style={{
        width: "44px",
        height: "44px",
        borderRadius: "var(--portal-radius-lg)",
        background: config.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.25rem",
        flexShrink: 0,
      }}
    >
      {config.emoji}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Time Formatter
 * ──────────────────────────────────────────────────────────────────────────── */

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Notification Row Component
 * ──────────────────────────────────────────────────────────────────────────── */

interface NotificationRowProps {
  notification: Notification & { read?: boolean };
}

function NotificationRow({ notification }: NotificationRowProps) {
  const handleClick = () => {
    window.location.href = notification.href;
  };

  const isUnread = notification.read === false;
  const timeStr = formatRelativeTime(notification.timestamp);

  return (
    <CardRow onClick={handleClick}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--portal-space-3)" }}>
        <NotificationIcon type={notification.type} />

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
                fontWeight: isUnread
                  ? "var(--portal-font-weight-semibold)"
                  : "var(--portal-font-weight-medium)",
                color: "var(--portal-text-primary)",
              }}
            >
              {notification.title}
            </div>
            {isUnread && (
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "var(--portal-accent)",
                  boxShadow: "0 0 8px var(--portal-accent)",
                  flexShrink: 0,
                }}
              />
            )}
          </div>

          <div
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-tertiary)",
            }}
          >
            {timeStr}
          </div>
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
 * Notification Group (Today, Earlier This Week, Older)
 * ──────────────────────────────────────────────────────────────────────────── */

interface NotificationGroupProps {
  title: string;
  notifications: (Notification & { read?: boolean })[];
}

function NotificationGroup({ title, notifications }: NotificationGroupProps) {
  if (notifications.length === 0) return null;

  return (
    <div style={{ marginBottom: "var(--portal-space-5)" }}>
      <h2
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
        {title}
      </h2>
      <PortalCard variant="elevated" padding="none">
        {notifications.map((notification) => (
          <NotificationRow key={notification.id} notification={notification} />
        ))}
      </PortalCard>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Empty State
 * ──────────────────────────────────────────────────────────────────────────── */

function EmptyNotifications({ animalName }: { animalName: string }) {
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
            background: "var(--portal-bg-elevated)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
          }}
        >
          🔔
        </div>
        <h3
          style={{
            fontSize: "var(--portal-font-size-lg)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            margin: 0,
          }}
        >
          No recent updates
        </h3>
        <p
          style={{
            fontSize: "var(--portal-font-size-base)",
            color: "var(--portal-text-secondary)",
            margin: 0,
            maxWidth: "320px",
          }}
        >
          Updates about {animalName}'s journey from the last 7 days will appear here.
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
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            height: "80px",
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
          Unable to load notifications
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
 * Group Notifications by Time
 * ──────────────────────────────────────────────────────────────────────────── */

function groupByTime(notifications: (Notification & { read?: boolean })[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const todayItems: (Notification & { read?: boolean })[] = [];
  const yesterdayItems: (Notification & { read?: boolean })[] = [];
  const thisWeekItems: (Notification & { read?: boolean })[] = [];
  const olderItems: (Notification & { read?: boolean })[] = [];

  for (const notif of notifications) {
    const notifDate = new Date(notif.timestamp);
    if (notifDate >= today) {
      todayItems.push(notif);
    } else if (notifDate >= yesterday) {
      yesterdayItems.push(notif);
    } else if (notifDate >= weekAgo) {
      thisWeekItems.push(notif);
    } else {
      olderItems.push(notif);
    }
  }

  return { todayItems, yesterdayItems, thisWeekItems, olderItems };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ──────────────────────────────────────────────────────────────────────────── */

export default function PortalNotificationsPageNew() {
  const { notifications, loading, error } = usePortalNotifications();
  const mockEnabled = isPortalMockEnabled();

  // Get primary animal name for context
  const offspring = mockEnabled ? mockOffspring() : [];
  const primaryAnimal = offspring[0];
  const animalName = primaryAnimal?.offspring?.name || "your puppy";

  const handleRetry = () => {
    window.location.reload();
  };

  // Count unread
  const unreadCount = notifications.filter((n) => n.read === false).length;

  // Group by time
  const { todayItems, yesterdayItems, thisWeekItems, olderItems } = groupByTime(notifications);

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
        <ErrorState error={error} onRetry={handleRetry} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {mockEnabled && (
        <div style={{ marginBottom: "var(--portal-space-3)" }}>
          <DemoBanner />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
        {/* Hero */}
        <PortalHero
          variant="page"
          title="Notifications"
          subtitle={`Recent updates about ${animalName}'s journey`}
          animalContext={animalName}
          status={unreadCount > 0 ? "action" : "info"}
          statusLabel={unreadCount > 0 ? `${unreadCount} new` : "All read"}
        />

        {/* Notification Groups */}
        {notifications.length === 0 ? (
          <EmptyNotifications animalName={animalName} />
        ) : (
          <>
            <NotificationGroup title="Today" notifications={todayItems} />
            <NotificationGroup title="Yesterday" notifications={yesterdayItems} />
            <NotificationGroup title="This Week" notifications={thisWeekItems} />
            <NotificationGroup title="Older" notifications={olderItems} />
          </>
        )}
      </div>
    </PageContainer>
  );
}
