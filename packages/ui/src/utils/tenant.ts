// packages/ui/src/utils/tenant.ts

let _tenantCache: number | null = null;
let _pending: Promise<number> | null = null;

export function readTenantIdFast(): number | undefined {
  // 1) cookie (supports JWT or plain base64 JSON)
  try {
    const raw = document.cookie.match(/(?:^|; )bhq_s=([^;]*)/)?.[1];
    if (raw) {
      const payloadB64 = raw.includes(".") ? raw.split(".")[1] : raw; // JWT payload or raw
      // Browser-only base64 decode (atob is always available in browser)
      const json = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
      const obj = JSON.parse(json);
      const t = Number(obj?.tenantId ?? obj?.orgId ?? obj?.tenantID ?? obj?.tenant_id);
      if (Number.isInteger(t) && t > 0) return t;
    }
  } catch { /* ignore */ }

  // 2) platform global (both shapes)
  try {
    const a = Number((window as any).__bhq?.tenantId);
    if (Number.isInteger(a) && a > 0) return a;
  } catch { /* ignore */ }
  try {
    const b = Number((window as any).__BHQ_TENANT_ID__);
    if (Number.isInteger(b) && b > 0) return b;
  } catch { /* ignore */ }

  return undefined;
}

type ResolveOpts = {
  /** Prefix for API, defaults to "/api/v1" */
  baseUrl?: string;
  /** Custom fetch (e.g., SSR / polyfill) */
  fetchFn?: typeof fetch;
  /** If true, bypass cache (rarely needed) */
  noCache?: boolean;
};

export async function resolveTenantId(opts: ResolveOpts = {}): Promise<number> {
  const baseUrl = opts.baseUrl ?? "/api/v1";
  const fetchFn = opts.fetchFn ?? fetch;

  // Fast path (cookie/window)
  const fast = readTenantIdFast();
  if (fast) {
    _tenantCache = fast;
    return fast;
  }

  // Cached result
  if (!opts.noCache && _tenantCache) return _tenantCache;

  // De-dupe concurrent callers
  if (!opts.noCache && _pending) return _pending;

  const run = (async () => {
    // Try public endpoints actually mounted by your server (see server.ts)
    const candidates = [
      `${baseUrl}/session`,     // sessionRoutes (public subtree)
      `${baseUrl}/account`,     // accountRoutes (public subtree)
      `${baseUrl}/tenants`,     // tenantRoutes (public subtree)
    ];

    let payload: any = null;

    for (const url of candidates) {
      try {
        const r = await fetchFn(url, { credentials: "include" });
        if (!r.ok) continue;                  // ignore 4xx/5xx and try next
        payload = r.status === 204 ? {} : await r.json().catch(() => ({}));
        if (payload && typeof payload === "object") break;
      } catch {
        /* try next */
      }
    }

    if (!payload) {
      // Special-case unauthenticated (common dev gotcha)
      throw new Error("Unable to resolve tenant (no public session/account endpoint responded). Are you logged in?");
    }

    const toNum = (v: any) => {
      const n = Number(v);
      return Number.isInteger(n) && n > 0 ? n : undefined;
    };

    // Direct fields
    const direct =
      toNum(payload.tenantId) ??
      toNum(payload.defaultTenantId) ??
      toNum(payload?.user?.tenantId) ??
      toNum(payload?.session?.tenantId);
    if (direct) return direct;

    // Arrays of memberships/tenants
    const arrays =
      payload?.memberships ??
      payload?.tenantMemberships ??
      payload?.user?.memberships ??
      payload?.user?.tenantMemberships ??
      payload?.tenants ??
      payload?.data?.memberships ??
      payload?.data?.tenants;

    if (Array.isArray(arrays) && arrays.length) {
      const scored = [...arrays].sort((a: any, b: any) => {
        const score = (m: any) =>
          (m?.isDefault || m?.default ? 3 : 0) +
          (m?.isPrimary ? 2 : 0) +
          (String(m?.role || "").toUpperCase() === "OWNER" ? 1 : 0);
        return score(b) - score(a);
      });
      for (const m of scored) {
        const t = toNum(m?.tenantId ?? m?.id);
        if (t) return t;
      }
    }

    // Final fallback: any plausible numeric key
    for (const k of ["id", "tenant_id", "tenantID", "defaultTenant"]) {
      const t = toNum((payload as any)[k]);
      if (t) return t;
    }

    throw new Error("No tenant memberships found for this user");
  })();

  if (!opts.noCache) _pending = run;

  try {
    const t = await run;
    _tenantCache = t;
    return t;
  } finally {
    _pending = null;
  }
}
