// packages/api/src/http.ts
// Centralized fetch that always forwards cookies, X-Org-Id, and X-Tenant-Id

export type Json = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

export type MakeAuthHeader = () => Record<string, string> | undefined;

export interface Http {
  get<T = any>(path: string, init?: RequestInit): Promise<T>;
  post<T = any>(path: string, body?: any, init?: RequestInit): Promise<T>;
  patch<T = any>(path: string, body?: any, init?: RequestInit): Promise<T>;
  put<T = any>(path: string, body?: any, init?: RequestInit): Promise<T>;
  delete<T = any>(path: string, init?: RequestInit): Promise<T>;
}

function getApiBase(): string {
  // Vite proxy keeps /api/* at same origin in dev; still allow override
  const w = (window as any) || {};
  const base = w.__BHQ_API_BASE__ || "";
  return base; // e.g. "" or "http://localhost:6170"
}

function getOrgId(): string | null {
  const w = (window as any) || {};
  const fromWin = w.__BHQ_ORG_ID__;
  if (fromWin != null && String(fromWin).trim() !== "") return String(fromWin);
  try {
    const ls = localStorage.getItem("BHQ_ORG_ID");
    if (ls && ls.trim() !== "") return ls;
  } catch { }
  return null;
}

function getTenantId(): string | null {
  const w = (window as any) || {};
  const fromWin = w.__BHQ_TENANT_ID__;
  if (fromWin != null && String(fromWin).trim() !== "") return String(fromWin);
  try {
    const ls = localStorage.getItem("BHQ_TENANT_ID");
    if (ls && ls.trim() !== "") return ls;
  } catch { }
  return null;
}

function getCsrfToken(): string | null {
  try {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export async function apiFetch<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const base = getApiBase();
  const url = path.startsWith("http") ? path : `${base}${path}`;

  const headers = new Headers(init.headers || {});
  // Default JSON unless caller overrides
  if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  // Inject org header if we have one
  const orgId = getOrgId();
  if (Number(orgId) > 0 && !headers.has("X-Org-Id")) {
    headers.set("X-Org-Id", String(Number(orgId)));
  }

  // Inject tenant header if we have one
  const tenantId = getTenantId();
  if (Number(tenantId) > 0 && !headers.has("X-Tenant-Id")) {
    headers.set("X-Tenant-Id", String(Number(tenantId)));
  }

  // Inject CSRF token for mutation requests (POST, PUT, PATCH, DELETE)
  const method = (init.method || "GET").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken && !headers.has("x-csrf-token")) {
      headers.set("x-csrf-token", csrfToken);
    }
  }

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "include",     // << send session cookie (bhq_s_app, bhq_s_portal, or bhq_s_mkt)
    redirect: init.redirect ?? "follow",
  });

  // Handle common auth flows
  if (res.status === 401) {
    // Session missing/expired — bounce to login
    try { localStorage.removeItem("BHQ_ORG_ID"); } catch { }
    (window as any).__BHQ_ORG_ID__ = undefined;
    if (!location.pathname.startsWith("/login")) {
      location.assign("/login");
    }
    throw new Error("unauthorized");
  }

  // Best-effort JSON parse
  const text = await res.text();
  const data = (() => { try { return text ? JSON.parse(text) : null; } catch { return text as any; } })();

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    const err = new Error(String(msg)) as any;
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export function createHttp(baseURL: string, makeAuth?: MakeAuthHeader): Http {
  const normalizedBase = baseURL.replace(/\/+$/, "");

  async function request<T>(
    method: string,
    path: string,
    body?: any,
    init: RequestInit = {}
  ): Promise<T> {
    const url = path.startsWith("http") ? path : `${normalizedBase}${path}`;
    const headers = new Headers(init.headers || {});

    // Add auth headers if provided
    if (makeAuth) {
      const authHeaders = makeAuth();
      if (authHeaders) {
        Object.entries(authHeaders).forEach(([k, v]) => headers.set(k, v));
      }
    }

    // Default JSON content type for mutations
    if (body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    // Inject org header if we have one
    const orgId = getOrgId();
    if (Number(orgId) > 0 && !headers.has("X-Org-Id")) {
      headers.set("X-Org-Id", String(Number(orgId)));
    }

    // Inject tenant header if we have one
    const tenantId = getTenantId();
    if (Number(tenantId) > 0 && !headers.has("X-Tenant-Id")) {
      headers.set("X-Tenant-Id", String(Number(tenantId)));
    }

    // Inject CSRF token for mutation requests (POST, PUT, PATCH, DELETE)
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      const csrfToken = getCsrfToken();
      if (csrfToken && !headers.has("x-csrf-token")) {
        headers.set("x-csrf-token", csrfToken);
      }
    }

    const res = await fetch(url, {
      ...init,
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
      redirect: init.redirect ?? "follow",
    });

    // Handle common auth flows
    if (res.status === 401) {
      try { localStorage.removeItem("BHQ_ORG_ID"); } catch { }
      (window as any).__BHQ_ORG_ID__ = undefined;
      if (typeof location !== "undefined" && !location.pathname.startsWith("/login")) {
        location.assign("/login");
      }
      throw new Error("unauthorized");
    }

    // Best-effort JSON parse
    const text = await res.text();
    const data = (() => {
      try {
        return text ? JSON.parse(text) : null;
      } catch {
        return text as any;
      }
    })();

    if (!res.ok) {
      const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
      const err = new Error(String(msg)) as any;
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data as T;
  }

  return {
    get: <T = any>(path: string, init?: RequestInit) => request<T>("GET", path, undefined, init),
    post: <T = any>(path: string, body?: any, init?: RequestInit) => request<T>("POST", path, body, init),
    patch: <T = any>(path: string, body?: any, init?: RequestInit) => request<T>("PATCH", path, body, init),
    put: <T = any>(path: string, body?: any, init?: RequestInit) => request<T>("PUT", path, body, init),
    delete: <T = any>(path: string, init?: RequestInit) => request<T>("DELETE", path, undefined, init),
  };
}
