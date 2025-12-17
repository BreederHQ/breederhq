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
} from "@bhq/ui";

import { Overlay, getOverlayRoot } from "@bhq/ui/overlay";
import { toast } from "@bhq/ui/atoms/Toast";
import "@bhq/ui/styles/table.css";
import { makeApi } from "./api";

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
  };
}

// ───────── Date-picker hoist helpers (copied from Breeding) ─────────

const OVERLAY_ROOT_SELECTOR = "#bhq-overlay-root";

function ensureOverlayRoot(): HTMLElement {
  return (document.querySelector(OVERLAY_ROOT_SELECTOR) as HTMLElement) || document.body;
}

/** Find the outermost popup element we actually want to move. */
function findDatePopup(): HTMLElement | null {
  const candidates = [
    // Radix Popper wrapper
    ...Array.from(document.querySelectorAll<HTMLElement>('[data-radix-popper-content-wrapper]')),
    // react-datepicker
    ...Array.from(document.querySelectorAll<HTMLElement>(".react-datepicker")),
    // react-day-picker
    ...Array.from(document.querySelectorAll<HTMLElement>(".rdp,.rdp-root")),
    // generic open dialogs/menus (fallback)
    ...Array.from(
      document.querySelectorAll<HTMLElement>('[role="dialog"][data-state="open"],[role="menu"][data-state="open"]')
    ),
  ];

  const filtered = candidates.filter((el) => !el.closest("[data-bhq-details]"));

  const list = filtered.length ? filtered : candidates;
  if (!list.length) return null;

  const isVisible = (el: HTMLElement) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.display !== "none" && cs.visibility !== "hidden" && r.width > 8 && r.height > 8;
  };

  list.sort((a, b) => {
    const va = isVisible(a) ? 1 : 0;
    const vb = isVisible(b) ? 1 : 0;
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    return vb - va || rb.width * rb.height - ra.width * ra.height;
  });

  return list[0] || null;
}

/** Wait up to ~300ms for a date popup to mount, then hoist and place it near the trigger. */
function hoistAndPlaceDatePopup(triggerEl: HTMLElement) {
  const root = ensureOverlayRoot();

  let raf = 0;
  let tries = 0;
  const MAX_TRIES = 12; // ~200–300ms

  const place = (pop: HTMLElement) => {
    if (pop.parentNode !== root) root.appendChild(pop);

    Object.assign(pop.style, {
      position: "fixed",
      transform: "none",
      inset: "auto",
      zIndex: "2147483647",
      maxWidth: "none",
      maxHeight: "none",
      overflow: "visible",
      contain: "paint",
      isolation: "auto",
      filter: "none",
      perspective: "none",
      willChange: "top,left",
    } as CSSStyleDeclaration);

    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    const GAP = 8;

    const doPosition = () => {
      const r = triggerEl.getBoundingClientRect();
      const pr = pop.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let top = r.bottom + GAP;
      let left = r.left;

      left = clamp(left, GAP, vw - pr.width - GAP);

      if (top + pr.height > vh - GAP) {
        top = clamp(r.top - pr.height - GAP, GAP, vh - pr.height - GAP);
      } else {
        top = clamp(top, GAP, vh - pr.height - GAP);
      }

      pop.style.top = `${Math.round(top)}px`;
      pop.style.left = `${Math.round(left)}px`;
    };

    doPosition();
    setTimeout(doPosition, 30);

    const onRelayout = () => {
      if (!pop.isConnected) {
        window.removeEventListener("resize", onRelayout);
        window.removeEventListener("scroll", onRelayout, true);
        return;
      }
      doPosition();
    };
    window.addEventListener("resize", onRelayout);
    window.addEventListener("scroll", onRelayout, true);

    const mo = new MutationObserver(() => {
      if (!pop.isConnected) {
        window.removeEventListener("resize", onRelayout);
        window.removeEventListener("scroll", onRelayout, true);
        mo.disconnect();
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  };

  const tick = () => {
    const pop = findDatePopup();
    if (pop) {
      place(pop);
      return;
    }
    if (tries++ < MAX_TRIES) {
      raf = requestAnimationFrame(tick);
    }
  };

  raf = requestAnimationFrame(tick);
}

/** Wire up native date picker to our overlay hoist helper. */
type AttachDatePopupOpts = {
  shell: HTMLElement;
  button: HTMLButtonElement;
  hiddenInput: HTMLInputElement;
  onPopupOpen?: () => void;
  onPopupClose?: () => void;
};

function attachDatePopupPositioning(opts: AttachDatePopupOpts) {
  const { shell, button, hiddenInput, onPopupOpen, onPopupClose } = opts;

  if (!shell || !button || !hiddenInput) {
    return () => { };
  }

  let isOpen = false;

  const openPicker = () => {
    if (hiddenInput.disabled || hiddenInput.readOnly) return;

    if (!isOpen) {
      isOpen = true;
      onPopupOpen?.();
    }

    try {
      hiddenInput.focus();
      const anyInput = hiddenInput as any;
      if (typeof anyInput.showPicker === "function") {
        anyInput.showPicker();
      } else {
        hiddenInput.click();
      }
    } catch {
      // ignore
    }

    hoistAndPlaceDatePopup(button);
  };

  const handleButtonClick = (e: MouseEvent) => {
    e.preventDefault();
    openPicker();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" && (e.altKey || e.metaKey)) {
      e.preventDefault();
      openPicker();
    }
  };

  const handleBlur = () => {
    if (!isOpen) return;
    isOpen = false;
    onPopupClose?.();
  };

  button.addEventListener("click", handleButtonClick);
  shell.addEventListener("keydown", handleKeyDown);
  hiddenInput.addEventListener("blur", handleBlur);

  return () => {
    button.removeEventListener("click", handleButtonClick);
    shell.removeEventListener("keydown", handleKeyDown);
    hiddenInput.removeEventListener("blur", handleBlur);
  };
}

/* CalendarInput: same calendar field used in Breeding */

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

/* CalendarInput: text field + native date picker, shared with Breeding */

function CalendarInput(props: any) {
  const readOnly = !!props.readOnly;
  const className = props.className;
  const inputClassName = props.inputClassName;
  const onChange = props.onChange as
    | React.ChangeEventHandler<HTMLInputElement>
    | undefined;
  const value = props.value as string | undefined;
  const defaultValue = props.defaultValue as string | undefined;
  const placeholder = props.placeholder ?? "mm/dd/yyyy";
  const showIcon = props.showIcon ?? true;

  // Any extra props intended for the visible input
  const rest: any = { ...props };
  delete rest.readOnly;
  delete rest.className;
  delete rest.inputClassName;
  delete rest.onChange;
  delete rest.value;
  delete rest.defaultValue;
  delete rest.placeholder;
  delete rest.showIcon;

  // ISO helpers
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

  const shellRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const hiddenRef = React.useRef<HTMLInputElement>(null);

  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    if (!showIcon) return;

    const shell = shellRef.current;
    const btn = buttonRef.current;
    const hidden = hiddenRef.current;
    if (!shell || !btn || !hidden) return;

    const cleanup = attachDatePopupPositioning({
      shell,
      button: btn,
      hiddenInput: hidden,
      onPopupOpen: () => setExpanded(true),
      onPopupClose: () => setExpanded(false),
    });

    return cleanup;
  }, [showIcon]);

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

  return (
    <div ref={shellRef} className={className}>
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
            ref={buttonRef}
            className="absolute inset-y-0 right-2 flex items-center text-muted-foreground"
            aria-label="Open date picker"
          >
            <span className="text-xs">📅</span>
          </button>
        )}

        {/* Hidden native date input for mobile and popup control */}
        <input
          ref={hiddenRef}
          type="date"
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
      className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/55 p-4"
      onMouseUp={onMouseUp}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="w-full max-w-2xl rounded-lg border border-hairline bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-hairline flex items-center justify-between">
          <div className="text-sm font-semibold">{title}</div>
          <button className="text-secondary hover:text-primary" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-center">
            <div className="rounded-md border border-hairline overflow-hidden">
              <canvas
                ref={canvasRef}
                width={512}
                height={512}
                className="block w-[320px] h-[320px] bg-black cursor-grab active:cursor-grabbing"
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


type Hit = { id: number; name: string; kind: "Organization" | "Contact" };

function OwnershipDetailsEditor({
  row,
  setDraft,
  ownershipLookups,
}: {
  row: AnimalRow;
  setDraft: (p: Partial<AnimalRow>) => void;
  ownershipLookups: any;
}) {
  type Hit = { id: number; name: string; kind: "Organization" | "Contact" };

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
    const id = o.organizationId ?? o.contactId ?? idx;
    return `${o.partyType}:${id}`;
  }

  function ownerDisplay(o: any): string {
    return (
      o.display_name ||
      o.name ||
      o.party_name ||
      (o.contact && o.contact.display_name) ||
      ""
    );
  }

  function normalize(nextRows: OwnershipRow[]) {
    let ensured = [...nextRows];

    if (ensured.length && !ensured.some((r) => r.is_primary)) {
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
      ensured.find((o) => o.is_primary) ?? ensured[0] ?? null;

    const primaryName = primary ? ownerDisplay(primary) || null : null;

    setDraft({
      owners: ensured,
      ownerName: primaryName,
    });
  }

  function addHit(hit: Hit) {
    const row: OwnershipRow =
      hit.kind === "Organization"
        ? {
          partyType: "Organization",
          organizationId: hit.id,
          contactId: null,
          display_name: hit.name,
          is_primary: owners.length === 0,
          percent: owners.length === 0 ? 100 : undefined,
        }
        : {
          partyType: "Contact",
          contactId: hit.id,
          organizationId: null,
          display_name: hit.name,
          is_primary: owners.length === 0,
          percent: owners.length === 0 ? 100 : undefined,
        };

    normalize([...owners, row]);
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
    if (owners[idx].is_primary) return;
    setPrimary(idx);
  }

  function moveSelectedRight() {
    const idx = findSelectedIndex();
    if (idx < 0) return;
    if (!owners[idx].is_primary) return;
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

  const primaryIndex = owners.findIndex((o) => o.is_primary);
  const primaryOwner =
    primaryIndex >= 0 ? owners[primaryIndex] : owners[0] ?? null;
  const additionalOwners =
    primaryOwner == null
      ? owners
      : owners.filter((_, i) => i !== primaryIndex);

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
          ...(orgs || []).map((o: any) => ({
            id: Number(o.id),
            name: String(o.name),
            kind: "Organization" as const,
          })),
          ...(contacts || []).map((c: any) => ({
            id: Number(c.id),
            name: String(c.name),
            kind: "Contact" as const,
          })),
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

  const canMoveLeft =
    findSelectedIndex() >= 0 &&
    !owners[findSelectedIndex()]?.is_primary &&
    owners.length > 0;
  const canMoveRight =
    findSelectedIndex() >= 0 &&
    owners[findSelectedIndex()]?.is_primary &&
    owners.length > 1;

  return (
    <SectionCard title="Ownership">
      {/* Search row, custom so text is never under the icon */}
      <div className="px-2 pt-2 pb-2">
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
          <div className="text-xs text-secondary mb-1">Primary Owner</div>
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
                className="h-8 w-20 rounded-md border border-hairline bg-surface px-2 text-sm"
                value={
                  typeof primaryOwner.percent === "number"
                    ? primaryOwner.percent
                    : 100
                }
                onChange={(e) =>
                  setPercent(
                    primaryIndex >= 0 ? primaryIndex : 0,
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
          <div className="mb-1 text-xs text-secondary">Additional Owners</div>

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
                      r.organizationId === o.organizationId &&
                      r.contactId === o.contactId)
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
                      className="h-8 w-20 rounded-md border border-hairline bg-surface px-2 text-sm"
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
  // Sorted copy of current dates from the server
  const [dates, setDates] = React.useState<string[]>(() =>
    [...(animal.cycleStartDates || [])].sort()
  );
  const [editing, setEditing] = React.useState<Record<string, boolean>>({});
  const [working, setWorking] = React.useState(false);
  const [newDateIso, setNewDateIso] = React.useState<string>("");

  const [confirmDeleteIso, setConfirmDeleteIso] = React.useState<string | null>(null);


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
        toast.success("Cycle start dates saved.");
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
    const t = Date.parse(s.length === 10 ? `${s}T00:00:00Z` : s);
    if (Number.isNaN(t)) return "—";
    return new Date(t).toLocaleDateString();
  }, []);

  const dobIso = React.useMemo(
    () => asISODateOnlyEngine((animal as any)?.dob ?? (animal as any)?.birthDate ?? null),
    [animal]
  );

  const proj = React.useMemo(() => {
    return projectUpcomingCycleStarts(
      {
        species: species as any,
        cycleStartsAsc,
        dob: dobIso ?? null,
        today: todayIso,
      },
      { horizonMonths: 36, maxCount: 12 }
    );
  }, [species, cycleStartsAsc, dobIso, todayIso]);

  const learned = React.useMemo(
    () => ({
      days: Number((proj as any)?.effective?.effectiveCycleLenDays ?? 0),
      source: String((proj as any)?.effective?.source ?? "BIOLOGY"),
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
                      onChange={(e) => {
                        const v = (e.currentTarget as HTMLInputElement).value;
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
              onChange={(e) => {
                const v = (e.currentTarget as HTMLInputElement).value;
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
        partyType: "Organization" | "Contact";
        organizationId: number | null;
        contactId: number | null;
        percent: number;
        isPrimary: boolean;
      };

      type ExistingOwner = {
        id: number;
        partyType: "Organization" | "Contact";
        percent: number | null;
        isPrimary: boolean;
        organization: { id: number | null } | null;
        contact: { id: number | null } | null;
      };

      const normalizeDesired = (r: OwnershipRow): NormalizedDesired => {
        const isOrg = r.partyType === "Organization";

        const orgIdRaw = isOrg
          ? r.organizationId ?? (r as any).organization?.id ?? null
          : null;
        const contactIdRaw = !isOrg
          ? r.contactId ?? (r as any).contact?.id ?? null
          : null;

        const orgId = orgIdRaw != null ? Number(orgIdRaw) : null;
        const contactId = contactIdRaw != null ? Number(contactIdRaw) : null;

        const pct = typeof r.percent === "number" ? r.percent : 0;
        const isPrimary = !!r.is_primary;

        return {
          partyType: r.partyType,
          organizationId: orgId,
          contactId,
          percent: pct,
          isPrimary,
        };
      };

      const keyExisting = (e: ExistingOwner): string => {
        if (e.partyType === "Organization") {
          const id = e.organization?.id;
          return id != null ? `org:${id}` : "org:";
        }
        const id = e.contact?.id;
        return id != null ? `ct:${id}` : "ct:";
      };

      const keyDesired = (d: NormalizedDesired): string => {
        if (d.partyType === "Organization") {
          return d.organizationId != null ? `org:${d.organizationId}` : "org:";
        }
        return d.contactId != null ? `ct:${d.contactId}` : "ct:";
      };

      let existing: ExistingOwner[] = [];
      try {
        const current = await api.animals.owners.list(animalId);
        existing = Array.isArray((current as any)?.items)
          ? (current as any).items
          : [];
      } catch {
        existing = [];
      }

      const desiredNorm = rows.map(normalizeDesired);

      const existingByKey = new Map<string, ExistingOwner>();
      for (const e of existing) {
        existingByKey.set(keyExisting(e), e);
      }

      const desiredByKey = new Map<string, NormalizedDesired>();
      for (const d of desiredNorm) {
        desiredByKey.set(keyDesired(d), d);
      }

      for (const e of existing) {
        const key = keyExisting(e);
        if (!desiredByKey.has(key) && e.id != null) {
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
          partyType: "Organization" | "Contact";
          organizationId?: number | null;
          contactId?: number | null;
          percent: number;
          isPrimary?: boolean;
        } = {
          partyType: d.partyType,
          organizationId: d.organizationId,
          contactId: d.contactId,
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
          if ((e.percent ?? 0) !== d.percent) {
            patch.percent = d.percent;
          }
          if (!!e.isPrimary !== d.isPrimary) {
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
          const nameFromNames = [c.first_name, c.last_name]
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
          const name =
            org.display_name ??
            org.displayName ??
            org.legal_name ??
            org.name ??
            org.trade_name ??
            "Unnamed organization";

          return {
            ...org,
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
                  partyType:
                    o.partyType === "Organization"
                      ? "Organization"
                      : "Contact",
                  organizationId: o.organization?.id ?? null,
                  contactId: o.contact?.id ?? null,
                  display_name:
                    o.organization?.name ?? o.contact?.name ?? "",
                  is_primary: !!o.isPrimary,
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
  }, [api, qDebounced]);

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
        const url = (res && (res.url || res.photoUrl || res.photo_url)) || null;

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
      width: 720,
      placement: "center" as const,
      align: "top" as const,
      fetchRow: async (id: number) => {
        const base = await api.animals.get(id);

        let owners: OwnershipRow[] = [];
        try {
          const resp = await api.animals.owners.list(id);
          const items = Array.isArray((resp as any)?.items)
            ? (resp as any).items
            : Array.isArray(resp)
              ? (resp as any)
              : [];

          owners = items.map(
            (o: any): OwnershipRow => ({
              partyType:
                o.partyType === "Organization"
                  ? "Organization"
                  : "Contact",
              organizationId: o.organization?.id ?? null,
              contactId: o.contact?.id ?? null,
              display_name:
                o.organization?.name ?? o.contact?.name ?? "",
              is_primary: !!o.isPrimary,
              percent:
                typeof o.percent === "number" ? o.percent : undefined,
            })
          );
        } catch {
          owners = [];
        }

        return animalToRow({ ...base, owners });
      },
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
        let ownerNameOverride: string | undefined;
        if (owners && owners.length) {
          const primary = owners.find((o) => o.is_primary);
          ownerNameOverride =
            primary?.display_name ?? owners[0]?.display_name ?? undefined;
          try {
            await syncOwners(id, owners);
          } catch {
          }
        }

        setRows((prev) =>
          prev.map((r) => {
            if (r.id !== id) return r;
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
      }: any) => (
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

                  <div className="lg:col-span-1 flex justify-center lg:justify-end">
                    <div className="relative w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-md bg-neutral-100 dark:bg-neutral-900 border border-hairline overflow-hidden flex items-center justify-center">
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

                      <button
                        type="button"
                        aria-label={row.photoUrl ? "Change photo" : "Upload photo"}
                        className={[
                          "absolute bottom-2 right-2 z-50",
                          "h-10 w-10 rounded-full",
                          "bg-black/80 text-white",
                          "flex items-center justify-center",
                          "shadow-lg ring-1 ring-white/30",
                          "hover:bg-black focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]",
                          "pointer-events-auto",
                        ].join(" ")}
                        onClick={() => {
                          setPhotoEditorForId(row.id);
                          setPhotoEditorSrc(row.photoUrl ?? getPlaceholderForSpecies(row.species));
                          setPhotoEditorOpen(true);
                        }}
                        disabled={photoWorking}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                        </svg>
                      </button>

                      {row.photoUrl && (
                        <button
                          type="button"
                          className="absolute top-2 right-2 rounded-full bg-black/70 text-white p-1 hover:bg-black/90"
                          onClick={() => handleRemovePhoto(row.id)}
                          title="Remove photo"
                          disabled={photoWorking}
                        >
                          <TrashIcon className="h-3 w-3" />
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
                  onSave={async ({ blob }) => {
                    const id = photoEditorForId ?? row.id;
                    await uploadCroppedBlob(id, blob);
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
                            .value as "Dog" | "Cat" | "Horse";
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
                          variant="outline"
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
                          variant="outline"
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
                        onChange={(e) =>
                          setDraft({
                            notes: (e.currentTarget as HTMLTextAreaElement)
                              .value,
                          })
                        }
                      />
                    )}
                  </LV>
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === "cycle" && (
            <CycleTab
              animal={row}
              api={api}
              onSaved={(dates) => setDraft({ cycleStartDates: dates })}
            />
          )}

          {activeTab === "program" && (
            <ProgramTab
              animal={row}
              api={api}
              onSaved={() => { }}
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
      ),
    }),
    [api, orgIdForBreeds, ownershipLookups, breedBrowseApi, syncOwners, photoWorking]
  );

  const [createOpen, setCreateOpen] = React.useState(false);
  const [createWorking, setCreateWorking] = React.useState(false);
  const [createErr, setCreateErr] = React.useState<string | null>(null);

  const [newName, setNewName] = React.useState("");
  const [newSpecies, setNewSpecies] = React.useState<"Dog" | "Cat" | "Horse">(
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

      let toSaveOwners = owners;
      if (toSaveOwners.length === 0) {
        const org = await safeGetCreatingOrg(api);
        if (org) {
          toSaveOwners = [
            {
              partyType: "Organization",
              organizationId: Number(org.id),
              contactId: null,
              display_name:
                (org as any).display_name ||
                (org as any).name ||
                "My Organization",
              is_primary: true,
              percent: 100,
            },
          ];
        }
      }

      let ownerNameOverride: string | null = null;
      if (toSaveOwners.length) {
        const primary =
          toSaveOwners.find((o) => o.is_primary) ?? toSaveOwners[0];
        ownerNameOverride = primary?.display_name ?? null;
      }

      const animalId = Number((created as any).id);

      if (toSaveOwners.length) {
        try {
          await syncOwners(animalId, toSaveOwners as OwnershipRow[]);
        } catch {
        }
      }

      const row = animalToRow({
        ...created,
        owners: toSaveOwners,
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
                  onChange={(e) =>
                    setNewName(
                      (e.currentTarget as HTMLInputElement).value
                    )
                  }
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-secondary">
                  Nickname
                </div>
                <Input
                  value={nickname}
                  onChange={(e) =>
                    setNickname(
                      (e.currentTarget as HTMLInputElement).value
                    )
                  }
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
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const speciesEnum = String(
                        newSpecies
                      ).toUpperCase() as "DOG" | "CAT" | "HORSE";
                      setCustomBreedSpecies(speciesEnum);
                      setOnCustomBreedCreated(
                        () => (created) => {
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
