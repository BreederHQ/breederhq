// apps/marketplace/src/layout/MarketplaceLayout.tsx
// Marketplace-appropriate layout: solid elevated header, no Portal gradient
import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { joinApi } from "../api/client";
import { useDemoMode, isDemoMode } from "../demo/demoMode";
import { useUnreadCounts, useWaitlistRequests } from "../messages/hooks";
import { useUserProfile, type MarketplaceUserProfile } from "../gate/MarketplaceGate";

/**
 * Bell icon for notifications
 */
function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14v-3a6 6 0 1 0-12 0v3c0 .53-.21 1.04-.59 1.41L4 17h5m3 4a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Settings/gear icon
 */
function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Profile settings modal for basic profile maintenance
 */
function ProfileSettingsModal({
  userProfile,
  onClose,
  onSave,
}: {
  userProfile: MarketplaceUserProfile;
  onClose: () => void;
  onSave: (data: { firstName: string; lastName: string; phone: string }) => Promise<void>;
}) {
  const [firstName, setFirstName] = React.useState(userProfile.firstName || "");
  const [lastName, setLastName] = React.useState(userProfile.lastName || "");
  const [phone, setPhone] = React.useState(userProfile.phone || "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (!firstName.trim()) {
      setError("First name is required");
      return;
    }
    if (!lastName.trim()) {
      setError("Last name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-portal-card border border-border-subtle rounded-portal shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Profile Updated!</h3>
            <p className="text-sm text-text-secondary">Your changes have been saved.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-portal-card border border-border-subtle rounded-portal shadow-xl max-w-md w-full p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-text-tertiary hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-lg font-semibold text-white mb-1">Profile Settings</h3>
        <p className="text-sm text-text-secondary mb-4">
          Update your profile information.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Email
            </label>
            <input
              type="email"
              value={userProfile.email}
              disabled
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
              className="w-full px-3 py-2 bg-border-default/50 border border-border-subtle rounded-portal-xs text-text-tertiary cursor-not-allowed"
            />
            <p className="text-xs text-text-tertiary mt-1">Email cannot be changed here</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                First Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
                className="w-full px-3 py-2 bg-border-default border border-border-subtle rounded-portal-xs text-white placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Last Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
                className="w-full px-3 py-2 bg-border-default border border-border-subtle rounded-portal-xs text-white placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Phone (optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
              className="w-full px-3 py-2 bg-border-default border border-border-subtle rounded-portal-xs text-white placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-portal-xs">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-portal-xs bg-border-default border border-border-subtle text-white text-sm font-medium hover:bg-portal-card-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-portal-xs bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface Props {
  authenticated: boolean;
  children: React.ReactNode;
}

/**
 * Nav link that can be disabled with tooltip.
 */
interface NavLinkProps {
  to: string;
  active: boolean;
  disabled?: boolean;
  disabledTitle?: string;
  children: React.ReactNode;
}

function NavLink({ to, active, disabled, disabledTitle, children }: NavLinkProps) {
  const baseClasses = "px-2.5 py-1.5 text-sm font-medium rounded-portal-xs transition-colors";

  if (disabled) {
    return (
      <span
        className={`${baseClasses} text-text-muted cursor-not-allowed`}
        aria-disabled="true"
        title={disabledTitle}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      to={to}
      className={`${baseClasses} ${
        active
          ? "text-white bg-border-default"
          : "text-text-secondary hover:text-white hover:bg-portal-card-hover"
      }`}
    >
      {children}
    </Link>
  );
}

/**
 * Main marketplace layout.
 * Solid elevated header (no Portal gradient/blur), 64px height, max-width 1200px.
 */
export function MarketplaceLayout({ authenticated, children }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const { demoMode, enable: enableDemo, disable: disableDemo } = useDemoMode();
  const { totalUnread, refresh: refreshUnread } = useUnreadCounts();
  const { requests: waitlistRequests, refresh: refreshWaitlist } = useWaitlistRequests();
  const userProfile = useUserProfile();

  // Calculate total notification count (unread messages + status changes on waitlist)
  // We show a badge if there are unread messages OR recently updated waitlist requests
  const pendingWaitlistCount = waitlistRequests.filter(r => r.status === "pending").length;
  const totalNotifications = totalUnread + pendingWaitlistCount;

  // Refresh data when page becomes visible
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshUnread();
        refreshWaitlist();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refreshUnread, refreshWaitlist]);

  // Check if current path matches a nav item
  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleSaveProfile = async (data: { firstName: string; lastName: string; phone: string }) => {
    const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
    const response = await fetch(joinApi("/api/v1/marketplace/profile"), {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
      },
      body: JSON.stringify({
        firstName: data.firstName,
        lastName: data.lastName,
        phoneE164: data.phone || null,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error || "Failed to save profile");
    }

    // Reload the page to refresh the user profile context
    window.location.reload();
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
      await fetch(joinApi("/api/v1/auth/logout"), {
        method: "POST",
        credentials: "include",
        headers: {
          ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
        },
      });
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("Logout request failed:", err);
      }
    } finally {
      window.location.reload();
    }
  };

  // Demo-only surfaces: Services, Inquiries, Updates
  const demoOnlyDisabled = !demoMode;
  const comingSoonTitle = "Coming soon - Preview with demo data";

  return (
    <div className="min-h-screen bg-portal-bg text-white relative font-sans antialiased">
      {/* Solid header - Marketplace-appropriate, no Portal gradient/blur */}
      <header className="sticky top-0 z-40 h-header border-b border-border-subtle bg-portal-elevated">
        <div className="h-full w-full max-w-portal mx-auto px-6 flex items-center justify-between">
          {/* Left: Marketplace brand + nav */}
          <div className="flex items-center gap-6">
            <Link to="/" className="text-base font-semibold tracking-tight text-white hover:text-white/90 transition-colors">
              BreederHQ Marketplace
            </Link>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink
                to="/"
                active={isActive("/") && !isActive("/animals") && !isActive("/breeders") && !isActive("/services") && !isActive("/inquiries") && !isActive("/updates") && !isActive("/programs")}
              >
                Home
              </NavLink>
              <NavLink
                to="/animals"
                active={isActive("/animals")}
              >
                Animals
              </NavLink>
              <NavLink
                to="/breeders"
                active={isActive("/breeders") || isActive("/programs")}
              >
                Breeders
              </NavLink>
              <NavLink
                to="/services"
                active={isActive("/services")}
                disabled={demoOnlyDisabled}
                disabledTitle={comingSoonTitle}
              >
                Services
              </NavLink>
              <NavLink
                to="/inquiries"
                active={isActive("/inquiries") || isActive("/updates")}
              >
                Inquiries
              </NavLink>

              {/* Seller/Provider management links */}
              <span className="ml-2 pl-3 border-l border-border-subtle flex items-center gap-1">
                <NavLink
                  to="/me/programs"
                  active={isActive("/me/programs")}
                >
                  My Programs
                </NavLink>
                <NavLink
                  to="/me/services"
                  active={isActive("/me/services")}
                >
                  My Services
                </NavLink>
                <NavLink
                  to="/provider"
                  active={isActive("/provider")}
                >
                  Provider Portal
                </NavLink>
              </span>
            </nav>
          </div>

          {/* Right: Notifications + Demo mode controls + Account actions */}
          <div className="flex items-center gap-3">
            {/* Notifications bell - always visible when authenticated */}
            {authenticated && (
              <button
                type="button"
                onClick={() => navigate("/inquiries")}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-portal-xs border border-border-subtle bg-portal-card hover:bg-portal-card-hover transition-colors"
                aria-label="View inquiries"
              >
                <BellIcon className="h-5 w-5 text-text-secondary" />
                {totalNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-white">
                    {totalNotifications > 99 ? "99+" : totalNotifications}
                  </span>
                )}
              </button>
            )}

            {/* Demo mode controls */}
            {demoMode ? (
              <>
                <span className="px-2 py-1 text-xs font-medium rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Demo mode
                </span>
                <button
                  type="button"
                  onClick={disableDemo}
                  className="text-sm text-text-tertiary hover:text-white transition-colors"
                >
                  Turn off
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={enableDemo}
                className="px-3 py-1.5 text-sm font-medium rounded-portal-xs bg-border-default border border-border-subtle text-text-secondary hover:text-white hover:bg-portal-card-hover transition-colors"
              >
                Preview with demo data
              </button>
            )}

            {/* Settings button */}
            {authenticated && userProfile && (
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-portal-xs border border-border-subtle bg-portal-card hover:bg-portal-card-hover transition-colors"
                aria-label="Profile settings"
                title="Profile settings"
              >
                <SettingsIcon className="h-5 w-5 text-text-secondary" />
              </button>
            )}

            {/* Logout button */}
            {authenticated && (
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="px-3.5 py-2 text-sm font-medium rounded-portal-xs bg-border-default border border-border-subtle text-text-secondary hover:text-white hover:bg-portal-card-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                {loggingOut ? "..." : "Logout"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Profile settings modal */}
      {showSettings && userProfile && (
        <ProfileSettingsModal
          userProfile={userProfile}
          onClose={() => setShowSettings(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* Content frame - max-width 1200px */}
      <main className="w-full max-w-portal mx-auto px-6 pt-8 pb-16">
        {children}
      </main>

      {/* Footer with legal links */}
      <footer className="border-t border-border-subtle py-6">
        <div className="max-w-portal mx-auto px-6 flex items-center justify-between text-sm text-text-tertiary">
          <p>&copy; {new Date().getFullYear()} BreederHQ LLC. All rights reserved.</p>
          <nav className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
