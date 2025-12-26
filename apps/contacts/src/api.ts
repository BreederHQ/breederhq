// apps/contacts/src/api.ts
import { readTenantIdFast } from "@bhq/ui/utils/tenant";

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
  const raw = readCookie("bhq_s");
  if (!raw) return null;
  try {
    const parts = raw.split(".");
    const payloadB64 = parts.length === 3 ? parts[1] : parts[0];
    const payload = safeB64Json(payloadB64) || {};
    const id =
      Number(payload?.tenant?.id) ??
      Number(payload?.tenantId) ??
      Number(payload?.tenantID) ??
      Number(payload?.tenant_id);
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
    console.warn("[BHQ] Missing x-tenant-id. Sources:", {
      fast,
      fromSessionCookie,
      fromBhqObj,
      fromLegacyGlobal,
      fromLS,
      fromEnv,
      cookie_bhq_s_present: !!document.cookie.match(/(?:^|; )bhq_s=/),
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
  const origin = baseOrigin || "";
  const v1 = joinUrl(origin, "/api/v1");
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
  const tags = {
    async list(module: Module, opts: { q?: string; page?: number; limit?: number } = {}) {
      const p = new URLSearchParams();
      if (module) p.set("module", module);
      if (opts.q) p.set("q", opts.q);
      if (opts.page != null) p.set("page", String(opts.page));
      if (opts.limit != null) p.set("limit", String(opts.limit));
      const url = joinUrl(v1, "tags") + (p.toString() ? `?${p.toString()}` : "");
      return fetchJson<{ items: any[]; total: number; page: number; limit: number }>(
        url,
        { method: "GET" },
        withAuth()
      );
    },
    async create(payload: { name: string; module: Module; color?: string | null }) {
      const url = joinUrl(v1, "tags");
      return fetchJson<any>(url, { method: "POST", body: JSON.stringify(payload) }, withAuth());
    },
    async get(id: ID) {
      const url = joinUrl(v1, "tags", String(id));
      return fetchJson<any>(url, { method: "GET" }, withAuth());
    },
    async update(id: ID, payload: { name?: string; color?: string | null }) {
      const url = joinUrl(v1, "tags", String(id));
      return fetchJson<any>(url, { method: "PATCH", body: JSON.stringify(payload) }, withAuth());
    },
    async remove(id: ID) {
      const url = joinUrl(v1, "tags", String(id));
      return fetchJson<void>(url, { method: "DELETE" }, withAuth());
    },
    async assign(tagId: ID, entityId: ID, kind: Module = "CONTACT") {
      const url = joinUrl(v1, "tags", String(tagId), "assign");
      const body =
        kind === "CONTACT"
          ? { contactId: Number(entityId) }
          : kind === "ORGANIZATION"
            ? { organizationId: Number(entityId) }
            : { animalId: Number(entityId) };
      return fetchJson<any>(url, { method: "POST", body: JSON.stringify(body) }, withAuth());
    },
    async unassign(tagId: ID, entityId: ID, kind: Module = "CONTACT") {
      const url = joinUrl(v1, "tags", String(tagId), "unassign");
      const body =
        kind === "CONTACT"
          ? { contactId: Number(entityId) }
          : kind === "ORGANIZATION"
            ? { organizationId: Number(entityId) }
            : { animalId: Number(entityId) };
      return fetchJson<any>(url, { method: "POST", body: JSON.stringify(body) }, withAuth());
    },
    async listForContact(contactId: ID): Promise<Array<{ id: number; name: string }>> {
      const url = joinUrl(v1, "contacts", String(contactId), "tags");
      try {
        const res = await fetchJson<any>(url, { method: "GET" }, withAuth());
        const arr = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
        return arr.map((t: any) => ({ id: Number(t.id), name: String(t.name) }));
      } catch (e: any) {
        if (e?.status === 404) return [];
        throw e;
      }
    },
  };

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

  return {
    contacts,
    contactsExtras,
    tags,
    organizations,
    animals,
    lookups,
    audit,
  };
}

/* Default singleton for apps that do not need multiple bases */
const api = makeApi();
export default api;

/* Extra named exports if you need them elsewhere */
export { joinUrl };
