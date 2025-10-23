// App-Contacts.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Card, Button, Input, EmptyState, ColumnsPopover, TableFooter, utils } from "@bhq/ui";
import { getOverlayRoot } from "@bhq/ui/overlay";
import "@bhq/ui/styles/table.css"
import { makeApi } from "./api";

const { readTenantIdFast, resolveTenantId } = utils;

type ID = string | number;
type SortDir = "asc" | "desc";
type SortRule = { key: keyof ContactRow; dir: SortDir };

type ContactDTO = {
  id: ID;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  nickname?: string | null;
  email?: string | null;
  emailStatus?: string | null;
  smsStatus?: string | null;
  phone?: string | null;
  phoneType?: string | null;
  notes?: string | null;
  organizationId?: ID | null;
  organizationName?: string | null;
  organization?: { id: ID; name?: string | null } | null;
  status?: "Active" | "Inactive" | string;
  leadStatus?: string | null;
  street?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  commPrefs?: { email?: boolean; phone?: boolean; sms?: boolean; mail?: boolean; whatsapp?: boolean; whatsappPhone?: string | null } | null;
  nextFollowUp?: string | null;
  birthday?: string | null;
  lastContacted?: string | null;
  tags?: string[] | null;
  createdAt: string;
  updatedAt: string;
  archived?: boolean | null;
  archivedAt?: string | null;
  archivedBy?: string | null;
  archivedReason?: string | null;
  whatsapp?: boolean;
  whatsappPhone?: string | null;
};

type ContactRow = {
  id: ID;
  firstName?: string | null;
  lastName?: string | null;
  /** nickname || firstName + lastName (for the drawer title) */
  cDisplayName: string | null;
  nickname?: string | null;
  email?: string | null;
  emailStatus?: string | null;
  smsStatus?: string | null;
  phone?: string | null;
  phoneType?: string | null;
  notes?: string | null;
  organizationId?: ID | null;
  organizationName?: string | null;
  status?: "Active" | "Inactive" | string;
  leadStatus?: string | null;
  street?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  commPrefs?: { email?: boolean; phone?: boolean; sms?: boolean; mail?: boolean; whatsapp?: boolean; whatsappPhone?: string | null } | null;
  nextFollowUp?: string | null;
  birthday?: string | null;
  lastContacted?: string | null;
  tags?: string[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  archived?: boolean | null;
  archivedAt?: string | null;
  archivedBy?: string | null;
  archivedReason?: string | null;
  whatsapp?: boolean | null;
  whatsappPhone?: string | null;
};

type AuditRow = {
  id: string;
  action: string;
  field?: string | null;
  before?: any;
  after?: any;
  reason?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  createdAt: string; // ISO
};

function shapeContact(row: any) {
  const {
    phoneE164, whatsappE164,
    first_name, last_name, display_name, nickname,
    ...rest
  } = row || {};
  return {
    ...rest,
    // DB→ UI
    firstName: rest.firstName ?? first_name ?? null,
    lastName: rest.lastName ?? last_name ?? null,
    displayName: rest.displayName ?? display_name ?? null,
    nickname: rest.nickname ?? nickname ?? null,
    phone: phoneE164 ?? null,
    whatsappPhone: whatsappE164 ?? null,
  };
}

function getEventValue(e: any): string {
  if (e && typeof e === "object") {
    const v =
      (e.currentTarget && "value" in e.currentTarget ? e.currentTarget.value : undefined) ??
      (e.target && "value" in e.target ? e.target.value : undefined);
    return v != null ? String(v) : "";
  }
  return e != null ? String(e) : "";
}

// keep only 0–9
const digitsOnly = (s: string) => s.replace(/\D+/g, "");

// let users press arrows, backspace, etc., but block non-digits
function allowOnlyDigitKeys(e: React.KeyboardEvent<HTMLInputElement>) {
  const k = e.key;
  const isCtrl = e.ctrlKey || e.metaKey;
  const ok =
    // editing / nav
    ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Home", "End", "Tab"].includes(k) ||
    // select/copy/paste/cut
    (isCtrl && ["a", "c", "v", "x"].includes(k.toLowerCase())) ||
    // numeric keys
    /^[0-9]$/.test(k);
  if (!ok) e.preventDefault();
}


/****************************************************************************************************************************************************************************************************************************************”€
 * Column config
 *************************************************************************************************************************************************************************************************************************************€ */
const SORT_STORAGE_KEY = "bhq_contacts_sorts_v1";
const Q_STORAGE_KEY = "bhq_contacts_q_v1";
const PAGE_SIZE_STORAGE_KEY = "bhq_contacts_page_size_v1";
const FILTERS_STORAGE_KEY = "bhq_contacts_filters_v1";
const SHOW_FILTERS_STORAGE_KEY = "bhq_contacts_show_filters_v1";

type ColumnDef = {
  // before: key: keyof ContactRow;
  key: keyof ContactRow & string;
  label: string;
  default?: boolean;
  type?: "text" | "date" | "status" | "tags";
  center?: boolean;
  render?: (r: ContactRow) => React.ReactNode;
};

const ALL_COLUMNS: ColumnDef[] = [
  // Defaults (and in this order)
  { key: "firstName", label: "First Name", default: true, type: "text" },
  { key: "lastName", label: "Last Name", default: true, type: "text" },
  { key: "nickname", label: "Nickname", default: true, type: "text" },
  { key: "organizationName", label: "Organization", default: true, type: "text" },
  { key: "email", label: "Email", default: true, type: "text" },
  { key: "phone", label: "Phone", default: true, type: "text", render: (r: ContactRow) => r.phone ? <span className="whitespace-nowrap">   {formatPhone(String(r.phone), countryCodeFor(r.country))} </span> : <span className="text-secondary">—</span> },
  { key: "tags", label: "Tags", default: true, type: "tags" },

  // Optional
  { key: "status", label: "Status", default: true, type: "text" },
  { key: "leadStatus", label: "Lead Status", default: false, type: "text" },
  { key: "lastContacted", label: "Last Contacted", default: false, type: "date" },
  { key: "nextFollowUp", label: "Next Follow-up", default: false, type: "date" },
  { key: "emailStatus", label: "Email Status", default: false, type: "text" },
  { key: "whatsappPhone", label: "WhatsApp", default: false, type: "text", render: (r: ContactRow) => r.whatsappPhone ? <span className="whitespace-nowrap">{formatPhone(String(r.whatsappPhone), countryCodeFor(r.country))}</span> : <span className="text-secondary">—</span> }, { key: "city", label: "City", default: false, type: "text" },
  { key: "state", label: "State", default: false, type: "text" },
  { key: "postalCode", label: "Postal Code", default: false, type: "text" },
  { key: "country", label: "Country", default: false, type: "text" },
];

// Build meta for the shared popover
const CONTACTS_COLUMN_META = ALL_COLUMNS.map(c => ({
  key: c.key,
  label: c.label,
  default: !!c.default,
}));
const CONTACTS_DEFAULT_KEYS = ALL_COLUMNS
  .filter(c => c.default)
  .map(c => c.key);

const Z = {
  topLayer: 2147483646,
  popover: 2147483645,
  backdrop: 2147483644,
} as const;

/** Tags (from API at runtime; fallback keeps UI usable) */
const FALLBACK_CONTACT_TAGS = ["breeder", "VIP", "supplier", "prospect", "waitlist", "do-not-contact"];

/** Countries via Intl (full, alphabetized names); fallback to known codes if needed */
function useCountries() {
  const [list, setList] = React.useState<{ code: string; name: string }[]>([]);
  React.useEffect(() => {
    // Full fallback names (trimmed list here; extend as desired)
    const FALLBACK_NAMES = [
      ["US", "United States"], ["CA", "Canada"], ["GB", "United Kingdom"], ["AU", "Australia"],
      ["NZ", "New Zealand"], ["IE", "Ireland"], ["FR", "France"], ["DE", "Germany"], ["ES", "Spain"],
      ["IT", "Italy"], ["NL", "Netherlands"], ["BE", "Belgium"], ["SE", "Sweden"], ["NO", "Norway"],
      ["DK", "Denmark"], ["FI", "Finland"], ["PT", "Portugal"], ["GR", "Greece"], ["CH", "Switzerland"],
      ["AT", "Austria"], ["PL", "Poland"], ["CZ", "Czechia"], ["HU", "Hungary"], ["RO", "Romania"],
      ["BG", "Bulgaria"], ["HR", "Croatia"], ["RS", "Serbia"], ["TR", "Turkey"], ["IL", "Israel"],
      ["AE", "United Arab Emirates"], ["SA", "Saudi Arabia"], ["ZA", "South Africa"], ["EG", "Egypt"],
      ["IN", "India"], ["PK", "Pakistan"], ["BD", "Bangladesh"], ["JP", "Japan"], ["KR", "South Korea"],
      ["CN", "China"], ["TW", "Taiwan"], ["HK", "Hong Kong"], ["SG", "Singapore"], ["MY", "Malaysia"],
      ["TH", "Thailand"], ["VN", "Vietnam"], ["PH", "Philippines"], ["ID", "Indonesia"], ["MX", "Mexico"],
      ["BR", "Brazil"], ["AR", "Argentina"], ["CL", "Chile"], ["CO", "Colombia"]
    ];
    try {
      const codes: string[] =
        (Intl as any).supportedValuesOf ? (Intl as any).supportedValuesOf("region") : [];
      const dn = (codes.length && new Intl.DisplayNames([navigator.language || "en"], { type: "region" })) as any;
      const intlItems = (codes || [])
        .filter(c => /^[A-Z]{2}$/.test(c))
        .map(code => ({ code, name: (dn?.of?.(code)) || code }));
      const items = (intlItems.length ? intlItems : FALLBACK_NAMES.map(([code, name]) => ({ code, name })))
        .sort((a, b) => a.name.localeCompare(b.name));
      setList(items);
    } catch {
      const items = FALLBACK_NAMES.map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name));
      setList(items);
    }
  }, []);
  return list;
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "MA", "MD",
  "ME", "MI", "MN", "MO", "MS", "MT", "NC", "ND", "NE", "NH", "NJ", "NM", "NV", "NY", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VA", "VT", "WA", "WI", "WV", "WY",
];

/** ================= Visual Intl Phone Field (no deps) ================= **/

type Ctry = { code: string; name: string };

const DIAL_BY_ISO: Record<string, string> = {
  US: "1", CA: "1", MX: "52", GB: "44", IE: "353", FR: "33", DE: "49", ES: "34", IT: "39",
  AU: "61", NZ: "64", BR: "55", AR: "54", CL: "56", CO: "57", PE: "51", VE: "58",
  CN: "86", HK: "852", JP: "81", KR: "82", IN: "91", PK: "92", BD: "880",
  SA: "966", AE: "971", IL: "972", TR: "90", EG: "20", ZA: "27", NG: "234", KE: "254",
  NO: "47", SE: "46", FI: "358", DK: "45", NL: "31", BE: "32", LU: "352", CH: "41",
  AT: "43", PL: "48", CZ: "420", SK: "421", HU: "36", GR: "30", PT: "351",
  RO: "40", BG: "359", HR: "385", SI: "386", RS: "381", UA: "380",
  SG: "65", TH: "66", MY: "60", PH: "63", ID: "62", VN: "84",
  RU: "7", KZ: "7",
}; // extend later if you like

const NANP = "1";
const isoToFlag = (iso: string) =>
  String.fromCodePoint(...iso.toUpperCase().split("").map(ch => 0x1f1e6 - 65 + ch.charCodeAt(0)));

const onlyDigits = (s: string) => (s || "").replace(/\D+/g, "");
const parseE164 = (v?: string) => {
  if (!v) return { cc: "", rest: "" };
  const s = String(v).trim();
  // If it starts with +, try to match a known dial code (prefer longest)
  if (s.startsWith("+")) {
    const digits = s.slice(1).replace(/\D/g, ""); // all following digits
    // Build a unique set of dial codes we know (strings of digits)
    const known = Array.from(new Set(Object.values(DIAL_BY_ISO)));
    // Try longest-first so e.g. +353... beats +35...
    known.sort((a, b) => b.length - a.length);
    for (const dial of known) {
      if (digits.startsWith(dial)) {
        const rest = digits.slice(dial.length);
        return { cc: dial, rest };
      }
    }
    // Fallback: take the first digit as cc
    return { cc: digits.slice(0, 1), rest: digits.slice(1) };
  }

  // If someone typed**€œUS**€¦” etc., map alpha-2 prefix to dial
  const m = s.match(/^([A-Za-z]{2})\s*(.*)$/);
  if (m) {
    const dial = DIAL_BY_ISO[m[1].toUpperCase()] || "";
    return { cc: dial, rest: onlyDigits(m[2] || "") };
  }

  // No + and no alpha-2: treat all as local, cc empty
  return { cc: "", rest: onlyDigits(s) };
};
const e164Value = (cc: string, rest: string) => `+${String(cc || "").replace(/\D/g, "")}${onlyDigits(rest)}`;

const formatLocal = (rest: string, cc: string) => {
  const d = onlyDigits(rest);
  if (cc === NANP) {
    const a = d.slice(0, 3), b = d.slice(3, 6), c = d.slice(6, 10);
    if (d.length <= 3) return a;
    if (d.length <= 6) return `(${a}) ${b}`;
    return `(${a}) ${b}-${c}`;
  }
  const groups: string[] = [];
  for (let i = 0; i < d.length;) {
    const take = i === 0 ? 3 : 4;
    groups.push(d.slice(i, i + take));
    i += take;
  }
  return groups.filter(Boolean).join(" ");
};

function findDialFromCountryName(name?: string, list?: Ctry[]) {
  if (!name || !list?.length) return undefined;
  const hit = list.find(c => c.name.toUpperCase() === name.toUpperCase());
  return hit ? DIAL_BY_ISO[hit.code.toUpperCase()] : undefined;
}

function IntlPhoneField({
  value,
  onChange,
  inferredCountryName,
  countries,
  className,
}: {
  value: string | undefined;
  onChange: (next: string) => void;
  inferredCountryName?: string;
  countries: Ctry[];
  className?: string;
}) {
  const parsed = React.useMemo(() => parseE164(value), [value]);
  const inferredDial = React.useMemo(
    () => findDialFromCountryName(inferredCountryName, countries),
    [inferredCountryName, countries]
  );

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  const cc = parsed.cc || inferredDial || NANP;
  const local = formatLocal(parsed.rest, cc);
  const selectedIso = React.useMemo(() => {
    const iso = Object.keys(DIAL_BY_ISO).find(k => DIAL_BY_ISO[k] === cc);
    return iso || "US";
  }, [cc]);

  React.useEffect(() => {
    function sync() {
      const el = btnRef.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const W = 340, pad = 12;
      const left = Math.max(pad, Math.min(window.innerWidth - W - pad, r.left));
      const top = r.bottom + 8;
      setPos({ top, left });
    }
    function getScrollParents(el: HTMLElement | null) {
      const out: HTMLElement[] = [];
      let p = el?.parentElement || null;
      while (p) {
        const s = getComputedStyle(p);
        if (/(auto|scroll|overlay)/.test(`${s.overflow}${s.overflowY}${s.overflowX}`)) out.push(p);
        p = p.parentElement;
      }
      return out;
    }
    if (!open) return;

    const parents = getScrollParents(btnRef.current);
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, { passive: true });
    parents.forEach(n => n.addEventListener("scroll", sync, { passive: true }));

    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync);
      parents.forEach(n => n.removeEventListener("scroll", sync));
    };
  }, [open]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(c =>
      c.name.toLowerCase().includes(q) || (DIAL_BY_ISO[c.code.toUpperCase()] || "").includes(q)
    );
  }, [countries, query]);

  const pickCountry = (iso: string) => {
    const nextDial = DIAL_BY_ISO[iso.toUpperCase()] || NANP;
    onChange(e164Value(nextDial, parsed.rest));
    setOpen(false);
    setQuery("");
  };

  const onLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = getEventValue(e);
    const digits = onlyDigits(raw);

    // E.164 total: max 15 digits (country code + national number)
    const ccDigits = String(cc).replace(/\D/g, "");
    const maxRest = Math.max(0, 15 - ccDigits.length);

    // Optional: enforce NANP strict 10 digits
    const limit = ccDigits === "1" ? 10 : maxRest;

    const trimmed = digits.slice(0, limit);
    onChange(e164Value(cc, trimmed));
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const txt = e.clipboardData.getData("text");
    const parsed = parseE164(txt);
    const newCc = parsed.cc || cc;

    const newCcDigits = String(newCc).replace(/\D/g, "");
    const maxRest = Math.max(0, 15 - newCcDigits.length);
    const limit = newCcDigits === "1" ? 10 : maxRest;

    const trimmedRest = onlyDigits(parsed.rest).slice(0, limit);
    onChange(e164Value(newCc, trimmedRest));
  };

  const dropdown = open && pos ? createPortal(
    <>
      <div
        onClick={() => setOpen(false)}
        style={{ position: "fixed", inset: 0, zIndex: Z.backdrop, background: "transparent", pointerEvents: "auto" }}
      />
      <div
        role="menu"
        className="rounded-xl border border-hairline bg-surface text-primary shadow-[0_8px_30px_hsla(0,0%,0%,0.35)] max-w-[calc(100vw-24px)] w-[320px]"
        style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: Z.popover }}
      >
        <div className="p-2 border-b border-hairline">
          <input
            autoFocus
            placeholder="Search country or code…"
            value={query}
            onChange={(e) => setQuery(getEventValue(e))}
            className="w-full rounded-md border border-hairline bg-surface px-2 py-1.5 text-sm outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
          />
        </div>
        <div className="max-h-[300px] overflow-auto py-1">
          {filtered.map(c => {
            const dial = DIAL_BY_ISO[c.code.toUpperCase()] || "";
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => pickCountry(c.code)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[hsl(var(--brand-orange))]/12 text-left"
              >
                <span className="shrink-0">{isoToFlag(c.code)}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="shrink-0 text-secondary">{dial ? `+${dial}` : ""}</span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-secondary">No matches</div>
          )}
        </div>
      </div>
    </>,
    getOverlayRoot()
  ) : null;

  return (
    <div className={["grid grid-cols-[minmax(140px,200px)_1fr] gap-2", className].filter(Boolean).join(" ")}>
      <div className="relative">
        <button
          ref={btnRef}
          type="button"
          onClick={() => setOpen(v => !v)}
          className="w-full h-10 inline-flex items-center gap-2 rounded-md border border-hairline bg-surface px-2.5 text-sm text-primary outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
        >
          <span className="shrink-0">{isoToFlag(selectedIso)}</span>
          <span className="truncate">
            {countries.find(c => c.code.toUpperCase() === selectedIso)?.name || "United States"}
          </span>
          <span className="ml-auto shrink-0 text-secondary">+{cc}</span>
          <svg viewBox="0 0 20 20" className="ml-2 h-4 w-4 opacity-70"><path fill="currentColor" d="M5.5 7.5l4.5 4 4.5-4" /></svg>
        </button>
        {dropdown}
      </div>

      <input
        inputMode="tel"
        autoComplete="tel"
        placeholder={cc === NANP ? "(201) 555-5555" : "Phone number"}
        className="w-full h-10 rounded-md border border-hairline bg-surface px-2.5 text-sm text-primary outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
        value={local}
        onChange={onLocalChange}
        onPaste={onPaste}
      />
    </div>
  );
}

/****************************************************************************************************************************************************************************************************************************************”€
 * Helpers
 *************************************************************************************************************************************************************************************************************************************€ */
function computeCDisplayName(dto: ContactDTO): string {
  const left = (dto.nickname ?? dto.firstName ?? "").trim();
  const right = (dto.lastName ?? "").trim();
  return [left, right].filter(Boolean).join(" ");
}

function normalize(dto: ContactDTO): ContactRow {
  const cName = computeCDisplayName(dto);
  const prefs = (dto && typeof dto.commPrefs === "object" && dto.commPrefs !== null && !Array.isArray(dto.commPrefs))
    ? { ...dto.commPrefs }
    : {};

  // ðŸ‘‡ bring top-level WhatsApp fields into commPrefs (keeps UI consistent)
  if (typeof (dto as any).whatsapp === "boolean") (prefs as any).whatsapp = (dto as any).whatsapp;
  if (typeof (dto as any).whatsappPhone === "string") (prefs as any).whatsappPhone = (dto as any).whatsappPhone;

  const orgId =
    dto.organizationId ??
    dto.organization?.id ??
    null;

  const orgName =
    dto.organizationName ??
    (dto.organization && (
      (dto.organization as any).name ??
      (dto.organization as any).displayName ??
      (dto.organization as any).title ??
      (dto.organization as any).label
    )) ??
    null;

  return {
    id: dto.id,
    firstName: dto.firstName ?? null,
    lastName: dto.lastName ?? null,
    cDisplayName: cName,
    nickname: dto.nickname ?? null,
    email: dto.email ?? null,
    emailStatus: dto.emailStatus ?? null,
    smsStatus: (dto as any).smsStatus ?? null,
    phone: dto.phone ?? null,
    phoneType: dto.phoneType ?? null,
    notes: dto.notes ?? null,
    organizationId: orgId,
    organizationName: orgName,
    status: dto.status ?? "Active",
    leadStatus: dto.leadStatus ?? null,
    street: dto.street ?? null,
    street2: dto.street2 ?? null,
    city: dto.city ?? null,
    state: dto.state ?? null,
    country: dto.country ?? null,
    postalCode: dto.postalCode ?? null,

    // ðŸ‘‡ use merged prefs
    commPrefs: Object.keys(prefs).length ? (prefs as any) : null,

    nextFollowUp: dto.nextFollowUp ?? null,
    birthday: dto.birthday ?? null,
    lastContacted: dto.lastContacted ?? null,
    tags: Array.from(new Set((dto.tags || []).filter(Boolean))),
    createdAt: dto.createdAt ?? null,
    updatedAt: dto.updatedAt ?? null,
    archived: dto.archived ?? null,
    archivedAt: dto.archivedAt ?? null,
    archivedBy: dto.archivedBy ?? null,
    archivedReason: dto.archivedReason ?? null,
    whatsapp: (dto as any).whatsapp ?? null,
    whatsappPhone: (dto as any).whatsappPhone ?? null,
  };
}


function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : new Intl.DateTimeFormat(undefined, { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
function formatOrUnknown(iso?: string | null) {
  return formatDate(iso) || "Unknown";
}
function prettyPhone(v?: string | null) {
  if (!v) return "";
  const digits = String(v).replace(/[^\d]/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return `+1 ${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return v;
}
function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const id = setTimeout(() => setV(value), delay); return () => clearTimeout(id); }, [value, delay]);
  return v;
}

function buildContactPayload(base: any, src: any, opts?: { countries?: { code: string; name: string }[] }) {
  const s = src || {};
  const prefsSrc = s.commPrefs ?? base.commPrefs ?? null;
  const prefs = prefsSrc && typeof prefsSrc === "object" ? prefsSrc : null;

  // display_name the API expects
  const dnParts = [
    String(s.nickname ?? "").trim(),
    [String(s.firstName ?? "").trim(), String(s.lastName ?? "").trim()].filter(Boolean).join(" ")
  ].filter(Boolean);
  const display_name =
    (dnParts[0] || dnParts[1] || "").trim() ||
    String(s.email || s.phone || (prefs as any)?.whatsappPhone || "").trim();

  const countries = opts?.countries;
  const normalizeCountry = (value?: string | null) => {
    const v = String(value ?? "").trim();
    if (!v) return null;
    if (!countries?.length) return v;
    const byCode = countries.find(c => c.code.toUpperCase() === v.toUpperCase());
    if (byCode) return byCode.code;
    const byName = countries.find(c => c.name.toUpperCase() === v.toUpperCase());
    return byName ? byName.code : v;
  };

  const cleanId = (v: any) => (v === "" || v === undefined ? null : v);

  const out: any = {
    // ------- DB fields (snake_case) -------
    first_name: s.firstName ?? base.firstName ?? null,
    last_name: s.lastName ?? base.lastName ?? null,
    nickname: s.nickname ?? base.nickname ?? null,
    display_name,

    email: s.email ?? base.email ?? null,
    phoneE164: (s.phone || (prefs as any)?.whatsappPhone) ?? base.phone ?? null,
    whatsappE164: (prefs as any)?.whatsappPhone ?? (s as any)?.whatsappPhone ?? null,
    street: s.street ?? base.street ?? null,
    street2: s.street2 ?? base.street2 ?? null,
    city: s.city ?? base.city ?? null,
    state: s.state ?? base.state ?? null,
    zip: s.postalCode ?? base.postalCode ?? null,
    country: normalizeCountry(s.country ?? base.country) ?? null,
    organizationId: cleanId(s.organizationId ?? base.organizationId),
    archived: s.archived ?? base.archived ?? false,

    // ---------- keep UI mirrors (harmless to API) ----------
    firstName: s.firstName ?? base.firstName ?? undefined,
    lastName: s.lastName ?? base.lastName ?? undefined,
    phone: s.phone ?? base.phone ?? undefined,
    phoneType: s.phoneType ?? base.phoneType ?? undefined,
    leadStatus: s.leadStatus ?? base.leadStatus ?? undefined,
    notes: s.notes ?? base.notes ?? undefined,
    nextFollowUp: s.nextFollowUp ?? base.nextFollowUp ?? undefined,
    lastContacted: s.lastContacted ?? base.lastContacted ?? undefined,
    birthday: s.birthday ?? base.birthday ?? undefined,
  };

  if (prefs) {
    out.commPrefs = {
      email: typeof prefs.email === "boolean" ? prefs.email : undefined,
      sms: typeof prefs.sms === "boolean" ? prefs.sms : undefined,
      phone: typeof prefs.phone === "boolean" ? prefs.phone : undefined,
      mail: typeof prefs.mail === "boolean" ? prefs.mail : undefined,
      whatsappPhone: typeof (prefs as any).whatsappPhone === "string" ? (prefs as any).whatsappPhone : undefined,
    };
  }

  return out;
}

// Very small CC map; add more as you need
function countryCodeFor(country?: string): string {
  const raw = String(country || "").trim();
  if (!raw) return "1";
  const iso = raw.toUpperCase();
  if (DIAL_BY_ISO[iso]) return DIAL_BY_ISO[iso];
  return "1";
}

// Format NANP (+1) as +1 (AAA) BBB-CCCC, others as +CC groups (4-3-4-ish)
function formatPhone(raw: string, cc: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  const ccDigits = cc.replace(/\D/g, "");
  let rest = digits.replace(/^\+?/, "");
  if (rest.startsWith(ccDigits)) {
    rest = rest.slice(ccDigits.length);
  }
  // keep only digits in rest
  rest = rest.replace(/\D/g, "");

  if (ccDigits === "1") {
    const a = rest.slice(0, 3);
    const b = rest.slice(3, 6);
    const c = rest.slice(6, 10);
    if (rest.length <= 3) return `+1 ${a}`;
    if (rest.length <= 6) return `+1 (${a}) ${b}`;
    return `+1 (${a}) ${b}-${c}`;
  } else {
    // Basic grouping for international: +CC dddd dddd dddd...
    const groups: string[] = [];
    let i = 0;
    while (i < rest.length) {
      const take = i === 0 ? 3 : 4; // first chunk a bit shorter
      groups.push(rest.slice(i, i + take));
      i += take;
    }
    return `+${ccDigits} ${groups.filter(Boolean).join(" ")}`.trim();
  }
}

/** Best-effort country inference from your draft/contact objects */
function inferCountry(d?: any, draft?: any): string | undefined {
  return (
    draft?.primaryAddress?.country ??
    draft?.address?.country ??
    draft?.country ??
    d?.primaryAddress?.country ??
    d?.address?.country ??
    d?.country ??
    undefined
  );
}

/****************************************************************************************************************************************************************************************************************************************”€
 * App
 *************************************************************************************************************************************************************************************************************************************€ */

/** Replace empty strings with null, recurse into objects */
function nilIfEmpty<T extends Record<string, any>>(obj: T): T {
  if (obj == null) return obj;
  if (Array.isArray(obj)) return obj.map((v: any) => (typeof v === "object" && v ? nilIfEmpty(v) : v)) as any;

  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === "") out[k] = null;
    else if (v && typeof v === "object" && !Array.isArray(v)) out[k] = nilIfEmpty(v as any);
    else out[k] = v;
  }
  return out as T;
}

function FormInput({
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  invalid,
}: {
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  invalid?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(getEventValue(e))}
      placeholder={placeholder}
      required={required}
      aria-required={required ? "true" : undefined}
      aria-invalid={invalid ? "true" : undefined}
      className={[
        "h-10 w-full rounded-md border px-3 text-sm outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]",
        "bg-surface border-hairline text-primary placeholder:text-secondary",
        invalid ? "border-red-500 focus:shadow-[0_0_0_2px_rgb(239,68,68)]" : ""
      ].join(" ")}
      style={{ WebkitTextFillColor: "inherit", background: "inherit", color: "inherit" }}
    />
  );
}

function LabeledInputBare(props: {
  label: React.ReactNode;          // changed from string
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;              // NEW
  invalid?: boolean;               // NEW
}) {
  return (
    <div>
      <label className="block text-xs mb-1 text-[color:var(--bhq-fg-subtle)]">{props.label}</label>
      <FormInput {...props} />
    </div>
  );
}

const RequiredMark = () => <span className="text-red-500 ml-1" aria-hidden="true">*</span>;

//******€ module-scope helpers (PUT THESE AT TOP OF FILE)**************************************************************************”€

export default function AppContacts() {
  useEffect(() => {
    const label = "Contacts";
    window.dispatchEvent(new CustomEvent("bhq:module", { detail: { label } }));
    try { localStorage.setItem("BHQ_LAST_MODULE", label); } catch { }
  }, []);

  const [tenantId, setTenantId] = React.useState<number | null>(() => readTenantIdFast() ?? null);
  const [tenantErr, setTenantErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (tenantId != null) return;
    let cancelled = false;
    (async () => {
      try {
        const t = await resolveTenantId();
        if (!cancelled) setTenantId(t);
      } catch (e: any) {
        if (!cancelled) setTenantErr(e?.message || "Failed to resolve tenant");
      }
    })();
    return () => { cancelled = true; };
  }, [tenantId]);

  const apiBase = useMemo(() => getApiBase(), []);

  const api = useMemo(() => {
    if (tenantId == null) return null;
    // Pass tenant info to your client; adjust to your makeApi signature.
    // Common patterns: header `x-tenant-id`, query param, or internal context.
    const client = makeApi(apiBase, () => ({ 'x-tenant-id': String(tenantId) }));
    (window as any).__api = client;
    return client;
  }, [apiBase, tenantId]);

  // ===== Columns state & helpers (INSIDE AppContacts) =====
  const COL_STORAGE_KEY = 'bhq_contacts_cols_v1';

  const [columns, setColumns] = React.useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(COL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch { }
    return ALL_COLUMNS.reduce((acc, c) => {
      acc[c.key] = !!c.default;
      return acc;
    }, {} as Record<string, boolean>);
  });

  const applyColumns = React.useCallback((nextRaw: Record<string, boolean>) => {
    const next: Record<string, boolean> = {};
    for (const c of ALL_COLUMNS) next[c.key] = !!nextRaw[c.key];

    if (!Object.values(next).some(Boolean)) {
      const fallback = ALL_COLUMNS.find(c => c.default)?.key ?? ALL_COLUMNS[0].key;
      next[fallback] = true;
    }

    setColumns(next);
    try { localStorage.setItem(COL_STORAGE_KEY, JSON.stringify(next)); } catch { }
  }, []);

  const toggleColumn = (k: string) => {
    applyColumns({ ...columns, [k]: !columns[k] });
  };
  // ===== end columns block =====

  /** API base + auth helpers (usable by both makeApi and manual fetches) */
  function getApiBase() {
    if (import.meta.env.DEV) return "";

    const w = window as any;
    const globalBase = w.__BHQ_API_BASE__ as string | undefined;
    const envBase = (import.meta as any)?.env?.VITE_API_URL as string | undefined;
    const storedBase = (() => { try { return localStorage.getItem("BHQ_API_URL") || undefined; } catch { return undefined; } })();
    let base = (globalBase || envBase || storedBase || window.location.origin);
    try { base = String(base).replace(/\/+$/, "").replace(/\/api\/v1$/, ""); } catch { }
    return "";
  }

  // Drop any keys that aren't in ALL_COLUMNS (e.g., old 'commPrefs')
  useEffect(() => {
    const valid = new Set(ALL_COLUMNS.map(c => String(c.key)));
    const hasStale = Object.keys(columns).some(k => !valid.has(k));
    if (hasStale) {
      const next: Record<string, boolean> = {};
      ALL_COLUMNS.forEach(c => { next[c.key] = hasStale ? !!c.default : !!columns[c.key]; });
      applyColumns(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [sorts, setSorts] = useState<SortRule[]>(() => {
    const saved = localStorage.getItem(SORT_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [q, setQ] = useState<string>(() => localStorage.getItem(Q_STORAGE_KEY) || "");
  const dq = useDebounced(q, 300);

  const [pageSize, setPageSize] = useState<number>(() => Number(localStorage.getItem(PAGE_SIZE_STORAGE_KEY) || 25));
  const [page, setPage] = useState<number>(1);

  const [showFilters, setShowFilters] = useState<boolean>(() => localStorage.getItem(SHOW_FILTERS_STORAGE_KEY) === "1");
  const [filters, setFilters] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });
  const [moreOpen, setMoreOpen] = useState(false);
  //******* More menu positioning**************************************************************************************************************************************************************”€
  const moreAnchorRef = React.useRef<HTMLElement | null>(null);
  const [morePos, setMorePos] = React.useState<{ top: number; left: number } | null>(null);

  React.useEffect(() => {
    if (!moreOpen) return;

    const WIDTH = 256;         // menu width (match w-64)
    const PAD = 12;

    const sync = () => {
      const el = moreAnchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const left = Math.max(PAD, Math.min(window.innerWidth - WIDTH - PAD, r.right - WIDTH));
      const top = r.bottom + 8;
      setMorePos({ top, left });
    };

    const parents: HTMLElement[] = [];
    let p = moreAnchorRef.current?.parentElement || null;
    while (p) {
      const s = getComputedStyle(p);
      if (/(auto|scroll|overlay)/.test(`${s.overflow}${s.overflowY}${s.overflowX}`)) parents.push(p);
      p = p.parentElement;
    }

    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, { passive: true });
    parents.forEach(n => n.addEventListener("scroll", sync, { passive: true }));

    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync);
      parents.forEach(n => n.removeEventListener("scroll", sync));
    };
  }, [moreOpen]);


  const [includeArchived, setIncludeArchived] = useState(false);
  const [drawerRefreshKey, setDrawerRefreshKey] = useState(0);
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");
  const [formError, setFormError] = useState<string>("");
  const [formTriedSubmit, setFormTriedSubmit] = useState(false);

  /** Data */
  const [loading, setLoading] = useState<boolean>(tenantId != null);
  const [error, setError] = useState<string>("");
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [selected, setSelected] = useState<Set<ID>>(new Set());

  /** Drawer + editing state */
  const [selectedId, setSelectedId] = useState<ID | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerEditing, setDrawerEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<ContactRow> | null>(null);
  const [drawerTab, setDrawerTab] = useState<"overview" | "animals" | "audit">("overview");

  // edit mode is controlled only by drawerEditing now
  const [drawer, setDrawer] = useState<ContactRow | null>(null);
  const [drawerLoading, setDrawerLoading] = useState<boolean>(false);
  const [drawerError, setDrawerError] = useState<string>("");

  /** Create/Edit modal */
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<ID | null>(null);
  const [form, setForm] = useState<Partial<ContactRow>>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
    street: "",
    street2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });

  // --- State/Region helpers (US vs non-US) ---
  const countryStr = String(form.country ?? "").trim().toLowerCase();
  const isUS =
    countryStr === "united states" ||
    countryStr === "united states of america" ||
    countryStr === "usa" ||
    countryStr === "us";

  // Use your existing options if you have them. This is just an example subset.
  const US_STATE_OPTIONS: Array<{ value: string; label: string }> = [
    { value: "AL", label: "Alabama" },
    { value: "AK", label: "Alaska" },
    { value: "AZ", label: "Arizona" },
    { value: "AR", label: "Arkansas" },
    { value: "CA", label: "California" },
    // ... include your full list here
  ];

  /** Bulk tag manager (for selected rows) */
  const [tagBarOpen, setTagBarOpen] = useState<boolean>(false);
  const [tagAdd, setTagAdd] = useState<string>("");
  const [tagRemove, setTagRemove] = useState<string>("");

  /** Merge selected */
  const [mergeOpen, setMergeOpen] = useState<boolean>(false);
  const [mergeSurvivor, setMergeSurvivor] = useState<ID | null>(null);

  /** Organizations for select */
  const [organizations, setOrganizations] = useState<Array<{ id: ID; name: string }>>([]);
  const [affiliations, setAffiliations] = React.useState<number[]>([]);

  useEffect(() => {
    if (!api) return;
    (async () => {
      try {
        const res = await api.lookups.searchOrganizations("");
        const items = Array.isArray(res) ? res : [];
        const normalized = items
          .map((o: any) => ({
            id: o?.id,
            name:
              o?.name ??
              o?.displayName ??
              o?.title ??
              o?.organizationName ??
              o?.label ??
              (o?.id != null ? `Org ${o.id}` : "Untitled"),
          }))
          .filter((o: any) => o.id != null);

        setOrganizations(normalized);
      } catch {
        setOrganizations([]);
      }
    })();
  }, [api]);

  /** Countries */
  const countries = useCountries();

  // Map current value (code or name) to a select value (always code)
  function countryCodeFromValue(current?: string | null, list?: { code: string; name: string }[]) {
    const v = String(current || "").trim();
    if (!v || !Array.isArray(list)) return "";
    const up = v.toUpperCase();
    const byCode = list.find(c => c.code.toUpperCase() === up);
    if (byCode) return byCode.code;
    const byName = list.find(c => c.name.toUpperCase() === up);
    return byName ? byName.code : "";
  }

  function countryNameFromValue(
    value?: string | null,
    list?: { code: string; name: string }[]
  ) {
    const v = String(value || "");
    if (!v || !list?.length) return undefined;
    const byCode = list.find(c => c.code.toUpperCase() === v.toUpperCase());
    if (byCode) return byCode.name;
    const byName = list.find(c => c.name.toUpperCase() === v.toUpperCase());
    return byName ? byName.name : undefined;
  }
  function resolveOrgName(
    id?: ID | null,
    fallback?: string | null,
    list?: Array<{ id: ID; name: string }>
  ): string {
    if (id == null) return fallback || "";
    const hit = list?.find(o => String(o.id) === String(id));
    return hit?.name || fallback || "";
  }

  /** Normalize a country value that might be a name or code to an ISO alpha-2 code */
  function asCountryCode(
    value?: string | null,
    list?: { code: string; name: string }[]
  ) {
    const v = String(value || "").trim();
    if (!v) return "";
    const byCode = list?.find(c => c.code.toUpperCase() === v.toUpperCase());
    if (byCode) return byCode.code;
    const byName = list?.find(c => c.name.toUpperCase() === v.toUpperCase());
    return byName ? byName.code : v;
  }


  /** Contact tags from API (type=contact) with fallback */
  // keep your fallback
  const [contactTags, setContactTags] = useState<string[]>(FALLBACK_CONTACT_TAGS);
  const [tagsError, setTagsError] = useState<string>("");

  useEffect(() => {
    if (!api) return;

    let cancelled = false;

    (async () => {
      try {
        setTagsError("");
        const res = await api.tags.list("CONTACT");

        // support either { items: [...] } or bare array
        const items = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
        const names: string[] = items.map((t: any) => t?.name).filter(Boolean);

        if (!cancelled && names.length) setContactTags(names);
      } catch (err: any) {
        if (!cancelled) setTagsError(err?.message || "Failed to load tags");
        // keep FALLBACK_CONTACT_TAGS in place on error
        console.error("tags.list failed:", err);
      }
    })();

    return () => { cancelled = true; };
  }, [api]);

  /** Persist prefs */
  useEffect(() => { localStorage.setItem(COL_STORAGE_KEY, JSON.stringify(columns)); }, [columns]);
  useEffect(() => { localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sorts)); }, [sorts]);
  useEffect(() => { localStorage.setItem(Q_STORAGE_KEY, q); }, [q]);
  useEffect(() => { localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(pageSize)); }, [pageSize]);
  useEffect(() => { localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters)); }, [filters]);
  useEffect(() => { localStorage.setItem(SHOW_FILTERS_STORAGE_KEY, showFilters ? "1" : "0"); }, [showFilters]);


  /** Map UI sorts -> API sort query, e.g. "firstName:asc,lastName:desc" */
  const sortParam = React.useMemo(
    () => (sorts.length ? sorts.map(s => `${String(s.key)}:${s.dir}`).join(",") : ""),
    [sorts]
  );

  /** List fetch */
  useEffect(() => {
    if (!api) return;
    let ignore = false;
    setLoading(true);
    setError("");

    api.contacts.list({
      q: dq || undefined,
      limit: pageSize,
      page,
      includeArchived,
      sort: sortParam || undefined,
    })
      .then((res: any) => {
        if (ignore) return;
        // contacts.ts returns { data, total, page, limit }
        const items = Array.isArray(res?.items) ? res.items : (Array.isArray(res?.data) ? res.data : []);
        const totalVal = Number.isFinite(res?.total) ? Number(res.total) : items.length;
        setRows(items.map(shapeContact).map(normalize));
        setTotal(totalVal);
      })
      .catch((e: any) => { if (!ignore) setError(e?.message || "Failed to load contacts"); })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, [api, dq, pageSize, includeArchived, page, sorts]);

  // [ADD] load org affiliations for this contact when we select/open it
  useEffect(() => {
    if (!api || selectedId == null) return;
    let ignore = false;
    (async () => {
      try {
        const rows = await api.contacts.getAffiliations(String(selectedId));
        if (ignore) return;
        const ids = Array.isArray(rows) ? rows.map((r: any) => Number(r.organizationId)).filter(Number.isFinite) : [];
        setAffiliations(ids);
      } catch {
        if (!ignore) setAffiliations([]);
      }
    })();
    return () => { ignore = true; };
  }, [api, selectedId]);

  useEffect(() => {
    if (!api || selectedId == null) return;
    let ignore = false;

    (async () => {
      try {
        const res = await (api as any).contacts.getTags(String(selectedId));
        const items = Array.isArray(res?.items) ? res.items : [];
        const names = items.map((t: any) => t?.name).filter(Boolean);

        if (!ignore) {
          // merge the tags array into the open drawer record
          setDrawer(prev => prev ? { ...prev, tags: Array.from(new Set(names)) } : prev);
        }
      } catch {
        // silently ignore; UI already shows**€œNo tags” if empty
      }
    })();

    return () => { ignore = true; };
  }, [api, selectedId]);

  // Load audit stream when the Audit tab is selected
  useEffect(() => {
    if (!api || drawerTab !== "audit" || !selectedId) return;

    let ignore = false;
    setAuditLoading(true);
    setAuditError("");
    setAuditRows([]);

    api.contacts.audit(String(selectedId))
      .then((rows: any) => {
        if (ignore) return;
        setAuditRows(Array.isArray(rows) ? rows : []);
      })
      .catch((e: any) => {
        if (ignore) return;
        setAuditError(e?.message || "Failed to load audit");
      })
      .finally(() => {
        if (ignore) return;
        setAuditLoading(false);
      });

    return () => { ignore = true; };
  }, [api, drawerTab, selectedId]);

  const dFilters = useDebounced(filters, 250);
  /** Derived rows: client-side filtering */
  const filteredRows = React.useMemo(() => {
    const text = (dFilters.__text || "").trim().toLowerCase();
    const f = (k: string) => (dFilters[k] || "").trim().toLowerCase();

    const ranges = {
      createdStart: dFilters.createdAtStart || "",
      createdEnd: dFilters.createdAtEnd || "",
      updatedStart: dFilters.updatedAtStart || "",
      updatedEnd: dFilters.updatedAtEnd || "",
      nextStart: dFilters.nextFollowUpStart || "",
      nextEnd: dFilters.nextFollowUpEnd || "",
      lastStart: dFilters.lastContactedStart || "",
      lastEnd: dFilters.lastContactedEnd || "",
    };

    const inRange = (iso?: string | null, start?: string, end?: string) => {
      if (!start && !end) return true;
      if (!iso) return false;
      const t = new Date(iso).getTime();
      if (Number.isNaN(t)) return false;
      if (start) { const s = new Date(start).getTime(); if (!Number.isNaN(s) && t < s) return false; }
      if (end) { const e = new Date(end).getTime(); if (!Number.isNaN(e) && t > e) return false; }
      return true;
    };
    const onlyDigitsLocal = (s: string) => String(s || "").replace(/\D+/g, "");

    const includes = (hay?: string | null, needle?: string) =>
      !needle || !!hay?.toLowerCase().includes(needle);

    // exact any-of: "a, b" matches if value equals any token (case-insensitive)
    function matchAnyExact(value: string | null | undefined, q: string | undefined) {
      const tokens = String(q || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
      if (!tokens.length) return true;
      const v = String(value || "").toLowerCase();
      return tokens.some(t => v === t);
    }

    function matchesTags(rowTags: string[] | null | undefined, q: string) {
      if (!q) return true;
      const tokens = String(q).split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
      if (!tokens.length) return true;
      const have = (rowTags || []).map(t => String(t).toLowerCase());
      // match if ANY token is contained in ANY tag
      return tokens.some(tok => have.some(h => h.includes(tok)));
    }

    return rows.filter(r => {
      if (!includeArchived && !!r.archived) return false;

      // global text search over key fields
      const globalOk = !text || [
        r.nickname, r.firstName, r.lastName, r.email, r.phone, r.organizationName, r.leadStatus,
        ...(r.tags || []),
      ].some(v => String(v || "").toLowerCase().includes(text));
      if (!globalOk) return false;

      // per-field filters
      if (!includes(r.nickname, f("nickname"))) return false;
      if (!includes(r.firstName, f("firstName"))) return false;
      if (!includes(r.lastName, f("lastName"))) return false;
      if (!includes(r.email, f("email"))) return false;

      if (dFilters.phone) {
        if (!onlyDigitsLocal(r.phone || "").includes(onlyDigitsLocal(dFilters.phone))) return false;
      }
      if (dFilters.whatsappPhone) {
        if (!onlyDigitsLocal((r as any).whatsappPhone || "").includes(onlyDigitsLocal(dFilters.whatsappPhone))) return false;
      }

      if (!matchAnyExact(r.status, dFilters.status)) return false;
      if (!includes(String(r.leadStatus || ""), f("leadStatus"))) return false;
      if (!matchAnyExact(r.organizationName, dFilters.organizationName)) return false;
      if (!matchesTags(r.tags, f("tags"))) return false;

      // date ranges
      if (!inRange(r.createdAt, ranges.createdStart, ranges.createdEnd)) return false;
      if (!inRange(r.updatedAt, ranges.updatedStart, ranges.updatedEnd)) return false;
      if (!inRange(r.nextFollowUp, ranges.nextStart, ranges.nextEnd)) return false;
      if (!inRange(r.lastContacted, ranges.lastStart, ranges.lastEnd)) return false;

      return true;
    });
  }, [rows, dFilters, includeArchived]);

  /** Sorting & paging */
  const sortedRows = React.useMemo(() => {
    if (sorts.length === 0) return filteredRows;
    const copy = [...filteredRows];
    const comps = sorts.map(s => {
      const key = s.key; const dir = s.dir === "asc" ? 1 : -1;
      return (a: ContactRow, b: ContactRow) => {
        const va = (a as any)[key], vb = (b as any)[key];
        if (va == null && vb == null) return 0;
        if (va == null) return -1 * dir;
        if (vb == null) return 1 * dir;
        if (["createdAt", "updatedAt", "lastContacted", "nextFollowUp", "birthday"].includes(String(key))) {
          return (new Date(va).getTime() - new Date(vb).getTime()) * dir;
        }
        return String(va).localeCompare(String(vb)) * dir;
      };
    });
    copy.sort((a, b) => { for (const cmp of comps) { const r = cmp(a, b); if (r !== 0) return r; } return 0; });
    return copy;
  }, [filteredRows, sorts]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const clampedPage = Math.min(pageCount, Math.max(1, page));
  const totalFiltered = sortedRows.length;
  const pageRows = React.useMemo(() => {
    const start = (clampedPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, clampedPage, pageSize]);

  // Select-all checkbox visual state
  const selectAllRef = React.useRef<HTMLInputElement | null>(null);

  React.useLayoutEffect(() => {
    const el = selectAllRef.current;
    if (!el) return;
    if (pageRows.length === 0) {
      el.indeterminate = false;
      return;
    }
    const allIds = pageRows.map(r => r.id);
    const selectedOnPage = allIds.filter(id => selected.has(id)).length;
    el.indeterminate = selectedOnPage > 0 && selectedOnPage < allIds.length;
  }, [selected, pageRows]);

  /** Handlers */
  const cycleSort = (key: keyof ContactRow, withShift: boolean) => {
    setSorts(prev => {
      const idx = prev.findIndex(s => s.key === key);
      if (!withShift) {
        if (idx === -1) return [{ key, dir: "asc" }];
        if (prev[idx].dir === "asc") return [{ key, dir: "desc" }];
        return [];
      }
      if (idx === -1) return [...prev, { key, dir: "asc" }];
      const cur = prev[idx];
      if (cur.dir === "asc") { const copy = prev.slice(); copy[idx] = { key, dir: "desc" }; return copy; }
      const copy = prev.slice(); copy.splice(idx, 1); return copy;
    });
    setPage(1);
  };
  const toggleSelectAll = () => setSelected(prev => prev.size === pageRows.length ? new Set() : new Set(pageRows.map(r => r.id)));
  const toggleSelect = (id: ID) =>
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  function exportCSV(selectedOnly: boolean) {
    const cols = visibleCols.map((c) => c.label);
    const keys = visibleCols.map((c) => c.key);

    const quote = (s: any) => `"${String(s ?? "").replace(/"/g, '""')}"`;

    const source = selectedOnly
      ? filteredRows.filter(r => selected.has(r.id))
      : filteredRows;

    const lines: string[] = [];
    lines.push(cols.map(quote).join(",")); // header

    for (const r of source) {
      const vals = keys.map((k) => {
        let v: any = (r as any)[k];
        if (k === "phone") v = prettyPhone(v);
        if (k === "createdAt" || k === "updatedAt" || k === "lastContacted" || k === "nextFollowUp") v = formatDate(v);
        if (k === "tags") v = (r.tags || []).join("|");
        return quote(v);
      });
      lines.push(vals.join(","));
    }

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = selectedOnly ? "contacts_selected.csv" : "contacts.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function bulkStatus(next: "Active" | "Inactive") {
    if (!api) return;
    if (selected.size === 0) return;
    setLoading(true); setError("");
    try {
      await Promise.all(Array.from(selected).map(id => api.contacts.update(String(id), { status: next } as any)));
      setSelected(new Set());
      const res = await api.contacts.list({ q: dq || undefined, limit: pageSize, page, includeArchived });
      const _items = (res as any)?.items ?? (res as any)?.data ?? [];
      const _total = (res as any)?.total ?? _items.length ?? 0;
      setRows(_items.map(shapeContact).map(normalize));
      setTotal(_total);
    } catch (e: any) { setError(e?.message || "Bulk update failed"); }
    finally { setLoading(false); }
  }

  async function bulkApplyTags() {
    if (!api) return;
    if (selected.size === 0) return;
    setLoading(true); setError("");

    try {
      // 1) Get all CONTACT tags once (id+name map)
      const res = await api.tags.list("CONTACT");
      const tagItems = (Array.isArray(res?.items) ? res.items : []);
      const byName = new Map<string, number>();
      for (const t of tagItems) {
        if (t?.name && t?.id != null) byName.set(String(t.name).toLowerCase(), Number(t.id));
      }

      // 2) Parse adds/removes by name→ id (ignore unknowns)
      const adds = tagAdd.split(",").map(s => s.trim()).filter(Boolean);
      const removes = tagRemove.split(",").map(s => s.trim()).filter(Boolean);

      const addIds = adds
        .map(n => byName.get(n.toLowerCase()))
        .filter((id): id is number => Number.isInteger(id));
      const removeIds = removes
        .map(n => byName.get(n.toLowerCase()))
        .filter((id): id is number => Number.isInteger(id));

      // 3) Call assign/unassign per tag id + contact id
      const ids = Array.from(selected);
      await Promise.all([
        ...ids.flatMap((cid) => addIds.map((tid) => api.tags.assign(tid, cid))),
        ...ids.flatMap((cid) => removeIds.map((tid) => api.tags.unassign(tid, cid))),
      ]);

      // 4) Reset UI + refresh list
      setSelected(new Set());
      setTagAdd(""); setTagRemove(""); setTagBarOpen(false);

      const list = await api.contacts.list({ q: dq || undefined, limit: pageSize, page, includeArchived });
      const items = (list as any)?.items ?? (list as any)?.data ?? [];
      setRows(items.map(shapeContact).map(normalize));
      setTotal((list as any)?.total ?? items.length ?? 0);
    } catch (e: any) {
      setError(e?.message || "Bulk tag update failed");
    } finally {
      setLoading(false);
    }
  }

  const openCreate = () => {
    setEditingId(null);
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      notes: "",
      emailStatus: "subscribed",
      smsStatus: "subscribed",
      commPrefs: { whatsapp: false, whatsappPhone: "" }
    } as any);
    setFormError("");
    setFormTriedSubmit(false);
    setFormOpen(true);
  };
  const openEdit = (r: ContactRow) => {
    setEditingId(r.id);
    setForm({
      firstName: r.firstName || "",
      lastName: r.lastName || "",
      email: r.email || "",
      phone: r.phone || "",
      notes: r.notes || "",
      nickname: (r as any).nickname || "",
      status: r.status || "Active",
      tags: r.tags || [],
    });
    setFormError("");
    setFormTriedSubmit(false);
    setFormOpen(true);
  };

  async function submitForm(e: React.FormEvent) {
    if (!api) return;
    e.preventDefault();
    setFormTriedSubmit(true);
    setLoading(true);
    setFormError(""); // keep errors in the dialog

    const fn = String(form.firstName ?? "").trim();
    const ln = String(form.lastName ?? "").trim();

    if (!fn || !ln) {
      setLoading(false);
      setFormOpen(true);              // keep modal open
      setFormError("First and Last Name are required.");
      return;
    }

    try {
      if (editingId == null) {
        const created = await api.contacts.create(nilIfEmpty(buildContactPayload({}, form, { countries })))
        const newId = (created as any)?.id ?? (created as any)?.data?.id;
        if (!newId) throw new Error("Create succeeded but no id was returned");
      } else {
        await api.contacts.update(String(editingId), nilIfEmpty(buildContactPayload({}, form, { countries })));
        setSelectedId(editingId);
        setDrawerTab("overview");
        setIsDrawerOpen(true);
      }

      setFormOpen(false);
      setFormError("");
      setFormTriedSubmit(false);

      const res = await api.contacts.list({ q: dq || undefined, limit: pageSize, page, includeArchived });
      const items = (res as any)?.items ?? (res as any)?.data ?? [];
      setRows(items.map(shapeContact).map(normalize));
      setTotal((res as any)?.total ?? items.length ?? 0);
    } catch (e: any) {
      setFormError(e?.message || "Save failed");
      setFormOpen(true);
    } finally {
      setLoading(false);
    }
  }

  /** Visible cols + row snapshot for opening drawer fast */
  const visibleCols = React.useMemo(() => ALL_COLUMNS.filter(c => columns[String(c.key)]), [columns]); const d = React.useMemo(() => (drawer ? { ...drawer, ...(draft || {}) } : null), [drawer, draft]);

  /****************************************************************************************************”€ UI**************************************************************************************************”€ */
  return (
    <>
      <div className="space-y-3">
        {error && <div className="rounded-md border border-hairline bg-surface-strong px-3 py-2 text-sm text-secondary">{error}</div>}
        {tenantId == null && !tenantErr && (
          <div className="rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-secondary">
            Resolving tenant…
          </div>
        )}
        {tenantErr && (
          <div className="rounded-md border border-red-300/60 bg-red-100/50 px-3 py-2 text-sm text-red-700">
            Tenant error: {tenantErr}
          </div>
        )}

        <Card className="bhq-card border border-hairline bg-surface">
          {/* Toolbar */}
          <div className="bhq-section-fixed p-4 sm:p-5 bg-surface bg-gradient-to-b from-[hsl(var(--glass))/35] to-[hsl(var(--glass-strong))/55] rounded-t-xl overflow-hidden">
            <div className="flex items-center gap-3 justify-between min-w-0">
              {/* LEFT: Search + filter toggle */}
              <div className="pr-2 flex-none w-full sm:w-[480px] md:w-[560px] lg:w-[640px] max-w-full">
                <div className="relative w-full">
                  {/* magnifier */}
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>

                  <Input
                    value={q}
                    onChange={(e) => { const v = (e.currentTarget?.value ?? ""); setQ(v); setPage(1); }}
                    placeholder="Search any field..."
                    aria-label="Search contacts"
                    className="pl-9 pr-20 w-full h-10 rounded-full shadow-sm bg-surface border border-hairline focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))] focus:outline-none"
                  />

                  {/* clear */}
                  {q && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => setQ("")}
                      className="absolute right-12 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[hsl(var(--brand-orange))]/12"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}

                  {/* divider */}
                  <span aria-hidden className="absolute right-9 top-1/2 -translate-y-1/2 h-5 w-px bg-hairline" />

                  {/* filter toggle */}
                  <button
                    type="button"
                    aria-label="Toggle filters"
                    aria-pressed={showFilters ? 'true' : 'false'}
                    onClick={(e) => { setShowFilters(v => !v); (e.currentTarget as HTMLButtonElement).blur(); }}
                    className={[
                      "absolute right-2 top-1/2 -translate-y-1/2",
                      "inline-grid place-items-center h-7 w-7 rounded-full",
                      // idle = subtle ghost; active = solid brand
                      showFilters
                        ? "bg-[hsl(var(--brand-orange))] text-black"
                        : "text-secondary hover:bg-white/10 focus:bg-white/10"
                    ].join(" ")}
                  >
                    {/***€œsliders” icon that matches the screenshot style */}
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="4" y1="7" x2="14" y2="7" />   {/* top track */}
                      <circle cx="18" cy="7" r="1.5" fill="currentColor" />  {/* top knob */}
                      <line x1="4" y1="12" x2="11" y2="12" />   {/* middle track */}
                      <circle cx="15" cy="12" r="1.5" fill="currentColor" />  {/* middle knob */}
                      <line x1="4" y1="17" x2="12" y2="17" />   {/* bottom track */}
                      <circle cx="16" cy="17" r="1.5" fill="currentColor" />  {/* bottom knob */}
                    </svg>
                  </button>
                </div>
              </div>

              {/* RIGHT: actions */}
              <div className="shrink-0 flex items-center gap-2">
                <Button variant="primary" onClick={openCreate}>New Contact</Button>

                {/* More (Export/Import)***” portaled so it never clips */}
                <div className="relative inline-flex">
                  {/* If @bhq/ui Button forwards refs, this ref works. If not, use the fallback wrapper below. */}
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="More"
                    onClick={() => setMoreOpen(v => !v)}
                    className="h-9 w-9"
                    ref={moreAnchorRef as any}
                  >
                    ...
                  </Button>
                  {moreOpen && morePos && createPortal(
                    <>
                      {/* backdrop */}
                      <div
                        onClick={() => setMoreOpen(false)}
                        style={{ position: "fixed", inset: 0, zIndex: Z.backdrop, background: "transparent", pointerEvents: "auto" }}
                      />
                      {/* panel */}
                      <div
                        role="menu"
                        className="rounded-md border border-hairline bg-surface shadow-lg p-2 w-64"
                        style={{ position: "fixed", top: morePos.top, left: morePos.left, zIndex: Z.popover }}
                      >
                        <button
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-[hsl(var(--brand-orange))]/12"
                          onClick={() => { setMoreOpen(false); exportCSV(false); }}
                        >
                          Export CSV (all)
                        </button>
                        <button
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-[hsl(var(--brand-orange))]/12 disabled:opacity-50"
                          onClick={() => { setMoreOpen(false); exportCSV(true); }}
                          disabled={selected.size === 0}
                        >
                          Export CSV (selected)
                        </button>
                        <button
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-[hsl(var(--brand-orange))]/12"
                          onClick={() => { setMoreOpen(false); alert("Import CSV**€” coming soon"); }}
                        >
                          Import CSV
                        </button>
                      </div>
                    </>,
                    getOverlayRoot()
                  )}
                </div>

                {selected.size > 0 && (
                  <>
                    <Button variant="outline" onClick={() => bulkStatus("Active")}>Activate</Button>
                    <Button variant="outline" onClick={() => bulkStatus("Inactive")}>Deactivate</Button>
                    <Button variant="outline" onClick={() => setTagBarOpen(v => !v)}>Tags</Button>
                    <Button variant="outline" onClick={() => { if (selected.size >= 2) setMergeOpen(true); }}>Merge</Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bulk tag bar */}
          {selected.size > 0 && tagBarOpen && (
            <div className="bhq-section-fixed border-t border-hairline px-3 py-2 flex items-center gap-2 bg-surface-strong/60">
              <span className="text-xs text-secondary">Manage tags for {selected.size} selected</span>
              <Input placeholder="Add tags (comma separated)" value={tagAdd} onChange={(e) => setTagAdd((e.currentTarget?.value ?? ""))} className="w-64" />
              <Input placeholder="Remove tags (comma separated)" value={tagRemove} onChange={(e) => setTagRemove((e.currentTarget?.value ?? ""))} className="w-64" />
              <div className="ml-auto flex gap-2">
                <Button variant="outline" onClick={() => { setTagAdd(""); setTagRemove(""); setTagBarOpen(false); }}>Cancel</Button>
                <Button onClick={bulkApplyTags}>Apply</Button>
              </div>
            </div>
          )}

          {/* Filters */}
          {showFilters && (
            <div className="bhq-section-fixed mt-2 rounded-xl border border-hairline bg-surface-strong/70 p-3 sm:p-4">
              <FilterRow columns={columns} filters={filters} rows={rows} onChange={setFilters} organizations={organizations} />
              {Object.entries(filters).some(([k, v]) => !!v) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {Object.entries(filters).filter(([, v]) => !!v).map(([k, v]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setFilters({ ...filters, [k]: "" })}
                      className="inline-flex items-center gap-1 rounded-full border border-hairline bg-surface px-2 py-0.5 text-xs"
                      title={`${k}: ${v}`}
                    >
                      <span className="max-w-[16ch] truncate">{k}: {v}</span>
                      <span aria-hidden>Ã—</span>
                    </button>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setFilters({})}>Clear all</Button>
                </div>
              )}

            </div>
          )}

          {/* Table */}
          <div className="bhq-table overflow-hidden">
            <div className="relative overflow-x-auto overscroll-contain">
              <table className="min-w-max w-full text-sm">
                <colgroup>
                  <col />
                  {visibleCols.map((_, i) => <col key={`c-${i}`} />)}
                  <col style={{ width: 'var(--util-col-width)' }} />
                </colgroup>

                <thead>
                  <tr className="text-sm">
                    <th className="px-3 py-2 w-10 text-center">
                      <input
                        key={clampedPage}
                        ref={selectAllRef}
                        type="checkbox"
                        aria-label="Select all"
                        checked={pageRows.length > 0 && pageRows.every(r => selected.has(r.id))}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    {visibleCols.map((c) => {
                      const active = sorts.find(s => s.key === c.key);
                      const ariaSort = active ? (active.dir === "asc" ? "ascending" : "descending") : undefined; return (
                        <th
                          key={String(c.key)}
                          className="px-3 py-3 text-center"
                          {...(ariaSort ? { 'aria-sort': ariaSort as any } : {})}
                        >
                          <button
                            type="button"
                            className={[
                              "w-full select-none flex items-center justify-center",
                              active ? "text-primary" : "text-secondary"
                            ].join(" ")}
                            aria-label={`Sort by ${c.label}${active ? ` (${active.dir})` : ""}`}
                            title={active ? `${c.label} (${active.dir})` : `Sort by ${c.label}`}
                            onClick={(e) => cycleSort(c.key as keyof ContactRow, e.shiftKey)}
                          >
                            <span className="inline-flex items-center gap-1">
                              <span>{c.label}</span>
                              <span className={`inline-block h-1.5 w-1.5 rounded-full ${active ? "" : "bg-transparent"}`} />
                            </span>
                          </button>
                        </th>
                      );
                    })}

                    <th className="sticky right-0 bg-surface text-right">
                      <div className="px-2 py-2 w-[var(--util-col-width)] min-w-[var(--util-col-width)]">
                        <ColumnsPopover
                          columns={columns}
                          onToggle={toggleColumn}
                          onSet={applyColumns}
                          allColumns={CONTACTS_COLUMN_META}
                          defaultKeys={CONTACTS_DEFAULT_KEYS}
                        />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-3 py-2 text-center"><div className="h-4 w-4 rounded bg-surface-strong inline-block" /></td>
                      {visibleCols.map((c, j) => (
                        <td key={`${i}-${j}`} className="px-3 py-2 text-center">
                          <div className="h-4 w-[70%] rounded bg-surface-strong mx-auto" />
                        </td>
                      ))}
                      <td className="px-3 py-2" />
                    </tr>
                  ))}
                  {!loading && pageRows.length === 0 && (
                    <tr>
                      <td className="px-3 py-8" colSpan={visibleCols.length + 2}>
                        <EmptyState title="No contacts match your filters" description="Try adjusting filters or adding a new record." action={<Button onClick={openCreate}>Create contact</Button>} />
                      </td>
                    </tr>
                  )}
                  {!loading && pageRows.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => {
                        setDrawer(normalize(r as any));
                        setIsDrawerOpen(true);
                        setDrawerTab("overview");
                        setSelectedId(r.id);
                        setDrawerRefreshKey(k => k + 1);
                      }}
                      className="cursor-pointer"
                    >
                      {[
                        // selection cell
                        <td key="sel" className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`Select ${`${r.nickname || r.firstName || ""} ${r.lastName || ""}`.trim() || r.email || r.id}`}
                            checked={selected.has(r.id)}
                            onChange={() => toggleSelect(r.id)}
                          />
                        </td>,

                        // data cells
                        ...visibleCols.map((c) => (
                          <td key={`c-${String(c.key)}`} className="px-3 py-2 text-sm text-center">
                            {c.key === "organizationName"
                              ? (resolveOrgName(r.organizationId, r.organizationName, organizations) || <span className="text-secondary">—</span>)
                              : c.render
                                ? c.render(r)
                                : ((r as any)[c.key] ?? "")
                            }
                          </td>
                        )),
                      ]}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <TableFooter
            page={clampedPage}
            pageCount={pageCount}
            pageSize={pageSize}
            total={sortedRows.length}
            includeArchived={includeArchived}
            onToggleArchived={(v) => { setIncludeArchived(v); setPage(1); }}
            onChangePageSize={(n) => { setPageSize(n); setPage(1); }}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(pageCount, p + 1))}
          />

        </Card>
      </div>

      {/* Drawer */}
      {isDrawerOpen && drawer && (
        <RightDrawer
          onClose={() => {
            setIsDrawerOpen(false);
            setDrawerEditing(false);
            setDraft(null);
          }}
          title={
            drawer.cDisplayName ||
            `${drawer.nickname || drawer.firstName || ""} ${drawer.lastName || ""}`.trim() ||
            "Contact"
          }
        >
          <div className="border-b border-hairline mb-3 px-4 bg-surface">
            <div className="flex items-center gap-3 py-2">
              <div className="flex gap-2">
                <TabButton active={drawerTab === "overview"} onClick={() => setDrawerTab("overview")}>Overview</TabButton>
                <TabButton active={drawerTab === "animals"} onClick={() => setDrawerTab("animals")}>Animals</TabButton>
                <TabButton active={drawerTab === "audit"} onClick={() => setDrawerTab("audit")}>Audit</TabButton>
              </div>

              {d?.archived && (
                <span
                  className="inline-flex items-center rounded-full bg-amber-200/70 border border-amber-300 px-2 py-0.5 text-[11px] font-medium text-amber-900"
                  title={d?.archivedReason ? `Archived: ${d.archivedReason}` : "Archived"}
                >
                  Archived{d?.archivedAt ? `**€¢ ${formatDate(d.archivedAt)}` : ""}
                </span>
              )}

              <div className="ml-auto flex items-center gap-2">
                {drawerTab === "overview" && drawerEditing && (
                  <>
                    <Button
                      onClick={async () => {
                        if (!drawer) return;
                        try {
                          // Persist only contact fields (contacts.ts PATCH supports these)
                          await api.contacts.update(String(drawer.id), nilIfEmpty(buildContactPayload(d, draft, { countries })));
                          setDraft(null);
                          setDrawerEditing(false);

                          // refresh list + drawer contents
                          const res = await api.contacts.list({ q: dq || undefined, limit: pageSize, page, includeArchived });
                          const items = Array.isArray((res as any)?.data) ? (res as any).data : [];
                          setRows(items.map(shapeContact).map(normalize));
                          setTotal((res as any)?.total ?? items.length ?? 0);

                          // re-fetch the open record
                          const fresh = await api.contacts.get(String(drawer.id));
                          setDrawer(normalize(shapeContact(fresh as any)));
                        } catch (e) {
                          console.error(e);
                          alert("Save failed");
                        }
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDraft(null);
                        setDrawerEditing(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}

                {drawerTab === "overview" && !drawerEditing && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (d?.archived) {
                          alert("This contact is archived. Restore first if you need to edit.");
                          return;
                        }
                        setDraft({ commPrefs: (d as any)?.commPrefs || {} });
                        setDrawerEditing(true);
                      }}
                      disabled={!!d?.archived}
                      title={d?.archived ? "Restore to edit" : "Edit"}
                    >
                      Edit
                    </Button>

                    {!drawerEditing && (
                      !d?.archived ? (
                        <Button
                          variant="outline"
                          title="Archive (soft-delete)"
                          onClick={async () => {
                            if (!drawer) return;
                            try {
                              const reason = window.prompt("Archive reason (optional):") || undefined;
                              await api.contacts.archive(String(drawer.id), reason);
                              setSelectedId(drawer.id);
                              const res = await api.contacts.list({ q: dq || undefined, limit: pageSize, page, includeArchived });
                              const items = (res as any)?.items ?? (res as any)?.data ?? [];
                              setRows(items.map(shapeContact).map(normalize));
                              setTotal((res as any)?.total ?? items.length ?? 0);
                              setDrawerRefreshKey((k) => k + 1);
                            } catch (e) {
                              console.error(e);
                              alert("Archive failed");
                            }
                          }}
                        >
                          Archive
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          title="Restore archived contact"
                          onClick={async () => {
                            if (!drawer) return;
                            try {
                              await api.contacts.restore(String(drawer.id));
                              setSelectedId(drawer.id);
                              const res = await api.contacts.list({ q: dq || undefined, limit: pageSize, page, includeArchived });
                              const items = (res as any)?.items ?? (res as any)?.data ?? [];
                              setRows(items.map(shapeContact).map(normalize));
                              setTotal((res as any)?.total ?? items.length ?? 0);
                              setDrawerRefreshKey((k) => k + 1);
                            } catch (e) {
                              console.error(e);
                              alert("Restore failed");
                            }
                          }}
                        >
                          Restore
                        </Button>
                      )
                    )}
                  </>
                )}

                <div className="text-xs text-secondary">
                  {drawerLoading ? "Loading…" : drawerError || ""}
                </div>
              </div>
            </div>
          </div>

          {drawerTab === "overview" && (
            <div data-1p-ignore autoComplete="off" className="space-y-4">
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FieldRow label="First Name">
                  {drawerEditing ? (
                    <input
                      className="h-10 w-full rounded-md border border-hairline bg-surface px-3 text-sm outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
                      value={d?.firstName || ""}
                      onChange={(e) => { const v = getEventValue(e); setDraft(p => ({ ...(p || {}), firstName: v })); }}
                    />
                  ) : (
                    <span className="truncate">{d?.firstName || <span className="text-secondary">—</span>}</span>
                  )}
                </FieldRow>

                <FieldRow label="Last Name">
                  {drawerEditing ? (
                    <input
                      className="h-10 w-full rounded-md border border-hairline bg-surface px-3 text-sm outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
                      value={d?.lastName || ""}
                      onChange={(e) => { const v = getEventValue(e); setDraft(p => ({ ...(p || {}), lastName: v })); }}
                    />
                  ) : (
                    <span className="truncate">{d?.lastName || <span className="text-secondary">—</span>}</span>
                  )}
                </FieldRow>

                <FieldRow label="Nickname">
                  {drawerEditing ? (
                    <input
                      className="h-10 w-full rounded-md border border-hairline bg-surface px-3 text-sm outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
                      value={(d as any)?.nickname || ""}
                      onChange={(e) => { const v = getEventValue(e); setDraft(p => ({ ...(p || {}), nickname: v })); }}
                    />
                  ) : (
                    <span className="truncate">{(d as any)?.nickname || <span className="text-secondary">—</span>}</span>
                  )}
                </FieldRow>

                <div className="sm:col-span-3">
                  <div className="text-xs uppercase tracking-wide text-secondary mb-1">Address</div>

                  {drawerEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full min-w-0">
                      <input
                        className="w-full h-10 rounded-md border border-hairline bg-surface px-3 text-sm text-primary outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
                        placeholder="Street"
                        value={draft?.street ?? d?.street ?? ""}
                        onChange={(e) => {
                          const v = getEventValue(e);
                          setDraft(p => ({ ...(p || {}), street: v }));
                        }}
                      />
                      <input
                        className="w-full h-10 rounded-md border border-hairline bg-surface px-3 text-sm text-primary outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
                        placeholder="Street 2"
                        value={draft?.street2 ?? d?.street2 ?? ""}
                        onChange={(e) => {
                          const v = getEventValue(e);
                          setDraft(p => ({ ...(p || {}), street2: v }));
                        }}
                      />
                      <input
                        className="w-full h-10 rounded-md border border-hairline bg-surface px-3 text-sm text-primary outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
                        placeholder="City"
                        value={draft?.city ?? d?.city ?? ""}
                        onChange={(e) => {
                          const v = getEventValue(e);
                          setDraft(p => ({ ...(p || {}), city: v }));
                        }}
                      />

                      {(() => {
                        const countryRaw = draft?.country ?? d?.country ?? "";
                        const code = asCountryCode(countryRaw, countries).toUpperCase();
                        const isUS = code === "US";
                        return isUS;
                      })() ? (
                        <select
                          key="state-select"
                          className="w-full h-10 rounded-md border border-hairline bg-surface px-3 text-sm text-primary outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))] "
                          value={draft?.state ?? d?.state ?? ""}
                          onChange={(e) => {
                            const v = getEventValue(e);
                            setDraft(p => ({ ...(p || {}), state: v }));
                          }}
                        >
                          <option value="">State</option>
                          {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <input
                          key="state-input"
                          className="w-full h-10 rounded-md border border-hairline bg-surface px-3 text-sm text-primary outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))] "
                          placeholder="State / Region"
                          value={draft?.state ?? d?.state ?? ""}
                          onChange={(e) => {
                            const v = getEventValue(e);
                            setDraft(p => ({ ...(p || {}), state: v }));
                          }}
                        />
                      )}

                      {(() => {
                        const countryRaw = draft?.country ?? d?.country ?? "";
                        const code = asCountryCode(countryRaw, countries).toUpperCase();
                        const isUS = code === "US";
                        return (
                          <input
                            className="w-full h-10 rounded-md border border-hairline bg-surface px-3 text-sm"
                            placeholder="Postal Code"
                            inputMode={isUS ? "numeric" : "text"}
                            pattern={isUS ? "[0-9]*" : undefined}
                            onKeyDown={isUS ? allowOnlyDigitKeys : undefined}
                            onPaste={(e) => {
                              if (!isUS) return;
                              e.preventDefault();
                              const pasted = e.clipboardData.getData("text") || "";
                              const next = digitsOnly(pasted);
                              setDraft(p => ({ ...(p || {}), postalCode: next }));
                            }}
                            value={draft?.postalCode ?? d?.postalCode ?? ""}
                            onChange={(e) => {
                              const raw = e.currentTarget.value;
                              const next = isUS ? digitsOnly(raw) : raw;
                              setDraft(p => ({ ...(p || {}), postalCode: next }));
                            }}
                          />
                        );
                      })()}

                      <select
                        className="w-full h-10 rounded-md border border-hairline bg-surface px-3 text-sm text-primary outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
                        value={countryCodeFromValue(draft?.country ?? d?.country ?? "", countries)}
                        onChange={(e) => {
                          const code = getEventValue(e);
                          setDraft(p => ({ ...(p || {}), country: code }));
                        }}
                      >
                        <option value="">Country</option>
                        {countries.map((c) => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="leading-5">
                      {[d?.street, d?.street2].filter(Boolean).join(" ") || ""}
                      {(d?.city || d?.state) && <><br /></>}
                      {[d?.city, d?.state].filter(Boolean).join(", ")}{d?.postalCode ? ` ${d.postalCode}` : ""}
                      {d?.country && <><br />{countryNameFromValue(d.country, countries) || d.country}</>}
                    </div>
                  )}
                </div>

                <FieldRow label="Organization" className="sm:col-span-3">
                  {drawerEditing ? (
                    <select
                      className="w-full sm:max-w-[520px] h-10 rounded-md bg-surface border border-hairline px-3 text-sm outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
                      value={affiliations[0] != null ? String(affiliations[0]) : ""}
                      onChange={(e) => {
                        const idStr = getEventValue(e) || "";
                        const idNum = idStr ? Number(idStr) : null;
                        setAffiliations(idNum != null ? [idNum] : []);
                        setDraft(p => ({ ...(p || {}), organizationId: idNum }));
                      }}
                    >
                      <option value="">— Select Organization”</option>
                      {organizations.map((o) => (
                        <option key={o.id} value={String(o.id)}>{o.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="inline-block truncate">
                      {(() => {
                        const id = affiliations[0];
                        const name = id != null ? (organizations.find(o => String(o.id) === String(id))?.name || "") : "";
                        return name || <span className="text-secondary">—</span>;
                      })()}
                    </span>
                  )}
                </FieldRow>
              </div>

              <SectionCard title="Communication Preferences">
                <div className="mb-3 flex flex-wrap gap-2">
                  {["Email", "SMS", "Phone", "Mail", "WhatsApp"].map((k) => {
                    const key = k.toLowerCase(); const on = !!(d as any)?.commPrefs?.[key];
                    return drawerEditing ? (
                      <PillToggle
                        key={key}
                        label={k}
                        on={on}
                        onClick={() =>
                          setDraft(p => ({
                            ...(p || {}),
                            // merge against current draft OR current record so nothing gets wiped
                            commPrefs: { ...((p?.commPrefs) || (d as any)?.commPrefs || {}), [key]: !on }
                          }))
                        }
                      />
                    ) : (
                      <span
                        key={key}
                        className={[
                          "inline-flex items-center rounded-full px-3 h-7 text-[13px] leading-none select-none",
                          on ? "bg-[hsl(var(--brand-orange))] text-black" : "bg-surface border border-hairline text-primary"
                        ].join(" ")}
                      >
                        {k}
                      </span>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  <FieldRow label="Email">
                    {drawerEditing ? (
                      <input
                        className="w-full h-10 rounded-md border border-hairline bg-surface px-2.5 text-sm outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
                        value={d?.email || ""}
                        onChange={(e) => { const v = getEventValue(e); setDraft(p => ({ ...(p || {}), email: v })); }}
                      />
                    ) : (
                      d?.email ? (
                        <a
                          className="underline underline-offset-2 inline-block truncate align-middle"
                          href={`mailto:${d.email}`}
                        >
                          {d.email}
                        </a>
                      ) : (
                        <span className="text-secondary">—</span>
                      )
                    )}
                  </FieldRow>

                  <FieldRow label="Phone">
                    {drawerEditing ? (
                      <IntlPhoneField
                        value={d?.phone || ""}
                        onChange={(next) =>
                          setDraft((p) => ({
                            ...(p || {}),
                            phone: next,
                          }))
                        }
                        inferredCountryName={countryNameFromValue(draft?.country ?? d?.country, countries)}
                        countries={countries}
                        className="w-full"
                      />
                    ) : d?.phone ? (
                      <span className="inline-block align-middle truncate">
                        {formatPhone(String(d?.phone || ""), countryCodeFor(d?.country))}
                      </span>
                    ) : (
                      <span className="text-secondary">—</span>
                    )}
                  </FieldRow>

                  <FieldRow label="WhatsApp">
                    {drawerEditing ? (
                      <IntlPhoneField
                        value={(d as any)?.commPrefs?.whatsappPhone || ""}
                        onChange={(next) =>
                          setDraft((p) => ({
                            ...(p || {}),
                            commPrefs: { ...(p?.commPrefs || (d as any)?.commPrefs || {}), whatsappPhone: next }
                          }))
                        }
                        inferredCountryName={countryNameFromValue(draft?.country ?? d?.country, countries)}
                        countries={countries}
                        className="w-full"
                      />
                    ) : (d as any)?.commPrefs?.whatsappPhone ? (
                      <span className="inline-block align-middle truncate">
                        {formatPhone(String((d as any).commPrefs.whatsappPhone || ""), countryCodeFor(d?.country))}
                      </span>
                    ) : (
                      <span className="text-secondary">—</span>
                    )}
                  </FieldRow>
                </div>
              </SectionCard>

              <SectionCard
                title="Tags"
                right={
                  <TagsPopover
                    tags={contactTags || []}
                    selected={d?.tags || []}
                    onToggle={(k) => setDraft(p => {
                      const cur = new Set<string>(p?.tags || d?.tags || []);
                      cur.has(k) ? cur.delete(k) : cur.add(k);
                      return { ...(p || {}), tags: Array.from(cur) };
                    })}
                  />
                }
              >
                <div className="flex flex-wrap gap-2">
                  {(d?.tags || []).length
                    ? Array.from(new Set(d!.tags!)).map(t => <span key={t} className="rounded-full border border-hairline bg-surface px-3 py-1 text-sm">{t}</span>)
                    : <span className="text-secondary text-sm">No tags</span>}
                </div>
              </SectionCard>

              <SectionCard title="Sales & Marketing">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <MiniStat label="Lead Status" value={drawer.leadStatus || "—"} />
                  <MiniStat label="Last Contacted" value={formatDate(drawer.lastContacted)} />
                  <MiniStat label="Next Follow-up" value={formatDate(drawer.nextFollowUp)} />
                  <MiniStat label="Status" value={drawer.status || "—"} />
                </div>
              </SectionCard>

              <SectionCard title="Compliance">
                <div className="mb-2 text-xs text-secondary">System sets these from unsubscribes. Toggle**€œOverride” to set manually; action is logged on Save.</div>
                <div className="flex items-center gap-6 flex-wrap">
                  {(["email", "sms"] as const).map((key) => {
                    const on = !!(d as any)?.compliance?.[key];
                    const override = !!(d as any)?.complianceOverride?.[key];
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="w-10 text-sm uppercase">{key.toUpperCase()}</span>
                        {drawerEditing && override
                          ? (
                            <select
                              className="h-8 rounded-full bg-surface border border-hairline px-2 text-sm"
                              value={
                                (key === "email"
                                  ? ((d as any)?.emailStatus ?? ((d as any)?.compliance?.email ? "subscribed" : "unsubscribed"))
                                  : ((d as any)?.smsStatus ?? ((d as any)?.compliance?.sms ? "subscribed" : "unsubscribed")))
                              }
                              onChange={(e) => {
                                const next = (getEventValue(e) ?? "") as "subscribed" | "unsubscribed";
                                setDraft((p) => ({
                                  ...(p || {}),
                                  ...(key === "email" ? { emailStatus: next } : { smsStatus: next }),
                                  compliance: {
                                    ...(p?.compliance || {}),
                                    [key]: next === "subscribed",
                                  },
                                }));
                              }}
                            >
                              <option value="subscribed">subscribed</option>
                              <option value="unsubscribed">unsubscribed</option>
                            </select>
                          )
                          : <span className="rounded-full px-2 py-0.5 border border-hairline bg-surface-strong text-xs">{on ? "subscribed" : "unsubscribed"}</span>}
                        {drawerEditing && (
                          <label className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={override}
                              onChange={(e) => {
                                const checked = !!e?.currentTarget?.checked;
                                setDraft((p) => ({
                                  ...(p || {}),
                                  complianceOverride: { ...(p?.complianceOverride || {}), [key]: checked },
                                  ...(checked
                                    ? (key === "email"
                                      ? { emailStatus: (p as any)?.emailStatus ?? "unsubscribed" }
                                      : { smsStatus: (p as any)?.smsStatus ?? "unsubscribed" })
                                    : (key === "email" ? { emailStatus: null } : { smsStatus: null })
                                  ),
                                }));
                              }}
                            />
                            Override
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

              <SectionCard title="Finances">
                {(() => {
                  const payments = Array.isArray((drawer as any)?.payments) ? (drawer as any).payments : [];
                  const totalPayments = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
                  const balanceDue = Number((drawer as any)?.balanceDue ?? 0);
                  const balanceUnpaid = Math.max(balanceDue - totalPayments, 0);
                  const $ = (n: number) => new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <MiniStat label="Balance Unpaid" value={$(balanceUnpaid)} />
                      <MiniStat label="Total Payments" value={$(totalPayments)} />
                    </div>
                  );
                })()}
                <div>
                  <div className="text-xs uppercase tracking-wide text-secondary mb-1">Deposit Holds</div>
                  <div className="overflow-hidden rounded border border-hairline bg-surface">
                    <table className="w-full text-sm">
                      <thead className="text-secondary">
                        <tr><th className="text-left px-3 py-2">Offspring Group</th><th className="text-left px-3 py-2">Queue Position</th></tr>
                      </thead>
                      <tbody>
                        {Array.isArray((drawer as any)?.depositHolds) && (drawer as any).depositHolds.length
                          ? (drawer as any).depositHolds.map((h: any, i: number) => (
                            <tr key={i} className="border-t border-hairline/60">
                              <td className="px-3 py-2">{h.groupName || <span className="text-secondary">—</span>}</td>
                              <td className="px-3 py-2">{h.queuePosition ?? <span className="text-secondary">—</span>}</td>
                            </tr>
                          ))
                          : <tr><td className="px-3 py-2 text-secondary" colSpan={2}>No deposit holds</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Notes">
                {drawerEditing
                  ? (
                    <textarea
                      className="w-full rounded border border-hairline bg-surface px-3 py-2 text-sm outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
                      rows={5}
                      value={d?.notes || ""}
                      onChange={(e) => { const v = getEventValue(e); setDraft(p => ({ ...(p || {}), notes: v })); }}
                    />
                  )
                  : <div className="text-sm whitespace-pre-wrap">{d?.notes || <span className="text-secondary">No notes</span>}</div>}
              </SectionCard>
            </div>
          )}

          {drawerTab === "animals" && (
            <div className="space-y-2">
              <p className="text-sm text-secondary">Open Animals filtered by this owner in a new tab.</p>
              <a href={`#/animals?ownerId=${encodeURIComponent(String(drawer.id))}`} className="inline-flex items-center gap-2 rounded px-3 py-2 bg-surface border border-hairline hover:bg-[hsl(var(--brand-orange))]/12">Go to Animals</a>
            </div>
          )}

          {drawerTab === "audit" && (
            <div className="space-y-4">
              <SectionCard title="Dates">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <MiniStat label="Created" value={formatOrUnknown(drawer.createdAt)} />
                  <MiniStat label="Last Modified" value={formatOrUnknown(drawer.updatedAt)} />
                </div>
              </SectionCard>

              <SectionCard title="Change Log">
                {auditLoading && <div className="text-secondary text-sm">Loading audit…</div>}
                {!auditLoading && auditError && (
                  <div className="text-red-400 text-sm">Error: {auditError}</div>
                )}
                {!auditLoading && !auditError && auditRows.length === 0 && (
                  <div className="text-secondary text-sm">No audit entries.</div>
                )}

                {!auditLoading && !auditError && auditRows.length > 0 && (
                  <div className="overflow-hidden rounded border border-hairline">
                    <table className="w-full text-sm bg-surface">
                      <thead className="text-secondary">
                        <tr>
                          <th className="text-left px-3 py-2 w-[140px]">When</th>
                          <th className="text-left px-3 py-2 w-[160px]">Action</th>
                          <th className="text-left px-3 py-2 w-[120px]">Field</th>
                          <th className="text-left px-3 py-2">Change</th>
                          <th className="text-left px-3 py-2 w-[200px]">By</th>
                          <th className="text-left px-3 py-2 w-[220px]">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {auditRows.map((r) => {
                          const when = formatOrUnknown(r.createdAt);
                          const who = r.userEmail || r.userId || "system";
                          const change = r.field
                            ? `${JSON.stringify(r.before ?? null)} -> ${JSON.stringify(r.after ?? null)}`
                            : `${JSON.stringify(r.before ?? null)} -> ${JSON.stringify(r.after ?? null)}`;
                          return (
                            <tr key={r.id}>
                              <td className="px-3 py-2 whitespace-nowrap">{when}</td>
                              <td className="px-3 py-2">{r.action}</td>
                              <td className="px-3 py-2">{r.field || "—"}</td>
                              <td className="px-3 py-2 font-mono text-xs break-all">{change}</td>
                              <td className="px-3 py-2">{who}</td>
                              <td className="px-3 py-2">{r.reason || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>
            </div>
          )}
        </RightDrawer >
      )
      }

      {/* Create/Edit modal */}
      {formOpen && (
        <Dialog
          onClose={() => setFormOpen(false)}
          title={editingId == null ? "Create Contact" : "Edit Contact"}
        >
          {/* Scoped readability (doesn't rely on Tailwind variants) */}
          <style>{`
  .bhq-form-readable { color: hsl(var(--foreground)); font-size: 0.875rem; }
  .bhq-form-readable label { color: hsl(var(--secondary)); }

  /* Force text + bg for all controls in the modal */
  .bhq-form-readable :where(input, select, textarea) {
    color: hsl(var(--foreground)) !important;
    background-color: hsl(var(--surface)) !important;
    caret-color: hsl(var(--foreground)) !important;
  }
  .bhq-form-readable ::placeholder {
    color: hsl(var(--secondary)) !important;
    opacity: .9 !important;
  }

  /* WebKit autofill (Chrome/Edge/Safari) */
  .bhq-form-readable input:-webkit-autofill,
  .bhq-form-readable input:-webkit-autofill:hover,
  .bhq-form-readable input:-webkit-autofill:focus,
  .bhq-form-readable textarea:-webkit-autofill,
  .bhq-form-readable select:-webkit-autofill {
    -webkit-text-fill-color: hsl(var(--foreground)) !important;
    -webkit-box-shadow: 0 0 0px 1000px hsl(var(--surface)) inset !important;
    transition: background-color 100000s ease-in-out 0s;
  }
`}</style>

          <div className="bhq-form-readable text-primary">
            <form
              onSubmit={submitForm}
              className="space-y-4"
              data-1p-ignore
              autoComplete="off"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 auto-rows-min">
                {/* Identity */}
                <LabeledInputBare
                  label={<span>First name<RequiredMark /></span>}
                  value={String(form.firstName ?? "")}
                  onChange={(v) => setForm((f) => ({ ...f, firstName: v }))}
                  required
                  invalid={formTriedSubmit && !String(form.firstName ?? "").trim()}
                />
                <LabeledInputBare
                  label={<span>Last name<RequiredMark /></span>}
                  value={String(form.lastName ?? "")}
                  onChange={(v) => setForm((f) => ({ ...f, lastName: v }))}
                  required
                  invalid={formTriedSubmit && !String(form.lastName ?? "").trim()}
                />
                <LabeledInputBare
                  label="Preferred / Nickname"
                  value={String(form.nickname ?? "")}
                  onChange={(v) => setForm((f) => ({ ...f, nickname: v }))}
                />

                {/* Organization */}
                <div className="sm:col-span-2">
                  <label className="block text-xs mb-1">Organizational Association</label>
                  <div className="relative">
                    <select
                      className="w-full h-10 appearance-none pr-8 rounded-md bg-surface border border-hairline px-3 text-sm text-primary placeholder:text-secondary outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
                      value={form.organizationId != null ? String(form.organizationId) : ""}
                      onChange={(e) => {
                        const v = (e.currentTarget?.value ?? "");
                        setForm((f) => ({ ...f, organizationId: v ? Number(v) : null }));
                      }}
                    >
                      <option value="">Select Organization</option>
                      {organizations.map((o) => (
                        <option key={o.id} value={String(o.id)}>
                          {o.name ?? `Org #${o.id}`}
                        </option>
                      ))}
                    </select>
                    <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M5.5 7.5l4.5 4 4.5-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* Email */}
                <LabeledInputBare
                  label="Email"
                  type="email"
                  value={String(form.email ?? "")}
                  onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                />

                {/* ===== PHONES (3 rows: Cell, Landline, WhatsApp) –– REPLACEMENT ===== */}
                <div className="sm:col-span-2 space-y-3">

                  {/* Row 1: Cell */}
                  <div>
                    <label className="block text-xs mb-1">Cell Phone</label>
                    <IntlPhoneField
                      value={String(form.phone ?? "")}
                      onChange={(next) => setForm((f) => ({ ...f, phone: next }))}
                      inferredCountryName={countryNameFromValue(form.country, countries)}
                      countries={countries}
                      className="w-full max-w-[640px]"
                    />
                  </div>

                  {/* Row 2: Landline */}
                  <div>
                    <label className="block text-xs mb-1">Landline</label>
                    <IntlPhoneField
                      value={String((form as any)?.landline ?? "")}
                      onChange={(next) => setForm((f: any) => ({ ...f, landline: next }))}
                      inferredCountryName={countryNameFromValue(form.country, countries)}
                      countries={countries}
                      className="w-full max-w-[640px]"
                    />
                  </div>

                  {/* Row 3: WhatsApp */}
                  <div>
                    <label className="block text-xs mb-1">WhatsApp</label>
                    <IntlPhoneField
                      value={String((form as any)?.commPrefs?.whatsappPhone ?? "")}
                      onChange={(next) =>
                        setForm((f: any) => ({
                          ...f,
                          commPrefs: { ...(f?.commPrefs || {}), whatsappPhone: next },
                        }))
                      }
                      inferredCountryName={countryNameFromValue(form.country, countries)}
                      countries={countries}
                      className="w-full max-w-[640px]"
                    />
                    <div className="text-xs text-secondary mt-1">
                      If Cell Phone is left empty, this will be used as the phone on save.
                    </div>
                  </div>
                </div>


                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs mb-1">Street</label>
                  <input
                    className="w-full h-10 rounded-md border border-hairline bg-surface px-3 text-sm text-primary placeholder:text-secondary outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
                    value={String(form.street ?? "")}
                    onChange={(e) => setForm((f) => ({ ...f, street: getEventValue(e) }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs mb-1">Street 2</label>
                  <input
                    className="w-full h-10 rounded-md border border-hairline bg-surface px-3 text-sm text-primary placeholder:text-secondary outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
                    value={String(form.street2 ?? "")}
                    onChange={(e) => setForm((f) => ({ ...f, street2: getEventValue(e) }))}
                  />
                </div>

                <LabeledInputBare
                  label="City"
                  value={String(form.city ?? "")}
                  onChange={(v) => setForm((f) => ({ ...f, city: v }))}
                />

                <div>
                  <div>
                    <label className="block text-xs mb-1">State / Region</label>
                    <div className="relative">
                      {(() => {
                        const code = asCountryCode(form.country, countries).toUpperCase();
                        return code === "US" ? (
                          <select
                            key="state-select-create"
                            className="w-full h-10 appearance-none pr-8 rounded-md bg-surface border border-hairline px-3 text-sm text-primary placeholder:text-secondary outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
                            value={String(form.state ?? "")}
                            onChange={(e) => setForm((f) => ({ ...f, state: e.currentTarget.value }))}
                          >
                            <option value="">—</option>
                            {US_STATES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            key="state-input-create"
                            className="w-full h-10 rounded-md border border-hairline px-3 text-sm"
                            placeholder="State / Region"
                            value={String(form.state ?? "")}
                            onChange={(e) => setForm(f => ({ ...f, state: e.currentTarget.value }))}
                          />
                        );
                      })()}
                      <svg
                        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path d="M5.5 7.5l4.5 4 4.5-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div >

              {/* Zip + Country (same row) */}
              < div >
                <label className="block text-xs mb-1">Zip / Postal code</label>
                {(() => {
                  const code = asCountryCode(form.country, countries).toUpperCase();
                  const isUS = code === "US";
                  return (
                    <input
                      className="h-10 w-full rounded-md border border-hairline px-3 text-sm outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
                      placeholder="Postal Code"
                      inputMode={isUS ? "numeric" : "text"}
                      pattern={isUS ? "[0-9]*" : undefined}
                      onKeyDown={isUS ? allowOnlyDigitKeys : undefined}
                      onPaste={(e) => {
                        if (!isUS) return;
                        e.preventDefault();
                        const v = e.clipboardData.getData("text") || "";
                        setForm(f => ({ ...f, postalCode: digitsOnly(v) }));
                      }}
                      value={String(form.postalCode ?? "")}
                      onChange={(e) => {
                        const raw = e.currentTarget.value;
                        setForm(f => ({ ...f, postalCode: isUS ? digitsOnly(raw) : raw }));
                      }}
                    />
                  );
                })()}
              </div >
              <div>
                <label className="block text-xs mb-1">Country</label>
                <div className="relative">
                  <select
                    className="w-full h-10 appearance-none pr-8 rounded-md bg-surface border border-hairline px-3 text-sm text-primary placeholder:text-secondary outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
                    value={String(form.country ?? (countries.length ? countries[0].code : "US"))}
                    onChange={(e) => setForm((f) => ({ ...f, country: getEventValue(e) }))}
                  >
                    {!countries.length ? <option value="US">United States</option> : null}
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M5.5 7.5l4.5 4 4.5-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form >
          </div >
        </Dialog >
      )
      }
    </>
  );
}

/****************************************************************************”€ Subcomponents**************************************************************************”€ */

function DateRange({ label, from, to, onFrom, onTo }: { label: string; from: string | undefined; to: string | undefined; onFrom: (v: string) => void; onTo: (v: string) => void; }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs text-secondary">{label}</div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Input type="text" placeholder="mm/dd/yyyy" value={from || ""} onChange={(e) => onFrom((e.currentTarget?.value ?? ""))} className="h-10 w-full rounded-full bg-surface border border-hairline px-3" />
        <span className="text-secondary text-xs whitespace-nowrap">to</span>
        <Input type="text" placeholder="mm/dd/yyyy" value={to || ""} onChange={(e) => onTo((e.currentTarget?.value ?? ""))} className="h-10 w-full rounded-full bg-surface border border-hairline px-3" />
      </div>
    </div>
  );
}

function FieldRow({ label, children, className = "" }: { label: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={["grid grid-cols-[auto_1fr] items-center gap-x-2", className].join(" ")}>
      <div className="text-sm text-secondary whitespace-nowrap">{label}:</div>
      <div className="min-w-0 text-sm leading-5 text-primary">{children}</div>
    </div>
  );
}

function SectionCard({ title, children, right, className = "" }: { title: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; className?: string; }) {
  return (
    <div className={["rounded-xl border border-hairline bg-surface p-3", className].join(" ")}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase tracking-wide text-secondary">{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}
function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded border border-hairline bg-surface px-3 py-2">
      <div className="text-xs text-secondary mb-1 uppercase tracking-wide">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
function PillToggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "pill inline-flex items-center rounded-full px-3 h-7 text-[13px] leading-none select-none transition-colors",
        on
          ? "bg-[hsl(var(--brand-orange))] text-black hover:brightness-95"
          : "bg-surface border border-hairline text-primary hover:bg-[hsl(var(--brand-orange))]/12"
      ].join(" ")}
    >
      {label}
    </button>
  );
}

/** Tags chooser (portal) that only lists tag names; shows "None available" when empty */
function TagsPopover({
  tags,
  selected,
  onToggle,
}: {
  tags: string[];
  selected: string[];
  onToggle: (k: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  const filtered = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    const base = Array.from(new Set((tags || []).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    return t ? base.filter(x => x.toLowerCase().includes(t)) : base;
  }, [tags, q]);

  React.useEffect(() => {
    if (!open) return;
    const W = 320, PAD = 12;
    const sync = () => {
      const el = btnRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const left = Math.max(PAD, Math.min(window.innerWidth - W - PAD, r.left));
      const top = r.bottom + 8;
      setPos({ top, left });
    };
    const onScroll = () => sync();
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open]);

  const body = open && pos ? createPortal(
    <>
      {/* Backdrop (force-max z-index with inline style) */}
      <div
        onClick={() => setOpen(false)}
        style={{ position: "fixed", inset: 0, zIndex: 2147483644, background: "transparent", pointerEvents: "auto" }}
      />
      {/* Panel (force-max z-index with inline style) */}
      <div
        role="menu"
        className="rounded-xl border border-hairline bg-surface text-primary shadow-[0_8px_30px_hsla(0,0%,0%,0.35)] max-w-[calc(100vw-24px)] w-[320px]"
        style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 2147483645 }}
      >
        <div className="p-2 border-b border-hairline flex items-center gap-2">
          <input
            autoFocus
            placeholder="Search tags…"
            value={q}
            onChange={(e) => setQ(getEventValue(e))}
            className="w-full rounded-md border border-hairline bg-surface px-2 py-1.5 text-sm outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
          />
          <Button variant="outline" size="sm" onClick={() => setQ("")}>Clear</Button>
        </div>

        <div className="max-h-[300px] overflow-auto py-1">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-secondary">{tags?.length ? "No matches" : "None available"}</div>
          )}
          {filtered.map((t) => {
            const on = selected?.some(s => s.toLowerCase() === t.toLowerCase());
            return (
              <label
                key={t}
                onClick={() => onToggle(t)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(t); } }}
                tabIndex={0}
                role="checkbox"
                aria-checked={on}
                className="group grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2 hover:bg-[hsl(var(--brand-orange))]/12 cursor-pointer select-none"
              >
                <span className="truncate">{t}</span>
                <span className={["relative h-4 w-4 rounded-[4px] grid place-items-center", on ? "border border-[hsl(var(--brand-orange))]" : "border border-hairline"].join(" ")}>
                  {on ? <span className="absolute inset-0 m-auto h-2 w-2 rounded-sm bg-[hsl(var(--brand-orange))]" /> : null}
                </span>
              </label>
            );
          })}
        </div>

        <div className="p-2 border-t border-hairline text-right">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Close</Button>
        </div>
      </div>
    </>,
    getOverlayRoot()
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-2 rounded-md border border-hairline bg-surface-strong px-2 py-1 text-xs text-secondary hover:text-primary"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Manage
      </button>
      {body}
    </>
  );
}

/** Simple filter row that matches the filter keys used in the memoized filtering */
/** Checklist popover for spreadsheet-style filtering (multi-select) */
function ChecklistFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  const lower = (s: string) => s.toLowerCase();
  const opts = React.useMemo(() => {
    const uq = Array.from(new Set(options.filter(Boolean))).sort((a, b) => a.localeCompare(b));
    const t = q.trim().toLowerCase();
    return t ? uq.filter(o => lower(o).includes(t)) : uq;
  }, [options, q]);

  React.useEffect(() => {
    function sync() {
      const el = btnRef.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const W = 320, pad = 12;
      const left = Math.max(pad, Math.min(window.innerWidth - W - pad, r.left));
      const top = r.bottom + 8;
      setPos({ top, left });
    }
    function getScrollParents(el: HTMLElement | null) {
      const out: HTMLElement[] = [];
      let p = el?.parentElement || null;
      while (p) {
        const s = getComputedStyle(p);
        if (/(auto|scroll|overlay)/.test(`${s.overflow}${s.overflowY}${s.overflowX}`)) out.push(p);
        p = p.parentElement;
      }
      return out;
    }

    if (!open) return;

    const parents = getScrollParents(btnRef.current);
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, { passive: true });
    parents.forEach(n => n.addEventListener("scroll", sync, { passive: true }));

    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync);
      parents.forEach(n => n.removeEventListener("scroll", sync));
    };
  }, [open]);

  const toggle = (k: string) => {
    const set = new Set(selected);
    set.has(k) ? set.delete(k) : set.add(k);
    onChange(Array.from(set));
  };

  const body = open && pos ? createPortal(
    <>
      <div
        className="fixed inset-0 z-[9998]"
        style={{ background: "transparent", pointerEvents: "auto" }}
        onClick={() => setOpen(false)}
      />
      <div className="fixed z-[9999] w-[320px] max-w-[calc(100vw-24px)] rounded-xl border border-hairline bg-surface text-primary shadow-[0_8px_30px_hsla(0,0%,0%,0.35)]"
        style={{ top: pos.top, left: pos.left }}>
        <div className="p-2 border-b border-hairline flex items-center gap-2">
          <input
            autoFocus
            placeholder={`Search ${label.toLowerCase()}…`}
            value={q}
            onChange={(e) => setQ(getEventValue(e))}
            className="w-full rounded-md border border-hairline bg-surface px-2 py-1.5 text-sm outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
          />
          <Button variant="outline" size="sm" onClick={() => onChange([])}>None</Button>
          <Button variant="outline" size="sm" onClick={() => onChange(options)}>All</Button>
        </div>
        <div className="max-h-[300px] overflow-auto py-1">
          {opts.map(o => {
            const checked = selected.some(s => s.toLowerCase() === o.toLowerCase());
            return (
              <label
                key={o}
                onClick={() => toggle(o)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(o); } }}
                role="checkbox"
                aria-checked={checked}
                tabIndex={0}
                className="group grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2 hover:bg-[hsl(var(--brand-orange))]/12 cursor-pointer select-none"
              >
                <span className="truncate">{o}</span>
                <span className={["relative h-4 w-4 rounded-[4px] grid place-items-center", checked ? "border border-[hsl(var(--brand-orange))]" : "border border-hairline"].join(" ")}>
                  {checked ? <span className="absolute inset-0 m-auto h-2 w-2 rounded-sm bg-[hsl(var(--brand-orange))]" /> : null}
                </span>
              </label>
            );
          })}
          {opts.length === 0 && <div className="px-3 py-2 text-secondary">No matches</div>}
        </div>
        <div className="p-2 border-t border-hairline text-right">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Close</Button>
        </div>
      </div>
    </>,
    getOverlayRoot()
  ) : null;

  return (
    <div className="flex items-center gap-2">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-2 rounded-md border border-hairline bg-surface px-2 py-1 text-xs text-secondary hover:text-primary"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Choose…
      </button>
      {selected.length > 0 ? (
        <div className="text-xs text-primary truncate">{selected.join(", ")}</div>
      ) : (
        <div className="text-xs text-secondary">All</div>
      )}
      {body}
    </div>
  );
}

function FilterRow({
  columns,
  filters,
  rows,
  onChange,
  organizations,
}: {
  columns: Record<string, boolean>;
  filters: Record<string, string>;
  rows: ContactRow[];
  onChange: (next: Record<string, string>) => void;
  organizations: Array<{ id: ID; name: string }>;
}) {
  const set = (k: string, v: string) => onChange({ ...filters, [k]: v });

  // Visible columns from the toggle map
  const visible = ALL_COLUMNS.filter(c => columns[c.key]);

  // Split visible into text and date fields
  const textCols = visible.filter(c => c.type !== "date");
  const statusOpts = Array.from(new Set((rows || []).map(r => String(r.status || "").trim()).filter(Boolean))).sort();
  const orgOpts = Array.from(new Set(
    (rows || []).map(r =>
      resolveOrgName(r.organizationId, r.organizationName, organizations)
    ).filter(Boolean)
  )).sort();
  const tagOpts = Array.from(new Set((rows || []).flatMap(r => (r.tags || [])).map(t => String(t).trim()).filter(Boolean))).sort();

  const getList = (s: string) => String(s || "").split(",").map(x => x.trim()).filter(Boolean);
  const setList = (k: string, list: string[]) => onChange({ ...filters, [k]: list.join(", ") });

  const dateCols = visible.filter(c => c.type === "date");

  return (
    <div className="space-y-3">
      {/* Global search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="col-span-1 sm:col-span-2 lg:col-span-3">
          <label className="block text-xs font-medium text-secondary mb-1">Search all fields</label>
          <Input
            placeholder="Type to filter…"
            value={filters.__text || ""}
            onChange={e => set("__text", getEventValue(e))}
            className="w-full"
          />
        </div>
      </div>

      {/* Column-specific text filters */}
      {textCols.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {textCols.map(c => {
            const k = String(c.key);
            const v = filters[k] || "";
            if (k === "status") {
              const sel = getList(v);
              return (
                <div key={k}>
                  <label className="block text-xs font-medium text-secondary mb-1">{c.label}</label>
                  <ChecklistFilter
                    label="Status"
                    options={statusOpts}
                    selected={sel}
                    onChange={(next) => setList(k, next)}
                  />
                </div>
              );
            }
            if (k === "organizationName") {
              const sel = getList(v);
              return (
                <div key={k}>
                  <label className="block text-xs font-medium text-secondary mb-1">{c.label}</label>
                  <ChecklistFilter
                    label="Organization"
                    options={orgOpts}
                    selected={sel}
                    onChange={(next) => setList(k, next)}
                  />
                </div>
              );
            }
            if (k === "tags") {
              const sel = getList(v);
              return (
                <div key={k}>
                  <label className="block text-xs font-medium text-secondary mb-1">{c.label}</label>
                  <ChecklistFilter
                    label="Tags"
                    options={tagOpts}
                    selected={sel}
                    onChange={(next) => setList(k, next)}
                  />
                </div>
              );
            }
            // default text input (contains)
            return (
              <div key={k}>
                <label className="block text-xs font-medium text-secondary mb-1">{c.label}</label>
                <Input
                  placeholder={k === "phone" ? "Digits match (e.g. 555)" : `Filter ${c.label}`}
                  value={v}
                  onChange={e => set(k, getEventValue(e))}
                  className="w-full"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Date range filters: uses <key>Start and <key>End like your memo expects */}
      {dateCols.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {dateCols.map(c => {
            const k = String(c.key);
            return (
              <div key={k} className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">{c.label} start</label>
                  <Input
                    type="date"
                    value={filters[`${k}Start`] || ""}
                    onChange={e => set(`${k}Start`, getEventValue(e))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">{c.label} end</label>
                  <Input
                    type="date"
                    value={filters[`${k}End`] || ""}
                    onChange={e => set(`${k}End`, getEventValue(e))}
                    className="w-full"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={() => onChange({})}>Clear</Button>
      </div>
    </div>
  );
}

function RightDrawer({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] isolate">
      {/* compact control normalization (unchanged) */}
      <style>{`
        .force-10 input,
        .force-10 select,
        .force-10 textarea,
        .force-10 button:not(.pill) {
          height: 40px !important;
          min-height: 40px !important;
          line-height: 40px !important;
        }
        .force-10 textarea { height: auto !important; min-height: 120px !important; line-height: 1.4 !important; }
        .force-10 .h-8, .force-10 .h-9, .force-10 .h-11, .force-10 .h-[38px] { height: 40px !important; }
        .force-10 input, .force-10 select { padding-top: 8px !important; padding-bottom: 8px !important; }
        .force-10 .section-tight > * + * { margin-top: 12px; }
      `}</style>


      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Container: mobile = right sheet, desktop = centered modal */}
      <div
        className="
    absolute inset-0
    flex
    justify-end            /* mobile: slide-in from right */
    sm:justify-center      /* desktop: center horizontally */
    items-stretch
    sm:items-start         /* desktop: anchor to top */
    p-2 sm:px-6 sm:pt-10 sm:pb-6
  "
      >
        <div
          className="
            force-10
            bg-surface border border-hairline text-primary shadow-2xl rounded-none sm:rounded-xl
            w-[min(100vw,680px)]  /* mobile-ish width */
            sm:w-[min(96vw,960px)]  /* desktop: wider */
            h-full                /* mobile: full height sheet */
            sm:h-auto sm:max-h-[92vh] /* desktop: capped height */
            flex flex-col
          "
        >
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-hairline bg-surface rounded-t-xl">
            <h2 className="h1-strong text-primary">{title}</h2>
            <button onClick={onClose} className="rounded px-2 py-1 hover:bg-[hsl(var(--brand-orange))]/12" aria-label="Close">âœ•</button>
          </div>

          <div className="flex-1 overflow-auto section-tight px-4 sm:px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>,
    getOverlayRoot()
  );
}


function Dialog({
  onClose,
  title,
  children,
}: { onClose: () => void; title: string; children: React.ReactNode }) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const node = (
    <div style={{ position: "fixed", inset: 0, zIndex: 2147483646 }}>
      <style>{`
  /* Scope only to the create/edit contact modal */
  .bhq-form-readable { color-scheme: dark; }

  /* Hard colors so we don't depend on theme vars in the portal */
  :root { --bhq-fg: #e6e8ee; --bhq-fg-dim: #b9beca; --bhq-fg-subtle: #9aa3b2; --bhq-bg: #111319; }

  /* Inputs, selects, textareas (native) */
  .bhq-form-readable :where(input, select, textarea) {
    color: var(--bhq-fg) !important;
    background-color: var(--bhq-bg) !important;
    border-color: rgba(255,255,255,.18) !important;
    caret-color: var(--bhq-fg) !important;
    -webkit-text-fill-color: var(--bhq-fg) !important; /* Chrome/Safari */
  }
  .bhq-form-readable ::placeholder {
    color: var(--bhq-fg-subtle) !important;
    opacity: 1 !important;
  }
  .bhq-form-readable :where(input, select, textarea):disabled {
    color: var(--bhq-fg-dim) !important;
    background-color: #0d0f14 !important;
  }

  /* Native dropdown options (many browsers ignore parent color) */
  .bhq-form-readable select option {
    color: var(--bhq-fg) !important;
    background-color: var(--bhq-bg) !important;
  }

  /* WebKit autofill repaint */
  .bhq-form-readable input:-webkit-autofill,
  .bhq-form-readable textarea:-webkit-autofill,
  .bhq-form-readable select:-webkit-autofill {
    -webkit-text-fill-color: var(--bhq-fg) !important;
    -webkit-box-shadow: 0 0 0 1000px var(--bhq-bg) inset !important;
    transition: background-color 99999s ease-in-out 0s;
  }

  /* If @bhq/ui paints its own wrapper, catch those too */
  .bhq-form-readable .bhq-input,
  .bhq-form-readable .bhq-input input,
  .bhq-form-readable .bhq-select,
  .bhq-form-readable .bhq-textarea {
    color: var(--bhq-fg) !important;
    background-color: var(--bhq-bg) !important;
    border-color: rgba(255,255,255,.18) !important;
    -webkit-text-fill-color: var(--bhq-fg) !important;
  }
`}</style>

      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.40)",
          backdropFilter: "blur(4px)",
          cursor: "pointer",
        }}
      />

      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "16px",
          paddingTop: "10vh",
          pointerEvents: "none",
        }}
      >
        <div
          className="border border-hairline bg-surface shadow-2xl rounded-xl force-10"
          style={{ width: "min(92vw, 640px)", pointerEvents: "auto" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
        >
          <div className="flex items-center justify-between border-b border-hairline px-4 py-3 bg-surface">
            <h2 id="dialog-title" className="text-primary font-semibold">{title}</h2>
            <button onClick={onClose} className="rounded px-2 py-1 hover:bg-[hsl(var(--brand-orange))]/12" aria-label="Close">âœ•</button>
          </div>
          <div className="p-4 section-tight">{children}</div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, getOverlayRoot());
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={["relative px-3 py-2 text-sm rounded-t-md transition", active ? "bg-surface text-primary border-x border-t border-hairline" : "text-secondary hover:bg-[hsl(var(--brand-orange))]/12"].join(" ")}>
      {children}{active && <span className="absolute left-0 right-0 -bottom-px h-px bg-[hsl(var(--brand-orange))]" />}
    </button>
  );
}
