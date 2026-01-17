// apps/marketplace/src/layout/MarketplaceLayout.tsx
// Main layout wrapper for the standalone marketplace app
// Includes TopNav for desktop, BottomTabBar for mobile, and footer

import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { joinApi } from "../api/client";
import { useUnreadCounts, useWaitlistRequests } from "../messages/hooks";
import { useUserProfile, type MarketplaceUserProfile } from "../gate/MarketplaceGate";
import { useMarketplaceTheme } from "../context/MarketplaceThemeContext";
import { TopNav } from "./TopNav";
import { BottomTabBar } from "./BottomTabBar";

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save profile";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-portal-card border border-border-subtle rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Profile Updated</h3>
            <p className="text-sm text-text-secondary">Your changes have been saved.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-portal-card border border-border-subtle rounded-lg shadow-xl max-w-md w-full p-6">
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
              className="w-full px-3 py-2 bg-border-default/50 border border-border-subtle rounded-md text-text-tertiary cursor-not-allowed"
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
                className="w-full px-3 py-2 bg-portal-card border border-border-subtle rounded-md text-white placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
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
                className="w-full px-3 py-2 bg-portal-card border border-border-subtle rounded-md text-white placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
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
              className="w-full px-3 py-2 bg-portal-card border border-border-subtle rounded-md text-white placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-md bg-border-default border border-border-subtle text-white text-sm font-medium hover:bg-portal-card-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-md bg-[hsl(var(--brand-orange))] text-white text-sm font-medium hover:bg-[hsl(var(--brand-orange))]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface MarketplaceLayoutProps {
  authenticated: boolean;
  children: React.ReactNode;
}

/**
 * Main marketplace layout component.
 * Provides:
 * - TopNav for desktop navigation
 * - BottomTabBar for mobile navigation
 * - Profile settings modal
 * - Footer with legal links
 */
export function MarketplaceLayout({ authenticated, children }: MarketplaceLayoutProps) {
  const location = useLocation();
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const { totalUnread, refresh: refreshUnread } = useUnreadCounts(authenticated);
  const { requests: waitlistRequests, refresh: refreshWaitlist } = useWaitlistRequests(authenticated);
  const userProfile = useUserProfile();
  const { isLightMode } = useMarketplaceTheme();

  // Calculate notification counts
  const pendingWaitlistCount = waitlistRequests.filter(r => r.status === "pending").length;
  const unreadMessages = totalUnread;
  const savedCount = 0; // TODO: Implement saved items count from API

  // Polling for notification counts (60 second interval)
  React.useEffect(() => {
    if (!authenticated) return;

    const interval = setInterval(() => {
      refreshUnread();
      refreshWaitlist();
    }, 60000);

    return () => clearInterval(interval);
  }, [authenticated, refreshUnread, refreshWaitlist]);

  // Refresh data when page becomes visible
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && authenticated) {
        refreshUnread();
        refreshWaitlist();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [authenticated, refreshUnread, refreshWaitlist]);

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
      // Clear any cached data and redirect to home
      // This forces a full re-authentication flow
      window.location.href = "/";
    }
  };

  // Determine which banner to show based on current route
  const showAnimalsBanner = location.pathname === "/animals";
  const showBreedersBanner = location.pathname === "/breeders";
  const showServicesBanner = location.pathname === "/services";

  return (
    <div className={`min-h-screen flex flex-col relative font-sans antialiased ${
      isLightMode
        ? "bg-gray-50 text-gray-900"
        : "bg-portal-bg text-white"
    }`}>
      {/* Skip to main content link (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:bg-portal-card focus:px-4 focus:py-2 focus:rounded-lg focus:border focus:border-border-default focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* CTA Banners - Above TopNav */}
      {showAnimalsBanner && (
        <div className="bg-blue-600 border-b border-blue-500">
          <div className="container mx-auto px-4 md:px-8 lg:px-12 xl:px-16 py-2">
            <div className="flex items-center justify-center gap-2 flex-wrap text-center">
              <p className="text-white text-sm font-medium">
                Want to see your breeding program's animals and offspring listed here?
              </p>
              <a
                href="https://www.breederhq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 text-sm bg-white hover:bg-gray-100 text-blue-600 rounded font-semibold transition-colors whitespace-nowrap"
              >
                Start a Free Trial of Breeder<span className="text-[hsl(var(--brand-orange))]">HQ</span> Today!
              </a>
            </div>
          </div>
        </div>
      )}

      {showBreedersBanner && (
        <div className="bg-blue-600 border-b border-blue-500">
          <div className="container mx-auto px-4 md:px-8 lg:px-12 xl:px-16 py-2">
            <div className="flex items-center justify-center gap-2 flex-wrap text-center">
              <p className="text-white text-sm font-medium">
                Want to see your breeding business here?
              </p>
              <a
                href="https://www.breederhq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 text-sm bg-white hover:bg-gray-100 text-blue-600 rounded font-semibold transition-colors whitespace-nowrap"
              >
                Start a Free Trial of Breeder<span className="text-[hsl(var(--brand-orange))]">HQ</span> Today!
              </a>
            </div>
          </div>
        </div>
      )}

      {showServicesBanner && (
        <div className="bg-[hsl(var(--brand-orange))] border-b border-orange-500">
          <div className="container mx-auto px-4 md:px-8 lg:px-12 xl:px-16 py-2">
            <div className="flex items-center justify-center gap-2 flex-wrap text-center">
              <p className="text-white text-sm font-medium">
                Do you offer animal services?
              </p>
              <Link
                to="/provider"
                className="px-3 py-1 text-sm bg-white hover:bg-gray-100 text-[hsl(var(--brand-orange))] rounded font-semibold transition-colors whitespace-nowrap"
              >
                List Your Services FOR FREE!
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation (desktop) */}
      <TopNav
        user={userProfile}
        authenticated={authenticated}
        unreadMessages={unreadMessages + pendingWaitlistCount}
        savedCount={savedCount}
        onLogout={handleLogout}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Profile settings modal */}
      {showSettings && userProfile && (
        <ProfileSettingsModal
          userProfile={userProfile}
          onClose={() => setShowSettings(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* Main content area - responsive with edge padding, flex-1 to fill remaining viewport */}
      <main id="main-content" className="flex-1 w-full px-4 md:px-8 lg:px-12 xl:px-16 pt-6 pb-20 md:pb-8">
        {children}
      </main>

      {/* Bottom Tab Bar (mobile only) */}
      <BottomTabBar
        authenticated={authenticated}
        unreadMessages={unreadMessages + pendingWaitlistCount}
        savedCount={savedCount}
      />

      {/* Footer (hidden on mobile when bottom bar is visible) */}
      <footer className="hidden md:block border-t border-border-subtle py-6">
        <div className="px-8 lg:px-12 xl:px-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-tertiary">
            <p>&copy; {new Date().getFullYear()} BreederHQ LLC. All rights reserved.</p>
            <nav className="flex items-center gap-4">
              <Link to="/about" className="hover:text-white transition-colors">
                About
              </Link>
              <Link to="/help" className="hover:text-white transition-colors">
                Help
              </Link>
              <Link to="/trust" className="hover:text-white transition-colors">
                Trust & Safety
              </Link>
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default MarketplaceLayout;
