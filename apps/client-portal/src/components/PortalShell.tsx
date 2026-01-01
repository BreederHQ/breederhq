// apps/client-portal/src/components/PortalShell.tsx
// Top bar and simple navigation for the client portal standalone app
import * as React from "react";
import { useOrg } from "../context/OrgContext";

interface PortalShellProps {
  orgSlug: string;
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

// Simple icons for nav items
function DashboardIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function MessagesIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function TasksIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function BillingIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function DocumentsIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
  { label: "Messages", path: "/messages", icon: <MessagesIcon /> },
  { label: "Tasks", path: "/tasks", icon: <TasksIcon /> },
  { label: "Billing", path: "/billing", icon: <BillingIcon /> },
  { label: "Documents", path: "/documents", icon: <DocumentsIcon /> },
  { label: "Profile", path: "/profile", icon: <ProfileIcon /> },
];

export function PortalShell({ orgSlug, children }: PortalShellProps) {
  const { basePath, navigate } = useOrg();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Get current path for active state
  const currentPath = React.useMemo(() => {
    const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, "");
    // Extract view from /p/:orgSlug/:view
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length >= 3) {
      return `/${segments[2]}`;
    }
    return "/dashboard";
  }, []);

  // Listen for route changes to update active state
  React.useEffect(() => {
    const handlePopState = () => {
      // Force re-render on navigation
      setMobileMenuOpen(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/session", {
        method: "DELETE",
        credentials: "include",
      });
    } catch (err) {
      console.error("[PortalShell] Logout failed:", err);
    }
    // Redirect to login regardless of logout API result
    window.location.href = `${basePath}/login`;
  };

  return (
    <div className="min-h-screen bg-page">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-surface border-b border-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Brand */}
            <div className="flex items-center gap-3">
              <a
                href={`${basePath}/dashboard`}
                onClick={(e) => handleNavClick(e, "/dashboard")}
                className="flex items-center gap-2 text-primary font-semibold"
              >
                <div className="w-8 h-8 rounded-lg bg-[hsl(var(--brand-orange))] flex items-center justify-center text-white font-bold text-sm">
                  B
                </div>
                <span className="hidden sm:inline">Client Portal</span>
              </a>
              <span className="text-tertiary hidden sm:inline">|</span>
              <span className="text-secondary text-sm hidden sm:inline">{orgSlug}</span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = currentPath === item.path ||
                  (item.path === "/dashboard" && currentPath === "/");
                return (
                  <a
                    key={item.path}
                    href={`${basePath}${item.path}`}
                    onClick={(e) => handleNavClick(e, item.path)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive
                        ? "bg-[hsl(var(--brand-orange))]/10 text-[hsl(var(--brand-orange))]"
                        : "text-secondary hover:text-primary hover:bg-surface-strong"}
                    `}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </a>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-secondary hover:text-primary hover:bg-surface-strong transition-colors ml-2"
              >
                <LogoutIcon />
                <span>Logout</span>
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg text-secondary hover:text-primary hover:bg-surface-strong"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-hairline bg-surface">
            <div className="px-4 py-2 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = currentPath === item.path ||
                  (item.path === "/dashboard" && currentPath === "/");
                return (
                  <a
                    key={item.path}
                    href={`${basePath}${item.path}`}
                    onClick={(e) => handleNavClick(e, item.path)}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive
                        ? "bg-[hsl(var(--brand-orange))]/10 text-[hsl(var(--brand-orange))]"
                        : "text-secondary hover:text-primary hover:bg-surface-strong"}
                    `}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </a>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-secondary hover:text-primary hover:bg-surface-strong transition-colors"
              >
                <LogoutIcon />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}

export default PortalShell;
