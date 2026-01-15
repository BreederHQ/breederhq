// App-Offspring.tsx (drop-in, compile-ready, aligned with shared DetailsHost/Table pattern)

import OffspringPage from "./pages/OffspringPage";
import * as React from "react";
import ReactDOM from "react-dom";
import { Trash2, Plus, X, ChevronDown, MoreHorizontal, Download, LayoutGrid, List, Table as TableIcon } from "lucide-react";
import { NavLink, useInRouterContext } from "react-router-dom";
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
  DatePicker,
  exportToCsv,
  Popover,
  useViewMode,
  TagPicker,
  type TagOption,
} from "@bhq/ui";
import { FinanceTab, type OffspringGroupContext } from "@bhq/ui/components/Finance";

import { Overlay } from "@bhq/ui/overlay";
import "@bhq/ui/styles/table.css";
import { readTenantIdFast, resolveTenantId } from "@bhq/ui/utils/tenant";
import {
  makeOffspringApiClient,
  OffspringApi,
  OffspringRow,
  WaitlistEntry,
  AnimalLite,
} from "./api";
import clsx from "clsx";

import { reproEngine } from "@bhq/ui/utils";
import { GroupCardView } from "./components/GroupCardView";
import { GroupListView } from "./components/GroupListView";
import { CollarPicker, CollarSwatch } from "./components/CollarPicker";
import { AddOffspringForm, type AddOffspringFormData } from "./components/AddOffspringForm";


/* ───────────────────────── shared types ───────────────────────── */

type DirectoryHit =
  | {
    kind: "contact";
    id: number;
    label: string;
    sub?: string;
    email?: string;
    phone?: string;
  }
  | {
    kind: "org";
    id: number;
    label: string;
    sub?: string;
  };

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
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
        data-form-type="other"
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

type DetailsSpecField<T> = {
  key: keyof T | string;
  label: string;
  view?: (row: T) => React.ReactNode;
  editor?: "number" | "text";
};

type DetailsSpecSection<T> = {
  title: string;
  columns?: 1 | 2 | 3;
  fields: DetailsSpecField<T>[];
};

type DetailsSpecRendererProps<T> = {
  row: T;
  mode: "view" | "edit";
  setDraft: (patch: Partial<T>) => void;
  sections: DetailsSpecSection<T>[];
};

function DetailsSpecRenderer<T extends Record<string, any>>({
  row,
  mode,
  setDraft,
  sections,
}: DetailsSpecRendererProps<T>) {
  const isEdit = mode === "edit";

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const columns =
          section.columns === 3
            ? 3
            : section.columns === 1
              ? 1
              : 2;
        const gridStyle = {
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        };

        const isCounts = section.title === "Counts";
        const fieldContainer =
          "flex flex-col " + (isCounts ? "gap-3 pb-2" : "gap-2");
        const valueClass =
          (isCounts ? "pb-3 md:pb-4" : "pb-1") +
          " text-xs text-foreground/80 md:text-sm";
        const labelClass =
          "text-sm font-semibold text-secondary uppercase";
        const gapY = isCounts ? "gap-y-16" : "gap-y-8";

        return (
          <SectionCard key={section.title} title={section.title}>
            <div
              className={`grid ${
                section.columns === 3
                  ? "grid-cols-3"
                  : section.columns === 1
                    ? "grid-cols-1"
                    : "grid-cols-2"
              } gap-x-6 ${gapY} text-sm`}
              style={gridStyle}
            >
              {section.fields.map((field) => {
                const key = String(field.key);
                const raw =
                  typeof field.view === "function"
                    ? field.view(row)
                    : (row as any)[key];

                // Number editor, used for group counts
                if (isEdit && field.editor === "number") {
                  const defaultVal =
                    raw === null || raw === undefined || raw === "" || raw === "-"
                      ? ""
                      : String(raw);

                  return (
                    <div key={key} className={fieldContainer}>
                      <div className={labelClass}>
                        {field.label}
                      </div>
                      <Input
                        type="number"
                        defaultValue={defaultVal}
                        onBlur={(e) => {
                          const v = e.currentTarget.value;
                          if (v === "") {
                            setDraft({ [key]: null } as any);
                            return;
                          }
                          const n = Number(v);
                            setDraft({
                              [key]: Number.isFinite(n) ? n : null,
                            } as any);
                          }}
                        className="h-8 w-full bg-background text-sm"
                      />
                    </div>
                  );
                }

                // Default read only rendering
                const value =
                  raw === null || raw === undefined || raw === ""
                    ? "-"
                    : raw;

                return (
                  <div key={key} className={fieldContainer}>
                    <div className={labelClass}>
                      {field.label}
                    </div>
                    <div className={valueClass}>
                      {value}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        );
      })}
    </div>
  );
}

/* ───────────────────────── SafeNavLink (works with or without Router) ───────────────────────── */
function SafeNavLink({
  to,
  children,
  className,
  style,
  end,
}: {
  to: string;
  children: React.ReactNode | ((arg: { isActive: boolean }) => React.ReactNode);
  className: ((arg: { isActive: boolean }) => string) | string;
  style?: ((arg: { isActive: boolean }) => React.CSSProperties) | React.CSSProperties;
  end?: boolean;
}) {
  const inRouter = useInRouterContext();

  const computeActive = React.useCallback(() => {
    try {
      const here = (typeof window !== "undefined" ? window.location.pathname : "/").replace(/\/+$/, "") || "/";
      const target = new URL(to, typeof window !== "undefined" ? window.location.href : "http://x").pathname
        .replace(/\/+$/, "") || "/";
      if (end) {
        return here === target;
      }
      return here === target || here.startsWith(target + "/");
    } catch {
      return false;
    }
  }, [to, end]);

  if (!inRouter) {
    const isActive = computeActive();
    const cls = typeof className === "function" ? className({ isActive }) : className;
    const sty = typeof style === "function" ? style({ isActive }) : style;
    const resolvedChildren = typeof children === "function" ? children({ isActive }) : children;
    return (
      <a href={to} className={cls} style={sty}>
        {resolvedChildren}
      </a>
    );
  }

  return (
    <NavLink to={to} end={end} className={className as any} style={style as any}>
      {children as any}
    </NavLink>
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

function AttachmentsSection({
  group,
  api,
  mode,
}: {
  group: OffspringRow;
  api: OffspringApi | null;
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


type BuyerLink = {
  id: number;
  contactId: number | null;
  organizationId: number | null;
  waitlistEntryId: number | null;
  contactLabel: string | null;
  orgLabel: string | null;
};


/* ───────────────────────── Groups table ───────────────────────── */
type ViewMode = "table" | "cards";

type GroupTableRow = {
  id: number;
  planCode?: string | null;
  planName?: string | null;
  planId?: number | null;
  programId?: number | null;
  programName?: string | null;
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
  expectedWeaned?: string | null;
  expectedPlacementStart?: string | null;
  expectedPlacementCompleted?: string | null;

  seasonLabel?: string | null;

  // Optional group level tags, from backend if present
  tags?: string[] | null;
  tagObjects?: Array<{ id: number; name: string; color?: string | null }>;
  buyers?: BuyerLink[];

  // Counts
  countLive?: number | null;
  countStillborn?: number | null;
  countReserved?: number | null;
  countSold?: number | null;
  countWeaned?: number | null;
  countPlaced?: number | null;
  depositCollected?: number | null;
  fullPaymentReceived?: number | null;

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
  { key: "planCode", label: "Plan ID", default: false },
  { key: "expectedPlacementStart", label: "Placement Start", default: false },
  { key: "expectedPlacementCompleted", label: "Placement Done", default: false },
  { key: "countLive", label: "Count", default: false },
  { key: "countReserved", label: "Reserved", default: true },

  // New columns, off by default
  { key: "tags", label: "Tags", default: false },
  { key: "countWeaned", label: "Weaned", default: false },
  { key: "countPlaced", label: "Placed", default: false },
  { key: "updatedAt", label: "Updated", default: false },
];

const GROUP_STORAGE_KEY = "bhq_offspring_groups_cols_v4";

const GROUP_DATE_COLS = new Set<string>([
  "expectedBirth",
  "expectedPlacementStart",
  "expectedPlacementCompleted",
  "updatedAt",
]);

function moneyFmt(n?: number | null): string {
  if (n == null) return "-";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
  } catch {
    return `$${Number(n).toFixed(2)}`;
  }
}

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
      expectedWeaned: null,
      expectedPlacementStartDate: null,
      expectedPlacementCompletedDate: null,
    };
  }

  // Compute timeline using reproEngine
  const todayIso = new Date().toISOString().slice(0, 10);
  const summary = {
    animalId: "",
    species: speciesWire,
    cycleStartsAsc: [],
    dob: null,
    today: todayIso,
  };

  const timeline = reproEngine.buildTimelineFromSeed(summary as any, locked as any);

  const expectedCycleStart = locked;
  const expectedHormoneTestingStart = pickExpectedTestingStart(timeline, locked);
  const expectedBreedDate = onlyDay(timeline?.milestones?.ovulation_center) || null;
  const expectedBirthDate = onlyDay(timeline?.windows?.birth?.likely?.[0]) || null;
  const expectedWeaned =
    onlyDay(
      timeline?.windows?.offspring_care?.likely?.[1],
    ) || null;

  const expectedPlacementStartDate =
    onlyDay(
      timeline?.windows?.placement_normal?.likely?.[0],
    ) || null;

  const expectedPlacementCompletedDate =
    onlyDay(
      timeline?.windows?.placement_extended?.full?.[1],
    ) || null;

  return {
    expectedCycleStart,
    expectedHormoneTestingStart,
    expectedBreedDate,
    expectedBirthDate,
    expectedWeaned,
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
  expectedWeaned: string | null;
  expectedPlacementStartDate: string | null;
  expectedPlacementCompletedDate: string | null;
};

function mapDetailToTableRow(d: OffspringRow): GroupTableRow {
  const plan = d.plan;
  const planAny: any = plan;
  const counts: any = d.counts ?? {};
  const dates: any = d.dates ?? {};

  // Compute expected date preview from the breeding plan, if we have a locked cycle
  let expected: ExpectedLite = {
    expectedCycleStart: null,
    expectedHormoneTestingStart: null,
    expectedBreedDate: null,
    expectedBirthDate: null,
    expectedWeaned: null,
    expectedPlacementStartDate: null,
    expectedPlacementCompletedDate: null,
  };

  if (plan?.lockedCycleStart) {
    expected = computeExpectedForPlanLite({
      species: plan.species ?? null,
      lockedCycleStart: plan.lockedCycleStart ?? null,
    });
  }

  const baseStatus =
    planAny?.status === "COMMITTED" || planAny?.status === "ACTIVE"
      ? "Committed"
      : "Planning";

  const status = d.statusOverride || (d as any).status || baseStatus;

  // Aggregate metrics for summary chips
  const metrics = computeGroupMetrics(d as any);

  // Normalize buyers coming from the API
  const buyersWire = (d as any).BuyerLinks || (d as any).buyers || [];

  const buyers: BuyerLink[] = (Array.isArray(buyersWire) ? buyersWire : []).map((b: any): BuyerLink => ({
    id: b.id,
    contactId: b.contactId ?? null,
    organizationId: b.organizationId ?? null,
    waitlistEntryId: b.waitlistEntryId ?? null,
    contactLabel:
      b.contactLabel ??
      b.contact?.displayName ??
      b.contact?.display_name ??
      b.contact?.name ??
      b.contact?.email ??
      b.contact?.phone ??
      null,
    orgLabel:
      b.orgLabel ??
      b.organization?.name ??
      b.organization?.displayName ??
      b.organization?.email ??
      b.organization?.phone ??
      null,
  }));


  const row: GroupTableRow = {
    id: d.id,
    planCode: plan?.code ?? null,
    planName: plan?.name ?? null,
    planId: plan?.id ?? null,
    programId: plan?.program?.id ?? plan?.programId ?? null,
    programName: plan?.program?.name ?? null,
    groupName: d.identifier ?? plan?.name ?? `Group #${d.id}`,
    species: plan?.species ?? d.species ?? null,
    breed: plan?.breedText ?? null,

    damName: plan?.dam?.name ?? null,
    damId: plan?.dam?.id ?? null,

    sireName: plan?.sire?.name ?? null,
    sireId: plan?.sire?.id ?? null,

    expectedCycleStart: expected.expectedCycleStart,
    expectedHormoneTestingStart: expected.expectedHormoneTestingStart,
    expectedBreedDate: expected.expectedBreedDate,
    expectedBirth: expected.expectedBirthDate,
    expectedWeaned: expected.expectedWeaned,
    expectedPlacementStart: expected.expectedPlacementStartDate,
    expectedPlacementCompleted: expected.expectedPlacementCompletedDate,

    seasonLabel: (planAny as any)?.seasonLabel ?? null,

    tags: Array.isArray((d as any).tags) ? (d as any).tags : null,

    countLive:
      typeof counts.live === "number"
        ? counts.live
        : (counts as any).animals ?? null,
    countStillborn:
      typeof (counts as any).stillborn === "number"
        ? (counts as any).stillborn
        : null,
    countReserved:
      typeof counts.reserved === "number" ? counts.reserved : null,
    countSold: deriveCountSold(d),
    countWeaned:
      typeof (counts as any).weaned === "number"
        ? (counts as any).weaned
        : null,
    countPlaced:
      typeof (counts as any).placed === "number"
        ? (counts as any).placed
        : null,
    depositCollected:
      typeof (counts as any).depositCollected === "number"
        ? (counts as any).depositCollected
        : null,
    fullPaymentReceived:
      typeof (counts as any).fullPaymentReceived === "number"
        ? (counts as any).fullPaymentReceived
        : typeof (counts as any).paymentReceived === "number"
          ? (counts as any).paymentReceived
          : null,

    statusOverride: d.statusOverride ?? null,
    statusOverrideReason: d.statusOverrideReason ?? null,
    status,

    totalOffspring: metrics.totalOffspring,
    maleCount: metrics.maleCount,
    femaleCount: metrics.femaleCount,
    unknownSexCount: metrics.unknownSexCount,
    mortalityCount: metrics.mortalityCount,
    mortalityRate: metrics.mortalityRate,
    waitlistOverlapCount: metrics.waitlistOverlapCount,
    avgPlacementPriceCents: metrics.avgPlacementPriceCents,

    updatedAt:
      (d as any).updatedAt ??
      (d as any).updated_at ??
      (d as any).updated ??
      null,
    buyers,
  };

  return row;
}

function normalizeGroupRowFromDetail(input: any): OffspringRow {
  if (!input) return input as OffspringRow;

  const row: any = { ...input };

  const rawLinks: any[] =
    Array.isArray(row.BuyerLinks)
      ? row.BuyerLinks
      : Array.isArray(row.buyerLinks)
        ? row.buyerLinks
        : Array.isArray(row.buyers)
          ? row.buyers
          : [];

  const buyers = rawLinks.map((b: any) => ({
    id: b.id,
    groupId: b.groupId ?? row.id,
    contactId: b.contactId ?? b.contact?.id ?? null,
    organizationId: b.organizationId ?? b.organization?.id ?? null,
    waitlistEntryId: b.waitlistEntryId ?? b.waitlistEntry?.id ?? null,
    contactLabel:
      b.contactLabel ??
      b.contact?.display_name ??
      null,
    orgLabel:
      b.orgLabel ??
      b.organization?.name ??
      null,
  }));

  row.buyers = buyers;

  return row as OffspringRow;
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
    <div style={{ paddingBottom: 24 }}>
      <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {props.label}
      </div>
      <div style={{ marginTop: 4 }} className="text-xs text-foreground/80 md:text-sm">{props.children ?? "-"}</div>
    </div>
  );
}

/* ───────────────── SectionTitle (with icon support) ───────────────── */
function SectionTitle({ icon, children }: { icon?: string; children: React.ReactNode }) {
  if (!icon) return <>{children}</>;

  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-lg" style={{ opacity: 0.7 }}>{icon}</span>
      <span>{children}</span>
    </span>
  );
}

/** ---------- Group Tags Section ---------- */
function GroupTagsSection({
  groupId,
  api,
  disabled = false,
}: {
  groupId: number;
  api: OffspringApi | null;
  disabled?: boolean;
}) {
  const [availableTags, setAvailableTags] = React.useState<TagOption[]>([]);
  const [selectedTags, setSelectedTags] = React.useState<TagOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load tags on mount
  React.useEffect(() => {
    if (!api) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load available tags for OFFSPRING_GROUP module
        const availableRes = await api.tags.list({ module: "OFFSPRING_GROUP", limit: 200 });
        const availableItems = availableRes?.items || [];
        const available = availableItems.map((t: any) => ({
          id: Number(t.id),
          name: String(t.name),
          color: t.color ?? null,
        }));
        if (!cancelled) setAvailableTags(available);

        // Load currently assigned tags
        const assignedRes = await api.tags.listForOffspringGroup(groupId);
        const assignedItems = Array.isArray(assignedRes) ? assignedRes : [];
        const assigned = assignedItems.map((t: any) => ({
          id: Number(t.id),
          name: String(t.name),
          color: t.color ?? null,
        }));
        if (!cancelled) setSelectedTags(assigned);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load tags");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [api, groupId]);

  const handleSelect = React.useCallback(async (tag: TagOption) => {
    if (!api) return;
    // Optimistic update
    setSelectedTags((prev) => [...prev, tag]);
    setError(null);

    try {
      await api.tags.assign(tag.id, { offspringGroupId: groupId });
    } catch (e: any) {
      // Rollback on error
      setSelectedTags((prev) => prev.filter((t) => t.id !== tag.id));
      setError(e?.message || "Failed to assign tag");
    }
  }, [api, groupId]);

  const handleRemove = React.useCallback(async (tag: TagOption) => {
    if (!api) return;
    // Optimistic update
    setSelectedTags((prev) => prev.filter((t) => t.id !== tag.id));
    setError(null);

    try {
      await api.tags.unassign(tag.id, { offspringGroupId: groupId });
    } catch (e: any) {
      // Rollback on error
      setSelectedTags((prev) => [...prev, tag]);
      setError(e?.message || "Failed to remove tag");
    }
  }, [api, groupId]);

  const handleCreate = React.useCallback(async (name: string): Promise<TagOption> => {
    if (!api) throw new Error("API not available");
    const created = await api.tags.create({ name, module: "OFFSPRING_GROUP" });
    const newTag: TagOption = {
      id: Number(created.id),
      name: String(created.name),
      color: created.color ?? null,
    };
    // Add to available tags list
    setAvailableTags((prev) => [...prev, newTag]);
    return newTag;
  }, [api]);

  return (
    <TagPicker
      availableTags={availableTags}
      selectedTags={selectedTags}
      onSelect={handleSelect}
      onRemove={handleRemove}
      onCreate={handleCreate}
      loading={loading}
      error={error}
      placeholder="Add tags..."
      disabled={disabled}
    />
  );
}

const groupSections = (mode: "view" | "edit"): DetailsSpecSection<GroupTableRow>[] => [
  {
    title: "Counts",
    columns: 3 as const,
    fields: [
      {
        label: "Live",
        key: "countLive",
        editor: "number",
        view: (r: GroupTableRow) => String(r.countLive ?? 0),
      },
      {
        label: "Deceased",
        key: "countStillborn",
        editor: "number",
        view: (r: GroupTableRow) =>
          r.countStillborn != null ? String(r.countStillborn) : "-",
      },
      {
        label: "Unknown",
        key: "unknownSexCount",
        view: (r: GroupTableRow) =>
          r.unknownSexCount != null ? String(r.unknownSexCount) : "-",
      },
      {
        label: "Deposit Collected",
        key: "depositCollected",
        view: (r: GroupTableRow) =>
          r.depositCollected != null ? String(r.depositCollected) : "-",
      },
      {
        label: "Full Payment Received",
        key: "fullPaymentReceived",
        view: (r: GroupTableRow) =>
          r.fullPaymentReceived != null ? String(r.fullPaymentReceived) : "-",
      },
    ],
  },
];

/* ───────────────────────── Directory/Animals helpers ───────────────────────── */
type SpeciesWire = "DOG" | "CAT" | "HORSE" | "GOAT" | "RABBIT" | "SHEEP";
type SpeciesUi = "Dog" | "Cat" | "Horse" | "Goat" | "Rabbit" | "Sheep";
const SPECIES_UI_ALL: SpeciesUi[] = ["Dog", "Cat", "Horse", "Goat", "Rabbit", "Sheep"];
const toWireSpecies = (s: SpeciesUi | ""): SpeciesWire | undefined => {
  const map: Record<SpeciesUi, SpeciesWire> = {
    Dog: "DOG",
    Cat: "CAT",
    Horse: "HORSE",
    Goat: "GOAT",
    Rabbit: "RABBIT",
    Sheep: "SHEEP",
  };
  return s ? map[s] : undefined;
};

async function searchDirectory(
  api: OffspringApi | null,
  q: string,
): Promise<DirectoryHit[]> {
  const term = q.trim();
  if (!api || !term) return [];

  const termLower = term.toLowerCase();
  const anyApi: any = api;
  const hits: DirectoryHit[] = [];

  // Contacts
  try {
    let contactsRes: any;

    if (anyApi.contacts && typeof anyApi.contacts.list === "function") {
      // Use typed client if present
      contactsRes = await anyApi.contacts.list({ q: term, limit: 50 });
    } else {
      // Fallback to platform contacts endpoint
      const qs = new URLSearchParams({ q: term, limit: "50" });
      contactsRes = await api.raw.get<any>(`/contacts?${qs.toString()}`, {});
    }

    const items: any[] = Array.isArray(contactsRes)
      ? contactsRes
      : contactsRes?.items ?? [];

    for (const c of items) {
      const label =
        c.display_name ||
        `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() ||
        "(Contact)";
      const email = c.email ?? "";
      const phone = c.phoneE164 || c.phone || "";
      const haystack = `${label} ${email} ${phone}`.toLowerCase();

      // Client side filter so results actually match what you typed
      if (!haystack.includes(termLower)) continue;

      hits.push({
        kind: "contact",
        id: Number(c.id),
        label,
        sub: email || phone || "",
        email,
        phone,
      });
    }
  } catch (e) {
    console.error("Directory contact search failed", e);
  }

  // Organizations
  try {
    let orgsRes: any;

    if (anyApi.organizations && typeof anyApi.organizations.list === "function") {
      orgsRes = await anyApi.organizations.list({ q: term, limit: 50 });
    } else {
      const qs = new URLSearchParams({ q: term, limit: "50" });
      orgsRes = await api.raw.get<any>(`/organizations?${qs.toString()}`, {});
    }

    const items: any[] = Array.isArray(orgsRes)
      ? orgsRes
      : orgsRes?.items ?? [];

    for (const o of items) {
      const label = o.name || "(Organization)";
      const email = o.email ?? "";
      const phone = o.phone ?? "";
      const haystack = `${label} ${email} ${phone}`.toLowerCase();

      if (!haystack.includes(termLower)) continue;

      hits.push({
        kind: "org",
        id: Number(o.id),
        label,
        sub: email || phone || "",
      });
    }
  } catch (e) {
    console.error("Directory organization search failed", e);
  }

  // Optional: keep results with better matches first
  hits.sort((a, b) => {
    const aLabel = a.label.toLowerCase();
    const bLabel = b.label.toLowerCase();
    const aIndex = aLabel.indexOf(termLower);
    const bIndex = bLabel.indexOf(termLower);

    if (aIndex !== bIndex) {
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    }

    return aLabel.localeCompare(bLabel);
  });

  return hits;
}

type LocalAnimalLite = { id: number; name: string; species: SpeciesWire; sex: "FEMALE" | "MALE" };
async function fetchAnimals(
  api: ReturnType<typeof makeOffspringApiClient> | null,
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

type ParentResultsProps = {
  api: OffspringApi | null;
  query: string;
  species?: SpeciesWire;
  onPick: (a: AnimalLite) => void;
};

function useAnimalSearch(
  api: OffspringApi | null,
  query: string,
  species: SpeciesWire | undefined,
  sex: "FEMALE" | "MALE",
) {
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
      if (alive) setHits(strict);
    })();

    return () => {
      alive = false;
    };
  }, [api, query, species, sex]);

  return hits;
}

function DamResults({ api, query, species, onPick }: ParentResultsProps) {
  const hits = useAnimalSearch(api, query, species, "FEMALE");
  if (!hits.length) {
    return <div className="px-2 py-2 text-sm text-secondary">No females found</div>;
  }
  return (
    <>
      {hits.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => onPick(a)}
          className="w-full text-left px-2 py-1 hover:bg-white/5"
        >
          {a.name}
        </button>
      ))}
    </>
  );
}

function SireResults({ api, query, species, onPick }: ParentResultsProps) {
  const hits = useAnimalSearch(api, query, species, "MALE");
  if (!hits.length) {
    return <div className="px-2 py-2 text-sm text-secondary">No males found</div>;
  }
  return (
    <>
      {hits.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => onPick(a)}
          className="w-full text-left px-2 py-1 hover:bg-white/5"
        >
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

async function exactContactLookup(api: ReturnType<typeof makeOffspringApiClient>, probe: {
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

function prettyStatus(value: string | null | undefined): string {
  if (!value) return "-";
  // Normalize enum-style codes and plain strings
  const normalized = String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return normalized;
}

/* ───────────────────────── Create Group form ───────────────────────── */
const MODAL_Z = 9007199254740000;

function CreateGroupForm({
  api,
  tenantId,
  onCreated,
  onCancel,
}: {
  api: OffspringApi | null;
  tenantId: number | null;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [species, setSpecies] = React.useState<SpeciesUi | "">("");
  const [identifier, setIdentifier] = React.useState<string>("");
  const [weanedAt, setWeanedAt] = React.useState<string>("");
  const [placementStartAt, setPlacementStartAt] = React.useState<string>("");
  const [placementCompletedAt, setPlacementCompletedAt] = React.useState<string>("");

  const [countWeaned, setCountWeaned] = React.useState<string>("");
  const [countPlaced, setCountPlaced] = React.useState<string>("");

  const [submitting, setSubmitting] = React.useState(false);
  const [submitErr, setSubmitErr] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    if (!api) return;
    if (!identifier.trim()) {
      setSubmitErr("Please enter a group name.");
      return;
    }
    if (!species) {
      setSubmitErr("Please select a species.");
      return;
    }
    setSubmitting(true);
    setSubmitErr(null);
    try {
      const created = await api.offspring.create({
        species: toWireSpecies(species),
        identifier: identifier.trim(),
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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">New Offspring Group</div>
      <div className="text-sm text-secondary">Manually create an offspring group not linked to a breeding plan.</div>

      {/* Warning callout */}
      <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30">
        <p className="text-sm text-amber-200">
          <strong>Note:</strong> Offspring groups are typically created automatically when a breeding plan is committed.
          Use this form only for special cases, such as managing offspring inherited from outside your breeding program.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>
            Group Name <span className="text-[hsl(var(--brand-orange))]">*</span>
          </span>
          <input className={inputClass} value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="e.g., A Litter" autoComplete="off" data-1p-ignore data-lpignore="true" data-form-type="other" />
        </label>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>
            Species <span className="text-[hsl(var(--brand-orange))]">*</span>
          </span>
          <select
            className={inputClass}
            value={species}
            onChange={(e) => setSpecies(e.target.value as SpeciesUi | "")}
          >
            <option value="">Select species...</option>
            {SPECIES_UI_ALL.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>Weaned At (optional)</span>
          <DatePicker value={weanedAt} onChange={(e) => setWeanedAt(e.currentTarget.value)} inputClassName={inputClass} />
        </label>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>Placement Start (optional)</span>
          <DatePicker value={placementStartAt} onChange={(e) => setPlacementStartAt(e.currentTarget.value)} inputClassName={inputClass} />
        </label>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>Placement Completed (optional)</span>
          <DatePicker value={placementCompletedAt} onChange={(e) => setPlacementCompletedAt(e.currentTarget.value)} inputClassName={inputClass} />
        </label>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>Weaned Count (optional)</span>
          <input className={inputClass} type="number" value={countWeaned} onChange={(e) => setCountWeaned(e.target.value)} autoComplete="off" data-1p-ignore data-lpignore="true" data-form-type="other" />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Placed Count (optional)</span>
          <input className={inputClass} type="number" value={countPlaced} onChange={(e) => setCountPlaced(e.target.value)} autoComplete="off" data-1p-ignore data-lpignore="true" data-form-type="other" />
        </label>
      </div>

      {submitErr && <div className="text-sm text-red-600">{submitErr}</div>}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={submitting || !api || !species || !identifier.trim()}>
          {submitting ? "Creating..." : "Create group"}
        </Button>
      </div>
    </div>
  );
}
/* ───────────────────────── Buyers hook and tab ───────────────────────── */

type Candidate = {
  id: number;

  contactId?: number | null;
  orgId?: number | null;

  contactLabel?: string | null;
  orgLabel?: string | null;
  /** Primary display label for UI */
  label?: string | null;

  breedPrefText?: string | null;
  damPrefId?: number | null;
  sirePrefId?: number | null;

  depositPaidAt?: string | null;
  priority?: number | null;
  skipCount?: number | null;
  notes?: string | null;

  source: "waitlist";

  /** Higher score means better match for this group */
  matchScore?: number;
  /** What the match is based on, for text in the banner */
  matchTags?: string[];
};

function computeMatch(
  c: Candidate,
  group: OffspringRow & {
    plan?: {
      breedText?: string | null;
      dam?: { id: number; name: string } | null;
      sire?: { id: number; name: string } | null;
    };
  },
): { score: number; tags: string[] } {
  let score = 0;
  const tags: string[] = [];

  const groupBreed = group.plan?.breedText?.toLowerCase().trim() ?? "";
  const prefBreed = c.breedPrefText?.toLowerCase().trim() ?? "";

  // Breed is required to match
  if (groupBreed && prefBreed && (groupBreed.includes(prefBreed) || prefBreed.includes(groupBreed))) {
    score += 60;
    tags.push("Breed");
  }

  const damId = group.plan?.dam?.id ?? null;
  const sireId = group.plan?.sire?.id ?? null;

  if (damId && c.damPrefId && c.damPrefId === damId) {
    score += 30;
    tags.push("Dam");
  }

  if (sireId && c.sirePrefId && c.sirePrefId === sireId) {
    score += 30;
    tags.push("Sire");
  }

  return { score, tags };
}

function useGroupCandidates(
  api: OffspringApi | null,
  group: OffspringRow | null,
) {
  const [cands, setCands] = React.useState<Candidate[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      // No group or no plan - nothing to match against
      if (!api || !group || !group.plan) {
        if (!cancelled) {
          setCands([]);
          setLoading(false);
          setError(null);
        }
        return;
      }

      if (!api.waitlist || typeof api.waitlist.list !== "function") {
        console.warn("[Offspring] waitlist API missing on client", api);
        if (!cancelled) {
          setCands([]);
          setLoading(false);
          setError(null);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await api.waitlist.list({
          tenantId: group.tenantId ?? undefined,
          limit: 200,
        });

        const items: any[] = Array.isArray(res) ? res : res?.items ?? [];

        // Build sets of already linked buyers so we do not suggest them again
        const existingContactIds = new Set<number>();
        const existingOrgIds = new Set<number>();

        const buyersAny = (group as any).buyers;
        if (Array.isArray(buyersAny)) {
          for (const b of buyersAny) {
            if (!b || typeof b !== "object") continue;

            const contactId =
              (b as any).contactId ??
              (b as any).contact?.id ??
              null;

            const orgId =
              (b as any).organizationId ??
              (b as any).orgId ??
              (b as any).organization?.id ??
              null;

            if (typeof contactId === "number") {
              existingContactIds.add(contactId);
            }
            if (typeof orgId === "number") {
              existingOrgIds.add(orgId);
            }
          }
        }

        const mapped: Candidate[] = items.map((w: any) => {
          const contact =
            w.contact ||
            (w.contactId != null
              ? {
                id: w.contactId,
                display_name: w.contactName,
                first_name: w.firstName,
                last_name: w.lastName,
              }
              : null);

          const org =
            w.organization ||
            (w.organizationId != null
              ? { id: w.organizationId, name: w.organizationName }
              : null);

          const contactLabel =
            contact?.display_name ||
            `${(contact?.first_name ?? "").trim()} ${(contact?.last_name ?? "").trim()}`.trim() ||
            (contact ? `#${contact.id}` : null);

          const orgLabel = org?.name ?? (org ? `#${org.id}` : null);

          const breedPrefText =
            w.breedPrefText ??
            (Array.isArray(w.breedPrefs)
              ? w.breedPrefs.filter((s: string) => s && s.trim()).join(", ")
              : null);

          const notes = w.notes ?? w.internalNotes ?? null;

          const label =
            contactLabel ??
            orgLabel ??
            w.name ??
            w.displayName ??
            null;

          return {
            id: w.id,
            contactId: contact?.id ?? w.contactId ?? null,
            orgId: org?.id ?? w.organizationId ?? null,
            source: "waitlist",
            contactLabel: contactLabel ?? null,
            orgLabel: orgLabel ?? null,
            label,
            breedPrefText: breedPrefText ?? null,
            damPrefId: w.damPrefId ?? null,
            sirePrefId: w.sirePrefId ?? null,
            depositPaidAt: w.depositPaidAt ?? null,
            priority: w.priority ?? null,
            skipCount: w.skipCount ?? null,
            notes,
          } as Candidate;
        });

        const scored = mapped
          .map((c) => {
            const { score, tags } = computeMatch(c, group as any);
            return { ...c, matchScore: score, matchTags: tags };
          })
          // only keep actual matches
          .filter((c) => (c.matchScore ?? 0) > 0)
          // drop any waitlist entry that is already a linked buyer
          .filter((c) => {
            const contactId = c.contactId ?? null;
            const orgId = c.orgId ?? null;

            if (contactId != null && existingContactIds.has(contactId)) {
              return false;
            }
            if (orgId != null && existingOrgIds.has(orgId)) {
              return false;
            }
            return true;
          })
          .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));

        if (!cancelled) {
          setCands(scored);
        }
      } catch (e: any) {
        console.error("[Offspring] failed to load waitlist candidates", e);
        if (!cancelled) {
          setError(e?.message || "Failed to load waitlist candidates");
          setCands([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    api,
    group?.id,
    group?.tenantId,
    group?.plan?.breedText,
    (group as any)?.plan?.dam?.id,
    (group as any)?.plan?.sire?.id,
  ]);

  return { cands, loading, error, setCands };
}

function AddBuyerToGroupModal({
  api,
  group,
  open,
  onAdded,
  onClose,
}: {
  api: OffspringApi | null;
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
    {
      kind: "contact" | "org";
      id: number;
      label: string;
      subtitle?: string;
    }[]
  >([]);
  const [creating, setCreating] = React.useState(false);
  const [createErr, setCreateErr] = React.useState<string | null>(null);
  const [quickOpen, setQuickOpen] = React.useState<null | "contact" | "org">(null);

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

  // When user clicks a search result, lock it in as the selected buyer
  const handleSelectHit = React.useCallback(
    (hit: { kind: "contact" | "org"; id: number; label: string }) => {
      setLink(hit);
      // Leave q as is so we can show the selection nicely in the search input
    },
    [],
  );

  // When the modal opens or group changes, clear everything
  React.useEffect(() => {
    if (!open) return;

    setQ("");
    setLink(null);
    setHits([]);
    setBusy(false);
    setCreating(false);
    setCreateErr(null);
    setQuickOpen(null);
    setQc({ firstName: "", lastName: "", email: "", phone: "" });
    setQo({ name: "", website: "", email: "", phone: "" });
  }, [open, group]);

  // Search contacts and orgs by q, skipping anything already linked to this group
  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const term = q.trim();

    const existing = Array.isArray(group?.buyers) ? group!.buyers : [];

    const existingContactIds = new Set<number>(
      existing
        .filter((b: any) => b.contactId != null)
        .map((b: any) => Number(b.contactId)),
    );
    const existingOrgIds = new Set<number>(
      existing
        .filter((b: any) => b.organizationId != null)
        .map((b: any) => Number(b.organizationId)),
    );

    if (!api || !term) {
      setHits([]);
      setBusy(false);
      return;
    }

    setBusy(true);
    setCreateErr(null);

    const run = async () => {
      try {
        const res = await searchDirectory(api, term);
        if (cancelled) return;

        const nextHits: {
          kind: "contact" | "org";
          id: number;
          label: string;
          subtitle?: string;
        }[] = [];

        // searchDirectory returns DirectoryHit[] - split into contacts and orgs
        const contactsArr: any[] = res.filter((h) => h.kind === "contact");
        const orgsArr: any[] = res.filter((h) => h.kind === "org");

        // contacts, skip anything already linked
        for (const c of contactsArr) {
          const id = Number(c.id);
          if (existingContactIds.has(id)) continue;

          nextHits.push({
            kind: "contact",
            id,
            label:
              c.display_name ||
              [c.first_name, c.last_name].filter(Boolean).join(" ") ||
              "(Contact)",
            subtitle: c.email || c.phone || "",
          });
        }

        // organizations, skip anything already linked
        for (const o of orgsArr) {
          const id = Number(o.id);
          if (existingOrgIds.has(id)) continue;

          nextHits.push({
            kind: "org",
            id,
            label: o.name || "(Organization)",
            subtitle: o.website || o.email || o.phone || "",
          });
        }

        setHits(nextHits);
      } catch (e: any) {
        console.error("Failed directory search for AddBuyerToGroupModal", e);
        if (!cancelled) {
          setCreateErr(e?.message || "Search failed.");
          setHits([]);
        }
      } finally {
        if (!cancelled) {
          setBusy(false);
        }
      }
    };

    const t = window.setTimeout(run, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [q, api, group, open]);

  const clearLinkAndSearch = React.useCallback(() => {
    setLink(null);
    setQ("");
    setHits([]);
  }, []);

  const createBuyerLink = React.useCallback(async () => {
    if (!api || !group || !link) return null;

    const contactId = link.kind === "contact" ? link.id : null;
    const organizationId = link.kind === "org" ? link.id : null;

    // Check if this buyer is already linked to the group
    const existing: any[] =
      Array.isArray((group as any).buyers)
        ? (group as any).buyers
        : Array.isArray((group as any).BuyerLinks)
          ? (group as any).BuyerLinks
          : [];

    const alreadyLinked = existing.some((b: any) => {
      const bContactId = b.contactId ?? b.contact?.id ?? null;
      const bOrgId = b.organizationId ?? b.organization?.id ?? null;

      if (contactId && bContactId && contactId === bContactId) return true;
      if (organizationId && bOrgId && organizationId === bOrgId) return true;
      return false;
    });

    if (alreadyLinked) {
      throw new Error("That buyer is already linked to this group.");
    }

    const body = {
      contactId,
      organizationId,
      waitlistEntryId: null,
      actorId: null,
    };

    try {
      // Preferred, typed client: api.offspring.groups.buyers.add
      const offspringAny = api as any;
      const buyersClient = offspringAny.offspring?.groups?.buyers;

      if (buyersClient?.add) {
        const result = await buyersClient.add(group.id, body);
        return result ?? null;
      }

      // Fallback, raw HTTP with the correct URL
      const res = await api.raw.post(
        `/offspring/groups/${group.id}/buyers`,
        body
      );

      return (res as any)?.data ?? res ?? null;
    } catch (e) {
      console.error("Failed to create buyer link", e);
      throw e;
    }
  }, [api, group, link]);

  const handleSubmit = React.useCallback(async () => {
    if (!api || !group || !link) return;
    setCreating(true);
    setCreateErr(null);
    try {
      await createBuyerLink();
      onAdded();
      onClose();
    } catch (e: any) {
      setCreateErr(e?.message || "Failed to Add Buyer.");
    } finally {
      setCreating(false);
    }
  }, [api, group, link, onAdded, onClose, createBuyerLink]);

  const handleOutsideMouseDown = React.useCallback<
    React.MouseEventHandler<HTMLDivElement>
  >(
    (e) => {
      const panel = (e.currentTarget as HTMLDivElement).querySelector(
        "[data-buyer]",
      ) as HTMLDivElement | null;
      if (panel && !panel.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose],
  );

  const searchValue = link
    ? `${link.kind === "contact" ? "Contact" : "Organization"} · ${link.label}`
    : q;

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
      phoneE164:
        qc.phone && qc.phone.trim().length > 0
          ? qc.phone
          : undefined,
    });

    return await api.contacts.create(payload as any);
  }, [api, qc]);

  const quickCreateOrg = React.useCallback(async () => {
    if (!api) throw new Error("API not ready");

    const payload = stripEmpty({
      name: qo.name || undefined,
      website: qo.website || undefined,
      email: qo.email || undefined,
      phoneE164:
        qo.phone && qo.phone.trim().length > 0
          ? qo.phone
          : undefined,
    });

    return await api.organizations.create(payload as any);
  }, [api, qo]);

  const handleQuickAdd = React.useCallback(
    async (kind: "contact" | "org") => {
      if (!api) return;
      setCreating(true);
      setCreateErr(null);
      try {
        if (kind === "contact") {
          const c = await quickCreateContact();
          if (!c) throw new Error("Failed to create contact");
          setLink({
            kind: "contact",
            id: Number(c.id),
            label:
              c.display_name ||
              [c.first_name, c.last_name].filter(Boolean).join(" ") ||
              "(Contact)",
          });
        } else {
          const o = await quickCreateOrg();
          if (!o) throw new Error("Failed to create organization");
          setLink({
            kind: "org",
            id: Number(o.id),
            label: o.name || "(Organization)",
          });
        }

        // After quick add, close the quick-add block so the user is clearly in "link existing buyer" mode
        setQuickOpen(null);
        // Keep the raw query string as is, hits list will stay visible until Add buyer
      } catch (e: any) {
        console.error("Quick add failed", e);
        setCreateErr(e?.message || "Quick add failed.");
      } finally {
        setCreating(false);
      }
    },
    [api, quickCreateContact, quickCreateOrg],
  );

  const modal = !open ? null : (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50"
      onMouseDown={handleOutsideMouseDown}
    >
      <div
        className="relative rounded-lg border border-hairline bg-surface shadow-xl overflow-hidden"
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
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-secondary">
                  {busy ? "Searching" : hits.length ? `${hits.length} candidate(s)` : ""}
                </div>
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
                                  `${contacts.length} result${contacts.length === 1 ? "" : "s"}`,
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
                                  <div className="flex items-center justify-between gap-2">
                                    <div>
                                      <div className="font-medium">{c.label}</div>
                                      {c.subtitle && (
                                        <div className="text-xs text-secondary">{c.subtitle}</div>
                                      )}
                                    </div>
                                    <span className="text-[10px] rounded bg-white/10 px-1.5 py-0.5">
                                      Contact
                                    </span>
                                  </div>
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
                                  <div className="flex items-center justify-between gap-2">
                                    <div>
                                      <div className="font-medium">{o.label}</div>
                                      {o.subtitle && (
                                        <div className="text-xs text-secondary">{o.subtitle}</div>
                                      )}
                                    </div>
                                    <span className="text-[10px] rounded bg-white/10 px-1.5 py-0.5">
                                      Organization
                                    </span>
                                  </div>
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

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={creating}>
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
  );

  return ReactDOM.createPortal(modal, document.body);
}


function BuyersTab(
  {
    api,
    group,
    onGroupUpdate,
  }: {
    api: OffspringApi | null;
    group: OffspringRow;
    onGroupUpdate: (updated: OffspringRow) => void;
  },
) {
    const { cands, loading, error, setCands } = useGroupCandidates(api, group);
  const [lastAction, setLastAction] =
    React.useState<null | { kind: "add" | "skip"; payload: any }>(null);
  const [autoPromptedForGroupId, setAutoPromptedForGroupId] =
    React.useState<number | null>(null);

  // inline Add Buyer state
  const [q, setQ] = React.useState("");
  const [link, setLink] = React.useState<DirectoryHit | null>(null);
  const [hits, setHits] = React.useState<DirectoryHit[]>([]);
  const [searchBusy, setSearchBusy] = React.useState(false);
  const [createErr, setCreateErr] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [quickOpen, setQuickOpen] = React.useState<null | "contact" | "org">(null);
  const [addingFromSuggestion, setAddingFromSuggestion] = React.useState(false);

  // Offspring in this group, prefer Offspring from offspring table
  const animalsInGroup = React.useMemo(
    () => {
      const g: any = group as any;
      if (!g) return [];

      if (Array.isArray(g.Offspring) && g.Offspring.length > 0) {
        return g.Offspring as any[];
      }

      if (Array.isArray(g.Animals)) {
        return g.Animals as any[];
      }

      return [];
    },
    [group],
  );

  const [assigningOffspringId, setAssigningOffspringId] =
    React.useState<number | null>(null);

  // Find the currently assigned offspring for this buyer
  const findCurrentAssignmentForBuyer = React.useCallback(
    (b: any) => {
      return animalsInGroup.find((a: any) => {
        const contactMatch =
          b.contactId &&
          a.buyerContact &&
          a.buyerContact.id === b.contactId;

        const orgMatch =
          b.organizationId &&
          a.buyerOrg &&
          a.buyerOrg.id === b.organizationId;

        const waitlistMatch =
          b.waitlistEntryId &&
          a.waitlistEntry &&
          a.waitlistEntry.id === b.waitlistEntryId;

        return contactMatch || orgMatch || waitlistMatch;
      });
    },
    [animalsInGroup],
  );

  // Only show unassigned offspring plus the one currently assigned
  const getAssignableOffspringForBuyer = React.useCallback(
    (b: any) => {
      const current = findCurrentAssignmentForBuyer(b);

      return animalsInGroup.filter((a: any) => {
        const assigned =
          a.buyerContact || a.buyerOrg || a.waitlistEntry;

        if (current && a.id === current.id) {
          return true;
        }

        return !assigned;
      });
    },
    [animalsInGroup, findCurrentAssignmentForBuyer],
  );

  const handleAssignOffspring = React.useCallback(
    async (buyer: any, value: string) => {
      if (!group) return;

      const offspringId = value ? Number(value) : null;
      setAssigningOffspringId(offspringId);

      try {
        const nextAnimals = animalsInGroup.map((a: any) => {
          const belongsToBuyer =
            (buyer.contactId &&
              a.buyerContact &&
              a.buyerContact.id === buyer.contactId) ||
            (buyer.organizationId &&
              a.buyerOrg &&
              a.buyerOrg.id === buyer.organizationId) ||
            (buyer.waitlistEntryId &&
              a.waitlistEntry &&
              a.waitlistEntry.id === buyer.waitlistEntryId);

          if (belongsToBuyer && offspringId && a.id !== offspringId) {
            return {
              ...a,
              buyerContact: null,
              buyerOrg: null,
              waitlistEntry: null,
            };
          }

          if (offspringId && a.id === offspringId) {
            return {
              ...a,
              buyerContact: buyer.contactId
                ? { id: buyer.contactId }
                : null,
              buyerOrg: buyer.organizationId
                ? { id: buyer.organizationId }
                : null,
              waitlistEntry: buyer.waitlistEntryId
                ? { id: buyer.waitlistEntryId }
                : null,
            };
          }

          return a;
        });

        const nextGroup = {
          ...group,
          Animals: nextAnimals,
          Offspring: nextAnimals,
        };

        onGroupUpdate?.(nextGroup);
      } finally {
        setAssigningOffspringId(null);
      }
    },
    [animalsInGroup, group, onGroupUpdate],
  );

  const handleRemoveBuyer = React.useCallback(
    async (buyer: any) => {
      if (!api || !group) return;

      try {
        // Prefer the typed client if it exists
        const offspringAny = api as any;
        const buyersClient = offspringAny.offspring?.groups?.buyers;

        if (buyersClient?.remove) {
          // Typed client route: /offspring/:groupId/buyers/:buyerLinkId
          await buyersClient.remove(group.id, buyer.id);
        } else {
          // Fallback route, matches api.ts definition
          await api.raw.del(`/offspring/groups/${group.id}/buyers/${buyer.id}`, {
            body: JSON.stringify({}),
          });
        }

        // Update buyers list locally
        const nextBuyers = Array.isArray(group.buyers)
          ? (group.buyers as any[]).filter((b) => b.id !== buyer.id)
          : [];

        const nextGroup: OffspringRow = {
          ...group,
          buyers: nextBuyers as any,
        };

        onGroupUpdate?.(nextGroup);
      } catch (err) {
        console.error("[Offspring] failed to remove buyer", err);
      }
    },
    [api, group, onGroupUpdate],
  );


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

  // search contacts and orgs for inline Add Buyer
  React.useEffect(() => {
    let alive = true;

    const term = q.trim();

    // Build sets of already linked contact and org ids
    const existing = Array.isArray((group as any)?.buyers)
      ? (group as any).buyers
      : [];

    const linkedContactIds = new Set<number>(
      existing
        .filter((b: any) => b.contactId != null)
        .map((b: any) => Number(b.contactId))
    );

    const linkedOrgIds = new Set<number>(
      existing
        .filter((b: any) => b.organizationId != null)
        .map((b: any) => Number(b.organizationId))
    );

    if (!api || !term) {
      setHits([]);
      setSearchBusy(false);
      return;
    }

    setSearchBusy(true);
    setCreateErr(null);

    const run = async () => {
      try {
        const res = await searchDirectory(api, term);
        if (!alive) return;

        const filtered = res.filter((h) =>
          h.kind === "contact"
            ? !linkedContactIds.has(Number(h.id))
            : !linkedOrgIds.has(Number(h.id))
        );

        setHits(filtered);
      } catch (e: any) {
        if (!alive) return;
        console.error("Directory search failed", e);
        setCreateErr(e?.message || "Search failed.");
        setHits([]);
      } finally {
        if (!alive) return;
        setSearchBusy(false);
      }
    };

    const t = window.setTimeout(run, 250);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [api, q, group]);

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

  const handleAcceptSuggestion = React.useCallback(
    async (cand: Candidate) => {
      if (!api || !group) return;

      setAddingFromSuggestion(true);

      try {
        const body = {
          contactId: cand.contactId ?? null,
          organizationId: cand.orgId ?? null,
          waitlistEntryId: cand.id,
          actorId: null,
        };

        const offspringAny = api as any;
        const buyersClient = offspringAny.offspring?.groups?.buyers;

        let updatedGroup: any = null;

        if (buyersClient?.add) {
          updatedGroup = await buyersClient.add(group.id, body);
        } else {
          const res = await api.raw.post(
            `/offspring/groups/${group.id}/buyers`,
            body,
          );
          updatedGroup = (res as any)?.data ?? res ?? null;
        }

        if (updatedGroup && (updatedGroup as any).id) {
          onGroupUpdate(updatedGroup as OffspringRow);
        }

        // remove this candidate from the suggestion list
        setCands((prev) => prev.filter((c) => c.id !== cand.id));

        setLastAction({ kind: "add", payload: cand });
      } catch (err: any) {
        console.error("Failed to add buyer from waitlist", err);
      } finally {
        setAddingFromSuggestion(false);
      }
    },
    [api, group, onGroupUpdate, setCands],
  );

  // search contacts and orgs for inline Add Buyer
  React.useEffect(() => {
    let alive = true;

    const term = q.trim();

    // Build sets of already linked contact and org ids
    const existing = Array.isArray((group as any)?.buyers)
      ? (group as any).buyers
      : [];

    const linkedContactIds = new Set<number>(
      existing
        .filter((b: any) => b.contactId != null)
        .map((b: any) => Number(b.contactId))
    );

    const linkedOrgIds = new Set<number>(
      existing
        .filter((b: any) => b.organizationId != null)
        .map((b: any) => Number(b.organizationId))
    );

    if (!api || !term) {
      setHits([]);
      setSearchBusy(false);
      return;
    }

    setSearchBusy(true);
    setCreateErr(null);

    const run = async () => {
      try {
        const res = await searchDirectory(api, term);
        if (!alive) return;

        const filtered = res.filter((h) =>
          h.kind === "contact"
            ? !linkedContactIds.has(Number(h.id))
            : !linkedOrgIds.has(Number(h.id))
        );

        setHits(filtered);
      } catch (e: any) {
        if (!alive) return;
        console.error("Directory search failed", e);
        setCreateErr(e?.message || "Search failed.");
        setHits([]);
      } finally {
        if (!alive) return;
        setSearchBusy(false);
      }
    };

    const t = window.setTimeout(run, 250);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [api, q, group]);

  const searchValue = link
    ? `${link.kind === "contact" ? "Contact" : "Organization"} · ${link.label}`
    : q;

  const handleHitClick = (h: any) => {
    setQuickOpen(null);
    setCreateErr(null);
    setLink(h);
  };


  const handleQuickAdd = React.useCallback(async () => {
    if (!api || !quickOpen) return;

    setCreating(true);
    setCreateErr(null);

    try {
      if (quickOpen === "contact") {
        const pre = await exactContactLookup(api, {
          email: qc.email || undefined,
          phone: qc.phone || undefined,
          firstName: qc.firstName || undefined,
          lastName: qc.lastName || undefined,
        });
        let c: any;

        if (pre) {
          c = pre;
        } else {
          const payload = stripEmpty({
            display_name:
              `${(qc.firstName || "").trim()} ${(qc.lastName || "").trim()}`.trim() ||
              undefined,
            first_name: qc.firstName || undefined,
            last_name: qc.lastName || undefined,
            email: qc.email || undefined,
            phoneE164: qc.phone || undefined,
            phone_e164: qc.phone || undefined,
          });

          try {
            c = await api.contacts.create(payload);
          } catch (e: any) {
            // Allow 409 "already exists" case
            const status = (e as any)?.response?.status;
            if (status === 409) {
              const id = conflictExistingIdFromError(e);
              if (id) {
                const found = await api.contacts.get(id);
                if (found) c = found;
              }
            }
            if (!c) throw e;
          }
        }

        setLink({
          kind: "contact",
          id: Number(c.id),
          label:
            c.display_name ||
            `${(c.first_name ?? "").trim()} ${(c.last_name ?? "").trim()}`.trim() ||
            "(Contact)",
          sub: c.email || c.phoneE164 || c.phone || "",
        });
      } else if (quickOpen === "org") {
        const payload = stripEmpty({
          name: qo.name || undefined,
          website: qo.website || undefined,
          email: qo.email || undefined,
          phone: qo.phone || undefined,
        });

        let o: any;
        try {
          o = await api.organizations.create(payload);
        } catch (e: any) {
          const status = e?.status ?? e?.code ?? e?.response?.status;
          if (status === 409) {
            const id = conflictExistingIdFromError(e);
            if (id) {
              const found = await api.organizations.get(id);
              if (found) o = found;
            }
          }
          if (!o) throw e;
        }

        setLink({
          kind: "org",
          id: Number(o.id),
          label: o.name || "(Organization)",
          sub: o.website || o.email || o.phone || "",
        });
      }

      // close quick add and clear search
      setQuickOpen(null);
      setQ("");
      setHits([]);
    } catch (e: any) {
      console.error("Quick add failed", e);
      setCreateErr(e?.message || "Quick add failed.");
    } finally {
      setCreating(false);
    }
  }, [api, quickOpen, qc, qo]);

  const createBuyerLink = React.useCallback(async () => {
    if (!api || !group || !link) return null;

    const body = {
      contactId: link.kind === "contact" ? link.id : null,
      organizationId: link.kind === "org" ? link.id : null,
      waitlistEntryId: null,
      actorId: null,
    };

    try {
      // Preferred, typed client: api.offspring.groups.buyers.add
      const offspringAny = api as any;
      const buyersClient = offspringAny.offspring?.groups?.buyers;

      if (buyersClient?.add) {
        const result = await buyersClient.add(group.id, body);
        return result ?? null;
      }

      // Fallback, raw HTTP with the correct URL
      const res = await api.raw.post(
        `/offspring/groups/${group.id}/buyers`,
        body
      );

      return (res as any)?.data ?? res ?? null;
    } catch (e) {
      console.error("Failed to create buyer link", e);
      throw e;
    }
  }, [api, group, link]);


  const handleInlineSubmit = React.useCallback(
    async () => {
      if (!api || !group || !link) return;

      setCreating(true);
      setCreateErr(null);

      try {
        const updatedGroup = await createBuyerLink();

        if (updatedGroup && (updatedGroup as any).id) {
          onGroupUpdate(updatedGroup as OffspringRow);
        }

        // Reset local UI state
        setLink(null);
        setHits([]);
        setQ("");
      } catch (err: any) {
        console.error("Failed to add buyer inline", err);
        setCreateErr(err?.message || "Failed to add buyer.");
      } finally {
        setCreating(false);
      }
    },
    [api, group, link, onGroupUpdate, createBuyerLink],
  );

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

      {/* Waitlist matches */}
      {cands &&
        cands.length > 0 &&
        autoPromptedForGroupId === group.id && (
          <div className="mb-3 rounded-md bg-orange-500/5 px-3 py-2 text-xs bhq-waitlist-pulse">
            <div className="mb-2 text-sm font-semibold">
              Potential Waitlist Matches Found!
            </div>
            <div className="space-y-1">
              {cands.map((cand) => (
                <div
                  key={cand.id}
                  className="flex items-center justify-between gap-3 rounded px-2 py-1 hover:bg-orange-500/10"
                >
                  <div className="flex-1">
                    <div className="text-xs font-semibold">
                      {cand.label ||
                        cand.contactLabel ||
                        cand.orgLabel ||
                        `Waitlist entry #${cand.id}`}
                    </div>
                    <div className="text-[11px] text-secondary">
                      Matches:{" "}
                      {cand.matchTags && cand.matchTags.length
                        ? cand.matchTags.join(", ")
                        : "breed preferences"}
                      .
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="xs"
                      onClick={() => handleAcceptSuggestion(cand)}
                      disabled={addingFromSuggestion}
                    >
                      Add
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleSkip(cand)}
                    >
                      Skip
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Linked buyers table, directly under the Add buyer controls */}
      <div className="mt-2 rounded-md border border-hairline bg-surface/60 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold">Assigned Buyers</div>
        </div>

        {Array.isArray(group.buyers) && group.buyers.length > 0 ? (
          <table className="mt-2 w-full border-separate border-spacing-y-1 text-xs">
            <thead className="text-[11px] uppercase tracking-wide text-secondary">
              <tr>
                <th className="text-left font-medium">Buyer</th>
                <th className="text-left font-medium">Paired Offspring</th>
                <th className="text-right font-medium w-8">Actions</th>
              </tr>
            </thead>
            <tbody>
              {group.buyers.map((b) => {
                const current = findCurrentAssignmentForBuyer(b);
                const options = getAssignableOffspringForBuyer(b);

                return (
                  <tr key={b.id}>
                    <td className="py-1 pr-2 align-top">
                      <div className="flex flex-col">
                        <span>
                          {b.contactLabel ||
                            b.orgLabel ||
                            `Buyer #${b.id}`}
                        </span>
                        <span className="text-[11px] text-secondary">
                          {b.contactId
                            ? "Contact"
                            : b.organizationId
                              ? "Organization"
                              : b.waitlistEntryId
                                ? "From waitlist"
                                : "Unknown type"}
                        </span>
                      </div>
                    </td>
                    <td className="py-1 pr-2 align-top">
                      <select
                        className="h-8 w-full rounded border border-hairline bg-background px-2 text-xs"
                        value={current?.id ?? ""}
                        onChange={(e) =>
                          handleAssignOffspring(b, e.target.value)
                        }
                        disabled={
                          assigningOffspringId !== null ||
                          animalsInGroup.length === 0
                        }
                      >
                        <option value="">
                          {animalsInGroup.length === 0
                            ? "No offspring in this group"
                            : "No offspring assigned"}
                        </option>
                        {options.map((a: any) => (
                          <option key={a.id} value={a.id}>
                            {a.name || `Offspring #${a.id}`}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1 pl-2 pr-0 align-top text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveBuyer(b)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-red-500/10 hover:text-red-400"
                        aria-label="Remove buyer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="mt-2 text-xs text-secondary">
            No buyers linked yet.
          </p>
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
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-secondary">
              <span className="i-lucide-search h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <Input
              value={searchValue}
              className="pl-9 text-sm"
              onChange={(e) => {
                const val = e.target.value;
                // As soon as the user types, drop any existing selection
                setLink(null);
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
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[11px] text-muted-foreground">Last name</span>
                <input
                  className="h-7 rounded border border-hairline bg-background px-2 text-xs"
                  value={qc.lastName}
                  onChange={(e) => setQc({ ...qc, lastName: e.target.value })}
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
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
                  placeholder="Email"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[11px] text-muted-foreground">Phone</span>
                <input
                  className="h-7 rounded border border-hairline bg-background px-2 text-xs"
                  value={qc.phone}
                  onChange={(e) => setQc({ ...qc, phone: e.target.value })}
                  placeholder="Phone"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
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
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[11px] text-muted-foreground">Website</span>
                <input
                  className="h-7 rounded border border-hairline bg-background px-2 text-xs"
                  value={qo.website}
                  onChange={(e) => setQo({ ...qo, website: e.target.value })}
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
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
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[11px] text-muted-foreground">Phone</span>
                <input
                  className="h-7 rounded border border-hairline bg-background px-2 text-xs"
                  value={qo.phone}
                  onChange={(e) => setQo({ ...qo, phone: e.target.value })}
                  placeholder="Phone"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
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
            <div className="max-h-48 overflow-auto divide-y divide-hairline">
              {hits.map((h) => {
                const isSelected =
                  link && link.kind === h.kind && link.id === h.id;

                return (
                  <button
                    key={`${h.kind}-${h.id}`}
                    type="button"
                    className={[
                      "flex w-full items-center justify-between px-2 py-1 text-left",
                      "hover:bg-white/10",
                      isSelected
                        ? "bg-brand/20 border-l-2 border-brand font-semibold"
                        : "bg-transparent",
                    ].join(" ")}
                    onClick={() => handleHitClick(h)}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs">{h.label}</span>
                      {h.sub && (
                        <span className="text-[11px] text-secondary">
                          {h.sub}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-secondary">
                      {h.kind === "contact" ? "Contact" : "Organization"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
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
function OffspringGroupsTab(
  {
    api,
    tenantId,
    readOnlyGlobal,
  }: {
    api: OffspringApi | null;
    tenantId: number | null;
    readOnlyGlobal: boolean;
  },
) {
    const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<GroupTableRow[]>([]);
  const [raw, setRaw] = React.useState<OffspringRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [error, setError] = React.useState<string | null>(null);
  const [buyerModalOpen, setBuyerModalOpen] = React.useState(false);
  const [createOffspringGroup, setCreateOffspringGroup] = React.useState<OffspringRow | null>(null);
  const [buyerModalGroup, setBuyerModalGroup] = React.useState<OffspringRow | null>(null);
  const [addOffspringOpen, setAddOffspringOpen] = React.useState(false);
  const [addOffspringGroup, setAddOffspringGroup] =
    React.useState<OffspringRow | null>(null);

  const activeTabRef = React.useRef<string | null>(null);
  const setActiveTabRef = React.useRef<((tab: string) => void) | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);

  /* More actions menu state */
  const [menuOpen, setMenuOpen] = React.useState(false);

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

      const items = res.items.map((it) =>
        normalizeGroupRowFromDetail(it),
      );

      setRaw(items);
      const tableRows = items.map(mapDetailToTableRow);
      setRows(tableRows);

      // Fetch tags for each group
      Promise.all(
        tableRows.map(async (row: GroupTableRow) => {
          try {
            const tags = await api.tags.listForOffspringGroup(row.id);
            return { id: row.id, tags };
          } catch {
            return { id: row.id, tags: [] };
          }
        })
      ).then((tagResults) => {
        const tagMap = new Map(tagResults.map((r) => [r.id, r.tags]));
        setRows((prev) =>
          prev.map((row) => {
            const tags = tagMap.get(row.id);
            if (!tags || tags.length === 0) return row;
            return {
              ...row,
              tags: tags.map((t) => t.name),
              tagObjects: tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
            };
          })
        );
      });
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

  // View mode state (table or cards) - uses tenant preferences as default
  const { viewMode, setViewMode } = useViewMode({ module: "offspringGroups" });

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

  /* CSV export function for Groups tab */
  const handleExportCsv = React.useCallback(() => {
    exportToCsv({
      columns: GROUP_COLS,
      rows: sorted,
      filename: "offspring-groups",
      formatValue: (value, key) => {
        if (GROUP_DATE_COLS.has(key as any)) {
          if (!value) return "";
          const dt = new Date(value);
          if (!Number.isFinite(dt.getTime())) return String(value).slice(0, 10) || "";
          return dt.toISOString().slice(0, 10);
        }
        if (Array.isArray(value)) {
          return value.join(" | ");
        }
        return value;
      },
    });
    setMenuOpen(false);
  }, [sorted]);

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

        <DetailsHost key="groups"
          rows={raw}
          config={{
            idParam: "groupId",
            getRowId: (r: OffspringRow) => String(r.id),
            width: 960,
            placement: "center",
            align: "top",
            fetchRow: async (id: string | number) => {
              const numericId = Number(id);
              const fallback = raw.find((r) => r.id === numericId) as OffspringRow | undefined;

              if (!api) {
                return fallback as OffspringRow;
              }

              try {
                const detail: any = await api.offspring.get(numericId);

                // Keep all base fields from the detail payload
                const normalized: any = normalizeGroupRowFromDetail(detail) ?? {};

                // Make sure the drawer row actually carries the individuals
                if (Array.isArray(detail.Offspring)) {
                  normalized.Offspring = detail.Offspring;
                }

                // Optional, but keeps old Animal based litters working
                if (Array.isArray(detail.Animals)) {
                  normalized.Animals = detail.Animals;
                }

                if (fallback) {
                  return { ...fallback, ...normalized } as OffspringRow;
                }
                return normalized as OffspringRow;
              } catch (err) {
                console.error("[Offspring] failed to fetch group detail", err);
                return fallback as OffspringRow;
              }
            },
            onSave: async (rowId: string | number, draft: any) => {
              if (!api || readOnlyGlobal) return;

              // DetailsHost passes the row ID, not the row object
              const id = typeof rowId === 'string' ? parseInt(rowId, 10) : rowId;

              // Find the actual row from our raw data
              const row = raw.find((r) => r.id === id);

              if (!row || !id) {
                console.error('[Offspring onSave] Row not found!', { rowId, id, draft });
                return;
              }

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
                const updated = await api.offspring.update(row.id, body);
                const idx = raw.findIndex((r) => r.id === row.id);
                if (idx >= 0) {
                  const next = [...raw];
                  next[idx] = updated as any;
                  setRaw(next);
                  setRows(next.map(mapDetailToTableRow));

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
                console.error('[Offspring onSave] Save failed', e);
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
              { key: "finances", label: "Finances" },
              { key: "analytics", label: "Analytics" },
            ],
            customChrome: true,
            render: ({
              row,
              mode,
              setMode,
              setDraft,
              activeTab,
              setActiveTab,
              requestSave,
              hasPendingChanges,
              justSaved,
              close,
            }: any) => {
              const tblRow = mapDetailToTableRow(row);
              const effectiveTab = addOffspringOpen ? "linkedOffspring" : activeTab;
              const isEdit = mode === "edit" && !readOnlyGlobal;
              const groupId = (row as any)?.id as number | undefined;
              const openOffspringFromGroup = (offspringId: number) => {
                try {
                  const url = new URL("/offspring", window.location.origin);
                  url.searchParams.set("offspringId", String(offspringId));
                  window.open(url.toString(), "_blank", "noreferrer");
                } catch {
                  const url = new URL(window.location.href);
                  url.pathname = "/offspring";
                  url.searchParams.set("offspringId", String(offspringId));
                  window.location.href = url.toString();
                }
              };

              activeTabRef.current = activeTab;
              setActiveTabRef.current = setActiveTab;

              const fromRow: any[] =
                Array.isArray((row as any)?.Offspring) && (row as any).Offspring.length > 0
                  ? (row as any).Offspring
                  : Array.isArray((row as any)?.Animals)
                    ? (row as any).Animals
                    : [];

              const animals: any[] = fromRow;

              return (
                <DetailsScaffold
                  title={tblRow.groupName || tblRow.planCode || `Group #${tblRow.id}`}
                  subtitle={tblRow.breed || tblRow.species || ""}
                  mode={mode}
                  onEdit={() => setMode("edit")}
                  onCancel={() => { setMode("view"); setDraft({}); }}
                  onSave={requestSave}
                  hasPendingChanges={hasPendingChanges}
                  justSaved={justSaved}
                  onClose={close}
                  hideCloseButton
                  showFooterClose
                  tabs={[
                    { key: "overview", label: "Overview" },
                    { key: "buyers", label: "Buyers" },
                    { key: "linkedOffspring", label: "Offspring" },
                    { key: "media", label: "Media" },
                    { key: "documents", label: "Documents" },
                    { key: "finances", label: "Finances" },
                    { key: "analytics", label: "Analytics" },
                  ]}
                  activeTab={effectiveTab}
                  onTabChange={(next) => {
                    if (addOffspringOpen) return;
                    setActiveTab(next);
                  }} rightActions={
                    readOnlyGlobal ? (
                      <span className="text-xs text-secondary">View only</span>
                    ) : undefined
                  }
                >

                  {effectiveTab === "finances" && (
                    <FinanceTab
                      invoiceFilters={{ offspringGroupId: groupId }}
                      expenseFilters={{ offspringGroupId: groupId }}
                      api={api}
                      defaultAnchor={{ offspringGroupId: groupId, offspringGroupName: tblRow.groupName || tblRow.planCode || `Group #${groupId}` }}
                      offspringGroupContext={groupId ? {
                        offspringGroupId: String(groupId),
                        allowedParties: (row.buyers || []).map((b: BuyerLink) => ({
                          id: b.contactId ?? b.organizationId ?? b.id,
                          label: b.contactLabel || b.orgLabel || `Buyer #${b.id}`,
                        })),
                        onAddBuyer: () => setBuyerModalGroup(row),
                      } satisfies OffspringGroupContext : undefined}
                    />
                  )}

                  {effectiveTab === "analytics" && (
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

                  {effectiveTab === "overview" && (
                    <>
                      {/* Group Info Section */}
                      <SectionCard title="Group Info">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="min-w-0">
                            <div className="text-xs text-secondary mb-1">Offspring Group Name</div>
                            {isEdit ? (
                              <Input
                                type="text"
                                defaultValue={row.identifier ?? ""}
                                onBlur={(e) => {
                                  const v = e.currentTarget.value.trim();
                                  setDraft({ identifier: v || null });
                                }}
                                className="h-[42px] w-full bg-surface text-sm"
                                style={{ height: 42, minHeight: 42 }}
                                placeholder="Enter group name..."
                              />
                            ) : (
                              <div className="h-[42px] flex items-center text-sm text-primary">
                                {tblRow.groupName || "—"}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs text-secondary mb-1">Status</div>
                            <div className="h-[42px] flex items-center text-sm text-primary">
                              {tblRow.status || "—"}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs text-secondary mb-1">Linked Breeding Program</div>
                            <div className="h-[42px] flex items-center text-sm text-primary">
                              {tblRow.programName || "—"}
                            </div>
                          </div>
                        </div>

                        {/* Species + Breed row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                          <div className="min-w-0">
                            <div className="text-xs text-secondary mb-1">Species</div>
                            <div className="h-[42px] flex items-center text-sm text-primary">
                              {tblRow.species || "—"}
                            </div>
                          </div>
                          <div className="min-w-0 sm:col-span-2">
                            <div className="text-xs text-secondary mb-1">Breed</div>
                            <div className="h-[42px] flex items-center text-sm text-primary">
                              {tblRow.breed || "—"}
                            </div>
                          </div>
                        </div>

                        {/* Linked Breeding Plan row */}
                        <div className="grid grid-cols-1 gap-4 mt-4">
                          <div className="min-w-0">
                            <div className="text-xs text-secondary mb-1">Linked Breeding Plan</div>
                            <div className="h-[42px] flex items-center text-sm">
                              {tblRow.planName && tblRow.planId ? (
                                <a
                                  href={`/breeding?planId=${tblRow.planId}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary underline hover:text-primary/80"
                                >
                                  {tblRow.planName}
                                </a>
                              ) : (
                                <span className="text-primary">{tblRow.planName || "—"}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </SectionCard>

                      {/* Parents Section */}
                      <SectionCard title="Parents">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="min-w-0">
                            <div className="text-xs text-secondary mb-1">Dam</div>
                            <div className="h-[42px] flex items-center text-sm">
                              {tblRow.damName && tblRow.damId ? (
                                <a
                                  href={`/animals/${tblRow.damId}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary underline hover:text-primary/80"
                                >
                                  {tblRow.damName}
                                </a>
                              ) : (
                                <span className="text-primary">{tblRow.damName || "—"}</span>
                              )}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs text-secondary mb-1">Sire</div>
                            <div className="h-[42px] flex items-center text-sm">
                              {tblRow.sireName && tblRow.sireId ? (
                                <a
                                  href={`/animals/${tblRow.sireId}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary underline hover:text-primary/80"
                                >
                                  {tblRow.sireName}
                                </a>
                              ) : (
                                <span className="text-primary">{tblRow.sireName || "—"}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </SectionCard>

                      {/* Tags Section */}
                      <SectionCard
                        title="Tags"
                        right={<GroupTagsSection groupId={row.id} api={api} disabled={!isEdit} />}
                      />

                      {/* Counts Section - via DetailsSpecRenderer */}
                      <DetailsSpecRenderer<GroupTableRow>
                        row={tblRow}
                        mode={isEdit ? "edit" : "view"}
                        setDraft={(p: Partial<GroupTableRow>) => setDraft((d: any) => ({ ...d, ...p }))}
                        sections={groupSections(isEdit ? "edit" : "view")}
                      />
                    </>
                  )}

                  {effectiveTab === "buyers" && (
                    <BuyersTab
                      api={api}
                      group={row}
                      onGroupUpdate={(updated) => {
                        const normalized = normalizeGroupRowFromDetail(updated as any);
                        const idx = raw.findIndex((r) => r.id === normalized.id);

                        const next = [...raw];
                        if (idx >= 0) {
                          next[idx] = { ...next[idx], ...normalized } as any;
                        } else {
                          next.push(normalized as any);
                        }

                        setRaw(next);
                        setRows(next.map(mapDetailToTableRow));

                        // Keep Buyers tab active even when DetailsHost reruns
                        setActiveTab("buyers");
                        if (typeof window !== "undefined" && window.requestAnimationFrame) {
                          window.requestAnimationFrame(() => setActiveTab("buyers"));
                        }
                      }}
                    />
                  )}

                  {effectiveTab === "media" && (
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

                  {effectiveTab === "documents" && (
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

                  {effectiveTab === "linkedOffspring" && (
                    <SectionCard>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Offspring</h3>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveTab("linkedOffspring");
                              setAddOffspringGroup(row);
                              setAddOffspringOpen(true);
                            }}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Add Offspring
                          </Button>
                        </div>
                      </div>
                      {(() => {
                        const animals =
                          Array.isArray((row as any).Offspring) && (row as any).Offspring.length > 0
                            ? (row as any).Offspring
                            : Array.isArray(row.Animals)
                              ? row.Animals
                              : [];

                        if (animals.length === 0) {
                          return (
                            <p className="text-xs text-muted-foreground">
                              No individual offspring recorded yet.
                            </p>
                          );
                        }

                        return (
                          <div className="bhq-table overflow-x-auto">
                            <table className="min-w-max w-full text-xs">
                              <thead>
                                <tr>
                                  <th className="text-left text-xs font-medium text-muted-foreground px-2 py-1.5">
                                    Name
                                  </th>
                                  <th className="text-left text-xs font-medium text-muted-foreground px-2 py-1.5">
                                    Sex
                                  </th>
                                  <th className="text-left text-xs font-medium text-muted-foreground px-2 py-1.5">
                                    Collar
                                  </th>
                                  <th className="text-left text-xs font-medium text-muted-foreground px-2 py-1.5">
                                    Status
                                  </th>
                                  <th className="text-left text-xs font-medium text-muted-foreground px-2 py-1.5">
                                    Buyer
                                  </th>
                                  <th className="text-right text-xs font-medium text-muted-foreground px-2 py-1.5">
                                    Price
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {animals.map((a: any) => (
                                  <tr
                                    key={a.id}
                                    className="cursor-pointer hover:bg-muted/40"
                                    onClick={() => openOffspringFromGroup(a.id)}
                                  >
                                    <td className="px-2 py-1.5">
                                      {a.name || a.placeholderLabel || "Unnamed"}
                                    </td>

                                    <td className="px-2 py-1.5">{a.sex ?? "-"}</td>

                                    {/* Whelping collar color */}
                                    <td className="px-2 py-1.5">
                                      {a.whelpingCollarColor ? (
                                        <CollarSwatch
                                          color={a.whelpingCollarColor}
                                          showLabel
                                        />
                                      ) : "-"}
                                    </td>

                                    <td className="px-2 py-1.5">
                                      {a.status ? prettyStatus(a.status as any) : "-"}
                                    </td>

                                    <td className="px-2 py-1.5">
                                      {a.buyerContact
                                        ? a.buyerContact.name
                                        : a.buyerOrg
                                          ? a.buyerOrg.name
                                          : a.waitlistEntry
                                            ? "Waitlist"
                                            : "-"}
                                    </td>

                                    <td className="px-2 py-1.5">
                                      {typeof a.price === "number" ? moneyFmt(a.price) : "-"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </SectionCard>
                  )}
                </DetailsScaffold>
              );
            },
          }}
        >
          {/* Toolbar - always visible */}
          <div className="bhq-table__toolbar px-2 pt-2 pb-3 relative z-30 flex items-center gap-3">
            <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search groups..." widthPx={400} />

            {/* View mode toggle */}
            <div className="flex items-center rounded-lg border border-hairline overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                  viewMode === "cards"
                    ? "bg-[hsl(var(--brand-orange))] text-black"
                    : "bg-transparent text-secondary hover:text-primary hover:bg-[hsl(var(--muted)/0.5)]"
                }`}
                title="Card view"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                  viewMode === "list"
                    ? "bg-[hsl(var(--brand-orange))] text-black"
                    : "bg-transparent text-secondary hover:text-primary hover:bg-[hsl(var(--muted)/0.5)]"
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                  viewMode === "table"
                    ? "bg-[hsl(var(--brand-orange))] text-black"
                    : "bg-transparent text-secondary hover:text-primary hover:bg-[hsl(var(--muted)/0.5)]"
                }`}
                title="Table view"
              >
                <TableIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            {/* Column toggle - show in table and list modes */}
            {(viewMode === "table" || viewMode === "list") && (
              <ColumnsPopover columns={cols.map} onToggle={cols.toggle} onSet={cols.setAll} allColumns={GROUP_COLS} triggerClassName="bhq-columns-trigger" />
            )}

            <div className="ml-auto" />
          </div>

          {/* Conditional view rendering */}
          {viewMode === "cards" ? (
            <GroupCardView
              rows={pageRows}
              loading={loading}
              error={error}
              onRowClick={(row) => openDetails("groupId", row.id)}
            />
          ) : viewMode === "list" ? (
            <GroupListView
              rows={pageRows}
              loading={loading}
              error={error}
              onRowClick={(row) => openDetails("groupId", row.id)}
              visibleColumns={visibleSafe}
            />
          ) : (
          <Table
            columns={GROUP_COLS}
            columnState={cols.map}
            onColumnStateChange={cols.setAll}
            getRowId={(r: GroupTableRow) => r.id}
            pageSize={25}
            stickyRightWidthPx={0}
          >

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
          )}
        </DetailsHost>
      </div >

      <AddBuyerToGroupModal
        api={api}
        group={buyerModalGroup}
        open={!!buyerModalGroup}
        onClose={() => setBuyerModalGroup(null)}
        onAdded={async () => {
          setBuyerModalGroup(null);
          await load();
        }}
      />

      {addOffspringGroup && (
        <AddOffspringForm
          open={addOffspringOpen}
          onClose={() => {
            setAddOffspringOpen(false);
            setAddOffspringGroup(null);
            if (setActiveTabRef.current) {
              setActiveTabRef.current("linkedOffspring");
              if (typeof window !== "undefined" && window.requestAnimationFrame) {
                window.requestAnimationFrame(() => {
                  if (setActiveTabRef.current) {
                    setActiveTabRef.current("linkedOffspring");
                  }
                });
              }
            }
          }}
          onCreate={async (formData: AddOffspringFormData) => {
            if (!api) return;

            const effectiveTenantId = tenantId ?? readTenantIdFast();
            if (!effectiveTenantId) {
              console.error("[Offspring] Missing tenant id.");
              return;
            }

            const anyApi: any = api;
            const individuals = anyApi?.individuals;
            if (!individuals || typeof individuals.create !== "function") {
              console.error("[Offspring] Offspring individuals API is not available.");
              return;
            }

            const payload: any = {
              name: formData.name,
              sex: formData.sex === "UNKNOWN" ? null : formData.sex,
              status: "NEWBORN",
              groupId: formData.groupId,
              species: formData.species,
              breed: formData.breed,
              birthWeightOz: formData.birthWeightOz,
              price: formData.price,
              notes: formData.notes || null,
              whelpingCollarColor: formData.whelpingCollarColor,
            };

            try {
              await individuals.create(payload);

              setAddOffspringOpen(false);
              setAddOffspringGroup(null);
              if (setActiveTabRef.current) {
                setActiveTabRef.current("linkedOffspring");
              }
              await load();
              if (setActiveTabRef.current) {
                setActiveTabRef.current("linkedOffspring");
                if (typeof window !== "undefined" && window.requestAnimationFrame) {
                  window.requestAnimationFrame(() => {
                    if (setActiveTabRef.current) {
                      setActiveTabRef.current("linkedOffspring");
                    }
                  });
                }
              }
            } catch (e: any) {
              console.error("[Offspring] failed to create individual from group", e);
              window.alert(String(e?.message || e) || "Create failed");
            }
          }}
          groupContext={{
            id: addOffspringGroup.id,
            name: (addOffspringGroup as any).identifier || `Group #${addOffspringGroup.id}`,
            species: (addOffspringGroup as any).species ?? (addOffspringGroup as any).plan?.species ?? null,
            breed: (addOffspringGroup as any).breed ?? (addOffspringGroup as any).breedName ?? (addOffspringGroup as any).plan?.breedText ?? null,
          }}
        />
      )}

      {/* Create Group Modal */}
      <Overlay
        open={createOpen}
        onOpenChange={(next) => {
          if (!next) setCreateOpen(false);
        }}
        ariaLabel="Create Offspring Group"
        closeOnEscape
        closeOnOutsideClick
        size="lg"
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
      </Overlay>
    </Card >
  );
}

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

  const api = React.useMemo<OffspringApi | null>(
    () => makeOffspringApiClient(),
    [],
  );


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

  /* ───────── View routing (groups | offspring) ───────── */
  type ViewRoute = "groups" | "offspring";

  const getBasePath = React.useCallback(() => {
    if (typeof window === "undefined") return "";
    const p = window.location.pathname || "/";
    const clean = p.replace(/\/+$/, "");
    // Strip /individual sub-path to get base offspring path
    if (clean.endsWith("/individual")) return clean.slice(0, -"/individual".length) || "/";
    return clean || "/";
  }, []);

  const getViewFromLocation = (): ViewRoute => {
    if (typeof window === "undefined") return "groups";
    const p = window.location.pathname || "/";
    // Check for /individual sub-path for individual offspring view
    if (p.endsWith("/individual") || p.includes("/individual/")) return "offspring";
    return "groups";
  };

  const [currentView, setCurrentView] = React.useState<ViewRoute>(getViewFromLocation());

  React.useEffect(() => {
    const onPop = () => setCurrentView(getViewFromLocation());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const basePath = React.useMemo(() => getBasePath(), [getBasePath]);

  return (
    <div className="p-4 space-y-4">
      <div className="relative">
        <PageHeader
          title={currentView === "offspring" ? "Offspring - Individuals" : "Offspring - Groups"}
          subtitle={
            currentView === "offspring"
              ? "Manage individual offspring records"
              : "Manage groups and buyers"
          }
        />

        {/* Right-aligned Tab Navigation with emojis and orange underline */}
        <div className="absolute right-0 top-0 h-full flex items-center">
          <nav className="flex items-center gap-1">
            <SafeNavLink
              to={basePath === "/" ? "/" : `${basePath}/`}
              end
              className={({ isActive }) =>
                [
                  "relative h-10 px-4 text-base font-semibold leading-10 border-b-2 transition-all duration-300 ease-out flex items-center gap-2",
                  isActive
                    ? "text-primary border-[hsl(var(--brand-orange))]"
                    : "text-secondary hover:text-primary border-transparent hover:border-[hsl(var(--brand-orange))]/30",
                ].join(" ")
              }
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  {isActive && (
                    <span className="absolute inset-0 bg-[hsl(var(--brand-orange))]/15 blur-lg rounded-lg animate-pulse" />
                  )}
                  <span className="relative z-10">📦</span>
                  <span className="relative z-10">Groups</span>
                </>
              )}
            </SafeNavLink>

            <SafeNavLink
              to={`${basePath}/individual`}
              className={({ isActive }) =>
                [
                  "relative h-10 px-4 text-base font-semibold leading-10 border-b-2 transition-all duration-300 ease-out flex items-center gap-2",
                  isActive
                    ? "text-primary border-[hsl(var(--brand-orange))]"
                    : "text-secondary hover:text-primary border-transparent hover:border-[hsl(var(--brand-orange))]/30",
                ].join(" ")
              }
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  {isActive && (
                    <span className="absolute inset-0 bg-[hsl(var(--brand-orange))]/15 blur-lg rounded-lg animate-pulse" />
                  )}
                  <span className="relative z-10">🐾</span>
                  <span className="relative z-10">All Offspring</span>
                </>
              )}
            </SafeNavLink>
          </nav>
        </div>
      </div>

      {currentView === "groups" && (
        <OffspringGroupsTab
          api={api}
          tenantId={tenantId}
          readOnlyGlobal={readOnlyGlobal}
        />
      )}
      {currentView === "offspring" && <OffspringPage embed />}
    </div>
  );
}
