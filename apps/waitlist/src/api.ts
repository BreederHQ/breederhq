// apps/waitlist/src/api.ts
// Waitlist API client - focused subset of offspring API for waitlist operations

import { readTenantIdFast, resolveTenantId } from "@bhq/ui/utils/tenant";

/* ───────────────────────── shared enums and primitives ───────────────────────── */

export type Sex = "FEMALE" | "MALE";

export type Species = "DOG" | "CAT" | "HORSE" | "GOAT" | "RABBIT";

/* ───────────────────────── waitlist types ───────────────────────── */

export type TagLite = { id: number; name: string; color?: string | null };

export type WaitlistEntry = {
  id: number;
  tenantId: number;
  status: string;
  priority: number | null;

  depositRequiredCents: number | null;
  depositPaidCents: number | null;
  balanceDueCents: number | null;
  depositPaidAt: string | null;

  contactId: number | null;
  organizationId: number | null;
  litterId: number | null;
  planId: number | null;

  speciesPref: Species | null;
  breedPrefs: any | null;
  sirePrefId: number | null;
  damPrefId: number | null;

  contact?: { id: number; display_name: string; email?: string | null; phoneE164?: string | null } | null;
  organization?: { id: number; name: string; email?: string | null; phone?: string | null } | null;
  sirePref?: { id: number; name: string } | null;
  damPref?: { id: number; name: string } | null;

  TagAssignment?: Array<{ id: number; tagId: number; tag: TagLite }>;

  skipCount?: number | null;
  lastSkipAt?: string | null;
  breedPrefText?: string | null;
  lastActivityAt?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;

  // Allow additional fields from API
  [key: string]: any;
};

/* ───────────────────────── http helpers with tenant handling ───────────────────────── */

const isMutating = (m?: string) => !["GET", "HEAD", "OPTIONS"].includes((m || "GET").toUpperCase());

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/([$?*|{}.:+^\\]\\-])/g, "\\$1")}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function readAdminToken() {
  if (typeof document === "undefined") return null;
  const meta = document.querySelector('meta[name="x-admin-token"]') as HTMLMetaElement | null;
  if (meta?.content) return meta.content;
  const cookie = readCookie("x_admin_token");
  return cookie;
}

type TenantInit = RequestInit & {
  tenantId?: number | null;
  adminToken?: string;
};

async function withTenantHeaders(init: TenantInit = {}): Promise<TenantInit> {
  let tenantId = init.tenantId ?? readTenantIdFast();
  if (!tenantId) {
    tenantId = await resolveTenantId();
  }

  const headers: Record<string, string> = {
    accept: "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  if (tenantId != null) {
    headers["x-tenant-id"] = String(tenantId);
  }

  if (isMutating(init.method)) {
    headers["x-requested-with"] = "XMLHttpRequest";
    if (!headers["content-type"]) {
      headers["content-type"] = "application/json";
    }

    const xsrf = readCookie("XSRF-TOKEN");
    if (xsrf) {
      headers["x-xsrf-token"] = xsrf;
      headers["x-csrf-token"] = xsrf;
      headers["csrf-token"] = xsrf;
    }
  }

  const adminToken = init.adminToken ?? readAdminToken();
  if (adminToken) {
    headers["x-admin-token"] = adminToken;
  }

  return {
    ...init,
    headers,
  };
}

async function http<T>(base: string, path: string, init: TenantInit = {}): Promise<T> {
  const url = `${base}${path}`;
  const prepared = await withTenantHeaders(init);
  const res = await fetch(url, prepared);
  const text = await res.text();

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = text ? JSON.parse(text) : {};
      msg = j?.error || j?.message || msg;
    } catch {
      // ignore parse error
    }
    throw new Error(msg);
  }

  if (!text) return undefined as unknown as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined as unknown as T;
  }
}

/* ───────────────────────── waitlist API factory ───────────────────────── */

type MakeOpts = string | { baseUrl?: string };

export type WaitlistApi = ReturnType<typeof makeWaitlistApi>;

export function makeWaitlistApi(opts: MakeOpts = "/api/v1") {
  const base = typeof opts === "string" ? opts : opts.baseUrl || "/api/v1";

  const raw = {
    get: <T>(path: string, init?: TenantInit) =>
      http<T>(base, path, { ...init, method: "GET" }),
    post: <T>(path: string, body?: any, init?: TenantInit) =>
      http<T>(base, path, {
        ...init,
        method: "POST",
        body: body == null ? undefined : JSON.stringify(body),
      }),
    patch: <T>(path: string, body?: any, init?: TenantInit) =>
      http<T>(base, path, {
        ...init,
        method: "PATCH",
        body: body == null ? undefined : JSON.stringify(body),
      }),
    del: <T>(path: string, init?: TenantInit) =>
      http<T>(base, path, { ...init, method: "DELETE" }),
  };

  return {
    raw,

    waitlist: {
      list: (params?: { q?: string; limit?: number; tenantId?: number | null; status?: string }) => {
        const qs = new URLSearchParams();
        if (params?.q) qs.set("q", params.q);
        if (params?.limit != null) qs.set("limit", String(params.limit));
        if (params?.tenantId != null) qs.set("tenantId", String(params.tenantId));
        if (params?.status) qs.set("status", params.status);

        const query = qs.toString();
        const path = `/waitlist${query ? `?${query}` : ""}`;
        // WaitlistPage can handle array or { items: [...] }
        return raw.get<any>(path, {});
      },
      create: (body: any) => {
        return raw.post<WaitlistEntry>("/waitlist", body, {});
      },
      patch: (id: number, body: any) => {
        return raw.patch<WaitlistEntry>(`/waitlist/${id}`, body, {});
      },
      /** Check if a duplicate waitlist entry exists for this combination */
      checkDuplicate: (params: {
        clientPartyId?: number | null;
        contactId?: number | null;
        organizationId?: number | null;
        speciesPref: string;
        breedPrefs?: string[] | null;
        sirePrefId?: number | null;
        damPrefId?: number | null;
      }) => {
        const qs = new URLSearchParams();
        if (params.clientPartyId != null) qs.set("clientPartyId", String(params.clientPartyId));
        if (params.contactId != null) qs.set("contactId", String(params.contactId));
        if (params.organizationId != null) qs.set("organizationId", String(params.organizationId));
        if (params.speciesPref) qs.set("speciesPref", params.speciesPref);
        if (params.breedPrefs?.length) qs.set("breedPrefs", params.breedPrefs.join(","));
        if (params.sirePrefId != null) qs.set("sirePrefId", String(params.sirePrefId));
        if (params.damPrefId != null) qs.set("damPrefId", String(params.damPrefId));

        const query = qs.toString();
        return raw.get<{ isDuplicate: boolean; existingEntry?: WaitlistEntry | null }>(`/waitlist/check-duplicate?${query}`, {});
      },
    },

    contacts: {
      list: (params?: { q?: string; limit?: number }) => {
        const qs = new URLSearchParams();
        if (params?.q) qs.set("q", params.q);
        if (params?.limit != null) qs.set("limit", String(params.limit));

        const query = qs.toString();
        const path = `/contacts${query ? `?${query}` : ""}`;
        return raw.get<any[]>(path, {});
      },
      create: (body: any) => {
        return raw.post<any>("/contacts", body, {});
      },
      get: (id: number) => {
        return raw.get<any>(`/contacts/${id}`, {});
      },
    },

    organizations: {
      list: (params?: { q?: string; limit?: number }) => {
        const qs = new URLSearchParams();
        if (params?.q) qs.set("q", params.q);
        if (params?.limit != null) qs.set("limit", String(params.limit));

        const query = qs.toString();
        const path = `/organizations${query ? `?${query}` : ""}`;
        return raw.get<any[]>(path, {});
      },
      create: (body: any) => {
        return raw.post<any>("/organizations", body, {});
      },
      get: (id: number) => {
        return raw.get<any>(`/organizations/${id}`, {});
      },
    },

    breeds: {
      listCanonical: (params?: { species?: string; q?: string; limit?: number }) => {
        const qs = new URLSearchParams();
        if (params?.species) qs.set("species", params.species);
        if (params?.q) qs.set("q", params.q);
        if (params?.limit != null) qs.set("limit", String(params.limit));

        const query = qs.toString();
        const path = `/breeds/canonical${query ? `?${query}` : ""}`;
        return raw.get<any>(path, {});
      },
    },

    animals: {
      list: (params?: { q?: string; limit?: number; tenantId?: number | null; species?: string; sex?: string }) => {
        const qs = new URLSearchParams();
        if (params?.q) qs.set("q", params.q);
        if (params?.limit != null) qs.set("limit", String(params.limit));
        if (params?.tenantId != null) qs.set("tenantId", String(params.tenantId));
        if (params?.species) qs.set("species", params.species);
        if (params?.sex) qs.set("sex", params.sex);

        const query = qs.toString();
        const path = `/animals${query ? `?${query}` : ""}`;
        return raw.get<any>(path, {});
      },
    },

    // Marketplace block management
    marketplaceBlocks: {
      /** Block a marketplace user */
      block: (body: { userId: string; level: "LIGHT" | "MEDIUM" | "HEAVY"; reason?: string }) => {
        return raw.post<{ success: boolean; blockId: number }>("/contacts/block-marketplace-user", body, {});
      },
      /** Unblock a marketplace user */
      unblock: (userId: string) => {
        return raw.del<{ success: boolean }>(`/contacts/block-marketplace-user/${userId}`, {});
      },
      /** Get all blocked users for this tenant */
      list: () => {
        return raw.get<{ items: BlockedUserInfo[] }>("/contacts/blocked-marketplace-users", {});
      },
    },
  };
}

/** Blocked user info from API */
export type BlockedUserInfo = {
  id: number;
  userId: string;
  level: "LIGHT" | "MEDIUM" | "HEAVY";
  reason: string | null;
  createdAt: string;
  blockedByPartyId: number | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    firstName: string;
    lastName: string;
  };
};

// Helper to create API client with default base URL
export function makeWaitlistApiClient(): WaitlistApi {
  return makeWaitlistApi("/api/v1");
}
