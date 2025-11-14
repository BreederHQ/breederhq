// apps/offspring/src/pages/WaitlistPage.tsx
import * as React from "react";
import ReactDOM from "react-dom";
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
import { getOverlayRoot } from "@bhq/ui/overlay";
import "@bhq/ui/styles/table.css";
import { readTenantIdFast, resolveTenantId } from "@bhq/ui/utils/tenant";
import { makeOffspringApi, WaitlistEntry } from "../api";


/* URL param helper used by row clicks to open drawers */
function setParamAndNotify(name: string, value: string | number | null | undefined) {
  try {
    const url = new URL(window.location.href);
    if (value === null || value === undefined || value === "") url.searchParams.delete(name);
    else url.searchParams.set(name, String(value));
    window.history.pushState({}, "", url);
    window.dispatchEvent(new Event("popstate"));
  } catch {
    // no-op in non-browser
  }
}

// local UI tokens
const labelClass = "text-xs text-secondary";
const inputClass =
  "w-full h-9 rounded-md border border-hairline bg-surface px-3 text-sm text-primary " +
  "placeholder:text-secondary/80 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--brand-orange))] " +
  "focus:border-[hsl(var(--brand-orange))] shadow-[inset_0_0_0_9999px_rgba(255,255,255,0.02)]";
function cx(...p: Array<string | false | null | undefined>) {
  return p.filter(Boolean).join(" ");
}

function SectionChipHeading({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="sticky top-0 z-10 px-2 py-1.5 bg-gradient-to-r from-white/8 to-transparent border-b border-white/10">
      <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase text-[var(--color-text,#c9c9c9)]">
        {icon}
        <span>{text}</span>
        <span className="ml-auto h-px w-24 rounded-full bg-[hsl(var(--brand-orange)/0.65)]" />
      </div>
    </div>
  );
}
/** InlineSearch, same look and behavior as the App-Offspring Waitlist tab */
function InlineSearch({
  value,
  onChange,
  placeholder,
  disabled,
  widthPx = 400,
  onFocus,
  onBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
  widthPx?: number;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  return (
    <div className="relative" style={{ maxWidth: widthPx }}>
      <span
        className="i-lucide-search absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary/80 pointer-events-none"
        aria-hidden="true"
      />
      <input
        className={cx(inputClass, " pl-7 leading-[36px] [text-indent:0]")}
        style={{ height: 36 }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={!!disabled}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>
  );
}
  "w-full h-9 rounded-md border border-hairline bg-surface px-3 text-sm text-primary " +
  "placeholder:text-secondary/80 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--brand-orange))] " +
  "focus:border-[hsl(var(--brand-orange))] shadow-[inset_0_0_0_9999px_rgba(255,255,255,0.02)]";

// Types and mapping
type WaitlistRowWire = WaitlistEntry;
type WaitlistTableRow = {
  id: number;
  contactLabel?: string | null;
  orgLabel?: string | null;
  speciesPref?: string | null;
  breedPrefText?: string | null;
  damPrefName?: string | null;
  sirePrefName?: string | null;
  depositPaidAt?: string | null;
  status?: string | null;
  priority?: number | null;
  skipCount?: number | null;
  lastActivityAt?: string | null;
  notes?: string | null;
};

const WAITLIST_COLS: Array<{ key: keyof WaitlistTableRow & string; label: string; default?: boolean }> = [
  { key: "contactLabel", label: "Contact", default: true },
  { key: "orgLabel", label: "Org", default: true },
  { key: "speciesPref", label: "Species", default: true },
  { key: "breedPrefText", label: "Breeds", default: true },
  { key: "damPrefName", label: "Dam", default: true },
  { key: "sirePrefName", label: "Sire", default: true },
  { key: "depositPaidAt", label: "Deposit Paid On", default: true },
  { key: "status", label: "Status", default: false },
  { key: "priority", label: "Priority", default: false },
  { key: "skipCount", label: "Skips", default: false },
  { key: "lastActivityAt", label: "Activity", default: false },
];



const WAITLIST_STORAGE_KEY = "bhq_waitlist_cols_v2";
function mapWaitlistToTableRow(w: any): WaitlistTableRow {
  const contact =
    w.contact ||
    (w.contactId != null
      ? { id: w.contactId, display_name: w.contactName, first_name: w.firstName, last_name: w.lastName }
      : null);
  const org = w.organization || (w.organizationId != null ? { id: w.organizationId, name: w.organizationName } : null);
  const dam = w.damPref || (w.damPrefId != null ? { id: w.damPrefId, name: w.damPrefName } : null);
  const sire = w.sirePref || (w.sirePrefId != null ? { id: w.sirePrefId, name: w.sirePrefName } : null);

  const contactLabel =
    contact?.display_name ||
    `${(contact?.first_name ?? "").trim()} ${(contact?.last_name ?? "").trim()}`.trim() ||
    (contact ? `#${contact.id}` : null);

  const orgLabel = org?.name ?? (org ? `#${org.id}` : null);

  const breedPrefText =
    w.breedPrefText ||
    (Array.isArray(w.breedPrefs) ? w.breedPrefs.filter(Boolean).join(", ") : null) ||
    null;

  return {
    id: Number(w.id),
    contactLabel: contactLabel ?? null,
    orgLabel: orgLabel ?? null,
    speciesPref: w.speciesPref ?? null,
    breedPrefText,
    damPrefName: dam?.name ?? null,
    sirePrefName: sire?.name ?? null,
    depositPaidAt: w.depositPaidAt ?? null,
    status: w.status ?? null,
    priority: w.priority ?? null,
    skipCount: w.skipCount ?? null,
    lastActivityAt: w.lastActivityAt ?? w.updatedAt ?? w.createdAt ?? null,
    notes: w.notes ?? null,
  };
}
const waitlistSections = (mode: "view" | "edit") => [
  {
    title: "Overview",
    fields: [
      { label: "Contact", key: "contactLabel", view: (r: WaitlistTableRow) => r.contactLabel || "-" },
      { label: "Organization", key: "orgLabel", view: (r: WaitlistTableRow) => r.orgLabel || "-" },
      { label: "Species", key: "speciesPref", view: (r: WaitlistTableRow) => r.speciesPref || "-" },
      { label: "Breeds", key: "breedPrefText", view: (r: WaitlistTableRow) => r.breedPrefText || "-" },
      { label: "Dam Pref", key: "damPrefName", view: (r: WaitlistTableRow) => r.damPrefName || "-" },
      { label: "Sire Pref", key: "sirePrefName", view: (r: WaitlistTableRow) => r.sirePrefName || "-" },
      { label: "Deposit Paid", key: "depositPaidAt", editor: "date", view: (r: WaitlistTableRow) => fmtDate(r.depositPaidAt) || "-" },
      { label: "Status", key: "status", editor: "text", view: (r: WaitlistTableRow) => r.status || "-" },
      { label: "Priority", key: "priority", editor: "number", view: (r: WaitlistTableRow) => String(r.priority ?? "") || "-" },
      { label: "Skips", key: "skipCount", view: (r: WaitlistTableRow) => String(r.skipCount ?? 0) },
      { label: "Activity", key: "lastActivityAt", view: (r: WaitlistTableRow) => fmtDate(r.lastActivityAt) || "-" },
    ],
  },
  {
    title: "Notes",
    fields: [{ label: "Notes", key: "notes", editor: "textarea", view: (r: WaitlistTableRow) => r.notes || "-" }],
  },
];

// Directory and contact helpers from App-Offspring
/* ───────────────────────── Directory/Animals helpers ───────────────────────── */
type SpeciesWire = "DOG" | "CAT" | "HORSE";
type SpeciesUi = "Dog" | "Cat" | "Horse";
const SPECIES_UI_ALL: SpeciesUi[] = ["Dog", "Cat", "Horse"];
const toWireSpecies = (s: SpeciesUi | ""): SpeciesWire | undefined =>
  s === "Dog" ? "DOG" : s === "Cat" ? "CAT" : s === "Horse" ? "HORSE" : undefined;

type DirectoryHit =
  | { kind: "contact"; id: number; label: string; sub?: string }
  | { kind: "org"; id: number; label: string; sub?: string };

async function searchDirectory(api: ReturnType<typeof makeOffspringApi> | null, q: string): Promise<DirectoryHit[]> {
  if (!api || !q.trim()) return [];
  const [cRes, oRes] = await Promise.allSettled([api.contacts.list({ q, limit: 25 }), api.organizations.list({ q, limit: 25 })]);

  const hits: DirectoryHit[] = [];
  if (cRes.status === "fulfilled" && cRes.value) {
    const items: any[] = Array.isArray(cRes.value) ? cRes.value : cRes.value.items ?? [];
    for (const c of items) {
      const name = c.display_name || `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "(No name)";
      hits.push({ kind: "contact", id: Number(c.id), label: name, sub: c.email || c.phoneE164 || "" });
    }
  }
  if (oRes.status === "fulfilled" && oRes.value) {
    const items: any[] = Array.isArray(oRes.value) ? oRes.value : oRes.value.items ?? [];
    for (const o of items) hits.push({ kind: "org", id: Number(o.id), label: o.name, sub: o.website || o.email || "" });
  }
  return hits;
}

type AnimalLite = { id: number; name: string; species: SpeciesWire; sex: "FEMALE" | "MALE" };
async function fetchAnimals(
  api: ReturnType<typeof makeOffspringApi> | null,
  opts: { q?: string; species?: SpeciesWire; sex?: "FEMALE" | "MALE"; limit?: number }
) {
  if (!api) return [];
  const res = await api.animals.list({ q: opts.q, species: opts.species, sex: opts.sex, limit: opts.limit ?? 25 });
  const raw: any[] = Array.isArray(res) ? res : res?.items ?? [];
  return raw.map((a) => ({
    id: Number(a.id),
    name: String(a.name ?? "").trim(),
    species: String(a.species ?? "DOG").toUpperCase() as SpeciesWire,
    sex: String(a.sex ?? "FEMALE").toUpperCase() as "FEMALE" | "MALE",
  })) as AnimalLite[];
}

/* ───────────────────────── Plan fetch (COMMITTED only; GET) ───────────────────────── */
type PlanOption = { id: number; code: string | null; name: string; species: string; breedText: string | null };
async function fetchCommittedPlans(api: ReturnType<typeof makeOffspringApi> | null): Promise<PlanOption[]> {
  if (!api) return [];
  const qs = new URLSearchParams({ status: "COMMITTED", include: "parents", limit: "100" }).toString();
  let res: any;
  try {
    res = await api.raw.get<any>(`/breeding/plans?${qs}`);
  } catch {
    res = await api.raw.get<any>(`/plans?${qs}`);
  }
  const items = Array.isArray(res) ? res : res?.items ?? [];
  return items.map((p: any) => ({ id: p.id, code: p.code ?? null, name: p.name, species: p.species, breedText: p.breedText ?? null }));
}

/* ───────────────────────── Dam/Sire search hooks ───────────────────────── */
function useAnimalSearch(api: ReturnType<typeof makeOffspringApi> | null, query: string, species: SpeciesWire | undefined, sex: "FEMALE" | "MALE") {
  const [hits, setHits] = React.useState<AnimalLite[]>([]);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!api || !species || !query.trim()) {
        if (alive) setHits([]);
        return;
      }
      const res = await api.animals.list({ q: query.trim(), species, sex, limit: 25 });
      const items = Array.isArray(res) ? res : res?.items ?? [];
      const mapped: AnimalLite[] = items.map((a: any) => ({
        id: Number(a.id),
        name: String(a.name ?? "").trim(),
        species: String(a.species ?? "DOG").toUpperCase() as SpeciesWire,
        sex: String(a.sex ?? "FEMALE").toUpperCase() as "FEMALE" | "MALE",
      }));
      const strict = mapped.filter((a) => a.sex === sex);
      strict.sort(
        (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }) || a.id - b.id
      );
      if (alive) setHits(strict);
    })();
    return () => {
      alive = false;
    };
  }, [api, query, species, sex]);
  return hits;
}

function DamResults({ api, query, species, onPick }: { api: ReturnType<typeof makeOffspringApi> | null; query: string; species?: SpeciesWire; onPick: (a: AnimalLite) => void }) {
  const hits = useAnimalSearch(api, query, species, "FEMALE");
  if (!hits.length) return <div className="px-2 py-2 text-sm text-secondary">No females found</div>;
  return (
    <>
      {hits.map((a) => (
        <button key={a.id} type="button" onClick={() => onPick(a)} className="w-full text-left px-2 py-1 hover:bg-white/5">
          {a.name}
        </button>
      ))}
    </>
  );
}

function SireResults({ api, query, species, onPick }: { api: ReturnType<typeof makeOffspringApi> | null; query: string; species?: SpeciesWire; onPick: (a: AnimalLite) => void }) {
  const hits = useAnimalSearch(api, query, species, "MALE");
  if (!hits.length) return <div className="px-2 py-2 text-sm text-secondary">No males found</div>;
  return (
    <>
      {hits.map((a) => (
        <button key={a.id} type="button" onClick={() => onPick(a)} className="w-full text-left px-2 py-1 hover:bg-white/5">
          {a.name}
        </button>
      ))}
    </>
  );
}

/* ------------------------- Contact Helpers --------------------------- */
const stripEmpty = (o: Record<string, any>) => {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(o)) if (v !== null && v !== undefined && String(v).trim() !== "") out[k] = v;
  return out;
};

async function exactContactLookup(api: ReturnType<typeof makeOffspringApi>, probe: {
  email?: string; phone?: string; firstName?: string; lastName?: string
}) {
  const tries: string[] = [];
  if (probe.email) tries.push(probe.email);
  if (probe.phone) tries.push(probe.phone);
  const name = `${probe.firstName ?? ""} ${probe.lastName ?? ""}`.trim();
  if (name) tries.push(name);

  for (const q of tries) {
    const res = await api.contacts.list({ q, limit: 10 });
    const items: any[] = Array.isArray(res) ? res : res?.items ?? [];
    if (!items.length) continue;
    if (probe.email) {
      const e = probe.email.trim().toLowerCase();
      const hit = items.find(c => (c.email || "").toLowerCase() === e);
      if (hit) return hit;
    }
    if (probe.phone) {
      const p = probe.phone.trim();
      const hit = items.find(c => (c.phoneE164 || c.phone || "") === p);
      if (hit) return hit;
    }
    if (name) {
      const n = name.toLowerCase();
      const hit = items.find(c => (c.display_name || `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim()).toLowerCase() === n);
      if (hit) return hit;
    }
    return items[0];
  }
  return null;
}

function conflictExistingIdFromError(e: any): number | null {
  const idFromBody = Number(e?.response?.data?.id ?? e?.data?.id);
  if (Number.isFinite(idFromBody)) return idFromBody;
  const loc: string | undefined = e?.response?.headers?.location || e?.headers?.location;
  if (loc) {
    const m = loc.match(/\/contacts\/(\d+)/);
    if (m) return Number(m[1]);
  }
  return null;
}

/* ───────────────────────── Create Group form ───────────────────────── */
const MODAL_Z = 2147485000;

/* Date formatter used in table and details */
function fmtDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return Number.isFinite(dt.getTime()) ? dt.toLocaleDateString() : "";
}


function CreateGroupForm({
  api,
  tenantId,
  onCreated,
  onCancel,
}: {
  api: ReturnType<typeof makeOffspringApi> | null;
  tenantId: number | null;
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

  /** NEW: override and counts */
  const [statusOverride, setStatusOverride] = React.useState<string>("");
  const [statusOverrideReason, setStatusOverrideReason] = React.useState<string>("");
  const [countWeaned, setCountWeaned] = React.useState<string>("");
  const [countPlaced, setCountPlaced] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchCommittedPlans(api);
        if (!cancelled) setPlans(list);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load committed plans");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const [submitting, setSubmitting] = React.useState(false);
  const [submitErr, setSubmitErr] = React.useState<string | null>(null);

  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!api) return;
    if (planId === "" || !Number(planId)) {
      setSubmitErr("Please choose a committed plan.");
      return;
    }
    setSubmitting(true);
    setSubmitErr(null);
    try {
      await api.offspring.create({
        planId: Number(planId),
        identifier: identifier.trim() || null,
        statusOverride: statusOverride.trim() || null,
        statusOverrideReason: statusOverrideReason.trim() || null,
        counts:
          countWeaned || countPlaced
            ? {
              countWeaned: countWeaned === "" ? null : Number(countWeaned),
              countPlaced: countPlaced === "" ? null : Number(countPlaced),
            }
            : undefined,
        dates: {
          weanedAt: weanedAt || null,
          placementStartAt: placementStartAt || null,
          placementCompletedAt: placementCompletedAt || null,
        },
      });
      toast?.({ title: "Group created" });
      onCreated();
    } catch (e: any) {
      setSubmitErr(e?.message || "Failed to create offspring group");
      toast?.({ title: "Create failed", description: String(e?.message || e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-[820px] max-w-[94vw]">
      <Card>
        <div className="p-4 space-y-4">
          <div className="text-lg font-semibold">New offspring group</div>
          <div className="text-sm text-secondary">Choose a committed plan, add identifiers, date(s), and optional overrides.</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className={cx(labelClass)}>
                Committed Plan <span className="text-[hsl(var(--brand-orange))]">*</span>
              </span>
              <select
                className={cx(inputClass)}
                value={planId}
                onChange={(e) => setPlanId(e.target.value ? Number(e.target.value) : "")}
                disabled={loading}
              >
                <option value="">Select a plan...</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code ? `${p.code} - ` : ""}
                    {p.name} ({p.species}
                    {p.breedText ? ` · ${p.breedText}` : ""})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className={cx(labelClass)}>Identifier (optional)</span>
              <input className={cx(inputClass)} value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="e.g., A Litter" />
            </label>

            <label className="flex flex-col gap-1">
              <span className={cx(labelClass)}>Weaned At (optional)</span>
              <input className={cx(inputClass)} type="date" value={weanedAt} onChange={(e) => setWeanedAt(e.target.value)} />
            </label>

            <label className="flex flex-col gap-1">
              <span className={cx(labelClass)}>Placement Start (optional)</span>
              <input className={cx(inputClass)} type="date" value={placementStartAt} onChange={(e) => setPlacementStartAt(e.target.value)} />
            </label>

            <label className="flex flex-col gap-1">
              <span className={cx(labelClass)}>Placement Completed (optional)</span>
              <input className={cx(inputClass)} type="date" value={placementCompletedAt} onChange={(e) => setPlacementCompletedAt(e.target.value)} />
            </label>

            {/* NEW: status override + reason */}
            <label className="flex flex-col gap-1">
              <span className={cx(labelClass)}>Status Override (optional)</span>
              <input className={cx(inputClass)} value={statusOverride} onChange={(e) => setStatusOverride(e.target.value)} placeholder="e.g., Pause Homing" />
            </label>
            <label className="flex flex-col gap-1">
              <span className={cx(labelClass)}>Override Reason (optional)</span>
              <input className={cx(inputClass)} value={statusOverrideReason} onChange={(e) => setStatusOverrideReason(e.target.value)} placeholder="Short explanation..." />
            </label>

            {/* NEW: counts weaned/placed */}
            <label className="flex flex-col gap-1">
              <span className={cx(labelClass)}>Weaned Count (optional)</span>
              <input className={cx(inputClass)} type="number" value={countWeaned} onChange={(e) => setCountWeaned(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={cx(labelClass)}>Placed Count (optional)</span>
              <input className={cx(inputClass)} type="number" value={countPlaced} onChange={(e) => setCountPlaced(e.target.value)} />
            </label>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {submitErr && <div className="text-sm text-red-600">{submitErr}</div>}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !planId || !api}>
              {submitting ? "Creating..." : "Create group"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ───────────────────────── Add to Waitlist modal ───────────────────────── */
function AddToWaitlistModal({
  api,
  tenantId,
  open,
  onClose,
  onCreated,
  allowedSpecies = SPECIES_UI_ALL,
}: {
  api: ReturnType<typeof makeOffspringApi> | null;
  tenantId: number | null;
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
  allowedSpecies?: SpeciesUi[];
}) {
  // Modal is always editable; defining this prevents ReferenceError from reads below.
  const readOnly = false;
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  const [link, setLink] = React.useState<{ kind: "contact" | "org"; id: number; label: string } | null>(null);

  const [q, setQ] = React.useState("");
  const [hits, setHits] = React.useState<DirectoryHit[]>([]);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    const run = async () => {
      const qq = q.trim();
      if (!qq || link) {
        setHits([]);
        return;
      }
      setBusy(true);
      try {
        const r = await searchDirectory(api, qq);
        if (alive) setHits(r);
      } finally {
        if (alive) setBusy(false);
      }
    };
    const t = setTimeout(run, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q, link, tenantId, api]);

  const [quickOpen, setQuickOpen] = React.useState<null | "contact" | "org">(null);
  const [qc, setQc] = React.useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [qo, setQo] = React.useState({ name: "", website: "" });
  const [creating, setCreating] = React.useState(false);
  const [createErr, setCreateErr] = React.useState<string | null>(null);

  function normalizeStr(s?: string | null) {
    return (s ?? "").trim().toLowerCase();
  }

  async function findBestContactMatch(
    api: ReturnType<typeof makeOffspringApi>,
    probe: { email?: string; phone?: string; firstName?: string; lastName?: string }
  ) {
    const q =
      probe.email?.trim() ||
      probe.phone?.trim() ||
      `${probe.firstName ?? ""} ${probe.lastName ?? ""}`.trim();

    if (!q) return null;

    const res = await api.contacts.list({ q, limit: 10 });
    const items: any[] = Array.isArray(res) ? res : res?.items ?? [];
    if (!items.length) return null;

    if (probe.email) {
      const eNorm = normalizeStr(probe.email);
      const byEmail = items.find((c) => normalizeStr(c.email) === eNorm);
      if (byEmail) return byEmail;
    }

    if (probe.phone) {
      const byPhone = items.find((c) => (c.phoneE164 || "") === probe.phone);
      if (byPhone) return byPhone;
    }

    const want = normalizeStr(`${probe.firstName ?? ""} ${probe.lastName ?? ""}`.trim());
    if (want) {
      const byName = items.find((c) =>
        normalizeStr(c.display_name || `${c.first_name ?? ""} ${c.last_name ?? ""}`) === want
      );
      if (byName) return byName;
    }

    return items[0];
  }

  function isConflict(err: any) {
    const status = err?.status ?? err?.code ?? err?.response?.status;
    const msg = String(err?.message || "").toLowerCase();
    return status === 409 || msg.includes("409") || msg.includes("conflict");
  }

  async function quickCreateContact(body: { firstName?: string; lastName?: string; email?: string; phone?: string }) {
    const pre = await exactContactLookup(api!, body);
    if (pre) return pre;

    const payload = stripEmpty({
      display_name: `${(body.firstName ?? "").trim()} ${(body.lastName ?? "").trim()}`.trim() || undefined,
      first_name: body.firstName,
      last_name: body.lastName,
      email: body.email,
      phoneE164: body.phone,
      phone_e164: body.phone,
    });

    try {
      return await api!.contacts.create(payload);
    } catch (e: any) {
      const status = e?.status ?? e?.code ?? e?.response?.status;
      if (status === 409) {
        const id = conflictExistingIdFromError(e);
        if (id) return await api!.contacts.get(id);
        const post = await exactContactLookup(api!, body);
        if (post) return post;
      }
      throw e;
    }
  }

  async function quickCreateOrg(body: { name: string; website?: string }) {
    try {
      return await api!.organizations.create({ name: body.name, website: body.website ?? null });
    } catch (e: any) {
      const status = e?.status ?? e?.code ?? e?.response?.status;
      const msg = String(e?.message || "").toLowerCase();
      const is409 = status === 409 || msg.includes("409") || msg.includes("conflict");
      if (!is409) throw e;

      const probe = body.name?.trim() || body.website?.trim();
      if (!probe) throw e;

      const found = await api!.organizations.list({ q: probe, limit: 5 });
      const items: any[] = Array.isArray(found) ? found : found?.items ?? [];
      if (!items.length) throw e;
      return items[0];
    }
  }

  async function doQuickAdd() {
    try {
      setCreating(true);
      setCreateErr(null);
      if (quickOpen === "contact") {
        const c = await quickCreateContact(qc);
        setLink({
          kind: "contact",
          id: Number(c.id),
          label: c.display_name || `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "(Contact)",
        });
        setQuickOpen(null);
        setQ("");
        setHits([]);
      } else if (quickOpen === "org") {
        const o = await quickCreateOrg(qo);
        setLink({ kind: "org", id: Number(o.id), label: o.name || "(Organization)" });
        setQuickOpen(null);
        setQ("");
        setHits([]);
      }
    } catch (e: any) {
      setCreateErr(e?.message || "Create failed.");
    } finally {
      setCreating(false);
    }
  }

  const [speciesUi, setSpeciesUi] = React.useState<SpeciesUi | "">("");
  const speciesWire = toWireSpecies(speciesUi);

  const [breed, setBreed] = React.useState<any>(null);
  const [breedNonce, setBreedNonce] = React.useState(0);
  const onBreedPick = React.useCallback((hit: any) => {
    setBreed(hit ? { ...hit } : null);
    setBreedNonce((n) => n + 1);
  }, []);

  const [damQ, setDamQ] = React.useState("");
  const [sireQ, setSireQ] = React.useState("");
  const [damId, setDamId] = React.useState<number | null>(null);
  const [sireId, setSireId] = React.useState<number | null>(null);

  const [damOpen, setDamOpen] = React.useState(false);
  const [sireOpen, setSireOpen] = React.useState(false);

  const canSubmit = !!link && !!speciesWire && !!(breed?.name || "").trim();

  async function handleSubmit() {
    if (!api || !canSubmit) return;
    await api.waitlist.create({
      contactId: link?.kind === "contact" ? link.id : null,
      organizationId: link?.kind === "org" ? link.id : null,
      speciesPref: speciesWire!,
      breedPrefs: (breed?.name ?? "").trim() ? [(breed?.name ?? "").trim()] : null,
      damPrefId: damId ?? null,
      sirePrefId: sireId ?? null,
    });
    await onCreated();
    onClose();
  }

  function resetAll() {
    setLink(null);
    setQ("");
    setHits([]);
    setBusy(false);
    setQuickOpen(null);
    setQc({ firstName: "", lastName: "", email: "", phone: "" });
    setQo({ name: "", website: "" });
    setCreating(false);
    setCreateErr(null);
    setSpeciesUi("");
    setBreed(null);
    setBreedNonce(0);
    setDamQ("");
    setSireQ("");
    setDamId(null);
    setSireId(null);
    setDamOpen(false);
    setSireOpen(false);
  }

  React.useEffect(() => {
    if (open) resetAll();
  }, [open]);

  const searchValue = link ? `${link.kind === "contact" ? "Contact" : "Org"} · ${link.label}` : q;
  const clearLinkAndSearch = React.useCallback(() => {
    setLink(null);
    setQ("");
    setHits([]);
    setBusy(false);
  }, []);

  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[._\-\/]/g, " ")
      .replace(/\b(organization|org|inc|llc|co|company|ltd)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const filteredHits = React.useMemo(() => {
    const qq = norm(q);
    if (!qq) return [];
    return hits.filter((h) => {
      const hay = norm(`${h.label || ""} ${h.sub || ""}`);
      return hay.includes(qq);
    });
  }, [hits, q]);

  const [damResults, setDamResults] = React.useState<AnimalLite[]>([]);
  const [sireResults, setSireResults] = React.useState<AnimalLite[]>([]);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!speciesWire || !damOpen || !damQ.trim()) {
        if (alive) setDamResults([]);
        return;
      }
      const list = await fetchAnimals(api, { q: damQ.trim(), species: speciesWire, sex: "FEMALE", limit: 25 });
      const strict = list.filter(a => a.sex === "FEMALE");
      if (alive) setDamResults(strict);
    })();
    return () => { alive = false; };
  }, [damQ, speciesWire, damOpen, api]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!speciesWire || !sireOpen || !sireQ.trim()) {
        if (alive) setSireResults([]);
        return;
      }
      const list = await fetchAnimals(api, { q: sireQ.trim(), species: speciesWire, sex: "MALE", limit: 25 });
      const strict = list.filter(a => a.sex === "MALE");
      if (alive) setSireResults(strict);
    })();
    return () => { alive = false; };
  }, [sireQ, speciesWire, sireOpen, api]);

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
          <div
            ref={panelRef}
            className="pointer-events-auto overflow-hidden"
            style={{ width: 820, maxWidth: "95vw", height: 620, maxHeight: "82vh" }}
            data-waitlist
          >
            <Card className="h-full">
              <div className="h-full p-4 space-y-4 overflow-y-auto">
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold">Add to Waitlist</div>
                  {link && (
                    <button
                      className="ml-auto text-xs underline text-secondary hover:text-primary"
                      onClick={clearLinkAndSearch}
                    >
                      Clear selection
                    </button>
                  )}
                </div>

                {/* Search Contacts/Orgs */}
                <div className="relative">
                  <div className={cx(labelClass + " mb-1")}>Search Contacts or Organizations</div>
                  <div className="relative">
                    <SearchBar
                      value={searchValue}
                      onChange={(val) => {
                        if (link) {
                          clearLinkAndSearch();
                          setQ(val);
                        } else setQ(val);
                      }}
                      placeholder="Type a name, email, phone, or organization..."
                      widthPx={720}
                      autoFocus={!link}
                    />
                  </div>

                  {/* Always-visible quick add triggers */}
                  <div className="mt-2 flex items-center gap-3">
                    <Button size="xs" variant="outline" onClick={() => setQuickOpen("contact")}>
                      + Quick Add Contact
                    </Button>
                    <Button size="xs" variant="outline" onClick={() => setQuickOpen("org")}>
                      + Quick Add Organization
                    </Button>
                  </div>
                </div>

                {/* Results list */}
                {!link && q.trim() && (
                  <div className="rounded-md border border-hairline max-h-56 overflow-auto p-2">
                    {busy ? (
                      <div className="px-2 py-2 text-sm text-secondary">Searching...</div>
                    ) : (
                      (() => {
                        const contacts = filteredHits.filter((h) => h.kind === "contact");
                        const orgs = filteredHits.filter((h) => h.kind === "org");
                        const sectionClass = "rounded-md bg-white/5";
                        const pill = (t: string) => <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">{t}</span>;

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Contacts */}
                            <div className={cx(sectionClass)}>
                              <SectionChipHeading
                                icon={<span className="i-lucide-user-2 h-3.5 w-3.5" aria-hidden="true" />}
                                text="Contacts"
                              />
                              {contacts.length === 0 ? (
                                <div className="px-2 py-2 text-sm text-secondary">No contacts</div>
                              ) : (
                                contacts.map((h) => (
                                  <button
                                    key={`contact:${h.id}`}
                                    type="button"
                                    onClick={() => {
                                      setLink({ kind: "contact", id: h.id, label: h.label });
                                      setQ("");
                                      setHits([]);
                                    }}
                                    className="w-full text-left px-2 py-1 hover:bg-white/5"
                                  >
                                    <div className="flex items-center gap-2">
                                      {pill("Contact")}
                                      <span>{h.label}</span>
                                      {h.sub ? <span className="text-xs text-secondary">• {h.sub}</span> : null}
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>

                            {/* Orgs */}
                            <div className={cx(sectionClass)}>
                              <SectionChipHeading
                                icon={<span className="i-lucide-building-2 h-3.5 w-3.5" aria-hidden="true" />}
                                text="Organizations"
                              />
                              {orgs.length === 0 ? (
                                <div className="px-2 py-2 text-sm text-secondary">No organizations</div>
                              ) : (
                                orgs.map((h) => (
                                  <button
                                    key={`org:${h.id}`}
                                    type="button"
                                    onClick={() => {
                                      setLink({ kind: "org", id: h.id, label: h.label });
                                      setQ("");
                                      setHits([]);
                                    }}
                                    className="w-full text-left px-2 py-1 hover:bg-white/5"
                                  >
                                    <div className="flex items-center gap-2">
                                      {pill("Org")}
                                      <span>{h.label}</span>
                                      {h.sub ? <span className="text-xs text-secondary">• {h.sub}</span> : null}
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                )}

                {/* Quick add drawers */}
                {!link && quickOpen && (
                  <div className="rounded-lg border border-hairline p-3 bg-surface/60">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{quickOpen === "contact" ? "Quick Add Contact" : "Quick Add Organization"}</div>
                      <button className="text-xs text-secondary hover:underline" onClick={() => setQuickOpen(null)}>
                        Close
                      </button>
                    </div>

                    {quickOpen === "contact" ? (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input className={cx(inputClass)} placeholder="First name" value={qc.firstName} onChange={(e) => setQc({ ...qc, firstName: e.target.value })} />
                        <input className={cx(inputClass)} placeholder="Last name" value={qc.lastName} onChange={(e) => setQc({ ...qc, lastName: e.target.value })} />
                        <input className={cx(inputClass)} placeholder="Email" value={qc.email} onChange={(e) => setQc({ ...qc, email: e.target.value })} />
                        <input className={cx(inputClass)} placeholder="Phone (E.164)" value={qc.phone} onChange={(e) => setQc({ ...qc, phone: e.target.value })} />
                        {createErr && <div className="md:col-span-2 text-sm text-red-600">{createErr}</div>}
                        <div className="md:col-span-2 flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setQc({ firstName: "", lastName: "", email: "", phone: "" })}>
                            Clear
                          </Button>
                          <Button onClick={doQuickAdd} disabled={creating || !api}>
                            {creating ? "Creating..." : "Create / Link"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 grid grid-cols-1 gap-2">
                        <input className={cx(inputClass)} placeholder="Organization name" value={qo.name} onChange={(e) => setQo({ ...qo, name: e.target.value })} />
                        <input className={cx(inputClass)} placeholder="Website (optional)" value={qo.website} onChange={(e) => setQo({ ...qo, website: e.target.value })} />
                        {createErr && <div className="text-sm text-red-600">{createErr}</div>}
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setQo({ name: "", website: "" })}>Clear</Button>
                          <Button onClick={doQuickAdd} disabled={creating || !qo.name.trim() || !api}>{creating ? "Creating..." : "Create / Link"}</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Preferences (required) */}
                <SectionCard title="Preferences (required)">
                  <div className={"p-2 grid grid-cols-1 md:grid-cols-3 gap-3 " + (readOnly ? "opacity-70" : "")}>
                    <label className="flex flex-col gap-1">
                      <span className={cx(labelClass)}>Species</span>
                      <select
                        className={cx(inputClass)}
                        value={speciesUi}
                        onChange={(e) => {
                          setSpeciesUi(e.currentTarget.value as SpeciesUi);
                          setDamId(null);
                          setSireId(null);
                          setDamQ("");
                          setSireQ("");
                          setDamOpen(false);
                          setSireOpen(false);
                          setBreed(null);
                          setBreedNonce((n) => n + 1);
                        }}
                        disabled={readOnly}
                      >
                        <option value="">-</option>
                        {allowedSpecies.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="md:col-span-2 relative">
                      <div className={cx(labelClass + " mb-1")}>Breed</div>
                      {speciesUi ? (
                        <div className={cx(readOnly ? "pointer-events-none opacity-60" : "")}>
                          <BreedCombo
                            key={`breed-${speciesUi}-${breedNonce}`}
                            species={speciesUi}
                            value={breed}
                            onChange={onBreedPick}
                            api={{ breeds: { listCanonical: api!.breeds.listCanonical } }}
                          />
                        </div>
                      ) : (
                        <div className="h-9 px-3 flex items-center rounded-md border border-hairline bg-surface/60 text-sm text-secondary">Select Species</div>
                      )}
                    </div>
                  </div>
                </SectionCard>

                {/* Parents (optional) */}
                <SectionCard title="Preferred Parents (optional)">
                  <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Dam */}
                    <label className="flex flex-col gap-1 relative">
                      <span className={cx(labelClass)}>Dam (Female)</span>
                      {!speciesWire ? (
                        <div className="h-9 px-3 flex items-center rounded-md border border-hairline bg-surface/60 text-sm text-secondary">Select Species</div>
                      ) : (
                        <>
                          <InlineSearch
                            value={damQ}
                            onChange={(val) => { setDamQ(val); setDamOpen(!!val.trim()); }}
                            onFocus={() => setDamOpen(!!damQ.trim())}
                            onBlur={() => setTimeout(() => setDamOpen(false), 100)}
                            placeholder="Search females..."
                            widthPx={400}
                          />
                          {damOpen && damQ.trim() && (
                            <div className="absolute z-10 left-0 right-0 rounded-md border border-hairline bg-surface" style={{ top: "calc(100% + 6px)", maxHeight: 160, overflowY: "auto" }}>
                              <DamResults
                                api={api}
                                query={damQ}
                                species={speciesWire}
                                onPick={(a) => {
                                  setDamId(a.id);
                                  setDamQ(a.name);
                                  setDamOpen(false);
                                }}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </label>

                    {/* Sire */}
                    <label className="flex flex-col gap-1 relative">
                      <span className={cx(labelClass)}>Sire (Male)</span>
                      {!speciesWire ? (
                        <div className="h-9 px-3 flex items-center rounded-md border border-hairline bg-surface/60 text-sm text-secondary">Select Species</div>
                      ) : (
                        <>
                          <InlineSearch
                            value={sireQ}
                            onChange={(val) => { setSireQ(val); setSireOpen(!!val.trim()); }}
                            onFocus={() => setSireOpen(!!sireQ.trim())}
                            onBlur={() => setTimeout(() => setSireOpen(false), 100)}
                            placeholder="Search males..."
                            widthPx={400}
                          />
                          {sireOpen && sireQ.trim() && (
                            <div className="absolute z-10 left-0 right-0 rounded-md border border-hairline bg-surface" style={{ top: "calc(100% + 6px)", maxHeight: 160, overflowY: "auto" }}>
                              <SireResults
                                api={api}
                                query={sireQ}
                                species={speciesWire}
                                onPick={(a) => {
                                  setSireId(a.id);
                                  setSireQ(a.name);
                                  setSireOpen(false);
                                }}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </label>
                  </div>
                </SectionCard>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetAll();
                      onClose();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={!canSubmit || !api}>
                    Add to waitlist
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

/* ───────────────────────── Buyers hook and tab ───────────────────────── */

type Candidate = {
  id: number;
  contactLabel?: string | null;
  orgLabel?: string | null;
  speciesPref?: string | null;
  breedPrefText?: string | null;
  depositPaidAt?: string | null;
  priority?: number | null;
  skipCount?: number | null;
  notes?: string | null;
  source: "waitlist";
};

function useGroupCandidates(api: ReturnType<typeof makeOffspringApi> | null, group: OffspringRow | null) {
  const [cands, setCands] = React.useState<Candidate[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!api || !group) {
        if (alive) {
          setCands([]);
          setLoading(false);
          setError(null);
        }
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const species = group.plan?.species;
        const breed = group.plan?.breedText;
        const res = await api.waitlist.list({ limit: 200, species: species as any, q: breed || undefined });
        const items: any[] = Array.isArray(res) ? res : res?.items ?? [];
        const mapped: Candidate[] = items
          .filter((w: any) => {
            if (!species) return true;
            if (String(w.speciesPref || "").toUpperCase() !== String(species || "").toUpperCase()) return false;
            if (breed && w.breedPrefText) {
              const hay = String(w.breedPrefText).toLowerCase();
              return hay.includes(String(breed).toLowerCase());
            }
            return true;
          })
          .slice(0, 25)
          .map((w: any) => {
            const t = mapWaitlistToTableRow(w);
            return {
              id: t.id,
              contactLabel: t.contactLabel,
              orgLabel: t.orgLabel,
              speciesPref: t.speciesPref,
              breedPrefText: t.breedPrefText,
              depositPaidAt: t.depositPaidAt,
              priority: t.priority,
              skipCount: t.skipCount,
              notes: t.notes,
              source: "waitlist",
            } as Candidate;
          });
        if (alive) setCands(mapped);
      } catch (e: any) {
        if (alive) setError(e?.message || "Failed to load candidates");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [api, group?.id, group?.plan?.species, group?.plan?.breedText]);

  return { cands, loading, error, setCands };
}

function BuyersTab({
  api,
  group,
  onGroupUpdate,
}: {
  api: ReturnType<typeof makeOffspringApi> | null;
  group: OffspringRow;
  onGroupUpdate: (updated: OffspringRow) => void;
}) {
  const { toast } = useToast();
  const { cands, loading, error, setCands } = useGroupCandidates(api, group);
  const [lastAction, setLastAction] = React.useState<null | { kind: "add" | "skip"; payload: any }>(null);

  async function addToGroup(waitlistId: number) {
    if (!api) return;
    // optimistic remove from candidates
    const prev = [...cands];
    setCands(prev.filter((c) => c.id !== waitlistId));
    setLastAction({ kind: "add", payload: { prev, waitlistId } });
    try {
      const updated = await api.offspring.buyers.add({ groupId: group.id, waitlistId });
      onGroupUpdate(updated as any);
      toast?.({ title: "Added buyer to group" });
    } catch (e: any) {
      // rollback
      setCands(prev);
      setLastAction(null);
      toast?.({ title: "Add failed", description: String(e?.message || e), variant: "destructive" });
    }
  }

  async function skipOnce(waitlistId: number) {
    if (!api) return;
    const prev = [...cands];
    const next = prev.map((c) => (c.id === waitlistId ? { ...c, skipCount: (c.skipCount ?? 0) + 1 } : c));
    setCands(next);
    setLastAction({ kind: "skip", payload: { prev } });
    try {
      await api.waitlist.skip(waitlistId);
      toast?.({ title: "Marked skip" });
    } catch (e: any) {
      setCands(prev);
      setLastAction(null);
      toast?.({ title: "Skip failed", description: String(e?.message || e), variant: "destructive" });
    }
  }

  function undo() {
    if (!lastAction) return;
    if (lastAction.kind === "add") {
      setCands(lastAction.payload.prev);
    } else if (lastAction.kind === "skip") {
      setCands(lastAction.payload.prev);
    }
    setLastAction(null);
  }

  return (
    <SectionCard title="Buyers">
      {error && <div className="text-sm text-red-600 mb-2">Error: {error}</div>}
      {loading ? (
        <div className="text-sm text-secondary">Loading candidates...</div>
      ) : cands.length === 0 ? (
        <div className="text-sm text-secondary">No matching candidates found.</div>
      ) : (
        <div className="space-y-2">
          {lastAction && (
            <div className="flex justify-end">
              <Button size="xs" variant="outline" onClick={undo}>Undo</Button>
            </div>
          )}
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-secondary">
                <th className="text-left font-medium py-1 pr-2">Contact</th>
                <th className="text-left font-medium py-1 pr-2">Deposit</th>
                <th className="text-left font-medium py-1 pr-2">Priority</th>
                <th className="text-left font-medium py-1 pr-2">Skips</th>
                <th className="text-left font-medium py-1 pr-2">Notes</th>
                <th className="text-right font-medium py-1 pl-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cands.map((c) => (
                <tr key={c.id} className="border-t border-white/10">
                  <td className="py-1 pr-2">{c.contactLabel || c.orgLabel || `Waitlist #${c.id}`}</td>
                  <td className="py-1 pr-2">{fmtDate(c.depositPaidAt) || "-"}</td>
                  <td className="py-1 pr-2">{c.priority ?? "-"}</td>
                  <td className="py-1 pr-2">{c.skipCount ?? 0}</td>
                  <td className="py-1 pr-2">{c.notes || ""}</td>
                  <td className="py-1 pl-2 text-right">
                    <div className="inline-flex gap-2">
                      <Button size="xs" onClick={() => addToGroup(c.id)}>Add</Button>
                      <Button size="xs" variant="outline" onClick={() => skipOnce(c.id)}>Skip once</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

/* ───────────────────────── Analytics helpers ───────────────────────── */

function computeCoverage(g: OffspringRow): number | null {
  const reserved = g.counts?.reserved ?? 0;
  const placed = (g.counts as any)?.placed ?? 0;
  const sold = Math.max(reserved, placed);
  const denom = g.counts?.live ?? (g.counts as any)?.weaned ?? g.counts?.animals ?? 0;
  if (!denom) return null;
  return Math.min(1, Math.max(0, sold / denom));
}

function computePlacementVelocity(g: OffspringRow): number | null {
  const start = g.dates?.placementStartAt ? Date.parse(g.dates.placementStartAt) : NaN;
  const end = g.dates?.placementCompletedAt ? Date.parse(g.dates.placementCompletedAt) : NaN;
  if (!Number.isFinite(start)) return null;
  if (!Number.isFinite(end)) return null;
  const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return days >= 0 ? days : null;
}

/* ───────────────────────── URL param helper re-export for tabs ───────────────────────── */
const openDetails = setParamAndNotify;

/* ───────────────────────── Tabs ───────────────────────── */
function OffspringGroupsTab({ api, tenantId, readOnlyGlobal }: { api: ReturnType<typeof makeOffspringApi> | null; tenantId: number | null, readOnlyGlobal: boolean }) {
  const { toast } = useToast();
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<GroupTableRow[]>([]);
  const [raw, setRaw] = React.useState<OffspringRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [createOpen, setCreateOpen] = React.useState(false);
  React.useEffect(() => {
    window.dispatchEvent(new Event("popstate"));
  }, []);

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    if (createOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [createOpen]);

  const load = React.useCallback(async () => {
    if (!api) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.offspring.list({ q: q || undefined, limit: 100 });
      setRaw(res.items);
      setRows(res.items.map(mapDetailToTableRow));
    } catch (e: any) {
      setError(e?.message || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, [api, q]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [q, load]);

  const cols = hooks.useColumns(GROUP_COLS, GROUP_STORAGE_KEY);
  const visibleSafe = cols.visible?.length ? cols.visible : GROUP_COLS;

  const [sorts, setSorts] = React.useState<Array<{ key: string; dir: "asc" | "desc" }>>([]);
  const onToggleSort = (key: string) => {
    setSorts((prev) => {
      const f = prev.find((s) => s.key === key);
      if (!f) return [{ key, dir: "asc" }];
      if (f.dir === "asc") return prev.map((s) => (s.key === key ? { ...s, dir: "desc" } : s));
      return prev.filter((s) => s.key !== key);
    });
  };

  function cmp(a: any, b: any) {
    const na = Number(a), nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    const da = Date.parse(a), db = Date.parse(b);
    if (!Number.isNaN(da) && !Number.isNaN(db)) return da - db;
    return String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true, sensitivity: "base" });
  }

  const [pageSize, setPageSize] = React.useState(25);
  const [page, setPage] = React.useState(1);

  const sorted = React.useMemo(() => {
    const list = [...rows];
    if (!sorts.length) return list;
    list.sort((a, b) => {
      for (const s of sorts) {
        const av = (a as any)[s.key];
        const bv = (b as any)[s.key];
        const c = cmp(av, bv);
        if (c !== 0) return s.dir === "asc" ? c : -c;
      }
      return 0;
    });
    return list;
  }, [rows, sorts]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clampedPage = Math.min(page, pageCount);

  const pageRows = React.useMemo(() => {
    const from = (clampedPage - 1) * pageSize;
    const to = from + pageSize;
    return sorted.slice(from, to);
  }, [sorted, clampedPage, pageSize]);

  return (
    <Card>
      <div className="relative"><DetailsHost key="groups"
          rows={raw}
          config={{
            idParam: "groupId",
            getRowId: (r: OffspringRow) => String(r.id),
            width: 960,
            placement: "center",
            align: "top",
            fetchRow: async (id: string | number) => raw.find((r) => String(r.id) === String(id))!,
            onSave: async (row: OffspringRow, draft: any) => {
              if (!api || readOnlyGlobal) return;
              const body: any = {};
              if (draft.identifier !== undefined) body.identifier = draft.identifier;
              if (draft.statusOverride !== undefined) body.statusOverride = draft.statusOverride ?? null;
              if (draft.statusOverrideReason !== undefined) body.statusOverrideReason = draft.statusOverrideReason ?? null;

              if (draft.counts || draft.countLive !== undefined || draft.countWeaned !== undefined || draft.countPlaced !== undefined) {
                body.counts = {
                  countBorn: draft.counts?.countBorn ?? draft.countBorn ?? undefined,
                  countLive: draft.counts?.countLive ?? draft.countLive ?? undefined,
                  countStillborn: draft.counts?.countStillborn ?? draft.countStillborn ?? undefined,
                  countMale: draft.counts?.countMale ?? draft.countMale ?? undefined,
                  countFemale: draft.counts?.countFemale ?? draft.countFemale ?? undefined,
                  /** NEW */
                  countWeaned: draft.counts?.countWeaned ?? draft.countWeaned ?? undefined,
                  /** NEW */
                  countPlaced: draft.counts?.countPlaced ?? draft.countPlaced ?? undefined,
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
              try {
                const updated = await api.offspring.patch(row.id, body);
                const idx = raw.findIndex((r) => r.id === row.id);
                if (idx >= 0) {
                  const next = [...raw];
                  next[idx] = updated as any;
                  setRaw(next);
                  setRows(next.map(mapDetailToTableRow));
                  toast?.({ title: "Saved" });
                }
              } catch (e: any) {
                toast?.({ title: "Save failed", description: String(e?.message || e), variant: "destructive" });
                throw e;
              }
            },
            header: (r: OffspringRow) => ({
              title: r.identifier || r.plan?.code || `Group #${r.id}`,
              subtitle: (r as any).statusOverride ? `Override: ${(r as any).statusOverride}` : "",
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
                  onEdit={() => !readOnlyGlobal && setMode("edit")}
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
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => window.open(`/breeding/plan/${row.plan?.id}`, "_blank")}>
                        Open plan
                      </Button>
                      {readOnlyGlobal && <span className="text-xs text-secondary self-center">View only</span>}
                    </div>
                  }
                >
                  {activeTab === "overview" && (
                    <DetailsSpecRenderer<GroupTableRow>
                      row={tblRow}
                      mode={readOnlyGlobal ? "view" : mode}
                      setDraft={() => { }}
                      sections={groupSections(readOnlyGlobal ? "view" : mode)}
                    />
                  )}
                  {activeTab === "buyers" && (
                    <BuyersTab
                      api={api}
                      group={row}
                      onGroupUpdate={(updated) => {
                        const idx = raw.findIndex((r) => r.id === updated.id);
                        if (idx >= 0) {
                          const next = [...raw];
                          next[idx] = updated as any;
                          setRaw(next);
                          setRows(next.map(mapDetailToTableRow));
                        }
                      }}
                    />
                  )}
                  {activeTab === "analytics" && (
                    <SectionCard title="Analytics">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
                        <Card>
                          <div className="p-3">
                            <div className="text-xs text-secondary">Coverage</div>
                            <div className="text-2xl font-semibold">
                              {(() => {
                                const pct = computeCoverage(row);
                                return pct == null ? "-" : `${Math.round(pct * 100)}%`;
                              })()}
                            </div>
                            <div className="text-xs text-secondary mt-1">Reserved or placed divided by live, weaned, or planned headcount.</div>
                          </div>
                        </Card>
                        <Card>
                          <div className="p-3">
                            <div className="text-xs text-secondary">Placement velocity</div>
                            <div className="text-2xl font-semibold">
                              {(() => {
                                const days = computePlacementVelocity(row);
                                return days == null ? "-" : `${days} days`;
                              })()}
                            </div>
                            <div className="text-xs text-secondary mt-1">Days from placement start to placement completed.</div>
                          </div>
                        </Card>
                      </div>
                    </SectionCard>
                  )}
                </DetailsScaffold>
              );
            },
          }}
        >
          <Table
            columns={GROUP_COLS}
            columnState={cols.map}
            onColumnStateChange={cols.setAll}
            getRowId={(r: GroupTableRow) => r.id}
            pageSize={25}
            renderStickyRight={() => <ColumnsPopover columns={cols.map} onToggle={cols.toggle} onSet={cols.setAll} allColumns={GROUP_COLS} triggerClassName="bhq-columns-trigger" />}
            stickyRightWidthPx={40}
          >
            <div className="bhq-table__toolbar px-2 pt-2 pb-3 relative z-30 flex items-center justify-between">
              <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search groups..." widthPx={520} />
              <div />
            </div>

            <table className="min-w-max w-full text-sm">
              <TableHeader columns={visibleSafe} sorts={sorts} onToggleSort={onToggleSort} />
              <tbody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={visibleSafe.length}>
                      <div className="py-8 text-center text-sm text-secondary">Loading groups...</div>
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
                    <TableRow
                      key={r.id}
                      detailsRow={raw.find((x) => x.id === r.id)!}
                      className="cursor-pointer"
                      onClick={() => openDetails("groupId", r.id)}
                    >
                      {visibleSafe.map((c) => {
                        let v: any = (r as any)[c.key];
                        if (
                          c.key === "expectedBirth" ||
                          c.key === "expectedPlacementStart" ||
                          c.key === "expectedPlacementCompleted" ||
                          c.key === "updatedAt"
                        ) {
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
                    api={api}
                    tenantId={tenantId}
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

function PortalPopover({ anchorRef, open, children }: { anchorRef: React.RefObject<HTMLElement>, open: boolean, children: React.ReactNode }) {
  const [style, setStyle] = React.useState<React.CSSProperties>({});
  React.useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setStyle({
      position: "fixed",
      left: r.left,
      top: r.bottom + 6,
      width: r.width,
      maxHeight: 160,
      overflowY: "auto",
      zIndex: 2147483646,
    });
  }, [open, anchorRef]);
  if (!open) return null;
  const root = getOverlayRoot?.() || document.body;
  return ReactDOM.createPortal(
    <div className="rounded-md border border-hairline bg-surface" style={style}>{children}</div>,
    root
  );
}

function WaitlistDrawerBody({
  api,
  row,
  mode,
  onChange,
}: {
  api: ReturnType<typeof makeOffspringApi> | null;
  row: any;
  mode: "view" | "edit";
  onChange: (patch: any) => void;
}) {
  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  const readOnly = mode !== "edit";
  // derive UI state from row
  const initSpeciesUi = (() => {
    const w = String(row?.speciesPref || "").toUpperCase();
    return w === "DOG" ? "Dog" : w === "CAT" ? "Cat" : w === "HORSE" ? "Horse" : "";
  })() as SpeciesUi | "";

  const [speciesUi, setSpeciesUi] = React.useState<SpeciesUi | "">(initSpeciesUi);
  const speciesWire = toWireSpecies(speciesUi);
  const damBoxRef = React.useRef<HTMLDivElement>(null);
  const sireBoxRef = React.useRef<HTMLDivElement>(null);

  // Breed (BreedCombo wants an object {name})
  const [breed, setBreed] = React.useState<any>(() => {
    const name =
      row?.breedPrefText ??
      (Array.isArray(row?.breedPrefs) ? row.breedPrefs.find(Boolean) : null);
    return name ? { name } : null;
  });
  const [breedNonce, setBreedNonce] = React.useState(0);
  const onBreedPick = React.useCallback((hit: any) => {
    setBreed(hit ? { ...hit } : null);
    setBreedNonce((n) => n + 1);
  }, []);

  // Parents (support both raw and mapped shapes)
  const [damId, setDamId] = React.useState<number | null>(row?.damPrefId ?? row?.damPref?.id ?? null);
  const [sireId, setSireId] = React.useState<number | null>(row?.sirePrefId ?? row?.sirePref?.id ?? null);
  const [damQ, setDamQ] = React.useState<string>(row?.damPref?.name ?? row?.damPrefName ?? "");
  const [sireQ, setSireQ] = React.useState<string>(row?.sirePref?.name ?? row?.sirePrefName ?? "");
  const [damOpen, setDamOpen] = React.useState(false);
  const [sireOpen, setSireOpen] = React.useState(false);

  // Admin fields mirrored from your overview section
  const [status, setStatus] = React.useState<string>(row?.status ?? "");
  const [priority, setPriority] = React.useState<number | "">(row?.priority ?? "");
  const [depositPaidAt, setDepositPaidAt] = React.useState<string>(row?.depositPaidAt ?? "");
  const [notes, setNotes] = React.useState<string>(row?.notes ?? "");

  // RE-SEED LOCAL STATE WHEN THE ROW SHOWN CHANGES
  React.useEffect(() => {
    const nextSpeciesUi = (() => {
      const w = String(row?.speciesPref || "").toUpperCase();
      return w === "DOG" ? "Dog" : w === "CAT" ? "Cat" : w === "HORSE" ? "Horse" : "";
    })() as SpeciesUi | "";
    setSpeciesUi(nextSpeciesUi);

    const nextBreedName =
      row?.breedPrefText ??
      (Array.isArray(row?.breedPrefs) ? row.breedPrefs.find(Boolean) : null) ??
      null;
    setBreed(nextBreedName ? { name: nextBreedName } : null);
    setBreedNonce((n) => n + 1);

    setDamId(row?.damPrefId ?? row?.damPref?.id ?? null);
    setSireId(row?.sirePrefId ?? row?.sirePref?.id ?? null);
    setDamQ(row?.damPref?.name ?? row?.damPrefName ?? "");
    setSireQ(row?.sirePref?.name ?? row?.sirePrefName ?? "");
    setDamOpen(false);
    setSireOpen(false);

    setStatus(row?.status ?? "");
    setPriority(row?.priority ?? "");
    setDepositPaidAt(row?.depositPaidAt ?? "");
    setNotes(row?.notes ?? "");
  }, [row?.id, row?.updatedAt]);

  // keep DetailsScaffold draft in sync so Save can pick it up
  React.useEffect(() => {
    if (mode !== "edit") return;
    onChangeRef.current({
      speciesPref: speciesWire ?? null,
      breedPrefs: (breed?.name ?? "").trim() ? [breed.name.trim()] : null,
      damPrefId: damId ?? null,
      sirePrefId: sireId ?? null,
      status: status || null,
      priority: priority === "" ? null : Number(priority),
      depositPaidAt: depositPaidAt || null,
      notes: notes || null,
    });
  }, [mode, speciesWire, breed, damId, sireId, status, priority, depositPaidAt, notes]);

  // live animal search lists
  const dams = useAnimalSearch(api, damQ, speciesWire, "FEMALE");
  const sires = useAnimalSearch(api, sireQ, speciesWire, "MALE");

  return (
    <div className="space-y-4">
      <SectionCard title="Preferences (required)">
        <div className={"p-2 grid grid-cols-1 md:grid-cols-3 gap-3 " + (readOnly ? "opacity-70" : "")}>
          {/* Species */}
          <label className="flex flex-col gap-1">
            <span className={cx(labelClass)}>Species</span>
            <select
              className={cx(inputClass)}
              value={speciesUi}
              onChange={(e) => {
                setSpeciesUi(e.currentTarget.value as SpeciesUi);
                setDamId(null);
                setSireId(null);
                setDamQ("");
                setSireQ("");
                setDamOpen(false);
                setSireOpen(false);
                setBreed(null);
                setBreedNonce((n) => n + 1);
              }}
              disabled={readOnly}
            >
              <option value="">-</option>
              {SPECIES_UI_ALL.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          {/* Breed */}
          <div className="md:col-span-2">
            <div className={cx(labelClass + " mb-1")}>Breed</div>
            {speciesUi ? (
              readOnly ? (
                // READ-ONLY: show the current value, no interaction
                <div className="h-9 px-3 flex items-center rounded-md border border-hairline bg-surface/60 text-sm">
                  {breed?.name || "-"}
                </div>
              ) : (
                // EDIT: interactive picker
                <BreedCombo
                  key={`breed-${speciesUi}-${breedNonce}`}
                  species={speciesUi}
                  value={breed}
                  onChange={onBreedPick}
                  api={{ breeds: { listCanonical: api!.breeds.listCanonical } }}
                />
              )
            ) : (
              <div className="h-9 px-3 flex items-center rounded-md border border-hairline bg-surface/60 text-sm text-secondary">
                Select Species
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Preferred Parents (optional)">
        <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Dam */}
          <label className="flex flex-col gap-1">
            <span className={cx(labelClass)}>Dam (Female)</span>
            {!speciesWire ? (
              <div className="h-9 px-3 flex items-center rounded-md border border-hairline bg-surface/60 text-sm text-secondary">Select Species</div>
            ) : (
              <>
                <div ref={damBoxRef} className="relative" style={{ maxWidth: 420 }}>
                  <InlineSearch
                    value={damQ}
                    onChange={(val) => { setDamQ(val); setDamOpen(!!val.trim()); }}
                    onFocus={() => setDamOpen(!!damQ.trim())}
                    onBlur={() => setTimeout(() => setDamOpen(false), 100)}
                    placeholder="Search females..."
                    widthPx={400}
                    disabled={mode !== "edit"}
                  />
                </div>
                <PortalPopover anchorRef={damBoxRef} open={!readOnly && !!(damOpen && damQ.trim())}>
                  {dams.length === 0 ? (
                    <div className="px-2 py-2 text-sm text-secondary">No females found</div>
                  ) : (
                    dams.map((a) => (
                      <button key={a.id} type="button" onClick={() => { setDamId(a.id); setDamQ(a.name); setDamOpen(false); }} className="w-full text-left px-2 py-1 hover:bg-white/5">
                        {a.name}
                      </button>
                    ))
                  )}
                </PortalPopover>
              </>
            )}
          </label>

          {/* Sire */}
          <label className="flex flex-col gap-1">
            <span className={cx(labelClass)}>Sire (Male)</span>
            {!speciesWire ? (
              <div className="h-9 px-3 flex items-center rounded-md border border-hairline bg-surface/60 text-sm text-secondary">
                Select Species
              </div>
            ) : (
              <>
                <div ref={sireBoxRef} className="relative" style={{ maxWidth: 420 }}>
                  <InlineSearch
                    value={sireQ}
                    onChange={(val) => { setSireQ(val); setSireOpen(!!val.trim()); }}
                    onFocus={() => setSireOpen(!!sireQ.trim())}
                    onBlur={() => setTimeout(() => setSireOpen(false), 100)}
                    placeholder="Search males..."
                    widthPx={400}
                    disabled={mode !== "edit"}
                  />
                </div>
                <PortalPopover anchorRef={sireBoxRef} open={!readOnly && !!(sireOpen && sireQ.trim())}>
                  {sires.length === 0 ? (
                    <div className="px-2 py-2 text-sm text-secondary">No males found</div>
                  ) : (
                    sires.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => { setSireId(a.id); setSireQ(a.name); setSireOpen(false); }}
                        className="w-full text-left px-2 py-1 hover:bg-white/5"
                      >
                        {a.name}
                      </button>
                    ))
                  )}
                </PortalPopover>
              </>
            )}
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Admin">
        <div className={"p-2 grid grid-cols-1 md:grid-cols-3 gap-3 " + (readOnly ? "opacity-70" : "")}>
          <label className="flex flex-col gap-1">
            <span className={cx(labelClass)}>Status</span>
            <input className={cx(inputClass)} value={status} onChange={(e) => setStatus(e.target.value)} disabled={readOnly} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={cx(labelClass)}>Priority</span>
            <input
              className={cx(inputClass)}
              type="number"
              value={priority}
              onChange={(e) => setPriority(e.target.value === "" ? "" : Number(e.target.value))} disabled={readOnly}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={cx(labelClass)}>Deposit Paid</span>
            <input
              className={cx(inputClass)}
              type="date"
              value={depositPaidAt || ""}
              onChange={(e) => setDepositPaidAt(e.target.value)} disabled={readOnly}
            />
          </label>
          <label className="flex flex-col gap-1 md:col-span-3">
            <span className={cx(labelClass)}>Notes</span>
            <textarea
              className={cx(inputClass, " h-24 resize-vertical")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)} disabled={readOnly}
            />
          </label>
        </div>
      </SectionCard>
    </div>
  );
}

function WaitlistTab({ api, tenantId, readOnlyGlobal }: { api: ReturnType<typeof makeOffspringApi> | null; tenantId: number | null, readOnlyGlobal: boolean }) {
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<WaitlistTableRow[]>([]);
  const [raw, setRaw] = React.useState<WaitlistRowWire[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Sorting for Waitlist table
  const [sorts, setSorts] = React.useState<Array<{ key: string; dir: "asc" | "desc" }>>([]);
  const onToggleSort = (key: string) => {
    setSorts((prev) => {
      const f = prev.find((s) => s.key === key);
      if (!f) return [{ key, dir: "asc" }];
      if (f.dir === "asc") return prev.map((s) => (s.key === key ? { ...s, dir: "desc" } : s));
      return prev.filter((s) => s.key !== key);
    });
  };
  function cmp(a: any, b: any) {
    const na = Number(a), nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    const da = Date.parse(a), db = Date.parse(b);
    if (!Number.isNaN(da) && !Number.isNaN(db)) return da - db;
    return String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true, sensitivity: "base" });
  }

  // --- DetailsHost imperative open for Waitlist ---
  React.useEffect(() => {
    window.dispatchEvent(new Event("popstate"));
  }, []);

  const load = React.useCallback(async () => {
    if (!api) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.waitlist.list({ q: q || undefined, limit: 200 });
      const items: any[] = res.items ?? [];
      setRaw(items as WaitlistRowWire[]);
      setRows(items.map(mapWaitlistToTableRow));
    } catch (e: any) {
      setError(e?.message || "Failed to load waitlist");
    } finally {
      setLoading(false);
    }
  }, [api, q]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await load();
    })();
    return () => { cancelled = true; };
  }, [q, load]);

  const cols = hooks.useColumns(WAITLIST_COLS, WAITLIST_STORAGE_KEY);
  const visibleSafe = cols.visible?.length ? cols.visible : WAITLIST_COLS;

  const sorted = React.useMemo(() => {
    const list = [...rows];
    if (!sorts.length) return list;
    list.sort((a: any, b: any) => {
      for (const s of sorts) {
        const av = (a as any)[s.key];
        const bv = (b as any)[s.key];
        const c = cmp(av, bv);
        if (c !== 0) return s.dir === "asc" ? c : -c;
      }
      return 0;
    });
    return list;
  }, [rows, sorts]);

  return (
    <Card>
      <div className="relative">
        <div className="absolute right-0 top-0 h-10 flex items-center gap-2 pr-2" style={{ zIndex: 50, pointerEvents: "auto" }}>
          {!readOnlyGlobal && (
            <Button size="sm" onClick={() => window.dispatchEvent(new CustomEvent("bhq:offspring:add-waitlist"))}>
              Add to Waitlist
            </Button>
          )}
          {readOnlyGlobal && <span className="text-xs text-secondary">View only</span>}
        </div>

        <DetailsHost key="waitlist"
          rows={raw}
          config={{
            idParam: "waitlistId",
            getRowId: (r: WaitlistRowWire) => String(r.id),
            width: 860,
            placement: "center",
            align: "top",
            fetchRow: async (id: string | number) => raw.find((r) => String(r.id) === String(id))!,
            onSave: async (row: WaitlistRowWire, draft: any) => {
              if (!api || readOnlyGlobal) return;
              const body: any = {};

              // admin fields
              if (draft.status !== undefined) body.status = draft.status ?? null;
              if (draft.priority !== undefined) body.priority = draft.priority ?? null;
              if (draft.depositPaidAt !== undefined) body.depositPaidAt = draft.depositPaidAt ?? null;
              if (draft.notes !== undefined) body.notes = draft.notes ?? null;

              // preference fields
              if (draft.speciesPref !== undefined) body.speciesPref = draft.speciesPref ?? null;
              if (draft.breedPrefs !== undefined) body.breedPrefs = draft.breedPrefs ?? null;
              if (draft.damPrefId !== undefined) body.damPrefId = draft.damPrefId ?? null;
              if (draft.sirePrefId !== undefined) body.sirePrefId = draft.sirePrefId ?? null;

              const updated = await api.waitlist.patch(row.id, body);

              const idx = raw.findIndex((r) => r.id === row.id);
              if (idx >= 0) {
                const nextRaw = [...raw];
                nextRaw[idx] = updated as any;
                setRaw(nextRaw);
                setRows(nextRaw.map(mapWaitlistToTableRow));
              }
            },
            header: (r: WaitlistRowWire) => {
              const t = mapWaitlistToTableRow(r);
              return { title: t.contactLabel || t.orgLabel || `Waitlist #${t.id}`, subtitle: "" };
            },
            tabs: [{ key: "overview", label: "Overview" }],
            customChrome: true,
            render: ({ row, mode, setMode, activeTab, setActiveTab, requestSave, setDraft }: any) => {
              const tblRow = mapWaitlistToTableRow(row);

              const handleDraftChange = (patch: any) =>
                setDraft((prev: any) => ({ ...(prev || {}), ...patch }));

              return (
                <DetailsScaffold
                  title={tblRow.contactLabel || tblRow.orgLabel || `Waitlist #${tblRow.id}`}
                  subtitle=""
                  mode={readOnlyGlobal ? "view" : mode}
                  onEdit={() => !readOnlyGlobal && setMode("edit")}
                  onCancel={() => setMode("view")}
                  onSave={requestSave}
                  tabs={[{ key: "overview", label: "Overview" }]}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                >
                  <WaitlistDrawerBody
                    key={row.id ?? "new"}
                    api={api}
                    row={row}
                    mode={readOnlyGlobal ? "view" : mode}
                    onChange={handleDraftChange}
                  />
                </DetailsScaffold>
              );
            },
          }}
        >
          <Table
            columns={WAITLIST_COLS}
            columnState={cols.map}
            onColumnStateChange={cols.setAll}
            getRowId={(r: WaitlistTableRow) => r.id}
            pageSize={25}
            renderStickyRight={() => (
              <ColumnsPopover
                columns={cols.map}
                onToggle={cols.toggle}
                onSet={cols.setAll}
                allColumns={WAITLIST_COLS}
                triggerClassName="bhq-columns-trigger"
              />
            )}
            stickyRightWidthPx={40}
          >
            <div className="bhq-table__toolbar px-2 pt-2 pb-3 relative z-30 flex items-center justify-between">
              <SearchBar value={q} onChange={(v) => setQ(v)} placeholder="Search waitlist..." widthPx={520} />
              <div />
            </div>

            <table className="min-w-max w-full text-sm">
              <TableHeader columns={visibleSafe} sorts={sorts} onToggleSort={onToggleSort} />
              <tbody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={visibleSafe.length}>
                      <div className="py-8 text-center text-sm text-secondary">Loading waitlist...</div>
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
                {!loading && !error && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={visibleSafe.length}>
                      <div className="py-8 text-center text-sm text-secondary">No entries.</div>
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  !error &&
                  rows.length > 0 &&
                  rows.map((r) => (
                    <TableRow
                      key={r.id}
                      detailsRow={raw.find((x) => x.id === r.id)!}
                      className="cursor-pointer"
                      onClick={() => openDetails("waitlistId", r.id)}
                    >
                      {visibleSafe.map((c) => {
                        let v: any = (r as any)[c.key];
                        if (c.key === "depositPaidAt" || c.key === "lastActivityAt") v = fmtDate(v);
                        return <TableCell key={c.key}>{Array.isArray(v) ? v.join(", ") : v ?? ""}</TableCell>;
                      })}
                    </TableRow>
                  ))}
              </tbody>
            </table>
          </Table>
        </DetailsHost>
      </div>

      {/* Add to Waitlist Modal wiring */}
      <WaitlistAddBridge api={api} tenantId={tenantId} onCreated={load} />
    </Card>
  );
}

/** Small bridge to open AddToWaitlistModal from the toolbar button without custom row hacks */
function WaitlistAddBridge({ api, tenantId, onCreated }: { api: ReturnType<typeof makeOffspringApi> | null; tenantId: number | null; onCreated: () => Promise<void> | void }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener("bhq:offspring:add-waitlist", h as any);
    return () => window.removeEventListener("bhq:offspring:add-waitlist", h as any);
  }, []);
  return (
    <AddToWaitlistModal
      api={api}
      tenantId={tenantId}
      open={open}
      onClose={() => setOpen(false)}
      onCreated={onCreated}
      allowedSpecies={["Dog", "Cat", "Horse"]}
    />
  );
}

export default function WaitlistPage({ embed = false }: { embed?: boolean } = {}) {
  const [tenantId, setTenantId] = React.useState<number | null>(() => readTenantIdFast() ?? null);
  const [api, setApi] = React.useState<ReturnType<typeof makeOffspringApi> | null>(null);
  const [readOnlyGlobal] = React.useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("bhq_read_only");
      return raw === "1" || raw === "true";
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const t = tenantId ?? (await resolveTenantId());
      if (!alive) return;
      setTenantId(t ?? null);
      if (t) setApi(makeOffspringApi({ tenantId: t }));
    })();
    return () => {
      alive = false;
    };
  }, [tenantId]);

  return (
    <div className={embed ? "" : "p-3"}>
      <WaitlistTab api={api} tenantId={tenantId} readOnlyGlobal={readOnlyGlobal} />
    </div>
  );
}
