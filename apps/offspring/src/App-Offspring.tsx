// App-Offspring.tsx (drop-in, compile-ready)
import * as React from "react";
import {
  PageHeader,
  Card,
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableFooter,
  ColumnsPopover,
  hooks,
  SearchBar,
  DetailsHost,
  DetailsScaffold,
  DetailsSpecRenderer,
  SectionCard,
  Button,
  BreedCombo,
} from "@bhq/ui";
import { Overlay } from "@bhq/ui/overlay";
import { OverlayMount } from "@bhq/ui/overlay/OverlayMount";
import { getOverlayRoot } from "@bhq/ui/overlay";
import "@bhq/ui/styles/table.css";
import { readTenantIdFast, resolveTenantId } from "@bhq/ui/utils/tenant";
import { makeOffspringApi, OffspringRow, WaitlistEntry } from "./api";

/* ───────────────────────── shared utils ───────────────────────── */
function fmtDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return Number.isFinite(dt.getTime()) ? dt.toLocaleDateString() : "";
}
async function withTenant(init?: RequestInit & { tenantId?: number | null }) {
  let tenantId = init?.tenantId ?? readTenantIdFast();
  if (!tenantId) tenantId = await resolveTenantId();

  // try to grab a CSRF token if the shell exposes one
  const metaCsrf =
    (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ||
    (document.querySelector('meta[name="x-csrf-token"]') as HTMLMetaElement | null)?.content ||
    undefined;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as any),
    "x-tenant-id": String(tenantId),
    ...(metaCsrf ? { "x-csrf-token": metaCsrf } : {}),
  };

  // IMPORTANT: send cookies for CSRF validation
  return { ...init, headers, credentials: "include" as const };
}

/* ───────────────────────── Groups table ───────────────────────── */
type GroupTableRow = {
  id: number;
  planCode?: string | null;
  groupName?: string | null;
  species?: string | null;
  breed?: string | null;
  damName?: string | null;
  sireName?: string | null;
  expectedBirth?: string | null;
  expectedPlacementStart?: string | null;
  expectedPlacementCompleted?: string | null;
  countLive?: number | null;
  countReserved?: number | null;
  countSold?: number | null;
  status?: string | null;
  updatedAt?: string | null;
};

const GROUP_COLS: Array<{ key: keyof GroupTableRow & string; label: string; default?: boolean }> = [
  { key: "groupName", label: "Group", default: true },
  { key: "species", label: "Species", default: true },
  { key: "breed", label: "Breed", default: true },
  { key: "damName", label: "Dam", default: true },
  { key: "sireName", label: "Sire", default: true },
  { key: "expectedBirth", label: "Expected Birth", default: true },
  { key: "countSold", label: "Sold", default: true },
  { key: "status", label: "Status", default: true },
  { key: "planCode", label: "Plan", default: false },
  { key: "expectedPlacementStart", label: "Placement Start", default: false },
  { key: "expectedPlacementCompleted", label: "Placement Done", default: false },
  { key: "countLive", label: "Live", default: false },
  { key: "countReserved", label: "Reserved", default: true },
  { key: "updatedAt", label: "Updated", default: false },
];

const GROUP_STORAGE_KEY = "bhq_offspring_groups_cols_v2";

function mapDetailToTableRow(d: OffspringRow): GroupTableRow {
  const planAny = d.plan as any;
  return {
    id: d.id,
    groupName: d.identifier ?? null,
    planCode: d.plan?.code ?? null,
    species: d.plan?.species ?? null,
    breed: d.plan?.breedText ?? null,
    damName: d.plan?.dam?.name ?? null,
    sireName: d.plan?.sire?.name ?? null,
    expectedBirth: d.plan?.expectedPlacementStart ? null : planAny?.expectedBirthDate ?? null,
    expectedPlacementStart: d.dates.placementStartAt ?? d.plan?.expectedPlacementStart ?? null,
    expectedPlacementCompleted: d.dates.placementCompletedAt ?? d.plan?.expectedPlacementCompleted ?? null,
    countLive: d.counts.live ?? null,
    countReserved: d.counts.animals != null ? (d.counts.animals - (d.counts.live ?? 0)) : null,
    countSold: null,
    status: d.plan ? (d.plan.code ? "Committed" : "Planning") : "Unknown",
    updatedAt: d.updatedAt,
  };
}

const groupSections = (mode: "view" | "edit") => [
  {
    title: "Overview",
    fields: [
      { label: "Plan Code", key: "planCode", view: (r: GroupTableRow) => r.planCode || "—" },
      { label: "Group Name", key: "groupName", editor: "text", view: (r: GroupTableRow) => r.groupName || "—" },
      { label: "Species", key: "species", view: (r: GroupTableRow) => r.species || "—" },
      { label: "Breed", key: "breed", view: (r: GroupTableRow) => r.breed || "—" },
      { label: "Dam", key: "damName", view: (r: GroupTableRow) => r.damName || "—" },
      { label: "Sire", key: "sireName", view: (r: GroupTableRow) => r.sireName || "—" },
      { label: "Placement Start", key: "expectedPlacementStart", view: (r: GroupTableRow) => fmtDate(r.expectedPlacementStart) || "—" },
      { label: "Placement Done", key: "expectedPlacementCompleted", view: (r: GroupTableRow) => fmtDate(r.expectedPlacementCompleted) || "—" },
      { label: "Status", key: "status", view: (r: GroupTableRow) => r.status || "—" },
    ],
  },
  {
    title: "Counts",
    fields: [
      { label: "Live", key: "countLive", editor: "number", view: (r: GroupTableRow) => String(r.countLive ?? 0) },
      { label: "Reserved", key: "countReserved", view: (r: GroupTableRow) => String(r.countReserved ?? 0) },
      { label: "Sold", key: "countSold", view: (r: GroupTableRow) => String(r.countSold ?? 0) },
      { label: "Updated", key: "updatedAt", view: (r: GroupTableRow) => fmtDate(r.updatedAt) || "—" },
    ],
  },
];

/* ───────────────────────── Waitlist table ───────────────────────── */
type WaitlistRow = WaitlistEntry;

const WAITLIST_COLS: Array<{ key: keyof WaitlistRow & string; label: string; default?: boolean }> = [
  { key: "contactId", label: "Contact", default: true },
  { key: "organizationId", label: "Org", default: true },
  { key: "speciesPref", label: "Species", default: true },
  { key: "breedPrefText", label: "Breeds", default: true },
  { key: "damPrefId", label: "Dam", default: false },
  { key: "sirePrefId", label: "Sire", default: false },
  { key: "status", label: "Status", default: true },
  { key: "depositPaidAt", label: "Paid At", default: true },
  { key: "priority", label: "Priority", default: true },
  { key: "skipCount", label: "Skips", default: true },
  { key: "lastActivityAt", label: "Activity", default: true },
];

const WAITLIST_STORAGE_KEY = "bhq_waitlist_cols_v2";

/* ───────────────────────── API adapter (no hooks) ───────────────────────── */
function makeApiAdapter() {
  const core: any = makeOffspringApi("/api/v1");
  return {
    list: core.list ?? core.offspring?.list,
    get: core.get ?? core.offspring?.get,
    create: core.create ?? core.offspring?.create,
    patch: core.patch ?? core.offspring?.patch,
    moveWaitlist: core.moveWaitlist ?? core.offspring?.moveWaitlist,
  };
}
const api = makeApiAdapter();

/* ───────────────────────── Plan fetch (COMMITTED only) ───────────────────────── */
type PlanOption = {
  id: number;
  code: string | null;
  name: string;
  species: string;
  breedText: string | null;
};
async function fetchCommittedPlans(): Promise<PlanOption[]> {
  const res = await fetch(`/api/v1/breeding/plans?status=COMMITTED&include=parents`, await withTenant({ method: "GET" }));
  if (!res.ok) throw new Error(`Failed to load committed plans (HTTP ${res.status})`);
  const data = await res.json();
  const items = Array.isArray(data) ? data : (data?.items ?? []);
  return items.map((p: any) => ({
    id: p.id,
    code: p.code ?? null,
    name: p.name,
    species: p.species,
    breedText: p.breedText ?? null,
  }));
}

/* ───────────────────────── Waitlist fetch (global) ───────────────────────── */
type WaitlistListResp = { items: WaitlistEntry[]; total?: number };
async function fetchWaitlist(params?: { q?: string; limit?: number }): Promise<WaitlistListResp> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.limit) qs.set("limit", String(params.limit));
  const res = await fetch(`/api/v1/waitlist${qs.toString() ? `?${qs.toString()}` : ""}`, await withTenant({ method: "GET" }));
  if (!res.ok) throw new Error(`Failed to load waitlist (HTTP ${res.status})`);
  return await res.json();
}

/* ───────────────────────── Directory search (contacts + orgs only) ───────────────────────── */
type SpeciesWire = "DOG" | "CAT" | "HORSE";
type SpeciesUi = "Dog" | "Cat" | "Horse";
const SPECIES_UI_ALL: SpeciesUi[] = ["Dog", "Cat", "Horse"];
const toWireSpecies = (s: SpeciesUi | ""): SpeciesWire | undefined =>
  s === "Dog" ? "DOG" : s === "Cat" ? "CAT" : s === "Horse" ? "HORSE" : undefined;

type DirectoryHit =
  | { kind: "contact"; id: number; label: string; sub?: string }
  | { kind: "org"; id: number; label: string; sub?: string };

async function searchDirectory(q: string): Promise<DirectoryHit[]> {
  const headers = await withTenant({}).then(({ headers }) => headers as any);

  const [cRes, oRes] = await Promise.allSettled([
    fetch(`/api/v1/contacts?q=${encodeURIComponent(q)}&limit=25`, { method: "GET", headers }),
    fetch(`/api/v1/organizations?q=${encodeURIComponent(q)}&limit=25`, { method: "GET", headers }),
  ]);

  const hits: DirectoryHit[] = [];
  if (cRes.status === "fulfilled" && cRes.value.ok) {
    const body = await cRes.value.json();
    const items: any[] = Array.isArray(body) ? body : body?.items ?? [];
    items.forEach((c) => {
      const name = c.display_name || `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "(No name)";
      hits.push({ kind: "contact", id: Number(c.id), label: name, sub: c.email || c.phoneE164 || "" });
    });
  }
  if (oRes.status === "fulfilled" && oRes.value.ok) {
    const body = await oRes.value.json();
    const items: any[] = Array.isArray(body) ? body : body?.items ?? [];
    items.forEach((o) => {
      hits.push({ kind: "org", id: Number(o.id), label: o.name, sub: o.website || o.email || "" });
    });
  }
  return hits;
}

/* ───────────────────────── Animals + waitlist creation ───────────────────────── */
type AnimalLite = { id: number; name: string; species: SpeciesWire; sex: "FEMALE" | "MALE" };
async function fetchAnimals(opts: { q?: string; species?: SpeciesWire; sex?: "FEMALE" | "MALE"; limit?: number }) {
  const qs = new URLSearchParams();
  if (opts.q) qs.set("q", opts.q);
  if (opts.species) qs.set("species", opts.species);
  if (opts.sex) qs.set("sexHint", opts.sex);
  qs.set("limit", String(opts.limit ?? 25));
  const res = await fetch(`/api/v1/animals?${qs}`, await withTenant({ method: "GET" }));
  if (!res.ok) return [];
  const body = await res.json();
  const raw: any[] = Array.isArray(body) ? body : body?.items ?? [];
  return raw.map(a => ({
    id: Number(a.id),
    name: String(a.name ?? "").trim(),
    species: (String(a.species ?? "DOG").toUpperCase() as SpeciesWire),
    sex: (String(a.sex ?? "FEMALE").toUpperCase() as "FEMALE" | "MALE"),
  })) as AnimalLite[];
}

async function createWaitlistEntry(payload: {
  contactId?: number | null;
  organizationId?: number | null;
  speciesPref: SpeciesWire;
  breedPrefText: string;
  damPrefId?: number | null;
  sirePrefId?: number | null;
}) {
  const res = await fetch(`/api/v1/waitlist`, await withTenant({ method: "POST", body: JSON.stringify(payload) }));
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `Failed to create waitlist entry (HTTP ${res.status})`);
  }
  return await res.json();
}

/* ───────────────────────── Dam/Sire search helpers ───────────────────────── */

function useAnimalSearch(query: string, species: SpeciesWire | undefined, sex: "FEMALE" | "MALE") {
  const [hits, setHits] = React.useState<AnimalLite[]>([]);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!species || !query.trim()) { if (alive) setHits([]); return; }
      const res = await fetchAnimals({ q: query.trim(), species, sex, limit: 25 });
      if (alive) setHits(res);
    })();
    return () => { alive = false; };
  }, [query, species, sex]);
  return hits;
}

function DamResults({ query, species, onPick }: { query: string; species?: SpeciesWire; onPick: (a: AnimalLite) => void; }) {
  const hits = useAnimalSearch(query, species, "FEMALE");
  if (!hits.length) return <div className="px-2 py-2 text-sm text-secondary">No females found</div>;
  return (
    <>
      {hits.map(a => (
        <button key={a.id} type="button" onClick={() => onPick(a)} className="w-full text-left px-2 py-1 hover:bg-white/5">
          {a.name}
        </button>
      ))}
    </>
  );
}

function SireResults({ query, species, onPick }: { query: string; species?: SpeciesWire; onPick: (a: AnimalLite) => void; }) {
  const hits = useAnimalSearch(query, species, "MALE");
  if (!hits.length) return <div className="px-2 py-2 text-sm text-secondary">No males found</div>;
  return (
    <>
      {hits.map(a => (
        <button key={a.id} type="button" onClick={() => onPick(a)} className="w-full text-left px-2 py-1 hover:bg-white/5">
          {a.name}
        </button>
      ))}
    </>
  );
}

/* ───────────────────────── Create Group form ───────────────────────── */
function CreateGroupForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [plans, setPlans] = React.useState<PlanOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [planId, setPlanId] = React.useState<number | "">("");
  const [identifier, setIdentifier] = React.useState<string>("");
  const [weanedAt, setWeanedAt] = React.useState<string>("");
  const [placementStartAt, setPlacementStartAt] = React.useState<string>("");
  const [placementCompletedAt, setPlacementCompletedAt] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const list = await fetchCommittedPlans();
        if (!cancelled) setPlans(list);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load committed plans");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [submitting, setSubmitting] = React.useState(false);
  const [submitErr, setSubmitErr] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    if (planId === "" || !Number(planId)) {
      setSubmitErr("Please choose a committed plan.");
      return;
    }
    setSubmitting(true); setSubmitErr(null);
    try {
      await api.create(
        {
          planId: Number(planId),
          identifier: identifier.trim() || null,
          dates: {
            weanedAt: weanedAt || null,
            placementStartAt: placementStartAt || null,
            placementCompletedAt: placementCompletedAt || null,
          },
        },
        {}
      );
      onCreated();
    } catch (e: any) {
      setSubmitErr(e?.message || "Failed to create offspring group");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-[720px] max-w-[94vw]">
      <Card>
        <div className="p-4 space-y-4">
          <div className="text-lg font-semibold">New offspring group</div>
          <div className="text-sm text-secondary">Choose a committed plan and (optionally) add identifiers and dates.</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-secondary">Committed Plan <span className="text-[hsl(var(--brand-orange))]">*</span></span>
              <select
                className="bhq-input"
                value={planId}
                onChange={e => setPlanId(e.target.value ? Number(e.target.value) : "")}
                disabled={loading}
              >
                <option value="">Select a plan…</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.code ? `${p.code} — ` : ""}{p.name} ({p.species}{p.breedText ? ` · ${p.breedText}` : ""})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-secondary">Identifier (optional)</span>
              <input className="bhq-input" value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="e.g., A Litter" />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-secondary">Weaned At (optional)</span>
              <input className="bhq-input" type="date" value={weanedAt} onChange={e => setWeanedAt(e.target.value)} />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-secondary">Placement Start (optional)</span>
              <input className="bhq-input" type="date" value={placementStartAt} onChange={e => setPlacementStartAt(e.target.value)} />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-secondary">Placement Completed (optional)</span>
              <input className="bhq-input" type="date" value={placementCompletedAt} onChange={e => setPlacementCompletedAt(e.target.value)} />
            </label>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {submitErr && <div className="text-sm text-red-600">{submitErr}</div>}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || !planId}>
              {submitting ? "Creating…" : "Create group"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ───────────────────────── Add to Waitlist modal ───────────────────────── */
const MODAL_Z = 2147485000;
const MODAL_BODY_H = 620;

function AddToWaitlistModal({
  open,
  onClose,
  onCreated,
  breedBrowseApi,
  allowedSpecies = SPECIES_UI_ALL,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
  breedBrowseApi: { breeds: { listCanonical: (opts: { species: string; orgId?: number; limit?: number }) => Promise<any[]> } };
  allowedSpecies?: SpeciesUi[];
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev || ""; };
  }, [open]);

  // link target
  const [link, setLink] = React.useState<{ kind: "contact" | "org"; id: number; label: string } | null>(null);

  // search
  const [q, setQ] = React.useState("");
  const [hits, setHits] = React.useState<DirectoryHit[]>([]);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    const run = async () => {
      const qq = q.trim();
      if (!qq || link) { setHits([]); return; }
      setBusy(true);
      try {
        const r = await searchDirectory(qq);
        if (alive) setHits(r);
      } finally { if (alive) setBusy(false); }
    };
    const t = setTimeout(run, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [q, link]);

  // quick add (inline)
  const [quickOpen, setQuickOpen] = React.useState<null | "contact" | "org">(null);
  const [qc, setQc] = React.useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [qo, setQo] = React.useState({ name: "", website: "" });
  const [creating, setCreating] = React.useState(false);
  const [createErr, setCreateErr] = React.useState<string | null>(null);

  async function quickCreateContact(body: { firstName?: string; lastName?: string; email?: string; phone?: string }) {
    const payload = {
      display_name: `${(body.firstName ?? "").trim()} ${(body.lastName ?? "").trim()}`.trim() || "New Contact",
      first_name: body.firstName ?? null,
      last_name: body.lastName ?? null,
      email: body.email ?? null,
      phoneE164: body.phone ?? null,
    };
    const res = await fetch(`/api/v1/contacts`, await withTenant({ method: "POST", body: JSON.stringify(payload) }));
    if (!res.ok) throw new Error(`Failed to create contact (HTTP ${res.status})`);
    return await res.json();
  }
  async function quickCreateOrg(body: { name: string; website?: string }) {
    const res = await fetch(`/api/v1/organizations`, await withTenant({ method: "POST", body: JSON.stringify({ name: body.name, website: body.website ?? null }) }));
    if (!res.ok) throw new Error(`Failed to create organization (HTTP ${res.status})`);
    return await res.json();
  }
  async function doQuickAdd() {
    try {
      setCreating(true); setCreateErr(null);
      if (quickOpen === "contact") {
        const c = await quickCreateContact(qc);
        setLink({ kind: "contact", id: Number(c.id), label: c.display_name || `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "(New contact)" });
        setQuickOpen(null); setQ(""); setHits([]);
      } else if (quickOpen === "org") {
        const o = await quickCreateOrg(qo);
        setLink({ kind: "org", id: Number(o.id), label: o.name || "(New organization)" });
        setQuickOpen(null); setQ(""); setHits([]);
      }
    } catch (e: any) {
      setCreateErr(e?.message || "Create failed.");
    } finally {
      setCreating(false);
    }
  }

  // preferences
  const [speciesUi, setSpeciesUi] = React.useState<SpeciesUi | "">("");
  const speciesWire = toWireSpecies(speciesUi);

  // breed picker: force re-mount on EVERY pick to close menu and allow immediate reselect (even same value)
  const [breed, setBreed] = React.useState<any>(null);
  const [breedNonce, setBreedNonce] = React.useState(0);
  const onBreedPick = React.useCallback((hit: any) => {
    setBreed(hit ? { ...hit } : null);  // clone so React sees a new object even if same breed
    setBreedNonce((n) => n + 1);        // re-mount combo => no click-out needed
  }, []);

  // parents (optional)
  const [damQ, setDamQ] = React.useState("");
  const [sireQ, setSireQ] = React.useState("");
  const [damId, setDamId] = React.useState<number | null>(null);
  const [sireId, setSireId] = React.useState<number | null>(null);

  // dropdown open flags so we can forcibly close to avoid ghost artifacts
  const [damOpen, setDamOpen] = React.useState(false);
  const [sireOpen, setSireOpen] = React.useState(false);

  // submit
  const canSubmit = !!link && !!speciesWire && !!(breed?.name || "").trim();

  async function handleSubmit() {
    if (!canSubmit) return;
    await createWaitlistEntry({
      contactId: link?.kind === "contact" ? link.id : null,
      organizationId: link?.kind === "org" ? link.id : null,
      speciesPref: speciesWire!,
      breedPrefText: (breed?.name ?? "").trim(),
      damPrefId: damId ?? null,
      sirePrefId: sireId ?? null,
    });
    await onCreated();
    onClose();
  }

  // global reset for cancel/close/reopen
  function resetAll() {
    setLink(null);
    setQ(""); setHits([]); setBusy(false); setQuickOpen(null);
    setQc({ firstName: "", lastName: "", email: "", phone: "" });
    setQo({ name: "", website: "" });
    setCreating(false); setCreateErr(null);
    setSpeciesUi(""); setBreed(null); setBreedNonce(0);
    setDamQ(""); setSireQ(""); setDamId(null); setSireId(null);
    setDamOpen(false); setSireOpen(false);
  }

  React.useEffect(() => {
    if (open) resetAll(); // fresh each time it opens
    // when it closes, state is wiped too
    if (!open) resetAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // helpers
  const searchValue = link ? `${link.kind === "contact" ? "Contact" : "Org"} · ${link.label}` : q;
  const clearLinkAndSearch = React.useCallback(() => {
    setLink(null);
    setQ("");
    setHits([]);
    setBusy(false);
  }, []);

  // client-side refine for the “c shows Droids-R-Us” case
  const filteredHits = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return [];
    return hits.filter(h => (h.label || "").toLowerCase().includes(qq));
  }, [hits, q]);

  // sex-strict animal search with client-side guard (in case backend is loose)
  const [damResults, setDamResults] = React.useState<AnimalLite[]>([]);
  const [sireResults, setSireResults] = React.useState<AnimalLite[]>([]);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!speciesWire || !damOpen || !damQ.trim()) { if (alive) setDamResults([]); return; }
      const list = await fetchAnimals({ q: damQ.trim(), species: speciesWire, sex: "FEMALE", limit: 25 });
      const strict = list.filter(a => a.sex === "FEMALE");
      if (alive) setDamResults(strict);
    })();
    return () => { alive = false; };
  }, [damQ, speciesWire, damOpen]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!speciesWire || !sireOpen || !sireQ.trim()) { if (alive) setSireResults([]); return; }
      const list = await fetchAnimals({ q: sireQ.trim(), species: speciesWire, sex: "MALE", limit: 25 });
      const strict = list.filter(a => a.sex === "MALE");
      if (alive) setSireResults(strict);
    })();
    return () => { alive = false; };
  }, [sireQ, speciesWire, sireOpen]);

  return (
    <Overlay open={open} ariaLabel="Add to Waitlist" closeOnEscape closeOnOutsideClick>
      <div
        className="fixed inset-0"
        style={{ zIndex: MODAL_Z, isolation: "isolate" }}
        onMouseDown={(e) => {
          const p = panelRef.current;
          if (!p) return;
          if (!p.contains(e.target as Node)) onClose();
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div ref={panelRef} className="pointer-events-auto w-[820px] max-w-[95vw]">
            <Card>
              {/* fixed-height interior; contents scroll */}
              <div className="p-4 space-y-4" style={{ height: MODAL_BODY_H, overflowY: "auto" }}>
                <div className="text-lg font-semibold">Add to Waitlist</div>

                {/* Search Contacts/Orgs */}
                <div className="relative">
                  <div className="text-xs text-secondary mb-1">Search Contacts or Organizations</div>
                  <div className="relative">
                    <SearchBar
                      value={searchValue}
                      onChange={(val) => {
                        if (link) { clearLinkAndSearch(); setQ(val); }
                        else setQ(val);
                      }}
                      placeholder="Type a name, email, phone, or organization..."
                      widthPx={720}
                      autoFocus={!link}
                    />
                  </div>
                </div>

                {/* Two-column results under search (no drawer growth; container already scrolls) */}
                {!link && q.trim() && (
                  <div className="rounded-md border border-hairline max-h-56 overflow-auto p-2">
                    {busy ? (
                      <div className="px-2 py-2 text-sm text-secondary">Searching…</div>
                    ) : (() => {
                      const contacts = filteredHits.filter(h => h.kind === "contact");
                      const orgs = filteredHits.filter(h => h.kind === "org");
                      const sectionClass = "rounded-md bg-white/5";
                      const pill = (t: string) => <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">{t}</span>;
                      const noContact = !contacts.length;
                      const noOrg = !orgs.length;

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Contacts */}
                          <div className={sectionClass}>
                            <div className="px-2 py-1 text-xs text-secondary sticky top-0 bg-white/5">Contacts</div>
                            {noContact ? (
                              <div className="px-2 py-2 text-sm">
                                <div className="text-secondary">No contacts</div>
                                <div className="mt-2">
                                  <button
                                    className="underline text-primary hover:opacity-80"
                                    onClick={() => setQuickOpen("contact")}
                                  >
                                    + Quick Add Contact
                                  </button>
                                </div>
                              </div>
                            ) : contacts.map(h => (
                              <button
                                key={`contact:${h.id}`}
                                type="button"
                                onClick={() => { setLink({ kind: "contact", id: h.id, label: h.label }); setQ(""); setHits([]); }}
                                className="w-full text-left px-2 py-1 hover:bg-white/5"
                              >
                                <div className="flex items-center gap-2">
                                  {pill("Contact")}<span>{h.label}</span>{h.sub ? <span className="text-xs text-secondary">• {h.sub}</span> : null}
                                </div>
                              </button>
                            ))}
                          </div>

                          {/* Orgs */}
                          <div className={sectionClass}>
                            <div className="px-2 py-1 text-xs text-secondary sticky top-0 bg-white/5">Organizations</div>
                            {noOrg ? (
                              <div className="px-2 py-2 text-sm">
                                <div className="text-secondary">No organizations</div>
                                <div className="mt-2">
                                  <button className="underline text-primary hover:opacity-80" onClick={() => setQuickOpen("org")}>
                                    + Quick Add Organization
                                  </button>
                                </div>
                              </div>
                            ) : orgs.map(h => (
                              <button
                                key={`org:${h.id}`}
                                type="button"
                                onClick={() => { setLink({ kind: "org", id: h.id, label: h.label }); setQ(""); setHits([]); }}
                                className="w-full text-left px-2 py-1 hover:bg-white/5"
                              >
                                <div className="flex items-center gap-2">
                                  {pill("Org")}<span>{h.label}</span>{h.sub ? <span className="text-xs text-secondary">• {h.sub}</span> : null}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Quick add drawers */}
                {!link && quickOpen && (
                  <div className="rounded-lg border border-hairline p-3 bg-surface/60">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        {quickOpen === "contact" ? "Quick Add Contact" : "Quick Add Organization"}
                      </div>
                      <button className="text-xs text-secondary hover:underline" onClick={() => setQuickOpen(null)}>Close</button>
                    </div>

                    {quickOpen === "contact" ? (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input className="bhq-input" placeholder="First name" value={qc.firstName} onChange={e => setQc({ ...qc, firstName: e.target.value })} />
                        <input className="bhq-input" placeholder="Last name" value={qc.lastName} onChange={e => setQc({ ...qc, lastName: e.target.value })} />
                        <input className="bhq-input" placeholder="Email" value={qc.email} onChange={e => setQc({ ...qc, email: e.target.value })} />
                        <input className="bhq-input" placeholder="Phone" value={qc.phone} onChange={e => setQc({ ...qc, phone: e.target.value })} />
                        {createErr && <div className="md:col-span-2 text-sm text-red-600">{createErr}</div>}
                        <div className="md:col-span-2 flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setQc({ firstName: "", lastName: "", email: "", phone: "" })}>Clear</Button>
                          <Button onClick={doQuickAdd} disabled={creating}>{creating ? "Creating…" : "Create & Link"}</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 grid grid-cols-1 gap-2">
                        <input className="bhq-input" placeholder="Organization name" value={qo.name} onChange={e => setQo({ ...qo, name: e.target.value })} />
                        <input className="bhq-input" placeholder="Website (optional)" value={qo.website} onChange={e => setQo({ ...qo, website: e.target.value })} />
                        {createErr && <div className="text-sm text-red-600">{createErr}</div>}
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setQo({ name: "", website: "" })}>Clear</Button>
                          <Button onClick={doQuickAdd} disabled={creating || !qo.name.trim()}>{creating ? "Creating…" : "Create & Link"}</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Preferences (required) */}
                <SectionCard title="Preferences (required)">
                  <div className="p-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-secondary">Species</span>
                      <select
                        className="w-full h-9 rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                        value={speciesUi}
                        onChange={(e) => { setSpeciesUi(e.currentTarget.value as SpeciesUi); setDamId(null); setSireId(null); setDamQ(""); setSireQ(""); setDamOpen(false); setSireOpen(false); setBreed(null); setBreedNonce(n => n + 1); }}
                      >
                        <option value="">—</option>
                        {allowedSpecies.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </label>

                    <div className="md:col-span-2 relative">
                      <div className="text-xs text-secondary mb-1">Breed</div>
                      {speciesUi ? (
                        <BreedCombo
                          key={`breed-${speciesUi}-${breedNonce}`}
                          species={speciesUi as SpeciesUi}
                          value={breed}
                          onChange={onBreedPick}
                          api={breedBrowseApi}
                        />
                      ) : (
                        <div className="h-9 px-3 flex items-center rounded-md border border-hairline bg-surface/60 text-sm text-secondary">
                          Select Species
                        </div>
                      )}
                    </div>
                  </div>
                </SectionCard>

                {/* Parents (optional) */}
                <SectionCard title="Preferred Parents (optional)">
                  <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Dam (Female) */}
                    <label className="flex flex-col gap-1 relative">
                      <span className="text-xs text-secondary">Dam (Female)</span>
                      {!speciesWire ? (
                        <div className="h-9 px-3 flex items-center rounded-md border border-hairline bg-surface/60 text-sm text-secondary">
                          Select Species
                        </div>
                      ) : (
                        <>
                          <SearchBar
                            value={damQ}
                            onChange={(val) => { setDamQ(val); setDamOpen(!!val.trim()); }}
                            onFocus={() => setDamOpen(!!damQ.trim())}
                            onBlur={() => setTimeout(() => setDamOpen(false), 100)}
                            placeholder="Search females…"
                            widthPx={360}
                          />
                          {damOpen && damQ.trim() && (
                            <div
                              className="absolute z-10 left-0 right-0 rounded-md border border-hairline bg-surface"
                              style={{ top: "calc(100% + 6px)", maxHeight: 160, overflowY: "auto" }}
                            >
                              {damResults.length ? (
                                damResults.map(a => (
                                  <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => { setDamId(a.id); setDamQ(a.name); setDamOpen(false); }}
                                    className="w-full text-left px-2 py-1 hover:bg-white/5"
                                  >
                                    {a.name}
                                  </button>
                                ))
                              ) : (
                                <div className="px-2 py-2 text-sm text-secondary">No females found</div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </label>

                    {/* Sire (Male) */}
                    <label className="flex flex-col gap-1 relative">
                      <span className="text-xs text-secondary">Sire (Male)</span>
                      {!speciesWire ? (
                        <div className="h-9 px-3 flex items-center rounded-md border border-hairline bg-surface/60 text-sm text-secondary">
                          Select Species
                        </div>
                      ) : (
                        <>
                          <SearchBar
                            value={sireQ}
                            onChange={(val) => { setSireQ(val); setSireOpen(!!val.trim()); }}
                            onFocus={() => setSireOpen(!!sireQ.trim())}
                            onBlur={() => setTimeout(() => setSireOpen(false), 100)}
                            placeholder="Search males…"
                            widthPx={360}
                          />
                          {sireOpen && sireQ.trim() && (
                            <div
                              className="absolute z-10 left-0 right-0 rounded-md border border-hairline bg-surface"
                              style={{ top: "calc(100% + 6px)", maxHeight: 160, overflowY: "auto" }}
                            >
                              {sireResults.length ? (
                                sireResults.map(a => (
                                  <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => { setSireId(a.id); setSireQ(a.name); setSireOpen(false); }}
                                    className="w-full text-left px-2 py-1 hover:bg-white/5"
                                  >
                                    {a.name}
                                  </button>
                                ))
                              ) : (
                                <div className="px-2 py-2 text-sm text-secondary">No males found</div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </label>
                  </div>
                </SectionCard>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { resetAll(); onClose(); }}>Cancel</Button>
                  <Button onClick={handleSubmit} disabled={!canSubmit}>Add to waitlist</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

/* ───────────────────────── Tabs ───────────────────────── */
function OffspringGroupsTab() {
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<GroupTableRow[]>([]);
  const [raw, setRaw] = React.useState<OffspringRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [createOpen, setCreateOpen] = React.useState(false);

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    if (createOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev || ""; };
  }, [createOpen]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.list({ q: q || undefined, limit: 100 });
      setRaw(res.items);
      setRows(res.items.map(mapDetailToTableRow));
    } catch (e: any) {
      setError(e?.message || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, [q]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await load();
    })();
    return () => { cancelled = true; };
  }, [q, load]);

  const { map, toggle, setAll, visible } = hooks.useColumns(GROUP_COLS, GROUP_STORAGE_KEY);
  const visibleSafe = visible?.length ? visible : GROUP_COLS;

  const [sorts, setSorts] = React.useState<Array<{ key: string; dir: "asc" | "desc" }>>([]);
  const onToggleSort = (key: string) => {
    setSorts(prev => {
      const f = prev.find(s => s.key === key);
      if (!f) return [{ key, dir: "asc" }];
      if (f.dir === "asc") return prev.map(s => (s.key === key ? { ...s, dir: "desc" } : s));
      return prev.filter(s => s.key !== key);
    });
  };

  const [pageSize, setPageSize] = React.useState(25);
  const [page, setPage] = React.useState(1);

  const sorted = React.useMemo(() => {
    const list = [...rows];
    if (!sorts.length) return list;
    list.sort((a, b) => {
      for (const s of sorts) {
        const av = (a as any)[s.key];
        const bv = (b as any)[s.key];
        const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true, sensitivity: "base" });
        if (cmp !== 0) return s.dir === "asc" ? cmp : -cmp;
      }
      return 0;
    });
    return list;
  }, [rows, sorts]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const start = sorted.length === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const end = sorted.length === 0 ? 0 : Math.min(sorted.length, start - 1 + pageSize);
  const pageRows = React.useMemo(() => {
    const from = (clampedPage - 1) * pageSize;
    const to = from + pageSize;
    return sorted.slice(from, to);
  }, [sorted, clampedPage, pageSize]);

  return (
    <Card>
      {/* Overlay root + modal */}
      <OverlayMount />

      {/* Absolute top-right button cluster */}
      <div className="relative">
        <div className="absolute right-0 top-0 h-10 flex items-center gap-2 pr-2" style={{ zIndex: 50, pointerEvents: "auto" }}>
          <Button size="sm" onClick={() => setCreateOpen(true)}>Create Group</Button>
        </div>

        <DetailsHost
          rows={raw}
          config={{
            idParam: "groupId",
            getRowId: (r: OffspringRow) => r.id,
            width: 920,
            placement: "center",
            align: "top",
            fetchRow: async (id: number) => raw.find(r => r.id === id)!,
            onSave: async (row: OffspringRow, draft: any) => {
              const body: any = {};
              if (draft.identifier !== undefined) body.identifier = draft.identifier;
              if (draft.counts) {
                body.counts = {
                  countBorn: draft.counts.countBorn ?? null,
                  countLive: draft.counts.countLive ?? null,
                  countStillborn: draft.counts.countStillborn ?? null,
                  countMale: draft.counts.countMale ?? null,
                  countFemale: draft.counts.countFemale ?? null,
                };
              }
              if (draft.dates) {
                body.dates = {
                  birthedStartAt: draft.dates.birthedStartAt ?? null,
                  birthedEndAt: draft.dates.birthedEndAt ?? null,
                  weanedAt: draft.dates.weanedAt ?? null,
                  placementStartAt: draft.dates.placementStartAt ?? null,
                  placementCompletedAt: draft.dates.placementCompletedAt ?? null,
                };
              }
              const updated = await api.patch(row.id, body);
              const idx = raw.findIndex(r => r.id === row.id);
              if (idx >= 0) {
                const next = [...raw];
                next[idx] = updated as any;
                setRaw(next);
                setRows(next.map(mapDetailToTableRow));
              }
            },
            header: (r: OffspringRow) => ({
              title: r.identifier || r.plan?.code || `Group #${r.id}`,
              subtitle: r.plan?.breedText || r.plan?.species || "",
            }),
            tabs: [
              { key: "overview", label: "Overview" },
              { key: "buyers", label: "Buyers" },
              { key: "analytics", label: "Analytics" },
            ],
            customChrome: true,
            render: ({ row, mode, setMode, activeTab, setActiveTab, requestSave }: any) => {
              const tblRow = mapDetailToTableRow(row);
              return (
                <DetailsScaffold
                  title={tblRow.groupName || tblRow.planCode || `Group #${tblRow.id}`}
                  subtitle={tblRow.breed || tblRow.species || ""}
                  mode={mode}
                  onEdit={() => setMode("edit")}
                  onCancel={() => setMode("view")}
                  onSave={requestSave}
                  tabs={[
                    { key: "overview", label: "Overview" },
                    { key: "buyers", label: "Buyers" },
                    { key: "analytics", label: "Analytics" },
                  ]}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  rightActions={
                    <Button size="sm" variant="outline" onClick={() => window.open(`/breeding/plan/${row.plan?.id}`, "_blank")}>
                      Open plan
                    </Button>
                  }
                >
                  {activeTab === "overview" && (
                    <DetailsSpecRenderer<GroupTableRow>
                      row={tblRow}
                      mode={mode}
                      setDraft={() => { }}
                      sections={groupSections(mode)}
                    />
                  )}
                  {activeTab === "buyers" && (
                    <SectionCard title="Buyers">
                      <div className="text-sm text-secondary">
                        Selection order comes from depositPaidAt then createdAt. Use the Waitlist tab to manage entries and move them into this group.
                      </div>
                    </SectionCard>
                  )}
                  {activeTab === "analytics" && (
                    <SectionCard title="Analytics">
                      <div className="text-sm text-secondary">Coverage, skips, and placement nudges will surface here.</div>
                    </SectionCard>
                  )}
                </DetailsScaffold>
              );
            },
          }}
        >
          <Table
            columns={GROUP_COLS}
            columnState={map}
            onColumnStateChange={setAll}
            getRowId={(r: GroupTableRow) => r.id}
            pageSize={25}
            renderStickyRight={() => (
              <ColumnsPopover columns={map} onToggle={toggle} onSet={setAll} allColumns={GROUP_COLS} triggerClassName="bhq-columns-trigger" />
            )}
            stickyRightWidthPx={40}
          >
            <div className="bhq-table__toolbar px-2 pt-2 pb-3 relative z-30 flex items-center justify-between">
              <SearchBar value={q} onChange={setQ} placeholder="Search groups…" widthPx={520} />
              <div />
            </div>

            <table className="min-w-max w-full text-sm">
              <TableHeader columns={visibleSafe} sorts={sorts} onToggleSort={onToggleSort} />
              <tbody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={visibleSafe.length}>
                      <div className="py-8 text-center text-sm text-secondary">Loading groups…</div>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && error && (
                  <TableRow>
                    <TableCell colSpan={visibleSafe.length}>
                      <div className="py-8 text-center text-sm text-red-600">Error: {error}</div>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && !error && pageRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={visibleSafe.length}>
                      <div className="py-8 text-center text-sm text-secondary">No groups.</div>
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  !error &&
                  pageRows.map((r) => (
                    <TableRow key={r.id} detailsRow={raw.find(x => x.id === r.id)!}>
                      {visibleSafe.map((c) => {
                        let v: any = (r as any)[c.key];
                        if (c.key === "expectedBirth" || c.key === "expectedPlacementStart" || c.key === "expectedPlacementCompleted" || c.key === "updatedAt") {
                          v = fmtDate(v);
                        }
                        return <TableCell key={c.key}>{v ?? ""}</TableCell>;
                      })}
                    </TableRow>
                  ))}
              </tbody>
            </table>

            <TableFooter
              entityLabel="groups"
              page={Math.min(page, Math.max(1, Math.ceil(sorted.length / pageSize)))}
              pageCount={Math.max(1, Math.ceil(sorted.length / pageSize))}
              pageSize={pageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(n) => {
                setPageSize(n);
                setPage(1);
              }}
              start={sorted.length === 0 ? 0 : (page - 1) * pageSize + 1}
              end={sorted.length === 0 ? 0 : Math.min(sorted.length, (page - 1) * pageSize + pageSize)}
              filteredTotal={sorted.length}
              total={rows.length}
            />
          </Table>
        </DetailsHost>
      </div>

      {/* Create Group Modal */}
      <Overlay open={createOpen} ariaLabel="Create Offspring Group" closeOnEscape closeOnOutsideClick>
        {(() => {
          const panelRef = React.useRef<HTMLDivElement>(null);
          const handleOutsideMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
            const p = panelRef.current;
            if (!p) return;
            if (!p.contains(e.target as Node)) setCreateOpen(false);
          };
          return (
            <div className="fixed inset-0" style={{ zIndex: MODAL_Z, isolation: "isolate" }} onMouseDown={handleOutsideMouseDown}>
              <div className="absolute inset-0 bg-black/50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div ref={panelRef} className="pointer-events-auto">
                  <CreateGroupForm
                    onCreated={async () => {
                      setCreateOpen(false);
                      await load();
                    }}
                    onCancel={() => setCreateOpen(false)}
                  />
                </div>
              </div>
            </div>
          );
        })()}
      </Overlay>
    </Card>
  );
}

function WaitlistTab() {
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<WaitlistRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [addOpen, setAddOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchWaitlist({ q: q || undefined, limit: 100 });
        if (!cancelled) setRows(res.items);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load waitlist");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [q]);

  const { map, toggle, setAll, visible } = hooks.useColumns(WAITLIST_COLS, WAITLIST_STORAGE_KEY);
  const visibleSafe = visible?.length ? visible : WAITLIST_COLS;

  const breedBrowseApi = React.useMemo(
    () => ({
      breeds: {
        listCanonical: (opts: { species: string; orgId?: number; limit?: number }) =>
          fetch(`/api/v1/breeds/canonical?species=${encodeURIComponent(opts.species)}&limit=${opts.limit ?? 50}`, { method: "GET" })
            .then(r => r.ok ? r.json() : Promise.resolve([])),
      },
    }),
    []
  );

  return (
    <Card>
      <OverlayMount />
      <div className="relative">
        <div className="absolute right-0 top-0 h-10 flex items-center gap-2 pr-2" style={{ zIndex: 50, pointerEvents: "auto" }}>
          <Button size="sm" onClick={() => setAddOpen(true)}>Add to Waitlist</Button>
        </div>

        <Table
          columns={WAITLIST_COLS}
          columnState={map}
          onColumnStateChange={setAll}
          getRowId={(r: WaitlistRow) => r.id}
          pageSize={25}
          renderStickyRight={() => (
            <ColumnsPopover columns={map} onToggle={toggle} onSet={setAll} allColumns={WAITLIST_COLS} triggerClassName="bhq-columns-trigger" />
          )}
          stickyRightWidthPx={40}
        >
          <div className="bhq-table__toolbar px-2 pt-2 pb-3 relative z-30 flex items-center justify-between">
            <SearchBar value={q} onChange={setQ} placeholder="Search waitlist…" widthPx={520} />
            <div />
          </div>

          <table className="min-w-max w-full text-sm">
            <TableHeader columns={visibleSafe} sorts={[]} onToggleSort={() => { }} />
            <tbody>
              {loading && (
                <TableRow><TableCell colSpan={visibleSafe.length}><div className="py-8 text-center text-sm text-secondary">Loading waitlist…</div></TableCell></TableRow>
              )}
              {!loading && error && (
                <TableRow><TableCell colSpan={visibleSafe.length}><div className="py-8 text-center text-sm text-red-600">Error: {error}</div></TableCell></TableRow>
              )}
              {!loading && !error && rows.length === 0 && (
                <TableRow><TableCell colSpan={visibleSafe.length}><div className="py-8 text-center text-sm text-secondary">No entries.</div></TableCell></TableRow>
              )}
              {!loading && !error && rows.length > 0 && rows.map(r => (
                <TableRow key={r.id}>
                  {visibleSafe.map(c => {
                    let v: any = (r as any)[c.key];
                    if (c.key === "depositPaidAt" || c.key === "lastActivityAt") v = fmtDate(v);
                    return <TableCell key={c.key}>{Array.isArray(v) ? v.join(", ") : (v ?? "")}</TableCell>;
                  })}
                </TableRow>
              ))}
            </tbody>
          </table>
        </Table>
      </div>

      <AddToWaitlistModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={async () => {
          try {
            const res = await fetchWaitlist({ q: q || undefined, limit: 100 });
            setRows(res.items);
          } catch { /* noop */ }
        }}
        breedBrowseApi={breedBrowseApi}
      />
    </Card>
  );
}

/* ───────────────────────── Module shell ───────────────────────── */
export default function OffspringModule() {
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent("bhq:module", { detail: { key: "offspring", label: "Offspring" } }));
  }, []);

  React.useEffect(() => {
    if (!getOverlayRoot()) {
      console.warn("ColumnsPopover needs an overlay root. Add <div id='bhq-overlay-root'></div> to the shell.");
    }
  }, []);

  const [activeTab, setActiveTab] = React.useState<"groups" | "waitlist">("groups");

  return (
    <div className="p-4 space-y-4">
      <PageHeader
        title="Offspring"
        subtitle="Offspring Groups and the global Waitlist"
        rightSlot={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={["px-3 h-8 rounded-md text-sm", activeTab === "groups" ? "bg-white/10" : "bg-white/5 hover:bg-white/10"].join(" ")}
              onClick={() => setActiveTab("groups")}
            >
              Groups
            </button>
            <button
              type="button"
              className={["px-3 h-8 rounded-md text-sm", activeTab === "waitlist" ? "bg-white/10" : "bg-white/5 hover:bg-white/10"].join(" ")}
              onClick={() => setActiveTab("waitlist")}
            >
              Waitlist
            </button>
          </div>
        }
      />

      {activeTab === "groups" && <OffspringGroupsTab />}
      {activeTab === "waitlist" && <WaitlistTab />}
    </div>
  );
}
