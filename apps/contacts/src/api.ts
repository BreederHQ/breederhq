// apps/contacts/src/api.ts
// Unified API client for Contacts + Tags with same-origin proxy support and org header.

export type Json = Record<string, any>;
export type HeadersMap = Record<string, string>;

export type ListParams = {
  q?: string;
  page?: number;
  limit?: number;
  includeArchived?: boolean;
};

export type ContactsApi = {
  list: (p?: ListParams) => Promise<any>;
  get: (id: string | number) => Promise<any>;
  create: (body: Json) => Promise<any>;
  update: (id: string | number, body: Json) => Promise<any>;
  archive: (id: string | number, reason?: string) => Promise<any>;
  restore: (id: string | number) => Promise<any>;

  // affiliations
  getAffiliations: (id: string | number) => Promise<any>;
  setAffiliations: (id: string | number, organizationIds: Array<number | string>) => Promise<any>;
};

export type TagsApi = {
  list: (type?: "contact") => Promise<
    Array<{ id: number | string; name: string; type: string; color?: string | null }>
  >;
};

export type OrgsApi = {
  list: (p?: { q?: string; page?: number; limit?: number }) => Promise<any>;
};

export type Api = {
  contacts: ContactsApi;
  tags: TagsApi;
  organizations: OrgsApi;
};

/** Normalize any input like:
 *  - http://localhost:6001            -> http://localhost:6001/api/v1
 *  - http://localhost:6001/           -> http://localhost:6001/api/v1
 *  - http://localhost:6001/api/v1     -> http://localhost:6001/api/v1
 *  - http://localhost:6001/api/v1/    -> http://localhost:6001/api/v1
 *  - "" (empty)                       -> <current origin>/api/v1
 */
function normalizeBase(base: string): string {
  let b = String(base || "").trim();
  if (!b) {
    // prefer same-origin when empty (Vite proxy handles /api/* → API)
    if (typeof location !== "undefined") b = location.origin;
  }
  b = b.replace(/\/+$/g, "");
  b = b.replace(/\/api\/v1$/i, "");
  return `${b}/api/v1`;
}

function qs(params: Record<string, string | number | boolean | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "boolean") sp.set(k, v ? "true" : "false");
    else sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

async function request<T>(
  url: string,
  opts: RequestInit & { expectJson?: boolean } = {}
): Promise<T> {
  const { expectJson = true, headers, ...rest } = opts;

  const hdr = new Headers(headers as any);

  // Don’t send bearer auth to /api/v1/* (cookie session handles it)
  if (/\/api\/v1(\/|$)/i.test(url)) hdr.delete("Authorization");

  const res = await fetch(url, {
    ...rest,
    headers: hdr,
    credentials: "include",
  });

  const text = await res.text();
  const parseJson = () => {
    try { return text ? JSON.parse(text) : undefined; } catch { return undefined; }
  };
  const payload = expectJson ? parseJson() : undefined;

  if (!res.ok) {
    const err: any = new Error(
      (payload as any)?.message ||
      (payload as any)?.error ||
      `${res.status} ${res.statusText} (${url})`
    );
    err.status = res.status;
    err.code = (payload as any)?.code;
    err.data = payload;
    throw err;
  }
  return (expectJson ? (payload as T) : (undefined as unknown as T));
}

/**
 * Build the API with a base path and an optional auth header factory (used for non-v1/S2S).
 * Pass empty string to use same-origin (recommended with Vite proxy).
 */
export function makeApi(base: string, makeAuth?: () => HeadersMap): Api {
  const root = normalizeBase(base);

  // header composer: ensures X-Org-Id is present
  const h = (extra?: HeadersMap): HeadersMap => {
    const out: HeadersMap = { ...(extra ?? {}) };

    // include any caller-provided headers (e.g., S2S)
    const a = (makeAuth?.() ?? {}) as HeadersMap;
    for (const [k, v] of Object.entries(a)) out[k] = v;

    // 1) runtime global (from session → App sets this)
    try {
      const gid = (window as any).__BHQ_ORG_ID__;
      if (gid != null && out["X-Org-Id"] == null && Number(gid) > 0) {
        out["X-Org-Id"] = String(Number(gid));
      }
    } catch { }

    // 2) localStorage (backup only; don’t invent a value)
    try {
      if (out["X-Org-Id"] == null) {
        const ls = localStorage.getItem("BHQ_ORG_ID");
        if (ls && ls !== "NaN" && Number(ls) > 0) {
          out["X-Org-Id"] = String(Number(ls));
        }
      }
    } catch { }

    // No env/dev fallback. If still missing for multi-org users,
    // the API will return org_required and the UI can prompt to choose.

    return out;
  };

  const jsonHeaders = (extra?: HeadersMap): HeadersMap => ({
    "Content-Type": "application/json",
    ...h(extra),
  });

  return {
    contacts: {
      list: (p: ListParams = {}) => {
        const url =
          `${root}/contacts` +
          qs({
            q: p.q,
            page: p.page,
            limit: p.limit,
            includeArchived: !!p.includeArchived,
          });
        return request(url, { method: "GET", headers: h() });
      },

      get: (id: string | number) => {
        const url = `${root}/contacts/${encodeURIComponent(String(id))}`;
        return request(url, { method: "GET", headers: h() });
      },

      create: (body: Json) => {
        const url = `${root}/contacts`;
        return request(url, {
          method: "POST",
          headers: jsonHeaders(),
          body: JSON.stringify(body),
        });
      },

      update: (id: string | number, body: Json) => {
        const url = `${root}/contacts/${encodeURIComponent(String(id))}`;
        return request(url, {
          method: "PATCH",
          headers: jsonHeaders(),
          body: JSON.stringify(body),
        });
      },

      archive: (id: string | number, reason?: string) => {
        const url = `${root}/contacts/${encodeURIComponent(String(id))}`;
        const hasBody = typeof reason === "string" && reason.length > 0;
        return request(url, {
          method: "DELETE",
          headers: hasBody ? jsonHeaders() : h(),
          body: hasBody ? JSON.stringify({ reason }) : undefined,
        });
      },

      restore: (id: string | number) => {
        const url = `${root}/contacts/${encodeURIComponent(String(id))}/restore`;
        return request(url, { method: "POST", headers: h() });
      },

      // ───────── affiliations ──────────────────────────────────────────────
      getAffiliations: (id: string | number) => {
        const url = `${root}/contacts/${encodeURIComponent(String(id))}/affiliations`;
        return request(url, { method: "GET", headers: h() });
      },

      setAffiliations: (id: string | number, organizationIds: Array<number | string>) => {
        const url = `${root}/contacts/${encodeURIComponent(String(id))}/affiliations`;
        return request(url, {
          method: "PUT",
          headers: jsonHeaders(),
          body: JSON.stringify({ organizationIds: organizationIds.map(Number) }),
        });
      },
    },

    tags: {
      list: (type: "contact" = "contact") => {
        const url = `${root}/tags` + qs({ type });
        return request(url, { method: "GET", headers: h() });
      },
    },

    organizations: {
      list: (p: { q?: string; page?: number; limit?: number } = {}) => {
        const url = `${root}/organizations` + qs(p);
        return request(url, { method: "GET", headers: h() });
      },
    },
  };
}
