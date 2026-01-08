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

  /* ───────────────────────── Marketplace Abuse (UNSCOPED: super admin only) ───────────────────────── */

  /** Get flagged marketplace users */
  listFlaggedUsers(p: { flaggedOnly?: boolean; suspendedOnly?: boolean; page?: number; limit?: number } = {}) {
    const sp = new URLSearchParams();
    if (p.flaggedOnly) sp.set("flaggedOnly", "true");
    if (p.suspendedOnly) sp.set("suspendedOnly", "true");
    if (p.page != null) setNum(sp, "page", p.page);
    if (p.limit != null) setNum(sp, "limit", p.limit);
    return request<{ items: MarketplaceFlaggedUserDTO[]; total: number }>(
      `/admin/marketplace/flagged-users?${sp.toString()}`,
      { tenantScoped: false }
    );
  },

  /** Get a specific marketplace user's abuse info */
  getMarketplaceUser(userId: string) {
    return request<MarketplaceUserDetailDTO>(
      `/admin/marketplace/users/${encodeURIComponent(userId)}`,
      { tenantScoped: false }
    );
  },

  /** Suspend a marketplace user */
  suspendMarketplaceUser(userId: string, reason: string) {
    return request<{ ok: boolean }>(
      `/admin/marketplace/users/${encodeURIComponent(userId)}/suspend`,
      { method: "POST", body: { reason }, tenantScoped: false }
    );
  },

  /** Unsuspend a marketplace user */
  unsuspendMarketplaceUser(userId: string) {
    return request<{ ok: boolean }>(
      `/admin/marketplace/users/${encodeURIComponent(userId)}/unsuspend`,
      { method: "POST", tenantScoped: false }
    );
  },

  /** Clear a user's flag */
  clearMarketplaceUserFlag(userId: string) {
    return request<{ ok: boolean }>(
      `/admin/marketplace/users/${encodeURIComponent(userId)}/clear-flag`,
      { method: "POST", tenantScoped: false }
    );
  },

  /** Get marketplace abuse settings */
  getMarketplaceAbuseSettings() {
    return request<MarketplaceAbuseSettingsDTO>(
      `/admin/platform-settings/marketplace-abuse`,
      { tenantScoped: false }
    );
  },

  /** Update marketplace abuse settings */
  updateMarketplaceAbuseSettings(body: Partial<MarketplaceAbuseSettingsDTO>) {
    return request<MarketplaceAbuseSettingsDTO>(
      `/admin/platform-settings/marketplace-abuse`,
      { method: "PUT", body, tenantScoped: false }
    );
  },
};

/** Marketplace flagged user DTO */
export type MarketplaceFlaggedUserDTO = {
  id: number;
  userId: string;
  totalBlocks: number;
  activeBlocks: number;
  lightBlocks: number;
  mediumBlocks: number;
  heavyBlocks: number;
  totalApprovals: number;
  totalRejections: number;
  flaggedAt: string | null;
  flagReason: string | null;
  suspendedAt: string | null;
  suspendedReason: string | null;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    firstName: string;
    lastName: string;
    createdAt: string;
  };
};

/** Marketplace user detail with block history */
export type MarketplaceUserDetailDTO = {
  flag: MarketplaceFlaggedUserDTO;
  blocks: Array<{
    id: number;
    tenantId: number;
    level: "LIGHT" | "MEDIUM" | "HEAVY";
    reason: string | null;
    createdAt: string;
    liftedAt: string | null;
    tenant: { id: number; name: string };
  }>;
};

/** Marketplace abuse settings DTO */
export type MarketplaceAbuseSettingsDTO = {
  flagThreshold: number;
  autoSuspendThreshold: number;
  enableAutoSuspend: boolean;
};

/* ───────────────────────── Breeder Reports (UNSCOPED: super admin only) ───────────────────────── */

/** Individual breeder report DTO */
export type BreederReportDTO = {
  id: number;
  reporterUserIdMasked: string;  // Masked for privacy
  breederTenantId: number;
  reason: "SPAM" | "FRAUD" | "HARASSMENT" | "MISREPRESENTATION" | "OTHER";
  severity: "LIGHT" | "MEDIUM" | "HEAVY";
  description: string | null;
  status: "PENDING" | "REVIEWED" | "DISMISSED" | "ACTIONED";
  adminNotes: string | null;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

/** Flagged breeder DTO (aggregation) */
export type BreederFlaggedDTO = {
  id: number;
  breederTenantId: number;
  totalReports: number;
  pendingReports: number;
  lightReports: number;
  mediumReports: number;
  heavyReports: number;
  flaggedAt: string | null;
  flagReason: string | null;
  warningIssuedAt: string | null;
  warningNote: string | null;
  marketplaceSuspendedAt: string | null;
  suspendedReason: string | null;
  updatedAt: string;
  tenant: {
    id: number;
    name: string;
    primaryEmail: string | null;
  };
};

/** Breeder report detail with all reports */
export type BreederReportDetailDTO = {
  flag: BreederFlaggedDTO;
  reports: BreederReportDTO[];
};

/** Breeder report settings DTO */
export type BreederReportSettingsDTO = {
  flagThreshold: number;
  enableAutoFlag: boolean;
};

/** Breeder reports admin API */
export const breederReportsApi = {
  /** List flagged breeders */
  listFlaggedBreeders(p: {
    q?: string;
    flaggedOnly?: boolean;
    warningOnly?: boolean;
    suspendedOnly?: boolean;
    page?: number;
    limit?: number;
  } = {}) {
    const sp = new URLSearchParams();
    if (p.q) sp.set("q", p.q);
    if (p.flaggedOnly) sp.set("flaggedOnly", "true");
    if (p.warningOnly) sp.set("warningOnly", "true");
    if (p.suspendedOnly) sp.set("suspendedOnly", "true");
    if (p.page != null) setNum(sp, "page", p.page);
    if (p.limit != null) setNum(sp, "limit", p.limit);
    return request<{ items: BreederFlaggedDTO[]; total: number }>(
      `/admin/breeder-reports/flagged?${sp.toString()}`,
      { tenantScoped: false }
    );
  },

  /** Get breeder report details with all reports */
  getBreederReports(tenantId: ID) {
    return request<BreederReportDetailDTO>(
      `/admin/breeder-reports/breeders/${encodeURIComponent(String(tenantId))}`,
      { tenantScoped: false }
    );
  },

  /** Dismiss a single report */
  dismissReport(reportId: ID, reason: string) {
    return request<{ ok: boolean }>(
      `/admin/breeder-reports/${encodeURIComponent(String(reportId))}/dismiss`,
      { method: "POST", body: { reason }, tenantScoped: false }
    );
  },

  /** Issue warning to a breeder */
  warnBreeder(tenantId: ID, note: string) {
    return request<{ ok: boolean }>(
      `/admin/breeder-reports/breeders/${encodeURIComponent(String(tenantId))}/warn`,
      { method: "POST", body: { note }, tenantScoped: false }
    );
  },

  /** Suspend breeder's marketplace listing */
  suspendBreederMarketplace(tenantId: ID, reason: string) {
    return request<{ ok: boolean }>(
      `/admin/breeder-reports/breeders/${encodeURIComponent(String(tenantId))}/suspend-marketplace`,
      { method: "POST", body: { reason }, tenantScoped: false }
    );
  },

  /** Unsuspend breeder's marketplace listing */
  unsuspendBreederMarketplace(tenantId: ID) {
    return request<{ ok: boolean }>(
      `/admin/breeder-reports/breeders/${encodeURIComponent(String(tenantId))}/unsuspend-marketplace`,
      { method: "POST", tenantScoped: false }
    );
  },

  /** Clear breeder's flag */
  clearBreederFlag(tenantId: ID) {
    return request<{ ok: boolean }>(
      `/admin/breeder-reports/breeders/${encodeURIComponent(String(tenantId))}/clear-flag`,
      { method: "POST", tenantScoped: false }
    );
  },

  /** Get breeder report settings */
  getSettings() {
    return request<BreederReportSettingsDTO>(
      `/admin/platform-settings/breeder-reports`,
      { tenantScoped: false }
    );
  },

  /** Update breeder report settings */
  updateSettings(body: Partial<BreederReportSettingsDTO>) {
    return request<BreederReportSettingsDTO>(
      `/admin/platform-settings/breeder-reports`,
      { method: "PUT", body, tenantScoped: false }
    );
  },
};

/* ───────────────────────── Usage Dashboard (SCOPED) ───────────────────────── */

/** Usage metrics DTO */
export type UsageMetricsDTO = {
  plan: {
    name: string;
    tier: string;
  };
  usage: {
    animals: {
      current: number;
      limit: number | null;
      percentUsed: number | null;
      isOverLimit: boolean;
    };
    contacts: {
      current: number;
      limit: number | null;
      percentUsed: number | null;
      isOverLimit: boolean;
    };
    portalUsers: {
      current: number;
      limit: number | null;
      percentUsed: number | null;
      isOverLimit: boolean;
    };
    breedingPlans: {
      current: number;
      limit: number | null;
      percentUsed: number | null;
      isOverLimit: boolean;
    };
    marketplaceListings: {
      current: number;
      limit: number | null;
      percentUsed: number | null;
      isOverLimit: boolean;
    };
    storageGB: {
      current: number;
      limit: number | null;
      percentUsed: number | null;
      isOverLimit: boolean;
    };
    smsMessages: {
      current: number;
      limit: number | null;
      percentUsed: number | null;
      isOverLimit: boolean;
    };
  };
  warnings: string[];
};

/** Usage dashboard API */
export const usageApi = {
  /** Get all usage metrics for tenant */
  getUsageMetrics(tenantId?: ID) {
    const headers: Record<string, string> = {};
    if (tenantId != null) headers["X-Tenant-Id"] = String(tenantId);
    return request<UsageMetricsDTO>('/usage', { headers });
  },

  /** Get specific usage metric */
  getUsageMetric(metricKey: string, tenantId?: ID) {
    const headers: Record<string, string> = {};
    if (tenantId != null) headers["X-Tenant-Id"] = String(tenantId);
    return request<UsageMetricsDTO['usage']['animals']>(`/usage/${metricKey}`, { headers });
  },
};

/** ───────────────────────── Admin Subscriptions API ───────────────────────── */

export type ProductDTO = {
  id: number;
  name: string;
  description: string | null;
  type: "SUBSCRIPTION" | "ADD_ON" | "ONE_TIME";
  priceUSD: number;
  billingInterval: "MONTHLY" | "YEARLY" | "QUARTERLY" | null;
  features: string[] | null;
  active: boolean;
  sortOrder: number;
  stripeProductId: string | null;
  stripePriceId: string | null;
  entitlements: ProductEntitlementDTO[];
  createdAt: string;
  updatedAt: string;
};

export type ProductEntitlementDTO = {
  entitlementKey: string;
  limitValue: number | null;
};

export type SubscriptionDTO = {
  id: number;
  tenantId: number;
  productId: number;
  status: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
  product?: ProductDTO;
  tenant?: { id: number; name: string; primaryEmail: string | null };
};

export const adminSubscriptionApi = {
  /** List all subscriptions (platform admin) */
  listSubscriptions(params?: { status?: string; tenantId?: number; page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.status) sp.set("status", params.status);
    if (params?.tenantId) sp.set("tenantId", String(params.tenantId));
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    const qs = sp.toString();
    return request<{ subscriptions: SubscriptionDTO[]; total: number }>(
      `/admin/subscriptions${qs ? `?${qs}` : ""}`,
      { tenantScoped: true }
    );
  },

  /** Get single subscription details */
  getSubscription(id: number) {
    return request<{ subscription: SubscriptionDTO }>(`/admin/subscriptions/${id}`, { tenantScoped: true });
  },

  /** Create subscription manually (for comps, testing, etc.) */
  createSubscription(data: {
    tenantId: number;
    productId: number;
    status?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
  }) {
    return request<{ subscription: SubscriptionDTO }>("/admin/subscriptions", {
      method: "POST",
      body: data,
      tenantScoped: true,
    });
  },

  /** Update subscription status/dates */
  updateSubscription(id: number, data: { status?: string; currentPeriodEnd?: string }) {
    return request<{ subscription: SubscriptionDTO }>(`/admin/subscriptions/${id}`, {
      method: "PATCH",
      body: data,
      tenantScoped: true,
    });
  },

  /** Cancel a subscription */
  cancelSubscription(id: number) {
    return request<{ ok: boolean }>(`/admin/subscriptions/${id}`, {
      method: "DELETE",
      tenantScoped: true,
    });
  },

  /** List all products */
  listProducts(params?: { includeInactive?: boolean }) {
    const sp = new URLSearchParams();
    if (params?.includeInactive) sp.set("includeInactive", "true");
    const qs = sp.toString();
    return request<{ products: ProductDTO[] }>(`/admin/products${qs ? `?${qs}` : ""}`, { tenantScoped: true });
  },

  /** Get single product details */
  getProduct(id: number) {
    return request<{ product: ProductDTO }>(`/admin/products/${id}`, { tenantScoped: true });
  },

  /** Create a new product */
  createProduct(data: {
    name: string;
    description?: string;
    type: "SUBSCRIPTION" | "ADD_ON" | "ONE_TIME";
    priceUSD: number;
    billingInterval?: "MONTHLY" | "YEARLY" | "QUARTERLY";
    features?: string[];
    sortOrder?: number;
  }) {
    return request<{ product: ProductDTO }>("/admin/products", {
      method: "POST",
      body: data,
      tenantScoped: true,
    });
  },

  /** Update a product */
  updateProduct(id: number, data: Partial<{
    name: string;
    description: string | null;
    priceUSD: number;
    features: string[];
    active: boolean;
    sortOrder: number;
  }>) {
    return request<{ product: ProductDTO }>(`/admin/products/${id}`, {
      method: "PATCH",
      body: data,
      tenantScoped: true,
    });
  },

  /** Add entitlement to product */
  addEntitlement(productId: number, data: { entitlementKey: string; limitValue?: number | null }) {
    return request<{ entitlement: ProductEntitlementDTO }>(`/admin/products/${productId}/entitlements`, {
      method: "POST",
      body: data,
      tenantScoped: true,
    });
  },

  /** Update entitlement limit */
  updateEntitlement(productId: number, entitlementKey: string, data: { limitValue: number | null }) {
    return request<{ entitlement: ProductEntitlementDTO }>(
      `/admin/products/${productId}/entitlements/${entitlementKey}`,
      { method: "PATCH", body: data, tenantScoped: true }
    );
  },

  /** Remove entitlement from product */
  removeEntitlement(productId: number, entitlementKey: string) {
    return request<{ ok: boolean }>(`/admin/products/${productId}/entitlements/${entitlementKey}`, {
      method: "DELETE",
      tenantScoped: true,
    });
  },
};

/** ───────────────────────── Small helpers ───────────────────────── */
function setNum(sp: URLSearchParams, key: string, n: number) {
  if (Number.isFinite(n as number)) sp.set(key, String(n));
}
