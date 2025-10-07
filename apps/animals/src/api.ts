// apps/animals/src/api.ts

// Small helper to join URL parts safely
function joinUrl(...parts: Array<string | undefined | null>) {
  const cleaned = parts
    .filter(Boolean)
    .map((s) => String(s).replace(/(^\/+|\/+$)/g, ""));
  const first = cleaned.shift() || "";
  return (
    (first.match(/^https?:\/\//) ? first.replace(/\/+$/, "") : "/" + first) +
    (cleaned.length ? "/" + cleaned.join("/") : "")
  );
}

/** Read org header from localStorage (used by makeApi header factory) */
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  try {
    const org = localStorage.getItem("BHQ_ORG_ID");
    if (org) headers["X-Org-Id"] = org;
  } catch {
    /* ignore */
  }
  return headers;
}

/** JSON fetch with cookies + auth headers + good errors */
async function fetchJson<T = any>(
  url: string,
  init: RequestInit = {},
  extraHeaders?: Record<string, string>
): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      ...(extraHeaders || {}),
    },
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON or empty */
  }

  if (!res.ok) {
    const msg =
      body?.message ||
      body?.error ||
      (res.status === 404 ? "Not Found" : `HTTP ${res.status}`);
    throw new Error(msg);
  }
  return body as T;
}

/** Types (lightweight, only what we need) */
export type ID = string | number;

export type OwnerRow = {
  partyType: "Contact" | "Organization";
  contactId: string | number | null;
  organizationId: string | number | null;
  display_name: string;
  percent: number;
  is_primary?: boolean;
};

type AnimalsListQuery = {
  q?: string;
  limit?: number;
  page?: number;
  includeArchived?: boolean;
  sort?: string;
};

type CreateAnimalPayload = Record<string, any>;
type UpdateAnimalPayload = Record<string, any>;

type BreedSnapshotBody = {
  species: "DOG" | "CAT" | "HORSE";
  primaryBreedId: string | null;
  canonical: Array<{ breedId: string; percentage: number }>;
  custom: Array<{ id: string; percentage: number }>;
};

type ContextResponse = {
  creatingOrganization?: { id: string | number; display_name?: string; name?: string };
  organization?: { id: string | number; display_name?: string; name?: string };
};

/**
 * Factory: returns the API surface used by App-Animals.tsx
 *
 * @param baseOrigin Optional origin, defaults to current window origin or http://localhost:6170
 * @param authHeaderFn Optional function that returns extra headers (e.g., X-Org-Id)
 */
export function makeApi(
  baseOrigin?: string,
  authHeaderFn?: () => Record<string, string>
) {
  const origin =
    baseOrigin ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:6170");

  // All endpoints are under /api/v1
  const v1 = joinUrl(origin, "api", "v1");

  const withAuth = () => ({
    ...(authHeaderFn ? authHeaderFn() : getAuthHeaders()),
  });

  /** -------- Lookups -------- */
  const lookups = {
    /**
     * Get the "creating organization" for the current session/tenant.
     * Now tries localStorage first to avoid a noisy 404 in dev, then falls back to the server.
     */
    async getCreatingOrganization(): Promise<{ id: string; display_name: string } | null> {
      // 1) Local dev fallback FIRST (prevents the 404 you saw)
      try {
        const id = localStorage.getItem("BHQ_ORG_ID");
        if (id) {
          const display_name = localStorage.getItem("BHQ_ORG_NAME") || "My Organization";
          return { id: String(id), display_name: String(display_name) };
        }
      } catch {
        /* ignore */
      }

      // 2) Server context (if available)
      try {
        const ctx = await fetchJson<ContextResponse>(
          joinUrl(v1, "session", "context"),
          { method: "GET" },
          withAuth()
        );

        const org = ctx?.creatingOrganization || ctx?.organization;
        if (org?.id != null) {
          const display = (org.display_name || org.name || "Organization") as string;
          return { id: String(org.id), display_name: String(display) };
        }
      } catch {
        // ignore (stay null)
      }

      return null;
    },

    async searchContacts(q: string): Promise<Array<{ id: ID; display_name: string }>> {
      const url = joinUrl(v1, "contacts") + (q ? `?q=${encodeURIComponent(q)}` : "");
      const res = await fetchJson<any>(url, { method: "GET" }, withAuth());
      const items: any[] = Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res)
        ? res
        : [];
      return items.map((c) => ({
        id: c.id,
        display_name: c.display_name || c.name || c.full_name || "Contact",
      }));
    },

    async searchOrganizations(q: string): Promise<Array<{ id: ID; display_name: string }>> {
      const url = joinUrl(v1, "organizations") + (q ? `?q=${encodeURIComponent(q)}` : "");
      const res = await fetchJson<any>(url, { method: "GET" }, withAuth());
      const items: any[] = Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res)
        ? res
        : [];
      return items.map((o) => ({
        id: o.id,
        display_name: o.display_name || o.name || "Organization",
      }));
    },
  };

  /** -------- Animals -------- */
  const animals = {
    async list(query: AnimalsListQuery = {}) {
      const params = new URLSearchParams();
      if (query.q) params.set("q", query.q);
      if (query.limit != null) params.set("limit", String(query.limit));
      if (query.page != null) params.set("page", String(query.page));
      // Support both casings to match different server expectations
      if (query.includeArchived) {
        params.set("includeArchived", "true");
        params.set("include_archived", "1");
      }
      if (query.sort) params.set("sort", query.sort);

      const url =
        joinUrl(v1, "animals") + (Array.from(params.keys()).length ? `?${params.toString()}` : "");

      return fetchJson<any>(url, { method: "GET" }, withAuth());
    },

    async get(id: ID) {
      const url = joinUrl(v1, "animals", String(id));
      return fetchJson<any>(url, { method: "GET" }, withAuth());
    },

    async create(payload: CreateAnimalPayload) {
      const url = joinUrl(v1, "animals");
      return fetchJson<any>(
        url,
        { method: "POST", body: JSON.stringify(payload) },
        withAuth()
      );
    },

    async update(id: ID, payload: UpdateAnimalPayload) {
      const url = joinUrl(v1, "animals", String(id));
      return fetchJson<any>(
        url,
        { method: "PATCH", body: JSON.stringify(payload) },
        withAuth()
      );
    },

    async getOwners(id: ID) {
      const url = joinUrl(v1, "animals", String(id), "owners");
      return fetchJson<any>(url, { method: "GET" }, withAuth());
    },

    async putOwners(id: ID, owners: OwnerRow[]) {
      const url = joinUrl(v1, "animals", String(id), "owners");
      return fetchJson<any>(
        url,
        { method: "PUT", body: JSON.stringify(owners) },
        withAuth()
      );
    },

    // Editor-ready breed snapshot for an animal
    async getBreeds(id: ID) {
      const url = joinUrl(v1, "animals", String(id), "breeds");
      return fetchJson<any>(url, { method: "GET" }, withAuth());
    },

    // Stores a breed "snapshot" for an animal
    async putBreeds(id: ID, body: BreedSnapshotBody) {
      const url = joinUrl(v1, "animals", String(id), "breeds");
      return fetchJson<any>(
        url,
        { method: "PUT", body: JSON.stringify(body) },
        withAuth()
      );
    },
  };

  /** -------- Breeds -------- */
  const breeds = {
    /**
     * Search canonical breeds by species (DOG|CAT|HORSE) with optional q + registries.
     * Returns an array of items; backend may return {items: []} or [] — both handled.
     */
    async search(opts: { species: "DOG" | "CAT" | "HORSE"; q?: string; limit?: number; registries?: string[] }) {
      const params = new URLSearchParams();
      params.set("species", (opts.species || "DOG").toUpperCase());
      if (opts.q && opts.q.trim().length > 0) params.set("q", opts.q.trim());
      params.set("limit", String(Math.min(Math.max(opts.limit ?? 200, 1), 200)));
      if (opts.registries?.length) params.set("registries", opts.registries.join(","));

      const url = joinUrl(v1, "breeds", "search") + `?${params.toString()}`;

      try {
        const res = await fetch(url, {
          credentials: "include",
          headers: { ...withAuth() }, // avoid setting Content-Type on GET
          method: "GET",
        });
        const data: any = await res.json().catch(() => ({}));
        const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
        return items as any[];
      } catch {
        return [];
      }
    },

    /** List org-defined custom breeds for a species */
    async customList(opts: { species: "DOG" | "CAT" | "HORSE" }) {
      const params = new URLSearchParams();
      params.set("species", (opts.species || "DOG").toUpperCase());
      const url = joinUrl(v1, "breeds", "custom") + `?${params.toString()}`;

      try {
        const res = await fetch(url, {
          credentials: "include",
          headers: { ...withAuth() },
          method: "GET",
        });
        const data: any = await res.json().catch(() => ({}));
        const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
        return items as any[];
      } catch {
        return [];
      }
    },
  };

  /** -------- Org Settings (for registry filters, etc.) -------- */
  const orgSettings = {
    async get(): Promise<{ registryCodesEnabled?: string[] }> {
      const url = joinUrl(v1, "org", "settings");
      return fetchJson<{ registryCodesEnabled?: string[] }>(url, { method: "GET" }, withAuth());
    },
    async put(prefs: { registryCodesEnabled: string[] }) {
      const url = joinUrl(v1, "org", "settings");
      return fetchJson<any>(url, { method: "PUT", body: JSON.stringify(prefs) }, withAuth());
    },
  };

  return { animals, lookups, breeds, orgSettings };
}

// Export helpers in case you want them elsewhere
export const apiUtils = { fetchJson, getAuthHeaders, joinUrl };
