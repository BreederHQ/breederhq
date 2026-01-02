// apps/portal/src/components/PortalLayout.tsx
import * as React from "react";
import { HeaderBar } from "../design/HeaderBar";
import { TopNav } from "../design/TopNav";
import { Footer } from "../design/Footer";
import { usePortalContext } from "../hooks/usePortalContext";
import { usePortalTasks } from "../tasks/taskSources";
import { usePortalNotifications } from "../notifications/notificationSources";
import { BuildStamp } from "../dev/BuildStamp";
import { DemoModeToggle } from "../dev/DemoModeToggle";

interface PortalLayoutProps {
  children: React.ReactNode;
  currentPath: string;
}

function OrgIdentity({ orgName, orgInitial }: { orgName: string | null; orgInitial: string | null }) {
  const displayName = orgName || "Acme Breeding Co.";
  const displayInitial = orgInitial || "A";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--portal-space-2)", flexShrink: 0 }}>
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
          fontSize: "var(--portal-font-size-lg)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          whiteSpace: "nowrap",
        }}
      >
        {displayName}
      </span>
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
    { label: "Logout", href: "/logout", active: currentPath === "/logout" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--portal-bg)", display: "flex", flexDirection: "column" }}>
      <HeaderBar>
        <OrgIdentity orgName={orgName} orgInitial={orgInitial} />
        <TopNav items={navItems} />
        <DemoModeToggle />
      </HeaderBar>
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
      <BuildStamp />
    </div>
  );
}
