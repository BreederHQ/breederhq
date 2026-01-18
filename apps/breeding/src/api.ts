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
/** COI calculation result */
export type COIResult = {
  coefficient: number;
  generationsAnalyzed: number;
  commonAncestors: Array<{
    id: number;
    name: string;
    pathCount: number;
    contribution: number;
  }>;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
};

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

/* Breeding Programs types */
export type BreedingProgramLite = {
  id: number;
  slug: string;
  name: string;
  species: string;
  breedText?: string | null;
  listed: boolean;
  _count?: { breedingPlans: number };
};

export type BreedingProgram = BreedingProgramLite & {
  tenantId: number;
  description?: string | null;
  acceptInquiries: boolean;
  openWaitlist: boolean;
  acceptReservations: boolean;
  pricingTiers?: any;
  whatsIncluded?: string | null;
  typicalWaitTime?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
};

export type BreedingProgramCreateInput = {
  name: string;
  species: string;
  breedText?: string | null;
  description?: string | null;
  listed?: boolean;
  acceptInquiries?: boolean;
  openWaitlist?: boolean;
  acceptReservations?: boolean;
  pricingTiers?: any;
  whatsIncluded?: string | null;
  typicalWaitTime?: string | null;
};

/* Foaling milestones and outcome types (horse-specific) */
export type MarePostFoalingCondition =
  | "EXCELLENT"
  | "GOOD"
  | "FAIR"
  | "POOR"
  | "VETERINARY_CARE_REQUIRED";

export type FoalingMilestoneType =
  | "VET_PREGNANCY_CHECK_15D"
  | "VET_ULTRASOUND_45D"
  | "VET_ULTRASOUND_90D"
  | "BEGIN_MONITORING_300D"
  | "PREPARE_FOALING_AREA_320D"
  | "DAILY_CHECKS_330D"
  | "DUE_DATE_340D"
  | "OVERDUE_VET_CALL_350D";

export type FoalingMilestone = {
  id: number;
  tenantId: number;
  breedingPlanId: number;
  type: FoalingMilestoneType;
  scheduledDate: string;
  completedDate: string | null;
  isCompleted: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FoalingOutcomeInput = {
  hadComplications: boolean;
  complicationDetails?: string | null;
  veterinarianCalled: boolean;
  veterinarianName?: string | null;
  veterinarianNotes?: string | null;
  placentaPassed?: boolean | null;
  placentaPassedMinutes?: number | null;
  mareCondition?: MarePostFoalingCondition | null;
  postFoalingHeatDate?: string | null;
  postFoalingHeatNotes?: string | null;
  readyForRebreeding?: boolean;
  rebredDate?: string | null;
};

export type FoalingOutcome = FoalingOutcomeInput & {
  id: number;
  tenantId: number;
  breedingPlanId: number;
  createdAt: string;
  updatedAt: string;
};

export type FoalingTimeline = {
  breedingPlanId: number;
  dam: { id: number; name: string } | null;
  sire: { id: number; name: string } | null;
  expectedBirthDate: string | null;
  actualBreedDate: string | null;
  actualBirthDate: string | null;
  daysUntilFoaling: number | null;
  status: "PLANNING" | "EXPECTING" | "MONITORING" | "IMMINENT" | "OVERDUE" | "FOALED";
  milestones: FoalingMilestone[];
  offspring: any[];
  outcome: FoalingOutcome | null;
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

/** Individual offspring record (Offspring table) */
export type OffspringIndividual = {
  id: number;
  groupId: number;
  tenantId: number;
  name: string | null;
  sex: "MALE" | "FEMALE" | null;
  collarColorId: number | null;
  collarColorName: string | null;
  collarColorHex: string | null;
  lifeState: string | null;
  placementState: string | null;
  keeperIntent: string | null;
  financialState: string | null;
  paperworkState: string | null;
  marketplaceListed: boolean;
  marketplacePriceCents: number | null;
  headlineOverride: string | null;
  photos: string[];
  coatDescription: string | null;
  birthWeight: string | null;
  currentWeight: string | null;
  microchipId: string | null;
  notes: string | null;
  buyerPartyId: number | null;
  buyerParty?: { id: number; type: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
};

/** Full offspring group detail including linked offspring */
export type OffspringGroupDetail = OffspringGroupLite & {
  name?: string | null;
  plan?: {
    id: number;
    code?: string | null;
    name?: string | null;
    species?: string | null;
    breedText?: string | null;
    dam?: { id: number; name: string } | null;
    sire?: { id: number; name: string } | null;
  } | null;
  offspring: OffspringIndividual[];
  animals: Array<{
    id: number;
    name: string | null;
    sex: string | null;
    status: string | null;
    birthDate: string | null;
    species: string | null;
    breed: string | null;
    collarColorId: number | null;
    collarColorName: string | null;
    collarColorHex: string | null;
    buyerPartyId: number | null;
  }>;
  waitlist: Array<{
    id: number;
    priority: number | null;
    clientParty?: { id: number; type: string; name: string } | null;
  }>;
  buyers: Array<{
    id: number;
    buyerPartyId: number;
    buyerParty?: { id: number; type: string; name: string } | null;
    createdAt: string;
  }>;
};

export type OffspringGroupLinkSuggestion = {
  planId: number;
  planName: string;
  matchScore: number;
  expectedBirthDate: string | null;
  damName: string | null;
  sireName: string | null;
};

/* Placement Scheduling Policy types (Phase 6) */
export type PlacementSchedulingPolicy = {
  enabled: boolean;
  timezone: string | null;
  startAt: string | null;
  windowMinutes: number | null;
  gapMinutes: number | null;
  graceMinutes: number | null;
  allowOverlap: boolean;
};

export type PlacementSchedulingPolicyInput = Partial<PlacementSchedulingPolicy>;

export type PlacementStatusBuyer = {
  buyerId: number;
  buyerName: string;
  placementRank: number | null;
  bookingStatus: "booked" | "pending" | "missed" | null;
  bookedAt: string | null;
  eventType: string | null;
};

export type PlacementStatus = {
  offspringGroupId: number;
  policyEnabled: boolean;
  rankedBuyersCount: number;
  bookedCount: number;
  pendingCount: number;
  missedCount: number;
  buyers: PlacementStatusBuyer[];
};

/* Scheduling types for calendar integration */
export type SchedulingAvailabilityBlock = {
  id: number;
  templateId: number | null;
  templateName: string | null;
  eventType: string | null;
  startAt: string;
  endAt: string;
  timezone: string;
  status: string;
  location: string | null;
  slotCount: number;
  bookedSlotCount: number;
};

export type SchedulingBooking = {
  id: number;
  eventId: string;
  eventType: string | null;
  partyId: number;
  partyName: string;
  slotId: number;
  startsAt: string;
  endsAt: string;
  location: string | null;
  mode: "in_person" | "virtual" | null;
  status: string;
  bookedAt: string;
};

export type CreateBlockInput = {
  templateId?: number;
  startAt: string;
  endAt: string;
  timezone: string;
  slotIntervalMinutes: number;
  slotDurationMinutes: number;
  capacity: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  mode: "IN_PERSON" | "VIRTUAL";
  location?: string;
  nextStepsText?: string;
};

export type CreateBlockResponse = {
  block: {
    id: number;
    startAt: string;
    endAt: string;
    timezone: string;
    status: string;
    location: string | null;
  };
  slotCount: number;
};

export type SchedulingSlot = {
  id: number;
  startsAt: string;
  endsAt: string;
  capacity: number;
  bookedCount: number;
  status: string;
  mode: "in_person" | "virtual" | null;
  location: string | null;
};

export type BlockDetailResponse = SchedulingAvailabilityBlock & {
  slotIntervalMinutes: number | null;
  slotDurationMinutes: number | null;
  mode: "in_person" | "virtual" | null;
  bufferBeforeMinutes: number | null;
  bufferAfterMinutes: number | null;
  nextStepsText: string | null;
  canCancel: boolean | null;
  canReschedule: boolean | null;
};

/** Cycle analysis result for ovulation pattern integration */
export type CycleAnalysisResult = {
  animalId: number;
  species: string;
  cycleHistory: Array<{
    id: number;
    cycleStart: string;
    ovulation: string | null;
    ovulationMethod: string | null;
    offsetDays: number | null;
    variance: number | null;
    confidence: "HIGH" | "MEDIUM" | "LOW";
    source: "HORMONE_TEST" | "BIRTH_CALCULATED" | "ESTIMATED";
    breedingPlanId: number | null;
    birthDate: string | null;
    notes: string | null;
  }>;
  ovulationPattern: {
    sampleSize: number;
    confirmedCycles: number;
    avgOffsetDays: number | null;
    stdDeviation: number | null;
    minOffset: number | null;
    maxOffset: number | null;
    classification: "Early Ovulator" | "Average" | "Late Ovulator" | "Insufficient Data";
    confidence: "HIGH" | "MEDIUM" | "LOW";
    guidance: string;
  };
  nextCycleProjection: {
    projectedHeatStart: string | null;
    projectedOvulationWindow: {
      earliest: string;
      latest: string;
      mostLikely: string;
    } | null;
    recommendedTestingStart: string | null;
    confidence: "HIGH" | "MEDIUM" | "LOW";
  } | null;
  cycleLengthDays: number;
  cycleLengthSource: "OVERRIDE" | "HISTORY" | "BIOLOGY";
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
  const buildHeaders = (method: string, extra?: HeadersInit, hasBody = true): HeadersInit => {
    const h: Record<string, string> = {};
    // Only set content-type for requests that have a body (not GET or bodyless DELETE)
    if (hasBody && method !== "GET") {
      h["content-type"] = "application/json";
    }
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

  const del = async <T>(path: string, init?: RequestInit): Promise<T> => {
    await ensureTenant();
    const res = await fetchFn(joinUrl(base, path), {
      method: "DELETE",
      credentials: "include",
      headers: buildHeaders("DELETE", init?.headers, false), // No body for DELETE
      ...init,
    });
    if (!res.ok) throw await toError(res);
    // DELETE often returns 204 with no body
    if (res.status === 204) return {} as T;
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

    /* Breeding Plans, uncommit (revert COMMITTED back to PLANNING) */
    uncommitPlan(id: number, body: { actorId: string }) {
      return post<{ ok: true; blockers?: string[] }>(`/breeding/plans/${id}/uncommit`, body);
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

    /* Lineage / COI check */
    lineage: {
      /** Calculate prospective COI for a hypothetical breeding */
      getProspectiveCOI(damId: number, sireId: number, generations: number = 10) {
        return get<COIResult>(`/lineage/coi?damId=${damId}&sireId=${sireId}&generations=${generations}`);
      },
    },

    /* Offspring Groups linkage helpers (new) */
    offspringGroups: {
      /** Get offspring group detail with all linked offspring, animals, waitlist, buyers */
      get(groupId: number) {
        return get<OffspringGroupDetail>(`/offspring/${groupId}`);
      },
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
      /* Phase 6: Placement Scheduling */
      getPlacementPolicy(groupId: number) {
        return get<PlacementSchedulingPolicy>(`/offspring/${groupId}/placement-scheduling-policy`);
      },
      updatePlacementPolicy(groupId: number, body: PlacementSchedulingPolicyInput) {
        return put<PlacementSchedulingPolicy>(`/offspring/${groupId}/placement-scheduling-policy`, body);
      },
      getPlacementStatus(groupId: number) {
        return get<PlacementStatus>(`/offspring/${groupId}/placement-status`);
      },
      updateBuyerPlacementRank(groupId: number, buyerId: number, placementRank: number | null) {
        return patch<{ ok: true }>(`/offspring/${groupId}/buyers/${buyerId}/placement-rank`, { placementRank });
      },
    },

    /* Finance namespace for invoices, payments, expenses */
    finance: {
      invoices: {
        list(params?: any) {
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
          return get<{ data: any[]; meta?: any }>(path).then(res => ({
            items: res.data || [],
            total: res.meta?.total || 0,
          }));
        },
        get(id: number) {
          return get<any>(`/invoices/${id}`);
        },
        create(input: any, idempotencyKey: string) {
          return post<any>("/invoices", input, {
            headers: { "Idempotency-Key": idempotencyKey },
          } as any);
        },
        update(id: number, input: any) {
          return patch<any>(`/invoices/${id}`, input);
        },
        void(id: number) {
          return patch<any>(`/invoices/${id}/void`, {});
        },
      },
      payments: {
        list(params?: any) {
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
          return get<{ data: any[]; meta?: any }>(path).then(res => ({
            items: res.data || [],
            total: res.meta?.total || 0,
          }));
        },
        get(id: number) {
          return get<any>(`/payments/${id}`);
        },
        create(input: any, idempotencyKey: string) {
          return post<any>("/payments", input, {
            headers: { "Idempotency-Key": idempotencyKey },
          } as any);
        },
      },
      expenses: {
        list(params?: any) {
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
          return get<{ data: any[]; meta?: any }>(path).then(res => ({
            items: res.data || [],
            total: res.meta?.total || 0,
          }));
        },
        get(id: number) {
          return get<any>(`/expenses/${id}`);
        },
        create(input: any) {
          return post<any>("/expenses", input);
        },
        update(id: number, input: any) {
          return patch<any>(`/expenses/${id}`, input);
        },
        delete(id: number) {
          return del<any>(`/expenses/${id}`).then(() => ({ success: true }));
        },
      },
      parties: {
        async search(query: string, opts?: { limit?: number; typeFilter?: string }) {
          const qs = new URLSearchParams();
          qs.set("q", query);
          qs.set("dir", "asc");
          if (opts?.limit) qs.set("limit", String(opts.limit));
          if (opts?.typeFilter) qs.set("type", opts.typeFilter);
          const res = await get<{ items?: any[]; total?: number } | any[]>(`/parties?${qs.toString()}`);
          return Array.isArray(res) ? res : (res?.items || []);
        },
      },
      contacts: {
        create(input: { first_name?: string; last_name?: string; display_name?: string; email?: string; phone_e164?: string }) {
          return post<any>("/contacts", input);
        },
      },
      organizations: {
        create(input: { name: string; website?: string | null }) {
          return post<any>("/organizations", input);
        },
      },
    },

    /* Tags namespace for breeding plan tags */
    tags: {
      list(params: { module: string; limit?: number }) {
        const qs = new URLSearchParams();
        qs.set("module", params.module);
        if (params.limit) qs.set("limit", String(params.limit));
        const query = qs.toString();
        return get<{ items: any[] }>(`/tags?${query}`).then(res => res);
      },
      create(input: { name: string; module: string; color?: string | null }) {
        return post<any>("/tags", input);
      },
      assign(tagId: number, target: { breedingPlanId: number }) {
        return post<void>(`/tags/${tagId}/assign`, target);
      },
      unassign(tagId: number, target: { breedingPlanId: number }) {
        return post<void>(`/tags/${tagId}/unassign`, target);
      },
      listForBreedingPlan(planId: number) {
        return get<any[]>(`/breeding/plans/${planId}/tags`).then(res => {
          if (Array.isArray(res)) return res;
          if (res && typeof res === "object" && "items" in (res as any)) {
            return (res as any).items;
          }
          return [];
        });
      },
    },

    /* Breeding Programs namespace for marketplace programs */
    breedingPrograms: {
      list(params?: { species?: string; listed?: boolean; q?: string; page?: number; limit?: number }) {
        const qs = new URLSearchParams();
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
          }
        }
        const path = `/breeding/programs${qs.toString() ? `?${qs}` : ""}`;
        return get<Paged<BreedingProgramLite>>(path);
      },
      get(id: number) {
        return get<BreedingProgram>(`/breeding/programs/${id}`);
      },
      create(input: BreedingProgramCreateInput) {
        return post<BreedingProgram>("/breeding/programs", input);
      },
      update(id: number, input: Partial<BreedingProgramCreateInput>) {
        return put<BreedingProgram>(`/breeding/programs/${id}`, input);
      },
      delete(id: number) {
        return del<void>(`/breeding/programs/${id}`);
      },
    },

    /* Scheduling namespace for calendar integration */
    scheduling: {
      listBlocks(params?: { from?: string; to?: string }) {
        const qs = new URLSearchParams();
        if (params?.from) qs.set("from", params.from);
        if (params?.to) qs.set("to", params.to);
        const query = qs.toString();
        const path = `/scheduling/blocks${query ? `?${query}` : ""}`;
        return get<{ blocks: SchedulingAvailabilityBlock[] }>(path).then(res => res.blocks || []);
      },
      listBookings(params?: { from?: string; to?: string }) {
        const qs = new URLSearchParams();
        if (params?.from) qs.set("from", params.from);
        if (params?.to) qs.set("to", params.to);
        const query = qs.toString();
        const path = `/scheduling/bookings${query ? `?${query}` : ""}`;
        return get<{ bookings: SchedulingBooking[] }>(path).then(res => res.bookings || []);
      },
      createBlock(input: CreateBlockInput) {
        return post<CreateBlockResponse>("/scheduling/blocks", input);
      },
      getBlock(blockId: number) {
        return get<BlockDetailResponse>(`/scheduling/blocks/${blockId}`);
      },
      getBlockSlots(blockId: number) {
        return get<{ slots: SchedulingSlot[] }>(`/scheduling/blocks/${blockId}/slots`).then(res => res.slots || []);
      },
      getBlockBookings(blockId: number) {
        return get<{ bookings: SchedulingBooking[] }>(`/scheduling/blocks/${blockId}/bookings`).then(res => res.bookings || []);
      },
    },

    /* Foaling milestones namespace for horse-specific vet checkpoints */
    foaling: {
      /** Get foaling timeline with milestones for a breeding plan */
      getTimeline(planId: number) {
        return get<FoalingTimeline>(`/breeding/plans/${planId}/foaling-timeline`);
      },
      /** Create foaling milestones for a breeding plan (requires actualBreedDate) */
      createMilestones(planId: number) {
        return post<FoalingMilestone[]>(`/breeding/plans/${planId}/milestones`, {});
      },
      /** Delete all milestones for a breeding plan */
      deleteMilestones(planId: number) {
        return del<{ deletedCount: number }>(`/breeding/plans/${planId}/milestones`);
      },
      /** Recalculate milestone dates from actual breed date */
      recalculateMilestones(planId: number) {
        return post<FoalingMilestone[]>(`/breeding/plans/${planId}/milestones/recalculate`, {});
      },
      /** Mark a milestone as completed */
      completeMilestone(milestoneId: number) {
        return patch<FoalingMilestone>(`/breeding/milestones/${milestoneId}/complete`, {});
      },
      /** Mark a milestone as incomplete (undo completion) */
      uncompleteMilestone(milestoneId: number) {
        return patch<FoalingMilestone>(`/breeding/milestones/${milestoneId}/uncomplete`, {});
      },
      /** Add foaling outcome record */
      addOutcome(planId: number, body: FoalingOutcomeInput) {
        return post<FoalingOutcome>(`/breeding/plans/${planId}/foaling-outcome`, body);
      },
    },

    /* Animals namespace for cross-module data access */
    animals: {
      /** Get cycle analysis for an animal (dam) - includes ovulation patterns and predictions */
      getCycleAnalysis(animalId: number) {
        return get<CycleAnalysisResult>(`/animals/${animalId}/cycle-analysis`);
      },
    },
  };
}

export default makeBreedingApi;
