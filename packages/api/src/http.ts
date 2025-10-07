// packages/api/src/http.ts
// Centralized fetch that always forwards cookies and X-Org-Id

export type Json = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

function getApiBase(): string {
  // Vite proxy keeps /api/* at same origin in dev; still allow override
  const w = (window as any) || {};
  const base = w.__BHQ_API_BASE__ || "";
  return base; // e.g. "" or "http://localhost:6170"
}

function getOrgId(): string | null {
  const w = (window as any) || {};
  const fromWin = w.__BHQ_ORG_ID__;
  if (fromWin != null && String(fromWin).trim() !== "") return String(fromWin);
  try {
    const ls = localStorage.getItem("BHQ_ORG_ID");
    if (ls && ls.trim() !== "") return ls;
  } catch { }
  return null;
}

export async function apiFetch<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const base = getApiBase();
  const url = path.startsWith("http") ? path : `${base}${path}`;

  const headers = new Headers(init.headers || {});
  // Default JSON unless caller overrides
  if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  // Inject org header if we have one
  const orgId = getOrgId();
  if (Number(orgId) > 0 && !headers.has("X-Org-Id")) {
    headers.set("X-Org-Id", String(Number(orgId)));
  }

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "include",     // << send bhq_s cookie
    redirect: init.redirect ?? "follow",
  });

  // Handle common auth flows
  if (res.status === 401) {
    // Session missing/expired — bounce to login
    try { localStorage.removeItem("BHQ_ORG_ID"); } catch { }
    (window as any).__BHQ_ORG_ID__ = undefined;
    if (!location.pathname.startsWith("/login")) {
      location.assign("/login");
    }
    throw new Error("unauthorized");
  }

  // Best-effort JSON parse
  const text = await res.text();
  const data = (() => { try { return text ? JSON.parse(text) : null; } catch { return text as any; } })();

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    const err = new Error(String(msg)) as any;
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}
