// apps/portal/src/pages/PortalNotificationsPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { usePortalNotifications, type Notification } from "../notifications/notificationSources";

/* ───────────────── Notification Row Component ───────────────── */

function NotificationRow({ notification }: { notification: Notification }) {
  const [isHovered, setIsHovered] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Click navigates to source
    window.location.href = notification.href;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      const mins = Math.floor(diffMs / (1000 * 60));
      return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    } else if (diffDays < 7) {
      const days = Math.floor(diffDays);
      return `${days} day${days !== 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  return (
    <a
      href={notification.href}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--portal-space-1)",
        padding: "var(--portal-space-3) 0",
        borderBottom: "1px solid var(--portal-border-subtle)",
        textDecoration: "none",
        cursor: "pointer",
        transition: "background var(--portal-transition)",
        background: isHovered ? "var(--portal-bg-elevated)" : "transparent",
      }}
    >
      <div
        style={{
          fontSize: "var(--portal-font-size-base)",
          fontWeight: "var(--portal-font-weight-medium)",
          color: "var(--portal-text-primary)",
        }}
      >
        {notification.title}
      </div>
      <div
        style={{
          fontSize: "var(--portal-font-size-sm)",
          color: "var(--portal-text-secondary)",
        }}
      >
        {formatTimestamp(notification.timestamp)}
      </div>
    </a>
  );
}

/* ───────────────── Empty State ───────────────── */

function EmptyNotifications() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: "60vh",
        gap: "var(--portal-space-2)",
      }}
    >
      <h1
        style={{
          fontSize: "var(--portal-font-size-xl)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          margin: 0,
        }}
      >
        No recent updates
      </h1>
      <p
        style={{
          fontSize: "var(--portal-font-size-base)",
          color: "var(--portal-text-secondary)",
          margin: 0,
        }}
      >
        Updates from the last 7 days will appear here.
      </p>
    </div>
  );
}

/* ───────────────── Loading State ───────────────── */

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            height: "60px",
            background: "var(--portal-bg-elevated)",
            borderRadius: "var(--portal-radius-md)",
          }}
        />
      ))}
    </div>
  );
}

/* ───────────────── Error State ───────────────── */

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
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
      <h1
        style={{
          fontSize: "var(--portal-font-size-xl)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          margin: 0,
        }}
      >
        Something went wrong
      </h1>
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
          fontSize: "var(--portal-font-size-base)",
          fontWeight: "var(--portal-font-weight-medium)",
          padding: "var(--portal-space-2) var(--portal-space-3)",
          background: "var(--portal-accent)",
          color: "var(--portal-text-primary)",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "var(--portal-accent)",
          borderRadius: "var(--portal-radius-md)",
          cursor: "pointer",
          transition: "all var(--portal-transition)",
        }}
      >
        Retry
      </button>
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function PortalNotificationsPage() {
  const { notifications, loading, error } = usePortalNotifications();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <PageContainer>
      <h1
        style={{
          fontSize: "var(--portal-font-size-xl)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          marginBottom: "var(--portal-space-4)",
        }}
      >
        Notifications
      </h1>

      {loading && <LoadingSkeleton />}

      {!loading && error && <ErrorState error={error} onRetry={handleRetry} />}

      {!loading && !error && (
        notifications.length === 0 ? (
          <EmptyNotifications />
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {notifications.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} />
            ))}
          </div>
        )
      )}
    </PageContainer>
  );
}
