import { readTenantIdFast, resolveTenantId } from "@bhq/ui/utils/tenant";
import type { BreedHit } from "@bhq/ui";


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

/** Tenant resolution */
let __tenantResolved: number | null = null;
let __tenantResolving: Promise<number> | null = null;

async function ensureTenantId(baseUrl: string): Promise<number> {
  const fast = readTenantIdFast();
  if (fast) {
    __tenantResolved = fast;
    return fast;
  }

  try {
    const w: any = window as any;
    const runtimeTenant = Number(w?.__BHQ_TENANT_ID__);
    const lsTenant = Number(localStorage.getItem("BHQ_TENANT_ID") || "NaN");
    const cached = Number.isInteger(runtimeTenant) && runtimeTenant > 0 ? runtimeTenant
      : (Number.isInteger(lsTenant) && lsTenant > 0 ? lsTenant : NaN);
    if (Number.isInteger(cached) && cached > 0) {
      __tenantResolved = cached;
      return cached;
    }
  } catch {}

  if (!__tenantResolving) {
    __tenantResolving = resolveTenantId({ baseUrl }).then((t) => {
      __tenantResolved = t;
      try {
        (window as any).__BHQ_TENANT_ID__ = t;
        localStorage.setItem("BHQ_TENANT_ID", String(t));
      } catch {}
      return t;
    });
  }

  const t = await __tenantResolving.catch(() => 0);
  if (!t || t <= 0) throw new Error("Tenant could not be resolved; user may not be logged in.");
  return t;
}

function buildHeaders(tenantId: number, init?: RequestInit): Headers {
  const h = new Headers(init?.headers as any);
  h.set("x-tenant-id", String(tenantId));

  const method = String(init?.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    if (!h.has("content-type")) h.set("content-type", "application/json");
    if (!h.has("x-csrf-token")) {
      const xsrf = readCookie("XSRF-TOKEN");
      if (xsrf) h.set("x-csrf-token", xsrf);
    }
  }
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

async function req<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit & { json?: any }
): Promise<T> {
  const tenantId = await ensureTenantId(baseUrl);
  const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
  const body = (init as any)?.json !== undefined ? JSON.stringify((init as any).json) : init?.body;
  const headers = buildHeaders(tenantId, init);
  const res = await fetch(url, { ...init, headers, credentials: "include", body });
  return parse<T>(res);
}

function spFrom(obj: Record<string, any>): string {
  const sp = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export function makeApi(
  base?: string,
  extraHeadersFn?: () => Record<string, string>
) {
  const root = normBase(base);

  const reqWithExtra = async <T>(path: string, init?: RequestInit & { json?: any }) => {
    const tenantId = await ensureTenantId(root);
    const url = path.startsWith("http") ? path : `${root}${path}`;
    const body = (init as any)?.json !== undefined ? JSON.stringify((init as any).json) : init?.body;

    const h = buildHeaders(tenantId, init);
    try {
      const extra = extraHeadersFn?.() || {};
      Object.entries(extra).forEach(([k, v]) => h.set(k, v));
    } catch {}

    const res = await fetch(url, { ...init, headers: h, credentials: "include", body });
    return parse<T>(res);
  };

  /** Lookups used by editor UIs */
  const lookups = {
    async getCreatingOrganization(): Promise<{ id: string; display_name: string } | null> {
      try {
        const id = localStorage.getItem("BHQ_ORG_ID");
        if (id) {
          const display_name = localStorage.getItem("BHQ_ORG_NAME") || "My Organization";
          return { id: String(id), display_name: String(display_name) };
        }
      } catch {}
      try {
        const data = await reqWithExtra<any>("/session");
        const org = data?.creatingOrganization || data?.organization || data?.org;
        if (org?.id != null) {
          return { id: String(org.id), display_name: String(org.display_name || org.name || "Organization") };
        }
      } catch {}
      return null;
    },

    async searchContacts(q: string): Promise<Array<{ id: string | number; display_name: string }>> {
      const data = await reqWithExtra<any>(`/contacts${spFrom({ q })}`);
      const items: any[] = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      return items.map((c) => ({ id: c.id, display_name: c.display_name || c.name || c.full_name || "Contact" }));
    },

    async searchOrganizations(q: string): Promise<Array<{ id: string | number; display_name: string }>> {
      // primary endpoint
      try {
        const data = await reqWithExtra<any>(`/organizations${spFrom({ q })}`);
        const items: any[] = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        return items.map((o) => ({ id: o.id, display_name: o.display_name || o.name || "Organization" }));
      } catch {
        // fallback (covers older backends)
        const data = await reqWithExtra<any>(`/orgs${spFrom({ q })}`);
        const items: any[] = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        return items.map((o) => ({ id: o.id, display_name: o.display_name || o.name || "Organization" }));
      }
    },
  };

  /** Animals */
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
      return reqWithExtra<any>(`/animals${spFrom(query)}`);
    },

    async get(id: string | number) {
      return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}`);
    },

    async create(body: {
      name: string;
      nickname?: string | null;
      species: "DOG" | "CAT" | "HORSE";
      sex: "FEMALE" | "MALE";
      status?: string;
      birthDate?: string | null;
      microchip?: string | null;
      notes?: string | null;
      breed?: string | null;
      canonicalBreedId?: number | null;
      customBreedId?: number | null;
    }) {
      return reqWithExtra<any>(`/animals`, { method: "POST", json: body });
    },

    async update(id: string | number, patch: any) {
      return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}`, { method: "PATCH", json: patch });
    },

    async putOwners(id: string | number, owners: OwnerRow[]) {
      return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/owners`, { method: "PUT", json: { owners } });
    },

    async archive(id: string | number) {
      return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/archive`, { method: "POST" });
    },

    async restore(id: string | number) {
      return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/restore`, { method: "POST" });
    },

    async remove(id: string | number) {
      return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}`, { method: "DELETE" });
    },

    // NEW: persist cycle start dates for an animal
    async putCycleStartDates(id: string | number, dates: string[]) {
      return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/cycle-start-dates`, {
        method: "PUT",
        json: { dates },
      });
    },
  };

  /** Breeds (canonical + tenant custom) */
  type Species = "DOG" | "CAT" | "HORSE";
  type UiSpecies = "Dog" | "Cat" | "Horse";
  const toUiSpecies = (s: Species): UiSpecies => (s === "DOG" ? "Dog" : s === "CAT" ? "Cat" : "Horse");

    const breeds = {
    async species(): Promise<Species[]> {
      const data = await reqWithExtra<{ items: Species[] }>(`/species`);
      return Array.isArray(data?.items) ? data.items : [];
    },

    async search(opts: { species: Species; q?: string; limit?: number }): Promise<BreedHit[]> {
      const data = await reqWithExtra<{ items?: any[] } | any[]>(
        `/breeds/search${spFrom({
          species: (opts.species || "DOG").toUpperCase(),
          q: (opts.q || "").trim() || undefined,
          limit: opts.limit != null ? Math.min(Math.max(opts.limit, 1), 200) : undefined,
        })}`
      );
      const items: any[] = Array.isArray((data as any)?.items) ? (data as any).items : Array.isArray(data) ? (data as any) : [];
      return items.map((it) => ({
        id: it.id,
        name: it.name,
        species: toUiSpecies((it.species || "DOG") as Species),
        source: (it.source || "canonical") as "canonical" | "custom",
        canonicalBreedId: it.canonicalBreedId ?? null,
      })) as BreedHit[];
    },

    async customList(opts: { species?: Species; q?: string; page?: number; limit?: number }) {
      return reqWithExtra<any>(`/breeds/custom${spFrom(opts || {})}`);
    },

    async customGet(id: string | number) {
      return reqWithExtra<any>(`/breeds/custom/${encodeURIComponent(String(id))}`);
    },

    async customCreate(payload: { species: Species; name: string }) {
      return reqWithExtra<any>(`/breeds/custom`, { method: "POST", json: payload });
    },

    async customUpdate(id: string | number, payload: { name?: string; species?: Species }) {
      return reqWithExtra<any>(`/breeds/custom/${encodeURIComponent(String(id))}`, { method: "PATCH", json: payload });
    },

    async customDelete(id: string | number) {
      return reqWithExtra<any>(`/breeds/custom/${encodeURIComponent(String(id))}`, { method: "DELETE" });
    },

    async getRecipe(customBreedId: string | number) {
      return reqWithExtra<any>(`/breeds/custom/${encodeURIComponent(String(customBreedId))}/recipe`);
    },

    async putRecipe(
      customBreedId: string | number,
      body: { ingredients: Array<{ canonicalBreedId: number; percentage?: number | null }> }
    ) {
      return reqWithExtra<any>(`/breeds/custom/${encodeURIComponent(String(customBreedId))}/recipe`, {
        method: "PUT",
        json: body,
      });
    },
  };

  return { animals, lookups, breeds };
}
