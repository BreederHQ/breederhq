import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Card, Button, Input, EmptyState, hooks, TableFooter, ColumnsPopover } from "@bhq/ui";
import { makeApi } from "./api";
import { getOverlayRoot } from "@bhq/ui/overlay";

const { useDebounced } = hooks;

type SortDir = "asc" | "desc";
type SortRule = { key: keyof OrgRow & string; dir: SortDir };
type ColumnDef = { key: keyof OrgRow & string; label: string; default: boolean; type?: "text" | "tags" | "status" | "date" };

type OrgRow = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  street?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  tags: string[];
  status: "Active" | "Archived" | string;
  created_at?: string | null;
  updated_at?: string | null;
  notes?: string | null;
};

/* ───────────────────────── Columns (Contacts/Animals parity) ───────────────────────── */
const ALL_COLUMNS: ReadonlyArray<ColumnDef> = [
  { key: "name", label: "Name", default: true, type: "text" },
  { key: "email", label: "Email", default: true, type: "text" },
  { key: "phone", label: "Phone", default: true, type: "text" },
  { key: "website", label: "Website", default: false, type: "text" },
  { key: "city", label: "City", default: false, type: "text" },
  { key: "state", label: "State", default: false, type: "text" },
  { key: "country", label: "Country", default: false, type: "text" },
  { key: "tags", label: "Tags", default: true, type: "tags" },
  { key: "status", label: "Status", default: true, type: "status" },
  { key: "created_at", label: "Created", default: false, type: "date" },
  { key: "updated_at", label: "Updated", default: true, type: "date" },
];
const ORGS_COLUMN_META = ALL_COLUMNS.map(c => ({ key: c.key, label: c.label, default: !!c.default }));
const ORGS_DEFAULT_KEYS = ORGS_COLUMN_META.filter(m => m.default).map(m => m.key);

/* ───────────────────────── Storage keys ───────────────────────── */
const COL_STORAGE_KEY = "bhq_org_cols_v2";
const SORT_STORAGE_KEY = "bhq_org_sorts_v2";
const PAGE_SIZE_STORAGE_KEY = "bhq_org_pagesize_v2";
const FILTERS_STORAGE_KEY = "bhq_org_filters_v2";
const Q_STORAGE_KEY = "bhq_org_q_v2";
const SHOW_FILTERS_STORAGE_KEY = "bhq_org_showfilters_v2";

/* ───────────────────────── Utils ───────────────────────── */
const cn = (...s: Array<string | false | null | undefined>) => s.filter(Boolean).join(" ");
const EMPTY = "—";
const fmtDate = (iso?: string | null) => {
  if (!iso) return EMPTY;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
};
const prettyPhone = (v?: string | null) => {
  if (!v) return EMPTY;
  const digits = String(v).replace(/[^\d]/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return `+1 ${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return v;
};
const normalizeUrl = (u?: string | null) => {
  const s = String(u || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
};
const show = (val: any): any => {
  if (val === null || val === undefined) return EMPTY;
  if (React.isValidElement(val)) return val;
  if (Array.isArray(val)) return val.length ? val : EMPTY;
  const s = String(val).trim();
  if (!s || s.toLowerCase() === "none") return EMPTY;
  return s;
};

/* ───────────────────────── API adapters ───────────────────────── */
const api = (() => { try { return makeApi(); } catch { return null as any; } })();

function shapeOrganization(row: any): OrgRow {
  const status: OrgRow["status"] =
    String(row?.status ?? "").toLowerCase() === "archived" ? "Archived" : "Active";
  const addr = row?.address ?? row ?? {};
  return {
    id: Number(row?.id ?? row?.orgId ?? row?.organizationId ?? row?.organizationID ?? row?.orgID ?? 0),
    name: row?.name ?? row?.displayName ?? row?.company ?? `Org ${row?.id ?? ""}`,
    website: row?.website ?? row?.url ?? null,
    email: row?.email ?? null,
    phone: row?.phoneE164 ?? row?.phone ?? null,
    street: addr?.street ?? null,
    street2: addr?.street2 ?? null,
    city: addr?.city ?? null,
    state: addr?.state ?? null,
    zip: addr?.zip ?? addr?.postal ?? null,
    country: addr?.country ?? null,
    tags: Array.isArray(row?.tags) ? row.tags : [],
    status,
    created_at: row?.createdAt ?? row?.created_at ?? new Date().toISOString(),
    updated_at: row?.updatedAt ?? row?.updated_at ?? row?.createdAt ?? new Date().toISOString(),
    notes: row?.notes ?? null,
  };
}

async function apiListOrganizations(params: { includeArchived?: boolean } = {}): Promise<OrgRow[]> {
  try {
    if (api?.organizations?.list) {
      const r = await api.organizations.list({ ...params, includeArchived: !!params.includeArchived });
      const arr = Array.isArray(r?.items) ? r.items : Array.isArray(r) ? r : [];
      return arr.map(shapeOrganization);
    }
    if (api?.listOrganizations) {
      const arr = await api.listOrganizations(params);
      return (Array.isArray(arr) ? arr : []).map(shapeOrganization);
    }
  } catch { /* noop */ }
  return [];
}
const orNull = (v: any) => (v === "" || v === undefined ? null : v);
function buildOrgPayload(src: Partial<OrgRow>) {
  return {
    name: src.name ?? null,
    email: orNull(src.email),
    phone: orNull(src.phone),
    website: orNull(src.website),
    address: {
      street: orNull(src.street),
      street2: orNull(src.street2),
      city: orNull(src.city),
      state: orNull(src.state),
      zip: orNull(src.zip),
      country: orNull(src.country),
    },
    notes: orNull(src.notes),
  };
}
async function apiCreateOrganization(payload: Partial<OrgRow>): Promise<OrgRow | null> {
  try {
    const body = buildOrgPayload(payload);
    if (api?.organizations?.create) return shapeOrganization(await api.organizations.create(body));
    if (api?.createOrganization) return shapeOrganization(await api.createOrganization(body));
  } catch { }
  return null;
}
async function apiUpdateOrganization(id: number, patch: Partial<OrgRow>): Promise<OrgRow | null> {
  try {
    const body = buildOrgPayload(patch);
    if (api?.organizations?.update) return shapeOrganization(await api.organizations.update(id, body));
    if (api?.updateOrganization) return shapeOrganization(await api.updateOrganization(id, body));
  } catch { }
  return null;
}
async function apiArchiveOrganization(id: number): Promise<OrgRow | null> {
  try {
    if (api?.organizations?.archive) return shapeOrganization(await api.organizations.archive(id));
    if (api?.archiveOrganization) return shapeOrganization(await api.archiveOrganization(id));
  } catch { }
  return null;
}
async function apiRestoreOrganization(id: number): Promise<OrgRow | null> {
  try {
    if (api?.organizations?.restore) return shapeOrganization(await api.organizations.restore(id));
    if (api?.restoreOrganization) return shapeOrganization(await api.restoreOrganization(id));
  } catch { }
  return null;
}
async function apiGetOrganization(id: number): Promise<OrgRow | null> {
  try {
    if (api?.organizations?.get) return shapeOrganization(await api.organizations.get(String(id)));
    if (api?.getOrganization) return shapeOrganization(await api.getOrganization(id));
  } catch { }
  return null;
}

/* ───────────────────────── Tiny UI atoms (same as before) ───────────────────────── */
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = "", children, ...props }) => (
  <select className={cn("px-2 py-1 rounded-md border-hairline text-xs w-full", "text-primary bg-surface border-hairline-hairline focus:outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]", className)} {...props}>{children}</select>
);
const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = "", ...props }) => (
  <textarea className={cn("px-2 py-1 rounded-md border-hairline text-sm w-full", "border-hairline-hairline bg-surface text-primary outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]", className)} {...props} />
);
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-1">
      <div className="text-sm w-28 shrink-0 text-secondary">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; }) {
  if (!open) return null;
  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 pointer-events-none flex items-start justify-center p-4">
        <div className="pointer-events-auto w-[min(780px,calc(100vw-2rem))] rounded-2xl border-hairline border-hairline-hairline bg-surface text-primary shadow-[0_24px_80px_rgba(0,0,0,0.45)] p-4 mt-12" role="dialog" aria-modal="true">
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
function Popover({ open, onOpenChange, anchor, children, position = "auto", }: { open: boolean; onOpenChange: (v: boolean) => void; anchor: React.ReactNode; children: React.ReactNode; position?: "auto" | "fixed-top-right"; }) {
  return (
    <div className={cn(position === "auto" ? "relative inline-flex align-middle" : "inline-flex align-middle")}>
      <div onClick={() => onOpenChange(!open)} className="inline-flex align-middle">{anchor}</div>
      {open && createPortal(
        <>
          <div className="fixed inset-0" onClick={() => onOpenChange(false)} />
          <div className={cn("rounded-md border-hairline border-hairline-hairline bg-surface text-primary shadow-lg p-2",
            position === "fixed-top-right" ? "fixed top-16 right-4 w-[min(18rem,calc(100vw-2rem))]" : "absolute top-[calc(100%+0.5rem)] right-0 w-72 max-w-[calc(100vw-2rem)]")}>
            <button type="button" aria-label="Close" onClick={() => onOpenChange(false)} className="absolute right-1 top-1 p-1 rounded hover:bg-[hsl(var(--brand-orange))]/12">×</button>
            {children}
          </div>
        </>,
        getOverlayRoot()
      )}
    </div>
  );
}

/* ───────────────────────── ChecklistFilter & FilterRow (parity) ───────────────────────── */
function ChecklistFilter({ label, options, values, onChange }: { label: string; options: Array<{ value: string; label: string }>; values: string[]; onChange: (next: string[]) => void; }) {
  const [open, setOpen] = useState(false);
  const [needle, setNeedle] = useState("");
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
      anchor={<Button variant="outline" size="sm" type="button">{label}: {summary}</Button>}
    >
      <div className="w-64">
        <div className="mb-2"><Input value={needle} onChange={(e) => setNeedle(e.currentTarget.value)} placeholder={`Search ${label.toLowerCase()}...`} /></div>
        <div className="max-h-64 overflow-auto pr-1 space-y-1">
          {filtered.map((opt) => {
            const checked = values.includes(opt.value);
            return (
              <label key={opt.value} className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-[hsl(var(--brand-orange))]/10 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--brand-orange))]" checked={checked}
                  onChange={(e) => {
                    const next = e.currentTarget.checked ? [...values, opt.value] : values.filter(v => v !== opt.value);
                    onChange(next);
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

function FilterRow({ visibleColumns, filters, setFilters, allTags }: { visibleColumns: ReadonlyArray<ColumnDef>; filters: Record<string, string>; setFilters: React.Dispatch<React.SetStateAction<Record<string, string>>>; allTags: string[]; }) {
  const statusOptions = useMemo(() => [{ value: "Active", label: "Active" }, { value: "Archived", label: "Archived" }], []);
  const tagOptions = useMemo(() => Array.from(new Set(allTags)).sort().map((t) => ({ value: t, label: t })), [allTags]);
  const valuesFor = (key: string) => (filters[key] || "").split(",").map(s => s.trim()).filter(Boolean);

  return (
    <div className="rounded-md border-hairline border-hairline-hairline bg-surface p-2 space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="md:col-span-3">
          <Input placeholder="Search all fields..." value={filters.__text || ""} onChange={(e) => setFilters((f) => ({ ...f, __text: e.currentTarget.value }))} />
        </div>
        {visibleColumns.map((c) => {
          if (c.type === "date") {
            const startKey = `${c.key}Start`; const endKey = `${c.key}End`;
            return (
              <div key={c.key} className="flex items-center gap-2">
                <div className="w-28 text-xs text-secondary">{c.label}</div>
                <Input type="date" value={filters[startKey] || ""} onChange={(e) => setFilters((f) => ({ ...f, [startKey]: e.currentTarget.value }))} />
                <span className="text-secondary text-xs">to</span>
                <Input type="date" value={filters[endKey] || ""} onChange={(e) => setFilters((f) => ({ ...f, [endKey]: e.currentTarget.value }))} />
              </div>
            );
          }
          if (c.type === "status") {
            const key = "status";
            return <ChecklistFilter key={c.key} label="Status" options={statusOptions} values={valuesFor(key)} onChange={(vals) => setFilters((f) => ({ ...f, [key]: vals.join(",") }))} />;
          }
          if (c.type === "tags") {
            const key = "tags";
            return <ChecklistFilter key={c.key} label="Tags" options={tagOptions} values={valuesFor(key)} onChange={(vals) => setFilters((f) => ({ ...f, [key]: vals.join(",") }))} />;
          }
          return (
            <div key={c.key} className="flex items-center gap-2">
              <div className="w-28 text-xs text-secondary">{c.label}</div>
              <Input placeholder={`Filter ${c.label.toLowerCase()}`} value={filters[c.key] || ""} onChange={(e) => setFilters((f) => ({ ...f, [c.key]: e.currentTarget.value }))} />
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => setFilters({})}>Clear</Button></div>
    </div>
  );
}

/* ───────────────────────── Component ───────────────────────── */
export default function AppOrganizations() {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("bhq:module", { detail: { key: "organizations", label: "Organizations" } }));
  }, []);

  const [rows, setRows] = useState<OrgRow[]>([]);
  const [q, setQ] = useState<string>(() => localStorage.getItem(Q_STORAGE_KEY) || "");
  const dq = useDebounced(q, 300);
  const [showFilters, setShowFilters] = useState<boolean>(() => localStorage.getItem(SHOW_FILTERS_STORAGE_KEY) === "1");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [drawer, setDrawer] = useState<OrgRow | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerEditing, setDrawerEditing] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"overview" | "audit">("overview");
  const [draft, setDraft] = useState<Partial<OrgRow> | null>(null);
  const [openMenu, setOpenMenu] = useState(false);

  // Columns state (map) — match Contacts/Animals API
  const [columns, setColumns] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(COL_STORAGE_KEY);
    return saved
      ? JSON.parse(saved)
      : Object.fromEntries(ALL_COLUMNS.map(c => [c.key, !!c.default])) as Record<string, boolean>;
  });

  const applyColumns = React.useCallback((nextRaw: Record<string, boolean>) => {
    // sanitize to known keys and ensure at least one column enabled
    const next: Record<string, boolean> = {};
    for (const c of ALL_COLUMNS) next[c.key] = !!nextRaw[c.key];
    if (!Object.values(next).some(Boolean)) {
      next[ORGS_DEFAULT_KEYS[0] ?? ALL_COLUMNS[0].key] = true;
    }
    setColumns(next);
    try { localStorage.setItem(COL_STORAGE_KEY, JSON.stringify(next)); } catch { }
  }, []);

  const toggleColumn = (k: string) => applyColumns({ ...columns, [k]: !columns[k] });

  const enabledKeys = useMemo(
    () => ALL_COLUMNS.filter(c => columns[c.key]).map(c => c.key),
    [columns]
  );

  const handleToggleColumn = React.useCallback((key: string) => {
    applyColumns({ ...columns, [key]: !columns[key] });
  }, [columns, applyColumns]);

  const handleSetColumns = React.useCallback((nextKeys: string[]) => {
    const nextMap = Object.fromEntries(
      ALL_COLUMNS.map(c => [c.key, nextKeys.includes(c.key)])
    ) as Record<string, boolean>;
    applyColumns(nextMap);
  }, [applyColumns]);


  const visibleColumns = useMemo(() => ALL_COLUMNS.filter(c => columns[c.key]), [columns]);

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

  // Data
  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await apiListOrganizations({ includeArchived: false });
      if (!alive) return;
      setRows(list);
    })();
    return () => { alive = false; };
  }, []);

  // Drawer hydration + ESC parity
  useEffect(() => {
    if (selectedOrgId == null) return;
    let ignore = false;
    (async () => {
      try {
        const fresh = await apiGetOrganization(Number(selectedOrgId));
        if (!ignore && fresh) setDrawer(fresh);
      } finally { }
    })();
    return () => { ignore = true; };
  }, [selectedOrgId]);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDrawerOpen(false);
        setDrawer(null);
        setDrawerEditing(false);
        setDraft(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  // Clear selection when inputs change (bulk state parity)
  useEffect(() => { setSelected(new Set()); }, [dq, filtersState, sorts, pageSize]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => (r.tags || []).forEach((t) => s.add(t)));
    return Array.from(s);
  }, [rows]);

  // Filter + search + sort (parity)
  const filtered = useMemo(() => {
    const text = (filtersState.__text ?? dq).trim().toLowerCase();
    let data = [...rows];

    // exclude archived unless explicitly included
    const statusFilter = (filtersState.status || "").split(",").map((s) => s.trim()).filter(Boolean);
    const wantsArchived = statusFilter.includes("Archived");
    if (!wantsArchived) data = data.filter((r) => r.status !== "Archived");

    if (text) {
      data = data.filter((r) => {
        const values = [
          r.name, r.website, r.email, r.phone,
          r.street, r.street2, r.city, r.state, r.zip, r.country,
          (r.tags || []).join(" "),
          r.status, r.created_at, r.updated_at,
        ].join(" ").toLowerCase();
        return values.includes(text);
      });
    }

    // Column filters
    const f = filtersState;
    const lc = (v: any) => String(v ?? "").toLowerCase();
    const inRange = (iso: string | null | undefined, start?: string, end?: string) => {
      if (!start && !end) return true;
      const d = iso ? new Date(iso) : null;
      if (!d || Number.isNaN(d.getTime())) return false;
      if (start && d < new Date(start)) return false;
      if (end) { const e = new Date(end); e.setHours(23, 59, 59, 999); if (d > e) return false; }
      return true;
    };
    const parseCsv = (s?: string) => (s ? s.split(",").map((x) => x.trim()).filter(Boolean) : []);
    const wantTags = new Set(parseCsv(f.tags));
    const wantStatus = new Set(parseCsv(f.status));

    data = data.filter((r) => {
      for (const [k, v] of Object.entries(f)) {
        if (!v) continue;
        if (k === "__text") continue;
        if (k === "tags") { if (wantTags.size > 0 && !(r.tags || []).some((t) => wantTags.has(t))) return false; continue; }
        if (k === "status") { if (wantStatus.size > 0 && !wantStatus.has(r.status || "Active")) return false; continue; }
        if (k.endsWith("Start") || k.endsWith("End")) continue;
        const rv = (r as any)[k];
        if (!lc(rv).includes(lc(v))) return false;
      }
      if (!inRange(r.created_at || null, f.created_atStart, f.created_atEnd)) return false;
      if (!inRange(r.updated_at || null, f.updated_atStart, f.updated_atEnd)) return false;
      return true;
    });

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
  }, [rows, dq, sorts, filtersState]);

  // Pagination
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const start = (clampedPage - 1) * pageSize;
  const end = start + pageSize;
  const pageRows = filtered.slice(start, end);
  const from = filtered.length === 0 ? 0 : start + 1;
  const to = Math.min(end, filtered.length);

  function toggleAll(v: boolean) { setSelected(v ? new Set(filtered.map((r) => Number(r.id))) : new Set()); }
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

  // create/edit modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const emptyForm: Partial<OrgRow> = { name: "", website: "", email: "", phone: "", street: "", street2: "", city: "", state: "", zip: "", country: "US", tags: [], status: "Active", notes: "" };
  const [form, setForm] = useState<Partial<OrgRow>>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  function openCreate() { setEditingId(null); setForm(emptyForm); setErrors({}); setFormOpen(true); }
  function openEdit(row: OrgRow) {
    setEditingId(Number(row.id));
    setForm({ ...row, website: row.website ?? "", email: row.email ?? "", phone: row.phone ?? "", street: row.street ?? "", street2: row.street2 ?? "", city: row.city ?? "", state: row.state ?? "", zip: row.zip ?? "", country: row.country ?? "US", notes: row.notes ?? "" });
    setErrors({});
    setFormOpen(true);
  }
  function validateForm(f: Partial<OrgRow>) {
    const e: Record<string, string> = {};
    if (!f.name || String(f.name).trim().length < 2) e.name = "Organization name is required";
    if (f.email) { const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(f.email)); if (!ok) e.email = "Invalid email format"; }
    return e;
  }
  async function handleSave() {
    const e = validateForm(form);
    setErrors(e);
    if (Object.keys(e).length) return;
    if (editingId == null) {
      const created = await apiCreateOrganization(form);
      if (!created) { alert("Unable to save organization. Please try again."); return; }
      setRows((prev) => [created, ...prev]);
      setFormOpen(false);
      setDrawer(created);
      setSelectedOrgId(created.id);
      setIsDrawerOpen(true);
    } else {
      const updated = await apiUpdateOrganization(editingId, form);
      if (!updated) { alert("Unable to update organization. Please try again."); return; }
      setRows((prev) => prev.map((r) => (Number(r.id) === editingId ? updated : r)));
      setFormOpen(false);
      setDrawer(updated);
      setSelectedOrgId(updated.id);
      setIsDrawerOpen(true);
    }
  }

  const hasRows = filtered.length > 0;

  return (
    <div className="w-full bg-page dark:bg-surface-strong p-6 space-y-4">
      {/* toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="pr-2 flex-none w-full sm:w-[480px] md:w-[560px] lg:w-[640px] max-w-full">
          <div className="relative w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <Input id="orgs-search" value={q} onChange={(e) => setQ(e.currentTarget.value)} placeholder="Search any field..." aria-label="Search organizations" className="pl-9 pr-20 w-full h-10 rounded-full shadow-sm bg-surface border border-hairline focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))] focus:outline-none" />
            {q && (
              <button type="button" aria-label="Clear search" onClick={() => setQ("")} className="absolute right-12 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[hsl(var(--brand-orange))]/12">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            )}
            <span aria-hidden className="absolute right-9 top-1/2 -translate-y-1/2 h-5 w-px bg-hairline" />
            <button type="button" aria-label="Toggle filters" aria-pressed={showFilters ? "true" : "false"} onClick={(e) => { setShowFilters((v) => !v); (e.currentTarget as HTMLButtonElement).blur(); }} className={["absolute right-2 top-1/2 -translate-y-1/2", "inline-grid place-items-center h-7 w-7 rounded-full", showFilters ? "bg-[hsl(var(--brand-orange))] text-black" : "text-secondary hover:bg-white/10 focus:bg-white/10"].join(" ")}>
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
          <Button onClick={openCreate} id="new-org-btn" name="new-org-btn">New Organization</Button>
          <Popover open={openMenu} onOpenChange={setOpenMenu} anchor={<Button variant="outline" size="sm" aria-label="More">⋯</Button>} position="fixed-top-right">
            <div className="space-y-1">
              <Button variant="ghost" size="sm" onClick={exportCsv}>Export CSV</Button>
              {selected.size > 0 && <Button variant="destructive" size="sm" onClick={handleBulkArchive}>Archive selected</Button>}
            </div>
          </Popover>
        </div>
      </div>

      {showFilters && <FilterRow visibleColumns={ALL_COLUMNS.filter(c => columns[c.key])} filters={filtersState} setFilters={setFiltersState} allTags={allTags} />}

      {/* table */}
      {hasRows ? (
        <>
          <div>
            <div
              className="bhq-table"
              style={{
                position: 'relative',
                zIndex: 0,
                overflow: 'visible',
                ['--util-col-width' as any]: '44px',
              }}
            >
              <table>
                <colgroup>
                  <col key="sel" style={{ width: 40 }} />
                  {visibleColumns.map((_, i) => <col key={`c-${i}`} />)}
                  <col key="util" style={{ width: "var(--util-col-width)" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className="px-3 py-2 w-10 text-center">
                      {(() => {
                        const allChecked = selected.size > 0 && selected.size === filtered.length;
                        const someChecked = selected.size > 0 && selected.size < filtered.length;
                        return (
                          <input
                            type="checkbox"
                            aria-label="Select all"
                            checked={allChecked}
                            ref={(el) => { if (el) el.indeterminate = someChecked; }}
                            onChange={(e) => toggleAll(e.currentTarget.checked)}
                          />
                        );
                      })()}
                    </th>

                    {visibleColumns.map((c) => {
                      const active = sorts.find((s) => s.key === c.key);
                      const ariaSort = active ? (active.dir === "asc" ? "ascending" : "descending") : undefined;
                      return (
                        <th key={c.key} className="px-3 py-3" {...(ariaSort ? { 'aria-sort': ariaSort as any } : {})}>
                          <button
                            type="button"
                            className={["w-full inline-flex justify-center select-none", active ? "text-primary" : "text-secondary"].join(" ")}
                            onClick={(e) => cycleSort(c.key, e.shiftKey)}
                          >
                            {c.label}
                          </button>
                        </th>
                      );
                    })}

                    {/* Sticky util column holding the ColumnsPopover (matches Animals/Contacts) */}
                    <th className="sticky right-0 bg-surface text-right">
                      <div className="px-2 py-2 w-[var(--util-col-width)] min-w-[var(--util-col-width)]">
                        <ColumnsPopover
                          meta={ORGS_COLUMN_META}
                          defaultKeys={ORGS_DEFAULT_KEYS}
                          enabledKeys={enabledKeys}
                          onToggle={handleToggleColumn}
                          onSet={handleSetColumns}
                        />
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {pageRows.map((r) => (
                    <tr
                      key={String(r.id)}
                      className="cursor-pointer"
                      onClick={() => { setDrawer(r); setSelectedOrgId(Number(r.id)); setDrawerTab("overview"); setIsDrawerOpen(true); }}
                    >
                      <td className="px-3 py-2 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(Number(r.id))}
                          onChange={() => toggleOne(Number(r.id))}
                          aria-label={`Select ${r.name}`}
                        />
                      </td>

                      {visibleColumns.map((c, i) => {
                        const k = c.key as keyof OrgRow;
                        let v: any = (r as any)[k];
                        if (k === "phone") v = prettyPhone(v);
                        if (k === "created_at" || k === "updated_at") v = fmtDate(v);
                        if (k === "tags") v = (r.tags || []).join(", ") || EMPTY;
                        if (k === "website" && v) {
                          const href = normalizeUrl(String(v));
                          v = (
                            <a href={href} onClick={(e) => e.stopPropagation()} target="_blank" rel="noopener noreferrer">
                              {String(v)}
                            </a>
                          );
                        }
                        return (
                          <td key={`${String(k)}-${i}`} className="px-3 py-2">
                            {show(v) ?? EMPTY}
                          </td>
                        );
                      })}

                      {/* Empty util cell to keep column counts aligned with the sticky header cell */}
                      <td className="sticky right-0 bg-surface w-[var(--util-col-width)] min-w-[var(--util-col-width)]" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>  {/* .bhq-table */}
            <div className="mt-2 flex justify-end">

              <TableFooter
                pageIndex={clampedPage - 1}
                pageCount={pageCount}
                pageSize={pageSize}
                total={filtered.length}
                from={from}
                to={to}
                onPageChange={(nextIndex) => setPage(nextIndex + 1)}
                onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
                className="text-sm"
              />
            </div>
          </div>
        </>
      ) : (
        <EmptyState title="No organizations found" action={<Button onClick={openCreate}>New Organization</Button>} description="Try adjusting filters or adding a new record." />
      )}

      {/* Drawer */}
      {isDrawerOpen && drawer && createPortal(
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setIsDrawerOpen(false); setDrawer(null); setDrawerEditing(false); setDraft(null); }} />
          <div className="fixed inset-0 pointer-events-none flex items-start justify-center p-4">
            <div className="pointer-events-auto w-[min(720px,calc(100vw-2rem))] rounded-2xl border-hairline border-hairline-hairline bg-surface text-primary shadow-[0_24px_80px_rgba(0,0,0,0.45)] mt-10" role="dialog" aria-modal="true">
              <div className="px-4 py-3 border-b border-hairline-hairline flex items-center gap-2 min-h-[56px]">
                <h2 className="text-lg font-semibold truncate">{drawer.name}</h2>
                {!!(drawer.status === "Archived") && (<span className="ml-1 text-xs px-2 py-0.5 rounded-full border border-amber-300 bg-amber-200/70 text-amber-900">Archived</span>)}
                <div className="ml-auto flex items-center gap-2">
                  {drawerTab === "overview" && !drawerEditing && (
                    <>
                      {drawer.status === "Active" ? (
                        <Button size="sm" variant="outline" onClick={async () => {
                          if (!confirm(`Archive "${drawer.name}"?`)) return;
                          const updated = await apiArchiveOrganization(Number(drawer.id));
                          if (updated) { setRows((p) => p.map((r) => (Number(r.id) === Number(drawer.id) ? updated : r))); setDrawer(updated); }
                        }}>Archive</Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={async () => {
                          const updated = await apiRestoreOrganization(Number(drawer.id));
                          if (updated) { setRows((p) => p.map((r) => (Number(r.id) === Number(drawer.id) ? updated : r))); setDrawer(updated); }
                        }}>Restore</Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => { setDraft({}); setDrawerEditing(true); }}>Edit</Button>
                    </>
                  )}
                  {drawerEditing && (
                    <>
                      <Button size="sm" onClick={async () => {
                        const payload = { ...drawer, ...draft };
                        const updated = await apiUpdateOrganization(Number(drawer.id), payload);
                        if (updated) { setRows((prev) => prev.map((r) => (Number(r.id) === Number(drawer.id) ? updated : r))); setDrawer(updated); setDrawerEditing(false); setDraft(null); } else { alert("Save failed"); }
                      }}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => { setDraft(null); setDrawerEditing(false); }}>Cancel</Button>
                    </>
                  )}
                  <Button variant="ghost" size="icon" aria-label="Close" onClick={() => { setIsDrawerOpen(false); setDrawer(null); setDrawerEditing(false); setDraft(null); }}>×</Button>
                </div>
              </div>

              <div className="px-1">
                <div className="inline-flex items-center gap-2 p-1 rounded-full border-hairline border-hairline-hairline bg-surface">
                  <button type="button" onClick={() => setDrawerTab("overview")}
                    className={["px-3 h-8 rounded-full text-sm transition-colors",
                      drawerTab !== "overview" ? "text-secondary hover:bg-[hsl(var(--brand-orange))]/10 border-b-2 border-transparent" : "",
                      drawerTab === "overview" ? "text-primary border-b-2 border-[hsl(var(--brand-orange))]" : ""].join(" ")}>
                    Overview
                  </button>
                  <button type="button" onClick={() => setDrawerTab("audit")}
                    className={["px-3 h-8 rounded-full text-sm transition-colors",
                      drawerTab !== "audit" ? "text-secondary hover:bg-[hsl(var(--brand-orange))]/10 border-b-2 border-transparent" : "",
                      drawerTab === "audit" ? "text-primary border-b-2 border-[hsl(var(--brand-orange))]" : ""].join(" ")}>
                    Audit
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                {drawerTab === "overview" && (
                  <>
                    <Card label="">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                        {!drawerEditing ? (
                          <>
                            <Row label="Name" value={show(drawer.name)} />
                            <Row label="Email" value={drawer.email ? <a className="underline" href={`mailto:${drawer.email}`}>{drawer.email}</a> : "—"} />
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="text-sm w-28 shrink-0 text-secondary">Name</div>
                              <Input value={draft?.name ?? drawer.name ?? ""} onChange={(e) => setDraft((p) => ({ ...(p || {}), name: e.currentTarget.value }))} />
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-sm w-28 shrink-0 text-secondary">Email</div>
                              <Input value={draft?.email ?? drawer.email ?? ""} onChange={(e) => setDraft((p) => ({ ...(p || {}), email: e.currentTarget.value }))} />
                            </div>
                          </>
                        )}
                        {!drawerEditing ? (
                          <>
                            <Row label="Website" value={drawer.website ? (<a className="underline" href={normalizeUrl(drawer.website)} target="_blank" rel="noopener noreferrer">{drawer.website}</a>) : "—"} />
                            <Row label="Phone" value={drawer.phone ? <a className="underline" href={`tel:${drawer.phone}`}>{prettyPhone(drawer.phone)}</a> : "—"} />
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="text-sm w-28 shrink-0 text-secondary">Website</div>
                              <Input value={draft?.website ?? drawer.website ?? ""} onChange={(e) => setDraft((p) => ({ ...(p || {}), website: e.currentTarget.value }))} />
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-sm w-28 shrink-0 text-secondary">Phone</div>
                              <Input value={draft?.phone ?? drawer.phone ?? ""} onChange={(e) => setDraft((p) => ({ ...(p || {}), phone: e.currentTarget.value }))} />
                            </div>
                          </>
                        )}
                      </div>
                    </Card>

                    <Card label="">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                        {["street", "city", "zip"].map((k) =>
                          !drawerEditing ? (
                            <Row key={k} label={k[0].toUpperCase() + k.slice(1).replace(/([A-Z])/g, " $1")} value={show((drawer as any)[k])} />
                          ) : (
                            <div key={k} className="flex items-center gap-2">
                              <div className="text-sm w-28 shrink-0 text-secondary">{k[0].toUpperCase() + k.slice(1).replace(/([A-Z])/g, " $1")}</div>
                              <Input value={(draft as any)?.[k] ?? (drawer as any)?.[k] ?? ""} onChange={(e) => setDraft((p) => ({ ...(p || {}), [k]: e.currentTarget.value }))} />
                            </div>
                          )
                        )}
                        {["street2", "state", "country"].map((k) =>
                          !drawerEditing ? (
                            <Row key={k} label={k.replace(/([A-Z])/g, " $1")} value={show((drawer as any)[k])} />
                          ) : (
                            <div key={k} className="flex items-center gap-2">
                              <div className="text-sm w-28 shrink-0 text-secondary">{k.replace(/([A-Z])/g, " $1")}</div>
                              <Input value={(draft as any)?.[k] ?? (drawer as any)?.[k] ?? ""} onChange={(e) => setDraft((p) => ({ ...(p || {}), [k]: e.currentTarget.value }))} />
                            </div>
                          )
                        )}
                      </div>
                    </Card>

                    <Card label="">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                        <Row label="Status" value={show(drawer.status || "Active")} />
                        <div className="flex items-start gap-2">
                          <div className="text-sm w-28 shrink-0 text-secondary">Tags</div>
                          <div className="text-sm">
                            {(drawer.tags || []).length ? (
                              <div className="flex flex-wrap gap-1">{drawer.tags!.map((t) => <span key={t} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border-hairline border-hairline-hairline bg-surface">{t}</span>)}</div>
                            ) : (<span className="text-sm">No tags</span>)}
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card label="">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                        <Row label="Created" value={fmtDate(drawer.created_at)} />
                        <Row label="Updated" value={fmtDate(drawer.updated_at)} />
                      </div>
                    </Card>

                    <Card label="">
                      {!drawerEditing ? (
                        <div className="text-sm whitespace-pre-wrap rounded-md border-hairline border-hairline-hairline bg-surface px-2 py-2 min-h-[80px]">{show(drawer.notes)}</div>
                      ) : (
                        <Textarea rows={4} value={draft?.notes ?? drawer.notes ?? ""} onChange={(e) => setDraft((p) => ({ ...(p || {}), notes: e.currentTarget.value }))} />
                      )}
                    </Card>
                  </>
                )}
                {drawerTab === "audit" && (
                  <Card label="Audit">
                    <div className="text-sm text-secondary">Coming soon.</div>
                  </Card>
                )}
              </div>

              <div className="px-4 pb-3 pt-2 border-t border-hairline-hairline flex items-center justify-end gap-2">
                {!drawerEditing ? (
                  <>
                    {drawer.status === "Active" ? (
                      <Button variant="outline" onClick={async () => {
                        if (!confirm(`Archive "${drawer.name}"?`)) return;
                        const updated = await apiArchiveOrganization(Number(drawer.id));
                        if (updated) { setRows((p) => p.map((r) => (Number(r.id) === Number(drawer.id) ? updated : r))); setDrawer(updated); }
                      }}>Archive</Button>
                    ) : (
                      <Button variant="outline" onClick={async () => {
                        const updated = await apiRestoreOrganization(Number(drawer.id));
                        if (updated) { setRows((p) => p.map((r) => (Number(r.id) === Number(drawer.id) ? updated : r))); setDrawer(updated); }
                      }}>Restore</Button>
                    )}
                    <Button variant="outline" onClick={() => { setDraft({}); setDrawerEditing(true); }}>Edit</Button>
                    <Button onClick={() => { setIsDrawerOpen(false); setDrawer(null); setDrawerEditing(false); setDraft(null); }}>Close</Button>
                  </>
                ) : (
                  <>
                    <Button onClick={async () => {
                      const payload = { ...drawer, ...draft };
                      const updated = await apiUpdateOrganization(Number(drawer.id), payload);
                      if (updated) { setRows((prev) => prev.map((r) => (Number(r.id) === Number(drawer.id) ? updated : r))); setDrawer(updated); setDrawerEditing(false); setDraft(null); } else { alert("Save failed"); }
                    }}>Save</Button>
                    <Button variant="outline" onClick={() => { setDraft(null); setDrawerEditing(false); }}>Cancel</Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>,
        getOverlayRoot()
      )}

      {/* Create/Edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId == null ? "Create Organization" : "Edit Organization"}
        footer={<><Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs mb-1">Organization name <span className="text-red-600">*</span></label>
            <Input value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g., Summit Poodles" />
            {errors.name && <div className="text-xs text-red-600 mt-1">{errors.name}</div>}
          </div>
          <div><label className="block text-xs mb-1">Email</label><Input value={form.email ?? ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="org@email.com" />{errors.email && <div className="text-xs text-red-600 mt-1">{errors.email}</div>}</div>
          <div><label className="block text-xs mb-1">Phone</label><Input value={form.phone ?? ""} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(555) 555-5555" /></div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2"><label className="block text-xs mb-1">Street</label><Input value={form.street ?? ""} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} /></div>
            <div className="md:col-span-2"><label className="block text-xs mb-1">Street 2</label><Input value={form.street2 ?? ""} onChange={(e) => setForm((f) => ({ ...f, street2: e.target.value }))} /></div>
            <div><label className="block text-xs mb-1">City</label><Input value={form.city ?? ""} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></div>
            <div><label className="block text-xs mb-1">State/Region</label><Input value={(form.state as string) ?? ""} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} /></div>
            <div><label className="block text-xs mb-1">Zip/Postal</label><Input value={form.zip ?? ""} onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))} /></div>
            <div><label className="block text-xs mb-1">Country</label><Input value={(form.country as string) ?? "US"} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} /></div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs mb-1">Notes</label>
            <Textarea rows={4} value={form.notes ?? ""} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Internal notes…" />
          </div>
        </div>
      </Modal>

      {/* Bulk toolbar */}
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

  async function handleBulkArchive() {
    if (selected.size === 0) return;
    const ok = confirm(`Archive ${selected.size} organization(s)?`);
    if (!ok) return;
    const ids = Array.from(selected);
    const results = await Promise.all(ids.map((id) => apiArchiveOrganization(id)));
    const okCount = results.filter(Boolean).length;
    if (okCount > 0) {
      setRows((prev) =>
        prev.map((r) => (ids.includes(r.id as number) ? { ...r, status: "Archived", updated_at: new Date().toISOString() } : r))
      );
      if (drawer && ids.includes(drawer.id as number)) {
        setDrawer((prev) => (prev ? { ...prev, status: "Archived", updated_at: new Date().toISOString() } : prev));
      }
    }
    setSelected(new Set());
  }
}
