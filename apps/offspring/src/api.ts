// api.ts
import { readTenantIdFast, resolveTenantId } from "@bhq/ui/utils/tenant";

/* ───────────────────────── types ───────────────────────── */

export type Sex = "FEMALE" | "MALE";
export type Species = "DOG" | "CAT" | "HORSE";

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

  // finance pointers (read only here)
  depositRequiredCents: number | null;
  depositPaidCents: number | null;
  balanceDueCents: number | null;
  depositPaidAt: string | null;

  // associations
  contactId: number | null;
  organizationId: number | null;
  litterId: number | null;
  planId: number | null;

  // preferences
  speciesPref: Species | null;
  breedPrefs: any | null;                 // router returns JSON; often string[]
  sirePrefId: number | null;
  damPrefId: number | null;

  // denormalized helpers
  contact?: { id: number; display_name: string; email?: string | null; phoneE164?: string | null } | null;
  organization?: { id: number; name: string; email?: string | null; phone?: string | null } | null;
  sirePref?: { id: number; name: string } | null;
  damPref?: { id: number; name: string } | null;

  // tags
  TagAssignment?: Array<{ id: number; tagId: number; tag: TagLite }>;

  // policy
  skipCount?: number | null;
  lastSkipAt?: string | null;
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

/* ───────────────────────── http helper ───────────────────────── */

async function withTenantHeaders(init?: RequestInit & { tenantId?: number | null }) {
  let tenantId = init?.tenantId ?? readTenantIdFast();
  if (!tenantId) tenantId = await resolveTenantId();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
    "x-tenant-id": String(tenantId),
  };
  return { ...init, headers };
}

async function http<T>(base: string, path: string, init?: RequestInit & { tenantId?: number | null }) {
  const res = await fetch(`${base}${path}`, await withTenantHeaders(init));
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

/* ───────────────────────── API factory ───────────────────────── */

export function makeOffspringApi(base = "/api/v1") {
  return {
    /** Offspring Groups (Litters) */
    offspring: {
      list(params?: {
        q?: string;
        tenantId?: number | null;
        limit?: number;
        cursor?: string;
        published?: boolean;
        hasAnimals?: boolean;
        dateField?: "birthed" | "weaned" | "placementStart" | "placementCompleted";
        dateFrom?: string;
        dateTo?: string;
      }) {
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

      get(id: number, opts?: { tenantId?: number | null }) {
        return http<OffspringDetail>(base, `/offspring/${id}`, { tenantId: opts?.tenantId });
      },

      create(body: CreateOffspringBody, opts?: { tenantId?: number | null; adminToken?: string }) {
        return http<OffspringDetail>(base, `/offspring`, {
          method: "POST",
          body: JSON.stringify(body),
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        });
      },

      patch(id: number, body: PatchOffspringBody, opts?: { tenantId?: number | null; adminToken?: string }) {
        return http<OffspringDetail>(base, `/offspring/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        });
      },

      delete(id: number, opts?: { tenantId?: number | null; adminToken?: string }) {
        return http<{ ok: true; id: number }>(base, `/offspring/${id}`, {
          method: "DELETE",
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        });
      },

      moveWaitlist(id: number, waitlistEntryIds: number[], opts?: { tenantId?: number | null; adminToken?: string }) {
        return http<{ moved: number }>(base, `/offspring/${id}/move-waitlist`, {
          method: "POST",
          body: JSON.stringify({ waitlistEntryIds }),
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        });
      },

      /* ── nested: animals under a litter ── */
      createAnimal(id: number, body: CreateOffspringAnimalBody, opts?: { tenantId?: number | null; adminToken?: string }) {
        return http<AnimalLite>(base, `/offspring/${id}/animals`, {
          method: "POST",
          body: JSON.stringify(body),
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        });
      },

      updateAnimal(
        id: number,
        animalId: number,
        body: UpdateOffspringAnimalBody,
        opts?: { tenantId?: number | null; adminToken?: string },
      ) {
        return http<AnimalLite>(base, `/offspring/${id}/animals/${animalId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        });
      },

      removeAnimal(
        id: number,
        animalId: number,
        mode: "unlink" | "delete" = "unlink",
        opts?: { tenantId?: number | null; adminToken?: string },
      ) {
        const qs = `?mode=${encodeURIComponent(mode)}`;
        return http<{ ok: true; deleted?: number; unlinked?: number }>(base, `/offspring/${id}/animals/${animalId}${qs}`, {
          method: "DELETE",
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        });
      },

      /* ── nested: waitlist under a litter ── */
      addWaitlist(
        id: number,
        body: CreateOffspringWaitlistBody,
        opts?: { tenantId?: number | null; adminToken?: string },
      ) {
        return http<WaitlistEntry>(base, `/offspring/${id}/waitlist`, {
          method: "POST",
          body: JSON.stringify(body),
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        });
      },

      updateWaitlist(
        id: number,
        wid: number,
        body: UpdateOffspringWaitlistBody,
        opts?: { tenantId?: number | null; adminToken?: string },
      ) {
        return http<WaitlistEntry>(base, `/offspring/${id}/waitlist/${wid}`, {
          method: "PATCH",
          body: JSON.stringify(body),
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        });
      },

      removeWaitlist(
        id: number,
        wid: number,
        mode: "unlink" | "delete" = "unlink",
        opts?: { tenantId?: number | null; adminToken?: string },
      ) {
        const qs = `?mode=${encodeURIComponent(mode)}`;
        return http<{ ok: true; deleted?: number; unlinked?: number }>(base, `/offspring/${id}/waitlist/${wid}${qs}`, {
          method: "DELETE",
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        });
      },

      /* ── nested: attachments under a litter ── */
      addAttachment(
        id: number,
        body: CreateOffspringAttachmentBody,
        opts?: { tenantId?: number | null; adminToken?: string },
      ) {
        return http<any>(base, `/offspring/${id}/attachments`, {
          method: "POST",
          body: JSON.stringify(body),
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        });
      },

      deleteAttachment(id: number, attachmentId: number, opts?: { tenantId?: number | null; adminToken?: string }) {
        return http<{ ok: true; deleted: number }>(base, `/offspring/${id}/attachments/${attachmentId}`, {
          method: "DELETE",
          tenantId: opts?.tenantId,
          headers: opts?.adminToken ? { "x-admin-token": opts.adminToken } : undefined,
        });
      },
    },

    /** Individuals = Animals with litterId not null (existing global Animals API still works if you need it) */
    individuals: {
      list(params?: { q?: string; tenantId?: number | null; limit?: number; cursor?: string }) {
        const qs = new URLSearchParams();
        qs.set("hasLitter", "1");
        if (params?.q) qs.set("q", params.q);
        if (params?.limit) qs.set("limit", String(params.limit));
        if (params?.cursor) qs.set("cursor", params.cursor);
        const query = `?${qs.toString()}`;
        return http<{ items: AnimalLite[]; total: number }>(base, `/animals${query}`, { tenantId: params?.tenantId });
      },
      get(id: number, opts?: { tenantId?: number | null }) {
        return http<AnimalLite>(base, `/animals/${id}`, { tenantId: opts?.tenantId });
      },
      patch(id: number, body: Partial<AnimalLite>, opts?: { tenantId?: number | null }) {
        return http<AnimalLite>(base, `/animals/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
          tenantId: opts?.tenantId,
        });
      },
      delete(id: number, opts?: { tenantId?: number | null }) {
        return http<{ ok: true }>(base, `/animals/${id}`, { method: "DELETE", tenantId: opts?.tenantId });
      },
    },

    /** Global Waitlist (parking lot) — unchanged if your global endpoints already exist */
    waitlist: {
      list(params?: {
        q?: string;
        status?: string;
        species?: Species;
        tenantId?: number | null;
        limit?: number;
        cursor?: string;
      }) {
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
      get(id: number, opts?: { tenantId?: number | null }) {
        return http<WaitlistEntry>(base, `/waitlist/${id}`, { tenantId: opts?.tenantId });
      },
      create(body: Partial<WaitlistEntry>, opts?: { tenantId?: number | null }) {
        return http<WaitlistEntry>(base, `/waitlist`, {
          method: "POST",
          body: JSON.stringify(body),
          tenantId: opts?.tenantId,
        });
      },
      patch(id: number, body: Partial<WaitlistEntry>, opts?: { tenantId?: number | null }) {
        return http<WaitlistEntry>(base, `/waitlist/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
          tenantId: opts?.tenantId,
        });
      },
      delete(id: number, opts?: { tenantId?: number | null }) {
        return http<{ ok: true }>(base, `/waitlist/${id}`, { method: "DELETE", tenantId: opts?.tenantId });
      },
      skip(id: number, opts?: { tenantId?: number | null }) {
        return http<{ skipCount: number }>(base, `/waitlist/${id}/skip`, {
          method: "POST",
          tenantId: opts?.tenantId,
        });
      },
    },
  };
}
