// apps/platform/src/App-Platform.tsx
import React, { useEffect, useMemo, useState } from "react";
import InviteSignupPage from "./pages/InviteSignupPage";
import VerifyPage from "./pages/VerifyPage";
import NavShell from "@bhq/ui/layouts/NavShell";
import { ToastViewport } from "@bhq/ui/atoms";
import { resolveTenantId } from "@bhq/ui/utils/tenant";
import { UiScaleProvider } from "@bhq/ui/settings/UiScaleProvider";
import "@bhq/ui/styles/global.css";
import "@bhq/ui/styles/table.css";

// Platform declares global overlay ownership
; (window as any).__BHQ_OVERLAY_MODE = "global";

// Modules
import AppContacts from "@bhq/contacts/App-Contacts";
import AppAnimals from "@bhq/animals/App-Animals";
import AppBreeding from "@bhq/breeding/App-Breeding";
import AppOffspring from "@bhq/offspring/App-Offspring";
import AppMarketing from "@bhq/marketing/App-Marketing";
import AppFinance from "@bhq/finance/App-Finance";
import AdminModule from "@bhq/admin/App-Admin";
import AppWaitlist from "@bhq/waitlist/App-Waitlist";
import AppBloodlines from "@bhq/bloodlines/App-Bloodlines";
import { MarketplaceEmbedded } from "@bhq/marketplace";
import DashboardPage from "./pages/Dashboard";

// Support Pages
import SettingsPanel from "./pages/SettingsPanel";
import TermsPage from "./pages/TermsPage";
import LoginPage from "./pages/LoginPage";
import PricingPage from "./pages/PricingPage";
import NotificationsDropdown, { type Notification } from "./components/NotificationsDropdown";
import QuotaWarningBanner from "./components/QuotaWarningBanner";

// Lightweight "current module" state (key + label)
type ActiveModule = { key: "dashboard" | "contacts" | "animals" | "breeding" | "offspring" | "waitlist" | "bloodlines" | "marketing" | "marketplace" | "finance" | "admin"; label: string };
const DEFAULT_MODULE: ActiveModule = { key: "dashboard", label: "Dashboard" };

type AuthState = {
  user?: { id: string; email?: string | null } | null;
  org?: { id: number; name?: string | null } | null;
  memberships?: Array<{ organizationId: number; role?: string }>;
} | null;

// compute API root once; works with same-origin dev and env overrides
const API_ROOT = (
  (window as any).__BHQ_API_BASE__ ||
  (import.meta as any)?.env?.VITE_API_BASE ||
  (import.meta as any)?.env?.VITE_API_URL ||
  localStorage.getItem("BHQ_API_URL") ||
  location.origin
).replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
(window as any).__BHQ_API_BASE__ = API_ROOT;

// disable dashboard network calls in dev
; (window as any).__BHQ_DASHBOARD_REMOTE__ = false;

// Simple path router
function RouteView() {
  const [path, setPath] = React.useState<string>(() => {
    try { return window.location.pathname.toLowerCase(); } catch { return "/"; }
  });

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname.toLowerCase());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const p = path.endsWith("/") ? path.slice(0, -1) : path;

  if (p === "" || p === "/") return <DashboardPage />;
  if (p === "/contacts" || p.startsWith("/contacts")) return <AppContacts />;
  if (p === "/animals" || p.startsWith("/animals")) return <AppAnimals />;
  if (p === "/breeding" || p.startsWith("/breeding")) return <AppBreeding />;
  if (p === "/offspring" || p.startsWith("/offspring")) return <AppOffspring />;
  if (p === "/waitlist" || p.startsWith("/waitlist")) return <AppWaitlist />;
  if (p === "/bloodlines" || p.startsWith("/bloodlines")) return <AppBloodlines />;
  if (p === "/marketing" || p.startsWith("/marketing")) return <AppMarketing />;
  if (p === "/marketplace" || p.startsWith("/marketplace")) return <MarketplaceEmbedded />;
  if (p === "/finance" || p.startsWith("/finance")) return <AppFinance />;
  if (p === "/admin" || p.startsWith("/admin")) return <AdminModule />;
  if (p === "/pricing" || p.startsWith("/pricing")) return <PricingPage />;

  return <DashboardPage />;
}

// --- MAIN ---
export default function AppPlatform() {
  const [activeModule, setActiveModule] = useState<ActiveModule>(DEFAULT_MODULE);

  // Listen for module announcements from each module root
  useEffect(() => {
    function onModule(e: Event) {
      const detail = (e as CustomEvent).detail as Partial<ActiveModule>;
      if (!detail?.key || !detail?.label) return;
      setActiveModule({ key: detail.key as ActiveModule["key"], label: detail.label });
    }
    window.addEventListener("bhq:module", onModule as any);
    return () => window.removeEventListener("bhq:module", onModule as any);
  }, []);

  // Keep title in sync for the Dashboard route
  useEffect(() => {
    const p = (typeof window !== "undefined" ? window.location.pathname.toLowerCase() : "/").replace(/\/$/, "");
    if (p === "" || p === "/") setActiveModule({ key: "dashboard", label: "Dashboard" });
  }, []);

  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";

  // Public routes short-circuit before any shell
  const isInvite = pathname.startsWith("/invite");
  const isVerify = pathname.startsWith("/verify");
  const isTerms = pathname === "/terms";

  // Hooks
  const [auth, setAuth] = useState<AuthState>(null);
  const [loading, setLoading] = useState(true);
  const [tenantReady, setTenantReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // ESC closes Settings when not dirty
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && settingsOpen && !settingsDirty) {
        setSettingsOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsOpen, settingsDirty]);

  // Fetch session and user profile
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        // Add cache-busting timestamp to prevent any caching
        const r = await fetch(`/api/v1/session?_=${Date.now()}`, {
          credentials: "include",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
          },
        });
        const j = await r.json().catch(() => null);
        if (!ignore && r.ok && j?.user?.id) {
          // Fetch full user profile before showing dashboard
          try {
            const userRes = await fetch(`/api/v1/users/${encodeURIComponent(j.user.id)}`, {
              credentials: "include",
              cache: "no-store",
            });
            if (userRes.ok) {
              const fullUser = await userRes.json();
              (window as any).platform = (window as any).platform || {};
              (window as any).platform.currentUser = fullUser;
            }
          } catch { /* ignore - Dashboard will fall back to "Breeder" */ }
        }
        if (!ignore) setAuth(r.ok ? j : null);
      } catch {
        if (!ignore) setAuth(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  // Compute org id
  const computedOrgId = useMemo(() => {
    const fromAuthOrg = Number((auth as any)?.org?.id ?? NaN);
    if (Number.isFinite(fromAuthOrg)) return fromAuthOrg;

    let fromLs = NaN;
    try {
      const lsRaw = localStorage.getItem("BHQ_ORG_ID");
      fromLs = lsRaw ? Number(lsRaw) : NaN;
    } catch { /* ignore */ }
    if (Number.isFinite(fromLs)) return fromLs;

    return NaN;
  }, [auth]);

  // Persist org id and broadcast
  useEffect(() => {
    const n = Number(computedOrgId);
    const has = Number.isFinite(n) && n > 0;

    (window as any).__BHQ_ORG_ID__ = has ? n : undefined;
    try {
      has ? localStorage.setItem("BHQ_ORG_ID", String(n)) : localStorage.removeItem("BHQ_ORG_ID");
    } catch { /* ignore */ }

    (window as any).platform = (window as any).platform || {};

    if (has) {
      (window as any).platform.currentOrgId = n;
      window.dispatchEvent(new CustomEvent("platform:orgChanged", { detail: { orgId: n } }));
    } else {
      delete (window as any).platform.currentOrgId;
      window.dispatchEvent(new CustomEvent("platform:orgChanged", { detail: { orgId: null } }));
    }
  }, [computedOrgId]);

  // Bootstrap tenant
  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    (async () => {
      try {
        const t = await resolveTenantId({ baseUrl: "/api/v1" });
        if (cancelled) return;
        (window as any).__BHQ_TENANT_ID__ = t;
        try { localStorage.setItem("BHQ_TENANT_ID", String(t)); } catch { /* ignore */ }
      } catch (e) {
        const envTid = Number((import.meta as any)?.env?.VITE_DEV_TENANT_ID || "");
        if (Number.isFinite(envTid) && envTid > 0) {
          (window as any).__BHQ_TENANT_ID__ = envTid;
          try { localStorage.setItem("BHQ_TENANT_ID", String(envTid)); } catch { /* ignore */ }
        } else {
          console.warn("[platform] tenant could not be resolved; x-tenant-id may be missing", e);
        }
      } finally {
        if (!cancelled) setTenantReady(true);
      }
    })();

    return () => { cancelled = true; };
  }, [loading]);

  // Fetch unread message count and pending waitlist count
  useEffect(() => {
    if (!tenantReady || !auth?.user?.id) return;

    let cancelled = false;
    const fetchUnread = async () => {
      try {
        const tenantId = (window as any).__BHQ_TENANT_ID__;
        if (!tenantId) return;

        const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
        const headers = {
          "x-tenant-id": String(tenantId),
          ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
        };

        // Fetch messages, pending waitlist, and health/breeding notifications in parallel
        const [messagesRes, waitlistRes, notificationsRes] = await Promise.all([
          fetch("/api/v1/messages/threads", { credentials: "include", headers }),
          fetch("/api/v1/waitlist/pending-count", { credentials: "include", headers }),
          fetch("/api/v1/notifications?status=UNREAD&limit=50", { credentials: "include", headers }),
        ]);

        if (cancelled) return;

        let messageUnread = 0;
        let waitlistPending = 0;

        if (messagesRes.ok) {
          const data = await messagesRes.json();
          const threads = data?.threads || [];
          messageUnread = threads.reduce((sum: number, t: any) => sum + (t.unreadCount || 0), 0);
        }

        if (waitlistRes.ok) {
          const data = await waitlistRes.json();
          waitlistPending = data?.count || 0;
        }

        if (cancelled) return;

        // Set unread count (messages only for messages icon)
        setUnreadCount(messageUnread);

        // Create notifications for pending waitlist entries
        const newNotifications: Notification[] = [];
        if (waitlistPending > 0) {
          newNotifications.push({
            id: "pending-waitlist",
            type: "waitlist",
            title: `${waitlistPending} Pending Waitlist Request${waitlistPending > 1 ? "s" : ""}`,
            body: "Review new waitlist requests from the marketplace.",
            href: "/waitlist?tab=pending",
            createdAt: new Date(),
            read: false,
          });
        }

        // Add health and breeding notifications from API
        if (notificationsRes.ok) {
          const data = await notificationsRes.json();
          const dbNotifications = data?.notifications || [];

          for (const notif of dbNotifications) {
            let type: Notification["type"] = "system";

            // Map notification types to platform types
            if (
              notif.type === "vaccination_expiring_7d" ||
              notif.type === "vaccination_expiring_3d" ||
              notif.type === "vaccination_expiring_1d" ||
              notif.type === "vaccination_overdue"
            ) {
              type = "vaccination";
            } else if (
              notif.type === "foaling_30d" ||
              notif.type === "foaling_14d" ||
              notif.type === "foaling_7d" ||
              notif.type === "foaling_approaching" ||
              notif.type === "foaling_overdue"
            ) {
              type = "foaling";
            } else if (
              notif.type === "breeding_heat_cycle_expected" ||
              notif.type === "breeding_hormone_testing_due" ||
              notif.type === "breeding_window_approaching"
            ) {
              type = "breeding";
            }

            newNotifications.push({
              id: `notif-${notif.id}`,
              type,
              title: notif.title,
              body: notif.message || "",
              href: notif.linkUrl || "/animals",
              createdAt: new Date(notif.createdAt),
              read: false,
            });
          }
        }

        setNotifications(newNotifications);
      } catch {
        // Silently ignore errors for notification count
      }
    };

    // Fetch immediately and then poll every 30 seconds
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [tenantReady, auth?.user?.id]);

  // Logout
  async function doLogout() {
    try {
      // Get CSRF token from cookie
      const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
        },
      });
    } catch { /* ignore */ }
    finally {
      // Clear all BHQ localStorage items
      try { localStorage.removeItem("BHQ_ORG_ID"); } catch { /* ignore */ }
      try { localStorage.removeItem("BHQ_TENANT_ID"); } catch { /* ignore */ }
      try { localStorage.removeItem("BHQ_LAST_MODULE"); } catch { /* ignore */ }

      // Clear all window globals
      (window as any).__BHQ_ORG_ID__ = undefined;
      (window as any).__BHQ_TENANT_ID__ = undefined;
      (window as any).__BHQ_DASHBOARD_REMOTE__ = undefined;

      // Clear platform object cache
      if ((window as any).platform) {
        delete (window as any).platform.currentOrgId;
        delete (window as any).platform.currentUser;
      }

      // Clear session storage as well
      try { sessionStorage.clear(); } catch { /* ignore */ }

      setAuth(null);
      window.location.replace(`/login?ts=${Date.now()}`);
    }
  }

  const orgName =
    (auth?.org?.name && String(auth.org.name).trim())
      ? String(auth.org.name).trim()
      : "Organization";

  return (
    <UiScaleProvider>
      {isInvite ? (
        <InviteSignupPage />
      ) : isVerify ? (
        <VerifyPage />
      ) : isTerms ? (
        <TermsPage />
      ) : loading || !tenantReady ? (
        <div className="min-h-screen grid place-items-center text-primary bg-page">Loading…</div>
      ) : !auth ? (
        <LoginPage />
      ) : (
        <div className="theme-dark bhq-grain h-screen bg-page text-primary flex flex-col overflow-hidden">
          <NavShell
            title={activeModule.label}
            {...{ activeKey: activeModule.key, logoSize: 40 } as any}
            navItems={[
              { key: "dashboard", label: "Dashboard", href: "/", icon: "home" },
              { key: "contacts", label: "Contacts", href: "/contacts", icon: "contacts" },
              { key: "animals", label: "Animals", href: "/animals", icon: "animals" },
              { key: "breeding", label: "Breeding", href: "/breeding", icon: "breeding" },
              { key: "offspring", label: "Offspring", href: "/offspring", icon: "offspring" },
              { key: "waitlist", label: "Waitlist", href: "/waitlist", icon: "waitlist" },
              { key: "bloodlines", label: "Bloodlines", href: "/bloodlines" },
              { key: "marketing", label: "Marketing", href: "/marketing" },
              { key: "marketplace", label: "Marketplace", href: "/marketplace", icon: "marketplace" },
              { key: "finance", label: "Finance", href: "/finance", icon: "finance" },
              { key: "admin", label: "Admin", href: "/admin", icon: "admin" },
            ]}
            orgName={orgName}
            onOrgClick={() => alert("Organization switcher coming soon")}
            onSettingsClick={() => setSettingsOpen(true)}
            onMessagesClick={() => window.location.assign("/marketing/messages")}
            unreadMessagesCount={unreadCount}
            unreadCount={notifications.filter((n) => !n.read).length}
            notificationsDropdownContent={
              <NotificationsDropdown
                notifications={notifications}
                unreadCount={notifications.filter((n) => !n.read).length}
                onClose={() => {/* handled by NavShell */}}
                onMarkAllRead={async () => {
                  // Mark all as read in local state
                  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

                  // Mark persistent notifications as read in API
                  try {
                    const tenantId = (window as any).__BHQ_TENANT_ID__;
                    if (!tenantId) return;

                    const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
                    await fetch("/api/v1/notifications/mark-all-read", {
                      method: "POST",
                      credentials: "include",
                      headers: {
                        "x-tenant-id": String(tenantId),
                        ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
                      },
                    });
                  } catch {
                    // Silently ignore errors
                  }
                }}
                onNotificationClick={async (notification) => {
                  // Mark as read in local state
                  setNotifications((prev) =>
                    prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
                  );

                  // Mark persistent notification as read in API
                  if (notification.id.startsWith("notif-")) {
                    try {
                      const notifId = notification.id.replace("notif-", "");
                      const tenantId = (window as any).__BHQ_TENANT_ID__;
                      if (!tenantId) return;

                      const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
                      await fetch(`/api/v1/notifications/${notifId}/read`, {
                        method: "PUT",
                        credentials: "include",
                        headers: {
                          "x-tenant-id": String(tenantId),
                          ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
                        },
                      });
                    } catch {
                      // Silently ignore errors
                    }
                  }
                }}
              />
            }
            auth={{
              isAuthenticated: !!auth?.user?.id,
              onLogin: () => window.location.assign("/login"),
              onLogout: doLogout,
            }}
          >
            <QuotaWarningBanner />
            <RouteView />
          </NavShell>

          <SettingsPanel
            open={settingsOpen}
            dirty={settingsDirty}
            onDirtyChange={setSettingsDirty}
            onClose={() => setSettingsOpen(false)}
          />
          <div id="bhq-overlay-root" className="fixed inset-0 z-[2147483647] pointer-events-none" />

          {/* Toast system renders here */}
          <ToastViewport />

          {/* Footer with legal links */}
          <footer className="border-t border-hairline py-4 px-6 mt-auto">
            <div className="flex items-center justify-between text-xs text-secondary">
              <span>&copy; {new Date().getFullYear()} BreederHQ LLC</span>
              <a href="/terms" className="hover:text-primary transition-colors">
                Terms of Service
              </a>
            </div>
          </footer>
        </div>
      )}
    </UiScaleProvider>
  );
}
