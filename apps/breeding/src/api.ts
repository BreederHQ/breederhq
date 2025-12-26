// apps/breeding/src/api.ts

// ⬇⬇ Adjust this import path to your monorepo alias/layout ⬇⬇
import { readTenantIdFast, resolveTenantId } from "../../../packages/ui/src/utils/tenant";
// If you have path aliases, e.g. "@ui/utils/tenant", switch to that import.

export type ApiOpts = {
  /** e.g. "/api/v1" (recommended with Vite proxy) or "http://localhost:6001/api/v1" */
  baseUrl?: string;
  /** If omitted, we’ll auto-resolve using the shared tenant util */
  tenantId?: number;
  /** optional custom fetch (node/polyfill) */
  fetch?: typeof fetch;
  /** when true, add XSRF header from cookie on non-GET */
  withCsrf?: boolean;
};

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  // escape cookie name for regex
  const esc = name.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
  const m = document.cookie.match(new RegExp(`(?:^|; )${esc}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

async function toError(res: Response) {
  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    try {
      payload = { error: await res.text() };
    } catch {
      // ignore
    }
  }
  const msg =
    payload?.error ||
    payload?.message ||
    (payload?.detail ? String(payload.detail) : null) ||
    `HTTP ${res.status}`;
  const err = new Error(msg);
  (err as any).status = res.status;
  (err as any).payload = payload;
  return err;
}

/** Backend include tokens for /breeding/plans[/:id]?include= */
export type PlanInclude =
  | "litter"
  | "reservations"
  | "events"
  | "tests"
  | "attempts"
  | "pregchecks"
  | "parties"
  | "attachments"
  | "parents"
  | "org"
  | "all";

/** Common list response shape used by several endpoints */
export type Paged<T> = { items: T[]; total: number; page: number; limit: number };

/** Params for GET /breeding/plans */
export type ListPlansParams = {
  status?: string;
  damId?: number;
  sireId?: number;
  q?: string;
  include?: PlanInclude | `${PlanInclude},${string}`;
  page?: number;
  limit?: number;
  archived?: "include" | "only" | "exclude";
  includeArchived?: boolean | "true" | "false";
  include_archived?: boolean | "true" | "false";
  withArchived?: boolean | "true" | "false";
  showArchived?: boolean | "true" | "false";
};

/** Availability prefs shape kept on Tenant.availabilityPrefs */
export type AvailabilityPrefs = {
  testing_risky_from_full_start: number;
  testing_risky_to_full_end: number;
  testing_unlikely_from_likely_start: number;
  testing_unlikely_to_likely_end: number;
  post_risky_from_full_start: number;
  post_risky_to_full_end: number;
  post_unlikely_from_likely_start: number;
  post_unlikely_from_likely_end: number; // legacy safe
  post_unlikely_to_likely_end: number;
};

/* Offspring Groups, types (new) */
export type OffspringGroupLite = {
  id: number;
  tenantId: number;
  planId: number | null;
  linkState: "linked" | "orphan" | string;
  species?: string | null;
  damId?: number | null;
  sireId?: number | null;
  expectedBirthOn?: string | null;
  actualBirthOn?: string | null;
  tentativeName?: string | null;
};

export type OffspringGroupLinkSuggestion = {
  planId: number;
  planName: string;
  matchScore: number;
  expectedBirthDate: string | null;
  damName: string | null;
  sireName: string | null;
};

/** Response for plan commit that ensures a group */
export type CommitPlanEnsureResp = {
  planId: number;
  group: OffspringGroupLite;
};

/* payload normalizers */
function normalizePlanDates(body: any) {
  if (!body || typeof body !== "object") return body;
  const b: any = { ...body };

  // legacy expectedDue -> expectedBirthDate
  if (b.expectedDue !== undefined && b.expectedBirthDate === undefined) {
    b.expectedBirthDate = b.expectedDue;
    delete b.expectedDue;
  }

  // legacy actual go-home -> placementStartDateActual
  if (b.actualGoHomeDate !== undefined && b.placementStartDateActual === undefined) {
    b.placementStartDateActual = b.actualGoHomeDate;
    delete b.actualGoHomeDate;
  }

  // legacy expectedPlacementCompletedDate -> expectedPlacementCompleted
  if (
    b.expectedPlacementCompletedDate !== undefined &&
    b.expectedPlacementCompleted === undefined
  ) {
    b.expectedPlacementCompleted = b.expectedPlacementCompletedDate;
    delete b.expectedPlacementCompletedDate;
  }

  return b;
}

function normalizeCycleDates(body: any) {
  if (!body || typeof body !== "object") return body;
  const b: any = { ...body };

  // legacy goHomeDate -> placementStartDate
  if (b.goHomeDate !== undefined && b.placementStartDate === undefined) {
    b.placementStartDate = b.goHomeDate;
    delete b.goHomeDate;
  }

  return b;
}

export function makeBreedingApi(opts: ApiOpts) {
  const fetchFn: typeof fetch =
    opts.fetch ? opts.fetch : (globalThis.fetch ? globalThis.fetch.bind(globalThis) : (undefined as any));

  const base = opts.baseUrl ?? "/api/v1";

  // Tenant resolution, fast sync else one time async
  let tenantId: number | undefined = typeof opts.tenantId === "number" ? opts.tenantId : readTenantIdFast();
  let tenantPromise: Promise<number> | null = tenantId ? null : resolveTenantId({ baseUrl: base });

  const ensureTenant = async () => {
    if (!tenantId && tenantPromise) {
      tenantId = await tenantPromise;
      tenantPromise = null;
    }
    if (!tenantId) {
      const e: any = new Error("Missing or invalid tenant context (X-Tenant-Id or session tenant)");
      e.status = 400;
      throw e;
    }
  };

  /** Build headers per request, attach CSRF for non GET when asked */
  const buildHeaders = (method: string, extra?: HeadersInit): HeadersInit => {
    const h: Record<string, string> = {
      "content-type": "application/json",
    };
    if (tenantId) h["x-tenant-id"] = String(tenantId);
    if (opts.withCsrf && method !== "GET" && typeof document !== "undefined") {
      const token = getCookie("XSRF-TOKEN");
      if (token) h["x-csrf-token"] = token;
    }
    return { ...h, ...(extra || {}) };
  };

  const get = async <T>(path: string, init?: RequestInit): Promise<T> => {
    await ensureTenant();
    const res = await fetchFn(joinUrl(base, path), {
      method: "GET",
      credentials: "include",
      headers: buildHeaders("GET", init?.headers),
      ...init,
    });
    if (!res.ok) throw await toError(res);
    return res.json() as Promise<T>;
  };

  const post = async <T>(path: string, body: any, init?: RequestInit): Promise<T> => {
    await ensureTenant();
    const res = await fetchFn(joinUrl(base, path), {
      method: "POST",
      credentials: "include",
      headers: buildHeaders("POST", init?.headers),
      body: body == null ? undefined : JSON.stringify(body),
      ...init,
    });
    if (!res.ok) throw await toError(res);
    return res.json() as Promise<T>;
  };

  const patch = async <T>(path: string, body: any, init?: RequestInit): Promise<T> => {
    await ensureTenant();
    const res = await fetchFn(joinUrl(base, path), {
      method: "PATCH",
      credentials: "include",
      headers: buildHeaders("PATCH", init?.headers),
      body: body == null ? undefined : JSON.stringify(body),
      ...init,
    });
    if (!res.ok) throw await toError(res);
    return res.json() as Promise<T>;
  };

  const put = async <T>(path: string, body: any, init?: RequestInit): Promise<T> => {
    await ensureTenant();
    const res = await fetchFn(joinUrl(base, path), {
      method: "PUT",
      credentials: "include",
      headers: buildHeaders("PUT", init?.headers),
      body: body == null ? undefined : JSON.stringify(body),
      ...init,
    });
    if (!res.ok) throw await toError(res);
    return res.json() as Promise<T>;
  };

  /* endpoints */
  return {
    /* Health and diag */
    healthz() {
      return get<{ ok: true }>("/healthz");
    },
    diag() {
      return get<{ ok: true; time: string; env: any }>("/__diag");
    },

    /* Tenant availability prefs */
    getTenantAvailability(tid: number) {
      return get<AvailabilityPrefs>(`/tenants/${tid}/availability`);
    },
    updateTenantAvailability(tid: number, body: Partial<AvailabilityPrefs>) {
      return patch<AvailabilityPrefs>(`/tenants/${tid}/availability`, body);
    },

    /* Breeding Plans */
    listPlans(params?: ListPlansParams) {
      const qs = new URLSearchParams();
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
        }
      }
      const path = `/breeding/plans${qs.toString() ? `?${qs}` : ""}`;
      return get<Paged<any>>(path);
    },

    getPlan(id: number, include?: PlanInclude | `${PlanInclude},${string}`) {
      const path = `/breeding/plans/${id}${include ? `?include=${encodeURIComponent(include)}` : ""}`;
      return get<any>(path);
    },

    createPlan(body: any) {
      return post<any>("/breeding/plans", normalizePlanDates(body));
    },

    updatePlan(id: number, body: any) {
      return patch<any>(`/breeding/plans/${id}`, normalizePlanDates(body));
    },

    commitPlan(id: number, body?: { codeHint?: string }) {
      return post<any>(`/breeding/plans/${id}/commit`, body ?? {});
    },

    /* Breeding Plans, commit with ensure group (new) */
    commitPlanEnsure(id: number, body: { actorId: string }) {
      return post<CommitPlanEnsureResp>(`/breeding/plans/${id}/commit`, body);
    },

    archivePlan(id: number) {
      return post<{ ok: true }>(`/breeding/plans/${id}/archive`, {});
    },

    restorePlan(id: number) {
      return post<{ ok: true }>(`/breeding/plans/${id}/restore`, {});
    },

    deletePlan(id: number) {
      return post<{ ok: true }>(`/breeding/plans/${id}/delete`, {});
    },

    /* Events / Tests / Attempts / Pregnancy Checks */
    listEvents(planId: number) {
      return get<any[]>(`/breeding/plans/${planId}/events`);
    },
    createEvent(planId: number, body: any) {
      return post<any>(`/breeding/plans/${planId}/events`, body);
    },
    createTest(planId: number, body: any) {
      return post<any>(`/breeding/plans/${planId}/tests`, body);
    },
    createAttempt(planId: number, body: any) {
      return post<any>(`/breeding/plans/${planId}/attempts`, body);
    },
    createPregCheck(planId: number, body: any) {
      return post<any>(`/breeding/plans/${planId}/pregnancy-checks`, body);
    },

    /* Litter */
    getLitter(planId: number) {
      return get<any>(`/breeding/plans/${planId}/litter`);
    },
    upsertLitter(planId: number, body: any) {
      return put<any>(`/breeding/plans/${planId}/litter`, body);
    },

    /* Reservations / Attachments / Shares / Parties */
    listReservations(planId: number) {
      return get<any[]>(`/breeding/plans/${planId}/reservations`);
    },
    createReservation(planId: number, body: any) {
      return post<any>(`/breeding/plans/${planId}/reservations`, body);
    },
    createAttachment(planId: number, body: any) {
      return post<any>(`/breeding/plans/${planId}/attachments`, body);
    },
    createShare(planId: number, body: any) {
      return post<any>(`/breeding/plans/${planId}/shares`, body);
    },
    createParty(planId: number, body: any) {
      return post<any>(`/breeding/plans/${planId}/parties`, body);
    },

    /* Reproductive Cycles */
    listCycles(params?: {
      femaleId?: number;
      from?: string; // ISO
      to?: string;   // ISO
      page?: number;
      limit?: number;
      archived?: "include" | "only" | "exclude";
    }) {
      const qs = new URLSearchParams();
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
        }
      }
      const path = `/breeding/cycles${qs.toString() ? `?${qs}` : ""}`;
      return get<Paged<any>>(path);
    },

    createCycle(body: any) {
      return post<any>("/breeding/cycles", normalizeCycleDates(body));
    },

    updateCycle(id: number, body: any) {
      return patch<any>(`/breeding/cycles/${id}`, normalizeCycleDates(body));
    },

    /* Offspring Groups linkage helpers (new) */
    offspringGroups: {
      link(groupId: number, body: { planId: number; actorId: string }) {
        return post<OffspringGroupLite>(`/offspring/groups/${groupId}/link`, body);
      },
      unlink(groupId: number, body: { actorId: string }) {
        return post<OffspringGroupLite>(`/offspring/groups/${groupId}/unlink`, body);
      },
      getLinkSuggestions(groupId: number, params?: { limit?: number }) {
        const qs = new URLSearchParams();
        if (params?.limit != null) qs.set("limit", String(params.limit));
        const query = qs.toString() ? `?${qs}` : "";
        return get<OffspringGroupLinkSuggestion[]>(
          `/offspring/groups/${groupId}/link-suggestions${query}`
        );
      },
    },
  };
}

export default makeBreedingApi;
