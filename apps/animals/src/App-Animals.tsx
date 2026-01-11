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
  useTableDetails,
  DetailsScaffold,
  SectionCard,
  Button,
  Input,
  DatePicker,
  buildRangeAwareSchema,
  inDateRange,
  OwnershipChips,
  OwnershipEditor,
  CustomBreedDialog,
  BreedCombo,
  utils,
  exportToCsv,
  Popover,
  Dialog,
  TagPicker,
  TagCreateModal,
  type TagOption,
  useViewMode,
  Tooltip,
  SortDropdown,
  type SortOption,
} from "@bhq/ui";
import { FinanceTab } from "@bhq/ui/components/Finance";
import type { OwnershipRow } from "@bhq/ui/utils/ownership";

import { Overlay, getOverlayRoot } from "@bhq/ui/overlay";
import { toast } from "@bhq/ui/atoms/Toast";
import "@bhq/ui/styles/table.css";
import "@bhq/ui/styles/datefield.css";
import { makeApi } from "./api";
import { MoreHorizontal, MoreVertical, Download, Trophy, LayoutGrid, Table as TableIcon, Archive, Trash2 } from "lucide-react";
import { AnimalCardView } from "./components/AnimalCardView";
import { LineageTab } from "./components/LineageTab";
import { TitlesTab } from "./components/TitlesTab";
import { CompetitionsTab } from "./components/CompetitionsTab";
import { PrivacyTab } from "./components/PrivacyTab";
import { OffspringTab } from "./components/OffspringTab";
import { GeneticsImportDialog } from "@bhq/ui/components/GeneticsImport";
import { GeneticsEmptyState } from "@bhq/ui/components/GeneticsEmptyState";
import { AddGeneticResultDialog } from "@bhq/ui/components/AddGeneticResultDialog";
import { VaccinationTracker, VaccinationAlertBadge } from "@bhq/ui/components/VaccinationTracker";
import type { VaccinationAlertState } from "@bhq/ui/components/VaccinationTracker";
import { GENETIC_MARKERS_SEED } from "@bhq/api/data/genetic-markers-seed";
import { getProtocolsForSpecies } from "@bhq/api/types/vaccinations";
import type { GeneticMarker, GeneticSpecies, CreateGeneticResultInput, VaccinationRecord, VaccinationProtocol, CreateVaccinationInput } from "@bhq/api";

import {
  normalizeCycleStartsAsc,
  asISODateOnly as asISODateOnlyEngine,
} from "@bhq/ui/utils/reproEngine/normalize";

import { projectUpcomingCycleStarts } from "@bhq/ui/utils/reproEngine/projectUpcomingCycles";

import {
  DogPlaceholder,
  CatPlaceholder,
  HorsePlaceholder,
  RabbitPlaceholder,
  GoatPlaceholder,
} from "@bhq/ui/assets/placeholders";



const SPECIES_PLACEHOLDERS: Record<string, string> = {
  DOG: DogPlaceholder,
  CAT: CatPlaceholder,
  HORSE: HorsePlaceholder,
  GOAT: GoatPlaceholder,
  RABBIT: RabbitPlaceholder,
};

function getPlaceholderForSpecies(species?: string | null): string {
  if (!species) return DogPlaceholder;
  const key = species.toUpperCase();
  return SPECIES_PLACEHOLDERS[key] || DogPlaceholder;
}

/** ────────────────────────────────────────────────────────────────────────
 * Visual Components - Status Badges & Indicators
 * ─────────────────────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { text: string; dot: string }> = {
    Active: { text: "text-green-400", dot: "bg-green-400" },
    Breeding: { text: "text-purple-400", dot: "bg-purple-400" },
    Unavailable: { text: "text-orange-400", dot: "bg-orange-400" },
    Retired: { text: "text-blue-400", dot: "bg-blue-400" },
    Deceased: { text: "text-gray-400", dot: "bg-gray-400" },
    Prospect: { text: "text-sky-400", dot: "bg-sky-400" },
  };

  const config = statusConfig[status] || statusConfig.Active;

  return (
    <span className={`inline-flex items-center gap-2 text-sm font-medium ${config.text}`}>
      <span className={`w-2.5 h-2.5 rounded-full ${config.dot} ${status === 'Breeding' ? 'animate-pulse' : ''}`}></span>
      <span>{status}</span>
    </span>
  );
}

function SexIndicator({ sex }: { sex: string }) {
  const isFemale = (sex || "").toLowerCase().startsWith("f");
  const isMale = (sex || "").toLowerCase().startsWith("m");

  if (isFemale) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm">
        <span className="text-pink-400">♀</span>
        <span>{sex}</span>
      </span>
    );
  }

  if (isMale) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm">
        <span className="text-blue-400">♂</span>
        <span>{sex}</span>
      </span>
    );
  }

  return <span>{sex || "—"}</span>;
}

function ReadinessBadge({ eligible, label }: { eligible: boolean | null; label: string }) {
  if (eligible === null) {
    return <span className="text-sm text-secondary">—</span>;
  }

  if (eligible) {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-green-400">
        <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-400">
      <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
      <span>{label}</span>
    </span>
  );
}

function SectionTitle({ icon, children }: { icon?: string; children: React.ReactNode }) {
  if (!icon) return <>{children}</>;

  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-secondary">{icon}</span>
      <span>{children}</span>
    </span>
  );
}

/** ────────────────────────────────────────────────────────────────────────
 * Types & utils
 * ─────────────────────────────────────────────────────────────────────── */
// NOTE: OwnershipRow is imported from @bhq/ui/utils/ownership at top of file

function normalizeOwnerPartyType(raw: any, owner?: any): "Organization" | "Contact" {
  const kind = owner?.kind ?? owner?.partyType ?? owner?.type ?? raw;
  const orgId =
    owner?.organizationId ??
    owner?.organization?.id ??
    owner?.party?.backing?.organizationId ??
    null;
  const contactId =
    owner?.contactId ??
    owner?.contact?.id ??
    owner?.party?.backing?.contactId ??
    null;
  if (orgId != null) return "Organization";
  if (contactId != null) return "Contact";
  const v = String(kind ?? "").toLowerCase();
  if (v.includes("org")) return "Organization";
  if (v.includes("contact") || v.includes("person")) return "Contact";
  return "Contact";
}

type AnimalRow = {
  id: number;
  name: string;
  nickname?: string | null;
  species?: string | null;
  breed?: string | null;
  sex?: string | null;
  status?: string | null;
  ownerName?: string | null;
  owners?: OwnershipRow[];
  microchip?: string | null;
  tags: string[];
  notes?: string | null;
  photoUrl?: string | null;
  dob?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  lastCycle?: string | null;
  cycleStartDates?: string[];
  femaleCycleLenOverrideDays?: number | null;
  titlePrefix?: string | null;
  titleSuffix?: string | null;
  archived?: boolean | null;
  // Achievement counts from API
  _count?: {
    titles?: number;
    competitionEntries?: number;
  };
};

type ProgramFlags = {
  holdUntil?: string | null;            // ISO date the animal is on hold until for program reasons
  embargoReason?: string | null;        // short text like health clearance pending
  allowExternalStud?: boolean | null;   // for males
  disqualifiers?: string[] | null;      // genetic or structural disqualifiers
  notes?: string | null;                // program notes that are not offspring related
};

type PreferredPartner = { id: number; name: string; sex?: string | null };

const COLUMNS: Array<{ key: keyof AnimalRow & string; label: string; default?: boolean; center?: boolean }> = [
  { key: "name", label: "Name", default: true },
  { key: "species", label: "Species", default: true, center: true },
  { key: "breed", label: "Breed", default: true, center: true },
  { key: "sex", label: "Sex", default: true, center: true },
  { key: "status", label: "Status", default: true, center: true },
  { key: "ownerName", label: "Owner", default: false },
  { key: "microchip", label: "Microchip #", default: false },
  { key: "tags", label: "Tags", default: true },
  { key: "dob", label: "DOB", default: false, center: true },
  { key: "created_at", label: "Created", default: false, center: true },
  { key: "updated_at", label: "Updated", default: false, center: true },
];

const SORT_OPTIONS: SortOption[] = [
  { key: "name", label: "Name" },
  { key: "species", label: "Species" },
  { key: "breed", label: "Breed" },
  { key: "sex", label: "Sex" },
  { key: "status", label: "Status" },
  { key: "dob", label: "Date of Birth" },
  { key: "created_at", label: "Date Created" },
  { key: "updated_at", label: "Last Updated" },
];

const SPECIES_LABEL: Record<string, string> = { DOG: "Dog", CAT: "Cat", HORSE: "Horse", GOAT: "Goat", SHEEP: "Sheep", RABBIT: "Rabbit" };
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

function speciesEmoji(species?: string | null): string {
  const s = (species || "").toLowerCase();
  if (s === "dog") return "🐶";
  if (s === "cat") return "🐱";
  if (s === "horse") return "🐴";
  return "🐾";
}

const STORAGE_KEY = "bhq_animals_cols_v1";
const VIEW_MODE_KEY = "bhq_animals_view_v1";
type ViewMode = "table" | "cards";
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
  const owners: OwnershipRow[] = Array.isArray(p.owners) ? p.owners : [];

  let ownerName: string | null =
    p.ownerName ??
    p.owner?.name ??
    null;

  if (!ownerName && owners.length) {
    const primary = owners.find((o) => o.is_primary) ?? owners[0];
    ownerName = primary?.display_name ?? null;
  }

  return {
    id: Number(p.id),
    name: p.name,
    nickname: p.nickname ?? null,
    species: asLabel(SPECIES_LABEL, p.species) ?? null,
    breed: p.breed ?? null,
    sex: asLabel(SEX_LABEL, p.sex) ?? null,
    status: asLabel(STATUS_LABEL, p.status) ?? "Active",
    ownerName,
    owners,
    microchip: p.microchip ?? null,
    tags: Array.isArray(p.tags) ? p.tags : [],
    notes: p.notes ?? null,
    photoUrl: p.photoUrl ?? p.photo_url ?? null,
    dob: p.dob ?? p.birthDate ?? null,
    created_at: p.created_at ?? p.createdAt ?? null,
    updated_at: p.updated_at ?? p.updatedAt ?? null,
    lastCycle: p.lastCycle ?? null,
    cycleStartDates: Array.isArray(p.cycleStartDates) ? p.cycleStartDates : [],
    femaleCycleLenOverrideDays: p.femaleCycleLenOverrideDays ?? null,
    archived: p.archived ?? (p.archivedAt != null),
    // Achievement data
    titlePrefix: p.titlePrefix ?? null,
    titleSuffix: p.titleSuffix ?? null,
    _count: p._count ?? undefined,
  };
}

async function safeGetCreatingOrg(api: any) {
  try {
    const org = await api?.lookups?.getCreatingOrganization?.();
    if (org && org.id != null) return org;
  } catch { }
  try {
    const id = localStorage.getItem("BHQ_ORG_ID");
    if (id) return { id, display_name: localStorage.getItem("BHQ_ORG_NAME") || "My Organization" };
  } catch { }
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

const PencilIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
  </svg>
);

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/* ────────────────────────────────────────────────────────────────────────────
 * Card View Wrapper (uses DetailsHost context)
 * ────────────────────────────────────────────────────────────────────────── */

function CardViewWithDetails({
  rows,
  loading,
  error,
  sortedRows,
  pageSize,
  page,
  pageCount,
  setPage,
  setPageSize,
  includeArchived,
  setIncludeArchived,
  totalRows,
  start,
  end,
  vaccinationAlerts,
}: {
  rows: AnimalRow[];
  loading: boolean;
  error: string | null;
  sortedRows: AnimalRow[];
  pageSize: number;
  page: number;
  pageCount: number;
  setPage: (p: number) => void;
  setPageSize: (n: number) => void;
  includeArchived: boolean;
  setIncludeArchived: (v: boolean) => void;
  totalRows: number;
  start: number;
  end: number;
  vaccinationAlerts?: Record<number, VaccinationAlertState>;
}) {
  const { open } = useTableDetails<AnimalRow>();

  return (
    <>
      <AnimalCardView
        rows={rows}
        loading={loading}
        error={error}
        onRowClick={(row) => open?.(row)}
        vaccinationAlerts={vaccinationAlerts}
      />
      <TableFooter
        entityLabel="animals"
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        pageSizeOptions={[12, 24, 48, 96]}
        onPageChange={setPage}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
        start={start}
        end={end}
        filteredTotal={sortedRows.length}
        total={totalRows}
        includeArchived={includeArchived}
        onIncludeArchivedChange={(checked) => {
          setIncludeArchived(checked);
          setPage(1);
        }}
      />
    </>
  );
}

/** Breeding Status Section - fetches active breeding plans for this animal */
function BreedingStatusSection({ animalId, sex, dob, api }: {
  animalId: number;
  sex?: string | null;
  dob?: string | null;
  api: any;
}) {
  const [plans, setPlans] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        setLoading(true);
        const isFemale = (sex || "").toLowerCase().startsWith("f");
        const isMale = (sex || "").toLowerCase().startsWith("m");

        // Fetch breeding plans for this animal
        const params = new URLSearchParams();
        if (isFemale) params.set("damId", String(animalId));
        else if (isMale) params.set("sireId", String(animalId));
        else {
          setPlans([]);
          setLoading(false);
          return;
        }

        params.set("archived", "exclude"); // Don't show archived plans

        const response = await fetch(`/api/v1/breeding/plans?${params.toString()}`, {
          headers: {
            "x-tenant-id": String((window as any).__BHQ_TENANT_ID__ || localStorage.getItem("BHQ_TENANT_ID") || ""),
          },
        });

        if (!dead && response.ok) {
          const data = await response.json();
          const items = data.items || data || [];

          // Filter to relevant active plans
          const relevantPlans = items.filter((p: any) => {
            // Skip completed plans
            if (p.completedDateActual) return false;

            // Include if in PLANNING phase
            const status = (p.status || "").toUpperCase();
            if (status === "PLANNING") return true;

            // Include if breeding has occurred (has breed date actual)
            if (p.breedDateActual) return true;

            return false;
          });

          // Sort by status priority: PLANNING first, then others
          relevantPlans.sort((a: any, b: any) => {
            const aStatus = (a.status || "").toUpperCase();
            const bStatus = (b.status || "").toUpperCase();
            const aIsPlanning = aStatus === "PLANNING";
            const bIsPlanning = bStatus === "PLANNING";

            if (aIsPlanning && !bIsPlanning) return -1;
            if (!aIsPlanning && bIsPlanning) return 1;

            // Then sort by most recent
            const aDate = a.breedDateActual || a.expectedBreedDate || a.createdAt;
            const bDate = b.breedDateActual || b.expectedBreedDate || b.createdAt;
            return bDate > aDate ? 1 : -1;
          });

          setPlans(relevantPlans);
        }
      } catch (err) {
        console.error("Failed to fetch breeding plans:", err);
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, [animalId, sex, api]);

  const months = ageInMonths(dob);
  const isFemale = (sex || "").toLowerCase().startsWith("f");
  const isMale = (sex || "").toLowerCase().startsWith("m");
  const minAge = isFemale ? 18 : isMale ? 12 : 18;
  const ageOk = months != null && months >= minAge;

  // Separate planning and active breeding plans
  const planningPlans = plans.filter(p => (p.status || "").toUpperCase() === "PLANNING");
  const breedingPlans = plans.filter(p => !!p.breedDateActual);

  return (
    <SectionCard title={<SectionTitle icon="📊">Breeding Status</SectionTitle>}>
      <div className="space-y-3">
        {/* Loading state */}
        {loading && <div className="text-sm text-secondary">Loading breeding plans...</div>}

        {/* Active Breeding - has breed date actual */}
        {!loading && breedingPlans.map(plan => (
          <div key={plan.id} className="rounded-lg bg-purple-500/10 border border-purple-500/30 p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse"></span>
                <span className="text-sm font-semibold text-purple-400">Currently Breeding</span>
              </div>
            </div>
            <div className="text-sm text-secondary/90 space-y-1">
              <div className="flex justify-between">
                <span>Plan:</span>
                <span className="font-medium">{plan.name || "Unnamed Plan"}</span>
              </div>
              {plan.breedDateActual && (
                <div className="flex justify-between">
                  <span>Bred on:</span>
                  <span className="font-medium">{fmt(plan.breedDateActual)}</span>
                </div>
              )}
              {plan.expectedBirthDate && (
                <div className="flex justify-between">
                  <span>Expected birth:</span>
                  <span className="font-medium">{fmt(plan.expectedBirthDate)}</span>
                </div>
              )}
            </div>
            <div className="mt-2 pt-2 border-t border-purple-500/20 text-xs text-secondary/70">
              View full details in the <span className="font-medium">Breeding Plans</span> module
            </div>
          </div>
        ))}

        {/* Planning phase - upcoming breeding */}
        {!loading && planningPlans.map(plan => (
          <div key={plan.id} className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                <span className="text-sm font-semibold text-blue-400">Breeding Planned</span>
              </div>
            </div>
            <div className="text-sm text-secondary/90 space-y-1">
              <div className="flex justify-between">
                <span>Plan:</span>
                <span className="font-medium">{plan.name || "Unnamed Plan"}</span>
              </div>
              {plan.expectedCycleStart && (
                <div className="flex justify-between">
                  <span>Expected cycle:</span>
                  <span className="font-medium">{fmt(plan.expectedCycleStart)}</span>
                </div>
              )}
              {plan.expectedBreedDate && (
                <div className="flex justify-between">
                  <span>Expected breed date:</span>
                  <span className="font-medium">{fmt(plan.expectedBreedDate)}</span>
                </div>
              )}
            </div>
            <div className="mt-2 pt-2 border-t border-blue-500/20 text-xs text-secondary/70">
              Plan in progress. View details in the <span className="font-medium">Breeding Plans</span> module
            </div>
          </div>
        ))}

        {/* Current Age */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-secondary">Current Age</div>
          <div className="text-lg font-semibold">
            {months != null ? `${months} months` : "—"}
          </div>
        </div>

        {/* Age Eligibility */}
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div className="text-sm text-secondary">Breeding Age ({minAge}+ months)</div>
          <div className="flex items-center gap-2">
            {ageOk ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                <span className="text-sm font-medium text-green-400">Eligible</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                <span className="text-sm font-medium text-orange-400">
                  {months != null ? `${minAge - months} months to go` : "Not Eligible"}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Additional Info - only show if no active plans */}
        {!loading && breedingPlans.length === 0 && planningPlans.length === 0 && (
          <div className="text-xs text-secondary/70">
            For program holds and other constraints, see the <span className="font-medium">Program</span> tab
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

type PhotoEditorResult = {
  blob: Blob;
  filename: string;
};

function PhotoEditorModal({
  open,
  title,
  src,
  onClose,
  onPickFile,
  onRemove,
  onSave,
  canRemove,
}: {
  open: boolean;
  title: string;
  src: string | null;
  onClose: () => void;
  onPickFile: () => void;
  onRemove: () => void;
  onSave: (r: PhotoEditorResult) => Promise<void> | void;
  canRemove: boolean;
}) {
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [imgEl, setImgEl] = React.useState<HTMLImageElement | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const dragRef = React.useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setErr(null);
    setImgEl(null);

    if (!src) return;

    let alive = true;
    loadImage(src)
      .then((img) => {
        if (!alive) return;
        setImgEl(img);
      })
      .catch(() => {
        if (!alive) return;
        setErr("Could not load image for editing. Upload the photo again and retry.");
      });

    return () => {
      alive = false;
    };
  }, [open, src]);

  const draw = React.useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const size = c.width;

    // background
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, size, size);

    if (!imgEl) {
      // placeholder grid
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      for (let i = 1; i < 3; i++) {
        const p = (size / 3) * i;
        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, p);
        ctx.lineTo(size, p);
        ctx.stroke();
      }
      return;
    }

    const iw = imgEl.naturalWidth || imgEl.width;
    const ih = imgEl.naturalHeight || imgEl.height;

    // cover into square
    const baseScale = Math.max(size / iw, size / ih);
    const s = baseScale * zoom;

    const dw = iw * s;
    const dh = ih * s;

    const cx = size / 2 + offset.x;
    const cy = size / 2 + offset.y;

    const dx = cx - dw / 2;
    const dy = cy - dh / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(imgEl, dx, dy, dw, dh);

    // grid overlay
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    for (let i = 1; i < 3; i++) {
      const p = (size / 3) * i;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(size, p);
      ctx.stroke();
    }
  }, [imgEl, zoom, offset]);

  React.useEffect(() => {
    if (!open) return;
    draw();
  }, [open, draw]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!open) return;
    setDragging(true);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !dragRef.current) return;
    e.preventDefault();
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setOffset({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy });
  };

  const onMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(false);
    dragRef.current = null;
  };

  React.useEffect(() => {
    if (!open) return;
    draw();
  }, [open, zoom, offset, draw]);

  const doSave = async () => {
    setErr(null);
    if (!canvasRef.current) return;
    if (!imgEl) {
      setErr("No image loaded. Upload a photo first.");
      return;
    }

    setSaving(true);
    try {
      const c = canvasRef.current;

      const blob: Blob = await new Promise((resolve, reject) => {
        c.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", 0.9);
      });

      await onSave({ blob, filename: "photo.jpg" });
      onClose();
    } catch (e: any) {
      setErr(e?.message || "Failed to save photo.");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !getOverlayRoot()) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-start justify-center bg-black/55 px-4 pt-16"
      style={{ zIndex: 2147483647 }}
      onMouseUp={onMouseUp}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-lg border border-hairline bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-hairline flex items-center justify-between">
          <div className="text-sm font-semibold">{title}</div>
          <button className="text-secondary hover:text-primary" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center justify-center">
            <div className="rounded-md border border-hairline overflow-hidden">
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="block w-[240px] h-[240px] bg-black cursor-grab active:cursor-grabbing"
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs text-secondary">
              Drag to reposition. Use Zoom to size.
            </div>

            <div>
              <div className="text-xs text-secondary mb-1">Zoom</div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number((e.currentTarget as HTMLInputElement).value))}
                className="w-full"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onPickFile} disabled={saving}>
                Upload new
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setZoom(1);
                  setOffset({ x: 0, y: 0 });
                }}
                disabled={saving}
              >
                Reset
              </Button>

              {canRemove && (
                <Button variant="outline" size="sm" onClick={onRemove} disabled={saving}>
                  Remove
                </Button>
              )}
            </div>

            {err && <div className="text-sm text-red-600">{err}</div>}

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button size="sm" onClick={doSave} disabled={saving}>
                {saving ? "Saving…" : "Save photo"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    getOverlayRoot()!
  );
}


type Hit = {
  id: number;
  partyId?: number | null;
  organizationId?: number | null;
  contactId?: number | null;
  name: string;
  kind: "Organization" | "Contact";
};

function OwnershipDetailsEditor({
  row,
  setDraft,
  ownershipLookups,
  mode = "edit",
}: {
  row: AnimalRow;
  setDraft: (p: Partial<AnimalRow>) => void;
  ownershipLookups: any;
  mode?: "view" | "edit";
}) {
  type Hit = {
    id: number;
    partyId?: number | null;
    organizationId?: number | null;
    contactId?: number | null;
    name: string;
    kind: "Organization" | "Contact";
  };

  const [owners, setOwners] = React.useState<OwnershipRow[]>(
    () => (((row as any).owners) ?? []) as OwnershipRow[]
  );
  const [q, setQ] = React.useState("");
  const [hits, setHits] = React.useState<Hit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    setOwners((((row as any).owners) ?? []) as OwnershipRow[]);
    setSelectedKey(null);
    setQ("");
    setHits([]);
  }, [row.id]);

  // Lookup helper
  function ownerKey(o: OwnershipRow, idx: number) {
    const id = o.partyId ?? o.organizationId ?? o.contactId ?? idx;
    return `${o.partyType}:${id}`;
  }

  function ownerDisplay(o: any): string {
    return (
      o.display_name ||
      o.displayName ||
      o.name ||
      o.party?.displayName ||
      o.party?.display_name ||
      o.party_name ||
      (o.contact && o.contact.display_name) ||
      ""
    );
  }

  function hasRealOwner(rows: OwnershipRow[]) {
    return rows.some((o) => {
      const partyId = o.partyId ?? (o as any).partyId ?? null;
      const orgId = o.organizationId ?? (o as any).organization?.id ?? null;
      const contactId = o.contactId ?? (o as any).contact?.id ?? null;
      return partyId != null || orgId != null || contactId != null;
    });
  }

  function normalize(nextRows: OwnershipRow[]) {
    let ensured = [...nextRows];

    if (ensured.length && !ensured.some((r) => r.is_primary || (r as any).primary)) {
      ensured = ensured.map((r, i) => ({ ...r, is_primary: i === 0 }));
    }

    const nums = ensured.map((r) =>
      typeof r.percent === "number" ? r.percent : 0
    );
    const total = nums.reduce((a, b) => a + b, 0);
    if (total > 100 && total > 0) {
      const factor = 100 / total;
      ensured = ensured.map((r) =>
        typeof r.percent === "number"
          ? {
            ...r,
            percent: Math.max(
              0,
              Math.min(100, Math.round(r.percent * factor))
            ),
          }
          : r
      );
    }

    setOwners(ensured);

    const primary: any =
      ensured.find((o) => o.is_primary || (o as any).primary) ?? ensured[0] ?? null;

    const primaryName = primary ? ownerDisplay(primary) || null : null;

    setDraft({
      owners: ensured,
      ownerName: primaryName,
    });
  }

  function addHit(hit: Hit) {
    const isFirstReal = !hasRealOwner(owners);
    const partyId = Number.isFinite(Number(hit.partyId ?? hit.id))
      ? Number(hit.partyId ?? hit.id)
      : null;
    const row: OwnershipRow =
      hit.kind === "Organization"
        ? {
          partyId,
          partyType: "Organization",
          organizationId: hit.organizationId ?? null,
          contactId: null,
          display_name: hit.name,
          is_primary: isFirstReal,
          percent: isFirstReal ? 100 : undefined,
        }
        : {
          partyId,
          partyType: "Contact",
          contactId: hit.contactId ?? null,
          organizationId: null,
          display_name: hit.name,
          is_primary: isFirstReal,
          percent: isFirstReal ? 100 : undefined,
        };

    const next = isFirstReal ? [row] : [...owners, row];
    normalize(next);
    setQ("");
    setHits([]);
    setSelectedKey(null);
  }

  function removeOwner(idx: number) {
    const next = owners.filter((_, i) => i !== idx);
    normalize(next);
    setSelectedKey(null);
  }

  function setPercent(idx: number, pct: number) {
    const clamped = Math.max(0, Math.min(100, Math.round(pct || 0)));
    const next = owners.map((r, i) =>
      i === idx ? { ...r, percent: clamped } : r
    );
    normalize(next);
  }

  function setPrimary(idx: number) {
    const next = owners.map((r, i) => ({ ...r, is_primary: i === idx }));
    normalize(next);
  }

  // Selection and move logic
  function findSelectedIndex(): number {
    if (!selectedKey) return -1;
    return owners.findIndex((o, i) => ownerKey(o, i) === selectedKey);
  }

  function moveSelectedLeft() {
    const idx = findSelectedIndex();
    if (idx < 0) return;
    if (owners[idx].is_primary || (owners[idx] as any).primary) return;
    setPrimary(idx);
  }

  function moveSelectedRight() {
    const idx = findSelectedIndex();
    if (idx < 0) return;
    if (!(owners[idx].is_primary || (owners[idx] as any).primary)) return;
    const others = owners
      .map((o, i) => ({ o, i }))
      .filter(({ i }) => i !== idx);
    if (!others.length) return;
    const newPrimaryIdx = others[0].i;

    const next = owners.map((r, i) => {
      if (i === idx) return { ...r, is_primary: false };
      if (i === newPrimaryIdx) return { ...r, is_primary: true };
      return r;
    });
    normalize(next);
  }

  const primaryIndex = owners.findIndex((o) => o.is_primary || (o as any).primary);
  const primaryOwner =
    primaryIndex >= 0 ? owners[primaryIndex] : owners[0] ?? null;
  const actualPrimaryIndex = primaryIndex >= 0 ? primaryIndex : (owners.length > 0 ? 0 : -1);
  const additionalOwners =
    primaryOwner == null
      ? owners
      : owners.filter((_, i) => i !== actualPrimaryIndex);

  // Search effect
  React.useEffect(() => {
    let alive = true;
    const needle = q.trim();
    if (!needle) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      ownershipLookups
        ?.searchOrganizations?.(needle)
        .catch(() => [] as any),
      ownershipLookups?.searchContacts?.(needle).catch(() => [] as any),
    ])
      .then(([orgs, contacts]) => {
        if (!alive) return;
        const rows: Hit[] = [
          ...(orgs || []).map((o: any) => {
            const partyIdRaw = o.partyId ?? o.party_id ?? o.id;
            const partyId = Number.isFinite(Number(partyIdRaw))
              ? Number(partyIdRaw)
              : null;
            const backing = o.backing ?? o.party?.backing ?? null;
            const name = String(o.name ?? o.display_name ?? o.displayName ?? "");
            return {
              id: partyId ?? Number(o.id),
              partyId,
              organizationId:
                backing?.organizationId ?? o.organizationId ?? null,
              name,
              kind: "Organization" as const,
            };
          }),
          ...(contacts || []).map((c: any) => {
            const partyIdRaw = c.partyId ?? c.party_id ?? c.id;
            const partyId = Number.isFinite(Number(partyIdRaw))
              ? Number(partyIdRaw)
              : null;
            const backing = c.backing ?? c.party?.backing ?? null;
            const name = String(c.name ?? c.display_name ?? c.displayName ?? "");
            return {
              id: partyId ?? Number(c.id),
              partyId,
              contactId: backing?.contactId ?? c.contactId ?? null,
              name,
              kind: "Contact" as const,
            };
          }),
        ];
        setHits(rows);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [q, ownershipLookups]);

  const selectedIdx = findSelectedIndex();
  const canMoveLeft =
    selectedIdx >= 0 &&
    !(owners[selectedIdx]?.is_primary || (owners[selectedIdx] as any)?.primary) &&
    owners.length > 0;
  const canMoveRight =
    selectedIdx >= 0 &&
    (owners[selectedIdx]?.is_primary || (owners[selectedIdx] as any)?.primary) &&
    owners.length > 1;

  return (
    <SectionCard title={<SectionTitle icon="👥">Ownership</SectionTitle>} highlight={mode === "edit"}>
      {/* Search row, custom so text is never under the icon */}
      <div className="mb-3">
        <div className="relative max-w-md">
          {/* Left icon */}
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-secondary">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="6" />
              <line x1="16" y1="16" x2="21" y2="21" />
            </svg>
          </span>

          {/* Text input */}
          <input
            type="text"
            value={q}
            onChange={(e) => setQ((e.currentTarget as HTMLInputElement).value)}
            placeholder="Search organizations or contacts"
            className="h-9 w-full rounded-md border border-hairline bg-surface pr-8 text-sm text-primary placeholder:text-secondary outline-none focus:border-[hsl(var(--brand-orange))] focus:ring-1 focus:ring-[hsl(var(--brand-orange))]"
            style={{ paddingLeft: "2.4rem" }} // inline so it wins over any global input styles
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
          />

          {/* Clear button */}
          {q.trim() !== "" && (
            <button
              type="button"
              className="absolute inset-y-0 right-2 flex items-center text-secondary hover:text-primary"
              onClick={() => setQ("")}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Search results dropdown */}
      {q.trim() && (
        <div className="mb-2 rounded-md border border-hairline max-h-40 overflow-auto">
          {loading && (
            <div className="px-3 py-2 text-xs text-secondary">Searching…</div>
          )}
          {!loading && hits.length === 0 && (
            <div className="px-3 py-2 text-xs text-secondary">No matches</div>
          )}
          {!loading &&
            hits.map((h, i) => (
              <button
                key={`${h.kind}:${h.id}:${i}`}
                className="w-full text-left px-3 py-2 text-sm hover:bg-surface-strong"
                onClick={() => addHit(h)}
              >
                <span className="text-primary">{h.name}</span>
                <span className="ml-2 text-[10px] px-1 rounded border border-hairline text-secondary">
                  {h.kind}
                </span>
              </button>
            ))}
        </div>
      )}

      <div className="flex gap-3 items-stretch">
        {/* Primary column */}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] leading-4 text-secondary mb-0.5">Primary Owner</div>
          {primaryOwner ? (
            <div
              className={[
                "flex items-center gap-2 rounded-md border border-hairline px-3 py-2 text-sm cursor-pointer",
                selectedKey ===
                  ownerKey(primaryOwner, primaryIndex >= 0 ? primaryIndex : 0)
                  ? "ring-1 ring-[hsl(var(--brand-orange))] border-[hsl(var(--brand-orange))]"
                  : "",
              ].join(" ")}
              onClick={() =>
                setSelectedKey(
                  ownerKey(primaryOwner, primaryIndex >= 0 ? primaryIndex : 0)
                )
              }
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {ownerDisplay(primaryOwner)}
                </div>
                <div className="mt-1 inline-flex items-center rounded border border-hairline px-2 text-[10px] text-secondary">
                  {primaryOwner.partyType === "Organization"
                    ? "Organization"
                    : "Contact"}
                </div>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                className="h-8 w-16 rounded-md border border-hairline bg-surface px-2 text-sm text-right"
                value={
                  typeof primaryOwner.percent === "number"
                    ? primaryOwner.percent
                    : 100
                }
                onChange={(e) =>
                  setPercent(
                    actualPrimaryIndex,
                    Number((e.currentTarget as HTMLInputElement).value)
                  )
                }
              />
              <button
                type="button"
                className="p-1 rounded hover:bg-surface-strong"
                onClick={(e) => {
                  e.stopPropagation();
                  if (primaryIndex >= 0) {
                    removeOwner(primaryIndex);
                  } else if (owners.length) {
                    removeOwner(0);
                  }
                }}
              >
                🗑
              </button>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-hairline px-3 py-2 text-sm text-secondary">
              No primary owner. Use the search to add one.
            </div>
          )}
        </div>

        {/* Middle arrows */}
        <div className="flex flex-col items-center justify-center gap-2 w-10 flex-none">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={!canMoveLeft}
            onClick={moveSelectedLeft}
          >
            {"\u2190"}
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={!canMoveRight}
            onClick={moveSelectedRight}
          >
            {"\u2192"}
          </Button>
        </div>

        {/* Additional owners */}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] leading-4 text-secondary mb-0.5">Additional Owners</div>

          {additionalOwners.length === 0 ? (
            <div className="rounded-md border border-dashed border-hairline px-3 py-2 text-sm text-secondary">
              No additional owners.
            </div>
          ) : (
            <div className="space-y-2">
              {additionalOwners.map((o) => {
                const originalIndex = owners.findIndex(
                  (r) =>
                    r === o ||
                    (r.partyType === o.partyType &&
                      (r.partyId ?? r.organizationId ?? r.contactId) ===
                        (o.partyId ?? o.organizationId ?? o.contactId))
                );
                const key = ownerKey(o, originalIndex);

                return (
                  <div
                    key={key}
                    className={[
                      "flex items-center gap-2 rounded-md border border-hairline px-3 py-2 text-sm cursor-pointer",
                      selectedKey === key
                        ? "ring-1 ring-[hsl(var(--brand-orange))] border-[hsl(var(--brand-orange))]"
                        : "",
                    ].join(" ")}
                    onClick={() => setSelectedKey(key)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {ownerDisplay(o)}
                      </div>
                      <div className="mt-1 inline-flex items-center rounded border border-hairline px-2 text-[10px] text-secondary">
                        {o.partyType === "Organization" ? "Organization" : "Contact"}
                      </div>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="h-8 w-16 rounded-md border border-hairline bg-surface px-2 text-sm text-right"
                      value={
                        typeof o.percent === "number" ? o.percent : 0
                      }
                      onChange={(e) =>
                        setPercent(
                          originalIndex,
                          Number((e.currentTarget as HTMLInputElement).value)
                        )
                      }
                    />
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-surface-strong"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeOwner(originalIndex);
                      }}
                    >
                      🗑
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}


/** ────────────────────────────────────────────────────────────────────────
 * Animal Tags Section - rich multi-select tag picker for animal detail view
 * ─────────────────────────────────────────────────────────────────────── */
function AnimalTagsSection({
  animalId,
  api,
  disabled = false,
}: {
  animalId: number | string;
  api: any;
  disabled?: boolean;
}) {
  const [availableTags, setAvailableTags] = React.useState<TagOption[]>([]);
  const [selectedTags, setSelectedTags] = React.useState<TagOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  // Load tags on mount
  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load available tags for ANIMAL module
        const availableRes = await api.tags.list({ module: "ANIMAL", limit: 200 });
        const available = ((availableRes?.items) || []).map((t: any) => ({
          id: Number(t.id),
          name: String(t.name),
          color: t.color ?? null,
        }));
        if (!cancelled) setAvailableTags(available);

        // Load currently assigned tags via unified api.tags
        const assignedRes = await api.tags.listForAnimal(Number(animalId));
        const assignedItems = Array.isArray(assignedRes) ? assignedRes : (assignedRes?.items || []);
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
  }, [api, animalId]);

  const handleSelect = React.useCallback(async (tag: TagOption) => {
    // Optimistic update
    setSelectedTags((prev) => [...prev, tag]);
    setError(null);

    try {
      await api.tags.assign(tag.id, { animalId: Number(animalId) });
    } catch (e: any) {
      // Rollback on error
      setSelectedTags((prev) => prev.filter((t) => t.id !== tag.id));
      setError(e?.message || "Failed to assign tag");
    }
  }, [api, animalId]);

  const handleRemove = React.useCallback(async (tag: TagOption) => {
    // Optimistic update
    setSelectedTags((prev) => prev.filter((t) => t.id !== tag.id));
    setError(null);

    try {
      await api.tags.unassign(tag.id, { animalId: Number(animalId) });
    } catch (e: any) {
      // Rollback on error
      setSelectedTags((prev) => [...prev, tag]);
      setError(e?.message || "Failed to remove tag");
    }
  }, [api, animalId]);

  const handleCreate = React.useCallback(async (name: string): Promise<TagOption> => {
    const created = await api.tags.create({ name, module: "ANIMAL" });
    const newTag: TagOption = {
      id: Number(created.id),
      name: String(created.name),
      color: created.color ?? null,
    };
    // Add to available tags list
    setAvailableTags((prev) => [...prev, newTag]);
    return newTag;
  }, [api]);

  // Handler for modal-based tag creation (with color picker) - auto-assigns tag after creation
  const handleModalCreate = React.useCallback(async (data: { name: string; module: string; color: string | null }) => {
    const created = await api.tags.create({ name: data.name, module: "ANIMAL", color: data.color });
    const newTag: TagOption = {
      id: Number(created.id),
      name: String(created.name),
      color: created.color ?? null,
    };
    setAvailableTags((prev) => [...prev, newTag]);

    // Auto-assign the newly created tag to this animal
    setSelectedTags((prev) => [...prev, newTag]);
    try {
      await api.tags.assign(newTag.id, { animalId: Number(animalId) });
    } catch (e: any) {
      // Rollback on error
      setSelectedTags((prev) => prev.filter((t) => t.id !== newTag.id));
      setError(e?.message || "Failed to assign tag");
    }
  }, [api, animalId]);

  return (
    <>
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
        onNewTagClick={() => setShowCreateModal(true)}
      />
      <TagCreateModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        mode="create"
        fixedModule="ANIMAL"
        onSubmit={handleModalCreate}
      />
    </>
  );
}


/** ────────────────────────────────────────────────────────────────────────
 * Cycle Tab (calendar edit, icon delete + confirm, persisted) — breeders only
 * ─────────────────────────────────────────────────────────────────────── */
function CycleTab({
  animal,
  api,
  onSaved,
  onOverrideSaved,
}: {
  animal: AnimalRow;
  api: any;
  onSaved: (dates: string[]) => void;
  onOverrideSaved?: (overrideValue: number | null) => void;
}) {
  // Sorted copy of current dates from the server
  const [dates, setDates] = React.useState<string[]>(() =>
    [...(animal.cycleStartDates || [])].sort()
  );
  const [editing, setEditing] = React.useState<Record<string, boolean>>({});
  const [working, setWorking] = React.useState(false);
  const [newDateIso, setNewDateIso] = React.useState<string>("");

  const [confirmDeleteIso, setConfirmDeleteIso] = React.useState<string | null>(null);
  const [overrideInput, setOverrideInput] = React.useState<string>(() =>
    animal.femaleCycleLenOverrideDays ? String(animal.femaleCycleLenOverrideDays) : ""
  );
  const [overrideSaving, setOverrideSaving] = React.useState(false);

  // Sync override input when animal data changes (e.g., after refetch)
  React.useEffect(() => {
    setOverrideInput(animal.femaleCycleLenOverrideDays ? String(animal.femaleCycleLenOverrideDays) : "");
  }, [animal.femaleCycleLenOverrideDays]);

  const species = (String(animal.species || "DOG").toUpperCase() || "DOG") as string;

  const persist = React.useCallback(
    async (next: string[]) => {
      const id = animal?.id;
      if (!id) return;

      const fn = api?.animals?.putCycleStartDates;
      if (typeof fn !== "function") {
        console.error("[Animals] api.animals.putCycleStartDates is not available");
        // Fallback, at least keep UI state in sync
        setDates(next);
        onSaved(next);
        return;
      }

      setWorking(true);
      try {
        await fn({ animalId: id, dates: next });
        setDates(next);
        onSaved(next);
      } catch (err) {
        console.error("[Animals] save cycle start dates failed", err);
        toast.error("Could not save cycle start dates. Please try again.");
      } finally {
        setWorking(false);
      }
    },
    [api, animal?.id, onSaved]
  );

  const saveOverride = React.useCallback(async () => {
    const id = animal?.id;
    if (!id) return;

    const parsedValue = overrideInput.trim() === "" ? null : Number(overrideInput);
    if (parsedValue !== null && (isNaN(parsedValue) || parsedValue <= 0)) {
      toast.error("Cycle length must be a positive number");
      return;
    }

    const updateFn = api?.animals?.update;
    if (typeof updateFn !== "function") {
      console.error("[Animals] api.animals.update is not available");
      toast.error("Cannot save override. API not available.");
      return;
    }

    setOverrideSaving(true);
    try {
      await updateFn(id, { femaleCycleLenOverrideDays: parsedValue });
      toast.success(parsedValue === null ? "Override cleared" : "Override saved");
      // Update local animal object
      (animal as any).femaleCycleLenOverrideDays = parsedValue;
      // Notify parent about the change
      if (onOverrideSaved) {
        onOverrideSaved(parsedValue);
      }
    } catch (err) {
      console.error("[Animals] save override failed", err);
      toast.error("Could not save override. Please try again.");
    } finally {
      setOverrideSaving(false);
    }
  }, [api, animal, overrideInput, onOverrideSaved]);

  const clearOverride = React.useCallback(async () => {
    setOverrideInput("");
    const id = animal?.id;
    if (!id) return;

    const updateFn = api?.animals?.update;
    if (typeof updateFn !== "function") {
      console.error("[Animals] api.animals.update is not available");
      return;
    }

    setOverrideSaving(true);
    try {
      await updateFn(id, { femaleCycleLenOverrideDays: null });
      toast.success("Override cleared");
      (animal as any).femaleCycleLenOverrideDays = null;
      // Notify parent about the change
      if (onOverrideSaved) {
        onOverrideSaved(null);
      }
    } catch (err) {
      console.error("[Animals] clear override failed", err);
      toast.error("Could not clear override. Please try again.");
    } finally {
      setOverrideSaving(false);
    }
  }, [api, animal, onOverrideSaved]);

  const handleConfirmRemove = async () => {
    if (!confirmDeleteIso) return;

    const iso = confirmDeleteIso;

    // Build the new dates array without this iso
    const next = dates.filter((x) => x !== iso);

    // Clear any edit state for this iso
    setEditing((prev) => {
      const copy = { ...prev };
      delete copy[iso];
      return copy;
    });

    // Persist to the server and update parent
    await persist(next);

    // Close the confirm UI
    setConfirmDeleteIso(null);
  };

  const cycleStartsAsc = React.useMemo(() => {
    const seeds = (dates || [])
      .map((d) => asISODateOnlyEngine(d) ?? null)
      .filter(Boolean) as string[];
    return normalizeCycleStartsAsc(seeds);
  }, [dates]);

  const lastHeatIso = cycleStartsAsc.length ? cycleStartsAsc[cycleStartsAsc.length - 1] : null;

  const todayIso = React.useMemo(() => new Date().toISOString().slice(0, 10), []);

  const pretty = React.useCallback((iso?: string | null) => {
    if (!iso) return "—";
    const s = String(iso);
    // Parse as local date, not UTC, to avoid timezone shift
    const [y, m, d] = s.slice(0, 10).split("-");
    if (!y || !m || !d) return "—";
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString();
  }, []);

  const dobIso = React.useMemo(
    () => asISODateOnlyEngine((animal as any)?.dob ?? (animal as any)?.birthDate ?? null),
    [animal]
  );

  const proj = React.useMemo(() => {
    return projectUpcomingCycleStarts(
      {
        animalId: String(animal?.id ?? ""),
        species: species as any,
        cycleStartsAsc,
        dob: dobIso ?? null,
        today: todayIso,
        femaleCycleLenOverrideDays: animal.femaleCycleLenOverrideDays,
      },
      { horizonMonths: 36, maxCount: 12 }
    );
  }, [animal?.id, species, cycleStartsAsc, dobIso, todayIso, animal.femaleCycleLenOverrideDays]);

  const learned = React.useMemo(
    () => ({
      days: Number((proj as any)?.effective?.effectiveCycleLenDays ?? 0),
      source: String((proj as any)?.effective?.source ?? "BIOLOGY"),
      warningConflict: Boolean((proj as any)?.effective?.warningConflict),
    }),
    [proj]
  );

  const projected: string[] = React.useMemo(
    () => ((proj as any)?.projected ?? []).map((p: any) => p.date).filter(Boolean),
    [proj]
  );

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
              {learned.days}{" "}
              <span className="text-secondary text-xs">
                ({learned.source})
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs text-secondary">
              Upcoming Projected Cycle Start
            </div>
            <div>
              {projected.length ? projected.map(pretty).join(" • ") : ""}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-hairline">
          <div className="text-sm font-medium mb-2">Cycle Length Override</div>
          {learned.warningConflict && (
            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              <strong>Warning:</strong> Override differs by more than 20% from historical average.
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              step="1"
              value={overrideInput}
              onChange={(e) => setOverrideInput(e.target.value)}
              placeholder={learned.source === "HISTORY" || learned.source === "BIOLOGY" ? `Default: ${learned.days} days` : "Enter days"}
              className="flex-1 max-w-xs px-3 py-2 text-sm border border-hairline rounded-md focus:outline-none focus:ring-2 focus:ring-brand-orange"
              disabled={overrideSaving}
            />
            <Button
              size="sm"
              variant="primary"
              onClick={saveOverride}
              disabled={overrideSaving || overrideInput === (animal.femaleCycleLenOverrideDays ? String(animal.femaleCycleLenOverrideDays) : "")}
            >
              {overrideSaving ? "Saving..." : "Save"}
            </Button>
            {animal.femaleCycleLenOverrideDays != null && (
              <Button
                size="sm"
                variant="outline"
                onClick={clearOverride}
                disabled={overrideSaving}
              >
                Clear
              </Button>
            )}
          </div>
          <div className="mt-2 text-xs text-secondary">
            Override the automatic cycle length calculation. Leave blank to use {learned.source === "HISTORY" ? "historical average" : "biology default"}.
          </div>
        </div>


      </SectionCard>

      <SectionCard title="Cycle Start Dates">
        <div className="rounded-md border border-hairline divide-y">
          {dates.length === 0 && (
            <div className="p-2 text-sm text-secondary">
              No dates yet. Add the first cycle start below.
            </div>
          )}

          {dates.map((d) => {
            const isEditing = editing[d];
            return (
              <div
                key={d}
                className="p-2 flex items-center justify-between gap-3 text-sm"
              >
                {!isEditing && (
                  <>
                    <div className="min-w-[10rem]">{pretty(d)}</div>
                    <div className="flex items-center gap-2 ml-auto">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() =>
                          setEditing((prev) => ({
                            ...prev,
                            [d]: true,
                          }))
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setConfirmDeleteIso(d);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </>
                )}

                {isEditing && (
                  <div className="flex items-center gap-2 w-full">
                    <DatePicker
                      value={d}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const v = e.currentTarget.value;
                        if (!v) return;
                        setDates((prev) => {
                          const next = prev.filter((x) => x !== d);
                          if (!next.includes(v)) next.push(v);
                          return next.sort();
                        });
                      }}
                      placeholder="mm/dd/yyyy"
                      showIcon
                    />
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() =>
                        setEditing((prev) => {
                          const next = { ...prev };
                          delete next[d];
                          return next;
                        })
                      }
                    >
                      Done
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setConfirmDeleteIso(d);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="w-64">
            <DatePicker
              value={newDateIso}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const v = e.currentTarget.value;
                setNewDateIso(v || "");
              }}
              placeholder="mm/dd/yyyy"
              showIcon
            />
          </div>
          <Button
            size="sm"
            onClick={() => {
              let next = [...dates];
              if (newDateIso) {
                if (!next.includes(newDateIso)) {
                  next.push(newDateIso);
                }
                next = next.sort();
              }
              persist(next);
              setNewDateIso("");
            }}
            disabled={working || (!dates.length && !newDateIso)}
          >
            {working ? "Saving…" : "Save Dates"}
          </Button>
        </div>
      </SectionCard>

      {confirmDeleteIso && getOverlayRoot() &&
        createPortal(
          <div
            className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/40"
            onClick={(e) => {
              // Click on the backdrop closes if not working
              e.stopPropagation();
              if (!working) setConfirmDeleteIso(null);
            }}
          >
            <div
              className="w-full max-w-sm rounded-md border border-hairline bg-surface p-4 shadow-lg"
              onClick={(e) => {
                // Keep clicks inside the dialog from bubbling to the backdrop
                e.stopPropagation();
              }}
            >
              <div className="mb-2 text-lg font-semibold">
                Remove cycle start date
              </div>

              <div className="mb-4 text-sm text-secondary">
                Remove {pretty(confirmDeleteIso)} from this female&apos;s cycle history?
                You can add it back later if needed.
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setConfirmDeleteIso(null);
                  }}
                  disabled={working}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await handleConfirmRemove();
                  }}
                  disabled={working}
                >
                  Remove date
                </Button>
              </div>
            </div>
          </div>,
          getOverlayRoot()!
        )}
    </div >
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
      } catch { }
      setLoading(false);
    })();
    return () => {
      dead = false;
    };
  }, [api, animal.id]);

  const save = async () => {
    try {
      await api?.animals?.putProgramFlags?.(animal.id, flags);
    } catch { }
    onSaved(flags);
  };

  const sex = (animal.sex || "").toLowerCase();
  const isMale = sex.startsWith("m");

  return (
    <div className="space-y-3">
      <SectionCard title="Program Flags">
        {loading ? (
          <div className="text-sm text-secondary">Loading…</div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-secondary mb-1">Hold Until</div>
                <DatePicker
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
 * Marketplace Listing Tab — Manage public animal listing for marketplace
 * ─────────────────────────────────────────────────────────────────────── */

type ListingStatus = "DRAFT" | "LIVE" | "PAUSED";
type ListingIntent = "STUD" | "BROOD_PLACEMENT" | "REHOME" | "GUARDIAN_PLACEMENT";
type PriceModel = "fixed" | "range" | "inquire";
type PublicLocationMode = "city_state" | "zip_only" | "full" | "hidden";

interface ListingLocationData {
  useBreederDefaults: boolean;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  publicLocationMode: PublicLocationMode;
  searchParticipation: {
    distanceSearch: boolean;
    citySearch: boolean;
    zipRadius: boolean;
  };
}

interface ListingFormData {
  intent: ListingIntent | null;
  headline: string;
  title: string;
  summary: string;
  description: string;
  priceModel: PriceModel | null;
  priceCents: number | null;
  priceMinCents: number | null;
  priceMaxCents: number | null;
  priceText: string;
  location: ListingLocationData;
  detailsJson: Record<string, any>;
  primaryPhotoUrl: string | null;
}

const INTENT_OPTIONS: { value: ListingIntent; label: string; description: string }[] = [
  { value: "STUD", label: "Stud Service", description: "Offer this male for breeding" },
  { value: "BROOD_PLACEMENT", label: "Brood Placement", description: "Place breeding female with another program" },
  { value: "REHOME", label: "Rehome", description: "Find a new home for this animal" },
  { value: "GUARDIAN_PLACEMENT", label: "Guardian Placement", description: "Place with a guardian home while retaining breeding rights" },
];

const PRICE_MODEL_OPTIONS: { value: PriceModel; label: string }[] = [
  { value: "fixed", label: "Fixed Price" },
  { value: "range", label: "Price Range" },
  { value: "inquire", label: "Contact for Pricing" },
];

function MarketplaceListingTab({
  animal,
  api,
}: {
  animal: AnimalRow;
  api: any;
}) {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [listing, setListing] = React.useState<any | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState<ListingFormData>({
    intent: null,
    headline: "",
    title: "",
    summary: "",
    description: "",
    priceModel: null,
    priceCents: null,
    priceMinCents: null,
    priceMaxCents: null,
    priceText: "",
    location: {
      useBreederDefaults: true,
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      publicLocationMode: "hidden",
      searchParticipation: {
        distanceSearch: false,
        citySearch: false,
        zipRadius: false,
      },
    },
    detailsJson: {},
    primaryPhotoUrl: null,
  });

  // Breeder's published location settings (fetched once, used when useBreederDefaults is true)
  const [breederLocation, setBreederLocation] = React.useState<ListingLocationData | null>(null);
  const [breederLocationLoading, setBreederLocationLoading] = React.useState(false);

  // Fetch breeder's published location settings
  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        setBreederLocationLoading(true);
        const res = await fetch("/api/v1/marketplace/profile", { credentials: "include" });
        if (!res.ok || dead) return;
        const data = await res.json();
        const profile = data?.published || data?.draft;
        if (profile?.address && !dead) {
          setBreederLocation({
            useBreederDefaults: true,
            street: profile.address.street || "",
            city: profile.address.city || "",
            state: profile.address.state || "",
            zip: profile.address.zip || "",
            country: profile.address.country || "",
            publicLocationMode: profile.publicLocationMode || "hidden",
            searchParticipation: profile.searchParticipation || {
              distanceSearch: false,
              citySearch: false,
              zipRadius: false,
            },
          });
        }
      } catch { /* ignore */ }
      finally { if (!dead) setBreederLocationLoading(false); }
    })();
    return () => { dead = true; };
  }, []);

  // The effective location to display (breeder defaults or custom)
  const effectiveLocation = form.location.useBreederDefaults && breederLocation
    ? breederLocation
    : form.location;

  // Load existing listing on mount
  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const existing = await api?.animalPublicListing?.get?.(animal.id);
        if (!dead && existing) {
          setListing(existing);
          setForm({
            intent: existing.intent || null,
            headline: existing.headline || "",
            title: existing.title || animal.name || "",
            summary: existing.summary || "",
            description: existing.description || "",
            priceModel: existing.priceModel || null,
            priceCents: existing.priceCents ?? null,
            priceMinCents: existing.priceMinCents ?? null,
            priceMaxCents: existing.priceMaxCents ?? null,
            priceText: existing.priceText || "",
            location: existing.location || {
              useBreederDefaults: existing.useBreederLocationDefaults ?? true,
              street: existing.locationStreet || "",
              city: existing.locationCity || "",
              state: existing.locationRegion || "",
              zip: existing.locationZip || "",
              country: existing.locationCountry || "",
              publicLocationMode: existing.publicLocationMode || "hidden",
              searchParticipation: existing.searchParticipation || {
                distanceSearch: false,
                citySearch: false,
                zipRadius: false,
              },
            },
            detailsJson: existing.detailsJson || {},
            primaryPhotoUrl: existing.primaryPhotoUrl || animal.photoUrl || null,
          });
        } else if (!dead) {
          // No listing exists, use defaults from animal
          setForm((f) => ({
            ...f,
            title: animal.name || "",
            primaryPhotoUrl: animal.photoUrl || null,
          }));
        }
      } catch (err: any) {
        if (!dead) setError(err?.message || "Failed to load listing");
      }
      if (!dead) setLoading(false);
    })();
    return () => { dead = true; };
  }, [api, animal.id, animal.name, animal.photoUrl]);

  const status: ListingStatus | null = listing?.status || null;

  // Validation for publish
  const canPublish = form.intent != null && form.headline.trim().length > 0;

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      // Use effective location (breeder defaults or custom)
      const loc = form.location.useBreederDefaults && breederLocation ? breederLocation : form.location;
      const payload = {
        intent: form.intent,
        headline: form.headline || null,
        title: form.title || null,
        summary: form.summary || null,
        description: form.description || null,
        priceModel: form.priceModel,
        priceCents: form.priceModel === "fixed" ? form.priceCents : null,
        priceMinCents: form.priceModel === "range" ? form.priceMinCents : null,
        priceMaxCents: form.priceModel === "range" ? form.priceMaxCents : null,
        priceText: form.priceModel === "inquire" ? form.priceText : null,
        // Location data
        useBreederLocationDefaults: form.location.useBreederDefaults,
        locationStreet: loc.street || null,
        locationCity: loc.city || null,
        locationRegion: loc.state || null,
        locationZip: loc.zip || null,
        locationCountry: loc.country || null,
        publicLocationMode: loc.publicLocationMode,
        searchParticipation: loc.searchParticipation,
        detailsJson: Object.keys(form.detailsJson).length > 0 ? form.detailsJson : null,
        primaryPhotoUrl: form.primaryPhotoUrl,
      };
      const updated = await api?.animalPublicListing?.upsert?.(animal.id, payload);
      setListing(updated);
    } catch (err: any) {
      setError(err?.message || "Failed to save listing");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!canPublish) return;
    try {
      setSaving(true);
      setError(null);
      // First save, then set status to LIVE
      await handleSave();
      const updated = await api?.animalPublicListing?.setStatus?.(animal.id, "LIVE");
      setListing(updated);
    } catch (err: any) {
      setError(err?.message || "Failed to publish listing");
    } finally {
      setSaving(false);
    }
  };

  const handlePause = async () => {
    try {
      setSaving(true);
      setError(null);
      const updated = await api?.animalPublicListing?.setStatus?.(animal.id, "PAUSED");
      setListing(updated);
    } catch (err: any) {
      setError(err?.message || "Failed to pause listing");
    } finally {
      setSaving(false);
    }
  };

  const handleUnpause = async () => {
    try {
      setSaving(true);
      setError(null);
      const updated = await api?.animalPublicListing?.setStatus?.(animal.id, "LIVE");
      setListing(updated);
    } catch (err: any) {
      setError(err?.message || "Failed to unpause listing");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this listing? This cannot be undone.")) return;
    try {
      setSaving(true);
      setError(null);
      await api?.animalPublicListing?.delete?.(animal.id);
      setListing(null);
      setForm({
        intent: null,
        headline: "",
        title: animal.name || "",
        summary: "",
        description: "",
        priceModel: null,
        priceCents: null,
        priceMinCents: null,
        priceMaxCents: null,
        priceText: "",
        location: {
          useBreederDefaults: true,
          street: "",
          city: "",
          state: "",
          zip: "",
          country: "",
          publicLocationMode: "hidden",
          searchParticipation: {
            distanceSearch: false,
            citySearch: false,
            zipRadius: false,
          },
        },
        detailsJson: {},
        primaryPhotoUrl: animal.photoUrl || null,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to delete listing");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <SectionCard title="Marketplace Listing">
          <div className="text-sm text-secondary">Loading…</div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Error banner */}
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
          <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
        </div>
      )}

      {/* Listing Intent */}
          <SectionCard title="Listing Intent">
            <p className="text-xs text-secondary mb-3">
              What are you listing this animal for? {status === "LIVE" || status === "PAUSED" ? "" : "(Required to publish)"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {INTENT_OPTIONS.map((opt) => {
                const isSelected = form.intent === opt.value;
                const animalSex = animal.sex?.toUpperCase();
                // Sex gating: STUD is for males only, BROOD_PLACEMENT is for females only
                const isDisabled =
                  (opt.value === "STUD" && animalSex === "FEMALE") ||
                  (opt.value === "BROOD_PLACEMENT" && animalSex === "MALE");
                return (
                  <div
                    key={opt.value}
                    onClick={() => !isDisabled && setForm((f) => ({ ...f, intent: opt.value }))}
                    style={{
                      padding: "16px",
                      borderRadius: "8px",
                      border: isSelected ? "2px solid #f97316" : "2px solid #404040",
                      backgroundColor: isSelected ? "rgba(249, 115, 22, 0.1)" : "rgba(38, 38, 38, 0.5)",
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      opacity: isDisabled ? 0.4 : 1,
                    }}
                    title={isDisabled ? `Not available for ${animalSex?.toLowerCase()} animals` : undefined}
                  >
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "4px" }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: "12px", color: "#a1a1aa", lineHeight: 1.4 }}>
                      {opt.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Public Card Content */}
          <SectionCard title="Public Card Content">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-secondary mb-1 block">Headline</label>
                <Input
                  placeholder="e.g., Champion Stud Available for Breeding"
                  value={form.headline}
                  onChange={(e) => {
                    const v = e.currentTarget.value;
                    setForm((f) => ({ ...f, headline: v }));
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-secondary mb-1 block">Title</label>
                  <Input
                    placeholder="Animal display name"
                    value={form.title}
                    onChange={(e) => {
                      const v = e.currentTarget.value;
                      setForm((f) => ({ ...f, title: v }));
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1 block">Primary Photo URL</label>
                  <Input
                    placeholder="Photo URL (uses animal photo if blank)"
                    value={form.primaryPhotoUrl || ""}
                    onChange={(e) => {
                      const v = e.currentTarget.value || null;
                      setForm((f) => ({ ...f, primaryPhotoUrl: v }));
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-secondary mb-1 block">Summary</label>
                <Input
                  placeholder="Short description for listing cards"
                  value={form.summary}
                  onChange={(e) => {
                    const v = e.currentTarget.value;
                    setForm((f) => ({ ...f, summary: v }));
                  }}
                />
              </div>

              <div>
                <label className="text-xs text-secondary mb-1 block">Description</label>
                <textarea
                  className="h-24 w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none"
                  placeholder="Full description for listing detail page"
                  value={form.description}
                  onChange={(e) => {
                    const v = e.currentTarget.value;
                    setForm((f) => ({ ...f, description: v }));
                  }}
                />
              </div>
            </div>
          </SectionCard>

          {/* Location and Service Area */}
          <SectionCard title="Location and Service Area">
            <div className="space-y-4">
              {/* Use Breeder Defaults Checkbox */}
              <label className="flex items-center gap-3 p-3 rounded-lg border border-hairline bg-surface-strong cursor-pointer hover:border-orange-500/50 transition-colors">
                <input
                  type="checkbox"
                  checked={form.location.useBreederDefaults}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setForm((f) => ({
                      ...f,
                      location: { ...f.location, useBreederDefaults: checked },
                    }));
                  }}
                  className="w-4 h-4 rounded border-hairline accent-orange-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-primary">Use Breeder Defaults</span>
                  <p className="text-xs text-secondary mt-0.5">
                    {breederLocationLoading
                      ? "Loading breeder settings..."
                      : breederLocation
                        ? "Mirror your published Marketplace Profile location settings"
                        : "No breeder profile found - configure in Settings → Marketing"}
                  </p>
                </div>
              </label>

              {/* Show breeder defaults preview when enabled, or editable fields when disabled */}
              {form.location.useBreederDefaults && breederLocation ? (
                <div className="rounded-lg border border-hairline bg-surface-strong/50 p-4 space-y-3">
                  <p className="text-xs text-secondary">
                    These settings mirror your Marketplace Profile. To change them, update your{" "}
                    <span className="text-orange-500">Settings → Marketing</span> page.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-secondary block mb-1">Location</span>
                      <span className="text-primary">
                        {[breederLocation.city, breederLocation.state, breederLocation.country].filter(Boolean).join(", ") || "Not set"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-secondary block mb-1">Public Display</span>
                      <span className="text-primary">
                        {breederLocation.publicLocationMode === "city_state" && "City + State"}
                        {breederLocation.publicLocationMode === "zip_only" && "ZIP Code only"}
                        {breederLocation.publicLocationMode === "full" && "City + State + ZIP"}
                        {breederLocation.publicLocationMode === "hidden" && "Hidden from public"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {breederLocation.searchParticipation.distanceSearch && (
                      <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Distance search</span>
                    )}
                    {breederLocation.searchParticipation.citySearch && (
                      <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">City/state search</span>
                    )}
                    {breederLocation.searchParticipation.zipRadius && (
                      <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">ZIP radius search</span>
                    )}
                    {!breederLocation.searchParticipation.distanceSearch && !breederLocation.searchParticipation.citySearch && !breederLocation.searchParticipation.zipRadius && (
                      <span className="text-secondary italic">No search participation enabled</span>
                    )}
                  </div>
                </div>
              ) : !form.location.useBreederDefaults ? (
                <>
                  <p className="text-xs text-secondary">
                    Your full address is kept private. Choose how much to display publicly.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-primary mb-1">Street Address (Private)</label>
                      <Input
                        placeholder="123 Main St"
                        value={form.location.street}
                        onChange={(e) => {
                          const v = e.currentTarget.value;
                          setForm((f) => ({
                            ...f,
                            location: { ...f.location, street: v },
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1">City</label>
                      <Input
                        placeholder="City"
                        value={form.location.city}
                        onChange={(e) => {
                          const v = e.currentTarget.value;
                          setForm((f) => ({
                            ...f,
                            location: { ...f.location, city: v },
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1">State/Province</label>
                      <Input
                        placeholder="State"
                        value={form.location.state}
                        onChange={(e) => {
                          const v = e.currentTarget.value;
                          setForm((f) => ({
                            ...f,
                            location: { ...f.location, state: v },
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1">ZIP/Postal Code</label>
                      <Input
                        placeholder="12345"
                        value={form.location.zip}
                        onChange={(e) => {
                          const v = e.currentTarget.value;
                          setForm((f) => ({
                            ...f,
                            location: { ...f.location, zip: v },
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1">Country</label>
                      <Input
                        placeholder="Country"
                        value={form.location.country}
                        onChange={(e) => {
                          const v = e.currentTarget.value;
                          setForm((f) => ({
                            ...f,
                            location: { ...f.location, country: v },
                          }));
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-2">Public Location Display</label>
                      <div className="space-y-2">
                        {([
                          { value: "city_state", label: "City + State" },
                          { value: "zip_only", label: "ZIP Code only" },
                          { value: "full", label: "City + State + ZIP" },
                          { value: "hidden", label: "Hidden from public" },
                        ] as const).map((opt) => (
                          <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="publicLocationMode"
                              value={opt.value}
                              checked={form.location.publicLocationMode === opt.value}
                              onChange={() => setForm((f) => ({
                                ...f,
                                location: { ...f.location, publicLocationMode: opt.value },
                              }))}
                              className="w-4 h-4 border-hairline accent-orange-500"
                            />
                            <span className="text-sm text-primary">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-primary mb-2">Search Participation</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.location.searchParticipation.distanceSearch}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setForm((f) => ({
                                ...f,
                                location: {
                                  ...f.location,
                                  searchParticipation: { ...f.location.searchParticipation, distanceSearch: checked },
                                },
                              }));
                            }}
                            className="w-4 h-4 rounded border-hairline accent-orange-500"
                          />
                          <span className="text-sm text-primary">Allow distance-based search</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.location.searchParticipation.citySearch}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setForm((f) => ({
                                ...f,
                                location: {
                                  ...f.location,
                                  searchParticipation: { ...f.location.searchParticipation, citySearch: checked },
                                },
                              }));
                            }}
                            className="w-4 h-4 rounded border-hairline accent-orange-500"
                          />
                          <span className="text-sm text-primary">Allow city/state search</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.location.searchParticipation.zipRadius}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setForm((f) => ({
                                ...f,
                                location: {
                                  ...f.location,
                                  searchParticipation: { ...f.location.searchParticipation, zipRadius: checked },
                                },
                              }));
                            }}
                            className="w-4 h-4 rounded border-hairline accent-orange-500"
                          />
                          <span className="text-sm text-primary">Allow ZIP radius search</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </SectionCard>

          {/* Pricing */}
          <SectionCard title={
            form.intent === "STUD" ? "Stud Fee" :
            form.intent === "REHOME" ? "Adoption Fee" :
            form.intent === "GUARDIAN_PLACEMENT" ? "Guardian Deposit" :
            form.intent === "BROOD_PLACEMENT" ? "Placement Fee" :
            "Pricing"
          }>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-secondary mb-1 block">Price Model</label>
                <div className="flex gap-2 flex-wrap">
                  {PRICE_MODEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, priceModel: opt.value }))}
                      className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                        form.priceModel === opt.value
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300"
                          : "border-hairline hover:border-neutral-400 dark:hover:border-neutral-600 text-primary"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.priceModel === "fixed" && (
                <div>
                  <label className="text-xs text-secondary mb-1 block">
                    {form.intent === "STUD" ? "Stud Fee" :
                     form.intent === "REHOME" ? "Adoption Fee" :
                     form.intent === "GUARDIAN_PLACEMENT" ? "Deposit Amount" :
                     form.intent === "BROOD_PLACEMENT" ? "Placement Fee" :
                     "Price"} ($)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.priceCents != null ? (form.priceCents / 100).toFixed(2) : ""}
                    onChange={(e) => {
                      const val = parseFloat(e.currentTarget.value);
                      setForm((f) => ({
                        ...f,
                        priceCents: isNaN(val) ? null : Math.round(val * 100),
                      }));
                    }}
                  />
                </div>
              )}

              {form.priceModel === "range" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Min ($)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={form.priceMinCents != null ? (form.priceMinCents / 100).toFixed(2) : ""}
                      onChange={(e) => {
                        const val = parseFloat(e.currentTarget.value);
                        setForm((f) => ({
                          ...f,
                          priceMinCents: isNaN(val) ? null : Math.round(val * 100),
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Max ($)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={form.priceMaxCents != null ? (form.priceMaxCents / 100).toFixed(2) : ""}
                      onChange={(e) => {
                        const val = parseFloat(e.currentTarget.value);
                        setForm((f) => ({
                          ...f,
                          priceMaxCents: isNaN(val) ? null : Math.round(val * 100),
                        }));
                      }}
                    />
                  </div>
                </div>
              )}

              {form.priceModel === "inquire" && (
                <div>
                  <label className="text-xs text-secondary mb-1 block">Price Text</label>
                  <Input
                    placeholder="e.g., Contact for pricing details"
                    value={form.priceText}
                    onChange={(e) => {
                      const v = e.currentTarget.value;
                      setForm((f) => ({ ...f, priceText: v }));
                    }}
                  />
                </div>
              )}
            </div>
          </SectionCard>

          {/* Intent-specific details */}
          {form.intent && (
            <SectionCard title={`${INTENT_OPTIONS.find((o) => o.value === form.intent)?.label || ""} Details`}>
              <div className="space-y-3">
                {form.intent === "STUD" && (
                  <>
                    <div>
                      <label className="text-xs text-secondary mb-1 block">Stud Fee Notes</label>
                      <textarea
                        className="h-20 w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none"
                        placeholder="Any special terms, repeat breeding discount, etc."
                        value={form.detailsJson.studFeeNotes || ""}
                        onChange={(e) => {
                          const v = e.currentTarget.value;
                          setForm((f) => ({
                            ...f,
                            detailsJson: { ...f.detailsJson, studFeeNotes: v },
                          }));
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-secondary mb-1 block">Available For</label>
                        <select
                          className="h-9 w-full rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                          value={form.detailsJson.studAvailability || ""}
                          onChange={(e) => {
                            const v = e.currentTarget.value || undefined;
                            setForm((f) => ({
                              ...f,
                              detailsJson: { ...f.detailsJson, studAvailability: v },
                            }));
                          }}
                        >
                          <option value="">Select…</option>
                          <option value="natural">Natural Breeding Only</option>
                          <option value="ai">AI Only</option>
                          <option value="both">Natural & AI</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-secondary mb-1 block">Shipping Available</label>
                        <select
                          className="h-9 w-full rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                          value={String(form.detailsJson.shippingAvailable ?? "")}
                          onChange={(e) => {
                            const v = e.currentTarget.value === "true" ? true : e.currentTarget.value === "false" ? false : undefined;
                            setForm((f) => ({
                              ...f,
                              detailsJson: {
                                ...f.detailsJson,
                                shippingAvailable: v,
                              },
                            }));
                          }}
                        >
                          <option value="">Select…</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {form.intent === "BROOD_PLACEMENT" && (
                  <>
                    <div>
                      <label className="text-xs text-secondary mb-1 block">Placement Terms</label>
                      <textarea
                        className="h-20 w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none"
                        placeholder="Co-ownership terms, breeding rights, return conditions, etc."
                        value={form.detailsJson.placementTerms || ""}
                        onChange={(e) => {
                          const v = e.currentTarget.value;
                          setForm((f) => ({
                            ...f,
                            detailsJson: { ...f.detailsJson, placementTerms: v },
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-secondary mb-1 block">Breeding Requirements</label>
                      <Input
                        placeholder="Minimum litters, health testing requirements, etc."
                        value={form.detailsJson.breedingRequirements || ""}
                        onChange={(e) => {
                          const v = e.currentTarget.value;
                          setForm((f) => ({
                            ...f,
                            detailsJson: { ...f.detailsJson, breedingRequirements: v },
                          }));
                        }}
                      />
                    </div>
                  </>
                )}

                {form.intent === "REHOME" && (
                  <>
                    <div>
                      <label className="text-xs text-secondary mb-1 block">Reason for Rehoming</label>
                      <textarea
                        className="h-20 w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none"
                        placeholder="Why is this animal being rehomed?"
                        value={form.detailsJson.rehomeReason || ""}
                        onChange={(e) => {
                          const v = e.currentTarget.value;
                          setForm((f) => ({
                            ...f,
                            detailsJson: { ...f.detailsJson, rehomeReason: v },
                          }));
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-secondary mb-1 block">Good With Kids</label>
                        <select
                          className="h-9 w-full rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                          value={String(form.detailsJson.goodWithKids ?? "")}
                          onChange={(e) => {
                            const v = e.currentTarget.value === "true" ? true : e.currentTarget.value === "false" ? false : undefined;
                            setForm((f) => ({
                              ...f,
                              detailsJson: {
                                ...f.detailsJson,
                                goodWithKids: v,
                              },
                            }));
                          }}
                        >
                          <option value="">Unknown</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-secondary mb-1 block">Good With Other Pets</label>
                        <select
                          className="h-9 w-full rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                          value={String(form.detailsJson.goodWithPets ?? "")}
                          onChange={(e) => {
                            const v = e.currentTarget.value === "true" ? true : e.currentTarget.value === "false" ? false : undefined;
                            setForm((f) => ({
                              ...f,
                              detailsJson: {
                                ...f.detailsJson,
                                goodWithPets: v,
                              },
                            }));
                          }}
                        >
                          <option value="">Unknown</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {form.intent === "GUARDIAN_PLACEMENT" && (
                  <>
                    <div>
                      <label className="text-xs text-secondary mb-1 block">Guardian Agreement Terms</label>
                      <textarea
                        className="h-20 w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none"
                        placeholder="Co-ownership terms, breeding expectations, return conditions"
                        value={form.detailsJson.guardianTerms || ""}
                        onChange={(e) => {
                          const v = e.currentTarget.value;
                          setForm((f) => ({
                            ...f,
                            detailsJson: { ...f.detailsJson, guardianTerms: v },
                          }));
                        }}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label className="text-xs text-secondary mb-1 block">Breeding Commitment</label>
                        <Input
                          placeholder="e.g., 2-3 litters"
                          value={form.detailsJson.breedingCommitment || ""}
                          onChange={(e) => {
                            const v = e.currentTarget.value;
                            setForm((f) => ({
                              ...f,
                              detailsJson: { ...f.detailsJson, breedingCommitment: v },
                            }));
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-secondary mb-1 block">Vet Care Provided</label>
                        <select
                          className="h-9 w-full rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                          value={String(form.detailsJson.vetCareProvided ?? "")}
                          onChange={(e) => {
                            const v = e.currentTarget.value === "true" ? true : e.currentTarget.value === "false" ? false : undefined;
                            setForm((f) => ({
                              ...f,
                              detailsJson: {
                                ...f.detailsJson,
                                vetCareProvided: v,
                              },
                            }));
                          }}
                        >
                          <option value="">Select…</option>
                          <option value="true">Yes, breeder covers</option>
                          <option value="false">No, guardian covers</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </SectionCard>
          )}

          {/* Actions */}
          <SectionCard title="Actions">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save Draft"}
              </Button>

              {status === "DRAFT" && (
                <Button
                  onClick={handlePublish}
                  disabled={saving || !canPublish}
                  title={!canPublish ? "Intent and headline are required to publish" : ""}
                >
                  {saving ? "Publishing…" : "Publish"}
                </Button>
              )}

              {status === "LIVE" && (
                <Button
                  variant="outline"
                  onClick={handlePause}
                  disabled={saving}
                >
                  {saving ? "Pausing…" : "Pause Listing"}
                </Button>
              )}

              {status === "PAUSED" && (
                <Button
                  onClick={handleUnpause}
                  disabled={saving}
                >
                  {saving ? "Resuming…" : "Resume Listing"}
                </Button>
              )}

              {listing && (
                <Button
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  Delete Listing
                </Button>
              )}
            </div>

            {!canPublish && !status && (
              <div className="mt-2 text-xs text-secondary">
                To publish, select a listing intent and provide a headline.
              </div>
            )}
          </SectionCard>
    </div>
  );
}

/** ────────────────────────────────────────────────────────────────────────
 * Label-Value component for display
 * ─────────────────────────────────────────────────────────────────────── */
function LV({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] leading-4 text-secondary mb-0.5">
        {label}
      </div>
      <div className="text-sm leading-5 text-primary break-words">
        {children || "—"}
      </div>
    </div>
  );
}

/** ────────────────────────────────────────────────────────────────────────
 * Genetics Tab — genetic data storage for breeding analysis
 * ─────────────────────────────────────────────────────────────────────── */
type GeneticLocus = {
  locus: string;
  locusName: string;
  allele1?: string;
  allele2?: string;
  genotype?: string;
  phenotype?: string;
  testDate?: string;
  testLab?: string;
  notes?: string;
  networkVisible?: boolean;
};

type BreedComposition = {
  breed: string;
  percentage: number;
};

type GeneticData = {
  coatColor?: GeneticLocus[];
  health?: GeneticLocus[];
  coatType?: GeneticLocus[];
  physicalTraits?: GeneticLocus[];
  eyeColor?: GeneticLocus[];
  otherTraits?: GeneticLocus[];
  testResults?: {
    testName?: string;
    testDate?: string;
    testLab?: string;
    testId?: string;
  };
  breedComposition?: BreedComposition[];
};

/** Locus card with visibility toggle for genetics sharing */
function LocusCard({
  locusInfo,
  locusData,
  mode,
  enableNetworkSharing,
  onAllele1Change,
  onAllele2Change,
  onVisibilityChange,
}: {
  locusInfo: { locus: string; locusName: string; description: string; breedSpecific?: string };
  locusData?: GeneticLocus;
  mode: "view" | "edit";
  enableNetworkSharing: boolean;
  onAllele1Change: (value: string) => void;
  onAllele2Change: (value: string) => void;
  onVisibilityChange: (visible: boolean) => void;
}) {
  return (
    <div className="border border-hairline rounded-lg p-3 bg-surface">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{locusInfo.locus} - {locusInfo.locusName}</div>
          {locusInfo.breedSpecific && (
            <span className="text-xs text-secondary">({locusInfo.breedSpecific})</span>
          )}
        </div>
        <VisibilityToggle
          isPublic={locusData?.networkVisible || false}
          onChange={onVisibilityChange}
          disabled={mode !== "edit"}
          readOnly={mode !== "edit"}
          inactive={!enableNetworkSharing}
        />
      </div>
      <div className="text-xs text-secondary mb-2">{locusInfo.description}</div>

      {mode === "view" ? (
        <div className="text-sm">
          Genotype: <span className="font-mono">{locusData?.genotype || "Not tested"}</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Input
            size="sm"
            placeholder="Allele 1"
            defaultValue={locusData?.allele1 || ""}
            onChange={(e) => onAllele1Change(e.target.value)}
          />
          <Input
            size="sm"
            placeholder="Allele 2"
            defaultValue={locusData?.allele2 || ""}
            onChange={(e) => onAllele2Change(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

/** Health locus card with single status input and visibility toggle */
function HealthLocusCard({
  locusInfo,
  locusData,
  mode,
  enableNetworkSharing,
  onStatusChange,
  onVisibilityChange,
}: {
  locusInfo: { locus: string; locusName: string; description: string; breedSpecific?: string };
  locusData?: GeneticLocus;
  mode: "view" | "edit";
  enableNetworkSharing: boolean;
  onStatusChange: (value: string) => void;
  onVisibilityChange: (visible: boolean) => void;
}) {
  return (
    <div className="border border-hairline rounded-lg p-3 bg-surface">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{locusInfo.locus} - {locusInfo.locusName}</div>
          {locusInfo.breedSpecific && (
            <span className="text-xs text-secondary">({locusInfo.breedSpecific})</span>
          )}
        </div>
        <VisibilityToggle
          isPublic={locusData?.networkVisible || false}
          onChange={onVisibilityChange}
          disabled={mode !== "edit"}
          readOnly={mode !== "edit"}
          inactive={!enableNetworkSharing}
        />
      </div>
      <div className="text-xs text-secondary mb-2">{locusInfo.description}</div>

      {mode === "view" ? (
        <div className="text-sm">
          Status: <span className="font-mono">{locusData?.genotype || "Not tested"}</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Input
            size="sm"
            placeholder="e.g., N, Clear, Carrier"
            defaultValue={locusData?.genotype || ""}
            onChange={(e) => onStatusChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

function GeneticsTab({
  animal,
  api,
  mode,
  onCancel,
}: {
  animal: AnimalRow;
  api: any;
  mode: "view" | "edit";
  onCancel?: () => void;
}) {
  const [geneticData, setGeneticData] = React.useState<GeneticData>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [editData, setEditData] = React.useState<GeneticData>({});
  const [showImportDialog, setShowImportDialog] = React.useState(false);
  const [showAddResultDialog, setShowAddResultDialog] = React.useState(false);
  const [enableGeneticsSharing, setEnableGeneticsSharing] = React.useState(false);
  const [collapsedSections, setCollapsedSections] = React.useState<Set<string>>(
    new Set(["coatColor", "coatType", "physicalTraits", "eyeColor", "health", "otherTraits", "breedSpecific"])
  );

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const CollapsibleTitle = ({ section, icon, children }: { section: string; icon: string; children: React.ReactNode }) => {
    const isCollapsed = collapsedSections.has(section);
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => toggleSection(section)}
          className="hover:opacity-80 transition-opacity -ml-1"
          aria-label={isCollapsed ? "Expand section" : "Collapse section"}
        >
          <svg
            className="w-4 h-4 transition-transform duration-200"
            style={{
              transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)",
              transformOrigin: "center",
              transformBox: "fill-box",
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <span>{icon}</span>
        <span>{children}</span>
      </div>
    );
  };

  // Load privacy settings to check if genetics sharing is enabled
  React.useEffect(() => {
    api?.animals?.lineage?.getPrivacySettings(animal.id)
      .then((s: any) => setEnableGeneticsSharing(s.enableGeneticsSharing ?? false))
      .catch(() => {});
  }, [api, animal.id]);

  // Convert seed data to GeneticMarker format for the picker
  const availableMarkers = React.useMemo((): GeneticMarker[] => {
    const species = (animal.species || "DOG").toUpperCase() as GeneticSpecies;
    return GENETIC_MARKERS_SEED
      .filter((m) => m.species === species)
      .map((m, idx) => ({
        id: idx + 1,
        species: m.species,
        category: m.category,
        code: m.code,
        commonName: m.commonName,
        gene: m.gene,
        description: m.description,
        breedSpecific: m.breedSpecific,
        isCommon: m.isCommon,
        inputType: m.inputType,
        pendingReview: false,
        source: "seed",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
  }, [animal.species]);

  // Handler for saving manually added results
  const handleSaveManualResults = async (results: CreateGeneticResultInput[]) => {
    // For now, convert the new results format to the existing GeneticData format
    // This bridges the new API types with the existing storage
    const newData = { ...editData };

    for (const result of results) {
      const marker = availableMarkers.find((m) => m.id === result.markerId);
      if (!marker) continue;

      const locusEntry: GeneticLocus = {
        locus: marker.code,
        locusName: marker.commonName,
        allele1: result.allele1,
        allele2: result.allele2,
        genotype: result.allele1 && result.allele2
          ? `${result.allele1}/${result.allele2}`
          : result.status || result.rawValue || "",
        testLab: result.testProvider,
        testDate: result.testDate,
        networkVisible: result.networkVisible ?? false,
      };

      // Add to appropriate category
      const category = marker.category;
      if (category === "coat_color") {
        newData.coatColor = [...(newData.coatColor || []).filter((l) => l.locus !== marker.code), locusEntry];
      } else if (category === "coat_type") {
        newData.coatType = [...(newData.coatType || []).filter((l) => l.locus !== marker.code), locusEntry];
      } else if (category === "health") {
        newData.health = [...(newData.health || []).filter((l) => l.locus !== marker.code), locusEntry];
      } else if (category === "physical_traits") {
        newData.physicalTraits = [...(newData.physicalTraits || []).filter((l) => l.locus !== marker.code), locusEntry];
      } else if (category === "eye_color") {
        newData.eyeColor = [...(newData.eyeColor || []).filter((l) => l.locus !== marker.code), locusEntry];
      } else {
        newData.otherTraits = [...(newData.otherTraits || []).filter((l) => l.locus !== marker.code), locusEntry];
      }
    }

    setEditData(newData);
    setGeneticData(newData);

    // Save to API
    try {
      const payload = {
        testProvider: newData.testResults?.testLab || results[0]?.testProvider || null,
        testDate: newData.testResults?.testDate || results[0]?.testDate || null,
        coatColor: newData.coatColor || [],
        health: newData.health || [],
        coatType: newData.coatType || [],
        physicalTraits: newData.physicalTraits || [],
        eyeColor: newData.eyeColor || [],
        otherTraits: newData.otherTraits || [],
      };
      await fetch(`/api/v1/animals/${animal.id}/genetics`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Failed to save genetics:", err);
    }
  };

  // Check if we have any genetic data
  const hasGeneticData = React.useMemo(() => {
    return (
      (geneticData.coatColor?.length || 0) > 0 ||
      (geneticData.coatType?.length || 0) > 0 ||
      (geneticData.health?.length || 0) > 0 ||
      (geneticData.physicalTraits?.length || 0) > 0 ||
      (geneticData.eyeColor?.length || 0) > 0 ||
      (geneticData.otherTraits?.length || 0) > 0 ||
      (geneticData.breedComposition?.length || 0) > 0
    );
  }, [geneticData]);

  // Species-specific locus definitions - comprehensive genetic markers
  type LocusInfo = { locus: string; locusName: string; description: string; breedSpecific?: string };
  type SpeciesLoci = {
    coatColor: LocusInfo[];
    coatType?: LocusInfo[];
    physicalTraits?: LocusInfo[];
    eyeColor?: LocusInfo[];
    health?: LocusInfo[];
    bloodType?: LocusInfo[];
    otherTraits: LocusInfo[];
  };
  const getSpeciesLoci = React.useCallback((species: string): SpeciesLoci => {
    const sp = (species || "DOG").toUpperCase();

    if (sp === "DOG") {
      return {
        coatColor: [
          { locus: "A", locusName: "Agouti", description: "Controls distribution of black/brown pigment (ay=sable, aw=wild, at=tan points, a=recessive black)" },
          { locus: "B", locusName: "Brown", description: "Black vs brown/chocolate pigment (B=black, b=brown)" },
          { locus: "D", locusName: "Dilute", description: "Dilutes black to blue, brown to isabella (D=full color, d=dilute)" },
          { locus: "E", locusName: "Extension", description: "Allows/prevents black pigment expression (E=normal, e=recessive red/cream)" },
          { locus: "K", locusName: "Black Extension", description: "Dominant black override (KB=dominant black, kbr=brindle, ky=allows agouti)" },
          { locus: "M", locusName: "Merle", description: "Creates merle pattern - WARNING: M/M can cause health issues (M=merle, m=non-merle)" },
          { locus: "S", locusName: "White Spotting", description: "White markings and patterns (S=solid, sp=piebald, sw=extreme white)" },
          { locus: "H", locusName: "Harlequin", description: "Modifies merle to create harlequin pattern in Great Danes (H=harlequin, h=non-harlequin)", breedSpecific: "Great Dane" },
          { locus: "Em", locusName: "Mask", description: "Black mask on face (Em=mask, E=no mask)" },
        ],
        coatType: [
          { locus: "L", locusName: "Long Hair", description: "Hair length gene (L/L=short coat, L/l=short carries long, l/l=long coat)" },
          { locus: "F", locusName: "Furnishings", description: "Beard/eyebrows - gives doodles their teddy bear face (F/F or F/f=furnished, f/f=unfurnished/smooth face)" },
          { locus: "Cu", locusName: "Curly", description: "Coat curl/wave (Cu/Cu=curly, Cu/+=wavy/curly, +/+=straight)" },
          { locus: "Sd", locusName: "Shedding", description: "Shedding propensity (Sd/Sd=low shed, Sd/sd=moderate, sd/sd=normal shedding)" },
          { locus: "IC", locusName: "Improper Coat", description: "Coat quality marker (IC/IC=improper coat, IC/N=carrier, N/N=proper coat)" },
          { locus: "L4", locusName: "Fluffy Gene (L4)", description: "Long hair in French Bulldogs and other breeds (L4/L4=fluffy, L4/N=carrier, N/N=normal)", breedSpecific: "French Bulldog" },
        ],
        physicalTraits: [
          { locus: "IGF1", locusName: "Size", description: "Insulin-like growth factor - related to body size in dogs" },
          { locus: "BT", locusName: "Bobtail", description: "Natural bobtail gene (T/T=normal tail, T/bt=natural bob, bt/bt=no tail - lethal in some breeds)" },
          { locus: "Dw", locusName: "Dewclaws", description: "Rear dewclaws present/absent" },
        ],
        eyeColor: [
          { locus: "Blue", locusName: "Blue Eyes", description: "Blue eye color gene (N/N=no blue, N/B=may have blue, B/B=blue eyes)" },
          { locus: "ALX4", locusName: "Blue Eyes (ALX4)", description: "Blue eye variant common in Huskies and Australian Shepherds" },
        ],
        health: [
          { locus: "MDR1", locusName: "MDR1 Drug Sensitivity", description: "Multi-drug resistance mutation - affected dogs sensitive to ivermectin and other drugs" },
          { locus: "DM", locusName: "Degenerative Myelopathy", description: "Progressive spinal cord disease causing hind leg weakness" },
          { locus: "PRA", locusName: "Progressive Retinal Atrophy", description: "Progressive blindness - multiple forms exist" },
          { locus: "vWD", locusName: "Von Willebrand Disease", description: "Blood clotting disorder - types I, II, and III" },
          { locus: "EIC", locusName: "Exercise-Induced Collapse", description: "Episodes of weakness/collapse after intense exercise", breedSpecific: "Labrador Retriever, Chesapeake Bay Retriever" },
          { locus: "DCM", locusName: "Dilated Cardiomyopathy", description: "Heart muscle disease - genetic variants identified in some breeds", breedSpecific: "Doberman, Boxer, Great Dane" },
          { locus: "HUU", locusName: "Hyperuricosuria", description: "Elevated uric acid levels leading to bladder/kidney stones" },
          { locus: "CEA", locusName: "Collie Eye Anomaly", description: "Eye developmental defect in Collies and related breeds", breedSpecific: "Collie, Border Collie, Australian Shepherd" },
          { locus: "NCL", locusName: "Neuronal Ceroid Lipofuscinosis", description: "Fatal neurological storage disease - multiple forms", breedSpecific: "Multiple breeds" },
          { locus: "GR_PRA1", locusName: "Golden Retriever PRA 1", description: "Progressive retinal atrophy variant in Golden Retrievers", breedSpecific: "Golden Retriever" },
          { locus: "GR_PRA2", locusName: "Golden Retriever PRA 2", description: "Second PRA variant identified in Golden Retrievers", breedSpecific: "Golden Retriever" },
          { locus: "CMR", locusName: "Canine Multifocal Retinopathy", description: "Eye condition causing retinal folds and detachment" },
          { locus: "Ich", locusName: "Ichthyosis", description: "Skin scaling disorder - common in Golden Retrievers" },
          { locus: "ICT_A", locusName: "Ichthyosis Type A (Golden Retriever)", description: "Breed-specific skin scaling disorder in Golden Retrievers", breedSpecific: "Golden Retriever" },
          { locus: "HNPK", locusName: "Hereditary Nasal Parakeratosis", description: "Dry, crusty nose condition - common in Labradors", breedSpecific: "Labrador Retriever" },
          { locus: "SD2", locusName: "Skeletal Dysplasia 2 (Dwarfism)", description: "Dwarfism causing shortened limbs in Labrador Retrievers", breedSpecific: "Labrador Retriever" },
          { locus: "CNM", locusName: "Centronuclear Myopathy", description: "Muscle weakness disorder in Labrador Retrievers", breedSpecific: "Labrador Retriever" },
          { locus: "RD_OSD", locusName: "Retinal Dysplasia/Oculoskeletal Dysplasia", description: "Eye and skeletal abnormalities - common in Labrador Retrievers", breedSpecific: "Labrador Retriever" },
          { locus: "JHC", locusName: "Juvenile Hereditary Cataracts", description: "Early-onset cataracts in various breeds", breedSpecific: "French Bulldog, Boston Terrier" },
          { locus: "CMR1", locusName: "Canine Multifocal Retinopathy 1", description: "Specific CMR variant causing retinal lesions", breedSpecific: "French Bulldog" },
          { locus: "Cystinuria", locusName: "Cystinuria (Urinary stones)", description: "Amino acid metabolism disorder causing urinary stones", breedSpecific: "French Bulldog, English Bulldog" },
          { locus: "EFS", locusName: "Episodic Falling Syndrome (Cavaliers)", description: "Muscle hypertonicity episodes in Cavalier King Charles Spaniels", breedSpecific: "Cavalier King Charles Spaniel" },
          { locus: "CC_DEW", locusName: "Curly Coat/Dry Eye Syndrome", description: "Combined coat and eye condition in Cavaliers", breedSpecific: "Cavalier King Charles Spaniel" },
          { locus: "HSF4", locusName: "Hereditary Cataracts (HSF4)", description: "Cataracts linked to HSF4 gene - multiple breeds affected", breedSpecific: "Australian Shepherd, Boston Terrier" },
          { locus: "TNS", locusName: "Trapped Neutrophil Syndrome", description: "Immune system disorder in Border Collies", breedSpecific: "Border Collie" },
          { locus: "CL_BC", locusName: "Neuronal Ceroid Lipofuscinosis (Border Collie)", description: "Fatal neurological storage disease in Border Collies", breedSpecific: "Border Collie" },
          { locus: "IGS", locusName: "Imerslund-Grasbeck Syndrome", description: "Vitamin B12 malabsorption disorder", breedSpecific: "Border Collie, Beagle" },
          { locus: "FN", locusName: "Familial Nephropathy", description: "Progressive kidney disease in Cocker Spaniels and other breeds", breedSpecific: "Cocker Spaniel, English Springer Spaniel" },
          { locus: "PFK", locusName: "Phosphofructokinase Deficiency", description: "Enzyme deficiency causing muscle problems and anemia", breedSpecific: "English Springer Spaniel, American Cocker Spaniel" },
          { locus: "GPRA", locusName: "Generalized Progressive Retinal Atrophy", description: "General form of progressive blindness across multiple breeds" },
        ],
        otherTraits: [],
      };
    } else if (sp === "CAT") {
      return {
        coatColor: [
          { locus: "A", locusName: "Agouti", description: "Tabby vs solid pattern (A=agouti/tabby, a=non-agouti/solid)" },
          { locus: "B", locusName: "Brown", description: "Black vs chocolate vs cinnamon (B=black, b=chocolate, bl=cinnamon)" },
          { locus: "C", locusName: "Colorpoint", description: "Full color to albino series (C=full, cs=siamese, cb=burmese, ca=blue-eyed albino, c=pink-eyed albino)" },
          { locus: "D", locusName: "Dilute", description: "Full color vs dilute (D=full, d=dilute - black becomes blue, orange becomes cream)" },
          { locus: "O", locusName: "Orange", description: "Sex-linked orange/red (O=orange, o=non-orange) - females can be tortoiseshell" },
          { locus: "S", locusName: "White Spotting", description: "White markings (S=spotting, s=no spotting)" },
          { locus: "W", locusName: "Dominant White", description: "Epistatic white - masks all other colors (W=white, w=colored) - can cause deafness" },
        ],
        coatType: [
          { locus: "L", locusName: "Long Hair", description: "Hair length (L=short, l=long - longhair is recessive)" },
          { locus: "Mc", locusName: "Tabby Pattern", description: "Mackerel vs classic tabby (Mc=mackerel stripes, mc=classic/blotched)" },
          { locus: "R", locusName: "Rex/Curly", description: "Curly coat mutations (various rex genes in different breeds)" },
          { locus: "Fd", locusName: "Fold Ears", description: "Scottish Fold ear mutation - WARNING: Fd/Fd causes severe cartilage problems", breedSpecific: "Scottish Fold" },
        ],
        physicalTraits: [
          { locus: "Pd", locusName: "Polydactyl", description: "Extra toes (Pd=polydactyl, pd=normal)" },
        ],
        health: [
          { locus: "PKD", locusName: "Polycystic Kidney Disease", description: "Kidney cysts - common in Persians and related breeds" },
          { locus: "HCM", locusName: "Hypertrophic Cardiomyopathy", description: "Heart muscle thickening - genetic tests available for some breeds" },
          { locus: "PRA", locusName: "Progressive Retinal Atrophy", description: "Progressive blindness - multiple forms in different breeds" },
          { locus: "SMA", locusName: "Spinal Muscular Atrophy", description: "Spinal cord motor neuron degeneration in Maine Coons", breedSpecific: "Maine Coon" },
          { locus: "PK_Def", locusName: "Pyruvate Kinase Deficiency", description: "Red blood cell enzyme deficiency causing anemia" },
          { locus: "PRA_pd", locusName: "PRA (Persian variant)", description: "Progressive retinal atrophy variant specific to Persians", breedSpecific: "Persian, Exotic Shorthair" },
          { locus: "HCM_MC", locusName: "HCM (Maine Coon MYBPC3)", description: "Hypertrophic cardiomyopathy variant in Maine Coons", breedSpecific: "Maine Coon" },
          { locus: "HCM_RD", locusName: "HCM (Ragdoll MYBPC3)", description: "Hypertrophic cardiomyopathy variant in Ragdolls", breedSpecific: "Ragdoll" },
          { locus: "GM1", locusName: "Gangliosidosis Type 1", description: "Fatal lysosomal storage disease in cats", breedSpecific: "Siamese, Korat" },
          { locus: "PRA_rdAc", locusName: "PRA (Abyssinian/Somali)", description: "Progressive retinal atrophy in Abyssinian and Somali cats", breedSpecific: "Abyssinian, Somali" },
          { locus: "Amyloidosis", locusName: "Renal Amyloidosis", description: "Protein deposits in kidneys - common in Abyssinians and Siamese", breedSpecific: "Abyssinian, Siamese" },
          { locus: "FCKS", locusName: "Flat-Chested Kitten Syndrome", description: "Chest deformity in kittens affecting breathing" },
          { locus: "OCD", locusName: "Osteochondrodysplasia (Fold warning)", description: "Cartilage/bone abnormality - WARNING: Fd/Fd causes severe issues", breedSpecific: "Scottish Fold" },
        ],
        bloodType: [
          { locus: "BloodType", locusName: "Blood Type (A, B, AB)", description: "Critical for breeding - Type B queens bred to Type A toms risk neonatal isoerythrolysis" },
        ],
        otherTraits: [],
      };
    } else if (sp === "HORSE") {
      return {
        coatColor: [
          { locus: "E", locusName: "Extension", description: "Red vs black base (E=black pigment, e=red/chestnut only)" },
          { locus: "A", locusName: "Agouti", description: "Black distribution on bay horses (A=bay, a=black)" },
          { locus: "Cr", locusName: "Cream", description: "Cream dilution (Cr/Cr=cremello/perlino, Cr/cr=palomino/buckskin, cr/cr=no dilution)" },
          { locus: "D", locusName: "Dun", description: "Dun dilution with primitive markings (D=dun with dorsal stripe, d=non-dun)" },
          { locus: "G", locusName: "Gray", description: "Progressive graying (G=gray, g=non-gray) - horses born colored, turn gray with age" },
          { locus: "Ch", locusName: "Champagne", description: "Champagne dilution (Ch=champagne, ch=non-champagne)" },
          { locus: "Z", locusName: "Silver", description: "Silver dapple - dilutes black pigment (Z=silver, z=non-silver)" },
          { locus: "TO", locusName: "Tobiano", description: "Tobiano white pattern (TO=tobiano, to=non-tobiano)" },
          { locus: "O", locusName: "Overo (OLWS)", description: "Frame overo pattern - WARNING: O/O is Lethal White Overo Syndrome" },
          { locus: "SB", locusName: "Sabino", description: "Sabino white pattern (SB1 and other variants)" },
          { locus: "LP", locusName: "Leopard Complex", description: "Appaloosa patterns (LP=leopard complex, lp=no pattern)" },
          { locus: "Rn", locusName: "Roan", description: "Roan pattern - white hairs interspersed (Rn=roan, rn=non-roan)" },
          { locus: "W", locusName: "Dominant White", description: "Dominant white spotting patterns - multiple W alleles exist" },
          { locus: "nCh", locusName: "Chestnut Factor", description: "Hidden red gene - indicates carrier of chestnut/sorrel (nCh/nCh=chestnut carrier)" },
        ],
        health: [
          { locus: "HYPP", locusName: "Hyperkalemic Periodic Paralysis", description: "Muscle disease in Quarter Horse lines - trace to Impressive", breedSpecific: "Quarter Horse" },
          { locus: "GBED", locusName: "Glycogen Branching Enzyme Deficiency", description: "Fatal metabolic disorder in Quarter Horses", breedSpecific: "Quarter Horse, Paint" },
          { locus: "HERDA", locusName: "Hereditary Equine Regional Dermal Asthenia", description: "Skin fragility in Quarter Horses", breedSpecific: "Quarter Horse" },
          { locus: "OLWS", locusName: "Overo Lethal White Syndrome", description: "Lethal when homozygous (O/O) - foals born white, die within days" },
          { locus: "MH", locusName: "Malignant Hyperthermia", description: "Dangerous anesthesia reaction in Quarter Horses" },
          { locus: "PSSM", locusName: "Polysaccharide Storage Myopathy", description: "Muscle disorder - multiple types (PSSM1 and PSSM2)" },
          { locus: "IMM", locusName: "Immune-Mediated Myositis", description: "Rapid muscle wasting triggered by infection or vaccination" },
          { locus: "WFFS", locusName: "Warmblood Fragile Foal Syndrome", description: "Connective tissue disorder in Warmbloods" },
          { locus: "LWO", locusName: "Lethal White Overo", description: "Same as OLWS - frame overo homozygous lethal" },
          { locus: "CA", locusName: "Cerebellar Abiotrophy", description: "Progressive neurological disease in Arabians and related breeds", breedSpecific: "Arabian" },
          { locus: "SCID", locusName: "Severe Combined Immunodeficiency", description: "Fatal immune system failure in Arabian foals", breedSpecific: "Arabian" },
          { locus: "LFS", locusName: "Lavender Foal Syndrome", description: "Fatal neurological disorder - foals born with dilute/lavender coat", breedSpecific: "Arabian" },
          { locus: "OAAM", locusName: "Occipitoatlantoaxial Malformation", description: "Vertebral malformation in Arabians", breedSpecific: "Arabian" },
          { locus: "Hydro", locusName: "Hydrocephalus (Friesian)", description: "Abnormal fluid accumulation in brain - common in Friesians", breedSpecific: "Friesian" },
          { locus: "FrDwarf", locusName: "Dwarfism (Friesian)", description: "Dwarfism disorder specific to Friesian horses", breedSpecific: "Friesian" },
          { locus: "JEB", locusName: "Junctional Epidermolysis Bullosa", description: "Fatal skin blistering disease - foals born with fragile skin", breedSpecific: "Belgian, other Draft breeds" },
        ],
        otherTraits: [],
      };
    } else if (sp === "RABBIT") {
      return {
        coatColor: [
          { locus: "A", locusName: "Agouti", description: "Agouti vs self/tan pattern (A=agouti, at=tan, a=self)" },
          { locus: "B", locusName: "Brown", description: "Black vs chocolate (B=black, b=chocolate)" },
          { locus: "C", locusName: "Color Series", description: "Full color to albino (C=full, cchd=chinchilla dark, cchl=sable/seal, ch=himalayan, c=albino REW)" },
          { locus: "D", locusName: "Dilute", description: "Full color vs dilute (D=full, d=dilute - black becomes blue)" },
          { locus: "E", locusName: "Extension", description: "Full extension vs steel vs non-extension (E=normal, Es=steel, e=non-extension/tort)" },
          { locus: "En", locusName: "English Spotting", description: "Broken/spotted pattern (En=spotted, en=solid) - WARNING: En/En causes digestive issues" },
          { locus: "V", locusName: "Vienna", description: "Blue-eyed white and Vienna marked (V=normal, v=vienna - v/v=BEW)" },
          { locus: "Du", locusName: "Dutch", description: "Dutch pattern markings (Du=normal, du=dutch pattern when homozygous)" },
          { locus: "W", locusName: "Wideband", description: "Width of agouti band (W/W=wideband, W/w=intermediate, w/w=normal band)" },
        ],
        coatType: [
          { locus: "L", locusName: "Long Hair (Angora)", description: "Hair length (L=normal, l=long/angora wool)" },
          { locus: "Sa", locusName: "Satin", description: "Satin sheen coat (Sa=normal, sa=satin)" },
          { locus: "Rx", locusName: "Rex", description: "Rex coat texture (Rx=normal, rx=rex)" },
          { locus: "Fuzzy", locusName: "Fuzzy/Wool Gene", description: "Creates wool-like fuzzy coat texture" },
          { locus: "Mane", locusName: "Lionhead Mane Gene", description: "Creates mane of longer fur around head in Lionhead breed (M/M or M/m=mane)" },
          { locus: "Boot", locusName: "Booted (white feet pattern)", description: "White feet markings pattern" },
        ],
        health: [
          { locus: "Dw", locusName: "Dwarf Gene", description: "Peanut lethal - WARNING: Dw/Dw (double dwarf) is lethal, Dw/dw=dwarf, dw/dw=normal size" },
          { locus: "Splay", locusName: "Splay Leg", description: "Genetic leg deformity - affected kits cannot walk properly" },
        ],
        otherTraits: [],
      };
    } else if (sp === "GOAT") {
      return {
        coatColor: [
          { locus: "A", locusName: "Agouti Pattern", description: "Agouti patterns (multiple alleles: wild, tan, swiss marked, badger face, etc.)" },
          { locus: "B", locusName: "Brown", description: "Black vs brown/chocolate pigment (B=black, b=brown)" },
          { locus: "E", locusName: "Extension", description: "Extension of dark pigment (E=normal, e=recessive red)" },
          { locus: "S", locusName: "Spotting", description: "White spotting patterns" },
          { locus: "Rn", locusName: "Roan", description: "Roan pattern - white hairs interspersed" },
          { locus: "Co", locusName: "Concentrated", description: "Concentrated pigment pattern" },
        ],
        physicalTraits: [
          { locus: "P", locusName: "Polled", description: "Hornless gene - WARNING: P/P may cause intersex in females, P/p=polled, p/p=horned" },
          { locus: "Wd", locusName: "Wattles", description: "Wattles present (Wd=wattles present)" },
        ],
        health: [
          { locus: "G6S", locusName: "G6S (Beta-Mannosidosis)", description: "Fatal metabolic storage disease in Nubians and related breeds" },
          { locus: "Scrapie", locusName: "Scrapie Susceptibility", description: "Prion disease susceptibility genotype (QQ, QR, RR variants)" },
          { locus: "CAE", locusName: "CAE", description: "Caprine Arthritis Encephalitis - viral but testing important for breeding" },
          { locus: "CL", locusName: "CL (Caseous Lymphadenitis)", description: "Bacterial disease - testing important for breeding programs" },
          { locus: "AS1_Casein", locusName: "Alpha-S1 Casein", description: "Milk protein gene affecting cheese yield and milk composition" },
          { locus: "BetaCasein", locusName: "Beta-Casein Variants", description: "Milk protein variants affecting digestibility and cheese production" },
          { locus: "Myotonia", locusName: "Myotonia (Fainting gene)", description: "Muscle stiffness causing 'fainting' episodes in Myotonic goats" },
          { locus: "Chondro", locusName: "Chondrodysplasia (Dwarfism)", description: "Skeletal abnormality causing dwarfism in various goat breeds" },
        ],
        otherTraits: [],
      };
    }

    // Default for SHEEP and other species
    return {
      coatColor: [
        { locus: "Custom", locusName: "Custom Locus", description: "Add custom genetic information" },
      ],
      coatType: [],
      physicalTraits: [],
      eyeColor: [],
      health: [],
      otherTraits: [],
    };
  }, []);

  const loci = React.useMemo(() => getSpeciesLoci(animal.species || "DOG"), [animal.species, getSpeciesLoci]);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Fetch genetic data from API
        const res = await fetch(`/api/v1/animals/${animal.id}/genetics`, {
          credentials: "include",
        });
        if (res.ok) {
          const apiData = await res.json();
          const data: GeneticData = {
            coatColor: apiData.coatColor || [],
            health: apiData.health || [],
            coatType: apiData.coatType || [],
            physicalTraits: apiData.physicalTraits || [],
            eyeColor: apiData.eyeColor || [],
            otherTraits: apiData.otherTraits || [],
            testResults: {
              testName: apiData.testProvider || undefined,
              testDate: apiData.testDate || undefined,
              testId: apiData.testId || undefined,
            },
          };
          setGeneticData(data);
          setEditData(data);
        } else {
          // Initialize empty if no data exists
          const data: GeneticData = { coatColor: [], health: [], coatType: [], physicalTraits: [], eyeColor: [], otherTraits: [] };
          setGeneticData(data);
          setEditData(data);
        }
      } catch (err) {
        console.error("Failed to load genetics:", err);
        // Initialize empty on error
        const data: GeneticData = { coatColor: [], health: [], coatType: [], physicalTraits: [], eyeColor: [], otherTraits: [] };
        setGeneticData(data);
        setEditData(data);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [animal.id]);

  const handleSave = async () => {
    try {
      setSaving(true);
      // Save genetic data to API
      const payload = {
        testProvider: editData.testResults?.testName || null,
        testDate: editData.testResults?.testDate || null,
        testId: editData.testResults?.testId || null,
        coatColor: editData.coatColor || [],
        health: editData.health || [],
        coatType: editData.coatType || [],
        physicalTraits: editData.physicalTraits || [],
        eyeColor: editData.eyeColor || [],
        otherTraits: editData.otherTraits || [],
      };
      const res = await fetch(`/api/v1/animals/${animal.id}/genetics`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const saved = await res.json();
        setGeneticData({
          coatColor: saved.coatColor || [],
          health: saved.health || [],
          coatType: saved.coatType || [],
          physicalTraits: saved.physicalTraits || [],
          eyeColor: saved.eyeColor || [],
          otherTraits: saved.otherTraits || [],
          testResults: {
            testName: saved.testProvider || undefined,
            testDate: saved.testDate || undefined,
            testId: saved.testId || undefined,
          },
        });
        console.log("Genetics data saved successfully");
      } else {
        throw new Error("Failed to save genetics data");
      }
    } catch (err) {
      console.error("Failed to save genetics:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-sm text-secondary">Loading genetic information...</div>
      </div>
    );
  }

  // Show empty state when no data and in view mode
  if (!hasGeneticData && mode === "view") {
    return (
      <div className="p-4">
        <GeneticsEmptyState
          animalName={animal.name}
          species={(animal.species || "DOG").toUpperCase() as "DOG" | "CAT" | "HORSE" | "OTHER"}
          onImportClick={() => setShowImportDialog(true)}
          onManualAddClick={() => setShowAddResultDialog(true)}
        />

        {/* Dialogs still need to be rendered */}
        <GeneticsImportDialog
          open={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          animalId={animal.id}
          animalName={animal.name}
          animalSpecies={animal.species || "DOG"}
          onImportComplete={() => {
            setShowImportDialog(false);
            setLoading(true);
            fetch(`/api/v1/animals/${animal.id}/genetics`, { credentials: "include" })
              .then((res) => res.json())
              .then((data) => {
                const mapped: GeneticData = {
                  coatColor: data.coatColor || [],
                  health: data.health || [],
                  coatType: data.coatType || [],
                  physicalTraits: data.physicalTraits || [],
                  eyeColor: data.eyeColor || [],
                  otherTraits: data.otherTraits || [],
                  testResults: {
                    testLab: data.testProvider || "",
                    testDate: data.testDate ? data.testDate.split("T")[0] : "",
                    testId: data.testId || "",
                  },
                };
                setGeneticData(mapped);
                setEditData(mapped);
              })
              .finally(() => setLoading(false));
          }}
        />

        <AddGeneticResultDialog
          open={showAddResultDialog}
          onClose={() => setShowAddResultDialog(false)}
          animalId={animal.id}
          animalName={animal.name}
          species={(animal.species || "DOG").toUpperCase() as GeneticSpecies}
          breeds={editData.breedComposition?.map((bc) => bc.breed).filter((b) => b.length > 0)}
          markers={availableMarkers}
          onSave={handleSaveManualResults}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {/* Network Sharing Status */}
      {enableGeneticsSharing && (
        <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
          <div className="flex items-start gap-2">
            <span className="text-purple-600">🔗</span>
            <div className="text-sm">
              <div className="font-medium text-purple-700 mb-1">Network Sharing Enabled</div>
              <div className="text-secondary">
                Genetic data entered here may be shared with other breeders in the network based on your Privacy settings.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Combined Info & Import Section */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 text-sm flex-1">
            <div className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">💡</span>
              <div>
                <span className="font-medium text-amber-500">Looking for health screening summaries?</span>{" "}
                <span className="text-secondary">Use the <span className="font-semibold">Health tab → Genetic category</span> for general clearances and test completion status.</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">💡</span>
              <div>
                <span className="font-medium text-amber-500">Not sure which tests apply to your breed?</span>{" "}
                <span className="text-secondary">Check with your genetic testing provider (Embark, Wisdom Panel, UC Davis VGL, etc.) for breed-specific recommendations.</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowImportDialog(true)}
              >
                Import from Lab
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddResultDialog(true)}
              >
                Add Manually
              </Button>
            </div>
            <span className="text-xs text-secondary">CSV import or manual entry</span>
          </div>
        </div>
      </div>

      {/* Genetics Import Dialog */}
      <GeneticsImportDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        animalId={animal.id}
        animalName={animal.name}
        animalSpecies={animal.species || "DOG"}
        onImportComplete={(result) => {
          // Reload genetic data after import
          setShowImportDialog(false);
          setLoading(true);
          fetch(`/api/v1/animals/${animal.id}/genetics`, { credentials: "include" })
            .then((res) => res.json())
            .then((data) => {
              const mapped: GeneticData = {
                coatColor: data.coatColor || [],
                health: data.health || [],
                coatType: data.coatType || [],
                physicalTraits: data.physicalTraits || [],
                eyeColor: data.eyeColor || [],
                otherTraits: data.otherTraits || [],
                testResults: {
                  testLab: data.testProvider || "",
                  testDate: data.testDate ? data.testDate.split("T")[0] : "",
                  testId: data.testId || "",
                },
              };
              setGeneticData(mapped);
              setEditData(mapped);
            })
            .finally(() => setLoading(false));
        }}
      />

      {/* Add Genetic Result Dialog */}
      <AddGeneticResultDialog
        open={showAddResultDialog}
        onClose={() => setShowAddResultDialog(false)}
        animalId={animal.id}
        animalName={animal.name}
        species={(animal.species || "DOG").toUpperCase() as GeneticSpecies}
        breeds={editData.breedComposition?.map((bc) => bc.breed).filter((b) => b.length > 0)}
        markers={availableMarkers}
        onSave={handleSaveManualResults}
      />

      {/* Genetic Test Results */}
      <SectionCard title={<SectionTitle icon="🧬">Genetic Test Results</SectionTitle>}>
        <div className="space-y-4">
          <div className="text-sm text-secondary">
            Store genetic test results from Embark, Wisdom Panel, or other laboratories. Record specific alleles and genotypes for use in the Breeding module's Genetics Lab.
          </div>
          {mode === "view" ? (
            <div className="grid grid-cols-3 gap-4">
              <LV label="Test Provider">
                {editData.testResults?.testLab || "—"}
              </LV>
              <LV label="Test Date">
                {editData.testResults?.testDate || "—"}
              </LV>
              <LV label="Test ID">
                {editData.testResults?.testId || "—"}
              </LV>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <LV label="Test Provider">
                <Input
                  size="sm"
                  placeholder="e.g., Embark"
                  defaultValue={editData.testResults?.testLab || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      testResults: { ...editData.testResults, testLab: e.target.value },
                    })
                  }
                />
              </LV>
              <LV label="Test Date">
                <DatePicker
                  value={editData.testResults?.testDate || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      testResults: { ...editData.testResults, testDate: e.currentTarget.value },
                    })
                  }
                />
              </LV>
              <LV label="Test ID">
                <Input
                  size="sm"
                  placeholder="e.g., EMB-123456"
                  defaultValue={editData.testResults?.testId || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      testResults: { ...editData.testResults, testId: e.target.value },
                    })
                  }
                />
              </LV>
            </div>
          )}

          {/* Breed Composition */}
          <div className="border-t border-hairline pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium">Breed Composition</div>
              {mode === "edit" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const current = editData.breedComposition || [];
                    setEditData({
                      ...editData,
                      breedComposition: [...current, { breed: "", percentage: 0 }],
                    });
                  }}
                >
                  + Add Breed
                </Button>
              )}
            </div>
            {mode === "view" ? (
              (editData.breedComposition?.length || 0) > 0 ? (
                <div className="space-y-2">
                  {editData.breedComposition?.map((bc, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex-1 text-sm">{bc.breed}</div>
                      <div className="w-32 bg-hairline rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${bc.percentage}%` }}
                        />
                      </div>
                      <div className="w-12 text-right text-sm font-medium">{bc.percentage}%</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-secondary">No breed composition data recorded</div>
              )
            ) : (
              <div className="space-y-2">
                {(editData.breedComposition || []).map((bc, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      size="sm"
                      placeholder="Breed name"
                      className="flex-1"
                      defaultValue={bc.breed}
                      onChange={(e) => {
                        const updated = [...(editData.breedComposition || [])];
                        updated[idx] = { ...updated[idx], breed: e.target.value };
                        setEditData({ ...editData, breedComposition: updated });
                      }}
                    />
                    <Input
                      size="sm"
                      type="number"
                      placeholder="%"
                      className="w-20"
                      min={0}
                      max={100}
                      defaultValue={bc.percentage || ""}
                      onChange={(e) => {
                        const updated = [...(editData.breedComposition || [])];
                        updated[idx] = { ...updated[idx], percentage: Number(e.target.value) || 0 };
                        setEditData({ ...editData, breedComposition: updated });
                      }}
                    />
                    <span className="text-sm text-secondary">%</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const updated = (editData.breedComposition || []).filter((_, i) => i !== idx);
                        setEditData({ ...editData, breedComposition: updated });
                      }}
                    >
                      <span className="text-red-500">×</span>
                    </Button>
                  </div>
                ))}
                {(editData.breedComposition?.length || 0) === 0 && (
                  <div className="text-sm text-secondary">Click "Add Breed" to record breed composition from DNA testing</div>
                )}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Coat Color Genetics */}
      <SectionCard title={<CollapsibleTitle section="coatColor" icon="🎨">Coat Color Genetics</CollapsibleTitle>}>
        {!collapsedSections.has("coatColor") && <div className="space-y-3">
          <div className="text-sm text-secondary mb-3">
            Record genotype information for coat color loci. This data will be used in the Breeding module's Genetics Lab for pairing analysis.
          </div>

          {/* Common Coat Color Markers */}
          <div className="grid grid-cols-1 gap-3">
            {loci.coatColor.filter((l: any) => !l.breedSpecific).map((locusInfo: any) => {
              const locusData = editData.coatColor?.find((l) => l.locus === locusInfo.locus);
              return (
                <LocusCard
                  key={locusInfo.locus}
                  locusInfo={locusInfo}
                  locusData={locusData}
                  mode={mode}
                  enableNetworkSharing={enableGeneticsSharing}
                  onAllele1Change={(value) => {
                    const existing = editData.coatColor || [];
                    const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                    const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                    const updated = { ...ld, allele1: value };
                    updated.genotype = `${updated.allele1 || "?"}/${updated.allele2 || "?"}`;
                    const newCoatColor = locusIdx >= 0
                      ? existing.map((l, i) => (i === locusIdx ? updated : l))
                      : [...existing, updated];
                    setEditData({ ...editData, coatColor: newCoatColor });
                  }}
                  onAllele2Change={(value) => {
                    const existing = editData.coatColor || [];
                    const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                    const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                    const updated = { ...ld, allele2: value };
                    updated.genotype = `${updated.allele1 || "?"}/${updated.allele2 || "?"}`;
                    const newCoatColor = locusIdx >= 0
                      ? existing.map((l, i) => (i === locusIdx ? updated : l))
                      : [...existing, updated];
                    setEditData({ ...editData, coatColor: newCoatColor });
                  }}
                  onVisibilityChange={(visible) => {
                    const existing = editData.coatColor || [];
                    const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                    const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                    const updated = { ...ld, networkVisible: visible };
                    const newCoatColor = locusIdx >= 0
                      ? existing.map((l, i) => (i === locusIdx ? updated : l))
                      : [...existing, updated];
                    setEditData({ ...editData, coatColor: newCoatColor });
                  }}
                />
              );
            })}
          </div>

        </div>}
      </SectionCard>

      {/* Coat Type Genetics */}
      {loci.coatType && loci.coatType.length > 0 && (
        <SectionCard title={<CollapsibleTitle section="coatType" icon="✂️">Coat Type Genetics</CollapsibleTitle>}>
          {!collapsedSections.has("coatType") && <div className="space-y-3">
            <div className="text-sm text-secondary mb-3">
              Record coat type traits including length, curl, furnishings (teddy bear face), and shedding propensity.
            </div>

            {/* Common Coat Type Markers */}
            <div className="grid grid-cols-1 gap-3">
              {loci.coatType.filter((l: any) => !l.breedSpecific).map((locusInfo: any) => {
                const locusData = editData.coatType?.find((l) => l.locus === locusInfo.locus);
                return (
                  <LocusCard
                    key={locusInfo.locus}
                    locusInfo={locusInfo}
                    locusData={locusData}
                    mode={mode}
                    enableNetworkSharing={enableGeneticsSharing}
                    onAllele1Change={(value) => {
                      const existing = editData.coatType || [];
                      const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                      const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                      const updated = { ...ld, allele1: value };
                      updated.genotype = `${updated.allele1 || "?"}/${updated.allele2 || "?"}`;
                      const newCoatType = locusIdx >= 0
                        ? existing.map((l, i) => (i === locusIdx ? updated : l))
                        : [...existing, updated];
                      setEditData({ ...editData, coatType: newCoatType });
                    }}
                    onAllele2Change={(value) => {
                      const existing = editData.coatType || [];
                      const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                      const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                      const updated = { ...ld, allele2: value };
                      updated.genotype = `${updated.allele1 || "?"}/${updated.allele2 || "?"}`;
                      const newCoatType = locusIdx >= 0
                        ? existing.map((l, i) => (i === locusIdx ? updated : l))
                        : [...existing, updated];
                      setEditData({ ...editData, coatType: newCoatType });
                    }}
                    onVisibilityChange={(visible) => {
                      const existing = editData.coatType || [];
                      const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                      const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                      const updated = { ...ld, networkVisible: visible };
                      const newCoatType = locusIdx >= 0
                        ? existing.map((l, i) => (i === locusIdx ? updated : l))
                        : [...existing, updated];
                      setEditData({ ...editData, coatType: newCoatType });
                    }}
                  />
                );
              })}
            </div>

          </div>}
        </SectionCard>
      )}

      {/* Physical Traits Genetics */}
      {loci.physicalTraits && loci.physicalTraits.length > 0 && (
        <SectionCard title={<CollapsibleTitle section="physicalTraits" icon="📏">Physical Traits Genetics</CollapsibleTitle>}>
          {!collapsedSections.has("physicalTraits") && <div className="space-y-3">
            <div className="text-sm text-secondary mb-3">
              Record genetic markers related to physical characteristics like size, tail type, and dewclaws.
            </div>

            {/* Common Physical Traits Markers */}
            <div className="grid grid-cols-1 gap-3">
              {loci.physicalTraits.filter((l: any) => !l.breedSpecific).map((locusInfo: any) => {
                const locusData = editData.physicalTraits?.find((l) => l.locus === locusInfo.locus);
                return (
                  <LocusCard
                    key={locusInfo.locus}
                    locusInfo={locusInfo}
                    locusData={locusData}
                    mode={mode}
                    enableNetworkSharing={enableGeneticsSharing}
                    onAllele1Change={(value) => {
                      const existing = editData.physicalTraits || [];
                      const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                      const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                      const updated = { ...ld, allele1: value };
                      updated.genotype = `${updated.allele1 || "?"}/${updated.allele2 || "?"}`;
                      const newPhysicalTraits = locusIdx >= 0
                        ? existing.map((l, i) => (i === locusIdx ? updated : l))
                        : [...existing, updated];
                      setEditData({ ...editData, physicalTraits: newPhysicalTraits });
                    }}
                    onAllele2Change={(value) => {
                      const existing = editData.physicalTraits || [];
                      const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                      const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                      const updated = { ...ld, allele2: value };
                      updated.genotype = `${updated.allele1 || "?"}/${updated.allele2 || "?"}`;
                      const newPhysicalTraits = locusIdx >= 0
                        ? existing.map((l, i) => (i === locusIdx ? updated : l))
                        : [...existing, updated];
                      setEditData({ ...editData, physicalTraits: newPhysicalTraits });
                    }}
                    onVisibilityChange={(visible) => {
                      const existing = editData.physicalTraits || [];
                      const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                      const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                      const updated = { ...ld, networkVisible: visible };
                      const newPhysicalTraits = locusIdx >= 0
                        ? existing.map((l, i) => (i === locusIdx ? updated : l))
                        : [...existing, updated];
                      setEditData({ ...editData, physicalTraits: newPhysicalTraits });
                    }}
                  />
                );
              })}
            </div>

          </div>}
        </SectionCard>
      )}

      {/* Eye Color Genetics */}
      {loci.eyeColor && loci.eyeColor.length > 0 && (
        <SectionCard title={<CollapsibleTitle section="eyeColor" icon="👁️">Eye Color Genetics</CollapsibleTitle>}>
          {!collapsedSections.has("eyeColor") && <div className="space-y-3">
            <div className="text-sm text-secondary mb-3">
              Record eye color genetic markers including blue eye variants.
            </div>

            {/* Common Eye Color Markers */}
            <div className="grid grid-cols-1 gap-3">
              {loci.eyeColor.filter((l: any) => !l.breedSpecific).map((locusInfo: any) => {
                const locusData = editData.eyeColor?.find((l) => l.locus === locusInfo.locus);
                return (
                  <LocusCard
                    key={locusInfo.locus}
                    locusInfo={locusInfo}
                    locusData={locusData}
                    mode={mode}
                    enableNetworkSharing={enableGeneticsSharing}
                    onAllele1Change={(value) => {
                      const existing = editData.eyeColor || [];
                      const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                      const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                      const updated = { ...ld, allele1: value };
                      updated.genotype = `${updated.allele1 || "?"}/${updated.allele2 || "?"}`;
                      const newEyeColor = locusIdx >= 0
                        ? existing.map((l, i) => (i === locusIdx ? updated : l))
                        : [...existing, updated];
                      setEditData({ ...editData, eyeColor: newEyeColor });
                    }}
                    onAllele2Change={(value) => {
                      const existing = editData.eyeColor || [];
                      const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                      const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                      const updated = { ...ld, allele2: value };
                      updated.genotype = `${updated.allele1 || "?"}/${updated.allele2 || "?"}`;
                      const newEyeColor = locusIdx >= 0
                        ? existing.map((l, i) => (i === locusIdx ? updated : l))
                        : [...existing, updated];
                      setEditData({ ...editData, eyeColor: newEyeColor });
                    }}
                    onVisibilityChange={(visible) => {
                      const existing = editData.eyeColor || [];
                      const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                      const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                      const updated = { ...ld, networkVisible: visible };
                      const newEyeColor = locusIdx >= 0
                        ? existing.map((l, i) => (i === locusIdx ? updated : l))
                        : [...existing, updated];
                      setEditData({ ...editData, eyeColor: newEyeColor });
                    }}
                  />
                );
              })}
            </div>

          </div>}
        </SectionCard>
      )}

      {/* Health Genetics */}
      {loci.health && loci.health.length > 0 && (
        <SectionCard title={<CollapsibleTitle section="health" icon="🏥">Health Genetics</CollapsibleTitle>}>
          {!collapsedSections.has("health") && <div className="space-y-3">
            <div className="text-sm text-secondary mb-3">
              Record carrier status and health genetic markers.
            </div>

            {/* Common Health Tests */}
            <div className="grid grid-cols-1 gap-3">
              {loci.health.filter((l: any) => !l.breedSpecific).map((locusInfo: any) => {
                const locusData = editData.health?.find((l) => l.locus === locusInfo.locus);
                return (
                  <HealthLocusCard
                    key={locusInfo.locus}
                    locusInfo={locusInfo}
                    locusData={locusData}
                    mode={mode}
                    enableNetworkSharing={enableGeneticsSharing}
                    onStatusChange={(value) => {
                      const existing = editData.health || [];
                      const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                      const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                      const updated = { ...ld, genotype: value };
                      const newHealth = locusIdx >= 0
                        ? existing.map((l, i) => (i === locusIdx ? updated : l))
                        : [...existing, updated];
                      setEditData({ ...editData, health: newHealth });
                    }}
                    onVisibilityChange={(visible) => {
                      const existing = editData.health || [];
                      const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                      const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                      const updated = { ...ld, networkVisible: visible };
                      const newHealth = locusIdx >= 0
                        ? existing.map((l, i) => (i === locusIdx ? updated : l))
                        : [...existing, updated];
                      setEditData({ ...editData, health: newHealth });
                    }}
                  />
                );
              })}
            </div>

          </div>}
        </SectionCard>
      )}

      {/* Other Traits Genetics */}
      {loci.otherTraits && loci.otherTraits.length > 0 && (
        <SectionCard title={<CollapsibleTitle section="otherTraits" icon="🔬">Other Genetic Traits</CollapsibleTitle>}>
          {!collapsedSections.has("otherTraits") && <div className="space-y-3">
            <div className="text-sm text-secondary mb-3">
              Record additional genetic markers and traits.
            </div>

            <div className="grid grid-cols-1 gap-3">
              {loci.otherTraits.map((locusInfo) => {
                const locusData = editData.otherTraits?.find((l) => l.locus === locusInfo.locus);
                return (
                  <LocusCard
                    key={locusInfo.locus}
                    locusInfo={locusInfo}
                    locusData={locusData}
                    mode={mode}
                    enableNetworkSharing={enableGeneticsSharing}
                    onAllele1Change={(value) => {
                      const existing = editData.otherTraits || [];
                      const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                      const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                      const updated = { ...ld, allele1: value };
                      updated.genotype = `${updated.allele1 || "?"}/${updated.allele2 || "?"}`;
                      const newOtherTraits = locusIdx >= 0
                        ? existing.map((l, i) => (i === locusIdx ? updated : l))
                        : [...existing, updated];
                      setEditData({ ...editData, otherTraits: newOtherTraits });
                    }}
                    onAllele2Change={(value) => {
                      const existing = editData.otherTraits || [];
                      const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                      const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                      const updated = { ...ld, allele2: value };
                      updated.genotype = `${updated.allele1 || "?"}/${updated.allele2 || "?"}`;
                      const newOtherTraits = locusIdx >= 0
                        ? existing.map((l, i) => (i === locusIdx ? updated : l))
                        : [...existing, updated];
                      setEditData({ ...editData, otherTraits: newOtherTraits });
                    }}
                    onVisibilityChange={(visible) => {
                      const existing = editData.otherTraits || [];
                      const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                      const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                      const updated = { ...ld, networkVisible: visible };
                      const newOtherTraits = locusIdx >= 0
                        ? existing.map((l, i) => (i === locusIdx ? updated : l))
                        : [...existing, updated];
                      setEditData({ ...editData, otherTraits: newOtherTraits });
                    }}
                  />
                );
              })}
            </div>
          </div>}
        </SectionCard>
      )}

      {/* Breed-Specific Markers - Consolidated Section */}
      {(() => {
        // Get detected breeds from composition for filtering
        const detectedBreeds = (editData.breedComposition || [])
          .map((bc) => bc.breed.toLowerCase())
          .filter((b) => b.length > 0);

        // Helper to check if a marker matches any detected breed
        const matchesDetectedBreed = (breedSpecific: string) => {
          if (detectedBreeds.length === 0) return true; // Show all if no breeds detected
          const breedList = breedSpecific.toLowerCase();
          return detectedBreeds.some((detected) => breedList.includes(detected) || detected.includes(breedList.split(",")[0].trim()));
        };

        const allBreedSpecificCoatColor = loci.coatColor.filter((l: any) => l.breedSpecific);
        const allBreedSpecificCoatType = (loci.coatType || []).filter((l: any) => l.breedSpecific);
        const allBreedSpecificPhysical = (loci.physicalTraits || []).filter((l: any) => l.breedSpecific);
        const allBreedSpecificEyeColor = (loci.eyeColor || []).filter((l: any) => l.breedSpecific);
        const allBreedSpecificHealth = (loci.health || []).filter((l: any) => l.breedSpecific);

        // Filter to relevant breeds if we have breed composition data
        const breedSpecificCoatColor = allBreedSpecificCoatColor.filter((l: any) => matchesDetectedBreed(l.breedSpecific));
        const breedSpecificCoatType = allBreedSpecificCoatType.filter((l: any) => matchesDetectedBreed(l.breedSpecific));
        const breedSpecificPhysical = allBreedSpecificPhysical.filter((l: any) => matchesDetectedBreed(l.breedSpecific));
        const breedSpecificEyeColor = allBreedSpecificEyeColor.filter((l: any) => matchesDetectedBreed(l.breedSpecific));
        const breedSpecificHealth = allBreedSpecificHealth.filter((l: any) => matchesDetectedBreed(l.breedSpecific));

        const totalBreedSpecific = breedSpecificCoatColor.length + breedSpecificCoatType.length +
          breedSpecificPhysical.length + breedSpecificEyeColor.length + breedSpecificHealth.length;
        const totalAllBreedSpecific = allBreedSpecificCoatColor.length + allBreedSpecificCoatType.length +
          allBreedSpecificPhysical.length + allBreedSpecificEyeColor.length + allBreedSpecificHealth.length;

        if (totalAllBreedSpecific === 0) return null;

        const hasBreedFilter = detectedBreeds.length > 0;

        return (
          <SectionCard title={<CollapsibleTitle section="breedSpecific" icon="🏷️">Breed-Specific Markers ({hasBreedFilter ? `${totalBreedSpecific} relevant` : totalAllBreedSpecific})</CollapsibleTitle>}>
            {!collapsedSections.has("breedSpecific") && (
              <div className="space-y-4">
                {hasBreedFilter ? (
                  <div className="text-sm text-secondary">
                    Showing markers relevant to your dog's breed composition ({detectedBreeds.join(", ")}). {totalAllBreedSpecific - totalBreedSpecific} other breed-specific markers available.
                  </div>
                ) : (
                  <div className="text-sm text-secondary">
                    Add breed composition data above to filter to only relevant markers. Showing all {totalAllBreedSpecific} breed-specific markers.
                  </div>
                )}

                {breedSpecificCoatColor.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">Coat Color ({breedSpecificCoatColor.length})</div>
                    <div className="grid grid-cols-1 gap-3">
                      {breedSpecificCoatColor.map((locusInfo: any) => {
                        const locusData = editData.coatColor?.find((l) => l.locus === locusInfo.locus);
                        return (
                          <LocusCard
                            key={locusInfo.locus}
                            locusInfo={locusInfo}
                            locusData={locusData}
                            mode={mode}
                            enableNetworkSharing={enableGeneticsSharing}
                            onAllele1Change={(value) => {
                              const existing = editData.coatColor || [];
                              const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                              const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                              const updated = { ...ld, allele1: value };
                              updated.genotype = `${updated.allele1 || "?"}/${updated.allele2 || "?"}`;
                              const newCoatColor = locusIdx >= 0
                                ? existing.map((l, i) => (i === locusIdx ? updated : l))
                                : [...existing, updated];
                              setEditData({ ...editData, coatColor: newCoatColor });
                            }}
                            onAllele2Change={(value) => {
                              const existing = editData.coatColor || [];
                              const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                              const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                              const updated = { ...ld, allele2: value };
                              updated.genotype = `${updated.allele1 || "?"}/${updated.allele2 || "?"}`;
                              const newCoatColor = locusIdx >= 0
                                ? existing.map((l, i) => (i === locusIdx ? updated : l))
                                : [...existing, updated];
                              setEditData({ ...editData, coatColor: newCoatColor });
                            }}
                            onVisibilityChange={(visible) => {
                              const existing = editData.coatColor || [];
                              const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                              const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                              const updated = { ...ld, networkVisible: visible };
                              const newCoatColor = locusIdx >= 0
                                ? existing.map((l, i) => (i === locusIdx ? updated : l))
                                : [...existing, updated];
                              setEditData({ ...editData, coatColor: newCoatColor });
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {breedSpecificCoatType.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">Coat Type ({breedSpecificCoatType.length})</div>
                    <div className="grid grid-cols-1 gap-3">
                      {breedSpecificCoatType.map((locusInfo: any) => {
                        const locusData = editData.coatType?.find((l) => l.locus === locusInfo.locus);
                        return (
                          <LocusCard
                            key={locusInfo.locus}
                            locusInfo={locusInfo}
                            locusData={locusData}
                            mode={mode}
                            enableNetworkSharing={enableGeneticsSharing}
                            onAllele1Change={(value) => {
                              const existing = editData.coatType || [];
                              const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                              const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                              const updated = { ...ld, allele1: value };
                              updated.genotype = `${updated.allele1 || "?"}/${updated.allele2 || "?"}`;
                              const newCoatType = locusIdx >= 0
                                ? existing.map((l, i) => (i === locusIdx ? updated : l))
                                : [...existing, updated];
                              setEditData({ ...editData, coatType: newCoatType });
                            }}
                            onAllele2Change={(value) => {
                              const existing = editData.coatType || [];
                              const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                              const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                              const updated = { ...ld, allele2: value };
                              updated.genotype = `${updated.allele1 || "?"}/${updated.allele2 || "?"}`;
                              const newCoatType = locusIdx >= 0
                                ? existing.map((l, i) => (i === locusIdx ? updated : l))
                                : [...existing, updated];
                              setEditData({ ...editData, coatType: newCoatType });
                            }}
                            onVisibilityChange={(visible) => {
                              const existing = editData.coatType || [];
                              const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                              const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                              const updated = { ...ld, networkVisible: visible };
                              const newCoatType = locusIdx >= 0
                                ? existing.map((l, i) => (i === locusIdx ? updated : l))
                                : [...existing, updated];
                              setEditData({ ...editData, coatType: newCoatType });
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {breedSpecificHealth.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">Health ({breedSpecificHealth.length})</div>
                    <div className="grid grid-cols-1 gap-3">
                      {breedSpecificHealth.map((locusInfo: any) => {
                        const locusData = editData.health?.find((l) => l.locus === locusInfo.locus);
                        return (
                          <HealthLocusCard
                            key={locusInfo.locus}
                            locusInfo={locusInfo}
                            locusData={locusData}
                            mode={mode}
                            enableNetworkSharing={enableGeneticsSharing}
                            onStatusChange={(value) => {
                              const existing = editData.health || [];
                              const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                              const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                              const updated = { ...ld, status: value };
                              const newHealth = locusIdx >= 0
                                ? existing.map((l, i) => (i === locusIdx ? updated : l))
                                : [...existing, updated];
                              setEditData({ ...editData, health: newHealth });
                            }}
                            onVisibilityChange={(visible) => {
                              const existing = editData.health || [];
                              const locusIdx = existing.findIndex((l) => l.locus === locusInfo.locus);
                              const ld: GeneticLocus = locusIdx >= 0 ? existing[locusIdx] : { locus: locusInfo.locus, locusName: locusInfo.locusName };
                              const updated = { ...ld, networkVisible: visible };
                              const newHealth = locusIdx >= 0
                                ? existing.map((l, i) => (i === locusIdx ? updated : l))
                                : [...existing, updated];
                              setEditData({ ...editData, health: newHealth });
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        );
      })()}

      {mode === "edit" && (
        <div className="flex justify-end gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditData(geneticData);
              onCancel?.();
            }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Genetics"}
          </Button>
        </div>
      )}
    </div>
  );
}

/** ────────────────────────────────────────────────────────────────────────
 * Health Tab — species-standardized trait fields with document linking
 * ─────────────────────────────────────────────────────────────────────── */
type TraitDraft = {
  value?: {
    boolean?: boolean;
    text?: string;
    number?: number;
    date?: string;
    json?: any;
  };
  marketplaceVisible?: boolean | null;
  networkVisible?: boolean | null;
  performedAt?: string | null;
  source?: string | null;
  jsonText?: string;
};

function HealthTab({
  animal,
  api,
  onDocumentsTabRequest,
  mode,
  onVaccinationAlertChange,
}: {
  animal: AnimalRow;
  api: any;
  onDocumentsTabRequest?: () => void;
  mode: "view" | "edit";
  onVaccinationAlertChange?: (state: VaccinationAlertState) => void;
}) {
  const [categories, setCategories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<{ status?: number; message?: string; code?: string } | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [uploadTraitKey, setUploadTraitKey] = React.useState<string | null>(null);
  const [expandedTraitKey, setExpandedTraitKey] = React.useState<string | null>(null);
  const [traitDrafts, setTraitDrafts] = React.useState<Record<string, TraitDraft>>({});
  const [collapsedCategories, setCollapsedCategories] = React.useState<Set<string>>(new Set());
  const [enableHealthSharing, setEnableHealthSharing] = React.useState(false);

  // Vaccination tracking state
  const [vaccinationRecords, setVaccinationRecords] = React.useState<VaccinationRecord[]>([]);
  const [vaccinationProtocols, setVaccinationProtocols] = React.useState<VaccinationProtocol[]>([]);
  const [vaccinationsLoading, setVaccinationsLoading] = React.useState(true);

  // Load privacy settings to check if health sharing is enabled
  React.useEffect(() => {
    api?.animals?.lineage?.getPrivacySettings(animal.id)
      .then((s: any) => setEnableHealthSharing(s.enableHealthSharing ?? false))
      .catch(() => {});
  }, [api, animal.id]);

  // Load vaccination protocols and records
  React.useEffect(() => {
    const loadVaccinations = async () => {
      setVaccinationsLoading(true);
      try {
        // Get protocols for this species (from static data)
        const protocols = getProtocolsForSpecies(animal.species || "DOG");
        setVaccinationProtocols(protocols);

        // Try to load existing records from API
        try {
          const data = await api?.animals?.vaccinations?.list(animal.id);
          setVaccinationRecords(data?.records || []);
        } catch {
          // API may not be implemented yet - use empty array
          setVaccinationRecords([]);
        }
      } catch (err) {
        console.error("[HealthTab] Failed to load vaccinations", err);
        setVaccinationRecords([]);
      } finally {
        setVaccinationsLoading(false);
      }
    };
    loadVaccinations();
  }, [api, animal.id, animal.species]);

  // Vaccination handlers
  const handleCreateVaccination = async (input: CreateVaccinationInput) => {
    try {
      await api?.animals?.vaccinations?.create(animal.id, input);
      // Refresh records
      const data = await api?.animals?.vaccinations?.list(animal.id);
      setVaccinationRecords(data?.records || []);
      toast.success("Vaccination record added");
    } catch (err: any) {
      console.error("[HealthTab] Create vaccination failed", err);
      toast.error(err?.data?.message || "Failed to add vaccination record");
      throw err;
    }
  };

  const handleUpdateVaccination = async (recordId: number, input: Partial<CreateVaccinationInput>) => {
    try {
      await api?.animals?.vaccinations?.update(animal.id, recordId, input);
      // Refresh records
      const data = await api?.animals?.vaccinations?.list(animal.id);
      setVaccinationRecords(data?.records || []);
      toast.success("Vaccination record updated");
    } catch (err: any) {
      console.error("[HealthTab] Update vaccination failed", err);
      toast.error(err?.data?.message || "Failed to update vaccination record");
      throw err;
    }
  };

  const handleDeleteVaccination = async (recordId: number) => {
    try {
      await api?.animals?.vaccinations?.remove(animal.id, recordId);
      // Refresh records
      const data = await api?.animals?.vaccinations?.list(animal.id);
      setVaccinationRecords(data?.records || []);
      toast.success("Vaccination record deleted");
    } catch (err: any) {
      console.error("[HealthTab] Delete vaccination failed", err);
      toast.error(err?.data?.message || "Failed to delete vaccination record");
      throw err;
    }
  };

  const getTraitDraftKey = React.useCallback((trait: any) => {
    const raw = trait?.traitKey ?? trait?.traitValueId ?? "";
    return String(raw);
  }, []);

  const ensureTraitDraft = React.useCallback((trait: any) => {
    const key = getTraitDraftKey(trait);
    setTraitDrafts((prev) => {
      if (prev[key]) return prev;
      const baseValue =
        trait.value && typeof trait.value === "object" ? { ...trait.value } : undefined;
      let clonedJson = baseValue?.json;
      if (clonedJson && typeof clonedJson === "object") {
        try {
          clonedJson = JSON.parse(JSON.stringify(clonedJson));
        } catch {
        }
      }
      const nextValue = baseValue
        ? { ...baseValue, ...(clonedJson !== baseValue?.json ? { json: clonedJson } : {}) }
        : undefined;
      const nextDraft: TraitDraft = {
        value: nextValue,
        marketplaceVisible: trait.marketplaceVisible,
        networkVisible: trait.networkVisible,
        performedAt: trait.performedAt,
        source: trait.source,
      };
      const valueType = String(trait.valueType || "").toUpperCase();
      const isJsonValue = valueType.includes("JSON") || valueType === "OBJECT";
      if (isJsonValue && trait.traitKey !== "dog.hips.pennhip") {
        nextDraft.jsonText =
          trait.value?.json !== undefined
            ? JSON.stringify(trait.value.json, null, 2)
            : "";
      }
      return { ...prev, [key]: nextDraft };
    });
    return key;
  }, [getTraitDraftKey]);

  const updateTraitDraft = React.useCallback((key: string, updater: TraitDraft | ((d: TraitDraft) => TraitDraft)) => {
    setTraitDrafts((prev) => {
      const current = prev[key] ?? {};
      const next = typeof updater === "function" ? (updater as (d: TraitDraft) => TraitDraft)(current) : updater;
      if (next === current) return prev;
      return { ...prev, [key]: next };
    });
  }, []);

  const clearTraitDraft = React.useCallback((key: string) => {
    setTraitDrafts((prev) => {
      if (!(key in prev)) return prev;
      const { [key]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const fetchTraits = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api?.animals?.traits?.list(animal.id);

      // Filter out non-health traits (microchip, registry numbers) but keep all categories
      // Categories must render even when every trait is "Not provided"
      const filteredCategories = (data?.categories || []).map((cat: any) => ({
        ...cat,
        items: (cat.items || []).filter((t: any) => {
          const key = t.traitKey || "";
          // Exclude identity traits (*.id.* and *.registry.*)
          return !key.includes(".id.") && !key.includes(".registry.");
        }),
      }));

      setCategories(filteredCategories);
      setCollapsedCategories((prev) => {
        if (prev.size > 0) return prev;
        return new Set(filteredCategories.map((cat: any) => String(cat.category || "")).filter(Boolean));
      });
    } catch (err: any) {
      console.error("[HealthTab] Failed to load traits", err);
      setError({
        status: err?.status,
        message: err?.data?.message || err?.message || "Failed to load health data",
        code: err?.data?.code,
      });
    } finally {
      setLoading(false);
    }
  }, [api, animal.id]);

  React.useEffect(() => {
    fetchTraits();
    // When switching to view mode, collapse any expanded row
    if (mode === "view") {
      setExpandedTraitKey(null);
      setTraitDrafts({});
    }
  }, [fetchTraits, mode]);

  const handleSaveTrait = async (traitKey: string, draftKey: string, update: any) => {
    try {
      await api?.animals?.traits?.update(animal.id, [{ traitKey, ...update }]);
      toast.success("Trait saved");
      clearTraitDraft(draftKey);
      await fetchTraits();
    } catch (err: any) {
      console.error("[HealthTab] Save failed", err);
      toast.error(err?.data?.message || "Failed to save trait");
    }
  };

  const handleVisibilityToggle = async (traitKey: string, networkVisible: boolean) => {
    try {
      // Find the existing trait data to include required fields
      let existingTrait: any = null;
      for (const cat of categories) {
        const found = cat.items?.find((t: any) => t.traitKey === traitKey);
        if (found) {
          existingTrait = found;
          break;
        }
      }

      // Build update payload with existing values + new visibility
      const updatePayload: any = { traitKey, networkVisible };
      if (existingTrait) {
        // Include the existing value fields so API validation passes
        if (existingTrait.valueText !== undefined) updatePayload.valueText = existingTrait.valueText;
        if (existingTrait.valueDate !== undefined) updatePayload.valueDate = existingTrait.valueDate;
        if (existingTrait.valueNumeric !== undefined) updatePayload.valueNumeric = existingTrait.valueNumeric;
        if (existingTrait.valueBool !== undefined) updatePayload.valueBool = existingTrait.valueBool;
      }

      await api?.animals?.traits?.update(animal.id, [updatePayload]);
      await fetchTraits();
    } catch (err: any) {
      console.error("[HealthTab] Visibility toggle failed", err);
      toast.error(err?.data?.message || "Failed to update visibility");
    }
  };

  const handleUploadFromTrait = (traitKey: string) => {
    setUploadTraitKey(traitKey);
    setUploadModalOpen(true);
  };

  const handleUploadSubmit = async (payload: any) => {
    try {
      if (uploadTraitKey) {
        await api?.animals?.documents?.uploadForTrait(animal.id, uploadTraitKey, payload);
      }
      toast.success("Document uploaded");
      setUploadModalOpen(false);
      setUploadTraitKey(null);
      await fetchTraits();
    } catch (err: any) {
      console.error("[HealthTab] Upload failed", err);
      toast.error(err?.data?.message || "Failed to upload document");
    }
  };

  // Loading state with skeleton rows
  if (loading) {
    const skeletonCategories = ["Orthopedic", "Eyes", "Cardiac", "Infectious", "Reproductive", "General"];
    return (
      <div className="space-y-3">
        {skeletonCategories.map((cat) => (
          <SectionCard key={cat} title={cat}>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-4 bg-subtle rounded w-1/3"></div>
                  <div className="h-8 bg-subtle rounded flex-1"></div>
                </div>
              ))}
            </div>
          </SectionCard>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-3">
        <SectionCard title="Health">
          <div className="space-y-3">
            <div className="text-sm text-secondary">
              Failed to load health traits.
            </div>
            {error.status && (
              <div className="text-xs text-secondary">
                Status: {error.status}
                {error.code && ` | Code: ${error.code}`}
              </div>
            )}
            {error.message && (
              <div className="text-xs text-secondary">
                {error.message}
              </div>
            )}
            <button
              onClick={fetchTraits}
              className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary-dark"
            >
              Retry
            </button>
          </div>
        </SectionCard>
      </div>
    );
  }

  // Empty state - only show when NO trait definitions exist for this species
  // Categories with all "Not provided" traits should still render
  if (!categories || categories.length === 0) {
    return (
      <div className="space-y-3">
        <SectionCard title="Health">
          <div className="text-sm text-secondary">
            No trait definitions found for this species ({animal.species}).
          </div>
        </SectionCard>
      </div>
    );
  }

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {/* Helper Notice - at the very top */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
        <div className="flex items-start gap-2">
          <span className="text-blue-600">💡</span>
          <div className="text-sm">
            <div className="font-medium text-blue-700 mb-1">Health Screening & Medical Records</div>
            <div className="text-secondary">
              Record health clearances, test results, and medical conditions here. For detailed genetic breeding data (specific alleles like ay/at, B/B), use the <span className="font-semibold">Genetics tab</span>.
            </div>
          </div>
        </div>
      </div>

      {/* Vaccination Tracker - Date-based vaccination tracking */}
      {vaccinationProtocols.length > 0 && (
        <VaccinationTracker
          animalId={animal.id}
          animalName={animal.nickname || animal.name || "this animal"}
          species={animal.species || "DOG"}
          protocols={vaccinationProtocols}
          records={vaccinationRecords}
          editMode={mode === "edit"}
          onCreate={handleCreateVaccination}
          onUpdate={handleUpdateVaccination}
          onDelete={handleDeleteVaccination}
          loading={vaccinationsLoading}
          onAlertStateChange={onVaccinationAlertChange}
        />
      )}

      {categories
        .filter((cat: any) => cat.category !== "Genetic") // Genetic DNA results now go in Genetics tab
        .sort((a: any, b: any) => {
          // Put "General" first
          if (a.category === "General") return -1;
          if (b.category === "General") return 1;
          return 0;
        })
        .map((cat: any) => {
        const items = cat.items || [];
        // Render all categories from definitions, even when empty (shows "0 of 0 provided")

        const isCollapsed = collapsedCategories.has(cat.category);
        const completedCount = items.filter((t: any) => {
          const hasValue = t.value?.boolean !== undefined ||
                          t.value?.text ||
                          t.value?.number !== undefined ||
                          t.value?.date ||
                          t.value?.json;
          return hasValue;
        }).length;

        return (
          <div
            key={cat.category}
            className="rounded-xl bg-surface p-3 border border-hairline"
          >
            {/* Custom header without animated underline */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleCategory(cat.category)}
                  className="hover:opacity-80 transition-opacity -ml-1"
                  aria-label={isCollapsed ? "Expand category" : "Collapse category"}
                >
                  <svg
                    className="w-4 h-4 transition-transform duration-200 text-secondary"
                    style={{
                      transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)",
                      transformOrigin: "center",
                      transformBox: "fill-box",
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <span className="font-semibold text-sm">
                  {cat.category}
                </span>
              </div>
              <span className="text-xs text-secondary font-normal">
                {completedCount} of {items.length} provided
              </span>
            </div>
            {!isCollapsed && (
              <div className="space-y-2">
                {items.map((trait: any) => {
                  const draftKey = getTraitDraftKey(trait);
                  return (
                    <TraitRow
                      key={trait.traitKey}
                      trait={trait}
                      draft={traitDrafts[draftKey]}
                      isExpanded={expandedTraitKey === draftKey}
                      editMode={mode === "edit"}
                      enableNetworkSharing={enableHealthSharing}
                      onExpand={() => {
                        if (mode === "edit") {
                          const nextKey = ensureTraitDraft(trait);
                          setExpandedTraitKey(nextKey);
                        }
                      }}
                      onCollapse={() => setExpandedTraitKey(null)}
                      onDraftChange={(next) => updateTraitDraft(draftKey, next)}
                      onDraftReset={() => clearTraitDraft(draftKey)}
                      onSave={(update) => handleSaveTrait(trait.traitKey, draftKey, update)}
                      onUpload={() => handleUploadFromTrait(trait.traitKey)}
                      onVisibilityToggle={(networkVisible) => handleVisibilityToggle(trait.traitKey, networkVisible)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      {uploadModalOpen && (
        <DocumentUploadModal
          open={uploadModalOpen}
          onClose={() => {
            setUploadModalOpen(false);
            setUploadTraitKey(null);
          }}
          onSubmit={handleUploadSubmit}
          lockedTraitKey={uploadTraitKey}
        />
      )}
    </div>
  );
}

function humanizeTraitKey(key: string) {
  const last = String(key || "").split(".").pop() || "";
  if (!last) return "";
  const spaced = last.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatTraitDisplayName(displayName?: string, traitKey?: string) {
  const rawDisplayName = String(displayName || "").trim();
  const rawKey = String(traitKey || "").trim();
  if (rawDisplayName && !rawDisplayName.includes(".") && rawDisplayName !== rawKey) {
    return rawDisplayName;
  }
  if (rawKey) {
    const humanized = humanizeTraitKey(rawKey);
    return humanized || rawDisplayName || "Trait";
  }
  return rawDisplayName || "Trait";
}

function VisibilityToggle({
  isPublic,
  onChange,
  disabled,
  readOnly,
  inactive,
}: {
  isPublic: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  readOnly?: boolean;
  inactive?: boolean; // Master toggle is off - show greyed out "Private"
}) {
  // Inactive state: master toggle is off, show greyed-out indicator
  if (inactive) {
    return (
      <Tooltip content="Enable sharing in Privacy tab to configure" side="top">
        <span
          className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium bg-zinc-800/40 text-zinc-500/50 border border-zinc-700/30 cursor-help"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
          </svg>
          Private
        </span>
      </Tooltip>
    );
  }

  if (readOnly) {
    // Read-only display (non-edit mode)
    return (
      <span
        className={`
          inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium
          ${isPublic
            ? "bg-emerald-500/15 text-emerald-400"
            : "bg-red-500/15 text-red-400"
          }
        `}
      >
        {isPublic ? (
          <>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            Public
          </>
        ) : (
          <>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
            </svg>
            Private
          </>
        )}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange(!isPublic);
      }}
      disabled={disabled}
      className={`
        inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium transition-all
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${isPublic
          ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
          : "bg-red-500/15 text-red-400 hover:bg-red-500/25"
        }
      `}
    >
      {isPublic ? (
        <>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          Public
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
          </svg>
          Private
        </>
      )}
    </button>
  );
}

function TraitRow({
  trait,
  draft,
  isExpanded,
  editMode,
  enableNetworkSharing,
  onExpand,
  onCollapse,
  onSave,
  onUpload,
  onDraftChange,
  onDraftReset,
  onVisibilityToggle,
}: {
  trait: any;
  draft?: TraitDraft;
  isExpanded: boolean;
  editMode: boolean;
  enableNetworkSharing?: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onSave: (update: any) => void;
  onUpload: () => void;
  onDraftChange: (next: TraitDraft) => void;
  onDraftReset: () => void;
  onVisibilityToggle?: (networkVisible: boolean) => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const localDraft = draft ?? {};

  React.useEffect(() => {
    if (!isExpanded && draft) {
      onDraftReset();
    }
  }, [isExpanded, draft, onDraftReset]);

  const currentValue = localDraft.value !== undefined ? localDraft.value : trait.value;
  const currentMarketplace = localDraft.marketplaceVisible !== undefined
    ? localDraft.marketplaceVisible
    : trait.marketplaceVisible;
  const currentNetworkVisible = localDraft.networkVisible !== undefined
    ? localDraft.networkVisible
    : trait.networkVisible;
  const currentPerformedAt = localDraft.performedAt !== undefined
    ? localDraft.performedAt
    : trait.performedAt;
  const currentSource = localDraft.source !== undefined ? localDraft.source : trait.source;
  const valueType = String(trait.valueType || "").toUpperCase();
  const isPennHip = trait.traitKey === "dog.hips.pennhip";
  const isBoolean = valueType === "BOOLEAN" || valueType === "BOOL";
  const isEnum = valueType === "ENUM";
  const isNumber = valueType === "NUMBER";
  const isDate = valueType === "DATE";
  const isText = valueType === "TEXT";
  const isJsonValue =
    valueType.includes("JSON") || valueType === "OBJECT" || trait.value?.json !== undefined;
  const booleanLabel = trait.displayName?.toLowerCase().includes("completed") ? "Completed" : "Yes";
  const displayName = formatTraitDisplayName(trait.displayName, trait.traitKey);

  const handleSave = async () => {
    setSaving(true);
    try {
      const update: any = {};

      if (isJsonValue && !isPennHip) {
        const hasJsonSource =
          localDraft.jsonText !== undefined ||
          trait.value?.json !== undefined ||
          currentValue?.json !== undefined;
        if (hasJsonSource) {
          const jsonText =
            localDraft.jsonText ??
            (trait.value?.json !== undefined
              ? JSON.stringify(trait.value.json, null, 2)
              : currentValue?.json !== undefined
                ? JSON.stringify(currentValue.json, null, 2)
                : "");
          if (!jsonText.trim()) {
            update.value = { json: null };
          } else {
            try {
              update.value = { json: JSON.parse(jsonText) };
            } catch {
              toast.error("Invalid JSON format");
              return false;
            }
          }
        }
      } else if (isPennHip && currentValue?.json !== undefined) {
        update.value = { json: currentValue.json };
      } else if (isBoolean && currentValue?.boolean !== undefined) {
        update.value = { boolean: currentValue.boolean };
      } else if (isText && currentValue?.text !== undefined) {
        update.value = { text: currentValue.text };
      } else if (isNumber && currentValue?.number !== undefined) {
        update.value = { number: currentValue.number };
      } else if (isDate && currentValue?.date !== undefined) {
        update.value = { date: currentValue.date };
      } else if (isEnum && currentValue?.text !== undefined) {
        update.value = { text: currentValue.text };
      } else if (isJsonValue && currentValue?.json !== undefined) {
        update.value = { json: currentValue.json };
      }

      if (currentMarketplace !== undefined) update.marketplaceVisible = currentMarketplace;
      if (currentNetworkVisible !== undefined) update.networkVisible = currentNetworkVisible;
      if (currentPerformedAt !== undefined) update.performedAt = currentPerformedAt;
      if (currentSource !== undefined) update.source = currentSource;

      await onSave(update);
      return true;
    } finally {
      setSaving(false);
    }
  };

  const renderValueEditor = () => {
    if (isBoolean) {
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={currentValue?.boolean === true}
            onChange={(e) =>
              onDraftChange({
                ...localDraft,
                value: { boolean: e.target.checked },
              })
            }
            className="rounded border-hairline"
          />
          <span className="text-sm">{booleanLabel}</span>
        </label>
      );
    }

    if (isEnum) {
      return (
        <select
          value={currentValue?.text || ""}
          onChange={(e) =>
            onDraftChange({
              ...localDraft,
              value: { text: e.target.value },
            })
          }
          className="text-sm border border-hairline rounded px-2 py-1 bg-card text-inherit"
        >
          <option value="">Select...</option>
          {(trait.enumValues || []).map((opt: string) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    if (isNumber) {
      return (
        <Input
          type="number"
          size="sm"
          value={currentValue?.number ?? ""}
          onChange={(e) =>
            onDraftChange({
              ...localDraft,
              value: { number: parseFloat(e.target.value) || 0 },
            })
          }
          className="w-32"
        />
      );
    }

    if (isDate) {
      return (
        <DatePicker
          value={currentValue?.date?.slice(0, 10) || ""}
          onChange={(e) =>
            onDraftChange({
              ...localDraft,
              value: { date: e.currentTarget.value },
            })
          }
          className="w-40"
        />
      );
    }

    if (isPennHip) {
      const json = currentValue?.json || {};
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-secondary w-16">DI:</label>
            <Input
              type="number"
              size="sm"
              value={json.di ?? ""}
              onChange={(e) =>
                onDraftChange({
                  ...localDraft,
                  value: {
                    json: { ...json, di: parseFloat(e.target.value) || 0 },
                  },
                })
              }
              className="w-24"
              step="0.01"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-secondary w-16">Side:</label>
            <select
              value={json.side || ""}
              onChange={(e) =>
                onDraftChange({
                  ...localDraft,
                  value: { json: { ...json, side: e.target.value } },
                })
              }
              className="text-sm border border-hairline rounded px-2 py-1 bg-card text-inherit"
            >
              <option value="">Select...</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-secondary w-16">Notes:</label>
            <Input
              size="sm"
              value={json.notes || ""}
              onChange={(e) =>
                onDraftChange({
                  ...localDraft,
                  value: { json: { ...json, notes: e.target.value } },
                })
              }
              className="flex-1"
            />
          </div>
        </div>
      );
    }

    if (isJsonValue) {
      const jsonText =
        localDraft.jsonText ??
        (trait.value?.json !== undefined ? JSON.stringify(trait.value.json, null, 2) : "");
      return (
        <textarea
          className="w-full rounded border border-hairline bg-card px-2 py-2 text-sm text-inherit"
          rows={5}
          value={jsonText}
          onChange={(e) =>
            onDraftChange({
              ...localDraft,
              jsonText: (e.currentTarget as HTMLTextAreaElement).value,
            })
          }
        />
      );
    }

    if (isText) {
      return (
        <Input
          size="sm"
          value={currentValue?.text || ""}
          onChange={(e) =>
            onDraftChange({
              ...localDraft,
              value: { text: e.target.value },
            })
          }
          className="w-full"
        />
      );
    }

    return <div className="text-xs text-secondary">Unsupported type</div>;
  };

  const showValueLabel = !isBoolean;
  const valueLabel = isJsonValue && !isPennHip ? "Details" : "Value";

  // Helper to format value for display (returns null if no value)
  const getDisplayValue = (): string | null => {
    if (isPennHip) {
      const json = trait.value?.json;
      if (!json || json.di === undefined) return null;
      const sideLabel = json.side ? ` (${json.side})` : "";
      const notesLabel = json.notes ? " (notes)" : "";
      return `DI: ${json.di}${sideLabel}${notesLabel}`;
    }
    if (isBoolean) {
      if (trait.value?.boolean === undefined) return null;
      return trait.value.boolean ? "Yes" : "No";
    }
    if (isText || isEnum) {
      return trait.value?.text || null;
    }
    if (isNumber) {
      return trait.value?.number !== undefined ? String(trait.value.number) : null;
    }
    if (isDate) {
      return trait.value?.date ? new Date(trait.value.date).toLocaleDateString() : null;
    }
    if (isJsonValue || trait.value?.json !== undefined) {
      return trait.value?.json != null ? "Provided" : null;
    }
    return null;
  };

  const hasValue = trait.value?.boolean !== undefined ||
                   trait.value?.text ||
                   trait.value?.number !== undefined ||
                   trait.value?.date ||
                   trait.value?.json;

  // COLLAPSED STATE (default)
  if (!isExpanded) {
    const displayValue = getDisplayValue();
    return (
      <div className="flex items-center justify-between py-2 px-3 hover:bg-subtle rounded group">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{displayName}</span>
              {!displayValue && (
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Pending
                </span>
              )}
            </div>
            {displayValue && (
              <div className="text-xs text-secondary truncate">{displayValue}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {trait.documents && trait.documents.length > 0 && (
              <span className="text-xs text-secondary" title={`${trait.documents.length} document(s)`}>
                {trait.documents.length} doc{trait.documents.length > 1 ? 's' : ''}
              </span>
            )}
            {/* Edit button (pencil icon) - before visibility toggle */}
            {editMode && (
              <button
                onClick={onExpand}
                className="p-1.5 rounded hover:bg-white/10 text-secondary hover:text-primary transition-colors"
                title="Edit"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
            {/* Network visibility toggle - always show, greyed out when master toggle is off */}
            {onVisibilityToggle ? (
              <VisibilityToggle
                isPublic={trait.networkVisible || false}
                onChange={onVisibilityToggle}
                disabled={!editMode}
                readOnly={!editMode}
                inactive={!enableNetworkSharing}
              />
            ) : (
              <VisibilityToggle
                isPublic={false}
                onChange={() => {}}
                inactive={true}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // EXPANDED STATE (editing)
  return (
    <div className="border border-hairline rounded-lg p-4 bg-subtle">
      <div className="mb-4">
        <div className="font-medium text-sm">{displayName}</div>
      </div>

      <div className="space-y-4">
        {/* Value Editor */}
        <div>
          {showValueLabel && (
            <label className="text-xs font-medium text-secondary block mb-2">
              {valueLabel}
            </label>
          )}
          {renderValueEditor()}
        </div>

        {/* Visibility - only show if network sharing is enabled in Privacy tab */}
        {enableNetworkSharing && (
          <div className="border-t border-hairline pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-secondary">Visibility</div>
              <VisibilityToggle
                isPublic={currentNetworkVisible || false}
                inactive={false}
                readOnly={false}
                onClick={() =>
                  onDraftChange({
                    ...localDraft,
                    networkVisible: !currentNetworkVisible,
                  })
                }
              />
            </div>
          </div>
        )}

        {/* Performed Date & Source */}
        <div className="border-t border-hairline pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-secondary block mb-1">Performed Date</label>
              <DatePicker
                value={currentPerformedAt?.slice(0, 10) || ""}
                onChange={(e) =>
                  onDraftChange({
                    ...localDraft,
                    performedAt: e.currentTarget.value,
                  })
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-secondary block mb-1">Source</label>
              <select
                value={currentSource || ""}
                onChange={(e) =>
                  onDraftChange({
                    ...localDraft,
                    source: e.target.value,
                  })
                }
                className="text-sm border border-hairline rounded px-2 py-1.5 w-full bg-card text-inherit"
              >
                <option value="">Select source...</option>
                <option value="BREEDER_ENTERED">Breeder</option>
                <option value="VETERINARY_RECORD">Vet</option>
                <option value="LAB_RESULT">Lab</option>
                <option value="REGISTRY_DATA">Registry</option>
              </select>
            </div>
          </div>
        </div>

        {/* Evidence / Documents */}
        <div className="border-t border-hairline pt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-secondary">Evidence</label>
            <Button size="sm" variant="outline" onClick={onUpload}>
              Upload Document
            </Button>
          </div>

          {trait.documents && trait.documents.length > 0 ? (
            <div className="space-y-2">
              {trait.documents.map((doc: any) => (
                <div
                  key={doc.documentId}
                  className="flex items-center justify-between gap-2 rounded border border-hairline px-3 py-2 text-xs bg-surface text-inherit"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{doc.title}</div>
                    <div className="text-secondary flex items-center gap-2 mt-0.5">
                      <span>{doc.visibility}</span>
                      {doc.status && <span>• {doc.status}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-secondary">No documents uploaded</div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-hairline">
          <Button
            size="sm"
            variant="primary"
            onClick={async () => {
              const didSave = await handleSave();
              if (didSave) onCollapse();
            }}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onDraftReset();
              onCollapse();
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

/** ────────────────────────────────────────────────────────────────────────
 * Documents Tab — list animal documents with trait linking
 * ─────────────────────────────────────────────────────────────────────── */
function DocumentsTab({
  animal,
  api,
  onHealthTabRequest,
}: {
  animal: AnimalRow;
  api: any;
  onHealthTabRequest?: (traitKey?: string) => void;
}) {
  const [documents, setDocuments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<{ status?: number; message?: string; code?: string } | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<number | null>(null);
  const [allTraits, setAllTraits] = React.useState<any[]>([]);
  const [enableDocumentSharing, setEnableDocumentSharing] = React.useState(false);

  // Load privacy settings to check if document sharing is enabled
  React.useEffect(() => {
    api?.animals?.lineage?.getPrivacySettings(animal.id)
      .then((s: any) => setEnableDocumentSharing(s.enableDocumentSharing ?? false))
      .catch(() => {});
  }, [api, animal.id]);

  const fetchDocuments = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api?.animals?.documents?.list(animal.id);
      setDocuments(data?.documents || []);
    } catch (err: any) {
      console.error("[DocumentsTab] Failed to load documents", err);
      setError({
        status: err?.status,
        message: err?.data?.message || err?.message || "Failed to load documents",
        code: err?.data?.code,
      });
    } finally {
      setLoading(false);
    }
  }, [api, animal.id]);

  const fetchTraits = React.useCallback(async () => {
    try {
      const data = await api?.animals?.traits?.list(animal.id);
      const flatTraits: any[] = [];
      (data?.categories || []).forEach((cat: any) => {
        (cat.items || []).forEach((t: any) => {
          flatTraits.push({
            traitKey: t.traitKey,
            displayName: formatTraitDisplayName(t.displayName, t.traitKey),
            category: cat.category,
          });
        });
      });
      setAllTraits(flatTraits);
    } catch (err) {
      console.error("[DocumentsTab] Failed to load traits", err);
    }
  }, [api, animal.id]);

  React.useEffect(() => {
    fetchDocuments();
    fetchTraits();
  }, [fetchDocuments, fetchTraits]);

  const handleUploadSubmit = async (payload: any) => {
    try {
      await api?.animals?.documents?.upload(animal.id, payload);
      toast.success("Document uploaded");
      setUploadModalOpen(false);
      await fetchDocuments();
    } catch (err: any) {
      console.error("[DocumentsTab] Upload failed", err);
      toast.error(err?.data?.message || "Failed to upload document");
    }
  };

  const handleDelete = async (documentId: number) => {
    try {
      await api?.animals?.documents?.remove(animal.id, documentId);
      toast.success("Document deleted");
      setDeleteConfirmId(null);
      await fetchDocuments();
    } catch (err: any) {
      console.error("[DocumentsTab] Delete failed", err);
      toast.error(err?.data?.message || "Failed to delete document");
    }
  };

  if (loading) {
    return <div className="p-4 text-sm text-secondary">Loading documents...</div>;
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-3">
        <SectionCard title="Documents">
          <div className="space-y-3">
            <div className="text-sm text-secondary">
              Failed to load documents.
            </div>
            {error.status && (
              <div className="text-xs text-secondary">
                Status: {error.status}
                {error.code && ` | Code: ${error.code}`}
              </div>
            )}
            {error.message && (
              <div className="text-xs text-secondary">
                {error.message}
              </div>
            )}
            <button
              onClick={fetchDocuments}
              className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary-dark"
            >
              Retry
            </button>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SectionCard
        title="Documents"
        right={
          <Button size="sm" variant="outline" onClick={() => setUploadModalOpen(true)}>
            Upload
          </Button>
        }
      >
        {documents.length === 0 ? (
          <div className="text-sm text-secondary">No documents uploaded yet</div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc: any) => (
              <div
                key={doc.documentId}
                className="border border-hairline rounded p-3 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{doc.title}</div>
                    <div className="text-xs text-secondary mt-1">
                      {doc.originalFileName} • {doc.mimeType}
                      {doc.sizeBytes && ` • ${(doc.sizeBytes / 1024).toFixed(1)} KB`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <VisibilityToggle
                      isPublic={doc.networkVisible || false}
                      onChange={async (visible) => {
                        try {
                          await api?.animals?.documents?.update(animal.id, doc.documentId, {
                            networkVisible: visible,
                          });
                          await fetchDocuments();
                        } catch (err) {
                          console.error("Failed to update document sharing", err);
                        }
                      }}
                      inactive={!enableDocumentSharing}
                    />
                    <button
                      onClick={() => setDeleteConfirmId(doc.documentId)}
                      className="text-secondary hover:text-primary text-xs"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded border border-hairline">
                    {doc.visibility}
                  </span>
                  {doc.status && (
                    <span className="px-2 py-0.5 rounded border border-hairline text-secondary">
                      {doc.status}
                    </span>
                  )}
                </div>
                {doc.linkedTraits && doc.linkedTraits.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-secondary">Linked to:</span>
                    {doc.linkedTraits.map((lt: any) => (
                      <button
                        key={lt.traitKey}
                        onClick={() => onHealthTabRequest?.(lt.traitKey)}
                        className="text-xs px-2 py-0.5 rounded border border-hairline hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        {formatTraitDisplayName(lt.displayName, lt.traitKey)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      {uploadModalOpen && (
        <DocumentUploadModal
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onSubmit={handleUploadSubmit}
          allTraits={allTraits}
        />
      )}
      {deleteConfirmId !== null && (
        <Dialog open={true} onOpenChange={() => setDeleteConfirmId(null)}>
          <div className="p-4 space-y-4">
            <div className="text-lg font-medium">Delete Document</div>
            <div className="text-sm">
              Are you sure you want to delete this document? This action cannot be undone.
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Delete
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

/** ────────────────────────────────────────────────────────────────────────
 * Document Upload Modal — shared between Health and Documents tabs
 * ─────────────────────────────────────────────────────────────────────── */
function DocumentUploadModal({
  open,
  onClose,
  onSubmit,
  lockedTraitKey,
  allTraits,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
  lockedTraitKey?: string | null;
  allTraits?: any[];
}) {
  const [title, setTitle] = React.useState("");
  const [originalFileName, setOriginalFileName] = React.useState("");
  const [mimeType, setMimeType] = React.useState("application/pdf");
  const [sizeBytes, setSizeBytes] = React.useState<number | undefined>(undefined);
  const [visibility, setVisibility] = React.useState("PRIVATE");
  const [selectedTraitKeys, setSelectedTraitKeys] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  const groupedTraits = React.useMemo(() => {
    if (!allTraits) return {};
    const groups: Record<string, any[]> = {};
    allTraits.forEach((t) => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    return groups;
  }, [allTraits]);

  const handleSubmit = async () => {
    if (!title.trim() || !originalFileName.trim()) {
      toast.error("Title and filename are required");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        title: title.trim(),
        originalFileName: originalFileName.trim(),
        mimeType,
        visibility,
      };
      if (sizeBytes) payload.sizeBytes = sizeBytes;
      if (!lockedTraitKey && selectedTraitKeys.length > 0) {
        payload.linkTraitKeys = selectedTraitKeys;
      }
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <div className="p-4 space-y-4 max-w-lg">
        <div className="text-lg font-medium">Upload Document</div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-secondary block mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Hip Dysplasia Report"
            />
          </div>
          <div>
            <label className="text-xs text-secondary block mb-1">
              Filename <span className="text-red-500">*</span>
            </label>
            <Input
              value={originalFileName}
              onChange={(e) => setOriginalFileName(e.target.value)}
              placeholder="hips-2024.pdf"
            />
          </div>
          <div>
            <label className="text-xs text-secondary block mb-1">MIME Type</label>
            <select
              value={mimeType}
              onChange={(e) => setMimeType(e.target.value)}
              className="w-full text-sm border border-hairline rounded px-2 py-2"
            >
              <option value="application/pdf">PDF</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG</option>
              <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">
                DOCX
              </option>
              <option value="text/plain">Text</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-secondary block mb-1">Size (bytes)</label>
            <Input
              type="number"
              value={sizeBytes ?? ""}
              onChange={(e) =>
                setSizeBytes(e.target.value ? parseInt(e.target.value) : undefined)
              }
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="text-xs text-secondary block mb-1">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full text-sm border border-hairline rounded px-2 py-2"
            >
              <option value="PRIVATE">Private</option>
              <option value="BUYERS">Buyers</option>
              <option value="PUBLIC">Public</option>
            </select>
          </div>
          {!lockedTraitKey && allTraits && allTraits.length > 0 && (
            <div>
              <label className="text-xs text-secondary block mb-1">
                Link to Traits (optional)
              </label>
              <div className="border border-hairline rounded p-2 max-h-48 overflow-y-auto space-y-2">
                {Object.entries(groupedTraits).map(([category, traits]) => (
                  <div key={category}>
                    <div className="text-xs font-medium text-secondary mb-1">
                      {category}
                    </div>
                    {traits.map((t: any) => (
                      <label
                        key={t.traitKey}
                        className="flex items-center gap-2 text-sm cursor-pointer py-0.5"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTraitKeys.includes(t.traitKey)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTraitKeys([...selectedTraitKeys, t.traitKey]);
                            } else {
                              setSelectedTraitKeys(
                                selectedTraitKeys.filter((k) => k !== t.traitKey)
                              );
                            }
                          }}
                          className="rounded border-hairline"
                        />
                        {formatTraitDisplayName(t.displayName, t.traitKey)}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          {lockedTraitKey && (
            <div className="text-xs text-secondary">
              This document will be linked to the selected trait.
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/** ────────────────────────────────────────────────────────────────────────
 * Registry Tab - Animal registry identifiers
 * ─────────────────────────────────────────────────────────────────────── */
function RegistryTab({
  animal,
  api,
  mode,
}: {
  animal: AnimalRow;
  api: any;
  mode: "view" | "edit";
}) {
  const [registrations, setRegistrations] = React.useState<any[]>([]);
  const [allRegistries, setAllRegistries] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingRegistries, setLoadingRegistries] = React.useState(false);
  const [registriesFetchError, setRegistriesFetchError] = React.useState<string | null>(null);
  const [error, setError] = React.useState<{ status?: number; message?: string; code?: string } | null>(null);
  const [expandedId, setExpandedId] = React.useState<number | "draft" | null>(null);
  const [drafts, setDrafts] = React.useState<Record<number | "draft", any>>({} as Record<number | "draft", any>);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<number | null>(null);

  const fetchRegistrations = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api?.animals?.registries?.list(animal.id);
      // CONTRACT TOLERANCE: Accept either 'items' (canonical) or 'registrations' (legacy).
      // Prefer 'items' if both exist for forward compatibility.
      const rows = data?.items || data?.registrations || [];
      setRegistrations(rows);
    } catch (err: any) {
      console.error("[RegistryTab] Failed to load registrations", err);
      setError({
        status: err?.status,
        message: err?.data?.message || err?.message || "Failed to load registrations",
        code: err?.data?.code,
      });
    } finally {
      setLoading(false);
    }
  }, [api, animal.id]);

  const fetchAllRegistries = React.useCallback(async () => {
    try {
      setLoadingRegistries(true);
      setRegistriesFetchError(null);
      const data = await api?.registries?.list({ species: animal.species });
      // CONTRACT TOLERANCE: Accept either 'items' (canonical) or 'registries' (legacy).
      // Prefer 'items' if both exist for forward compatibility.
      const rows = data?.items || data?.registries || [];
      setAllRegistries(rows);
      if (rows.length === 0) {
        setRegistriesFetchError("No registries available for this species");
      }
    } catch (err: any) {
      console.error("[RegistryTab] Failed to load registries", err);
      const msg = err?.data?.message || err?.message || "Failed to load registries";
      setRegistriesFetchError(msg);
      setAllRegistries([]);
    } finally {
      setLoadingRegistries(false);
    }
  }, [api, animal.species]);

  React.useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  React.useEffect(() => {
    // Fetch registries in both view and edit modes so we can display registry names
    fetchAllRegistries();
  }, [fetchAllRegistries]);

  const handleAddRegistration = () => {
    setExpandedId("draft");
    setDrafts({
      ...drafts,
      draft: {
        registryId: null,
        identifier: "",
        registrarOfRecord: "",
        issuedAt: "",
      },
    });
  };

  const handleSave = async (id: number | "draft") => {
    const draft = drafts[id];
    if (!draft) return;

    if (!draft.registryId || !draft.identifier?.trim()) {
      toast.error("Registry and registration number are required");
      return;
    }

    try {
      const payload = {
        registryId: draft.registryId,
        identifier: draft.identifier.trim(),
        registrarOfRecord: draft.registrarOfRecord?.trim() || null,
        issuedAt: draft.issuedAt || null,
      };

      if (id === "draft") {
        await api?.animals?.registries?.add(animal.id, payload);
        toast.success("Registration added");
      } else {
        await api?.animals?.registries?.update(animal.id, id, payload);
        toast.success("Registration updated");
      }

      setExpandedId(null);
      const nextDrafts = { ...drafts };
      delete nextDrafts[id];
      setDrafts(nextDrafts);
      await fetchRegistrations();
    } catch (err: any) {
      console.error("[RegistryTab] Save failed", err);
      toast.error(err?.data?.message || "Failed to save registration");
    }
  };

  const handleCancel = (id: number | "draft") => {
    setExpandedId(null);
    const nextDrafts = { ...drafts };
    delete nextDrafts[id];
    setDrafts(nextDrafts);
  };

  const handleEdit = (reg: any) => {
    setExpandedId(reg.id);
    setDrafts({
      ...drafts,
      [reg.id]: {
        registryId: reg.registryId,
        identifier: reg.identifier,
        registrarOfRecord: reg.registrarOfRecord || "",
        issuedAt: reg.issuedAt ? reg.issuedAt.slice(0, 10) : "",
      },
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await api?.animals?.registries?.remove(animal.id, id);
      toast.success("Registration deleted");
      setDeleteConfirmId(null);
      setExpandedId(null);
      const nextDrafts = { ...drafts };
      delete nextDrafts[id];
      setDrafts(nextDrafts);
      await fetchRegistrations();
    } catch (err: any) {
      console.error("[RegistryTab] Delete failed", err);
      toast.error(err?.data?.message || "Failed to delete registration");
    }
  };

  const updateDraft = (id: number | "draft", updates: any) => {
    setDrafts({
      ...drafts,
      [id]: { ...drafts[id], ...updates },
    });
  };

  if (loading) {
    return <div className="p-4 text-sm text-secondary">Loading registrations...</div>;
  }

  if (error) {
    return (
      <div className="space-y-3">
        <SectionCard title="Registrations">
          <div className="space-y-3">
            <div className="text-sm text-secondary">Failed to load registrations.</div>
            {error.status && (
              <div className="text-xs text-secondary">
                Status: {error.status}
                {error.code && ` | Code: ${error.code}`}
              </div>
            )}
            {error.message && <div className="text-xs text-secondary">{error.message}</div>}
            <button
              onClick={fetchRegistrations}
              className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary-dark"
            >
              Retry
            </button>
          </div>
        </SectionCard>
      </div>
    );
  }

  const allItems = [
    ...(expandedId === "draft" ? [{ id: "draft", isDraft: true }] : []),
    ...registrations,
  ];

  return (
    <div className="space-y-3">
      <SectionCard
        title="Registrations"
        right={
          mode === "edit" && expandedId !== "draft" ? (
            <Button size="sm" variant="outline" onClick={handleAddRegistration}>
              Add Registration
            </Button>
          ) : null
        }
      >
        {allItems.length === 0 ? (
          <div className="text-sm text-secondary">No registrations yet</div>
        ) : (
          <div className="space-y-3">
            {allItems.map((reg: any) => {
              const isExpanded = expandedId === reg.id;
              const draft = drafts[reg.id];
              const registry = allRegistries.find((r) => r.id === (draft?.registryId || reg.registryId));

              if (isExpanded && mode === "edit") {
                return (
                  <div key={reg.id} className="border border-hairline rounded p-3 space-y-3">
                    <div>
                      <label className="text-xs text-secondary block mb-1">
                        Registry <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={draft?.registryId || ""}
                        onChange={(e) => updateDraft(reg.id, { registryId: Number(e.target.value) })}
                        className="text-sm border border-hairline rounded px-2 py-1.5 w-full bg-card text-inherit"
                        disabled={loadingRegistries || !!registriesFetchError}
                      >
                        <option value="">
                          {loadingRegistries ? "Loading registries..." : "Select a registry"}
                        </option>
                        {allRegistries.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} {r.code ? `(${r.code})` : ""}
                          </option>
                        ))}
                      </select>
                      {loadingRegistries && (
                        <div className="text-xs text-secondary mt-1">Loading available registries...</div>
                      )}
                      {registriesFetchError && !loadingRegistries && (
                        <div className="text-xs text-red-500 mt-1 flex items-center gap-2">
                          {registriesFetchError}
                          <button
                            onClick={fetchAllRegistries}
                            className="text-xs text-primary hover:underline"
                          >
                            Retry
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs text-secondary block mb-1">
                        Registration Number <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={draft?.identifier || ""}
                        onChange={(e) => updateDraft(reg.id, { identifier: e.target.value })}
                        placeholder="ABC123456"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-secondary block mb-1">Registrar of Record</label>
                      <Input
                        value={draft?.registrarOfRecord || ""}
                        onChange={(e) => updateDraft(reg.id, { registrarOfRecord: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-secondary block mb-1">Issued Date</label>
                      <DatePicker
                        value={draft?.issuedAt || ""}
                        onChange={(e) => updateDraft(reg.id, { issuedAt: e.currentTarget.value })}
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleSave(reg.id)}
                        disabled={loadingRegistries || !!registriesFetchError || allRegistries.length === 0}
                      >
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleCancel(reg.id)}>
                        Cancel
                      </Button>
                      {!reg.isDraft && (
                        <button
                          onClick={() => setDeleteConfirmId(reg.id)}
                          className="ml-auto text-xs text-secondary hover:text-primary"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              if (reg.isDraft) return null;

              return (
                <div key={reg.id} className="border border-hairline rounded p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{registry?.name || "Unknown Registry"}</div>
                      <div className="text-sm text-secondary mt-1">
                        {reg.identifier}
                        {registry?.code && <span className="text-xs ml-2">({registry.code})</span>}
                      </div>
                      {reg.registrarOfRecord && (
                        <div className="text-xs text-secondary mt-1">Registrar: {reg.registrarOfRecord}</div>
                      )}
                      {reg.issuedAt && (
                        <div className="text-xs text-secondary mt-1">
                          Issued: {new Date(reg.issuedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {mode === "edit" && (
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(reg)}>
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {deleteConfirmId !== null && (
        <Dialog open={true} onOpenChange={() => setDeleteConfirmId(null)}>
          <div className="p-4 space-y-4">
            <div className="text-lg font-medium">Delete Registration</div>
            <div className="text-sm">
              Are you sure you want to delete this registration? This action cannot be undone.
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => handleDelete(deleteConfirmId)}>
                Delete
              </Button>
            </div>
          </div>
        </Dialog>
      )}
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
      } catch { }
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
    } catch { }
  }
  async function saveAvoid(next: PreferredPartner[]) {
    setAvoid(next);
    try {
      await api?.animals?.putAvoidPartners?.(animal.id, next);
    } catch { }
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
    window.dispatchEvent(
      new CustomEvent("bhq:module", {
        detail: { key: "animals", label: "Animals" },
      })
    );
  }, []);

  React.useEffect(() => {
    if (!getOverlayRoot()) {
      console.warn(
        "ColumnsPopover needs an overlay root. Add <div id='bhq-overlay-root'></div> to the shell."
      );
    }
  }, []);

  const api = React.useMemo(() => makeApi("/api/v1"), []);

  const photoInputRef = React.useRef<HTMLInputElement | null>(null);

  const syncOwners = React.useCallback(
    async (animalId: number, desired: OwnershipRow[] | undefined | null) => {
      const rows = Array.isArray(desired) ? desired : [];

      if (!rows.length) {
        try {
          const current = await api.animals.owners.list(animalId);
          const existing = Array.isArray((current as any)?.items)
            ? (current as any).items
            : [];
          for (const e of existing as any[]) {
            if (e?.id != null) {
              await api.animals.owners.remove(animalId, e.id);
            }
          }
        } catch {
        }
        return;
      }

      type NormalizedDesired = {
        partyId: number;
        percent: number;
        isPrimary: boolean;
      };

      type ExistingOwner = {
        id: number;
        partyId?: number | null;
        percent?: number | null;
        isPrimary?: boolean;
        is_primary?: boolean;
        primary?: boolean;
        party?: { id?: number | null } | null;
      };

      const normalizeDesired = (r: OwnershipRow): NormalizedDesired | null => {
        const partyIdRaw = r.partyId ?? (r as any).partyId ?? null;
        const partyId = Number.isFinite(Number(partyIdRaw))
          ? Number(partyIdRaw)
          : null;
        if (partyId == null) return null;
        const pct = typeof r.percent === "number" ? r.percent : 0;
        const isPrimary = !!r.is_primary;

        return {
          partyId,
          percent: pct,
          isPrimary,
        };
      };

      const keyExisting = (e: ExistingOwner): string => {
        const partyId =
          e.partyId ?? (e as any).party_id ?? e.party?.id ?? null;
        return partyId != null ? String(partyId) : "";
      };

      const keyDesired = (d: NormalizedDesired): string =>
        String(d.partyId);

      let existing: ExistingOwner[] = [];
      try {
        const current = await api.animals.owners.list(animalId);
        existing = Array.isArray((current as any)?.items)
          ? (current as any).items
          : [];
      } catch {
        existing = [];
      }

      const desiredNorm = rows
        .map(normalizeDesired)
        .filter((d): d is NormalizedDesired => !!d);

      if (!desiredNorm.length) {
        return;
      }

      const existingByKey = new Map<string, ExistingOwner>();
      for (const e of existing) {
        const key = keyExisting(e);
        if (key) existingByKey.set(key, e);
      }

      const desiredByKey = new Map<string, NormalizedDesired>();
      for (const d of desiredNorm) {
        desiredByKey.set(keyDesired(d), d);
      }

      for (const e of existing) {
        const key = keyExisting(e);
        if (key && !desiredByKey.has(key) && e.id != null) {
          try {
            await api.animals.owners.remove(animalId, e.id);
          } catch {
          }
        }
      }

      for (const d of desiredNorm) {
        const key = keyDesired(d);
        const e = existingByKey.get(key);

        const payload: {
          partyId: number;
          percent: number;
          isPrimary?: boolean;
        } = {
          partyId: d.partyId,
          percent: d.percent,
          isPrimary: d.isPrimary,
        };

        if (!e) {
          try {
            await api.animals.owners.add(animalId, payload as any);
          } catch {
          }
        } else {
          const patch: Partial<typeof payload> = {};
          const existingPercent =
            typeof e.percent === "number" ? e.percent : 0;
          const existingPrimary = !!(
            e.isPrimary ?? e.is_primary ?? e.primary
          );
          if (existingPercent !== d.percent) {
            patch.percent = d.percent;
          }
          if (existingPrimary !== d.isPrimary) {
            patch.isPrimary = d.isPrimary;
          }
          if (Object.keys(patch).length) {
            try {
              await api.animals.owners.update(animalId, e.id, patch as any);
            } catch {
            }
          }
        }
      }
    },
    [api]
  );

  const ownershipLookups = React.useMemo(
    () => ({
      async searchContacts(q: string) {
        const raw = (await api?.lookups?.searchContacts?.(q)) ?? [];
        const arr = Array.isArray(raw)
          ? raw
          : (raw as any)?.rows ?? (raw as any)?.items ?? [];

        return (arr as any[]).map((c) => {
          const partyIdRaw = c.partyId ?? c.party_id ?? c.id;
          const partyId = Number.isFinite(Number(partyIdRaw))
            ? Number(partyIdRaw)
            : null;
          const backing = c.backing ?? c.party?.backing ?? null;
          const contactId =
            backing?.contactId ?? c.contactId ?? c.contact_id ?? null;
          const nameFromNames = [c.first_name ?? c.firstName, c.last_name ?? c.lastName]
            .filter(Boolean)
            .join(" ");

          const name =
            c.display_name ??
            c.displayName ??
            (nameFromNames || undefined) ??
            c.name ??
            c.legal_name ??
            c.email ??
            "Unnamed contact";

          return {
            ...c,
            id: partyId ?? c.id,
            partyId,
            contactId,
            display_name: name,
            label: name,
            name,
            title: name,
            text: name,
          };
        });
      },

      async searchOrganizations(q: string) {
        const raw = (await api?.lookups?.searchOrganizations?.(q)) ?? [];
        const arr = Array.isArray(raw)
          ? raw
          : (raw as any)?.rows ?? (raw as any)?.items ?? [];

        return (arr as any[]).map((org) => {
          const partyIdRaw = org.partyId ?? org.party_id ?? org.id;
          const partyId = Number.isFinite(Number(partyIdRaw))
            ? Number(partyIdRaw)
            : null;
          const backing = org.backing ?? org.party?.backing ?? null;
          const organizationId =
            backing?.organizationId ??
            org.organizationId ??
            org.organization_id ??
            null;
          const name =
            org.display_name ??
            org.displayName ??
            org.legal_name ??
            org.name ??
            org.trade_name ??
            "Unnamed organization";

          return {
            ...org,
            id: partyId ?? org.id,
            partyId,
            organizationId,
            display_name: name,
            label: name,
            name,
            title: name,
            text: name,
          };
        });
      },
    }),
    [api]
  );

  const breedBrowseApi = React.useMemo(
    () => ({
      breeds: {
        listCanonical: (opts: {
          species: string;
          orgId?: number;
          limit?: number;
        }) => (api as any)?.breeds?.listCanonical?.(opts) ?? Promise.resolve([]),
      },
    }),
    [api]
  );

  const [orgIdForBreeds, setOrgIdForBreeds] = React.useState<number | null>(
    null
  );
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

  const [q, setQ] = React.useState(() => {
    try {
      return localStorage.getItem("bhq_animals_q_v1") || "";
    } catch {
      return "";
    }
  });

  // View mode toggle (table vs cards) - uses tenant preferences as default
  const { viewMode, setViewMode } = useViewMode({ module: "animals" });

  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<Record<string, string>>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("bhq_animals_filters_v1") || "{}"
      );
    } catch {
      return {};
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem("bhq_animals_q_v1", q);
    } catch {
    }
  }, [q]);
  React.useEffect(() => {
    try {
      localStorage.setItem(
        "bhq_animals_filters_v1",
        JSON.stringify(filters || {})
      );
    } catch {
    }
  }, [filters]);

  const [qDebounced, setQDebounced] = React.useState(q);
  React.useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const [rows, setRows] = React.useState<AnimalRow[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Vaccination alert state per animal (keyed by animal ID)
  const [vaccinationAlerts, setVaccinationAlerts] = React.useState<Record<number, VaccinationAlertState>>({});

  const handleVaccinationAlertChange = React.useCallback((animalId: number, state: VaccinationAlertState) => {
    setVaccinationAlerts((prev) => {
      // Only update if changed
      const existing = prev[animalId];
      if (existing?.expiredCount === state.expiredCount && existing?.dueSoonCount === state.dueSoonCount) {
        return prev;
      }
      return { ...prev, [animalId]: state };
    });
  }, []);

  const [pageSize, setPageSize] = React.useState<number>(25);
  const [page, setPage] = React.useState<number>(1);
  const [includeArchived, setIncludeArchived] = React.useState<boolean>(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.animals.list({
          q: qDebounced || undefined,
          page: 1,
          limit: 500,
          includeArchived,
        });
        const baseItems = res?.items || [];

        // Owners are fetched lazily when opening animal details, not on list load
        const items = baseItems.map(animalToRow);
        if (!cancelled) setRows(items);
      } catch (e: any) {
        console.error("[Animals] Error loading animals:", e);
        if (!cancelled)
          setError(
            e?.data?.error || e?.message || "Failed to load animals"
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, qDebounced, includeArchived]);

  // Sync animals to localStorage for cross-module data sharing (e.g., Contacts module)
  React.useEffect(() => {
    try {
      localStorage.setItem("bhq_animals", JSON.stringify(rows));
      // Dispatch event for cross-module reactivity
      window.dispatchEvent(new Event("bhq:animals:updated"));
    } catch (e) {
      console.error("[Animals] localStorage sync failed:", e);
    }
  }, [rows]);

  const { map, toggle, setAll, visible } = hooks.useColumns(
    COLUMNS,
    STORAGE_KEY
  );
  const visibleSafe = Array.isArray(visible) && visible.length
    ? visible
    : COLUMNS;

  const filterSchemaForFiltersRow = React.useMemo(() => {
    return buildRangeAwareSchema(
      visibleSafe.map((c) => ({ key: c.key, label: c.label })),
      ["dob", "created_at", "updated_at"]
    );
  }, [visibleSafe]);

  const displayRows = React.useMemo(() => {
    const active = Object.entries(filters || {}).filter(
      ([, v]) => (v ?? "") !== ""
    );
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
            return (r.tags || []).some((t) =>
              String(t).toLowerCase().includes(str)
            );
          }
          const raw = (r as any)[key];
          const isDate = DATE_KEYS.has(key as any);
          const hay = isDate && raw
            ? String(raw).slice(0, 10)
            : String(raw ?? "");
          return lc(hay).includes(lc(val));
        });
        if (!textOk) return false;

        const dobOk =
          dobFrom || dobTo ? inDateRange(r.dob, dobFrom, dobTo) : true;
        const createdOk =
          createdFrom || createdTo
            ? inDateRange(r.created_at, createdFrom, createdTo)
            : true;
        const updatedOk =
          updatedFrom || updatedTo
            ? inDateRange(r.updated_at, updatedFrom, updatedTo)
            : true;

        return dobOk && createdOk && updatedOk;
      });
    }

    return data;
  }, [rows, filters, qDebounced]);

  const [sorts, setSorts] = React.useState<
    Array<{ key: string; dir: "asc" | "desc" }>
  >([]);
  const onToggleSort = (key: string) => {
    setSorts((prev) => {
      const found = prev.find((s) => s.key === key);
      if (!found) return [{ key, dir: "asc" }];
      if (found.dir === "asc")
        return prev.map((s) =>
          s.key === key ? { ...s, dir: "desc" } : s
        );
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
        const cmp = String(av ?? "").localeCompare(
          String(bv ?? ""),
          undefined,
          { numeric: true, sensitivity: "base" }
        );
        if (cmp !== 0) return s.dir === "asc" ? cmp : -cmp;
      }
      return 0;
    });
    return out;
  }, [displayRows, sorts]);

  const pageCount = Math.max(
    1,
    Math.ceil(sortedRows.length / pageSize)
  );
  const clampedPage = Math.min(page, pageCount);
  const start =
    sortedRows.length === 0
      ? 0
      : (clampedPage - 1) * pageSize + 1;
  const end =
    sortedRows.length === 0
      ? 0
      : Math.min(
        sortedRows.length,
        (clampedPage - 1) * pageSize + pageSize
      );
  const pageRows = React.useMemo(() => {
    const from = (clampedPage - 1) * pageSize;
    const to = from + pageSize;
    return sortedRows.slice(from, to);
  }, [sortedRows, clampedPage, pageSize]);

  const [customBreedOpen, setCustomBreedOpen] = React.useState(false);
  const [customBreedSpecies, setCustomBreedSpecies] = React.useState<
    "DOG" | "CAT" | "HORSE"
  >("DOG");
  const [onCustomBreedCreated, setOnCustomBreedCreated] =
    React.useState<
      | ((
        c: {
          id: number;
          name: string;
          species: "DOG" | "CAT" | "HORSE";
        }
      ) => void)
      | null
    >(null);

  const animalSections = (
    mode: "view" | "edit",
    row: AnimalRow,
    setDraft: (p: Partial<AnimalRow>) => void
  ) => [
      /* leaving this helper defined, not used in new overview layout */
    ];

  function CustomBreedCombo({ /* unused in new overview, left here because rest of file references it in create modal */ ..._props }: any) {
    return null;
  }

  function Chip({ children }: { children: React.ReactNode }) {
    return (
      <span className="inline-flex items-center rounded-full border border-hairline px-2 py-0.5 text-xs text-primary">
        {children}
      </span>
    );
  }

  function HeaderBadges({ row }: { row: AnimalRow }) {
    const hasTitles = row.titlePrefix || row.titleSuffix;
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {hasTitles && (
          <span className="inline-flex items-center rounded-full bg-[hsl(var(--brand-orange))]/20 border border-[hsl(var(--brand-orange))]/30 px-2 py-0.5 text-xs text-[hsl(var(--brand-orange))] font-medium">
            🏆 {[row.titlePrefix, row.titleSuffix].filter(Boolean).join(" • ")}
          </span>
        )}
        {row.species && (
          <Chip>
            {row.species}
            {row.breed ? ` • ${row.breed}` : ""}
          </Chip>
        )}
        {row.sex && <Chip>{row.sex}</Chip>}
        <Chip>{row.status || "Active"}</Chip>
      </div>
    );
  }

  const [photoTargetId, setPhotoTargetId] = React.useState<number | null>(
    null
  );
  const [photoWorking, setPhotoWorking] = React.useState(false);

  const [photoEditorOpen, setPhotoEditorOpen] = React.useState(false);
  const [photoEditorSrc, setPhotoEditorSrc] = React.useState<string | null>(null);
  const [photoEditorForId, setPhotoEditorForId] = React.useState<number | null>(null);

  const [archiveDialogOpen, setArchiveDialogOpen] = React.useState(false);
  const [archiveTargetId, setArchiveTargetId] = React.useState<number | null>(null);
  const [isArchiving, setIsArchiving] = React.useState(false);

  // Overflow menu and delete state
  const [overflowMenuOpen, setOverflowMenuOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteTargetId, setDeleteTargetId] = React.useState<number | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  // Proactive delete eligibility check - keyed by animal ID
  const [deleteEligibility, setDeleteEligibility] = React.useState<Record<number, {
    canDelete: boolean;
    blockers: Record<string, boolean | string[] | undefined>;
    details?: Record<string, number | undefined>;
  } | null>>({});

  const handleArchive = React.useCallback(
    async (id: number) => {
      setIsArchiving(true);
      try {
        await api.animals.archive(id);
        setRows((prev) => prev.filter((r) => r.id !== id));
        toast.success("Animal archived successfully");
        setArchiveDialogOpen(false);

        // Close the details drawer by removing the id parameter from URL
        const url = new URL(window.location.href);
        url.searchParams.delete("id");
        url.searchParams.delete("animalId");
        window.history.replaceState({}, "", url.toString());
        // Notify drawer state to sync with URL change
        window.dispatchEvent(new Event("bhq:drawer-url-changed"));
      } catch (error) {
        console.error("Failed to archive animal:", error);
        toast.error("Failed to archive animal. Please try again.");
      } finally {
        setIsArchiving(false);
      }
    },
    [api]
  );

  // Fetch delete eligibility for an animal (called when entering edit mode)
  const fetchDeleteEligibility = React.useCallback(
    async (id: number) => {
      // Skip if already fetched
      if (deleteEligibility[id] !== undefined) return;

      try {
        const result = await api.animals.canDelete(id);
        setDeleteEligibility((prev) => ({
          ...prev,
          [id]: {
            canDelete: result.canDelete,
            blockers: result.blockers,
            details: result.details,
          },
        }));
      } catch (error) {
        console.error("[Animals] canDelete check failed", error);
        // If check fails, allow delete attempt (API will block if needed)
        setDeleteEligibility((prev) => ({
          ...prev,
          [id]: { canDelete: true, blockers: {} },
        }));
      }
    },
    [api, deleteEligibility]
  );

  // Build tooltip text for disabled delete button
  // Deletion only allowed for animals with essentially no real data (e.g., created by mistake)
  const getDeleteBlockerTooltip = React.useCallback((id: number) => {
    const eligibility = deleteEligibility[id];
    if (!eligibility || eligibility.canDelete) return null;

    const lines: string[] = [];
    const b = eligibility.blockers;
    const d = eligibility.details;
    // Lineage & relationships
    if (b.hasOffspring) lines.push(`Has ${d?.offspringCount ?? "some"} offspring`);
    if (b.isParentInPedigree) lines.push("Referenced as parent in pedigrees");
    if (b.hasLineageLinks) lines.push(`Linked to ${d?.lineageLinkCount ?? "some"} lineage record${(d?.lineageLinkCount ?? 0) !== 1 ? "s" : ""}`);
    if (b.hasCrossTenantLinks) lines.push(`Linked to ${d?.crossTenantLinkCount ?? "some"} external record${(d?.crossTenantLinkCount ?? 0) !== 1 ? "s" : ""}`);
    // Breeding & sales
    if (b.hasBreedingPlans) lines.push(`Has ${d?.breedingPlanCount ?? "some"} breeding plan${(d?.breedingPlanCount ?? 0) !== 1 ? "s" : ""}`);
    if (b.hasWaitlistEntries) lines.push(`Has ${d?.waitlistEntryCount ?? "some"} waitlist ${(d?.waitlistEntryCount ?? 0) !== 1 ? "entries" : "entry"}`);
    // Financial
    if (b.hasInvoices) lines.push(`Has ${d?.invoiceCount ?? "some"} invoice${(d?.invoiceCount ?? 0) !== 1 ? "s" : ""}`);
    if (b.hasPayments) lines.push(`Has ${d?.paymentCount ?? "some"} payment${(d?.paymentCount ?? 0) !== 1 ? "s" : ""}`);
    // Records & data
    if (b.hasDocuments) lines.push(`Has ${d?.documentCount ?? "some"} document${(d?.documentCount ?? 0) !== 1 ? "s" : ""}`);
    if (b.hasHealthRecords) lines.push(`Has ${d?.healthRecordCount ?? "some"} health record${(d?.healthRecordCount ?? 0) !== 1 ? "s" : ""}`);
    if (b.hasRegistrations) lines.push(`Has ${d?.registrationCount ?? "some"} registration${(d?.registrationCount ?? 0) !== 1 ? "s" : ""}`);
    if (b.hasTitles) lines.push(`Has ${d?.titleCount ?? "some"} title${(d?.titleCount ?? 0) !== 1 ? "s" : ""}`);
    if (b.hasCompetitions) lines.push(`Has ${d?.competitionCount ?? "some"} competition${(d?.competitionCount ?? 0) !== 1 ? "s" : ""}`);
    if (b.hasOwnershipHistory) lines.push(`Has ${d?.ownershipTransferCount ?? "some"} ownership transfer${(d?.ownershipTransferCount ?? 0) !== 1 ? "s" : ""}`);
    if (b.hasMedia) lines.push(`Has ${d?.mediaCount ?? "some"} media file${(d?.mediaCount ?? 0) !== 1 ? "s" : ""}`);
    // Marketplace
    if (b.hasPublicListing) lines.push("Has active marketplace listing");
    // Catch-all
    if (Array.isArray(b.other)) lines.push(...(b.other as string[]));
    return lines.length > 0 ? lines.join("\n") : "Cannot delete due to related records";
  }, [deleteEligibility]);

  const handleDelete = React.useCallback(
    async (id: number) => {
      setIsDeleting(true);
      try {
        await api.animals.remove(id);
        setRows((prev) => prev.filter((r) => r.id !== id));
        toast.success("Animal deleted successfully");
        setDeleteDialogOpen(false);

        // Close the details drawer by removing the id parameter from URL
        const url = new URL(window.location.href);
        url.searchParams.delete("id");
        url.searchParams.delete("animalId");
        window.history.replaceState({}, "", url.toString());
        // Notify drawer state to sync with URL change
        window.dispatchEvent(new Event("bhq:drawer-url-changed"));
      } catch (error) {
        console.error("Failed to delete animal:", error);
        toast.error("Failed to delete animal. Please try again.");
      } finally {
        setIsDeleting(false);
      }
    },
    [api]
  );

  const handleStartUploadPhoto = React.useCallback(
    (animalId: number) => {
      setPhotoEditorForId(animalId);
      setPhotoTargetId(animalId);

      // open file picker
      const input = photoInputRef.current;
      if (!input) return;

      // reset so selecting the same file twice still triggers onChange
      input.value = "";
      input.click();
    },
    []
  );


  const handlePhotoFileChange = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // If user picked a file without first choosing a target, bail safely
      if (photoTargetId == null && photoEditorForId == null) {
        e.target.value = "";
        return;
      }

      try {
        setPhotoWorking(true);

        // Load into editor (no server upload yet)
        const dataUrl = await fileToDataUrl(file);

        // Make sure modal is open and showing the newly picked file
        setPhotoEditorSrc(dataUrl);
        setPhotoEditorOpen(true);
      } catch (err) {
        console.error("[Animals] fileToDataUrl failed", err);
        toast.error("Could not load photo for editing. Please try again.");
      } finally {
        setPhotoWorking(false);
        e.target.value = "";
      }
    },
    [photoTargetId, photoEditorForId]
  );

  const handleRemovePhoto = React.useCallback(
    async (animalId: number) => {
      if (!api?.animals?.removePhoto) {
        console.warn("api.animals.removePhoto is not implemented");
        setRows((prev) =>
          prev.map((r) =>
            r.id === animalId ? { ...r, photoUrl: null } : r
          )
        );
        toast.info(
          "Photo cleared locally. Wire api.animals.removePhoto to persist on the server."
        );
        return;
      }

      try {
        setPhotoWorking(true);
        await api.animals.removePhoto(animalId);
        setRows((prev) =>
          prev.map((r) =>
            r.id === animalId ? { ...r, photoUrl: null } : r
          )
        );
        toast.success("Photo removed.");
      } catch (err) {
        console.error("[Animals] removePhoto failed", err);
        toast.error("Could not remove photo. Please try again.");
      } finally {
        setPhotoWorking(false);
      }
    },
    [api]
  );

  const uploadCroppedBlob = React.useCallback(
    async (animalId: number, blob: Blob) => {
      if (!api?.animals?.uploadPhoto) {
        toast.error("Photo upload is not wired yet. Implement api.animals.uploadPhoto on the client api.");
        return;
      }

      setPhotoWorking(true);
      try {
        const file = new File([blob], "photo.jpg", { type: "image/jpeg" });

        const res = await api.animals.uploadPhoto(animalId, file);
        const url = (res && ((res as any).url || res.photoUrl || (res as any).photo_url)) || null;

        if (!url) {
          toast.error("Upload returned no photo URL.");
          return;
        }

        setRows((prev) => prev.map((r) => (r.id === animalId ? { ...r, photoUrl: url } : r)));
        toast.success("Photo updated.");
      } catch (err) {
        console.error("[Animals] uploadPhoto failed", err);
        toast.error("Could not upload photo. Please try again.");
      } finally {
        setPhotoWorking(false);
      }
    },
    [api]
  );

  const detailsConfig = React.useMemo(
    () => ({
      idParam: "animalId",
      getRowId: (r: AnimalRow) => r.id,
      width: 800,
      placement: "center" as const,
      align: "top" as const,
      fetchRow: async (id: string | number) => {
        const numId = Number(id);
        const base = await api.animals.get(numId);

        let owners: OwnershipRow[] = [];
        try {
          const resp = await api.animals.owners.list(numId);
          const items = Array.isArray((resp as any)?.items)
            ? (resp as any).items
            : Array.isArray(resp)
              ? (resp as any)
              : [];

          owners = items.map(
            (o: any): OwnershipRow => ({
              partyType: normalizeOwnerPartyType(
                o.kind ?? o.partyType ?? o.type,
                o
              ),
              partyId: Number.isFinite(Number(o.partyId ?? o.party_id ?? o.party?.id))
                ? Number(o.partyId ?? o.party_id ?? o.party?.id)
                : null,
              organizationId:
                o.organization?.id ??
                o.organizationId ??
                o.party?.backing?.organizationId ??
                null,
              contactId:
                o.contact?.id ??
                o.contactId ??
                o.party?.backing?.contactId ??
                null,
              display_name:
                o.displayName ??
                o.display_name ??
                o.party?.displayName ??
                o.party?.display_name ??
                o.organization?.name ??
                o.contact?.name ??
                o.name ??
                "",
              is_primary: !!(o.isPrimary ?? o.is_primary ?? o.primary),
              percent:
                typeof o.percent === "number" ? o.percent : undefined,
            })
          );
        } catch {
          owners = [];
        }

        return animalToRow({ ...base, owners });
      },
      onSave: async (id: string | number, draft: Partial<AnimalRow>) => {
        const numId = Number(id);
        const toWire = (d: Partial<AnimalRow>) => {
          const out: any = { ...d };
          if (out.species) out.species = String(out.species).toUpperCase();
          if (out.sex) out.sex = String(out.sex).toUpperCase();
          if (out.status) out.status = String(out.status).toUpperCase();
          return out;
        };

        const updated = await api.animals.update(numId, toWire(draft));

        const owners: OwnershipRow[] | undefined = (draft as any)?.owners;
        let ownerNameOverride: string | undefined;
        if (owners && owners.length) {
          const primary = owners.find((o) => o.is_primary);
          ownerNameOverride =
            primary?.display_name ?? owners[0]?.display_name ?? undefined;
          try {
            await syncOwners(numId, owners);
          } catch {
          }
        }

        setRows((prev) =>
          prev.map((r) => {
            if (r.id !== numId) return r;
            const base: any = { ...r, ...animalToRow(updated) };
            if (owners) {
              (base as any).owners = owners;
            }
            if (ownerNameOverride) {
              base.ownerName = ownerNameOverride;
            }
            return base as AnimalRow;
          })
        );
      },

      header: (r: AnimalRow) => ({
        title: r.name,
        subtitle: r.nickname || r.ownerName || "",
        extra: <HeaderBadges row={r} />,
      }),

      tabs: (r: AnimalRow) => {
        const tabs = [{ key: "overview", label: "Overview" } as const];
        if ((r.sex || "").toLowerCase().startsWith("f"))
          tabs.push({ key: "cycle", label: "Cycle Info" } as any);
        tabs.push({ key: "program", label: "Program" } as any);
        // Marketplace tab always present - content gated by feature flag
        tabs.push({ key: "marketplace", label: "Marketplace" } as any);
        // Health tab with vaccination alert badge
        const alert = vaccinationAlerts[r.id];
        tabs.push({
          key: "health",
          label: "Health",
          badge: alert?.hasIssues ? (
            <VaccinationAlertBadge
              expiredCount={alert.expiredCount}
              dueSoonCount={alert.dueSoonCount}
              size="sm"
              dotOnly
            />
          ) : undefined,
        } as any);
        tabs.push({ key: "genetics", label: "Genetics" } as any);
        tabs.push({ key: "registry", label: "Registry" } as any);
        tabs.push({ key: "finances", label: "Finances" } as any);
        tabs.push({ key: "documents", label: "Documents" } as any);
        tabs.push({ key: "media", label: "Media" } as any);
        tabs.push({ key: "lineage", label: "Lineage" } as any);
        tabs.push({ key: "offspring", label: "Offspring" } as any);
        tabs.push({ key: "titles", label: "Titles" } as any);
        tabs.push({ key: "competitions", label: "Competitions" } as any);
        tabs.push({ key: "privacy", label: "Privacy" } as any);
        tabs.push({ key: "audit", label: "Audit" } as any);
        return tabs;
      },

      customChrome: true,
      render: ({
        row,
        mode,
        setMode,
        setDraft,
        activeTab,
        setActiveTab,
        requestSave,
        close,
        hasPendingChanges,
      }: any) => (
        <>
          <DetailsScaffold
            title={row.name}
            subtitle={row.archived ? <span className="text-amber-400">(Archived)</span> : (row.nickname || row.ownerName || "")}
            mode={row.archived ? "view" : mode}
            onEdit={row.archived ? undefined : () => setMode("edit")}
            onCancel={() => setMode("view")}
            onClose={close}
            hasPendingChanges={hasPendingChanges}
            hideCloseButton
            showFooterClose
            onSave={async () => {
              const currentTab = activeTab;
              await Promise.resolve(requestSave());
              setActiveTab(currentTab);
              if (typeof window !== "undefined" && window.requestAnimationFrame) {
                window.requestAnimationFrame(() => setActiveTab(currentTab));
              }
            }}
            tabs={detailsConfig.tabs(row)}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabsRightContent={
              mode === "edit" ? (
                <Popover
                  open={overflowMenuOpen}
                  onOpenChange={(open) => {
                    setOverflowMenuOpen(open);
                    // Fetch delete eligibility when menu opens
                    if (open && row.id) fetchDeleteEligibility(row.id);
                  }}
                >
                  <Popover.Trigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors text-secondary text-xs"
                      aria-label="More actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span>More</span>
                    </button>
                  </Popover.Trigger>
                  <Popover.Content align="end" className="w-48 p-1">
                    {/* Archive */}
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 rounded disabled:opacity-50"
                      disabled={isArchiving}
                      onClick={() => {
                        setOverflowMenuOpen(false);
                        setArchiveTargetId(row.id);
                        setArchiveDialogOpen(true);
                      }}
                    >
                      <Archive className="h-4 w-4" />
                      {isArchiving ? "Archiving…" : "Archive"}
                    </button>
                    {/* Delete */}
                    {(() => {
                      const eligibility = deleteEligibility[row.id];
                      const canDelete = eligibility?.canDelete ?? null;
                      const blockerTooltip = getDeleteBlockerTooltip(row.id);
                      return (
                        <Tooltip
                          content={
                            canDelete === false && blockerTooltip ? (
                              <div className="max-w-xs">
                                <div className="font-semibold mb-1">Cannot delete</div>
                                <div className="text-xs whitespace-pre-line">{blockerTooltip}</div>
                                <div className="text-xs text-secondary mt-1">Use Archive instead</div>
                              </div>
                            ) : null
                          }
                          side="left"
                        >
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={canDelete === false || canDelete === null}
                            onClick={() => {
                              setOverflowMenuOpen(false);
                              setDeleteTargetId(row.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            {canDelete === null ? "Checking…" : "Delete"}
                          </button>
                        </Tooltip>
                      );
                    })()}
                  </Popover.Content>
                </Popover>
              ) : undefined
            }
          >
          {activeTab === "overview" && (
            <div className="space-y-3 transition-opacity duration-200 ease-in-out">
              <SectionCard title={<SectionTitle icon="🆔">Identity</SectionTitle>} highlight={mode === "edit"}>
                <div className="flex gap-4 items-start">
                  <div className="flex-1 space-y-3">
                    {/* Row 1: Name, Nickname, Species */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                      <LV label="Name">
                        {mode === "view" ? (
                          row.name || "-"
                        ) : (
                          <Input
                            size="sm"
                            defaultValue={row.name}
                            onChange={(e) =>
                              setDraft({ name: e.currentTarget.value })
                            }
                          />
                        )}
                      </LV>

                      <LV label="Nickname">
                        {mode === "view" ? (
                          row.nickname || "-"
                        ) : (
                          <Input
                            size="sm"
                            defaultValue={row.nickname ?? ""}
                            onChange={(e) =>
                              setDraft({ nickname: e.currentTarget.value })
                            }
                          />
                        )}
                      </LV>

                      <LV label="Species">
                        {mode === "view" ? (
                          row.species || "—"
                        ) : (
                          <select
                            className="h-8 w-full rounded-md bg-surface border border-hairline px-2 text-sm text-primary"
                            defaultValue={row.species || "Dog"}
                            onChange={(e) => {
                              const next = e.target
                                .value as "Dog" | "Cat" | "Horse" | "Goat" | "Sheep" | "Rabbit";
                              setDraft({ species: next, breed: null });
                            }}
                          >
                            <option>Dog</option>
                            <option>Cat</option>
                            <option>Horse</option>
                            <option>Goat</option>
                            <option>Sheep</option>
                            <option>Rabbit</option>
                          </select>
                        )}
                      </LV>
                    </div>

                    {/* Row 2: Sex, Breed, DOB */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                      <LV label="Sex">
                        {mode === "view" ? (
                          <SexIndicator sex={row.sex || ""} />
                        ) : (
                          <select
                            className="h-8 w-full rounded-md bg-surface border border-hairline px-2 text-sm text-primary"
                            defaultValue={row.sex || "Female"}
                            onChange={(e) =>
                              setDraft({ sex: e.target.value })
                            }
                          >
                            <option>Female</option>
                            <option>Male</option>
                          </select>
                        )}
                      </LV>

                      <LV label="Breed">
                        {mode === "view" ? (
                          row.breed || "—"
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex-1 min-w-[160px]">
                              <BreedCombo
                                key={`breed-${row.species || "Dog"}`}
                                orgId={orgIdForBreeds ?? undefined}
                                species={(row.species as any) || "Dog"}
                                value={
                                  row.breed
                                    ? ({
                                      id: "__current__",
                                      name: row.breed,
                                      species: row.species,
                                      source: "canonical",
                                    } as any)
                                    : null
                                }
                                onChange={(hit: any) =>
                                  setDraft({ breed: hit?.name ?? null })
                                }
                                api={breedBrowseApi}
                              />
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                const speciesEnum = String(
                                  row.species || "Dog"
                                ).toUpperCase() as "DOG" | "CAT" | "HORSE";
                                setCustomBreedSpecies(speciesEnum);
                                setOnCustomBreedCreated(
                                  () => (created: any) => {
                                    setDraft({ breed: created.name });
                                    setCustomBreedOpen(false);
                                  }
                                );
                                setCustomBreedOpen(true);
                              }}
                            >
                              New custom
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setDraft({ breed: null })}
                            >
                              Clear
                            </Button>
                          </div>
                        )}
                      </LV>

                      <LV label="DOB">
                        {mode === "view" ? (
                          fmt(row.dob) || "-"
                        ) : (
                          <DatePicker
                            value={(row.dob || "").slice(0, 10)}
                            onChange={(e) =>
                              setDraft({ dob: e.currentTarget.value })
                            }
                          />
                        )}
                      </LV>
                    </div>

                    {/* Row 3: Microchip, Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                      <LV label="Microchip #">
                        {mode === "view" ? (
                          row.microchip || "-"
                        ) : (
                          <Input
                            size="sm"
                            defaultValue={row.microchip ?? ""}
                            onChange={(e) =>
                              setDraft({ microchip: e.currentTarget.value })
                            }
                          />
                        )}
                      </LV>

                      <LV label="Status">
                        {mode === "view" ? (
                          <StatusBadge status={row.status || "Active"} />
                        ) : (
                          <select
                            className="h-8 w-full rounded-md bg-surface border border-hairline px-2 text-sm text-primary"
                            defaultValue={row.status || "Active"}
                            onChange={(e) =>
                              setDraft({ status: e.target.value })
                            }
                          >
                            {[
                              "Active",
                              "Breeding",
                              "Unavailable",
                              "Retired",
                              "Deceased",
                              "Prospect",
                            ].map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        )}
                      </LV>
                    </div>
                  </div>

                  <div className="flex-shrink-0 -mt-8">
                    <div className="relative w-32 h-32" style={{ zIndex: 100 }}>
                      <div className={`w-full h-full rounded-md bg-neutral-100 dark:bg-neutral-900 overflow-hidden flex items-center justify-center ${(() => {
                        const status = row.status || "Active";
                        const statusRings: Record<string, string> = {
                          Active: "ring-2 ring-green-500/30 border-2 border-green-500/40",
                          Breeding: "ring-2 ring-purple-500/40 ring-offset-2 ring-offset-purple-500/20 border-2 border-purple-500/50",
                          Retired: "ring-2 ring-blue-500/30 border-2 border-blue-500/40",
                          Deceased: "ring-2 ring-gray-500/30 border-2 border-gray-500/40 grayscale",
                          Unavailable: "ring-2 ring-orange-500/30 border-2 border-orange-500/40",
                          Prospect: "ring-2 ring-sky-500/30 border-2 border-sky-500/40",
                        };
                        return statusRings[status] || "border border-hairline";
                      })()}`}>
                        {row.photoUrl ? (
                          <img
                            src={row.photoUrl}
                            alt={row.name || "Animal photo"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <img
                            src={getPlaceholderForSpecies(row.species)}
                            alt={`${row.species || "Animal"} placeholder`}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>

                      {/* Edit Photo Button - Bottom Right */}
                      <button
                        type="button"
                        aria-label={row.photoUrl ? "Edit photo" : "Upload photo"}
                        style={{ zIndex: 9999, position: 'absolute', bottom: '8px', right: '8px' }}
                        className="h-8 w-8 rounded-full bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm text-neutral-900 dark:text-white flex items-center justify-center shadow-lg border border-neutral-200 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-700 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))] transition-all duration-200 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPhotoEditorForId(row.id);
                          setPhotoEditorSrc(row.photoUrl ?? getPlaceholderForSpecies(row.species));
                          setPhotoEditorOpen(true);
                        }}
                        disabled={photoWorking}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4 pointer-events-none"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                        </svg>
                      </button>

                      {/* Remove Photo Button - Top Right */}
                      {row.photoUrl && (
                        <button
                          type="button"
                          aria-label="Remove photo"
                          style={{ zIndex: 9999, position: 'absolute', top: '8px', right: '8px' }}
                          className="h-7 w-7 rounded-full bg-red-600/90 backdrop-blur-sm text-white hover:bg-red-700 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 cursor-pointer shadow-lg flex items-center justify-center p-1.5"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemovePhoto(row.id);
                          }}
                          disabled={photoWorking}
                        >
                          <TrashIcon className="h-full w-full pointer-events-none" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <PhotoEditorModal
                  open={photoEditorOpen}
                  title="Edit photo"
                  src={photoEditorSrc ?? row.photoUrl ?? null}
                  canRemove={!!row.photoUrl}
                  onClose={() => setPhotoEditorOpen(false)}
                  onPickFile={() => handleStartUploadPhoto(photoEditorForId ?? row.id)}
                  onRemove={async () => {
                    const id = photoEditorForId ?? row.id;
                    await handleRemovePhoto(id);
                    setPhotoEditorOpen(false);
                  }}
                  onSave={async ({ blob }) => {
                    const id = photoEditorForId ?? row.id;
                    await uploadCroppedBlob(id, blob);
                    setPhotoEditorOpen(false);
                  }}
                />
              </SectionCard>

              <BreedingStatusSection animalId={row.id} sex={row.sex} dob={row.dob} api={api} />

              {mode === "view" ? (
                <SectionCard title={<SectionTitle icon="👥">Ownership</SectionTitle>}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <LV label="Primary Owner">
                      <OwnershipChips
                        owners={(
                          (((row as any).owners) ?? []) as any[]
                        ).filter((o: any, idx: number, arr: any[]) => {
                          const isPrimary =
                            o.is_primary || o.primary;
                          if (
                            arr.some(
                              (x: any) =>
                                x.is_primary || x.primary
                            )
                          ) {
                            return !!isPrimary;
                          }
                          return idx === 0;
                        })}
                      />
                    </LV>

                    <LV label="Additional Owners">
                      <OwnershipChips
                        owners={(
                          (((row as any).owners) ?? []) as any[]
                        ).filter((o: any, idx: number, arr: any[]) => {
                          const anyPrimary = arr.some(
                            (x: any) =>
                              x.is_primary || x.primary
                          );
                          const isPrimary =
                            o.is_primary ||
                            o.primary ||
                            (!anyPrimary && idx === 0);
                          return !isPrimary;
                        })}
                      />
                    </LV>
                  </div>
                </SectionCard>
              ) : (
                <OwnershipDetailsEditor
                  row={row}
                  setDraft={setDraft}
                  ownershipLookups={ownershipLookups}
                  mode={mode}
                />
              )}

              <SectionCard
                title={<SectionTitle icon="🏷️">Tags</SectionTitle>}
                right={
                  <AnimalTagsSection
                    animalId={row.id}
                    api={api}
                    disabled={mode === "view"}
                  />
                }
              />

              <SectionCard title={<SectionTitle icon="📝">Notes</SectionTitle>} highlight={mode === "edit"}>
                {mode === "view" ? (
                  <div className="text-sm">{row.notes || "—"}</div>
                ) : (
                  <textarea
                    className="h-24 w-full rounded-md bg-surface border border-hairline px-3 py-2 text-sm text-primary outline-none"
                    defaultValue={row.notes ?? ""}
                    onChange={(e) =>
                      setDraft({
                        notes: (e.currentTarget as HTMLTextAreaElement)
                          .value,
                      })
                    }
                  />
                )}
              </SectionCard>
            </div>
          )}

          {activeTab === "cycle" && (
            <CycleTab
              animal={row}
              api={api}
              onSaved={(dates) => {
                // CycleTab already persists to the API, so we just need to update local state.
                // Update rows so the list reflects the change and DetailsHost re-fetches.
                // Do NOT call setDraft here - that would mark as dirty and trigger
                // "unsaved changes" warning even though data is already saved.
                setRows((prev) =>
                  prev.map((r) =>
                    r.id === row.id ? { ...r, cycleStartDates: dates } : r
                  )
                );
              }}
              onOverrideSaved={(overrideValue) => {
                // Update rows with the new override value to trigger drawer refetch
                setRows((prev) =>
                  prev.map((r) =>
                    r.id === row.id ? { ...r, femaleCycleLenOverrideDays: overrideValue } : r
                  )
                );
              }}
            />
          )}

          {activeTab === "program" && (
            <ProgramTab
              animal={row}
              api={api}
              onSaved={() => { }}
            />
          )}

          {activeTab === "marketplace" && (
            <MarketplaceListingTab
              animal={row}
              api={api}
            />
          )}

          {activeTab === "health" && (
            <HealthTab
              animal={row}
              api={api}
              onDocumentsTabRequest={() => setActiveTab("documents")}
              mode={mode}
              onVaccinationAlertChange={(state) => handleVaccinationAlertChange(row.id, state)}
            />
          )}

          {activeTab === "genetics" && (
            <GeneticsTab
              animal={row}
              api={api}
              mode={mode}
              onCancel={() => setMode("view")}
            />
          )}

          {activeTab === "registry" && (
            <RegistryTab
              animal={row}
              api={api}
              mode={mode}
            />
          )}

          {activeTab === "documents" && (
            <DocumentsTab
              animal={row}
              api={api}
              onHealthTabRequest={(traitKey) => setActiveTab("health")}
            />
          )}

          {activeTab === "media" && (
            <div className="space-y-3 p-4">
              <SectionCard title={<SectionTitle icon="📸">Photos & Videos</SectionTitle>}>
                <div className="text-sm text-secondary">
                  Upload and manage photos and videos for {row.name}.
                </div>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <div className="aspect-square rounded-lg border-2 border-dashed border-hairline hover:border-brand-orange/50 flex items-center justify-center cursor-pointer transition-colors">
                    <div className="text-center text-secondary">
                      <div className="text-2xl mb-1">+</div>
                      <div className="text-xs">Add Media</div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === "lineage" && (
            <LineageTab animal={row} mode={mode} />
          )}

          {activeTab === "offspring" && (
            <OffspringTab animal={row} mode={mode} />
          )}

          {activeTab === "titles" && (
            <TitlesTab animal={row} mode={mode} />
          )}

          {activeTab === "competitions" && (
            <CompetitionsTab animal={row} mode={mode} />
          )}

          {activeTab === "privacy" && (
            <PrivacyTab animal={row} mode={mode} />
          )}

          {activeTab === "finances" && (
            <FinanceTab
              invoiceFilters={{ animalId: row.id }}
              expenseFilters={{ animalId: row.id }}
              api={api}
              defaultAnchor={{ animalId: row.id, animalName: row.name }}
            />
          )}

          {activeTab === "audit" && (
            <div className="space-y-2">
              <SectionCard title="Audit">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-secondary">
                      Created
                    </div>
                    <div>{fmt(row.created_at) || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-secondary">
                      Last Updated
                    </div>
                    <div>{fmt(row.updated_at) || "—"}</div>
                  </div>
                </div>
              </SectionCard>
              <SectionCard title="Events">
                <div className="text-sm text-secondary">
                  Events will appear here.
                </div>
              </SectionCard>
            </div>
          )}
        </DetailsScaffold>
      </>
      ),
    }),
    [api, orgIdForBreeds, ownershipLookups, breedBrowseApi, syncOwners, photoWorking, photoEditorOpen, photoEditorSrc, photoEditorForId, setArchiveTargetId, setArchiveDialogOpen, overflowMenuOpen, setOverflowMenuOpen, isArchiving, setDeleteTargetId, setDeleteDialogOpen, deleteEligibility, fetchDeleteEligibility, getDeleteBlockerTooltip, vaccinationAlerts, handleVaccinationAlertChange]
  );

  const [createOpen, setCreateOpen] = React.useState(false);
  const [createWorking, setCreateWorking] = React.useState(false);
  const [createErr, setCreateErr] = React.useState<string | null>(null);

  // More actions menu state
  const [menuOpen, setMenuOpen] = React.useState(false);

  // CSV export function
  const handleExportCsv = React.useCallback(() => {
    exportToCsv({
      columns: COLUMNS,
      rows: sortedRows,
      filename: "animals",
      formatValue: (value, key) => {
        if (DATE_KEYS.has(key as any)) {
          return fmt(value);
        }
        if (Array.isArray(value)) {
          return value.join(" | ");
        }
        return value;
      },
    });
    setMenuOpen(false);
  }, [sortedRows]);

  const [newName, setNewName] = React.useState("");
  const [newSpecies, setNewSpecies] = React.useState<"Dog" | "Cat" | "Horse" | "Goat" | "Sheep" | "Rabbit">(
    "Dog"
  );
  const [newSex, setNewSex] = React.useState<"Female" | "Male">("Female");
  const [newStatus, setNewStatus] = React.useState<
    "Active" | "Breeding" | "Unavailable" | "Retired" | "Deceased" | "Prospect"
  >("Active");
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

  const canCreate =
    newName.trim().length > 1 && !!newDob && !!newSex && !!newSpecies;

  const handleCreateOpenChange = React.useCallback((v: boolean) => {
    if (!createWorking) setCreateOpen(v);
  }, [createWorking]);

  const handleNameChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewName((e.currentTarget as HTMLInputElement).value);
  }, []);

  const handleNicknameChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname((e.currentTarget as HTMLInputElement).value);
  }, []);

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
        tags: tagsStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        notes: notes || null,
      };

      const created = await (api.animals as any).create?.(payload);
      const animalId = Number((created as any).id);

      // Sync owners if any were specified in the form
      // Note: Backend automatically creates a default owner (tenant party) if none provided
      if (owners.length > 0) {
        try {
          await syncOwners(animalId, owners as OwnershipRow[]);
        } catch {
          // Owner sync failed, but animal was created
        }
      }

      // Fetch the actual owners from the backend (includes backend-created default owner)
      let fetchedOwners: any[] = [];
      try {
        const ownersResp = await api.animals.owners.list(animalId);
        fetchedOwners = Array.isArray((ownersResp as any)?.items)
          ? (ownersResp as any).items
          : [];
      } catch {
        // Failed to fetch owners, proceed with empty list
      }

      // Convert backend owner format to frontend OwnershipRow format
      const normalizedOwners: OwnershipRow[] = fetchedOwners.map((o: any) => {
        const partyType = o.kind === "ORGANIZATION" || o.kind === "PERSON"
          ? (o.kind === "ORGANIZATION" ? "Organization" : "Contact")
          : normalizeOwnerPartyType(o.kind);

        return {
          partyId: o.partyId,
          partyType,
          organizationId: o.kind === "ORGANIZATION" ? o.backing?.organizationId : null,
          contactId: o.kind === "PERSON" ? o.backing?.contactId : null,
          display_name: o.displayName,
          is_primary: o.isPrimary,
          percent: o.percent,
        };
      });

      const ownerNameOverride = fetchedOwners.find((o: any) => o.isPrimary)?.displayName
        ?? fetchedOwners[0]?.displayName
        ?? null;

      const row = animalToRow({
        ...created,
        owners: normalizedOwners,
        ownerName: ownerNameOverride ?? undefined,
      });

      setRows((prev) => [row, ...prev]);
      resetCreateForm();
      setCreateOpen(false);
    } catch (e: any) {
      setCreateErr(e?.message || "Failed to create animal");
    } finally {
      setCreateWorking(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* global hidden file input for photo uploads */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoFileChange}
      />

      <div className="relative">
        <PageHeader
          title="Animals"
          subtitle="Manage your breeding males and females"
        />
        <div
          className="absolute right-0 top-0 h-full flex items-center gap-2 pr-1"
          style={{ zIndex: 5, pointerEvents: "auto" }}
        >
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            New Animal
          </Button>
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <Popover.Trigger asChild>
              <Button size="sm" variant="outline" aria-label="More actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </Popover.Trigger>
            <Popover.Content align="end" className="w-48">
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 rounded"
                onClick={() => {
                  setMenuOpen(false);
                  window.history.pushState(null, "", "/bloodlines/titles");
                  window.dispatchEvent(new PopStateEvent("popstate"));
                }}
              >
                <Trophy className="h-4 w-4" />
                Add Title
              </button>
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
          {/* Shared Toolbar - always visible */}
          <div className="bhq-table__toolbar px-3 pt-3 pb-3 relative z-30 flex items-center gap-3">
            <SearchBar
              value={q}
              onChange={setQ}
              placeholder="Search any field…"
              widthPx={420}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setFiltersOpen((v) => !v)}
                  aria-expanded={filtersOpen}
                  title="Filters"
                  className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-white/5 focus:outline-none"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 5h18M7 12h10M10 19h4"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              }
            />

            {/* View mode toggle */}
            <div className="flex items-center rounded-lg border border-hairline overflow-hidden">
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
            </div>

            {/* Sort dropdown */}
            <SortDropdown
              options={SORT_OPTIONS}
              sorts={sorts}
              onSort={(key, dir) => setSorts([{ key, dir }])}
              onClear={() => setSorts([])}
            />

            {/* Column toggle - only show in table mode */}
            {viewMode === "table" && (
              <ColumnsPopover
                columns={map}
                onToggle={toggle}
                onSet={setAll}
                allColumns={COLUMNS}
                triggerClassName="bhq-columns-trigger"
              />
            )}

            <div className="ml-auto" />
          </div>

          {filtersOpen && (
            <FiltersRow
              filters={filters}
              onChange={(next) => setFilters(next)}
              schema={filterSchemaForFiltersRow}
            />
          )}

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

          {/* Conditional view rendering */}
          {viewMode === "table" ? (
            <Table
              columns={COLUMNS}
              columnState={map}
              onColumnStateChange={setAll}
              getRowId={(r: AnimalRow) => r.id}
              pageSize={25}
              stickyRightWidthPx={0}
            >
              <table className="min-w-max w-full text-sm">
                <TableHeader
                  columns={visibleSafe}
                  sorts={sorts}
                  onToggleSort={onToggleSort}
                />
                <tbody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={visibleSafe.length}>
                        <div className="py-8 text-center text-sm text-secondary">
                          Loading animals…
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading && error && (
                    <TableRow>
                      <TableCell colSpan={visibleSafe.length}>
                        <div className="py-8 text-center text-sm text-red-600">
                          Error: {error}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading && !error && pageRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={visibleSafe.length}>
                        <div className="py-8 text-center text-sm text-secondary">
                          No animals to display yet.
                        </div>
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
                          // Special handling for name column - show titles badge and vaccination alerts
                          if (c.key === "name") {
                            const hasTitles = r.titlePrefix || r.titleSuffix;
                            const vaxAlert = vaccinationAlerts[r.id];
                            return (
                              <TableCell key={c.key} align="left">
                                <div className="flex items-center gap-2">
                                  <span>{v ?? ""}</span>
                                  {hasTitles && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-[hsl(var(--brand-orange))] bg-[hsl(var(--brand-orange))]/10">
                                      🏆 {[r.titlePrefix, r.titleSuffix].filter(Boolean).join(" ")}
                                    </span>
                                  )}
                                  {vaxAlert?.hasIssues && (
                                    <VaccinationAlertBadge
                                      expiredCount={vaxAlert.expiredCount}
                                      dueSoonCount={vaxAlert.dueSoonCount}
                                      size="sm"
                                    />
                                  )}
                                </div>
                              </TableCell>
                            );
                          }
                          return <TableCell key={c.key} align={c.center ? "center" : "left"}>{v ?? ""}</TableCell>;
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
                includeArchived={includeArchived}
                onIncludeArchivedChange={(checked) => {
                  setIncludeArchived(checked);
                  setPage(1);
                }}
              />
            </Table>
          ) : (
            <CardViewWithDetails
              rows={pageRows}
              loading={loading}
              error={error}
              sortedRows={sortedRows}
              pageSize={pageSize}
              page={clampedPage}
              pageCount={pageCount}
              setPage={setPage}
              setPageSize={setPageSize}
              includeArchived={includeArchived}
              setIncludeArchived={setIncludeArchived}
              totalRows={rows.length}
              start={start}
              end={end}
              vaccinationAlerts={vaccinationAlerts}
            />
          )}
        </DetailsHost>
      </Card>

      <Dialog
        open={archiveDialogOpen}
        onClose={() => setArchiveDialogOpen(false)}
        title="Archive Animal"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Are you sure you want to archive <strong>{rows.find(r => r.id === archiveTargetId)?.name || "this animal"}</strong>? This animal will be removed from the active list.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setArchiveDialogOpen(false)}
              disabled={isArchiving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => archiveTargetId && handleArchive(archiveTargetId)}
              disabled={isArchiving}
            >
              {isArchiving ? "Archiving..." : "Archive"}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Delete Animal"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Are you sure you want to delete <strong>{rows.find(r => r.id === deleteTargetId)?.name || "this animal"}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteTargetId && handleDelete(deleteTargetId)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Dialog>


      {createOpen && (
        <Overlay
          open={createOpen}
          onOpenChange={handleCreateOpenChange}
          ariaLabel="Create Animal"
          size="lg"
          overlayId="create-animal"
        >
          <div className="relative w-full">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-lg font-semibold">Create Animal</div>
              <Button
                variant="ghost"
                onClick={() => setCreateOpen(false)}
              >
                ✕
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-xs text-secondary">
                  Name{" "}
                  <span className="text-[hsl(var(--brand-orange))]">
                    *
                  </span>
                </div>
                <Input
                  value={newName}
                  onChange={handleNameChange}
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-secondary">
                  Nickname
                </div>
                <Input
                  value={nickname}
                  onChange={handleNicknameChange}
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-secondary">
                  Species *
                </div>
                <select
                  className="h-9 w-full rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                  value={newSpecies}
                  onChange={(e) =>
                    setNewSpecies(e.currentTarget.value as any)
                  }
                >
                  <option>Dog</option>
                  <option>Cat</option>
                  <option>Horse</option>
                  <option>Goat</option>
                  <option>Sheep</option>
                  <option>Rabbit</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <div className="mb-1 text-xs text-secondary">
                  Breed
                </div>
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
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const speciesEnum = String(
                        newSpecies
                      ).toUpperCase() as "DOG" | "CAT" | "HORSE";
                      setCustomBreedSpecies(speciesEnum);
                      setOnCustomBreedCreated(
                        () => (created: { id: number; name: string }) => {
                          setNewBreed({
                            id: created.id,
                            name: created.name,
                            species: newSpecies,
                            source: "custom",
                          } as any);
                          setCustomBreedOpen(false);
                        }
                      );
                      setCustomBreedOpen(true);
                    }}
                  >
                    New custom
                  </Button>
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs text-secondary">
                  Sex *
                </div>
                <select
                  className="h-9 w-full rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                  value={newSex}
                  onChange={(e) =>
                    setNewSex(e.currentTarget.value as any)
                  }
                >
                  <option>Female</option>
                  <option>Male</option>
                </select>
              </div>

              <div>
                <div className="mb-1 text-xs text-secondary">
                  Date of Birth *
                </div>
                <DatePicker
                  value={newDob}
                  onChange={(e) =>
                    setNewDob(e.currentTarget.value)
                  }
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-secondary">
                  Status
                </div>
                <select
                  className="h-9 w-full rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                  value={newStatus}
                  onChange={(e) =>
                    setNewStatus(e.currentTarget.value as any)
                  }
                >
                  {[
                    "Active",
                    "Breeding",
                    "Unavailable",
                    "Retired",
                    "Deceased",
                    "Prospect",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <div className="mb-1 text-xs text-secondary">
                  Microchip #
                </div>
                <Input
                  value={newMicrochip}
                  onChange={(e) =>
                    setNewMicrochip(
                      (e.currentTarget as HTMLInputElement).value
                    )
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <div className="mb-2 text-sm font-medium text-primary">
                  Ownership
                </div>
                <OwnershipEditor
                  api={ownershipLookups}
                  value={owners}
                  onChange={setOwners}
                />
              </div>

              <div className="sm:col-span-2">
                <div className="mb-1 text-xs text-secondary">Tags</div>
                <Input
                  placeholder="tag1, tag2"
                  value={tagsStr}
                  onChange={(e) =>
                    setTagsStr(
                      (e.currentTarget as HTMLInputElement).value
                    )
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <div className="mb-1 text-xs text-secondary">
                  Notes
                </div>
                <textarea
                  className="h-24 w-full rounded-md border border-hairline bg-surface px-3 text-sm text-primary placeholder:text-secondary outline-none"
                  value={notes}
                  onChange={(e) =>
                    setNotes(
                      (e.currentTarget as HTMLTextAreaElement).value
                    )
                  }
                  placeholder="Temperament, program notes, constraints"
                />
              </div>

              {createErr && (
                <div className="sm:col-span-2 text-sm text-red-600">
                  {createErr}
                </div>
              )}

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
                <Button
                  onClick={doCreateAnimal}
                  disabled={!canCreate || createWorking}
                >
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


