// apps/marketplace/src/marketplace/pages/UpdatesPage.tsx
// Notifications surface for messaging activity - "New reply from {Breeder}"
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { isDemoMode, setDemoMode } from "../../demo/demoMode";
import { useUnreadCounts, useMarkRead } from "../../messages/hooks";
import { getConversations, getMessages } from "../../messages/store";
import { generateDemoActivity, seedDemoConversations } from "../../messages/demoData";
import type { Conversation } from "../../messages/types";


interface NotificationItem {
  id: string;
  conversationId: string;
  breederName: string;
  breederSlug: string;
  contextLabel: string | null;
  messagePreview: string;
  timestamp: Date;
  isRead: boolean;
}

/**
 * Updates page - notifications about messaging activity.
 * Shows "New reply from {Breeder}" notifications for unread messages.
 * Includes "Generate demo activity" button in demo mode.
 */
export function UpdatesPage() {
  const navigate = useNavigate();
  const demoMode = isDemoMode();
  const { totalUnread, unreadConversations, refresh } = useUnreadCounts();
  const { markAllRead } = useMarkRead();
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Seed demo data on first load
  React.useEffect(() => {
    if (demoMode) {
      seedDemoConversations();
    }
  }, [demoMode]);

  // Build notifications from conversations with unread messages
  React.useEffect(() => {
    if (!demoMode) {
      setLoading(false);
      return;
    }

    const buildNotifications = () => {
      const conversations = getConversations();
      const items: NotificationItem[] = [];

      for (const conv of conversations) {
        const messages = getMessages(conv.id);
        // Get the last message from breeder (if any)
        const lastBreederMessage = [...messages]
          .reverse()
          .find((m) => m.senderType === "breeder" || m.senderType === "service_provider");

        // Find the breeder/service provider participant
        const breederParticipant = conv.participants.find(
          (p) => p.type === "breeder" || p.type === "service_provider"
        );

        if (lastBreederMessage && breederParticipant) {
          const isRead = conv.lastReadAt
            ? new Date(lastBreederMessage.createdAt) <= new Date(conv.lastReadAt)
            : false;

          items.push({
            id: `${conv.id}-${lastBreederMessage.id}`,
            conversationId: conv.id,
            breederName: breederParticipant.name,
            breederSlug: breederParticipant.slug || "",
            contextLabel: getContextLabel(conv),
            messagePreview: truncateMessage(lastBreederMessage.content),
            timestamp: new Date(lastBreederMessage.createdAt),
            isRead,
          });
        }
      }

      // Sort by timestamp, newest first
      items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setNotifications(items);
      setLoading(false);
    };

    buildNotifications();

    // Poll for updates
    const interval = setInterval(buildNotifications, 2000);
    return () => clearInterval(interval);
  }, [demoMode]);

  // Handle enabling demo mode
  const handleEnableDemo = () => {
    setDemoMode(true);
    window.location.reload();
  };

  // Handle generate demo activity
  const handleGenerateActivity = () => {
    const added = generateDemoActivity();
    if (added > 0) {
      refresh();
    }
  };

  // Handle notification click - navigate to conversation
  const handleNotificationClick = (notif: NotificationItem) => {
    navigate(`/inquiries?c=${notif.conversationId}`);
  };

  // Handle mark all as read
  const handleMarkAllRead = () => {
    markAllRead();
    refresh();
  };

  // Real mode: show coming soon state
  if (!demoMode) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
            Updates
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            Notifications when breeders reply to your messages.
          </p>
        </div>

        <div className="rounded-portal border border-border-subtle bg-portal-card p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-border-default flex items-center justify-center">
            <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Updates are coming soon</h2>
          <p className="text-sm text-text-tertiary mb-6 max-w-md mx-auto">
            You'll receive notifications when breeders respond to your messages. In the meantime, browse breeders to find animals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/breeders"
              className="inline-flex items-center px-5 py-2.5 rounded-portal-xs bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              Browse breeders
            </Link>
            <button
              type="button"
              onClick={handleEnableDemo}
              className="text-sm text-text-tertiary hover:text-white transition-colors"
            >
              Preview with demo data
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Demo mode: show notifications
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
            Updates
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            Notifications when breeders reply to your messages.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {notifications.some((n) => !n.isRead) && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-sm text-text-secondary hover:text-white transition-colors"
            >
              Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={handleGenerateActivity}
            className="inline-flex items-center px-3 py-1.5 rounded-portal-xs border border-border-subtle bg-portal-card text-sm text-white hover:bg-portal-card-hover transition-colors"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate demo activity
          </button>
        </div>
      </div>

      {loading ? (
        // Loading state
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-portal border border-border-subtle bg-portal-card p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-border-default" />
                <div className="flex-1">
                  <div className="h-4 bg-border-default rounded w-3/4 mb-2" />
                  <div className="h-3 bg-border-default rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        // Empty state
        <div className="rounded-portal border border-border-subtle bg-portal-card p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-border-default flex items-center justify-center">
            <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No updates yet</h2>
          <p className="text-sm text-text-tertiary mb-6 max-w-md mx-auto">
            When breeders reply to your messages, notifications will appear here. Try generating some demo activity!
          </p>
          <Link
            to="/inquiries"
            className="inline-flex items-center px-5 py-2.5 rounded-portal-xs bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            View messages
          </Link>
        </div>
      ) : (
        // Notification list
        <div className="space-y-3">
          {notifications.map((notif) => (
            <NotificationRow
              key={notif.id}
              notification={notif}
              onClick={() => handleNotificationClick(notif)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  notification,
  onClick,
}: {
  notification: NotificationItem;
  onClick: () => void;
}) {
  const timeAgo = formatTimeAgo(notification.timestamp);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-portal border bg-portal-card p-4 transition-colors hover:bg-portal-card-hover ${
        notification.isRead ? "border-border-subtle" : "border-accent/40"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          notification.isRead ? "bg-border-default" : "bg-accent/15"
        }`}>
          <svg
            className={`w-4 h-4 ${notification.isRead ? "text-text-muted" : "text-accent"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={`text-[15px] ${notification.isRead ? "text-text-secondary" : "text-white font-medium"}`}>
              New reply from {notification.breederName}
            </p>
            {!notification.isRead && (
              <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-text-tertiary truncate">{notification.messagePreview}</p>
          {notification.contextLabel && (
            <p className="text-xs text-text-muted mt-1">{notification.contextLabel}</p>
          )}
        </div>

        {/* Timestamp */}
        <div className="text-[13px] text-text-tertiary flex-shrink-0">
          {timeAgo}
        </div>
      </div>
    </button>
  );
}

/**
 * Get context label for notification (listing title, service name, or "General")
 */
function getContextLabel(conv: Conversation): string | null {
  if (conv.context.type === "listing") {
    return conv.context.listingTitle || null;
  }
  if (conv.context.type === "service") {
    return conv.context.serviceName || null;
  }
  return null;
}

/**
 * Truncate message to reasonable preview length
 */
function truncateMessage(content: string, maxLength: number = 80): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength).trim() + "...";
}

/**
 * Format timestamp as relative time
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
