// apps/portal/src/components/PortalLayout.tsx
import * as React from "react";
import { HeaderBar } from "../design/HeaderBar";
import { TopNav } from "../design/TopNav";
import { Footer } from "../design/Footer";
import { usePortalContext } from "../hooks/usePortalContext";

interface PortalLayoutProps {
  children: React.ReactNode;
  currentPath: string;
}

function OrgIdentity({ orgName, orgInitial }: { orgName: string | null; orgInitial: string | null }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--portal-space-2)" }}>
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
        {orgInitial || "?"}
      </div>
      <span
        style={{
          fontSize: "var(--portal-font-size-lg)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
        }}
      >
        {orgName || "Portal"}
      </span>
    </div>
  );
}

export function PortalLayout({ children, currentPath }: PortalLayoutProps) {
  const { orgName, loading } = usePortalContext();

  // Derive org initial from org name
  const orgInitial = orgName ? orgName.charAt(0).toUpperCase() : null;

  const navItems = [
    { label: "Dashboard", href: "/", active: currentPath === "/" },
    { label: "Messages", href: "/messages", active: currentPath.startsWith("/messages") },
    { label: "Tasks", href: "/tasks", active: currentPath.startsWith("/tasks") },
    { label: "Notifications", href: "/notifications", active: currentPath.startsWith("/notifications") },
    { label: "Agreements", href: "/agreements", active: currentPath.startsWith("/agreements") },
    { label: "Documents", href: "/documents", active: currentPath.startsWith("/documents") },
    { label: "Offspring", href: "/offspring", active: currentPath.startsWith("/offspring") },
    { label: "Profile", href: "/profile", active: currentPath.startsWith("/profile") },
    { label: "Logout", href: "/logout", active: currentPath === "/logout" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--portal-bg)" }}>
      <HeaderBar>
        <OrgIdentity orgName={orgName} orgInitial={orgInitial} />
        <TopNav items={navItems} />
      </HeaderBar>
      <main>{children}</main>
      <Footer />
    </div>
  );
}
