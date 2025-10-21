// App-Platform.tsx 
import React, { useEffect, useMemo, useState } from "react";
import InviteSignupPage from "./pages/InviteSignupPage";
import VerifyPage from "./pages/VerifyPage";
import NavShell from "@bhq/ui/layouts/NavShell";

// Modules
import ContactsModule from "@bhq/contacts/App-Contacts";
import OrganizationsModule from "@bhq/organizations/App-Organizations";
import AnimalsModule from "@bhq/animals/App-Animals";
import BreedingModule from "@bhq/breeding/App-Breeding";
import AdminModule from "@bhq/admin/App-Admin";

// Support Pages
import SettingsPanel from "./pages/SettingsPanel";

// Lightweight “current module” state (key + label)
type ActiveModule = { key: "contacts" | "organizations" | "animals" | "breeding" | "offspring"; label: string };
const DEFAULT_MODULE: ActiveModule = { key: "contacts", label: "Contacts" };

const overlayMode = (localStorage.getItem('BHQ_OVERLAY_MODE') || 'local') as 'local'|'global';
(window as any).__BHQ_OVERLAY_MODE = overlayMode;

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
        try { const j = await r.json(); if (j?.message) msg = j.message; } catch { }
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

// compute API root once; works with same-origin dev + env overrides
const API_ROOT = (
  (window as any).__BHQ_API_BASE__ ||
  (import.meta as any)?.env?.VITE_API_BASE ||
  (import.meta as any)?.env?.VITE_API_URL ||
  localStorage.getItem("BHQ_API_URL") ||
  location.origin
).replace(/\/+$/, '').replace(/\/api\/v1$/i, '');
(window as any).__BHQ_API_BASE__ = API_ROOT;


// Simple path router, supports /contacts, /organizations, /animals, /breeding, /offspring
function RouteView() {
  const [path, setPath] = React.useState<string>(() => {
    try { return window.location.pathname.toLowerCase(); } catch { return "/contacts"; }
  });

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname.toLowerCase());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // normalize trailing slash
  const p = path.endsWith("/") ? path.slice(0, -1) : path;

  if (p === "/organizations" || p.startsWith("/organizations")) return <OrganizationsModule />;
  if (p === "/animals" || p.startsWith("/animals")) return <AnimalsModule />;
  if (p === "/contacts" || p.startsWith("/contacts")) return <ContactsModule />;
  if (p === "/breeding" || p.startsWith("/breeding")) return <BreedingModule />;
  if (p === "/admin" || p.startsWith("/admin")) return <AdminModule />;
  if (p === "/organizations" || p.startsWith("/organizations")) return <OrganizationsModule />;
  

  // default
  return <ContactsModule />;
}


// --- MAIN ---
export default function AppPlatform() {
  // …existing state…

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
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";

  // Public routes short-circuit BEFORE any hooks mismatch risk
  if (pathname.startsWith("/invite")) return <InviteSignupPage />;
  if (pathname.startsWith("/verify")) return <VerifyPage />;

  // Hooks (order must never change)
  const [auth, setAuth] = useState<AuthState>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDirty, setSettingsDirty] = useState(false);

  // ESC closes Settings only when not dirty
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && settingsOpen && !settingsDirty) {
        setSettingsOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsOpen, settingsDirty]);

  // Fetch session (always called)
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

  // Compute org id (prefer server org; fallback to LS; never invent 1)
  const computedOrgId = useMemo(() => {
    const fromAuthOrg = Number((auth as any)?.org?.id ?? NaN);
    if (Number.isFinite(fromAuthOrg)) return fromAuthOrg;

    let fromLs = NaN;
    try {
      const lsRaw = localStorage.getItem("BHQ_ORG_ID");
      fromLs = lsRaw ? Number(lsRaw) : NaN;
    } catch { }
    if (Number.isFinite(fromLs)) return fromLs;

    return NaN;
  }, [auth]);

  useEffect(() => {
    const n = Number(computedOrgId);
    const has = Number.isFinite(n) && n > 0;

    // Keep your existing globals/localStorage
    (window as any).__BHQ_ORG_ID__ = has ? n : undefined;
    try {
      has
        ? localStorage.setItem("BHQ_ORG_ID", String(n))
        : localStorage.removeItem("BHQ_ORG_ID");
    } catch { }

    // NEW: expose a stable API for feature modules
    (window as any).platform = (window as any).platform || {};

    if (has) {
      (window as any).platform.currentOrgId = n;
      window.dispatchEvent(new CustomEvent("platform:orgChanged", { detail: { orgId: n } }));
    } else {
      delete (window as any).platform.currentOrgId;
      window.dispatchEvent(new CustomEvent("platform:orgChanged", { detail: { orgId: null } }));
    }

    if (import.meta.env?.DEV) console.log("[platform] org selected =", has ? n : null);
  }, [computedOrgId]);

  // Logout
  async function doLogout() {
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch {/* ignore */ }
    finally {
      try { localStorage.removeItem("BHQ_ORG_ID"); } catch { }
      (window as any).__BHQ_ORG_ID__ = undefined;
      setAuth(null);
      window.location.replace(`/login?ts=${Date.now()}`);
    }
  }

  const orgName =
    (auth?.org?.name && String(auth.org.name).trim())
      ? String(auth.org.name).trim()
      : "Organization";

  // Render
  if (loading) {
    return <div className="min-h-screen grid place-items-center text-primary bg-page">Loading…</div>;
  }

  if (!auth) {
    return <StandaloneLogin />;
  }

  return (
    <div className="theme-dark bhq-grain min-h-screen bg-page text-primary">
      <NavShell
        appTitle={activeModule.label}
        activeKey={activeModule.key}
        logoSize={40}
        navItems={[
          { key: "contacts", label: "Contacts", href: "/contacts", icon: "contacts" },
          { key: "organizations", label: "Organizations", href: "/organizations", icon: "organizations" },
          { key: "animals", label: "Animals", href: "/animals", icon: "animals" },
          { key: "breeding", label: "Breeding", href: "/breeding", icon: "breeding" },
          { key: "offspring", label: "Offspring", href: "/offspring", icon: "offspring" },
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
    </div>
  );
}
