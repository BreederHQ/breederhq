// App-Offspring.tsx (drop-in, compile-ready, aligned with shared DetailsHost/Table pattern)

import WaitlistPage from "./pages/WaitlistPage";
import OffspringPage from "./pages/OffspringPage";
// App-Offspring.tsx (drop-in, compile-ready, aligned with shared DetailsHost/Table pattern)
import * as React from "react";
import ReactDOM from "react-dom";
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
  DetailsHost,
  DetailsScaffold,
  SectionCard,
  Button,
  BreedCombo,
  Input,
} from "@bhq/ui";

import { Overlay } from "@bhq/ui/overlay";
import "@bhq/ui/styles/table.css";
import { readTenantIdFast, resolveTenantId } from "@bhq/ui/utils/tenant";
import { makeOffspringApi, OffspringRow, WaitlistEntry } from "./api";
import { expectedMilestonesFromLocked } from "@bhq/ui/utils";
import clsx from "clsx";

/* Optional toast, fallback to alert if not present */
let useToast: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  useToast = require("@bhq/ui").useToast;
} catch {
  useToast = () => ({
    toast: (opts: any) =>
      (typeof window !== "undefined" && window.alert)
        ? window.alert(`${opts.title || ""}${opts.description ? ": " + opts.description : ""}`)
        : void 0,
  });
}

/* ───────────────────────── shared utils ───────────────────────── */

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
      {/* search icon */}
      <span
        className="i-lucide-search absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary/80 pointer-events-none"
        aria-hidden="true"
      />

      <input
        className={
          // h-9 plus leading-[36px] keeps placeholder centered
          inputClass + " pl-7 leading-[36px] [text-indent:0] "
        }
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

const inputClass =
  "w-full h-9 rounded-md border border-hairline bg-surface px-3 text-sm text-primary " +
  "placeholder:text-secondary/80 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--brand-orange))] " +
  "focus:border-[hsl(var(--brand-orange))] shadow-[inset_0_0_0_9999px_rgba(255,255,255,0.02)]";

function cx(...p: Array<string | false | null | undefined>) {
  return p.filter(Boolean).join(" ");
}

const labelClass = "text-xs text-secondary";

function SectionChipHeading({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="sticky top-0 z-10 px-2 py-1.5 bg-black/40 backdrop-blur border-b border-white/10">
      <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase text-[var(--color-text,#c9c9c9)]">
        {icon}
        <span>{text}</span>
        <span className="ml-auto h-px w-24 rounded-full bg-[hsl(var(--brand-orange)/0.65)]" />
      </div>
    </div>
  );
}

type DetailsFieldSpec<T> = {
  label: string;
  key: keyof T | string;
  view?: (row: T) => React.ReactNode;
  editor?: string;
};

type DetailsSectionSpec<T> = {
  title: string;
  fields: DetailsFieldSpec<T>[];
};

type DetailsSpecRendererProps<T> = {
  row: T;
  mode: "view" | "edit";
  setDraft: (draft: Partial<T>) => void;
  sections: DetailsSectionSpec<T>[];
};

function DetailsSpecRenderer<T extends Record<string, any>>({
  row,
  sections,
}: DetailsSpecRendererProps<T>) {
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <SectionCard key={section.title} title={section.title}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {section.fields.map((field) => {
              const raw =
                typeof field.view === "function"
                  ? field.view(row)
                  : (row as any)[field.key as keyof T];

              const value =
                raw === null || raw === undefined || raw === ""
                  ? "-"
                  : raw;

              return (
                <div key={String(field.key)} className="flex flex-col gap-0.5">
                  <div className="text-xs font-medium text-secondary">
                    {field.label}
                  </div>
                  <div>{value}</div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

/* ───────────────────────── Underline tabs ───────────────────────── */
function UnderlineTabs({
  value,
  onChange,
}: {
  value: "offspring" | "groups" | "waitlist";
  onChange: (v: "offspring" | "groups" | "waitlist") => void;
}) {
  const base =
    "h-9 px-1.5 text-sm font-semibold leading-9 border-b-2 border-solid border-transparent transition-colors";
  const activeText = "text-[var(--color-text-strong,#e9e9e9)]";

  return (
    <div role="tablist" aria-label="Offspring tabs" className="flex gap-6">
      <button
        role="tab"
        aria-selected={value === "groups"}
        className={[base, value === "groups" ? activeText : ""].join(" ")}
        onClick={() => onChange("groups")}
        style={value === "groups" ? { borderBottomColor: "hsl(var(--brand-orange))" } : undefined}
      >
        Groups
      </button>
      <button
        role="tab"
        aria-selected={value === "offspring"}
        className={[base, value === "offspring" ? activeText : ""].join(" ")}
        onClick={() => onChange("offspring")}
        style={value === "offspring" ? { borderBottomColor: "hsl(var(--brand-orange))" } : undefined}
      >
        Offspring
      </button>
      <button
        role="tab"
        aria-selected={value === "waitlist"}
        className={[base, value === "waitlist" ? activeText : ""].join(" ")}
        onClick={() => onChange("waitlist")}
        style={value === "waitlist" ? { borderBottomColor: "hsl(var(--brand-orange))" } : undefined}
      >
        Waitlist
      </button>
    </div>
  );
}

function fmtDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return Number.isFinite(dt.getTime()) ? dt.toLocaleDateString() : "";
}

function fmtRange(start?: string | null, end?: string | null): string {
  const a = start ? fmtDate(start) : "";
  const b = end ? fmtDate(end) : "";

  if (a && b) {
    if (a === b) return a;
    return `${a} - ${b}`;
  }

  return a || b || "";
}

function MiniTimeline({ row }: { row: OffspringRow }) {
  const dates = row.dates ?? {};

  const breedingExpected = dates.breedingDateExpected ?? null;
  const breedingActual = dates.breedingDateActual ?? null;

  const birthStart = dates.birthedStartAt ?? null;
  const birthEnd = dates.birthedEndAt ?? null;

  const weanDate = dates.weanedAt ?? null;

  const placementStart =
    row.expectedPlacementStart ?? dates.placementStartDateExpected ?? null;
  const placementEnd =
    row.expectedPlacementCompleted ?? dates.placementCompletedDateExpected ?? null;

  return (
    <div className="mt-3 space-y-1 text-[10px]">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        Lifecycle bands
      </div>

      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        <div
          className="flex-1 bg-[color:var(--avail-risky-fill,#3b3b3b)]"
          title={
            breedingExpected
              ? `Breeding · ${fmtDate(breedingExpected)}${breedingActual ? ` (actual ${fmtDate(breedingActual)})` : ""
              }`
              : "Breeding"
          }
        />
        <div
          className="flex-1 bg-[color:var(--brand-orange,#f97316)]"
          title={
            birthStart || birthEnd
              ? `Birth · ${fmtRange(birthStart, birthEnd)}`
              : "Birth"
          }
        />
        <div
          className="flex-1 bg-[color:var(--avail-unlikely-fill,#555555)]"
          title={weanDate ? `Weaning · ${fmtDate(weanDate)}` : "Weaning"}
        />
        <div
          className="flex-1 bg-[color:var(--avail-normal-fill,#777777)]"
          title={
            placementStart || placementEnd
              ? `Placement · ${fmtRange(placementStart, placementEnd)}`
              : "Placement"
          }
        />
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Breeding</span>
        <span>Birth</span>
        <span>Weaning</span>
        <span>Placement</span>
      </div>
    </div>
  );
}


function AttachmentsSection({
  group,
  api,
  mode,
}: {
  group: OffspringRow;
  api: ReturnType<typeof makeOffspringApi> | null;
  mode: "media" | "health" | "registration";
}) {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!api || !group?.id) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res =
          (api as any).attachments?.listForGroup?.(group.id, { category: mode }) ??
          (api as any).attachments?.listForGroup?.(group.id);
        const awaited =
          res && typeof (res as any).then === "function" ? await res : res;
        if (!cancelled && awaited) {
          setItems(Array.isArray(awaited) ? awaited : awaited.items ?? []);
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error("Failed to load attachments", e);
          setError("Failed to load attachments");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [api, group?.id, mode]);

  async function handleUpload(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file || !api || !group?.id) return;
    setUploading(true);
    setError(null);
    try {
      const res =
        (api as any).attachments?.uploadToGroup?.(group.id, file, {
          category: mode,
        }) ??
        (api as any).attachments?.uploadToGroup?.(group.id, file);
      const uploaded =
        res && typeof (res as any).then === "function" ? await res : res;
      if (uploaded) {
        setItems((prev) => [...prev, uploaded]);
      }
    } catch (e: any) {
      console.error("Upload failed", e);
      setError("Upload failed");
    } finally {
      setUploading(false);
      // Reset so the same file can be chosen again
      ev.target.value = "";
    }
  }

  async function handleRemove(att: any) {
    if (!api || !group?.id || !att?.id) return;
    try {
      await (api as any).attachments?.remove?.(group.id, att.id);
      setItems((prev) => prev.filter((x) => x.id !== att.id));
    } catch (e: any) {
      console.error("Failed to remove attachment", e);
      setError("Failed to remove attachment");
    }
  }

  const label =
    mode === "media"
      ? "Photos and videos"
      : mode === "health"
        ? "Health records and vet docs"
        : "Registration and paperwork";

  const isMedia = mode === "media";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center rounded border border-border bg-background px-2 py-1 text-xs font-medium hover:bg-accent">
            <span>{uploading ? "Uploading..." : "Upload"}</span>
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading || !api}
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-2 text-[11px] text-destructive">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-xs text-muted-foreground">Loading attachments...</div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-xs text-muted-foreground">No attachments yet.</div>
      )}

      {!loading && items.length > 0 && isMedia && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((att) => {
            const url = att.url || att.href;
            const name = att.fileName || att.name || `Attachment #${att.id}`;
            return (
              <div
                key={att.id}
                className="group relative overflow-hidden rounded border border-border bg-background"
              >
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block aspect-square overflow-hidden"
                  >
                    <img
                      src={url}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  </a>
                ) : (
                  <div className="flex aspect-square items-center justify-center text-[11px] text-muted-foreground">
                    {name}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(att)}
                  className="absolute right-1 top-1 rounded bg-background/80 px-1 text-[10px] opacity-0 transition-opacity group-hover:opacity-100"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!loading && items.length > 0 && !isMedia && (
        <div className="space-y-1">
          {items.map((att) => {
            const url = att.url || att.href;
            const name = att.fileName || att.name || `Attachment #${att.id}`;
            const uploadedAt = att.createdAt || att.uploadedAt;
            return (
              <div
                key={att.id}
                className="flex items-center justify-between gap-2 rounded border border-border bg-background px-2 py-1 text-xs"
              >
                <div className="min-w-0 flex-1">
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-[11px] font-medium text-primary underline"
                    >
                      {name}
                    </a>
                  ) : (
                    <span className="truncate text-[11px] font-medium">
                      {name}
                    </span>
                  )}
                  {uploadedAt && (
                    <div className="text-[10px] text-muted-foreground">
                      Uploaded {fmtDate(uploadedAt)}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(att)}
                  className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] hover:bg-accent"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


/* ───────────────────────── URL driver for DetailsHost ───────────────────────── */
function setParamAndNotify(idParam: "groupId" | "waitlistId", id: number) {
  const url = new URL(location.href);
  const other = idParam === "groupId" ? "waitlistId" : "groupId";
  const current = url.searchParams.get(idParam);

  // Always clear the opposite idParam
  url.searchParams.delete(other);

  if (current === String(id)) {
    // Cycle: remove then re-add to re-trigger listeners
    url.searchParams.delete(idParam);
    history.replaceState({}, "", url);
    window.dispatchEvent(new Event("popstate"));
    requestAnimationFrame(() => {
      const again = new URL(location.href);
      again.searchParams.set(idParam, String(id));
      history.replaceState({}, "", again);
      window.dispatchEvent(new Event("popstate"));
    });
  } else {
    url.searchParams.set(idParam, String(id));
    history.replaceState({}, "", url);
    window.dispatchEvent(new Event("popstate"));
  }
}

/* ───────────────────────── Groups table ───────────────────────── */
type GroupTableRow = {
  id: number;
  planCode?: string | null;
  groupName?: string | null;
  species?: string | null;
  breed?: string | null;

  damName?: string | null;
  damId?: number | null;

  sireName?: string | null;
  sireId?: number | null;

  expectedCycleStart?: string | null;
  expectedHormoneTestingStart?: string | null;
  expectedBreedDate?: string | null;
  expectedBirth?: string | null;
  expectedWeanedDate?: string | null;
  expectedPlacementStart?: string | null;
  expectedPlacementCompleted?: string | null;

  seasonLabel?: string | null;

  // Optional group level tags, from backend if present
  tags?: string[] | null;

  // Counts
  countLive?: number | null;
  countReserved?: number | null;
  countSold?: number | null;
  countWeaned?: number | null;
  countPlaced?: number | null;

  // Status and overrides
  statusOverride?: string | null;
  statusOverrideReason?: string | null;
  status?: string | null;

  // Metrics
  totalOffspring?: number | null;
  maleCount?: number | null;
  femaleCount?: number | null;
  unknownSexCount?: number | null;
  mortalityCount?: number | null;
  mortalityRate?: number | null;
  waitlistOverlapCount?: number | null;
  avgPlacementPriceCents?: number | null;

  updatedAt?: string | null;
};

const GROUP_COLS: Array<{ key: keyof GroupTableRow & string; label: string; default?: boolean }> = [
  { key: "groupName", label: "Group", default: true },
  { key: "species", label: "Species", default: true },
  { key: "breed", label: "Breed", default: true },
  { key: "damName", label: "Dam", default: true },
  { key: "sireName", label: "Sire", default: true },

  { key: "seasonLabel", label: "Season", default: false },

  { key: "expectedBirth", label: "Expected Birth", default: true },
  { key: "countSold", label: "Sold", default: true },
  { key: "status", label: "Status", default: true },
  { key: "planCode", label: "Plan", default: false },
  { key: "expectedPlacementStart", label: "Placement Start", default: false },
  { key: "expectedPlacementCompleted", label: "Placement Done", default: false },
  { key: "countLive", label: "Live", default: false },
  { key: "countReserved", label: "Reserved", default: true },

  // New columns, off by default
  { key: "countWeaned", label: "Weaned", default: false },
  { key: "countPlaced", label: "Placed", default: false },
  { key: "statusOverride", label: "Status Override", default: false },
  { key: "updatedAt", label: "Updated", default: false },
];

const GROUP_STORAGE_KEY = "bhq_offspring_groups_cols_v3";

/** Derive countSold if not provided by backend */
function deriveCountSold(d: OffspringRow): number {
  const backendSold = (d as any)?.counts?.sold;
  if (typeof backendSold === "number" && Number.isFinite(backendSold)) return backendSold;
  const placed = (d as any)?.counts?.placed;
  if (typeof placed === "number" && Number.isFinite(placed)) return placed;
  const animals = d.counts?.animals ?? 0;
  const reserved = d.counts?.reserved ?? 0;
  const lastResort = Math.max(0, animals - reserved);
  return Number.isFinite(lastResort) ? lastResort : 0;
}

function onlyDay(v: any): string | null {
  if (!v) return null;
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const iso = s.includes("T") ? s.slice(0, 10) : null;
  return /^\d{4}-\d{2}-\d{2}$/.test(iso || "") ? iso : null;
}

function pickExpectedTestingStart(preview: any, lockedCycleStart?: string | null) {
  const day = (s: any) => (s ? String(s).slice(0, 10) : null);

  const fromPreview =
    preview?.hormone_testing_full?.[0] ??
    preview?.hormoneTesting_full?.[0] ??
    preview?.hormone_testing_expected ??
    preview?.testing_expected ??
    preview?.testing_start ??
    preview?.hormone_testing_start ??
    null;

  if (fromPreview) return day(fromPreview);

  if (lockedCycleStart) {
    const [y, m, d] = String(lockedCycleStart).slice(0, 10).split("-").map(Number);
    const t = Date.UTC(y, m - 1, d) + 7 * 86400000;
    const dt = new Date(t);
    const yyyy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  return null;
}

function toWireSpeciesLite(s: any): string | undefined {
  const v = String(s || "").toUpperCase();
  if (!v) return undefined;
  return v;
}

function computeExpectedForPlanLite(plan: { species?: string | null; lockedCycleStart?: string | null }) {
  const speciesWire = toWireSpeciesLite(plan.species) ?? "DOG";
  const locked = (plan.lockedCycleStart || "").slice(0, 10) || null;

  if (!locked) {
    return {
      expectedCycleStart: null,
      expectedHormoneTestingStart: null,
      expectedBreedDate: null,
      expectedBirthDate: null,
      expectedWeanedDate: null,
      expectedPlacementStartDate: null,
      expectedPlacementCompletedDate: null,
    };
  }

  const preview = expectedMilestonesFromLocked(locked, speciesWire) || {};

  const expectedCycleStart = locked;
  const expectedHormoneTestingStart = pickExpectedTestingStart(preview, locked);
  const expectedBreedDate = onlyDay(preview.ovulation ?? preview.breeding_expected) || null;
  const expectedBirthDate = onlyDay(preview.birth_expected) || null;
  const expectedWeanedDate =
    onlyDay(
      preview.weaning_expected ??
        preview.weaned_expected ??
        preview.puppy_care_likely?.[0],
    ) || null;

  const expectedPlacementStartDate =
    onlyDay(
      preview.placement_expected ??
        preview.placement_start_expected ??
        preview.placement_start,
    ) || null;

  const expectedPlacementCompletedDate =
    onlyDay(
      preview.placement_extended_end ??
        preview.placement_extended_end_expected ??
        preview.placement_expected_end ??
        preview.placement_completed_expected ??
        preview.placement_extended_full?.[1],
    ) || null;

  return {
    expectedCycleStart,
    expectedHormoneTestingStart,
    expectedBreedDate,
    expectedBirthDate,
    expectedWeanedDate,
    expectedPlacementStartDate,
    expectedPlacementCompletedDate,
  };
}

type PlannerSpecies = "Dog" | "Cat" | "Horse";

type ExpectedLite = {
  expectedCycleStart: string | null;
  expectedHormoneTestingStart: string | null;
  expectedBreedDate: string | null;
  expectedBirthDate: string | null;
  expectedWeanedDate: string | null;
  expectedPlacementStartDate: string | null;
  expectedPlacementCompletedDate: string | null;
};

function computeExpectedForPlanLite(input: {
  species?: PlannerSpecies | null;
  lockedCycleStart?: string | null;
}) : ExpectedLite | null {
  const species = input.species;
  const lockedCycleStart = input.lockedCycleStart;

  if (!species || !lockedCycleStart) return null;

  const preview = null;
  const expected = expectedMilestonesFromLocked({ species, lockedCycleStart, preview });

  const onlyDay = (iso?: string | null) => (iso ? day(iso) : null);

  const expectedCycleStart = onlyDay(expected.cycle_start_expected);
  const expectedHormoneTestingStart = onlyDay(
    expected.hormone_testing_start_expected ??
      expected.testing_start ??
      expected.hormone_testing_start,
  );
  const expectedBreedDate = onlyDay(
    expected.breeding_expected ?? expected.breeding_full?.[0],
  );
  const expectedBirthDate = onlyDay(expected.birth_expected);
  const expectedWeanedDate = onlyDay(
    expected.weaning_expected ??
      expected.weaned_expected ??
      expected.puppy_care_likely?.[0],
  );
  const expectedPlacementStartDate = onlyDay(
    expected.placement_expected ??
      expected.placement_start_expected ??
      expected.placement_start,
  );
  const expectedPlacementCompletedDate = onlyDay(
    expected.placement_extended_end ??
      expected.placement_extended_end_expected ??
      expected.placement_expected_end ??
      expected.placement_completed_expected ??
      expected.placement_extended_full?.[1],
  );

  return {
    expectedCycleStart,
    expectedHormoneTestingStart,
    expectedBreedDate,
    expectedBirthDate,
    expectedWeanedDate,
    expectedPlacementStartDate,
    expectedPlacementCompletedDate,
  };
}

function mapDetailToTableRow(d: OffspringRow): GroupTableRow {
  const plan = d.plan;
  const planAny: any = plan;
  const counts = d.counts ?? {};
  const detailAny: any = d;
  const dates = d.dates ?? {};

  const expectedFromPlan = plan
    ? computeExpectedForPlanLite({
        species: plan.species as any,
        lockedCycleStart: (planAny.lockedCycleStart as string | null) ?? null,
      })
    : null;

  // Map backend plan statuses into user friendly group statuses
  const rawPlanStatus: string | undefined = planAny?.status;
  let derivedStatus: string | null = null;
  switch (rawPlanStatus) {
    case "PLANNING":
    case "COMMITTED":
    case "ACTIVE":
    case "BRED":
    case "PREGNANT":
      derivedStatus = "Planned";
      break;
    case "BIRTHED":
      derivedStatus = "Born";
      break;
    case "WEANED":
      derivedStatus = "Weaned";
      break;
    case "PLACEMENT":
    case "HOMING":
    case "HOMING_STARTED":
      derivedStatus = "Homing";
      break;
    case "COMPLETE":
      derivedStatus = "Complete";
      break;
    case "CANCELED":
      derivedStatus = "Canceled";
      break;
    default:
      derivedStatus = null;
  }

  const baseStatus =
    derivedStatus ??
    (planAny?.status === "COMMITTED" || planAny?.status === "ACTIVE"
      ? "Committed"
      : "Planning");

  const status = d.statusOverride || baseStatus;

  // Season label from earliest birth expectation we can see
  const seasonSourceIso =
    (d.dates && (d.dates.birthedStartAt || d.dates.birthedEndAt)) ||
    expectedFromPlan?.expectedBirthDate ||
    planAny?.expectedBirthDate ||
    expectedFromPlan?.expectedPlacementStartDate ||
    planAny?.expectedPlacementStart ||
    null;

  const seasonLabel = safeSeasonLabelFromISO(seasonSourceIso);

  // Aggregate metrics for summary chips
  const metrics = computeGroupMetrics(d as any);

  const row: GroupTableRow = {
    id: d.id,
    planCode: plan?.code ?? null,
    groupName: plan?.name ?? d.identifier ?? `Group #${d.id}`,
    species: plan?.species ?? d.species ?? null,
    breed: plan?.breedText ?? null,

    damName: plan?.dam?.name ?? null,
    damId: plan?.dam?.id ?? null,

    sireName: plan?.sire?.name ?? null,
    sireId: plan?.sire?.id ?? null,

    // Timeline values powering the Overview card
    expectedCycleStart: expectedFromPlan?.expectedCycleStart ?? null,
    expectedHormoneTestingStart: expectedFromPlan?.expectedHormoneTestingStart ?? null,
    expectedBreedDate: expectedFromPlan?.expectedBreedDate ?? null,
    expectedBirth:
      expectedFromPlan?.expectedBirthDate ??
      (planAny?.expectedBirthDate as string | null) ??
      null,
    expectedWeanedDate:
      expectedFromPlan?.expectedWeanedDate ??
      (dates.weanedAt as string | null) ??
      null,
    expectedPlacementStart:
      expectedFromPlan?.expectedPlacementStartDate ??
      (dates.placementStartAt as string | null) ??
      null,
    expectedPlacementCompleted:
      expectedFromPlan?.expectedPlacementCompletedDate ??
      (dates.placementCompletedAt as string | null) ??
      null,

    seasonLabel,

    // Tags from backend if present
    tags: detailAny.tags ?? null,

    // Counts
    countLive: counts.live ?? null,
    countReserved: counts.reserved ?? null,
    countSold: deriveCountSold(d),
    countWeaned: counts.weaned ?? null,
    countPlaced: counts.placed ?? null,

    // Status
    statusOverride: d.statusOverride ?? null,
    statusOverrideReason: d.statusOverrideReason ?? null,
    status,

    // Metrics
    totalOffspring: metrics.totalOffspring,
    maleCount: metrics.maleCount,
    femaleCount: metrics.femaleCount,
    unknownSexCount: metrics.unknownSexCount,
    mortalityCount: metrics.mortalityCount,
    mortalityRate: metrics.mortalityRate,
    waitlistOverlapCount: null,
    avgPlacementPriceCents: metrics.avgPlacementPriceCents ?? null,

    updatedAt: d.updatedAt ?? null,
  };

  return row;
}

function GroupSummaryBand({ row }: { row: GroupTableRow }) {
  const total = row.totalOffspring ?? row.countLive ?? 0;
  const male = row.maleCount ?? 0;
  const female = row.femaleCount ?? 0;
  const unknown = row.unknownSexCount ?? 0;

  const mortalityCount = row.mortalityCount ?? 0;
  const mortalityRate =
    typeof row.mortalityRate === "number" && row.mortalityRate > 0
      ? `${Math.round(row.mortalityRate * 100)}%`
      : null;

  const placed = row.countPlaced ?? 0;
  const placementLabel =
    total && total > 0 ? `${placed} of ${total} placed` : `${placed} placed`;

  const waitlistOverlap = row.waitlistOverlapCount ?? 0;

  const avgPrice = row.avgPlacementPriceCents ?? null;
  const avgPriceLabel =
    avgPrice && avgPrice > 0 ? formatMoneyFromCents(avgPrice) : "n/a";

  return (
    <div className="mb-4 grid gap-2 md:grid-cols-3 lg:grid-cols-6">
      <div className="rounded border border-[var(--hairline,#222)] bg-[color:var(--surface-subtle,#111)] px-2 py-1.5">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Total offspring
        </div>
        <div className="text-sm font-semibold">{total}</div>
      </div>

      <div className="rounded border border-[var(--hairline,#222)] bg-[color:var(--surface-subtle,#111)] px-2 py-1.5">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Sex breakdown
        </div>
        <div className="text-sm">
          {male} M · {female} F · {unknown} U
        </div>
      </div>

      <div className="rounded border border-[var(--hairline,#222)] bg-[color:var(--surface-subtle,#111)] px-2 py-1.5">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Mortality
        </div>
        <div className="text-sm">
          {mortalityCount}
          {mortalityRate ? ` (${mortalityRate})` : ""}
        </div>
      </div>

      <div className="rounded border border-[var(--hairline,#222)] bg-[color:var(--surface-subtle,#111)] px-2 py-1.5">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Placement
        </div>
        <div className="text-sm">{placementLabel}</div>
      </div>

      <div className="rounded border border-[var(--hairline,#222)] bg-[color:var(--surface-subtle,#111)] px-2 py-1.5">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Waitlist overlap
        </div>
        <div className="text-sm">{waitlistOverlap}</div>
      </div>

      <div className="rounded border border-[var(--hairline,#222)] bg-[color:var(--surface-subtle,#111)] px-2 py-1.5">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Avg placement price
        </div>
        <div className="text-sm">{avgPriceLabel}</div>
      </div>
    </div>
  );
}

function IdentityField(props: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {props.label}
      </div>
      <div className="text-sm">{props.children ?? "-"}</div>
    </div>
  );
}


const groupSections = (mode: "view" | "edit") => [
  {
    title: "Timeline",
    fields: [
      {
        label: "CYCLE START (EXPECTED)",
        key: "expectedCycleStart",
        view: (r: GroupTableRow) => fmtDate(r.expectedCycleStart) || "-",
      },
      {
        label: "HORMONE TESTING START (EXPECTED)",
        key: "expectedHormoneTestingStart",
        view: (r: GroupTableRow) => fmtDate(r.expectedHormoneTestingStart) || "-",
      },
      {
        label: "BREEDING DATE (EXPECTED)",
        key: "expectedBreedDate",
        view: (r: GroupTableRow) => fmtDate(r.expectedBreedDate) || "-",
      },
      {
        label: "BIRTH DATE (EXPECTED)",
        key: "expectedBirth",
        view: (r: GroupTableRow) => fmtDate(r.expectedBirth) || "-",
      },
      {
        label: "WEANED DATE (EXPECTED)",
        key: "expectedWeanedDate",
        view: (r: GroupTableRow) => fmtDate(r.expectedWeanedDate) || "-",
      },
      {
        label: "PLACEMENT START (EXPECTED)",
        key: "expectedPlacementStart",
        view: (r: GroupTableRow) => fmtDate(r.expectedPlacementStart) || "-",
      },
      {
        label: "PLACEMENT COMPLETED (EXPECTED)",
        key: "expectedPlacementCompleted",
        view: (r: GroupTableRow) => fmtDate(r.expectedPlacementCompleted) || "-",
      },
    ],
  },

  {
    title: "Status & Metadata",
    fields: [
      {
        label: "Status Override",
        key: "statusOverride",
        editor: "text",
        view: (r: GroupTableRow) => r.statusOverride || "-",
      },
      {
        label: "Override Reason",
        key: "statusOverrideReason",
        editor: "text",
        view: (r: GroupTableRow) => r.statusOverrideReason || "-",
      },
      {
        label: "Tags",
        key: "tags",
        view: (r: GroupTableRow) =>
          r.tags && r.tags.length > 0 ? r.tags.join(", ") : "-",
      },
      {
        label: "Status",
        key: "status",
        view: (r: GroupTableRow) => r.status || "-",
      },
      {
        label: "Updated",
        key: "updatedAt",
        view: (r: GroupTableRow) => fmtDate(r.updatedAt) || "-",
      },
    ],
  },
  {
    title: "Tags & Metadata",
    fields: [
      {
        label: "Tags",
        key: "tags",
        view: (r: GroupTableRow) =>
          r.tags && r.tags.length > 0 ? r.tags.join(", ") : "-",
      },
      {
        label: "Status",
        key: "status",
        view: (r: GroupTableRow) => r.status || "-",
      },
      {
        label: "Updated",
        key: "updatedAt",
        view: (r: GroupTableRow) => fmtDate(r.updatedAt) || "-",
      },
    ],
  },

  {
    title: "Counts",
    fields: [
      {
        label: "Live",
        key: "countLive",
        editor: "number",
        view: (r: GroupTableRow) => String(r.countLive ?? 0),
      },
      {
        label: "Weaned",
        key: "countWeaned",
        editor: "number",
        view: (r: GroupTableRow) => String(r.countWeaned ?? 0),
      },
      {
        label: "Placed",
        key: "countPlaced",
        editor: "number",
        view: (r: GroupTableRow) => String(r.countPlaced ?? 0),
      },
      {
        label: "Reserved",
        key: "countReserved",
        editor: "number",
        view: (r: GroupTableRow) => String(r.countReserved ?? 0),
      },
      {
        label: "Sold",
        key: "countSold",
        editor: "number",
        view: (r: GroupTableRow) => String(r.countSold ?? 0),
      },
    ],
  },
];

// /* ───────────────────────── Waitlist table ───────────────────────── */

// type WaitlistRowWire = WaitlistEntry;

// type WaitlistTableRow = {
//   id: number;
//   contactLabel?: string | null;
//   orgLabel?: string | null;
//   speciesPref?: string | null;
//   breedPrefText?: string | null;
//   damPrefName?: string | null;
//   sirePrefName?: string | null;
//   depositPaidAt?: string | null;
//   status?: string | null;
//   priority?: number | null;
//   skipCount?: number | null;
//   lastActivityAt?: string | null;
//   notes?: string | null;
// };

// const WAITLIST_COLS: Array<{ key: keyof WaitlistTableRow & string; label: string; default?: boolean }> = [
//   { key: "contactLabel", label: "Contact", default: true },
//   { key: "orgLabel", label: "Org", default: true },
//   { key: "speciesPref", label: "Species", default: true },
//   { key: "breedPrefText", label: "Breeds", default: true },
//   { key: "damPrefName", label: "Dam", default: true },
//   { key: "sirePrefName", label: "Sire", default: true },
//   { key: "depositPaidAt", label: "Deposit Paid On", default: true },
//   { key: "status", label: "Status", default: false },
//   { key: "priority", label: "Priority", default: false },
//   { key: "skipCount", label: "Skips", default: false },
//   { key: "lastActivityAt", label: "Activity", default: false },
// ];

// const WAITLIST_STORAGE_KEY = "bhq_waitlist_cols_v2";

// function mapWaitlistToTableRow(w: any): WaitlistTableRow {
//   const contact =
//     w.contact ||
//     (w.contactId != null
//       ? { id: w.contactId, display_name: w.contactName, first_name: w.firstName, last_name: w.lastName }
//       : null);
//   const org = w.organization || (w.organizationId != null ? { id: w.organizationId, name: w.organizationName } : null);
//   const dam = w.damPref || (w.damPrefId != null ? { id: w.damPrefId, name: w.damPrefName } : null);
//   const sire = w.sirePref || (w.sirePrefId != null ? { id: w.sirePrefId, name: w.sirePrefName } : null);

//   const contactLabel =
//     contact?.display_name ||
//     `${(contact?.first_name ?? "").trim()} ${(contact?.last_name ?? "").trim()}`.trim() ||
//     (contact ? `#${contact.id}` : null);

//   const orgLabel = org?.name ?? (org ? `#${org.id}` : null);

//   const breedPrefText =
//     w.breedPrefText ||
//     (Array.isArray(w.breedPrefs) ? w.breedPrefs.filter(Boolean).join(", ") : null) ||
//     null;

//   return {
//     id: Number(w.id),
//     contactLabel: contactLabel ?? null,
//     orgLabel: orgLabel ?? null,
//     speciesPref: w.speciesPref ?? null,
//     breedPrefText,
//     damPrefName: dam?.name ?? null,
//     sirePrefName: sire?.name ?? null,
//     depositPaidAt: w.depositPaidAt ?? null,
//     status: w.status ?? null,
//     priority: w.priority ?? null,
//     skipCount: w.skipCount ?? null,
//     lastActivityAt: w.lastActivityAt ?? w.updatedAt ?? w.createdAt ?? null,
//     notes: w.notes ?? null,
//   };
// }

// const waitlistSections = (mode: "view" | "edit") => [
//   {
//     title: "Overview",
//     fields: [
//       { label: "Contact", key: "contactLabel", view: (r: WaitlistTableRow) => r.contactLabel || "-" },
//       { label: "Organization", key: "orgLabel", view: (r: WaitlistTableRow) => r.orgLabel || "-" },
//       { label: "Species", key: "speciesPref", view: (r: WaitlistTableRow) => r.speciesPref || "-" },
//       { label: "Breeds", key: "breedPrefText", view: (r: WaitlistTableRow) => r.breedPrefText || "-" },
//       { label: "Dam Pref", key: "damPrefName", view: (r: WaitlistTableRow) => r.damPrefName || "-" },
//       { label: "Sire Pref", key: "sirePrefName", view: (r: WaitlistTableRow) => r.sirePrefName || "-" },
//       { label: "Deposit Paid", key: "depositPaidAt", editor: "date", view: (r: WaitlistTableRow) => fmtDate(r.depositPaidAt) || "-" },
//       { label: "Status", key: "status", editor: "text", view: (r: WaitlistTableRow) => r.status || "-" },
//       { label: "Priority", key: "priority", editor: "number", view: (r: WaitlistTableRow) => String(r.priority ?? "") || "-" },
//       { label: "Skips", key: "skipCount", view: (r: WaitlistTableRow) => String(r.skipCount ?? 0) },
//       { label: "Activity", key: "lastActivityAt", view: (r: WaitlistTableRow) => fmtDate(r.lastActivityAt) || "-" },
//     ],
//   },
//   {
//     title: "Notes",
//     fields: [{ label: "Notes", key: "notes", editor: "textarea", view: (r: WaitlistTableRow) => r.notes || "-" }],
//   },
// ];

/* ───────────────────────── Directory/Animals helpers ───────────────────────── */
type SpeciesWire = "DOG" | "CAT" | "HORSE";
type SpeciesUi = "Dog" | "Cat" | "Horse";
const SPECIES_UI_ALL: SpeciesUi[] = ["Dog", "Cat", "Horse"];
const toWireSpecies = (s: SpeciesUi | ""): SpeciesWire | undefined =>
  s === "Dog" ? "DOG" : s === "Cat" ? "CAT" : s === "Horse" ? "HORSE" : undefined;

type DirectoryHit =
  | { kind: "contact"; id: number; label: string; sub?: string }
  | { kind: "org"; id: number; label: string; sub?: string };

async function searchDirectory(api: ReturnType<typeof makeOffspringApi> | null, q: string): Promise<DirectoryHit[]> {
  if (!api || !q.trim()) return [];
  const [cRes, oRes] = await Promise.allSettled([api.contacts.list({ q, limit: 25 }), api.organizations.list({ q, limit: 25 })]);

  const hits: DirectoryHit[] = [];
  if (cRes.status === "fulfilled" && cRes.value) {
    const items: any[] = Array.isArray(cRes.value) ? cRes.value : cRes.value.items ?? [];
    for (const c of items) {
      const name = c.display_name || `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "(No name)";
      hits.push({ kind: "contact", id: Number(c.id), label: name, sub: c.email || c.phoneE164 || "" });
    }
  }
  if (oRes.status === "fulfilled" && oRes.value) {
    const items: any[] = Array.isArray(oRes.value) ? oRes.value : oRes.value.items ?? [];
    for (const o of items) hits.push({ kind: "org", id: Number(o.id), label: o.name, sub: o.website || o.email || "" });
  }
  return hits;
}

type AnimalLite = { id: number; name: string; species: SpeciesWire; sex: "FEMALE" | "MALE" };
async function fetchAnimals(
  api: ReturnType<typeof makeOffspringApi> | null,
  opts: { q?: string; species?: SpeciesWire; sex?: "FEMALE" | "MALE"; limit?: number }
) {
  if (!api) return [];
  const res = await api.animals.list({ q: opts.q, species: opts.species, sex: opts.sex, limit: opts.limit ?? 25 });
  const raw: any[] = Array.isArray(res) ? res : res?.items ?? [];
  return raw.map((a) => ({
    id: Number(a.id),
    name: String(a.name ?? "").trim(),
    species: String(a.species ?? "DOG").toUpperCase() as SpeciesWire,
    sex: String(a.sex ?? "FEMALE").toUpperCase() as "FEMALE" | "MALE",
  })) as AnimalLite[];
}

/* ───────────────────────── Plan fetch (COMMITTED only; GET) ───────────────────────── */
type PlanOption = { id: number; code: string | null; name: string; species: string; breedText: string | null };
async function fetchCommittedPlans(api: ReturnType<typeof makeOffspringApi> | null): Promise<PlanOption[]> {
  if (!api) return [];
  const qs = new URLSearchParams({ status: "COMMITTED", include: "parents", limit: "100" }).toString();
  let res: any;
  try {
    res = await api.raw.get<any>(`/breeding/plans?${qs}`);
  } catch {
    res = await api.raw.get<any>(`/plans?${qs}`);
  }
  const items = Array.isArray(res) ? res : res?.items ?? [];
  return items.map((p: any) => ({ id: p.id, code: p.code ?? null, name: p.name, species: p.species, breedText: p.breedText ?? null }));
}

/* ───────────────────────── Dam/Sire search hooks ───────────────────────── */
function useAnimalSearch(api: ReturnType<typeof makeOffspringApi> | null, query: string, species: SpeciesWire | undefined, sex: "FEMALE" | "MALE") {
  const [hits, setHits] = React.useState<AnimalLite[]>([]);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!api || !species || !query.trim()) {
        if (alive) setHits([]);
        return;
      }
      const res = await api.animals.list({ q: query.trim(), species, sex, limit: 25 });
      const items = Array.isArray(res) ? res : res?.items ?? [];
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
    })();
    return () => {
      alive = false;
    };
  }, [api, query, species, sex]);
  return hits;
}

function DamResults({ api, query, species, onPick }: { api: ReturnType<typeof makeOffspringApi> | null; query: string; species?: SpeciesWire; onPick: (a: AnimalLite) => void }) {
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

function SireResults({ api, query, species, onPick }: { api: ReturnType<typeof makeOffspringApi> | null; query: string; species?: SpeciesWire; onPick: (a: AnimalLite) => void }) {
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

/* ------------------------- Contact Helpers --------------------------- */
const stripEmpty = (o: Record<string, any>) => {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(o)) if (v !== null && v !== undefined && String(v).trim() !== "") out[k] = v;
  return out;
};

async function exactContactLookup(api: ReturnType<typeof makeOffspringApi>, probe: {
  email?: string; phone?: string; firstName?: string; lastName?: string
}) {
  const tries: string[] = [];
  if (probe.email) tries.push(probe.email);
  if (probe.phone) tries.push(probe.phone);
  const name = `${probe.firstName ?? ""} ${probe.lastName ?? ""}`.trim();
  if (name) tries.push(name);

  for (const q of tries) {
    const res = await api.contacts.list({ q, limit: 10 });
    const items: any[] = Array.isArray(res) ? res : res?.items ?? [];
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

/* ───────────────────────── Create Group form ───────────────────────── */
const MODAL_Z = 2147485000;

function CreateGroupForm({
  api,
  tenantId,
  onCreated,
  onCancel,
}: {
  api: ReturnType<typeof makeOffspringApi> | null;
  tenantId: number | null;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [plans, setPlans] = React.useState<PlanOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [planId, setPlanId] = React.useState<number | "">("");
  const [identifier, setIdentifier] = React.useState<string>("");
  const [weanedAt, setWeanedAt] = React.useState<string>("");
  const [placementStartAt, setPlacementStartAt] = React.useState<string>("");
  const [placementCompletedAt, setPlacementCompletedAt] = React.useState<string>("");

  /** NEW: override and counts */
  const [statusOverride, setStatusOverride] = React.useState<string>("");
  const [statusOverrideReason, setStatusOverrideReason] = React.useState<string>("");
  const [countWeaned, setCountWeaned] = React.useState<string>("");
  const [countPlaced, setCountPlaced] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchCommittedPlans(api);
        if (!cancelled) setPlans(list);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load committed plans");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const [submitting, setSubmitting] = React.useState(false);
  const [submitErr, setSubmitErr] = React.useState<string | null>(null);

  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!api) return;
    if (planId === "" || !Number(planId)) {
      setSubmitErr("Please choose a committed plan.");
      return;
    }
    setSubmitting(true);
    setSubmitErr(null);
    try {
      const created = await api.offspring.create({
        planId: Number(planId),
        identifier: identifier.trim() || null,
        statusOverride: statusOverride.trim() || null,
        statusOverrideReason: statusOverrideReason.trim() || null,
        counts:
          countWeaned || countPlaced
            ? {
              countWeaned: countWeaned === "" ? null : Number(countWeaned),
              countPlaced: countPlaced === "" ? null : Number(countPlaced),
            }
            : undefined,
        dates: {
          weanedAt: weanedAt || null,
          placementStartAt: placementStartAt || null,
          placementCompletedAt: placementCompletedAt || null,
        },
      });
      toast?.({ title: "Group created" });

      try {
        if (created && created.id != null) {
          window.dispatchEvent(
            new CustomEvent("bhq:group:created", {
              detail: { groupId: created.id },
            })
          );
        }
      } catch {
        // ignore event failures
      }

      onCreated();
    } catch (e: any) {
      setSubmitErr(e?.message || "Failed to create offspring group");
      toast?.({ title: "Create failed", description: String(e?.message || e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-[820px] max-w-[94vw]">
      <Card>
        <div className="p-4 space-y-4">
          <div className="text-lg font-semibold">New offspring group</div>
          <div className="text-sm text-secondary">Choose a committed plan, add identifiers, date(s), and optional overrides.</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className={labelClass}>
                Committed Plan <span className="text-[hsl(var(--brand-orange))]">*</span>
              </span>
              <select
                className={inputClass}
                value={planId}
                onChange={(e) => setPlanId(e.target.value ? Number(e.target.value) : "")}
                disabled={loading}
              >
                <option value="">Select a plan...</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code ? `${p.code} - ` : ""}
                    {p.name} ({p.species}
                    {p.breedText ? ` · ${p.breedText}` : ""})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className={labelClass}>Identifier (optional)</span>
              <input className={inputClass} value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="e.g., A Litter" />
            </label>

            <label className="flex flex-col gap-1">
              <span className={labelClass}>Weaned At (optional)</span>
              <input className={inputClass} type="date" value={weanedAt} onChange={(e) => setWeanedAt(e.target.value)} />
            </label>

            <label className="flex flex-col gap-1">
              <span className={labelClass}>Placement Start (optional)</span>
              <input className={inputClass} type="date" value={placementStartAt} onChange={(e) => setPlacementStartAt(e.target.value)} />
            </label>

            <label className="flex flex-col gap-1">
              <span className={labelClass}>Placement Completed (optional)</span>
              <input className={inputClass} type="date" value={placementCompletedAt} onChange={(e) => setPlacementCompletedAt(e.target.value)} />
            </label>

            {/* NEW: status override + reason */}
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Status Override (optional)</span>
              <input className={inputClass} value={statusOverride} onChange={(e) => setStatusOverride(e.target.value)} placeholder="e.g., Pause Homing" />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Override Reason (optional)</span>
              <input className={inputClass} value={statusOverrideReason} onChange={(e) => setStatusOverrideReason(e.target.value)} placeholder="Short explanation..." />
            </label>

            {/* NEW: counts weaned/placed */}
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Weaned Count (optional)</span>
              <input className={inputClass} type="number" value={countWeaned} onChange={(e) => setCountWeaned(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Placed Count (optional)</span>
              <input className={inputClass} type="number" value={countPlaced} onChange={(e) => setCountPlaced(e.target.value)} />
            </label>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {submitErr && <div className="text-sm text-red-600">{submitErr}</div>}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !planId || !api}>
              {submitting ? "Creating..." : "Create group"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ───────────────────────── Add to Waitlist modal ───────────────────────── */
function AddToWaitlistModal({
  api,
  tenantId,
  open,
  onClose,
  onCreated,
  allowedSpecies = SPECIES_UI_ALL,
}: {
  api: ReturnType<typeof makeOffspringApi> | null;
  tenantId: number | null;
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
  allowedSpecies?: SpeciesUi[];
}) {
  // Modal is always editable; defining this prevents ReferenceError from reads below.
  const readOnly = false;
  const panelRef = React.useRef<HTMLDivElement>(null);

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

  async function findBestContactMatch(
    api: ReturnType<typeof makeOffspringApi>,
    probe: { email?: string; phone?: string; firstName?: string; lastName?: string }
  ) {
    const q =
      probe.email?.trim() ||
      probe.phone?.trim() ||
      `${probe.firstName ?? ""} ${probe.lastName ?? ""}`.trim();

    if (!q) return null;

    const res = await api.contacts.list({ q, limit: 10 });
    const items: any[] = Array.isArray(res) ? res : res?.items ?? [];
    if (!items.length) return null;

    if (probe.email) {
      const eNorm = normalizeStr(probe.email);
      const byEmail = items.find((c) => normalizeStr(c.email) === eNorm);
      if (byEmail) return byEmail;
    }

    if (probe.phone) {
      const byPhone = items.find((c) => (c.phoneE164 || "") === probe.phone);
      if (byPhone) return byPhone;
    }

    const want = normalizeStr(`${probe.firstName ?? ""} ${probe.lastName ?? ""}`.trim());
    if (want) {
      const byName = items.find((c) =>
        normalizeStr(c.display_name || `${c.first_name ?? ""} ${c.last_name ?? ""}`) === want
      );
      if (byName) return byName;
    }

    return items[0];
  }

  function isConflict(err: any) {
    const status = err?.status ?? err?.code ?? err?.response?.status;
    const msg = String(err?.message || "").toLowerCase();
    return status === 409 || msg.includes("409") || msg.includes("conflict");
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
      const items: any[] = Array.isArray(found) ? found : found?.items ?? [];
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

  const canSubmit = !!link && !!speciesWire && !!(breed?.name || "").trim();

  async function handleSubmit() {
    if (!api || !canSubmit) return;
    await api.waitlist.create({
      contactId: link?.kind === "contact" ? link.id : null,
      organizationId: link?.kind === "org" ? link.id : null,
      speciesPref: speciesWire!,
      breedPrefs: (breed?.name ?? "").trim() ? [(breed?.name ?? "").trim()] : null,
      damPrefId: damId ?? null,
      sirePrefId: sireId ?? null,
    });
    await onCreated();
    onClose();
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
    <Overlay
      open={open}
      ariaLabel="Add Buyer"
      closeOnEscape
      closeOnOutsideClick
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <div
        className="fixed inset-0"
        style={{ zIndex: MODAL_Z + 1, isolation: "isolate" }}
        onMouseDown={handleOutsideMouseDown}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            ref={panelRef}
            className="pointer-events-auto overflow-hidden"
            style={{ width: 820, maxWidth: "95vw", height: 520, maxHeight: "82vh" }}
            data-buyer
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
                  <div className={labelClass + " mb-1"}>Search Contacts or Organizations</div>
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
                      autoFocus={!link}
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
                      (() => {
                        const contacts = filteredHits.filter((h) => h.kind === "contact");
                        const orgs = filteredHits.filter((h) => h.kind === "org");
                        const sectionClass = "rounded-md bg-white/5";
                        const pill = (t: string) => <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">{t}</span>;

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Contacts */}
                            <div className={sectionClass}>
                              <SectionChipHeading
                                icon={<span className="i-lucide-user-2 h-3.5 w-3.5" aria-hidden="true" />}
                                text="Contacts"
                              />
                              {contacts.length === 0 ? (
                                <div className="px-2 py-2 text-sm text-secondary">No contacts</div>
                              ) : (
                                contacts.map((h) => (
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
                                      {pill("Contact")}
                                      <span>{h.label}</span>
                                      {h.sub ? <span className="text-xs text-secondary">• {h.sub}</span> : null}
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>

                            {/* Orgs */}
                            <div className={sectionClass}>
                              <SectionChipHeading
                                icon={<span className="i-lucide-building-2 h-3.5 w-3.5" aria-hidden="true" />}
                                text="Organizations"
                              />
                              {orgs.length === 0 ? (
                                <div className="px-2 py-2 text-sm text-secondary">No organizations</div>
                              ) : (
                                orgs.map((h) => (
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
                                      {pill("Org")}
                                      <span>{h.label}</span>
                                      {h.sub ? <span className="text-xs text-secondary">• {h.sub}</span> : null}
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                )}

                {/* Quick add drawers */}
                {!link && quickOpen && (
                  <div className="rounded-lg border border-hairline p-3 bg-surface/60">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{quickOpen === "contact" ? "Quick Add Contact" : "Quick Add Organization"}</div>
                      <button className="text-xs text-secondary hover:underline" onClick={() => setQuickOpen(null)}>
                        Close
                      </button>
                    </div>

                    {quickOpen === "contact" ? (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input className={inputClass} placeholder="First name" value={qc.firstName} onChange={(e) => setQc({ ...qc, firstName: e.target.value })} />
                        <input className={inputClass} placeholder="Last name" value={qc.lastName} onChange={(e) => setQc({ ...qc, lastName: e.target.value })} />
                        <input className={inputClass} placeholder="Email" value={qc.email} onChange={(e) => setQc({ ...qc, email: e.target.value })} />
                        <input className={inputClass} placeholder="Phone (E.164)" value={qc.phone} onChange={(e) => setQc({ ...qc, phone: e.target.value })} />
                        {createErr && <div className="md:col-span-2 text-sm text-red-600">{createErr}</div>}
                        <div className="md:col-span-2 flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setQc({ firstName: "", lastName: "", email: "", phone: "" })}>
                            Clear
                          </Button>
                          <Button onClick={doQuickAdd} disabled={creating || !api}>
                            {creating ? "Creating..." : "Create / Link"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 grid grid-cols-1 gap-2">
                        <input className={inputClass} placeholder="Organization name" value={qo.name} onChange={(e) => setQo({ ...qo, name: e.target.value })} />
                        <input className={inputClass} placeholder="Website (optional)" value={qo.website} onChange={(e) => setQo({ ...qo, website: e.target.value })} />
                        {createErr && <div className="text-sm text-red-600">{createErr}</div>}
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setQo({ name: "", website: "" })}>Clear</Button>
                          <Button onClick={doQuickAdd} disabled={creating || !qo.name.trim() || !api}>{creating ? "Creating..." : "Create / Link"}</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Preferences (required) */}
                <SectionCard title="Preferences (required)">
                  <div className={"p-2 grid grid-cols-1 md:grid-cols-3 gap-3 " + (readOnly ? "opacity-70" : "")}>
                    <label className="flex flex-col gap-1">
                      <span className={labelClass}>Species</span>
                      <select
                        className={inputClass}
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
                        {allowedSpecies.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="md:col-span-2 relative">
                      <div className={labelClass + " mb-1"}>Breed</div>
                      {speciesUi ? (
                        <div className={readOnly ? "pointer-events-none opacity-60" : ""}>
                          <BreedCombo
                            key={`breed-${speciesUi}-${breedNonce}`}
                            species={speciesUi}
                            value={breed}
                            onChange={onBreedPick}
                            api={{ breeds: { listCanonical: api!.breeds.listCanonical } }}
                          />
                        </div>
                      ) : (
                        <div className="h-9 px-3 flex items-center rounded-md border border-hairline bg-surface/60 text-sm text-secondary">Select Species</div>
                      )}
                    </div>
                  </div>
                </SectionCard>

                {/* Parents (optional) */}
                <SectionCard title="Preferred Parents (optional)">
                  <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Dam */}
                    <label className="flex flex-col gap-1 relative">
                      <span className={labelClass}>Dam (Female)</span>
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
                      <span className={labelClass}>Sire (Male)</span>
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
                  <Button onClick={handleSubmit} disabled={!canSubmit || !api}>
                    Add to waitlist
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

/* ───────────────────────── Buyers hook and tab ───────────────────────── */

type Candidate = {
  id: number;
  contactLabel?: string | null;
  orgLabel?: string | null;
  speciesPref?: string | null;
  breedPrefText?: string | null;
  depositPaidAt?: string | null;
  priority?: number | null;
  skipCount?: number | null;
  notes?: string | null;
  source: "waitlist";
  /** Higher score means better match for this group */
  matchScore?: number;
  /** Human readable explanation of the match, for future UI use */
  matchTags?: string[];
};

function scoreMatch(
  c: Candidate,
  group: OffspringRow & { plan?: { species?: string | null; breedText?: string | null; damName?: string | null; sireName?: string | null } }
) {
  let score = 0;
  const species = group.plan?.species?.toLowerCase();
  const breed = group.plan?.breedText?.toLowerCase() ?? "";
  const prefSpecies = c.speciesPref?.toLowerCase();
  const prefBreed = c.breedPrefText?.toLowerCase() ?? "";

  if (prefSpecies && species && prefSpecies === species) score += 50;
  if (prefBreed && breed && prefBreed && breed.includes(prefBreed)) score += 30;

  // later you can extend with parent matching when the waitlist payload exposes preferred dam and sire
  return score;
}

function useGroupCandidates(api: ReturnType<typeof makeOffspringApi> | null, group: OffspringRow | null) {
  const [cands, setCands] = React.useState<Candidate[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!api || !group) {
        if (alive) {
          setCands([]);
          setLoading(false);
          setError(null);
        }
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const species = group.plan?.species;
        const breed = group.plan?.breedText;
        const res = await api.waitlist.list({ limit: 200, species: species as any, q: breed || undefined });
        const items: any[] = Array.isArray(res) ? res : res?.items ?? [];
        const mapped: Candidate[] = items
          .filter((w: any) => {
            // keep the same basic filter you already had
            if (!species) return true;
            if (String(w.speciesPref || "").toUpperCase() !== String(species || "").toUpperCase()) return false;
            if (breed && w.breedPrefText) {
              const hay = String(w.breedPrefText).toLowerCase();
              return hay.includes(String(breed).toLowerCase());
            }
            return true;
          })
          .slice(0, 25)
          .map((w: any) => {
            const t = mapWaitlistToTableRow(w);

            const groupSpecies = String(species || "").toUpperCase();
            const groupBreed = String(breed || "").toLowerCase();
            const candSpecies = String(t.speciesPref || "").toUpperCase();
            const candBreed = String(t.breedPrefText || "").toLowerCase();

            let matchScore = 0;
            const matchTags: string[] = [];

            // species match is the baseline requirement
            if (groupSpecies && candSpecies && candSpecies === groupSpecies) {
              matchScore += 10;
              matchTags.push("species");
            }

            // breed text match is a bonus on top of species
            if (groupBreed && candBreed && candBreed.includes(groupBreed)) {
              matchScore += 5;
              matchTags.push("breed");
            }

            return {
              id: t.id,
              contactLabel: t.contactLabel,
              orgLabel: t.orgLabel,
              speciesPref: t.speciesPref,
              breedPrefText: t.breedPrefText,
              depositPaidAt: t.depositPaidAt,
              priority: t.priority,
              skipCount: t.skipCount,
              notes: t.notes,
              source: "waitlist",
              matchScore,
              matchTags,
            } as Candidate;
          })
          // highest score first
          .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));

        if (alive) setCands(mapped);
      } catch (e: any) {
        if (alive) setError(e?.message || "Failed to load candidates");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [api, group?.id, group?.plan?.species, group?.plan?.breedText]);

  return { cands, loading, error, setCands };
}
function AddBuyerToGroupModal({
  api,
  group,
  open,
  onAdded,
  onClose,
}: {
  api: ReturnType<typeof makeOffspringApi> | null;
  group: OffspringRow | null;
  open: boolean;
  onAdded: () => void;
  onClose: () => void;
}) {
  const [q, setQ] = React.useState("");
  const [link, setLink] = React.useState<null | { kind: "contact" | "org"; id: number; label: string }>(
    null,
  );
  const [busy, setBusy] = React.useState(false);
  const [hits, setHits] = React.useState<
    Array<{ kind: "contact" | "org"; id: number; label: string; subtitle?: string }>
  >([]);
  const [quickOpen, setQuickOpen] = React.useState<null | "contact" | "org">(null);
  const [createErr, setCreateErr] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [qc, setQc] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [qo, setQo] = React.useState({
    name: "",
    website: "",
    email: "",
    phone: "",
  });

  const quickCreateContact = React.useCallback(async () => {
    if (!api) throw new Error("API not ready");

    const pre = await exactContactLookup(api, {
      email: qc.email || undefined,
      phone: qc.phone || undefined,
      firstName: qc.firstName || undefined,
      lastName: qc.lastName || undefined,
    });
    if (pre) return pre;

    const payload = stripEmpty({
      display_name: `${(qc.firstName || "").trim()} ${(qc.lastName || "").trim()}`.trim() || undefined,
      first_name: qc.firstName || undefined,
      last_name: qc.lastName || undefined,
      email: qc.email || undefined,
      phoneE164: qc.phone || undefined,
      phone_e164: qc.phone || undefined,
    });

    return api.contacts.create(payload);
  }, [api, qc]);

  const quickCreateOrg = React.useCallback(async () => {
    if (!api) throw new Error("API not ready");

    const payload = stripEmpty({
      name: qo.name || undefined,
      website: qo.website || undefined,
      email: qo.email || undefined,
      phone: qo.phone || undefined,
    });

    return api.organizations.create(payload);
  }, [api, qo]);

  const handleQuickAdd = React.useCallback(async () => {
    if (!api || !group || !quickOpen) return;

    setCreating(true);
    setCreateErr(null);

    try {
      if (quickOpen === "contact") {
        const c: any = await quickCreateContact();
        setLink({
          kind: "contact",
          id: Number(c.id),
          label:
            c.display_name ||
            `${(c.first_name ?? "").trim()} ${(c.last_name ?? "").trim()}`.trim() ||
            "(Contact)",
          subtitle: c.email || c.phoneE164 || c.phone || "",
        });
      } else {
        const o: any = await quickCreateOrg();
        setLink({
          kind: "org",
          id: Number(o.id),
          label: o.name || "(Organization)",
          subtitle: o.website || o.email || o.phone || "",
        });
      }

      setQuickOpen(null);
      setQ("");
      setHits([]);
    } catch (e: any) {
      setCreateErr(e?.message || "Quick add failed.");
    } finally {
      setCreating(false);
    }
  }, [api, group, quickOpen, quickCreateContact, quickCreateOrg, setLink, setQ, setHits]);


  const searchValue = link ? link.label : q;

  const panelRef = React.useRef<HTMLDivElement | null>(null);

React.useEffect(() => {
  let cancelled = false;
  const t = q.trim();

  if (!api || !group || !t) {
    setHits([]);
    return;
  }

  setBusy(true);

  (async () => {
    try {
      const [contactsRes, orgsRes] = await Promise.all([
        api.contacts.list({ q: t, limit: 25 }),
        api.organizations.list({ q: t, limit: 25 }),
      ]);

      if (cancelled) return;

      const contactsArr: any[] = Array.isArray(contactsRes)
        ? contactsRes
        : contactsRes?.items ?? [];

      const orgsArr: any[] = Array.isArray(orgsRes)
        ? orgsRes
        : orgsRes?.items ?? [];

      const nextHits: Array<{
        kind: "contact" | "org";
        id: number;
        label: string;
        subtitle?: string;
      }> = [];

      for (const c of contactsArr) {
        nextHits.push({
          kind: "contact",
          id: Number(c.id),
          label:
            c.display_name ||
            `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() ||
            "(Contact)",
          subtitle: c.email || c.phone || "",
        });
      }

      for (const o of orgsArr) {
        nextHits.push({
          kind: "org",
          id: Number(o.id),
          label: o.name || "(Organization)",
          subtitle: o.website || o.email || o.phone || "",
        });
      }

      setHits(nextHits);
    } catch (e: any) {
      if (!cancelled) {
        setCreateErr(e?.message || "Search failed.");
      }
    } finally {
      if (!cancelled) {
        setBusy(false);
      }
    }
  })();

  return () => {
    cancelled = true;
  };
}, [q, api, group]);

  const clearLinkAndSearch = React.useCallback(() => {
    setLink(null);
    setQ("");
    setHits([]);
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (!api || !group || !link) return;
    setCreating(true);
    setCreateErr(null);
    try {
      await api.offspring.buyers.create({
        groupId: group.id,
        contactId: link.kind === "contact" ? link.id : null,
        organizationId: link.kind === "org" ? link.id : null,
      });
      onAdded();
      onClose();
    } catch (e: any) {
      setCreateErr(e?.message || "Failed to Add Buyer.");
    } finally {
      setCreating(false);
    }
  }, [api, group, link, onAdded, onClose]);

  const handleOutsideMouseDown = React.useCallback<
    React.MouseEventHandler<HTMLDivElement>
  >(
    (e) => {
      const p = panelRef.current;
      if (!p) return;
      if (!p.contains(e.target as Node)) onClose();
    },
    [onClose],
  );

  if (!open || !group) return null;

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: MODAL_Z + 1, isolation: "isolate" }}
      onMouseDown={handleOutsideMouseDown}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          ref={panelRef}
          className="pointer-events-auto overflow-hidden"
          style={{ width: 820, maxWidth: "95vw", height: 520, maxHeight: "82vh" }}
          data-buyer
        >
          <Card className="h-full">
            <div className="h-full p-4 space-y-4 overflow-y-auto">
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold">Add Buyer</div>
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
                      } else {
                        setQ(val);
                      }
                    }}
                    placeholder="Type a name, email, phone, or organization."
                    widthPx={720}
                    autoFocus={!link}
                  />
                </div>

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
                    <div className="px-2 py-2 text-sm text-secondary">Searching.</div>
                  ) : (
                    (() => {
                      const contacts = hits.filter((h) => h.kind === "contact");
                      const orgs = hits.filter((h) => h.kind === "org");
                      const sectionClass = "rounded-md bg-white/5";
                      const pill = (t: string) => (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">{t}</span>
                      );

                      if (!contacts.length && !orgs.length) {
                        return (
                          <div className="px-2 py-2 text-sm text-secondary">
                            No matching candidates found.
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2">
                          {contacts.length > 0 && (
                            <div className={sectionClass}>
                              <div className="px-2 py-1.5 flex items-center justify-between border-b border-white/10">
                                <div className="text-[11px] uppercase tracking-wide text-secondary">
                                  Contacts
                                </div>
                                <div className="flex gap-1 items-center">
                                  {pill(
                                    `${contacts.length} result${contacts.length === 1 ? "" : "s"
                                    }`,
                                  )}
                                </div>
                              </div>
                              <div className="divide-y divide-white/10">
                                {contacts.map((c) => (
                                  <button
                                    key={`contact-${c.id}`}
                                    className="w-full px-2 py-1.5 text-left text-sm hover:bg-white/5"
                                    onClick={() =>
                                      setLink({
                                        kind: "contact",
                                        id: c.id,
                                        label: c.label,
                                      })
                                    }
                                  >
                                    <div className="font-medium">{c.label}</div>
                                    {c.subtitle && (
                                      <div className="text-[11px] text-secondary">
                                        {c.subtitle}
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {orgs.length > 0 && (
                            <div className={sectionClass}>
                              <div className="px-2 py-1.5 flex items-center justify-between border-b border-white/10">
                                <div className="text-[11px] uppercase tracking-wide text-secondary">
                                  Organizations
                                </div>
                                <div className="flex gap-1 items-center">
                                  {pill(
                                    `${orgs.length} result${orgs.length === 1 ? "" : "s"}`,
                                  )}
                                </div>
                              </div>
                              <div className="divide-y divide-white/10">
                                {orgs.map((o) => (
                                  <button
                                    key={`org-${o.id}`}
                                    className="w-full px-2 py-1.5 text-left text-sm hover:bg-white/5"
                                    onClick={() =>
                                      setLink({
                                        kind: "org",
                                        id: o.id,
                                        label: o.label,
                                      })
                                    }
                                  >
                                    <div className="font-medium">{o.label}</div>
                                    {o.subtitle && (
                                      <div className="text-[11px] text-secondary">
                                        {o.subtitle}
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

              {createErr && <div className="text-xs text-red-500">{createErr}</div>}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={onClose}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!link || creating}
                >
                  Add Buyer
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}


function BuyersTab({
  api,
  group,
  onGroupUpdate,
}: {
  api: ReturnType<typeof makeOffspringApi> | null;
  group: OffspringRow;
  onGroupUpdate: (updated: OffspringRow) => void;
}) {
  const { toast } = useToast();
  const { cands, loading, error, setCands } = useGroupCandidates(api, group);
  const [lastAction, setLastAction] =
    React.useState<null | { kind: "add" | "skip"; payload: any }>(null);
  const [autoPromptedForGroupId, setAutoPromptedForGroupId] =
    React.useState<number | null>(null);

  // inline Add Buyer state
  const [q, setQ] = React.useState("");
  const [link, setLink] = React.useState<
    | null
    | {
      kind: "contact" | "org";
      id: number;
      label: string;
      subtitle?: string;
    }
  >(null);
  const [hits, setHits] = React.useState<
    Array<{ kind: "contact" | "org"; id: number; label: string; subtitle?: string }>
  >([]);
  const [searchBusy, setSearchBusy] = React.useState(false);
  const [createErr, setCreateErr] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [quickOpen, setQuickOpen] = React.useState<null | "contact" | "org">(null);

  // auto prompt logic stays the same
  React.useEffect(() => {
    if (!group || !group.id) return;
    if (!cands || cands.length === 0) return;

    if (autoPromptedForGroupId === group.id) return;

    const [top] = cands;
    if (!top) return;

    const score = top.matchScore ?? 0;

    if (score < 10) {
      return;
    }

    setAutoPromptedForGroupId(group.id);
  }, [autoPromptedForGroupId, cands, group]);

  const handleSkip = React.useCallback(
    (cand: Candidate) => {
      setLastAction({ kind: "skip", payload: cand });
      setCands((prev) => prev.filter((c) => c.id !== cand.id));
    },
    [setCands],
  );

  const handleUndo = React.useCallback(() => {
    if (!lastAction) return;
    if (lastAction.kind === "skip") {
      setCands((prev) => [lastAction.payload, ...prev]);
    }
    setLastAction(null);
  }, [lastAction, setCands]);

  // search contacts and orgs for inline Add Buyer
  React.useEffect(() => {
    let alive = true;

    (async () => {
      if (!api || !group) return;

      const term = q.trim();
      if (!term) {
        if (alive) setHits([]);
        return;
      }

      setSearchBusy(true);
      setCreateErr(null);

      try {
        const [contacts, orgs] = await Promise.all([
          api.directory.searchContacts({ q: term, limit: 25 }),
          api.directory.searchOrgs({ q: term, limit: 25 }),
        ]);

        if (!alive) return;

        const contactHits =
          (contacts || []).map((c: any) => ({
            kind: "contact" as const,
            id: c.id,
            label: c.displayName || c.email || `Contact #${c.id}`,
            subtitle: c.email || c.phone || "",
          })) ?? [];

        const orgHits =
          (orgs || []).map((o: any) => ({
            kind: "org" as const,
            id: o.id,
            label: o.name || `Organization #${o.id}`,
            subtitle: o.email || o.phone || "",
          })) ?? [];

        setHits([...contactHits, ...orgHits]);
      } catch (e: any) {
        if (alive) {
          setCreateErr(e?.message || "Search failed.");
          setHits([]);
        }
      } finally {
        if (alive) setSearchBusy(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [api, group, q]);

  const handleInlineSubmit = React.useCallback(async () => {
    if (!api || !group || !link) return;

    setCreating(true);
    setCreateErr(null);

    try {
      await api.offspring.buyers.create({
        groupId: group.id,
        contactId: link.kind === "contact" ? link.id : null,
        organizationId: link.kind === "org" ? link.id : null,
      });

      const updated = await api.offspring.groups.getById(group.id);

      if (updated) {
        onGroupUpdate(updated);
      } else {
        // non fatal, group will at least be updated server side
      }

      toast({
        title: "Buyer added",
        description: `${link.label} has been linked as a buyer for this group.`,
      });

      setQ("");
      setLink(null);
      setHits([]);
    } catch (e: any) {
      setCreateErr(e?.message || "Failed to Add Duyer.");
    } finally {
      setCreating(false);
    }
  }, [api, group, link, onGroupUpdate, toast]);

  return (
    <SectionCard title="Buyers">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        {lastAction && (
          <Button size="xs" variant="outline" onClick={handleUndo}>
            Undo last action
          </Button>
        )}
      </div>

      {/* Inline Add Buyer block, now at the top of the tab */}
      <div className="mb-4 rounded-md border border-hairline bg-surface/60 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold">Add Buyer</div>
          {link && (
            <Button
              size="xs"
              variant="outline"
              type="button"
              onClick={() => setLink(null)}
              disabled={creating}
            >
              Clear selection
            </Button>
          )}
        </div>

        <label className="grid gap-1 text-sm">
          <span className="text-xs text-muted-foreground">
            Search contacts or organizations
          </span>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-secondary">
              <span className="i-lucide-search h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <Input
              value={q}
              className="pl-9 text-sm"
              onChange={(e) => {
                const val = e.target.value;
                setQ(val);
                setCreateErr(null);
              }}
              placeholder="Type a name, email, phone, or organization."
              autoFocus={!link}
            />
          </div>
        </label>

        {quickOpen === "contact" && !link && (
          <div className="mt-3 rounded-md border border-hairline bg-surface/70 p-3 space-y-2 text-xs">
            <div className="font-medium text-sm">Quick Add Contact</div>
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1">
                <span className="text-[11px] text-muted-foreground">First name</span>
                <input
                  className="h-7 rounded border border-hairline bg-background px-2 text-xs"
                  value={qc.firstName}
                  onChange={(e) => setQc({ ...qc, firstName: e.target.value })}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[11px] text-muted-foreground">Last name</span>
                <input
                  className="h-7 rounded border border-hairline bg-background px-2 text-xs"
                  value={qc.lastName}
                  onChange={(e) => setQc({ ...qc, lastName: e.target.value })}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1">
                <span className="text-[11px] text-muted-foreground">Email</span>
                <input
                  className="h-7 rounded border border-hairline bg-background px-2 text-xs"
                  value={qc.email}
                  onChange={(e) => setQc({ ...qc, email: e.target.value })}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[11px] text-muted-foreground">Phone</span>
                <input
                  className="h-7 rounded border border-hairline bg-background px-2 text-xs"
                  value={qc.phone}
                  onChange={(e) => setQc({ ...qc, phone: e.target.value })}
                />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                size="xs"
                type="button"
                variant="ghost"
                onClick={() => {
                  setQuickOpen(null);
                  setQc({ firstName: "", lastName: "", email: "", phone: "" });
                }}
              >
                Cancel
              </Button>
              <Button
                size="xs"
                type="button"
                onClick={handleQuickAdd}
                disabled={creating || !qc.firstName.trim()}
              >
                Create and select
              </Button>
            </div>
          </div>
        )}

        {quickOpen === "org" && !link && (
          <div className="mt-3 rounded-md border border-hairline bg-surface/70 p-3 space-y-2 text-xs">
            <div className="font-medium text-sm">Quick Add Organization</div>
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1">
                <span className="text-[11px] text-muted-foreground">Name</span>
                <input
                  className="h-7 rounded border border-hairline bg-background px-2 text-xs"
                  value={qo.name}
                  onChange={(e) => setQo({ ...qo, name: e.target.value })}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[11px] text-muted-foreground">Website</span>
                <input
                  className="h-7 rounded border border-hairline bg-background px-2 text-xs"
                  value={qo.website}
                  onChange={(e) => setQo({ ...qo, website: e.target.value })}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1">
                <span className="text-[11px] text-muted-foreground">Email</span>
                <input
                  className="h-7 rounded border border-hairline bg-background px-2 text-xs"
                  value={qo.email}
                  onChange={(e) => setQo({ ...qo, email: e.target.value })}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[11px] text-muted-foreground">Phone</span>
                <input
                  className="h-7 rounded border border-hairline bg-background px-2 text-xs"
                  value={qo.phone}
                  onChange={(e) => setQo({ ...qo, phone: e.target.value })}
                />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                size="xs"
                type="button"
                variant="ghost"
                onClick={() => {
                  setQuickOpen(null);
                  setQo({ name: "", website: "", email: "", phone: "" });
                }}
              >
                Cancel
              </Button>
              <Button
                size="xs"
                type="button"
                onClick={handleQuickAdd}
                disabled={creating || !qo.name.trim()}
              >
                Create and select
              </Button>
            </div>
          </div>
        )}


        <div className="mt-2 flex items-center gap-3">
          <Button size="xs" variant="outline" onClick={() => setQuickOpen("contact")}>
            + Quick Add Contact
          </Button>
          <Button size="xs" variant="outline" onClick={() => setQuickOpen("org")}>
            + Quick Add Organization
          </Button>
        </div>

        {searchBusy && (
          <div className="text-xs text-secondary">Searching…</div>
        )}

        {!searchBusy && hits.length > 0 && (
          <div className="rounded-md border border-hairline bg-surface/80 text-xs">
            <div className="border-b border-hairline px-2 py-1 text-[11px] uppercase tracking-wide text-secondary">
              Search results
            </div>
            <div className="divide-y divide-white/5">
              {hits.map((h) => (
                <button
                  key={`${h.kind}-${h.id}`}
                  type="button"
                  className={clsx(
                    "flex w-full items-center justify-between px-2 py-1.5 text-left hover:bg-white/5",
                    link && link.kind === h.kind && link.id === h.id
                      ? "bg-white/10"
                      : "",
                  )}
                  onClick={() =>
                    setLink({
                      kind: h.kind,
                      id: h.id,
                      label: h.label,
                      subtitle: h.subtitle,
                    })
                  }
                >
                  <div>
                    <div className="font-medium">{h.label}</div>
                    {h.subtitle && (
                      <div className="text-[11px] text-secondary">
                        {h.subtitle}
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-secondary">
                    {h.kind === "contact" ? "Contact" : "Organization"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {createErr && (
          <div className="text-xs text-red-500">{createErr}</div>
        )}

        <div className="mt-2 flex items-center justify-between">
          <Button
            size="xs"
            type="button"
            onClick={handleInlineSubmit}
            disabled={!link || creating || !api}
          >
            Add buyer
          </Button>
        </div>
      </div>

      {/* Linked buyers table, directly under the Add buyer controls */}
      <div>
        <SectionChipHeading
          icon={
            <span
              className="i-lucide-users h-3.5 w-3.5"
              aria-hidden="true"
            />
          }
          text="Linked buyers"
        />
        {Array.isArray(group.buyers) && group.buyers.length > 0 ? (
          <table className="mt-2 w-full border-separate border-spacing-y-1 text-xs">
            <thead className="text-[11px] uppercase tracking-wide text-secondary">
              <tr>
                <th className="text-left font-medium">Buyer</th>
                <th className="text-left font-medium">Kind</th>
                <th className="text-left font-medium">From waitlist</th>
              </tr>
            </thead>
            <tbody>
              {group.buyers.map((b) => (
                <tr key={b.id}>
                  <td className="py-1 pr-2">
                    {b.contactLabel || b.orgLabel || `Buyer #${b.id}`}
                  </td>
                  <td className="py-1 pr-2">
                    {b.contactId
                      ? "Contact"
                      : b.organizationId
                        ? "Organization"
                        : "-"}
                  </td>
                  <td className="py-1 pr-2">
                    {b.waitlistEntryId ? "Yes" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-2 text-xs text-secondary">
            No buyers linked yet.
          </p>
        )}
      </div>

      {/* optional: keep candidate list below */}
      {loading && (
        <div className="mt-3 text-sm text-secondary">
          Looking for matching waitlist candidates…
        </div>
      )}

      {error && (
        <div className="mt-3 mb-2 text-sm text-red-600">
          Error: {error}
        </div>
      )}

      {/* keep your existing candidate cards below here if you want them */}
    </SectionCard>
  );
}

/* ───────────────────────── Analytics helpers ───────────────────────── */

function safeSeasonLabelFromISO(dateIso: string | null | undefined): string | null {
  if (!dateIso) return null;
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return null;
  const month = d.getUTCMonth(); // 0 = Jan
  const year = d.getUTCFullYear();
  if (month <= 1) return `Winter ${year}`;
  if (month <= 4) return `Spring ${year}`;
  if (month <= 7) return `Summer ${year}`;
  return `Fall ${year}`;
}

type GroupMetrics = {
  totalOffspring: number | null;
  maleCount: number | null;
  femaleCount: number | null;
  unknownSexCount: number | null;
  mortalityCount: number | null;
  mortalityRate: number | null;
  waitlistOverlapCount: number | null;
  avgPlacementPriceCents: number | null;
};

function computeGroupMetrics(detail: any): GroupMetrics {
  const counts = detail?.counts ?? {};
  const animals: any[] = Array.isArray(detail?.Animals) ? detail.Animals : [];
  const waitlist: any[] = Array.isArray(detail?.Waitlist) ? detail.Waitlist : [];

  const totalOffspring =
    typeof counts.animals === "number"
      ? counts.animals
      : animals.length || null;

  const maleCount =
    typeof counts.male === "number"
      ? counts.male
      : animals.filter((a) => a.sex === "MALE").length || null;

  const femaleCount =
    typeof counts.female === "number"
      ? counts.female
      : animals.filter((a) => a.sex === "FEMALE").length || null;

  let unknownSexCount: number | null = null;
  if (totalOffspring != null) {
    const known = (maleCount || 0) + (femaleCount || 0);
    const unknown = totalOffspring - known;
    unknownSexCount = unknown > 0 ? unknown : 0;
  }

  const mortalityCount =
    typeof counts.stillborn === "number" ? counts.stillborn : null;

  let mortalityRate: number | null = null;
  const born = typeof counts.born === "number" ? counts.born : null;
  if (mortalityCount != null) {
    const denom = (born || 0) + mortalityCount;
    if (denom > 0) mortalityRate = mortalityCount / denom;
  }

  const waitlistOverlapCount =
    typeof counts.waitlist === "number"
      ? counts.waitlist
      : waitlist.length || null;

  // Average placement price, prefer sale price then listed/price
  let priceSum = 0;
  let priceCount = 0;
  for (const a of animals) {
    const cents =
      typeof a.salePriceCents === "number"
        ? a.salePriceCents
        : typeof a.priceCents === "number"
          ? a.priceCents
          : typeof a.listedPriceCents === "number"
            ? a.listedPriceCents
            : null;
    if (cents != null && cents > 0) {
      priceSum += cents;
      priceCount += 1;
    }
  }
  const avgPlacementPriceCents =
    priceCount > 0 ? Math.round(priceSum / priceCount) : null;

  return {
    totalOffspring,
    maleCount,
    femaleCount,
    unknownSexCount,
    mortalityCount,
    mortalityRate,
    waitlistOverlapCount,
    avgPlacementPriceCents,
  };
}

function formatMoneyFromCents(cents: number | null | undefined): string {
  if (!cents || cents <= 0) return "—";
  const dollars = cents / 100;
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatPercent(val: number | null | undefined): string {
  if (val == null) return "—";
  return `${Math.round(val * 100)}%`;
}

function computeCoverage(g: OffspringRow): number | null {
  const reserved = g.counts?.reserved ?? 0;
  const placed = (g.counts as any)?.placed ?? 0;
  const sold = Math.max(reserved, placed);
  const denom = g.counts?.live ?? (g.counts as any)?.weaned ?? g.counts?.animals ?? 0;
  if (!denom) return null;
  return Math.min(1, Math.max(0, sold / denom));
}

function computePlacementVelocity(g: OffspringRow): number | null {
  const start = g.dates?.placementStartAt ? Date.parse(g.dates.placementStartAt) : NaN;
  const end = g.dates?.placementCompletedAt ? Date.parse(g.dates.placementCompletedAt) : NaN;
  if (!Number.isFinite(start)) return null;
  if (!Number.isFinite(end)) return null;
  const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return days >= 0 ? days : null;
}

/* ───────────────────────── URL param helper re-export for tabs ───────────────────────── */
const openDetails = setParamAndNotify;

/* ───────────────────────── Tabs ───────────────────────── */
function OffspringGroupsTab({ api, tenantId, readOnlyGlobal }: { api: ReturnType<typeof makeOffspringApi> | null; tenantId: number | null, readOnlyGlobal: boolean }) {
  const { toast } = useToast();
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<GroupTableRow[]>([]);
  const [raw, setRaw] = React.useState<OffspringRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [buyerModalOpen, setBuyerModalOpen] = React.useState(false);
  const [buyerModalGroup, setBuyerModalGroup] = React.useState<OffspringRow | null>(null);


  const [createOpen, setCreateOpen] = React.useState(false);
  React.useEffect(() => {
    window.dispatchEvent(new Event("popstate"));
  }, []);

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    if (createOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [createOpen]);

  const load = React.useCallback(async () => {
    if (!api) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.offspring.list({ q: q || undefined, limit: 100 });
      setRaw(res.items);
      setRows(res.items.map(mapDetailToTableRow));
    } catch (e: any) {
      setError(e?.message || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, [api, q]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [q, load]);

  const cols = hooks.useColumns(GROUP_COLS, GROUP_STORAGE_KEY);
  const visibleSafe = cols.visible?.length ? cols.visible : GROUP_COLS;

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

  const [pageSize, setPageSize] = React.useState(25);
  const [page, setPage] = React.useState(1);

  const sorted = React.useMemo(() => {
    const list = [...rows];
    if (!sorts.length) return list;
    list.sort((a, b) => {
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

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clampedPage = Math.min(page, pageCount);

  const pageRows = React.useMemo(() => {
    const from = (clampedPage - 1) * pageSize;
    const to = from + pageSize;
    return sorted.slice(from, to);
  }, [sorted, clampedPage, pageSize]);

  return (
    <Card>
      <div className="relative">
        <div className="absolute right-0 top-0 h-10 flex items-center gap-2 pr-2" style={{ zIndex: 50, pointerEvents: "auto" }}>
          {!readOnlyGlobal && <Button size="sm" onClick={() => setCreateOpen(true)}>Create Group</Button>}
        </div>

        <DetailsHost key="groups"
          rows={raw}
          config={{
            idParam: "groupId",
            getRowId: (r: OffspringRow) => String(r.id),
            width: 960,
            placement: "center",
            align: "top",
            fetchRow: async (id: string | number) => raw.find((r) => String(r.id) === String(id))!,
            onSave: async (row: OffspringRow, draft: any) => {
              if (!api || readOnlyGlobal) return;
              const body: any = {};
              if (draft.identifier !== undefined) body.identifier = draft.identifier;
              if (draft.statusOverride !== undefined) body.statusOverride = draft.statusOverride ?? null;
              if (draft.statusOverrideReason !== undefined) body.statusOverrideReason = draft.statusOverrideReason ?? null;

              if (draft.counts || draft.countLive !== undefined || draft.countWeaned !== undefined || draft.countPlaced !== undefined) {
                body.counts = {
                  countBorn: draft.counts?.countBorn ?? draft.countBorn ?? undefined,
                  countLive: draft.counts?.countLive ?? draft.countLive ?? undefined,
                  countStillborn: draft.counts?.countStillborn ?? draft.countStillborn ?? undefined,
                  countMale: draft.counts?.countMale ?? draft.countMale ?? undefined,
                  countFemale: draft.counts?.countFemale ?? draft.countFemale ?? undefined,
                  /** NEW */
                  countWeaned: draft.counts?.countWeaned ?? draft.countWeaned ?? undefined,
                  /** NEW */
                  countPlaced: draft.counts?.countPlaced ?? draft.countPlaced ?? undefined,
                };
              }
              if (draft.dates) {
                body.dates = {
                  birthedStartAt: draft.dates.birthedStartAt ?? null,
                  birthedEndAt: draft.dates.birthedEndAt ?? null,
                  weanedAt: draft.dates.weanedAt ?? null,
                  placementStartAt: draft.dates.placementStartAt ?? null,
                  placementCompletedAt: draft.dates.placementCompletedAt ?? null,
                };
              }
              try {
                const updated = await api.offspring.patch(row.id, body);
                const idx = raw.findIndex((r) => r.id === row.id);
                if (idx >= 0) {
                  const next = [...raw];
                  next[idx] = updated as any;
                  setRaw(next);
                  setRows(next.map(mapDetailToTableRow));
                  toast?.({ title: "Saved" });

                  try {
                    window.dispatchEvent(
                      new CustomEvent("bhq:group:updated", {
                        detail: { groupId: row.id },
                      })
                    );
                  } catch {
                    // ignore event failures
                  }
                }
              } catch (e: any) {
                toast?.({ title: "Save failed", description: String(e?.message || e), variant: "destructive" });
                throw e;
              }
            },
            header: (r: OffspringRow) => ({
              title: r.identifier || r.plan?.code || `Group #${r.id}`,
              subtitle: (r as any).statusOverride ? `Override: ${(r as any).statusOverride}` : "",
            }),
            tabs: [
              { key: "overview", label: "Overview" },
              { key: "buyers", label: "Buyers" },
              { key: "linkedOffspring", label: "Offspring" },
              { key: "media", label: "Media" },
              { key: "documents", label: "Documents" },
              { key: "analytics", label: "Analytics" },
            ],
            customChrome: true,
            render: ({ row, mode, setMode, activeTab, setActiveTab, requestSave }: any) => {
              const tblRow = mapDetailToTableRow(row);
              const openOffspringFromGroup = (offspringId: number) => {
                try {
                  const url = new URL(window.location.href);
                  // Clear other ids so offspring is authoritative
                  url.searchParams.delete("groupId");
                  url.searchParams.delete("waitlistId");
                  url.searchParams.set("offspringId", String(offspringId));
                  window.history.replaceState({}, "", url.toString());
                  window.dispatchEvent(new Event("popstate"));
                } catch {
                  // ignore URL issues in embedded shells
                }
              };


              return (
                <DetailsScaffold
                  title={tblRow.groupName || tblRow.planCode || `Group #${tblRow.id}`}
                  subtitle={tblRow.breed || tblRow.species || ""}
                  mode={mode}
                  onEdit={() => !readOnlyGlobal && setMode("edit")}
                  onCancel={() => setMode("view")}
                  onSave={requestSave}
                  tabs={[
                    { key: "overview", label: "Overview" },
                    { key: "buyers", label: "Buyers" },
                    { key: "linkedOffspring", label: "Offspring" },
                    { key: "media", label: "Media" },
                    { key: "documents", label: "Documents" },
                    { key: "analytics", label: "Analytics" },
                  ]}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  rightActions={
                    <div className="flex gap-2">
                      {row.plan?.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/breeding/plan/${row.plan?.id}`, "_blank")}
                        >
                          Open plan
                        </Button>
                      )}
                      {readOnlyGlobal && (
                        <span className="self-center text-xs text-secondary">View only</span>
                      )}
                    </div>
                  }
                >
                  {activeTab === "analytics" && (
                    <>
                      {tblRow && <GroupSummaryBand row={tblRow} />}

                      <div className="mt-4 grid gap-4 lg:grid-cols-[2fr,1.5fr]">
                        <SectionCard>
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Headcount and breakdown</h3>
                            <span className="text-xs text-muted-foreground">
                              Live, weaned, placed
                            </span>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-3">
                            <div className="rounded-md border p-3">
                              <div className="text-xs text-muted-foreground">Live</div>
                              <div className="text-lg font-semibold">
                                {row.counts?.live ?? "-"}
                              </div>
                            </div>
                            <div className="rounded-md border p-3">
                              <div className="text-xs text-muted-foreground">Weaned</div>
                              <div className="text-lg font-semibold">
                                {row.counts?.weaned ?? "-"}
                              </div>
                            </div>
                            <div className="rounded-md border p-3">
                              <div className="text-xs text-muted-foreground">Placed</div>
                              <div className="text-lg font-semibold">
                                {(row.counts as any)?.placed ?? "-"}
                              </div>
                            </div>
                          </div>
                        </SectionCard>

                        <SectionCard>
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Placement timeline</h3>
                            <span className="text-xs text-muted-foreground">
                              Expected and actual
                            </span>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div>
                              <span className="font-medium">Breeding</span>
                              <span className="mx-1">·</span>
                              <span>{fmtDate(row.dates?.breedingDateExpected)}</span>
                              {row.dates?.breedingDateActual && (
                                <span className="ml-2 text-muted-foreground">
                                  (actual {fmtDate(row.dates.breedingDateActual)})
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">Birth</span>
                              <span className="mx-1">·</span>
                              <span>
                                {fmtRange(
                                  row.dates?.birthedStartAt,
                                  row.dates?.birthedEndAt
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">Weaning</span>
                              <span className="mx-1">·</span>
                              <span>{fmtDate(row.dates?.weanedAt)}</span>
                            </div>
                            <div>
                              <span className="font-medium">Placement</span>
                              <span className="mx-1">·</span>
                              <span>
                                {fmtRange(
                                  row.expectedPlacementStart ??
                                  row.dates?.placementStartDateExpected,
                                  row.expectedPlacementCompleted ??
                                  row.dates?.placementCompletedDateExpected
                                )}
                              </span>
                            </div>
                          </div>

                          <MiniTimeline row={row} />
                        </SectionCard>

                        <SectionCard>
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Coverage and velocity</h3>
                            <span className="text-xs text-muted-foreground">Auto calculated</span>
                          </div>
                          {(() => {
                            const coverage = computeCoverage(row);
                            const placementDays = computePlacementVelocity(row);
                            const reserved = row.counts?.reserved ?? 0;
                            const placed = (row.counts as any)?.placed ?? 0;
                            const coveragePct =
                              coverage == null ? "N/A" : `${Math.round(coverage * 100)}%`;

                            return (
                              <div className="grid gap-2 sm:grid-cols-2">
                                <div className="rounded-md border p-3 text-xs">
                                  <div className="mb-1 font-medium">Coverage</div>
                                  <div>Reserved: {reserved}</div>
                                  <div>Placed: {placed}</div>
                                  <div className="mt-1 text-muted-foreground">
                                    Overall: {coveragePct}
                                  </div>
                                </div>
                                <div className="rounded-md border p-3 text-xs">
                                  <div className="mb-1 font-medium">Velocity</div>
                                  <div>
                                    {placementDays == null
                                      ? "N/A"
                                      : `${placementDays} days`}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </SectionCard>

                        <SectionCard>
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Waitlist overlap</h3>
                            <span className="text-xs text-muted-foreground">
                              Same tenant
                            </span>
                          </div>
                          <div className="text-sm">
                            {Array.isArray(row.Waitlist) && row.Waitlist.length > 0 ? (
                              <div>
                                <p className="mb-2">
                                  {row.Waitlist.length} linked waitlist records.
                                </p>
                                <ul className="space-y-1 text-xs">
                                  {row.Waitlist.slice(0, 5).map((w: any) => (
                                    <li key={w.id} className="flex gap-2">
                                      <span className="truncate">
                                        {w.contact?.displayName ||
                                          w.org?.displayName ||
                                          `Waitlist #${w.id}`}
                                      </span>
                                      {w.status && (
                                        <span className="text-muted-foreground">
                                          · {w.status}
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                No overlapping waitlist entries yet.
                              </p>
                            )}
                          </div>
                        </SectionCard>
                      </div>
                    </>
                  )}

                  {activeTab === "overview" && (
                    <>
                      <SectionCard title="Identity">
                        <div className="grid gap-x-12 gap-y-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <IdentityField label="Group Name">
                              {tblRow.groupName || "-"}
                            </IdentityField>

                            <IdentityField label="Species">
                              {tblRow.species || "-"}
                            </IdentityField>

                            <IdentityField label="Dam">
                              {tblRow.damName && tblRow.damId ? (
                                <a
                                  href={`/animals/${tblRow.damId}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary underline"
                                >
                                  {tblRow.damName}
                                </a>
                              ) : (
                                tblRow.damName || "-"
                              )}
                            </IdentityField>

                            <IdentityField label="Season">
                              {tblRow.seasonLabel || "-"}
                            </IdentityField>
                          </div>

                          <div className="space-y-2">
                            <IdentityField label="Plan Code">
                              {tblRow.planCode || "-"}
                            </IdentityField>

                            <IdentityField label="Breed">
                              {tblRow.breed || "-"}
                            </IdentityField>

                            <IdentityField label="Sire">
                              {tblRow.sireName && tblRow.sireId ? (
                                <a
                                  href={`/animals/${tblRow.sireId}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary underline"
                                >
                                  {tblRow.sireName}
                                </a>
                              ) : (
                                tblRow.sireName || "-"
                              )}
                            </IdentityField>

                            <IdentityField label="Status (computed)">
                              {tblRow.status || "-"}
                            </IdentityField>
                          </div>
                        </div>
                      </SectionCard>

                      <DetailsSpecRenderer<GroupTableRow>
                        row={tblRow}
                        mode={readOnlyGlobal ? "view" : mode}
                        setDraft={() => { }}
                        sections={groupSections(readOnlyGlobal ? "view" : mode)}
                      />
                    </>
                  )}

                  {activeTab === "buyers" && (
                    <BuyersTab
                      api={api}
                      group={row}
                      onGroupUpdate={(updated) => {
                      }}
                    />
                  )}
                  
                  {activeTab === "media" && (
                    <SectionCard>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Group photos</h3>
                        <span className="text-xs text-muted-foreground">
                          Uses existing attachment uploader
                        </span>
                      </div>
                      <AttachmentsSection group={row} api={api} mode="media" />
                    </SectionCard>
                  )}

                  {activeTab === "documents" && (
                    <div className="grid gap-4 lg:grid-cols-2">
                      <SectionCard>
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-semibold">Litter health certificate</h3>
                          <span className="text-xs text-muted-foreground">
                            Upload or attach
                          </span>
                        </div>
                        <AttachmentsSection group={row} api={api} mode="health" />
                      </SectionCard>

                      <SectionCard>
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-semibold">Registration paperwork</h3>
                          <span className="text-xs text-muted-foreground">
                            Registry documents
                          </span>
                        </div>
                        <AttachmentsSection
                          group={row}
                          api={api}
                          mode="registration"
                        />
                      </SectionCard>
                    </div>
                  )}

                  {activeTab === "linkedOffspring" && (
                    <SectionCard>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Linked offspring</h3>
                        <div className="flex gap-2">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={async () => {
                              if (!api) return;
                              try {
                                const created = await api.animals.createForGroup(row.id);
                                await onRefreshRow();
                                try {
                                  window.dispatchEvent(
                                    new CustomEvent("bhq:offspring:created", {
                                      detail: {
                                        groupId: row.id,
                                        offspringId: (created as any)?.id ?? null,
                                      },
                                    })
                                  );
                                } catch {
                                  // ignore event failures
                                }
                              } catch (e) {
                                console.error("Add offspring failed", e);
                              }
                            }}
                          >
                            Add offspring
                          </Button>
                        </div>
                      </div>
                      {Array.isArray(row.Animals) && row.Animals.length > 0 ? (
                        <Table dense>
                          <thead>
                            <tr>
                              <th className="text-left text-xs font-medium text-muted-foreground">
                                Name
                              </th>
                              <th className="text-left text-xs font-medium text-muted-foreground">
                                Sex
                              </th>
                              <th className="text-left text-xs font-medium text-muted-foreground">
                                Status
                              </th>
                              <th className="text-left text-xs font-medium text-muted-foreground">
                                Buyer / waitlist
                              </th>
                              <th className="text-right text-xs font-medium text-muted-foreground">
                                Price
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.Animals.map((a: any) => (
                              <tr
                                key={a.id}
                                className="cursor-pointer text-xs hover:bg-accent/40"
                                onClick={() => openOffspringFromGroup(a.id)}
                              >
                                <td className="py-1 pr-2">
                                  {a.name || `Offspring #${a.id}`}
                                </td>
                                <td className="py-1 pr-2">
                                  {a.sex === "MALE"
                                    ? "M"
                                    : a.sex === "FEMALE"
                                      ? "F"
                                      : "U"}
                                </td>
                                <td className="py-1 pr-2">
                                  {a.status || "-"}
                                </td>
                                <td className="py-1 pr-2">
                                  {a.buyerContact?.displayName ||
                                    a.buyerOrg?.displayName ||
                                    a.waitlistEntry?.contact?.displayName ||
                                    a.waitlistEntry?.org?.displayName ||
                                    "-"}
                                </td>
                                <td className="py-1 pl-2 text-right">
                                  {formatMoneyFromCents(
                                    a.salePriceCents ??
                                    a.priceCents ??
                                    a.listedPriceCents ??
                                    null
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No individual offspring recorded yet.
                        </p>
                      )}
                    </SectionCard>
                  )}

                  {activeTab === "analytics" && (
                    <SectionCard title="Analytics">
                      <div className="grid grid-cols-1 gap-3 p-2 md:grid-cols-2">
                        <Card>
                          <div className="p-3">
                            <div className="text-xs text-secondary">Coverage</div>
                            <div className="text-2xl font-semibold">
                              {(() => {
                                const pct = computeCoverage(row);
                                return pct == null ? "-" : `${Math.round(pct * 100)}%`;
                              })()}
                            </div>
                            <div className="mt-1 text-xs text-secondary">
                              Reserved or placed divided by live, weaned, or planned
                              headcount.
                            </div>
                          </div>
                        </Card>
                        <Card>
                          <div className="p-3">
                            <div className="text-xs text-secondary">Placement velocity</div>
                            <div className="text-2xl font-semibold">
                              {(() => {
                                const days = computePlacementVelocity(row);
                                return days == null ? "-" : `${days} days`;
                              })()}
                            </div>
                            <div className="mt-1 text-xs text-secondary">
                              Days from placement start to placement completed.
                            </div>
                          </div>
                        </Card>
                      </div>
                    </SectionCard>
                  )}
                </DetailsScaffold>
              );
            },
          }}
        >
          <Table
            columns={GROUP_COLS}
            columnState={cols.map}
            onColumnStateChange={cols.setAll}
            getRowId={(r: GroupTableRow) => r.id}
            pageSize={25}
            renderStickyRight={() => <ColumnsPopover columns={cols.map} onToggle={cols.toggle} onSet={cols.setAll} allColumns={GROUP_COLS} triggerClassName="bhq-columns-trigger" />}
            stickyRightWidthPx={40}
          >
            <div className="bhq-table__toolbar px-2 pt-2 pb-3 relative z-30 flex items-center justify-between">
              <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search groups..." widthPx={520} />
              <div />
            </div>

            <table className="min-w-max w-full text-sm">
              <TableHeader columns={visibleSafe} sorts={sorts} onToggleSort={onToggleSort} />
              <tbody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={visibleSafe.length}>
                      <div className="py-8 text-center text-sm text-secondary">Loading groups...</div>
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
                      <div className="py-8 text-center text-sm text-secondary">No groups.</div>
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  !error &&
                  pageRows.map((r) => (
                    <TableRow
                      key={r.id}
                      detailsRow={raw.find((x) => x.id === r.id)!}
                      className="cursor-pointer"
                      onClick={() => openDetails("groupId", r.id)}
                    >
                      {visibleSafe.map((c) => {
                        let v: any = (r as any)[c.key];

                        if (
                          c.key === "expectedBirth" ||
                          c.key === "expectedPlacementStart" ||
                          c.key === "expectedPlacementCompleted" ||
                          c.key === "updatedAt"
                        ) {
                          v = fmtDate(v);
                        }

                        if (c.key === "damName" && r.damName && r.damId) {
                          v = (
                            <a
                              href={`/animals/${r.damId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary underline"
                              onClick={(evt) => {
                                evt.stopPropagation();
                              }}
                            >
                              {r.damName}
                            </a>
                          );
                        }

                        if (c.key === "sireName" && r.sireName && r.sireId) {
                          v = (
                            <a
                              href={`/animals/${r.sireId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary underline"
                              onClick={(evt) => {
                                evt.stopPropagation();
                              }}
                            >
                              {r.sireName}
                            </a>
                          );
                        }

                        return <TableCell key={c.key}>{v ?? ""}</TableCell>;
                      })}
                    </TableRow>
                  ))}
              </tbody>
            </table>

            <TableFooter
              entityLabel="groups"
              page={Math.min(page, Math.max(1, Math.ceil(sorted.length / pageSize)))}
              pageCount={Math.max(1, Math.ceil(sorted.length / pageSize))}
              pageSize={pageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(n) => {
                setPageSize(n);
                setPage(1);
              }}
              start={sorted.length === 0 ? 0 : (page - 1) * pageSize + 1}
              end={sorted.length === 0 ? 0 : Math.min(sorted.length, (page - 1) * pageSize + pageSize)}
              filteredTotal={sorted.length}
              total={rows.length}
            />
          </Table>
        </DetailsHost>
      </div>

      <AddBuyerToGroupModal
        api={api}
        group={buyerModalGroup}
        open={buyerModalOpen}
        onClose={() => setBuyerModalOpen(false)}
        onAdded={load}
      />

      {/* Create Group Modal */}
      <Overlay
        open={createOpen}
        onOpenChange={(next) => {
          if (!next) setCreateOpen(false);
        }}
        ariaLabel="Create Offspring Group"
        closeOnEscape
        closeOnOutsideClick
      >
        {(() => {
          const panelRef = React.useRef<HTMLDivElement>(null);
          const handleOutsideMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
            const p = panelRef.current;
            if (!p) return;
            if (!p.contains(e.target as Node)) {
              setCreateOpen(false);
            }
          };

          return (
            <div className="fixed inset-0" onMouseDown={handleOutsideMouseDown}>
              <div className="absolute inset-0 bg-black/50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div ref={panelRef} className="pointer-events-auto">
                  <CreateGroupForm
                    api={api}
                    tenantId={tenantId}
                    onCreated={async () => {
                      setCreateOpen(false);
                      await load();
                    }}
                    onCancel={() => setCreateOpen(false)}
                  />
                </div>
              </div>
            </div>
          );
        })()}
      </Overlay>


      {/* Create Group Modal */}
      <Overlay
        open={createOpen}
        onOpenChange={(next) => {
          if (!next) setCreateOpen(false);
        }}
        ariaLabel="Create Offspring Group"
        closeOnEscape
        closeOnOutsideClick
      >
        {(() => {
          const panelRef = React.useRef<HTMLDivElement>(null);

          const handleOutsideMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
            const p = panelRef.current;
            if (!p) return;
            if (!p.contains(e.target as Node)) {
              setCreateOpen(false);
            }
          };

          return (
            <div className="fixed inset-0" onMouseDown={handleOutsideMouseDown}>
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/50" />

              {/* Centered panel */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  ref={panelRef}
                  role="dialog"
                  aria-modal="true"
                  className="pointer-events-auto"
                >
                  <CreateGroupForm
                    api={api}
                    tenantId={tenantId}
                    onCreated={async () => {
                      setCreateOpen(false);
                      await load();
                    }}
                    onCancel={() => setCreateOpen(false)}
                  />
                </div>
              </div>
            </div>
          );
        })()}
      </Overlay>
    </Card>
  );
}

// function PortalPopover({ anchorRef, open, children }: { anchorRef: React.RefObject<HTMLElement>, open: boolean, children: React.ReactNode }) {
//   const [style, setStyle] = React.useState<React.CSSProperties>({});
//   React.useLayoutEffect(() => {
//     if (!open || !anchorRef.current) return;
//     const r = anchorRef.current.getBoundingClientRect();
//     setStyle({
//       position: "fixed",
//       left: r.left,
//       top: r.bottom + 6,
//       width: r.width,
//       maxHeight: 160,
//       overflowY: "auto",
//       zIndex: 2147483646,
//     });
//   }, [open, anchorRef]);
//   if (!open) return null;
//   const root = getOverlayRoot?.() || document.body;
//   return ReactDOM.createPortal(
//     <div className="rounded-md border border-hairline bg-surface" style={style}>{children}</div>,
//     root
//   );
// }

// function WaitlistDrawerBody({
//   api,
//   row,
//   mode,
//   onChange,
// }: {
//   api: ReturnType<typeof makeOffspringApi> | null;
//   row: any;
//   mode: "view" | "edit";
//   onChange: (patch: any) => void;
// }) {
//   const onChangeRef = React.useRef(onChange);
//   React.useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
//   const readOnly = mode !== "edit";
//   // derive UI state from row
//   const initSpeciesUi = (() => {
//     const w = String(row?.speciesPref || "").toUpperCase();
//     return w === "DOG" ? "Dog" : w === "CAT" ? "Cat" : w === "HORSE" ? "Horse" : "";
//   })() as SpeciesUi | "";

//   const [speciesUi, setSpeciesUi] = React.useState<SpeciesUi | "">(initSpeciesUi);
//   const speciesWire = toWireSpecies(speciesUi);
//   const damBoxRef = React.useRef<HTMLDivElement>(null);
//   const sireBoxRef = React.useRef<HTMLDivElement>(null);

//   // Breed (BreedCombo wants an object {name})
//   const [breed, setBreed] = React.useState<any>(() => {
//     const name =
//       row?.breedPrefText ??
//       (Array.isArray(row?.breedPrefs) ? row.breedPrefs.find(Boolean) : null);
//     return name ? { name } : null;
//   });
//   const [breedNonce, setBreedNonce] = React.useState(0);
//   const onBreedPick = React.useCallback((hit: any) => {
//     setBreed(hit ? { ...hit } : null);
//     setBreedNonce((n) => n + 1);
//   }, []);

//   // Parents (support both raw and mapped shapes)
//   const [damId, setDamId] = React.useState<number | null>(row?.damPrefId ?? row?.damPref?.id ?? null);
//   const [sireId, setSireId] = React.useState<number | null>(row?.sirePrefId ?? row?.sirePref?.id ?? null);
//   const [damQ, setDamQ] = React.useState<string>(row?.damPref?.name ?? row?.damPrefName ?? "");
//   const [sireQ, setSireQ] = React.useState<string>(row?.sirePref?.name ?? row?.sirePrefName ?? "");
//   const [damOpen, setDamOpen] = React.useState(false);
//   const [sireOpen, setSireOpen] = React.useState(false);

//   // Admin fields mirrored from your overview section
//   const [status, setStatus] = React.useState<string>(row?.status ?? "");
//   const [priority, setPriority] = React.useState<number | "">(row?.priority ?? "");
//   const [depositPaidAt, setDepositPaidAt] = React.useState<string>(row?.depositPaidAt ?? "");
//   const [notes, setNotes] = React.useState<string>(row?.notes ?? "");

//   // RE-SEED LOCAL STATE WHEN THE ROW SHOWN CHANGES
//   React.useEffect(() => {
//     const nextSpeciesUi = (() => {
//       const w = String(row?.speciesPref || "").toUpperCase();
//       return w === "DOG" ? "Dog" : w === "CAT" ? "Cat" : w === "HORSE" ? "Horse" : "";
//     })() as SpeciesUi | "";
//     setSpeciesUi(nextSpeciesUi);

//     const nextBreedName =
//       row?.breedPrefText ??
//       (Array.isArray(row?.breedPrefs) ? row.breedPrefs.find(Boolean) : null) ??
//       null;
//     setBreed(nextBreedName ? { name: nextBreedName } : null);
//     setBreedNonce((n) => n + 1);

//     setDamId(row?.damPrefId ?? row?.damPref?.id ?? null);
//     setSireId(row?.sirePrefId ?? row?.sirePref?.id ?? null);
//     setDamQ(row?.damPref?.name ?? row?.damPrefName ?? "");
//     setSireQ(row?.sirePref?.name ?? row?.sirePrefName ?? "");
//     setDamOpen(false);
//     setSireOpen(false);

//     setStatus(row?.status ?? "");
//     setPriority(row?.priority ?? "");
//     setDepositPaidAt(row?.depositPaidAt ?? "");
//     setNotes(row?.notes ?? "");
//   }, [row?.id, row?.updatedAt]);

//   // keep DetailsScaffold draft in sync so Save can pick it up
//   React.useEffect(() => {
//     if (mode !== "edit") return;
//     onChangeRef.current({
//       speciesPref: speciesWire ?? null,
//       breedPrefs: (breed?.name ?? "").trim() ? [breed.name.trim()] : null,
//       damPrefId: damId ?? null,
//       sirePrefId: sireId ?? null,
//       status: status || null,
//       priority: priority === "" ? null : Number(priority),
//       depositPaidAt: depositPaidAt || null,
//       notes: notes || null,
//     });
//   }, [mode, speciesWire, breed, damId, sireId, status, priority, depositPaidAt, notes]);

//   // live animal search lists
//   const dams = useAnimalSearch(api, damQ, speciesWire, "FEMALE");
//   const sires = useAnimalSearch(api, sireQ, speciesWire, "MALE");

//   return (
//     <div className="space-y-4">
//       <SectionCard title="Preferences (required)">
//         <div className={"p-2 grid grid-cols-1 md:grid-cols-3 gap-3 " + (readOnly ? "opacity-70" : "")}>
//           {/* Species */}
//           <label className="flex flex-col gap-1">
//             <span className={labelClass}>Species</span>
//             <select
//               className={inputClass}
//               value={speciesUi}
//               onChange={(e) => {
//                 setSpeciesUi(e.currentTarget.value as SpeciesUi);
//                 setDamId(null);
//                 setSireId(null);
//                 setDamQ("");
//                 setSireQ("");
//                 setDamOpen(false);
//                 setSireOpen(false);
//                 setBreed(null);
//                 setBreedNonce((n) => n + 1);
//               }}
//               disabled={readOnly}
//             >
//               <option value="">-</option>
//               {SPECIES_UI_ALL.map((s) => (
//                 <option key={s} value={s}>
//                   {s}
//                 </option>
//               ))}
//             </select>
//           </label>

//           {/* Breed */}
//           <div className="md:col-span-2">
//             <div className={labelClass + " mb-1"}>Breed</div>
//             {speciesUi ? (
//               readOnly ? (
//                 // READ-ONLY: show the current value, no interaction
//                 <div className="h-9 px-3 flex items-center rounded-md border border-hairline bg-surface/60 text-sm">
//                   {breed?.name || "-"}
//                 </div>
//               ) : (
//                 // EDIT: interactive picker
//                 <BreedCombo
//                   key={`breed-${speciesUi}-${breedNonce}`}
//                   species={speciesUi}
//                   value={breed}
//                   onChange={onBreedPick}
//                   api={{ breeds: { listCanonical: api!.breeds.listCanonical } }}
//                 />
//               )
//             ) : (
//               <div className="h-9 px-3 flex items-center rounded-md border border-hairline bg-surface/60 text-sm text-secondary">
//                 Select Species
//               </div>
//             )}
//           </div>
//         </div>
//       </SectionCard>

//       <SectionCard title="Preferred Parents (optional)">
//         <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-3">
//           {/* Dam */}
//           <label className="flex flex-col gap-1">
//             <span className={labelClass}>Dam (Female)</span>
//             {!speciesWire ? (
//               <div className="h-9 px-3 flex items-center rounded-md border border-hairline bg-surface/60 text-sm text-secondary">Select Species</div>
//             ) : (
//               <>
//                 <div ref={damBoxRef} className="relative" style={{ maxWidth: 420 }}>
//                   <InlineSearch
//                     value={damQ}
//                     onChange={(val) => { setDamQ(val); setDamOpen(!!val.trim()); }}
//                     onFocus={() => setDamOpen(!!damQ.trim())}
//                     onBlur={() => setTimeout(() => setDamOpen(false), 100)}
//                     placeholder="Search females..."
//                     widthPx={400}
//                     disabled={mode !== "edit"}
//                   />
//                 </div>
//                 <PortalPopover anchorRef={damBoxRef} open={!readOnly && !!(damOpen && damQ.trim())}>
//                   {dams.length === 0 ? (
//                     <div className="px-2 py-2 text-sm text-secondary">No females found</div>
//                   ) : (
//                     dams.map((a) => (
//                       <button key={a.id} type="button" onClick={() => { setDamId(a.id); setDamQ(a.name); setDamOpen(false); }} className="w-full text-left px-2 py-1 hover:bg-white/5">
//                         {a.name}
//                       </button>
//                     ))
//                   )}
//                 </PortalPopover>
//               </>
//             )}
//           </label>

//           {/* Sire */}
//           <label className="flex flex-col gap-1">
//             <span className={labelClass}>Sire (Male)</span>
//             {!speciesWire ? (
//               <div className="h-9 px-3 flex items-center rounded-md border border-hairline bg-surface/60 text-sm text-secondary">
//                 Select Species
//               </div>
//             ) : (
//               <>
//                 <div ref={sireBoxRef} className="relative" style={{ maxWidth: 420 }}>
//                   <InlineSearch
//                     value={sireQ}
//                     onChange={(val) => { setSireQ(val); setSireOpen(!!val.trim()); }}
//                     onFocus={() => setSireOpen(!!sireQ.trim())}
//                     onBlur={() => setTimeout(() => setSireOpen(false), 100)}
//                     placeholder="Search males..."
//                     widthPx={400}
//                     disabled={mode !== "edit"}
//                   />
//                 </div>
//                 <PortalPopover anchorRef={sireBoxRef} open={!readOnly && !!(sireOpen && sireQ.trim())}>
//                   {sires.length === 0 ? (
//                     <div className="px-2 py-2 text-sm text-secondary">No males found</div>
//                   ) : (
//                     sires.map((a) => (
//                       <button
//                         key={a.id}
//                         type="button"
//                         onClick={() => { setSireId(a.id); setSireQ(a.name); setSireOpen(false); }}
//                         className="w-full text-left px-2 py-1 hover:bg-white/5"
//                       >
//                         {a.name}
//                       </button>
//                     ))
//                   )}
//                 </PortalPopover>
//               </>
//             )}
//           </label>
//         </div>
//       </SectionCard>

//       <SectionCard title="Admin">
//         <div className={"p-2 grid grid-cols-1 md:grid-cols-3 gap-3 " + (readOnly ? "opacity-70" : "")}>
//           <label className="flex flex-col gap-1">
//             <span className={labelClass}>Status</span>
//             <input className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)} disabled={readOnly} />
//           </label>
//           <label className="flex flex-col gap-1">
//             <span className={labelClass}>Priority</span>
//             <input
//               className={inputClass}
//               type="number"
//               value={priority}
//               onChange={(e) => setPriority(e.target.value === "" ? "" : Number(e.target.value))} disabled={readOnly}
//             />
//           </label>
//           <label className="flex flex-col gap-1">
//             <span className={labelClass}>Deposit Paid</span>
//             <input
//               className={inputClass}
//               type="date"
//               value={depositPaidAt || ""}
//               onChange={(e) => setDepositPaidAt(e.target.value)} disabled={readOnly}
//             />
//           </label>
//           <label className="flex flex-col gap-1 md:col-span-3">
//             <span className={labelClass}>Notes</span>
//             <textarea
//               className={inputClass + " h-24 resize-vertical"}
//               value={notes}
//               onChange={(e) => setNotes(e.target.value)} disabled={readOnly}
//             />
//           </label>
//         </div>
//       </SectionCard>
//     </div>
//   );
// }

// function WaitlistTab() { return null as any; }
// /** Small bridge to open AddToWaitlistModal from the toolbar button without custom row hacks */
// function WaitlistAddBridge({ api, tenantId, onCreated }: { api: ReturnType<typeof makeOffspringApi> | null; tenantId: number | null; onCreated: () => Promise<void> | void }) {
//   const [open, setOpen] = React.useState(false);
//   React.useEffect(() => {
//     const h = () => setOpen(true);
//     window.addEventListener("bhq:offspring:add-waitlist", h as any);
//     return () => window.removeEventListener("bhq:offspring:add-waitlist", h as any);
//   }, []);
//   return (
//     <AddToWaitlistModal
//       api={api}
//       tenantId={tenantId}
//       open={open}
//       onClose={() => setOpen(false)}
//       onCreated={onCreated}
//       allowedSpecies={["Dog", "Cat", "Horse"]}
//     />
//   );
// }

/* ───────────────────────── Module shell ───────────────────────── */

/* ───────────────────────── Module shell ───────────────────────── */

export default function AppOffspringModule() {
  // Resolve tenant once, memo client
  const [tenantId, setTenantId] = React.useState<number | null>(
    () => readTenantIdFast() ?? null,
  );

  React.useEffect(() => {
    if (tenantId != null) return;

    let cancelled = false;

    (async () => {
      try {
        const t = await resolveTenantId();
        if (!cancelled) setTenantId(t);
      } catch {
        // swallow tenant resolution errors, page will stay inert
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const api = React.useMemo(() => makeOffspringApi("/api/v1"), []);

  const [allowedSpecies, setAllowedSpecies] = React.useState<SpeciesUi[]>([
    "Dog",
    "Cat",
    "Horse",
  ]);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // Optional tenant settings endpoint, tolerate absence
        // Expect shape like { allowedSpecies: ["Dog","Cat"] } or offspringAllowedSpecies
        const res = await (api as any)?.tenants?.settings?.get?.();
        const arr: string[] =
          res?.allowedSpecies ?? res?.offspringAllowedSpecies ?? null;

        if (alive && Array.isArray(arr) && arr.length) {
          const cleaned = arr
            .map((s) => String(s).trim())
            .filter((s) => ["Dog", "Cat", "Horse"].includes(s)) as SpeciesUi[];

          if (cleaned.length) {
            setAllowedSpecies(cleaned);
          }
        }
      } catch {
        // ignore settings failures
      }
    })();

    return () => {
      alive = false;
    };
  }, [api]);

  // Permissions, gate editing
  const readOnlyGlobal =
    !((window as any).bhqPerms?.offspring?.canEdit ?? true);

  const [activeTab, setActiveTab] =
    React.useState<"offspring" | "groups" | "waitlist">("groups");

  // URL driven tab routing and auto open
  React.useEffect(() => {
    const apply = () => {
      let url: URL;

      try {
        url = new URL(window.location.href);
      } catch {
        // fall back to default when URL parsing fails
        setActiveTab("groups");
        return;
      }

      const rawTab =
        url.searchParams.get("tab") || url.hash.replace("#", "");

      const directTab =
        rawTab === "offspring" ||
          rawTab === "groups" ||
          rawTab === "waitlist"
          ? (rawTab as "offspring" | "groups" | "waitlist")
          : null;

      if (directTab) {
        setActiveTab(directTab);
        return;
      }

      const offspringId = url.searchParams.get("offspringId");
      const groupId = url.searchParams.get("groupId");
      const waitlistId = url.searchParams.get("waitlistId");

      if (offspringId) {
        setActiveTab("offspring");
      } else if (groupId) {
        setActiveTab("groups");
      } else if (waitlistId) {
        setActiveTab("waitlist");
      } else {
        // default when nothing in URL
        setActiveTab("groups");
      }
    };

    apply();

    const onPop = () => apply();
    window.addEventListener("popstate", onPop);

    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const handleTabChange = React.useCallback(
    (next: "offspring" | "groups" | "waitlist") => {
      setActiveTab(next);

      try {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", next);
        window.history.replaceState({}, "", url.toString());
      } catch {
        // ignore URL failures in embedded shells
      }
    },
    [],
  );

  return (
    <div className="p-4 space-y-4">
      <PageHeader
        title="Offspring | Buyers | Waitlist"
        subtitle={
          activeTab === "offspring"
            ? "Managed individual Offspring"
            : activeTab === "groups"
              ? "Managing Your Offspring and Buyers"
              : "Global Waitlist"
        }
        rightSlot={
          <UnderlineTabs value={activeTab} onChange={handleTabChange} />
        }
      />

      {activeTab === "offspring" && <OffspringPage embed />}

      {activeTab === "groups" && (
        <OffspringGroupsTab
          api={api}
          tenantId={tenantId}
          readOnlyGlobal={readOnlyGlobal}
        />
      )}

      {activeTab === "waitlist" && <WaitlistPage embed />}
    </div>
  );
}
