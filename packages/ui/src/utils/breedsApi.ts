import { readTenantIdFast, resolveTenantId } from "../utils/tenant";

function normBase(base?: string): string {
  let b = String(base || (typeof window !== "undefined" ? window.location.origin : "http://localhost:6170")).trim();
  b = b.replace(/\/+$/g, "").replace(/\/api\/v1$/i, "");
  return `${b}/api/v1`;
}

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[2]) : "";
}

let __tenantResolved: number | null = null;
let __tenantResolving: Promise<number> | null = null;

async function ensureTenantId(baseUrl: string): Promise<number> {
  const fast = readTenantIdFast();
  if (fast) { __tenantResolved = fast; return fast; }

  if (__tenantResolved && __tenantResolved > 0) return __tenantResolved;

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

function spFrom(obj: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export type Species = "DOG" | "CAT" | "HORSE" | "GOAT" | "SHEEP" | "RABBIT";

export function makeBreedsApi(base?: string) {
  const root = normBase(base);

  const req = async <T>(path: string, init?: RequestInit) => {
    const tenantId = await ensureTenantId(root);
    const url = path.startsWith("http") ? path : `${root}${path}`;
    const headers = buildHeaders(tenantId, init);
    const res = await fetch(url, { ...init, headers, credentials: "include" });
    return parse<T>(res);
  };

  return {
    async search(opts: { species: Species; q?: string; limit?: number }) {
      const params = spFrom({
        species: (opts.species || "DOG").toUpperCase(),
        q: (opts.q || "").trim() || undefined,
        limit: opts.limit != null ? Math.min(Math.max(opts.limit, 1), 200) : undefined,
      });
      return req<{ items: any[] }>(`/breeds/search${params}`);
    },
  };
}
