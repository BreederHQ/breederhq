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
  Button,
  Input,
  FiltersRow,
  SectionCard,
} from "@bhq/ui";
import "@bhq/ui/styles/details.css";
import { OverlayMount } from "@bhq/ui/overlay/OverlayMount";
import { Plus, MoreHorizontal, X, DollarSign } from "lucide-react";

const MODAL_Z = 2147483000;
const DATE_LOCALE = "en-US";

const cn = (...s: Array<string | false | null | undefined>) =>
  s.filter(Boolean).join(" ");

/* Small local primitives that do not affect global look */

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <select
    className={cn(
      "h-9 w-full rounded-md border border-hairline bg-surface px-2 text-sm text-primary",
      className
    )}
    {...props}
  >
    {children}
  </select>
);


const Checkbox: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className = "",
  ...props
}) => <input type="checkbox" className={cn("h-4 w-4", className)} {...props} />;

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className = "",
  ...props
}) => (
  <textarea
    className={cn(
      "w-full min-h-[120px] rounded-md border border-hairline bg-surface px-2 py-2 text-sm text-primary",
      "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/60",
      className
    )}
    {...props}
  />
);

const Badge: React.FC<{
  children: React.ReactNode;
  variant?: "default" | "muted" | "outline";
  className?: string;
}> = ({ children, variant = "muted", className }) => (
  <span
    className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs border",
      variant === "default" && "bg-black text-white border-black",
      variant === "muted" &&
      "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-neutral-700",
      variant === "outline" &&
      "bg-white text-gray-800 border-gray-300 dark:bg-neutral-900 dark:text-gray-100 dark:border-neutral-700",
      className
    )}
  >
    {children}
  </span>
);

/* Modal primitive */

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
};


const Modal: React.FC<ModalProps> = ({ open, onClose, title, footer, children }) => {
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleOutsideMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const p = panelRef.current;
    if (!p) return;
    if (!p.contains(e.target as Node)) {
      onClose();
    }
  };

  const content = (
    <div
      className="fixed inset-0"
      style={{ zIndex: MODAL_Z + 1, isolation: "isolate" as any }}
      onMouseDown={handleOutsideMouseDown}
    >
      {/* Backdrop to dim page behind */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Centered panel */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="pointer-events-auto overflow-hidden rounded-xl border border-hairline bg-surface shadow-xl"
          style={{ width: 820, maxWidth: "95vw", maxHeight: "82vh" }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-hairline">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Body, scrollable within fixed height */}
          <div className="px-4 pb-4 pt-3 overflow-y-auto" style={{ maxHeight: "calc(82vh - 4.5rem)" }}>
            {children}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-hairline">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document === "undefined" ? null : createPortal(content, document.body);
};


/* Drawer shell */

const SHEET_Z = MODAL_Z - 10;

const Sheet: React.FC<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
}> = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  const content = (
    <div
      className="fixed inset-0"
      style={{ zIndex: SHEET_Z, isolation: "isolate" as any }}
      onClick={() => onOpenChange(false)}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="absolute inset-y-0 right-0 flex"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  return typeof document === "undefined" ? null : createPortal(content, document.body);
};

const SheetContent: React.FC<{
  side?: "right" | "left";
  onClose?: () => void;
  className?: string;
  children: React.ReactNode;
}> = ({ side = "right", onClose, className = "", children }) => (
  <div
    className={cn(
      "h-full w-[640px] bg-surface text-foreground border-hairline shadow-xl p-4 overflow-y-auto",
      side === "right" ? "border-l" : "border-r",
      className
    )}
  >
    <div className="absolute top-3 right-3">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Close"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
    {children}
  </div>
);
type FinanceTab = "invoices" | "expenses";

/* Types */

type InvoiceStatus = "DRAFT" | "SENT" | "PARTIAL" | "PAID" | "VOID" | "REFUNDED";
type PartyType = "CONTACT" | "ORGANIZATION";
type ContextType =
  | "OFFSPRING_GROUP"
  | "OFFSPRING"
  | "WAITLIST_ENTRY"
  | "ANIMAL"
  | "OTHER"
  | null;

type PaymentRow = {
  id: number;
  amount: number;
  method: string;
  receivedAt: string;
  reference?: string;
};

type InvoiceRow = {
  id: number;
  number: string;
  status: InvoiceStatus;
  partyType: PartyType;
  partyName: string;
  contextType: ContextType;
  contextLabel?: string;
  issueDate: string;
  dueDate?: string | null;
  total: number;
  balance: number;
  currency: string;
  notes?: string;
  payments: PaymentRow[];
  createdAt: string;
  updatedAt: string;
};

/* Helpers */

function formatDate(v?: string | null): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function formatCurrency(n?: number | null, currency = "USD"): string {
  if (n == null) return "";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(n);
  } catch {
    return `$${Number(n).toFixed(2)}`;
  }
}

/* Mock data */

const MOCK_INVOICES: InvoiceRow[] = [
  {
    id: 1,
    number: "INV-2025-0001",
    status: "SENT",
    partyType: "CONTACT",
    partyName: "Jane Smith",
    contextType: "OFFSPRING_GROUP",
    contextLabel: "Litter A (Nova x Atlas)",
    issueDate: "2025-02-01",
    dueDate: "2025-02-07",
    total: 250,
    balance: 250,
    currency: "USD",
    notes: "Reservation fee for male puppy, position 1.",
    payments: [],
    createdAt: "2025-02-01T10:20:00.000Z",
    updatedAt: "2025-02-01T10:20:00.000Z",
  },
  {
    id: 2,
    number: "INV-2025-0002",
    status: "PARTIAL",
    partyType: "CONTACT",
    partyName: "Michael Johnson",
    contextType: "OFFSPRING",
    contextLabel: "Ruby (Nova x Atlas, pink collar)",
    issueDate: "2025-02-05",
    dueDate: "2025-02-20",
    total: 2800,
    balance: 800,
    currency: "USD",
    notes: "Pet contract, remaining balance due at pickup.",
    payments: [
      {
        id: 1,
        amount: 2000,
        method: "CARD",
        receivedAt: "2025-02-05",
        reference: "STRIPE-12345",
      },
    ],
    createdAt: "2025-02-05T15:00:00.000Z",
    updatedAt: "2025-02-06T09:12:00.000Z",
  },
  {
    id: 3,
    number: "INV-2025-0003",
    status: "PAID",
    partyType: "ORGANIZATION",
    partyName: "Blue River Doodles",
    contextType: "OTHER",
    contextLabel: "Stud fee",
    issueDate: "2025-01-10",
    dueDate: "2025-01-10",
    total: 1500,
    balance: 0,
    currency: "USD",
    notes: "Stud service, paid in full.",
    payments: [
      {
        id: 1,
        amount: 1500,
        method: "ACH",
        receivedAt: "2025-01-10",
        reference: "ACH-9876",
      },
    ],
    createdAt: "2025-01-10T08:00:00.000Z",
    updatedAt: "2025-01-10T08:10:00.000Z",
  },
];

/* Columns config for hooks.useColumns */

const COLUMNS: hooks.ColumnConfig<InvoiceRow>[] = [
  { key: "select", label: "", widthPx: 32, fixed: "left" },
  { key: "number", label: "Invoice", widthPx: 140, fixed: "left" },
  { key: "partyName", label: "Contact / Organization", widthPx: 220 },
  { key: "contextLabel", label: "Related To", widthPx: 260 },
  { key: "status", label: "Status", widthPx: 110 },
  { key: "issueDate", label: "Issue Date", widthPx: 120 },
  { key: "dueDate", label: "Due Date", widthPx: 120 },
  { key: "total", label: "Total", widthPx: 110 },
  { key: "balance", label: "Balance", widthPx: 110 },
  { key: "actions", label: "", widthPx: 40, fixed: "right" },
];

const FILTER_SCHEMA = [
  { key: "number", label: "Invoice", editor: "text" as const },
  {
    key: "partyName",
    label: "Contact / Organization",
    editor: "text" as const,
  },
  { key: "contextLabel", label: "Related To", editor: "text" as const },
  {
    key: "status",
    label: "Status",
    editor: "select" as const,
    options: [
      { label: "Draft", value: "DRAFT" },
      { label: "Sent", value: "SENT" },
      { label: "Partial", value: "PARTIAL" },
      { label: "Paid", value: "PAID" },
      { label: "Void", value: "VOID" },
      { label: "Refunded", value: "REFUNDED" },
    ],
  },
  { key: "issueDate", label: "Issue Date", editor: "text" as const },
  { key: "dueDate", label: "Due Date", editor: "text" as const },
  { key: "total", label: "Total", editor: "text" as const },
  { key: "balance", label: "Balance", editor: "text" as const },
];

/* Tabs */

function FinanceTabs({
  value,
  onChange,
}: {
  value: FinanceTab;
  onChange: (v: FinanceTab) => void;
}) {
  const base =
    "h-9 px-1.5 text-sm font-semibold leading-9 border-b-2 border-solid border-transparent transition-colors";
  const activeText = "text-[var(--color-text-strong,#e9e9e9)]";

  return (
    <div role="tablist" aria-label="Finance tabs" className="flex gap-6">
      <button
        role="tab"
        aria-selected={value === "invoices"}
        className={[base, value === "invoices" ? activeText : ""].join(" ")}
        onClick={() => onChange("invoices")}
        style={
          value === "invoices"
            ? { borderBottomColor: "hsl(var(--brand-orange))" }
            : undefined
        }
      >
        Invoices
      </button>
      <button
        role="tab"
        aria-selected={value === "expenses"}
        className={[base, value === "expenses" ? activeText : ""].join(" ")}
        onClick={() => onChange("expenses")}
        style={
          value === "expenses"
            ? { borderBottomColor: "hsl(var(--brand-orange))" }
            : undefined
        }
      >
        Expenses
      </button>
    </div>
  );
}

/* Main module */
export default function AppFinance() {
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("bhq:module", {
          detail: { key: "finance", label: "Finance" },
        })
      );
    }
  }, []);

  const [rows, setRows] = React.useState<InvoiceRow[]>(() => [...MOCK_INVOICES]);
  const [q, setQ] = React.useState("");
  const [filters, setFilters] = React.useState<Record<string, string>>({});
  const [tab, setTab] = React.useState<FinanceTab>("invoices");

  const {
    map: columnsState,
    toggle: toggleColumn,
    setAll: setAllColumns,
    visible,
  } = hooks.useColumns(COLUMNS, "finance-invoices");

  const visibleSafe = Array.isArray(visible) && visible.length ? visible : COLUMNS;

  const [sorts, setSorts] = React.useState<
    { key: string; dir: "asc" | "desc" }[]
  >([]);

  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [pageSize, setPageSize] = React.useState(25);
  const [page, setPage] = React.useState(1);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const [drawer, setDrawer] = React.useState<InvoiceRow | null>(null);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const emptyForm: Partial<InvoiceRow> = {
    number: "",
    status: "DRAFT",
    partyType: "CONTACT",
    partyName: "",
    contextType: null,
    contextLabel: "",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    total: 0,
    balance: 0,
    currency: "USD",
    notes: "",
    payments: [],
  };
  const [form, setForm] = React.useState<Partial<InvoiceRow>>(emptyForm);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    setPage(1);
  }, [q, filters, sorts]);

  function onToggleSort(key: string, withShift: boolean) {
    setSorts((prev) => {
      let next = [...prev];
      if (!withShift) next = prev.filter((s) => s.key !== key);
      const existing = next.find((s) => s.key === key);
      if (!existing) {
        next.push({ key, dir: "asc" });
      } else if (existing.dir === "asc") {
        next = next.map((s) =>
          s.key === key ? { ...s, dir: "desc" } : s
        );
      } else {
        next = next.filter((s) => s.key !== key);
      }
      return next;
    });
  }

  const displayRows = React.useMemo(() => {
    const text = q.trim().toLowerCase();
    const activeFilters = Object.entries(filters || {}).filter(
      ([, v]) => (v ?? "") !== ""
    );

    let data = [...rows];

    if (text) {
      data = data.filter((r) => {
        const values = [
          r.number,
          r.partyName,
          r.contextLabel,
          r.status,
          r.notes,
          r.issueDate,
          r.dueDate,
          r.total,
          r.balance,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return values.includes(text);
      });
    }

    if (activeFilters.length) {
      const lc = (v: any) => String(v ?? "").toLowerCase();
      data = data.filter((r) =>
        activeFilters.every(([key, val]) => {
          const raw = (r as any)[key];
          const isDate =
            key === "issueDate" || key === "dueDate" || key === "updatedAt";
          const hay = isDate && raw ? String(raw).slice(0, 10) : String(raw ?? "");
          return lc(hay).includes(lc(val));
        })
      );
    }

    if (sorts.length) {
      data.sort((a, b) => {
        for (const s of sorts) {
          let av: any = (a as any)[s.key];
          let bv: any = (b as any)[s.key];

          if (
            s.key === "issueDate" ||
            s.key === "dueDate" ||
            s.key === "updatedAt"
          ) {
            const at = av ? new Date(av).getTime() : 0;
            const bt = bv ? new Date(bv).getTime() : 0;
            if (at === bt) continue;
            return s.dir === "asc" ? at - bt : bt - at;
          }

          const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, {
            numeric: true,
            sensitivity: "base",
          });
          if (cmp !== 0) return s.dir === "asc" ? cmp : -cmp;
        }
        return 0;
      });
    }

    return data;
  }, [rows, q, filters, sorts]);

  const pageCount = Math.max(1, Math.ceil(displayRows.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const start = (clampedPage - 1) * pageSize;
  const end = start + pageSize;
  const pageRows = displayRows.slice(start, end);

  function toggleAll(v: boolean) {
    setSelected(v ? new Set(displayRows.map((r) => r.id)) : new Set());
  }

  function toggleOne(id: number) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function exportCsv() {
    const headers = [
      "Invoice",
      "Contact / Organization",
      "Related To",
      "Status",
      "Issue Date",
      "Due Date",
      "Total",
      "Balance",
    ];
    const lines: string[] = [];
    lines.push(headers.join(","));

    for (const r of displayRows) {
      const vals = [
        r.number,
        r.partyName,
        r.contextLabel ?? "",
        r.status,
        formatDate(r.issueDate),
        formatDate(r.dueDate),
        String(r.total ?? "").replace(/,/g, " "),
        String(r.balance ?? "").replace(/,/g, " "),
      ];
      lines.push(vals.join(","));
    }

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "invoices.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function validateForm(f: Partial<InvoiceRow>) {
    const e: Record<string, string> = {};
    if (!f.number || String(f.number).trim().length < 3) {
      e.number = "Invoice number is required";
    }
    if (!f.partyName || String(f.partyName).trim().length < 2) {
      e.partyName = "Contact or organization name is required";
    }
    if (f.total == null || Number.isNaN(Number(f.total))) {
      e.total = "Total is required";
    }
    if (!f.issueDate) {
      e.issueDate = "Issue date is required";
    }
    return e;
  }

  function handleSave() {
    const e = validateForm(form);
    setErrors(e);
    if (Object.keys(e).length) return;

    const nowIso = new Date().toISOString();
    const base: InvoiceRow = {
      id: editingId ?? rows.reduce((m, r) => Math.max(m, r.id), 0) + 1,
      number: String(form.number),
      status: (form.status as InvoiceStatus) || "DRAFT",
      partyType: (form.partyType as PartyType) || "CONTACT",
      partyName: String(form.partyName),
      contextType: (form.contextType as ContextType) ?? null,
      contextLabel: (form.contextLabel as string) || "",
      issueDate: String(form.issueDate),
      dueDate: (form.dueDate as string) || null,
      total: Number(form.total ?? 0),
      balance:
        form.balance != null ? Number(form.balance) : Number(form.total ?? 0),
      currency: (form.currency as string) || "USD",
      notes: (form.notes as string) || "",
      payments: (form.payments as PaymentRow[]) || [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (editingId == null) {
      setRows([base, ...rows]);
      setDrawer(base);
    } else {
      const updated = rows.map((r) =>
        r.id === editingId ? { ...r, ...base, createdAt: r.createdAt } : r
      );
      setRows(updated);
      const found = updated.find((r) => r.id === base.id) || null;
      setDrawer(found);
    }

    setCreateOpen(false);
  }

  function addMockPayment(inv: InvoiceRow) {
    if (inv.balance <= 0) return;

    const amount = Math.min(100, inv.balance);
    const now = new Date().toISOString().slice(0, 10);

    const updated = rows.map((r) => {
      if (r.id !== inv.id) return r;
      const nextId =
        (r.payments.reduce((m, p) => Math.max(m, p.id), 0) || 0) + 1;
      const payment: PaymentRow = {
        id: nextId,
        amount,
        method: "CARD",
        receivedAt: now,
        reference: "MOCK",
      };
      const newPayments = [...r.payments, payment];
      const newBalance = Math.max(
        0,
        Number(r.total) - newPayments.reduce((sum, p) => sum + p.amount, 0)
      );
      return {
        ...r,
        payments: newPayments,
        balance: newBalance,
        status: newBalance === 0 ? "PAID" : "PARTIAL",
        updatedAt: new Date().toISOString(),
      };
    });

    setRows(updated);
    const found = updated.find((r) => r.id === inv.id) || null;
    setDrawer(found);
  }

  const CELL_RENDERERS: Record<string, (r: InvoiceRow) => React.ReactNode> = {
    select: (r) => (
      <Checkbox
        checked={selected.has(r.id)}
        onChange={() => toggleOne(r.id)}
      />
    ),
    number: (r) => r.number,
    partyName: (r) => r.partyName,
    contextLabel: (r) => r.contextLabel || "None",
    status: (r) => (
      <Badge variant={r.status === "PAID" ? "default" : "muted"}>{r.status}</Badge>
    ),
    issueDate: (r) => formatDate(r.issueDate),
    dueDate: (r) => formatDate(r.dueDate),
    total: (r) => formatCurrency(r.total, r.currency),
    balance: (r) => formatCurrency(r.balance, r.currency),
    actions: () => (
      <MoreHorizontal className="h-4 w-4 text-secondary" aria-hidden="true" />
    ),
  };

  return (
    <>
      <OverlayMount />

      <div className="p-4 space-y-4">
        <PageHeader
          title="Finance"
          subtitle={
            tab === "invoices"
              ? "Manage invoices and payments"
              : "Track expenses"
          }
          rightSlot={<FinanceTabs value={tab} onChange={setTab} />}
        />
        {tab === "invoices" && (
          <Card>
            <Table
              columns={COLUMNS}
              columnState={columnsState}
              onColumnStateChange={setAllColumns}
              getRowId={(r: InvoiceRow) => r.id}
              pageSize={pageSize}
              renderStickyRight={() => (
                <ColumnsPopover
                  columns={columnsState}
                  onToggle={toggleColumn}
                  onSet={setAllColumns}
                  onReset={() => setAllColumns(COLUMNS)}
                  allColumns={COLUMNS}
                  triggerClassName="bhq-columns-trigger"
                />
              )}
            >
              <div className="bhq-table__toolbar px-2 pt-2 pb-3 relative z-30 flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <SearchBar
                    value={q}
                    onChange={setQ}
                    placeholder="Search invoices"
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
                          <path d="M3 5h18M7 12h10M10 19h4" strokeLinecap="round" />
                        </svg>
                      </button>
                    }
                  />
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={exportCsv}
                  className="ml-auto shrink-0"
                >
                  <DollarSign className="h-3 w-3 mr-1" />
                  Export CSV
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setDrawer(null);
                    setEditingId(null);
                    setForm(emptyForm);
                    setErrors({});
                    setCreateOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  New Invoice
                </Button>
              </div>

              {filtersOpen && (
                <FiltersRow
                  filters={filters}
                  onChange={(next: Record<string, string>) => setFilters(next)}
                  schema={FILTER_SCHEMA}
                />
              )}

              <table className="min-w-full">
                <TableHeader
                  columns={visibleSafe}
                  sorts={sorts}
                  onToggleSort={onToggleSort}
                />

                <tbody>
                  {pageRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={visibleSafe.length}>
                        <div className="px-3 py-6 text-sm text-secondary text-center">
                          No invoices match your filters yet.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {pageRows.map((r) => (
                    <TableRow
                      key={r.id}
                      onClick={() => setDrawer(r)}
                      className="cursor-pointer hover:bg-muted/40"
                    >
                      {visibleSafe.map((col) => {
                        const renderer =
                          CELL_RENDERERS[col.key] ??
                          ((row: InvoiceRow) => {
                            return (row as any)[col.key] as React.ReactNode;
                          });

                        if (col.key === "select") {
                          return (
                            <TableCell
                              key={col.key}
                              fixed={col.fixed}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={selected.has(r.id)}
                                onChange={() => toggleOne(r.id)}
                              />
                            </TableCell>
                          );
                        }

                        if (col.key === "actions") {
                          return (
                            <TableCell
                              key={col.key}
                              fixed={col.fixed}
                              align="right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {renderer(r)}
                            </TableCell>
                          );
                        }

                        return (
                          <TableCell key={col.key} fixed={col.fixed}>
                            {renderer(r)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </tbody>
              </table>

              <TableFooter>
                <div className="flex items-center justify-between px-3 py-2 text-xs text-secondary">
                  <div>
                    Showing {pageRows.length === 0 ? 0 : start + 1} to{" "}
                    {Math.min(end, displayRows.length)} of {displayRows.length} invoices
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span>Rows per page</span>
                      <Select
                        value={String(pageSize)}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setPage(1);
                        }}
                        className="w-20"
                      >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={clampedPage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        ‹
                      </Button>
                      <span>
                        Page {clampedPage} of {pageCount}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={clampedPage >= pageCount}
                        onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                      >
                        ›
                      </Button>
                    </div>
                  </div>
                </div>
              </TableFooter>
            </Table>
          </Card>
        )}

        {tab === "expenses" && (
          <Card className="p-4 text-sm text-secondary">
            Expenses view coming soon.
          </Card>
        )}
      </div>

      {/* Create / edit invoice modal */}
      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setEditingId(null);
          setForm(emptyForm);
          setErrors({});
        }}
        title={editingId == null ? "New invoice" : "Edit invoice"}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setCreateOpen(false);
                setEditingId(null);
                setForm(emptyForm);
                setErrors({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}>
              Save
            </Button>

          </>
        }
      >

        <div className="max-w-[820px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-secondary mb-1">Invoice number</div>
            <Input
              value={form.number ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, number: e.target.value }))
              }
            />
            {errors.number && (
              <div className="text-xs text-danger mt-1">{errors.number}</div>
            )}
          </div>

          <div>
            <div className="text-xs text-secondary mb-1">Status</div>
            <Select
              value={form.status ?? "DRAFT"}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as InvoiceStatus,
                }))
              }
            >
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
              <option value="VOID">Void</option>
              <option value="REFUNDED">Refunded</option>
            </Select>
          </div>

          <div>
            <div className="text-xs text-secondary mb-1">Party type</div>
            <Select
              value={form.partyType ?? "CONTACT"}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  partyType: e.target.value as PartyType,
                }))
              }
            >
              <option value="CONTACT">Contact</option>
              <option value="ORGANIZATION">Organization</option>
            </Select>
          </div>

          <div>
            <div className="text-xs text-secondary mb-1">
              Contact or organization name
            </div>
            <Input
              value={form.partyName ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, partyName: e.target.value }))
              }
            />
            {errors.partyName && (
              <div className="text-xs text-danger mt-1">
                {errors.partyName}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="text-xs text-secondary mb-1">Related to</div>
            <Select
              value={form.contextType ?? "OTHER"}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  contextType: e.target.value as ContextType,
                }))
              }
            >
              <option value="OFFSPRING_GROUP">Offspring group</option>
              <option value="OFFSPRING">Offspring</option>
              <option value="WAITLIST_ENTRY">Waitlist entry</option>
              <option value="ANIMAL">Animal</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>

          <div>
            <div className="text-xs text-secondary mb-1">Related label</div>
            <Input
              value={form.contextLabel ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, contextLabel: e.target.value }))
              }
            />
          </div>

          <div>
            <div className="text-xs text-secondary mb-1">Issue date</div>
            <Input
              type="date"
              value={form.issueDate ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, issueDate: e.target.value }))
              }
            />
            {errors.issueDate && (
              <div className="text-xs text-danger mt-1">
                {errors.issueDate}
              </div>
            )}
          </div>

          <div>
            <div className="text-xs text-secondary mb-1">Due date</div>
            <Input
              type="date"
              value={form.dueDate ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, dueDate: e.target.value }))
              }
            />
          </div>

          <div>
            <div className="text-xs text-secondary mb-1">Total</div>
            <Input
              type="number"
              value={form.total ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  total:
                    e.target.value === "" ? 0 : Number(e.target.value),
                }))
              }
            />
            {errors.total && (
              <div className="text-xs text-danger mt-1">{errors.total}</div>
            )}
          </div>

          <div>
            <div className="text-xs text-secondary mb-1">Balance</div>
            <Input
              type="number"
              value={form.balance ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  balance:
                    e.target.value === ""
                      ? undefined
                      : Number(e.target.value),
                }))
              }
            />
          </div>

          <div>
            <div className="text-xs text-secondary mb-1">Currency</div>
            <Input
              value={form.currency ?? "USD"}
              onChange={(e) =>
                setForm((f) => ({ ...f, currency: e.target.value }))
              }
            />
          </div>

          <div className="md:col-span-2">
            <div className="text-xs text-secondary mb-1">Notes</div>
            <Textarea
              rows={4}
              value={form.notes ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </div>
        </div>

      </Modal>

      {/* Invoice detail modal */}
      {drawer && (
        <Modal
          open={!!drawer}
          onClose={() => setDrawer(null)}
          title={drawer?.number || "Invoice"}
          footer={
            <div className="flex items-center justify-between text-xs text-secondary">
              <div>
                {drawer.createdAt && (
                  <span className="mr-2">
                    Created{" "}
                    {new Date(drawer.createdAt).toLocaleDateString(DATE_LOCALE)}
                  </span>
                )}
                {drawer.updatedAt && (
                  <span>
                    Updated{" "}
                    {new Date(drawer.updatedAt).toLocaleDateString(DATE_LOCALE)}
                  </span>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setDrawer(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-sm bhq-details">
            {/* Header band - matches other drawers */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-secondary mb-1">Contact</div>
                <div className="text-base font-semibold">
                  {drawer.partyName || "Unknown contact"}
                </div>
                {(drawer.groupLabel || drawer.contextLabel) && (
                  <div className="mt-1 text-xs text-secondary">
                    {drawer.groupLabel}
                    {drawer.groupLabel && drawer.contextLabel && " \u2022 "}
                    {drawer.contextLabel}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-secondary mb-1">Balance</div>
                <div className="text-xl font-semibold">
                  {typeof drawer.balance === "number"
                    ? `$${(drawer.balance / 100).toLocaleString()}`
                    : "$0.00"}
                </div>
                <div className="mt-2">
                  <Badge
                    variant={drawer.status === "PAID" ? "default" : "outline"}
                    className={
                      drawer.status === "PAID"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : ""
                    }
                  >
                    {drawer.status || "DRAFT"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Body sections - standard @bhq/ui details style */}
            <div className="space-y-3">
              <SectionCard title="Overview">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-xs text-secondary mb-1">Invoice number</div>
                    <div>{drawer.number || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-secondary mb-1">Status</div>
                    <div>{drawer.status || "DRAFT"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-secondary mb-1">Issue date</div>
                    <div>
                      {drawer.issueDate
                        ? new Date(drawer.issueDate).toLocaleDateString(DATE_LOCALE)
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-secondary mb-1">Due date</div>
                    <div>
                      {drawer.dueDate
                        ? new Date(drawer.dueDate).toLocaleDateString(DATE_LOCALE)
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-secondary mb-1">Total</div>
                    <div>
                      {typeof drawer.total === "number"
                        ? `$${(drawer.total / 100).toLocaleString()}`
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-secondary mb-1">Balance</div>
                    <div>
                      {typeof drawer.balance === "number"
                        ? `$${(drawer.balance / 100).toLocaleString()}`
                        : "-"}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-xs text-secondary mb-1">Notes</div>
                  <div className="text-sm">
                    {drawer.notes && drawer.notes.trim().length > 0
                      ? drawer.notes
                      : "No notes recorded yet."}
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Payments"
                right={
                  <Button size="sm" variant="outline">
                    Add mock payment
                  </Button>
                }
              >
                {/* Placeholder until real payments wire up */}
                <div className="py-2 text-sm text-secondary">
                  No payments recorded yet.
                </div>
              </SectionCard>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}