// apps/platform/src/lib/api.ts

export type ListParams = { q?: string; page?: number; limit?: number; includeArchived?: boolean };
export type HeadersMap = Record<string, string>;
export type Json = Record<string, any>;

function normalizeBase(base: string): string {
  let b = String(base || "").trim();
  if (!b && typeof location !== "undefined") b = location.origin;
  b = b.replace(/\/+$/g, "");
  b = b.replace(/\/api\/v1$/i, "");
  return `${b}/api/v1`;
}

function qs(params: Record<string, string | number | boolean | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.append(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function getAuthHeaders(): HeadersMap {
  const w = window as any;
  const orgId =
    Number(w.__BHQ_ORG_ID__) ||
    (() => { try { const r = localStorage.getItem("BHQ_ORG_ID"); return r ? Number(r) : NaN; } catch { return NaN; } })() ||
    Number((import.meta as any)?.env?.VITE_DEV_ORG_ID || "");
  const h: HeadersMap = {};
  if (Number.isFinite(orgId) && orgId > 0) h["X-Org-Id"] = String(orgId);
  return h;
}

async function request(url: string, init: RequestInit = {}) {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) {
    // surface backend error body for easier debugging
    const text = await res.text().catch(() => "");
    const err: any = new Error(text || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

export function makeApi(base?: string, headers?: () => HeadersMap) {
  const root = normalizeBase(base || "");
  const h = () => ({ ...(headers ? headers() : {}), ...getAuthHeaders() });

  return {
    contacts: {
      list: (p: ListParams = {}) => request(`${root}/contacts` + qs(p), { method: "GET", headers: h() }),
      get:  (id: string | number) => request(`${root}/contacts/${encodeURIComponent(String(id))}`, { method: "GET", headers: h() }),
      update: (id: string | number, body: Json) =>
        request(`${root}/contacts/${encodeURIComponent(String(id))}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...h() },
          body: JSON.stringify(body),
        }),
      create: (body: Json) =>
        request(`${root}/contacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...h() },
          body: JSON.stringify(body),
        }),
    },
  };
}

// Singleton for convenience
const globalBase =
  (window as any).__BHQ_API_BASE__ ||
  (import.meta as any)?.env?.VITE_API_URL ||
  localStorage.getItem("BHQ_API_URL") ||
  "";

export const api = makeApi(String(globalBase), getAuthHeaders);
