import * as React from "react";

export type Country = { code: string; name: string; dial?: string; regions?: string[] };

/**
 * Minimal country data set; extend as needed.
 * Keep codes as ISO-3166-1 alpha-2.
 */
const COUNTRIES: Country[] = [
  { code: "US", name: "United States", dial: "1",  regions: ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"] },
  { code: "CA", name: "Canada",       dial: "1",  regions: ["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"] },
  { code: "GB", name: "United Kingdom", dial: "44" },
  { code: "AU", name: "Australia",     dial: "61" },
  { code: "NZ", name: "New Zealand",   dial: "64" },
];

/**
 * useCountries
 * - returns a stable array of countries and some helpers
 */
export function useCountries() {
  const list = React.useMemo(() => COUNTRIES.slice(), []);
  const byCode = React.useCallback((code?: string | null) => {
    const c = String(code ?? "").toUpperCase();
    return list.find(x => x.code === c) || null;
  }, [list]);
  const regionsFor = React.useCallback((code?: string | null) => {
    return byCode(code)?.regions ?? [];
  }, [byCode]);

  return { list, byCode, regionsFor };
}
