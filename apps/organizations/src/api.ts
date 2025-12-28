// apps/organizations/src/api.ts

type HeadersMap = Record<string, string>;

type SessionShape = {
  tenantId?: number;
  orgId?: number;
};

type ListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

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

/** ---- Context: prefer runtime → localStorage; else fetch /session --------- */
let ctxPromise: Promise<SessionShape> | null = null;

function ctxFromClient(): SessionShape {
  const w: any = window as any;
  const rTid = Number(w?.__BHQ_TENANT_ID__);
  const lsTid = Number(localStorage.getItem("BHQ_TENANT_ID") || "NaN");
  const tenantId =
    (Number.isFinite(rTid) && rTid > 0 && rTid) ||
    (Number.isFinite(lsTid) && lsTid > 0 && lsTid) ||
    undefined;

  const rOrg = Number(w?.__BHQ_ORG_ID__);
  const lsOrg = Number(localStorage.getItem("BHQ_ORG_ID") || "NaN");
  const orgId =
    (Number.isFinite(rOrg) && rOrg > 0 && rOrg) ||
    (Number.isFinite(lsOrg) && lsOrg > 0 && lsOrg) ||
    undefined;

  return { tenantId, orgId };
}

async function fetchSession(root: string): Promise<SessionShape> {
  try {
    const res = await fetch(`${root}/session`, { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    const tenantId = Number(data?.tenant?.id) || Number(data?.tenantId) || NaN;
    const orgId = Number(data?.org?.id) || Number(data?.organization?.id) || NaN;

    const out: SessionShape = {
      tenantId: Number.isFinite(tenantId) && tenantId > 0 ? tenantId : undefined,
      orgId: Number.isFinite(orgId) && orgId > 0 ? orgId : undefined,
    };

    if (out.tenantId) {
      try { localStorage.setItem("BHQ_TENANT_ID", String(out.tenantId)); } catch {}
    }
    if (out.orgId) {
      try { localStorage.setItem("BHQ_ORG_ID", String(out.orgId)); } catch {}
    }
    return out;
  } catch {
    return {};
  }
}

async function getCtx(root: string): Promise<SessionShape> {
  const local = ctxFromClient();
  if (local.tenantId) return local;
  if (!ctxPromise) ctxPromise = fetchSession(root);
  const remote = await ctxPromise;
  return {
    tenantId: local.tenantId ?? remote.tenantId,
    orgId: local.orgId ?? remote.orgId,
  };
}

/** ---- Helpers ------------------------------------------------------------- */
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

function headersFor(ctx: SessionShape, init?: RequestInit): Headers {
  const h = new Headers(init?.headers as any);
  if (!h.has("accept")) h.set("accept", "application/json");
  if (ctx.tenantId) h.set("x-tenant-id", String(ctx.tenantId));
  if (ctx.orgId) h.set("x-org-id", String(ctx.orgId));

  const m = String(init?.method || "GET").toUpperCase();
  if (m !== "GET" && m !== "HEAD" && m !== "OPTIONS") {
    if (!h.has("content-type")) h.set("content-type", "application/json");
    if (!h.has("x-csrf-token")) {
      const xsrf = readCookie("XSRF-TOKEN");
      if (xsrf) h.set("x-csrf-token", xsrf);
    }
  }
  return h;
}

/** ---- Factory ------------------------------------------------------------- */
export function makeApi(base?: string) {
  const root = normBase(base);

  return {
    organizations: {
      /** GET /organizations?q=&includeArchived=&page=&limit= */
      async list(params: { q?: string; includeArchived?: boolean; page?: number; limit?: number } = {}) {
        const ctx = await getCtx(root);
        const sp = new URLSearchParams();
        if (params.q) sp.set("q", params.q);
        if (params.includeArchived) sp.set("includeArchived", "true");
        if (params.page != null) sp.set("page", String(params.page));
        if (params.limit != null) sp.set("limit", String(params.limit));
        const url = `${root}/organizations${sp.toString() ? `?${sp.toString()}` : ""}`;
        const res = await fetch(url, { credentials: "include", headers: headersFor(ctx) });
        return parse<ListResponse<any>>(res);
      },

      /** GET /organizations/:id */
      async get(id: number | string) {
        const ctx = await getCtx(root);
        const res = await fetch(`${root}/organizations/${encodeURIComponent(String(id))}`, {
          credentials: "include",
          headers: headersFor(ctx),
        });
        return parse<any>(res);
      },

      /** POST /organizations */
      async create(body: any) {
        const ctx = await getCtx(root);
        const res = await fetch(`${root}/organizations`, {
          method: "POST",
          credentials: "include",
          headers: headersFor(ctx, { method: "POST" }),
          body: JSON.stringify(body),
        });
        return parse<any>(res);
      },

      /** PATCH /organizations/:id */
      async update(id: number | string, patch: any) {
        const ctx = await getCtx(root);
        const res = await fetch(`${root}/organizations/${encodeURIComponent(String(id))}`, {
          method: "PATCH",
          credentials: "include",
          headers: headersFor(ctx, { method: "PATCH" }),
          body: JSON.stringify(patch),
        });
        return parse<any>(res);
      },

      /** POST /organizations/:id/archive */
      async archive(id: number | string, reason?: string) {
        const ctx = await getCtx(root);
        const res = await fetch(`${root}/organizations/${encodeURIComponent(String(id))}/archive`, {
          method: "POST",
          credentials: "include",
          headers: headersFor(ctx, { method: "POST" }),
          body: JSON.stringify({ reason: reason ?? null }),
        });
        return parse<any>(res);
      },

      /** POST /organizations/:id/restore */
      async restore(id: number | string) {
        const ctx = await getCtx(root);
        const res = await fetch(`${root}/organizations/${encodeURIComponent(String(id))}/restore`, {
          method: "POST",
          credentials: "include",
          headers: headersFor(ctx, { method: "POST" }),
        });
        return parse<any>(res);
      },

      /** DELETE /organizations/:id */
      async remove(id: number | string) {
        const ctx = await getCtx(root);
        const res = await fetch(`${root}/organizations/${encodeURIComponent(String(id))}`, {
          method: "DELETE",
          credentials: "include",
          headers: headersFor(ctx, { method: "DELETE" }),
        });
        return parse<any>(res);
      },
    },

    /* ──── Finance namespace for invoices, payments, expenses ──── */
    finance: {
      invoices: {
        async list(params?: any) {
          const ctx = await getCtx(root);
          const qs = new URLSearchParams();
          if (params) {
            Object.entries(params).forEach(([k, v]) => {
              if (v !== undefined && v !== null && v !== "") {
                qs.set(k, String(v));
              }
            });
          }
          const query = qs.toString();
          const url = `${root}/invoices${query ? `?${query}` : ""}`;
          const res = await fetch(url, {
            method: "GET",
            credentials: "include",
            headers: headersFor(ctx, { method: "GET" }),
          });
          const data = await parse<{ data: any[]; meta?: any }>(res);
          return {
            items: data.data || [],
            total: data.meta?.total || 0,
          };
        },
        async get(id: number) {
          const ctx = await getCtx(root);
          const res = await fetch(`${root}/invoices/${id}`, {
            method: "GET",
            credentials: "include",
            headers: headersFor(ctx, { method: "GET" }),
          });
          return parse<any>(res);
        },
        async create(input: any, idempotencyKey: string) {
          const ctx = await getCtx(root);
          const h = headersFor(ctx, { method: "POST" });
          h["Idempotency-Key"] = idempotencyKey;
          const res = await fetch(`${root}/invoices`, {
            method: "POST",
            credentials: "include",
            headers: h,
            body: JSON.stringify(input),
          });
          return parse<any>(res);
        },
        async update(id: number, input: any) {
          const ctx = await getCtx(root);
          const res = await fetch(`${root}/invoices/${id}`, {
            method: "PATCH",
            credentials: "include",
            headers: headersFor(ctx, { method: "PATCH" }),
            body: JSON.stringify(input),
          });
          return parse<any>(res);
        },
        async void(id: number) {
          const ctx = await getCtx(root);
          const res = await fetch(`${root}/invoices/${id}/void`, {
            method: "PATCH",
            credentials: "include",
            headers: headersFor(ctx, { method: "PATCH" }),
            body: JSON.stringify({}),
          });
          return parse<any>(res);
        },
      },
      payments: {
        async list(params?: any) {
          const ctx = await getCtx(root);
          const qs = new URLSearchParams();
          if (params) {
            Object.entries(params).forEach(([k, v]) => {
              if (v !== undefined && v !== null && v !== "") {
                qs.set(k, String(v));
              }
            });
          }
          const query = qs.toString();
          const url = `${root}/payments${query ? `?${query}` : ""}`;
          const res = await fetch(url, {
            method: "GET",
            credentials: "include",
            headers: headersFor(ctx, { method: "GET" }),
          });
          const data = await parse<{ data: any[]; meta?: any }>(res);
          return {
            items: data.data || [],
            total: data.meta?.total || 0,
          };
        },
        async get(id: number) {
          const ctx = await getCtx(root);
          const res = await fetch(`${root}/payments/${id}`, {
            method: "GET",
            credentials: "include",
            headers: headersFor(ctx, { method: "GET" }),
          });
          return parse<any>(res);
        },
        async create(input: any, idempotencyKey: string) {
          const ctx = await getCtx(root);
          const h = headersFor(ctx, { method: "POST" });
          h["Idempotency-Key"] = idempotencyKey;
          const res = await fetch(`${root}/payments`, {
            method: "POST",
            credentials: "include",
            headers: h,
            body: JSON.stringify(input),
          });
          return parse<any>(res);
        },
      },
      expenses: {
        async list(params?: any) {
          const ctx = await getCtx(root);
          const qs = new URLSearchParams();
          if (params) {
            Object.entries(params).forEach(([k, v]) => {
              if (v !== undefined && v !== null && v !== "") {
                qs.set(k, String(v));
              }
            });
          }
          const query = qs.toString();
          const url = `${root}/expenses${query ? `?${query}` : ""}`;
          const res = await fetch(url, {
            method: "GET",
            credentials: "include",
            headers: headersFor(ctx, { method: "GET" }),
          });
          const data = await parse<{ data: any[]; meta?: any }>(res);
          return {
            items: data.data || [],
            total: data.meta?.total || 0,
          };
        },
        async get(id: number) {
          const ctx = await getCtx(root);
          const res = await fetch(`${root}/expenses/${id}`, {
            method: "GET",
            credentials: "include",
            headers: headersFor(ctx, { method: "GET" }),
          });
          return parse<any>(res);
        },
        async create(input: any) {
          const ctx = await getCtx(root);
          const res = await fetch(`${root}/expenses`, {
            method: "POST",
            credentials: "include",
            headers: headersFor(ctx, { method: "POST" }),
            body: JSON.stringify(input),
          });
          return parse<any>(res);
        },
        async update(id: number, input: any) {
          const ctx = await getCtx(root);
          const res = await fetch(`${root}/expenses/${id}`, {
            method: "PATCH",
            credentials: "include",
            headers: headersFor(ctx, { method: "PATCH" }),
            body: JSON.stringify(input),
          });
          return parse<any>(res);
        },
        async delete(id: number) {
          const ctx = await getCtx(root);
          const res = await fetch(`${root}/expenses/${id}`, {
            method: "DELETE",
            credentials: "include",
            headers: headersFor(ctx, { method: "DELETE" }),
          });
          await parse<any>(res);
          return { success: true };
        },
      },
    },
  };
}
