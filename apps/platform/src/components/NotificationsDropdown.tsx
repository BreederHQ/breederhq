// apps/platform/src/components/NotificationsDropdown.tsx
// Notifications dropdown showing various notification types

import * as React from "react";

export interface Notification {
  id: string;
  type: "message" | "task" | "waitlist" | "offspring" | "system" | "vaccination" | "breeding" | "foaling";
  title: string;
  body: string;
  href?: string;
  createdAt: Date;
  read: boolean;
}

interface NotificationsDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onClose: () => void;
  onMarkAllRead?: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

const typeIcons: Record<Notification["type"], string> = {
  message: "💬",
  task: "✅",
  waitlist: "📋",
  offspring: "🍼",
  system: "🔔",
  vaccination: "💉",
  breeding: "🐴",
  foaling: "🐎",
};

const typeLabels: Record<Notification["type"], string> = {
  message: "Message",
  task: "Task",
  waitlist: "Waitlist",
  offspring: "Offspring",
  system: "System",
  vaccination: "Vaccination",
  breeding: "Breeding",
  foaling: "Foaling",
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function NotificationsDropdown({
  notifications,
  unreadCount,
  onClose,
  onMarkAllRead,
  onNotificationClick,
}: NotificationsDropdownProps) {
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Close on Escape
  React.useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleNotificationClick = (notification: Notification) => {
    onNotificationClick?.(notification);
    if (notification.href) {
      window.location.assign(notification.href);
    }
    onClose();
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 max-h-[480px] overflow-hidden rounded-lg border border-hairline bg-surface shadow-xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-hairline bg-surface-strong">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-[hsl(var(--brand-orange))] text-white">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && onMarkAllRead && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">
            <div className="text-2xl mb-2">🔔</div>
            No notifications yet
          </div>
        ) : (
          <div className="divide-y divide-hairline">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full px-4 py-3 text-left hover:bg-surface-strong transition-colors ${
                  !notification.read ? "bg-[hsl(var(--brand-orange))]/5" : ""
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-strong flex items-center justify-center text-base">
                    {typeIcons[notification.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {typeLabels[notification.type]}
                      </span>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-[hsl(var(--brand-orange))]" />
                      )}
                    </div>
                    <div className="font-medium text-sm truncate">{notification.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{notification.body}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {formatTimeAgo(notification.createdAt)}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer - hidden since we don't have a dedicated notifications page yet */}
      {/* If we add a notifications page in the future, uncomment this:
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-hairline bg-surface-strong">
          <button
            onClick={() => {
              window.location.assign("/notifications");
              onClose();
            }}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            View all notifications
          </button>
        </div>
      )}
      */}
    </div>
  );
}

export default NotificationsDropdown;
