// apps/organizations/src/App-Organizations.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Card, Button, Input, EmptyState } from "@bhq/ui";
import { makeApi } from "./api";

/** ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────────────────────── */
type OrgRow = {
  id: number;
  name: string;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  // address
  street?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  tags: string[];
  status: "Active" | "Archived";
  created_at: string;
  updated_at: string;
  notes?: string | null;
};

type SortDir = "asc" | "desc";
type SortRule = { key: keyof OrgRow & string; dir: SortDir };

type ColumnDef =
  | { key: keyof OrgRow & string; label: string; default: boolean; type?: "text" | "tags" | "status" | "date" };

/** ─────────────────────────────────────────────────────────────────────────────
 * Columns (close to Contacts parity)
 * ──────────────────────────────────────────────────────────────────────────── */
const ALL_COLUMNS: ReadonlyArray<ColumnDef> = [
  { key: "name", label: "Organization", default: true, type: "text" },
  { key: "website", label: "Website", default: false, type: "text" },
  { key: "email", label: "Email", default: true, type: "text" },
  { key: "phone", label: "Phone", default: true, type: "text" },
  { key: "tags", label: "Tags", default: true, type: "tags" },
  { key: "status", label: "Status", default: true, type: "status" },
  { key: "city", label: "City", default: false, type: "text" },
  { key: "state", label: "State/Region", default: false, type: "text" },
  { key: "country", label: "Country", default: false, type: "text" },
  { key: "updated_at", label: "Last Modified", default: true, type: "date" },
  { key: "created_at", label: "Created", default: false, type: "date" },
] as const;

/** ─────────────────────────────────────────────────────────────────────────────
 * Storage keys (Contacts parity; rows never go to localStorage)
 * ──────────────────────────────────────────────────────────────────────────── */
const COL_STORAGE_KEY = "bhq_org_cols_v2";
const SORT_STORAGE_KEY = "bhq_org_sorts_v2";
const PAGE_SIZE_STORAGE_KEY = "bhq_org_pagesize_v2";
const FILTERS_STORAGE_KEY = "bhq_org_filters_v2";
const Q_STORAGE_KEY = "bhq_org_q_v2";
const SHOW_FILTERS_STORAGE_KEY = "bhq_org_showfilters_v2";

/** ─────────────────────────────────────────────────────────────────────────────
 * Small utils
 * ──────────────────────────────────────────────────────────────────────────── */
const cn = (...s: Array<string | false | null | undefined>) => s.filter(Boolean).join(" ");

function getOverlayRoot(): HTMLElement {
  let el = document.getElementById("bhq-top-layer") as HTMLElement | null;
  if (!el) {
    el = document.createElement("div");
    el.id = "bhq-top-layer";
    Object.assign(el.style, {
      position: "fixed",
      inset: "0",
      zIndex: "2147483647",
      pointerEvents: "none",
    } as CSSStyleDeclaration);
    document.body.appendChild(el);
  }
  return el;
}
function setOverlayHostInteractive(enabled: boolean) {
  const el = getOverlayRoot();
  el.style.pointerEvents = enabled ? "auto" : "none";
}

function getPlatformOrgIds(): number[] {
  const w: any = window as any;
  const ids = [Number(w?.platform?.currentOrgId), Number(w?.platform?.userOrgId)]
    .filter(n => Number.isFinite(n) && n > 0);
  return Array.from(new Set(ids));
}

const fmtDate = (iso?: string | null) => {
  if (!iso) return "None";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
};
const prettyPhone = (v?: string | null) => {
  if (!v) return "None";
  const digits = String(v).replace(/[^\d]/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return `+1 ${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return v;
};

/** ─────────────────────────────────────────────────────────────────────────────
 * API adapters
 * ──────────────────────────────────────────────────────────────────────────── */
const api = (() => { try { return makeApi(); } catch { return null as any; } })();

function normalizeOrgFromApi(x: any): OrgRow {
  const statusRaw = String(x?.status ?? "").toLowerCase();
  const status: OrgRow["status"] = statusRaw === "archived" ? "Archived" : "Active";
  const addr = x?.address ?? {};
  return {
    id: Number(x?.id ?? x?.orgId ?? x?.organizationId ?? x?.organizationID ?? x?.orgID ?? 0),
    name: x?.name ?? x?.displayName ?? x?.company ?? `Org ${x?.id ?? ""}`,
    website: x?.website ?? x?.url ?? null,
    email: x?.email ?? null,
    phone: x?.phone ?? null,
    street: addr?.street ?? x?.street ?? null,
    street2: addr?.street2 ?? x?.street2 ?? null,
    city: addr?.city ?? x?.city ?? null,
    state: addr?.state ?? x?.state ?? null,
    zip: addr?.zip ?? addr?.postal ?? x?.zip ?? x?.postal ?? null,
    country: addr?.country ?? x?.country ?? null,
    tags: Array.isArray(x?.tags) ? x.tags : [],
    status,
    created_at: x?.createdAt ?? x?.created_at ?? new Date().toISOString(),
    updated_at: x?.updatedAt ?? x?.updated_at ?? x?.createdAt ?? new Date().toISOString(),
    notes: x?.notes ?? null,
  };
}

async function apiListOrganizations(params: { q?: string; limit?: number; offset?: number; includeArchived?: boolean } = {}): Promise<OrgRow[]> {
  try {
    if (api?.organizations?.list) {
      const r = await api.organizations.list({ ...params, includeArchived: !!params.includeArchived });
      const arr = Array.isArray(r?.items) ? r.items : Array.isArray(r) ? r : [];
      return arr.map(normalizeOrgFromApi);
    }
    if (api?.listOrganizations) {
      const arr = await api.listOrganizations(params);
      return (Array.isArray(arr) ? arr : []).map(normalizeOrgFromApi);
    }
  } catch { /* noop */ }
  return [];
}
async function apiCreateOrganization(payload: Partial<OrgRow>): Promise<OrgRow | null> {
  try {
    const body: any = {
      name: payload.name,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      website: payload.website ?? null,
      address: {
        street: payload.street ?? null,
        street2: payload.street2 ?? null,
        city: payload.city ?? null,
        state: payload.state ?? null,
        zip: payload.zip ?? null,
        country: payload.country ?? null,
      },
      notes: payload.notes ?? null,
    };
    if (api?.organizations?.create) return normalizeOrgFromApi(await api.organizations.create(body));
    if (api?.createOrganization) return normalizeOrgFromApi(await api.createOrganization(body));
  } catch { }
  return null;
}
async function apiUpdateOrganization(id: number, patch: Partial<OrgRow>): Promise<OrgRow | null> {
  try {
    const body: any = {
      name: patch.name,
      email: patch.email ?? null,
      phone: patch.phone ?? null,
      website: patch.website ?? null,
      address: {
        street: patch.street ?? null,
        street2: patch.street2 ?? null,
        city: patch.city ?? null,
        state: patch.state ?? null,
        zip: patch.zip ?? null,
        country: patch.country ?? null,
      },
      notes: patch.notes ?? null,
    };
    if (api?.organizations?.update) return normalizeOrgFromApi(await api.organizations.update(id, body));
    if (api?.updateOrganization) return normalizeOrgFromApi(await api.updateOrganization(id, body));
  } catch { }
  return null;
}
async function apiArchiveOrganization(id: number): Promise<OrgRow | null> {
  try {
    if (api?.organizations?.archive) return normalizeOrgFromApi(await api.organizations.archive(id));
    if (api?.archiveOrganization) return normalizeOrgFromApi(await api.archiveOrganization(id));
  } catch { }
  return null;
}
async function apiRestoreOrganization(id: number): Promise<OrgRow | null> {
  try {
    if (api?.organizations?.restore) return normalizeOrgFromApi(await api.organizations.restore(id));
    if (api?.restoreOrganization) return normalizeOrgFromApi(await api.restoreOrganization(id));
  } catch { }
  return null;
}

/** ─────────────────────────────────────────────────────────────────────────────
 * Tiny atoms
 * ──────────────────────────────────────────────────────────────────────────── */
const Checkbox: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = "", ...props }) => (
  <input type="checkbox" className={cn("h-3 w-3 align-middle", className)} {...props} />
);
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = "", children, ...props }) => (
  <select
    className={cn(
      "px-2 py-1 rounded-md border-hairline text-xs w-full",
      "text-primary bg-surface border-hairline-hairline focus:outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]",
      className
    )}
    {...props}
  >{children}</select>
);
const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = "", ...props }) => (
  <textarea
    className={cn(
      "px-2 py-1 rounded-md border-hairline text-sm w-full",
      "border-hairline-hairline bg-surface text-primary outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]",
      className
    )}
    {...props}
  />
);
function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border-hairline border-hairline-hairline bg-surface">{children}</span>;
}
function Th({ children, sort, onSort }: { children: React.ReactNode; sort?: "asc" | "desc"; onSort?: (withShift: boolean) => void; }) {
  const Up = () => <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden><path d="M7 14l5-5 5 5" fill="none" stroke="currentColor" strokeWidth="2" /></svg>;
  const Down = () => <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden><path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" /></svg>;
  return (
    <th
      className="px-3 py-2 text-center text-xs font-semibold text-secondary border-hairline-b border-hairline-hairline select-none cursor-pointer"
      onClick={(e) => onSort?.((e as any).shiftKey)}
    >
      <div className="inline-flex items-center justify-center gap-1 w-full">
        {children}
        {sort === "asc" && <Up />}
        {sort === "desc" && <Down />}
      </div>
    </th>
  );
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-1">
      <div className="text-sm w-28 shrink-0 text-secondary">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

/** Contacts-style Modal with overlay blur and pointer-events control */
function Modal({
  open, onClose, title, children, footer,
}: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode;
}) {
  useEffect(() => { setOverlayHostInteractive(open); return () => setOverlayHostInteractive(false); }, [open]);
  if (!open) return null;
  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[9999] pointer-events-none flex items-start justify-center p-4">
        <div
          className="pointer-events-auto w-[min(720px,calc(100vw-2rem))] rounded-2xl border-hairline border-hairline-hairline bg-surface text-primary shadow-[0_24px_80px_rgba(0,0,0,0.45)] p-4 mt-12"
          role="dialog" aria-modal="true"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">×</Button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto pr-1">{children}</div>
          <div className="mt-3 flex items-center justify-end gap-2">{footer}</div>
        </div>
      </div>
    </>,
    getOverlayRoot()
  );
}

function Popover({
  open, onOpenChange, anchor, children, position = "auto",
}: { open: boolean; onOpenChange: (v: boolean) => void; anchor: React.ReactNode; children: React.ReactNode; position?: "auto" | "fixed-top-right"; }) {
  useEffect(() => { setOverlayHostInteractive(open); return () => setOverlayHostInteractive(false); }, [open]);
  return (
    <div className={cn(position === "auto" ? "relative inline-flex align-middle" : "inline-flex align-middle")}>
      <div onClick={() => onOpenChange(!open)} className="inline-flex align-middle">{anchor}</div>
      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => onOpenChange(false)} />
          <div
            className={cn(
              "z-[9999] rounded-md border-hairline border-hairline-hairline bg-surface text-primary shadow-lg p-2",
              position === "fixed-top-right"
                ? "fixed top-16 right-4 w-[min(18rem,calc(100vw-2rem))]"
                : "absolute top-[calc(100%+0.5rem)] right-0 w-72 max-w-[calc(100vw-2rem)]"
            )}
          >
            <button type="button" aria-label="Close" onClick={() => onOpenChange(false)} className="absolute right-1 top-1 p-1 rounded hover:bg-[hsl(var(--brand-orange))]/12">
              ×
            </button>
            {children}
          </div>
        </>,
        getOverlayRoot()
      )}
    </div>
  );
}

/** ChecklistFilter (Contacts parity) */
function ChecklistFilter({
  label, options, values, onChange,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [needle, setNeedle] = useState("");
  const anchorRef = useRef<HTMLButtonElement | null>(null);

  const filtered = useMemo(() => {
    const n = needle.trim().toLowerCase();
    if (!n) return options;
    return options.filter((o) => o.label.toLowerCase().includes(n) || o.value.toLowerCase().includes(n));
  }, [needle, options]);

  const summary = values.length === 0 ? "Any" : `${values.length} selected`;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      anchor={
        <Button ref={anchorRef as any} variant="outline" size="sm" type="button">
          {label}: {summary}
        </Button>
      }
    >
      <div className="w-64">
        <div className="mb-2">
          <Input
            value={needle}
            onChange={(e) => setNeedle(e.currentTarget.value)}
            placeholder={`Search ${label.toLowerCase()}...`}
          />
        </div>
        <div className="max-h-64 overflow-auto pr-1 space-y-1">
          {filtered.map((opt) => {
            const checked = values.includes(opt.value);
            return (
              <label key={opt.value} className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-[hsl(var(--brand-orange))]/10 cursor-pointer">
                <Checkbox
                  checked={checked}
                  onChange={(e) => {
                    const next = new Set(values);
                    if (e.currentTarget.checked) next.add(opt.value);
                    else next.delete(opt.value);
                    onChange(Array.from(next));
                  }}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            );
          })}
          {filtered.length === 0 && <div className="text-sm text-secondary px-1 py-1">No matches</div>}
        </div>
        <div className="mt-2 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onChange([])}>Clear</Button>
          <Button size="sm" onClick={() => setOpen(false)}>Done</Button>
        </div>
      </div>
    </Popover>
  );
}

/** FilterRow */
function FilterRow({
  visibleColumns,
  filters,
  setFilters,
  allTags,
}: {
  visibleColumns: ReadonlyArray<ColumnDef>;
  filters: Record<string, string>;
  setFilters: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  allTags: string[];
}) {
  const statusOptions = useMemo(() => [
    { value: "Active", label: "Active" },
    { value: "Archived", label: "Archived" },
  ], []);
  const tagOptions = useMemo(
    () => Array.from(new Set(allTags)).sort().map((t) => ({ value: t, label: t })),
    [allTags]
  );

  const valuesFor = (key: string) => {
    const raw = filters[key] || "";
    return raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
    };

  return (
    <div className="rounded-md border-hairline border-hairline-hairline bg-surface p-2 space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="md:col-span-3">
          <Input
            placeholder="Search all fields..."
            value={filters.__text || ""}
            onChange={(e) => setFilters((f) => ({ ...f, __text: e.currentTarget.value }))}
          />
        </div>

        {visibleColumns.map((c) => {
          if (c.type === "date") {
            const startKey = `${c.key}Start`;
            const endKey = `${c.key}End`;
            return (
              <div key={c.key} className="flex items-center gap-2">
                <div className="w-28 text-xs text-secondary">{c.label}</div>
                <Input
                  type="date"
                  value={filters[startKey] || ""}
                  onChange={(e) => setFilters((f) => ({ ...f, [startKey]: e.currentTarget.value }))}
                />
                <span className="text-secondary text-xs">to</span>
                <Input
                  type="date"
                  value={filters[endKey] || ""}
                  onChange={(e) => setFilters((f) => ({ ...f, [endKey]: e.currentTarget.value }))}
                />
              </div>
            );
          }
          if (c.type === "status") {
            const key = "status";
            return (
              <ChecklistFilter
                key={c.key}
                label="Status"
                options={statusOptions}
                values={valuesFor(key)}
                onChange={(vals) => setFilters((f) => ({ ...f, [key]: vals.join(",") }))}
              />
            );
          }
          if (c.type === "tags") {
            const key = "tags";
            return (
              <ChecklistFilter
                key={c.key}
                label="Tags"
                options={tagOptions}
                values={valuesFor(key)}
                onChange={(vals) => setFilters((f) => ({ ...f, [key]: vals.join(",") }))}
              />
            );
          }
          return (
            <div key={c.key} className="flex items-center gap-2">
              <div className="w-28 text-xs text-secondary">{c.label}</div>
              <Input
                placeholder={`Filter ${c.label.toLowerCase()}`}
                value={filters[c.key] || ""}
                onChange={(e) => setFilters((f) => ({ ...f, [c.key]: e.currentTarget.value }))}
              />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setFilters({})}>Clear</Button>
      </div>
    </div>
  );
}

function ColumnsPopover({
  columns,
  onToggle,
  onSet,
}: {
  columns: Record<string, boolean>;
  onToggle: (k: string) => void;
  onSet: (next: Record<string, boolean>) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  React.useEffect(() => {
    setOverlayHostInteractive(open);
    return () => setOverlayHostInteractive(false);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const W = 320, PAD = 12;
    const sync = () => {
      const el = btnRef.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const right = Math.min(window.innerWidth - PAD, r.right);
      const left = Math.max(PAD, right - W);
      const estH = 360;
      const below = r.bottom + 8;
      const above = Math.max(PAD, r.top - estH - 8);
      const top = below + estH + PAD > window.innerHeight ? above : Math.min(window.innerHeight - PAD, below);
      setPos({ top, left });
    };
    const getScrollParents = (el: HTMLElement | null) => {
      const out: HTMLElement[] = [];
      let p = el?.parentElement!;
      while (p) {
        const s = getComputedStyle(p);
        if (/(auto|scroll|overlay)/.test(`${s.overflow}${s.overflowY}${s.overflowX}`)) out.push(p);
        p = p.parentElement!;
      }
      return out;
    };
    const parents = getScrollParents(btnRef.current);
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, { passive: true });
    parents.forEach((n) => n.addEventListener("scroll", sync, { passive: true }));
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync);
      parents.forEach((n) => n.removeEventListener("scroll", sync));
    };
  }, [open]);

  const selectAll = () => {
    const next = { ...columns };
    ALL_COLUMNS.forEach((c) => (next[String(c.key)] = true));
    onSet(next);
  };
  const clearAll = () => {
    const next = { ...columns };
    ALL_COLUMNS.forEach((c) => (next[String(c.key)] = false));
    onSet(next);
  };
  const setDefault = () => {
    const ON = new Set(["name", "email", "phone", "tags", "status", "updated_at"]);
    const next = { ...columns };
    ALL_COLUMNS.forEach((c) => (next[String(c.key)] = ON.has(String(c.key))));
    onSet(next);
  };

  const menu =
    open && pos
      ? createPortal(
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 2147483644, background: "transparent", pointerEvents: "auto" }}
          />
          <div
            role="menu"
            className="rounded-md border border-hairline bg-surface p-2 pr-3 shadow-[0_8px_30px_hsla(0,0%,0%,0.35)]"
            style={{
              position: "fixed",
              zIndex: 2147483645,
              top: pos.top,
              left: pos.left,
              width: 320,
              maxWidth: "calc(100vw - 24px)",
              maxHeight: 360,
              overflow: "auto",
            }}
          >
            <div className="flex items-center justify-between px-2 pb-1">
              <div className="text-xs font-medium uppercase text-secondary">Show columns</div>
              <div className="flex items-center gap-3">
                <a role="button" tabIndex={0} onClick={selectAll} className="text-xs font-medium hover:underline" style={{ color: "hsl(24 95% 54%)" }}>All</a>
                <a role="button" tabIndex={0} onClick={setDefault} className="text-xs font-medium hover:underline" style={{ color: "hsl(190 90% 45%)" }}>Default</a>
                <a role="button" tabIndex={0} onClick={clearAll} className="text-xs font-medium text-secondary hover:underline">Clear</a>
              </div>
            </div>

            {ALL_COLUMNS.map((c) => {
              const k = String(c.key);
              const checked = !!columns[k];
              return (
                <label
                  key={k}
                  data-col={k}
                  tabIndex={0}
                  role="checkbox"
                  aria-checked={checked ? "true" : "false"}
                  className="flex items-center gap-2 w-full min-w-0 px-2 py-1.5 text-[13px] leading-5 rounded hover:bg-[hsl(var(--brand-orange))]/12 cursor-pointer select-none"
                  onClick={() => onToggle(k)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      onToggle(k);
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 accent-[hsl(var(--brand-orange))]"
                    aria-label={c.label}
                    checked={checked}
                    onChange={() => onToggle(k)}
                  />
                  <span className="truncate text-primary">{c.label}</span>
                </label>
              );
            })}

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Close</Button>
            </div>
          </div>
        </>,
        getOverlayRoot()
      )
      : null;

  return (
    <div className="relative inline-flex">
      <Button
        ref={btnRef as any}
        variant="outline"
        size="icon"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="h-9 w-9"
        title="Choose columns"
      >
        {/* three vertical bars icon */}
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="5" height="16" rx="1.5" />
          <rect x="10" y="4" width="5" height="16" rx="1.5" />
          <rect x="17" y="4" width="4" height="16" rx="1.5" />
        </svg>
      </Button>
      {menu}
    </div>
  );
}

/** ─────────────────────────────────────────────────────────────────────────────
 * Component
 * ──────────────────────────────────────────────────────────────────────────── */
export default function AppOrganizations() {
  // hide platform org ids (current + user org)
  const [hideOrgIds, setHideOrgIds] = useState<number[]>([]);
  useEffect(() => { setHideOrgIds(getPlatformOrgIds()); }, []);
  useEffect(() => {
    const onChange = (e: any) => {
      const next = Number(e?.detail?.orgId);
      const w: any = window as any;
      const userOrg = Number(w?.platform?.userOrgId);
      const nextIds = [next, userOrg].filter(n => Number.isFinite(n) && n > 0);
      setHideOrgIds(Array.from(new Set(nextIds)));
    };
    window.addEventListener("platform:orgChanged", onChange);
    return () => window.removeEventListener("platform:orgChanged", onChange);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("bhq:module", { detail: { key: "organizations", label: "Organizations" } }));
  }, []);

  const [rows, setRows] = useState<OrgRow[]>([]);
  const [q, setQ] = useState<string>(() => localStorage.getItem(Q_STORAGE_KEY) || "");
  const [showFilters, setShowFilters] = useState<boolean>(() => localStorage.getItem(SHOW_FILTERS_STORAGE_KEY) === "1");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [drawer, setDrawer] = useState<OrgRow | null>(null);
  const [openMenu, setOpenMenu] = useState(false);

  const [columns, setColumns] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(COL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : ALL_COLUMNS.reduce((acc, c) => ({ ...acc, [c.key]: !!c.default }), {} as Record<string, boolean>);
  });
  const [sorts, setSorts] = useState<SortRule[]>(() => {
    const saved = localStorage.getItem(SORT_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [pageSize, setPageSize] = useState<number>(() => Number(localStorage.getItem(PAGE_SIZE_STORAGE_KEY) || 25));
  const [page, setPage] = useState<number>(1);
  const [filtersState, setFiltersState] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => { localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(pageSize)); }, [pageSize]);
  useEffect(() => { localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filtersState)); }, [filtersState]);
  useEffect(() => { localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sorts)); }, [sorts]);
  useEffect(() => { localStorage.setItem(COL_STORAGE_KEY, JSON.stringify(columns)); }, [columns]);
  useEffect(() => { localStorage.setItem(Q_STORAGE_KEY, q); }, [q]);
  useEffect(() => { localStorage.setItem(SHOW_FILTERS_STORAGE_KEY, showFilters ? "1" : "0"); }, [showFilters]);

  // load from API only; exclude archived by default
  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await apiListOrganizations({ includeArchived: false });
      if (!alive) return;
      setRows(list);
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => { setPage(1); }, [q, filtersState, sorts]);

  const visibleColumns = ALL_COLUMNS.filter((c) => columns[c.key]);

  /** Derived helpers */
  const allTags = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => (r.tags || []).forEach((t) => s.add(t)));
    return Array.from(s);
  }, [rows]);

  function applyColumnFilters(data: OrgRow[]) {
    const f = filtersState;
    if (!f || Object.keys(f).length === 0) return data;

    const lc = (v: any) => String(v ?? "").toLowerCase();
    const inRange = (iso: string | null | undefined, start?: string, end?: string) => {
      if (!start && !end) return true;
      const d = iso ? new Date(iso) : null;
      if (!d || Number.isNaN(d.getTime())) return false;
      if (start && d < new Date(start)) return false;
      if (end) {
        const e = new Date(end);
        e.setHours(23, 59, 59, 999);
        if (d > e) return false;
      }
      return true;
    };

    const parseCsv = (s?: string) => (s ? s.split(",").map((x) => x.trim()).filter(Boolean) : []);
    const wantTags = new Set(parseCsv(f.tags));
    const wantStatus = new Set(parseCsv(f.status));

    return data.filter((r) => {
      for (const [k, v] of Object.entries(f)) {
        if (!v) continue;
        if (k === "__text") continue;
        if (k === "tags") {
          if (wantTags.size > 0) {
            const hasAny = (r.tags || []).some((t) => wantTags.has(t));
            if (!hasAny) return false;
          }
          continue;
        }
        if (k === "status") {
          if (wantStatus.size > 0 && !wantStatus.has(r.status)) return false;
          continue;
        }
        if (k.endsWith("Start") || k.endsWith("End")) continue;

        const rv = (r as any)[k];
        if (!lc(rv).includes(lc(v))) return false;
      }

      const createdOk = inRange(r.created_at, f.created_atStart, f.created_atEnd);
      if (!createdOk) return false;
      const updatedOk = inRange(r.updated_at, f.updated_atStart, f.updated_atEnd);
      if (!updatedOk) return false;

      return true;
    });
  }

  const filtered = useMemo(() => {
    const text = (filtersState.__text ?? q).trim().toLowerCase();

    let data = [...rows];

    // hide platform org ids
    if (hideOrgIds.length) {
      const hide = new Set(hideOrgIds.map(Number));
      data = data.filter(r => !hide.has(Number(r.id)));
    }

    // exclude archived unless filter explicitly includes it
    const statusFilter = (filtersState.status || "").split(",").map(s => s.trim()).filter(Boolean);
    const wantsArchived = statusFilter.includes("Archived");
    if (!wantsArchived) data = data.filter(r => r.status !== "Archived");

    if (text) {
      data = data.filter((r) => {
        const values = [
          r.name, r.website, r.email, r.phone, r.street, r.street2, r.city, r.state, r.zip, r.country,
          (r.tags || []).join(" "), r.status, r.created_at, r.updated_at,
        ].join(" ").toLowerCase();
        return values.includes(text);
      });
    }

    data = applyColumnFilters(data);

    if (sorts.length) {
      data.sort((a, b) => {
        for (const s of sorts) {
          const av = (a as any)[s.key] ?? "";
          const bv = (b as any)[s.key] ?? "";
          const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" });
          if (cmp !== 0) return s.dir === "asc" ? cmp : -cmp;
        }
        return 0;
      });
    }
    return data;
  }, [rows, hideOrgIds, q, sorts, filtersState]);

  // pagination
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const start = (clampedPage - 1) * pageSize;
  const end = start + pageSize;
  const pageRows = filtered.slice(start, end);

  function toggleAll(v: boolean) { setSelected(v ? new Set(filtered.map((r) => r.id)) : new Set()); }
  function toggleOne(id: number) { const next = new Set(selected); next.has(id) ? next.delete(id) : next.add(id); setSelected(next); }
  function cycleSort(key: string, withShift: boolean) {
    const existing = sorts.find((s) => s.key === key);
    let next = [...sorts];
    if (!withShift) next = sorts.filter((s) => s.key !== key);
    if (!existing) next.push({ key, dir: "asc" } as SortRule);
    else if (existing.dir === "asc") next = next.map((s) => (s.key === key ? { ...s, dir: "desc" } : s));
    else next = next.filter((s) => s.key !== key);
    setSorts(next);
  }

  function exportCsv() {
    const cols = visibleColumns.map((c) => c.label);
    const keys = visibleColumns.map((c) => c.key);
    const lines: string[] = [];
    lines.push(cols.join(","));
    for (const r of filtered) {
      const vals = keys.map((k) => {
        const v = (r as any)[k];
        if (k === "phone") return prettyPhone(v);
        if (k === "updated_at" || k === "created_at") return fmtDate(v);
        if (k === "tags") return '"' + (r.tags || []).join("|") + '"';
        return String(v ?? "").replace(/,/g, " ");
      });
      lines.push(vals.join(","));
    }
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "organizations.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function handleBulkArchive() {
    if (selected.size === 0) return;
    const ok = confirm(`Archive ${selected.size} organization(s)?`);
    if (!ok) return;
    const ids = Array.from(selected);
    const results = await Promise.all(ids.map(id => apiArchiveOrganization(id)));
    const okCount = results.filter(Boolean).length;
    if (okCount > 0) {
      setRows(prev => prev.map(r => {
        if (ids.includes(r.id)) return { ...r, status: "Archived", updated_at: new Date().toISOString() };
        return r;
      }));
      if (drawer && ids.includes(drawer.id)) {
        setDrawer(prev => prev ? { ...prev, status: "Archived", updated_at: new Date().toISOString() } : prev);
      }
    }
    setSelected(new Set());
  }

  // create/edit
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const emptyForm: Partial<OrgRow> = {
    name: "", website: "", email: "", phone: "",
    street: "", street2: "", city: "", state: "", zip: "", country: "US",
    tags: [], status: "Active", notes: "",
  };
  const [form, setForm] = useState<Partial<OrgRow>>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  function openCreate() { setEditingId(null); setForm(emptyForm); setErrors({}); setFormOpen(true); }
  function openEdit(row: OrgRow) {
    setEditingId(row.id);
    setForm({
      ...row,
      // normalize undefined to empty strings for inputs
      website: row.website ?? "",
      email: row.email ?? "",
      phone: row.phone ?? "",
      street: row.street ?? "",
      street2: row.street2 ?? "",
      city: row.city ?? "",
      state: row.state ?? "",
      zip: row.zip ?? "",
      country: row.country ?? "US",
      notes: row.notes ?? "",
    });
    setErrors({});
    setFormOpen(true);
  }
  function validateForm(f: Partial<OrgRow>) {
    const e: Record<string, string> = {};
    if (!f.name || String(f.name).trim().length < 2) e.name = "Organization name is required";
    if (f.email) {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(f.email));
      if (!ok) e.email = "Invalid email format";
    }
    return e;
  }
  async function handleSave() {
    const e = validateForm(form);
    setErrors(e);
    if (Object.keys(e).length) return;

    if (editingId == null) {
      // CREATE via API only; no local fallback
      const created = await apiCreateOrganization(form);
      if (!created) {
        alert("Unable to save organization. Please try again.");
        return;
      }
      setRows((prev) => [created, ...prev]);
      setFormOpen(false);
      setDrawer(created);
    } else {
      // UPDATE via API only; no local fallback
      const updated = await apiUpdateOrganization(editingId, form);
      if (!updated) {
        alert("Unable to update organization. Please try again.");
        return;
      }
      setRows((prev) => prev.map((r) => (r.id === editingId ? updated : r)));
      setFormOpen(false);
      setDrawer(updated);
    }
  }

  const hasRows = filtered.length > 0;

  return (
    <div className="w-full min-h-screen bg-page dark:bg-surface-strong p-6 space-y-4">
      {/* toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="pr-2 flex-none w-full sm:w-[480px] md:w-[560px] lg:w-[640px] max-w-full">
          <div className="relative w-full">
            {/* magnifier */}
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>

            <Input
              id="orgs-search"
              value={q}
              onChange={(e) => setQ(e.currentTarget.value)}
              placeholder="Search any field..."
              aria-label="Search organizations"
              className="pl-9 pr-20 w-full h-10 rounded-full shadow-sm bg-surface border border-hairline focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))] focus:outline-none"
            />

            {/* clear */}
            {q && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQ("")}
                className="absolute right-12 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[hsl(var(--brand-orange))]/12"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}

            {/* divider */}
            <span aria-hidden className="absolute right-9 top-1/2 -translate-y-1/2 h-5 w-px bg-hairline" />

            {/* filter toggle */}
            <button
              type="button"
              aria-label="Toggle filters"
              aria-pressed={showFilters ? "true" : "false"}
              onClick={(e) => { setShowFilters(v => !v); (e.currentTarget as HTMLButtonElement).blur(); }}
              className={[
                "absolute right-2 top-1/2 -translate-y-1/2",
                "inline-grid place-items-center h-7 w-7 rounded-full",
                showFilters ? "bg-[hsl(var(--brand-orange))] text-black" : "text-secondary hover:bg-white/10 focus:bg-white/10"
              ].join(" ")}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="7" x2="14" y2="7" />
                <circle cx="18" cy="7" r="1.5" fill="currentColor" />
                <line x1="4" y1="12" x2="11" y2="12" />
                <circle cx="15" cy="12" r="1.5" fill="currentColor" />
                <line x1="4" y1="17" x2="12" y2="17" />
                <circle cx="16" cy="17" r="1.5" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button onClick={openCreate} id="new-org-btn" name="new-org-btn">
            New Organization
          </Button>

          <Popover
            open={openMenu} onOpenChange={setOpenMenu}
            anchor={<Button variant="outline" size="sm" aria-label="More">⋯</Button>}
            position="fixed-top-right"
          >
            <div className="space-y-1">
              <Button variant="ghost" size="sm" onClick={exportCsv}>Export CSV</Button>
              {selected.size > 0 && (
                <Button variant="destructive" size="sm" onClick={handleBulkArchive}>Archive selected</Button>
              )}
            </div>
          </Popover>
        </div>
      </div>

      {showFilters && (
        <FilterRow
          visibleColumns={visibleColumns}
          filters={filtersState}
          setFilters={setFiltersState}
          allTags={allTags}
        />
      )}

      {/* list */}
      {hasRows ? (
        <>
          <div className="relative overflow-auto rounded-md border-hairline border-hairline-hairline">
            <table className="w-full border-hairline-separate border-hairline-spacing-0">
              <thead className="sticky top-0 bg-surface z-0">
                <tr>
                  <th className="px-2 py-2 text-center border-hairline-b border-hairline-hairline w-1">
                    <Checkbox
                      checked={selected.size > 0 && selected.size === filtered.length}
                      onChange={(e) => toggleAll(e.currentTarget.checked)}
                      aria-label="Toggle all"
                    />
                  </th>
                  {visibleColumns.map((c) => {
                    const active = sorts.find((s) => s.key === c.key)?.dir;
                    return (
                      <Th key={c.key} onSort={(withShift) => cycleSort(c.key as string, withShift)} sort={active}>
                        {c.label}
                      </Th>
                    );
                  })}
                  <th className="px-2 py-2 text-right border-hairline-b border-hairline-hairline w-[56px]">
                    <ColumnsPopover
                      columns={columns}
                      onToggle={(k) => setColumns((prev) => ({ ...prev, [k]: !prev[k] }))}
                      onSet={setColumns}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.id} className="hover:bg-[hsl(var(--brand-orange))]/8" onClick={() => setDrawer(r)}>
                    <td className="px-2 py-2 border-hairline-b border-hairline-hairline text-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} aria-label={`Select ${r.name}`} />
                    </td>
                    {visibleColumns.map((c) => {
                      const k = c.key as keyof OrgRow;
                      let v: any = (r as any)[k];
                      if (k === "phone") v = prettyPhone(v);
                      if (k === "created_at" || k === "updated_at") v = fmtDate(v);
                      if (k === "tags") v = (r.tags || []).length ? <div className="flex flex-wrap gap-1">{r.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div> : "None";
                      if (k === "website" && v) v = <a className="underline" href={String(v)} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer">{String(v)}</a>;
                      return (
                        <td key={String(k)} className="px-3 py-2 text-center text-xs text-primary border-hairline-b border-hairline-hairline">
                          {v ?? "None"}
                        </td>
                      );
                    })}
                    <td className="px-2 py-2 border-hairline-b border-hairline-hairline text-right" onClick={(e) => e.stopPropagation()} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-secondary">
              Showing <strong>{start + 1}</strong>–<strong>{Math.min(end, filtered.length)}</strong> of <strong>{filtered.length}</strong>
            </div>
            <div className="flex items-center gap-2">
              <Select value={String(pageSize)} onChange={(e) => setPageSize(Number(e.currentTarget.value))} aria-label="Rows per page" className="w-[7.5rem]">
                {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
              </Select>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={clampedPage <= 1}>Prev</Button>
              <div className="min-w-[3ch] text-center">{clampedPage}</div>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={clampedPage >= pageCount}>Next</Button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title="No organizations found"
          action={<Button onClick={openCreate}>New Organization</Button>}
          description="Try adjusting filters or adding a new record."
        />
      )}

      {/* Details panel (Contacts-style) */}
      {drawer && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md" onClick={() => setDrawer(null)} />
          <section
            className={[
              "fixed z-50 left-1/2 top-14 -translate-x-1/2",
              "w-[min(1100px,calc(100vw-3rem))] max-h-[85vh] overflow-y-auto",
              "rounded-2xl border-hairline border-hairline-hairline bg-surface text-primary",
              "shadow-[0_24px_80px_rgba(0,0,0,0.45)]",
            ].join(" ")}
            role="dialog" aria-modal="true" aria-label={drawer.name}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-hairline-b border-hairline-hairline">
              <div className="h-8 w-8 rounded-md bg-neutral-800 inline-grid place-items-center">🏢</div>
              <div className="min-w-0">
                <div className="text-lg font-semibold leading-tight truncate">{drawer.name}</div>
                <div className="text-xs text-secondary truncate">
                  {drawer.website ? (
                    <a className="underline" href={drawer.website} target="_blank" rel="noreferrer">
                      {drawer.website}
                    </a>
                  ) : "No website"}
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {drawer.status === "Active" ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={async () => {
                      const ok = confirm(`Archive "${drawer.name}"? Existing links will remain, but it will be hidden from selectors.`);
                      if (!ok) return;
                      const updated = await apiArchiveOrganization(drawer.id);
                      if (updated) {
                        setRows(prev => prev.map(r => r.id === drawer.id ? updated : r));
                        setDrawer(updated);
                      }
                    }}
                  >
                    Archive
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const updated = await apiRestoreOrganization(drawer.id);
                      if (updated) {
                        setRows(prev => prev.map(r => r.id === drawer.id ? updated : r));
                        setDrawer(updated);
                      }
                    }}
                  >
                    Restore
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => openEdit(drawer)}>Edit</Button>
                <Button variant="ghost" size="icon" aria-label="Close" onClick={() => setDrawer(null)}>×</Button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card label="Email / Phone / Website">
                  <Row label="Email" value={drawer.email || "None"} />
                  <Row label="Phone" value={drawer.phone ? prettyPhone(drawer.phone) : "None"} />
                  <Row
                    label="Website"
                    value={
                      drawer.website ? (
                        <a href={drawer.website} target="_blank" rel="noreferrer" className="underline">
                          {drawer.website}
                        </a>
                      ) : "None"
                    }
                  />
                </Card>

                <Card label="Address">
                  <Row label="Street" value={drawer.street || "None"} />
                  <Row label="Street 2" value={drawer.street2 || "None"} />
                  <Row label="City" value={drawer.city || "None"} />
                  <Row label="State/Region" value={drawer.state || "None"} />
                  <Row label="Zip/Postal" value={drawer.zip || "None"} />
                  <Row label="Country" value={drawer.country || "None"} />
                </Card>

                <Card label="Status & Tags">
                  <Row label="Status" value={drawer.status} />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(drawer.tags || []).length
                      ? drawer.tags.map(t => <span key={t} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border-hairline border-hairline-hairline bg-surface">{t}</span>)
                      : <span className="text-sm">No tags</span>}
                  </div>
                </Card>

                <Card label="Created / Updated">
                  <Row label="Created" value={fmtDate(drawer.created_at)} />
                  <Row label="Updated" value={fmtDate(drawer.updated_at)} />
                </Card>

                <Card label="Notes" className="md:col-span-2">
                  <div className="text-sm whitespace-pre-wrap rounded-md border-hairline border-hairline-hairline bg-surface px-2 py-2 min-h-[80px]">
                    {drawer.notes || "No notes"}
                  </div>
                </Card>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Create/Edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId == null ? "Create Organization" : "Edit Organization"}
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Name (full width on top) */}
          <div className="md:col-span-2">
            <label className="block text-xs mb-1">
              Organization name <span className="text-red-600">*</span>
            </label>
            <Input
              value={form.name ?? ""}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Summit Poodles"
            />
            {errors.name && <div className="text-xs text-red-600 mt-1">{errors.name}</div>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs mb-1">Email</label>
            <Input
              value={form.email ?? ""}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="org@email.com"
            />
            {errors.email && <div className="text-xs text-red-600 mt-1">{errors.email}</div>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs mb-1">Phone</label>
            <Input
              value={form.phone ?? ""}
              onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="(555) 555-5555"
            />
            {errors.phone && <div className="text-xs text-red-600 mt-1">{errors.phone}</div>}
          </div>

          {/* Address block */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs mb-1">Street</label>
              <Input value={form.street ?? ""} onChange={(e) => setForm(f => ({ ...f, street: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs mb-1">Street 2</label>
              <Input value={form.street2 ?? ""} onChange={(e) => setForm(f => ({ ...f, street2: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs mb-1">City</label>
              <Input value={form.city ?? ""} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs mb-1">State/Region</label>
              <Input value={(form.state as string) ?? ""} onChange={(e) => setForm(f => ({ ...f, state: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs mb-1">Zip/Postal</label>
              <Input value={form.zip ?? ""} onChange={(e) => setForm(f => ({ ...f, zip: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs mb-1">Country</label>
              <Input value={(form.country as string) ?? "US"} onChange={(e) => setForm(f => ({ ...f, country: e.target.value }))} />
            </div>
          </div>

          {/* Notes (full width) */}
          <div className="md:col-span-2">
            <label className="block text-xs mb-1">Notes</label>
            <Textarea
              rows={4}
              value={form.notes ?? ""}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Internal notes…"
            />
          </div>
        </div>
      </Modal>

      {/* bulk toolbar */}
      {selected.size > 0 && (
        <div className="fixed bottom-4 right-4 left-4 md:left-auto md:right-6 z-40">
          <div className="rounded-xl border-hairline border-hairline-hairline bg-surface/90 backdrop-blur px-3 py-2 shadow-lg flex items-center gap-2">
            <div className="text-sm">{selected.size} selected</div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportCsv}>Export</Button>
              <Button variant="destructive" size="sm" onClick={handleBulkArchive}>Archive</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
