// apps/animals/src/api.ts

type HeadersMap = Record<string, string>;

function normBase(base?: string): string {
  let b = String(base || (window as any).__BHQ_API_BASE__ || "").trim();
  if (!b) b = (typeof window !== "undefined" ? window.location.origin : "http://localhost:6170");
  b = b.replace(/\/+$/g, "").replace(/\/api\/v1$/i, "");
  return `${b}/api/v1`;
}

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[2]) : "";
}

// --- tenant resolution helpers (keep this block together) ---
const firstFinitePositive = (...cands: Array<any>): number | null => {
  for (const c of cands) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
};

function safeB64Json(s: string): any {
  try {
    const pad = (x: string) => x + "===".slice((x.length + 3) % 4);
    const norm = pad(s.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(atob(norm));
  } catch { return null; }
}

function tenantIdFromSessionCookie(): number | null {
  // support bhq_s or bhq_session (JWT-ish cookie)
  const raw = readCookie("bhq_s") || readCookie("bhq_session");
  if (!raw) return null;
  try {
    const parts = raw.split(".");
    const payloadB64 = parts.length === 3 ? parts[1] : parts[0];
    const p = safeB64Json(payloadB64) || {};
    return firstFinitePositive(p?.tenant?.id, p?.tenantId, p?.tenantID, p?.tenant_id);
  } catch { return null; }
}

let __TENANT_ID_CACHE: number | null | undefined;

function resolveTenantIdFromAnySource(): number | null {
  if (__TENANT_ID_CACHE !== undefined) return __TENANT_ID_CACHE;

  // 1) explicit resolver if host page provides one
  try {
    const w: any = window as any;
    if (typeof w.resolveTenantIdFromAnySource === "function") {
      const n = firstFinitePositive(w.resolveTenantIdFromAnySource());
      if (n) return (__TENANT_ID_CACHE = n);
    }
  } catch { }

  // 2) globals (runtime context)
  try {
    const w: any = window as any;
    const fromGlobal = firstFinitePositive(
      w.__BHQ_TENANT_ID__,
      w.__BHQ_CTX__?.tenantId,
      w.__BHQ_CTX__?.tenant?.id
    );
    if (fromGlobal) return (__TENANT_ID_CACHE = fromGlobal);
  } catch { }

  // 3) cookie (session/JWT)
  try {
    const fromCookie = tenantIdFromSessionCookie();
    if (fromCookie) return (__TENANT_ID_CACHE = fromCookie);
  } catch { }

  // 4) localStorage
  try {
    const fromLS = firstFinitePositive(localStorage.getItem("BHQ_TENANT_ID"));
    if (fromLS) return (__TENANT_ID_CACHE = fromLS);
  } catch { }

  // 5) dev env
  try {
    const fromEnv = firstFinitePositive((import.meta as any)?.env?.VITE_DEV_TENANT_ID);
    if (fromEnv) return (__TENANT_ID_CACHE = fromEnv);
  } catch { }

  return (__TENANT_ID_CACHE = null);
}

function getTenantHeader(): Record<string, string> {
  const id = resolveTenantIdFromAnySource();
  return id ? { "x-tenant-id": String(id) } : {};
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: any;
  try { data = text ? JSON.parse(text) : undefined; } catch { data = text; }
  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

/**
 * makeApi(base?, extraHeadersFn?)
 * - Sends x-tenant-id automatically
 * - Merges any extra headers you pass
 * - Adds Content-Type and CSRF only for mutating methods
 */
export function makeApi(
  base?: string,
  extraHeadersFn?: () => Record<string, string>
) {
  const root = normBase(base);

  const hdrs = (init?: RequestInit): HeadersInit => {
    const h = new Headers(init?.headers as any);

    // Default Accept header
    if (!h.has("accept")) h.set("accept", "application/json");

    // Tenant header
    Object.entries(getTenantHeader()).forEach(([k, v]) => h.set(k, v));

    // Optional extra headers
    try {
      const extra = extraHeadersFn?.() || {};
      Object.entries(extra).forEach(([k, v]) => h.set(k, v));
    } catch { }
    // Only set Content-Type and CSRF on non GET, HEAD, OPTIONS
    const m = String(init?.method || "GET").toUpperCase();
    if (m !== "GET" && m !== "HEAD" && m !== "OPTIONS") {
      if (!h.has("content-type")) h.set("content-type", "application/json");
      if (!h.has("x-csrf-token")) {
        const xsrf = readCookie("XSRF-TOKEN");
        if (xsrf) h.set("x-csrf-token", xsrf);
      }
    }
    return h;
  };

  /** ---------- Lookups used by editor UIs ---------- */
  const lookups = {
    async getCreatingOrganization(): Promise<{ id: string; display_name: string } | null> {
      // Local or dev fallback
      try {
        const id = localStorage.getItem("BHQ_ORG_ID");
        if (id) {
          const display_name = localStorage.getItem("BHQ_ORG_NAME") || "My Organization";
          return { id: String(id), display_name: String(display_name) };
        }
      } catch { }

      // Server session
      try {
        const res = await fetch(`${root}/session`, { credentials: "include", headers: hdrs() });
        const ctx = await parse<any>(res);
        const org = ctx?.creatingOrganization || ctx?.organization || ctx?.org;
        if (org?.id != null) {
          return { id: String(org.id), display_name: String(org.display_name || org.name || "Organization") };
        }
      } catch { }
      return null;
    },

    async searchContacts(q: string): Promise<Array<{ id: string | number; display_name: string }>> {
      const url = `${root}/contacts${q ? `?q=${encodeURIComponent(q)}` : ""}`;
      const res = await fetch(url, { credentials: "include", headers: hdrs() });
      const data = await parse<any>(res);
      const items: any[] = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      return items.map((c) => ({ id: c.id, display_name: c.display_name || c.name || c.full_name || "Contact" }));
    },

    async searchOrganizations(q: string): Promise<Array<{ id: string | number; display_name: string }>> {
      const url = `${root}/organizations${q ? `?q=${encodeURIComponent(q)}` : ""}`;
      const res = await fetch(url, { credentials: "include", headers: hdrs() });
      const data = await parse<any>(res);
      const items: any[] = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      return items.map((o) => ({ id: o.id, display_name: o.display_name || o.name || "Organization" }));
    },
  };



  /** ---------- Animals ---------- */
  const animals = {
    async list(query: { q?: string; limit?: number; page?: number; includeArchived?: boolean; sort?: string } = {}) {
      const sp = new URLSearchParams();
      if (query.q) sp.set("q", query.q);
      if (query.limit != null) sp.set("limit", String(query.limit));
      if (query.page != null) sp.set("page", String(query.page));
      if (query.includeArchived) sp.set("includeArchived", "true");
      if (query.sort) sp.set("sort", query.sort);

      const url = `${root}/animals${sp.toString() ? `?${sp.toString()}` : ""}`;
      const res = await fetch(url, { credentials: "include", headers: hdrs() });
      return parse<any>(res);
    },

    async get(id: string | number) {
      const res = await fetch(`${root}/animals/${encodeURIComponent(String(id))}`, {
        credentials: "include",
        headers: hdrs(),
      });
      return parse<any>(res);
    },

    async create(body: any) {
      const res = await fetch(`${root}/animals`, {
        method: "POST",
        credentials: "include",
        headers: hdrs({ method: "POST" }),
        body: JSON.stringify(body),
      });
      return parse<any>(res);
    },

    async update(id: string | number, patch: any) {
      const res = await fetch(`${root}/animals/${encodeURIComponent(String(id))}`, {
        method: "PATCH",
        credentials: "include",
        headers: hdrs({ method: "PATCH" }),
        body: JSON.stringify(patch),
      });
      return parse<any>(res);
    },

    async archive(id: string | number) {
      const res = await fetch(`${root}/animals/${encodeURIComponent(String(id))}/archive`, {
        method: "POST",
        credentials: "include",
        headers: hdrs({ method: "POST" }),
      });
      return parse<any>(res);
    },

    async restore(id: string | number) {
      const res = await fetch(`${root}/animals/${encodeURIComponent(String(id))}/restore`, {
        method: "POST",
        credentials: "include",
        headers: hdrs({ method: "POST" }),
      });
      return parse<any>(res);
    },

    async remove(id: string | number) {
      const res = await fetch(`${root}/animals/${encodeURIComponent(String(id))}`, {
        method: "DELETE",
        credentials: "include",
        headers: hdrs({ method: "DELETE" }),
      });
      return parse<any>(res);
    },

    /** ---------- Animals subresources (owners, breeds) ---------- */
    async getOwners(id: string | number) {
      const res = await fetch(`${root}/animals/${encodeURIComponent(String(id))}/owners`, {
        credentials: "include",
        headers: hdrs(),
      });
      return parse<any>(res);
    },

    async putOwners(id: string | number, owners: any[]) {
      const res = await fetch(`${root}/animals/${encodeURIComponent(String(id))}/owners`, {
        method: "PUT",
        credentials: "include",
        headers: hdrs({ method: "PUT" }),
        body: JSON.stringify(Array.isArray(owners) ? owners : []),
      });
      return parse<any>(res);
    },

    async getBreeds(id: string | number) {
      const res = await fetch(`${root}/animals/${encodeURIComponent(String(id))}/breeds`, {
        credentials: "include",
        headers: hdrs(),
      });
      return parse<any>(res);
    },

    async putBreeds(
      id: string | number,
      body: {
        species: "DOG" | "CAT" | "HORSE";
        primaryBreedId: string | number | null;
        canonical: { breedId: string | number; percentage: number }[];
        custom: { id: string | number; percentage: number }[];
      }
    ) {
      const res = await fetch(`${root}/animals/${encodeURIComponent(String(id))}/breeds`, {
        method: "PUT",
        credentials: "include",
        headers: hdrs({ method: "PUT" }),
        body: JSON.stringify(body),
      });
      return parse<any>(res);
    },
  };


  /** ---------- Breeds ---------- */
  type Species = "DOG" | "CAT" | "HORSE";
  type BreedItem = { id?: number; name: string; species: Species; source?: "canonical" | "custom" };

  // cache the discovered endpoint so we only probe once per reload
  let __BREED_SEARCH_ENDPOINT:
    | { path: string; method: "GET" | "POST" }
    | null
    | undefined;

  async function resolveBreedSearchEndpoint(root: string, headers: HeadersInit) {
    if (__BREED_SEARCH_ENDPOINT !== undefined) return __BREED_SEARCH_ENDPOINT;

    const candidates: Array<{ path: string; method: "GET" | "POST" }> = [
      { path: "/breeds/search", method: "GET" },
      { path: "/breeds", method: "GET" },
      { path: "/lookups/breeds/search", method: "GET" },
      { path: "/breeds/_search", method: "POST" },
    ];

    for (const c of candidates) {
      try {
        const u = new URL(root + c.path);
        if (c.method === "GET") {
          u.searchParams.set("species", "DOG");
          u.searchParams.set("q", "Be");
          u.searchParams.set("limit", "1");
          const res = await fetch(u.toString(), { credentials: "include", headers });
          if (res.ok) { __BREED_SEARCH_ENDPOINT = c; console.info("[breeds] using", c.method, c.path); return c; }
        } else {
          const res = await fetch(u.toString(), {
            method: "POST",
            credentials: "include",
            headers: new Headers(headers as any),
            body: JSON.stringify({ species: "DOG", q: "Be", limit: 1 }),
          });
          if (res.ok) { __BREED_SEARCH_ENDPOINT = c; console.info("[breeds] using", c.method, c.path); return c; }
        }
      } catch { /* continue */ }
    }

    __BREED_SEARCH_ENDPOINT = null;
    console.warn("[breeds] no search endpoint found");
    return null;
  }


  const breeds = {
    /** Get enum list from server */
    async species(): Promise<Species[]> {
      const res = await fetch(`${root}/species`, { credentials: "include", headers: hdrs() });
      const data = await parse<{ items: Species[] }>(res);
      return Array.isArray(data?.items) ? data.items : [];
    },

    /**
     * Canonical plus custom search.
     * Pass organizationId to allow the server to merge org custom breeds.
     */
    async search(opts: {
      species: Species;
      q?: string;
      limit?: number;
      registries?: string[];
      organizationId?: string | number;
    }): Promise<BreedItem[]> {
      const h = hdrs(); // fresh headers (tenant/org/etc.)
      const species = (opts.species || "DOG").toUpperCase() as Species;
      const limit = Number.isFinite(Number(opts.limit)) ? Math.max(1, Math.min(Number(opts.limit), 200)) : 200;
      const q = (opts.q || "").trim();

      let orgId: string | null = null;
      if (opts.organizationId != null) orgId = String(opts.organizationId);
      else { try { const ls = localStorage.getItem("BHQ_ORG_ID"); if (ls) orgId = String(ls); } catch { } }

      const ep = await resolveBreedSearchEndpoint(root, h);
      if (!ep) return [];

      try {
        if (ep.method === "GET") {
          const url = new URL(root + ep.path);
          url.searchParams.set("species", species);
          if (q) url.searchParams.set("q", q);
          url.searchParams.set("limit", String(limit));
          if (opts.registries?.length) url.searchParams.set("registries", opts.registries.join(","));
          if (orgId) {
            url.searchParams.set("organizationId", orgId);
            url.searchParams.set("organization_id", orgId); // be tolerant
          }
          const res = await fetch(url.toString(), { credentials: "include", headers: h });
          const data = await parse<any>(res);
          const items: any[] =
            Array.isArray(data) ? data :
              Array.isArray(data?.items) ? data.items :
                Array.isArray(data?.data?.items) ? data.data.items :
                  Array.isArray(data?.rows) ? data.rows : [];
          return items as BreedItem[];
        } else {
          const res = await fetch(root + ep.path, {
            method: "POST",
            credentials: "include",
            headers: hdrs({ method: "POST" }),
            body: JSON.stringify({
              species,
              q,
              limit,
              registries: opts.registries,
              organizationId: orgId,
              organization_id: orgId,
            }),
          });
          const data = await parse<any>(res);
          const items: any[] =
            Array.isArray(data) ? data :
              Array.isArray(data?.items) ? data.items :
                Array.isArray(data?.data?.items) ? data.data.items :
                  Array.isArray(data?.rows) ? data.rows : [];
          return items as BreedItem[];
        }
      } catch (e) {
        console.warn("[breeds.search] failed via", ep.method, ep.path, e);
        __BREED_SEARCH_ENDPOINT = undefined; // allow re-probe next time
        return [];
      }
    },

    // Custom breeds require organizationId
    async customList(opts: {
      organizationId: string | number;
      species?: Species;
      q?: string;
      page?: number;
      limit?: number;
    }) {
      const sp = new URLSearchParams();
      sp.set("organizationId", String(opts.organizationId));
      if (opts.species) sp.set("species", opts.species);
      if (opts.q) sp.set("q", opts.q);
      if (opts.page != null) sp.set("page", String(opts.page));
      if (opts.limit != null) sp.set("limit", String(opts.limit));
      const url = `${root}/breeds/custom?${sp.toString()}`;
      const res = await fetch(url, { credentials: "include", headers: hdrs() });
      return parse<any>(res);
    },

    async customGet(id: string | number, organizationId: string | number) {
      const url = `${root}/breeds/custom/${encodeURIComponent(String(id))}?organizationId=${encodeURIComponent(String(organizationId))}`;
      const res = await fetch(url, { credentials: "include", headers: hdrs() });
      return parse<any>(res);
    },

    async customCreate(payload: { organizationId: string | number; species: Species; name: string }) {
      const res = await fetch(`${root}/breeds/custom`, {
        method: "POST",
        credentials: "include",
        headers: hdrs({ method: "POST" }),
        body: JSON.stringify(payload),
      });
      return parse<any>(res);
    },

    async customUpdate(id: string | number, payload: { organizationId: string | number; name?: string; species?: Species }) {
      const res = await fetch(`${root}/breeds/custom/${encodeURIComponent(String(id))}`, {
        method: "PATCH",
        credentials: "include",
        headers: hdrs({ method: "PATCH" }),
        body: JSON.stringify(payload),
      });
      return parse<any>(res);
    },

    async customDelete(id: string | number, organizationId: string | number) {
      const url = `${root}/breeds/custom/${encodeURIComponent(String(id))}?organizationId=${encodeURIComponent(String(organizationId))}`;
      const res = await fetch(url, { method: "DELETE", credentials: "include", headers: hdrs({ method: "DELETE" }) });
      return parse<any>(res);
    },
  };

  return { animals, lookups, breeds };
}
