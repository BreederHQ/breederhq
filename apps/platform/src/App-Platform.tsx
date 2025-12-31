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
import AppContactsParty from "@bhq/contacts/App-Contacts-Party";
import AppAnimals from "@bhq/animals/App-Animals";
import AppBreeding from "@bhq/breeding/App-Breeding";
import AppOffspring from "@bhq/offspring/App-Offspring";
import AppMarketing from "@bhq/marketing/App-Marketing";
import AppFinance from "@bhq/finance/App-Finance";
import AdminModule from "@bhq/admin/App-Admin";
import DashboardPage from "./pages/Dashboard";

// Support Pages
import SettingsPanel from "./pages/SettingsPanel";

// Lightweight "current module" state (key + label)
type ActiveModule = { key: "dashboard" | "contacts" | "animals" | "breeding" | "offspring" | "marketing" | "finance" | "admin"; label: string };
const DEFAULT_MODULE: ActiveModule = { key: "dashboard", label: "Dashboard" };

type AuthState = {
  user?: { id: string; email?: string | null } | null;
  org?: { id: number; name?: string | null } | null;
  memberships?: Array<{ organizationId: number; role?: string }>;
} | null;

// --- Standalone login (works with .auth-page CSS guard) ---
const StandaloneLogin = React.memo(function StandaloneLogin() {
  const emailRef = React.useRef<HTMLInputElement>(null);
  const pwRef = React.useRef<HTMLInputElement>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [working, setWorking] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setWorking(true);
    try {
      const email = emailRef.current?.value?.trim() || "";
      const password = pwRef.current?.value || "";
      const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
      const r = await fetch("/api/v1/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
        },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) {
        let msg = "Invalid credentials";
        try { const j = await r.json(); if (j?.message) msg = j.message; } catch { /* ignore */ }
        setErr(msg);
        return;
      }
      window.location.assign("/");
    } catch {
      setErr("Network error");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="auth-page min-h-screen grid place-items-center bg-page text-primary">
      <form onSubmit={onSubmit} className="rounded-xl border border-hairline bg-surface p-6 w-full max-w-md">
        <h1 className="text-xl font-semibold mb-4">Sign in</h1>
        <label className="block mb-3">
          <span className="text-sm text-secondary">Email</span>
          <input
            ref={emailRef}
            type="email"
            defaultValue=""
            className="mt-1 w-full h-10 px-3 rounded-md bg-card border border-hairline"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </label>
        <label className="block mb-4">
          <span className="text-sm text-secondary">Password</span>
          <input
            ref={pwRef}
            type="password"
            defaultValue=""
            className="mt-1 w-full h-10 px-3 rounded-md bg-card border border-hairline"
            autoComplete="current-password"
            placeholder="Your password"
            required
          />
        </label>
        {err && <div className="text-sm text-red-400 mb-3">{err}</div>}
        <button
          type="submit"
          disabled={working}
          className="h-10 px-4 rounded-md bg-[hsl(var(--brand-orange))] text-black w-full"
        >
          {working ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
});

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
  if (p === "/contacts" || p.startsWith("/contacts")) return <AppContactsParty />;
  if (p === "/organizations" || p.startsWith("/organizations")) return <AppContactsParty />;
  if (p === "/animals" || p.startsWith("/animals")) return <AppAnimals />;
  if (p === "/breeding" || p.startsWith("/breeding")) return <AppBreeding />;
  if (p === "/offspring" || p.startsWith("/offspring")) return <AppOffspring />;
  if (p === "/marketing" || p.startsWith("/marketing")) return <AppMarketing />;
  if (p === "/finance" || p.startsWith("/finance")) return <AppFinance />;
  if (p === "/admin" || p.startsWith("/admin")) return <AdminModule />;
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

  // Hooks
  const [auth, setAuth] = useState<AuthState>(null);
  const [loading, setLoading] = useState(true);
  const [tenantReady, setTenantReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDirty, setSettingsDirty] = useState(false);

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

  // Fetch session
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const r = await fetch("/api/v1/session", { credentials: "include" });
        const j = await r.json().catch(() => null);
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

  // Logout
  async function doLogout() {
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch { /* ignore */ }
    finally {
      try { localStorage.removeItem("BHQ_ORG_ID"); } catch { /* ignore */ }
      try { localStorage.removeItem("BHQ_TENANT_ID"); } catch { /* ignore */ }
      (window as any).__BHQ_ORG_ID__ = undefined;
      (window as any).__BHQ_TENANT_ID__ = undefined;
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
      ) : loading || !tenantReady ? (
        <div className="min-h-screen grid place-items-center text-primary bg-page">Loading…</div>
      ) : !auth ? (
        <StandaloneLogin />
      ) : (
        <div className="theme-dark bhq-grain min-h-screen bg-page text-primary">
          <NavShell
            appTitle={activeModule.label}
            activeKey={activeModule.key}
            logoSize={40}
            navItems={[
              { key: "dashboard", label: "Dashboard", href: "/", icon: "home" },
              { key: "contacts", label: "Contacts", href: "/contacts", icon: "contacts" },
              { key: "animals", label: "Animals", href: "/animals", icon: "animals" },
              { key: "breeding", label: "Breeding", href: "/breeding", icon: "breeding" },
              { key: "offspring", label: "Offspring", href: "/offspring", icon: "offspring" },
              { key: "marketing", label: "Marketing", href: "/marketing" },
              { key: "finance", label: "Finance", href: "/finance", icon: "finance" },
              { key: "admin", label: "Admin", href: "/admin", icon: "admin" },
            ]}
            orgName={orgName}
            onOrgClick={() => alert("Organization switcher coming soon")}
            onSettingsClick={() => setSettingsOpen(true)}
            auth={{
              isAuthenticated: !!auth?.user?.id,
              onLogin: () => window.location.assign("/login"),
              onLogout: doLogout,
            }}
          >
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
        </div>
      )}
    </UiScaleProvider>
  );
}
