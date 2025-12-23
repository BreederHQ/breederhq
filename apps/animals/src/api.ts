// apps/animals/src/api.ts
import { readTenantIdFast, resolveTenantId } from "@bhq/ui/utils/tenant";
import type { BreedHit } from "@bhq/ui";

/* ───────── base + cookies ───────── */

function normBase(base?: string): string {
  let b = String(base || (window as any).__BHQ_API_BASE__ || "").trim();
  if (!b) b = typeof window !== "undefined" ? window.location.origin : "http://localhost:6170";
  b = b.replace(/\/+$/g, "").replace(/\/api\/v1$/i, "");
  return `${b}/api/v1`;
}

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[2]) : "";
}

/* ───────── tenant resolution ───────── */

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
    const cached =
      Number.isInteger(runtimeTenant) && runtimeTenant > 0
        ? runtimeTenant
        : Number.isInteger(lsTenant) && lsTenant > 0
          ? lsTenant
          : NaN;
    if (Number.isInteger(cached) && cached > 0) {
      __tenantResolved = cached;
      return cached;
    }
  } catch { }

  if (!__tenantResolving) {
    __tenantResolving = resolveTenantId({ baseUrl }).then(t => {
      __tenantResolved = t;
      try {
        (window as any).__BHQ_TENANT_ID__ = t;
        localStorage.setItem("BHQ_TENANT_ID", String(t));
      } catch { }
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
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;

  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    if (!isFormData && !h.has("content-type")) {
      h.set("content-type", "application/json");
    }
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
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
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

/* ───────── public factory ───────── */

export function makeApi(base?: string, extraHeadersFn?: () => Record<string, string>) {
  const root = normBase(base);

  const reqWithExtra = async <T>(path: string, init?: RequestInit & { json?: any }) => {
    const tenantId = await ensureTenantId(root);
    const url = path.startsWith("http") ? path : `${root}${path}`;
    const body = (init as any)?.json !== undefined ? JSON.stringify((init as any).json) : init?.body;

    const h = buildHeaders(tenantId, init);
    try {
      const extra = extraHeadersFn?.() || {};
      Object.entries(extra).forEach(([k, v]) => h.set(k, v));
    } catch { }

    const res = await fetch(url, { ...init, headers: h, credentials: "include", body });
    return parse<T>(res);
  };

  /* ───────── Lookups used by editor UIs ───────── */

  const lookups = {
    async getCreatingOrganization(): Promise<{ id: string; display_name: string } | null> {
      try {
        const id = localStorage.getItem("BHQ_ORG_ID");
        if (id) {
          const display_name = localStorage.getItem("BHQ_ORG_NAME") || "My Organization";
          return { id: String(id), display_name: String(display_name) };
        }
      } catch { }
      try {
        const data = await reqWithExtra<any>("/session");
        const org = data?.creatingOrganization || data?.organization || data?.org;
        if (org?.id != null) {
          return { id: String(org.id), display_name: String(org.display_name || org.name || "Organization") };
        }
      } catch { }
      return null;
    },

    async searchContacts(q: string): Promise<Array<{ id: string | number; display_name: string }>> {
      const data = await reqWithExtra<any>(`/contacts${spFrom({ q })}`);
      const items: any[] = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      return items.map(c => ({ id: c.id, display_name: c.display_name || c.name || c.full_name || "Contact" }));
    },

    async searchOrganizations(q: string): Promise<Array<{ id: string | number; display_name: string }>> {
      try {
        const data = await reqWithExtra<any>(`/organizations${spFrom({ q })}`);
        const items: any[] = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        return items.map(o => ({ id: o.id, display_name: o.display_name || o.name || "Organization" }));
      } catch {
        const data = await reqWithExtra<any>(`/orgs${spFrom({ q })}`);
        const items: any[] = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        return items.map(o => ({ id: o.id, display_name: o.display_name || o.name || "Organization" }));
      }
    },
  };

  /* ───────── Animals API (matches server routes) ───────── */

  type Species = "DOG" | "CAT" | "HORSE" | "GOAT" | "SHEEP" | "RABBIT";
  type UiSpecies = "Dog" | "Cat" | "Horse" | "Goat" | "Sheep" | "Rabbit";
  const toUiSpecies = (s: Species): UiSpecies => {
    if (s === "DOG") return "Dog";
    if (s === "CAT") return "Cat";
    if (s === "HORSE") return "Horse";
    if (s === "GOAT") return "Goat";
    if (s === "SHEEP") return "Sheep";
    if (s === "RABBIT") return "Rabbit";
    return "Horse";
  };

  type OwnerPartyType = "Organization" | "Contact";
  type OwnerRow = {
    partyType: OwnerPartyType;
    organizationId?: number | null;
    contactId?: number | null;
    percent: number;
    isPrimary?: boolean;
  };

  const animals = {
    /* list / get / create / update */
    async list(query: { q?: string; limit?: number; page?: number; includeArchived?: boolean; sort?: string } = {}) {
      return reqWithExtra<any>(`/animals${spFrom(query)}`);
    },

    async get(id: string | number) {
      return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}`);
    },

    async create(body: {
      name: string;
      species: Species;
      sex: "FEMALE" | "MALE";
      status?: string;
      birthDate?: string | null;
      microchip?: string | null;
      notes?: string | null;
      breed?: string | null;
      canonicalBreedId?: number | null;
      customBreedId?: number | null;
      organizationId?: number | null;
    }) {
      return reqWithExtra<any>(`/animals`, { method: "POST", json: body });
    },

    async update(id: string | number, patch: any) {
      return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}`, { method: "PATCH", json: patch });
    },

    async archive(id: string | number) {
      return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/archive`, { method: "POST", json: {} });
    },

    async restore(id: string | number) {
      return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/restore`, { method: "POST", json: {} });
    },

    async remove(id: string | number) {
      return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}`, { method: "DELETE" });
    },

    /* profile photo upload and delete */
    photo: {
      async upload(id: string | number, file: File): Promise<{ photoUrl: string }> {
        const form = new FormData();
        form.append("file", file);

        return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/photo`, {
          method: "POST",
          body: form,
        });
      },

      async remove(id: string | number): Promise<{ photoUrl: string | null }> {
        return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/photo`, {
          method: "DELETE",
        });
      },
    },

    // Persist breeder entered cycle start dates
    async putCycleStartDates(payload: { animalId: number | string; dates: string[] }) {
      const { animalId, dates } = payload;
      return reqWithExtra<any>(
        `/animals/${encodeURIComponent(String(animalId))}/cycle-start-dates`,
        {
          method: "PUT",
          json: { dates },
        }
      );
    },


    /* owners: GET list, POST add, PATCH update, DELETE remove */
    owners: {
      async list(id: string | number) {
        return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/owners`);
      },
      async add(id: string | number, row: OwnerRow) {
        return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/owners`, { method: "POST", json: row });
      },
      async update(id: string | number, ownerId: string | number, patch: Partial<OwnerRow>) {
        return reqWithExtra<any>(
          `/animals/${encodeURIComponent(String(id))}/owners/${encodeURIComponent(String(ownerId))}`,
          { method: "PATCH", json: patch }
        );
      },
      async remove(id: string | number, ownerId: string | number) {
        return reqWithExtra<any>(
          `/animals/${encodeURIComponent(String(id))}/owners/${encodeURIComponent(String(ownerId))}`,
          { method: "DELETE" }
        );
      },
    },

    /* tags parity */
    tags: {
      async list(id: string | number) {
        return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/tags`);
      },
      async add(id: string | number, tagId: number) {
        return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/tags`, {
          method: "POST",
          json: { tagId },
        });
      },
      async remove(id: string | number, tagId: number) {
        return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/tags/${encodeURIComponent(String(tagId))}`, {
          method: "DELETE",
        });
      },
    },

    /* registries parity */
    registries: {
      async list(id: string | number) {
        return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/registries`);
      },
      async add(id: string | number, payload: { registryId: number; identifier: string; registrarOfRecord?: string | null; issuedAt?: string | null }) {
        return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/registries`, {
          method: "POST",
          json: payload,
        });
      },
      async update(
        id: string | number,
        identifierId: string | number,
        patch: Partial<{ identifier: string; registrarOfRecord: string | null; issuedAt: string | null; registryId: number }>
      ) {
        return reqWithExtra<any>(
          `/animals/${encodeURIComponent(String(id))}/registries/${encodeURIComponent(String(identifierId))}`,
          { method: "PATCH", json: patch }
        );
      },
      async remove(id: string | number, identifierId: string | number) {
        return reqWithExtra<any>(
          `/animals/${encodeURIComponent(String(id))}/registries/${encodeURIComponent(String(identifierId))}`,
          { method: "DELETE" }
        );
      },
    },
  };

  /* ───────── Breeds (unchanged, assuming backend exists) ───────── */

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
      const items: any[] = Array.isArray((data as any)?.items)
        ? (data as any).items
        : Array.isArray(data)
          ? (data as any)
          : [];
      return items.map(it => ({
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