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
  DetailsHost,
  DetailsScaffold,
  // DetailsSpecRenderer, // not used here
  SectionCard,
  Button,
  Input,
  buildRangeAwareSchema,
  inDateRange,
  OwnershipChips,
  OwnershipEditor,
  CustomBreedDialog,
  BreedCombo,
} from "@bhq/ui";
import { Overlay, getOverlayRoot } from "@bhq/ui/overlay";
import "@bhq/ui/styles/table.css";
import { makeApi } from "./api";
import {
  resolveCycleLengthDays,
  projectUpcomingCycles,
  fromPlan,
  windowsToCalendarEvents,
  DEFAULT_STAGE_LABELS,
  type Species as MathSpecies,
} from "@bhq/ui/utils/breedingMath";

/** ────────────────────────────────────────────────────────────────────────
 * Types & utils
 * ─────────────────────────────────────────────────────────────────────── */
type OwnershipRow = {
  partyType: "Organization" | "Contact";
  organizationId?: number | null;
  contactId?: number | null;
  display_name?: string | null;
  is_primary?: boolean;
  percent?: number;
};

type AnimalRow = {
  id: number;
  name: string;
  nickname?: string | null;
  species?: string | null;
  breed?: string | null;
  sex?: string | null;
  status?: string | null;
  ownerName?: string | null;
  microchip?: string | null;
  tags: string[];
  notes?: string | null;

  dob?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  lastCycle?: string | null;

  cycleStartDates?: string[]; // persisted via API
};

type ProgramFlags = {
  holdUntil?: string | null;            // ISO date the animal is on hold until for program reasons
  embargoReason?: string | null;        // short text like health clearance pending
  allowExternalStud?: boolean | null;   // for males
  disqualifiers?: string[] | null;      // genetic or structural disqualifiers
  notes?: string | null;                // program notes that are not offspring related
};

type PreferredPartner = { id: number; name: string; sex?: string | null };

const COLUMNS: Array<{ key: keyof AnimalRow & string; label: string; default?: boolean }> = [
  { key: "name", label: "Name", default: true },
  { key: "species", label: "Species", default: true },
  { key: "breed", label: "Breed", default: true },
  { key: "sex", label: "Sex", default: true },
  { key: "status", label: "Status", default: true },
  { key: "ownerName", label: "Owner", default: false },
  { key: "microchip", label: "Microchip #", default: false },
  { key: "tags", label: "Tags", default: true },
  { key: "dob", label: "DOB", default: false },
  { key: "created_at", label: "Created", default: false },
  { key: "updated_at", label: "Updated", default: false },
];

const SPECIES_LABEL: Record<string, string> = { DOG: "Dog", CAT: "Cat", HORSE: "Horse" };
const SEX_LABEL: Record<string, string> = { FEMALE: "Female", MALE: "Male" };
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  BREEDING: "Breeding",
  UNAVAILABLE: "Unavailable",
  RETIRED: "Retired",
  DECEASED: "Deceased",
  PROSPECT: "Prospect",
};
function asLabel(map: Record<string, string>, v?: string | null) {
  if (!v) return null;
  const key = String(v).toUpperCase();
  return map[key] ?? v; // fall back if API sends a new value
}

const STORAGE_KEY = "bhq_animals_cols_v1";
const DATE_KEYS = new Set(["dob", "created_at", "updated_at"] as const);

function fmt(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  if (!Number.isFinite(dt.getTime())) return String(d).slice(0, 10) || "";
  return dt.toLocaleDateString();
}
function ageInMonths(d?: string | null): number | null {
  if (!d) return null;
  const dob = new Date(d);
  if (!Number.isFinite(dob.getTime())) return null;
  const now = new Date();
  const months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
  return Math.max(0, months);
}

function animalToRow(p: any): AnimalRow {
  return {
    id: Number(p.id),
    name: p.name,
    nickname: p.nickname ?? null,
    species: asLabel(SPECIES_LABEL, p.species) ?? null,
    breed: p.breed ?? null,
    sex: asLabel(SEX_LABEL, p.sex) ?? null,
    status: asLabel(STATUS_LABEL, p.status) ?? "Active",
    ownerName: p.ownerName ?? p.owner?.name ?? null,
    microchip: p.microchip ?? null,
    tags: Array.isArray(p.tags) ? p.tags : [],
    notes: p.notes ?? null,
    dob: p.dob ?? p.birthDate ?? null,
    created_at: p.created_at ?? p.createdAt ?? null,
    updated_at: p.updated_at ?? p.updatedAt ?? null,
    lastCycle: p.lastCycle ?? null,
    cycleStartDates: Array.isArray(p.cycleStartDates) ? p.cycleStartDates : [],
  };
}

async function safeGetCreatingOrg(api: any) {
  try {
    const org = await api?.lookups?.getCreatingOrganization?.();
    if (org && org.id != null) return org;
  } catch {}
  try {
    const id = localStorage.getItem("BHQ_ORG_ID");
    if (id) return { id, display_name: localStorage.getItem("BHQ_ORG_NAME") || "My Organization" };
  } catch {}
  return null;
}

const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

/** ────────────────────────────────────────────────────────────────────────
 * Cycle Tab (calendar edit, icon delete + confirm, persisted) — breeders only
 * ─────────────────────────────────────────────────────────────────────── */
function CycleTab({
  animal,
  api,
  onSaved,
}: {
  animal: AnimalRow;
  api: any;
  onSaved: (dates: string[]) => void;
}) {
  const [dates, setDates] = React.useState<string[]>(() => [...(animal.cycleStartDates || [])].sort());
  const [editing, setEditing] = React.useState<Record<string, boolean>>({});

  const add = (v: string) => {
    if (!v) return;
    const next = Array.from(new Set([...dates, v])).sort();
    setDates(next);
  };

  const remove = async (d: string) => {
    if (!confirm("Delete this cycle start date?")) return;
    const next = dates.filter((x) => x !== d);
    setDates(next);
  };

  const persist = async () => {
    try {
      await api?.animals?.putCycleStartDates?.(animal.id, dates);
    } catch {}
    onSaved(dates);
  };

  const species: MathSpecies =
    (String(animal.species || "DOG").toUpperCase() as MathSpecies) || "DOG";

  const heatHistory = React.useMemo(() => ({ heatStarts: dates }), [dates]);

  const learned = React.useMemo(() => resolveCycleLengthDays(species, heatHistory, null), [species, heatHistory]);

  const lastHeatIso = dates.length ? dates[dates.length - 1] : null;
  const projected: string[] = React.useMemo(() => {
    if (!lastHeatIso) return [];
    return projectUpcomingCycles(lastHeatIso, learned.days, 2);
  }, [lastHeatIso, learned.days]);

  const preview = React.useMemo(() => {
    if (!projected.length) return null;
    const nextHeat = projected[0];
    const w = fromPlan(
      {
        species,
        earliestHeatStart: nextHeat,
        latestHeatStart: nextHeat,
        ovulationDate: null,
      },
      {}
    );

    const events = windowsToCalendarEvents(String(animal.id), DEFAULT_STAGE_LABELS, w);

    const byType = (t: "full" | "likely") =>
      events.filter((e) => (e.meta as any)?.type === t && (e.meta as any)?.stage !== "availability");

    // availability detection resilient to label changes
    const availability = events.filter((e) => {
      const st = String((e.meta as any)?.stage || "").toLowerCase();
      return st.startsWith("availability");
    });

    return { windows: w, full: byType("full"), likely: byType("likely"), availability };
  }, [projected, species, animal.id]);

  const pretty = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString() : "—");

  return (
    <div className="space-y-2">
      <SectionCard title="Cycle Summary">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-xs text-secondary">Last Heat Start</div>
            <div>{pretty(lastHeatIso)}</div>
          </div>
          <div>
            <div className="text-xs text-secondary">Cycle Length (days)</div>
            <div>
              {learned.days} <span className="text-secondary text-xs">({learned.source})</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-secondary">Next Projected Cycle Start</div>
            <div>{projected.length ? projected.map(pretty).join(" • ") : "—"}</div>
          </div>
        </div>
      </SectionCard>

      {preview && (
        <SectionCard title="Upcoming Windows (Preview)">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-xs text-secondary mb-1">Full Windows</div>
              <ul className="space-y-1">
                {preview.full.map((e) => (
                  <li key={e.id}>
                    <span className="text-primary">{e.title.replace(" (Full)", "")}:</span>{" "}
                    {pretty(e.start.toISOString().slice(0, 10))} →{" "}
                    {pretty(new Date(e.end.getTime() - 86400000).toISOString().slice(0, 10))}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs text-secondary mb-1">Likely Windows</div>
              <ul className="space-y-1">
                {preview.likely.map((e) => (
                  <li key={e.id}>
                    <span className="text-primary">{e.title.replace(" (Likely)", "")}:</span>{" "}
                    {pretty(e.start.toISOString().slice(0, 10))} →{" "}
                    {pretty(new Date(e.end.getTime() - 86400000).toISOString().slice(0, 10))}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs text-secondary mb-1">Availability</div>
              <ul className="space-y-1">
                {preview.availability.map((e) => (
                  <li key={e.id}>
                    {e.title}: {pretty(e.start.toISOString().slice(0, 10))} →{" "}
                    {pretty(new Date(e.end.getTime() - 86400000).toISOString().slice(0, 10))}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="text-xs text-secondary mt-2">
            Names, ordering, and math come from BreedingMath (Placement terminology, inclusive end-dates).
          </div>
        </SectionCard>
      )}

      <SectionCard title="Cycle Start Dates">
        <div className="flex items-center gap-2 mb-2">
          <Input
            type="date"
            onChange={(e) => {
              const v = (e.currentTarget as HTMLInputElement).value;
              if (v) {
                add(v);
                (e.currentTarget as HTMLInputElement).value = "";
              }
            }}
            placeholder="YYYY-MM-DD"
          />
          <Button variant="outline" onClick={persist}>
            Save Dates
          </Button>
        </div>

        <div className="rounded-md border border-hairline divide-y">
          {dates.length === 0 && <div className="p-2 text-sm text-secondary">No dates yet.</div>}
          {dates.map((d) => {
            const isEditing = editing[d];
            return (
              <div key={d} className="p-2 flex items-center justify-between text-sm gap-3">
                {!isEditing && <div className="min-w-[10rem]">{pretty(d)}</div>}
                {isEditing && (
                  <Input
                    type="date"
                    defaultValue={d}
                    onChange={(e) => {
                      const nextValue = (e.currentTarget as HTMLInputElement).value;
                      if (!nextValue) return;
                      setDates((arr) => {
                        const copy = arr.filter((x) => x !== d);
                        return Array.from(new Set([...copy, nextValue])).sort();
                      });
                    }}
                    className="min-w-[12rem]"
                  />
                )}

                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <Button size="sm" variant="outline" onClick={() => setEditing((m) => ({ ...m, [d]: true }))}>
                      Edit
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setEditing((m) => ({ ...m, [d]: false }))}>
                      Done
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(d)} title="Delete date">
                    <TrashIcon />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}

/** ────────────────────────────────────────────────────────────────────────
 * Program Tab — breeder readiness and program flags (no offspring)
 * ─────────────────────────────────────────────────────────────────────── */
function ProgramTab({
  animal,
  api,
  onSaved,
}: {
  animal: AnimalRow;
  api: any;
  onSaved: (flags: ProgramFlags) => void;
}) {
  const [flags, setFlags] = React.useState<ProgramFlags>({
    holdUntil: null,
    embargoReason: null,
    allowExternalStud: null,
    disqualifiers: [],
    notes: null,
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        setLoading(true);
        const server = await api?.animals?.getProgramFlags?.(animal.id);
        if (!dead && server) setFlags(server);
      } catch {}
      setLoading(false);
    })();
    return () => {
      dead = false;
    };
  }, [api, animal.id]);

  const save = async () => {
    try {
      await api?.animals?.putProgramFlags?.(animal.id, flags);
    } catch {}
    onSaved(flags);
  };

  const months = ageInMonths(animal.dob);
  const sex = (animal.sex || "").toLowerCase();
  const isFemale = sex.startsWith("f");
  const isMale = sex.startsWith("m");

  // very light, transparent readiness hints for breeders
  const ageOkFemale = months != null ? months >= 18 : false;
  const ageOkMale = months != null ? months >= 12 : false;

  return (
    <div className="space-y-3">
      <SectionCard title="Readiness Summary">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-xs text-secondary">Age</div>
            <div>{months != null ? `${months} mo` : "—"}</div>
          </div>
          <div>
            <div className="text-xs text-secondary">Sex</div>
            <div>{animal.sex || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-secondary">Program Status</div>
            <div>{animal.status || "Active"}</div>
          </div>
          <div>
            <div className="text-xs text-secondary">Eligibility Hint</div>
            <div>
              {isFemale ? (ageOkFemale ? "Age meets common female threshold" : "Age may be low for female breeding") : null}
              {isMale ? (ageOkMale ? "Age meets common male threshold" : "Age may be low for male breeding") : null}
              {!isFemale && !isMale ? "—" : ""}
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-secondary">
          Readiness hints are informational and are not rules. Configure your own constraints below.
        </div>
      </SectionCard>

      <SectionCard title="Program Flags">
        {loading ? (
          <div className="text-sm text-secondary">Loading…</div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-secondary mb-1">Hold Until</div>
                <Input
                  type="date"
                  value={(flags.holdUntil || "").slice(0, 10)}
                  onChange={(e) => setFlags((f) => ({ ...f, holdUntil: (e.currentTarget as HTMLInputElement).value || null }))}
                />
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-secondary mb-1">Embargo Reason</div>
                <Input
                  placeholder="clearances pending, recovery, etc."
                  value={flags.embargoReason || ""}
                  onChange={(e) => setFlags((f) => ({ ...f, embargoReason: (e.currentTarget as HTMLInputElement).value || null }))}
                />
              </div>
            </div>

            {isMale && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-secondary mb-1">Allow External Stud Requests</div>
                  <select
                    className="h-9 w-full rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                    value={String(!!flags.allowExternalStud)}
                    onChange={(e) => setFlags((f) => ({ ...f, allowExternalStud: e.currentTarget.value === "true" }))}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <div className="text-xs text-secondary mb-1">Disqualifiers</div>
              <Input
                placeholder="comma separated, e.g. MDR1 carrier, patella grade, bite"
                value={(flags.disqualifiers || []).join(", ")}
                onChange={(e) =>
                  setFlags((f) => ({
                    ...f,
                    disqualifiers: (e.currentTarget as HTMLInputElement)
                      .value.split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  }))
                }
              />
            </div>

            <div>
              <div className="text-xs text-secondary mb-1">Program Notes</div>
              <textarea
                className="h-24 w-full rounded-md border border-hairline bg-surface px-3 text-sm text-primary outline-none"
                value={flags.notes || ""}
                onChange={(e) => setFlags((f) => ({ ...f, notes: (e.currentTarget as HTMLTextAreaElement).value || null }))}
              />
            </div>

            <div className="flex items-center justify-end">
              <Button variant="outline" onClick={save}>
                Save Flags
              </Button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/** ────────────────────────────────────────────────────────────────────────
 * Pairing Tab — preferred partners for strategic planning (no offspring)
 * ─────────────────────────────────────────────────────────────────────── */
function PairingTab({
  animal,
  api,
}: {
  animal: AnimalRow;
  api: any;
}) {
  const [preferred, setPreferred] = React.useState<PreferredPartner[]>([]);
  const [avoid, setAvoid] = React.useState<PreferredPartner[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        setLoading(true);
        const pr = (await api?.animals?.listPreferredPartners?.(animal.id)) || [];
        const av = (await api?.animals?.listAvoidPartners?.(animal.id)) || [];
        if (!dead) {
          setPreferred(pr);
          setAvoid(av);
        }
      } catch {}
      setLoading(false);
    })();
    return () => {
      dead = true;
    };
  }, [api, animal.id]);

  const [q, setQ] = React.useState("");
  const [hits, setHits] = React.useState<PreferredPartner[]>([]);
  React.useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) {
        setHits([]);
        return;
      }
      try {
        const res = (await api?.animals?.search?.({ q: q.trim(), limit: 8 })) || [];
        const mapped: PreferredPartner[] = res
          .filter((r: any) => Number(r.id) !== Number(animal.id))
          .map((r: any) => ({ id: Number(r.id), name: r.name, sex: r.sex || null }));
        setHits(mapped);
      } catch {
        setHits([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, api, animal.id]);

  async function savePreferred(next: PreferredPartner[]) {
    setPreferred(next);
    try {
      await api?.animals?.putPreferredPartners?.(animal.id, next);
    } catch {}
  }
  async function saveAvoid(next: PreferredPartner[]) {
    setAvoid(next);
    try {
      await api?.animals?.putAvoidPartners?.(animal.id, next);
    } catch {}
  }

  function pill(p: PreferredPartner, onRemove: () => void) {
    return (
      <span key={p.id} className="inline-flex items-center gap-2 rounded-full border border-hairline px-2 py-0.5 text-xs mr-2 mb-2">
        <span className="truncate max-w-[14rem]">{p.name}{p.sex ? ` • ${p.sex}` : ""}</span>
        <button className="opacity-70 hover:opacity-100" onClick={onRemove} title="Remove">✕</button>
      </span>
    );
  }

  return (
    <div className="space-y-3">
      <SectionCard title="Find Partners">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <div className="text-xs text-secondary mb-1">Search Animals</div>
            <Input value={q} onChange={(e) => setQ((e.currentTarget as HTMLInputElement).value)} placeholder="name, tag, microchip…" />
          </div>
        </div>
        {hits.length > 0 && (
          <div className="mt-2 rounded-md border border-hairline p-2">
            <div className="text-xs text-secondary mb-1">Results</div>
            <div className="flex flex-wrap">
              {hits.map((h) => (
                <span key={h.id} className="inline-flex items-center gap-2 rounded-full border border-hairline px-2 py-0.5 text-xs mr-2 mb-2">
                  <span className="truncate max-w-[14rem]">{h.name}{h.sex ? ` • ${h.sex}` : ""}</span>
                  <Button size="sm" variant="outline" onClick={() => savePreferred(Array.from(new Set([...preferred, h]).values()))}>
                    Prefer
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => saveAvoid(Array.from(new Set([...avoid, h]).values()))}>
                    Avoid
                  </Button>
                </span>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Preferred Partners">
        {loading ? (
          <div className="text-sm text-secondary">Loading…</div>
        ) : (
          <div className="flex flex-wrap">
            {preferred.length === 0 && <div className="text-sm text-secondary">None yet.</div>}
            {preferred.map((p) => pill(p, () => savePreferred(preferred.filter((x) => x.id !== p.id))))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Avoid List">
        {loading ? (
          <div className="text-sm text-secondary">Loading…</div>
        ) : (
          <div className="flex flex-wrap">
            {avoid.length === 0 && <div className="text-sm text-secondary">None.</div>}
            {avoid.map((p) => pill(p, () => saveAvoid(avoid.filter((x) => x.id !== p.id))))}
          </div>
        )}
      </SectionCard>

      <div className="text-xs text-secondary">
        Pairing lists are program tools only. Offspring is managed in the Offspring module.
      </div>
    </div>
  );
}

/** ────────────────────────────────────────────────────────────────────────
 * Main
 * ─────────────────────────────────────────────────────────────────────── */
export default function AppAnimals() {
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent("bhq:module", { detail: { key: "animals", label: "Animals" } }));
  }, []);

  React.useEffect(() => {
    if (!getOverlayRoot()) {
      console.warn("ColumnsPopover needs an overlay root. Add <div id='bhq-overlay-root'></div> to the shell.");
    }
  }, []);

  const api = React.useMemo(() => makeApi("/api/v1"), []);

  const breedBrowseApi = React.useMemo(
    () => ({
      breeds: {
        listCanonical: (opts: { species: string; orgId?: number; limit?: number }) =>
          (api as any)?.breeds?.listCanonical?.(opts) ?? Promise.resolve([]),
      },
    }),
    [api]
  );

  // Resolve orgId once for breed searches
  const [orgIdForBreeds, setOrgIdForBreeds] = React.useState<number | null>(null);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      const org = await safeGetCreatingOrg(api);
      if (!alive) return;
      if (org?.id != null) setOrgIdForBreeds(Number(org.id));
    })();
    return () => {
      alive = false;
    };
  }, [api]);

  // Search/filters
  const [q, setQ] = React.useState(() => {
    try {
      return localStorage.getItem("bhq_animals_q_v1") || "";
    } catch {
      return "";
    }
  });
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem("bhq_animals_filters_v1") || "{}");
    } catch {
      return {};
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem("bhq_animals_q_v1", q);
    } catch {}
  }, [q]);
  React.useEffect(() => {
    try {
      localStorage.setItem("bhq_animals_filters_v1", JSON.stringify(filters || {}));
    } catch {}
  }, [filters]);

  const [qDebounced, setQDebounced] = React.useState(q);
  React.useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Data
  const [rows, setRows] = React.useState<AnimalRow[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Pagination
  const [pageSize, setPageSize] = React.useState<number>(25);
  const [page, setPage] = React.useState<number>(1);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.animals.list({ q: qDebounced || undefined, page: 1, limit: 50 });
        const items = (res?.items || []).map(animalToRow);
        if (!cancelled) setRows(items);
      } catch (e: any) {
        if (!cancelled) setError(e?.data?.error || e?.message || "Failed to load animals");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, qDebounced]);

  // Columns
  const { map, toggle, setAll, visible } = hooks.useColumns(COLUMNS, STORAGE_KEY);
  const visibleSafe = Array.isArray(visible) && visible.length ? visible : COLUMNS;

  // Filters schema
  const filterSchemaForFiltersRow = React.useMemo(() => {
    return buildRangeAwareSchema(
      visibleSafe.map((c) => ({ key: c.key, label: c.label })),
      ["dob", "created_at", "updated_at"]
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
          r.name,
          r.nickname,
          r.species,
          r.breed,
          r.sex,
          r.status,
          r.ownerName,
          r.microchip,
          ...(r.tags || []),
          r.dob,
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
      const dobFrom = filters["dob_from"];
      const dobTo = filters["dob_to"];
      const createdFrom = filters["created_at_from"];
      const createdTo = filters["created_at_to"];
      const updatedFrom = filters["updated_at_from"];
      const updatedTo = filters["updated_at_to"];

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

        const dobOk = dobFrom || dobTo ? inDateRange(r.dob, dobFrom, dobTo) : true;
        const createdOk = createdFrom || createdTo ? inDateRange(r.created_at, createdFrom, createdTo) : true;
        const updatedOk = updatedFrom || updatedTo ? inDateRange(r.updated_at, updatedFrom, updatedTo) : true;

        return dobOk && createdOk && updatedOk;
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
  React.useEffect(() => {
    setPage(1);
  }, [qDebounced, filters, sorts]);

  const sortedRows = React.useMemo(() => {
    if (!sorts.length) return displayRows;
    const out = [...displayRows];
    out.sort((a, b) => {
      for (const s of sorts) {
        const av = (a as any)[s.key];
        const bv = (b as any)[s.key];
        const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true, sensitivity: "base" });
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
  const end = sortedRows.length === 0 ? 0 : Math.min(sortedRows.length, (clampedPage - 1) * pageSize + pageSize);
  const pageRows = React.useMemo(() => {
    const from = (clampedPage - 1) * pageSize;
    const to = from + pageSize;
    return sortedRows.slice(from, to);
  }, [sortedRows, clampedPage, pageSize]);

  /** ────────── Custom Breed dialog state (before sections) ────────── */
  const [customBreedOpen, setCustomBreedOpen] = React.useState(false);
  const [customBreedSpecies, setCustomBreedSpecies] = React.useState<"DOG" | "CAT" | "HORSE">("DOG");
  const [onCustomBreedCreated, setOnCustomBreedCreated] =
    React.useState<((c: { id: number; name: string; species: "DOG" | "CAT" | "HORSE" }) => void) | null>(null);

  /** ────────── Sections (Overview compact) ────────── */
  const animalSections = (
    mode: "view" | "edit",
    row: AnimalRow,
    setDraft: (p: Partial<AnimalRow>) => void
  ) => [
    {
      title: "Identity",
      fields: [
        {
          label: "Name",
          view: (r) => r.name || "—",
          edit: (_r, set) => <Input size="sm" defaultValue={row.name} onChange={(e) => set({ name: e.currentTarget.value })} />,
        },
        {
          label: "Nickname",
          view: (r) => r.nickname || "—",
          edit: (_r, set) => (
            <Input size="sm" defaultValue={row.nickname ?? ""} onChange={(e) => set({ nickname: e.currentTarget.value })} />
          ),
        },
      ],
      gridCols: 2 as any,
    },
    {
      title: "Profile",
      fields: [
        {
          label: "Species",
          view: (r) => r.species ?? "—",
          edit: (_r, set) => (
            <select
              className="h-8 w-full rounded-md bg-surface border border-hairline px-2 text-sm text-primary"
              defaultValue={row.species || "Dog"}
              onChange={(e) => {
                const next = e.target.value as "Dog" | "Cat" | "Horse";
                set({ species: next, breed: null });
              }}
            >
              <option>Dog</option>
              <option>Cat</option>
              <option>Horse</option>
            </select>
          ),
        },
        {
          label: "Breed",
          view: (r) => r.breed ?? "—",
          edit: (_r, set) => (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div>
                  <CustomBreedCombo
                    species={(row.species as "Dog" | "Cat" | "Horse") || "Dog"}
                    value={row.breed || null}
                    onChange={(name) => set({ breed: name ?? null })}
                    api={breedBrowseApi}
                    orgIdForBreeds={orgIdForBreeds ?? undefined}
                    onOpenCustom={() => {
                      const speciesEnum = (String(row.species || "Dog").toUpperCase() as "DOG" | "CAT" | "HORSE");
                      setCustomBreedSpecies(speciesEnum);
                      setOnCustomBreedCreated(() => (created) => {
                        set({ breed: created.name });
                        setCustomBreedOpen(false);
                      });
                      setCustomBreedOpen(true);
                    }}
                  />
                </div>
              </div>
            </div>
          ),
        },
        {
          label: "Sex",
          view: (r) => r.sex ?? "—",
          edit: (_r, set) => (
            <select
              className="h-8 w-full rounded-md bg-surface border border-hairline px-2 text-sm text-primary"
              defaultValue={row.sex || "Female"}
              onChange={(e) => set({ sex: e.target.value })}
            >
              <option>Female</option>
              <option>Male</option>
            </select>
          ),
        },
        {
          label: "Status",
          view: (r) => r.status ?? "Active",
          edit: (_r, set) => (
            <select
              className="h-8 w-full rounded-md bg-surface border border-hairline px-2 text-sm text-primary"
              defaultValue={row.status || "Active"}
              onChange={(e) => set({ status: e.target.value })}
            >
              {["Active", "Breeding", "Unavailable", "Retired", "Deceased", "Prospect"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          ),
        },
      ],
      gridCols: 4 as any,
    },
    {
      title: "Ownership",
      fields: [
        { label: "Owner", view: (r) => r.ownerName ?? "—" },
        {
          label: "Ownership",
          view: (r) => <OwnershipChips owners={((r as any).owners || []) as any[]} />,
          edit: (_r, _set) => (
            <OwnershipEditor
              api={{
                searchContacts: (q) => api?.lookups?.searchContacts?.(q) ?? Promise.resolve([]),
                searchOrganizations: (q) => api?.lookups?.searchOrganizations?.(q) ?? Promise.resolve([]),
              }}
              value={(((row as any).owners) || []) as any[]}
              onChange={(rows) => (setDraft as any)({ ...(row as any), owners: rows })}
            />
          ),
        },
      ],
      gridCols: 2 as any,
    },
    {
      title: "Identifiers & Dates",
      fields: [
        {
          label: "Microchip #",
          view: (r) => r.microchip ?? "—",
          edit: (_r, set) => (
            <Input size="sm" defaultValue={row.microchip ?? ""} onChange={(e) => set({ microchip: e.currentTarget.value })} />
          ),
        },
        {
          label: "DOB",
          view: (r) => fmt(r.dob) || "—",
          edit: (_r, set) => (
            <Input size="sm" type="date" defaultValue={(row.dob || "").slice(0, 10)} onChange={(e) => set({ dob: e.currentTarget.value })} />
          ),
        },
      ],
      gridCols: 2 as any,
    },
    {
      title: "Notes & Tags",
      fields: [
        {
          label: "Tags",
          view: (r) => (r.tags || []).join(", ") || "—",
          edit: (_r, set) => (
            <Input
              size="sm"
              defaultValue={(row.tags || []).join(", ")}
              onChange={(e) => {
                const tags = (e.currentTarget.value || "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                set({ tags });
              }}
            />
          ),
        },
        {
          label: "Notes",
          view: (r) => r.notes || "—",
          edit: (_r, set) => (
            <textarea
              className="h-24 w-full rounded-md bg-surface border border-hairline px-3 text-sm text-primary outline-none"
              defaultValue={row.notes ?? ""}
              onChange={(e) => set({ notes: (e.currentTarget as HTMLTextAreaElement).value })}
            />
          ),
        },
      ],
    },
  ];

  function CustomBreedCombo({
    species,
    value,
    onChange,
    api,
    orgIdForBreeds,
    onOpenCustom,
  }: {
    species: "Dog" | "Cat" | "Horse";
    value: string | null;
    onChange: (name: string | null) => void;
    api: any;
    orgIdForBreeds?: number;
    onOpenCustom: () => void;
  }) {
    const [local, setLocal] = React.useState<string | null>(value ?? null);
    React.useEffect(() => {
      setLocal(value ?? null);
    }, [value]);

    const speciesKey = `breed-${species}`;
    const valueObj = local ? ({ id: "__current__", name: local, species, source: "canonical" } as any) : null;

    return (
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <BreedCombo
            key={speciesKey}
            orgId={orgIdForBreeds}
            species={species}
            value={valueObj}
            onChange={(hit: any) => {
              const nextName = hit?.name ?? null;
              setLocal(nextName);
              onChange(nextName);
            }}
            api={{ breeds: { listCanonical: api.breeds.listCanonical } }}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLocal(null);
            onChange(null);
          }}
          title="Clear breed"
        >
          Clear
        </Button>
        <Button variant="outline" size="sm" onClick={onOpenCustom}>
          New custom
        </Button>
      </div>
    );
  }

  function LV({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div className="min-w-0">
        <div className="text-[11px] leading-4 text-secondary mb-0.5">{label}</div>
        <div className="text-sm leading-5 text-primary break-words">{children || "—"}</div>
      </div>
    );
  }

  function Chip({ children }: { children: React.ReactNode }) {
    return (
      <span className="inline-flex items-center rounded-full border border-hairline px-2 py-0.5 text-xs text-primary">{children}</span>
    );
  }

  function HeaderBadges({ row }: { row: AnimalRow }) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {row.species && <Chip>{row.species}{row.breed ? ` • ${row.breed}` : ""}</Chip>}
        {row.sex && <Chip>{row.sex}</Chip>}
        <Chip>{row.status || "Active"}</Chip>
      </div>
    );
  }

  const detailsConfig = React.useMemo(
    () => ({
      idParam: "animalId",
      getRowId: (r: AnimalRow) => r.id,
      width: 720,
      placement: "center" as const,
      align: "top" as const,
      fetchRow: async (id: number) => animalToRow(await api.animals.get(id)),
      onSave: async (id: number, draft: Partial<AnimalRow>) => {
        const toWire = (d: Partial<AnimalRow>) => {
          const out: any = { ...d };
          if (out.species) out.species = String(out.species).toUpperCase();
          if (out.sex) out.sex = String(out.sex).toUpperCase();
          if (out.status) out.status = String(out.status).toUpperCase();
          return out;
        };

        const updated = await api.animals.update(id, toWire(draft));

        const owners: OwnershipRow[] | undefined = (draft as any)?.owners;
        if (owners) {
          try {
            await api.animals.putOwners?.(id, owners);
          } catch {}
        }
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...animalToRow(updated) } : r)));
      },

      header: (r: AnimalRow) => ({
        title: r.name,
        subtitle: r.nickname || r.ownerName || "",
        extra: <HeaderBadges row={r} />,
      }),

      tabs: (r: AnimalRow) => {
        const tabs = [{ key: "overview", label: "Overview" } as const];
        if ((r.sex || "").toLowerCase().startsWith("f")) tabs.push({ key: "cycle", label: "Cycle Info" } as any);
        tabs.push({ key: "program", label: "Program" } as any);
        tabs.push({ key: "pairing", label: "Pairing" } as any);
        tabs.push({ key: "audit", label: "Audit" } as any);
        return tabs;
      },

      customChrome: true,
      render: ({ row, mode, setMode, setDraft, activeTab, setActiveTab, requestSave }: any) => (
        <DetailsScaffold
          title={row.name}
          subtitle={row.nickname || row.ownerName || ""}
          mode={mode}
          onEdit={() => setMode("edit")}
          onCancel={() => setMode("view")}
          onSave={requestSave}
          tabs={detailsConfig.tabs(row)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          rightActions={
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                if (!confirm("Archive this animal?")) return;
                await api.animals.archive(row.id);
                setRows((prev) => prev.filter((r) => r.id !== row.id));
              }}
            >
              Archive
            </Button>
          }
        >
          {activeTab === "overview" && (
            <div className="space-y-3">
              {/* Compact header badges already applied */}
              {/* Identity, Profile, Ownership, Dates, Notes */}
              <SectionCard title="Identity">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <LV label="Name">
                    {mode === "view" ? (
                      row.name || "—"
                    ) : (
                      <Input size="sm" defaultValue={row.name} onChange={(e) => setDraft({ name: e.currentTarget.value })} />
                    )}
                  </LV>
                  <LV label="Nickname">
                    {mode === "view" ? (
                      row.nickname || "—"
                    ) : (
                      <Input
                        size="sm"
                        defaultValue={row.nickname ?? ""}
                        onChange={(e) => setDraft({ nickname: e.currentTarget.value })}
                      />
                    )}
                  </LV>
                  <LV label="Microchip #">
                    {mode === "view" ? (
                      row.microchip || "—"
                    ) : (
                      <Input
                        size="sm"
                        defaultValue={row.microchip ?? ""}
                        onChange={(e) => setDraft({ microchip: e.currentTarget.value })}
                      />
                    )}
                  </LV>
                  <LV label="DOB">
                    {mode === "view" ? (
                      fmt(row.dob) || "—"
                    ) : (
                      <Input
                        size="sm"
                        type="date"
                        defaultValue={(row.dob || "").slice(0, 10)}
                        onChange={(e) => setDraft({ dob: e.currentTarget.value })}
                      />
                    )}
                  </LV>
                </div>
              </SectionCard>

              <SectionCard title="Profile">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <LV label="Species">
                    {mode === "view" ? (
                      row.species || "—"
                    ) : (
                      <select
                        className="h-8 w-full rounded-md bg-surface border border-hairline px-2 text-sm text-primary"
                        defaultValue={row.species || "Dog"}
                        onChange={(e) => {
                          const next = e.target.value as "Dog" | "Cat" | "Horse";
                          setDraft({ species: next, breed: null });
                        }}
                      >
                        <option>Dog</option>
                        <option>Cat</option>
                        <option>Horse</option>
                      </select>
                    )}
                  </LV>

                  <LV label="Sex">
                    {mode === "view" ? (
                      row.sex || "—"
                    ) : (
                      <select
                        className="h-8 w-full rounded-md bg-surface border border-hairline px-2 text-sm text-primary"
                        defaultValue={row.sex || "Female"}
                        onChange={(e) => setDraft({ sex: e.target.value })}
                      >
                        <option>Female</option>
                        <option>Male</option>
                      </select>
                    )}
                  </LV>

                  <LV label="Status">
                    {mode === "view" ? (
                      row.status || "Active"
                    ) : (
                      <select
                        className="h-8 w-full rounded-md bg-surface border border-hairline px-2 text-sm text-primary"
                        defaultValue={row.status || "Active"}
                        onChange={(e) => setDraft({ status: e.target.value })}
                      >
                        {["Active", "Breeding", "Unavailable", "Retired", "Deceased", "Prospect"].map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    )}
                  </LV>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3">
                  <LV label="Breed">
                    {mode === "view" ? (
                      row.breed || "—"
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex-1 min-w-[320px]">
                          <BreedCombo
                            key={`breed-${row.species || "Dog"}`}
                            orgId={orgIdForBreeds ?? undefined}
                            species={(row.species as any) || "Dog"}
                            value={
                              row.breed
                                ? ({ id: "__current__", name: row.breed, species: row.species, source: "canonical" } as any)
                                : null
                            }
                            onChange={(hit: any) => setDraft({ breed: hit?.name ?? null })}
                            api={breedBrowseApi}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const speciesEnum = (String(row.species || "Dog").toUpperCase() as "DOG" | "CAT" | "HORSE");
                            setCustomBreedSpecies(speciesEnum);
                            setOnCustomBreedCreated(() => (created: any) => {
                              setDraft({ breed: created.name });
                              setCustomBreedOpen(false);
                            });
                            setCustomBreedOpen(true);
                          }}
                        >
                          New custom
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setDraft({ breed: null })}>
                          Clear
                        </Button>
                      </div>
                    )}
                  </LV>
                </div>
              </SectionCard>

              <SectionCard title="Ownership">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <LV label="Primary Owner">{row.ownerName || "—"}</LV>
                  <LV label="Additional Owners">
                    {mode === "view" ? (
                      <OwnershipChips owners={((row as any).owners || []) as any[]} />
                    ) : (
                      <OwnershipEditor
                        api={{
                          searchContacts: (q) => api?.lookups?.searchContacts?.(q) ?? Promise.resolve([]),
                          searchOrganizations: (q) => api?.lookups?.searchOrganizations?.(q) ?? Promise.resolve([]),
                        }}
                        value={(((row as any).owners) || []) as any[]}
                        onChange={(rows) => (setDraft as any)({ ...(row as any), owners: rows })}
                      />
                    )}
                  </LV>
                </div>
              </SectionCard>

              <SectionCard title="Notes & Tags">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <LV label="Tags">
                    {mode === "view" ? (
                      (row.tags || []).join(", ") || "—"
                    ) : (
                      <Input
                        size="sm"
                        defaultValue={(row.tags || []).join(", ")}
                        onChange={(e) => {
                          const tags = (e.currentTarget.value || "")
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                          setDraft({ tags });
                        }}
                      />
                    )}
                  </LV>

                  <LV label="Notes">
                    {mode === "view" ? (
                      row.notes || "—"
                    ) : (
                      <textarea
                        className="h-24 w-full rounded-md bg-surface border border-hairline px-3 text-sm text-primary outline-none"
                        defaultValue={row.notes ?? ""}
                        onChange={(e) => setDraft({ notes: (e.currentTarget as HTMLTextAreaElement).value })}
                      />
                    )}
                  </LV>
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === "cycle" && (
            <CycleTab animal={row} api={api} onSaved={(dates) => setDraft({ cycleStartDates: dates })} />
          )}

          {activeTab === "program" && (
            <ProgramTab animal={row} api={api} onSaved={() => { /* no-op: flags are separate from core row */ }} />
          )}

          {activeTab === "pairing" && <PairingTab animal={row} api={api} />}

          {activeTab === "audit" && (
            <div className="space-y-2">
              <SectionCard title="Audit">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-secondary">Created</div>
                    <div>{fmt(row.created_at) || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-secondary">Last Updated</div>
                    <div>{fmt(row.updated_at) || "—"}</div>
                  </div>
                </div>
              </SectionCard>
              <SectionCard title="Events">
                <div className="text-sm text-secondary">Events will appear here.</div>
              </SectionCard>
            </div>
          )}
        </DetailsScaffold>
      ),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api, orgIdForBreeds]
  );

  /** ───────────── Create Animal modal ───────────── */
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createWorking, setCreateWorking] = React.useState(false);
  const [createErr, setCreateErr] = React.useState<string | null>(null);

  const [newName, setNewName] = React.useState("");
  const [newSpecies, setNewSpecies] = React.useState<"Dog" | "Cat" | "Horse">("Dog");
  const [newSex, setNewSex] = React.useState<"Female" | "Male">("Female");
  const [newStatus, setNewStatus] = React.useState<"Active" | "Breeding" | "Unavailable" | "Retired" | "Deceased" | "Prospect">("Active");
  const [newDob, setNewDob] = React.useState("");
  const [newMicrochip, setNewMicrochip] = React.useState("");
  const [newBreed, setNewBreed] = React.useState<any>(null);
  const [owners, setOwners] = React.useState<OwnershipRow[]>([]);
  const [tagsStr, setTagsStr] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [nickname, setNickname] = React.useState("");

  const resetCreateForm = () => {
    setNewName("");
    setNickname("");
    setNewSpecies("Dog");
    setNewSex("Female");
    setNewStatus("Active");
    setNewDob("");
    setNewMicrochip("");
    setNewBreed(null);
    setOwners([]);
    setTagsStr("");
    setNotes("");
    setCreateErr(null);
  };

  const canCreate = newName.trim().length > 1 && !!newDob && !!newSex && !!newSpecies;

  const doCreateAnimal = async () => {
    if (!canCreate) {
      setCreateErr("Please complete required fields.");
      return;
    }
    try {
      setCreateWorking(true);
      setCreateErr(null);

      const payload: any = {
        name: newName.trim(),
        nickname: nickname.trim() || null,
        species: newSpecies.toUpperCase(),
        sex: newSex.toUpperCase(),
        status: newStatus.toUpperCase(),
        birthDate: newDob ? new Date(newDob).toISOString() : null,
        microchip: newMicrochip.trim() || null,
        breed: newBreed?.name ?? null,
        tags: tagsStr.split(",").map((s) => s.trim()).filter(Boolean),
        notes: notes || null,
      };

      const created = await (api.animals as any).create?.(payload);
      const row = animalToRow(created);

      let toSaveOwners = owners;
      if (toSaveOwners.length === 0) {
        const org = await safeGetCreatingOrg(api);
        if (org) {
          toSaveOwners = [
            {
              partyType: "Organization",
              organizationId: org.id,
              contactId: null,
              display_name: org.display_name,
              is_primary: true,
              percent: 100,
            },
          ];
        }
      }
      try {
        await (api.animals as any).putOwners?.(row.id, toSaveOwners);
        (row as any).owners = toSaveOwners;
      } catch {}

      setRows((prev) => [row, ...prev]);
      resetCreateForm();
      setCreateOpen(false);
    } catch (e: any) {
      setCreateErr(e?.message || "Failed to create animal");
    } finally {
      setCreateWorking(false);
    }
  };

  /** ─────────────────────────────────────────────────────────────────── */
  return (
    <div className="p-4 space-y-4">
      <div className="relative">
        <PageHeader title="Animals" subtitle="Manage your breeding males and females" />
        <div className="absolute right-0 top-0 h-full flex items-center gap-2 pr-1" style={{ zIndex: 5, pointerEvents: "auto" }}>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            New Animal
          </Button>
          <Button size="sm" variant="outline">
            ...
          </Button>
        </div>
      </div>

      {getOverlayRoot() &&
        createPortal(
          <CustomBreedDialog
            open={customBreedOpen}
            onClose={() => setCustomBreedOpen(false)}
            api={{
              breeds: {
                customCreate: api.breeds.customCreate,
                putRecipe: (api as any)?.breeds?.putRecipe,
              },
            }}
            species={customBreedSpecies}
            onCreated={(c) => onCustomBreedCreated?.(c)}
          />,
          getOverlayRoot()!
        )}

      <Card>
        <DetailsHost rows={rows} config={detailsConfig}>
          <Table
            columns={COLUMNS}
            columnState={map}
            onColumnStateChange={setAll}
            getRowId={(r: AnimalRow) => r.id}
            pageSize={25}
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
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M3 5h18M7 12h10M10 19h4" strokeLinecap="round" />
                    </svg>
                  </button>
                }
              />
            </div>

            {filtersOpen && <FiltersRow filters={filters} onChange={(next) => setFilters(next)} schema={filterSchemaForFiltersRow} />}

            <FilterChips
              filters={filters}
              onChange={setFilters}
              prettyLabel={(k) => {
                if (k === "dob_from") return "DOB ≥";
                if (k === "dob_to") return "DOB ≤";
                if (k === "created_at_from") return "Created ≥";
                if (k === "created_at_to") return "Created ≤";
                if (k === "updated_at_from") return "Updated ≥";
                if (k === "updated_at_to") return "Updated ≤";
                return k;
              }}
            />

            <table className="min-w-max w-full text-sm">
              <TableHeader columns={visibleSafe} sorts={sorts} onToggleSort={onToggleSort} />
              <tbody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={visibleSafe.length}>
                      <div className="py-8 text-center text-sm text-secondary">Loading animals…</div>
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
                      <div className="py-8 text-center text-sm text-secondary">No animals to display yet.</div>
                    </TableCell>
                  </TableRow>
                )}

                {!loading &&
                  !error &&
                  pageRows.length > 0 &&
                  pageRows.map((r) => (
                    <TableRow key={r.id} detailsRow={r}>
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
              entityLabel="animals"
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
            />
          </Table>
        </DetailsHost>
      </Card>

      {createOpen && (
        <Overlay
          open={createOpen}
          onOpenChange={(v) => {
            if (!createWorking) setCreateOpen(v);
          }}
          ariaLabel="Create Animal"
          size="lg"
          overlayId="create-animal"
        >
          <div className="relative w-full">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-lg font-semibold">Create Animal</div>
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                ✕
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-xs text-secondary">
                  Name <span className="text-[hsl(var(--brand-orange))]">*</span>
                </div>
                <Input value={newName} onChange={(e) => setNewName((e.currentTarget as HTMLInputElement).value)} />
              </div>

              <div>
                <div className="mb-1 text-xs text-secondary">Nickname</div>
                <Input value={nickname} onChange={(e) => setNickname((e.currentTarget as HTMLInputElement).value)} />
              </div>

              <div>
                <div className="mb-1 text-xs text-secondary">Species *</div>
                <select
                  className="h-9 w-full rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                  value={newSpecies}
                  onChange={(e) => setNewSpecies(e.currentTarget.value as any)}
                >
                  <option>Dog</option>
                  <option>Cat</option>
                  <option>Horse</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <div className="mb-1 text-xs text-secondary">Breed</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <BreedCombo
                      orgId={orgIdForBreeds ?? undefined}
                      species={newSpecies}
                      value={newBreed}
                      onChange={setNewBreed}
                      api={breedBrowseApi}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const speciesEnum = (String(newSpecies).toUpperCase() as "DOG" | "CAT" | "HORSE");
                      setCustomBreedSpecies(speciesEnum);
                      setOnCustomBreedCreated(() => (created) => {
                        setNewBreed({ id: created.id, name: created.name, species: newSpecies, source: "custom" } as any);
                        setCustomBreedOpen(false);
                      });
                      setCustomBreedOpen(true);
                    }}
                  >
                    New custom
                  </Button>
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs text-secondary">Sex *</div>
                <select
                  className="h-9 w-full rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                  value={newSex}
                  onChange={(e) => setNewSex(e.currentTarget.value as any)}
                >
                  <option>Female</option>
                  <option>Male</option>
                </select>
              </div>

              <div>
                <div className="mb-1 text-xs text-secondary">Date of Birth *</div>
                <Input type="date" value={newDob} onChange={(e) => setNewDob((e.currentTarget as HTMLInputElement).value)} />
              </div>

              <div>
                <div className="mb-1 text-xs text-secondary">Status</div>
                <select
                  className="h-9 w-full rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.currentTarget.value as any)}
                >
                  {["Active", "Breeding", "Unavailable", "Retired", "Deceased", "Prospect"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <div className="mb-1 text-xs text-secondary">Microchip #</div>
                <Input value={newMicrochip} onChange={(e) => setNewMicrochip((e.currentTarget as HTMLInputElement).value)} />
              </div>

              <div className="sm:col-span-2">
                <OwnershipEditor
                  api={{
                    searchContacts: (q) => (api as any)?.lookups?.searchContacts?.(q) ?? Promise.resolve([]),
                    searchOrganizations: (q) => (api as any)?.lookups?.searchOrganizations?.(q) ?? Promise.resolve([]),
                  }}
                  value={owners}
                  onChange={(rows) => setOwners(rows)}
                />
              </div>

              <div className="sm:col-span-2">
                <div className="mb-1 text-xs text-secondary">Tags</div>
                <Input placeholder="tag1, tag2" value={tagsStr} onChange={(e) => setTagsStr((e.currentTarget as HTMLInputElement).value)} />
              </div>

              <div className="sm:col-span-2">
                <div className="mb-1 text-xs text-secondary">Notes</div>
                <textarea
                  className="h-24 w-full rounded-md border border-hairline bg-surface px-3 text-sm text-primary placeholder:text-secondary outline-none"
                  value={notes}
                  onChange={(e) => setNotes((e.currentTarget as HTMLTextAreaElement).value)}
                  placeholder="Temperament, program notes, constraints"
                />
              </div>

              {createErr && <div className="sm:col-span-2 text-sm text-red-600">{createErr}</div>}

              <div className="mt-2 flex items-center justify-end gap-2 sm:col-span-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetCreateForm();
                    setCreateOpen(false);
                  }}
                  disabled={createWorking}
                >
                  Cancel
                </Button>
                <Button onClick={doCreateAnimal} disabled={!canCreate || createWorking}>
                  {createWorking ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}
