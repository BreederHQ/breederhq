// apps/admin/src/api.ts

/** ───────────────────────── Types ───────────────────────── */
export type ID = number | string;
export type Json = Record<string, any>;

export type TenantDTO = {
  id: number;
  name: string;
  primaryEmail: string | null;
  usersCount: number;
  organizationsCount: number;
  contactsCount: number;
  animalsCount: number;
  billing: {
    provider: string | null;
    customerId: string | null;
    subscriptionId: string | null;
    plan: string | null;
    status: string | null;
    currentPeriodEnd: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } | null;
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

export type SessionUserDTO = {
  id: string;
  email: string;
  name?: string | null;
  isSuperAdmin?: boolean | null;
} | null;

/** ───────────────────────── Base utils ───────────────────────── */
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

function getTenantId(): number | null {
  const w = window as any;
  const fromRuntime = Number(w?.__BHQ_TENANT_ID__);
  if (Number.isFinite(fromRuntime) && fromRuntime > 0) return fromRuntime;
  try {
    const ls = localStorage.getItem("BHQ_TENANT_ID");
    if (ls) {
      const id = Number(ls);
      if (Number.isFinite(id) && id > 0) return id;
    }
  } catch { }
  return null;
}

/** ───────────────────────── Request helper ───────────────────────── */
type ReqOpts = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  tenantScoped?: boolean; // default true
};

async function request<T = any>(path: string, opts: ReqOpts = {}): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    tenantScoped = true,
  } = opts;

  const url = `${baseUrl()}${path}`;
  const h = new Headers(headers);
  h.set("Accept", "application/json");

  // Attach tenant header only when we mean to
  if (tenantScoped) {
    const tid = getTenantId();
    if (tid != null) h.set("X-Tenant-Id", String(tid));
  }


  // CSRF header (optional on GET; harmless if present)
  const token = readCookie("XSRF-TOKEN");
  if (token) h.set("x-csrf-token", token);

  const bodyOut =
    body == null
      ? undefined
      : typeof body === "string"
        ? (h.has("content-type") ? body : (h.set("content-type", "application/json"), body))
        : (h.set("content-type", "application/json"), JSON.stringify(body));

  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: h,
    body: bodyOut,
  });
  const ctype = res.headers.get("content-type") || "";
  const isJson = ctype.includes("application/json");
  const payload = isJson ? await res.json().catch(() => undefined) : await res.text().catch(() => "");

  if (!res.ok) {
    console.warn('API error', method, url, payload); // <— temp: see exact 400 reason
    const msg = (payload && (payload.message || payload.error || payload.detail)) || `HTTP ${res.status}`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.body = payload;
    throw err;
  }

  // 204 No Content
  if (res.status === 204) return undefined as any;
  return payload as T;
}

/** ───────────────────────── API surface ───────────────────────── */
export const adminApi = {
  /** Session / identity */
 me(tenantId?: ID): Promise<{ user: SessionUserDTO }> {
    const headers: Record<string, string> = {};
    if (tenantId != null) headers["X-Tenant-Id"] = String(tenantId);
    return request<{ user: SessionUserDTO }>('/user', { headers }); // keep tenantScoped default (true)
  },
  
  /** Tenants (SCOPED: current tenant only; legacy behavior) */
  listTenants(p: { q?: string; page?: number; limit?: number; sort?: string } = {}) {
    const sp = new URLSearchParams();
    if (p.q) sp.set("q", p.q);
    if (p.page != null) setNum(sp, "page", p.page);
    if (p.limit != null) setNum(sp, "limit", p.limit);
    if (p.sort) sp.set("sort", p.sort);
    return request<{ items: TenantDTO[]; total: number }>(`/tenants?${sp.toString()}`);
  },

  /** Tenants (UNSCOPED: super admin only; ALL tenants) */
  listTenantsAll(p: { q?: string; page?: number; limit?: number; sort?: string } = {}) {
    const sp = new URLSearchParams();
    if (p.q) sp.set("q", p.q);
    if (p.page != null) setNum(sp, "page", p.page);
    if (p.limit != null) setNum(sp, "limit", p.limit);
    if (p.sort) sp.set("sort", p.sort);
    return request<{ items: TenantDTO[]; total: number }>(`/admin/tenants?${sp.toString()}`, {
      tenantScoped: false,
    });
  },

  getTenant(id: ID) {
    return request<TenantDTO>(`/tenants/${encodeURIComponent(String(id))}`);
  },

  patchTenant(id: ID, body: Partial<{ name: string; primaryEmail: string | null }>) {
    return request<TenantDTO>(`/tenants/${encodeURIComponent(String(id))}`, {
      method: "PATCH",
      body,
    });
  },

  /** Billing (SCOPED) */
  getBilling(tenantId: ID) {
    return request<TenantDTO["billing"]>(`/tenants/${encodeURIComponent(String(tenantId))}/billing`);
  },

  patchBilling(
    tenantId: ID,
    body: Partial<{
      provider: string | null;
      customerId: string | null;
      subscriptionId: string | null;
      plan: string | null;
      status: string | null;
      currentPeriodEnd: string | null;
    }>
  ) {
    return request<TenantDTO["billing"]>(`/tenants/${encodeURIComponent(String(tenantId))}/billing`, {
      method: "PATCH",
      body,
    });
  },

  /** Users (SCOPED) */
  listUsers(
    tenantId: ID,
    p: { q?: string; role?: TenantUserDTO["role"]; page?: number; limit?: number } = {}
  ) {
    const sp = new URLSearchParams();
    if (p.q) sp.set("q", p.q);
    if (p.role) sp.set("role", p.role);
    if (p.page != null) setNum(sp, "page", p.page);
    if (p.limit != null) setNum(sp, "limit", p.limit);
    return request<{ items: TenantUserDTO[]; total: number }>(
      `/tenants/${encodeURIComponent(String(tenantId))}/users?${sp.toString()}`
    );
  },

  addUser(tenantId: ID, body: { email: string; name?: string; role: TenantUserDTO["role"] }) {
    return request<TenantUserDTO>(`/tenants/${encodeURIComponent(String(tenantId))}/users`, {
      method: "POST",
      body,
    });
  },

  setRole(tenantId: ID, userId: string, role: TenantUserDTO["role"]) {
    return request<{ ok: true }>(
      `/tenants/${encodeURIComponent(String(tenantId))}/users/${encodeURIComponent(userId)}/role`,
      { method: "PUT", body: { role } }
    );
  },

  verifyEmail(tenantId: ID, userId: string) {
    return request<{ ok: true }>(
      `/tenants/${encodeURIComponent(String(tenantId))}/users/${encodeURIComponent(userId)}/verify-email`,
      { method: "POST" }
    );
  },

  resetPassword(tenantId: ID, userId: string) {
    return request<{ ok: true }>(
      `/tenants/${encodeURIComponent(String(tenantId))}/users/${encodeURIComponent(userId)}/reset-password`,
      { method: "POST" }
    );
  },

  removeUser(tenantId: ID, userId: string) {
    return request<{ ok: true }>(
      `/tenants/${encodeURIComponent(String(tenantId))}/users/${encodeURIComponent(userId)}`,
      { method: "DELETE" }
    );
  },

  setPassword(tenantId: ID, userId: string, password: string) {
    return request<{ ok: true }>(
      `/tenants/${encodeURIComponent(String(tenantId))}/users/${encodeURIComponent(userId)}/password`,
      { method: "PUT", body: { password } }
    );
  },

  /** Provisioning (UNSCOPED: super admin only) */
  adminProvisionTenant(body: {
    tenant: { name: string; primaryEmail?: string | null };
    owner: {
      email: string;
      firstName: string;
      lastName?: string | null;
      verify?: boolean;
      makeDefault?: boolean;
      tempPassword?: string;
      generateTempPassword?: boolean;
    };
    billing?: Partial<TenantDTO["billing"]> | undefined;
  }) {
    // keep endpoint name you already wired on the server
    return request<{
      tenant: { id: ID; name: string; primaryEmail: string | null; createdAt: string; updatedAt: string };
      owner: { id: string; email: string; name: string | null; verified: boolean; isSuperAdmin: boolean; createdAt: string };
      billing: TenantDTO["billing"];
      tempPassword: string;
    }>(`/tenants/admin-provision`, { method: "POST", body, tenantScoped: false });
  },

  /** Admin reset owner password (UNSCOPED: super admin only) */
  adminResetOwnerPassword(tenantId: ID, body: { tempPassword?: string; generateTempPassword?: boolean }) {
    return request<{
      ok: boolean;
      tempPassword: string;
    }>(`/admin/tenants/${encodeURIComponent(String(tenantId))}/owner/reset-password`, {
      method: "POST",
      body,
      tenantScoped: false,
    });
  },
};

/** ───────────────────────── Small helpers ───────────────────────── */
function setNum(sp: URLSearchParams, key: string, n: number) {
  if (Number.isFinite(n as number)) sp.set(key, String(n));
}
