// apps/breeding/src/api.ts
export type ApiOpts = {
  /** e.g. "/api/v1" (recommended with Vite proxy) or "http://localhost:6001/api/v1" */
  baseUrl?: string;
  /** required for tenant-scoped subtree */
  tenantId: number;
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
  const err = new Error(payload?.error || `HTTP ${res.status}`);
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
  post_unlikely_to_likely_end: number;
};

/* ───────────────────────── payload normalizers ─────────────────────────
   Accept older caller keys and rewrite them to the new placement schema
   before sending to the server. This keeps UI code flexible and safe.   */

function normalizePlanDates(body: any) {
  if (!body || typeof body !== "object") return body;

  const b: any = { ...body };

  // expected → placement
  if (b.expectedPlacementStart !== undefined && b.expectedPlacementStart === undefined) {
    b.expectedPlacementStart = b.expectedPlacementStart;
    delete b.expectedPlacementStart;
  }
  if (b.expectedPlacementCompleted !== undefined && b.expectedPlacementCompleted === undefined) {
    b.expectedPlacementCompleted = b.expectedPlacementCompleted;
    delete b.expectedPlacementCompleted;
  }

  // legacy expectedDue → expectedBirthDate
  if (b.expectedDue !== undefined && b.expectedBirthDate === undefined) {
    b.expectedBirthDate = b.expectedDue;
    delete b.expectedDue;
  }

  // locked → placement
  if (b.lockedPlacementStartDate !== undefined && b.lockedPlacementStartDate === undefined) {
    b.lockedPlacementStartDate = b.lockedPlacementStartDate;
    delete b.lockedPlacementStartDate;
  }

  // actuals → placement
  if (b.actualGoHomeDate !== undefined && b.placementStartDateActual === undefined) {
    b.placementStartDateActual = b.actualGoHomeDate;
    delete b.actualGoHomeDate;
  }
  if (b.placementStartDateActual !== undefined && b.placementStartDateActual === undefined) {
    b.placementStartDateActual = b.placementStartDateActual;
    delete b.placementStartDateActual;
  }
  if (b.placementCompletedDateActual !== undefined && b.placementCompletedDateActual === undefined) {
    b.placementCompletedDateActual = b.placementCompletedDateActual;
    delete b.placementCompletedDateActual;
  }
  if (b.placementStartDateActual !== undefined && b.placementStartDateActual === undefined) {
    b.placementStartDateActual = b.placementStartDateActual;
    delete b.placementStartDateActual;
  }
  if (b.placementCompletedDateActual !== undefined && b.placementCompletedDateActual === undefined) {
    b.placementCompletedDateActual = b.placementCompletedDateActual;
    delete b.placementCompletedDateActual;
  }

  // very old aliases to keep callers safe
  if (b.birthDateActual !== undefined && b.birthDateActual === undefined) {
    b.birthDateActual = b.birthDateActual;
    delete b.birthDateActual;
  }
  if (b.expectedBirthDate !== undefined && b.expectedBirthDate === undefined) {
    b.expectedBirthDate = b.expectedBirthDate;
    delete b.expectedBirthDate;
  }

  return b;
}

function normalizeCycleDates(body: any) {
  if (!body || typeof body !== "object") return body;
  const b: any = { ...body };
  // legacy acceptor: goHomeDate → placementStartDate
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
  const tenantHeader = { "x-tenant-id": String(opts.tenantId) };

  /** Build headers per request, attaching CSRF for non-GET when asked */
  const buildHeaders = (method: string, extra?: HeadersInit): HeadersInit => {
    const h: Record<string, string> = {
      "content-type": "application/json",
      ...tenantHeader,
    };
    if (opts.withCsrf && method !== "GET" && typeof document !== "undefined") {
      const token = getCookie("XSRF-TOKEN");
      if (token) h["x-csrf-token"] = token;
    }
    return { ...h, ...(extra || {}) };
  };

  const get = async <T>(path: string, init?: RequestInit): Promise<T> => {
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

  /* ───────── endpoints ───────── */

  return {
    /* Health and diag */
    healthz() {
      return get<{ ok: true }>("/healthz");
    },
    diag() {
      // server-rooted
      return get<{ ok: true; time: string; env: any }>("/__diag");
    },

    /* Tenant availability prefs */
    getTenantAvailability(tenantId: number) {
      return get<AvailabilityPrefs>(`/tenants/${tenantId}/availability`);
    },
    updateTenantAvailability(tenantId: number, body: Partial<AvailabilityPrefs>) {
      return patch<AvailabilityPrefs>(`/tenants/${tenantId}/availability`, body);
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

    archivePlan(id: number) {
      return post<{ ok: true }>(`/breeding/plans/${id}/archive`, {});
    },

    restorePlan(id: number) {
      return post<{ ok: true }>(`/breeding/plans/${id}/restore`, {});
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
      to?: string; // ISO
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
  };
}
