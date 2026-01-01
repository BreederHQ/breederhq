// apps/portal/src/pages/PortalNotificationsPage.tsx
import * as React from "react";
import { PageHeader, Button, Badge } from "@bhq/ui";
import { usePortalNotifications, type Notification, type NotificationType } from "../notifications/notificationSources";

/* ───────────────── Notification Row Component ───────────────── */

function NotificationRow({ notification }: { notification: Notification }) {
  const typeVariants: Record<NotificationType, "blue" | "green" | "red" | "amber" | "neutral"> = {
    message_received: "blue",
    invoice_issued: "neutral",
    invoice_overdue: "red",
    agreement_sent: "amber",
    agreement_signed: "green",
    offspring_ready: "green",
  };

  const typeIcons: Record<NotificationType, string> = {
    message_received: "💬",
    invoice_issued: "📄",
    invoice_overdue: "⚠️",
    agreement_sent: "📝",
    agreement_signed: "✅",
    offspring_ready: "🐾",
  };

  const handleClick = () => {
    // Cross-module links (e.g., /finance/*) require full page navigation
    // Intra-portal links (e.g., /portal/*) use SPA navigation
    if (notification.href.startsWith("/portal")) {
      window.history.pushState(null, "", notification.href);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else {
      window.location.href = notification.href;
    }
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
    <div
      className="p-4 rounded-lg border border-hairline bg-surface/50 hover:bg-surface transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{typeIcons[notification.type]}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-primary">{notification.title}</div>
          <p className="text-xs text-secondary mt-1">{formatTimestamp(notification.timestamp)}</p>
        </div>
        <Badge variant={typeVariants[notification.type]} className="flex-shrink-0">
          {notification.type.replace(/_/g, " ")}
        </Badge>
      </div>
    </div>
  );
}

/* ───────────────── Empty State ───────────────── */

function EmptyNotifications() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-strong flex items-center justify-center text-3xl">
        🔔
      </div>
      <h3 className="text-lg font-medium text-primary mb-2">No recent activity</h3>
      <p className="text-sm text-secondary max-w-sm mx-auto">
        Notifications from the last 7 days will appear here. This includes new messages,
        invoices, agreements, and offspring updates.
      </p>
    </div>
  );
}

/* ───────────────── Loading State ───────────────── */

function LoadingNotifications() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-strong flex items-center justify-center text-2xl animate-pulse">
        🔔
      </div>
      <h3 className="text-lg font-medium text-primary mb-2">Loading notifications...</h3>
      <p className="text-sm text-secondary">Checking for recent activity</p>
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function PortalNotificationsPage() {
  const { notifications, loading, error } = usePortalNotifications();

  const handleBackClick = () => {
    window.history.pushState(null, "", "/portal");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Notifications"
        subtitle={
          loading
            ? "Loading..."
            : notifications.length === 0
            ? "No recent activity"
            : `${notifications.length} notification${notifications.length !== 1 ? "s" : ""} in the last 7 days`
        }
        actions={
          <Button variant="secondary" onClick={handleBackClick}>
            Back to Portal
          </Button>
        }
      />

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mt-8">
        {loading ? (
          <LoadingNotifications />
        ) : notifications.length === 0 ? (
          <EmptyNotifications />
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
