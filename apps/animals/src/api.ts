// apps/animals/src/api.ts
import { readTenantIdFast, resolveTenantId } from "@bhq/ui/utils/tenant";
import type { BreedHit } from "@bhq/ui";
import { createHttp, makeTags } from "@bhq/api";

/* ───────── Title types ───────── */

export type TitleCategory =
  | "CONFORMATION"
  | "OBEDIENCE"
  | "AGILITY"
  | "FIELD"
  | "HERDING"
  | "TRACKING"
  | "RALLY"
  | "PRODUCING"
  | "BREED_SPECIFIC"
  | "PERFORMANCE"
  | "OTHER";

export type TitleStatus = "IN_PROGRESS" | "EARNED" | "VERIFIED";

export interface TitleDefinition {
  id: number;
  abbreviation: string;
  fullName: string;
  category: TitleCategory;
  organization: string | null;
  prefixTitle: boolean;
  suffixTitle: boolean;
  displayOrder: number;
  isProducingTitle: boolean;
  parentTitle?: { id: number; abbreviation: string } | null;
}

export interface AnimalTitle {
  id: number;
  animalId: number;
  titleDefinitionId: number;
  titleDefinition: TitleDefinition;
  dateEarned: string | null;
  status: TitleStatus;
  pointsEarned: number | null;
  majorWins: number | null;
  eventName: string | null;
  eventLocation: string | null;
  handlerName: string | null;
  verified: boolean;
  verifiedAt: string | null;
  verifiedBy: string | null;
  registryRef: string | null;
  notes: string | null;
  documents: Array<{
    document: {
      id: number;
      title: string;
      mimeType: string;
      url: string;
    };
  }>;
}

/* ───────── Competition types ───────── */

export type CompetitionType =
  | "CONFORMATION_SHOW"
  | "OBEDIENCE_TRIAL"
  | "AGILITY_TRIAL"
  | "FIELD_TRIAL"
  | "HERDING_TRIAL"
  | "TRACKING_TEST"
  | "RALLY_TRIAL"
  | "RACE"
  | "PERFORMANCE_TEST"
  | "BREED_SPECIALTY"
  | "OTHER";

export interface CompetitionEntry {
  id: number;
  animalId: number;
  eventName: string;
  eventDate: string;
  location: string | null;
  organization: string | null;
  competitionType: CompetitionType;
  className: string | null;
  placement: number | null;
  placementLabel: string | null;
  pointsEarned: number | null;
  isMajorWin: boolean;
  qualifyingScore: boolean;
  score: number | null;
  scoreMax: number | null;
  judgeName: string | null;
  notes: string | null;
  // Racing-specific fields
  prizeMoneyCents: number | null;
  trackName: string | null;
  trackSurface: string | null;
  distanceFurlongs: number | null;
  distanceMeters: number | null;
  raceGrade: string | null;
  finishTime: string | null;
  speedFigure: number | null;
  // Handler/rider info
  handlerName: string | null;
  trainerName: string | null;
}

export interface CompetitionStats {
  totalEntries: number;
  totalPoints: number;
  majorWins: number;
  qualifyingScores: number;
  wins: number;
  placements: number;
  yearsActive: number[];
  byType: Record<string, { entries: number; points: number; wins: number }>;
}

export interface ProducingRecord {
  totalOffspring: number;
  titledOffspring: number;
  championOffspring: number;
  grandChampionOffspring: number;
  titleCountsByCategory: Record<string, number>;
  titledOffspringList: Array<{
    id: number;
    name: string | null;
    titles: string[];
  }>;
}

/* ───────── Lineage / Pedigree types ───────── */

export interface PedigreeNode {
  id: number;
  name: string;
  sex: "FEMALE" | "MALE";
  species: string;
  breed: string | null;
  photoUrl: string | null;
  birthDate: string | null;
  coiPercent: number | null;
  titlePrefix: string | null;
  titleSuffix: string | null;
  dam: PedigreeNode | null;
  sire: PedigreeNode | null;
}

export interface COIResult {
  coefficient: number;
  generationsAnalyzed: number;
  commonAncestors: Array<{
    id: number;
    name: string;
    pathCount: number;
    contribution: number;
  }>;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
}

export interface PedigreeResult {
  pedigree: PedigreeNode | null;
  coi: COIResult;
}

export interface DescendantNode {
  id: number;
  name: string;
  sex: "FEMALE" | "MALE";
  species: string;
  breed: string | null;
  photoUrl: string | null;
  birthDate: string | null;
  otherParent: { id: number; name: string } | null;
  children: DescendantNode[];
}

export interface DescendantsResult {
  animal: { id: number; name: string; sex: string };
  descendants: DescendantNode[];
}

export interface ParentsResult {
  dam: {
    id: number;
    name: string;
    species: string;
    breed: string | null;
    photoUrl: string | null;
    birthDate: string | null;
  } | null;
  sire: {
    id: number;
    name: string;
    species: string;
    breed: string | null;
    photoUrl: string | null;
    birthDate: string | null;
  } | null;
  coi: {
    percent: number;
    generations: number;
    calculatedAt: string;
  } | null;
}

export interface SetParentsResult {
  id: number;
  name: string;
  damId: number | null;
  sireId: number | null;
  coiPercent: number | null;
  coiGenerations: number | null;
  coiCalculatedAt: string | null;
  dam: { id: number; name: string } | null;
  sire: { id: number; name: string } | null;
}

export interface PrivacySettings {
  animalId: number;
  allowCrossTenantMatching: boolean;
  showName: boolean;
  showPhoto: boolean;
  showFullDob: boolean;
  showRegistryFull: boolean;
  showHealthResults: boolean;
  showGeneticData: boolean;
  showBreeder: boolean;
  allowInfoRequests: boolean;
  allowDirectContact: boolean;
}

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

function spFrom(obj: Record<string, any>): string {
  const sp = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const q = sp.toString();
  return q ? `?${q}` : "";
}

/* ───────── public factory ───────── */

export function makeApi(base?: string, extraHeadersFn?: () => Record<string, string>) {
  const root = normBase(base);

  const reqWithExtra = async <T>(path: string, init?: RequestInit & { json?: any }) => {
    const tenantId = await ensureTenantId(root);
    const url = path.startsWith("http") ? path : `${root}${path}`;
    const body = (init as any)?.json !== undefined ? JSON.stringify((init as any).json) : init?.body;

    const h = buildHeaders(tenantId, init);
    try {
      const extra = extraHeadersFn?.() || {};
      Object.entries(extra).forEach(([k, v]) => h.set(k, v));
    } catch { }

    const res = await fetch(url, { ...init, headers: h, credentials: "include", body });
    return parse<T>(res);
  };

  /* ───────── Lookups used by editor UIs ───────── */

  const lookups = {
    async getCreatingOrganization(): Promise<{ id: string; display_name: string; partyId?: number | null } | null> {
      try {
        const id = localStorage.getItem("BHQ_ORG_ID");
        if (id) {
          const display_name = localStorage.getItem("BHQ_ORG_NAME") || "My Organization";
          return { id: String(id), display_name: String(display_name), partyId: null };
        }
      } catch { }
      try {
        const data = await reqWithExtra<any>("/session");
        const org = data?.creatingOrganization || data?.organization || data?.org;
        if (org?.id != null) {
          const partyIdRaw = org.partyId ?? org.party_id ?? org.party?.id ?? null;
          const partyId = Number.isFinite(Number(partyIdRaw)) ? Number(partyIdRaw) : null;
          return {
            id: String(org.id),
            display_name: String(org.display_name || org.name || "Organization"),
            partyId,
          };
        }
      } catch { }
      return null;
    },

    async searchContacts(
      q: string
    ): Promise<Array<{ id: string | number; display_name: string; partyId?: number | null }>> {
      const data = await reqWithExtra<any>(
        `/parties${spFrom({ q, type: "PERSON", dir: "asc", limit: 50 })}`
      );
      const items: any[] = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      return items.map((c) => {
        const partyIdRaw = c.partyId ?? c.party_id ?? c.id;
        const partyId = Number.isFinite(Number(partyIdRaw)) ? Number(partyIdRaw) : null;
        const display_name =
          c.displayName ?? c.display_name ?? c.name ?? c.full_name ?? "Contact";
        return { ...c, id: partyId ?? c.id, partyId, display_name };
      });
    },

    async searchOrganizations(
      q: string
    ): Promise<Array<{ id: string | number; display_name: string; partyId?: number | null }>> {
      const data = await reqWithExtra<any>(
        `/parties${spFrom({ q, type: "ORGANIZATION", dir: "asc", limit: 50 })}`
      );
      const items: any[] = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      return items.map((o) => {
        const partyIdRaw = o.partyId ?? o.party_id ?? o.id;
        const partyId = Number.isFinite(Number(partyIdRaw)) ? Number(partyIdRaw) : null;
        const display_name =
          o.displayName ?? o.display_name ?? o.name ?? "Organization";
        return { ...o, id: partyId ?? o.id, partyId, display_name };
      });
    },
  };

  /* ───────── Animals API (matches server routes) ───────── */

  type Species = "DOG" | "CAT" | "HORSE" | "GOAT" | "SHEEP" | "RABBIT";
  type UiSpecies = "Dog" | "Cat" | "Horse" | "Goat" | "Sheep" | "Rabbit";
  const toUiSpecies = (s: Species): UiSpecies => {
    if (s === "DOG") return "Dog";
    if (s === "CAT") return "Cat";
    if (s === "HORSE") return "Horse";
    if (s === "GOAT") return "Goat";
    if (s === "SHEEP") return "Sheep";
    if (s === "RABBIT") return "Rabbit";
    return "Horse";
  };

  type OwnerRow = {
    partyId: number;
    percent: number;
    isPrimary?: boolean;
  };

  const animals = {
    /* list / get / create / update */
    async list(query: { q?: string; limit?: number; page?: number; includeArchived?: boolean; sort?: string } = {}) {
      return reqWithExtra<any>(`/animals${spFrom(query)}`);
    },

    async get(id: string | number) {
      return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}`);
    },

    async create(body: {
      name: string;
      species: Species;
      sex: "FEMALE" | "MALE";
      status?: string;
      birthDate?: string | null;
      microchip?: string | null;
      notes?: string | null;
      breed?: string | null;
      canonicalBreedId?: number | null;
      customBreedId?: number | null;
      organizationId?: number | null;
    }) {
      return reqWithExtra<any>(`/animals`, { method: "POST", json: body });
    },

    async update(id: string | number, patch: any) {
      return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}`, { method: "PATCH", json: patch });
    },

    async archive(id: string | number) {
      return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/archive`, { method: "POST", json: {} });
    },

    async restore(id: string | number) {
      return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/restore`, { method: "POST", json: {} });
    },

    async remove(id: string | number) {
      return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}`, { method: "DELETE" });
    },

    /* profile photo upload and delete (legacy) */
    async uploadPhoto(id: string | number, file: File): Promise<{ photoUrl: string }> {
      const form = new FormData();
      form.append("file", file);

      return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/photo`, {
        method: "POST",
        body: form,
      });
    },

    async removePhoto(id: string | number): Promise<{ photoUrl: string | null }> {
      return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/photo`, {
        method: "DELETE",
      });
    },

    /* profile photo upload and delete */
    photo: {
      async upload(id: string | number, file: File): Promise<{ photoUrl: string }> {
        const form = new FormData();
        form.append("file", file);

        return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/photo`, {
          method: "POST",
          body: form,
        });
      },

      async remove(id: string | number): Promise<{ photoUrl: string | null }> {
        return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/photo`, {
          method: "DELETE",
        });
      },
    },

    // Persist breeder entered cycle start dates
    async putCycleStartDates(payload: { animalId: number | string; dates: string[] }) {
      const { animalId, dates } = payload;
      return reqWithExtra<any>(
        `/animals/${encodeURIComponent(String(animalId))}/cycle-start-dates`,
        {
          method: "PUT",
          json: { dates },
        }
      );
    },

    // Program flags (legacy)
    async getProgramFlags(id: string | number) {
      return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/program-flags`);
    },

    async putProgramFlags(id: string | number, flags: any) {
      return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/program-flags`, {
        method: "PUT",
        json: flags,
      });
    },


    /* owners: GET list, POST add, PATCH update, DELETE remove */
    owners: {
      async list(id: string | number) {
        return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/owners`);
      },
      async add(id: string | number, row: OwnerRow) {
        return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/owners`, { method: "POST", json: row });
      },
      async update(
        id: string | number,
        ownerId: string | number,
        patch: Partial<Pick<OwnerRow, "percent" | "isPrimary">>
      ) {
        return reqWithExtra<any>(
          `/animals/${encodeURIComponent(String(id))}/owners/${encodeURIComponent(String(ownerId))}`,
          { method: "PATCH", json: patch }
        );
      },
      async remove(id: string | number, ownerId: string | number) {
        return reqWithExtra<any>(
          `/animals/${encodeURIComponent(String(id))}/owners/${encodeURIComponent(String(ownerId))}`,
          { method: "DELETE" }
        );
      },
    },

    /* registries parity */
    registries: {
      async list(id: string | number) {
        return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/registries`);
      },
      async add(id: string | number, payload: { registryId: number; identifier: string; registrarOfRecord?: string | null; issuedAt?: string | null }) {
        return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/registries`, {
          method: "POST",
          json: payload,
        });
      },
      async update(
        id: string | number,
        identifierId: string | number,
        patch: Partial<{ identifier: string; registrarOfRecord: string | null; issuedAt: string | null; registryId: number }>
      ) {
        return reqWithExtra<any>(
          `/animals/${encodeURIComponent(String(id))}/registries/${encodeURIComponent(String(identifierId))}`,
          { method: "PATCH", json: patch }
        );
      },
      async remove(id: string | number, identifierId: string | number) {
        return reqWithExtra<any>(
          `/animals/${encodeURIComponent(String(id))}/registries/${encodeURIComponent(String(identifierId))}`,
          { method: "DELETE" }
        );
      },
    },

    /* traits parity */
    traits: {
      async list(id: string | number) {
        return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/traits`);
      },
      async update(id: string | number, updates: any[]) {
        return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/traits`, {
          method: "PUT",
          json: { updates },
        });
      },
    },

    /* documents parity */
    documents: {
      async list(id: string | number) {
        return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/documents`);
      },
      async upload(id: string | number, payload: {
        title: string;
        originalFileName: string;
        mimeType: string;
        sizeBytes?: number;
        visibility: string;
        linkTraitKeys?: string[];
      }) {
        return reqWithExtra<any>(`/animals/${encodeURIComponent(String(id))}/documents`, {
          method: "POST",
          json: payload,
        });
      },
      async uploadForTrait(id: string | number, traitKey: string, payload: {
        title: string;
        originalFileName: string;
        mimeType: string;
        sizeBytes?: number;
        visibility: string;
      }) {
        return reqWithExtra<any>(
          `/animals/${encodeURIComponent(String(id))}/traits/${encodeURIComponent(traitKey)}/documents`,
          {
            method: "POST",
            json: payload,
          }
        );
      },
      async remove(id: string | number, documentId: string | number) {
        return reqWithExtra<any>(
          `/animals/${encodeURIComponent(String(id))}/documents/${encodeURIComponent(String(documentId))}`,
          { method: "DELETE" }
        );
      },
    },

    /* lineage / pedigree */
    lineage: {
      /** Get pedigree (ancestor tree) for an animal */
      async getPedigree(id: string | number, generations: number = 5): Promise<PedigreeResult> {
        return reqWithExtra<PedigreeResult>(
          `/animals/${encodeURIComponent(String(id))}/pedigree?generations=${generations}`
        );
      },

      /** Get descendants (offspring tree) for an animal */
      async getDescendants(id: string | number, generations: number = 3): Promise<DescendantsResult> {
        return reqWithExtra<DescendantsResult>(
          `/animals/${encodeURIComponent(String(id))}/descendants?generations=${generations}`
        );
      },

      /** Get parents for an animal */
      async getParents(id: string | number): Promise<ParentsResult> {
        return reqWithExtra<ParentsResult>(
          `/animals/${encodeURIComponent(String(id))}/parents`
        );
      },

      /** Set parents for an animal */
      async setParents(
        id: string | number,
        parents: { damId?: number | null; sireId?: number | null }
      ): Promise<SetParentsResult> {
        return reqWithExtra<SetParentsResult>(
          `/animals/${encodeURIComponent(String(id))}/parents`,
          { method: "PUT", json: parents }
        );
      },

      /** Calculate prospective COI for a hypothetical breeding */
      async getProspectiveCOI(
        damId: number,
        sireId: number,
        generations: number = 10
      ): Promise<COIResult> {
        return reqWithExtra<COIResult>(
          `/lineage/coi?damId=${damId}&sireId=${sireId}&generations=${generations}`
        );
      },

      /** Get privacy settings for an animal */
      async getPrivacySettings(id: string | number): Promise<PrivacySettings> {
        return reqWithExtra<PrivacySettings>(
          `/animals/${encodeURIComponent(String(id))}/privacy`
        );
      },

      /** Update privacy settings for an animal */
      async updatePrivacySettings(
        id: string | number,
        settings: Partial<Omit<PrivacySettings, "animalId">>
      ): Promise<PrivacySettings> {
        return reqWithExtra<PrivacySettings>(
          `/animals/${encodeURIComponent(String(id))}/privacy`,
          { method: "PUT", json: settings }
        );
      },
    },

    /* titles */
    titles: {
      /** Get all titles for an animal */
      async list(id: string | number): Promise<AnimalTitle[]> {
        return reqWithExtra<AnimalTitle[]>(
          `/animals/${encodeURIComponent(String(id))}/titles`
        );
      },

      /** Add a title to an animal */
      async add(
        id: string | number,
        payload: {
          titleDefinitionId: number;
          dateEarned?: string;
          status?: TitleStatus;
          pointsEarned?: number;
          majorWins?: number;
          verified?: boolean;
          verifiedBy?: string;
          registryRef?: string;
          notes?: string;
        }
      ): Promise<AnimalTitle> {
        return reqWithExtra<AnimalTitle>(
          `/animals/${encodeURIComponent(String(id))}/titles`,
          { method: "POST", json: payload }
        );
      },

      /** Update a title */
      async update(
        id: string | number,
        titleId: number,
        payload: {
          dateEarned?: string | null;
          status?: TitleStatus;
          pointsEarned?: number | null;
          majorWins?: number | null;
          verified?: boolean;
          verifiedAt?: string | null;
          verifiedBy?: string | null;
          registryRef?: string | null;
          notes?: string | null;
        }
      ): Promise<AnimalTitle> {
        return reqWithExtra<AnimalTitle>(
          `/animals/${encodeURIComponent(String(id))}/titles/${titleId}`,
          { method: "PUT", json: payload }
        );
      },

      /** Remove a title */
      async remove(id: string | number, titleId: number): Promise<void> {
        await reqWithExtra<void>(
          `/animals/${encodeURIComponent(String(id))}/titles/${titleId}`,
          { method: "DELETE" }
        );
      },
    },

    /* competitions */
    competitions: {
      /** Get all competition entries for an animal */
      async list(
        id: string | number,
        opts?: { type?: CompetitionType; year?: number }
      ): Promise<CompetitionEntry[]> {
        return reqWithExtra<CompetitionEntry[]>(
          `/animals/${encodeURIComponent(String(id))}/competitions${spFrom(opts || {})}`
        );
      },

      /** Get competition stats for an animal */
      async stats(id: string | number): Promise<CompetitionStats> {
        return reqWithExtra<CompetitionStats>(
          `/animals/${encodeURIComponent(String(id))}/competitions/stats`
        );
      },

      /** Add a competition entry */
      async add(
        id: string | number,
        payload: {
          eventName: string;
          eventDate: string;
          competitionType: CompetitionType;
          location?: string;
          organization?: string;
          className?: string;
          placement?: number;
          placementLabel?: string;
          pointsEarned?: number;
          isMajorWin?: boolean;
          qualifyingScore?: boolean;
          score?: number;
          scoreMax?: number;
          judgeName?: string;
          notes?: string;
        }
      ): Promise<CompetitionEntry> {
        return reqWithExtra<CompetitionEntry>(
          `/animals/${encodeURIComponent(String(id))}/competitions`,
          { method: "POST", json: payload }
        );
      },

      /** Update a competition entry */
      async update(
        id: string | number,
        entryId: number,
        payload: Partial<Omit<CompetitionEntry, "id" | "animalId">>
      ): Promise<CompetitionEntry> {
        return reqWithExtra<CompetitionEntry>(
          `/animals/${encodeURIComponent(String(id))}/competitions/${entryId}`,
          { method: "PUT", json: payload }
        );
      },

      /** Remove a competition entry */
      async remove(id: string | number, entryId: number): Promise<void> {
        await reqWithExtra<void>(
          `/animals/${encodeURIComponent(String(id))}/competitions/${entryId}`,
          { method: "DELETE" }
        );
      },
    },

    /* producing record */
    async getProducingRecord(id: string | number): Promise<ProducingRecord> {
      return reqWithExtra<ProducingRecord>(
        `/animals/${encodeURIComponent(String(id))}/producing-record`
      );
    },
  };

  /* ───────── Title Definitions ───────── */

  const titleDefinitions = {
    /** Get all title definitions (global + tenant-specific) */
    async list(opts?: {
      species?: Species;
      category?: TitleCategory;
      organization?: string;
    }): Promise<TitleDefinition[]> {
      return reqWithExtra<TitleDefinition[]>(
        `/title-definitions${spFrom(opts || {})}`
      );
    },

    /** Create a custom title definition */
    async create(payload: {
      species: Species;
      abbreviation: string;
      fullName: string;
      category: TitleCategory;
      organization?: string;
      parentTitleId?: number;
      pointsRequired?: number;
      description?: string;
      isProducingTitle?: boolean;
      prefixTitle?: boolean;
      suffixTitle?: boolean;
      displayOrder?: number;
    }): Promise<TitleDefinition> {
      return reqWithExtra<TitleDefinition>(`/title-definitions`, {
        method: "POST",
        json: payload,
      });
    },
  };

  /* ───────── Breeds (unchanged, assuming backend exists) ───────── */

  const breeds = {
    async species(): Promise<Species[]> {
      const data = await reqWithExtra<{ items: Species[] }>(`/species`);
      return Array.isArray(data?.items) ? data.items : [];
    },

    async search(opts: { species: Species; q?: string; limit?: number }): Promise<BreedHit[]> {
      const data = await reqWithExtra<{ items?: any[] } | any[]>(
        `/breeds/search${spFrom({
          species: (opts.species || "DOG").toUpperCase(),
          q: (opts.q || "").trim() || undefined,
          limit: opts.limit != null ? Math.min(Math.max(opts.limit, 1), 200) : undefined,
        })}`
      );
      const items: any[] = Array.isArray((data as any)?.items)
        ? (data as any).items
        : Array.isArray(data)
          ? (data as any)
          : [];
      return items.map(it => ({
        id: it.id,
        name: it.name,
        species: toUiSpecies((it.species || "DOG") as Species),
        source: (it.source || "canonical") as "canonical" | "custom",
        canonicalBreedId: it.canonicalBreedId ?? null,
      })) as BreedHit[];
    },

    async customList(opts: { species?: Species; q?: string; page?: number; limit?: number }) {
      return reqWithExtra<any>(`/breeds/custom${spFrom(opts || {})}`);
    },

    async customGet(id: string | number) {
      return reqWithExtra<any>(`/breeds/custom/${encodeURIComponent(String(id))}`);
    },

    async customCreate(payload: { species: Species; name: string }) {
      return reqWithExtra<any>(`/breeds/custom`, { method: "POST", json: payload });
    },

    async customUpdate(id: string | number, payload: { name?: string; species?: Species }) {
      return reqWithExtra<any>(`/breeds/custom/${encodeURIComponent(String(id))}`, { method: "PATCH", json: payload });
    },

    async customDelete(id: string | number) {
      return reqWithExtra<any>(`/breeds/custom/${encodeURIComponent(String(id))}`, { method: "DELETE" });
    },

    async getRecipe(customBreedId: string | number) {
      return reqWithExtra<any>(`/breeds/custom/${encodeURIComponent(String(customBreedId))}/recipe`);
    },

    async putRecipe(
      customBreedId: string | number,
      body: { ingredients: Array<{ canonicalBreedId: number; percentage?: number | null }> }
    ) {
      return reqWithExtra<any>(`/breeds/custom/${encodeURIComponent(String(customBreedId))}/recipe`, {
        method: "PUT",
        json: body,
      });
    },
  };

  /* ───────── Registries master data ───────── */

  const registries = {
    async list(opts: { species?: Species } = {}) {
      return reqWithExtra<any>(`/registries${spFrom(opts || {})}`);
    },
  };

  /* ───────── Finance namespace for invoices, payments, expenses ───────── */

  const finance = {
    parties: {
      async search(query: string, opts?: { limit?: number }) {
        const qs = new URLSearchParams();
        qs.set("q", query);
        qs.set("dir", "asc");
        if (opts?.limit) qs.set("limit", String(opts.limit));
        const res = await reqWithExtra<{ items?: any[]; total?: number } | any[]>(`/parties?${qs.toString()}`);
        return Array.isArray(res) ? res : (res?.items || []);
      },
    },
    contacts: {
      async create(input: { first_name?: string; last_name?: string; display_name?: string; email?: string; phone_e164?: string }) {
        return reqWithExtra<any>("/contacts", { method: "POST", json: input });
      },
    },
    organizations: {
      async create(input: { name: string; website?: string | null }) {
        return reqWithExtra<any>("/organizations", { method: "POST", json: input });
      },
    },
    invoices: {
      async list(params?: any) {
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
        const res = await reqWithExtra<{ data: any[]; meta?: any }>(path);
        return {
          items: res.data || [],
          total: res.meta?.total || 0,
        };
      },
      async get(id: number) {
        return reqWithExtra<any>(`/invoices/${id}`);
      },
      async create(input: any, idempotencyKey: string) {
        return reqWithExtra<any>("/invoices", {
          method: "POST",
          json: input,
          headers: { "Idempotency-Key": idempotencyKey } as any,
        });
      },
      async update(id: number, input: any) {
        return reqWithExtra<any>(`/invoices/${id}`, {
          method: "PATCH",
          json: input,
        });
      },
      async void(id: number) {
        return reqWithExtra<any>(`/invoices/${id}/void`, {
          method: "PATCH",
          json: {},
        });
      },
    },
    payments: {
      async list(params?: any) {
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
        const res = await reqWithExtra<{ data: any[]; meta?: any }>(path);
        return {
          items: res.data || [],
          total: res.meta?.total || 0,
        };
      },
      async get(id: number) {
        return reqWithExtra<any>(`/payments/${id}`);
      },
      async create(input: any, idempotencyKey: string) {
        return reqWithExtra<any>("/payments", {
          method: "POST",
          json: input,
          headers: { "Idempotency-Key": idempotencyKey } as any,
        });
      },
    },
    expenses: {
      async list(params?: any) {
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
        const res = await reqWithExtra<{ data: any[]; meta?: any }>(path);
        return {
          items: res.data || [],
          total: res.meta?.total || 0,
        };
      },
      async get(id: number) {
        return reqWithExtra<any>(`/expenses/${id}`);
      },
      async create(input: any) {
        return reqWithExtra<any>("/expenses", {
          method: "POST",
          json: input,
        });
      },
      async update(id: number, input: any) {
        return reqWithExtra<any>(`/expenses/${id}`, {
          method: "PATCH",
          json: input,
        });
      },
      async delete(id: number) {
        await reqWithExtra<any>(`/expenses/${id}`, { method: "DELETE" });
        return { success: true };
      },
    },
  };

  // Wire up unified tags from @bhq/api
  const http = createHttp(root);
  const tags = makeTags(http);

  /* ───────── Animal Public Listing API ───────── */

  type AnimalListingStatus = "DRAFT" | "LIVE" | "PAUSED";
  type AnimalListingIntent = "STUD" | "BROOD_PLACEMENT" | "REHOME" | "GUARDIAN_PLACEMENT";

  interface AnimalPublicListingDTO {
    id: number;
    animalId: number;
    tenantId: number;
    urlSlug: string;
    intent: AnimalListingIntent | null;
    status: AnimalListingStatus;
    headline: string | null;
    title: string | null;
    summary: string | null;
    description: string | null;
    priceCents: number | null;
    priceMinCents: number | null;
    priceMaxCents: number | null;
    priceText: string | null;
    priceModel: "fixed" | "range" | "inquire" | null;
    locationCity: string | null;
    locationRegion: string | null;
    locationCountry: string | null;
    detailsJson: Record<string, any> | null;
    primaryPhotoUrl: string | null;
    publishedAt: string | null;
    pausedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }

  interface UpsertAnimalPublicListingPayload {
    intent?: AnimalListingIntent | null;
    headline?: string | null;
    title?: string | null;
    summary?: string | null;
    description?: string | null;
    priceCents?: number | null;
    priceMinCents?: number | null;
    priceMaxCents?: number | null;
    priceText?: string | null;
    priceModel?: "fixed" | "range" | "inquire" | null;
    locationCity?: string | null;
    locationRegion?: string | null;
    locationCountry?: string | null;
    detailsJson?: Record<string, any> | null;
    primaryPhotoUrl?: string | null;
  }

  const animalPublicListing = {
    /**
     * Get the public listing for an animal.
     * Returns null if no listing exists (404).
     */
    async get(animalId: string | number): Promise<AnimalPublicListingDTO | null> {
      try {
        return await reqWithExtra<AnimalPublicListingDTO>(
          `/animals/${encodeURIComponent(String(animalId))}/public-listing`
        );
      } catch (err: any) {
        if (err?.status === 404) return null;
        throw err;
      }
    },

    /**
     * Upsert (create or update) the public listing for an animal.
     * Always creates in DRAFT status - use setStatus to publish.
     */
    async upsert(
      animalId: string | number,
      payload: UpsertAnimalPublicListingPayload
    ): Promise<AnimalPublicListingDTO> {
      return reqWithExtra<AnimalPublicListingDTO>(
        `/animals/${encodeURIComponent(String(animalId))}/public-listing`,
        { method: "PUT", json: payload }
      );
    },

    /**
     * Set the status of an animal's public listing.
     * Use this to publish (LIVE), pause (PAUSED), or unpublish (DRAFT).
     */
    async setStatus(
      animalId: string | number,
      status: AnimalListingStatus
    ): Promise<AnimalPublicListingDTO> {
      return reqWithExtra<AnimalPublicListingDTO>(
        `/animals/${encodeURIComponent(String(animalId))}/public-listing/status`,
        { method: "PATCH", json: { status } }
      );
    },

    /**
     * Delete the public listing for an animal.
     */
    async delete(animalId: string | number): Promise<void> {
      await reqWithExtra<void>(
        `/animals/${encodeURIComponent(String(animalId))}/public-listing`,
        { method: "DELETE" }
      );
    },
  };

  return { animals, lookups, breeds, registries, finance, tags, animalPublicListing, titleDefinitions };
}
