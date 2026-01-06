// apps/portal/src/components/PortalLayout.tsx
import * as React from "react";
import { HeaderBar } from "../design/HeaderBar";
import { TopNav } from "../design/TopNav";
import { Footer } from "../design/Footer";
import { usePortalContext } from "../hooks/usePortalContext";
import { usePortalTasks } from "../tasks/taskSources";
import { usePortalNotifications } from "../notifications/notificationSources";
import { BuildStamp } from "../dev/BuildStamp";
import { useUnreadMessageCount } from "../hooks/useUnreadMessageCount";

interface PortalLayoutProps {
  children: React.ReactNode;
  currentPath: string;
}

function OrgIdentity({
  orgName,
  orgInitial,
  onClick,
}: {
  orgName: string | null;
  orgInitial: string | null;
  onClick: () => void;
}) {
  const displayInitial = orgInitial || "A";
  const displayName = orgName || "Acme Breeding Co.";

  return (
    <button
      onClick={onClick}
      style={{
        all: "unset",
        display: "flex",
        alignItems: "center",
        gap: "var(--portal-space-2)",
        flexShrink: 0,
        cursor: "pointer",
        transition: "opacity var(--portal-transition)",
      }}
      title="Home"
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "0.8";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "1";
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "var(--portal-radius-md)",
          background: "var(--portal-accent)",
          color: "var(--portal-text-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "var(--portal-font-weight-semibold)",
          fontSize: "var(--portal-font-size-base)",
        }}
      >
        {displayInitial}
      </div>
      <span
        style={{
          fontSize: "var(--portal-font-size-base)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          whiteSpace: "nowrap",
        }}
      >
        {displayName}
      </span>
    </button>
  );
}

export function PortalLayout({ children, currentPath }: PortalLayoutProps) {
  const { orgName, loading } = usePortalContext();
  const { tasks } = usePortalTasks();
  const { notifications } = usePortalNotifications();
  const { unreadCount: unreadMessageCount } = useUnreadMessageCount();

  // Derive org initial from org name
  const orgInitial = orgName ? orgName.charAt(0).toUpperCase() : null;

  // Calculate badge counts
  const actionRequiredCount = tasks.filter((t) => t.urgency === "action_required").length;
  const notificationsCount = notifications.length;

  const navItems = [
    {
      label: "Tasks",
      href: "/tasks",
      active: currentPath.startsWith("/tasks"),
      badge: actionRequiredCount > 0 ? actionRequiredCount : undefined,
    },
    {
      label: "Messages",
      href: "/messages",
      active: currentPath.startsWith("/messages"),
    },
    { label: "Agreements", href: "/agreements", active: currentPath.startsWith("/agreements") },
    { label: "Documents", href: "/documents", active: currentPath.startsWith("/documents") },
    { label: "Financials", href: "/financials", active: currentPath.startsWith("/financials") },
    { label: "Offspring", href: "/offspring", active: currentPath.startsWith("/offspring") },
    { label: "Profile", href: "/profile", active: currentPath.startsWith("/profile") },
  ];

  const handleNavigateHome = () => {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleLogout = () => {
    window.location.href = "/logout";
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--portal-bg)", display: "flex", flexDirection: "column" }}>
      <HeaderBar>
        <OrgIdentity orgName={orgName} orgInitial={orgInitial} onClick={handleNavigateHome} />
        {/* Wrapper constrains TopNav so it can scroll horizontally */}
        <div style={{ flex: "1 1 0%", minWidth: 0, overflow: "hidden" }}>
          <TopNav items={navItems} />
        </div>
        {/* Messages icon */}
        <button
          onClick={() => {
            window.history.pushState({}, "", "/messages");
            window.dispatchEvent(new PopStateEvent("popstate"));
          }}
          style={{
            all: "unset",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            cursor: "pointer",
            flexShrink: 0,
            color: currentPath.startsWith("/messages")
              ? "var(--portal-text-primary)"
              : "var(--portal-text-secondary)",
            transition: "color var(--portal-transition)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--portal-text-primary)";
          }}
          onMouseLeave={(e) => {
            if (!currentPath.startsWith("/messages")) {
              e.currentTarget.style.color = "var(--portal-text-secondary)";
            }
          }}
          title="Messages"
          aria-label={`Messages${unreadMessageCount > 0 ? ` (${unreadMessageCount} unread)` : ""}`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {/* Unread message badge */}
          {unreadMessageCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "2px",
                right: "2px",
                minWidth: "16px",
                height: "16px",
                padding: "0 4px",
                background: "var(--portal-accent)",
                borderRadius: "8px",
                border: "2px solid var(--portal-bg-elevated)",
                fontSize: "10px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
            </span>
          )}
        </button>
        {/* Notifications bell icon */}
        <button
          onClick={() => {
            window.history.pushState({}, "", "/notifications");
            window.dispatchEvent(new PopStateEvent("popstate"));
          }}
          style={{
            all: "unset",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            cursor: "pointer",
            flexShrink: 0,
            color: currentPath.startsWith("/notifications")
              ? "var(--portal-text-primary)"
              : "var(--portal-text-secondary)",
            transition: "color var(--portal-transition)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--portal-text-primary)";
          }}
          onMouseLeave={(e) => {
            if (!currentPath.startsWith("/notifications")) {
              e.currentTarget.style.color = "var(--portal-text-secondary)";
            }
          }}
          title="Notifications"
          aria-label={`Notifications${notificationsCount > 0 ? ` (${notificationsCount} new)` : ""}`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {/* Notification dot */}
          {notificationsCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "2px",
                right: "2px",
                width: "8px",
                height: "8px",
                background: "var(--portal-accent)",
                borderRadius: "50%",
                border: "2px solid var(--portal-bg-elevated)",
              }}
            />
          )}
        </button>
        {/* Sign out button - always visible on right side */}
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--portal-space-1)",
            padding: "var(--portal-space-1) var(--portal-space-2)",
            fontSize: "var(--portal-font-size-sm)",
            fontWeight: "var(--portal-font-weight-medium)",
            color: "var(--portal-text-secondary)",
            background: "transparent",
            border: "1px solid var(--portal-border-subtle)",
            borderRadius: "var(--portal-radius-md)",
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: "all var(--portal-transition)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--portal-text-primary)";
            e.currentTarget.style.borderColor = "var(--portal-border)";
            e.currentTarget.style.background = "var(--portal-bg-elevated)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--portal-text-secondary)";
            e.currentTarget.style.borderColor = "var(--portal-border-subtle)";
            e.currentTarget.style.background = "transparent";
          }}
          aria-label="Sign out"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Sign out</span>
        </button>
      </HeaderBar>
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
      <BuildStamp />
    </div>
  );
}
