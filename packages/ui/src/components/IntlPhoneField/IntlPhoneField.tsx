import * as React from "react";
import { createPortal } from "react-dom";
import { getOverlayRoot, getFlyoutRoot } from "../../overlay";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Ctry = { code: string; name: string };

export type PhoneValue = {
  countryCode: string;   // ISO-2 (e.g., "US")
  callingCode: string;   // with plus (e.g., "+1")
  national: string;      // formatted local (e.g., "(201) 555-0123")
  e164: string | null;   // "+12015550123" or null if no digits
};

type ValueProp = string | PhoneValue;

type Props = {
  value?: ValueProp;
  onChange: (next: ValueProp) => void;

  inferredCountryName?: string;
  countries?: Ctry[];
  dialMap?: Record<string, string>; // ISO => dial, e.g., { US: "1", GB: "44", ... }

  className?: string;
  placeholderNANP?: string;
};

/* -------------------------------------------------------------------------- */
/* Data & utils                                                               */
/* -------------------------------------------------------------------------- */

const DIAL_BY_ISO_DEFAULT: Record<string, string> = {
  US: "1", CA: "1", MX: "52", GB: "44", IE: "353", FR: "33", DE: "49", ES: "34", IT: "39",
  AU: "61", NZ: "64", BR: "55", AR: "54", CL: "56", CO: "57", PE: "51", VE: "58",
  CN: "86", HK: "852", JP: "81", KR: "82", IN: "91", PK: "92", BD: "880",
  SA: "966", AE: "971", IL: "972", TR: "90", EG: "20", ZA: "27", NG: "234", KE: "254",
  NO: "47", SE: "46", FI: "358", DK: "45", NL: "31", BE: "32", LU: "352", CH: "41",
  AT: "43", PL: "48", CZ: "420", SK: "421", HU: "36", GR: "30", PT: "351",
  RO: "40", BG: "359", HR: "385", SI: "386", RS: "381", UA: "380",
  SG: "65", TH: "66", MY: "60", PH: "63", ID: "62", VN: "84",
  RU: "7", KZ: "7",
};

const NANP = "1";
const onlyDigits = (s: string) => (s || "").replace(/\D+/g, "");

const isoToFlag = (iso: string) =>
  String.fromCodePoint(...iso.toUpperCase().split("").map(ch => 0x1f1e6 - 65 + ch.charCodeAt(0)));

const e164Value = (cc: string, rest: string) => {
  const digits = onlyDigits(rest);
  return digits ? `+${String(cc || "").replace(/\D/g, "")}${digits}` : "";
};

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

const parseIncoming = (val: ValueProp | undefined, dialMap: Record<string, string>) => {
  if (!val) return { mode: "string" as const, cc: "", rest: "", iso: "US" };
  if (typeof val === "string") {
    const s = val.trim();
    if (!s) return { mode: "string" as const, cc: "", rest: "", iso: "US" };
    if (s.startsWith("+")) {
      const digits = s.slice(1).replace(/\D/g, "");
      const known = Array.from(new Set(Object.values(dialMap))).sort((a, b) => b.length - a.length);
      for (const dial of known) {
        if (digits.startsWith(dial)) {
          const iso = Object.keys(dialMap).find(k => dialMap[k] === dial) || "US";
          return { mode: "string" as const, cc: dial, rest: digits.slice(dial.length), iso };
        }
      }
      return { mode: "string" as const, cc: digits.slice(0, 1), rest: digits.slice(1), iso: "US" };
    }
    const m = s.match(/^([A-Za-z]{2})\s*(.*)$/);
    if (m) {
      const iso = m[1].toUpperCase();
      const dial = dialMap[iso] || "";
      return { mode: "string" as const, cc: dial, rest: onlyDigits(m[2] || ""), iso: iso || "US" };
    }
    return { mode: "string" as const, cc: "", rest: onlyDigits(s), iso: "US" };
  } else {
    // Object mode
    const iso = (val.countryCode || "US").toUpperCase();
    const cc = (val.callingCode || "").replace(/\D/g, "") || (dialMap[iso] || "");
    const rest = onlyDigits(val.national || (val.e164 || "").replace(/^\+\d+/, ""));
    return { mode: "object" as const, cc, rest, iso };
  }
};

const buildPhoneValue = (iso: string, cc: string, rest: string): PhoneValue => ({
  countryCode: iso,
  callingCode: cc ? `+${cc}` : "",
  national: formatLocal(rest, cc || NANP),
  e164: e164Value(cc || NANP, rest) || null,
});

function findDialFromCountryName(name?: string, list?: Ctry[], dialMap?: Record<string, string>) {
  if (!name || !list?.length) return undefined;
  const hit = list.find(c => c.name.toUpperCase() === name.toUpperCase());
  return hit ? (dialMap?.[hit.code.toUpperCase()] ?? DIAL_BY_ISO_DEFAULT[hit.code.toUpperCase()]) : undefined;
}

function useDefaultCountries(fallback: Ctry[] | undefined, dialMap: Record<string, string>): Ctry[] {
  return React.useMemo(() => {
    if (fallback && fallback.length) return fallback;
    let dn: Intl.DisplayNames | null = null;
    try {
      dn = typeof Intl !== "undefined" && (Intl as any).DisplayNames
        ? new (Intl as any).DisplayNames(
          [typeof navigator !== "undefined" ? navigator.language : "en"],
          { type: "region" }
        )
        : null;
    } catch { dn = null; }

    const list = Object.keys(dialMap).map((code) => ({
      code,
      name: (dn && dn.of(code)) || code,
    }));
    list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    return list;
  }, [fallback, dialMap]);
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function IntlPhoneField({
  value,
  onChange,
  inferredCountryName,
  countries,
  dialMap,
  className,
  placeholderNANP = "(201) 555-5555",
}: Props) {
  const DIAL = dialMap && Object.keys(dialMap).length ? dialMap : DIAL_BY_ISO_DEFAULT;

  // Parse incoming value
  const parsedIn = React.useMemo(() => parseIncoming(value, DIAL), [value, DIAL]);

  // Default countries & inferred dial
  const allCountries = useDefaultCountries(countries, DIAL);
  const inferredDial = React.useMemo(
    () => findDialFromCountryName(inferredCountryName, allCountries, DIAL),
    [inferredCountryName, allCountries, DIAL]
  );

  // Keep a selected country even when there are no digits, so "United States" can be selected first.
  const [selectedIso, setSelectedIso] = React.useState<string>(() => {
    if (parsedIn.iso) return parsedIn.iso;
    const byInferred = allCountries.find(c => (DIAL[c.code] || "") === (inferredDial || ""))?.code;
    return byInferred || "US";
  });

  // If parent changes to a different country (e.g., they paste +44...), sync it.
  React.useEffect(() => {
    if (parsedIn.cc) {
      const iso = Object.keys(DIAL).find(k => DIAL[k] === parsedIn.cc);
      if (iso) setSelectedIso(iso);
    }
  }, [parsedIn.cc, DIAL]);

  // Compute which calling code to show:
  const ccEffective = parsedIn.cc || DIAL[selectedIso] || inferredDial || NANP;
  const local = formatLocal(parsedIn.rest, ccEffective);

  // Dropdown UI state
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const dropRef = React.useRef<HTMLDivElement | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const searchRef = React.useRef<HTMLInputElement | null>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  // Position/focus dropdown
  React.useEffect(() => {
    if (!open) return;
    const sync = () => {
      const el = btnRef.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const W = 340, pad = 12;
      const left = Math.max(pad, Math.min(window.innerWidth - W - pad, r.left));
      const top = r.bottom + 8;
      setPos({ top, left });
    };
    const parents: HTMLElement[] = [];
    let p = btnRef.current?.parentElement || null;
    while (p) {
      const s = getComputedStyle(p);
      if (/(auto|scroll|overlay)/.test(`${s.overflow}${s.overflowY}${s.overflowX}`)) parents.push(p);
      p = p.parentElement;
    }
    sync();
    const onScroll = () => sync();
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", onScroll, { passive: true });
    parents.forEach(n => n.addEventListener("scroll", sync, { passive: true }));
    const t = setTimeout(() => searchRef.current?.focus(), 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", onScroll);
      parents.forEach(n => n.removeEventListener("scroll", sync));
    };
  }, [open]);

  // Close on outside pointerup and Escape
  React.useEffect(() => {
    if (!open) return;
    const onUp = (e: MouseEvent | PointerEvent) => {
      const target = e.target as Node;
      const btn = btnRef.current;
      const drop = dropRef.current;
      if (btn && !btn.contains(target) && drop && !drop.contains(target)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerup", onUp, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Ensure wheel scroll works inside the list
  React.useEffect(() => {
    const el = listRef.current;
    if (!open || !el) return;
    const onWheel = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener("wheel", onWheel, { passive: true });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open]);

  // Filter list
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, "");
    if (!q) return allCountries;
    return allCountries.filter(c => {
      const name = c.name.toLowerCase();
      const dial = (DIAL[c.code.toUpperCase()] || "").toLowerCase();
      return name.includes(q) || dial.includes(q);
    });
  }, [allCountries, query, DIAL]);

  // Emit helpers (support both modes)
  const emit = (nextIso: string, nextCc: string, nextRest: string) => {
    if (typeof value === "string" || value === undefined) {
      const e164 = e164Value(nextCc, nextRest);
      onChange(e164);
    } else {
      onChange(buildPhoneValue(nextIso, nextCc, nextRest));
    }
  };

  // Pick a country (works even with empty number; updates internal state & output model)
  const pickCountry = (iso: string) => {
    const upper = iso.toUpperCase();
    const nextCc = DIAL[upper] || NANP;
    setSelectedIso(upper);
    emit(upper, nextCc, parsedIn.rest);
    setOpen(false);
    setQuery("");
  };

  // Local number change
  const onLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.currentTarget.value || "";
    const digits = onlyDigits(raw);

    const ccDigits = String(ccEffective).replace(/\D/g, "");
    const maxRest = Math.max(0, 15 - ccDigits.length);
    const limit = ccDigits === "1" ? 10 : maxRest;

    const trimmed = digits.slice(0, limit);
    emit(selectedIso, ccEffective, trimmed);
  };

  // Paste handling
  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const txt = e.clipboardData.getData("text") || "";
    const s = txt.trim();

    if (s.startsWith("+")) {
      const digits = s.slice(1).replace(/\D/g, "");
      const known = Array.from(new Set(Object.values(DIAL))).sort((a, b) => b.length - a.length);
      for (const dial of known) {
        if (digits.startsWith(dial)) {
          const iso = Object.keys(DIAL).find(k => DIAL[k] === dial) || selectedIso;
          setSelectedIso(iso);
          const rest = digits.slice(dial.length);
          emit(iso, dial, rest);
          return;
        }
      }
    }
    emit(selectedIso, ccEffective, onlyDigits(s));
  };

  // Build dropdown
  const dropdown = open && pos ? createPortal(
    <div
      ref={dropRef}
      role="menu"
      className="rounded-xl border border-hairline bg-surface text-primary shadow-[0_8px_30px_hsla(0,0%,0%,0.35)] max-w-[calc(100vw-24px)] w-[320px]"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        zIndex: 2147483647,
        pointerEvents: "auto",
      }}
    >
      <div className="p-2 border-b border-hairline">
        <input
          ref={searchRef}
          placeholder="Search country or code…"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          className="w-full rounded-md border border-hairline bg-surface px-2 py-1.5 text-sm outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
        />
      </div>
      <div
        ref={listRef}
        className="max-h-[300px] overflow-auto py-1 overscroll-contain"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {filtered.map(c => {
          const iso = c.code.toUpperCase();
          const dial = DIAL[iso] || "";
          return (
            <button
              key={iso}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); pickCountry(iso); }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[hsl(var(--brand-orange))]/12 text-left"
              role="option"
              aria-selected={iso === selectedIso}
            >
              <span className="shrink-0">{isoToFlag(iso)}</span>
              <span className="flex-1 truncate">{c.name}</span>
              <span className="shrink-0 text-secondary">{dial ? `+${dial}` : ""}</span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-3 py-2 text-secondary">No matches</div>
        )}
      </div>
    </div>,
    (() => {
      // Prefer flyout root (highest z), then overlay, then body.
      const mount: HTMLElement =
        (getFlyoutRoot() as HTMLElement | null) ??
        (getOverlayRoot() as HTMLElement | null) ??
        (typeof document !== "undefined" ? document.body : (null as unknown as HTMLElement));
      if (mount) mount.style.pointerEvents = "auto";
      return mount;
    })()
  ) : null;

  // Compute displayed country label
  const displayName =
    allCountries.find(c => c.code.toUpperCase() === selectedIso)?.name ||
    allCountries.find(c => (DIAL[c.code.toUpperCase()] || "") === ccEffective)?.name ||
    "United States";

  return (
    <div className={["grid grid-cols-[minmax(140px,200px)_1fr] gap-2", className].filter(Boolean).join(" ")}>
      <div className="relative">
        <button
          ref={btnRef}
          type="button"
          onClick={() => setOpen(v => !v)}
          className="w-full h-10 inline-flex items-center gap-2 rounded-md border border-hairline bg-surface px-2.5 text-sm text-primary outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="shrink-0">{isoToFlag(selectedIso)}</span>
          <span className="truncate">{displayName}</span>
          <span className="ml-auto shrink-0 text-secondary">+{ccEffective}</span>
          <svg viewBox="0 0 20 20" className="ml-2 h-4 w-4 opacity-70" aria-hidden="true">
            <path fill="currentColor" d="M5.5 7.5l4.5 4 4.5-4" />
          </svg>
        </button>
        {dropdown}
      </div>

      <input
        inputMode="tel"
        autoComplete="tel"
        placeholder={ccEffective === NANP ? placeholderNANP : "Phone number"}
        className="w-full h-10 rounded-md border border-hairline bg-surface px-2.5 text-sm text-primary outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
        value={local}
        onChange={onLocalChange}
        onPaste={onPaste}
      />
    </div>
  );
}
