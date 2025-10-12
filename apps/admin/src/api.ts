// apps/admin/src/api.ts

export type ID = number | string;
export type HeadersMap = Record<string, string>;
export type Json = Record<string, any>;

function baseUrl() {
  const w = window as any;
  const raw = w.__BHQ_API_BASE__ || (import.meta as any)?.env?.VITE_API_URL || location.origin;
  const trimmed = String(raw).replace(/\/+$/, "");
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
}

function readCookie(name: string): string {
  const m = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[2]) : "";
}

function scopedHeaders(): HeadersMap {
  const w = window as any;

  // Tenant (primary)
  const tFromRuntime = Number(w?.__BHQ_TENANT_ID__);
  let tenantId = Number.isFinite(tFromRuntime) && tFromRuntime > 0 ? tFromRuntime : NaN;
  if (!Number.isFinite(tenantId)) {
    try {
      const ls = localStorage.getItem("BHQ_TENANT_ID");
      if (ls) tenantId = Number(ls);
    } catch {}
  }

  const h: HeadersMap = { Accept: "application/json" };
  if (Number.isFinite(tenantId) && tenantId > 0) h["X-Tenant-Id"] = String(tenantId);
  return h;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${baseUrl()}${path}`;
  const method = String(init.method || "GET").toUpperCase();

  const headers = new Headers({ ...(init.headers as any), ...scopedHeaders() });

  // CSRF only for state-changing
  if (!/^(GET|HEAD|OPTIONS)$/.test(method)) {
    const token = readCookie("XSRF-TOKEN");
    if (token) headers.set("x-csrf-token", token);
    // Only set JSON if we’re sending JSON
    if (init.body && typeof init.body === "string" && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
  }

  const res = await fetch(url, { credentials: "include", ...init, headers });
  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const payload = isJson ? await res.json().catch(() => undefined) : await res.text().catch(() => "");

  if (!res.ok) {
    const msg = (payload && (payload.message || payload.error)) || `HTTP ${res.status}`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.body = payload;
    throw err;
  }
  return payload as T;
}

/** Shapes used by App-Admin */
export type TenantDTO = {
  id: number;
  name: string;
  primaryEmail: string | null;
  usersCount: number;
  organizationsCount: number;
  contactsCount: number;
  animalsCount: number;
  billing:
    | {
        provider: string | null;
        customerId: string | null;
        subscriptionId: string | null;
        plan: string | null;
        status: string | null;
        currentPeriodEnd: string | null;
        createdAt?: string | null;
        updatedAt?: string | null;
      }
    | null;
  createdAt: string;
  updatedAt: string;
};

export type TenantUserDTO = {
  userId: string;
  email: string;
  name?: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER" | "BILLING" | "VIEWER";
  verified: boolean;
  createdAt?: string | null;
  isSuperAdmin?: boolean;
};

export const adminApi = {
  // ---- Tenants
  listTenants: (p: { q?: string; page?: number; limit?: number; sort?: string } = {}) => {
    const sp = new URLSearchParams();
    if (p.q) sp.set("q", p.q);
    if (p.page != null) sp.set("page", String(p.page));
    if (p.limit != null) sp.set("limit", String(p.limit));
    if (p.sort) sp.set("sort", p.sort);
    return request<{ items: TenantDTO[]; total: number }>(`/tenants?${sp.toString()}`);
  },
  getTenant: (id: ID) => request<TenantDTO>(`/tenants/${encodeURIComponent(String(id))}`),
  patchTenant: (id: ID, body: Partial<{ name: string; primaryEmail: string | null }>) =>
    request<TenantDTO>(`/tenants/${encodeURIComponent(String(id))}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  // ---- Billing
  getBilling: (tenantId: ID) =>
    request<TenantDTO["billing"]>(`/tenants/${encodeURIComponent(String(tenantId))}/billing`),
  patchBilling: (
    tenantId: ID,
    body: Partial<{
      provider: string | null;
      customerId: string | null;
      subscriptionId: string | null;
      plan: string | null;
      status: string | null;
      currentPeriodEnd: string | null;
    }>
  ) =>
    request<TenantDTO["billing"]>(`/tenants/${encodeURIComponent(String(tenantId))}/billing`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  // ---- Users (memberships)
  listUsers: (
    tenantId: ID,
    p: { q?: string; role?: TenantUserDTO["role"]; page?: number; limit?: number } = {}
  ) => {
    const sp = new URLSearchParams();
    if (p.q) sp.set("q", p.q);
    if (p.role) sp.set("role", p.role);
    if (p.page != null) sp.set("page", String(p.page));
    if (p.limit != null) sp.set("limit", String(p.limit));
    return request<{ items: TenantUserDTO[]; total: number }>(
      `/tenants/${encodeURIComponent(String(tenantId))}/users?${sp.toString()}`
    );
  },
  addUser: (tenantId: ID, body: { email: string; name?: string; role: TenantUserDTO["role"] }) =>
    request<TenantUserDTO>(`/tenants/${encodeURIComponent(String(tenantId))}/users`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  setRole: (tenantId: ID, userId: string, role: TenantUserDTO["role"]) =>
    request<{ ok: true }>(
      `/tenants/${encodeURIComponent(String(tenantId))}/users/${encodeURIComponent(userId)}/role`,
      { method: "PUT", body: JSON.stringify({ role }) }
    ),
  verifyEmail: (tenantId: ID, userId: string) =>
    request<{ ok: true }>(
      `/tenants/${encodeURIComponent(String(tenantId))}/users/${encodeURIComponent(userId)}/verify-email`,
      { method: "POST" }
    ),
  resetPassword: (tenantId: ID, userId: string) =>
    request<{ ok: true }>(
      `/tenants/${encodeURIComponent(String(tenantId))}/users/${encodeURIComponent(userId)}/reset-password`,
      { method: "POST" }
    ),
  removeUser: (tenantId: ID, userId: string) =>
    request<{ ok: true }>(`/tenants/${encodeURIComponent(String(tenantId))}/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
    }),
  setPassword: (tenantId: ID, userId: string, password: string) =>
    request<{ ok: true }>(
      `/tenants/${encodeURIComponent(String(tenantId))}/users/${encodeURIComponent(userId)}/password`,
      { method: "PUT", body: JSON.stringify({ password }) }
    ),

  // ---- Provision (admin-only)
  adminProvisionTenant: (body: {
    tenant: { name: string; primaryEmail?: string | null };
    owner: { email: string; name?: string | null; verify?: boolean; makeDefault?: boolean };
    billing?:
      | {
          provider?: string | null;
          customerId?: string | null;
          subscriptionId?: string | null;
          plan?: string | null;
          status?: string | null;
          currentPeriodEnd?: string | null;
        }
      | undefined;
  }) =>
    request<{
      tenant: { id: ID; name: string; primaryEmail: string | null; createdAt: string; updatedAt: string };
      owner: {
        id: string;
        email: string;
        name: string | null;
        verified: boolean;
        isSuperAdmin: boolean;
        createdAt: string;
      };
      billing: TenantDTO["billing"];
    }>(`/tenants/admin-provision`, { method: "POST", body: JSON.stringify(body) }),

  // ---- Session helper for gating Super Admin UI
  me: () =>
    request<{ user: { id: string; email: string; name?: string | null; isSuperAdmin?: boolean | null } | null }>(
      `/session`
    ).catch(async () => {
      try {
        // fallback legacy
        return await request<any>(`/user`);
      } catch {
        return { user: null };
      }
    }),
};
