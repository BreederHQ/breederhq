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
  damName?: string | null;
  sireName?: string | null;

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

  // foaling tracking (for HORSE species)
  birthDateActual?: string | null;
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

// ───────── New dashboard types for V2 ─────────

export type AlertSeverity = "critical" | "warning" | "info";

export type AlertItem = {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  entityType?: "plan" | "animal" | "offspring" | "contact" | "invoice";
  entityId?: string;
  dismissible: boolean;
  createdAt: string;
};

export type AgendaItemKind =
  | "breeding_appt"
  | "health_check"
  | "placement"
  | "contract"
  | "reminder"
  | "vaccination"
  | "weigh_in";

export type AgendaItem = {
  id: string;
  kind: AgendaItemKind;
  title: string;
  scheduledAt: string;
  entityType?: string;
  entityId?: string;
  completed: boolean;
  severity: "normal" | "important" | "critical";
};

export type OffspringGroupSummary = {
  id: number;
  identifier: string;
  damName: string;
  sireName: string;
  species: string;
  birthedAt: string | null;
  ageWeeks: number | null;
  counts: {
    total: number;
    placed: number;
    available: number;
    reserved: number;
  };
  financialSummary: {
    totalInvoicedCents: number;
    totalPaidCents: number;
  };
  placementProgress: number;
  status: "in_care" | "placement_active" | "nearly_complete";
};

export type WaitlistPressureStatus =
  | "low_demand"
  | "balanced"
  | "high_demand"
  | "oversubscribed";

export type WaitlistPressure = {
  totalWaitlist: number;
  activeWaitlist: number;
  pendingWaitlist: number;
  totalAvailable: number;
  expectedNext90Days: number;
  ratio: number;
  status: WaitlistPressureStatus;
  bySpecies: {
    species: string;
    waitlist: number;
    available: number;
    expected: number;
  }[];
};

export type FinanceSummary = {
  outstandingTotalCents: number;
  invoicedMtdCents: number;
  collectedMtdCents: number;
  expensesMtdCents: number;
  depositsOutstandingCents: number;
};

// Contact follow-up tasks for dashboard
export type ContactFollowUpTaskKind = "follow_up" | "milestone" | "event" | "overdue_invoice";

export type ContactFollowUpTask = {
  id: string;
  kind: ContactFollowUpTaskKind;
  title: string;
  description?: string;
  partyId: number;
  partyName: string;
  partyKind: "CONTACT" | "ORGANIZATION";
  dueDate: string; // ISO date
  severity: "info" | "warning" | "overdue";
  // For linking
  eventId?: string | number;
  milestoneId?: string | number;
  invoiceId?: string | number;
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
    err.code = (json as any)?.code;
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
      list: (params: { module?: string; q?: string; page?: number; limit?: number; includeArchived?: boolean } = {}) =>
        request(`${root}/tags` + qs(params), { method: "GET" }),
      stats: (params: { includeArchived?: boolean } = {}) =>
        request(`${root}/tags/stats` + qs(params), { method: "GET" }),
      create: (data: { name: string; module: string; color?: string | null }) =>
        request(`${root}/tags`, { method: "POST", body: JSON.stringify(data) }),
      update: (id: ID, data: { name?: string; color?: string | null; isArchived?: boolean }) =>
        request(`${root}/tags/${enc(id)}`, { method: "PATCH", body: JSON.stringify(data) }),
      delete: (id: ID) =>
        request(`${root}/tags/${enc(id)}`, { method: "DELETE" }),
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

    /* Billing and subscription management */
    billing: {
      getPlans: () => request(`${root}/billing/plans`, { method: "GET" }),
      getSubscription: () => request(`${root}/billing/subscription`, { method: "GET" }),
      createCheckoutSession: (productId: number, successUrl: string, cancelUrl: string) =>
        request(`${root}/billing/checkout`, {
          method: "POST",
          body: JSON.stringify({ productId, successUrl, cancelUrl }),
          headers: { "content-type": "application/json" },
        }),
      createPortalSession: (returnUrl: string) =>
        request(`${root}/billing/portal`, {
          method: "POST",
          body: JSON.stringify({ returnUrl }),
          headers: { "content-type": "application/json" },
        }),
      addAddon: (addOnProductId: number) =>
        request(`${root}/billing/add-ons`, {
          method: "POST",
          body: JSON.stringify({ addOnProductId }),
          headers: { "content-type": "application/json" },
        }),
      cancelSubscription: (cancelAtPeriodEnd: boolean = true) =>
        request(`${root}/billing/cancel`, {
          method: "POST",
          body: JSON.stringify({ cancelAtPeriodEnd }),
          headers: { "content-type": "application/json" },
        }),
    },

    /* Usage and quota dashboard */
    usage: {
      getMetrics: () => request(`${root}/usage`, { method: "GET" }),
      getMetric: (metricKey: string) => request(`${root}/usage/${encodeURIComponent(metricKey)}`, { method: "GET" }),
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

      // V2 dashboard endpoints
      alerts: async (): Promise<AlertItem[]> => {
        if (!dashboardRemoteEnabled()) return [];
        return requestOr404<AlertItem[]>(`${root}/dashboard/alerts`, { method: "GET" }, []);
      },

      agenda: async (p: { date?: string } = {}): Promise<AgendaItem[]> => {
        if (!dashboardRemoteEnabled()) return [];
        const date = p.date || new Date().toISOString().slice(0, 10);
        return requestOr404<AgendaItem[]>(
          `${root}/dashboard/agenda` + qs({ date }),
          { method: "GET" },
          []
        );
      },

      offspringSummary: async (): Promise<OffspringGroupSummary[]> => {
        if (!dashboardRemoteEnabled()) return [];
        return requestOr404<OffspringGroupSummary[]>(
          `${root}/dashboard/offspring-summary`,
          { method: "GET" },
          []
        );
      },

      waitlistPressure: async (): Promise<WaitlistPressure> => {
        const fallback: WaitlistPressure = {
          totalWaitlist: 0,
          activeWaitlist: 0,
          pendingWaitlist: 0,
          totalAvailable: 0,
          expectedNext90Days: 0,
          ratio: 0,
          status: "balanced",
          bySpecies: [],
        };
        if (!dashboardRemoteEnabled()) return fallback;
        return requestOr404<WaitlistPressure>(
          `${root}/dashboard/waitlist-pressure`,
          { method: "GET" },
          fallback
        );
      },

      financeSummary: async (): Promise<FinanceSummary> => {
        const fallback: FinanceSummary = {
          outstandingTotalCents: 0,
          invoicedMtdCents: 0,
          collectedMtdCents: 0,
          expensesMtdCents: 0,
          depositsOutstandingCents: 0,
        };
        // Finance summary may be available even without dashboard remote enabled
        return requestOr404<FinanceSummary>(
          `${root}/finance/summary`,
          { method: "GET" },
          fallback
        );
      },

      dismissAlert: async (id: string): Promise<{ ok: boolean }> => {
        if (!dashboardRemoteEnabled()) return { ok: true };
        try {
          await request(`${root}/dashboard/alerts/${encodeURIComponent(id)}/dismiss`, {
            method: "POST",
          });
          return { ok: true };
        } catch {
          return { ok: false };
        }
      },

      completeAgendaItem: async (id: string): Promise<{ ok: boolean }> => {
        if (!dashboardRemoteEnabled()) return { ok: true };
        try {
          await request(`${root}/dashboard/agenda/${encodeURIComponent(id)}/complete`, {
            method: "POST",
          });
          return { ok: true };
        } catch {
          return { ok: false };
        }
      },

      // Contact follow-up tasks for prominent dashboard display
      contactTasks: async (): Promise<ContactFollowUpTask[]> => {
        if (!dashboardRemoteEnabled()) return [];
        return requestOr404<ContactFollowUpTask[]>(
          `${root}/dashboard/contact-tasks`,
          { method: "GET" },
          []
        );
      },

      completeContactTask: async (id: string): Promise<{ ok: boolean }> => {
        if (!dashboardRemoteEnabled()) return { ok: true };
        try {
          await request(`${root}/dashboard/contact-tasks/${encodeURIComponent(id)}/complete`, {
            method: "POST",
          });
          return { ok: true };
        } catch {
          return { ok: false };
        }
      },

      snoozeContactTask: async (id: string, newDate: string): Promise<{ ok: boolean }> => {
        if (!dashboardRemoteEnabled()) return { ok: true };
        try {
          await request(`${root}/dashboard/contact-tasks/${encodeURIComponent(id)}/snooze`, {
            method: "POST",
            body: JSON.stringify({ date: newDate }),
            headers: { "content-type": "application/json" },
          });
          return { ok: true };
        } catch {
          return { ok: false };
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
