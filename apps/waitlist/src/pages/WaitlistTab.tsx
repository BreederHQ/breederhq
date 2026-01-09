// apps/waitlist/src/pages/WaitlistTab.tsx
// Core waitlist tab content - extracted from offspring/WaitlistPage.tsx
// This is the "Approved" waitlist view

import * as React from "react";
import ReactDOM from "react-dom";
import {
  Card,
  Table,
  TableHeader,
  TableRow,
  TableCell,
  ColumnsPopover,
  hooks,
  SearchBar,
  DetailsHost,
  DetailsScaffold,
  SectionCard,
  Button,
  BreedCombo,
  DatePicker,
  useToast
} from "@bhq/ui";
import { Plus } from "lucide-react";
import { Overlay } from "@bhq/ui/overlay";
import { getOverlayRoot } from "@bhq/ui/overlay";
import "@bhq/ui/styles/table.css";
import { WaitlistApi, WaitlistEntry } from "../api";


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

function cx(...p: Array<string | false | null | undefined>) {
  return p.filter(Boolean).join(" ");
}

const inputClass =
  "w-full h-9 rounded-md border border-hairline bg-surface px-3 text-sm text-primary " +
  "placeholder:text-secondary/80 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--brand-orange))] " +
  "focus:border-[hsl(var(--brand-orange))] shadow-[inset_0_0_0_9999px_rgba(255,255,255,0.02)]";

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

// Directory and contact helpers
type SpeciesWire = "DOG" | "CAT" | "HORSE";
type SpeciesUi = "Dog" | "Cat" | "Horse";
const SPECIES_UI_ALL: SpeciesUi[] = ["Dog", "Cat", "Horse"];
const toWireSpecies = (s: SpeciesUi | ""): SpeciesWire | undefined =>
  s === "Dog" ? "DOG" : s === "Cat" ? "CAT" : s === "Horse" ? "HORSE" : undefined;

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

async function searchDirectory(
  api: WaitlistApi | null,
  q: string
): Promise<DirectoryHit[]> {
  const term = q.trim();
  if (!api || !term) return [];

  const hits: DirectoryHit[] = [];

  // Contacts
  if (api.contacts && typeof api.contacts.list === "function") {
    try {
      const res = await api.contacts.list({ q: term, limit: 25 });
      const items: any[] = Array.isArray(res) ? res : (res as any)?.items ?? [];
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
  if (api.organizations && typeof api.organizations.list === "function") {
    try {
      const res = await api.organizations.list({ q: term, limit: 25 });
      const items: any[] = Array.isArray(res) ? res : (res as any)?.items ?? [];
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

type AnimalLite = { id: number; name: string; species: SpeciesWire; sex: "FEMALE" | "MALE" };
async function fetchAnimals(
  api: WaitlistApi | null,
  opts: { q?: string; species?: SpeciesWire; sex?: "FEMALE" | "MALE"; limit?: number }
) {
  if (!api) return [];
  const res = await api.animals.list({ q: opts.q, species: opts.species, sex: opts.sex, limit: opts.limit ?? 25 });
  const raw: any[] = Array.isArray(res) ? res : (res as any)?.items ?? [];
  return raw.map((a) => ({
    id: Number(a.id),
    name: String(a.name ?? "").trim(),
    species: String(a.species ?? "DOG").toUpperCase() as SpeciesWire,
    sex: String(a.sex ?? "FEMALE").toUpperCase() as "FEMALE" | "MALE",
  })) as AnimalLite[];
}

/* Dam/Sire search hooks */
function useAnimalSearch(api: WaitlistApi | null, query: string, species: SpeciesWire | undefined, sex: "FEMALE" | "MALE") {
  const [hits, setHits] = React.useState<AnimalLite[]>([]);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!api || !species || !query.trim()) {
        if (alive) setHits([]);
        return;
      }
      try {
        let res: any;
        if (api.animals && typeof api.animals.list === "function") {
          res = await api.animals.list({ q: query.trim(), species, sex, limit: 25 });
        } else {
          const qs = new URLSearchParams();
          qs.set("q", query.trim());
          qs.set("species", species);
          qs.set("sex", sex);
          qs.set("limit", "25");
          res = await api.raw.get(`/animals?${qs.toString()}`);
        }
        const items = Array.isArray(res) ? res : (res as any)?.items ?? [];
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
      } catch (e) {
        console.error("Failed to fetch animals in useAnimalSearch", e);
        if (alive) setHits([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [api, query, species, sex]);
  return hits;
}

function DamResults({ api, query, species, onPick }: { api: WaitlistApi | null; query: string; species?: SpeciesWire; onPick: (a: AnimalLite) => void }) {
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

function SireResults({ api, query, species, onPick }: { api: WaitlistApi | null; query: string; species?: SpeciesWire; onPick: (a: AnimalLite) => void }) {
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

/* Contact Helpers */
const stripEmpty = (o: Record<string, any>) => {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(o)) if (v !== null && v !== undefined && String(v).trim() !== "") out[k] = v;
  return out;
};

async function exactContactLookup(api: WaitlistApi, probe: {
  email?: string; phone?: string; firstName?: string; lastName?: string
}) {
  const tries: string[] = [];
  if (probe.email) tries.push(probe.email);
  if (probe.phone) tries.push(probe.phone);
  const name = `${probe.firstName ?? ""} ${probe.lastName ?? ""}`.trim();
  if (name) tries.push(name);

  for (const q of tries) {
    const res = await api.contacts.list({ q, limit: 10 });
    const items: any[] = Array.isArray(res) ? res : (res as any)?.items ?? [];
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

/* Create Group form */
const MODAL_Z = 2147485000;

/* Date formatter used in table and details */
function fmtDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return Number.isFinite(dt.getTime()) ? dt.toLocaleDateString() : "";
}


/* Add to Waitlist modal */
function AddToWaitlistModal({
  api,
  tenantId,
  open,
  onClose,
  onCreated,
  allowedSpecies = SPECIES_UI_ALL,
}: {
  api: WaitlistApi | null;
  tenantId: number | null;
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
  allowedSpecies?: SpeciesUi[];
}) {
  const readOnly = false;
  const panelRef = React.useRef<HTMLDivElement>(null);
  const breedsApi = React.useMemo(() => {
    if (api && api.breeds && typeof api.breeds.listCanonical === "function") {
      return api.breeds;
    }
    return null;
  }, [api]);


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

  const contactsHits = React.useMemo(
    () => hits.filter((h) => h.kind === "contact"),
    [hits]
  );
  const orgHits = React.useMemo(
    () => hits.filter((h) => h.kind === "org"),
    [hits]
  );
  const resultSectionClass = "rounded-md bg-white/5";
  const renderPill = (t: string) => (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">{t}</span>
  );

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
      const items: any[] = Array.isArray(found) ? found : (found as any)?.items ?? [];
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

  // Duplicate detection state
  const [duplicateCheck, setDuplicateCheck] = React.useState<{
    isDuplicate: boolean;
    existingEntry?: any;
    checking: boolean;
  }>({ isDuplicate: false, existingEntry: null, checking: false });

  // Check for duplicates when relevant fields change
  React.useEffect(() => {
    let alive = true;
    const checkDuplicate = async () => {
      if (!api || !link || !speciesWire || !(breed?.name ?? "").trim()) {
        if (alive) setDuplicateCheck({ isDuplicate: false, existingEntry: null, checking: false });
        return;
      }

      setDuplicateCheck(prev => ({ ...prev, checking: true }));

      try {
        const result = await api.waitlist.checkDuplicate({
          clientPartyId: link.kind === "contact" || link.kind === "org" ? link.id : null,
          speciesPref: speciesWire,
          breedPrefs: (breed?.name ?? "").trim() ? [(breed?.name ?? "").trim()] : null,
          sirePrefId: sireId ?? null,
          damPrefId: damId ?? null,
        });
        if (alive) {
          setDuplicateCheck({
            isDuplicate: result.isDuplicate ?? false,
            existingEntry: result.existingEntry ?? null,
            checking: false,
          });
        }
      } catch (e) {
        // If duplicate check fails, allow creation anyway
        console.warn("Duplicate check failed:", e);
        if (alive) setDuplicateCheck({ isDuplicate: false, existingEntry: null, checking: false });
      }
    };

    const timer = setTimeout(checkDuplicate, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [api, link, speciesWire, breed?.name, sireId, damId]);

  const canSubmit = !!link && !!speciesWire && !!(breed?.name || "").trim() && !duplicateCheck.isDuplicate;

  async function handleSubmit() {
    if (!api || !canSubmit) return;

    // Phase 3: Use Party-first payload with clientPartyId
    // Backend (Phase 2+) expects clientPartyId as canonical identity field
    const body = {
      clientPartyId: link?.id ?? null,
      speciesPref: speciesWire!,
      breedPrefs: (breed?.name ?? "").trim() ? [(breed?.name ?? "").trim()] : null,
      damPrefId: damId ?? null,
      sirePrefId: sireId ?? null,
    };

    try {
      if (api.waitlist && typeof api.waitlist.create === "function") {
        await api.waitlist.create(body);
      } else {
        await api.raw.post(`/waitlist`, body, { tenantId: tenantId ?? undefined });
      }
      await onCreated();
      onClose();
    } catch (e) {
      console.error("Failed to create waitlist entry", e);
    }
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
    setDuplicateCheck({ isDuplicate: false, existingEntry: null, checking: false });
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
                      {...({ autoFocus: !link } as any)}
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Contacts */}
                        <div className={cx(resultSectionClass)}>
                          <SectionChipHeading
                            icon={<span className="i-lucide-user-2 h-3.5 w-3.5" aria-hidden="true" />}
                            text="Contacts"
                          />
                          {contactsHits.length === 0 ? (
                            <div className="px-2 py-2 text-sm text-secondary">No contacts</div>
                          ) : (
                            contactsHits.map((h) => (
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
                                  {renderPill("Contact")}
                                  <span>{h.label}</span>
                                  {h.sub ? <span className="text-xs text-secondary">• {h.sub}</span> : null}
                                </div>
                              </button>
                            ))
                          )}
                        </div>

                        {/* Orgs */}
                        <div className={cx(resultSectionClass)}>
                          <SectionChipHeading
                            icon={<span className="i-lucide-building-2 h-3.5 w-3.5" aria-hidden="true" />}
                            text="Organizations"
                          />
                          {orgHits.length === 0 ? (
                            <div className="px-2 py-2 text-sm text-secondary">No organizations</div>
                          ) : (
                            orgHits.map((h) => (
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
                                  {renderPill("Org")}
                                  <span>{h.label}</span>
                                  {h.sub ? <span className="text-xs text-secondary">• {h.sub}</span> : null}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {quickOpen && (
                  <div className="rounded-lg border border-hairline p-3 bg-surface/60">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        {quickOpen === "contact" ? "Quick Add Contact" : "Quick Add Organization"}
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
                          onChange={(e) => setQc({ ...qc, firstName: e.target.value })}
                        />
                        <input
                          className={cx(inputClass)}
                          placeholder="Last name"
                          value={qc.lastName}
                          onChange={(e) => setQc({ ...qc, lastName: e.target.value })}
                        />
                        <input
                          className={cx(inputClass)}
                          placeholder="Email"
                          value={qc.email}
                          onChange={(e) => setQc({ ...qc, email: e.target.value })}
                        />
                        <input
                          className={cx(inputClass)}
                          placeholder="Phone (E.164)"
                          value={qc.phone}
                          onChange={(e) => setQc({ ...qc, phone: e.target.value })}
                        />
                        {createErr && (
                          <div className="md:col-span-2 text-sm text-red-600">{createErr}</div>
                        )}
                        <div className="md:col-span-2 flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() =>
                              setQc({ firstName: "", lastName: "", email: "", phone: "" })
                            }
                          >
                            Clear
                          </Button>
                          <Button onClick={doQuickAdd} disabled={creating || !api}>
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
                          onChange={(e) => setQo({ ...qo, name: e.target.value })}
                        />
                        <input
                          className={cx(inputClass)}
                          placeholder="Website (optional)"
                          value={qo.website}
                          onChange={(e) => setQo({ ...qo, website: e.target.value })}
                        />
                        {createErr && (
                          <div className="text-sm text-red-600">{createErr}</div>
                        )}
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setQo({ name: "", website: "" })}
                          >
                            Clear
                          </Button>
                          <Button onClick={doQuickAdd} disabled={creating || !api}>
                            {creating ? "Creating..." : "Create / Link"}
                          </Button>
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
                        {SPECIES_UI_ALL.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="md:col-span-2 relative">
                      <div className={cx(labelClass + " mb-1")}>Breed</div>
                      {speciesUi ? (
                        breedsApi ? (
                          <div className={cx(readOnly ? "pointer-events-none opacity-60" : "")}>
                            <BreedCombo
                              key={`breed-${speciesUi}-${breedNonce}`}
                              species={speciesUi}
                              value={breed}
                              onChange={onBreedPick}
                              api={{ breeds: breedsApi }}
                            />
                          </div>
                        ) : (
                          <div className="h-9 px-3 flex items-center rounded-md border border-hairline bg-surface/60 text-sm text-secondary">
                            Breeds API not available
                          </div>
                        )
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

                {/* Duplicate Warning */}
                {duplicateCheck.isDuplicate && duplicateCheck.existingEntry && (
                  <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                          Duplicate Waitlist Entry
                        </p>
                        <p className="text-sm text-yellow-600/80 dark:text-yellow-400/80 mt-1">
                          A waitlist entry already exists for this contact/organization with the same species, breed,
                          {duplicateCheck.existingEntry.sirePref?.name && ` sire (${duplicateCheck.existingEntry.sirePref.name}),`}
                          {duplicateCheck.existingEntry.damPref?.name && ` dam (${duplicateCheck.existingEntry.damPref.name}),`} combination.
                        </p>
                        <p className="text-xs text-yellow-600/60 dark:text-yellow-400/60 mt-2">
                          To create a new entry, change the species, breed, sire, or dam to differentiate it from the existing entry.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Checking indicator */}
                {duplicateCheck.checking && (
                  <div className="text-sm text-secondary text-center py-2">
                    Checking for existing entries...
                  </div>
                )}

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
                  <Button onClick={handleSubmit} disabled={!canSubmit || !api || duplicateCheck.checking}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add to Waitlist
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

function PortalPopover({ anchorRef, open, children }: { anchorRef: React.RefObject<HTMLElement | null>, open: boolean, children: React.ReactNode }) {
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
  onStatusChange,
}: {
  api: WaitlistApi | null;
  row: any;
  mode: "view" | "edit";
  onChange: (patch: any) => void;
  onStatusChange?: (newStatus: string, reason?: string) => Promise<void>;
}) {
  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  const readOnly = mode !== "edit";
  const isRejected = row?.status === "REJECTED";
  const isPending = row?.status === "INQUIRY" || row?.status === "PENDING";
  const isApproved = row?.status === "APPROVED" || row?.status === "ACTIVE";

  // Restore modal state
  const [showRestoreModal, setShowRestoreModal] = React.useState(false);
  const [restoreTarget, setRestoreTarget] = React.useState<"APPROVED" | "INQUIRY">("APPROVED");
  const [restoreReason, setRestoreReason] = React.useState("");
  const [restoreLoading, setRestoreLoading] = React.useState(false);

  const handleRestore = async () => {
    if (!onStatusChange) return;
    setRestoreLoading(true);
    try {
      await onStatusChange(restoreTarget, restoreReason || undefined);
      setShowRestoreModal(false);
      setRestoreReason("");
    } catch (e) {
      console.error("Failed to restore entry", e);
    }
    setRestoreLoading(false);
  };
  const breedsApi = React.useMemo(() => {
    if (api && api.breeds && typeof api.breeds.listCanonical === "function") {
      return api.breeds;
    }
    return null;
  }, [api]);
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
          <label className="flex flex-col gap-1">
            <span className={cx(labelClass)}>Species</span>
            <select
              className={cx(
                inputClass,
                !readOnly && !speciesUi && "border-yellow-500 ring-1 ring-yellow-500/50"
              )}
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

          <div className="md:col-span-2 relative">
            <div className={cx(labelClass + " mb-1")}>Breed</div>
            {speciesUi ? (
              breedsApi ? (
                <div className={cx(readOnly ? "pointer-events-none opacity-60" : "")}>
                  <BreedCombo
                    key={`breed-${speciesUi}-${breedNonce}`}
                    species={speciesUi}
                    value={breed}
                    onChange={onBreedPick}
                    api={{ breeds: breedsApi }}
                  />
                </div>
              ) : (
                <div className="h-9 px-3 flex items-center rounded-md border border-hairline bg-surface/60 text-sm text-secondary">
                  Breeds API not available
                </div>
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
          {/* Only show Deposit Paid for approved entries */}
          {isApproved && (
            <label className="flex flex-col gap-1">
              <span className={cx(labelClass)}>Deposit Paid</span>
              <DatePicker
                value={depositPaidAt || ""}
                onChange={(e) => setDepositPaidAt(e.currentTarget.value)}
                inputClassName={cx(inputClass)}
                readOnly={readOnly}
              />
            </label>
          )}
          <label className={"flex flex-col gap-1 " + (isApproved ? "md:col-span-3" : "md:col-span-1")}>
            <span className={cx(labelClass)}>Notes</span>
            <textarea
              className={cx(inputClass, " h-32 resize-vertical")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)} disabled={readOnly}
            />
          </label>
        </div>
      </SectionCard>

      {/* Restore Section - only for rejected entries */}
      {isRejected && onStatusChange && (
        <SectionCard title="Restore Applicant">
          <div className="p-3">
            <p className="text-sm text-secondary mb-3">
              This applicant was rejected. You can restore them to the pending or approved waitlist.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRestoreModal(true)}
            >
              Restore to Waitlist
            </Button>
          </div>
        </SectionCard>
      )}

      {/* Restore Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowRestoreModal(false)} />
          <div className="relative w-full max-w-md bg-surface border border-hairline rounded-xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-hairline">
              <h3 className="text-lg font-semibold">Restore Applicant</h3>
              <p className="text-sm text-secondary mt-1">
                Move this applicant back to an active status.
              </p>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-secondary mb-2 block">
                  Restore to
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRestoreTarget("APPROVED")}
                    className={[
                      "p-3 rounded-lg border-2 text-left transition-all",
                      restoreTarget === "APPROVED"
                        ? "border-green-500 bg-green-500/10"
                        : "border-hairline hover:border-neutral-500",
                    ].join(" ")}
                  >
                    <div className="font-medium text-sm">Approved</div>
                    <p className="text-xs text-secondary mt-0.5">
                      Ready to be matched
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRestoreTarget("INQUIRY")}
                    className={[
                      "p-3 rounded-lg border-2 text-left transition-all",
                      restoreTarget === "INQUIRY"
                        ? "border-yellow-500 bg-yellow-500/10"
                        : "border-hairline hover:border-neutral-500",
                    ].join(" ")}
                  >
                    <div className="font-medium text-sm">Pending</div>
                    <p className="text-xs text-secondary mt-0.5">
                      Needs review again
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-secondary mb-2 block">
                  Reason (optional)
                </label>
                <textarea
                  value={restoreReason}
                  onChange={(e) => setRestoreReason(e.target.value)}
                  placeholder="Why are you restoring this applicant?"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-hairline rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-hairline flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowRestoreModal(false)} disabled={restoreLoading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRestore}
                disabled={restoreLoading}
              >
                {restoreLoading ? "Restoring..." : `Restore to ${restoreTarget === "APPROVED" ? "Approved" : "Pending"}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Portal Access Section - only for approved entries */}
      {isApproved && (
        <PortalInviteSection
          api={api}
          clientPartyId={row?.clientPartyId}
          contactEmail={row?.contact?.email}
          orgEmail={row?.organization?.email}
          entryId={row?.id}
        />
      )}

      {/* Block User Section - only for marketplace users */}
      <BlockUserSection
        api={api}
        clientParty={row?.clientParty}
        marketplaceUserId={row?.marketplaceUserId || row?.clientParty?.externalId}
      />
    </div>
  );
}

// Portal Invite Component
function PortalInviteSection({
  api,
  clientPartyId,
  contactEmail,
  orgEmail,
  entryId,
}: {
  api: WaitlistApi | null;
  clientPartyId?: number;
  contactEmail?: string;
  orgEmail?: string;
  entryId?: number;
}) {
  const { toast } = useToast();
  const [portalStatus, setPortalStatus] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [checkingStatus, setCheckingStatus] = React.useState(true);

  const partyEmail = contactEmail || orgEmail;
  const hasEmail = Boolean(partyEmail);
  const hasParty = Boolean(clientPartyId);

  // Check portal access status on mount
  React.useEffect(() => {
    if (!clientPartyId || !api) {
      setCheckingStatus(false);
      return;
    }

    async function checkStatus() {
      try {
        const res = await fetch(`/api/v1/portal-access/${clientPartyId}`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setPortalStatus(data.portalAccess?.status || "NO_ACCESS");
        }
      } catch (err) {
        console.error("Failed to check portal status:", err);
      } finally {
        setCheckingStatus(false);
      }
    }

    checkStatus();
  }, [clientPartyId, api]);

  async function handleInvite() {
    if (!clientPartyId || !api) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/portal-access/${clientPartyId}/enable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          contextType: "WAITLIST",
          contextId: entryId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Client portal invite sent.");
        setPortalStatus("INVITED");
      } else {
        if (data.error === "already_active") {
          toast.info("Client portal already active.");
          setPortalStatus("ACTIVE");
        } else if (data.error === "already_invited") {
          toast.info("Invite already sent.");
          setPortalStatus("INVITED");
        } else {
          toast.error(data.error || "Failed to send invite.");
        }
      }
    } catch (err) {
      console.error("Failed to send portal invite:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!hasParty || !hasEmail) {
    return null; // Don't show section if no party or email
  }

  if (checkingStatus) {
    return (
      <SectionCard title="Client Portal">
        <div className="p-4 text-sm text-secondary">Checking status...</div>
      </SectionCard>
    );
  }

  // Hide button if already active
  if (portalStatus === "ACTIVE") {
    return (
      <SectionCard title="Client Portal">
        <div className="p-4 text-sm text-secondary">
          Client portal active.
        </div>
      </SectionCard>
    );
  }

  // Show button for NO_ACCESS or INVITED states
  return (
    <SectionCard title="Client Portal">
      <div className="p-4 space-y-3">
        {portalStatus === "INVITED" && (
          <div className="text-sm text-secondary">Invite already sent.</div>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleInvite}
          disabled={loading || portalStatus === "INVITED"}
        >
          {loading ? "Sending..." : "Invite to Client Portal"}
        </Button>
      </div>
    </SectionCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Block User Section Component (for marketplace users in approved/rejected entries)
 * ───────────────────────────────────────────────────────────────────────────── */
type BlockLevel = "LIGHT" | "MEDIUM" | "HEAVY";

const BLOCK_LEVELS: Array<{
  value: BlockLevel;
  label: string;
  description: string;
  restrictions: string[];
}> = [
  {
    value: "LIGHT",
    label: "Light",
    description: "Minimal restrictions",
    restrictions: ["Cannot join your waitlist"],
  },
  {
    value: "MEDIUM",
    label: "Medium",
    description: "Moderate restrictions",
    restrictions: ["Cannot join your waitlist", "Cannot send you messages"],
  },
  {
    value: "HEAVY",
    label: "Heavy",
    description: "Full restrictions",
    restrictions: [
      "Cannot join your waitlist",
      "Cannot send you messages",
      "Cannot view your breeder profile",
    ],
  },
];

function BlockUserSection({
  api,
  clientParty,
  marketplaceUserId,
}: {
  api: WaitlistApi | null;
  clientParty?: { name?: string; email?: string; externalId?: string } | null;
  marketplaceUserId?: string | null;
}) {
  const { toast } = useToast();
  const [showModal, setShowModal] = React.useState(false);
  const [level, setLevel] = React.useState<BlockLevel>("MEDIUM");
  const [reason, setReason] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Don't show if no marketplace user ID
  if (!marketplaceUserId) {
    return null;
  }

  const userName = clientParty?.name || clientParty?.email || "this user";

  async function handleBlock() {
    if (!api || !marketplaceUserId) return;

    setLoading(true);
    try {
      await api.marketplaceBlocks.block({
        userId: marketplaceUserId,
        level,
        reason: reason || undefined,
      });
      toast.success("User blocked successfully");
      setShowModal(false);
      setLevel("MEDIUM");
      setReason("");
    } catch (err: any) {
      console.error("Failed to block user:", err);
      toast.error(err?.message || "Failed to block user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SectionCard title="Block User">
        <div className="p-4 space-y-3">
          <p className="text-sm text-secondary">
            Block this marketplace user from interacting with your profile.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowModal(true)}
          >
            Block User
          </Button>
        </div>
      </SectionCard>

      {/* Block Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md bg-surface border border-hairline rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-hairline">
              <h3 className="text-lg font-semibold">Block User</h3>
              <p className="text-sm text-secondary mt-1">
                Block <strong>{userName}</strong> from interacting with your marketplace profile.
              </p>
            </div>

            {/* Content */}
            <div className="px-5 py-4 space-y-4">
              {/* Level Selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-secondary mb-2 block">
                  Block Level
                </label>
                <div className="space-y-2">
                  {BLOCK_LEVELS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLevel(opt.value)}
                      className={[
                        "w-full text-left p-3 rounded-lg border transition-all",
                        level === opt.value
                          ? "border-[hsl(var(--brand-orange))] bg-[hsl(var(--brand-orange))]/5"
                          : "border-hairline hover:border-neutral-500",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{opt.label}</span>
                        <span className="text-xs text-secondary">{opt.description}</span>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {opt.restrictions.map((r, i) => (
                          <li key={i} className="text-xs text-secondary flex items-center gap-1.5">
                            <svg className="w-3 h-3 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason (optional) */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-secondary mb-2 block">
                  Reason (Optional, for your reference only)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Spam, abusive messages, etc."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-hairline rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
                />
                <p className="text-xs text-secondary mt-1">
                  This is only visible to you, not the blocked user.
                </p>
              </div>

              {/* Info banner */}
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                <p className="text-xs text-blue-400">
                  The user will not be notified that they have been blocked. They will see generic messages like "This breeder is not accepting inquiries."
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-hairline flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowModal(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBlock}
                disabled={loading}
              >
                {loading ? "Blocking..." : "Block User"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Approved Waitlist Info Card
 * ───────────────────────────────────────────────────────────────────────────── */
function ApprovedWaitlistInfoCard() {
  return (
    <div className="rounded-lg border border-green-500/30 bg-surface px-4 py-3 text-center mb-4">
      <h3 className="text-sm font-medium text-green-500 mb-1">Approved Waitlist</h3>
      <p className="text-sm text-secondary max-w-lg mx-auto">
        Pre-screened and vetted contacts you've decided to proceed with transactionally will appear here until they are matched with an offspring.
        Contacts can have multiple waitlist entries with different species, breed, sire, or dam preferences.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Main WaitlistTab Component
 * ───────────────────────────────────────────────────────────────────────────── */
export default function WaitlistTab({ api, tenantId, readOnlyGlobal }: { api: WaitlistApi | null; tenantId: number | null, readOnlyGlobal: boolean }) {
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
    if (!api.waitlist || typeof api.waitlist.list !== "function") {
      console.warn("[Waitlist] waitlist API missing on client", api);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.waitlist.list({
        q: q || undefined,
        limit: 200,
        tenantId: tenantId ?? undefined,
      });
      const items: any[] = Array.isArray(res) ? res : (res as any)?.items ?? [];
      setRaw(items as WaitlistRowWire[]);
      setRows(items.map(mapWaitlistToTableRow));
      setLoading(false);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load waitlist");
      setLoading(false);
    }
  }, [api, q, tenantId]);

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
    <>
      <ApprovedWaitlistInfoCard />
      <Card>
        <div className="relative">
          <div className="absolute right-0 top-0 h-10 flex items-center gap-2 pr-2" style={{ zIndex: 50, pointerEvents: "auto" }}>
            {!readOnlyGlobal && (
              <Button
                size="sm"
                onClick={() => window.dispatchEvent(new CustomEvent("bhq:waitlist:add"))}
              >
                <Plus className="h-4 w-4 mr-1" />
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
            onSave: async (rowId: string | number, draft: any) => {
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

              const id = typeof rowId === "number" ? rowId : Number(rowId);
              if (!Number.isFinite(id)) {
                console.error("[Waitlist] invalid id for patch", { rowId, draft });
                return;
              }

              let updated: any;
              if (api.waitlist && typeof api.waitlist.patch === "function") {
                updated = await api.waitlist.patch(id, body);
              } else if (api.raw && typeof api.raw.patch === "function") {
                updated = await api.raw.patch(`/waitlist/${id}`, body, {
                  tenantId: tenantId ?? undefined,
                });
              } else {
                console.error("[Waitlist] no waitlist.patch or raw.patch available on client", api);
                return;
              }

              const idx = raw.findIndex((r) => String(r.id) === String(id));
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
              const isRejected = row?.status === "REJECTED";
              // Rejected entries are always read-only
              const effectiveReadOnly = readOnlyGlobal || isRejected;
              const effectiveMode = effectiveReadOnly ? "view" : mode;

              const handleDraftChange = (patch: any) =>
                setDraft((prev: any) => ({ ...(prev || {}), ...patch }));

              return (
                <DetailsScaffold
                  title={tblRow.contactLabel || tblRow.orgLabel || `Waitlist #${tblRow.id}`}
                  subtitle={isRejected ? "Rejected" : ""}
                  mode={effectiveMode}
                  onEdit={() => !effectiveReadOnly && setMode("edit")}
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
                    mode={effectiveMode}
                    onChange={handleDraftChange}
                    onStatusChange={async (newStatus: string, reason?: string) => {
                      if (!api) return;
                      const id = row.id;
                      const body = { status: newStatus, restoreReason: reason };
                      let updated: any;
                      if (api.waitlist && typeof api.waitlist.patch === "function") {
                        updated = await api.waitlist.patch(id, body);
                      } else if (api.raw && typeof api.raw.patch === "function") {
                        updated = await api.raw.patch(`/waitlist/${id}`, body, {
                          tenantId: tenantId ?? undefined,
                        });
                      }
                      if (updated) {
                        const idx = raw.findIndex((r) => String(r.id) === String(id));
                        if (idx >= 0) {
                          const nextRaw = [...raw];
                          nextRaw[idx] = updated as any;
                          setRaw(nextRaw);
                          setRows(nextRaw.map(mapWaitlistToTableRow));
                        }
                      }
                    }}
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
                      onClick={() => setParamAndNotify("waitlistId", r.id)}
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
    </>
  );
}

/** Small bridge to open AddToWaitlistModal from the toolbar button */
function WaitlistAddBridge({ api, tenantId, onCreated }: { api: WaitlistApi | null; tenantId: number | null; onCreated: () => Promise<void> | void }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener("bhq:waitlist:add", h as any);
    return () => window.removeEventListener("bhq:waitlist:add", h as any);
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
