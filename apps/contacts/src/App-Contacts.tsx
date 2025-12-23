// apps/contacts/src/App-Contacts.tsx
import * as React from "react";
import { createPortal } from "react-dom";
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
  FilterChips,
  FiltersRow,
  IntlPhoneField,
  DetailsHost,
  DetailsScaffold,
  SectionCard,
  Button,
  Input,
  buildRangeAwareSchema,
  inDateRange,
  PillToggle,
  Badge,
  exportToCsv,
  Popover,
} from "@bhq/ui";
import { Overlay, getOverlayRoot } from "@bhq/ui/overlay";
import "@bhq/ui/styles/table.css";
import { makeApi } from "./api";
import { MoreHorizontal, Download, X } from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────────
 * Types & small utils
 * ────────────────────────────────────────────────────────────────────────── */

type ID = number | string;

type PhoneValue = {
  countryCode: string;
  callingCode: string;
  national: string;
  e164: string | null;
};

function tinyDebounce<T extends (...args: any[]) => any>(fn: T, ms = 300) {
  let t: any;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function sameStr(a?: string | null, b?: string | null) {
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}

function normalizePhone(e164?: string | null) {
  return (e164 || "").replace(/[^\+\d]/g, "");
}

/* ────────────────────────────────────────────────────────────────────────────
 * Data types
 * ────────────────────────────────────────────────────────────────────────── */

export type ContactRow = {
  id: ID;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  displayName?: string | null;
  organizationId?: ID | null;
  organizationName?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  leadStatus?: string | null;
  tags: string[];
  notes?: string | null;
  street?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;

  birthday?: string | null;
  lastContacted?: string | null;
  nextFollowUp?: string | null;

  // optional channel prefs + compliance flags (may be undefined from older payloads)
  prefersEmail?: boolean | null;
  prefersSms?: boolean | null;
  prefersPhone?: boolean | null;
  prefersMail?: boolean | null;
  prefersWhatsapp?: boolean | null;

  emailUnsubscribed?: boolean | null;
  smsUnsubscribed?: boolean | null;

  phoneMobileE164?: string | null;
  phoneLandlineE164?: string | null;
  whatsappE164?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
  archived?: boolean | null;
};

const COLUMNS: Array<{ key: keyof ContactRow & string; label: string; default?: boolean }> = [
  { key: "firstName", label: "First", default: true },
  { key: "lastName", label: "Last", default: true },
  { key: "nickname", label: "Nickname", default: true },
  { key: "organizationName", label: "Organization", default: true },
  { key: "email", label: "Email", default: true },
  { key: "phone", label: "Phone", default: true },
  { key: "tags", label: "Tags", default: true },
  { key: "status", label: "Status", default: false },
  { key: "leadStatus", label: "Lead Status" },
  { key: "lastContacted", label: "Last Contacted" },
  { key: "nextFollowUp", label: "Next Follow-up" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "created_at", label: "Created" },
  { key: "updated_at", label: "Updated" },
];

const STORAGE_KEY = "bhq_contacts_cols_v2";
const Q_KEY = "bhq_contacts_q_v2";
const FILTERS_KEY = "bhq_contacts_filters_v2";
const DATE_KEYS = new Set([
  "birthday",
  "lastContacted",
  "nextFollowUp",
  "created_at",
  "updated_at",
] as const);

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

function fmt(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  if (!Number.isFinite(dt.getTime())) return String(d).slice(0, 10) || "";
  return dt.toLocaleDateString();
}

function computeDisplayName(r: any) {
  const display = String(r.displayName ?? r.display_name ?? "").trim();
  if (display) return display;
  const nick = String(r.nickname ?? "").trim();
  const first = String(r.firstName ?? r.first_name ?? "").trim();
  const last = String(r.lastName ?? r.last_name ?? "").trim();
  const base = nick || first;
  const full = [base, last].filter(Boolean).join(" ").trim();
  return full || r.email || r.phone || `Contact ${r.id}`;
}

function contactToRow(p: any): ContactRow {
  const orgId =
    p.organizationId ??
    p.organization_id ??
    p.organization?.id ??
    null;

  const orgName =
    p.organizationName ??
    p.organization_name ??
    p.organization?.name ??
    p.organization?.displayName ??
    p.organization?.label ??
    null;

  return {
    id: p.id,
    firstName: p.firstName ?? p.first_name ?? null,
    lastName: p.lastName ?? p.last_name ?? null,
    nickname: p.nickname ?? null,
    displayName: p.displayName ?? p.display_name ?? null,

    organizationId: orgId,
    organizationName: orgName,

    email: p.email ?? null,
    phone:
      p.phone ??
      p.phoneMobileE164 ??
      p.whatsappE164 ??
      p.phoneE164 ??
      null,
    status: p.status ?? "Active",
    leadStatus: p.leadStatus ?? null,
    tags: Array.isArray(p.tags) ? p.tags.filter(Boolean) : [],
    notes: p.notes ?? null,
    street: p.street ?? null,
    street2: p.street2 ?? null,
    city: p.city ?? null,
    state: p.state ?? null,
    postalCode: p.postalCode ?? p.zip ?? null,
    country: p.country ?? null,

    birthday: p.birthday ?? null,
    lastContacted: p.lastContacted ?? null,
    nextFollowUp: p.nextFollowUp ?? null,

    prefersEmail: p.prefersEmail ?? null,
    prefersSms: p.prefersSms ?? null,
    prefersPhone: p.prefersPhone ?? null,
    prefersMail: p.prefersMail ?? null,
    prefersWhatsapp: p.prefersWhatsapp ?? null,

    emailUnsubscribed: p.emailUnsubscribed ?? null,
    smsUnsubscribed: p.smsUnsubscribed ?? null,

    phoneMobileE164: p.phoneMobileE164 ?? null,
    phoneLandlineE164: p.phoneLandlineE164 ?? null,
    whatsappE164: p.whatsappE164 ?? null,

    created_at: p.created_at ?? p.createdAt ?? null,
    updated_at: p.updated_at ?? p.updatedAt ?? null,
    archived: p.archived ?? null,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Small widgets
 * ────────────────────────────────────────────────────────────────────────── */

type OrgOption = { id: number; name: string };

const OrganizationSelect: React.FC<{
  value: OrgOption | null;
  onChange: (v: OrgOption | null) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = "Select Organization" }) => {
  const api = React.useMemo(() => makeApi(), []);
  const [query, setQuery] = React.useState(value?.name ?? "");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<OrgOption[]>([]);
  const [highlight, setHighlight] = React.useState<number>(-1);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const doSearch = React.useMemo(
    () =>
      tinyDebounce(async (q: string) => {
        setLoading(true);
        setError(null);
        try {
          const list = await api.lookups.searchOrganizations(q);
          const mapped = (list || []).map((o: any) => ({
            id: Number(o.id),
            name: String(o.name || o.displayName || o.label || ""),
          }));
          setItems(mapped);
          setHighlight(mapped.length ? 0 : -1);
        } catch (e: any) {
          setError(e?.message || "Unable to load organizations");
          setItems([]);
        } finally {
          setLoading(false);
        }
      }, 200),
    [api]
  );

  React.useEffect(() => {
    if (open) doSearch(query);
  }, [query, open, doSearch]);

  React.useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const choose = (opt: OrgOption | null) => {
    onChange(opt);
    setQuery(opt?.name ?? "");
    setOpen(false);
  };

  return (
    <div className="relative" ref={rootRef}>
      <Input
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onChange={(e) => {
          setQuery((e.currentTarget as HTMLInputElement).value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, items.length - 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          }
          if (e.key === "Enter") {
            e.preventDefault();
            if (items[highlight]) choose(items[highlight]);
          }
          if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-md border border-hairline bg-surface shadow-lg max-height-60 overflow-auto"
          role="listbox"
        >
          {loading ? (
            <div className="px-3 py-2 text-sm text-secondary">Searching…</div>
          ) : error ? (
            <div className="px-3 py-2">
              <div className="text-sm text-red-400">{error}</div>
              <button
                type="button"
                className="mt-2 text-xs text-secondary hover:text-primary underline"
                onClick={() => doSearch(query)}
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="px-3 py-2">
              <div className="text-sm text-secondary mb-2">No organizations found</div>
              {query.trim() && (
                <button
                  type="button"
                  className="w-full text-left px-2 py-1.5 text-sm text-primary bg-white/5 rounded hover:bg-white/10"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const created = await api.organizations.create({ name: query.trim() });
                      const newOrg = { id: Number(created.id), name: String(created.name || query.trim()) };
                      choose(newOrg);
                    } catch (e: any) {
                      setError(e?.payload?.error || e?.message || "Failed to create organization");
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  + Create "{query.trim()}"
                </button>
              )}
            </div>
          ) : (
            items.map((opt, i) => (
              <button
                key={opt.id}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm ${i === highlight ? "bg-white/5" : ""}`}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(opt)}
                role="option"
                aria-selected={i === highlight}
              >
                {opt.name}
              </button>
            ))
          )}
          {value && !error && (
            <div className="border-t border-hairline">
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-xs text-secondary hover:bg-white/5"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(null)}
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const COUNTRIES = [
  "— Select country",
  "United States",
  "Argentina",
  "Australia",
  "Brazil",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "France",
  "Germany",
  "India",
  "Ireland",
  "Italy",
  "Japan",
  "Mexico",
  "Netherlands",
  "New Zealand",
  "Norway",
  "Peru",
  "Poland",
  "Portugal",
  "South Africa",
  "Spain",
  "Sweden",
  "Switzerland",
  "United Kingdom",
] as const;

const CountrySelect: React.FC<{
  value: string | null | undefined;
  onChange: (v: string | null) => void;
}> = ({ value, onChange }) => (
  <select
    className="w-full h-9 rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
    value={value ?? ""}
    onChange={(e) => onChange((e.target as HTMLSelectElement).value || null)}
  >
    {COUNTRIES.map((c) => (
      <option key={c} value={c === "— Select country" ? "" : c}>
        {c}
      </option>
    ))}
  </select>
);

/* ────────────────────────────────────────────────────────────────────────────
 * Drawer view helpers
 * ────────────────────────────────────────────────────────────────────────── */

function formatNextFollowUpLabel(d?: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  if (!Number.isFinite(dt.getTime())) return d;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const when = dt.getTime() - today.getTime();
  const one = 24 * 60 * 60 * 1000;
  if (when === 0) return "Follow-up today";
  if (when === one) return "Follow-up tomorrow";
  if (when < 0) return `Follow-up overdue`;
  return `Follow-up ${dt.toLocaleDateString()}`;
}

function formatE164Phone(e164?: string | null) {
  if (!e164) return null;
  const digits = e164.replace(/\D/g, "");

  // US/NANP format: +1 (XXX) XXX-XXXX
  if (digits.startsWith("1") && digits.length === 11) {
    const local = digits.slice(1);
    return `+1 (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6, 10)}`;
  }

  // Other countries: just return as-is with + prefix
  return `+${digits}`;
}

/* ───────────────── SnoozeMenu (viewport-clamped) ───────────────── */

const SnoozeMenu: React.FC<{
  anchorRect: DOMRect | null;
  onPick: (iso: string | null) => void;
  onClose: () => void;
}> = ({ anchorRect, onPick, onClose }) => {
  // Known width from class w-40 (10rem ≈ 160px). Height varies; use a safe estimate for flip.
  const MENU_W = 160;
  const MENU_H_EST = 200; // enough to decide flip

  // Compute a clamped viewport position. Right-align to the anchor.
  const { top, left } = React.useMemo(() => {
    const pad = 8;      // viewport padding
    const gap = 6;      // space between button and menu
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!anchorRect) {
      return { top: Math.min(60, vh - MENU_H_EST - pad), left: Math.max(pad, vw - MENU_W - pad) };
    }

    // Default below the button
    let t = Math.round(anchorRect.bottom + gap);
    let l = Math.round(anchorRect.right - MENU_W);

    // Flip above if not enough space below
    if (t + MENU_H_EST > vh - pad) {
      t = Math.round(anchorRect.top - gap - MENU_H_EST);
    }

    // Clamp to viewport
    t = Math.max(pad, Math.min(t, vh - MENU_H_EST - pad));
    l = Math.max(pad, Math.min(l, vw - MENU_W - pad));

    return { top: t, left: l };
  }, [anchorRect]);

  // Close on Escape
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Close on outside click
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const p = panelRef.current;
      if (!p) return;
      if (!p.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDown, true);
    return () => document.removeEventListener("mousedown", onDown, true);
  }, [onClose]);

  // Render to body so it is never clipped by parents
  return createPortal(
    <div
      ref={panelRef}
      role="menu"
      style={{
        position: "fixed",
        top,
        left,
        width: MENU_W,
        zIndex: 2147483646,
      }}
      className="rounded-md border border-hairline bg-surface shadow-lg p-1"
    >
      <button className="block w-full text-left px-3 py-1.5 text-sm hover:bg-white/5"
        onClick={() => { onPick(new Date().toISOString()); onClose(); }}>
        Today
      </button>
      <button className="block w-full text-left px-3 py-1.5 text-sm hover:bg-white/5"
        onClick={() => {
          const d = new Date(); d.setHours(0, 0, 0, 0);
          onPick(d.toISOString()); onClose();
        }}>
        Start of today
      </button>
      <button className="block w-full text-left px-3 py-1.5 text-sm hover:bg-white/5"
        onClick={() => { const b = new Date(); b.setHours(0, 0, 0, 0); b.setDate(b.getDate() + 1); onPick(b.toISOString()); onClose(); }}>
        +1 day
      </button>
      <button className="block w-full text-left px-3 py-1.5 text-sm hover:bg-white/5"
        onClick={() => { const b = new Date(); b.setHours(0, 0, 0, 0); b.setDate(b.getDate() + 3); onPick(b.toISOString()); onClose(); }}>
        +3 days
      </button>
      <button className="block w-full text-left px-3 py-1.5 text-sm hover:bg-white/5"
        onClick={() => { const b = new Date(); b.setHours(0, 0, 0, 0); b.setDate(b.getDate() + 7); onPick(b.toISOString()); onClose(); }}>
        +1 week
      </button>
      <div className="border-t border-hairline my-1" />
      <button className="block w-full text-left px-3 py-1.5 text-sm hover:bg-white/5"
        onClick={() => { onPick(null); onClose(); }}>
        Clear
      </button>
    </div>,
    document.body
  );
};

/* ─────────────── NextFollowUpChip (passes anchor rect) ─────────────── */

const NextFollowUpChip: React.FC<{
  value?: string | null;
  onChange: (iso: string | null) => void;
}> = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const [anchorRect, setAnchorRect] = React.useState<DOMRect | null>(null);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);

  const label = formatNextFollowUpLabel(value) || "Set follow-up";

  // Recompute anchor rect when opening, and on resize/scroll
  const recompute = React.useCallback(() => {
    if (!btnRef.current) return;
    setAnchorRect(btnRef.current.getBoundingClientRect());
  }, []);
  React.useEffect(() => {
    if (!open) return;
    recompute();
    const onScroll = () => recompute();
    const onResize = () => recompute();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, recompute]);

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={btnRef}
        type="button"
        className="h-7 px-2 rounded-md border border-hairline text-xs hover:bg-white/5"
        onClick={() => setOpen(v => !v)}
      >
        {label}
      </button>
      {open && (
        <SnoozeMenu
          anchorRect={anchorRect}
          onPick={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
};

function findDuplicates(all: ContactRow[], currentId: ID | null, email?: string | null, mobile?: string | null, whatsapp?: string | null, anyPhone?: string | null) {
  const emailLc = (email || "").trim().toLowerCase();
  const phones = new Set<string>([
    normalizePhone(mobile || ""),
    normalizePhone(whatsapp || ""),
    normalizePhone(anyPhone || ""),
  ].filter(Boolean));

  return all.filter((r) => {
    if (String(r.id) === String(currentId ?? "")) return false;
    const rEmailLc = (r.email || "").trim().toLowerCase();
    if (emailLc && rEmailLc && emailLc === rEmailLc) return true;

    const rPhones = [
      normalizePhone(r.phoneMobileE164 || ""),
      normalizePhone(r.whatsappE164 || ""),
      normalizePhone(r.phone || ""),
    ].filter(Boolean);

    return rPhones.some((p) => phones.has(p));
  });
}

type AnimalRow = {
  id: ID;
  name: string | null;
  species: string | null;
  sex: string | null;
  status: string | null;
  role: string | null;   // Owner, Co-owner, Guardian, etc.
  sharePct: number | null;
};

/** Return true if the animal is linked to `contactId` by any known shape. */
function isLinkedToContact(animal: any, contactId: ID): boolean {
  const cid = String(contactId);

  // Common direct fields
  const directOwner =
    animal?.ownerId ?? animal?.owner_id ?? animal?.contactId ?? animal?.contact_id ?? null;
  if (directOwner != null && String(directOwner) === cid) {
    console.log("[isLinkedToContact] Match via direct owner field");
    return true;
  }

  // Primary owner object shapes
  const primaryOwner =
    animal?.owner ??
    animal?.primaryOwner ??
    animal?.primary_owner ??
    null;
  if (primaryOwner && String(primaryOwner.id ?? primaryOwner.contactId ?? primaryOwner.contact_id) === cid) {
    console.log("[isLinkedToContact] Match via primary owner object");
    return true;
  }

  // Arrays of links (various shapes)
  const linkArrays = [
    animal?.owners,
    animal?.ownerships,
    animal?.contacts,
    animal?.links,
    animal?.animalOwners,
    animal?.animal_owners,
  ].filter(Boolean);

  for (const arr of linkArrays) {
    const list = Array.isArray(arr) ? arr : Array.isArray(arr?.items) ? arr.items : [];
    if (list.some((o: any) => {
      const match = String(o?.contactId ?? o?.contact_id ?? o?.id) === cid;
      if (match) {
        console.log("[isLinkedToContact] Match found in array, owner:", o);
      }
      return match;
    })) {
      return true;
    }
  }

  // Some APIs return { owners: [{ contact: { id } }]}
  for (const arr of linkArrays) {
    const list = Array.isArray(arr) ? arr : Array.isArray(arr?.items) ? arr.items : [];
    if (list.some((o: any) => {
      const match = String(o?.contact?.id) === cid;
      if (match) {
        console.log("[isLinkedToContact] Match found via nested contact.id");
      }
      return match;
    })) {
      return true;
    }
  }

  return false;
}


/* ────────────────────────────────────────────────────────────────────────────
 * Drawer view
 * ────────────────────────────────────────────────────────────────────────── */

type ContactDetailsViewProps = {
  row: ContactRow;
  mode: "view" | "edit";
  setMode: (m: "view" | "edit") => void;
  setDraft: (updater: (prev: any) => any) => void;
  activeTab: string;
  setActiveTab: (k: string) => void;
  requestSave: () => Promise<void>;
  allRows: ContactRow[]; // for duplicate checks
  api: ReturnType<typeof makeApi>;
  setRows: React.Dispatch<React.SetStateAction<ContactRow[]>>;
};

const ContactDetailsView: React.FC<ContactDetailsViewProps> = ({
  row,
  mode,
  setMode,
  setDraft,
  activeTab,
  setActiveTab,
  requestSave,
  allRows,
  api,
  setRows,
}) => {
  // Use string | PhoneValue for state to match IntlPhoneField's value prop
  const [cell, setCell] = React.useState<string | PhoneValue>((row as any).phoneMobileE164 || row.phone || "");
  const [land, setLand] = React.useState<string | PhoneValue>((row as any).phoneLandlineE164 ?? "");
  const [wa, setWa] = React.useState<string | PhoneValue>((row as any).whatsappE164 ?? "");

  // Sync phone fields when row changes
  React.useEffect(() => {
    // Use phoneMobileE164 if available, otherwise fall back to phone field (which might be the mobile number)
    const cellValue = (row as any).phoneMobileE164 || row.phone || "";
    const landValue = (row as any).phoneLandlineE164 ?? "";
    const waValue = (row as any).whatsappE164 ?? "";

    setCell(cellValue);
    setLand(landValue);
    setWa(waValue);
  }, [row]);

  const [prefs, setPrefs] = React.useState(() => ({
    email: !!(row as any).prefersEmail,
    sms: !!(row as any).prefersSms,
    phone: !!(row as any).prefersPhone,
    mail: !!(row as any).prefersMail,
    whatsapp: !!(row as any).prefersWhatsapp,
  }));

  const [dupList, setDupList] = React.useState<ContactRow[]>([]);
  React.useEffect(() => {
    const dups = findDuplicates(
      allRows,
      row?.id ?? null,
      row?.email ?? null,
      (row as any).phoneMobileE164 ?? null,
      (row as any).whatsappE164 ?? null,
      row?.phone ?? null
    );
    setDupList(dups);
  }, [allRows, row]);

  const [animals, setAnimals] = React.useState<AnimalRow[] | null>(null);
  const [animalsErr, setAnimalsErr] = React.useState<string | null>(null);

  // Reset animals when switching away from the tab to force refresh on return
  React.useEffect(() => {
    if (activeTab !== "animals") {
      setAnimals(null);
    }
  }, [activeTab]);

  // Load animals data
  const loadAnimals = React.useCallback(async () => {
    try {
      setAnimalsErr(null);

      console.log("[Contacts] Loading animals for contact:", row.id);

      // Call the backend API endpoint GET /contacts/:id/animals
      const res: any = await api.contactsExtras.animalsForContact(row.id);
      const scoped = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];

      console.log("[Contacts] Received", scoped.length, "animals from backend for contact", row.id);

      const mapped: AnimalRow[] = scoped.map((a: any) => {
        // Extract role and sharePct from owners array if they exist
        const ownersList = Array.isArray(a.owners) ? a.owners : [];
        const contactOwnership = ownersList.find((o: any) =>
          String(o.contactId ?? o.contact_id) === String(row.id)
        );

        return {
          id: a.id,
          name: a.name ?? a.displayName ?? a.callName ?? null,
          species: a.species ?? null,
          sex: a.sex ?? null,
          status: a.status ?? null,
          role:
            contactOwnership?.role ??
            a.ownershipRole ??
            a.role ??
            a?.owner?.role ??
            a?.primaryOwner?.role ??
            (contactOwnership?.is_primary || contactOwnership?.isPrimary ? "Owner" : "Co-owner"),
          sharePct:
            contactOwnership?.percent ??
            contactOwnership?.sharePct ??
            a.ownershipSharePct ??
            a.sharePct ??
            a?.owner?.sharePct ??
            a?.primaryOwner?.sharePct ??
            null,
        };
      });

      setAnimals(mapped);
    } catch (e: any) {
      setAnimalsErr(e?.message || "Failed to load animals");
    }
  }, [api, row.id]);

  React.useEffect(() => {
    if (activeTab !== "animals" || animals !== null) return;
    loadAnimals();
  }, [activeTab, animals, loadAnimals]);

  // Listen for animal updates from other modules
  React.useEffect(() => {
    if (activeTab !== "animals") return;

    const handleAnimalsUpdate = () => {
      console.log("[Contacts] Received animals update event, refreshing...");
      setAnimals(null); // Force refresh
    };

    window.addEventListener("bhq:animals:updated", handleAnimalsUpdate);
    return () => window.removeEventListener("bhq:animals:updated", handleAnimalsUpdate);
  }, [activeTab]);

  const overlayRoot = typeof document !== "undefined" ? document.getElementById("bhq-overlay-root") : null;

  const [confirmReset, setConfirmReset] = React.useState<
    null | { channel: "email" | "sms"; onAnswer: (ok: boolean) => void }
  >(null);

  React.useEffect(() => {
    setPrefs({
      email: !!(row as any).prefersEmail,
      sms: !!(row as any).prefersSms,
      phone: !!(row as any).prefersPhone,
      mail: !!(row as any).prefersMail,
      whatsapp: !!(row as any).prefersWhatsapp,
    });
  }, [row]);

  const togglePref = React.useCallback(
    (key: keyof typeof prefs) => {
      if (mode === "view") return;
      setPrefs((prev) => {
        const next = !prev[key];
        const camel = `prefers${key[0].toUpperCase()}${key.slice(1)}`;
        setTimeout(() => setDraft((d: any) => ({ ...d, [camel]: next })), 0);
        return { ...prev, [key]: next };
      });
    },
    [mode, setDraft]
  );

  const editText = (k: keyof ContactRow, placeholder?: string) => (
    <Input
      size="sm"
      defaultValue={(row as any)[k] ?? ""}
      placeholder={placeholder}
      onChange={(e) => {
        const value = e.target.value;
        setDraft((d: any) => ({
          ...d,
          [k]: value,
        }));
      }}
    />
  );

  /* Header actions: Next Follow-up chip + Archive */
  const [snoozing, setSnoozing] = React.useState(false);
  const [archiving, setArchiving] = React.useState(false);

  const handleArchive = async () => {
    try {
      setArchiving(true);
      await api.contacts.update(row.id, { archived: true });
      setDraft((d: any) => ({ ...d, archived: true }));
      // Update the main rows state to reflect archived status
      setRows((prev) =>
        prev.map((r) => (String(r.id) === String(row.id) ? { ...r, archived: true } : r))
      );
      console.log("[Contacts] Archived contact");
      setMode("view");
    } catch (e) {
      console.error("[Contacts] Archive failed", e);
    } finally {
      setArchiving(false);
    }
  };

  const headerRight = (
    <div className="flex items-center gap-2">
      <NextFollowUpChip
        value={row.nextFollowUp}
        onChange={async (iso) => {
          const value = iso ? new Date(iso).toISOString() : null;
          try {
            setSnoozing(true);
            await api.contacts.update(row.id, { nextFollowUp: value });
            setDraft((d: any) => ({ ...d, nextFollowUp: value }));
            console.log("[Contacts] nextFollowUp saved (direct)");
          } catch (e) {
            console.error("[Contacts] nextFollowUp save failed", e);
          } finally {
            setSnoozing(false);
          }
        }}
      />
      {mode === "edit" && !row.archived && (
        <Button size="sm" variant="outline" onClick={handleArchive} disabled={archiving}>
          {archiving ? "Archiving…" : "Archive"}
        </Button>
      )}
    </div>
  );

  return (
    <DetailsScaffold
      title={computeDisplayName(row)}
      subtitle={row.organizationName || row.email || ""}
      mode={mode}
      onEdit={() => setMode("edit")}
      onCancel={() => setMode("view")}
      onSave={requestSave}
      tabs={[
        { key: "overview", label: "Overview" },
        { key: "animals", label: "Animals" },
        { key: "audit", label: "Audit" },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      rightActions={headerRight}
    >
      {/* Duplicate banner */}
      {dupList.length > 0 && (
        <div className="mb-3 rounded-md border border-[color:var(--brand-orange)]/40 bg-[color:var(--brand-orange)]/10 p-2">
          <div className="text-sm font-medium">Possible duplicates found</div>
          <div className="text-xs text-secondary">
            Another contact shares the same email or phone. Review before saving changes.
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            {dupList.slice(0, 3).map((d) => (
              <Badge key={String(d.id)}>{computeDisplayName(d)}</Badge>
            ))}
            {dupList.length > 3 && <span className="text-xs text-secondary">+{dupList.length - 3} more</span>}
            <Button size="xs" variant="outline" className="ml-auto opacity-70 cursor-not-allowed">Open merge (soon)</Button>
          </div>
        </div>
      )}

      {activeTab === "overview" && (() => {
        const norm = contactToRow(row);

        return (
          <div className="space-y-3">
            {/* Identity */}
            <SectionCard title="Identity">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-secondary mb-1">First Name</div>
                  {mode === "view" ? <div className="text-sm">{norm.firstName || "—"}</div> : editText("firstName")}
                </div>

                <div>
                  <div className="text-xs text-secondary mb-1">Last Name</div>
                  {mode === "view" ? <div className="text-sm">{norm.lastName || "—"}</div> : editText("lastName")}
                </div>

                <div>
                  <div className="text-xs text-secondary mb-1">Nickname</div>
                  {mode === "view" ? <div className="text-sm">{norm.nickname || "—"}</div> : editText("nickname")}
                </div>

                <div className="sm:col-span-3">
                  <div className="text-xs text-secondary mb-1">Organization</div>
                  {mode === "view" ? (
                    <div className="text-sm">{norm.organizationName || "—"}</div>
                  ) : (
                    <OrganizationSelect
                      value={
                        norm.organizationId
                          ? { id: Number(norm.organizationId), name: norm.organizationName || "" }
                          : null
                      }
                      onChange={(opt) =>
                        setDraft((d: any) => ({
                          ...d,
                          organizationId: opt?.id ?? null,
                          organizationName: opt?.name ?? null,
                        }))
                      }
                      placeholder="— Select Organization"
                    />
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Address */}
            <SectionCard title="Address">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-secondary mb-1">Street</div>
                  {mode === "view" ? <div className="text-sm">{norm.street || "—"}</div> : editText("street")}
                </div>

                <div>
                  <div className="text-xs text-secondary mb-1">Street 2</div>
                  {mode === "view" ? <div className="text-sm">{norm.street2 || "—"}</div> : editText("street2")}
                </div>

                <div>
                  <div className="text-xs text-secondary mb-1">City</div>
                  {mode === "view" ? <div className="text-sm">{norm.city || "—"}</div> : editText("city")}
                </div>

                <div>
                  <div className="text-xs text-secondary mb-1">State / Region</div>
                  {mode === "view" ? <div className="text-sm">{norm.state || "—"}</div> : editText("state")}
                </div>

                <div>
                  <div className="text-xs text-secondary mb-1">Postal Code</div>
                  {mode === "view" ? <div className="text-sm">{norm.postalCode || "—"}</div> : editText("postalCode")}
                </div>

                <div>
                  <div className="text-xs text-secondary mb-1">Country</div>
                  {mode === "view" ? (
                    <div className="text-sm">{norm.country || "—"}</div>
                  ) : (
                    <CountrySelect
                      value={norm.country}
                      onChange={(v) => setDraft((d: any) => ({ ...d, country: v }))}
                    />
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Communication Preferences */}
            <SectionCard title="Communication Preferences">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <PillToggle on={!!prefs.email} label="Email" onClick={() => togglePref("email")} className={mode === "view" ? "opacity-50 pointer-events-none" : ""} />
                <PillToggle on={!!prefs.sms} label="SMS" onClick={() => togglePref("sms")} className={mode === "view" ? "opacity-50 pointer-events-none" : ""} />
                <PillToggle on={!!prefs.phone} label="Phone" onClick={() => togglePref("phone")} className={mode === "view" ? "opacity-50 pointer-events-none" : ""} />
                <PillToggle on={!!prefs.mail} label="Mail" onClick={() => togglePref("mail")} className={mode === "view" ? "opacity-50 pointer-events-none" : ""} />
                <PillToggle on={!!prefs.whatsapp} label="WhatsApp" onClick={() => togglePref("whatsapp")} className={mode === "view" ? "opacity-50 pointer-events-none" : ""} />
              </div>

              {/* Email */}
              <div className="flex items-center gap-3">
                <div className="text-xs text-secondary min-w-[80px]">Email</div>
                {mode === "view" ? (
                  <div className="text-sm">{norm.email || "—"}</div>
                ) : (
                  <div className="flex-1">
                    <Input
                      type="email"
                      defaultValue={norm.email ?? ""}
                      onChange={(e) => setDraft((d: any) => ({ ...d, email: (e.currentTarget as HTMLInputElement).value }))}
                    />
                  </div>
                )}
              </div>

              {/* Phones */}
              <div className="flex items-center gap-3">
                <div className="text-xs text-secondary min-w-[80px]">Cell Phone</div>
                {mode === "view" ? (
                  <div className="text-sm">{formatE164Phone((row as any).phoneMobileE164 || norm.phone) || "—"}</div>
                ) : (
                  <div className="flex-1">
                    {/* @ts-ignore */}
                    <IntlPhoneField
                      value={cell}
                      onChange={(v) => {
                        setCell(v);
                        const e164 = typeof v === "string" ? v : v?.e164;
                        const waE164 = typeof wa === "string" ? wa : wa?.e164;
                        setDraft((d: any) => ({
                          ...d,
                          phoneMobileE164: e164 || null,
                          phone: e164 || waE164 || null,
                        }));
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="text-xs text-secondary min-w-[80px]">Landline</div>
                {mode === "view" ? (
                  <div className="text-sm">{formatE164Phone((row as any).phoneLandlineE164) || "—"}</div>
                ) : (
                  <div className="flex-1">
                    {/* @ts-ignore */}
                    <IntlPhoneField
                      value={land}
                      onChange={(v) => {
                        setLand(v);
                        const e164 = typeof v === "string" ? v : v?.e164;
                        setDraft((d: any) => ({
                          ...d,
                          phoneLandlineE164: e164 || null,
                        }));
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="text-xs text-secondary min-w-[80px]">WhatsApp</div>
                {mode === "view" ? (
                  <div className="text-sm">{formatE164Phone((row as any).whatsappE164) || "—"}</div>
                ) : (
                  <div className="flex-1">
                    {/* @ts-ignore */}
                    <IntlPhoneField
                      value={wa}
                      onChange={(v) => {
                        setWa(v);
                        const e164 = typeof v === "string" ? v : v?.e164;
                        const cellE164 = typeof cell === "string" ? cell : cell?.e164;
                        setDraft((d: any) => ({
                          ...d,
                          whatsappE164: e164 || null,
                          phone: cellE164 || e164 || null,
                        }));
                      }}
                    />
                  </div>
                )}
              </div>

              {mode === "edit" && (
                <div className="text-xs text-secondary">
                  If Cell Phone is left empty, WhatsApp will be used as the phone on save.
                </div>
              )}
            </SectionCard>

            {/* Compliance */}
            <SectionCard title="Compliance">
              <div className="text-xs text-secondary mb-2">
                System sets these from unsubscribes. Select Reset to opt the user back in. Action is logged on save.
              </div>

              {mode === "view" ? (
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">EMAIL</span>
                    <span className="text-xs px-2 py-0.5 rounded border border-hairline">
                      {(row as any).emailUnsubscribed ? "unsubscribed" : "subscribed"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">SMS</span>
                    <span className="text-xs px-2 py-0.5 rounded border border-hairline">
                      {(row as any).smsUnsubscribed ? "unsubscribed" : "subscribed"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-8">
                  {/* EMAIL Reset */}
                  <label className="flex items-center gap-2 text-xs">
                    <span>EMAIL</span>
                    <span className="px-2 py-0.5 rounded border border-hairline text-xs">
                      {(row as any).emailUnsubscribed ? "unsubscribed" : "subscribed"}
                    </span>
                    <input
                      type="checkbox"
                      defaultChecked={!!(row as any).emailOptOutOverride}
                      onChange={(e) => {
                        const el = e.currentTarget as HTMLInputElement;
                        const checked = el.checked;

                        if (checked) {
                          setConfirmReset({
                            channel: "email",
                            onAnswer: (ok) => {
                              if (ok) {
                                setDraft((d: any) => ({ ...d, emailOptOutOverride: true }));
                                el.checked = true;
                              } else {
                                el.checked = false;
                              }
                              setConfirmReset(null);
                            },
                          });
                        } else {
                          setDraft((d: any) => ({ ...d, emailOptOutOverride: false }));
                        }
                      }}
                    />
                    <span>Reset</span>
                  </label>

                  {/* SMS Reset */}
                  <label className="flex items-center gap-2 text-xs">
                    <span>SMS</span>
                    <span className="px-2 py-0.5 rounded border border-hairline text-xs">
                      {(row as any).smsUnsubscribed ? "unsubscribed" : "subscribed"}
                    </span>
                    <input
                      type="checkbox"
                      defaultChecked={!!(row as any).smsOptOutOverride}
                      onChange={(e) => {
                        const el = e.currentTarget as HTMLInputElement;
                        const checked = el.checked;

                        if (checked) {
                          setConfirmReset({
                            channel: "sms",
                            onAnswer: (ok) => {
                              if (ok) {
                                setDraft((d: any) => ({ ...d, smsOptOutOverride: true }));
                                el.checked = true;
                              } else {
                                el.checked = false;
                              }
                              setConfirmReset(null);
                            },
                          });
                        } else {
                          setDraft((d: any) => ({ ...d, smsOptOutOverride: false }));
                        }
                      }}
                    />
                    <span>Reset</span>
                  </label>
                </div>
              )}
            </SectionCard>
          </div>
        );
      })()}

      {activeTab === "animals" && (
        <div className="space-y-3">
          <SectionCard title="Animals">
            {!animals && !animalsErr && <div className="text-sm text-secondary py-4">Loading…</div>}
            {animalsErr && <div className="text-sm text-red-600 py-4">Error: {animalsErr}</div>}
            {animals && animals.length === 0 && <div className="text-sm text-secondary py-4">No animals yet.</div>}
            {animals && animals.length > 0 && (
              <div className="overflow-auto">
                <table className="min-w-max w-full text-sm">
                  <thead>
                    <tr className="border-b border-hairline">
                      <th className="text-left py-2 pr-3 font-medium">Name</th>
                      <th className="text-left py-2 pr-3 font-medium">Species</th>
                      <th className="text-left py-2 pr-3 font-medium">Sex</th>
                      <th className="text-left py-2 pr-3 font-medium">Status</th>
                      <th className="text-left py-2 pr-3 font-medium">Role</th>
                      <th className="text-left py-2 pr-3 font-medium">% Share</th>
                      <th className="text-right py-2 pl-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {animals.map((a) => (
                      <tr key={String(a.id)} className="border-b border-hairline/60">
                        <td className="py-2 pr-3">{a.name || "—"}</td>
                        <td className="py-2 pr-3">{a.species || "—"}</td>
                        <td className="py-2 pr-3">{a.sex || "—"}</td>
                        <td className="py-2 pr-3">{a.status || "—"}</td>
                        <td className="py-2 pr-3">{a.role || "—"}</td>
                        <td className="py-2 pr-3">{a.sharePct ?? "—"}</td>
                        <td className="py-2 pl-3 text-right">
                          <Button size="xs" variant="outline" onClick={() => (window as any).bhq?.nav?.open?.("animal", a.id)}>Open</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="space-y-3">
          <SectionCard title="Audit">
            <div className="text-sm text-secondary">Audit events will show here.</div>
          </SectionCard>
        </div>
      )}
    </DetailsScaffold>
  );
};

/* ────────────────────────────────────────────────────────────────────────────
 * Main component
 * ────────────────────────────────────────────────────────────────────────── */

export default function AppContacts() {
  React.useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("bhq:module", { detail: { key: "contacts", label: "Contacts" } })
    );
  }, []);

  const api = React.useMemo(() => makeApi(), []);

  // Search/filters
  const [q, setQ] = React.useState(() => {
    try { return localStorage.getItem(Q_KEY) || ""; } catch { return ""; }
  });
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(FILTERS_KEY) || "{}"); } catch { return {}; }
  });
  React.useEffect(() => { try { localStorage.setItem(Q_KEY, q); } catch { } }, [q]);
  React.useEffect(() => { try { localStorage.setItem(FILTERS_KEY, JSON.stringify(filters || {})); } catch { } }, [filters]);

  const [qDebounced, setQDebounced] = React.useState(q);
  React.useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Data
  const [rows, setRows] = React.useState<ContactRow[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Pagination
  const [pageSize, setPageSize] = React.useState<number>(25);
  const [page, setPage] = React.useState<number>(1);

  // Archive toggle
  const [includeArchived, setIncludeArchived] = React.useState<boolean>(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.contacts.list({
          q: qDebounced || undefined,
          page: 1,
          limit: 100,
          includeArchived
        });
        const items = (res?.items || res?.data || []).map(contactToRow);
        if (!cancelled) setRows(items);
      } catch (e: any) {
        if (!cancelled) setError(e?.payload?.error || e?.message || "Failed to load contacts");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [api, qDebounced, includeArchived]);

  // Columns
  const { map, toggle, setAll, visible } = hooks.useColumns(COLUMNS, STORAGE_KEY);
  const visibleSafe = Array.isArray(visible) && visible.length ? visible : COLUMNS;

  // Filters schema (range-aware)
  const filterSchemaForFiltersRow = React.useMemo(() => {
    return buildRangeAwareSchema(
      visibleSafe.map((c) => ({ key: c.key, label: c.label })),
      ["birthday", "lastContacted", "nextFollowUp", "created_at", "updated_at"]
    );
  }, [visibleSafe]);

  // Client search + filters
  const displayRows = React.useMemo(() => {
    const active = Object.entries(filters || {}).filter(([, v]) => (v ?? "") !== "");
    if (!active.length && !qDebounced) return rows;

    const lc = (v: any) => String(v ?? "").toLowerCase();
    let data = [...rows];

    if (qDebounced) {
      const ql = qDebounced.toLowerCase();
      data = data.filter((r) => {
        const hay = [
          r.nickname,
          r.firstName,
          r.lastName,
          r.displayName,
          r.organizationName,
          r.email,
          r.phone,
          ...(r.tags || []),
          r.city,
          r.state,
          r.country,
          r.status,
          r.leadStatus,
          r.birthday,
          r.lastContacted,
          r.nextFollowUp,
          r.created_at,
          r.updated_at,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(ql);
      });
    }

    if (active.length) {
      const bFrom = filters["birthday_from"];
      const bTo = filters["birthday_to"];
      const lcFrom = filters["lastContacted_from"];
      const lcTo = filters["lastContacted_to"];
      const nfFrom = filters["nextFollowUp_from"];
      const nfTo = filters["nextFollowUp_to"];
      const cFrom = filters["created_at_from"];
      const cTo = filters["created_at_to"];
      const uFrom = filters["updated_at_from"];
      const uTo = filters["updated_at_to"];

      data = data.filter((r) => {
        const textOk = active.every(([key, val]) => {
          if (key.endsWith("_from") || key.endsWith("_to")) return true;
          if (key === "tags") {
            const str = String(val).toLowerCase().trim();
            return (r.tags || []).some((t) => String(t).toLowerCase().includes(str));
          }
          const raw = (r as any)[key];
          const isDate = DATE_KEYS.has(key as any);
          const hay = isDate && raw ? String(raw).slice(0, 10) : String(raw ?? "");
          return lc(hay).includes(lc(val));
        });
        if (!textOk) return false;

        const bOk = bFrom || bTo ? inDateRange(r.birthday, bFrom, bTo) : true;
        const lcOk = lcFrom || lcTo ? inDateRange(r.lastContacted, lcFrom, lcTo) : true;
        const nfOk = nfFrom || nfTo ? inDateRange(r.nextFollowUp, nfFrom, nfTo) : true;
        const cOk = cFrom || cTo ? inDateRange(r.created_at, cFrom, cTo) : true;
        const uOk = uFrom || uTo ? inDateRange(r.updated_at, uFrom, uTo) : true;
        return bOk && lcOk && nfOk && cOk && uOk;
      });
    }

    return data;
  }, [rows, filters, qDebounced]);

  // Sorting
  const [sorts, setSorts] = React.useState<Array<{ key: string; dir: "asc" | "desc" }>>([]);
  const onToggleSort = (key: string) => {
    setSorts((prev) => {
      const found = prev.find((s) => s.key === key);
      if (!found) return [{ key, dir: "asc" }];
      if (found.dir === "asc") return prev.map((s) => (s.key === key ? { ...s, dir: "desc" } : s));
      return prev.filter((s) => s.key !== key);
    });
  };
  React.useEffect(() => { setPage(1); }, [qDebounced, filters, sorts]);

  const sortedRows = React.useMemo(() => {
    if (!sorts.length) return displayRows;
    const out = [...displayRows];
    out.sort((a, b) => {
      for (const s of sorts) {
        const av = (a as any)[s.key];
        const bv = (b as any)[s.key];
        const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, {
          numeric: true,
          sensitivity: "base",
        });
        if (cmp !== 0) return s.dir === "asc" ? cmp : -cmp;
      }
      return 0;
    });
    return out;
  }, [displayRows, sorts]);

  // Paging
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const start = sortedRows.length === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const end =
    sortedRows.length === 0 ? 0 : Math.min(sortedRows.length, (clampedPage - 1) * pageSize + pageSize);
  const pageRows = React.useMemo(() => {
    const from = (clampedPage - 1) * pageSize;
    const to = from + pageSize;
    return sortedRows.slice(from, to);
  }, [sortedRows, clampedPage, pageSize]);

  /** Details config (drawer) */
  const detailsConfig = React.useMemo(
    () => ({
      idParam: "contactId",
      getRowId: (r: ContactRow) => r.id,
      width: 820,
      placement: "center" as const,
      align: "top" as const,
      fetchRow: async (id: ID) => {
        const raw = await api.contacts.get(id);
        const mapped = contactToRow(raw);

        // Preserve phone fields from current row if API doesn't return them
        const currentRow = rows.find((r) => String(r.id) === String(id));
        if (currentRow) {
          return {
            ...mapped,
            phoneLandlineE164: mapped.phoneLandlineE164 ?? (currentRow as any).phoneLandlineE164 ?? null,
            phoneMobileE164: mapped.phoneMobileE164 ?? (currentRow as any).phoneMobileE164 ?? null,
            whatsappE164: mapped.whatsappE164 ?? (currentRow as any).whatsappE164 ?? null,
          };
        }

        return mapped;
      },
      onSave: async (id: ID, draft: any) => {
        const original = rows.find((r) => String(r.id) === String(id)) as any;

        const compliancePatch: any = {};
        const complianceActions: Array<{
          channel: "email" | "sms";
          action: "override_resubscribe";
          from: "unsubscribed" | "subscribed";
          to: "subscribed";
        }> = [];

        if (draft?.emailOptOutOverride) {
          compliancePatch.emailUnsubscribed = false;
          compliancePatch.emailOptOutOverride = true;
          if (original?.emailUnsubscribed) {
            complianceActions.push({
              channel: "email",
              action: "override_resubscribe",
              from: "unsubscribed",
              to: "subscribed",
            });
          }
        }
        if (draft?.smsOptOutOverride) {
          compliancePatch.smsUnsubscribed = false;
          compliancePatch.smsOptOutOverride = true;
          if (original?.smsUnsubscribed) {
            complianceActions.push({
              channel: "sms",
              action: "override_resubscribe",
              from: "unsubscribed",
              to: "subscribed",
            });
          }
        }

        // Also apply nextFollowUp changes and phone precedence in the payload
        const resolvedOrgId =
          draft?.organizationId !== undefined
            ? draft?.organizationId
            : original?.organizationId ?? null;

        const payload = {
          ...draft,
          ...compliancePatch,

          // phone precedence
          phone:
            draft?.phoneMobileE164 ||
            draft?.whatsappE164 ||
            draft?.phone ||
            original?.phone ||
            null,

          // send both shapes for compatibility
          organizationId: resolvedOrgId,
          organization_id: resolvedOrgId,

          // optional helper shape some APIs accept
          ...(resolvedOrgId ? { organization: { id: resolvedOrgId } } : { organization: null }),
        };

        const updated = await api.contacts.update(id, payload);

        if (complianceActions.length) {
          await api.audit.log({
            entity: "contact",
            entityId: id,
            event: "comms_override_resubscribe",
            meta: { actions: complianceActions },
          });
        }

        setRows((prev) =>
          prev.map((r) => {
            if (String(r.id) !== String(id)) return r;

            const mapped = contactToRow(updated);

            // If API did not echo org name, keep the one we already know.
            const safeOrgName =
              mapped.organizationName ??
              draft?.organizationName ??
              (r as any).organizationName ??
              null;

            const safeOrgId =
              mapped.organizationId ??
              draft?.organizationId ??
              (r as any).organizationId ??
              null;

            // Preserve phone fields from draft if API doesn't return them
            const safeLandline = mapped.phoneLandlineE164 ?? draft?.phoneLandlineE164 ?? (r as any).phoneLandlineE164 ?? null;
            const safeMobile = mapped.phoneMobileE164 ?? draft?.phoneMobileE164 ?? (r as any).phoneMobileE164 ?? null;
            const safeWhatsApp = mapped.whatsappE164 ?? draft?.whatsappE164 ?? (r as any).whatsappE164 ?? null;

            return {
              ...r,
              ...mapped,
              organizationName: safeOrgName,
              organizationId: safeOrgId,
              phoneLandlineE164: safeLandline,
              phoneMobileE164: safeMobile,
              whatsappE164: safeWhatsApp,
            };
          })
        );
      },
      header: (r: ContactRow) => ({
        title: computeDisplayName(r),
        subtitle: r.organizationName || r.email || "",
      }),
      tabs: [
        { key: "overview", label: "Overview" },
        { key: "animals", label: "Animals" },
        { key: "audit", label: "Audit" },
      ],
      customChrome: true,
      render: (props: any) => (
        <ContactDetailsView
          {...props}
          allRows={rows}
          api={api}
          setRows={setRows}
        />
      ),
    }),
    [api, rows, setRows]
  );

  /** Create Contact modal state */
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createWorking, setCreateWorking] = React.useState(false);
  const [createErr, setCreateErr] = React.useState<string | null>(null);

  /* More actions menu state */
  const [menuOpen, setMenuOpen] = React.useState(false);

  /* CSV export function */
  const handleExportCsv = React.useCallback(() => {
    exportToCsv({
      columns: COLUMNS,
      rows: sortedRows,
      filename: "contacts",
      formatValue: (value, key) => {
        if (DATE_KEYS.has(key as any)) {
          return fmt(value);
        }
        if (Array.isArray(value)) {
          return value.join(" | ");
        }
        return value;
      },
    });
    setMenuOpen(false);
  }, [sortedRows]);

  // form state
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [nickname, setNickname] = React.useState("");
  const [email, setEmail] = React.useState("");

  // Phones (IntlPhoneField)
  const [cell, setCell] = React.useState<PhoneValue>({ countryCode: "US", callingCode: "+1", national: "", e164: null });
  const [landline, setLandline] = React.useState<PhoneValue>({ countryCode: "US", callingCode: "+1", national: "", e164: null });
  const [whatsapp, setWhatsapp] = React.useState<PhoneValue>({ countryCode: "US", callingCode: "+1", national: "", e164: null });

  // Org
  const [org, setOrg] = React.useState<{ id: number; name: string } | null>(null);

  const [status, setStatus] = React.useState<"Active" | "Inactive" | "Prospect">("Active");
  const [leadStatus, setLeadStatus] = React.useState("");
  const [birthday, setBirthday] = React.useState("");
  const [nextFollowUp, setNextFollowUp] = React.useState("");

  // Address
  const [street, setStreet] = React.useState("");
  const [street2, setStreet2] = React.useState("");
  const [city, setCity] = React.useState("");
  const [stateRegion, setStateRegion] = React.useState("");
  const [postalCode, setPostalCode] = React.useState("");
  const [country, setCountry] = React.useState("United States");

  // Tags/Notes
  const [tagsStr, setTagsStr] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // Create-time duplicate surface
  const createDups = React.useMemo(() => {
    return findDuplicates(
      rows,
      null,
      email || null,
      cell?.e164 || null,
      whatsapp?.e164 || null,
      cell?.e164 || whatsapp?.e164 || null
    );
  }, [rows, email, cell?.e164, whatsapp?.e164]);

  const resetCreateForm = () => {
    setFirstName(""); setLastName(""); setNickname(""); setEmail("");
    setCell({ countryCode: "US", callingCode: "+1", national: "", e164: null });
    setLandline({ countryCode: "US", callingCode: "+1", national: "", e164: null });
    setWhatsapp({ countryCode: "US", callingCode: "+1", national: "", e164: null });
    setOrg(null);
    setStatus("Active"); setLeadStatus(""); setBirthday(""); setNextFollowUp("");
    setStreet(""); setStreet2(""); setCity(""); setStateRegion(""); setPostalCode(""); setCountry("United States");
    setTagsStr(""); setNotes(""); setCreateErr(null);
  };

  const canCreate = firstName.trim().length > 0 && lastName.trim().length > 0;

  const CREATE_ERROR_MAP: Record<string, string> = {
    display_name_required: "Display name is generated automatically. Please enter first and last name.",
    organizationId_invalid: "Organization is invalid.",
    organization_not_found: "Organization not found.",
    organization_not_found_or_wrong_tenant: "Organization not found.",
    missing_tenant: "Missing tenant context.",
    conflict: "Email must be unique within this tenant.",
  };

  const formatCreateError = (e: any) => {
    const payload = e?.payload || {};
    if (payload?.fieldErrors && typeof payload.fieldErrors === "object") {
      const messages = Object.values(payload.fieldErrors).filter(Boolean);
      if (messages.length > 0) return String(messages.join(" "));
    }
    const raw = payload?.message || payload?.error || e?.message || "Failed to create contact";
    const msg = typeof raw === "string" ? raw : "Failed to create contact";
    if (CREATE_ERROR_MAP[msg]) return CREATE_ERROR_MAP[msg];
    if (/^[a-z0-9_]+$/.test(msg)) return "Unable to create contact. Please check the form.";
    return msg;
  };

  const doCreate = async () => {
    if (!canCreate) { setCreateErr("Please enter First and Last name."); return; }
    try {
      setCreateWorking(true);
      setCreateErr(null);

      const cellE164 = cell?.e164 || null;
      const landE164 = landline?.e164 || null;
      const waE164 = whatsapp?.e164 || null;

      const payload: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nickname: nickname.trim() || null,
        email: email.trim() || null,
        phone: cellE164 || waE164 || null,
        phoneMobileE164: cellE164,
        phoneLandlineE164: landE164,
        whatsappE164: waE164,
        status,
        leadStatus: leadStatus.trim() || null,
        birthday: birthday || null,
        nextFollowUp: nextFollowUp || null,
        organizationId: org?.id ?? null,
        street, street2, city, state: stateRegion, postalCode, country,
        tags: tagsStr.split(",").map((s) => s.trim()).filter(Boolean),
        notes: notes || null,
      };

      const created = await (api.contacts as any).create?.(payload);
      const row = contactToRow(created);
      setRows((prev) => [row, ...prev]);
      resetCreateForm();
      setCreateOpen(false);
    } catch (e: any) {
      setCreateErr(formatCreateError(e));
      console.error("[Contacts] Create failed:", e);
    } finally {
      setCreateWorking(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header + actions */}
      <div className="relative">
        <PageHeader title="Contacts" subtitle="Manage your contacts and relationships" />
        <div
          className="absolute right-0 top-0 h-full flex items-center gap-2 pr-1"
          style={{ zIndex: 5, pointerEvents: "auto" }}
        >
          <Button size="sm" onClick={() => setCreateOpen(true)}>New Contact</Button>
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <Popover.Trigger asChild>
              <Button size="sm" variant="outline" aria-label="More actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </Popover.Trigger>
            <Popover.Content align="end" className="w-48">
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 rounded"
                onClick={handleExportCsv}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </Popover.Content>
          </Popover>
        </div>
      </div>

      <Card>
        <DetailsHost rows={rows} config={detailsConfig}>
          <Table
            columns={COLUMNS}
            columnState={map}
            onColumnStateChange={setAll}
            getRowId={(r: ContactRow) => r.id}
            pageSize={pageSize}
            renderStickyRight={() => (
              <ColumnsPopover
                columns={map}
                onToggle={toggle}
                onSet={setAll}
                allColumns={COLUMNS}
                triggerClassName="bhq-columns-trigger"
              />
            )}
            stickyRightWidthPx={40}
          >
            {/* Toolbar */}
            <div className="bhq-table__toolbar px-2 pt-2 pb-3 relative z-30">
              <SearchBar
                value={q}
                onChange={setQ}
                placeholder="Search any field…"
                widthPx={520}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setFiltersOpen((v) => !v)}
                    aria-expanded={filtersOpen}
                    title="Filters"
                    className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-white/5 focus:outline-none"
                  >
                    {/* filter icon svg */}
                  </button>
                }
              />
            </div>

            {/* Filters */}
            {filtersOpen && (
              <FiltersRow
                filters={filters}
                onChange={(next) => setFilters(next)}
                schema={filterSchemaForFiltersRow}
              />
            )}

            <FilterChips
              filters={filters}
              onChange={setFilters}
              prettyLabel={(k) => {
                if (k === "birthday_from") return "Birthday ≥";
                if (k === "birthday_to") return "Birthday ≤";
                if (k === "lastContacted_from") return "Last contacted ≥";
                if (k === "lastContacted_to") return "Last contacted ≤";
                if (k === "nextFollowUp_from") return "Next follow-up ≥";
                if (k === "nextFollowUp_to") return "Next follow-up ≤";
                if (k === "created_at_from") return "Created ≥";
                if (k === "created_at_to") return "Created ≤";
                if (k === "updated_at_from") return "Updated ≥";
                if (k === "updated_at_to") return "Updated ≤";
                return k;
              }}
            />

            {/* Table */}
            <table className="min-w-max w-full text-sm">
              <TableHeader columns={visibleSafe} sorts={sorts} onToggleSort={onToggleSort} />
              <tbody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={visibleSafe.length}>
                      <div className="py-8 text-center text-sm text-secondary">Loading contacts…</div>
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
                      <div className="py-8 text-center text-sm text-secondary">
                        No contacts to display yet.
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {!loading && !error && pageRows.length > 0 &&
                  pageRows.map((r) => (
                    <TableRow key={String(r.id)} detailsRow={r}>
                      {visibleSafe.map((c) => {
                        let v = (r as any)[c.key] as any;
                        if (DATE_KEYS.has(c.key as any)) v = fmt(v);
                        if (Array.isArray(v)) v = v.join(", ");
                        return <TableCell key={c.key}>{v ?? ""}</TableCell>;
                      })}
                    </TableRow>
                  ))}
              </tbody>
            </table>

            <TableFooter
              entityLabel="contacts"
              page={clampedPage}
              pageCount={pageCount}
              pageSize={pageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(n) => {
                setPageSize(n);
                setPage(1);
              }}
              start={start}
              end={end}
              filteredTotal={sortedRows.length}
              total={rows.length}
              includeArchived={includeArchived}
              onIncludeArchivedChange={(checked) => {
                setIncludeArchived(checked);
                setPage(1);
              }}
            />
          </Table>
        </DetailsHost>
      </Card>

      {/* Create Contact Modal (Overlay) */}
      <Overlay
        open={createOpen}
        onOpenChange={(v) => { if (!createWorking) setCreateOpen(v); }}
        ariaLabel="Create Contact"
        disableEscClose={createWorking}
        disableOutsideClose={createWorking}
        size="xl"
      >
        <div data-bhq-overlay-slot="header">
          <div className="w-full max-w-[900px] mx-auto flex items-center justify-between mb-3">
            <div className="text-lg font-semibold">Create Contact</div>
            <Button variant="ghost" size="sm" onClick={() => setCreateOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div data-bhq-overlay-slot="body">
          <div className="w-full max-w-[900px] mx-auto">
            {createDups.length > 0 && (
              <div className="mb-3 rounded-md border border-[color:var(--brand-orange)]/40 bg-[color:var(--brand-orange)]/10 p-2">
                <div className="text-sm font-medium">Possible duplicates found</div>
                <div className="text-xs text-secondary">
                  Another contact shares the same email or phone.
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {createDups.slice(0, 3).map((d) => (
                    <Badge key={String(d.id)}>{computeDisplayName(d)}</Badge>
                  ))}
                  {createDups.length > 3 && <span className="text-xs text-secondary">+{createDups.length - 3} more</span>}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Names */}
              <div>
                <div className="text-xs text-secondary mb-1">
                  First name <span className="text-[hsl(var(--brand-orange))]">*</span>
                </div>
                <Input value={firstName} onChange={(e) => setFirstName((e.currentTarget as HTMLInputElement).value)} />
              </div>
              <div>
                <div className="text-xs text-secondary mb-1">
                  Last name <span className="text-[hsl(var(--brand-orange))]">*</span>
                </div>
                <Input value={lastName} onChange={(e) => setLastName((e.currentTarget as HTMLInputElement).value)} />
              </div>

              {/* Nickname */}
              <div className="sm:col-span-2">
                <div className="text-xs text-secondary mb-1">Preferred / Nickname</div>
                <Input value={nickname} onChange={(e) => setNickname((e.currentTarget as HTMLInputElement).value)} />
              </div>

              {/* Organization */}
              <div className="sm:col-span-2">
                <div className="text-xs text-secondary mb-1">Organizational Association</div>
                <OrganizationSelect value={org} onChange={setOrg} />
              </div>

              {/* Email */}
              <div className="sm:col-span-2">
                <div className="text-xs text-secondary mb-1">Email</div>
                <Input type="email" value={email} onChange={(e) => setEmail((e.currentTarget as HTMLInputElement).value)} />
              </div>

              {/* Phones */}
              <div className="sm:col-span-2">
                <div className="text-xs text-secondary mb-1">Cell Phone</div>
                {/* @ts-ignore */}
                <IntlPhoneField value={cell} onChange={setCell} />
              </div>

              <div className="sm:col-span-2">
                <div className="text-xs text-secondary mb-1">Landline</div>
                {/* @ts-ignore */}
                <IntlPhoneField value={landline} onChange={setLandline} />
              </div>

              <div className="sm:col-span-2">
                <div className="text-xs text-secondary mb-1">WhatsApp</div>
                {/* @ts-ignore */}
                <IntlPhoneField value={whatsapp} onChange={setWhatsapp} />
                <div className="text-xs text-secondary mt-1">
                  If Cell Phone is left empty, this will be used as the phone on save.
                </div>
              </div>

              {/* Address */}
              <div className="sm:col-span-2">
                <div className="text-xs text-secondary mb-1">Street</div>
                <Input value={street} onChange={(e) => setStreet((e.currentTarget as HTMLInputElement).value)} />
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-secondary mb-1">Street 2</div>
                <Input value={street2} onChange={(e) => setStreet2((e.currentTarget as HTMLInputElement).value)} />
              </div>

              <div>
                <div className="text-xs text-secondary mb-1">City</div>
                <Input value={city} onChange={(e) => setCity((e.currentTarget as HTMLInputElement).value)} />
              </div>
              <div>
                <div className="text-xs text-secondary mb-1">State / Region</div>
                <Input value={stateRegion} onChange={(e) => setStateRegion((e.currentTarget as HTMLInputElement).value)} />
              </div>

              <div className="sm:col-span-2">
                <div className="text-xs text-secondary mb-1">Zip / Postal code</div>
                <Input value={postalCode} onChange={(e) => setPostalCode((e.currentTarget as HTMLInputElement).value)} />
              </div>

              <div className="sm:col-span-2">
                <div className="text-xs text-secondary mb-1">Country</div>
                <select
                  className="w-full h-9 rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                  value={country}
                  onChange={(e) => setCountry((e.target as HTMLSelectElement).value)}
                >
                  {COUNTRIES.filter((c) => c !== "- Select country").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <div className="text-xs text-secondary mb-1">Notes</div>
                <textarea
                  className="h-24 w-full rounded-md bg-surface border border-hairline px-3 text-sm text-primary placeholder:text-secondary outline-none"
                  value={notes}
                  onChange={(e) => setNotes((e.currentTarget as HTMLTextAreaElement).value)}
                  placeholder="Context, preferences, etc."
                />
              </div>

              {createErr && <div className="sm:col-span-2 text-sm text-red-600">{createErr}</div>}
            </div>
          </div>
        </div>

        <div data-bhq-overlay-slot="footer">
          <div className="w-full max-w-[900px] mx-auto flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => { resetCreateForm(); setCreateOpen(false); }}
              disabled={createWorking}
            >
              Cancel
            </Button>
            <Button onClick={doCreate} disabled={!canCreate || createWorking}>
              {createWorking ? "Saving." : "Save"}
            </Button>
          </div>
        </div>
      </Overlay>
    </div>
  );
}
