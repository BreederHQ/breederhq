// apps/offspring/src/pages/OffspringPage.tsx
import * as React from "react";
import {
  PageHeader,
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableFooter,
  ColumnsPopover,
  hooks,
  SearchBar,
  DetailsScaffold,
  SectionCard,
  Button,
  BreedCombo,
  Badge,
  DatePicker,
  TagPicker,
  type TagOption,
  useViewMode,
  SortDropdown,
  type SortOption,
  speciesUsesCollars,
} from "@bhq/ui";
import type { BadgeProps } from "@bhq/ui";


import { Overlay } from "@bhq/ui/overlay";
import {
  ChevronDown,
  ChevronUp,
  FilePlus2,
  LayoutGrid,
  List,
  Plus,
  Table as TableIcon,
  Trash2,
} from "lucide-react";

import {
  makeOffspringApiClient,
  type AnimalLite,
  type OffspringGroupLite as OffspringGroupDTO,
} from "../api";

import { OffspringCardView } from "../components/OffspringCardView";
import { OffspringListView } from "../components/OffspringListView";
import { CollarPicker, CollarSwatch } from "../components/CollarPicker";

import { readTenantIdFast } from "@bhq/ui/utils/tenant";

// Shared input styling
const inputClass =
  "w-full h-9 rounded-md border border-hairline bg-surface px-3 text-sm text-primary " +
  "placeholder:text-secondary/80 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--brand-orange))] " +
  "focus:border-[hsl(var(--brand-orange))] shadow-[inset_0_0_0_9999px_rgba(255,255,255,0.02)]";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const labelClass = "mt-3 text-xs text-secondary";

const MODAL_Z = 2147485000;




/** ---------- Types for this page ---------- */
type ViewMode = "table" | "cards" | "list";
type ID = string | number;
type Sex = "MALE" | "FEMALE" | "UNKNOWN";
type Status = "PLANNED" | "BORN" | "AVAILABLE" | "RESERVED" | "PLACED" | "HOLDBACK" | "DECEASED";
type Species = "DOG" | "CAT" | "HORSE";
type SpeciesUi = "Dog" | "Cat" | "Horse";
type Money = number;

type LifeState = "ALIVE" | "DECEASED" | string;
type PlacementState =
  | "UNASSIGNED"
  | "OPTION_HOLD"
  | "RESERVED"
  | "PLACED"
  | "RETURNED"
  | "TRANSFERRED"
  | string;
type KeeperIntent = "KEEP" | "WITHHELD" | "UNDER_EVALUATION" | string;
type FinancialState =
  | "NONE"
  | "DEPOSIT_PENDING"
  | "DEPOSIT_PAID"
  | "PAID_IN_FULL"
  | "REFUNDED"
  | "CHARGEBACK"
  | string;
type PaperworkState = "NONE" | "SENT" | "SIGNED" | "COMPLETE" | string;

type BadgeVariant = BadgeProps["variant"];
type StatusChip = { label: string; variant?: BadgeVariant; title?: string };
type StatusBadge = { label: string; variant?: BadgeVariant; title?: string };

type Buyer = { id: ID; name: string };
type GroupLite = { id: ID; name: string };

type GroupOption = {
  id: number;
  label: string;
  species: SpeciesWire | null;
  breed: string | null;
};

type MediaItem = {
  id: ID;
  url: string;
  kind: "photo" | "video";
  label?: string | null;
};

type OwnershipEvent = {
  id: ID;
  kind: "BREEDER" | "GUARDIAN" | "BUYER";
  party: string;
  fromDate: string | null;
  thruDate: string | null;
};

type LineageLink = {
  id: ID;
  kind: "SIRE" | "DAM" | "SIBLING";
  name: string;
  registrationId?: string | null;
};

type GroupBuyerOption = {
  key: string; // "contact:123"
  kind: OffspringBuyerKind;
  id: number;
  label: string;
  email?: string | null;
  phone?: string | null;
};

function deriveGroupBuyerOptions(group: any | null | undefined): GroupBuyerOption[] {
  if (!group) return [];

  const raw: any[] =
    (group.buyers as any[]) ??
    (group.Buyers as any[]) ??
    (group.buyerParties as any[]) ??
    (group.buyerLinks as any[]) ??
    [];

  return raw
    .map((b) => {
      const partyType = String(
        b.partyType ??
        b.type ??
        b.kind ??
        (b.contactId ? "CONTACT" : b.organizationId ? "ORGANIZATION" : "UNKNOWN"),
      ).toUpperCase();

      const contact =
        b.contact ??
        b.buyerContact ??
        b.partyContact ??
        null;

      const organization =
        b.organization ??
        b.org ??
        b.buyerOrganization ??
        null;

      let kind: OffspringBuyerKind;
      if (partyType === "CONTACT") {
        kind = "contact";
      } else if (partyType === "ORGANIZATION") {
        kind = "organization";
      } else {
        kind = contact ? "contact" : "organization";
      }

      const id =
        (kind === "contact"
          ? b.contactId ?? b.buyerContactId ?? contact?.id
          : b.organizationId ?? b.buyerOrganizationId ?? organization?.id) ?? null;

      if (!id) return null;

      const label =
        contact?.displayName ??
        contact?.name ??
        (contact
          ? `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim()
          : null) ??
        organization?.name ??
        `Buyer #${id}`;

      return {
        key: `${kind}:${id}`,
        kind,
        id: id as number,
        label,
        email: contact?.email ?? organization?.email ?? null,
        phone: contact?.phone ?? organization?.phone ?? null,
      } as GroupBuyerOption;
    })
    .filter((x): x is GroupBuyerOption => Boolean(x));
}

type SpeciesWire = "DOG" | "CAT" | "HORSE";

type DirectoryHit =
  | {
    kind: "contact";
    id: number;
    label: string;
    sub?: string;
    email?: string;
    phone?: string;
  }
  | {
    kind: "org";
    id: number;
    label: string;
    sub?: string;
  };

type OffspringRootApi = ReturnType<typeof makeOffspringApiClient>;

async function searchDirectory(
  api: OffspringRootApi | null,
  q: string
): Promise<DirectoryHit[]> {
  const term = q.trim();
  if (!api || !term) return [];

  const anyApi: any = api;
  const hits: DirectoryHit[] = [];

  // Contacts
  if (anyApi.contacts && typeof anyApi.contacts.list === "function") {
    try {
      const res = await anyApi.contacts.list({ q: term, limit: 25 });
      const items: any[] = Array.isArray(res) ? res : res?.items ?? [];
      for (const c of items) {
        const label =
          c.display_name ||
          `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() ||
          "(Contact)";
        const email = c.email ?? "";
        const phone = c.phoneE164 || c.phone || "";
        hits.push({
          kind: "contact",
          id: Number(c.id),
          label,
          sub: email || phone || "",
          email,
          phone,
        });
      }
    } catch (e) {
      console.error("Directory contact search failed", e);
    }
  }

  // Organizations
  if (anyApi.organizations && typeof anyApi.organizations.list === "function") {
    try {
      const res = await anyApi.organizations.list({ q: term, limit: 25 });
      const items: any[] = Array.isArray(res) ? res : res?.items ?? [];
      for (const o of items) {
        hits.push({
          kind: "org",
          id: Number(o.id),
          label: o.name || "(Organization)",
          sub: o.email || o.phone || "",
        });
      }
    } catch (e) {
      console.error("Directory organization search failed", e);
    }
  }

  return hits;
}

type AnimalPickLite = {
  id: number;
  name: string;
  species: SpeciesWire;
  sex: "FEMALE" | "MALE";
};

async function fetchAnimals(
  api: OffspringRootApi | null,
  opts: { q?: string; species?: SpeciesWire; sex?: "FEMALE" | "MALE"; limit?: number }
): Promise<AnimalPickLite[]> {
  if (!api) return [];
  const res = await api.animals.list({
    q: opts.q,
    species: opts.species,
    sex: opts.sex,
    limit: opts.limit ?? 25,
  });
  const raw: any[] = Array.isArray(res) ? res : res?.items ?? [];
  return raw.map((a) => ({
    id: Number(a.id),
    name: String(a.name ?? "").trim(),
    species: String(a.species ?? "DOG").toUpperCase() as SpeciesWire,
    sex: String(a.sex ?? "FEMALE").toUpperCase() as "FEMALE" | "MALE",
  }));
}


export type OffspringStatus =
  | "PLANNED"
  | "BORN"
  | "AVAILABLE"
  | "RESERVED"
  | "PLACED"
  | "HOLDBACK"
  | "DECEASED";

export type OffspringBuyerKind = "contact" | "organization";

export type OffspringBuyerLite = {
  kind: OffspringBuyerKind;
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
};

export type HealthEvent = {
  id: number;
  kind: string;
  occurredAt: string;
  notes?: string | null;
  weightOz?: number | null;
};

export type OffspringMediaKind = "photo" | "video" | "doc";

export type OffspringMedia = {
  id: number;
  kind: OffspringMediaKind;
  label: string;
  url: string;
  mimeType?: string | null;
  bytes?: number | null;
};

export type OffspringLineageRow = {
  id: number;
  role: "dam" | "sire" | "self";
  name: string;
  registrationId?: string | null;
};

export type InvoiceLink = {
  id: number;
  invoiceId: number;
  invoiceNumber: string;
  status: string;
  amount: number;
};

export type SiblingLite = {
  id: number;
  name: string | null;
  sex: Sex | null;
  status: OffspringStatus | null;
};

export type WaitlistRefLite = {
  id: number;
  label: string;
  priority?: number | null;
  status?: string | null;
};

export type OffspringRow = {
  id: number;
  name: string;
  sex: string | null;
  status: string | null;
  species: string | null;
  breed: string | null;
  color: string | null;
  birthWeightOz: number | null;
  dob: string | null;
  microchip: string | null;
  registrationId: string | null;
  placementDate: string | null;
  placementStatus: string | null;
  placementState: PlacementState | null;
  lifeState: LifeState | null;
  keeperIntent: KeeperIntent | null;
  financialState: FinancialState | null;
  paperworkState: PaperworkState | null;
  diedAt: string | null;
  placedAt: string | null;
  paidInFullAt: string | null;
  contractId: string | null;
  contractSignedAt: string | null;
  price: number | null;
  buyerId: number | null;
  buyerKind: "contact" | "organization" | null;
  buyerName: string | null;
  buyerContactId?: number | null;
  buyerOrganizationId?: number | null;
  notes: string | null;
  groupId: number | null;
  groupLabel: string | null;

  // Group-related fields
  groupName?: string | null;
  groupCode?: string | null;
  groupSeasonLabel?: string | null;
  identifier?: string | null;
  placeholderLabel?: string | null;

  // Siblings and waitlist
  siblings?: SiblingLite[] | null;
  waitlistEntry?: WaitlistRefLite | null;
  group?: { id: number; name?: string; code?: string } | null;

  // new fields
  whelpingCollarColor: string | null;
  riskScore: string | null;
  promotedAnimalId?: number | null;
};


type OffspringListInput = {
  page: number;
  pageSize: number;
  q?: string;
  status?: OffspringStatus;
  sex?: Sex;
  groupId?: number;
};

type OffspringListResult = {
  rows: OffspringRow[];
  total: number;
};

export type OffspringUpdateInput = Partial<{
  name: string | null;
  sex: Sex | null;
  color: string | null;
  birthWeightOz: number | null;
  status: OffspringStatus;
  buyerPartyId: number | null;
  buyerContactId: number | null;  // @deprecated Phase 3: Use buyerPartyId
  buyerOrganizationId: number | null;  // @deprecated Phase 3: Use buyerPartyId
  placementDate: string | null;
  price: number | null;
  microchip: string | null;
  registrationId: string | null;
  notes: string | null;
  lifeState: LifeState | null;
  placementState: PlacementState | null;
  keeperIntent: KeeperIntent | null;
  financialState: FinancialState | null;
  paperworkState: PaperworkState | null;
  diedAt: string | null;
  placedAt: string | null;
  paidInFullAt: string | null;
  contractId: string | null;
  contractSignedAt: string | null;
  promotedAnimalId: number | null;

  species: Species | string | null;
  breed: string | null;
  dob: string | null;

  groupId: number | null;
  litterId: number | null;
  unlinkedOverride: boolean | null;

  whelpingCollarColor: string | null;
  riskScore: string | null;
}>;

export type HealthEventInput = {
  occurredAt: string;
  kind: string;
  notes?: string;
  weightOz?: number | null;
};

export type InvoiceLinkInput = {
  invoiceNumber: string;
  amount: number;
  status: string;
};

type OffspringApi = {
  list(input: OffspringListInput): Promise<OffspringListResult>;
  getById(id: number): Promise<OffspringRow>;
  create(
    input: OffspringUpdateInput & { groupId?: number | null },
  ): Promise<OffspringRow>;
  update(id: number, patch: OffspringUpdateInput): Promise<OffspringRow>;
  remove(id: number): Promise<void>;

  addHealthEvent(id: number, input: HealthEventInput): Promise<OffspringRow>;
  linkInvoice(id: number, input: InvoiceLinkInput): Promise<OffspringRow>;
};

function centsToDollars(cents: number | null | undefined): number | null {
  if (cents == null) return null;
  return Math.round(cents) / 100;
}

function mapAnimalLiteToRow(dto: AnimalLite): OffspringRow {
  const {
    id,
    name,
    sex,
    status,
    species,
    breed,
    color,
    birthDate,
    microchip,
    registryNumber,
    litterId,
    litterCode,
    litterName,
    buyerName,
    buyerId,
    buyerOrgId,
    price_cents,
    sold_at,
    notes,

    // optional, coming from the API if present
    birth_weight_oz,
    placement_status,
    whelping_collar_color,
    risk_score,
  } = dto as any;

  const placementStateRaw =
    (dto as any).placementState ??
    (dto as any).placement_state ??
    placement_status ??
    null;
  const lifeStateRaw =
    (dto as any).lifeState ??
    (dto as any).life_state ??
    null;
  const keeperIntentRaw =
    (dto as any).keeperIntent ??
    (dto as any).keeper_intent ??
    null;
  const financialStateRaw =
    (dto as any).financialState ??
    (dto as any).financial_state ??
    null;
  const paperworkStateRaw =
    (dto as any).paperworkState ??
    (dto as any).paperwork_state ??
    null;
  const diedAt = isoDateString(
    (dto as any).diedAt ??
    (dto as any).died_at ??
    null,
  );
  const placedAt = isoDateString(
    (dto as any).placedAt ??
    (dto as any).placed_at ??
    null,
  );
  const paidInFullAt = isoDateString(
    (dto as any).paidInFullAt ??
    (dto as any).paid_in_full_at ??
    null,
  );
  const contractSignedAt = isoDateString(
    (dto as any).contractSignedAt ??
    (dto as any).contract_signed_at ??
    null,
  );
  const contractId =
    (dto as any).contractId ??
    (dto as any).contract_id ??
    null;
  const promotedAnimalId =
    (dto as any).promotedAnimalId ??
    (dto as any).promoted_animal_id ??
    null;
  const buyerContactId =
    (dto as any).buyerContactId ??
    (dto as any).buyer_contact_id ??
    null;
  const buyerOrganizationId =
    (dto as any).buyerOrganizationId ??
    (dto as any).buyer_organization_id ??
    null;

  const placementState = normalizeState(placementStateRaw);
  const lifeState = normalizeState(lifeStateRaw);
  const keeperIntent = normalizeState(keeperIntentRaw);
  const financialState = normalizeState(financialStateRaw);
  const paperworkState = normalizeState(paperworkStateRaw);

  return {
    id: Number(id),
    name: name ?? "",
    sex: sex ?? null,
    status: status ?? null,
    species: species ?? null,
    breed: typeof breed === "string" ? breed : null,
    color: color ?? null,
    birthWeightOz:
      typeof birth_weight_oz === "number" ? birth_weight_oz : null,
    dob: birthDate ?? null,
    microchip: microchip ?? null,
    registrationId: registryNumber ?? null,
    placementDate: sold_at ?? null,
    placementStatus: placement_status ?? null,
    placementState,
    lifeState,
    keeperIntent,
    financialState,
    paperworkState,
    diedAt,
    placedAt,
    paidInFullAt,
    contractId,
    contractSignedAt,
    price: centsToDollars(price_cents),

    buyerId: buyerId ?? buyerOrgId ?? null,
    buyerContactId: buyerContactId ?? buyerId ?? null,
    buyerOrganizationId: buyerOrganizationId ?? buyerOrgId ?? null,
    buyerKind: buyerId
      ? "contact"
      : buyerOrgId
        ? "organization"
        : null,
    buyerName: buyerName ?? null,

    notes: notes ?? null,

    groupId: litterId ?? null,
    groupLabel:
      litterName ??
      litterCode ??
      (litterId != null ? `Group #${litterId}` : null),

    whelpingCollarColor:
      whelping_collar_color ??
      (dto as any).whelpingCollarColor ??
      (dto as any).collarColorName ??
      null,
    riskScore:
      risk_score ??
      (dto as any).riskScore ??
      null,
    promotedAnimalId:
      promotedAnimalId != null ? Number(promotedAnimalId) : null,
  };
}

function mapDetailToRow(detail: any): OffspringRow {
  const base = mapAnimalLiteToRow(detail as any);
  return {
    ...base,
    buyer: (detail as any).buyer ?? null,
    buyerRiskScore:
      (detail as any).buyerRiskScore ??
      (detail as any).buyer_risk_score ??
      null,
    group: (detail as any).group ?? null,
    healthSummary:
      (detail as any).healthSummary ??
      (detail as any).health_summary ??
      null,
    mediaSummary:
      (detail as any).mediaSummary ??
      (detail as any).media_summary ??
      null,
    invoiceSummary:
      (detail as any).invoiceSummary ??
      (detail as any).invoice_summary ??
      null,
    crossRefs:
      (detail as any).crossRefs ??
      (detail as any).cross_refs ??
      null,
  } as OffspringRow;
}

function makeBackendOffspringApi(): OffspringApi {
  const client = makeOffspringApiClient() as any;

  if (!client?.individuals) {
    throw new Error(
      "[OffspringPage] Offspring API client is misconfigured. Expected client.individuals to exist.",
    );
  }

  const svc = client.individuals;
  const tenantId = readTenantIdFast();

  return {
    async list(input) {
      const pageSize = input?.pageSize ?? 50;

      const res = await svc.list({
        tenantId,
        limit: pageSize,
        q: input?.q ?? undefined,
        status: input?.status ?? undefined,
        sex: input?.sex ?? undefined,
        groupId: input?.groupId ?? undefined,
      });

      const items: AnimalLite[] = Array.isArray((res as any)?.items)
        ? (res as any).items
        : Array.isArray(res as any)
          ? (res as any)
          : [];

      const rows = items.map(mapAnimalLiteToRow);
      const total = (res as any)?.total ?? rows.length;

      return { rows, total };
    },

    async getById(id) {
      const dto = await svc.get(id, { tenantId });
      return mapDetailToRow(dto);
    },

    async create(input) {
      // mirror the working App-Offspring Add Offspring call
      const dto = await svc.create({
        ...input,
      });
      return mapAnimalLiteToRow(dto);
    },

    async update(id, patch) {
      // send a flat patch body, no "patch" wrapper
      const dto = await svc.update(id, {
        ...patch,
      });
      return mapAnimalLiteToRow(dto);
    },

    async remove(id) {
      await svc.remove(id, { tenantId });
    },

    async addHealthEvent(id, input) {
      const detail = await svc.addHealthEvent(id, input, { tenantId });
      return mapDetailToRow(detail);
    },

    async linkInvoice(id, input) {
      const detail = await svc.linkInvoice(id, input, { tenantId });
      return mapDetailToRow(detail);
    },
  };
}

function makeLocalFallbackApi(): OffspringApi {
  return {
    async list() {
      return { rows: [], total: 0 };
    },
    async getById() {
      throw new Error("getById not available without backend API");
    },
    async create() {
      throw new Error("create not available without backend API");
    },
    async update() {
      throw new Error("update not available without backend API");
    },
    async remove() {
      throw new Error("remove not available without backend API");
    },
    async addHealthEvent() {
      throw new Error("addHealthEvent not available without backend API");
    },
    async linkInvoice() {
      throw new Error("linkInvoice not available without backend API");
    },
  };
}

function useOffspringApi(): OffspringApi {
  // Server side, only used for initial render, never to actually call the API.
  if (typeof window === "undefined") {
    return {
      list: async () => ({ rows: [], total: 0 }),
      getById: async () => {
        throw new Error("Offspring API not available on server");
      },
      create: async () => {
        throw new Error("Offspring API not available on server");
      },
      update: async () => {
        throw new Error("Offspring API not available on server");
      },
      remove: async () => {
        throw new Error("Offspring API not available on server");
      },
      addHealthEvent: async () => {
        throw new Error("Offspring API not available on server");
      },
      linkInvoice: async () => {
        throw new Error("Offspring API not available on server");
      },
    };
  }

  // Client side, use the real backend adapter.
  const ref = React.useRef<OffspringApi | null>(null);
  if (!ref.current) {
    ref.current = makeBackendOffspringApi();
  }
  return ref.current;
}

function useOffspringGroupOptions(active: boolean): GroupOption[] {
  const [groups, setGroups] = React.useState<GroupOption[]>([]);

  React.useEffect(() => {
    if (!active) return;
    if (typeof window === "undefined") return;

    let cancelled = false;

    async function load() {
      try {
        const root = makeOffspringApiClient() as any;
        const groupsClient = root?.groups;

        if (!groupsClient || typeof groupsClient.list !== "function") {
          console.warn("Offspring API client or groups.list not found");
          return;
        }

        const res: any = await groupsClient.list({
          limit: 500,
          q: "",
        });

        const items: any[] =
          Array.isArray(res?.items)
            ? res.items
            : Array.isArray(res?.rows)
              ? res.rows
              : Array.isArray(res)
                ? res
                : [];

        const mapped: GroupOption[] = items
          .map((g: OffspringGroupDTO | any) => {
            if (!g || g.id == null) return null;

            const idNum = Number(g.id);
            if (!Number.isFinite(idNum)) return null;

            const plan = g.plan ?? g.breedingPlan ?? null;

            const planName =
              typeof plan?.name === "string" && plan.name.trim()
                ? plan.name.trim()
                : null;

            const identifier =
              typeof g.identifier === "string" && g.identifier.trim()
                ? g.identifier.trim()
                : null;

            const groupName =
              planName ??
              (typeof g.name === "string" && g.name.trim() ? g.name.trim() : null) ??
              identifier ??
              null;

            const label = groupName && groupName.length > 0
              ? groupName
              : `Group #${idNum}`;

            // Try to read species from the group or its plan
            const rawSpecies =
              (g as any).species ??
              (plan as any)?.species ??
              (g as any).breeding_plan_species ??
              null;

            let species: SpeciesWire | null = null;
            if (rawSpecies) {
              const s = String(rawSpecies).toUpperCase();
              if (s === "DOG" || s === "CAT" || s === "HORSE") {
                species = s as SpeciesWire;
              }
            }

            // Try to read breed from the group or its plan
            const rawBreed =
              (g as any).breedName ??
              (g as any).breed ??
              (plan as any)?.breedName ??
              (plan as any)?.breed ??
              (g as any).breeding_plan_breed ??
              null;

            const breed =
              typeof rawBreed === "string" && rawBreed.trim().length > 0
                ? rawBreed.trim()
                : null;

            return { id: idNum, label, species, breed };
          })
          .filter(Boolean) as GroupOption[];

        const sorted = mapped.slice().sort((a, b) => {
          const la = a.label.toLowerCase();
          const lb = b.label.toLowerCase();
          if (la < lb) return -1;
          if (la > lb) return 1;
          return a.id - b.id;
        });

        if (!cancelled) {
          setGroups(sorted);
        }
      } catch (err) {
        console.error("[Offspring] Failed to load groups for parent select", err);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [active]);

  return groups;
}


/** ---------- Helpers ---------- */

const CENTER_KEYS = new Set([
  "sex",
  "status",
  "birthWeightOz",
  "placementDate",
  "price",
  "whelpingCollarColor",
]);

const placementStateOptions: Array<{ value: PlacementState; label: string }> = [
  { value: "UNASSIGNED", label: "Available" },
  { value: "OPTION_HOLD", label: "On Hold" },
  { value: "RESERVED", label: "Reserved" },
  { value: "PLACED", label: "Placed" },
  { value: "RETURNED", label: "Returned" },
  { value: "TRANSFERRED", label: "Transferred" },
];

const financialStateOptions: Array<{ value: FinancialState; label: string }> = [
  { value: "NONE", label: "None" },
  { value: "DEPOSIT_PENDING", label: "Deposit pending" },
  { value: "DEPOSIT_PAID", label: "Deposit paid" },
  { value: "PAID_IN_FULL", label: "Paid in full" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "CHARGEBACK", label: "Chargeback" },
];

const paperworkStateOptions: Array<{ value: PaperworkState; label: string }> = [
  { value: "NONE", label: "None" },
  { value: "SENT", label: "Contract sent" },
  { value: "SIGNED", label: "Contract signed" },
  { value: "COMPLETE", label: "Complete" },
];

const lifeStateOptions: Array<{ value: LifeState; label: string }> = [
  { value: "ALIVE", label: "Alive" },
  { value: "DECEASED", label: "Deceased" },
];

const keeperIntentOptions: Array<{ value: KeeperIntent; label: string }> = [
  { value: "AVAILABLE", label: "Available" },
  { value: "UNDER_EVALUATION", label: "Under evaluation" },
  { value: "WITHHELD", label: "Withheld" },
  { value: "KEEP", label: "Keeper" },
];

const ALL_COLUMNS = [
  { key: "name", label: "Name", default: true },
  { key: "sex", label: "Sex", default: true },
  { key: "breed", label: "Breed", default: true },
  { key: "whelpingCollarColor", label: "Collar", default: true },
  { key: "group", label: "Group", default: true },
  { key: "color", label: "Color", default: false },
  { key: "buyer", label: "Buyer", default: true },
  { key: "status", label: "Status", default: true },
  { key: "lifeState", label: "Life", default: true },
  { key: "placementState", label: "Placement", default: true },
  { key: "keeperIntent", label: "Keeper", default: true },
  { key: "financialState", label: "Financial", default: false },
  { key: "paperworkState", label: "Paperwork", default: false },
  { key: "diedAt", label: "Died", default: false },
  { key: "placedAt", label: "Placed date", default: false },
  { key: "paidInFullAt", label: "Paid date", default: false },
  { key: "contractSignedAt", label: "Contract date", default: false },
  { key: "birthWeightOz", label: "Birth wt (oz)", default: false },
  { key: "dob", label: "DOB", default: true },
  { key: "placementDate", label: "Placement", default: true },
  { key: "price", label: "Price", default: true },
  { key: "microchip", label: "Microchip", default: false },
  { key: "registrationId", label: "Registration", default: false },
] as const;

const SORT_OPTIONS: SortOption[] = [
  { key: "name", label: "Name" },
  { key: "sex", label: "Sex" },
  { key: "breed", label: "Breed" },
  { key: "group", label: "Group" },
  { key: "buyer", label: "Buyer" },
  { key: "placementState", label: "Placement Status" },
  { key: "dob", label: "Date of Birth" },
  { key: "placementDate", label: "Placement Date" },
  { key: "price", label: "Price" },
  { key: "placedAt", label: "Placed Date" },
  { key: "paidInFullAt", label: "Paid Date" },
];

const OFFSPRING_STORAGE_KEY = "bhq_offspring_cols_v2";


type ColumnKey = (typeof ALL_COLUMNS)[number]["key"];

function formatDate(v?: string | null): string {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function moneyFmt(n?: number | null): string {
  if (n == null) return "-";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
  } catch {
    return `$${Number(n).toFixed(2)}`;
  }
}

function isoDateString(value: any): string | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    return typeof value === "string" ? value : null;
  }
  return d.toISOString();
}

function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().slice(0, 10);
}

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function prettyStatus(s: Status): string {
  switch (s) {
    case "PLANNED":
      return "Planned";
    case "BORN":
      return "Born";
    case "AVAILABLE":
      return "Available";
    case "RESERVED":
      return "Reserved";
    case "PLACED":
      return "Placed";
    case "HOLDBACK":
      return "Holdback";
    case "DECEASED":
      return "Deceased";
    default:
      return String(s);
  }
}

function prettyLifeState(s?: LifeState | null): string {
  if (!s) return "-";
  const found = lifeStateOptions.find((opt) => opt.value === s);
  return found?.label ?? String(s);
}

function prettyPlacementState(s?: PlacementState | null): string {
  if (!s) return "-";
  const found = placementStateOptions.find((opt) => opt.value === s);
  return found?.label ?? String(s);
}

function prettyKeeperIntent(s?: KeeperIntent | null): string {
  if (!s) return "-";
  const found = keeperIntentOptions.find((opt) => opt.value === s);
  return found?.label ?? String(s);
}

function prettyFinancialState(s?: FinancialState | null): string {
  if (!s) return "-";
  const found = financialStateOptions.find((opt) => opt.value === s);
  return found?.label ?? String(s);
}

function prettyPaperworkState(s?: PaperworkState | null): string {
  if (!s) return "-";
  const found = paperworkStateOptions.find((opt) => opt.value === s);
  return found?.label ?? String(s);
}

function prettySpecies(s?: Species | string | null): string {
  if (!s) return "Not set";
  const v = String(s).toUpperCase();
  if (v === "DOG") return "Dog";
  if (v === "CAT") return "Cat";
  if (v === "HORSE") return "Horse";
  return String(s);
}

function prettySex(s?: Sex | string | null): string {
  if (!s) return "Not set";
  const v = String(s).toUpperCase();
  if (v === "MALE") return "Male";
  if (v === "FEMALE") return "Female";
  if (v === "UNKNOWN") return "Unknown";
  return String(s);
}

function normalizeState(value?: string | null): string | null {
  if (value == null) return null;
  return String(value).toUpperCase();
}

function titleize(value?: string | null): string {
  if (!value) return "";
  return value
    .toString()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getPlacementLabel(state?: PlacementState | null): string | null {
  const normalized = normalizeState(state);
  switch (normalized) {
    case "UNASSIGNED":
      return "Available";
    case "OPTION_HOLD":
      return "On Hold";
    case "RESERVED":
      return "Reserved";
    case "PLACED":
      return "Placed";
    case "RETURNED":
      return "Returned";
    case "TRANSFERRED":
      return "Transferred";
    case "DEPOSIT_ONLY":
      return "Reserved";
    case "NOT_PLACED":
    case "PLANNED":
    case "BORN":
    case "AVAILABLE":
      return "Available";
    default:
      return normalized ? titleize(normalized) : null;
  }
}

function getPlacementVariant(state?: PlacementState | null): BadgeVariant {
  const normalized = normalizeState(state);
  if (normalized === "PLACED") return "green";
  if (normalized === "RESERVED" || normalized === "OPTION_HOLD") return "amber";
  if (normalized === "RETURNED" || normalized === "TRANSFERRED") return "blue";
  return "neutral";
}

function getLifeChip(lifeState?: LifeState | null, diedAt?: string | null): StatusChip | null {
  const normalized = normalizeState(lifeState);
  if (normalized === "DECEASED") {
    const diedAtLabel = diedAt ? formatDate(diedAt) : null;
    return {
      label: "Deceased",
      variant: "red",
      title: diedAtLabel ? `Died ${diedAtLabel}` : undefined,
    };
  }
  return null;
}

function getKeeperChip(keeperIntent?: KeeperIntent | null): StatusChip | null {
  const normalized = normalizeState(keeperIntent);
  if (normalized === "AVAILABLE") {
    return { label: "Available", variant: "green" };
  }
  if (normalized === "KEEP" || normalized === "KEEPER") {
    return { label: "Keeper", variant: "blue" };
  }
  if (normalized === "RESERVED") {
    return { label: "Reserved", variant: "amber" };
  }
  if (normalized === "WITHHELD" || normalized === "UNDER_EVALUATION") {
    return { label: "Withheld", variant: "amber" };
  }
  return null;
}

function getFinancialChip(financialState?: FinancialState | null): StatusChip | null {
  const normalized = normalizeState(financialState);
  switch (normalized) {
    case "DEPOSIT_PENDING":
      return { label: "Deposit Pending", variant: "amber" };
    case "DEPOSIT_PAID":
      return { label: "Deposit Paid", variant: "blue" };
    case "PAID_IN_FULL":
      return { label: "Paid", variant: "green" };
    default:
      return null;
  }
}

function getPaperworkChip(paperworkState?: PaperworkState | null): StatusChip | null {
  const normalized = normalizeState(paperworkState);
  switch (normalized) {
    case "SENT":
      return { label: "Contract Sent", variant: "amber" };
    case "SIGNED":
      return { label: "Contract Signed", variant: "blue" };
    case "COMPLETE":
      return { label: "Complete", variant: "green" };
    default:
      return null;
  }
}

function buildOffspringStatusPresentation(offspring: Partial<OffspringRow>): {
  primaryBadge: StatusBadge | null;
  chips: StatusChip[];
} {
  const placementState =
    normalizeState((offspring as any)?.placementState ?? (offspring as any)?.placement_state) ??
    normalizeState((offspring as any)?.placementStatus ?? (offspring as any)?.placement_status);
  const lifeState =
    normalizeState((offspring as any)?.lifeState ?? (offspring as any)?.life_state);
  const keeperIntent =
    normalizeState((offspring as any)?.keeperIntent ?? (offspring as any)?.keeper_intent);
  const financialState =
    normalizeState((offspring as any)?.financialState ?? (offspring as any)?.financial_state);
  const paperworkState =
    normalizeState((offspring as any)?.paperworkState ?? (offspring as any)?.paperwork_state);
  const diedAt = (offspring as any)?.diedAt ?? (offspring as any)?.died_at ?? null;

  const primaryBadge: StatusBadge | null =
    lifeState === "DECEASED"
      ? null
      : {
          label: getPlacementLabel(placementState) ?? "Placement not set",
          variant: getPlacementVariant(placementState),
        };

  const chips: StatusChip[] = [];

  const lifeChip = getLifeChip(lifeState, diedAt);
  if (lifeChip) chips.push(lifeChip);

  const keeperChip = getKeeperChip(keeperIntent);
  if (keeperChip) chips.push(keeperChip);

  const financialChip = getFinancialChip(financialState);
  if (financialChip) chips.push(financialChip);

  const paperworkChip = getPaperworkChip(paperworkState);
  if (paperworkChip) chips.push(paperworkChip);

  return { primaryBadge, chips };
}

const primaryBadgeClass =
  "min-h-[24px] px-3 py-1.5 text-[13px] leading-5 font-semibold border border-primary/60 bg-primary/15 shadow-sm";
const chipBadgeClass = "text-[11px] px-2 py-0.5 leading-4";

function formatFinancialStateLabel(financialState?: FinancialState | null): string {
  const normalized = normalizeState(financialState);
  switch (normalized) {
    case "DEPOSIT_PENDING":
      return "Pending";
    case "DEPOSIT_PAID":
      return "Paid";
    case "PAID_IN_FULL":
      return "Paid in full";
    case "REFUNDED":
      return "Refunded";
    case "CHARGEBACK":
      return "Chargeback";
    case "NONE":
    case null:
      return "None";
    default:
      return titleize(financialState) || "None";
  }
}

function formatPaperworkStateLabel(paperworkState?: PaperworkState | null): string {
  const normalized = normalizeState(paperworkState);
  switch (normalized) {
    case "SENT":
      return "Sent";
    case "SIGNED":
      return "Signed";
    case "COMPLETE":
      return "Complete";
    case "NONE":
    case null:
      return "None";
    default:
      return titleize(paperworkState) || "None";
  }
}

function getBuyerSectionTitle(placementState?: PlacementState | null): string {
  const normalized = normalizeState(placementState);
  if (normalized === "PLACED") return "Buyer (Placed)";
  if (normalized === "RETURNED") return "Buyer (Returned)";
  if (normalized === "TRANSFERRED") return "Buyer (Transferred)";
  if (normalized === "RESERVED" || normalized === "OPTION_HOLD") return "Buyer (Reserved)";
  return "Buyer (Unassigned)";
}

const isDevRuntime =
  typeof window !== "undefined" &&
  (typeof (globalThis as any).process === "undefined" || ((globalThis as any).process as any)?.env?.NODE_ENV !== "production");

if (isDevRuntime) {
  const deceased = buildOffspringStatusPresentation({
    lifeState: "DECEASED",
    placementState: "UNASSIGNED",
  } as Partial<OffspringRow>);
  if (
    !deceased.chips.some((c) => c.label === "Deceased") ||
    (deceased.primaryBadge && deceased.primaryBadge.label === "Available")
  ) {
    console.warn("[Offspring] Deceased status presentation is missing required dominance.");
  }
  const placed = buildOffspringStatusPresentation({ placementState: "PLACED" } as Partial<OffspringRow>);
  if (placed.primaryBadge?.label !== "Placed") {
    console.warn("[Offspring] Placement badge regression detected for PLACED state.");
  }
}

/** ---------- Offspring Tags Section ---------- */

function OffspringTagsSection({
  offspringId,
  api,
  disabled = false,
}: {
  offspringId: number;
  api: any;
  disabled?: boolean;
}) {
  const [availableTags, setAvailableTags] = React.useState<TagOption[]>([]);
  const [selectedTags, setSelectedTags] = React.useState<TagOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load tags on mount
  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load available tags for OFFSPRING module
        const availableRes = await api.tags.list({ module: "OFFSPRING", limit: 200 });
        const availableItems = availableRes?.items || [];
        const available = availableItems.map((t: any) => ({
          id: Number(t.id),
          name: String(t.name),
          color: t.color ?? null,
        }));
        if (!cancelled) setAvailableTags(available);

        // Load currently assigned tags
        const assignedRes = await api.tags.listForOffspring(offspringId);
        const assignedItems = Array.isArray(assignedRes) ? assignedRes : (assignedRes?.items || []);
        const assigned = assignedItems.map((t: any) => ({
          id: Number(t.id),
          name: String(t.name),
          color: t.color ?? null,
        }));
        if (!cancelled) setSelectedTags(assigned);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load tags");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [api, offspringId]);

  const handleSelect = React.useCallback(async (tag: TagOption) => {
    // Optimistic update
    setSelectedTags((prev) => [...prev, tag]);
    setError(null);

    try {
      await api.tags.assign(tag.id, { offspringId });
    } catch (e: any) {
      // Rollback on error
      setSelectedTags((prev) => prev.filter((t) => t.id !== tag.id));
      setError(e?.message || "Failed to assign tag");
    }
  }, [api, offspringId]);

  const handleRemove = React.useCallback(async (tag: TagOption) => {
    // Optimistic update
    setSelectedTags((prev) => prev.filter((t) => t.id !== tag.id));
    setError(null);

    try {
      await api.tags.unassign(tag.id, { offspringId });
    } catch (e: any) {
      // Rollback on error
      setSelectedTags((prev) => [...prev, tag]);
      setError(e?.message || "Failed to remove tag");
    }
  }, [api, offspringId]);

  const handleCreate = React.useCallback(async (name: string): Promise<TagOption> => {
    const created = await api.tags.create({ name, module: "OFFSPRING" });
    const newTag: TagOption = {
      id: Number(created.id),
      name: String(created.name),
      color: created.color ?? null,
    };
    // Add to available tags list
    setAvailableTags((prev) => [...prev, newTag]);
    return newTag;
  }, [api]);

  return (
    <TagPicker
      availableTags={availableTags}
      selectedTags={selectedTags}
      onSelect={handleSelect}
      onRemove={handleRemove}
      onCreate={handleCreate}
      loading={loading}
      error={error}
      placeholder="Add tags..."
      disabled={disabled}
    />
  );
}


/** ---------- Create Offspring overlay ---------- */

function CreateOffspringOverlayContent({
  open,
  onClose,
  onCreate,
  rootApi,
  groupOptions,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: Partial<OffspringRow>) => Promise<void> | void;
  rootApi: OffspringRootApi | null;
  groupOptions: GroupOption[];
}) {
  const [form, setForm] = React.useState<Partial<OffspringRow>>({
    name: "",
    sex: "UNKNOWN" as Sex,
    species: "DOG" as Species,
    birthWeightOz: null,
    price: null,
    notes: "",
    groupId: null,
    breed: null,
    whelpingCollarColor: null,
  });

  const [allowNoGroup, setAllowNoGroup] = React.useState(false);
  const [showWhelpPalette, setShowWhelpPalette] = React.useState(false);

  const whelpingCollarValue = form.whelpingCollarColor;

  const whelpingCollarLabel =
    whelpingCollarValue && String(whelpingCollarValue).trim().length
      ? String(whelpingCollarValue)
      : "Not set";

  const panelRef = React.useRef<HTMLDivElement | null>(null);

  // derive UI species string for BreedCombo
  const speciesUi: SpeciesUi | "" =
    form.species === "DOG"
      ? "Dog"
      : form.species === "CAT"
        ? "Cat"
        : form.species === "HORSE"
          ? "Horse"
          : "";

  // local breed hit for BreedCombo
  const [breedHit, setBreedHit] = React.useState<any>(null);
  const [breedNonce, setBreedNonce] = React.useState(0);

  const onBreedPick = React.useCallback(
    (hit: any) => {
      setBreedHit(hit ? { ...hit } : null);
      setBreedNonce((n) => n + 1);
      setForm((prev) => ({
        ...prev,
        breed:
          hit && typeof hit.name === "string" && hit.name.trim()
            ? hit.name
            : null,
      }));
    },
    [setForm],
  );

  // Filter parent group choices by current species
  const currentSpecies = (form.species ?? "DOG") as Species;
  const filteredGroupOptions = React.useMemo(
    () =>
      groupOptions.filter((g) => {
        if (!g.species) return true;
        return (
          String(g.species).toUpperCase() ===
          String(currentSpecies).toUpperCase()
        );
      }),
    [groupOptions, currentSpecies],
  );

  const parentGroupRequired = !allowNoGroup;

  // Dim whenever a parent group is required and no group is selected
  const dimRest = parentGroupRequired && (form.groupId == null);

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  // Reset override when dialog closes
  React.useEffect(() => {
    if (!open) {
      setAllowNoGroup(false);
    }
  }, [open]);

  const handleChange = <K extends keyof OffspringRow>(
    key: K,
    value: OffspringRow[K] | null,
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreate) return;

    const trimmedName = (form.name ?? "").toString().trim();
    if (!trimmedName) {
      return;
    }

    // Resolve group id from the form
    const effectiveGroupId =
      form.groupId !== undefined && form.groupId !== null
        ? form.groupId
        : null;

    // Current backend schema requires a groupId on create
    if (effectiveGroupId == null) {
      window.alert(
        "Parent group is required for offspring creation with the current schema. Select a parent group before saving.",
      );
      return;
    }

    // Start from form state (ignore status, backend will default as needed)
    const { status, ...rest } = form;

    const payload: any = {
      ...rest,
      name: trimmedName,
      groupId: effectiveGroupId,
      litterId: effectiveGroupId,
    };

    if (rest.dob) {
      payload.birthDate = rest.dob;
      delete payload.dob;
    }

    // Do not send UNKNOWN sex
    if (rest.sex === "UNKNOWN") {
      delete payload.sex;
    }

    // Force species and breed from the selected parent group
    const selectedGroup = groupOptions.find((g) => g.id === effectiveGroupId);
    if (selectedGroup) {
      if (selectedGroup.species) {
        payload.species = selectedGroup.species;
      }
      if (selectedGroup.breed) {
        payload.breed = selectedGroup.breed;
      }
    }

    await onCreate(payload);
  };

  if (!open) return null;

  return (
    <Overlay
      open={open}
      ariaLabel="Create offspring"
      closeOnEscape
      closeOnOutsideClick
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <div
        className="fixed inset-0"
        style={{ zIndex: MODAL_Z, isolation: "isolate" }}
        onMouseDown={(e) => {
          const panel = panelRef.current;
          if (!panel) return;
          if (!panel.contains(e.target as Node)) {
            onClose();
          }
        }}
      >
        {/* Backdrop, same vibe as details drawer */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Centered panel */}
        <div className="absolute inset-0 flex items-center justify-center overflow-y-auto">
          <div
            ref={panelRef}
            className="pointer-events-auto my-10 w-[820px] max-w-[95vw] max-h-[90vh] overflow-hidden rounded-xl border border-hairline bg-surface shadow-xl"
            onMouseDown={(e) => {
              // keep clicks inside the panel from bubbling to the outer close handler
              e.stopPropagation();
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
              <div className="text-lg font-semibold flex items-center gap-2">
                <FilePlus2 className="h-4 w-4" />
                <span>Add Offspring</span>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4 overflow-y-auto">
              {/* Parent group selection */}
              <div className="border border-hairline rounded-md p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-secondary uppercase tracking-wide">
                      Parent group
                    </div>
                    <div className={labelClass}>
                      Link this offspring to an existing group. Use the override only for
                      intentional one off records.
                    </div>
                  </div>

                  {groupOptions.length > 0 && (
                    <label className="inline-flex items-center gap-2 text-xs text-secondary">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-hairline bg-surface"
                        checked={allowNoGroup}
                        onChange={(e) => {
                          const checked = e.currentTarget.checked;
                          setAllowNoGroup(checked);
                          if (checked) {
                            // user explicitly allows no group, clear selection
                            handleChange("groupId", null as any);
                          }
                          // if they uncheck, we do not guess a group for them
                        }}
                      />
                      <span>Override - Create Orphan</span>
                    </label>
                  )}
                </div>

                {/* Identity fields that should stay active */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Name */}
                  <label className="grid gap-1 text-sm">
                    <span className="text-xs text-secondary">Name</span>
                    <input
                      className={inputClass}
                      value={form.name ?? ""}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="Enter the Offspring Name or a Placeholder"
                      autoComplete="off"
                      data-1p-ignore
                      data-lpignore="true"
                      data-form-type="other"
                    />
                  </label>

                  {/* Species */}
                  <label className="grid gap-1 text-sm">
                    <span className="text-xs text-secondary">Species</span>
                    <select
                      className={inputClass}
                      value={form.species ?? "DOG"}
                      onChange={(e) => {
                        const nextSpecies = e.target.value as Species;
                        setForm((prev) => {
                          const prevGroupId = prev.groupId ?? null;

                          // If the currently selected group has a species and it does not match,
                          // drop it when species changes.
                          let nextGroupId = prevGroupId;
                          if (prevGroupId != null) {
                            const currentGroup = groupOptions.find(
                              (g) => g.id === prevGroupId,
                            );
                            if (
                              currentGroup &&
                              currentGroup.species &&
                              String(currentGroup.species).toUpperCase() !==
                              String(nextSpecies).toUpperCase()
                            ) {
                              nextGroupId = null;
                            }
                          }

                          return {
                            ...prev,
                            species: nextSpecies,
                            groupId: nextGroupId,
                          };
                        });
                      }}
                    >
                      <option value="DOG">Dog</option>
                      <option value="CAT">Cat</option>
                      <option value="HORSE">Horse</option>
                    </select>
                  </label>
                </div>


                {filteredGroupOptions.length === 0 ? (
                  <div className="text-xs text-amber-300">
                    No offspring groups found for the selected species. Enable the override if you intend to create an orphan.
                  </div>
                ) : (
                  <label className="grid gap-1 text-sm mt-2">
                    <span className="text-xs text-secondary">
                      Parent group
                      {!allowNoGroup && <span className="text-rose-400 ml-1">*</span>}
                    </span>
                    <select
                      className={inputClass}
                      disabled={allowNoGroup}
                      value={form.groupId ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        handleChange("groupId", v ? (Number(v) as any) : null);
                      }}
                    >
                      <option value="">
                        {allowNoGroup ? "None" : "Select the Species - Then Choose an Existing Offspring Group..."}
                      </option>
                      {filteredGroupOptions.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              {/* Core fields */}
              <div
                className="transition-all"
                style={
                  dimRest
                    ? {
                      opacity: 0.25,
                      pointerEvents: "none",
                      filter: "blur(2px)",
                    }
                    : undefined
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                  {/* Sex */}
                  <label className="grid gap-1 text-sm">
                    <span className="text-xs text-secondary">Sex</span>
                    <select
                      className={inputClass}
                      value={form.sex ?? "UNKNOWN"}
                      onChange={(e) =>
                        handleChange("sex", e.target.value as any)
                      }
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="UNKNOWN">Unknown</option>
                    </select>
                  </label>

                  {/* Breed, only when no parent group is allowed */}
                  {allowNoGroup && (
                    <div className="grid gap-1 text-sm">
                      <span className="text-xs text-secondary">Breed</span>
                      {speciesUi ? (
                        <div>
                          <BreedCombo
                            key={`create-breed-${speciesUi}-${breedNonce}`}
                            species={speciesUi}
                            value={breedHit}
                            onChange={onBreedPick}
                            api={
                              rootApi
                                ? { breeds: { listCanonical: rootApi.breeds.listCanonical } }
                                : undefined
                            }
                          />
                        </div>
                      ) : (
                        <div className="h-9 px-3 flex items-center rounded-md border border-hairline bg-surface/60 text-sm text-secondary">
                          Select species
                        </div>
                      )}
                    </div>
                  )}

                  {/* Breed - only when no parent group is allowed */}
                  {allowNoGroup && (
                    <label className="grid gap-1 text-sm">
                      <span className="text-xs text-secondary">Breed</span>
                      <input
                        className={inputClass}
                        value={form.breed ?? ""}
                        onChange={(e) =>
                          handleChange("breed", e.target.value ? (e.target.value as any) : null)
                        }
                        placeholder="Enter breed when not linked to a group"
                        autoComplete="off"
                        data-1p-ignore
                        data-lpignore="true"
                        data-form-type="other"
                      />
                    </label>
                  )}


                  {/* Birth date, only when no parent group is allowed */}
                  {allowNoGroup && (
                    <label className="grid gap-1 text-sm">
                      <span className="text-xs text-secondary">Birth date</span>
                      <DatePicker
                        value={form.dob ?? ""}
                        onChange={(e) =>
                          handleChange("dob", e.currentTarget.value as any)
                        }
                        inputClassName={inputClass}
                      />
                    </label>
                  )}

                  {/* Birth weight */}
                  <label className="grid gap-1 text-sm">
                    <span className="text-xs text-secondary">
                      Birth weight (oz)
                    </span>
                    <input
                      type="number"
                      className={inputClass}
                      value={form.birthWeightOz ?? ""}
                      onChange={(e) =>
                        handleChange(
                          "birthWeightOz",
                          e.target.value
                            ? Number(e.target.value)
                            : null,
                        )
                      }
                      placeholder="Optional"
                      autoComplete="off"
                      data-1p-ignore
                      data-lpignore="true"
                      data-form-type="other"
                    />
                  </label>

                  {/* Price */}
                  <label className="grid gap-1 text-sm md:col-span-2">
                    <span className="text-xs text-secondary">
                      Price (whole number)
                    </span>
                    <input
                      type="number"
                      className={inputClass}
                      value={form.price ?? ""}
                      onChange={(e) =>
                        handleChange(
                          "price",
                          e.target.value
                            ? Number(e.target.value)
                            : null,
                        )
                      }
                      placeholder="$"
                      autoComplete="off"
                      data-1p-ignore
                      data-lpignore="true"
                      data-form-type="other"
                    />
                  </label>

                  {/* Whelping collar color */}
                  <label className="grid gap-1 text-sm md:col-span-2">
                    <span className="text-xs text-secondary">
                      Whelping Collar Color
                    </span>
                    <CollarPicker
                      value={form.whelpingCollarColor}
                      onChange={(colorLabel) => {
                        setForm((prev) => ({
                          ...prev,
                          whelpingCollarColor: colorLabel,
                        }));
                      }}
                      className="w-full max-w-xs"
                    />
                  </label>

                  {/* Notes */}
                  <label className="grid gap-1 text-sm md:col-span-2">
                    <span className="text-xs text-secondary">
                      Notes
                    </span>
                    <textarea
                      className={inputClass + " min-h-[100px] resize-y"}
                      value={form.notes ?? ""}
                      onChange={(e) =>
                        handleChange("notes", e.target.value as any)
                      }
                      placeholder="Optional notes about this offspring"
                      autoComplete="off"
                      data-1p-ignore
                      data-lpignore="true"
                      data-form-type="other"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-hairline">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={dimRest}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Overlay>
  );

}

function CrossRefsSection({
  row,
  onNavigateGroup,
  onNavigateOffspring,
  onNavigateWaitlist,
}: {
  row: OffspringRow;
  onNavigateGroup: (groupId: number) => void;
  onNavigateOffspring: (id: number) => void;
  onNavigateWaitlist: (id: number) => void;
}) {
  return (
    <div className="grid gap-4">
      {/* Parent group */}
      <div className="border rounded-md p-3">
        <div className="text-xs font-medium text-muted-foreground mb-1">
          Parent group
        </div>
        {row.groupId ? (
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm">
              <div className="font-medium">
                {row.groupName || row.groupCode || `Group #${row.groupId}`}
              </div>
              {row.groupSeasonLabel && (
                <div className={labelClass}>
                  {row.groupSeasonLabel}
                </div>
              )}
            </div>
            <Button
              size="xs"
              variant="outline"
              onClick={() => onNavigateGroup(row.groupId!)}
            >
              View group
            </Button>
          </div>
        ) : (
          <div className={labelClass}>
            No parent group linked.
          </div>
        )}
      </div>

      {/* Siblings */}
      <div className="border rounded-md p-3">
        <div className="text-xs font-medium text-muted-foreground mb-1">
          Siblings
        </div>
        {row.siblings && row.siblings.length ? (
          <ul className="space-y-1">
            {row.siblings.map((s: SiblingLite) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-medium">
                    {s.name || `Offspring #${s.id}`}
                  </div>
                  <div className="text-muted-foreground">
                    {[s.sex, s.status].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => onNavigateOffspring(s.id)}
                >
                  Open
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className={labelClass}>
            No siblings found for this group.
          </div>
        )}
      </div>

      {/* Waitlist */}
      <div className="border rounded-md p-3">
        <div className="text-xs font-medium text-muted-foreground mb-1">
          Waitlist
        </div>
        {row.waitlistEntry ? (
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm">
              <div className="font-medium">{row.waitlistEntry.label}</div>
              <div className={labelClass}>
                {[
                  row.waitlistEntry.priority != null
                    ? `Priority ${row.waitlistEntry.priority}`
                    : null,
                  row.waitlistEntry.status,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
            <Button
              size="xs"
              variant="outline"
              onClick={() => onNavigateWaitlist(row.waitlistEntry!.id)}
            >
              View waitlist
            </Button>
          </div>
        ) : (
          <div className={labelClass}>
            No waitlist entry linked to this offspring.
          </div>
        )}
      </div>
    </div>
  );
}

type GrowthSparklinePoint = {
  occurredAt: string;
  weightOz: number | null;
};

type GrowthSparklineProps = {
  series?: GrowthSparklinePoint[];
};

function GrowthSparkline({ series }: GrowthSparklineProps) {
  const points = React.useMemo(() => {
    const events = series ?? [];
    if (!events.length) return [];

    const weightEvents = events
      .filter((e) => e.weightOz != null)
      .sort(
        (a, b) =>
          new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
      );

    if (!weightEvents.length) return [];

    const xs = weightEvents.map((e) => new Date(e.occurredAt).getTime());
    const ys = weightEvents.map((e) => e.weightOz as number);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;

    const w = 220;
    const h = 60;
    const pad = 4;

    return weightEvents.map((e) => {
      const tx = (new Date(e.occurredAt).getTime() - minX) / spanX;
      const ty = ((e.weightOz as number) - minY) / spanY;
      const x = pad + tx * (w - pad * 2);
      const y = h - pad - ty * (h - pad * 2);
      return { x, y };
    });
  }, [series]);

  if (!points.length) {
    return (
      <div className={labelClass}>
        No weight log recorded yet.
      </div>
    );
  }

  const d = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <svg viewBox="0 0 220 60" className="w-full h-16">
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

/** ---------- Main component ---------- */

export default function OffspringPage(props: { embed?: boolean } = { embed: false }) {
  const { embed } = props;
  const api = useOffspringApi();
  const rootApi = React.useMemo<OffspringRootApi | null>(() => {
    try {
      return makeOffspringApiClient();
    } catch {
      return null;
    }
  }, []);

  // Buyer directory search state, you will hook this into your UI
  const [buyerSearchQ, setBuyerSearchQ] = React.useState("");
  const [buyerSearchBusy, setBuyerSearchBusy] = React.useState(false);
  const [buyerHits, setBuyerHits] = React.useState<DirectoryHit[]>([]);

  React.useEffect(() => {
    if (!rootApi) return;

    const term = buyerSearchQ.trim();
    if (!term) {
      setBuyerHits([]);
      return;
    }

    let alive = true;

    const run = async () => {
      setBuyerSearchBusy(true);
      try {
        const hits = await searchDirectory(rootApi, term);
        if (alive) setBuyerHits(hits);
      } catch (e) {
        console.error("[OffspringPage] Directory search failed", e);
        if (alive) setBuyerHits([]);
      } finally {
        if (alive) setBuyerSearchBusy(false);
      }
    };

    const t = window.setTimeout(run, 250);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [buyerSearchQ, rootApi]);


  const [q, setQ] = React.useState("");
  const [pageSize, setPageSize] = React.useState(25);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [rows, setRows] = React.useState<OffspringRow[]>([]);
  const [sorts, setSorts] = React.useState<{ key: ColumnKey; dir: "asc" | "desc" }[]>([]);
  const cols = hooks.useColumns(ALL_COLUMNS as any, OFFSPRING_STORAGE_KEY);

  // View mode state (table or cards) - uses tenant preferences as default
  const { viewMode, setViewMode } = useViewMode({ module: "offspring" });
  const visibleSafe = cols.visible && cols.visible.length > 0 ? cols.visible : ALL_COLUMNS;
  const [drawer, setDrawer] = React.useState<OffspringRow | null>(null);
  const [drawerTab, setDrawerTab] = React.useState<
    "overview" | "health" | "media" | "invoices" | "records" | "notes"
  >("overview");

  const [selectedGroupBuyerKey, setSelectedGroupBuyerKey] = React.useState<string>("");

  const groupBuyerOptions = React.useMemo(
    () => deriveGroupBuyerOptions((drawer as any)?.group ?? null),
    [drawer],
  );

  React.useEffect(() => {
    // reset selection when switching offspring
    setSelectedGroupBuyerKey("");
  }, [drawer?.id]);

  const [coreForm, setCoreForm] = React.useState<Partial<OffspringRow> | null>(null);
  const [drawerMode, setDrawerMode] = React.useState<"view" | "edit">("view");
  const [drawerSaving, setDrawerSaving] = React.useState(false);
  const updateCoreForm = React.useCallback((fields: Partial<OffspringRow>) => {
    setCoreForm((prev) => (prev ? { ...prev, ...fields } : prev));
  }, []);

  // edit state for parent group override in the drawer
  const [allowWithoutParent, setAllowWithoutParent] = React.useState(false);
  const groupOptions = useOffspringGroupOptions(true);

  const [showCreate, setShowCreate] = React.useState(false);
  const [showWhelpPalette, setShowWhelpPalette] = React.useState(false);

  // Normalized species and breed for the offspring in the details drawer
  const drawerSpeciesKey = React.useMemo(() => {
    if (!drawer?.species) return null;
    return String(drawer.species).toUpperCase();
  }, [drawer]);

  const drawerBreedKey = React.useMemo(() => {
    if (!drawer) return null;

    const rawBreed =
      (drawer as any).breedName ??
      (drawer as any).breed ??
      (drawer.group as any)?.breedName ??
      (drawer.group as any)?.breed ??
      null;

    if (!rawBreed) return null;
    return String(rawBreed).trim().toUpperCase();
  }, [drawer]);

  const drawerGroupOptions = React.useMemo(() => {
    // If no drawer is open, just return the full list
    if (!drawer) return groupOptions;

    return groupOptions.filter((g) => {
      // Species check
      if (drawerSpeciesKey && g.species) {
        if (String(g.species).toUpperCase() !== drawerSpeciesKey) {
          return false;
        }
      }

      // Breed check
      if (drawerBreedKey) {
        const groupBreedKey = g.breed ? g.breed.trim().toUpperCase() : null;

        // If the offspring has a breed, the group must also have a breed and it must match
        if (!groupBreedKey) {
          return false;
        }
        if (groupBreedKey !== drawerBreedKey) {
          return false;
        }
      }

      return true;
    });
  }, [drawer, groupOptions, drawerSpeciesKey, drawerBreedKey]);


  // Allow external callers to trigger the "Add Offspring" overlay by URL
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const url = new URL(window.location.href);
      const raw = url.searchParams.get("createOffspring");
      if (!raw) return;

      const flag = raw.toLowerCase();
      if (flag === "1" || flag === "true" || flag === "yes") {
        setShowCreate(true);
      }
    } catch {
      // ignore URL parsing issues
    }
  }, []);


  function cycleSort(key: ColumnKey, withShift: boolean) {
    const existing = sorts.find((s) => s.key === key);
    let next = [...sorts];
    if (!withShift) {
      next = existing ? [{ key, dir: existing.dir === "asc" ? "desc" : "asc" }] : [{ key, dir: "asc" }];
    } else if (!existing) {
      next.push({ key, dir: "asc" });
    } else if (existing.dir === "asc") {
      next = next.map((s) => (s.key === key ? { ...s, dir: "desc" } : s));
    } else {
      next = next.filter((s) => s.key !== key);
    }
    setSorts(next);
  }

  const onToggleSort = (key: string) => {
    cycleSort(key as ColumnKey, false);
  };

  const refresh = React.useCallback(async () => {
    try {
      const res = await api.list({ q, page, pageSize });
      setRows(Array.isArray(res.rows) ? res.rows : []);
      setTotal(typeof res.total === "number" ? res.total : 0);
    } catch (err) {
      console.error("[Offspring] list failed", err);
      setRows([]);
      setTotal(0);
    }
  }, [api, q, page, pageSize, sorts]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    const applyFromUrl = async () => {
      try {
        const id = new URLSearchParams(window.location.search).get("offspringId");
        if (!id) {
          setDrawer(null);
          return;
        }
        const rec = await api.getById(Number(id));
        if (rec) {
          setDrawer(rec);
          setDrawerTab("overview");
        } else {
          setDrawer(null);
        }
      } catch {
        // ignore
      }
    };
    applyFromUrl();
    const onPop = () => applyFromUrl();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [api]);

  React.useEffect(() => {
    const tick = () => refresh();
    const names = [
      "bhq:offspring:created",
      "bhq:offspring:updated",
      "bhq:offspring:deleted",
      "bhq:offspring:health:created",
      "bhq:offspring:media:created",
      "bhq:offspring:contract:created",
      "bhq:offspring:task:created",
      "bhq:offspring:invoice:linked",
    ];
    names.forEach((n) => window.addEventListener(n, tick as any));
    return () => names.forEach((n) => window.removeEventListener(n, tick as any));
  }, [refresh]);

  React.useEffect(() => {
    if (!drawer) {
      setCoreForm(null);
      setDrawerMode("view");
      setAllowWithoutParent(false);
      return;
    }
    setCoreForm({
      name: drawer.name,
      placeholderLabel: drawer.placeholderLabel,
      sex: drawer.sex,
      color: drawer.color,
      birthWeightOz: drawer.birthWeightOz,
      status: drawer.status,
      dob: drawer.dob,
      placementDate: drawer.placementDate,
      price: drawer.price,
      microchip: drawer.microchip,
      registrationId: drawer.registrationId,
      notes: drawer.notes,
      groupId: drawer.groupId ?? null,
      whelpingCollarColor: drawer.whelpingCollarColor ?? null,
      riskScore: drawer.riskScore ?? null,
    });
    setAllowWithoutParent(drawer.groupId == null);
    setDrawerMode("view");
    setShowWhelpPalette(false);
  }, [drawer]);


  const [linkingInvoice, setLinkingInvoice] = React.useState(false);
  const [healthSaving, setHealthSaving] = React.useState(false);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(total, startIdx + pageSize);

  function writeUrlParam(id: ID | null) {
    try {
      const url = new URL(window.location.href);
      if (id == null) url.searchParams.delete("offspringId");
      else url.searchParams.set("offspringId", String(id));
      window.history.replaceState({}, "", url.toString());
    } catch {
      // ignore
    }
  }

  function closeDrawer() {
    setDrawer(null);
    setDrawerMode("view");
    writeUrlParam(null);
  }


  const detailsPanelRef = React.useRef<HTMLDivElement | null>(null);

  function navigateToGroup(groupId: ID) {
    try {
      const url = new URL(window.location.href);

      // Force the groups tab and target group
      url.searchParams.set("tab", "groups");
      url.searchParams.set("groupId", String(groupId));

      // Clear offspring specific flags that would interfere
      url.searchParams.delete("offspringId");
      url.searchParams.delete("createOffspring");

      // Open App-Offspring plus the group drawer in a new tab
      window.open(url.toString(), "_blank", "noopener,noreferrer");
    } catch {
      // ignore
    }
  }


  function navigateToWaitlist(waitlistId: number) {
    window.dispatchEvent(
      new CustomEvent("bhq:offspring:navigate:waitlist", {
        detail: { waitlistId },
      }),
    );
  }

  async function navigateToOffspringSibling(id: number) {
    try {
      const row = await api.getById(id);
      setDrawer(row);
      writeUrlParam(row.id);
      setDrawerTab("overview");
    } catch (err) {
      console.error(err);
      alert("Failed to load sibling record");
    }
  }


  async function handleAddHealthEvent() {
    if (!drawer) return;

    const occurredAt = new Date().toISOString().slice(0, 10);
    const kind = "HEALTH_CHECK";

    const notes = window.prompt("Notes for health event (optional):") ?? undefined;
    const weightStr = window.prompt("Weight in ounces (optional):") ?? "";
    const weightOz = weightStr.trim() ? Number(weightStr.trim()) : undefined;

    setHealthSaving(true);
    try {
      const updated = await api.addHealthEvent(drawer.id, {
        occurredAt,
        kind,
        notes,
        weightOz: Number.isFinite(weightOz as number)
          ? (weightOz as number)
          : undefined,
      });
      setDrawer(updated);
      window.dispatchEvent(
        new CustomEvent("bhq:offspring:health:created", {
          detail: { offspringId: drawer.id },
        }),
      );
    } catch (err) {
      console.error(err);
      alert("Failed to add health event");
    } finally {
      setHealthSaving(false);
    }
  }

  async function handleLinkInvoice() {
    if (!drawer) return;

    const invoiceNumber = window.prompt("Invoice number")?.trim();
    if (!invoiceNumber) return;

    const amountStr = window.prompt("Amount (dollars)")?.trim();
    const amount = amountStr ? Number(amountStr) : NaN;
    if (!Number.isFinite(amount)) {
      alert("Invalid amount");
      return;
    }

    const status =
      window.prompt("Status (e.g., PAID, UNPAID)")?.trim() || "UNKNOWN";

    setLinkingInvoice(true);
    try {
      const updated = await api.linkInvoice(drawer.id, {
        invoiceNumber,
        amount,
        status,
      });
      setDrawer(updated);
      window.dispatchEvent(
        new CustomEvent("bhq:offspring:invoice:linked", {
          detail: { offspringId: drawer.id },
        }),
      );
    } catch (err) {
      console.error(err);
      alert("Failed to link invoice");
    } finally {
      setLinkingInvoice(false);
    }
  }

  const handleAssignBuyerFromGroup = React.useCallback(async () => {
    if (!drawer || !selectedGroupBuyerKey) return;

    const [kindRaw, idRaw] = selectedGroupBuyerKey.split(":");
    const kind: OffspringBuyerKind =
      kindRaw === "organization" ? "organization" : "contact";
    const id = Number(idRaw);
    if (!Number.isFinite(id)) return;

    // Phase 3: Use Party-first payload with buyerPartyId
    const patch: OffspringUpdateInput = {
      buyerPartyId: id,
    };

    try {
      const updated = await api.update(drawer.id, patch);
      setDrawer(updated);
      setRows((prev) =>
        prev.map((r) => (String(r.id) === String(updated.id) ? updated : r)),
      );
      window.dispatchEvent(
        new CustomEvent("bhq:offspring:buyer:assigned", {
          detail: { offspringId: drawer.id },
        }),
      );
    } catch (err) {
      console.error(err);
      window.alert("Failed to assign buyer");
    }
  }, [api, drawer, selectedGroupBuyerKey, setRows]);

  const handleAssignBuyerFromDirectory = React.useCallback(
    async (hit: DirectoryHit | null) => {
      if (!drawer || !hit) return;

      // Phase 3: Use Party-first payload with buyerPartyId
      const patch: OffspringUpdateInput = {
        buyerPartyId: hit.id,
      };

      try {
        const updated = await api.update(drawer.id, patch);
        setDrawer(updated);
        setRows((prev) =>
          prev.map((r) => (String(r.id) === String(updated.id) ? updated : r)),
        );
        window.dispatchEvent(
          new CustomEvent("bhq:offspring:buyer:assigned", {
            detail: { offspringId: drawer.id },
          }),
        );
        setSelectedGroupBuyerKey("");
      } catch (err) {
        console.error(err);
        window.alert("Failed to assign buyer from directory");
      }
    },
    [api, drawer, setRows],
  );

  const handleClearBuyer = React.useCallback(async () => {
    if (!drawer) return;

    // Phase 3: Use Party-first payload with buyerPartyId
    const patch: OffspringUpdateInput = {
      buyerPartyId: null,
    };

    try {
      const updated = await api.update(drawer.id, patch);
      setDrawer(updated);
      setRows((prev) =>
        prev.map((r) => (String(r.id) === String(updated.id) ? updated : r)),
      );
      window.dispatchEvent(
        new CustomEvent("bhq:offspring:buyer:cleared", {
          detail: { offspringId: drawer.id },
        }),
      );
      setSelectedGroupBuyerKey("");
    } catch (err) {
      console.error(err);
      window.alert("Failed to clear buyer");
    }
  }, [api, drawer, setRows]);


  async function saveCoreSection() {
    if (!drawer || !coreForm) return;

    const resolvedGroupId =
      allowWithoutParent ? null : (coreForm.groupId ?? null);

    const isLinkedToParent = !allowWithoutParent && resolvedGroupId != null;
    const promotedAnimalId =
      coreForm.promotedAnimalId ?? (drawer as any).promotedAnimalId ?? null;

    const lifeState =
      (coreForm.lifeState ?? (drawer as any).lifeState ?? null) as LifeState | null;
    const placementStateDraft =
      (coreForm.placementState ?? (drawer as any).placementState ?? null) as PlacementState | null;
    const resolvedPlacementState: PlacementState | null =
      lifeState === "DECEASED" ? "UNASSIGNED" : placementStateDraft;

    let placedAt =
      coreForm.placedAt ?? (drawer as any).placedAt ?? null;
    if (resolvedPlacementState === "PLACED") {
      placedAt = placedAt || todayInputValue();
    } else {
      placedAt = null;
    }

    const keeperIntent =
      (coreForm.keeperIntent ?? (drawer as any).keeperIntent ?? null) as KeeperIntent | null;
    const keeperIntentResolved =
      promotedAnimalId != null ? "KEEP" : keeperIntent;

    const financialState =
      (coreForm.financialState ?? (drawer as any).financialState ?? null) as FinancialState | null;
    let paidInFullAt =
      coreForm.paidInFullAt ?? (drawer as any).paidInFullAt ?? null;
    if (financialState === "PAID_IN_FULL") {
      paidInFullAt = paidInFullAt || todayInputValue();
    } else {
      paidInFullAt = null;
    }

    const paperworkState =
      (coreForm.paperworkState ?? (drawer as any).paperworkState ?? null) as PaperworkState | null;
    let contractSignedAt =
      coreForm.contractSignedAt ?? (drawer as any).contractSignedAt ?? null;
    if (paperworkState === "SIGNED" || paperworkState === "COMPLETE") {
      contractSignedAt = contractSignedAt || todayInputValue();
    } else {
      contractSignedAt = null;
    }

    const contractId = coreForm.contractId ?? (drawer as any).contractId ?? null;
    const diedAt =
      lifeState === "DECEASED"
        ? (coreForm.diedAt ?? (drawer as any).diedAt ?? todayInputValue())
        : null;

    try {
      const patch: OffspringUpdateInput = {
        name: coreForm.name ?? null,
        sex:
          coreForm.sex === "UNKNOWN"
            ? null
            : ((coreForm.sex as Sex) ?? drawer.sex ?? null),
        color: coreForm.color ?? null,
        birthWeightOz: coreForm.birthWeightOz ?? null,
        status: (coreForm.status as OffspringStatus) ?? drawer.status,
        placementDate: coreForm.placementDate ?? drawer.placementDate,
        price: coreForm.price ?? drawer.price,
        microchip: coreForm.microchip ?? drawer.microchip,
        registrationId: coreForm.registrationId ?? drawer.registrationId,
        notes: coreForm.notes ?? drawer.notes,
        lifeState,
        placementState: resolvedPlacementState,
        keeperIntent: keeperIntentResolved,
        financialState,
        paperworkState,
        diedAt,
        placedAt,
        paidInFullAt,
        contractId,
        contractSignedAt,
        promotedAnimalId: promotedAnimalId ?? null,

        species: (drawer.species as any) ?? null,

        // For offspring linked to a parent group, do not change DOB here.
        // They inherit DOB from the group.
        dob: isLinkedToParent
          ? drawer.dob
          : (coreForm.dob ?? drawer.dob),

        // critical part: send both names
        groupId: resolvedGroupId,
        litterId: resolvedGroupId,

        unlinkedOverride:
          allowWithoutParent && resolvedGroupId == null
            ? true
            : null,

        whelpingCollarColor:
          coreForm.whelpingCollarColor ??
          drawer.whelpingCollarColor ??
          null,
        riskScore: coreForm.riskScore ?? drawer.riskScore ?? null,
      };

      const updated = await api.update(drawer.id, patch);
      setDrawer(updated);
      setRows((prev) =>
        prev.map((r) => (String(r.id) === String(updated.id) ? updated : r)),
      );
      window.dispatchEvent(new CustomEvent("bhq:offspring:updated"));
    } catch {
      window.alert("Failed to save offspring core details");
    }
  }

  return (
    <div className="p-6 space-y-4">
      {!embed && (
        <PageHeader
          title="Offspring"
          subtitle="Manage individual offspring records"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" /> New
              </Button>
            </div>
          }
        />
      )}

      <SectionCard>
        {/* Toolbar - always visible */}
        <div className="bhq-table__toolbar px-2 pt-2 pb-3 relative z-30 flex items-center gap-3">
          <SearchBar
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="Search name, buyer, group, microchip"
            widthPx={400}
          />

          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-hairline overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                viewMode === "cards"
                  ? "bg-[hsl(var(--brand-orange))] text-black"
                  : "bg-transparent text-secondary hover:text-primary hover:bg-[hsl(var(--muted)/0.5)]"
              }`}
              title="Card view"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                viewMode === "list"
                  ? "bg-[hsl(var(--brand-orange))] text-black"
                  : "bg-transparent text-secondary hover:text-primary hover:bg-[hsl(var(--muted)/0.5)]"
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                viewMode === "table"
                  ? "bg-[hsl(var(--brand-orange))] text-black"
                  : "bg-transparent text-secondary hover:text-primary hover:bg-[hsl(var(--muted)/0.5)]"
              }`}
              title="Table view"
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          {/* Sort dropdown */}
          <SortDropdown
            options={SORT_OPTIONS}
            sorts={sorts}
            onSort={(key, dir) => setSorts([{ key: key as ColumnKey, dir }])}
            onClear={() => setSorts([])}
          />

          {/* Column toggle - show in table and list modes */}
          {(viewMode === "table" || viewMode === "list") && (
            <ColumnsPopover
              columns={cols.map}
              onToggle={cols.toggle}
              onSet={cols.setAll}
              allColumns={ALL_COLUMNS as any}
              triggerClassName="bhq-columns-trigger"
            />
          )}

          <div className="ml-auto" />

          <div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Offspring
            </Button>
          </div>
        </div>

        {/* Conditional view rendering */}
        {viewMode === "cards" ? (
          <OffspringCardView
            rows={rows}
            loading={false}
            error={null}
            onRowClick={async (row) => {
              try {
                const full = await api.getById(row.id);
                if (full) {
                  setDrawer(full);
                  writeUrlParam(full.id);
                  setDrawerTab("overview");
                }
              } catch (err) {
                console.error("[Offspring] Failed to load row", row.id, err);
              }
            }}
          />
        ) : viewMode === "list" ? (
          <OffspringListView
            rows={rows}
            loading={false}
            error={null}
            onRowClick={async (row) => {
              try {
                const full = await api.getById(row.id);
                if (full) {
                  setDrawer(full);
                  writeUrlParam(full.id);
                  setDrawerTab("overview");
                }
              } catch (err) {
                console.error("[Offspring] Failed to load row", row.id, err);
              }
            }}
            visibleColumns={visibleSafe}
          />
        ) : (
        <Table
          columns={ALL_COLUMNS as any}
          columnState={cols.map}
          onColumnStateChange={cols.setAll}
          getRowId={(r: OffspringRow) => r.id}
          pageSize={25}
          stickyRightWidthPx={0}
        >
          <table className="min-w-max w-full text-sm">
            <TableHeader columns={visibleSafe as any} sorts={sorts} onToggleSort={onToggleSort} />
            <tbody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleSafe.length}>
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No offspring found
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow
                    key={r.id}
                    detailsRow={r}
                    className="cursor-pointer"
                    onClick={async () => {
                      try {
                        const full = await api.getById(r.id);
                        if (full) {
                          setDrawer(full);
                          writeUrlParam(full.id);
                          setDrawerTab("overview");
                        }
                      } catch (err) {
                        console.error("[Offspring] Failed to load row", r.id, err);
                      }
                    }}
                  >
                    {visibleSafe.map((col) => {
                      const k = col.key as ColumnKey;
                      let val: React.ReactNode = (r as any)[k];

                      if (k === "name") {
                        val = r.name || r.placeholderLabel || "Unnamed";
                      }

                      if (k === "buyer") {
                        if (r.buyerName) {
                          val = r.buyerName;
                        } else if (r.buyerId != null) {
                          val = `Buyer #${r.buyerId}`;
                        } else {
                          val = "-";
                        }
                      }

                      if (k === "group") {
                        if (r.groupId) {
                          const groupFromOptions = groupOptions.find(
                            (opt) => opt.id === r.groupId
                          );

                          const label =
                            groupFromOptions?.label ||
                            r.groupLabel ||
                            (r as any).groupName ||
                            (r as any).groupCode ||
                            `Group #${r.groupId}`;

                          val = (
                            <button
                              type="button"
                              className="text-xs text-primary underline-offset-2 hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToGroup(r.groupId!);
                              }}
                            >
                              {label}
                            </button>
                          );
                        } else {
                          val = "-";
                        }
                      }

                      if (k === "sex") {
                        val = r.sex ?? "-";
                      }

                      if (k === "whelpingCollarColor") {
                        const value = r.whelpingCollarColor;
                        val = value ? (
                          <CollarSwatch color={value} showLabel />
                        ) : (
                          "-"
                        );
                      }


                      if (k === "color") {
                        val = r.color ?? "-";
                      }

                      if (k === "breed") {
                        val = r.breed ?? "-";
                      }

                      if (k === "status") {
                        val = prettyStatus(r.status as OffspringStatus);
                      }

                      if (k === "lifeState") {
                        val = prettyLifeState(r.lifeState);
                      }

                      if (k === "placementState") {
                        val = prettyPlacementState(r.placementState);
                      }

                      if (k === "keeperIntent") {
                        val = prettyKeeperIntent(r.keeperIntent);
                      }

                      if (k === "financialState") {
                        val = prettyFinancialState(r.financialState);
                      }

                      if (k === "paperworkState") {
                        val = prettyPaperworkState(r.paperworkState);
                      }

                      if (k === "diedAt") {
                        val = formatDate(r.diedAt);
                      }

                      if (k === "placedAt") {
                        val = formatDate(r.placedAt);
                      }

                      if (k === "paidInFullAt") {
                        val = formatDate(r.paidInFullAt);
                      }

                      if (k === "contractSignedAt") {
                        val = formatDate(r.contractSignedAt);
                      }

                      if (k === "dob") {
                        val = formatDate(r.dob);
                      }

                      if (k === "placementDate") {
                        val = formatDate(r.placementDate);
                      }

                      if (k === "price") {
                        val = moneyFmt(r.price);
                      }

                      if (k === "birthWeightOz") {
                        val = r.birthWeightOz != null ? r.birthWeightOz.toFixed(1) : "-";
                      }

                      return (
                        <TableCell
                          key={col.key}
                          align={CENTER_KEYS.has(col.key as ColumnKey) ? "center" : "left"}
                        >
                          {val}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between gap-3 p-3 border-t border-hairline">
                  <div className={labelClass}>
                    {total === 0 ? (
                      "No records"
                    ) : (
                      <>
                        Showing {startIdx + 1} to {endIdx} of {total}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 text-xs">
                      <span>Rows per page</span>
                      <select
                        className="bhq-input h-7 w-16 px-1 text-xs"
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.currentTarget.value) || 25);
                          setPage(1);
                        }}
                      >
                        {[10, 25, 50, 100].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex items-center gap-1 text-xs">
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronUp className="h-3 w-3 rotate-90" />
                      </Button>
                      <span>
                        Page {page} of {pageCount}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={page >= pageCount}
                        onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                      >
                        <ChevronDown className="h-3 w-3 rotate-90" />
                      </Button>
                    </div>
                  </div>
          </div>
        </Table>
        )}
      </SectionCard>

      <CreateOffspringOverlayContent
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={async (input) => {
          try {
            const payload: any = { ...input };

            // If a groupId is on the URL and the form did not set one, attach it
            if (typeof window !== "undefined") {
              try {
                const url = new URL(window.location.href);
                const groupIdRaw = url.searchParams.get("groupId");
                if (groupIdRaw && payload.groupId == null) {
                  const groupIdNum = Number(groupIdRaw);
                  if (Number.isFinite(groupIdNum)) {
                    payload.groupId = groupIdNum;
                  }
                }
              } catch {
                // ignore URL issues
              }
            }

            await api.create(payload);
            setShowCreate(false);
            await refresh();
          } catch (err) {
            console.error("Failed to create offspring", err);
            window.alert("Failed to create offspring. Try again.");
          }
        }}
        rootApi={rootApi}
        groupOptions={groupOptions}
      />
      <Overlay
        open={!!drawer}
        ariaLabel="Offspring details"
        closeOnEscape
        closeOnOutsideClick
        onOpenChange={(open) => {
          if (!open) {
            closeDrawer();
          }
        }}
      >
        {drawer && (
          <div
            className="fixed inset-0"
            style={{ zIndex: MODAL_Z, isolation: "isolate" }}
            onMouseDown={(e) => {
              const p = detailsPanelRef.current;
              if (!p) return;
              if (!p.contains(e.target as Node)) {
                closeDrawer();
              }
            }}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Anchored panel (align top, scroll if needed) */}
            <div className="absolute inset-0 flex items-start justify-center overflow-y-auto">
              <div
                ref={detailsPanelRef}
                className="pointer-events-auto mb-10 flex flex-col overflow-hidden rounded-xl border border-hairline bg-surface shadow-xl"
                style={{ width: 760, maxWidth: "calc(100vw - 64px)", marginTop: "6vh" }}
                onMouseDown={(e) => {
                  // keep clicks inside the panel from bubbling to the outer close handler
                  e.stopPropagation();
                }}
              >
                <DetailsScaffold
                  title={
                    (() => {
                      const statusPresentation = buildOffspringStatusPresentation(drawer);
                      return (
                        <div className="flex items-center gap-3">
                          <span className="truncate">
                            {drawer.name ||
                              drawer.placeholderLabel ||
                              drawer.identifier ||
                              "Unnamed offspring"}
                          </span>
                          {statusPresentation.primaryBadge ? (
                            <Badge
                              variant={statusPresentation.primaryBadge.variant ?? "neutral"}
                              title={statusPresentation.primaryBadge.title}
                              className={primaryBadgeClass}
                            >
                              {statusPresentation.primaryBadge.label}
                            </Badge>
                          ) : null}
                        </div>
                      );
                    })()
                  }
                  subtitle={
                    (() => {
                      const statusPresentation = buildOffspringStatusPresentation(drawer);
                      return (
                        <div className="flex flex-wrap items-center gap-2 whitespace-normal">
                          {statusPresentation.chips.map((chip, idx) => (
                            <Badge
                              key={`${chip.label}-${idx}`}
                              variant={chip.variant ?? "neutral"}
                              title={chip.title}
                              className={chipBadgeClass}
                            >
                              {chip.label}
                            </Badge>
                          ))}
                        </div>
                      );
                    })()
                  }
                  mode={drawerMode}
                  onEdit={() => {
                    // ensure form is in sync, then enter edit mode
                    setCoreForm({
                      name: drawer.name,
                      placeholderLabel: drawer.placeholderLabel,
                      sex: drawer.sex,
                      color: drawer.color,
                      birthWeightOz: drawer.birthWeightOz,
                      status: drawer.status,
                      dob: drawer.dob,
                      placementDate: drawer.placementDate,
                      placementState: drawer.placementState ?? null,
                      lifeState: drawer.lifeState ?? null,
                      keeperIntent: drawer.keeperIntent ?? null,
                      financialState: drawer.financialState ?? null,
                      paperworkState: drawer.paperworkState ?? null,
                      diedAt: drawer.diedAt ?? null,
                      placedAt: drawer.placedAt ?? null,
                      paidInFullAt: drawer.paidInFullAt ?? null,
                      contractId: drawer.contractId ?? null,
                      contractSignedAt: drawer.contractSignedAt ?? null,
                      price: drawer.price,
                      microchip: drawer.microchip,
                      registrationId: drawer.registrationId,
                      notes: drawer.notes,
                      groupId: drawer.groupId,
                      whelpingCollarColor: drawer.whelpingCollarColor ?? null,
                      riskScore: drawer.riskScore ?? null,
                      promotedAnimalId: drawer.promotedAnimalId ?? null,
                    });
                    setAllowWithoutParent(drawer.groupId == null);
                    setShowWhelpPalette(false);
                    setDrawerMode("edit");
                  }}
                  onCancel={() => {
                    // reset form from current drawer row, leave DB unchanged
                    setCoreForm({
                      name: drawer.name,
                      placeholderLabel: drawer.placeholderLabel,
                      sex: drawer.sex,
                      color: drawer.color,
                      birthWeightOz: drawer.birthWeightOz,
                      status: drawer.status,
                      dob: drawer.dob,
                      placementDate: drawer.placementDate,
                      placementState: drawer.placementState ?? null,
                      lifeState: drawer.lifeState ?? null,
                      keeperIntent: drawer.keeperIntent ?? null,
                      financialState: drawer.financialState ?? null,
                      paperworkState: drawer.paperworkState ?? null,
                      diedAt: drawer.diedAt ?? null,
                      placedAt: drawer.placedAt ?? null,
                      paidInFullAt: drawer.paidInFullAt ?? null,
                      contractId: drawer.contractId ?? null,
                      contractSignedAt: drawer.contractSignedAt ?? null,
                      price: drawer.price,
                      microchip: drawer.microchip,
                      registrationId: drawer.registrationId,
                      notes: drawer.notes,
                      groupId: drawer.groupId,
                      whelpingCollarColor: drawer.whelpingCollarColor ?? null,
                      riskScore: drawer.riskScore ?? null,
                      promotedAnimalId: drawer.promotedAnimalId ?? null,
                    });
                    setAllowWithoutParent(drawer.groupId == null);
                    setShowWhelpPalette(false);
                    setDrawerMode("view");
                  }}
                  onSave={async () => {
                    if (!drawer || !coreForm) return;
                    setDrawerSaving(true);
                    try {
                      await saveCoreSection();
                      setDrawerMode("view");
                    } finally {
                      setDrawerSaving(false);
                    }
                  }}
                  saving={drawerSaving}
                  tabs={[
                    { key: "overview", label: "Overview" },
                    { key: "health", label: "Health" },
                    { key: "media", label: "Media" },
                    { key: "invoices", label: "Invoices" },
                    { key: "records", label: "Records" },
                    { key: "notes", label: "Notes" },
                  ]}
                  activeTab={drawerTab}
                  onTabChange={(key) => setDrawerTab(key as any)}
                  rightActions={
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={closeDrawer}>
                        Close
                      </Button>
                    </div>
                  }
                >
                {/* Body */}
                <div className="px-5 py-3 space-y-6">
                  {(() => {
                    const row = drawer as any;
                    if (!row) return null;

                    const group = row.group;
                    const isLinkedToParent = !allowWithoutParent && row.groupId != null;
                    const buyer = row.buyer;
                    const health = row.healthSummary || {};
                    const media = row.mediaSummary || {};
                    const invoices = row.invoiceSummary || {};
                    const crossRefs = row.crossRefs || {};
                    const notes: string = row.notes || "";

                    const name =
                      row.name || row.identifier || "Unnamed offspring";

                    const speciesLabel =
                      row.species ? prettySpecies(row.species) : "Not set";

                    const sexLabel = prettySex(row.sex);

                    const damLabel =
                      row.groupDamName || row.damName || "Not set";

                    const sireLabel =
                      row.groupSireName || row.sireName || "Not set";

                    const dobLabel = row.dob
                      ? formatDate(row.dob)
                      : "Not set";
                    const lifeState =
                      normalizeState(
                        (coreForm as any)?.lifeState ??
                        row.lifeState ??
                        (row as any).life_state ??
                        null,
                      );
                    const diedAtValue =
                      (coreForm as any)?.diedAt ??
                      row.diedAt ??
                      (row as any).died_at ??
                      null;

                    const birthWeightLabel =
                      typeof row.birthWeightOz === "number"
                        ? `${row.birthWeightOz} oz`
                        : "Not recorded";

                    const colorLabel = row.color || "Not set";

                    const microchipLabel = row.microchip || "None";

                    const registrationLabel = row.registrationId || "None";

                    const whelpingCollarValue =
                      drawerMode === "edit" && coreForm
                        ? coreForm.whelpingCollarColor
                        : row.whelpingCollarColor;

                    const whelpingCollarLabel =
                      whelpingCollarValue || "Not set";

                    const groupLabelFromOptions = groupOptions.find(
                      (opt) => opt.id === row.groupId
                    )?.label;

                    const groupName =
                      groupLabelFromOptions ||
                      row.groupName ||
                      row.group?.name ||
                      (row.groupId ? `Group #${row.groupId}` : "Not linked to group");

                    const groupCode =
                      row.groupCode ||
                      row.group?.code ||
                      "n/a";

                    const identifierLabel = row.identifier || "Not set";

                    const placementState =
                      normalizeState(
                        (coreForm as any)?.placementState ??
                        row.placementState ??
                        (row as any).placement_state ??
                        row.placementStatus ??
                        null,
                      );
                    const keeperIntentState =
                      normalizeState(
                        (coreForm as any)?.keeperIntent ??
                        row.keeperIntent ??
                        (row as any).keeper_intent ??
                        null,
                      );
                    const financialState =
                      normalizeState(
                        (coreForm as any)?.financialState ??
                        row.financialState ??
                        (row as any).financial_state ??
                        null,
                      );
                    const paperworkState =
                      normalizeState(
                        (coreForm as any)?.paperworkState ??
                        row.paperworkState ??
                        (row as any).paperwork_state ??
                        null,
                      );
                    const placedAtValue =
                      (coreForm as any)?.placedAt ??
                      row.placedAt ??
                      (row as any).placed_at ??
                      null;
                    const paidInFullAtValue =
                      (coreForm as any)?.paidInFullAt ??
                      row.paidInFullAt ??
                      (row as any).paid_in_full_at ??
                      null;
                    const contractSignedAtValue =
                      (coreForm as any)?.contractSignedAt ??
                      row.contractSignedAt ??
                      (row as any).contract_signed_at ??
                      null;
                    const contractIdValue =
                      (coreForm as any)?.contractId ??
                      row.contractId ??
                      (row as any).contract_id ??
                      null;
                    const promotedAnimalId =
                      (coreForm as any)?.promotedAnimalId ??
                      row.promotedAnimalId ??
                      (row as any).promoted_animal_id ??
                      null;

                    const buyerHeaderLabel = getBuyerSectionTitle(placementState);
                    const depositLabel = formatFinancialStateLabel(financialState);
                    const contractLabel = formatPaperworkStateLabel(paperworkState);
                    const diedAtLabel =
                      lifeState === "DECEASED"
                        ? (diedAtValue ? formatDate(diedAtValue) : "Yes")
                        : null;

                    const priceLabel =
                      typeof row.price === "number"
                        ? moneyFmt(row.price)
                        : "Not set";

                    const placementDateLabel = row.placementDate
                      ? formatDate(row.placementDate)
                      : "Not set";

                    const buyerName =
                      row.buyerName ||
                      (row.buyerId ? `Buyer #${row.buyerId}` : "No buyer on file");

                    // Treat these as optional extras if the API ever sends them
                    const buyerEmail =
                      (row as any).buyerEmail ??
                      (row as any).buyer_email ??
                      null;

                    const buyerPhone =
                      (row as any).buyerPhone ??
                      (row as any).buyer_phone ??
                      null;

                    // This drives all the Buyer tab conditional UI
                    const hasBuyer = Boolean(row.buyerId || row.buyerName);

                    const healthWeightSummary =
                      health.weightSummaryLabel || "No weight log recorded yet.";
                    const healthEventSummary =
                      health.eventsSummaryLabel || "No health events recorded yet.";

                    const mediaSummary =
                      media.summaryLabel || "No media files linked yet.";

                    const invoiceSummary =
                      invoices.summaryLabel || "No invoices linked yet.";

                    return (
                      <>
                        {/* OVERVIEW TAB */}
                        {drawerTab === "overview" && (
                          <div className="space-y-4 max-w-4xl mx-auto">

                            {/* Identity Card - Matches Animal Drawer Style */}
                            <div className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
                              <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                                <span className="text-base" style={{ opacity: 0.7 }}>🆔</span>
                                <h3 className="text-sm font-semibold text-white/90">Identity</h3>
                              </div>
                              <div className="p-4">
                                <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                                  {/* Row 1: Name, Sex, Species */}
                                  <div>
                                    <div className="text-xs text-white/50 mb-0.5">Name</div>
                                    {drawerMode === "edit" && coreForm ? (
                                      <input
                                        className={inputClass}
                                        value={coreForm.name ?? ""}
                                        onChange={(e) =>
                                          setCoreForm((prev) =>
                                            prev ? { ...prev, name: e.target.value } : prev,
                                          )
                                        }
                                        autoComplete="off"
                                        data-1p-ignore
                                        data-lpignore="true"
                                        data-form-type="other"
                                      />
                                    ) : (
                                      <div className="text-sm text-white/90">{name}</div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-xs text-white/50 mb-0.5">Sex</div>
                                    {drawerMode === "edit" && coreForm ? (
                                      <select
                                        className={inputClass}
                                        value={coreForm.sex ?? ""}
                                        onChange={(e) => {
                                          const value = e.target.value || "";
                                          setCoreForm((prev) => prev ? { ...prev, sex: (value || null) as any } : prev);
                                        }}
                                      >
                                        <option value="">Select sex</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="MALE">Male</option>
                                        <option value="UNKNOWN">Unknown</option>
                                      </select>
                                    ) : (
                                      <div className="text-sm text-white/90 flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full ${row.sex === "FEMALE" ? "bg-pink-400" : row.sex === "MALE" ? "bg-blue-400" : "bg-gray-400"}`} />
                                        {row.sex === "FEMALE" ? "Female" : row.sex === "MALE" ? "Male" : "Unknown"}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-xs text-white/50 mb-0.5">Species</div>
                                    <div className="text-sm text-white/90">{speciesLabel}</div>
                                  </div>

                                  {/* Row 2: Breed, DOB, Collar (if species uses collars) OR Color */}
                                  <div>
                                    <div className="text-xs text-white/50 mb-0.5">Breed</div>
                                    <div className="text-sm text-white/90">
                                      {row.group?.breedName || row.group?.breed || row.breedName || row.breed || "—"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-white/50 mb-0.5">DOB</div>
                                    {drawerMode === "edit" && coreForm && !isLinkedToParent ? (
                                      <DatePicker
                                        value={coreForm.dob ?? drawer.dob ?? ""}
                                        onChange={(e) =>
                                          setCoreForm((prev) =>
                                            prev ? { ...prev, dob: e.currentTarget.value } : prev,
                                          )
                                        }
                                        inputClassName={inputClass}
                                      />
                                    ) : (
                                      <div className="text-sm text-white/90">{dobLabel}</div>
                                    )}
                                  </div>
                                  {speciesUsesCollars(row.species) ? (
                                    <div>
                                      <div className="text-xs text-white/50 mb-0.5">Collar</div>
                                      {drawerMode === "edit" && coreForm ? (
                                        <CollarPicker
                                          value={coreForm.whelpingCollarColor}
                                          onChange={(colorLabel) => {
                                            setCoreForm((prev) =>
                                              prev
                                                ? { ...prev, whelpingCollarColor: colorLabel }
                                                : prev
                                            );
                                          }}
                                          className="w-full"
                                          species={row.species}
                                        />
                                      ) : (
                                        <div className="text-sm">
                                          {whelpingCollarValue ? (
                                            <CollarSwatch color={whelpingCollarValue} showLabel />
                                          ) : (
                                            <span className="text-white/40">—</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="text-xs text-white/50 mb-0.5">Color</div>
                                      {drawerMode === "edit" && coreForm ? (
                                        <input
                                          className={inputClass}
                                          value={coreForm.color ?? drawer.color ?? ""}
                                          onChange={(e) =>
                                            setCoreForm((prev) =>
                                              prev ? { ...prev, color: e.target.value } : prev,
                                            )
                                          }
                                          placeholder="Enter color"
                                          autoComplete="off"
                                          data-1p-ignore
                                          data-lpignore="true"
                                          data-form-type="other"
                                        />
                                      ) : (
                                        <div className="text-sm text-white/90">{row.color || "—"}</div>
                                      )}
                                    </div>
                                  )}

                                  {/* Row 3: Microchip, Status, Color (if species uses collars) */}
                                  <div>
                                    <div className="text-xs text-white/50 mb-0.5">Microchip #</div>
                                    {drawerMode === "edit" && coreForm ? (
                                      <input
                                        className={inputClass}
                                        value={coreForm.microchip ?? drawer.microchip ?? ""}
                                        onChange={(e) =>
                                          setCoreForm((prev) =>
                                            prev ? { ...prev, microchip: e.target.value } : prev,
                                          )
                                        }
                                        placeholder="Enter microchip"
                                        autoComplete="off"
                                        data-1p-ignore
                                        data-lpignore="true"
                                        data-form-type="other"
                                      />
                                    ) : (
                                      <div className="text-sm text-white/90">{microchipLabel === "None" ? "—" : microchipLabel}</div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-xs text-white/50 mb-0.5">Status</div>
                                    {drawerMode === "edit" && coreForm ? (
                                      <select
                                        className={inputClass}
                                        value={lifeState ?? ""}
                                        onChange={(e) => {
                                          const next = e.target.value as LifeState | "";
                                          const nextLife = next || null;
                                          updateCoreForm({
                                            lifeState: nextLife,
                                            diedAt:
                                              nextLife === "DECEASED"
                                                ? (coreForm.diedAt ?? diedAtValue ?? todayInputValue())
                                                : null,
                                            placementState:
                                              nextLife === "DECEASED"
                                                ? "UNASSIGNED"
                                                : (coreForm.placementState ?? placementState ?? null),
                                            placedAt: nextLife === "DECEASED" ? null : coreForm.placedAt ?? placedAtValue ?? null,
                                          });
                                        }}
                                      >
                                        <option value="">Select status</option>
                                        {lifeStateOptions.map((opt) => (
                                          <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <div className="flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full ${lifeState === "DECEASED" ? "bg-red-400" : "bg-emerald-400"}`} />
                                        <span className={`text-sm ${lifeState === "DECEASED" ? "text-red-300" : "text-emerald-300"}`}>
                                          {lifeState === "DECEASED" ? "Deceased" : "Active"}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {speciesUsesCollars(row.species) && (
                                    <div>
                                      <div className="text-xs text-white/50 mb-0.5">Color</div>
                                      {drawerMode === "edit" && coreForm ? (
                                        <input
                                          className={inputClass}
                                          value={coreForm.color ?? drawer.color ?? ""}
                                          onChange={(e) =>
                                            setCoreForm((prev) =>
                                              prev ? { ...prev, color: e.target.value } : prev,
                                            )
                                          }
                                          placeholder="Enter color"
                                          autoComplete="off"
                                          data-1p-ignore
                                          data-lpignore="true"
                                          data-form-type="other"
                                        />
                                      ) : (
                                        <div className="text-sm text-white/90">{row.color || "—"}</div>
                                      )}
                                    </div>
                                  )}

                                  {/* Deceased Date - Conditional row */}
                                  {lifeState === "DECEASED" && (
                                    <div>
                                      <div className="text-xs text-white/50 mb-0.5">Deceased Date</div>
                                      {drawerMode === "edit" && coreForm ? (
                                        <DatePicker
                                          value={toDateInputValue(coreForm.diedAt ?? diedAtValue)}
                                          onChange={(e) =>
                                            updateCoreForm({
                                              diedAt: e.currentTarget.value ? e.currentTarget.value : null,
                                            })
                                          }
                                          inputClassName={inputClass}
                                        />
                                      ) : (
                                        <div className="text-sm text-white/70">{diedAtLabel ?? "—"}</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Lineage Card */}
                            <div className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
                              <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                                <span className="text-base" style={{ opacity: 0.7 }}>🔗</span>
                                <h3 className="text-sm font-semibold text-white/90">Lineage</h3>
                              </div>
                              <div className="p-4">
                                <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                                  {/* Parent Group */}
                                  <div>
                                    <div className="text-xs text-white/50 mb-0.5">Parent Group</div>
                                    {drawerMode === "edit" && coreForm ? (
                                      <div className="space-y-2">
                                        <select
                                          className={inputClass}
                                          value={coreForm.groupId != null ? String(coreForm.groupId) : ""}
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            const nextGroupId = value ? Number(value) : null;
                                            setCoreForm((prev) => {
                                              if (!prev) return prev;
                                              return { ...prev, groupId: nextGroupId };
                                            });
                                          }}
                                        >
                                          <option value="">Select group</option>
                                          {drawerGroupOptions.map((opt) => (
                                            <option key={opt.id} value={String(opt.id)}>
                                              {opt.label}
                                            </option>
                                          ))}
                                        </select>
                                        <label className="flex items-center gap-2 text-xs text-white/40">
                                          <input
                                            type="checkbox"
                                            className="rounded border-white/20 bg-white/5"
                                            checked={allowWithoutParent}
                                            onChange={(e) => setAllowWithoutParent(e.target.checked)}
                                          />
                                          <span>Create Orphan</span>
                                        </label>
                                      </div>
                                    ) : group ? (
                                      <button
                                        type="button"
                                        onClick={() => navigateToGroup(group.id)}
                                        className="text-sm text-[hsl(var(--brand-orange))] hover:underline"
                                      >
                                        {groupName}
                                      </button>
                                    ) : (
                                      <span className="text-sm text-white/40">—</span>
                                    )}
                                  </div>
                                  {/* Dam */}
                                  <div>
                                    <div className="text-xs text-white/50 mb-0.5">Dam (Mother)</div>
                                    {row.dam ? (
                                      <div className="flex items-center gap-1.5 text-sm text-white/90">
                                        <span className="w-2 h-2 rounded-full bg-pink-400" />
                                        {row.dam.name ?? "Dam"}
                                      </div>
                                    ) : (
                                      <span className="text-sm text-white/40">—</span>
                                    )}
                                  </div>
                                  {/* Sire */}
                                  <div>
                                    <div className="text-xs text-white/50 mb-0.5">Sire (Father)</div>
                                    {row.sire ? (
                                      <div className="flex items-center gap-1.5 text-sm text-white/90">
                                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                                        {row.sire.name ?? "Sire"}
                                      </div>
                                    ) : (
                                      <span className="text-sm text-white/40">—</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Availability Card */}
                            <div className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
                              <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                                <span className="text-base" style={{ opacity: 0.7 }}>🛒</span>
                                <h3 className="text-sm font-semibold text-white/90">Availability</h3>
                              </div>
                              <div className="p-4">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                  {/* Keeper Intent */}
                                  <div>
                                    <div className="text-xs text-white/50 mb-0.5">Keeper Intent</div>
                                    {drawerMode === "edit" && coreForm ? (
                                      <div className="space-y-1">
                                        <select
                                          className={inputClass}
                                          value={keeperIntentState ?? ""}
                                          disabled={promotedAnimalId != null}
                                          onChange={(e) => {
                                            const next = e.target.value as KeeperIntent | "";
                                            updateCoreForm({ keeperIntent: next || null });
                                          }}
                                        >
                                          <option value="">Select intent</option>
                                          {keeperIntentOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                          ))}
                                        </select>
                                        {promotedAnimalId != null && (
                                          <div className="text-[11px] text-white/40">Promoted to breeding animal</div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full ${
                                          keeperIntentState === "AVAILABLE" ? "bg-emerald-400"
                                          : keeperIntentState === "KEEPER" ? "bg-purple-400"
                                          : keeperIntentState === "RESERVED" ? "bg-amber-400"
                                          : "bg-gray-400"
                                        }`} />
                                        <span className={`text-sm ${
                                          keeperIntentState === "AVAILABLE" ? "text-emerald-300"
                                          : keeperIntentState === "KEEPER" ? "text-purple-300"
                                          : keeperIntentState === "RESERVED" ? "text-amber-300"
                                          : "text-white/50"
                                        }`}>
                                          {keeperIntentState ? titleize(keeperIntentState) : "Not set"}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Tags Card */}
                            <div className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
                              <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                                <span className="text-base" style={{ opacity: 0.7 }}>🏷️</span>
                                <h3 className="text-sm font-semibold text-white/90">Tags</h3>
                              </div>
                              <div className="p-4">
                                <OffspringTagsSection
                                  offspringId={drawer.id}
                                  api={rootApi}
                                  disabled={drawerMode === "view"}
                                />
                              </div>
                            </div>

                            {/* Buyer Card */}
                            <div className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
                              <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                                <span className="text-base" style={{ opacity: 0.7 }}>👥</span>
                                <h3 className="text-sm font-semibold text-white/90">{buyerHeaderLabel}</h3>
                              </div>
                              {(() => {
                                const hasGroup = !!group;
                                const hasGroupOptions = groupBuyerOptions.length > 0;
                                const currentBuyerName = hasBuyer ? buyerName : "None";

                                return (
                                  <div className="p-4 space-y-4">
                                    {/* Buyer Info Row */}
                                    {hasBuyer ? (
                                      <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="w-8 h-8 rounded-full bg-[hsl(var(--brand-orange))]/20 flex items-center justify-center text-[hsl(var(--brand-orange))] font-semibold text-sm">
                                              {currentBuyerName.charAt(0).toUpperCase()}
                                            </span>
                                            <span className="font-medium text-white/90">{currentBuyerName}</span>
                                          </div>
                                          {(buyerEmail || buyerPhone) && (
                                            <div className="ml-10 space-y-0.5 text-xs">
                                              {buyerEmail && (
                                                <a href={`mailto:${buyerEmail}`} className="block text-white/60 hover:text-white/90 transition-colors">
                                                  {buyerEmail}
                                                </a>
                                              )}
                                              {buyerPhone && (
                                                <a href={`tel:${buyerPhone}`} className="block text-white/60 hover:text-white/90 transition-colors">
                                                  {buyerPhone}
                                                </a>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={handleClearBuyer}
                                          className="p-1.5 rounded-md text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                          title="Unassign buyer"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-dashed border-white/10">
                                        <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/30">
                                          ?
                                        </span>
                                        <span className="text-sm text-white/40">No buyer assigned</span>
                                      </div>
                                    )}

                                    {/* Status Pills */}
                                    <div className="flex flex-wrap gap-2">
                                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                        placementState === "PLACED"
                                          ? "bg-emerald-500/20 text-emerald-300"
                                          : placementState === "RESERVED"
                                            ? "bg-amber-500/20 text-amber-300"
                                            : "bg-white/10 text-white/50"
                                      }`}>
                                        <span className="text-[10px] uppercase tracking-wider text-white/40 mr-1">Placement</span>
                                        {placementState ? titleize(placementState) : "Unassigned"}
                                      </div>
                                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                        financialState === "PAID_IN_FULL"
                                          ? "bg-emerald-500/20 text-emerald-300"
                                          : financialState === "DEPOSIT_PAID"
                                            ? "bg-amber-500/20 text-amber-300"
                                            : "bg-white/10 text-white/50"
                                      }`}>
                                        <span className="text-[10px] uppercase tracking-wider text-white/40 mr-1">Payment</span>
                                        {depositLabel}
                                      </div>
                                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                        paperworkState === "COMPLETE" || paperworkState === "SIGNED"
                                          ? "bg-emerald-500/20 text-emerald-300"
                                          : paperworkState === "SENT"
                                            ? "bg-amber-500/20 text-amber-300"
                                            : "bg-white/10 text-white/50"
                                      }`}>
                                        <span className="text-[10px] uppercase tracking-wider text-white/40 mr-1">Contract</span>
                                        {contractLabel}
                                      </div>
                                    </div>

                                    {/* Edit Controls - Only in Edit Mode */}
                                    {drawerMode === "edit" && (
                                      <div className="pt-4 border-t border-white/5 space-y-4">
                                        <div className="text-xs font-medium text-white/50 uppercase tracking-wider">Update Status</div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                          {/* Placement */}
                                          <div>
                                            <label className="text-xs font-medium text-white/50 uppercase tracking-wider block mb-1.5">Placement</label>
                                            <select
                                              className={inputClass}
                                              value={placementState ?? ""}
                                              disabled={lifeState === "DECEASED"}
                                              onChange={(e) => {
                                                const next = e.target.value as PlacementState | "";
                                                const resolved = next || null;
                                                updateCoreForm({
                                                  placementState: lifeState === "DECEASED" ? "UNASSIGNED" : resolved,
                                                  placedAt:
                                                    resolved === "PLACED" && lifeState !== "DECEASED"
                                                      ? (coreForm?.placedAt ?? placedAtValue ?? todayInputValue())
                                                      : null,
                                                });
                                              }}
                                            >
                                              <option value="">Select placement</option>
                                              {placementStateOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                              ))}
                                            </select>
                                            {lifeState === "DECEASED" && (
                                              <div className="mt-1 text-[11px] text-white/40">Locked for deceased</div>
                                            )}
                                          </div>

                                          {placementState === "PLACED" && (
                                            <div>
                                              <label className="text-xs font-medium text-white/50 uppercase tracking-wider block mb-1.5">Placed At</label>
                                              <DatePicker
                                                value={toDateInputValue(coreForm?.placedAt ?? placedAtValue)}
                                                onChange={(e) => updateCoreForm({ placedAt: e.currentTarget.value ? e.currentTarget.value : null })}
                                                inputClassName={inputClass}
                                              />
                                            </div>
                                          )}

                                          {/* Financial */}
                                          <div>
                                            <label className="text-xs font-medium text-white/50 uppercase tracking-wider block mb-1.5">Financial</label>
                                            <select
                                              className={inputClass}
                                              value={financialState ?? ""}
                                              onChange={(e) => {
                                                const next = e.target.value as FinancialState | "";
                                                updateCoreForm({
                                                  financialState: next || null,
                                                  paidInFullAt:
                                                    next === "PAID_IN_FULL"
                                                      ? (coreForm?.paidInFullAt ?? paidInFullAtValue ?? todayInputValue())
                                                      : null,
                                                });
                                              }}
                                            >
                                              <option value="">Select financial</option>
                                              {financialStateOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                              ))}
                                            </select>
                                          </div>

                                          {financialState === "PAID_IN_FULL" && (
                                            <div>
                                              <label className="text-xs font-medium text-white/50 uppercase tracking-wider block mb-1.5">Paid At</label>
                                              <DatePicker
                                                value={toDateInputValue(coreForm?.paidInFullAt ?? paidInFullAtValue)}
                                                onChange={(e) => updateCoreForm({ paidInFullAt: e.currentTarget.value ? e.currentTarget.value : null })}
                                                inputClassName={inputClass}
                                              />
                                            </div>
                                          )}

                                          {/* Paperwork */}
                                          <div>
                                            <label className="text-xs font-medium text-white/50 uppercase tracking-wider block mb-1.5">Paperwork</label>
                                            <select
                                              className={inputClass}
                                              value={paperworkState ?? ""}
                                              onChange={(e) => {
                                                const next = e.target.value as PaperworkState | "";
                                                updateCoreForm({
                                                  paperworkState: next || null,
                                                  contractSignedAt:
                                                    next === "SIGNED" || next === "COMPLETE"
                                                      ? (coreForm?.contractSignedAt ?? contractSignedAtValue ?? todayInputValue())
                                                      : null,
                                                });
                                              }}
                                            >
                                              <option value="">Select paperwork</option>
                                              {paperworkStateOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                              ))}
                                            </select>
                                          </div>

                                          {(paperworkState === "SIGNED" || paperworkState === "COMPLETE") && (
                                            <div>
                                              <label className="text-xs font-medium text-white/50 uppercase tracking-wider block mb-1.5">Signed At</label>
                                              <DatePicker
                                                value={toDateInputValue(coreForm?.contractSignedAt ?? contractSignedAtValue)}
                                                onChange={(e) => updateCoreForm({ contractSignedAt: e.currentTarget.value ? e.currentTarget.value : null })}
                                                inputClassName={inputClass}
                                              />
                                            </div>
                                          )}

                                          {/* Contract ID */}
                                          <div>
                                            <label className="text-xs font-medium text-white/50 uppercase tracking-wider block mb-1.5">Contract ID</label>
                                            <input
                                              className={inputClass}
                                              value={coreForm?.contractId ?? contractIdValue ?? ""}
                                              onChange={(e) => updateCoreForm({ contractId: e.target.value ? e.target.value : null })}
                                              placeholder="Enter contract ID"
                                              autoComplete="off"
                                              data-1p-ignore
                                              data-lpignore="true"
                                              data-form-type="other"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Assignment Section */}
                                    {(hasGroup || !hasBuyer) && (
                                      <div className="pt-4 border-t border-white/5">
                                        <div className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">
                                          {hasGroup ? "Assign from Group" : "Find Buyer"}
                                        </div>

                                        {/* Group buyer assignment */}
                                        {hasGroup && hasGroupOptions && (
                                          <div className="space-y-3">
                                            <select
                                              className={inputClass}
                                              value={selectedGroupBuyerKey}
                                              onChange={(e) => setSelectedGroupBuyerKey(e.target.value)}
                                            >
                                              <option value="">Select a group buyer</option>
                                              {groupBuyerOptions.map((opt) => (
                                                <option key={opt.key} value={opt.key}>
                                                  {opt.label}{opt.email ? ` (${opt.email})` : ""}
                                                </option>
                                              ))}
                                            </select>

                                            <div className="flex items-center gap-2">
                                              {hasBuyer && (
                                                <Button size="sm" variant="ghost" type="button" onClick={handleClearBuyer}>
                                                  Clear
                                                </Button>
                                              )}
                                              <Button
                                                size="sm"
                                                variant="primary"
                                                type="button"
                                                onClick={handleAssignBuyerFromGroup}
                                                disabled={!selectedGroupBuyerKey}
                                              >
                                                {hasBuyer ? "Update" : "Assign"}
                                              </Button>
                                            </div>
                                          </div>
                                        )}

                                        {hasGroup && !hasGroupOptions && (
                                          <div className="text-sm text-white/40">
                                            No buyers linked to this group yet.
                                          </div>
                                        )}

                                        {/* Directory search */}
                                        {!hasBuyer && (
                                          <div className="space-y-3 mt-3">
                                            <SearchBar
                                              value={buyerSearchQ}
                                              onChange={setBuyerSearchQ}
                                              placeholder="Search by name, email, or phone"
                                            />
                                            {buyerHits.length > 0 ? (
                                              <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-white/5">
                                                {buyerHits.map((hit) => (
                                                  <button
                                                    key={`${hit.kind}:${hit.id}`}
                                                    type="button"
                                                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
                                                    onClick={() => handleAssignBuyerFromDirectory(hit)}
                                                  >
                                                    <div className="flex flex-col">
                                                      <span className="font-medium text-white/90">{hit.label}</span>
                                                      {hit.sub && (
                                                        <span className="text-xs text-white/50">{hit.sub}</span>
                                                      )}
                                                    </div>
                                                    <span className="text-[10px] uppercase tracking-wider text-white/40 px-2 py-0.5 rounded bg-white/10">
                                                      {hit.kind === "contact" ? "Contact" : "Org"}
                                                    </span>
                                                  </button>
                                                ))}
                                              </div>
                                            ) : buyerSearchQ.trim() ? (
                                              <div className="text-sm text-white/40">No matches found.</div>
                                            ) : null}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}

                        {/* HEALTH TAB */}
                        {drawerTab === "health" && (
                          <SectionCard
                            title="Health and growth"
                          >
                            <div className="space-y-4">
                              <div>
                                <div className="mb-2 flex items-center justify-between">
                                  <div className={labelClass}>
                                    Growth trend
                                  </div>
                                </div>
                                {health.weightSeries && health.weightSeries.length ? (
                                  <GrowthSparkline
                                    series={health.weightSeries}
                                  />
                                ) : (
                                  <div className={labelClass}>
                                    {healthWeightSummary}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <div className={labelClass}>
                                  Health events
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleAddHealthEvent}
                                  disabled={healthSaving}
                                >
                                  Add health event
                                </Button>
                              </div>

                              <div className={labelClass}>
                                {healthEventSummary}
                              </div>
                            </div>
                          </SectionCard>
                        )}

                        {/* MEDIA TAB */}
                        {drawerTab === "media" && (
                          <SectionCard
                            title="Media"
                          >
                            <div className={labelClass}>
                              {mediaSummary}
                            </div>
                          </SectionCard>
                        )}

                        {/* INVOICES TAB */}
                        {drawerTab === "invoices" && (
                          <SectionCard
                            title="Invoices"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className={labelClass}>
                                  Linked invoices
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={linkingInvoice}
                                  onClick={handleLinkInvoice}
                                >
                                  Link invoice
                                </Button>
                              </div>
                              <div className={labelClass}>
                                {invoiceSummary}
                              </div>
                            </div>
                          </SectionCard>
                        )}

                        {/* RECORDS TAB */}
                        {drawerTab === "records" && (
                          <SectionCard
                            title="Related records"
                          >
                            <CrossRefsSection
                              row={row}
                              onNavigateGroup={(id) => navigateToGroup(id)}
                              onNavigateOffspring={(id) => navigateToOffspringSibling(id)}
                              onNavigateWaitlist={(id) => navigateToWaitlist(id)}
                            />
                          </SectionCard>
                        )}

                        {/* NOTES TAB */}
                        {drawerTab === "notes" && (
                          <SectionCard
                            title="Notes"
                          >
                            <div className="text-xs md:text-sm whitespace-pre-wrap">
                              {notes || "No notes recorded yet."}
                            </div>
                          </SectionCard>
                        )}
                      </>
                    );
                  })()}
                </div>
                </DetailsScaffold>
              </div>
            </div>
          </div>
        )}
      </Overlay>
    </div>
  );
}
