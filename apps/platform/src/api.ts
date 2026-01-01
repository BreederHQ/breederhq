// apps/platform/src/api.ts

// ───────────────────────── types ─────────────────────────
export type ListParams = { q?: string; page?: number; limit?: number; includeArchived?: boolean };
export type HeadersMap = Record<string, string>;
export type Json = Record<string, any>;
export type ID = number | string;

/* Shared domain types used by dashboard and planner consumers */
export type PlanRow = {
  id: ID;
  name: string;
  status: string;
  species: "Dog" | "Cat" | "Horse" | "";
  damId?: number | null;
  sireId?: number | null;

  // cycle anchors
  lockedCycleStart?: string | null;
  lockedOvulationDate?: string | null;
  lockedDueDate?: string | null;

  // placement fields
  lockedPlacementStartDate?: string | null;
  expectedPlacementStart?: string | null;
  expectedPlacementCompleted?: string | null;

  // projections
  expectedDue?: string | null;
  expectedWeaned?: string | null;
  expectedNextCycleStart?: string | Date | null;
};

export type DashboardTask = {
  id: ID;
  kind: "Check" | "Weigh" | "Contract" | "Appointment" | "Reminder";
  title: string;
  due: string; // yyyy-mm-dd
  severity: "info" | "warning" | "overdue";
  link?: string;
};

export type DashboardKPI = {
  key: string;
  label: string;
  value: number;
  unit?: "%" | "" | "days";
  trend?: "up" | "down" | "flat";
};

export type DashboardFeedItem = {
  id: ID;
  when: string; // iso
  who?: string;
  text: string;
  link?: string;
};

export type DashboardCounts = {
  animals: number;
  activeCycles: number;
  littersInCare: number;
  upcomingBreedings: number;
};

// ───────────────────────── utils ─────────────────────────

function normalizeBase(base: string): string {
  let b = String(base || "").trim();
  if (!b && typeof location !== "undefined") b = location.origin;
  b = b.replace(/\/+$/g, "");
  b = b.replace(/\/api\/v1$/i, "");
  return `${b}/api/v1`;
}

function qs(params: Record<string, string | number | boolean | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.append(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function enc(id: string | number) {
  return encodeURIComponent(String(id));
}

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[2]) : "";
}

/** Resolve tenant and org once per request (runtime, localStorage, env) */
function resolveScope(): { tenantId?: number; orgId?: number } {
  const w: any = (typeof window !== "undefined" ? window : {}) as any;

  // tenant
  const rtTid = Number(w?.__BHQ_TENANT_ID__);
  const lsTid = (() => { try { return Number(localStorage.getItem("BHQ_TENANT_ID") || "NaN"); } catch { return NaN; } })();
  const envTid = Number(((import.meta as any)?.env?.VITE_DEV_TENANT_ID) || "");
  const tenantId =
    (Number.isFinite(rtTid) && rtTid > 0 && rtTid) ||
    (Number.isFinite(lsTid) && lsTid > 0 && lsTid) ||
    (Number.isFinite(envTid) && envTid > 0 && envTid) ||
    undefined;

  // org
  const rtOid = Number(w?.__BHQ_ORG_ID__);
  const lsOid = (() => { try { return Number(localStorage.getItem("BHQ_ORG_ID") || "NaN"); } catch { return NaN; } })();
  const envOid = Number(((import.meta as any)?.env?.VITE_DEV_ORG_ID) || "");
  const orgId =
    (Number.isFinite(rtOid) && rtOid > 0 && rtOid) ||
    (Number.isFinite(lsOid) && lsOid > 0 && lsOid) ||
    (Number.isFinite(envOid) && envOid > 0 && envOid) ||
    undefined;

  return { tenantId, orgId };
}

/** Centralized fetch with cookies, tenant and org headers, CSRF on mutations, and clean errors */
async function request(url: string, init: RequestInit = {}) {
  const method = String(init.method || "GET").toUpperCase();
  const scope = resolveScope();

  const headers = new Headers(init.headers as any);

  if (!headers.has("accept")) headers.set("accept", "application/json");

  if (scope.tenantId) headers.set("x-tenant-id", String(scope.tenantId));
  if (scope.orgId) headers.set("x-org-id", String(scope.orgId));

  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    const xsrf = readCookie("XSRF-TOKEN");
    if (xsrf && !headers.has("x-csrf-token")) headers.set("x-csrf-token", xsrf);

    if (!headers.has("content-type") && init.body && typeof init.body === "string") {
      headers.set("content-type", "application/json");
    }
  }

  const res = await fetch(url, { credentials: "include", ...init, headers });

  const ct = res.headers.get("content-type") || "";
  const text = await res.text().catch(() => "");
  const json = ct.includes("application/json")
    ? (() => { try { return text ? JSON.parse(text) : undefined; } catch { return undefined; } })()
    : undefined;

  if (!res.ok) {
    const err: any = new Error((json as any)?.message || (json as any)?.error || text || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = json ?? text;
    throw err;
  }
  return ct.includes("application/json") ? json : text;
}

/** Return fallback if the server replies 404 */
async function requestOr404<T>(url: string, init: RequestInit, fallback: T): Promise<T> {
  try {
    return (await request(url, init)) as T;
  } catch (e: any) {
    if (e?.status === 404) return fallback;
    throw e;
  }
}

/** Gate remote dashboard calls behind a runtime or env flag */
function dashboardRemoteEnabled(): boolean {
  const w = (typeof window !== "undefined" ? window : {}) as any;
  if (typeof w.__BHQ_DASHBOARD_REMOTE__ === "boolean") return w.__BHQ_DASHBOARD_REMOTE__;
  const env = (import.meta as any)?.env?.VITE_DASHBOARD_REMOTE;
  return env === "1" || env === "true" || env === true;
}

// ───────────────────────── factory ─────────────────────────

export function makeApi(base?: string) {
  const root = normalizeBase(base || "");

  return {
    auth: {
      me: () => request(`${root}/auth/me`, { method: "GET", cache: "no-store" }),
      logoutRedirect: () => {
        const back = (typeof window !== "undefined" ? window.location.origin : "") + "/";
        const url = `${root}/auth/logout?redirect=${encodeURIComponent(back)}`;
        if (typeof window !== "undefined") window.location.assign(url);
      },
      login: (body: Json) =>
        request(`${root}/auth/login`, {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "content-type": "application/json" },
        }),
    },

    contacts: {
      list: (p: ListParams = {}) => request(`${root}/contacts` + qs(p), { method: "GET" }),
      get: (id: string | number) =>
        request(`${root}/contacts/${enc(id)}`, { method: "GET" }),
      update: (id: string | number, body: Json) =>
        request(`${root}/contacts/${enc(id)}`, {
          method: "PATCH",
          body: JSON.stringify(body),
          headers: { "content-type": "application/json" },
        }),
      create: (body: Json) =>
        request(`${root}/contacts`, {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "content-type": "application/json" },
        }),
      archive: (id: string | number, reason?: string) =>
        request(`${root}/contacts/${enc(id)}/archive`, {
          method: "POST",
          body: JSON.stringify({ reason: reason ?? null }),
          headers: { "content-type": "application/json" },
        }),
      restore: (id: string | number) =>
        request(`${root}/contacts/${enc(id)}/restore`, { method: "POST" }),
    },

    tags: {
      list: (type: "contact" = "contact") =>
        request(`${root}/tags` + qs({ type }), { method: "GET" }),
    },

    organizations: {
      list: (p: { q?: string; page?: number; limit?: number; includeArchived?: boolean } = {}) =>
        request(`${root}/organizations` + qs(p), { method: "GET" }),

      get: (id: string | number) =>
        request(`${root}/organizations/${enc(id)}`, { method: "GET" }),

      create: (body: Json) =>
        request(`${root}/organizations`, {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "content-type": "application/json" },
        }),

      update: (id: string | number, patch: Json) =>
        request(`${root}/organizations/${enc(id)}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
          headers: { "content-type": "application/json" },
        }),

      archive: (id: string | number, reason?: string) =>
        request(`${root}/organizations/${enc(id)}/archive`, {
          method: "POST",
          body: JSON.stringify({ reason: reason ?? null }),
          headers: { "content-type": "application/json" },
        }),

      restore: (id: string | number) =>
        request(`${root}/organizations/${enc(id)}/restore`, { method: "POST" }),

      remove: (id: string | number) =>
        request(`${root}/organizations/${enc(id)}`, { method: "DELETE" }),
    },

    /* Breeding endpoints used by dashboard and planner */
    breeding: {
      plans: {
        list: (p: { status?: string; q?: string; page?: number; limit?: number } = {}) =>
          request(`${root}/breeding/plans` + qs(p), { method: "GET" }),
        get: (id: ID) => request(`${root}/breeding/plans/${enc(id)}`, { method: "GET" }),
        create: (body: Json) =>
          request(`${root}/breeding/plans`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: { "content-type": "application/json" },
          }),
        update: (id: ID, patch: Json) =>
          request(`${root}/breeding/plans/${enc(id)}`, {
            method: "PATCH",
            body: JSON.stringify(patch),
            headers: { "content-type": "application/json" },
          }),
        remove: (id: ID) => request(`${root}/breeding/plans/${enc(id)}`, { method: "DELETE" }),
      },
      program: {
        getForTenant: (tenantId?: number) =>
          request(
            `${root}/tenants/${enc(tenantId ?? resolveScope().tenantId ?? 0)}/breeding-program`,
            { method: "GET" }
          ),
        updateForTenant: (body: Json, tenantId?: number) =>
          request(
            `${root}/tenants/${enc(tenantId ?? resolveScope().tenantId ?? 0)}/breeding-program`,
            { method: "PUT", body: JSON.stringify(body), headers: { "content-type": "application/json" } }
          ),
      },
    },

    /* Generic tenant settings for future modules */
    settings: {
      get: (namespace: string, tenantId?: number) =>
        request(
          `${root}/tenants/${enc(tenantId ?? resolveScope().tenantId ?? 0)}/settings/${encodeURIComponent(namespace)}`,
          { method: "GET" }
        ),
      put: (namespace: string, body: Json, tenantId?: number) =>
        request(
          `${root}/tenants/${enc(tenantId ?? resolveScope().tenantId ?? 0)}/settings/${encodeURIComponent(namespace)}`,
          { method: "PUT", body: JSON.stringify(body), headers: { "content-type": "application/json" } }
        ),
    },

    /* Dashboard read models with remote gate and 404 fallbacks */
    dashboard: {
      counts: () => {
        if (!dashboardRemoteEnabled()) {
          const fallback: DashboardCounts = { animals: 0, activeCycles: 0, littersInCare: 0, upcomingBreedings: 0 };
          return Promise.resolve(fallback);
        }
        return requestOr404<DashboardCounts>(
          `${root}/dashboard/counts`,
          { method: "GET" },
          { animals: 0, activeCycles: 0, littersInCare: 0, upcomingBreedings: 0 }
        );
      },

      tasks: (p: { limit?: number } = {}) => {
        if (!dashboardRemoteEnabled()) return Promise.resolve<DashboardTask[]>([]);
        return requestOr404<DashboardTask[]>(
          `${root}/dashboard/tasks` + qs(p),
          { method: "GET" },
          []
        );
      },

      kpis: (p: { window?: "3m" | "6m" | "12m" } = { window: "6m" }) => {
        if (!dashboardRemoteEnabled()) return Promise.resolve<DashboardKPI[]>([]);
        return requestOr404<DashboardKPI[]>(
          `${root}/dashboard/kpis` + qs(p),
          { method: "GET" },
          []
        );
      },

      feed: (p: { limit?: number } = { limit: 25 }) => {
        if (!dashboardRemoteEnabled()) return Promise.resolve<DashboardFeedItem[]>([]);
        return requestOr404<DashboardFeedItem[]>(
          `${root}/dashboard/feed` + qs(p),
          { method: "GET" },
          []
        );
      },

      // tolerant read for planner data used by the dashboard
      plans: async (p: { status?: string } = { status: "Active,Planned" }) => {
        if (!dashboardRemoteEnabled()) return [];
        try {
          const r = await request(`${root}/breeding/plans` + qs(p), { method: "GET" });
          return Array.isArray(r) ? (r as PlanRow[]) : [];
        } catch {
          return [];
        }
      },
    },
  };
}

// ───────────────────────── singleton ─────────────────────────

const globalBase =
  (typeof window !== "undefined" && (window as any).__BHQ_API_BASE__) ||
  (import.meta as any)?.env?.VITE_API_URL ||
  (typeof localStorage !== "undefined" ? localStorage.getItem("BHQ_API_URL") : "") ||
  "";

export const api = makeApi(String(globalBase));
