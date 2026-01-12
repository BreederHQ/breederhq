// apps/portal/src/components/PortalLayout.tsx
// Premium Portal Layout - Persistent Sidebar Navigation
import * as React from "react";
import { HeaderBar } from "../design/HeaderBar";
import { Footer } from "../design/Footer";
import { usePortalContext } from "../hooks/usePortalContext";
import { usePortalTasks } from "../tasks/taskSources";
import { useUnreadMessageCount } from "../hooks/useUnreadMessageCount";
import { ThemeToggle } from "../theme/ThemeToggle";

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

// Sidebar Navigation Component
interface SidebarNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  unreadMessageCount: number;
  actionRequiredCount: number;
  isMobileOpen: boolean;
  onClose: () => void;
}

function SidebarNav({ currentPath, onNavigate, unreadMessageCount, actionRequiredCount, isMobileOpen, onClose }: SidebarNavProps) {
  const navItems = [
    {
      label: "Overview",
      path: "/",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      label: "My Animals",
      path: "/offspring",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="4" r="2" />
          <circle cx="18" cy="8" r="2" />
          <circle cx="20" cy="16" r="2" />
          <circle cx="9" cy="10" r="2" />
          <circle cx="15" cy="14" r="2" />
          <circle cx="4" cy="16" r="2" />
          <path d="M9 10 6 16" />
          <path d="M9 10l6 4" />
          <path d="M15 14l5 2" />
          <path d="M15 14l-6 4" />
        </svg>
      ),
    },
    {
      label: "Financials",
      path: "/financials",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      label: "Documents",
      path: "/documents",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      label: "Agreements",
      path: "/agreements",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      ),
    },
    {
      label: "Messages",
      path: "/messages",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      badge: unreadMessageCount,
    },
  ];

  const handleNavClick = (path: string) => {
    onNavigate(path);
    if (isMobileOpen) {
      onClose();
    }
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/" || currentPath === "";
    }
    return currentPath.startsWith(path);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
            zIndex: 999,
          }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: "fixed",
          top: "64px", // Below header
          left: isMobileOpen ? 0 : "-240px",
          bottom: 0,
          width: "240px",
          background: "var(--portal-bg-elevated)",
          borderRight: "1px solid var(--portal-border)",
          padding: "var(--portal-space-4)",
          overflowY: "auto",
          transition: "left 0.25s ease-out",
          zIndex: 1000,
        }}
        className="portal-sidebar"
      >
        <nav style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-1)" }}>
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                style={{
                  all: "unset",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--portal-space-3)",
                  padding: "var(--portal-space-3)",
                  borderRadius: "var(--portal-radius-md)",
                  cursor: "pointer",
                  color: active ? "var(--portal-text-primary)" : "var(--portal-text-secondary)",
                  background: active ? "rgba(59, 130, 246, 0.1)" : "transparent",
                  fontWeight: active ? "var(--portal-font-weight-semibold)" : "var(--portal-font-weight-normal)",
                  fontSize: "var(--portal-font-size-sm)",
                  transition: "all var(--portal-transition)",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.color = "var(--portal-text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--portal-text-secondary)";
                  }
                }}
              >
                <span style={{ display: "flex", alignItems: "center" }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    style={{
                      minWidth: "20px",
                      height: "20px",
                      padding: "0 6px",
                      background: "var(--portal-accent)",
                      borderRadius: "10px",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Desktop sidebar spacer */}
      <style>{`
        @media (min-width: 1024px) {
          .portal-sidebar {
            left: 0 !important;
          }
          .portal-main-content {
            margin-left: 240px;
          }
        }
      `}</style>
    </>
  );
}

export function PortalLayout({ children, currentPath }: PortalLayoutProps) {
  const { orgName, loading } = usePortalContext();
  const { tasks } = usePortalTasks();
  const { unreadCount: unreadMessageCount } = useUnreadMessageCount();

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  // Demo mode toggle state
  const isDemoMode = React.useMemo(() => {
    return typeof window !== "undefined" && window.location.search.includes("demo=true");
  }, []);

  // Derive org initial from org name
  const orgInitial = orgName ? orgName.charAt(0).toUpperCase() : null;

  // Calculate badge counts
  const actionRequiredCount = tasks.filter((t) => t.urgency === "action_required" || t.urgency === "overdue").length;

  const handleNavigateHome = () => {
    // Preserve query params (like ?demo=true) when navigating
    const currentParams = window.location.search;
    window.history.pushState({}, "", "/" + currentParams);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleNavigate = (path: string) => {
    // Preserve query params (like ?demo=true) when navigating
    const currentParams = window.location.search;
    window.history.pushState({}, "", path + currentParams);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleLogout = () => {
    window.location.href = "/logout";
  };

  const toggleDemoMode = () => {
    const url = new URL(window.location.href);
    if (isDemoMode) {
      url.searchParams.delete("demo");
    } else {
      url.searchParams.set("demo", "true");
    }
    window.location.href = url.toString();
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--portal-bg)", display: "flex", flexDirection: "column" }}>
      <HeaderBar>
        {/* Mobile hamburger menu */}
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          style={{
            all: "unset",
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            cursor: "pointer",
            color: "var(--portal-text-secondary)",
            transition: "color var(--portal-transition)",
          }}
          className="mobile-menu-button"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--portal-text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--portal-text-secondary)";
          }}
          aria-label="Toggle menu"
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
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <OrgIdentity orgName={orgName} orgInitial={orgInitial} onClick={handleNavigateHome} />

        {/* Spacer to push icons to right */}
        <div style={{ flex: 1 }} />

        {/* Activity icon (only in header on mobile) */}
        <button
          onClick={() => handleNavigate("/activity")}
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
            color: currentPath.startsWith("/activity")
              ? "var(--portal-text-primary)"
              : "var(--portal-text-secondary)",
            transition: "color var(--portal-transition)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--portal-text-primary)";
          }}
          onMouseLeave={(e) => {
            if (!currentPath.startsWith("/activity")) {
              e.currentTarget.style.color = "var(--portal-text-secondary)";
            }
          }}
          title="Activity"
          aria-label={`Activity${actionRequiredCount > 0 ? ` (${actionRequiredCount} items require attention)` : ""}`}
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
          {/* Action required badge with orange accent */}
          {actionRequiredCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "2px",
                right: "2px",
                minWidth: "16px",
                height: "16px",
                padding: "0 4px",
                background: "hsl(25, 95%, 53%)",
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
              {actionRequiredCount > 99 ? "99+" : actionRequiredCount}
            </span>
          )}
        </button>

        {/* Demo Mode Toggle - only show in development or when ?showDemo=true */}
        {(process.env.NODE_ENV === "development" || (typeof window !== "undefined" && window.location.search.includes("showDemo=true"))) && (
          <button
            onClick={toggleDemoMode}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--portal-space-1)",
              padding: "var(--portal-space-1) var(--portal-space-2)",
              fontSize: "var(--portal-font-size-xs)",
              fontWeight: "var(--portal-font-weight-medium)",
              color: isDemoMode ? "#10b981" : "var(--portal-text-tertiary)",
              background: isDemoMode ? "rgba(16, 185, 129, 0.1)" : "transparent",
              border: `1px solid ${isDemoMode ? "rgba(16, 185, 129, 0.3)" : "var(--portal-border-subtle)"}`,
              borderRadius: "var(--portal-radius-md)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "all var(--portal-transition)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
            title={isDemoMode ? "Disable demo mode" : "Enable demo mode"}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <span>{isDemoMode ? "Demo ON" : "Demo"}</span>
          </button>
        )}

        {/* Theme Toggle */}
        <ThemeToggle />

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

      {/* Sidebar Navigation */}
      <SidebarNav
        currentPath={currentPath}
        onNavigate={handleNavigate}
        unreadMessageCount={unreadMessageCount}
        actionRequiredCount={actionRequiredCount}
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main content area */}
      <main style={{ flex: 1, paddingTop: "64px" }} className="portal-main-content">
        {children}
      </main>

      <Footer />

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 1023px) {
          .mobile-menu-button {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
