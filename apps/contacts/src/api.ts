// apps/contacts/src/api.ts
import { readTenantIdFast, getSessionCookieName } from "@bhq/ui/utils/tenant";
import { createHttp, makeTags, makePortalAccess, makePartyCrm, makeMessages } from "@bhq/api";

export type ID = string | number;

type Module = "CONTACT" | "ORGANIZATION" | "ANIMAL";
type Species = "DOG" | "CAT" | "HORSE";
type Sex = "FEMALE" | "MALE";
type AnimalStatus =
  | "ACTIVE"
  | "BREEDING"
  | "UNAVAILABLE"
  | "RETIRED"
  | "DECEASED"
  | "PROSPECT";

/* ----------------------------------------------------------------------------
 * Shared helpers
 * ------------------------------------------------------------------------- */

/** Get the base origin without /api/v1 suffix */
function getOrigin(base?: string): string {
  let b = String(base || "").trim();
  if (!b) b = typeof window !== "undefined" ? window.location.origin : "";
  // Strip trailing slashes and any existing /api/v1 suffix
  return b.replace(/\/+$/g, "").replace(/\/api\/v1$/i, "");
}

/** Normalize API base: ensure exactly one /api/v1 suffix, never doubled */
function normBase(base?: string): string {
  return `${getOrigin(base)}/api/v1`;
}

function joinUrl(...parts: (string | number | undefined | null)[]) {
  return parts
    .filter((p) => p !== undefined && p !== null)
    .map((p, i) => {
      const s = String(p);
      return i === 0 ? s.replace(/\/+$/g, "") : s.replace(/^\/+/g, "").replace(/\/+$/g, "");
    })
    .join("/");
}

// tiny cookie helper (no deps)
function readCookie(name: string): string {
  try {
    const m = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
    return m ? decodeURIComponent(m[1]) : "";
  } catch {
    return "";
  }
}

function safeB64Json(s: string): any {
  try {
    const pad = (x: string) => x + "===".slice((x.length + 3) % 4);
    const norm = pad(s.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(atob(norm));
  } catch {
    return null;
  }
}

function tenantIdFromSessionCookie(): number | null {
  // Try surface-specific cookie first, then legacy cookie
  const cookieName = getSessionCookieName();
  let raw = readCookie(cookieName);
  if (!raw) {
    // Fallback to legacy cookie for backward compatibility
    raw = readCookie("bhq_s");
  }
  if (!raw) return null;
  try {
    // Handle signed cookie format: "s:base64payload.signature"
    let payload = raw;
    if (payload.startsWith("s:")) {
      const dotIndex = payload.lastIndexOf(".");
      if (dotIndex > 2) {
        payload = payload.slice(2, dotIndex);
      }
    }
    const parts = payload.split(".");
    const payloadB64 = parts.length === 3 ? parts[1] : parts[0];
    const parsed = safeB64Json(payloadB64) || {};
    const id =
      Number(parsed?.tenant?.id) ??
      Number(parsed?.tenantId) ??
      Number(parsed?.tenantID) ??
      Number(parsed?.tenant_id);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

function firstValidInt(...vals: Array<number | undefined | null>): number | null {
  for (const v of vals) if (Number.isInteger(v) && (v as number) > 0) return v as number;
  return null;
}

/** Add x-tenant-id header if we can resolve it */
export function getTenantHeaders(): Record<string, string> {
  // 1) Preferred: shared fast path (cookie/window) from @bhq/ui
  const fast = readTenantIdFast();

  // 2) Your local helpers (already in this file)
  const fromSessionCookie = tenantIdFromSessionCookie();

  // 3) Shell/global fallbacks
  const w = window as any;
  const fromBhqObj = Number(w?.__bhq?.tenantId);
  const fromLegacyGlobal = Number(w?.__BHQ_TENANT_ID__);

  // 4) LocalStorage + .env fallback for dev
  const fromLS = (() => {
    try { const n = Number(localStorage.getItem("BHQ_TENANT_ID") || ""); return Number.isInteger(n) ? n : undefined; } catch { return undefined; }
  })();
  const fromEnv = Number((import.meta as any)?.env?.VITE_DEV_TENANT_ID || "");

  const tenantId = firstValidInt(fast, fromSessionCookie, fromBhqObj, fromLegacyGlobal, fromLS, fromEnv);

  if (!tenantId) {
    // one-time noisy log so you can see why the header is missing
    const surfaceCookie = getSessionCookieName();
    console.warn("[BHQ] Missing x-tenant-id. Sources:", {
      fast,
      fromSessionCookie,
      fromBhqObj,
      fromLegacyGlobal,
      fromLS,
      fromEnv,
      cookie_surface_present: !!document.cookie.match(new RegExp(`(?:^|; )${surfaceCookie}=`)),
      cookie_legacy_present: !!document.cookie.match(/(?:^|; )bhq_s=/),
    });
    return {};
  }

  return { "x-tenant-id": String(tenantId) };
}

/** Server expects x-csrf-token header that matches XSRF-TOKEN cookie on writes */
function isWriteMethod(method?: string) {
  const m = String(method || "GET").toUpperCase();
  return m !== "GET" && m !== "HEAD" && m !== "OPTIONS";
}
function getCsrfHeaders(method?: string): Record<string, string> {
  if (!isWriteMethod(method)) return {};
  const token = readCookie("XSRF-TOKEN");
  return token ? { "x-csrf-token": token } : {};
}

/* ----------------------------------------------------------------------------
 * fetch helpers
 *  - bareFetchJson: no tenant header (used for /session bootstrap)
 *  - fetchJson: tenant-aware (normal authenticated API calls)
 * ------------------------------------------------------------------------- */

function baseHeaders(init: RequestInit) {
  // Only include Content-Type when we actually send a body (non-GET).
  const method = String(init?.method || "GET").toUpperCase();
  const hasBody = !!(init as any)?.body && method !== "GET" && method !== "HEAD";
  return {
    accept: "application/json",
    ...(hasBody ? { "content-type": "application/json" } : {}),
  } as Record<string, string>;
}

async function bareFetchJson<T = any>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...baseHeaders(init),
      ...(init.headers as any),
    },
    credentials: "include",
  });
  if (!res.ok) {
    let payload: any;
    try {
      payload = await res.json();
    } catch {
      payload = { error: "http_error", status: res.status, statusText: res.statusText };
    }
    const err: any = new Error(payload?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

async function fetchJson<T = any>(
  url: string,
  init: RequestInit = {},
  extraHeaders: Record<string, string> = {}
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...baseHeaders(init),
      ...getTenantHeaders(),
      ...getCsrfHeaders(init.method),
      ...extraHeaders,
      ...(init.headers as any),
    },
    credentials: "include",
  });
  if (!res.ok) {
    let payload: any;
    try {
      payload = await res.json();
    } catch {
      payload = { error: "http_error", status: res.status, statusText: res.statusText };
    }
    const err: any = new Error(payload?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

/** Expose the bare utils (App-Contacts.tsx uses apiUtils.fetchJson for /session) */
export const apiUtils = {
  joinUrl,
  fetchJson: bareFetchJson,
};

/* ----------------------------------------------------------------------------
 * Factory
 * ------------------------------------------------------------------------- */

export function makeApi(baseOrigin: string = "", authHeaderFn?: () => Record<string, string>) {
  const origin = getOrigin(baseOrigin);
  const v1 = `${origin}/api/v1`;
  const withAuth = () => (authHeaderFn ? authHeaderFn() : {});

  /* --------------------------------- CONTACTS -------------------------------- */
  const contacts = {
    async get(id: ID) {
      const url = joinUrl(v1, "contacts", String(id));
      return fetchJson<any>(url, { method: "GET" }, withAuth());
    },
    async list(params: {
      q?: string;
      includeArchived?: boolean;
      page?: number;
      limit?: number;
      sort?: string; // "firstName:asc,lastName:desc"
    } = {}) {
      const p = new URLSearchParams();
      if (params.q) p.set("q", params.q);
      if (params.includeArchived != null) p.set("includeArchived", params.includeArchived ? "true" : "false");
      if (params.page != null) p.set("page", String(params.page));
      if (params.limit != null) p.set("limit", String(params.limit));
      if (params.sort) p.set("sort", params.sort);
      const url = joinUrl(v1, "contacts") + (p.toString() ? `?${p.toString()}` : "");
      return fetchJson<{ items: any[]; total: number; page: number; limit: number }>(
        url,
        { method: "GET" },
        withAuth()
      );
    },
    async create(body: any) {
      const url = joinUrl(v1, "contacts");
      return fetchJson<any>(url, { method: "POST", body: JSON.stringify(body) }, withAuth());
    },
    async update(id: ID, body: any) {
      const url = joinUrl(v1, "contacts", String(id));
      return fetchJson<any>(url, { method: "PATCH", body: JSON.stringify(body) }, withAuth());
    },
    async remove(id: ID) {
      const url = joinUrl(v1, "contacts", String(id));
      return fetchJson<{ ok: true }>(url, { method: "DELETE" }, withAuth());
    },
    /**
     * Check if a contact can be deleted. Returns blockers if deletion is not allowed.
     */
    async canDelete(id: ID): Promise<{
      canDelete: boolean;
      blockers: {
        hasAnimals?: boolean;
        hasInvoices?: boolean;
        hasPayments?: boolean;
        hasWaitlistEntries?: boolean;
        hasBreedingPlans?: boolean;
        hasDocuments?: boolean;
        hasPortalAccess?: boolean;
        other?: string[];
      };
      details?: {
        animalCount?: number;
        invoiceCount?: number;
        paymentCount?: number;
        waitlistCount?: number;
        breedingPlanCount?: number;
      };
    }> {
      const url = joinUrl(v1, "contacts", String(id), "can-delete");
      try {
        return await fetchJson<any>(url, { method: "GET" }, withAuth());
      } catch (e: any) {
        // If endpoint doesn't exist yet, allow delete (graceful fallback)
        if (e?.status === 404) {
          return { canDelete: true, blockers: {} };
        }
        throw e;
      }
    },
    async archive(id: ID, reason?: string) {
      const url = joinUrl(v1, "contacts", String(id), "archive");
      const body = reason ? { reason } : undefined;
      return fetchJson<{ ok: true }>(url, { method: "POST", body: body ? JSON.stringify(body) : undefined }, withAuth());
    },
    async restore(id: ID) {
      const url = joinUrl(v1, "contacts", String(id), "restore");
      return fetchJson<{ ok: true }>(url, { method: "POST" }, withAuth());
    },
    async audit(id: ID) {
      const url = joinUrl(v1, "contacts", String(id), "audit");
      try {
        const res = await fetchJson<any>(url, { method: "GET" }, withAuth());
        return Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      } catch (e: any) {
        if (e?.status === 404) return [];
        throw e;
      }
    },
    async getTags(id: ID) {
      const url = joinUrl(v1, "contacts", String(id), "tags");
      try {
        const res = await fetchJson<any>(url, { method: "GET" }, withAuth());
        return Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      } catch (e: any) {
        if (e?.status === 404) return [];
        throw e;
      }
    },
    async getAffiliations(id: ID) {
      const url = joinUrl(v1, "contacts", String(id), "affiliations");
      try {
        const res = await fetchJson<any>(url, { method: "GET" }, withAuth());
        return Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      } catch (e: any) {
        if (e?.status === 404) return [];
        throw e;
      }
    },
    async setOrganization(contactId: ID, organizationId: number | null) {
      return contacts.update(contactId, { organizationId });
    },
  };

  /* ----------------------------------- TAGS ---------------------------------- */
  // Wire up unified resources from @bhq/api
  // Note: pass origin (not v1) because these resources add /api/v1 internally
  const http = createHttp(origin);
  // Tags resource expects base URL to include /api/v1
  const httpWithV1 = createHttp(v1);
  const tags = makeTags(httpWithV1);
  const portalAccess = makePortalAccess(http);
  const partyCrm = makePartyCrm(http);
  const messages = makeMessages(http);

  /* ------------------------------- ORGANIZATIONS ----------------------------- */
  const organizations = {
    async list(qs: {
      q?: string;
      includeArchived?: boolean;
      page?: number;
      limit?: number;
      sort?: string; // "name:asc,createdAt:desc"
    } = {}) {
      const p = new URLSearchParams();
      if (qs.q) p.set("q", qs.q);
      if (qs.includeArchived != null) p.set("includeArchived", qs.includeArchived ? "true" : "false");
      if (qs.page != null) p.set("page", String(qs.page));
      if (qs.limit != null) p.set("limit", String(qs.limit));
      if (qs.sort) p.set("sort", qs.sort);
      const url = joinUrl(v1, "organizations") + (p.toString() ? `?${p.toString()}` : "");
      return fetchJson<{ items: any[]; total: number; page: number; limit: number }>(
        url,
        { method: "GET" },
        withAuth()
      );
    },
    async get(id: ID) {
      const url = joinUrl(v1, "organizations", String(id));
      return fetchJson<any>(url, { method: "GET" }, withAuth());
    },
    async create(body: {
      name: string;
      email?: string | null;
      phone?: string | null;
      website?: string | null;
      street?: string | null;
      street2?: string | null;
      city?: string | null;
      state?: string | null;
      zip?: string | null;
      country?: string | null;
    }) {
      const url = joinUrl(v1, "organizations");
      return fetchJson<any>(url, { method: "POST", body: JSON.stringify(body) }, withAuth());
    },
    async update(
      id: ID,
      body: Partial<{
        name: string;
        email: string | null;
        phone: string | null;
        website: string | null;
        street: string | null;
        street2: string | null;
        city: string | null;
        state: string | null;
        zip: string | null;
        country: string | null;
        archived: boolean;
      }>
    ) {
      const url = joinUrl(v1, "organizations", String(id));
      return fetchJson<any>(url, { method: "PATCH", body: JSON.stringify(body) }, withAuth());
    },
    async archive(id: ID) {
      const url = joinUrl(v1, "organizations", String(id), "archive");
      return fetchJson<{ ok: true }>(url, { method: "POST" }, withAuth());
    },
    async restore(id: ID) {
      const url = joinUrl(v1, "organizations", String(id), "restore");
      return fetchJson<{ ok: true }>(url, { method: "POST" }, withAuth());
    },
    async remove(id: ID) {
      const url = joinUrl(v1, "organizations", String(id));
      return fetchJson<{ ok: true }>(url, { method: "DELETE" }, withAuth());
    },
    /**
     * Check if an organization can be deleted. Returns blockers if deletion is not allowed.
     */
    async canDelete(id: ID): Promise<{
      canDelete: boolean;
      blockers: {
        hasContacts?: boolean;
        hasAnimals?: boolean;
        hasInvoices?: boolean;
        hasPayments?: boolean;
        hasBreedingPlans?: boolean;
        hasDocuments?: boolean;
        other?: string[];
      };
      details?: {
        contactCount?: number;
        animalCount?: number;
        invoiceCount?: number;
        paymentCount?: number;
        breedingPlanCount?: number;
      };
    }> {
      const url = joinUrl(v1, "organizations", String(id), "can-delete");
      try {
        return await fetchJson<any>(url, { method: "GET" }, withAuth());
      } catch (e: any) {
        // If endpoint doesn't exist yet, allow delete (graceful fallback)
        if (e?.status === 404) {
          return { canDelete: true, blockers: {} };
        }
        throw e;
      }
    },
  };

  /* ---------------------------------- ANIMALS -------------------------------- */
  const animals = {
    async list(params: {
      q?: string;
      species?: Species;
      sex?: Sex;
      status?: AnimalStatus;
      organizationId?: ID;
      includeArchived?: boolean;
      page?: number;
      limit?: number;
      sort?: string; // e.g. "-createdAt,name"
    } = {}) {
      const p = new URLSearchParams();
      if (params.q) p.set("q", params.q);
      if (params.species) p.set("species", params.species);
      if (params.sex) p.set("sex", params.sex);
      if (params.status) p.set("status", params.status);
      if (params.organizationId != null) p.set("organizationId", String(params.organizationId));
      if (params.includeArchived != null) p.set("includeArchived", params.includeArchived ? "true" : "false");
      if (params.page != null) p.set("page", String(params.page));
      if (params.limit != null) p.set("limit", String(params.limit));
      if (params.sort) p.set("sort", params.sort);
      const url = joinUrl(v1, "animals") + (p.toString() ? `?${p.toString()}` : "");
      return fetchJson<{ items: any[]; total: number; page: number; limit: number }>(
        url,
        { method: "GET" },
        withAuth()
      );
    },
    async get(id: ID) {
      const url = joinUrl(v1, "animals", String(id));
      return fetchJson<any>(url, { method: "GET" }, withAuth());
    },
    async create(body: {
      name: string;
      species: Species;
      sex: Sex;
      status?: AnimalStatus;
      birthDate?: string | null;
      microchip?: string | null;
      notes?: string | null;
      breed?: string | null;
      canonicalBreedId?: number | null;
      customBreedId?: number | null;
      organizationId?: number | null;
    }) {
      const url = joinUrl(v1, "animals");
      return fetchJson<any>(url, { method: "POST", body: JSON.stringify(body) }, withAuth());
    },
    async update(
      id: ID,
      body: Partial<{
        organizationId: number | null;
        name: string;
        species: Species;
        sex: Sex;
        status: AnimalStatus;
        birthDate: string | null;
        microchip: string | null;
        notes: string | null;
        breed: string | null;
        canonicalBreedId: number | null;
        customBreedId: number | null;
        archived: boolean;
      }>
    ) {
      const url = joinUrl(v1, "animals", String(id));
      return fetchJson<any>(url, { method: "PATCH", body: JSON.stringify(body) }, withAuth());
    },
    async archive(id: ID) {
      const url = joinUrl(v1, "animals", String(id), "archive");
      return fetchJson<{ ok: true }>(url, { method: "POST" }, withAuth());
    },
    async restore(id: ID) {
      const url = joinUrl(v1, "animals", String(id), "restore");
      return fetchJson<{ ok: true }>(url, { method: "POST" }, withAuth());
    },
    async remove(id: ID) {
      const url = joinUrl(v1, "animals", String(id));
      return fetchJson<{ ok: true }>(url, { method: "DELETE" }, withAuth());
    },

    /* ---------- Animal Tags ---------- */
    tags: {
      async list(animalId: ID) {
        const url = joinUrl(v1, "animals", String(animalId), "tags");
        return fetchJson<{ items: any[]; total: number }>(url, { method: "GET" }, withAuth());
      },
      async add(animalId: ID, tagId: ID) {
        const url = joinUrl(v1, "animals", String(animalId), "tags");
        return fetchJson<{ ok: true }>(
          url,
          { method: "POST", body: JSON.stringify({ tagId: Number(tagId) }) },
          withAuth()
        );
      },
      async remove(animalId: ID, tagId: ID) {
        const url = joinUrl(v1, "animals", String(animalId), "tags", String(tagId));
        return fetchJson<{ ok: true }>(url, { method: "DELETE" }, withAuth());
      },
    },

    /* ---------- Animal Owners ---------- */
    owners: {
      async list(animalId: ID) {
        const url = joinUrl(v1, "animals", String(animalId), "owners");
        return fetchJson<{ items: any[]; total: number }>(url, { method: "GET" }, withAuth());
      },
      async create(
        animalId: ID,
        body: {
          partyType: "Organization" | "Contact";
          organizationId?: number | null;
          contactId?: number | null;
          percent: number;
          isPrimary?: boolean;
        }
      ) {
        const url = joinUrl(v1, "animals", String(animalId), "owners");
        return fetchJson<any>(url, { method: "POST", body: JSON.stringify(body) }, withAuth());
      },
      async update(
        animalId: ID,
        ownerId: ID,
        body: Partial<{
          percent: number;
          isPrimary: boolean;
          partyType: "Organization" | "Contact";
          organizationId: number | null;
          contactId: number | null;
        }>
      ) {
        const url = joinUrl(v1, "animals", String(animalId), "owners", String(ownerId));
        return fetchJson<any>(url, { method: "PATCH", body: JSON.stringify(body) }, withAuth());
      },
      async remove(animalId: ID, ownerId: ID) {
        const url = joinUrl(v1, "animals", String(animalId), "owners", String(ownerId));
        return fetchJson<{ ok: true }>(url, { method: "DELETE" }, withAuth());
      },
    },

    /* ---------- Animal Registries ---------- */
    registries: {
      async list(animalId: ID) {
        const url = joinUrl(v1, "animals", String(animalId), "registries");
        return fetchJson<{ items: any[]; total: number }>(url, { method: "GET" }, withAuth());
      },
      async create(
        animalId: ID,
        body: {
          registryId: number;
          identifier: string;
          registrarOfRecord?: string | null;
          issuedAt?: string | null;
        }
      ) {
        const url = joinUrl(v1, "animals", String(animalId), "registries");
        return fetchJson<any>(url, { method: "POST", body: JSON.stringify(body) }, withAuth());
      },
      async update(
        animalId: ID,
        identifierId: ID,
        body: Partial<{
          identifier: string;
          registrarOfRecord: string | null;
          issuedAt: string | null;
          registryId: number;
        }>
      ) {
        const url = joinUrl(v1, "animals", String(animalId), "registries", String(identifierId));
        return fetchJson<any>(url, { method: "PATCH", body: JSON.stringify(body) }, withAuth());
      },
      async remove(animalId: ID, identifierId: ID) {
        const url = joinUrl(v1, "animals", String(animalId), "registries", String(identifierId));
        return fetchJson<{ ok: true }>(url, { method: "DELETE" }, withAuth());
      },
    },
  };

  /* ------------------------------- LOOKUPS/EXTRAS ---------------------------- */
  const lookups = {
    /** used by the Contacts UI */
    async searchOrganizations(q: string) {
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      p.set("limit", "200");
      const url = joinUrl(v1, "organizations") + (p.toString() ? `?${p.toString()}` : "");
      const res = await fetchJson<{ items: any[] }>(url, { method: "GET" }, withAuth());
      return Array.isArray(res?.items) ? res.items : [];
    },
  };

  const contactsExtras = {
    /** Get all animals owned by a contact */
    async animalsForContact(contactId: ID): Promise<any[]> {
      const url = joinUrl(v1, "contacts", String(contactId), "animals");
      try {
        const res = await fetchJson<any>(url, { method: "GET" }, withAuth());
        return Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      } catch (e: any) {
        if (e?.status === 404) return [];
        throw e;
      }
    },
  };

  const audit = {
    async log(body: {
      entity: string;
      entityId: ID;
      event: string;
      meta?: any;
    }) {
      const url = joinUrl(v1, "audit");
      return fetchJson<{ ok: true }>(url, { method: "POST", body: JSON.stringify(body) }, withAuth());
    },
  };

  /* -------------------------------- CONTRACTS -------------------------------- */
  const contracts = {
    contracts: {
      async list(params?: {
        status?: string;
        partyId?: number;
        offspringId?: number;
        animalId?: number;
        limit?: number;
        offset?: number;
      }) {
        const p = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== "") {
              p.set(k, String(v));
            }
          });
        }
        const url = joinUrl(v1, "contracts") + (p.toString() ? `?${p.toString()}` : "");
        const res = await fetchJson<{ items?: any[]; total?: number }>(url, { method: "GET" }, withAuth());
        return {
          items: res?.items || [],
          total: res?.total ?? 0,
        };
      },
      async get(id: number) {
        const url = joinUrl(v1, "contracts", String(id));
        return fetchJson<any>(url, { method: "GET" }, withAuth());
      },
      getPdfUrl(id: number): string {
        return joinUrl(v1, "contracts", String(id), "pdf");
      },
    },
  };

  /* --------------------------------- FINANCE --------------------------------- */
  const finance = {
    parties: {
      async search(query: string, opts?: { limit?: number }) {
        const p = new URLSearchParams();
        p.set("q", query);
        p.set("dir", "asc");
        if (opts?.limit) p.set("limit", String(opts.limit));
        const url = joinUrl(v1, "parties") + `?${p.toString()}`;
        const res = await fetchJson<{ items?: any[]; total?: number } | any[]>(url, { method: "GET" }, withAuth());
        return Array.isArray(res) ? res : (res?.items || []);
      },
    },
    contacts: {
      async create(input: {
        first_name?: string;
        last_name?: string;
        display_name?: string;
        email?: string;
        phone_e164?: string;
      }) {
        const url = joinUrl(v1, "contacts");
        return fetchJson<any>(url, { method: "POST", body: JSON.stringify(input) }, withAuth());
      },
    },
    organizations: {
      async create(input: { name: string; website?: string | null }) {
        const url = joinUrl(v1, "organizations");
        return fetchJson<any>(url, { method: "POST", body: JSON.stringify(input) }, withAuth());
      },
    },
    invoices: {
      async list(params: any = {}) {
        const p = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v != null && v !== "") p.set(k, String(v));
        });
        const url = joinUrl(v1, "invoices") + (p.toString() ? `?${p.toString()}` : "");
        return fetchJson<{ items: any[]; total: number }>(url, { method: "GET" }, withAuth());
      },
      async get(id: ID) {
        const url = joinUrl(v1, "invoices", String(id));
        return fetchJson<any>(url, { method: "GET" }, withAuth());
      },
      async create(body: any, idempotencyKey: string) {
        const url = joinUrl(v1, "invoices");
        return fetchJson<any>(
          url,
          { method: "POST", body: JSON.stringify(body) },
          { ...withAuth(), "Idempotency-Key": idempotencyKey }
        );
      },
      async update(id: ID, body: any) {
        const url = joinUrl(v1, "invoices", String(id));
        return fetchJson<any>(url, { method: "PATCH", body: JSON.stringify(body) }, withAuth());
      },
      async void(id: ID) {
        const url = joinUrl(v1, "invoices", String(id), "void");
        return fetchJson<any>(url, { method: "POST" }, withAuth());
      },
    },
    payments: {
      async list(params: any = {}) {
        const p = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v != null && v !== "") p.set(k, String(v));
        });
        const url = joinUrl(v1, "payments") + (p.toString() ? `?${p.toString()}` : "");
        return fetchJson<{ items: any[]; total: number }>(url, { method: "GET" }, withAuth());
      },
      async get(id: ID) {
        const url = joinUrl(v1, "payments", String(id));
        return fetchJson<any>(url, { method: "GET" }, withAuth());
      },
      async create(body: any, idempotencyKey: string) {
        const url = joinUrl(v1, "payments");
        return fetchJson<any>(
          url,
          { method: "POST", body: JSON.stringify(body) },
          { ...withAuth(), "Idempotency-Key": idempotencyKey }
        );
      },
    },
    expenses: {
      async list(params: any = {}) {
        const p = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v != null && v !== "") p.set(k, String(v));
        });
        const url = joinUrl(v1, "expenses") + (p.toString() ? `?${p.toString()}` : "");
        return fetchJson<{ items: any[]; total: number }>(url, { method: "GET" }, withAuth());
      },
      async get(id: ID) {
        const url = joinUrl(v1, "expenses", String(id));
        return fetchJson<any>(url, { method: "GET" }, withAuth());
      },
      async create(body: any) {
        const url = joinUrl(v1, "expenses");
        return fetchJson<any>(url, { method: "POST", body: JSON.stringify(body) }, withAuth());
      },
      async update(id: ID, body: any) {
        const url = joinUrl(v1, "expenses", String(id));
        return fetchJson<any>(url, { method: "PATCH", body: JSON.stringify(body) }, withAuth());
      },
      async remove(id: ID) {
        const url = joinUrl(v1, "expenses", String(id));
        return fetchJson<{ ok: true }>(url, { method: "DELETE" }, withAuth());
      },
    },
  };

  return {
    contacts,
    contactsExtras,
    tags,
    organizations,
    animals,
    lookups,
    audit,
    finance,
    portalAccess,
    partyCrm,
    messages,
    contracts,
  };
}

/* Default singleton for apps that do not need multiple bases */
const api = makeApi();
export default api;

/* Extra named exports if you need them elsewhere */
export { joinUrl };
