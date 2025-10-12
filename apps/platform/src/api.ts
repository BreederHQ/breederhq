// apps/platform/src/api.ts

export type ListParams = { q?: string; page?: number; limit?: number; includeArchived?: boolean };
export type HeadersMap = Record<string, string>;
export type Json = Record<string, any>;

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

/* ───────────────────────── helpers ───────────────────────── */

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[2]) : "";
}

/** Resolve tenant/org once per request (runtime → localStorage → env) */
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

  // org (optional; harmless if unused by server)
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

/** Centralized fetch with cookies + tenant/org + CSRF (mutations) + nice errors */
async function request(url: string, init: RequestInit = {}) {
  const method = String(init.method || "GET").toUpperCase();
  const scope = resolveScope();

  // Start with any caller-supplied headers
  const headers = new Headers(init.headers as any);

  // Always accept JSON
  if (!headers.has("accept")) headers.set("accept", "application/json");

  // Tenant (required for tenant-scoped APIs)
  if (scope.tenantId) headers.set("x-tenant-id", String(scope.tenantId));

  // Optional org context (legacy/optional)
  if (scope.orgId) headers.set("x-org-id", String(scope.orgId));

  // CSRF + default JSON content-type only for mutating methods
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

/* ───────────────────────── factory ───────────────────────── */

export function makeApi(base?: string) {
  const root = normalizeBase(base || "");

  return {
    auth: {
      me: () => request(`${root}/auth/me`, { method: "GET" }),
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
        request(`${root}/contacts/${encodeURIComponent(String(id))}`, { method: "GET" }),
      update: (id: string | number, body: Json) =>
        request(`${root}/contacts/${encodeURIComponent(String(id))}`, {
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
        request(`${root}/contacts/${encodeURIComponent(String(id))}/archive`, {
          method: "POST",
          body: JSON.stringify({ reason: reason ?? null }),
          headers: { "content-type": "application/json" },
        }),
      restore: (id: string | number) =>
        request(`${root}/contacts/${encodeURIComponent(String(id))}/restore`, { method: "POST" }),
    },

    tags: {
      list: (type: "contact" = "contact") =>
        request(`${root}/tags` + qs({ type }), { method: "GET" }),
    },

    organizations: {
      list: (p: { q?: string; page?: number; limit?: number; includeArchived?: boolean } = {}) =>
        request(`${root}/organizations` + qs(p), { method: "GET" }),

      get: (id: string | number) =>
        request(`${root}/organizations/${encodeURIComponent(String(id))}`, { method: "GET" }),

      create: (body: Json) =>
        request(`${root}/organizations`, {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "content-type": "application/json" },
        }),

      update: (id: string | number, patch: Json) =>
        request(`${root}/organizations/${encodeURIComponent(String(id))}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
          headers: { "content-type": "application/json" },
        }),

      archive: (id: string | number, reason?: string) =>
        request(`${root}/organizations/${encodeURIComponent(String(id))}/archive`, {
          method: "POST",
          body: JSON.stringify({ reason: reason ?? null }),
          headers: { "content-type": "application/json" },
        }),

      restore: (id: string | number) =>
        request(`${root}/organizations/${encodeURIComponent(String(id))}/restore`, { method: "POST" }),

      remove: (id: string | number) =>
        request(`${root}/organizations/${encodeURIComponent(String(id))}`, { method: "DELETE" }),
    },
  };
}

/* ───────────────────────── singleton (optional) ───────────────────────── */

const globalBase =
  (typeof window !== "undefined" && (window as any).__BHQ_API_BASE__) ||
  (import.meta as any)?.env?.VITE_API_URL ||
  (typeof localStorage !== "undefined" ? localStorage.getItem("BHQ_API_URL") : "") ||
  "";

export const api = makeApi(String(globalBase));
