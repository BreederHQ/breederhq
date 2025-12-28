// apps/finance/src/api.ts
import { readTenantIdFast, resolveTenantId } from "@bhq/ui/utils/tenant";

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

/* ───────── makeApi ───────── */

export function makeApi(baseArg?: string) {
  const baseUrl = normBase(baseArg);

  type ReqOpts = {
    method?: string;
    json?: any;
    body?: any;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  };

  async function reqWithExtra<T>(
    endpoint: string,
    opts?: ReqOpts
  ): Promise<T> {
    const tenantId = await ensureTenantId(baseUrl);
    const url = `${baseUrl}${endpoint}`;
    const { json, body, ...rest } = opts || {};
    const finalBody = json ? JSON.stringify(json) : body;
    const headers = buildHeaders(tenantId, { ...rest, body: finalBody });
    const res = await fetch(url, {
      ...rest,
      headers,
      body: finalBody,
      credentials: "include",
    });
    return parse<T>(res);
  }

  /* ───────── Finance namespace for invoices, payments, expenses ───────── */

  const finance = {
    async summary() {
      return reqWithExtra<any>("/finance/summary");
    },
    invoices: {
      async list(params?: any) {
        const qs = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== "") {
              qs.set(k, String(v));
            }
          });
        }
        const query = qs.toString();
        const path = `/invoices${query ? `?${query}` : ""}`;
        const res = await reqWithExtra<{ data: any[]; meta?: any }>(path);
        return {
          items: res.data || [],
          total: res.meta?.total || 0,
        };
      },
      async get(id: number) {
        return reqWithExtra<any>(`/invoices/${id}`);
      },
      async create(input: any, idempotencyKey: string) {
        return reqWithExtra<any>("/invoices", {
          method: "POST",
          json: input,
          headers: { "Idempotency-Key": idempotencyKey } as any,
        });
      },
      async update(id: number, input: any) {
        return reqWithExtra<any>(`/invoices/${id}`, {
          method: "PATCH",
          json: input,
        });
      },
      async void(id: number) {
        return reqWithExtra<any>(`/invoices/${id}/void`, {
          method: "PATCH",
          json: {},
        });
      },
      attachments: {
        async list(invoiceId: number) {
          return reqWithExtra<any[]>(`/invoices/${invoiceId}/attachments`);
        },
        async create(invoiceId: number, body: any) {
          return reqWithExtra<any>(`/invoices/${invoiceId}/attachments`, {
            method: "POST",
            json: body,
          });
        },
        async delete(invoiceId: number, attachmentId: number) {
          return reqWithExtra<any>(`/invoices/${invoiceId}/attachments/${attachmentId}`, {
            method: "DELETE",
          });
        },
      },
    },
    payments: {
      async list(params?: any) {
        const qs = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== "") {
              qs.set(k, String(v));
            }
          });
        }
        const query = qs.toString();
        const path = `/payments${query ? `?${query}` : ""}`;
        const res = await reqWithExtra<{ data: any[]; meta?: any }>(path);
        return {
          items: res.data || [],
          total: res.meta?.total || 0,
        };
      },
      async get(id: number) {
        return reqWithExtra<any>(`/payments/${id}`);
      },
      async create(input: any, idempotencyKey: string) {
        return reqWithExtra<any>("/payments", {
          method: "POST",
          json: input,
          headers: { "Idempotency-Key": idempotencyKey } as any,
        });
      },
      async export(filters: any) {
        const res = await reqWithExtra<{ items: any[]; total: number }>("/finance/payments/export", {
          method: "POST",
          json: filters,
        });
        return res;
      },
      attachments: {
        async list(paymentId: number) {
          return reqWithExtra<any[]>(`/payments/${paymentId}/attachments`);
        },
        async create(paymentId: number, body: any) {
          return reqWithExtra<any>(`/payments/${paymentId}/attachments`, {
            method: "POST",
            json: body,
          });
        },
        async delete(paymentId: number, attachmentId: number) {
          return reqWithExtra<any>(`/payments/${paymentId}/attachments/${attachmentId}`, {
            method: "DELETE",
          });
        },
      },
    },
    expenses: {
      async list(params?: any) {
        const qs = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== "") {
              qs.set(k, String(v));
            }
          });
        }
        const query = qs.toString();
        const path = `/expenses${query ? `?${query}` : ""}`;
        const res = await reqWithExtra<{ data: any[]; meta?: any }>(path);
        return {
          items: res.data || [],
          total: res.meta?.total || 0,
        };
      },
      async get(id: number) {
        return reqWithExtra<any>(`/expenses/${id}`);
      },
      async create(input: any) {
        return reqWithExtra<any>("/expenses", {
          method: "POST",
          json: input,
        });
      },
      async update(id: number, input: any) {
        return reqWithExtra<any>(`/expenses/${id}`, {
          method: "PATCH",
          json: input,
        });
      },
      async delete(id: number) {
        await reqWithExtra<any>(`/expenses/${id}`, { method: "DELETE" });
        return { success: true };
      },
      attachments: {
        async list(expenseId: number) {
          return reqWithExtra<any[]>(`/expenses/${expenseId}/attachments`);
        },
        async create(expenseId: number, body: any) {
          return reqWithExtra<any>(`/expenses/${expenseId}/attachments`, {
            method: "POST",
            json: body,
          });
        },
        async delete(expenseId: number, attachmentId: number) {
          return reqWithExtra<any>(`/expenses/${expenseId}/attachments/${attachmentId}`, {
            method: "DELETE",
          });
        },
      },
    },
    parties: {
      async search(query: string, opts?: { limit?: number; typeFilter?: string }) {
        const qs = new URLSearchParams();
        qs.set("q", query);
        if (opts?.limit) qs.set("limit", String(opts.limit));
        if (opts?.typeFilter) qs.set("type", opts.typeFilter);
        return reqWithExtra<any[]>(`/parties/search?${qs.toString()}`);
      },
    },
    animals: {
      async search(query: string, opts?: { limit?: number }) {
        const qs = new URLSearchParams();
        qs.set("q", query);
        if (opts?.limit) qs.set("limit", String(opts.limit));
        return reqWithExtra<any[]>(`/animals/search?${qs.toString()}`);
      },
    },
    offspringGroups: {
      async search(query: string, opts?: { limit?: number }) {
        const qs = new URLSearchParams();
        qs.set("q", query);
        if (opts?.limit) qs.set("limit", String(opts.limit));
        return reqWithExtra<any[]>(`/offspring-groups/search?${qs.toString()}`);
      },
    },
    breedingPlans: {
      async search(query: string, opts?: { limit?: number }) {
        const qs = new URLSearchParams();
        qs.set("q", query);
        if (opts?.limit) qs.set("limit", String(opts.limit));
        return reqWithExtra<any[]>(`/breeding-plans/search?${qs.toString()}`);
      },
    },
  };

  return { finance };
}

export type FinanceApi = ReturnType<typeof makeApi>;
