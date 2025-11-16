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
  Card,
  Tabs,
} from "@bhq/ui";


import { Overlay } from "@bhq/ui/overlay";
import {
  ChevronDown,
  ChevronUp,
  FilePlus2,
  Plus,
  FileText,
  DollarSign,
  Stethoscope,
  Image as ImageIcon,
  Users,
  User,
  Trash2,
  Link2 as LinkIcon,
  Wand2,
} from "lucide-react";
import {
  makeOffspringApiClient,
  type OffspringDTO,
  type OffspringGroupDTO,
  type OffspringInvoiceLinkDTO,
  type WaitlistEntryDTO,
} from "../api";
import { readTenantIdFast } from "@bhq/ui/utils/tenant";

type DirectoryHit =
  | { kind: "contact"; id: number; label: string; sub?: string }
  | { kind: "org"; id: number; label: string; sub?: string };

type DirectoryLink = {
  kind: "contact" | "org";
  id: number;
  label: string;
  sub?: string;
};

async function searchDirectoryRaw(
  q: string,
): Promise<DirectoryHit[]> {
  if (!q.trim()) return [];

  let root: ReturnType<typeof makeOffspringApiClient> | null = null;
  try {
    root = makeOffspringApiClient();
  } catch {
    root = null;
  }
  if (!root) return [];

  const [cRes, oRes] = await Promise.allSettled([
    root.contacts?.list({ q, limit: 25 }) as any,
    root.organizations?.list({ q, limit: 25 }) as any,
  ]);

  const hits: DirectoryHit[] = [];

  if (cRes.status === "fulfilled" && cRes.value) {
    const items: any[] = Array.isArray(cRes.value)
      ? cRes.value
      : cRes.value.items ?? [];
    for (const c of items) {
      const name =
        c.display_name ||
        `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() ||
        "(No name)";
      hits.push({
        kind: "contact",
        id: Number(c.id),
        label: name,
        sub: c.email || c.phoneE164 || "",
      });
    }
  }

  if (oRes.status === "fulfilled" && oRes.value) {
    const items: any[] = Array.isArray(oRes.value)
      ? oRes.value
      : oRes.value.items ?? [];
    for (const o of items) {
      hits.push({
        kind: "org",
        id: Number(o.id),
        label: o.name,
        sub: o.website || o.email || "",
      });
    }
  }

  return hits;
}

function normalizeStr(s?: string | null) {
  return (s ?? "").trim().toLowerCase();
}

async function findBestContactMatch(
  probe: { email?: string; phone?: string; firstName?: string; lastName?: string },
): Promise<any | null> {
  let root: ReturnType<typeof makeOffspringApiClient> | null = null;
  try {
    root = makeOffspringApiClient();
  } catch {
    root = null;
  }
  if (!root) return null;

  const tries: string[] = [];
  if (probe.email) tries.push(probe.email);
  if (probe.phone) tries.push(probe.phone);
  const name = `${probe.firstName ?? ""} ${probe.lastName ?? ""}`.trim();
  if (name) tries.push(name);

  for (const q of tries) {
    const res = await root.contacts.list({ q, limit: 10 });
    const items: any[] = Array.isArray(res) ? res : res?.items ?? [];
    if (!items.length) continue;

    if (probe.email) {
      const e = normalizeStr(probe.email);
      const hit = items.find(
        (c) => normalizeStr(c.email) === e,
      );
      if (hit) return hit;
    }

    if (probe.phone) {
      const p = normalizeStr(probe.phone);
      const hit = items.find(
        (c) =>
          normalizeStr(c.phoneE164) === p ||
          normalizeStr(c.phone_e164) === p,
      );
      if (hit) return hit;
    }

    if (name) {
      const nNorm = normalizeStr(name);
      const hit = items.find(
        (c) =>
          normalizeStr(
            c.display_name ||
            `${c.first_name ?? ""} ${c.last_name ?? ""}`,
          ) === nNorm,
      );
      if (hit) return hit;
    }
  }

  return null;
}

async function exactContactLookup(
  body: { email?: string; phone?: string; firstName?: string; lastName?: string },
): Promise<any | null> {
  if (!body.email && !body.phone) return null;

  let root: ReturnType<typeof makeOffspringApiClient> | null = null;
  try {
    root = makeOffspringApiClient();
  } catch {
    root = null;
  }
  if (!root) return null;

  const res = await root.contacts.list({
    q:
      body.email?.trim() ||
      body.phone?.trim() ||
      `${body.firstName ?? ""} ${body.lastName ?? ""}`.trim(),
    limit: 10,
  });
  const items: any[] = Array.isArray(res) ? res : res?.items ?? [];
  if (!items.length) return null;

  if (body.email) {
    const e = normalizeStr(body.email);
    const hit = items.find(
      (c) => normalizeStr(c.email) === e,
    );
    if (hit) return hit;
  }

  if (body.phone) {
    const p = normalizeStr(body.phone);
    const hit = items.find(
      (c) =>
        normalizeStr(c.phoneE164) === p ||
        normalizeStr(c.phone_e164) === p,
    );
    if (hit) return hit;
  }

  return null;
}

function stripEmpty(obj: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && !v.trim()) continue;
    out[k] = v;
  }
  return out;
}

function conflictExistingIdFromError(e: any): number | null {
  const raw = e?.response?.data ?? e?.data ?? null;
  if (!raw) return null;
  const id =
    raw.conflictId ??
    raw.existingId ??
    raw.id ??
    null;
  if (!id) return null;
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

async function quickCreateContact(body: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}): Promise<any> {
  const probe = {
    email: body.email,
    phone: body.phone,
    firstName: body.firstName,
    lastName: body.lastName,
  };

  let root: ReturnType<typeof makeOffspringApiClient> | null = null;
  try {
    root = makeOffspringApiClient();
  } catch {
    root = null;
  }
  if (!root) throw new Error("Contact API not available");

  const existing = await findBestContactMatch(probe);
  if (existing) return existing;

  const payload = stripEmpty({
    display_name:
      `${(body.firstName ?? "").trim()} ${(body.lastName ?? "").trim()}`.trim() ||
      undefined,
    first_name: body.firstName,
    last_name: body.lastName,
    email: body.email,
    phoneE164: body.phone,
    phone_e164: body.phone,
  });

  try {
    return await root.contacts.create(payload);
  } catch (e: any) {
    const status = e?.status ?? e?.code ?? e?.response?.status;
    if (status === 409) {
      const id = conflictExistingIdFromError(e);
      if (id && root.contacts.get) {
        const contact = await root.contacts.get(id);
        if (contact) return contact;
      }
      const post = await exactContactLookup(body);
      if (post) return post;
    }
    throw e;
  }
}

async function quickCreateOrg(body: {
  name: string;
  website?: string;
  email?: string;
  phone?: string;
}): Promise<any> {
  let root: ReturnType<typeof makeOffspringApiClient> | null = null;
  try {
    root = makeOffspringApiClient();
  } catch {
    root = null;
  }
  if (!root) throw new Error("Org API not available");

  const payload = stripEmpty({
    name: body.name,
    website: body.website,
    email: body.email,
    phone: body.phone,
  });

  const created = await root.organizations.create(payload);
  return created;
}


// Shared input styling
const inputClass =
  "w-full h-9 rounded-md border border-hairline bg-surface px-3 text-sm text-primary " +
  "placeholder:text-secondary/80 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--brand-orange))] " +
  "focus:border-[hsl(var(--brand-orange))] shadow-[inset_0_0_0_9999px_rgba(255,255,255,0.02)]";

function cx(parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const labelClass = "text-xs text-secondary";

const MODAL_Z = 2147485000;

/** ---------- Types for this page ---------- */
type ID = string | number;
type Sex = "MALE" | "FEMALE" | "UNKNOWN";
type Status = "AVAILABLE" | "RESERVED" | "PLACED" | "HOLDBACK" | "DECEASED";
type Species = "DOG" | "CAT" | "HORSE";
type Money = number;

type Buyer = { id: ID; name: string };
type GroupLite = { id: ID; name: string };

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

type AssignBuyerEventDetail = {
  offspringId: number;
  currentBuyer: OffspringBuyerLite | null;
  onSelect: (payload: { kind: OffspringBuyerKind; id: number }) => Promise<void> | void;
};

type AssignBuyerModalProps = {
  open: boolean;
  onClose: () => void;
  detail: AssignBuyerEventDetail;
};

function AssignBuyerModal({ open, onClose, detail }: AssignBuyerModalProps) {
  const [link, setLink] = React.useState<DirectoryLink | null>(() => {
    if (!detail.currentBuyer) return null;
    return {
      kind: detail.currentBuyer.kind === "contact" ? "contact" : "org",
      id: detail.currentBuyer.id,
      label: detail.currentBuyer.name,
      sub: detail.currentBuyer.email ?? detail.currentBuyer.phone ?? "",
    };
  });

  const [q, setQ] = React.useState("");
  const [hits, setHits] = React.useState<DirectoryHit[]>([]);
  const [busy, setBusy] = React.useState(false);

  const [quickOpen, setQuickOpen] = React.useState<null | "contact" | "org">(null);
  const [qc, setQc] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [qo, setQo] = React.useState({
    name: "",
    website: "",
  });
  const [creating, setCreating] = React.useState(false);
  const [createErr, setCreateErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const query = q.trim();
      if (!query) {
        if (alive) {
          setHits([]);
          setBusy(false);
        }
        return;
      }
      setBusy(true);
      try {
        const res = await searchDirectoryRaw(query);
        if (!alive) return;
        setHits(res);
      } catch (e) {
        console.error("Directory search failed", e);
        if (!alive) return;
        setHits([]);
      } finally {
        if (!alive) return;
        setBusy(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [q]);

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  const canSubmit = !!link;

  function handleUseHit(h: DirectoryHit) {
    setLink({
      kind: h.kind,
      id: h.id,
      label: h.label,
      sub: h.sub,
    });
  }

  async function doQuickAdd() {
    setCreateErr(null);
    setCreating(true);
    try {
      if (quickOpen === "contact") {
        const c = await quickCreateContact({
          firstName: qc.firstName,
          lastName: qc.lastName,
          email: qc.email,
          phone: qc.phone,
        });
        setLink({
          kind: "contact",
          id: Number(c.id),
          label:
            c.display_name ||
            `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() ||
            "(No name)",
          sub: c.email || c.phoneE164 || "",
        });
      } else if (quickOpen === "org") {
        const o = await quickCreateOrg({
          name: qo.name,
          website: qo.website,
        });
        setLink({
          kind: "org",
          id: Number(o.id),
          label: o.name || "(No name)",
          sub: o.website || o.email || "",
        });
      }
      setQuickOpen(null);
    } catch (e: any) {
      console.error("Quick add failed", e);
      setCreateErr(e?.message || "Failed to create record");
    } finally {
      setCreating(false);
    }
  }

  async function handleSubmit() {
    if (!link) return;
    const payload: { kind: OffspringBuyerKind; id: number } =
      link.kind === "contact"
        ? { kind: "contact", id: link.id }
        : { kind: "organization", id: link.id };
    await detail.onSelect(payload);
    onClose();
  }

  if (!open) return null;

  return (
    <Overlay
      open={open}
      ariaLabel="Assign buyer"
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ zIndex: MODAL_Z }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl border border-hairline bg-surface shadow-xl">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
              <h2 className="text-sm font-medium text-primary">
                Assign buyer
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* Directory search */}
              <SectionCard
                title="Directory"
                description="Search contacts and organizations, or add new records."
              >
                <div className="flex items-center gap-2">
                  <SearchBar
                    value={q}
                    onChange={setQ}
                    placeholder="Search contacts and organizations"
                    widthPx={320}
                  />
                  {busy && (
                    <span className="text-xs text-secondary">
                      Searching...
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setQuickOpen("contact")}
                    >
                      + Quick Add Contact
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setQuickOpen("org")}
                    >
                      + Quick Add Organization
                    </Button>
                  </div>
                </div>

                {!link && q.trim() && (
                  <div className="mt-3 rounded-md border border-hairline max-h-56 overflow-auto p-2">
                    {busy ? (
                      <div className="px-2 py-2 text-sm text-secondary">
                        Searching...
                      </div>
                    ) : hits.length === 0 ? (
                      <div className="px-2 py-2 text-sm text-secondary">
                        No results. Try adjusting your search or use Quick Add.
                      </div>
                    ) : (
                      hits.map((h) => (
                        <button
                          key={`${h.kind}-${h.id}`}
                          type="button"
                          className={cx(
                            "w-full text-left px-2 py-1 hover:bg-white/5",
                            link &&
                            link.kind === h.kind &&
                            link.id === h.id &&
                            "bg-white/10",
                          )}
                          onClick={() => handleUseHit(h)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wide text-secondary border px-1 rounded">
                              {h.kind === "contact" ? "Contact" : "Org"}
                            </span>
                            <span>{h.label}</span>
                            {h.sub ? (
                              <span className="text-xs text-secondary">
                                • {h.sub}
                              </span>
                            ) : null}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                <div className="mt-3 text-xs text-secondary">
                  {link ? (
                    <>
                      Selected buyer:{" "}
                      <span className="text-primary font-medium">
                        {link.label}
                      </span>
                      {link.sub ? (
                        <span className="text-secondary">
                          {" "}
                          ({link.sub})
                        </span>
                      ) : null}
                    </>
                  ) : (
                    "No buyer selected yet."
                  )}
                </div>

                {!link && quickOpen && (
                  <div className="mt-3 rounded-lg border border-hairline p-3 bg-surface/60">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        {quickOpen === "contact"
                          ? "Quick Add Contact"
                          : "Quick Add Organization"}
                      </div>
                      <button
                        className="text-xs text-secondary hover:underline"
                        onClick={() => setQuickOpen(null)}
                      >
                        Close
                      </button>
                    </div>

                    {quickOpen === "contact" ? (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          className={cx(inputClass)}
                          placeholder="First name"
                          value={qc.firstName}
                          onChange={(e) =>
                            setQc({ ...qc, firstName: e.target.value })
                          }
                        />
                        <input
                          className={cx(inputClass)}
                          placeholder="Last name"
                          value={qc.lastName}
                          onChange={(e) =>
                            setQc({ ...qc, lastName: e.target.value })
                          }
                        />
                        <input
                          className={cx(inputClass)}
                          placeholder="Email"
                          value={qc.email}
                          onChange={(e) =>
                            setQc({ ...qc, email: e.target.value })
                          }
                        />
                        <input
                          className={cx(inputClass)}
                          placeholder="Phone"
                          value={qc.phone}
                          onChange={(e) =>
                            setQc({ ...qc, phone: e.target.value })
                          }
                        />
                        {createErr && (
                          <div className="md:col-span-2 text-sm text-red-600">
                            {createErr}
                          </div>
                        )}
                        <div className="md:col-span-2 flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() =>
                              setQc({
                                firstName: "",
                                lastName: "",
                                email: "",
                                phone: "",
                              })
                            }
                          >
                            Clear
                          </Button>
                          <Button
                            onClick={doQuickAdd}
                            disabled={creating}
                          >
                            {creating ? "Creating..." : "Create / Link"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 grid grid-cols-1 gap-2">
                        <input
                          className={cx(inputClass)}
                          placeholder="Organization name"
                          value={qo.name}
                          onChange={(e) =>
                            setQo({ ...qo, name: e.target.value })
                          }
                        />
                        <input
                          className={cx(inputClass)}
                          placeholder="Website"
                          value={qo.website}
                          onChange={(e) =>
                            setQo({ ...qo, website: e.target.value })
                          }
                        />
                        {createErr && (
                          <div className="text-sm text-red-600">
                            {createErr}
                          </div>
                        )}
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() =>
                              setQo({
                                name: "",
                                website: "",
                              })
                            }
                          >
                            Clear
                          </Button>
                          <Button
                            onClick={doQuickAdd}
                            disabled={creating}
                          >
                            {creating ? "Creating..." : "Create / Link"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </SectionCard>
            </div>

            <div className="flex justify-end gap-2 px-4 py-3 border-t border-hairline">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                <Plus className="h-4 w-4 mr-1" />
                Assign buyer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

function OffspringAssignBuyerBridge() {
  const [detail, setDetail] = React.useState<AssignBuyerEventDetail | null>(null);

  React.useEffect(() => {
    function handler(ev: Event) {
      const e = ev as CustomEvent<AssignBuyerEventDetail>;
      setDetail(e.detail);
    }

    window.addEventListener("bhq:offspring:assign-buyer", handler as any);
    return () => {
      window.removeEventListener("bhq:offspring:assign-buyer", handler as any);
    };
  }, []);

  const open = !!detail;

  if (!open || !detail) return null;

  return (
    <AssignBuyerModal
      open={open}
      onClose={() => setDetail(null)}
      detail={detail}
    />
  );
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
  tenantId: number;
  identifier: string | null;
  createdAt: string;
  updatedAt: string;

  // Table-level fields
  name: string | null;
  placeholderLabel: string | null;
  sex: Sex | null;
  color: string | null;
  birthWeightOz: number | null;
  status: OffspringStatus;
  buyer: OffspringBuyerLite | null;
  placementDate: string | null;
  price: number | null; // dollars

  // Identity
  species: string;
  breedText: string | null;
  dob: string | null;
  microchip: string | null;
  registrationId: string | null;

  // Group / hierarchy
  groupId: number | null;
  groupCode: string | null;
  groupName: string | null;
  groupSeasonLabel: string | null;

  // Cross-refs
  buyerContactId: number | null;
  buyerOrganizationId: number | null;
  contractId: number | null;

  siblings?: SiblingLite[];
  waitlistEntry?: WaitlistRefLite | null;

  // Detail tabs
  healthEvents?: HealthEvent[];
  media?: OffspringMedia[];
  lineage?: OffspringLineageRow[];
  invoices?: InvoiceLink[];

  // Raw notes / blob
  notes?: string | null;
  data?: unknown;
};

/** Normalized API surface used by this page */
type OffspringListInput = {
  page: number;
  pageSize: number;
  q?: string;
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
  buyerContactId: number | null;
  buyerOrganizationId: number | null;
  placementDate: string | null;
  price: number | null;
  microchip: string | null;
  registrationId: string | null;
  notes: string | null;
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
  create(input: OffspringUpdateInput & { groupId: number }): Promise<OffspringRow>;
  update(id: number, patch: OffspringUpdateInput): Promise<OffspringRow>;
  remove(id: number): Promise<void>;

  addHealthEvent(id: number, input: HealthEventInput): Promise<OffspringRow>;
  linkInvoice(id: number, input: InvoiceLinkInput): Promise<OffspringRow>;
};

function centsToDollars(cents: number | null | undefined): number | null {
  if (cents == null) return null;
  return Math.round(cents) / 100;
}

function mapOffspringDtoToRow(dto: OffspringDTO): OffspringRow {
  const {
    id,
    tenantId,
    identifier,
    createdAt,
    updatedAt,
    name,
    placeholderLabel,
    sex,
    status,
    bornAt,
    species,
    group,
    buyerPartyType,
    buyerContact,
    buyerContactId,
    buyerOrganization,
    buyerOrganizationId,
    priceCents,
    placedAt,
    data,
    notes,
    HealthLogs,
    Attachments,
    InvoiceLinks,
    WaitlistAllocations,
  } = dto;

  const color =
    (data && (data as any).color) ??
    (data && (data as any).coatColor) ??
    null;

  const birthWeightOz =
    (data && (data as any).birthWeightOz) ??
    (data && (data as any).birthWeight) ??
    null;

  const microchip =
    (data && (data as any).microchip) ??
    (data && (data as any).microchipId) ??
    null;

  const registrationId =
    (data && (data as any).registrationId) ??
    (data && (data as any).regNumber) ??
    null;

  const buyer: OffspringBuyerLite | null = (() => {
    if (buyerPartyType === "CONTACT" && buyerContact && buyerContactId != null) {
      return {
        kind: "contact",
        id: buyerContactId,
        name: buyerContact.displayName ?? buyerContact.name ?? "(Unnamed contact)",
        email: buyerContact.email ?? null,
        phone: buyerContact.phone ?? null,
      };
    }
    if (buyerPartyType === "ORGANIZATION" && buyerOrganization && buyerOrganizationId != null) {
      return {
        kind: "organization",
        id: buyerOrganizationId,
        name: buyerOrganization.name ?? "(Unnamed organization)",
        email: buyerOrganization.email ?? null,
        phone: buyerOrganization.phone ?? null,
      };
    }
    return null;
  })();

  const breedText =
    (group?.plan as any)?.breedText ??
    (group?.plan as any)?.breed ??
    null;

  const groupCode =
    group?.code ??
    (group?.plan as any)?.code ??
    null;

  const groupSeasonLabel =
    (group as any)?.seasonLabel ??
    (group as any)?.season ??
    null;

  const siblings: SiblingLite[] =
    (group as any)?.offspring?.map((s: any) => ({
      id: s.id,
      name: s.name ?? s.placeholderLabel ?? null,
      sex: s.sex ?? null,
      status: s.status ?? null,
    })) ?? [];

  const waitlistEntry: WaitlistRefLite | null =
    WaitlistAllocations && WaitlistAllocations.length
      ? {
        id: WaitlistAllocations[0].id,
        label:
          WaitlistAllocations[0].label ??
          WaitlistAllocations[0].code ??
          `Waitlist #${WaitlistAllocations[0].id}`,
        priority: (WaitlistAllocations[0] as any).priority ?? null,
        status: (WaitlistAllocations[0] as any).status ?? null,
      }
      : null;

  const healthEvents: HealthEvent[] =
    HealthLogs?.map((h: any) => ({
      id: h.id,
      kind: h.kind ?? h.type ?? "HEALTH",
      occurredAt: h.occurredAt ?? h.date ?? h.createdAt,
      notes: h.notes ?? null,
      weightOz:
        h.weightOz ??
        (h.data && (h.data as any).weightOz) ??
        null,
    })) ?? [];

  const media: OffspringMedia[] =
    Attachments?.map((att: any) => {
      const mime = att.mimeType ?? att.contentType ?? null;
      const kind: OffspringMediaKind =
        mime && typeof mime === "string" && mime.startsWith("image/")
          ? "photo"
          : mime && mime.startsWith("video/")
            ? "video"
            : "doc";

      return {
        id: att.id,
        kind,
        label: att.label ?? att.filename ?? `Attachment #${att.id}`,
        url: att.publicUrl ?? att.url ?? "",
        mimeType: mime,
        bytes: att.size ?? null,
      };
    }) ?? [];

  const invoices: InvoiceLink[] =
    InvoiceLinks?.map((link: OffspringInvoiceLinkDTO) => ({
      id: link.id,
      invoiceId: link.invoiceId,
      invoiceNumber:
        (link.invoice && (link.invoice as any).number) ??
        (link.invoice && (link.invoice as any).invoiceNumber) ??
        String(link.invoiceId),
      status:
        (link.invoice && (link.invoice as any).status) ??
        link.status ??
        "UNKNOWN",
      amount:
        link.amount != null
          ? link.amount
          : centsToDollars(
            (link.invoice && (link.invoice as any).totalCents) ?? null,
          ) ?? 0,
    })) ?? [];

  const lineage: OffspringLineageRow[] = [];
  if (group?.dam) {
    lineage.push({
      id: group.dam.id,
      role: "dam",
      name: group.dam.name ?? "(Unnamed dam)",
      registrationId: (group.dam as any).registrationId ?? null,
    });
  }
  if (group?.sire) {
    lineage.push({
      id: group.sire.id,
      role: "sire",
      name: group.sire.name ?? "(Unnamed sire)",
      registrationId: (group.sire as any).registrationId ?? null,
    });
  }
  if ((dto as any).promotedAnimal) {
    const pa = (dto as any).promotedAnimal;
    lineage.push({
      id: pa.id,
      role: "self",
      name: pa.name ?? "(Promoted animal)",
      registrationId: pa.registrationId ?? null,
    });
  }

  return {
    id,
    tenantId,
    identifier: identifier ?? null,
    createdAt,
    updatedAt,

    name: name ?? null,
    placeholderLabel: placeholderLabel ?? null,
    sex: sex ?? null,
    color,
    birthWeightOz: birthWeightOz ?? null,
    status,
    buyer,
    placementDate: placedAt ?? null,
    price: centsToDollars(priceCents),

    species,
    breedText,
    dob: bornAt ?? null,
    microchip,
    registrationId,

    groupId: group?.id ?? null,
    groupCode,
    groupName: (group as any)?.name ?? groupCode,
    groupSeasonLabel,

    buyerContactId: buyerContactId ?? null,
    buyerOrganizationId: buyerOrganizationId ?? null,
    contractId: (dto as any).contractId ?? null,

    siblings,
    waitlistEntry,

    healthEvents,
    media,
    lineage,
    invoices,

    notes: notes ?? null,
    data,
  };
}

function makeBackendOffspringApi(): OffspringApi | null {
  let root: ReturnType<typeof makeOffspringApiClient> | null = null;
  try {
    root = makeOffspringApiClient();
  } catch {
    root = null;
  }
  if (!root || !root.offspring) return null;

  const tenantId = readTenantIdFast();

  return {
    async list(input) {
      const res: any = await root!.offspring.list({
        tenantId,
        // backend expects limit / cursor, not page / pageSize
        limit: input.pageSize,
        q: input.q ?? "",
      });

      const items: any[] = res && Array.isArray(res.items)
        ? res.items
        : Array.isArray((res as any).rows)
          ? (res as any).rows
          : [];

      const rows = items.map((dto: any) => mapOffspringDtoToRow(dto as OffspringDTO));
      const total = typeof (res as any).total === "number" ? (res as any).total : items.length;

      return { rows, total };
    },

    async getById(id) {
      const dto = await root!.offspring.get(id, { tenantId });
      return mapOffspringDtoToRow(dto);
    },

    async create(input) {
      const dto = await root!.offspring.create({
        tenantId,
        groupId: input.groupId,
        payload: input,
      } as any);
      return mapOffspringDtoToRow(dto);
    },

    async update(id, patch) {
      const dto = await root!.offspring.update({
        tenantId,
        id,
        payload: patch,
      } as any);
      return mapOffspringDtoToRow(dto);
    },

    async remove(id) {
      await root!.offspring.remove({ tenantId, id });
    },

    async addHealthEvent(id, input) {
      if (!root!.offspring.events?.add) {
        throw new Error("Health events API is not available");
      }
      await root!.offspring.events.add({
        tenantId,
        offspringId: id,
        payload: {
          occurredAt: input.occurredAt,
          kind: input.kind,
          notes: input.notes,
          data: input.weightOz != null ? { weightOz: input.weightOz } : undefined,
        },
      } as any);

      const dto = await root!.offspring.get(id, { tenantId });
      return mapOffspringDtoToRow(dto);
    },

    async linkInvoice(id, input) {
      const resp = await fetch(
        `/api/v1/offspring/${id}/invoice-links?tenantId=${encodeURIComponent(
          String(tenantId),
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceNumber: input.invoiceNumber,
            amount: input.amount,
            status: input.status,
          }),
        },
      );
      if (!resp.ok) {
        throw new Error(`Failed to link invoice, status ${resp.status}`);
      }

      const dto = await root!.offspring.get(id, { tenantId });
      return mapOffspringDtoToRow(dto);
    },
  };
}

/** ---------- Local fallback API for dev / storybook ---------- */

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

/** ---------- Backend API adapter around makeOffspringApi() ---------- */

function useOffspringApi(): OffspringApi {
  if (typeof window === "undefined") {
    return {
      list: async () => ({ rows: [], total: 0 }),
      getById: async () => {
        throw new Error("getById not available on server");
      },
      create: async () => {
        throw new Error("create not available on server");
      },
      update: async () => {
        throw new Error("update not available on server");
      },
      remove: async () => {
        throw new Error("remove not available on server");
      },
      addHealthEvent: async () => {
        throw new Error("addHealthEvent not available on server");
      },
      linkInvoice: async () => {
        throw new Error("linkInvoice not available on server");
      },
    };
  }
  const backend = makeBackendOffspringApi();
  if (backend) return backend;
  return makeLocalFallbackApi();
}

/** ---------- Helpers ---------- */

const CENTER_KEYS = new Set(["sex", "status", "birthWeightOz", "placementDate", "price"]);

const ALL_COLUMNS = [
  { key: "name", label: "Name", default: true },
  { key: "sex", label: "Sex", default: true },
  { key: "color", label: "Color", default: true },
  { key: "birthWeightOz", label: "Birth wt (oz)", default: false },
  { key: "status", label: "Status", default: true },
  { key: "buyer", label: "Buyer", default: true },
  { key: "group", label: "Group", default: true },
  { key: "dob", label: "Birth", default: true },
  { key: "placementDate", label: "Placement", default: true },
  { key: "price", label: "Price", default: true },
  { key: "microchip", label: "Microchip", default: false },
  { key: "registrationId", label: "Registration", default: false },
] as const;

const OFFSPRING_STORAGE_KEY = "bhq_offspring_cols_v1";


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

function prettyStatus(s: Status): string {
  switch (s) {
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

/** ---------- Create Offspring overlay ---------- */

function CreateOffspringOverlayContent({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: Partial<OffspringRow>) => Promise<void> | void;
}) {
  const [form, setForm] = React.useState<Partial<OffspringRow>>({
    name: "",
    sex: "UNKNOWN" as Sex,
    species: "DOG" as Species,
    status: "AVAILABLE" as Status,
    birthWeightOz: null,
    price: null,
    notes: "",
  });

  const panelRef = React.useRef<HTMLDivElement | null>(null);

  const handleOutsideMouseDown = React.useCallback<
    React.MouseEventHandler<HTMLDivElement>
  >(
    (e) => {
      const p = panelRef.current;
      if (!p) return;
      if (!p.contains(e.target as Node)) onClose();
    },
    [onClose],
  );

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  const handleChange = <K extends keyof OffspringRow>(
    key: K,
    value: OffspringRow[K] | null,
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    await onCreate(form);
  };

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
        onMouseDown={handleOutsideMouseDown}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Centered panel, same pattern as Create Group and Add to Waitlist */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            ref={panelRef}
            className="pointer-events-auto w-[820px] max-w-[95vw] max-h-[82vh] overflow-hidden rounded-xl border border-hairline bg-surface shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
              <div className="text-lg font-semibold flex items-center gap-2">
                <FilePlus2 className="h-4 w-4" />
                <span>Create offspring</span>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm">
                  <span className="text-xs text-secondary">Name</span>
                  <input
                    className={inputClass}
                    value={form.name ?? ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Puppy name or placeholder"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  <span className="text-xs text-secondary">Sex</span>
                  <select
                    className={inputClass}
                    value={form.sex ?? "UNKNOWN"}
                    onChange={(e) =>
                      handleChange("sex", e.target.value as Sex)
                    }
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="UNKNOWN">Unknown</option>
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  <span className="text-xs text-secondary">Species</span>
                  <select
                    className={inputClass}
                    value={form.species ?? "DOG"}
                    onChange={(e) =>
                      handleChange("species", e.target.value as Species)
                    }
                  >
                    <option value="DOG">Dog</option>
                    <option value="CAT">Cat</option>
                    <option value="HORSE">Horse</option>
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  <span className="text-xs text-secondary">Status</span>
                  <select
                    className={inputClass}
                    value={form.status ?? "AVAILABLE"}
                    onChange={(e) =>
                      handleChange("status", e.target.value as Status)
                    }
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="PLACED">Placed</option>
                    <option value="HOLDBACK">Holdback</option>
                    <option value="DECEASED">Deceased</option>
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  <span className="text-xs text-secondary">
                    Birth date
                  </span>
                  <input
                    type="date"
                    className={inputClass}
                    value={(form as any).birthDate ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        birthDate: e.target.value || null,
                      }))
                    }
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  <span className="text-xs text-secondary">
                    Birth weight (oz)
                  </span>
                  <input
                    type="number"
                    className={inputClass}
                    value={
                      form.birthWeightOz != null
                        ? String(form.birthWeightOz)
                        : ""
                    }
                    onChange={(e) =>
                      handleChange(
                        "birthWeightOz",
                        e.target.value
                          ? Number(e.target.value)
                          : null,
                      )
                    }
                    placeholder="Optional"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  <span className="text-xs text-secondary">
                    Price (whole number)
                  </span>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-secondary">
                      $
                    </span>
                    <input
                      type="number"
                      className={inputClass + " pl-6"}
                      value={
                        form.price != null ? String(form.price) : ""
                      }
                      onChange={(e) =>
                        handleChange(
                          "price",
                          e.target.value
                            ? Number(e.target.value)
                            : null,
                        )
                      }
                      placeholder="Optional"
                    />
                  </div>
                </label>
              </div>

              <label className="grid gap-1 text-sm">
                <span className="text-xs text-secondary">Notes</span>
                <textarea
                  className={inputClass + " min-h-[80px] resize-y"}
                  value={form.notes ?? ""}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Optional notes about this offspring"
                />
              </label>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-hairline">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmit}>
                <Plus className="h-4 w-4 mr-1" />
                Create offspring
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
                <div className="text-xs text-muted-foreground">
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
          <div className="text-xs text-muted-foreground">
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
            {row.siblings.map((s) => (
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
          <div className="text-xs text-muted-foreground">
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
              <div className="text-xs text-muted-foreground">
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
          <div className="text-xs text-muted-foreground">
            No waitlist entry linked to this offspring.
          </div>
        )}
      </div>
    </div>
  );
}

type GrowthSparklineProps = {
  events?: HealthEvent[];
};

function GrowthSparkline({ events }: GrowthSparklineProps) {
  const points = React.useMemo(() => {
    if (!events || !events.length) return [];

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
  }, [events]);

  if (!points.length) {
    return (
      <div className="text-xs text-muted-foreground">
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
  const api = React.useMemo(() => useOffspringApi(), []);

  const [q, setQ] = React.useState("");
  const [pageSize, setPageSize] = React.useState(25);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [rows, setRows] = React.useState<OffspringRow[]>([]);
  const [sorts, setSorts] = React.useState<{ key: ColumnKey; dir: "asc" | "desc" }[]>([]);
  const cols = hooks.useColumns(ALL_COLUMNS as any, OFFSPRING_STORAGE_KEY);
  const visibleSafe = cols.visible && cols.visible.length > 0 ? cols.visible : ALL_COLUMNS;

  const [drawer, setDrawer] = React.useState<OffspringRow | null>(null);
  const [drawerTab, setDrawerTab] = React.useState<
    "overview" | "buyer" | "health" | "media" | "invoices" | "records" | "notes"
  >("overview");

  const [coreForm, setCoreForm] = React.useState<Partial<OffspringRow> | null>(null);

  const [showCreate, setShowCreate] = React.useState(false);

  function handleAssignBuyer() {
    if (!drawer) return;

    window.dispatchEvent(
      new CustomEvent("bhq:offspring:assign-buyer", {
        detail: {
          offspringId: drawer.id,
          currentBuyer: drawer.buyer,
          async onSelect(payload: { kind: OffspringBuyerKind; id: number }) {
            try {
              const patch: OffspringUpdateInput = {
                buyerContactId:
                  payload.kind === "contact" ? payload.id : null,
                buyerOrganizationId:
                  payload.kind === "organization" ? payload.id : null,
              };
              const updated = await api.update(drawer.id, patch);
              setDrawer(updated);
              window.dispatchEvent(
                new CustomEvent("bhq:offspring:buyer:assigned", {
                  detail: { offspringId: drawer.id },
                }),
              );
            } catch (err) {
              console.error(err);
              alert("Failed to assign buyer");
            }
          },
        },
      }),
    );
  }


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
    const res = await api.list({ q, page, pageSize });
    setRows(Array.isArray(res.rows) ? res.rows : []);
    setTotal(typeof res.total === "number" ? res.total : 0);
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
    });
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
    writeUrlParam(null);
  }

  const detailsPanelRef = React.useRef<HTMLDivElement | null>(null);

  function navigateToGroup(groupId: ID) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", "groups");
      url.searchParams.set("groupId", String(groupId));
      window.history.pushState({}, "", url.toString());
      window.dispatchEvent(
        new CustomEvent("bhq:offspring:navigate", { detail: { tab: "groups", groupId } })
      );
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


  async function saveCoreSection() {
    if (!drawer || !coreForm) return;
    try {
      const patch: Partial<OffspringRow> = {
        name: coreForm.name ?? null,
        placeholderLabel: coreForm.placeholderLabel ?? null,
        sex: (coreForm.sex as Sex) ?? drawer.sex,
        color: coreForm.color ?? null,
        birthWeightOz: coreForm.birthWeightOz ?? null,
        status: (coreForm.status as Status) ?? drawer.status,
        dob: coreForm.dob ?? drawer.dob,
        placementDate: coreForm.placementDate ?? drawer.placementDate,
        price: coreForm.price ?? drawer.price,
        microchip: coreForm.microchip ?? drawer.microchip,
        registrationId: coreForm.registrationId ?? drawer.registrationId,
        notes: coreForm.notes ?? drawer.notes,
      };
      const updated = await api.update(drawer.id, patch);
      setDrawer(updated);
      setRows((prev) =>
        prev.map((r) => (String(r.id) === String(updated.id) ? updated : r))
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
          right={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" /> New
              </Button>
            </div>
          }
        />
      )}

      <SectionCard>
        <Table
          columns={ALL_COLUMNS as any}
          columnState={cols.map}
          onColumnStateChange={cols.setAll}
          getRowId={(r: OffspringRow) => r.id}
          pageSize={25}
          renderStickyRight={() => (
            <ColumnsPopover
              columns={cols.map}
              onToggle={cols.toggle}
              onSet={cols.setAll}
              allColumns={ALL_COLUMNS as any}
              triggerClassName="bhq-columns-trigger"
            />
          )}
          stickyRightWidthPx={40}
        >
          <div className="bhq-table__toolbar px-2 pt-2 pb-3 relative z-30 flex items-center justify-between">
            <SearchBar
              value={q}
              onChange={(v) => {
                setQ(v);
                setPage(1);
              }}
              placeholder="Search name, buyer, group, microchip"
              widthPx={520}
            />
            <Button
              size="sm"
              variant="primary"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Offspring
            </Button>
          </div>
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
                        val = r.buyer ? r.buyer.name : "-";
                      }

                      if (k === "group") {
                        if (r.groupId) {
                          const label =
                            r.groupName ||
                            r.groupCode ||
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

                      if (k === "color") {
                        val = r.color ?? "-";
                      }

                      if (k === "status") {
                        val = prettyStatus(r.status as OffspringStatus);
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

          <TableFooter colSpan={visibleSafe.length}>
            <TableRow>
              <TableCell colSpan={visibleSafe.length}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">
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
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </SectionCard>

      <CreateOffspringOverlayContent
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={async (input) => {
          try {
            const created = await api.create(input);
            setShowCreate(false);
            await refresh();
            const full = await api.getById(created.id);
            if (full) {
              setDrawer(full);
              writeUrlParam(full.id);
              setDrawerTab("overview");
            }
            window.dispatchEvent(new CustomEvent("bhq:offspring:created"));
          } catch {
            window.alert("Failed to create offspring");
          }
        }}
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
                className="pointer-events-auto mt-10 mb-10 flex flex-col overflow-hidden rounded-xl border border-hairline bg-surface shadow-xl"
                style={{ width: 960, maxWidth: "calc(100vw - 80px)" }}
                onMouseDown={(e) => {
                  // keep clicks inside the panel from bubbling to the outer close handler
                  e.stopPropagation();
                }}
              >
                <DetailsScaffold
                  title={
                    drawer.name ||
                    drawer.placeholderLabel ||
                    drawer.identifier ||
                    "Unnamed offspring"
                  }
                  subtitle={
                    drawer.status
                      ? `Status ${prettyStatus(drawer.status as OffspringStatus)}`
                      : "Status not set"
                  }
                  mode="view"
                  tabs={[
                    { key: "overview", label: "Overview" },
                    { key: "buyer", label: "Buyer" },
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
                />

                {/* Body */}
                <div className="px-5 py-4 space-y-6">
                  {(() => {
                    const row = drawer as any;
                    if (!row) return null;

                    const group = row.group;
                    const buyer = row.buyer;
                    const health = row.healthSummary || {};
                    const media = row.mediaSummary || {};
                    const invoices = row.invoiceSummary || {};
                    const crossRefs = row.crossRefs || {};
                    const notes: string = row.notes || "";

                    const name =
                      row.name || row.identifier || "Unnamed offspring";
                    const statusLabel =
                      row.statusLabel || row.status || "Status not set";

                    const sexLabel =
                      row.sexLabel || row.sex || "Unknown";
                    const colorLabel =
                      row.colorLabel || row.color || "Unknown";
                    const speciesLabel =
                      row.speciesLabel || row.species || "Unknown";
                    const dobLabel =
                      row.birthDateLabel || row.birthDate || "Unknown";
                    const birthWeightLabel =
                      row.birthWeightLabel || row.birthWeight || "Unknown";
                    const microchipLabel =
                      row.microchip || "None";
                    const registrationLabel =
                      row.registration || "None";

                    const groupName =
                      group?.identifier || group?.name || "Not linked to group";
                    const groupCode =
                      group?.code || "n/a";
                    const placementLabel =
                      row.placementStatusLabel || row.placementStatus || "Not set";
                    const placementDateLabel =
                      row.placementDateLabel || row.placementDate || "Not placed";
                    const priceLabel =
                      row.priceLabel || row.price || "Not set";

                    const buyerName =
                      buyer?.displayName || buyer?.name || "No buyer assigned";
                    const buyerContact =
                      buyer?.contactName || buyer?.primaryContactName || "No contact info";

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
                          <>
                            <SectionCard title="Identity">
                              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs md:text-sm">
                                <div>
                                  <dt className="text-xs text-muted-foreground">
                                    Name
                                  </dt>
                                  <dd className="text-sm">{name}</dd>
                                </div>
                                <div>
                                  <dt className="text-xs text-muted-foreground">
                                    Status
                                  </dt>
                                  <dd className="text-sm">{statusLabel}</dd>
                                </div>
                                <div>
                                  <dt className="text-xs text-muted-foreground">
                                    Species
                                  </dt>
                                  <dd className="text-sm">{speciesLabel}</dd>
                                </div>
                                <div>
                                  <dt className="text-xs text-muted-foreground">
                                    Sex
                                  </dt>
                                  <dd className="text-sm">{sexLabel}</dd>
                                </div>
                                <div>
                                  <dt className="text-xs text-muted-foreground">
                                    Color
                                  </dt>
                                  <dd className="text-sm">{colorLabel}</dd>
                                </div>
                                <div>
                                  <dt className="text-xs text-muted-foreground">
                                    Date of birth
                                  </dt>
                                  <dd className="text-sm">{dobLabel}</dd>
                                </div>
                                <div>
                                  <dt className="text-xs text-muted-foreground">
                                    Birth weight
                                  </dt>
                                  <dd className="text-sm">{birthWeightLabel}</dd>
                                </div>
                                <div>
                                  <dt className="text-xs text-muted-foreground">
                                    Microchip
                                  </dt>
                                  <dd className="text-sm">{microchipLabel}</dd>
                                </div>
                                <div>
                                  <dt className="text-xs text-muted-foreground">
                                    Registration
                                  </dt>
                                  <dd className="text-sm">{registrationLabel}</dd>
                                </div>
                              </dl>
                            </SectionCard>

                            <SectionCard title="Group and placement">
                              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs md:text-sm">
                                <div>
                                  <dt className="text-xs text-muted-foreground">
                                    Group
                                  </dt>
                                  <dd className="text-sm">
                                    {group ? (
                                      <Button
                                        variant="link"
                                        className="h-auto p-0 text-sm"
                                        onClick={() =>
                                          navigateToGroup(group.id)
                                        }
                                      >
                                        {groupName}
                                      </Button>
                                    ) : (
                                      groupName
                                    )}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-xs text-muted-foreground">
                                    Group code
                                  </dt>
                                  <dd className="text-sm">{groupCode}</dd>
                                </div>
                                <div>
                                  <dt className="text-xs text-muted-foreground">
                                    Identifier
                                  </dt>
                                  <dd className="text-sm">
                                    {row.identifier || "Not set"}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-xs text-muted-foreground">
                                    Price
                                  </dt>
                                  <dd className="text-sm">{priceLabel}</dd>
                                </div>
                                <div>
                                  <dt className="text-xs text-muted-foreground">
                                    Placement date
                                  </dt>
                                  <dd className="text-sm">
                                    {placementDateLabel}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-xs text-muted-foreground">
                                    Placement status
                                  </dt>
                                  <dd className="text-sm">
                                    {placementLabel}
                                  </dd>
                                </div>
                              </dl>
                            </SectionCard>

                            <SectionCard title="At a glance">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
                                <div>
                                  <div className="text-xs text-muted-foreground">
                                    Buyer
                                  </div>
                                  <div className="text-sm">{buyerName}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">
                                    Health
                                  </div>
                                  <div className="text-sm">
                                    {healthEventSummary}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">
                                    Invoices
                                  </div>
                                  <div className="text-sm">
                                    {invoiceSummary}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">
                                    Media
                                  </div>
                                  <div className="text-sm">{mediaSummary}</div>
                                </div>
                              </div>
                            </SectionCard>
                          </>
                        )}

                        {/* BUYER TAB */}
                        {drawerTab === "buyer" && (
                          <SectionCard
                            title="Buyer"
                            description="Link a buyer and see basic contact details."
                          >
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <div className="text-xs text-muted-foreground">
                                    Buyer
                                  </div>
                                  <div className="text-sm">{buyerName}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Contact
                                  </div>
                                  <div className="text-sm">{buyerContact}</div>
                                </div>
                                <div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleAssignBuyer}
                                  >
                                    Assign buyer
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </SectionCard>
                        )}

                        {/* HEALTH TAB */}
                        {drawerTab === "health" && (
                          <SectionCard
                            title="Health and growth"
                            description="Review growth trend and recorded health events."
                          >
                            <div className="space-y-4">
                              <div>
                                <div className="mb-2 flex items-center justify-between">
                                  <div className="text-xs text-muted-foreground">
                                    Growth trend
                                  </div>
                                </div>
                                {health.weightSeries && health.weightSeries.length ? (
                                  <GrowthSparkline
                                    series={health.weightSeries}
                                  />
                                ) : (
                                  <div className="text-xs text-muted-foreground">
                                    {healthWeightSummary}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <div className="text-xs text-muted-foreground">
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

                              <div className="text-xs text-muted-foreground">
                                {healthEventSummary}
                              </div>
                            </div>
                          </SectionCard>
                        )}

                        {/* MEDIA TAB */}
                        {drawerTab === "media" && (
                          <SectionCard
                            title="Media"
                            description="Media files linked to this offspring."
                          >
                            <div className="text-xs text-muted-foreground">
                              {mediaSummary}
                            </div>
                          </SectionCard>
                        )}

                        {/* INVOICES TAB */}
                        {drawerTab === "invoices" && (
                          <SectionCard
                            title="Invoices"
                            description="Invoices linked to this offspring."
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-xs text-muted-foreground">
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
                              <div className="text-xs text-muted-foreground">
                                {invoiceSummary}
                              </div>
                            </div>
                          </SectionCard>
                        )}

                        {/* RECORDS TAB */}
                        {drawerTab === "records" && (
                          <SectionCard
                            title="Related records"
                            description="Navigate between related groups, siblings, and waitlist entries."
                          >
                            <CrossRefsSection
                              crossRefs={crossRefs}
                              onOpenGroup={(id) => navigateToGroup(id)}
                              onOpenSibling={(id) =>
                                navigateToOffspringSibling(id)
                              }
                              onOpenWaitlistEntry={(id) =>
                                navigateToWaitlist(id)
                              }
                            />
                          </SectionCard>
                        )}

                        {/* NOTES TAB */}
                        {drawerTab === "notes" && (
                          <SectionCard
                            title="Notes"
                            description="Internal notes for this offspring."
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
              </div>
            </div>
          </div>
        )}
      </Overlay>
      <OffspringAssignBuyerBridge />
    </div>
  );
}
