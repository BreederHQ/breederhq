import * as React from "react";
import { useCountries } from "../../hooks";

export type Country = { code: string; name: string };

export type CountrySelectProps = {
  /** Accepts ISO-3166 alpha-2 or country name; emits an ISO code on change */
  value?: string | null;
  onChange: (code: string) => void;
  countries?: Country[];
  placeholder?: string;
  className?: string;
};

type CountriesHookReturn =
  | Country[]
  | { list: Country[]; byCode?: (code?: string | null) => Country | null; regionsFor?: (code?: string | null) => string[] };

function normalizeToCode(value?: string | null, list?: Country[]) {
  const v = String(value ?? "").trim();
  if (!v) return "";
  const up = v.toUpperCase();
  const byCode = list?.find(c => c.code.toUpperCase() === up)?.code;
  if (byCode) return byCode;
  const byName = list?.find(c => c.name.toUpperCase() === up)?.code;
  return byName || v;
}

function displayName(value?: string | null, list?: Country[]) {
  const v = String(value ?? "");
  if (!v || !list?.length) return "";
  const byCode = list.find(c => c.code.toUpperCase() === v.toUpperCase());
  if (byCode) return byCode.name;
  const byName = list.find(c => c.name.toUpperCase() === v.toUpperCase());
  return byName ? byName.name : v;
}

export function CountrySelect({
  value,
  onChange,
  countries: external,
  placeholder = "Country",
  className,
}: CountrySelectProps) {
  const internal = useCountries() as CountriesHookReturn;

  // Normalize to an array for UI usage
  const items: Country[] = React.useMemo(() => {
    if (external && external.length) return external;
    const src = internal as any;
    return Array.isArray(src) ? (src as Country[]) : (src?.list ?? []);
  }, [external, internal]);

  const code = normalizeToCode(value, items);

  return (
    <div className={["relative", className].filter(Boolean).join(" ")}>
      <select
        className="w-full h-10 appearance-none pr-8 rounded-md bg-surface border border-hairline px-3 text-sm text-primary outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
        value={code}
        onChange={(e) => onChange(e.currentTarget.value)}
        aria-label="Country"
      >
        <option value="">{placeholder}</option>
        {items.map((c: Country) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path d="M5.5 7.5l4.5 4 4.5-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// helpers you might reuse in forms
export const countryHelpers = { normalizeToCode, displayName };
