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

/** Only tenant header — no org for breeds anymore */
function getTenantHeaders(): HeadersMap {
  const h: HeadersMap = {};
  try {
    const w: any = window as any;

    const runtimeTenant = Number(w?.__BHQ_TENANT_ID__);
    const lsTenant = Number(localStorage.getItem("BHQ_TENANT_ID") || "NaN");
    const tenantId =
      Number.isFinite(runtimeTenant) && runtimeTenant > 0 ? runtimeTenant :
      Number.isFinite(lsTenant) && lsTenant > 0 ? lsTenant :
      NaN;

    if (Number.isFinite(tenantId)) h["x-tenant-id"] = String(tenantId);
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
 * - Sends x-tenant-id automatically (from runtime/LS)
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
    Object.entries(getTenantHeaders()).forEach(([k, v]) => h.set(k, v));

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
    // Kept for other UIs (ownership editors, etc.)
    async getCreatingOrganization(): Promise<{ id: string; display_name: string } | null> {
      try {
        const id = localStorage.getItem("BHQ_ORG_ID");
        if (id) {
          const display_name = localStorage.getItem("BHQ_ORG_NAME") || "My Organization";
          return { id: String(id), display_name: String(display_name) };
        }
      } catch {}

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
  type OwnerRow = {
    partyType: "Organization" | "Contact";
    organizationId?: number | null;
    contactId?: number | null;
    display_name?: string | null;
    is_primary?: boolean | null;
    percent?: number | null;
  };

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

    async create(body: {
      name: string;
      species: "DOG" | "CAT" | "HORSE";
      sex: "FEMALE" | "MALE";
      status?: string;
      birthDate?: string | null;
      microchip?: string | null;
      notes?: string | null;
      breed?: string | null;            // free text field
      canonicalBreedId?: number | null; // optional normalization
      customBreedId?: number | null;    // optional normalization
    }) {
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

    async putOwners(id: string | number, owners: OwnerRow[]) {
      const res = await fetch(`${root}/animals/${encodeURIComponent(String(id))}/owners`, {
        method: "PUT",
        credentials: "include",
        headers: hdrs({ method: "PUT" }),
        body: JSON.stringify({ owners }),
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

  /** ---------- Breeds (canonical + tenant custom) ---------- */
  type Species = "DOG" | "CAT" | "HORSE";
  type UiSpecies = "Dog" | "Cat" | "Horse";

  const toUiSpecies = (s: Species): UiSpecies =>
    s === "DOG" ? "Dog" : s === "CAT" ? "Cat" : "Horse";

  type BreedHit = {
    id?: number;                         // present for custom
    name: string;
    species: UiSpecies;                  // UI-friendly case
    source: "canonical" | "custom";
    canonicalBreedId?: number | null;    // reserved if you later normalize canonicals
  };

  const breeds = {
    /** Enum list from server (uppercase enums) */
    async species(): Promise<Species[]> {
      const res = await fetch(`${root}/species`, { credentials: "include", headers: hdrs() });
      const data = await parse<{ items: Species[] }>(res);
      return Array.isArray(data?.items) ? data.items : [];
    },

    /**
     * Canonical + tenant custom search (no org).
     * Server merges customs based on req.tenantId automatically.
     */
    async search(opts: { species: Species; q?: string; limit?: number }): Promise<BreedHit[]> {
      const sp = new URLSearchParams();
      sp.set("species", (opts.species || "DOG").toUpperCase());
      if (opts.q?.trim()) sp.set("q", opts.q.trim());
      if (opts.limit != null) sp.set("limit", String(Math.min(Math.max(opts.limit, 1), 200)));
      const url = `${root}/breeds/search?${sp.toString()}`;

      try {
        const res = await fetch(url, { credentials: "include", headers: hdrs() });
        const data = await parse<{ items?: any[] } | any[]>(res);
        const items: any[] = Array.isArray((data as any)?.items) ? (data as any).items : Array.isArray(data) ? (data as any) : [];
        // normalize species casing for UI
        return items.map(it => ({
          id: it.id,
          name: it.name,
          species: toUiSpecies((it.species || "DOG") as Species),
          source: (it.source || "canonical") as "canonical" | "custom",
          canonicalBreedId: it.canonicalBreedId ?? null,
        })) as BreedHit[];
      } catch {
        return [];
      }
    },

    // Tenant-scoped customs — no org in query/body
    async customList(opts: { species?: Species; q?: string; page?: number; limit?: number }) {
      const sp = new URLSearchParams();
      if (opts.species) sp.set("species", opts.species);
      if (opts.q) sp.set("q", opts.q);
      if (opts.page != null) sp.set("page", String(opts.page));
      if (opts.limit != null) sp.set("limit", String(opts.limit));
      const url = `${root}/breeds/custom${sp.toString() ? `?${sp.toString()}` : ""}`;
      const res = await fetch(url, { credentials: "include", headers: hdrs() });
      return parse<any>(res);
    },

    async customGet(id: string | number) {
      const url = `${root}/breeds/custom/${encodeURIComponent(String(id))}`;
      const res = await fetch(url, { credentials: "include", headers: hdrs() });
      return parse<any>(res);
    },

    async customCreate(payload: { species: Species; name: string }) {
      const res = await fetch(`${root}/breeds/custom`, {
        method: "POST",
        credentials: "include",
        headers: hdrs({ method: "POST" }),
        body: JSON.stringify(payload),
      });
      return parse<any>(res);
    },

    async customUpdate(id: string | number, payload: { name?: string; species?: Species }) {
      const res = await fetch(`${root}/breeds/custom/${encodeURIComponent(String(id))}`, {
        method: "PATCH",
        credentials: "include",
        headers: hdrs({ method: "PATCH" }),
        body: JSON.stringify(payload),
      });
      return parse<any>(res);
    },

    async customDelete(id: string | number) {
      const url = `${root}/breeds/custom/${encodeURIComponent(String(id))}`;
      const res = await fetch(url, { method: "DELETE", credentials: "include", headers: hdrs({ method: "DELETE" }) });
      return parse<any>(res);
    },

    /**
     * Optional: recipes/blends (only if you added endpoints server-side).
     * Kept here for forward-compat; harmless if unused.
     */
    async getRecipe(customBreedId: string | number) {
      const url = `${root}/breeds/custom/${encodeURIComponent(String(customBreedId))}/recipe`;
      const res = await fetch(url, { credentials: "include", headers: hdrs() });
      return parse<any>(res);
    },

    async putRecipe(
      customBreedId: string | number,
      body: { ingredients: Array<{ canonicalBreedId: number; percentage?: number | null }> }
    ) {
      const url = `${root}/breeds/custom/${encodeURIComponent(String(customBreedId))}/recipe`;
      const res = await fetch(url, {
        method: "PUT",
        credentials: "include",
        headers: hdrs({ method: "PUT" }),
        body: JSON.stringify(body),
      });
      return parse<any>(res);
    },
  };

  return { animals, lookups, breeds };
}
