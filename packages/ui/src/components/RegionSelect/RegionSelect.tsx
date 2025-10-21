import * as React from "react";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","MA","MD",
  "ME","MI","MN","MO","MS","MT","NC","ND","NE","NH","NJ","NM","NV","NY","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VA","VT","WA","WI","WV","WY"
];

export type RegionSelectProps = {
  countryCode?: string | null;      // ISO alpha-2, e.g. "US"
  value?: string | null;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
};

export function RegionSelect({ countryCode, value, onChange, placeholder = "State / Region", className }: RegionSelectProps) {
  const code = String(countryCode || "").toUpperCase();
  const isUS = code === "US";
  if (isUS) {
    return (
      <div className={["relative", className].filter(Boolean).join(" ")}>
        <select
          className="w-full h-10 appearance-none pr-8 rounded-md bg-surface border border-hairline px-3 text-sm text-primary outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
          value={value ?? ""}
          onChange={(e) => onChange(e.currentTarget.value)}
          aria-label="State"
        >
          <option value="">{placeholder}</option>
          {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5.5 7.5l4.5 4 4.5-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  return (
    <input
      className={["w-full h-10 rounded-md border border-hairline bg-surface px-3 text-sm text-primary outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]", className].filter(Boolean).join(" ")}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => onChange(e.currentTarget.value)}
      aria-label="Region"
    />
  );
}
