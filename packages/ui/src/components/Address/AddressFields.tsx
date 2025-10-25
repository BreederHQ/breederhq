// @bhq/ui/address/AddressFields.tsx
import * as React from "react";

export type AddressValue = {
  country?: string | null;
  region?: string | null;
  city?: string | null;
  postalCode?: string | null;
  street?: string | null;
  street2?: string | null;
  lat?: number | null;
  lng?: number | null;
};

type ZipLookupResult = Partial<Pick<AddressValue, "city"|"region"|"lat"|"lng">>;

export type AddressFieldsProps = {
  value: AddressValue;
  onChange: (next: AddressValue) => void;
  required?: Partial<Record<keyof AddressValue, boolean>>;
  disabled?: Partial<Record<keyof AddressValue, boolean>>;
  labels?: Partial<Record<keyof AddressValue, string>>;
  placeholder?: Partial<Record<keyof AddressValue, string>>;
  countryPriority?: string[];
  getRegionOptions?: (countryName: string) => string[];
  zipLookup?: (countryName: string, postalCode: string) => Promise<ZipLookupResult | null>;
  variant?: "compact" | "regular";
  className?: string;
};

function cls(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

/** Countries: localized, complete on modern browsers; degrades gracefully. */
export function useCountries(): string[] {
  return React.useMemo(() => {
    // Preferred modern path
    const codes: string[] =
      (typeof Intl !== "undefined" &&
        (Intl as any).supportedValuesOf &&
        (Intl as any).supportedValuesOf("region")) || [];

    const iso2 = codes.filter((c) => /^[A-Z]{2}$/.test(c));
    let dn: Intl.DisplayNames | null = null;
    try {
      dn =
        (Intl as any).DisplayNames
          ? new (Intl as any).DisplayNames(
              [typeof navigator !== "undefined" ? navigator.language : "en"],
              { type: "region" }
            )
          : null;
    } catch { dn = null; }

    const names = iso2.map((code) => (dn ? (dn as any).of(code) : code)).filter(Boolean) as string[];
    const unique = Array.from(new Set(names));
    unique.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    return unique.length ? unique : ["United States"]; // minimal fallback
  }, []);
}

/** Common built-in regions; you can expand as needed or swap via getRegionOptions */
export const REGIONS: Record<string, string[]> = {
  "United States": [
    "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia",
    "Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts",
    "Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey",
    "New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island",
    "South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
    "Wisconsin","Wyoming","District of Columbia"
  ],
  Canada: [
    "Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador","Nova Scotia",
    "Ontario","Prince Edward Island","Quebec","Saskatchewan","Northwest Territories","Nunavut","Yukon"
  ],
  Australia: ["Australian Capital Territory","New South Wales","Northern Territory","Queensland","South Australia","Tasmania","Victoria","Western Australia"],
  "United Kingdom": ["England","Northern Ireland","Scotland","Wales"],
};

const useDebounced = <T,>(value: T, ms = 350) => {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
};

export function AddressFields({
  value,
  onChange,
  required,
  disabled,
  labels,
  placeholder,
  countryPriority = ["United States"],
  getRegionOptions,
  zipLookup,
  variant = "regular",
  className,
}: AddressFieldsProps) {
  const countries = useCountries();
  const orderedCountries = React.useMemo(() => {
    const prioSet = new Set(countryPriority);
    const head = countryPriority.filter((n) => countries.includes(n));
    const tail = countries.filter((n) => !prioSet.has(n));
    return [...head, ...tail];
  }, [countries, countryPriority]);

  const country = value.country || "";
  const postal = value.postalCode || "";
  const debPostal = useDebounced(postal);

  const regionOptions =
    (country && getRegionOptions?.(country)) ||
    (country && REGIONS[country]) ||
    null;

  // ZIP/Postal auto-fill (optional)
  React.useEffect(() => {
    let gone = false;
    (async () => {
      if (!zipLookup) return;
      if (!country || !debPostal) return;
      // Heuristics: short-circuit for implausible postals (keeps calls down)
      if (debPostal.length < 3) return;

      try {
        const res = await zipLookup(country, debPostal);
        if (gone || !res) return;

        const next: AddressValue = { ...value };
        if (!next.city && res.city) next.city = res.city;
        if (!next.region && res.region) next.region = res.region;
        if (res.lat != null) next.lat = res.lat!;
        if (res.lng != null) next.lng = res.lng!;
        onChange(next);
      } catch {
        // Silently ignore lookup errors (UX first)
      }
    })();
    return () => { gone = true; };
  }, [country, debPostal, zipLookup]); // eslint-disable-line

  const label = (k: keyof AddressValue, fallback: string) => labels?.[k] || fallback;
  const ph     = (k: keyof AddressValue, fallback: string) => placeholder?.[k] || fallback;
  const req    = (k: keyof AddressValue) => !!required?.[k];
  const dis    = (k: keyof AddressValue) => !!disabled?.[k];

  const rowCls = variant === "compact" ? "grid grid-cols-1 sm:grid-cols-2 gap-2" : "grid grid-cols-1 sm:grid-cols-2 gap-3";
  const inputCls = "w-full h-9 rounded-md border border-hairline bg-surface px-2 text-sm text-primary outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]";

  return (
    <div className={cls("contents", className)}>
      {/* Street lines */}
      <div className="sm:col-span-2">
        <div className="text-xs text-secondary mb-1">
          {label("street", "Street")} {req("street") && <span className="text-[hsl(var(--brand-orange))]">*</span>}
        </div>
        <input
          className={inputCls}
          value={value.street || ""}
          onChange={(e) => onChange({ ...value, street: e.currentTarget.value })}
          placeholder={ph("street", "123 Main St")}
          disabled={dis("street")}
        />
      </div>

      <div className="sm:col-span-2">
        <div className="text-xs text-secondary mb-1">{label("street2", "Street 2")}</div>
        <input
          className={inputCls}
          value={value.street2 || ""}
          onChange={(e) => onChange({ ...value, street2: e.currentTarget.value })}
          placeholder={ph("street2", "Apt, suite, etc.")}
          disabled={dis("street2")}
        />
      </div>

      {/* City / Region */}
      <div className={rowCls}>
        <div>
          <div className="text-xs text-secondary mb-1">
            {label("city", "City")} {req("city") && <span className="text-[hsl(var(--brand-orange))]">*</span>}
          </div>
          <input
            className={inputCls}
            value={value.city || ""}
            onChange={(e) => onChange({ ...value, city: e.currentTarget.value })}
            placeholder={ph("city", "City")}
            disabled={dis("city")}
          />
        </div>

        <div>
          <div className="text-xs text-secondary mb-1">{label("region", "State / Region")}</div>
          {regionOptions ? (
            <select
              className={inputCls}
              value={value.region || ""}
              onChange={(e) => onChange({ ...value, region: e.currentTarget.value })}
              disabled={dis("region")}
            >
              <option value="">Select…</option>
              {regionOptions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          ) : (
            <input
              className={inputCls}
              value={value.region || ""}
              onChange={(e) => onChange({ ...value, region: e.currentTarget.value })}
              placeholder={ph("region", "State / Region")}
              disabled={dis("region")}
            />
          )}
        </div>
      </div>

      {/* Postal / Country */}
      <div className={rowCls}>
        <div>
          <div className="text-xs text-secondary mb-1">{label("postalCode", "Zip / Postal code")}</div>
          <input
            className={inputCls}
            value={value.postalCode || ""}
            onChange={(e) => onChange({ ...value, postalCode: e.currentTarget.value })}
            placeholder={ph("postalCode", "e.g., 94105")}
            disabled={dis("postalCode")}
          />
        </div>

        <div>
          <div className="text-xs text-secondary mb-1">
            {label("country", "Country")} {req("country") && <span className="text-[hsl(var(--brand-orange))]">*</span>}
          </div>
          <select
            className={inputCls}
            value={country}
            onChange={(e) => onChange({ ...value, country: e.currentTarget.value, region: "" /* reset region when country changes */ })}
            disabled={dis("country")}
          >
            {orderedCountries.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
