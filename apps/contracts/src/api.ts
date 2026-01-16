// apps/contracts/src/api.ts
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

/* ───────── Types ───────── */

export interface ContractTemplate {
  id: number;
  slug: string;
  name: string;
  description?: string;
  type: "SYSTEM" | "CUSTOM";
  category: string;
  bodyHtml?: string;
  mergeFields?: string[];
  version: number;
  tenantId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: number;
  title: string;
  status: "draft" | "sent" | "viewed" | "signed" | "declined" | "voided" | "expired";
  templateId?: number;
  offspringId?: number;
  animalId?: number;
  expiresAt?: string;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
  parties: ContractParty[];
  template?: ContractTemplate;
}

export interface ContractParty {
  id: number;
  role: string;
  name: string;
  email: string;
  signer: boolean;
  status: "pending" | "viewed" | "signed" | "declined";
  signedAt?: string;
  order: number;
}

export interface SignatureEvent {
  id: number;
  status: string;
  at: string;
  ipAddress?: string;
  userAgent?: string;
  message?: string;
  partyName?: string;
}

export interface MergeField {
  key: string;
  label: string;
  namespace: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface CreateContractInput {
  templateId?: number;
  title: string;
  offspringId?: number;
  animalId?: number;
  waitlistEntryId?: number;
  invoiceId?: number;
  parties: Array<{
    role: string;
    partyId?: number;
    email: string;
    name: string;
    signer: boolean;
    order?: number;
  }>;
  expiresInDays?: number;
  reminderDays?: number[];
  customContent?: string;
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

  /* ───────── Contracts namespace ───────── */

  const contracts = {
    templates: {
      async list(): Promise<{ items: ContractTemplate[]; total: number }> {
        const res = await reqWithExtra<{ items?: ContractTemplate[]; total?: number }>(
          "/contract-templates"
        );
        return {
          items: res.items || [],
          total: res.total ?? 0,
        };
      },
      async get(id: number): Promise<ContractTemplate> {
        return reqWithExtra<ContractTemplate>(`/contract-templates/${id}`);
      },
      async create(input: Partial<ContractTemplate>): Promise<ContractTemplate> {
        return reqWithExtra<ContractTemplate>("/contract-templates", {
          method: "POST",
          json: input,
        });
      },
      async update(id: number, input: Partial<ContractTemplate>): Promise<ContractTemplate> {
        return reqWithExtra<ContractTemplate>(`/contract-templates/${id}`, {
          method: "PATCH",
          json: input,
        });
      },
      async delete(id: number): Promise<void> {
        await reqWithExtra<void>(`/contract-templates/${id}`, {
          method: "DELETE",
        });
      },
      async preview(id: number): Promise<{ html: string; missingFields: string[]; sampleData: any }> {
        return reqWithExtra<{ html: string; missingFields: string[]; sampleData: any }>(
          `/contract-templates/${id}/preview`,
          { method: "POST" }
        );
      },
      async getMergeFields(): Promise<MergeField[]> {
        return reqWithExtra<MergeField[]>("/contract-templates/merge-fields");
      },
    },

    contracts: {
      async list(params?: {
        status?: string;
        partyId?: number;
        offspringId?: number;
        animalId?: number;
        limit?: number;
        offset?: number;
      }): Promise<{ items: Contract[]; total: number }> {
        const qs = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== "") {
              qs.set(k, String(v));
            }
          });
        }
        const query = qs.toString();
        const path = `/contracts${query ? `?${query}` : ""}`;
        const res = await reqWithExtra<{ items?: Contract[]; total?: number }>(path);
        return {
          items: res.items || [],
          total: res.total ?? 0,
        };
      },
      async get(id: number): Promise<Contract> {
        return reqWithExtra<Contract>(`/contracts/${id}`);
      },
      async create(input: CreateContractInput): Promise<Contract> {
        return reqWithExtra<Contract>("/contracts", {
          method: "POST",
          json: input,
        });
      },
      async update(id: number, input: Partial<Contract>): Promise<Contract> {
        return reqWithExtra<Contract>(`/contracts/${id}`, {
          method: "PATCH",
          json: input,
        });
      },
      async send(id: number, message?: string): Promise<{ success: boolean; message: string }> {
        return reqWithExtra<{ success: boolean; message: string }>(`/contracts/${id}/send`, {
          method: "POST",
          json: { message },
        });
      },
      async void(id: number, reason?: string): Promise<{ success: boolean; message: string }> {
        return reqWithExtra<{ success: boolean; message: string }>(`/contracts/${id}/void`, {
          method: "POST",
          json: { reason },
        });
      },
      async remind(id: number): Promise<{ success: boolean; message: string }> {
        return reqWithExtra<{ success: boolean; message: string }>(`/contracts/${id}/remind`, {
          method: "POST",
        });
      },
      async getEvents(id: number): Promise<{ items: SignatureEvent[] }> {
        return reqWithExtra<{ items: SignatureEvent[] }>(`/contracts/${id}/events`);
      },
      getPdfUrl(id: number): string {
        return `${baseUrl}/contracts/${id}/pdf`;
      },
    },

    parties: {
      async search(query: string, opts?: { limit?: number }): Promise<any[]> {
        const qs = new URLSearchParams();
        qs.set("q", query);
        qs.set("dir", "asc");
        if (opts?.limit) qs.set("limit", String(opts.limit));
        const res = await reqWithExtra<{ items?: any[]; total?: number } | any[]>(
          `/parties?${qs.toString()}`
        );
        return Array.isArray(res) ? res : (res?.items || []);
      },
    },

    animals: {
      async search(query: string, opts?: { limit?: number }): Promise<any[]> {
        const qs = new URLSearchParams();
        qs.set("q", query);
        if (opts?.limit) qs.set("limit", String(opts.limit));
        const res = await reqWithExtra<{ items?: any[]; total?: number } | any[]>(
          `/animals?${qs.toString()}`
        );
        return Array.isArray(res) ? res : (res?.items || []);
      },
    },

    offspring: {
      async search(query: string, opts?: { limit?: number }): Promise<any[]> {
        const qs = new URLSearchParams();
        qs.set("q", query);
        if (opts?.limit) qs.set("limit", String(opts.limit));
        const res = await reqWithExtra<{ items?: any[]; nextCursor?: string } | any[]>(
          `/offspring?${qs.toString()}`
        );
        return Array.isArray(res) ? res : (res?.items || []);
      },
    },
  };

  return { contracts };
}

export type ContractsApi = ReturnType<typeof makeApi>;
