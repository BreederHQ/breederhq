import * as React from "react";
import { createPortal } from "react-dom";
import { getOverlayRoot } from "../../overlay";

type Ctry = { code: string; name: string };

const DIAL_BY_ISO: Record<string, string> = {
  US:"1", CA:"1", MX:"52", GB:"44", IE:"353", FR:"33", DE:"49", ES:"34", IT:"39",
  AU:"61", NZ:"64", BR:"55", AR:"54", CL:"56", CO:"57", PE:"51", VE:"58",
  CN:"86", HK:"852", JP:"81", KR:"82", IN:"91", PK:"92", BD:"880",
  SA:"966", AE:"971", IL:"972", TR:"90", EG:"20", ZA:"27", NG:"234", KE:"254",
  NO:"47", SE:"46", FI:"358", DK:"45", NL:"31", BE:"32", LU:"352", CH:"41",
  AT:"43", PL:"48", CZ:"420", SK:"421", HU:"36", GR:"30", PT:"351",
  RO:"40", BG:"359", HR:"385", SI:"386", RS:"381", UA:"380",
  SG:"65", TH:"66", MY:"60", PH:"63", ID:"62", VN:"84",
  RU:"7", KZ:"7",
};

const NANP = "1";
const onlyDigits = (s: string) => (s || "").replace(/\D+/g, "");
const isoToFlag = (iso: string) =>
  String.fromCodePoint(...iso.toUpperCase().split("").map(ch => 0x1f1e6 - 65 + ch.charCodeAt(0)));

const parseE164 = (v?: string) => {
  if (!v) return { cc: "", rest: "" };
  const s = String(v).trim();
  if (s.startsWith("+")) {
    const digits = s.slice(1).replace(/\D/g, "");
    const known = Array.from(new Set(Object.values(DIAL_BY_ISO))).sort((a,b)=>b.length-a.length);
    for (const dial of known) {
      if (digits.startsWith(dial)) return { cc: dial, rest: digits.slice(dial.length) };
    }
    return { cc: digits.slice(0,1), rest: digits.slice(1) };
  }
  const m = s.match(/^([A-Za-z]{2})\s*(.*)$/);
  if (m) {
    const dial = DIAL_BY_ISO[m[1].toUpperCase()] || "";
    return { cc: dial, rest: onlyDigits(m[2] || "") };
  }
  return { cc: "", rest: onlyDigits(s) };
};
const e164Value = (cc: string, rest: string) => `+${String(cc || "").replace(/\D/g, "")}${onlyDigits(rest)}`;

const formatLocal = (rest: string, cc: string) => {
  const d = onlyDigits(rest);
  if (cc === NANP) {
    const a = d.slice(0,3), b = d.slice(3,6), c = d.slice(6,10);
    if (d.length <= 3) return a;
    if (d.length <= 6) return `(${a}) ${b}`;
    return `(${a}) ${b}-${c}`;
  }
  const groups: string[] = [];
  for (let i=0;i<d.length;) {
    const take = i === 0 ? 3 : 4;
    groups.push(d.slice(i, i+take));
    i += take;
  }
  return groups.filter(Boolean).join(" ");
};

function findDialFromCountryName(name?: string, list?: Ctry[]) {
  if (!name || !list?.length) return undefined;
  const hit = list.find(c => c.name.toUpperCase() === name.toUpperCase());
  return hit ? DIAL_BY_ISO[hit.code.toUpperCase()] : undefined;
}

export type IntlPhoneFieldProps = {
  value?: string;
  onChange: (next: string) => void;
  inferredCountryName?: string;
  countries?: Ctry[];
  className?: string;
  placeholderNANP?: string;
};

export function IntlPhoneField({
  value,
  onChange,
  inferredCountryName,
  countries = [],
  className,
  placeholderNANP = "(201) 555-5555"
}: IntlPhoneFieldProps) {
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
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", onScroll);
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
    const raw = e.currentTarget.value || "";
    const digits = onlyDigits(raw);

    const ccDigits = String(cc).replace(/\D/g, "");
    const maxRest = Math.max(0, 15 - ccDigits.length);
    const limit = ccDigits === "1" ? 10 : maxRest;

    const trimmed = digits.slice(0, limit);
    onChange(e164Value(cc, trimmed));
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const txt = e.clipboardData.getData("text");
    const parsed2 = parseE164(txt);
    const newCc = parsed2.cc || cc;

    const ccDigits = String(newCc).replace(/\D/g, "");
    const maxRest = Math.max(0, 15 - ccDigits.length);
    const limit = ccDigits === "1" ? 10 : maxRest;

    const trimmedRest = onlyDigits(parsed2.rest).slice(0, limit);
    onChange(e164Value(newCc, trimmedRest));
  };

  const dropdown = open && pos ? createPortal(
    <>
      <div
        onClick={() => setOpen(false)}
        style={{ position: "fixed", inset: 0, zIndex: 2147483644, background: "transparent", pointerEvents: "auto" }}
      />
      <div
        role="menu"
        className="rounded-xl border border-hairline bg-surface text-primary shadow-[0_8px_30px_hsla(0,0%,0%,0.35)] max-w-[calc(100vw-24px)] w-[320px]"
        style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 2147483645 }}
      >
        <div className="p-2 border-b border-hairline">
          <input
            autoFocus
            placeholder="Search country or code…"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
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
          <span className="truncate">{countries.find(c => c.code.toUpperCase() === selectedIso)?.name || "United States"}</span>
          <span className="ml-auto shrink-0 text-secondary">+{cc}</span>
          <svg viewBox="0 0 20 20" className="ml-2 h-4 w-4 opacity-70"><path fill="currentColor" d="M5.5 7.5l4.5 4 4.5-4" /></svg>
        </button>
        {dropdown}
      </div>

      <input
        inputMode="tel"
        autoComplete="tel"
        placeholder={cc === NANP ? placeholderNANP : "Phone number"}
        className="w-full h-10 rounded-md border border-hairline bg-surface px-2.5 text-sm text-primary outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
        value={local}
        onChange={onLocalChange}
        onPaste={onPaste}
      />
    </div>
  );
}

