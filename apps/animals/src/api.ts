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

function getTenantHeader(): HeadersMap {
  const h: HeadersMap = {};
  try {
    const w: any = window as any;
    const runtime = Number(w?.__BHQ_TENANT_ID__);
    const fromLS = Number(localStorage.getItem("BHQ_TENANT_ID") || "NaN");
    const id =
      Number.isFinite(runtime) && runtime > 0 ? runtime :
      Number.isFinite(fromLS) && fromLS > 0 ? fromLS :
      NaN;
    if (Number.isFinite(id)) h["x-tenant-id"] = String(id);
  } catch {}
  return h;
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

    // Tenant header
    Object.entries(getTenantHeader()).forEach(([k, v]) => h.set(k, v));

    // Optional extra headers
    try {
      const extra = extraHeadersFn?.() || {};
      Object.entries(extra).forEach(([k, v]) => h.set(k, v));
    } catch {}

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
      } catch {}

      // Server session
      try {
        const res = await fetch(`${root}/session`, { credentials: "include", headers: hdrs() });
        const ctx = await parse<any>(res);
        const org = ctx?.creatingOrganization || ctx?.organization || ctx?.org;
        if (org?.id != null) {
          return { id: String(org.id), display_name: String(org.display_name || org.name || "Organization") };
        }
      } catch {}
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
  };

  /** ---------- Breeds ---------- */
  type Species = "DOG" | "CAT" | "HORSE";
  type BreedItem = { id?: number; name: string; species: Species; source?: "canonical" | "custom" };

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
      const sp = new URLSearchParams();
      sp.set("species", (opts.species || "DOG").toUpperCase());
      if (opts.q?.trim()) sp.set("q", opts.q.trim());
      if (opts.limit != null) sp.set("limit", String(Math.min(Math.max(opts.limit, 1), 200)));
      if (opts.registries?.length) sp.set("registries", opts.registries.join(","));
      if (opts.organizationId != null) sp.set("organizationId", String(opts.organizationId));
      const url = `${root}/breeds/search?${sp.toString()}`;

      try {
        const res = await fetch(url, { credentials: "include", headers: hdrs() });
        const data = await parse<{ items?: BreedItem[] } | BreedItem[]>(res);
        const items: any[] = Array.isArray((data as any)?.items) ? (data as any).items : Array.isArray(data) ? (data as any) : [];
        return items as BreedItem[];
      } catch {
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
