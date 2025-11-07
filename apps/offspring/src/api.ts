// apps/offspring/src/api.ts
import { readTenantIdFast, resolveTenantId } from "@bhq/ui/utils/tenant";

/* ───────────────────────── types (unchanged + additions for Breeding) ───────────────────────── */
export type Sex = "FEMALE" | "MALE";
export type Species = "DOG" | "CAT" | "HORSE";

/* ===== Offspring (Litters) ===== */

export type OffspringPlanLite = {
  id: number;
  code: string | null;
  name: string;
  species: Species;
  breedText: string | null;
  dam: { id: number; name: string } | null;
  sire: { id: number; name: string } | null;
  expectedPlacementStart: string | null;
  expectedPlacementCompleted: string | null;
  placementStartDateActual: string | null;
  placementCompletedDateActual: string | null;
};

export type OffspringRow = {
  id: number;
  tenantId: number;
  identifier: string | null;
  createdAt: string;
  updatedAt: string;
  counts: {
    animals: number;
    waitlist: number;
    born: number | null;
    live: number | null;
    stillborn?: number | null;
    male?: number | null;
    female?: number | null;
  };
  dates: {
    birthedStartAt: string | null;
    birthedEndAt: string | null;
    weanedAt: string | null;
    placementStartAt: string | null;
    placementCompletedAt: string | null;
  };
  published?: boolean;
  plan: OffspringPlanLite | null;
};

export type OffspringListResp = { items: OffspringRow[]; nextCursor: string | null };

export type AnimalLite = {
  id: number;
  name: string;
  sex: Sex;
  status: string;
  birthDate: string | null;
  species?: Species | null;
  breed?: string | null;
  litterId?: number | null;
  groupName?: string | null;
  buyerName?: string | null;
  listedPriceCents?: number | null;
  salePriceCents?: number | null;
  soldAt?: string | null;
  updatedAt?: string | null;
};

export type TagLite = { id: number; name: string; color?: string | null };

export type WaitlistEntry = {
  id: number;
  tenantId: number;
  status: string;
  priority: number | null;

  depositRequiredCents: number | null;
  depositPaidCents: number | null;
  balanceDueCents: number | null;
  depositPaidAt: string | null;

  contactId: number | null;
  organizationId: number | null;
  litterId: number | null;
  planId: number | null;

  speciesPref: Species | null;
  breedPrefs: any | null;
  sirePrefId: number | null;
  damPrefId: number | null;

  contact?: { id: number; display_name: string; email?: string | null; phoneE164?: string | null } | null;
  organization?: { id: number; name: string; email?: string | null; phone?: string | null } | null;
  sirePref?: { id: number; name: string } | null;
  damPref?: { id: number; name: string } | null;

  TagAssignment?: Array<{ id: number; tagId: number; tag: TagLite }>;

  skipCount?: number | null;
  lastSkipAt?: string | null;

  breedPrefText?: string | null;
  lastActivityAt?: string | null;
};

export type OffspringDetail = {
  id: number;
  tenantId: number;
  identifier: string | null;
  notes: string | null;
  published?: boolean;
  coverImageUrl?: string | null;
  themeName?: string | null;

  birthedStartAt: string | null;
  birthedEndAt: string | null;
  weanedAt: string | null;
  placementStartAt: string | null;
  placementCompletedAt: string | null;

  counts?: {
    born: number | null;
    live: number | null;
    stillborn: number | null;
    male: number | null;
    female: number | null;
  };

  plan: {
    id: number;
    code: string | null;
    name: string;
    species: Species;
    breedText: string | null;
    dam: { id: number; name: string } | null;
    sire: { id: number; name: string } | null;
  } | null;

  Animals: AnimalLite[];
  Waitlist: WaitlistEntry[];
  Attachment: Array<any>;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateOffspringBody = {
  planId: number;
  identifier?: string | null;
  notes?: string | null;
  published?: boolean;
  dates?: {
    birthedStartAt?: string | null;
    birthedEndAt?: string | null;
    weanedAt?: string | null;
    placementStartAt?: string | null;
    placementCompletedAt?: string | null;
  };
};

export type PatchOffspringBody = Partial<{
  identifier: string | null;
  notes: string | null;
  published: boolean;
  publishedMeta: { coverImageUrl?: string | null; themeName?: string | null };
  dates: {
    weanedAt?: string | null;
    placementStartAt?: string | null;
    placementCompletedAt?: string | null;
    birthedStartAt?: string | null;
    birthedEndAt?: string | null;
  };
  counts: {
    countBorn?: number | null;
    countLive?: number | null;
    countStillborn?: number | null;
    countMale?: number | null;
    countFemale?: number | null;
  };
}>;

export type CreateOffspringAnimalBody = {
  name: string;
  sex: Sex;
  status?: string;
  birthDate?: string | null;
  species?: Species | null;
  breed?: string | null;
  microchip?: string | null;
  notes?: string | null;
};

export type UpdateOffspringAnimalBody = Partial<CreateOffspringAnimalBody>;

export type CreateOffspringWaitlistBody = {
  partyType: "Contact" | "Organization";
  contactId?: number | null;
  organizationId?: number | null;

  planId?: number | null;
  speciesPref?: Species | null;
  breedPrefs?: any | null;
  sirePrefId?: number | null;
  damPrefId?: number | null;

  status?: string;
  priority?: number | null;

  depositInvoiceId?: string | null;
  balanceInvoiceId?: string | null;
  depositPaidAt?: string | null;
  depositRequiredCents?: number | null;
  depositPaidCents?: number | null;
  balanceDueCents?: number | null;

  animalId?: number | null;

  skipCount?: number | null;
  lastSkipAt?: string | null;

  notes?: string | null;
};

export type UpdateOffspringWaitlistBody = Partial<CreateOffspringWaitlistBody>;

export type CreateOffspringAttachmentBody = {
  kind: string;
  storageProvider: string;
  storageKey: string;
  filename: string;
  mime: string;
  bytes: number;
  createdByUserId?: string | null;
};

/* ===== Breeding (READ-ONLY for offspring UI) ===== */

export type BreedingPlanStatus =
  | "PLANNING"
  | "COMMITTED"
  | "BRED"
  | "PREGNANT"
  | "BIRTHED"
  | "WEANED"
  | "PLACEMENT"
  | "HOMING"
  | "HOMING_STARTED"
  | "COMPLETE"
  | "CANCELED";

export type BreedingPlan = {
  id: number;
  tenantId: number;
  organizationId: number | null;
  code: string | null;
  name: string;
  nickname: string | null;
  species: Species;
  breedText: string | null;
  damId: number;
  sireId: number | null;

  lockedCycleKey: string | null;
  lockedCycleStart: string | null;
  lockedOvulationDate: string | null;
  lockedDueDate: string | null;
  lockedPlacementStartDate: string | null;

  expectedCycleStart: string | null;
  expectedHormoneTestingStart: string | null;
  expectedBreedDate: string | null;
  expectedBirthDate: string | null;
  expectedPlacementStart: string | null;
  expectedWeaned: string | null;
  expectedPlacementCompleted: string | null;

  cycleStartDateActual: string | null;
  hormoneTestingStartDateActual: string | null;
  breedDateActual: string | null;
  birthDateActual: string | null;
  weanedDateActual: string | null;
  placementStartDateActual: string | null;
  placementCompletedDateActual: string | null;
  completedDateActual: string | null;

  status: BreedingPlanStatus;
  notes: string | null;
  archived?: boolean;

  dam?: { id: number; name: string } | null;
  sire?: { id: number; name: string } | null;
  organization?: { id: number; name: string } | null;
};

export type BreedingEvent = {
  id: number;
  tenantId: number;
  planId: number;
  type: string;
  occurredAt: string;
  label: string | null;
  notes: string | null;
  data: any | null;
};

export type TestResult = {
  id: number;
  tenantId: number;
  planId: number;
  animalId: number | null;
  kind: string;
  method: string | null;
  labName: string | null;
  valueNumber: number | null;
  valueText: string | null;
  units: string | null;
  referenceRange: string | null;
  collectedAt: string;
  resultAt: string | null;
  notes: string | null;
  data: any | null;
};

export type BreedingAttempt = {
  id: number;
  tenantId: number;
  planId: number;
  method: string;
  attemptAt: string | null;
  windowStart: string | null;
  windowEnd: string | null;
  studOwnerContactId: number | null;
  semenBatchId: number | null;
  success: boolean | null;
  notes: string | null;
  data: any | null;
};

export type PregnancyCheck = {
  id: number;
  tenantId: number;
  planId: number;
  method: string;
  result: boolean;
  checkedAt: string;
  notes: string | null;
  data: any | null;
};

export type BreedingPlanListResp = {
  items: BreedingPlan[];
  total: number;
  page: number;
  limit: number;
};

/* ───────────────────────── animals-style http core ───────────────────────── */

const isMutating = (m?: string) => !["GET", "HEAD", "OPTIONS"].includes((m || "GET").toUpperCase());
function readCookie(name: string) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/([$?*|{}.:+^\\]\\-])/g, "\\$1")}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}
function readAdminToken() {
  return (
    (document.querySelector('meta[name="x-admin-token"]') as HTMLMetaElement | null)?.content ||
    localStorage.getItem("bhq_admin_token") ||
    null
  );
}

async function withTenantHeaders(init?: RequestInit & { tenantId?: number | null }) {
  let tenantId = init?.tenantId ?? readTenantIdFast();
  if (!tenantId) tenantId = await resolveTenantId();

  const headers: Record<string, string> = {
    accept: "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (tenantId != null) headers["x-tenant-id"] = String(tenantId);

  if (isMutating(init?.method)) {
    headers["x-requested-with"] = "XMLHttpRequest";
    headers["content-type"] = headers["content-type"] || "application/json";

    const xsrf =
      readCookie("XSRF-TOKEN") ||
      (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ||
      null;

    if (xsrf) {
      headers["x-xsrf-token"] = xsrf;
      headers["x-csrf-token"] = xsrf;
    }

    if (!headers["x-admin-token"]) {
      const admin = readAdminToken();
      if (admin) headers["x-admin-token"] = admin;
    }
  }

  return { ...init, headers, credentials: "include" as const };
}

async function http<T>(base: string, path: string, init?: RequestInit & { tenantId?: number | null }) {
  const url = `${base}${path}`;
  const res = await fetch(url, await withTenantHeaders(init));
  const text = await res.text();

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = text ? JSON.parse(text) : {};
      msg = j?.error || j?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  if (!text.trim()) return null as unknown as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Expected JSON from ${url} but got: ${text.slice(0, 200)}`);
  }
}

/* ───────────────────────── API factory ───────────────────────── */

type MakeOpts = string | { baseUrl?: string };
export function makeOffspringApi(opts: MakeOpts = "/api/v1") {
  const base = typeof opts === "string" ? opts : opts.baseUrl || "/api/v1";

  return {
    /** Low-level helpers (use sparingly) */
    raw: {
      get: <T>(path: string, init?: RequestInit & { tenantId?: number | null }) =>
        http<T>(base, path, { ...init, method: "GET" }),
      post: <T>(path: string, body?: any, init?: RequestInit & { tenantId?: number | null }) =>
        http<T>(base, path, { ...init, method: "POST", body: body == null ? undefined : JSON.stringify(body) }),
      patch: <T>(path: string, body?: any, init?: RequestInit & { tenantId?: number | null }) =>
        http<T>(base, path, { ...init, method: "PATCH", body: body == null ? undefined : JSON.stringify(body) }),
      del: <T>(path: string, init?: RequestInit & { tenantId?: number | null }) =>
        http<T>(base, path, { ...init, method: "DELETE" }),
    },

    /** Offspring Groups (Litters) */
    offspring: {
      list: (params?: {
        q?: string;
        tenantId?: number | null;
        limit?: number;
        cursor?: string;
        published?: boolean;
        hasAnimals?: boolean;
        dateField?: "birthed" | "weaned" | "placementStart" | "placementCompleted";
        dateFrom?: string;
        dateTo?: string;
      }) => {
        const qs = new URLSearchParams();
        if (params?.q) qs.set("q", params.q);
        if (params?.limit) qs.set("limit", String(params.limit));
        if (params?.cursor) qs.set("cursor", params.cursor);
        if (params?.published !== undefined) qs.set("published", String(params.published));
        if (params?.hasAnimals !== undefined) qs.set("hasAnimals", String(params.hasAnimals));
        if (params?.dateField) qs.set("dateField", params.dateField);
        if (params?.dateFrom) qs.set("dateFrom", params.dateFrom);
        if (params?.dateTo) qs.set("dateTo", params.dateTo);
        const query = qs.toString() ? `?${qs.toString()}` : "";
        return http<OffspringListResp>(base, `/offspring${query}`, { tenantId: params?.tenantId });
      },

      get: (id: number, opts?: { tenantId?: number | null }) =>
        http<OffspringDetail>(base, `/offspring/${id}`, { tenantId: opts?.tenantId }),

      create: (body: CreateOffspringBody, opts?: { tenantId?: number | null; adminToken?: string }) =>
        http<OffspringDetail>(base, `/offspring`, {
          method: "POST",
          body: JSON.stringify(body),
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        }),

      patch: (id: number, body: PatchOffspringBody, opts?: { tenantId?: number | null; adminToken?: string }) =>
        http<OffspringDetail>(base, `/offspring/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        }),

      delete: (id: number, opts?: { tenantId?: number | null; adminToken?: string }) =>
        http<{ ok: true; id: number }>(base, `/offspring/${id}`, {
          method: "DELETE",
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        }),

      moveWaitlist: (id: number, waitlistEntryIds: number[], opts?: { tenantId?: number | null; adminToken?: string }) =>
        http<{ moved: number }>(base, `/offspring/${id}/move-waitlist`, {
          method: "POST",
          body: JSON.stringify({ waitlistEntryIds }),
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        }),

      /* nested: animals under a litter */
      createAnimal: (id: number, body: CreateOffspringAnimalBody, opts?: { tenantId?: number | null; adminToken?: string }) =>
        http<AnimalLite>(base, `/offspring/${id}/animals`, {
          method: "POST",
          body: JSON.stringify(body),
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        }),

      updateAnimal: (
        id: number,
        animalId: number,
        body: UpdateOffspringAnimalBody,
        opts?: { tenantId?: number | null; adminToken?: string },
      ) =>
        http<AnimalLite>(base, `/offspring/${id}/animals/${animalId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts?.adminToken } : undefined,
        }),

      removeAnimal: (
        id: number,
        animalId: number,
        mode: "unlink" | "delete" = "unlink",
        opts?: { tenantId?: number | null; adminToken?: string },
      ) =>
        http<{ ok: true; deleted?: number; unlinked?: number }>(
          base,
          `/offspring/${id}/animals/${animalId}?mode=${encodeURIComponent(mode)}`,
          {
            method: "DELETE",
            tenantId: opts?.tenantId,
            headers: opts?.adminToken ? { "x-admin-token": opts?.adminToken } : undefined,
          },
        ),

      /* nested: waitlist under a litter */
      addWaitlist: (id: number, body: CreateOffspringWaitlistBody, opts?: { tenantId?: number | null; adminToken?: string }) =>
        http<WaitlistEntry>(base, `/offspring/${id}/waitlist`, {
          method: "POST",
          body: JSON.stringify(body),
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        }),

      updateWaitlist: (
        id: number,
        wid: number,
        body: UpdateOffspringWaitlistBody,
        opts?: { tenantId?: number | null; adminToken?: string },
      ) =>
        http<WaitlistEntry>(base, `/offspring/${id}/waitlist/${wid}`, {
          method: "PATCH",
          body: JSON.stringify(body),
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts?.adminToken } : undefined,
        }),

      removeWaitlist: (
        id: number,
        wid: number,
        mode: "unlink" | "delete" = "unlink",
        opts?: { tenantId?: number | null; adminToken?: string },
      ) =>
        http<{ ok: true; deleted?: number; unlinked?: number }>(
          base,
          `/offspring/${id}/waitlist/${wid}?mode=${encodeURIComponent(mode)}`,
          {
            method: "DELETE",
            tenantId: opts?.tenantId,
            headers: opts?.adminToken ? { "x-admin-token": opts?.adminToken } : undefined,
          },
        ),

      /* nested: attachments under a litter */
      addAttachment: (id: number, body: CreateOffspringAttachmentBody, opts?: { tenantId?: number | null; adminToken?: string }) =>
        http<any>(base, `/offspring/${id}/attachments`, {
          method: "POST",
          body: JSON.stringify(body),
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        }),

      deleteAttachment: (id: number, attachmentId: number, opts?: { tenantId?: number | null; adminToken?: string }) =>
        http<{ ok: true; deleted: number }>(base, `/offspring/${id}/attachments/${attachmentId}`, {
          method: "DELETE",
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        }),
    },

    /** Individuals (animals with litterId not null) */
    individuals: {
      list: (params?: { q?: string; tenantId?: number | null; limit?: number; cursor?: string }) => {
        const qs = new URLSearchParams();
        qs.set("hasLitter", "1");
        if (params?.q) qs.set("q", params.q);
        if (params?.limit) qs.set("limit", String(params?.limit));
        if (params?.cursor) qs.set("cursor", params?.cursor);
        return http<{ items: AnimalLite[]; total: number }>(base, `/animals?${qs}`, { tenantId: params?.tenantId });
      },
      get: (id: number, opts?: { tenantId?: number | null }) =>
        http<AnimalLite>(base, `/animals/${id}`, { tenantId: opts?.tenantId }),
      patch: (id: number, body: Partial<AnimalLite>, opts?: { tenantId?: number | null }) =>
        http<AnimalLite>(base, `/animals/${id}`, { method: "PATCH", body: JSON.stringify(body), tenantId: opts?.tenantId }),
      delete: (id: number, opts?: { tenantId?: number | null }) =>
        http<{ ok: true }>(base, `/animals/${id}`, { method: "DELETE", tenantId: opts?.tenantId }),
    },

    /** Global Animals (for Dam/Sire search or general directory) */
    animals: {
      list: (params?: {
        q?: string;
        species?: Species;
        sex?: Sex;
        status?: "ACTIVE" | "BREEDING" | "UNAVAILABLE" | "RETIRED" | "DECEASED" | "PROSPECT";
        includeArchived?: boolean;
        page?: number;
        limit?: number;
        sort?: string; // e.g. "-createdAt,name"
        tenantId?: number | null;
      }) => {
        const qs = new URLSearchParams();
        if (params?.q) qs.set("q", params.q);
        if (params?.species) qs.set("species", params.species);
        if (params?.sex) qs.set("sex", params.sex);
        if (params?.status) qs.set("status", params.status);
        if (params?.includeArchived) qs.set("includeArchived", "true");
        if (params?.page != null) qs.set("page", String(params.page));
        if (params?.limit != null) qs.set("limit", String(params.limit));
        if (params?.sort) qs.set("sort", params.sort);
        const query = qs.toString() ? `?${qs.toString()}` : "";
        return http<{ items: AnimalLite[]; total: number; page: number; limit: number }>(
          base,
          `/animals${query}`,
          { tenantId: params?.tenantId },
        );
      },
      get: (id: number, opts?: { tenantId?: number | null }) =>
        http<AnimalLite>(base, `/animals/${id}`, { tenantId: opts?.tenantId }),
      patch: (id: number, body: Partial<AnimalLite>, opts?: { tenantId?: number | null }) =>
        http<AnimalLite>(base, `/animals/${id}`, { method: "PATCH", body: JSON.stringify(body), tenantId: opts?.tenantId }),
      delete: (id: number, opts?: { tenantId?: number | null }) =>
        http<{ ok: true }>(base, `/animals/${id}`, { method: "DELETE", tenantId: opts?.tenantId }),
    },

    /** Breeding (READ endpoints from apps/api/src/routes/breeding.ts) */
    breeding: {
      plans: {
        list: (params?: {
          q?: string;
          status?: BreedingPlanStatus | string;
          damId?: number;
          sireId?: number;
          include?: string; // e.g. "parents,events,tests,attempts,waitlist,attachments,litter,org,parties"
          page?: number;
          limit?: number;
          archived?: "include" | "exclude" | "only";
          tenantId?: number | null;
        }) => {
          const qs = new URLSearchParams();
          if (params?.q) qs.set("q", params.q);
          if (params?.status) qs.set("status", params.status);
          if (params?.damId) qs.set("damId", String(params.damId));
          if (params?.sireId) qs.set("sireId", String(params.sireId));
          if (params?.include) qs.set("include", params.include);
          if (params?.page != null) qs.set("page", String(params.page));
          if (params?.limit != null) qs.set("limit", String(params.limit));
          if (params?.archived) qs.set("archived", params.archived);
          const query = qs.toString() ? `?${qs.toString()}` : "";
          return http<BreedingPlanListResp>(base, `/breeding/plans${query}`, { tenantId: params?.tenantId });
        },
        get: (id: number, opts?: { include?: string; tenantId?: number | null }) => {
          const qs = new URLSearchParams();
          if (opts?.include) qs.set("include", opts.include);
          const query = qs.toString() ? `?${qs.toString()}` : "";
          return http<BreedingPlan>(base, `/breeding/plans/${id}${query}`, { tenantId: opts?.tenantId });
        },
        /* events / tests / attempts / preg-checks are created via backend;
           Offspring UI reads them. We expose list endpoints aligned to routes. */
        listEvents: (planId: number, opts?: { tenantId?: number | null }) =>
          http<BreedingEvent[]>(base, `/breeding/plans/${planId}/events`, { tenantId: opts?.tenantId }),
        listTests: (planId: number, opts?: { tenantId?: number | null }) =>
          http<TestResult[]>(base, `/breeding/plans/${planId}/tests`, { tenantId: opts?.tenantId }),
        listAttempts: (planId: number, opts?: { tenantId?: number | null }) =>
          http<BreedingAttempt[]>(base, `/breeding/plans/${planId}/attempts`, { tenantId: opts?.tenantId }),
        listPregnancyChecks: (planId: number, opts?: { tenantId?: number | null }) =>
          http<PregnancyCheck[]>(base, `/breeding/plans/${planId}/pregnancy-checks`, { tenantId: opts?.tenantId }),
      },
      /* cycles read for timeline views */
      cycles: {
        list: (params?: {
          femaleId?: number;
          from?: string;
          to?: string;
          page?: number;
          limit?: number;
          tenantId?: number | null;
        }) => {
          const qs = new URLSearchParams();
          if (params?.femaleId) qs.set("femaleId", String(params.femaleId));
          if (params?.from) qs.set("from", params.from);
          if (params?.to) qs.set("to", params.to);
          if (params?.page != null) qs.set("page", String(params.page));
          if (params?.limit != null) qs.set("limit", String(params.limit));
          const query = qs.toString() ? `?${qs.toString()}` : "";
          return http<{ items: any[]; total: number; page: number; limit: number }>(
            base,
            `/breeding/cycles${query}`,
            { tenantId: params?.tenantId },
          );
        },
      },
    },

    /** Global Waitlist (parking lot) */
    waitlist: {
      list: (params?: {
        q?: string;
        status?: string;
        species?: Species;
        tenantId?: number | null;
        limit?: number;
        cursor?: string;
      }) => {
        const qs = new URLSearchParams();
        if (params?.q) qs.set("q", params.q);
        if (params?.status) qs.set("status", params.status);
        if (params?.species) qs.set("species", params.species);
        if (params?.limit) qs.set("limit", String(params.limit));
        if (params?.cursor) qs.set("cursor", params.cursor);
        const query = qs.toString() ? `?${qs.toString()}` : "";
        return http<{ items: WaitlistEntry[]; total: number }>(base, `/waitlist${query}`, {
          tenantId: params?.tenantId,
        });
      },
      get: (id: number, opts?: { tenantId?: number | null }) =>
        http<WaitlistEntry>(base, `/waitlist/${id}`, { tenantId: opts?.tenantId }),
      create: (body: CreateOffspringWaitlistBody, opts?: { tenantId?: number | null; adminToken?: string }) =>
        http<WaitlistEntry>(base, `/waitlist`, {
          method: "POST",
          body: JSON.stringify(body),
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        }),
      patch: (id: number, body: Partial<WaitlistEntry>, opts?: { tenantId?: number | null }) =>
        http<WaitlistEntry>(base, `/waitlist/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
          tenantId: opts?.tenantId,
        }),
      delete: (id: number, opts?: { tenantId?: number | null }) =>
        http<{ ok: true }>(base, `/waitlist/${id}`, { method: "DELETE", tenantId: opts?.tenantId }),
      skip: (id: number, opts?: { tenantId?: number | null }) =>
        http<{ skipCount: number }>(base, `/waitlist/${id}/skip`, { method: "POST", tenantId: opts?.tenantId }),
    },

    /** Directory search (Contacts / Organizations) — create/read for Offspring UI */
    contacts: {
      list: (params?: {
        q?: string;
        includeArchived?: boolean;
        page?: number;
        limit?: number;
        sort?: string;
        tenantId?: number | null;
      }) => {
        const qs = new URLSearchParams();
        if (params?.q) qs.set("q", params.q);
        if (params?.includeArchived) qs.set("includeArchived", "true");
        if (params?.page != null) qs.set("page", String(params.page));
        if (params?.limit != null) qs.set("limit", String(params.limit));
        if (params?.sort) qs.set("sort", params.sort);
        const query = qs.toString() ? `?${qs.toString()}` : "";
        return http<{ items: any[]; total: number; page: number; limit: number }>(base, `/contacts${query}`, {
          tenantId: params?.tenantId,
        });
      },
      get: (id: number, opts?: { tenantId?: number | null }) =>
        http<any>(base, `/contacts/${id}`, { tenantId: opts?.tenantId }),
      create: (body: any, opts?: { tenantId?: number | null; adminToken?: string }) =>
        http<any>(base, `/contacts`, {
          method: "POST",
          body: JSON.stringify(body),
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        }),
      patch: (id: number, body: any, opts?: { tenantId?: number | null; adminToken?: string }) =>
        http<any>(base, `/contacts/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        }),
    },

    organizations: {
      list: (params?: {
        q?: string;
        includeArchived?: boolean;
        page?: number;
        limit?: number;
        sort?: string;
        tenantId?: number | null;
      }) => {
        const qs = new URLSearchParams();
        if (params?.q) qs.set("q", params.q);
        if (params?.includeArchived) qs.set("includeArchived", "true");
        if (params?.page != null) qs.set("page", String(params.page));
        if (params?.limit != null) qs.set("limit", String(params.limit));
        if (params?.sort) qs.set("sort", params.sort);
        const query = qs.toString() ? `?${qs.toString()}` : "";
        return http<{ items: any[]; total: number; page: number; limit: number }>(base, `/organizations${query}`, {
          tenantId: params?.tenantId,
        });
      },
      get: (id: number, opts?: { tenantId?: number | null }) =>
        http<any>(base, `/organizations/${id}`, { tenantId: opts?.tenantId }),
      create: (body: any, opts?: { tenantId?: number | null; adminToken?: string }) =>
        http<any>(base, `/organizations`, {
          method: "POST",
          body: JSON.stringify(body),
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        }),
      patch: (id: number, body: any, opts?: { tenantId?: number | null; adminToken?: string }) =>
        http<any>(base, `/organizations/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        }),
    },

    breeds: {
      listCanonical: (opts: { species: string; orgId?: number; limit?: number }) => {
        const qs = new URLSearchParams();
        qs.set("species", opts.species);
        if (opts.orgId != null) qs.set("orgId", String(opts.orgId));
        if (opts.limit != null) qs.set("limit", String(opts.limit));
        return http<any[]>(base, `/breeds/canonical?${qs.toString()}`);
      },
    },
  };
}
