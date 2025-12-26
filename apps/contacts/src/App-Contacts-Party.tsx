// apps/contacts/src/App-Contacts-Party.tsx
// Phase 3: Party-first unified Contacts + Organizations table
// This replaces App-Contacts.tsx with a Party-backed implementation

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
  Badge,
  exportToCsv,
  Popover,
  Button,
} from "@bhq/ui";
import { Download, MoreHorizontal } from "lucide-react";
import "@bhq/ui/styles/table.css";
import { makeApi } from "./api";
import { PartyKind } from "@bhq/api";

/* ────────────────────────────────────────────────────────────────────────────
 * Party Table Row (Unified Contacts + Organizations)
 * ────────────────────────────────────────────────────────────────────────── */

export type PartyTableRow = {
  // Canonical key: partyId
  partyId: number;

  // Kind discriminator
  kind: PartyKind;

  // Display fields
  displayName: string;
  email?: string | null;
  phone?: string | null;
  tags: string[];
  notes?: string | null;

  // Legacy backing IDs (for drawer routing only)
  contactId?: number | null;
  organizationId?: number | null;

  // Metadata
  created_at?: string | null;
  updated_at?: string | null;
  archived?: boolean | null;
};

const PARTY_COLUMNS: Array<{ key: keyof PartyTableRow & string; label: string; default?: boolean }> = [
  { key: "kind", label: "Type", default: true },
  { key: "displayName", label: "Name", default: true },
  { key: "email", label: "Email", default: true },
  { key: "phone", label: "Phone", default: true },
  { key: "tags", label: "Tags", default: true },
  { key: "created_at", label: "Created", default: false },
  { key: "updated_at", label: "Updated", default: false },
];

const STORAGE_KEY = "bhq_party_contacts_cols_v1";
const Q_KEY = "bhq_party_contacts_q_v1";

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

function fmt(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  if (!Number.isFinite(dt.getTime())) return String(d).slice(0, 10) || "";
  return dt.toLocaleDateString();
}

/**
 * Convert Contact API response to PartyTableRow
 */
function contactToPartyRow(c: any): PartyTableRow {
  return {
    partyId: c.partyId ?? c.party_id ?? c.id, // Prefer party fields, fallback to id
    kind: "CONTACT",
    displayName: c.displayName ?? c.display_name ?? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || `Contact ${c.id}`,
    email: c.email ?? null,
    phone: c.phone ?? c.phoneMobileE164 ?? null,
    tags: Array.isArray(c.tags) ? c.tags : [],
    notes: c.notes ?? null,
    contactId: c.id,
    organizationId: null,
    created_at: c.created_at ?? c.createdAt ?? null,
    updated_at: c.updated_at ?? c.updatedAt ?? null,
    archived: c.archived ?? null,
  };
}

/**
 * Convert Organization API response to PartyTableRow
 */
function organizationToPartyRow(o: any): PartyTableRow {
  return {
    partyId: o.partyId ?? o.party_id ?? o.id, // Prefer party fields, fallback to id
    kind: "ORGANIZATION",
    displayName: o.displayName ?? o.display_name ?? o.name ?? `Organization ${o.id}`,
    email: o.email ?? null,
    phone: o.phone ?? null,
    tags: Array.isArray(o.tags) ? o.tags : [],
    notes: o.notes ?? null,
    contactId: null,
    organizationId: o.id,
    created_at: o.created_at ?? o.createdAt ?? null,
    updated_at: o.updated_at ?? o.updatedAt ?? null,
    archived: o.archived ?? null,
  };
}

/**
 * Get drawer route param based on Party kind
 */
function getDrawerParam(row: PartyTableRow): { param: string; value: number } {
  if (row.kind === "CONTACT" && row.contactId) {
    return { param: "contactId", value: row.contactId };
  }
  if (row.kind === "ORGANIZATION" && row.organizationId) {
    return { param: "orgId", value: row.organizationId };
  }
  // Fallback: use partyId (for future Party-native drawers)
  return { param: "partyId", value: row.partyId };
}

/**
 * Open drawer for a Party row
 */
function openPartyDrawer(row: PartyTableRow) {
  const { param, value } = getDrawerParam(row);
  const url = new URL(window.location.href);
  url.searchParams.set(param, String(value));
  window.history.pushState({}, "", url);
  window.dispatchEvent(new Event("popstate"));
}

/* ────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ────────────────────────────────────────────────────────────────────────── */

export default function AppContactsParty() {
  React.useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("bhq:module", { detail: { key: "contacts", label: "Contacts" } })
    );
  }, []);

  const api = React.useMemo(() => makeApi(), []);

  // Search
  const [q, setQ] = React.useState(() => {
    try { return localStorage.getItem(Q_KEY) || ""; } catch { return ""; }
  });
  React.useEffect(() => { try { localStorage.setItem(Q_KEY, q); } catch { } }, [q]);

  const [qDebounced, setQDebounced] = React.useState(q);
  React.useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Data
  const [rows, setRows] = React.useState<PartyTableRow[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Pagination
  const [pageSize, setPageSize] = React.useState<number>(25);
  const [page, setPage] = React.useState<number>(1);

  // Archive toggle
  const [includeArchived, setIncludeArchived] = React.useState<boolean>(false);

  // Fetch unified Party data (Contacts + Organizations)
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch both Contacts and Organizations in parallel
        const [contactsRes, orgsRes] = await Promise.all([
          api.contacts.list({
            q: qDebounced || undefined,
            page: 1,
            limit: 100,
            includeArchived,
          }),
          api.organizations.list({
            q: qDebounced || undefined,
            page: 1,
            limit: 100,
            includeArchived,
          }),
        ]);

        const contacts = (contactsRes?.items || contactsRes?.data || []).map(contactToPartyRow);
        const orgs = (orgsRes?.items || orgsRes?.data || []).map(organizationToPartyRow);

        // Merge and sort by displayName
        const merged = [...contacts, ...orgs].sort((a, b) =>
          a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" })
        );

        if (!cancelled) setRows(merged);
      } catch (e: any) {
        if (!cancelled) setError(e?.payload?.error || e?.message || "Failed to load parties");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [api, qDebounced, includeArchived]);

  // Columns
  const { map, toggle, setAll, visible } = hooks.useColumns(PARTY_COLUMNS, STORAGE_KEY);
  const visibleSafe = Array.isArray(visible) && visible.length ? visible : PARTY_COLUMNS;

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

  const sortedRows = React.useMemo(() => {
    if (!sorts.length) return rows;
    const out = [...rows];
    out.sort((a, b) => {
      for (const s of sorts) {
        const av = (a as any)[s.key];
        const bv = (b as any)[s.key];
        const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, {
          numeric: true,
          sensitivity: "base",
        });
        if (cmp !== 0) return s.dir === "asc" ? cmp : -cmp;
      }
      return 0;
    });
    return out;
  }, [rows, sorts]);

  // Client-side search (already filtered by backend, this is for local re-filter)
  const displayRows = React.useMemo(() => {
    if (!qDebounced) return sortedRows;
    const ql = qDebounced.toLowerCase();
    return sortedRows.filter((r) =>
      [r.displayName, r.email, r.phone, ...(r.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(ql)
    );
  }, [sortedRows, qDebounced]);

  // Paging
  const pageCount = Math.max(1, Math.ceil(displayRows.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const start = displayRows.length === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const end = displayRows.length === 0 ? 0 : Math.min(displayRows.length, clampedPage * pageSize);
  const pageRows = React.useMemo(() => {
    const from = (clampedPage - 1) * pageSize;
    const to = from + pageSize;
    return displayRows.slice(from, to);
  }, [displayRows, clampedPage, pageSize]);

  // Menu + CSV export
  const [menuOpen, setMenuOpen] = React.useState(false);
  const handleExportCsv = React.useCallback(() => {
    exportToCsv({
      columns: PARTY_COLUMNS,
      rows: sortedRows,
      filename: "parties",
      formatValue: (value, key) => {
        if (key === "created_at" || key === "updated_at") return fmt(value);
        if (Array.isArray(value)) return value.join(" | ");
        return value;
      },
    });
    setMenuOpen(false);
  }, [sortedRows]);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="relative">
        <PageHeader title="Contacts" subtitle="Unified contacts and organizations" />
        <div
          className="absolute right-0 top-0 h-full flex items-center gap-2 pr-1"
          style={{ zIndex: 5, pointerEvents: "auto" }}
        >
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

      <Card>
        <Table
          columns={PARTY_COLUMNS}
          columnState={map}
          onColumnStateChange={setAll}
          getRowId={(r: PartyTableRow) => r.partyId}
          pageSize={pageSize}
          renderStickyRight={() => (
            <ColumnsPopover
              columns={map}
              onToggle={toggle}
              onSet={setAll}
              allColumns={PARTY_COLUMNS}
              triggerClassName="bhq-columns-trigger"
            />
          )}
          stickyRightWidthPx={40}
        >
          {/* Toolbar */}
          <div className="bhq-table__toolbar px-2 pt-2 pb-3 relative z-30">
            <SearchBar
              value={q}
              onChange={setQ}
              placeholder="Search contacts and organizations..."
              widthPx={520}
            />
          </div>

          {/* Table */}
          <table className="min-w-max w-full text-sm">
            <TableHeader columns={visibleSafe} sorts={sorts} onToggleSort={onToggleSort} />
            <tbody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={visibleSafe.length}>
                    <div className="py-8 text-center text-sm text-secondary">Loading...</div>
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
                    <div className="py-8 text-center text-sm text-secondary">
                      No entries found.
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                !error &&
                pageRows.length > 0 &&
                pageRows.map((r) => (
                  <TableRow
                    key={r.partyId}
                    className="cursor-pointer hover:bg-white/5"
                    onClick={() => openPartyDrawer(r)}
                  >
                    {visibleSafe.map((c) => {
                      let v: any = (r as any)[c.key];

                      // Special rendering for kind
                      if (c.key === "kind") {
                        return (
                          <TableCell key={c.key}>
                            <Badge variant={v === "CONTACT" ? "default" : "secondary"}>
                              {v === "CONTACT" ? "Contact" : "Organization"}
                            </Badge>
                          </TableCell>
                        );
                      }

                      // Date formatting
                      if (c.key === "created_at" || c.key === "updated_at") {
                        v = fmt(v);
                      }

                      // Array formatting
                      if (Array.isArray(v)) {
                        v = v.join(", ");
                      }

                      return <TableCell key={c.key}>{v ?? ""}</TableCell>;
                    })}
                  </TableRow>
                ))}
            </tbody>
          </table>

          <TableFooter
            entityLabel="entries"
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
            filteredTotal={displayRows.length}
            total={rows.length}
            includeArchived={includeArchived}
            onIncludeArchivedChange={(checked) => {
              setIncludeArchived(checked);
              setPage(1);
            }}
          />
        </Table>
      </Card>
    </div>
  );
}
