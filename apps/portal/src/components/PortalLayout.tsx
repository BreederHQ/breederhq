// apps/portal/src/components/PortalLayout.tsx
import * as React from "react";
import { HeaderBar } from "../design/HeaderBar";
import { TopNav } from "../design/TopNav";
import { Footer } from "../design/Footer";
import { usePortalContext } from "../hooks/usePortalContext";
import { usePortalTasks } from "../tasks/taskSources";
import { usePortalNotifications } from "../notifications/notificationSources";
import { BuildStamp } from "../dev/BuildStamp";

interface PortalLayoutProps {
  children: React.ReactNode;
  currentPath: string;
}

function OrgIdentity({ orgInitial }: { orgInitial: string | null }) {
  const displayInitial = orgInitial || "A";

  return (
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
        flexShrink: 0,
      }}
      title={`Organization`}
    >
      {displayInitial}
    </div>
  );
}

export function PortalLayout({ children, currentPath }: PortalLayoutProps) {
  const { orgName, loading } = usePortalContext();
  const { tasks } = usePortalTasks();
  const { notifications } = usePortalNotifications();

  // Derive org initial from org name
  const orgInitial = orgName ? orgName.charAt(0).toUpperCase() : null;

  // Calculate badge counts
  const actionRequiredCount = tasks.filter((t) => t.urgency === "action_required").length;
  const notificationsCount = notifications.length;

  const navItems = [
    { label: "Dashboard", href: "/", active: currentPath === "/" },
    {
      label: "Messages",
      href: "/messages",
      active: currentPath.startsWith("/messages"),
    },
    {
      label: "Tasks",
      href: "/tasks",
      active: currentPath.startsWith("/tasks"),
      badge: actionRequiredCount > 0 ? actionRequiredCount : undefined,
    },
    {
      label: "Notifications",
      href: "/notifications",
      active: currentPath.startsWith("/notifications"),
      badge: notificationsCount > 0 ? notificationsCount : undefined,
    },
    { label: "Agreements", href: "/agreements", active: currentPath.startsWith("/agreements") },
    { label: "Documents", href: "/documents", active: currentPath.startsWith("/documents") },
    { label: "Financials", href: "/financials", active: currentPath.startsWith("/financials") },
    { label: "Offspring", href: "/offspring", active: currentPath.startsWith("/offspring") },
    { label: "Profile", href: "/profile", active: currentPath.startsWith("/profile") },
  ];

  const handleLogout = () => {
    window.location.href = "/logout";
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--portal-bg)", display: "flex", flexDirection: "column" }}>
      <HeaderBar>
        <OrgIdentity orgInitial={orgInitial} />
        {/* Wrapper constrains TopNav so it can scroll horizontally */}
        <div style={{ flex: "1 1 0%", minWidth: 0, overflow: "hidden" }}>
          <TopNav items={navItems} />
        </div>
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
