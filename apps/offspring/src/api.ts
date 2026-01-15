import { readTenantIdFast, resolveTenantId } from "@bhq/ui/utils/tenant";
import { createHttp, makeTags, type TagsResource } from "@bhq/api";

/* ───────────────────────── helpers ───────────────────────── */

/** Normalize API base: ensure exactly one /api/v1 suffix, never doubled */
function normBase(base?: string): string {
  let b = String(base || "").trim();
  if (!b) b = typeof window !== "undefined" ? window.location.origin : "";
  // Strip trailing slashes and any existing /api/v1 suffix
  b = b.replace(/\/+$/g, "").replace(/\/api\/v1$/i, "");
  return `${b}/api/v1`;
}

/* ───────────────────────── shared enums and primitives ───────────────────────── */

export type Sex = "FEMALE" | "MALE";

export type Species = "DOG" | "CAT" | "HORSE" | "GOAT" | "RABBIT";

/* ───────────────────────── offspring core domain types ───────────────────────── */

export type OffspringPlanLite = {
  id: number;
  code: string | null;
  name: string;
  species: Species;
  breedText: string | null;
  dam: { id: number; name: string } | null;
  sire: { id: number; name: string } | null;
  program?: { id: number; name: string } | null;
  programId?: number | null;
  expectedPlacementStart: string | null;
  expectedPlacementCompleted: string | null;
  placementStartDateActual?: string | null;
  placementCompletedDateActual?: string | null;
  [key: string]: any;
};

export type OffspringRow = {
  id: number;
  tenantId: number;
  identifier: string | null;
  createdAt: string;
  updatedAt: string;
  placementState?: string | null;
  lifeState?: string | null;
  keeperIntent?: string | null;
  financialState?: string | null;
  paperworkState?: string | null;
  diedAt?: string | null;
  placedAt?: string | null;
  paidInFullAt?: string | null;
  contractId?: string | null;
  contractSignedAt?: string | null;
  promotedAnimalId?: number | null;

  counts?: {
    animals: number;
    waitlist: number;
    born?: number | null;
    live?: number | null;
    stillborn?: number | null;
    male?: number | null;
    female?: number | null;
    weaned?: number | null;
    placed?: number | null;
    [key: string]: any;
  };

  birthedStartAt?: string | null;
  birthedEndAt?: string | null;
  weanedAt?: string | null;
  placementStartAt?: string | null;
  placementCompletedAt?: string | null;

  published?: boolean;
  statusOverride?: string | null;
  statusOverrideReason?: string | null;

  plan: OffspringPlanLite | null;

  [key: string]: any;
};

export type OffspringListResp = {
  items: OffspringRow[];
  nextCursor: string | null;
};

/* Individuals as they appear in the Offspring tab */

export type AnimalLite = {
  id: number;
  tenantId: number;
  groupId: number | null;
  name: string | null;
  callName?: string | null;
  identifier?: string | null;
  species: Species | null;
  sex: Sex | null;
  color?: string | null;
  pattern?: string | null;
  registryNumber?: string | null;
  microchip?: string | null;
  birthDate?: string | null;
  placementState?: string | null;
  lifeState?: string | null;
  keeperIntent?: string | null;
  financialState?: string | null;
  paperworkState?: string | null;
  diedAt?: string | null;
  placedAt?: string | null;
  paidInFullAt?: string | null;
  contractId?: string | null;
  contractSignedAt?: string | null;
  promotedAnimalId?: number | null;
  buyerContactId?: number | null;
  buyerOrganizationId?: number | null;
  status?: string | null;
  notes?: string | null;
  [key: string]: any;
};

/* Waitlist entries used by offspring and waitlist UIs */

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

  [key: string]: any;
};

/* Detail used by the drawer on OffspringPage */

export type OffspringDetail = {
  id: number;
  tenantId: number;
  identifier: string | null;
  notes: string | null;
  published?: boolean;
  coverImageUrl?: string | null;
  themeName?: string | null;

  group?: OffspringRow | null;
  animals?: AnimalLite[] | null;
  waitlistEntries?: WaitlistEntry[] | null;

  createdAt?: string;
  updatedAt?: string;
  lastActivityAt?: string | null;

  [key: string]: any;
};

/* Create and update payloads for groups and individuals */

export type CreateOffspringBody = {
  identifier?: string | null;
  planId?: number | null;
  notes?: string | null;
  published?: boolean;
  statusOverride?: string | null;
  statusOverrideReason?: string | null;
  [key: string]: any;
};

export type CreateOffspringIndividualBody = {
  groupId?: number | null;
  name?: string | null;
  callName?: string | null;
  identifier?: string | null;
  species?: Species | null;
  sex?: Sex | null;
  color?: string | null;
  pattern?: string | null;
  birthDate?: string | null;
  notes?: string | null;
  placementState?: string | null;
  lifeState?: string | null;
  keeperIntent?: string | null;
  financialState?: string | null;
  paperworkState?: string | null;
  diedAt?: string | null;
  placedAt?: string | null;
  paidInFullAt?: string | null;
  contractId?: string | null;
  contractSignedAt?: string | null;
  promotedAnimalId?: number | null;
  buyerPartyId?: number | null;
  /** @deprecated Phase 3: Use buyerPartyId instead */
  buyerContactId?: number | null;
  /** @deprecated Phase 3: Use buyerPartyId instead */
  buyerOrganizationId?: number | null;
  [key: string]: any;
};

export type PatchOffspringBody = Partial<CreateOffspringBody>;
export type OffspringUpdateInput = Partial<CreateOffspringIndividualBody>;

/* Animals attached to a group */

export type CreateOffspringAnimalBody = {
  name?: string | null;
  callName?: string | null;
  identifier?: string | null;
  species?: Species | null;
  sex?: Sex | null;
  color?: string | null;
  pattern?: string | null;
  birthDate?: string | null;
  notes?: string | null;
  [key: string]: any;
};

export type UpdateOffspringAnimalBody = Partial<CreateOffspringAnimalBody>;

/* Waitlist rows attached to a group */

export type CreateOffspringWaitlistBody = {
  waitlistEntryId: number;
  mode?: "link" | "move";
  [key: string]: any;
};

export type UpdateOffspringWaitlistBody = Partial<CreateOffspringWaitlistBody>;

/* Attachments for groups or litters */

export type CreateOffspringAttachmentBody = {
  title?: string | null;
  description?: string | null;
};

export type Attachment = {
  id: number;
  name?: string;
  filename?: string;
  url?: string;
  size?: number;
  createdAt?: string;
  [key: string]: any;
};

/* ───────────────────────── offspring group link types ───────────────────────── */

export type OffspringGroupLite = {
  id: number;
  tenantId: number;
  planId: number | null;
  linkState: "linked" | "orphan" | string;
  species?: Species | null;
  damId?: number | null;
  sireId?: number | null;
  expectedBirthOn?: string | null;
  actualBirthOn?: string | null;
  [key: string]: any;
};

export type OffspringGroupLinkSuggestion = {
  plan: OffspringPlanLite;
  score: number;
  reason?: string | null;
};

/* Returned by a helper that ensures a plan exists and is linked */

export type CommitPlanEnsureResp = {
  plan: OffspringPlanLite;
  group: OffspringRow | null;
};

/* ───────────────────────── readonly breeding types for offspring UI ───────────────────────── */

export type BreedingPlanStatus =
  | "PLANNING"
  | "COMMITTED"
  | "BRED"
  | "BIRTHED"
  | "BIRTH_FAILED"
  | "WEANED"
  | "PLACEMENT_STARTED"
  | "PLACEMENT_COMPLETED"
  | "COMPLETE"
  | "CANCELED";

export type BreedingEvent = {
  id: number;
  planId: number;
  type: string;
  occurredAt: string | null;
  notes?: string | null;
  [key: string]: any;
};

export type TestResult = {
  id: number;
  planId: number;
  type: string;
  result: string | null;
  takenAt: string | null;
  [key: string]: any;
};

export type BreedingAttempt = {
  id: number;
  planId: number;
  attemptNumber: number;
  occurredAt: string | null;
  notes?: string | null;
  [key: string]: any;
};

export type PregnancyCheck = {
  id: number;
  planId: number;
  method: string | null;
  result: string | null;
  checkedAt: string | null;
  [key: string]: any;
};

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
  status: BreedingPlanStatus;

  events?: BreedingEvent[];
  tests?: TestResult[];
  attempts?: BreedingAttempt[];
  pregnancyChecks?: PregnancyCheck[];

  data: any | null;
};

export type BreedingPlanListResp = {
  items: BreedingPlan[];
  total: number;
  page: number;
  limit: number;
};

/* ───────────────────────── list inputs for groups and individuals ───────────────────────── */

export type GroupListInput = {
  q?: string;
  tenantId?: number | null;
  limit?: number;
  cursor?: string | null;
  published?: boolean;
  hasAnimals?: boolean;
  dateField?: "birthed" | "weaned" | "placementStart" | "placementCompleted";
  dateFrom?: string;
  dateTo?: string;
};

export type GroupListResult = {
  items: OffspringRow[];
  nextCursor: string | null;
};

export type OffspringListInput = {
  q?: string;
  groupId?: number;
  tenantId?: number | null;
  limit?: number;
  cursor?: string | null;
};

export type OffspringListResult = {
  items: AnimalLite[];
  total?: number;
  page?: number;
  limit?: number;
  nextCursor?: string | null;
};

/* Detail helpers used by drawer actions on OffspringPage */

export type HealthEventInput = {
  type: string;
  occurredAt?: string | null;
  notes?: string | null;
  [key: string]: any;
};

export type InvoiceLinkInput = {
  invoiceId: number;
};

/* ───────────────────────── http helpers with tenant handling ───────────────────────── */

const isMutating = (m?: string) => !["GET", "HEAD", "OPTIONS"].includes((m || "GET").toUpperCase());

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/([$?*|{}.:+^\\]\\-])/g, "\\$1")}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function readAdminToken() {
  if (typeof document === "undefined") return null;
  const meta = document.querySelector('meta[name="x-admin-token"]') as HTMLMetaElement | null;
  if (meta?.content) return meta.content;
  const cookie = readCookie("x_admin_token");
  return cookie;
}

type TenantInit = RequestInit & {
  tenantId?: number | null;
  adminToken?: string;
};

async function withTenantHeaders(init: TenantInit = {}): Promise<TenantInit> {
  let tenantId = init.tenantId ?? readTenantIdFast();
  if (!tenantId) {
    tenantId = await resolveTenantId();
  }

  const headers: Record<string, string> = {
    accept: "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  if (tenantId != null) {
    headers["x-tenant-id"] = String(tenantId);
  }

  if (isMutating(init.method)) {
    headers["x-requested-with"] = "XMLHttpRequest";
    if (!headers["content-type"]) {
      headers["content-type"] = "application/json";
    }

    const xsrf = readCookie("XSRF-TOKEN");
    if (xsrf) {
      headers["x-xsrf-token"] = xsrf;
      headers["x-csrf-token"] = xsrf;
      headers["csrf-token"] = xsrf;
    }
  }

  const adminToken = init.adminToken ?? readAdminToken();
  if (adminToken) {
    headers["x-admin-token"] = adminToken;
  }

  return {
    ...init,
    headers,
  };
}

async function http<T>(base: string, path: string, init: TenantInit = {}): Promise<T> {
  const url = `${base}${path}`;
  const prepared = await withTenantHeaders(init);
  const res = await fetch(url, prepared);
  const text = await res.text();

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = text ? JSON.parse(text) : {};
      msg = j?.error || j?.message || msg;
    } catch {
      // ignore parse error
    }
    throw new Error(msg);
  }

  if (!text) return undefined as unknown as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined as unknown as T;
  }
}

async function httpForm<T>(base: string, path: string, form: FormData, init: TenantInit = {}): Promise<T> {
  const url = `${base}${path}`;
  const prepared = await withTenantHeaders({ ...(init || {}), method: "POST" });
  if ((prepared.headers as any)?.["content-type"]) {
    delete (prepared.headers as any)["content-type"];
  }

  const res = await fetch(url, { ...prepared, body: form });
  const text = await res.text();

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = text ? JSON.parse(text) : {};
      msg = j?.error || j?.message || msg;
    } catch {
      // ignore parse error
    }
    throw new Error(msg);
  }

  if (!text) return undefined as unknown as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined as unknown as T;
  }
}

/* ───────────────────────── offspring API factory ───────────────────────── */

type MakeOpts = string | { baseUrl?: string };

export function makeOffspringApi(opts: MakeOpts = "/api/v1") {
  const base = typeof opts === "string" ? opts : opts.baseUrl || "/api/v1";

  const raw = {
    get: <T>(path: string, init?: TenantInit) =>
      http<T>(base, path, { ...init, method: "GET" }),
    post: <T>(path: string, body?: any, init?: TenantInit) =>
      http<T>(base, path, {
        ...init,
        method: "POST",
        body: body == null ? undefined : JSON.stringify(body),
      }),
    patch: <T>(path: string, body?: any, init?: TenantInit) =>
      http<T>(base, path, {
        ...init,
        method: "PATCH",
        body: body == null ? undefined : JSON.stringify(body),
      }),
    del: <T>(path: string, init?: TenantInit) =>
      http<T>(base, path, { ...init, method: "DELETE" }),
    postForm: <T>(path: string, form: FormData, init?: TenantInit) =>
      httpForm<T>(base, path, form, init),
  };

  /* groups under /offspring and /offspring */

  const groups = {
    list: (params?: GroupListInput, opts?: TenantInit): Promise<GroupListResult> => {
      const qs = new URLSearchParams();
      if (params?.q) qs.set("q", params.q);
      if (params?.limit != null) qs.set("limit", String(params.limit));
      if (params?.cursor) qs.set("cursor", params.cursor);
      if (params?.published != null) qs.set("published", String(params.published));
      if (params?.hasAnimals != null) qs.set("hasAnimals", String(params.hasAnimals));
      if (params?.dateField) qs.set("dateField", params.dateField);
      if (params?.dateFrom) qs.set("dateFrom", params.dateFrom);
      if (params?.dateTo) qs.set("dateTo", params.dateTo);

      const query = qs.toString();
      const path = `/offspring${query ? `?${query}` : ""}`;
      return raw.get<GroupListResult>(path, opts);
    },

    get: (groupId: number, opts?: TenantInit): Promise<OffspringDetail> =>
      raw.get<OffspringDetail>(`/offspring/${groupId}`, opts),

    create: (body: CreateOffspringBody, opts?: TenantInit): Promise<OffspringRow> =>
      raw.post<OffspringRow>("/offspring", body, opts),

    update: (groupId: number, body: PatchOffspringBody, opts?: TenantInit): Promise<OffspringRow> =>
      raw.patch<OffspringRow>(`/offspring/${groupId}`, body, opts),

    remove: (groupId: number, opts?: TenantInit): Promise<{ ok: true }> =>
      raw.del<{ ok: true }>(`/offspring/${groupId}`, opts),

    byPlan: (planId: number, opts?: TenantInit): Promise<OffspringGroupLite[]> =>
      raw.get<OffspringGroupLite[]>(`/offspring/by-plan/${planId}`, opts),

    linkPlan: (groupId: number, body: { planId: number }, opts?: TenantInit): Promise<CommitPlanEnsureResp> =>
      raw.post<CommitPlanEnsureResp>(`/offspring/${groupId}/link`, body, opts),

    unlinkPlan: (groupId: number, opts?: TenantInit): Promise<{ ok: true }> =>
      raw.post<{ ok: true }>(`/offspring/${groupId}/unlink`, {}, opts),

    linkSuggestions: (
      groupId: number,
      params?: { limit?: number },
      opts?: TenantInit,
    ): Promise<OffspringGroupLinkSuggestion[]> => {
      const qs = new URLSearchParams();
      if (params?.limit != null) qs.set("limit", String(params.limit));
      const query = qs.toString();
      const path = `/offspring/${groupId}/link-suggestions${query ? `?${query}` : ""}`;
      return raw.get<OffspringGroupLinkSuggestion[]>(path, opts);
    },

    addBuyer: (
      groupId: number,
      body: { contactId?: number | null; organizationId?: number | null; waitlistEntryId?: number | null },
      opts?: TenantInit,
    ): Promise<OffspringDetail> =>
      raw.post<OffspringDetail>(`/offspring/${groupId}/buyers`, body, opts),

    removeBuyer: (groupId: number, buyerLinkId: number, opts?: TenantInit): Promise<{ ok: true }> =>
      raw.del<{ ok: true }>(`/offspring/${groupId}/buyers/${buyerLinkId}`, opts),

    attachments: {
      list: (groupId: number, opts?: TenantInit): Promise<Attachment[]> =>
        raw.get<Attachment[]>(`/offspring-groups/${groupId}/attachments`, opts),
      create: (groupId: number, body: CreateOffspringAttachmentBody, opts?: TenantInit): Promise<Attachment> =>
        raw.post<Attachment>(`/offspring-groups/${groupId}/attachments`, body, opts),
      remove: (groupId: number, attachmentId: number, opts?: TenantInit): Promise<{ ok: true }> =>
        raw.del<{ ok: true }>(`/offspring-groups/${groupId}/attachments/${attachmentId}`, opts),
    },
  };

  /* legacy offspring namespace under /offspring for groups plus helpers */

  const offspring = {
    list: (params?: GroupListInput, opts?: TenantInit): Promise<GroupListResult> =>
      groups.list(params, opts),

    get: (id: number, opts?: TenantInit): Promise<OffspringDetail> =>
      raw.get<OffspringDetail>(`/offspring/${id}`, opts),

    create: (body: CreateOffspringBody, opts?: TenantInit): Promise<OffspringRow> =>
      raw.post<OffspringRow>("/offspring", body, opts),

    update: (id: number, body: PatchOffspringBody, opts?: TenantInit): Promise<OffspringRow> =>
      raw.patch<OffspringRow>(`/offspring/${id}`, body, opts),

    remove: (id: number, opts?: TenantInit): Promise<{ ok: true }> =>
      raw.del<{ ok: true }>(`/offspring/${id}`, opts),

    animals: {
      list: (id: number, opts?: TenantInit): Promise<AnimalLite[]> =>
        raw.get<AnimalLite[]>(`/offspring/${id}/animals`, opts),
      create: (id: number, body: CreateOffspringAnimalBody, opts?: TenantInit): Promise<AnimalLite> =>
        raw.post<AnimalLite>(`/offspring/${id}/animals`, body, opts),
      update: (id: number, animalId: number, body: UpdateOffspringAnimalBody, opts?: TenantInit): Promise<AnimalLite> =>
        raw.patch<AnimalLite>(`/offspring/${id}/animals/${animalId}`, body, opts),
      remove: (
        id: number,
        animalId: number,
        mode: "unlink" | "delete" = "unlink",
        opts?: TenantInit,
      ): Promise<{ ok: true; deleted?: number; unlinked?: number }> =>
        raw.del<{ ok: true; deleted?: number; unlinked?: number }>(
          `/offspring/${id}/animals/${animalId}?mode=${encodeURIComponent(mode)}`,
          opts,
        ),
    },

    waitlist: {
      list: (id: number, opts?: TenantInit): Promise<WaitlistEntry[]> =>
        raw.get<WaitlistEntry[]>(`/offspring/${id}/waitlist`, opts),
      create: (id: number, body: CreateOffspringWaitlistBody, opts?: TenantInit): Promise<OffspringDetail> =>
        raw.post<OffspringDetail>(`/offspring/${id}/waitlist`, body, opts),
      update: (
        id: number,
        wid: number,
        body: UpdateOffspringWaitlistBody,
        opts?: TenantInit,
      ): Promise<OffspringDetail> =>
        raw.patch<OffspringDetail>(`/offspring/${id}/waitlist/${wid}`, body, opts),
      remove: (
        id: number,
        wid: number,
        mode: "unlink" | "delete" = "unlink",
        opts?: TenantInit,
      ): Promise<{ ok: true; deleted?: number; unlinked?: number }> =>
        raw.del<{ ok: true; deleted?: number; unlinked?: number }>(
          `/offspring/${id}/waitlist/${wid}?mode=${encodeURIComponent(mode)}`,
          opts,
        ),
      moveToGroup: (
        id: number,
        body: { targetGroupId: number },
        opts?: TenantInit,
      ): Promise<OffspringDetail> =>
        raw.post<OffspringDetail>(`/offspring/${id}/move-waitlist`, body, opts),
    },

    attachments: {
      list: (id: number, opts?: TenantInit): Promise<Attachment[]> =>
        raw.get<Attachment[]>(`/offspring/${id}/attachments`, opts),
      create: (id: number, body: CreateOffspringAttachmentBody, opts?: TenantInit): Promise<Attachment> =>
        raw.post<Attachment>(`/offspring/${id}/attachments`, body, opts),
      remove: (id: number, attachmentId: number, opts?: TenantInit): Promise<{ ok: true }> =>
        raw.del<{ ok: true }>(`/offspring/${id}/attachments/${attachmentId}`, opts),
    },
  };

  /* individuals under /offspring/individuals */

  const individuals = {
    list: (params?: OffspringListInput, opts?: TenantInit): Promise<OffspringListResult> => {
      const qs = new URLSearchParams();
      if (params?.q) qs.set("q", params.q);
      if (params?.groupId != null) qs.set("groupId", String(params.groupId));
      if (params?.limit != null) qs.set("limit", String(params.limit));
      if (params?.cursor) qs.set("cursor", params.cursor);

      const query = qs.toString();
      const path = `/offspring/individuals${query ? `?${query}` : ""}`;
      return raw.get<OffspringListResult>(path, opts);
    },

    get: (id: number, opts?: TenantInit): Promise<AnimalLite> =>
      raw.get<AnimalLite>(`/offspring/individuals/${id}`, opts),

    create: (body: CreateOffspringIndividualBody, opts?: TenantInit): Promise<AnimalLite> =>
      raw.post<AnimalLite>("/offspring/individuals", body, opts),

    update: (id: number, body: OffspringUpdateInput, opts?: TenantInit): Promise<AnimalLite> =>
      raw.patch<AnimalLite>(`/offspring/individuals/${id}`, body, opts),

    remove: (id: number, opts?: TenantInit): Promise<{ ok: true }> =>
      raw.del<{ ok: true }>(`/offspring/individuals/${id}`, opts),

    archive: (id: number, reason?: string, opts?: TenantInit): Promise<{ ok: true }> =>
      raw.post<{ ok: true }>(`/offspring/individuals/${id}/archive`, { reason }, opts),

    restore: (id: number, opts?: TenantInit): Promise<{ ok: true }> =>
      raw.post<{ ok: true }>(`/offspring/individuals/${id}/restore`, {}, opts),

    addHealthEvent: (id: number, body: HealthEventInput, opts?: TenantInit): Promise<OffspringDetail> =>
      raw.post<OffspringDetail>(`/offspring/individuals/${id}/health-events`, body, opts),

    linkInvoice: (id: number, body: InvoiceLinkInput, opts?: TenantInit): Promise<OffspringDetail> =>
      raw.post<OffspringDetail>(`/offspring/individuals/${id}/invoices`, body, opts),
  };

  return {
    raw,
    groups,
    offspring,
    individuals,
  };
}

/* High level client used by OffspringPage and App Offspring */

export type OffspringApi = {
  /* individuals tab convenience methods */
  list(input: OffspringListInput): Promise<OffspringListResult>;
  getById(id: number): Promise<AnimalLite>;
  create(input: OffspringUpdateInput & { groupId?: number | null }): Promise<AnimalLite>;
  update(id: number, patch: OffspringUpdateInput): Promise<AnimalLite>;
  remove(id: number): Promise<void>;

  addHealthEvent(id: number, input: HealthEventInput): Promise<OffspringDetail>;
  linkInvoice(id: number, input: InvoiceLinkInput): Promise<OffspringDetail>;

  /* lower level namespaces preserved for App Offspring and Waitlist */
  groups: ReturnType<typeof makeOffspringApi>["groups"];
  offspring: ReturnType<typeof makeOffspringApi>["offspring"];
  individuals: ReturnType<typeof makeOffspringApi>["individuals"];

  /* expose raw so legacy callers like WaitlistPage can fall back to api.raw.post/patch */
  raw: ReturnType<typeof makeOffspringApi>["raw"];

  /* cross module namespaces used by OffspringPage and Waitlist */

  animals: {
    list(params?: { q?: string; species?: string; sex?: string; limit?: number }): Promise<any>;
  };

  contacts: {
    list(params?: { q?: string; limit?: number }): Promise<any>;
    create(body: any): Promise<any>;
    get(id: number): Promise<any>;
  };

  organizations: {
    list(params?: { q?: string; limit?: number }): Promise<any>;
    create(body: any): Promise<any>;
    get(id: number): Promise<any>;
  };

  waitlist: {
    list(params?: { q?: string; limit?: number; tenantId?: number | null }): Promise<any>;
    create(body: any): Promise<WaitlistEntry>;
    patch(id: number, body: any): Promise<WaitlistEntry>;
  };

  breeds: {
    listCanonical(params?: { species?: string; q?: string; limit?: number }): Promise<any>;
  };

  /* Finance namespace for invoices, payments, expenses */
  finance: {
    parties: {
      search(query: string, opts?: { limit?: number }): Promise<any[]>;
    };
    contacts: {
      create(input: { first_name?: string; last_name?: string; display_name?: string; email?: string; phone_e164?: string }): Promise<any>;
    };
    organizations: {
      create(input: { name: string; website?: string | null }): Promise<any>;
    };
    invoices: {
      list(params?: any): Promise<{ items: any[]; total: number }>;
      get(id: number): Promise<any>;
      create(input: any, idempotencyKey: string): Promise<any>;
      update(id: number, input: any): Promise<any>;
      void(id: number): Promise<any>;
    };
    payments: {
      list(params?: any): Promise<{ items: any[]; total: number }>;
      get(id: number): Promise<any>;
      create(input: any, idempotencyKey: string): Promise<any>;
    };
    expenses: {
      list(params?: any): Promise<{ items: any[]; total: number }>;
      get(id: number): Promise<any>;
      create(input: any): Promise<any>;
      update(id: number, input: any): Promise<any>;
      delete(id: number): Promise<{ success: boolean }>;
    };
  };

  /* Tags from unified @bhq/api */
  tags: TagsResource;
};

export function makeOffspringApiClient(opts?: MakeOpts): OffspringApi {
  const core = makeOffspringApi(opts ?? "/api/v1");

  return {
    /* individuals tab helpers */
    list: (input: OffspringListInput) => core.individuals.list(input),
    getById: (id: number) => core.individuals.get(id),
    create: (input: OffspringUpdateInput & { groupId?: number | null }) =>
      core.individuals.create(input, {}),
    update: (id: number, patch: OffspringUpdateInput) =>
      core.individuals.update(id, patch, {}),
    remove: async (id: number) => {
      await core.individuals.remove(id, {});
    },

    addHealthEvent: (id: number, input: HealthEventInput) =>
      core.individuals.addHealthEvent(id, input),
    linkInvoice: (id: number, input: InvoiceLinkInput) =>
      core.individuals.linkInvoice(id, input),

    /* lower level offspring namespaces */
    groups: core.groups,
    offspring: core.offspring,
    individuals: core.individuals,

    /* expose raw so WaitlistPage can use api.raw.post/patch if needed */
    raw: core.raw,

    /* platform namespaces for buyer search and animal picker */

    animals: {
      list: (params?: { q?: string; species?: string; sex?: string; limit?: number }) => {
        const qs = new URLSearchParams();
        if (params?.q) qs.set("q", params.q);
        if (params?.species) qs.set("species", params.species);
        if (params?.sex) qs.set("sex", params.sex);
        if (params?.limit != null) qs.set("limit", String(params.limit));

        const query = qs.toString();
        const path = `/animals${query ? `?${query}` : ""}`;
        return core.raw.get<any[]>(path, {});
      },
    },

    contacts: {
      list: (params?: { q?: string; limit?: number }) => {
        const qs = new URLSearchParams();
        if (params?.q) qs.set("q", params.q);
        if (params?.limit != null) qs.set("limit", String(params.limit));

        const query = qs.toString();
        const path = `/contacts${query ? `?${query}` : ""}`;
        return core.raw.get<any[]>(path, {});
      },
      create: (body: any) => {
        return core.raw.post<any>("/contacts", body, {});
      },
      get: (id: number) => {
        return core.raw.get<any>(`/contacts/${id}`, {});
      },
    },

    organizations: {
      list: (params?: { q?: string; limit?: number }) => {
        const qs = new URLSearchParams();
        if (params?.q) qs.set("q", params.q);
        if (params?.limit != null) qs.set("limit", String(params.limit));

        const query = qs.toString();
        const path = `/organizations${query ? `?${query}` : ""}`;
        return core.raw.get<any[]>(path, {});
      },
      create: (body: any) => {
        return core.raw.post<any>("/organizations", body, {});
      },
      get: (id: number) => {
        return core.raw.get<any>(`/organizations/${id}`, {});
      },
    },

    waitlist: {
      list: (params?: { q?: string; limit?: number; tenantId?: number | null }) => {
        const qs = new URLSearchParams();
        if (params?.q) qs.set("q", params.q);
        if (params?.limit != null) qs.set("limit", String(params.limit));
        if (params?.tenantId != null) qs.set("tenantId", String(params.tenantId));

        const query = qs.toString();
        const path = `/waitlist${query ? `?${query}` : ""}`;
        // WaitlistPage can handle array or { items: [...] }
        return core.raw.get<any>(path, {});
      },
      create: (body: any) => {
        return core.raw.post<WaitlistEntry>("/waitlist", body, {});
      },
      patch: (id: number, body: any) => {
        return core.raw.patch<WaitlistEntry>(`/waitlist/${id}`, body, {});
      },
    },

    breeds: {
      listCanonical: (params?: { species?: string; q?: string; limit?: number }) => {
        const qs = new URLSearchParams();
        if (params?.species) qs.set("species", params.species);
        if (params?.q) qs.set("q", params.q);
        if (params?.limit != null) qs.set("limit", String(params.limit));

        const query = qs.toString();
        const path = `/breeds/canonical${query ? `?${query}` : ""}`;
        return core.raw.get<any>(path, {});
      },
    },

    /* Finance namespace for invoices, payments, expenses */
    finance: {
      parties: {
        search: async (query: string, opts?: { limit?: number }) => {
          const qs = new URLSearchParams();
          qs.set("q", query);
          qs.set("dir", "asc");
          if (opts?.limit) qs.set("limit", String(opts.limit));
          const res = await core.raw.get<{ items?: any[]; total?: number } | any[]>(`/parties?${qs.toString()}`, {});
          return Array.isArray(res) ? res : (res?.items || []);
        },
      },
      contacts: {
        create: (input: { first_name?: string; last_name?: string; display_name?: string; email?: string; phone_e164?: string }) =>
          core.raw.post<any>("/contacts", input, {}),
      },
      organizations: {
        create: (input: { name: string; website?: string | null }) =>
          core.raw.post<any>("/organizations", input, {}),
      },
      invoices: {
        list: (params?: any) => {
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
          return core.raw.get<{ data: any[]; meta?: any }>(path, {}).then(res => ({
            items: res.data || [],
            total: res.meta?.total || 0,
          }));
        },
        get: (id: number) => core.raw.get<any>(`/invoices/${id}`, {}),
        create: (input: any, idempotencyKey: string) =>
          core.raw.post<any>("/invoices", input, {
            headers: { "Idempotency-Key": idempotencyKey } as any,
          }),
        update: (id: number, input: any) =>
          core.raw.patch<any>(`/invoices/${id}`, input, {}),
        void: (id: number) =>
          core.raw.patch<any>(`/invoices/${id}/void`, {}, {}),
      },
      payments: {
        list: (params?: any) => {
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
          return core.raw.get<{ data: any[]; meta?: any }>(path, {}).then(res => ({
            items: res.data || [],
            total: res.meta?.total || 0,
          }));
        },
        get: (id: number) => core.raw.get<any>(`/payments/${id}`, {}),
        create: (input: any, idempotencyKey: string) =>
          core.raw.post<any>("/payments", input, {
            headers: { "Idempotency-Key": idempotencyKey } as any,
          }),
      },
      expenses: {
        list: (params?: any) => {
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
          return core.raw.get<{ data: any[]; meta?: any }>(path, {}).then(res => ({
            items: res.data || [],
            total: res.meta?.total || 0,
          }));
        },
        get: (id: number) => core.raw.get<any>(`/expenses/${id}`, {}),
        create: (input: any) => core.raw.post<any>("/expenses", input, {}),
        update: (id: number, input: any) =>
          core.raw.patch<any>(`/expenses/${id}`, input, {}),
        delete: (id: number) =>
          core.raw.del<any>(`/expenses/${id}`, {}).then(() => ({ success: true })),
      },
    },

    // Wire up unified tags from @bhq/api
    tags: makeTags(createHttp(normBase(typeof opts === "string" ? opts : opts?.baseUrl))),
  };
}
