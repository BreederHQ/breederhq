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
  SectionCard,
  Button,
  Input,
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
  type TagOption,
} from "@bhq/ui";
import { FinanceTab } from "@bhq/ui/components/Finance";
import type { OwnershipRow } from "@bhq/ui/utils/ownership";

import { Overlay, getOverlayRoot } from "@bhq/ui/overlay";
import { toast } from "@bhq/ui/atoms/Toast";
import "@bhq/ui/styles/table.css";
import { makeApi } from "./api";
import { MoreHorizontal, Download } from "lucide-react";

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
 * Feature Flags
 * ─────────────────────────────────────────────────────────────────────── */

/**
 * Check if animal marketplace listings feature is enabled.
 * Defaults to OFF for production. Enable via:
 * - Environment variable: VITE_FEATURE_ANIMAL_MARKETPLACE=true
 * - localStorage: BHQ_FEATURE_ANIMAL_MARKETPLACE=true
 * - URL param: ?feature_animal_marketplace=true (for testing)
 */
function isAnimalMarketplaceEnabled(): boolean {
  // Environment variable (Vite)
  try {
    const envFlag = (import.meta as any)?.env?.VITE_FEATURE_ANIMAL_MARKETPLACE;
    if (envFlag === "true" || envFlag === true) return true;
  } catch { /* ignore */ }

  // localStorage override (persists for session)
  try {
    if (localStorage.getItem("BHQ_FEATURE_ANIMAL_MARKETPLACE") === "true") return true;
  } catch { /* ignore */ }

  // URL param (for one-off testing)
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("feature_animal_marketplace") === "true") return true;
  } catch { /* ignore */ }

  return false;
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
  };
}

/* CalendarInput: text field + native date picker */

type CalendarInputProps = {
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  readOnly?: boolean;
  showIcon?: boolean;
};

const dateInputCls = "h-8 py-0 px-2 text-sm bg-transparent border-hairline";

function CalendarInput(props: any) {
  const readOnly = !!props.readOnly;
  const className = props.className;
  const inputClassName = props.inputClassName;
  const onChange = props.onChange as React.ChangeEventHandler<HTMLInputElement> | undefined;
  const value = props.value as string | undefined;
  const defaultValue = props.defaultValue as string | undefined;
  const placeholder = props.placeholder ?? "mm/dd/yyyy";
  const showIcon = props.showIcon ?? true;

  const rest: any = { ...props };
  delete rest.readOnly;
  delete rest.className;
  delete rest.inputClassName;
  delete rest.onChange;
  delete rest.value;
  delete rest.defaultValue;
  delete rest.placeholder;
  delete rest.showIcon;

  const onlyISO = (s: string) => (s || "").slice(0, 10);

  const toDisplay = (s: string | undefined | null) => {
    if (!s) return "";
    const iso = onlyISO(s);
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return "";
    return `${m}/${d}/${y}`;
  };

  const toISO = (s: string) => {
    const trimmed = s.trim();
    if (!trimmed) return "";
    const m = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (m) {
      const mm = m[1].padStart(2, "0");
      const dd = m[2].padStart(2, "0");
      let yyyy = m[3];
      if (yyyy.length === 2) yyyy = `20${yyyy}`;
      return `${yyyy}-${mm}-${dd}`;
    }
    return onlyISO(trimmed);
  };

  const [textValue, setTextValue] = React.useState(() =>
    value != null ? toDisplay(value) : defaultValue != null ? toDisplay(defaultValue) : ""
  );

  React.useEffect(() => {
    if (value != null) {
      setTextValue(toDisplay(value));
    }
  }, [value]);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const hiddenRef = React.useRef<HTMLInputElement>(null);

  const handleTextChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const raw = e.currentTarget.value;
    setTextValue(raw);
    if (!onChange) return;
    const iso = toISO(raw);
    onChange({ currentTarget: { value: iso } } as any);
  };

  const handleHiddenChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const iso = onlyISO(e.currentTarget.value || "");
    const display = toDisplay(iso);
    setTextValue(display);
    if (!onChange) return;
    onChange({ currentTarget: { value: iso } } as any);
  };

  const handleIconClick = () => {
    if (readOnly) return;
    hiddenRef.current?.showPicker?.();
  };

  return (
    <div className={className}>
      <div className="relative">
        <Input
          ref={inputRef}
          className={inputClassName}
          placeholder={placeholder}
          value={textValue}
          onChange={handleTextChange}
          readOnly={readOnly}
          {...rest}
        />
        {showIcon && (
          <button
            type="button"
            className="absolute inset-y-0 right-2 flex items-center text-muted-foreground"
            aria-label="Open date picker"
            onClick={handleIconClick}
          >
            <span className="text-xs">📅</span>
          </button>
        )}
        <input
          ref={hiddenRef}
          type="date"
          value={value ? onlyISO(value) : ""}
          onChange={handleHiddenChange}
          style={{
            position: "absolute",
            opacity: 0,
            pointerEvents: "none",
            width: 0,
            height: 0,
            margin: 0,
            padding: 0,
            border: "none",
          }}
        />
      </div>
    </div>
  );
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
}: {
  row: AnimalRow;
  setDraft: (p: Partial<AnimalRow>) => void;
  ownershipLookups: any;
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
    <SectionCard title="Ownership">
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
                    <CalendarInput
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
            <CalendarInput
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
 * Marketplace Listing Tab — Manage public animal listing for marketplace
 * ─────────────────────────────────────────────────────────────────────── */

type ListingStatus = "DRAFT" | "LIVE" | "PAUSED";
type ListingIntent = "STUD" | "BROOD_PLACEMENT" | "REHOME" | "SHOWCASE";
type PriceModel = "fixed" | "range" | "inquire";

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
  locationCity: string;
  locationRegion: string;
  locationCountry: string;
  detailsJson: Record<string, any>;
  primaryPhotoUrl: string | null;
}

const INTENT_OPTIONS: { value: ListingIntent; label: string; description: string }[] = [
  { value: "STUD", label: "Stud Service", description: "Offer this male for breeding" },
  { value: "BROOD_PLACEMENT", label: "Brood Placement", description: "Place breeding female with another program" },
  { value: "REHOME", label: "Rehome", description: "Find a new home for this animal" },
  { value: "SHOWCASE", label: "Showcase", description: "Display this animal without sale intent" },
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
  const [enabled, setEnabled] = React.useState(false);
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
    locationCity: "",
    locationRegion: "",
    locationCountry: "",
    detailsJson: {},
    primaryPhotoUrl: null,
  });

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
          setEnabled(true);
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
            locationCity: existing.locationCity || "",
            locationRegion: existing.locationRegion || "",
            locationCountry: existing.locationCountry || "",
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
  const canPublish = enabled && form.intent != null && form.headline.trim().length > 0;

  const handleSave = async () => {
    if (!enabled) return;
    try {
      setSaving(true);
      setError(null);
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
        locationCity: form.locationCity || null,
        locationRegion: form.locationRegion || null,
        locationCountry: form.locationCountry || null,
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
      setEnabled(false);
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
        locationCity: "",
        locationRegion: "",
        locationCountry: "",
        detailsJson: {},
        primaryPhotoUrl: animal.photoUrl || null,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to delete listing");
    } finally {
      setSaving(false);
    }
  };

  const handleEnableToggle = async () => {
    if (enabled) {
      // Disabling - ask to delete listing if it exists
      if (listing) {
        await handleDelete();
      } else {
        setEnabled(false);
      }
    } else {
      // Enabling - create draft listing
      setEnabled(true);
      // Will save on first explicit save
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

      {/* Marketplace presence toggle and status */}
      <SectionCard title="Marketplace Presence">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={enabled}
                onChange={handleEnableToggle}
                disabled={saving}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-neutral-200 dark:bg-neutral-700 peer-checked:bg-orange-500 peer-disabled:opacity-50 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
            </label>
            <span className="text-sm font-medium text-primary">
              {enabled ? "Published to Marketplace" : "Not on Marketplace"}
            </span>
          </div>

          {status && (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                status === "LIVE"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : status === "PAUSED"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
              }`}
            >
              {status === "LIVE" ? "Live" : status === "PAUSED" ? "Paused" : "Draft"}
            </span>
          )}
        </div>

        {status === "LIVE" && listing?.publishedAt && (
          <div className="mt-2 text-xs text-secondary">
            Published {new Date(listing.publishedAt).toLocaleDateString()}
          </div>
        )}
      </SectionCard>

      {enabled && (
        <>
          {/* Listing Intent */}
          <SectionCard title="Listing Intent">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-secondary mb-1 block">
                  What are you listing this animal for? {status === "LIVE" || status === "PAUSED" ? "" : "(Required to publish)"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {INTENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, intent: opt.value }))}
                      className={`flex flex-col items-start p-3 rounded-md border text-left transition-colors ${
                        form.intent === opt.value
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                          : "border-hairline hover:border-neutral-400 dark:hover:border-neutral-600"
                      }`}
                    >
                      <span className="text-sm font-medium text-primary">{opt.label}</span>
                      <span className="text-xs text-secondary mt-0.5">{opt.description}</span>
                    </button>
                  ))}
                </div>
              </div>
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
                  onChange={(e) => setForm((f) => ({ ...f, headline: e.currentTarget.value }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-secondary mb-1 block">Title</label>
                  <Input
                    placeholder="Animal display name"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.currentTarget.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1 block">Primary Photo URL</label>
                  <Input
                    placeholder="Photo URL (uses animal photo if blank)"
                    value={form.primaryPhotoUrl || ""}
                    onChange={(e) => setForm((f) => ({ ...f, primaryPhotoUrl: e.currentTarget.value || null }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-secondary mb-1 block">Summary</label>
                <Input
                  placeholder="Short description for listing cards"
                  value={form.summary}
                  onChange={(e) => setForm((f) => ({ ...f, summary: e.currentTarget.value }))}
                />
              </div>

              <div>
                <label className="text-xs text-secondary mb-1 block">Description</label>
                <textarea
                  className="h-24 w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none"
                  placeholder="Full description for listing detail page"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.currentTarget.value }))}
                />
              </div>
            </div>
          </SectionCard>

          {/* Location */}
          <SectionCard title="Location">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-secondary mb-1 block">City</label>
                <Input
                  placeholder="City"
                  value={form.locationCity}
                  onChange={(e) => setForm((f) => ({ ...f, locationCity: e.currentTarget.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-secondary mb-1 block">State/Region</label>
                <Input
                  placeholder="State or Region"
                  value={form.locationRegion}
                  onChange={(e) => setForm((f) => ({ ...f, locationRegion: e.currentTarget.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-secondary mb-1 block">Country</label>
                <Input
                  placeholder="Country"
                  value={form.locationCountry}
                  onChange={(e) => setForm((f) => ({ ...f, locationCountry: e.currentTarget.value }))}
                />
              </div>
            </div>
          </SectionCard>

          {/* Pricing */}
          <SectionCard title="Pricing">
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
                  <label className="text-xs text-secondary mb-1 block">Price ($)</label>
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
                    <label className="text-xs text-secondary mb-1 block">Min Price ($)</label>
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
                    <label className="text-xs text-secondary mb-1 block">Max Price ($)</label>
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
                    onChange={(e) => setForm((f) => ({ ...f, priceText: e.currentTarget.value }))}
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
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            detailsJson: { ...f.detailsJson, studFeeNotes: e.currentTarget.value },
                          }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-secondary mb-1 block">Available For</label>
                        <select
                          className="h-9 w-full rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                          value={form.detailsJson.studAvailability || ""}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              detailsJson: { ...f.detailsJson, studAvailability: e.currentTarget.value || undefined },
                            }))
                          }
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
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              detailsJson: {
                                ...f.detailsJson,
                                shippingAvailable: e.currentTarget.value === "true" ? true : e.currentTarget.value === "false" ? false : undefined,
                              },
                            }))
                          }
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
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            detailsJson: { ...f.detailsJson, placementTerms: e.currentTarget.value },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-secondary mb-1 block">Breeding Requirements</label>
                      <Input
                        placeholder="Minimum litters, health testing requirements, etc."
                        value={form.detailsJson.breedingRequirements || ""}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            detailsJson: { ...f.detailsJson, breedingRequirements: e.currentTarget.value },
                          }))
                        }
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
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            detailsJson: { ...f.detailsJson, rehomeReason: e.currentTarget.value },
                          }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-secondary mb-1 block">Good With Kids</label>
                        <select
                          className="h-9 w-full rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                          value={String(form.detailsJson.goodWithKids ?? "")}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              detailsJson: {
                                ...f.detailsJson,
                                goodWithKids: e.currentTarget.value === "true" ? true : e.currentTarget.value === "false" ? false : undefined,
                              },
                            }))
                          }
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
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              detailsJson: {
                                ...f.detailsJson,
                                goodWithPets: e.currentTarget.value === "true" ? true : e.currentTarget.value === "false" ? false : undefined,
                              },
                            }))
                          }
                        >
                          <option value="">Unknown</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {form.intent === "SHOWCASE" && (
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Showcase Notes</label>
                    <textarea
                      className="h-20 w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none"
                      placeholder="Any additional information about this animal for showcase"
                      value={form.detailsJson.showcaseNotes || ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          detailsJson: { ...f.detailsJson, showcaseNotes: e.currentTarget.value },
                        }))
                      }
                    />
                  </div>
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

            {!canPublish && status === "DRAFT" && (
              <div className="mt-2 text-xs text-secondary">
                To publish, select a listing intent and provide a headline.
              </div>
            )}
          </SectionCard>
        </>
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
  verified?: boolean | null;
  performedAt?: string | null;
  source?: string | null;
  jsonText?: string;
};

function HealthTab({
  animal,
  api,
  onDocumentsTabRequest,
  mode,
}: {
  animal: AnimalRow;
  api: any;
  onDocumentsTabRequest?: () => void;
  mode: "view" | "edit";
}) {
  const [categories, setCategories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<{ status?: number; message?: string; code?: string } | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [uploadTraitKey, setUploadTraitKey] = React.useState<string | null>(null);
  const [expandedTraitKey, setExpandedTraitKey] = React.useState<string | null>(null);
  const [traitDrafts, setTraitDrafts] = React.useState<Record<string, TraitDraft>>({});
  const [collapsedCategories, setCollapsedCategories] = React.useState<Set<string>>(new Set());

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
        verified: trait.verified,
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

      // Dev-only diagnostic logging
      if (import.meta.env?.DEV) {
        console.log('[HealthTab] Traits response:', data);
      }

      // Filter out non-health traits (microchip, registry numbers)
      const filteredCategories = (data?.categories || []).map((cat: any) => ({
        ...cat,
        items: (cat.items || []).filter((t: any) => {
          const key = t.traitKey || "";
          // Exclude identity traits (*.id.* and *.registry.*)
          return !key.includes(".id.") && !key.includes(".registry.");
        }),
      })).filter((cat: any) => cat.items.length > 0);

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
    const skeletonCategories = ["Orthopedic", "Eyes", "Cardiac", "Genetic", "Reproductive", "General"];
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

  // Empty state
  const hasAnyTraits = categories.some((cat) => (cat.items || []).length > 0);
  if (!categories || categories.length === 0 || !hasAnyTraits) {
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
      {categories.map((cat: any) => {
        const items = cat.items || [];
        if (items.length === 0) return null;

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
          <SectionCard
            key={cat.category}
            title={
              <>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCategory(cat.category)}
                    className="hover:opacity-80 transition-opacity -ml-1"
                    aria-label={isCollapsed ? "Expand category" : "Collapse category"}
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
                  <span className="relative">
                    {cat.category}
                  </span>
                </div>
              </>
            }
            right={
              <span className="text-xs text-secondary font-normal">
                {completedCount} of {items.length} provided
              </span>
            }
          >
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
                    />
                  );
                })}
              </div>
            )}
          </SectionCard>
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

function TraitRow({
  trait,
  draft,
  isExpanded,
  editMode,
  onExpand,
  onCollapse,
  onSave,
  onUpload,
  onDraftChange,
  onDraftReset,
}: {
  trait: any;
  draft?: TraitDraft;
  isExpanded: boolean;
  editMode: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onSave: (update: any) => void;
  onUpload: () => void;
  onDraftChange: (next: TraitDraft) => void;
  onDraftReset: () => void;
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
  const currentVerified = localDraft.verified !== undefined ? localDraft.verified : trait.verified;
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
      if (currentVerified !== undefined) update.verified = currentVerified;
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
        <Input
          type="date"
          size="sm"
          value={currentValue?.date?.slice(0, 10) || ""}
          onChange={(e) =>
            onDraftChange({
              ...localDraft,
              value: { date: e.target.value },
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

  // Helper to format value for display
  const getDisplayValue = () => {
    if (isPennHip) {
      const json = trait.value?.json;
      if (!json || json.di === undefined) return "Not provided";
      const sideLabel = json.side ? ` (${json.side})` : "";
      const notesLabel = json.notes ? " (notes)" : "";
      return `DI: ${json.di}${sideLabel}${notesLabel}`;
    }
    if (isBoolean) {
      if (trait.value?.boolean === undefined) return "Not provided";
      return trait.value.boolean ? "Yes" : "No";
    }
    if (isText || isEnum) {
      return trait.value?.text || "Not provided";
    }
    if (isNumber) {
      return trait.value?.number !== undefined ? String(trait.value.number) : "Not provided";
    }
    if (isDate) {
      return trait.value?.date ? new Date(trait.value.date).toLocaleDateString() : "Not provided";
    }
    if (isJsonValue || trait.value?.json !== undefined) {
      return trait.value?.json != null ? "Provided" : "Not provided";
    }
    return "Not provided";
  };

  const hasValue = trait.value?.boolean !== undefined ||
                   trait.value?.text ||
                   trait.value?.number !== undefined ||
                   trait.value?.date ||
                   trait.value?.json;

  // COLLAPSED STATE (default)
  if (!isExpanded) {
    return (
      <div className="flex items-center justify-between py-2 px-3 hover:bg-subtle rounded group">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{displayName}</div>
            <div className="text-xs text-secondary truncate">{getDisplayValue()}</div>
          </div>
          <div className="flex items-center gap-2">
            {trait.verified && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                Verified
              </span>
            )}
            {trait.marketplaceVisible && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                Marketplace
              </span>
            )}
            {trait.documents && trait.documents.length > 0 && (
              <span className="text-xs text-secondary" title={`${trait.documents.length} document(s)`}>
                {trait.documents.length} doc{trait.documents.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        {editMode && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onExpand}
            className="ml-2"
          >
            Edit
          </Button>
        )}
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

        {/* Visibility and Verification */}
        <div className="border-t border-hairline pt-4 space-y-3">
          <div className="text-xs font-medium text-secondary mb-2">Visibility and Verification</div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={currentMarketplace || false}
                onChange={(e) =>
                  onDraftChange({
                    ...localDraft,
                    marketplaceVisible: e.target.checked,
                  })
                }
                className="rounded border-hairline"
              />
              <span>Visible on marketplace</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={currentVerified || false}
                onChange={(e) =>
                  onDraftChange({
                    ...localDraft,
                    verified: e.target.checked,
                  })
                }
                className="rounded border-hairline"
              />
              <span>Verified</span>
            </label>
          </div>

          {/* Performed Date & Source */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-secondary block mb-1">Performed Date</label>
              <Input
                type="date"
                size="sm"
                value={currentPerformedAt?.slice(0, 10) || ""}
                onChange={(e) =>
                  onDraftChange({
                    ...localDraft,
                    performedAt: e.target.value,
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
                  <div>
                    <div className="font-medium text-sm">{doc.title}</div>
                    <div className="text-xs text-secondary mt-1">
                      {doc.originalFileName} • {doc.mimeType}
                      {doc.sizeBytes && ` • ${(doc.sizeBytes / 1024).toFixed(1)} KB`}
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteConfirmId(doc.documentId)}
                    className="text-secondary hover:text-primary text-xs"
                    title="Delete"
                  >
                    Delete
                  </button>
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
    if (mode === "edit") {
      fetchAllRegistries();
    }
  }, [mode, fetchAllRegistries]);

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
                      <Input
                        type="date"
                        value={draft?.issuedAt || ""}
                        onChange={(e) => updateDraft(reg.id, { issuedAt: e.target.value })}
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
          limit: 50,
          includeArchived,
        });
        const baseItems = res?.items || [];

        // Enrich each animal with owners data for cross-module sharing
        const enriched = await Promise.all(
          baseItems.map(async (animal: any) => {
            let owners: OwnershipRow[] = [];
            try {
              const resp = await api.animals.owners.list(animal.id);
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
            } catch (err) {
              console.error("[Animals] Failed to fetch owners for animal", animal.id, err);
            }
            return { ...animal, owners };
          })
        );

        const items = enriched.map(animalToRow);
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

  function Chip({ children }: { children: React.ReactNode }) {
    return (
      <span className="inline-flex items-center rounded-full border border-hairline px-2 py-0.5 text-xs text-primary">
        {children}
      </span>
    );
  }

  function HeaderBadges({ row }: { row: AnimalRow }) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
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
        window.history.replaceState({}, "", url.toString());
      } catch (error) {
        console.error("Failed to archive animal:", error);
        toast.error("Failed to archive animal. Please try again.");
      } finally {
        setIsArchiving(false);
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
        // Feature-flagged: Marketplace tab (default OFF until rollout)
        if (isAnimalMarketplaceEnabled()) {
          tabs.push({ key: "marketplace", label: "Marketplace" } as any);
        }
        tabs.push({ key: "health", label: "Health" } as any);
        tabs.push({ key: "registry", label: "Registry" } as any);
        tabs.push({ key: "documents", label: "Documents" } as any);
        tabs.push({ key: "finances", label: "Finances" } as any);
        tabs.push({ key: "pairing", label: "Pairing" } as any);
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
            subtitle={row.nickname || row.ownerName || ""}
            mode={mode}
            onEdit={() => setMode("edit")}
            onCancel={() => setMode("view")}
            onClose={close}
            hasPendingChanges={hasPendingChanges}
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
            rightActions={
              mode === "edit" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setArchiveTargetId(row.id);
                    setArchiveDialogOpen(true);
                  }}
                >
                  Archive
                </Button>
              ) : null
            }
          >
          {activeTab === "overview" && (
            <div className="space-y-3">
              <SectionCard title="Identity">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                    <LV label="DOB">
                      {mode === "view" ? (
                        fmt(row.dob) || "-"
                      ) : (
                        <Input
                          size="sm"
                          type="date"
                          defaultValue={(row.dob || "").slice(0, 10)}
                          onChange={(e) =>
                            setDraft({ dob: e.currentTarget.value })
                          }
                        />
                      )}
                    </LV>
                  </div>

                  <div className="lg:col-span-1 flex justify-center lg:justify-end lg:items-start">
                    <div className="relative w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64" style={{ zIndex: 100 }}>
                      <div className="w-full h-full rounded-md bg-neutral-100 dark:bg-neutral-900 border border-hairline overflow-hidden flex items-center justify-center">
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
                        style={{ zIndex: 9999, position: 'absolute', bottom: '12px', right: '12px' }}
                        className="h-12 w-12 rounded-full bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white flex items-center justify-center shadow-xl border-2 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-[hsl(var(--brand-orange))] transition-all duration-200 cursor-pointer"
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
                          className="h-6 w-6 pointer-events-none"
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
                          style={{ zIndex: 9999, position: 'absolute', top: '12px', right: '12px' }}
                          className="h-10 w-10 rounded-full bg-red-600 text-white p-2 hover:bg-red-700 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-red-500 transition-all duration-200 cursor-pointer shadow-lg"
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

                  <LV label="Sex">
                    {mode === "view" ? (
                      row.sex || "—"
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

                  <LV label="Status">
                    {mode === "view" ? (
                      row.status || "Active"
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
                </div>
              </SectionCard>

              {mode === "view" ? (
                <SectionCard title="Ownership">
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
                />
              )}

              <SectionCard title="Tags">
                <AnimalTagsSection
                  animalId={row.id}
                  api={api}
                  disabled={mode === "view"}
                />
              </SectionCard>

              <SectionCard title="Notes">
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

          {activeTab === "finances" && (
            <FinanceTab
              invoiceFilters={{ animalId: row.id }}
              expenseFilters={{ animalId: row.id }}
              api={api}
              defaultAnchor={{ animalId: row.id, animalName: row.name }}
            />
          )}

          {activeTab === "pairing" && (
            <PairingTab animal={row} api={api} />
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
    [api, orgIdForBreeds, ownershipLookups, breedBrowseApi, syncOwners, photoWorking, photoEditorOpen, photoEditorSrc, photoEditorForId, setArchiveTargetId, setArchiveDialogOpen]
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
                <Input
                  type="date"
                  value={newDob}
                  onChange={(e) =>
                    setNewDob(
                      (e.currentTarget as HTMLInputElement).value
                    )
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


