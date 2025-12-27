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
  DetailsHost,
  useTableDetails,
  SectionCard,
  DetailsScaffold,
  Input,
  IntlPhoneField,
  PillToggle,
} from "@bhq/ui";
import { Download, MoreHorizontal, ChevronDown } from "lucide-react";
import "@bhq/ui/styles/table.css";
import { makeApi } from "./api";
import { PartyKind } from "@bhq/api";
import { CreatePersonOverlay, CreateBusinessOverlay } from "./CreateOverlays";
import { PartyDetailsView } from "./PartyDetailsView";

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
  phoneMobileE164?: string | null;
  phoneLandlineE164?: string | null;
  whatsappE164?: string | null;
  tags: string[];
  notes?: string | null;

  // Contact-specific fields
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;

  // Address fields (shared)
  street?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;

  // Organization-specific fields
  website?: string | null;
  organizationName?: string | null;
  name?: string | null;

  // Status fields
  status?: string | null;
  leadStatus?: string | null;

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
  { key: "firstName", label: "First Name", default: false },
  { key: "lastName", label: "Last Name", default: false },
  { key: "nickname", label: "Nickname", default: false },
  { key: "website", label: "Website", default: false },
  { key: "city", label: "City", default: false },
  { key: "state", label: "State", default: false },
  { key: "postalCode", label: "Postal Code", default: false },
  { key: "country", label: "Country", default: false },
  { key: "street", label: "Street", default: false },
  { key: "street2", label: "Street 2", default: false },
  { key: "status", label: "Status", default: false },
  { key: "leadStatus", label: "Lead Status", default: false },
  { key: "tags", label: "Tags", default: true },
  { key: "notes", label: "Notes", default: false },
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

function coerceBoolean(value: any): boolean | null {
  if (value === true || value === false) return value;
  if (value == null) return null;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true" || v === "1" || v === "yes" || v === "y") return true;
    if (v === "false" || v === "0" || v === "no" || v === "n") return false;
  }
  return null;
}

function getArchivedFlag(payload: any): boolean | null {
  const direct = coerceBoolean(payload?.archived ?? payload?.isArchived ?? payload?.is_archived);
  if (direct !== null) return direct;
  if (payload?.archivedAt || payload?.archived_at) return true;
  const status = String(payload?.status ?? "").toLowerCase();
  if (status.includes("archiv")) return true;
  return null;
}

function isArchivedRow(row: PartyTableRow): boolean {
  const direct = coerceBoolean((row as any).archived);
  if (direct !== null) return direct;
  const status = String(row.status ?? "").toLowerCase();
  return status.includes("archiv");
}

/**
 * Format E164 phone number to display format with country code
 * Matches the standard used in IntlPhoneField and drawer views
 */
function formatE164Phone(e164?: string | null): string {
  if (!e164) return "";
  const digits = e164.replace(/\D/g, "");

  // US/NANP format: +1 (XXX) XXX-XXXX
  if (digits.startsWith("1") && digits.length === 11) {
    const local = digits.slice(1);
    return `+1 (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6, 10)}`;
  }

  // Other countries: +XX XXXX XXXX (space-separated groups)
  if (digits.length > 0) {
    // Find country code (1-3 digits)
    let ccLength = 1;
    if (digits.length >= 2 && !digits.startsWith("1")) {
      ccLength = digits.length >= 11 ? 2 : (digits.length >= 10 ? 1 : 2);
    }

    const cc = digits.slice(0, ccLength);
    const rest = digits.slice(ccLength);

    // Format rest in groups of 3-4 digits
    const groups: string[] = [];
    for (let i = 0; i < rest.length; i += (i === 0 ? 3 : 4)) {
      const take = i === 0 ? 3 : 4;
      groups.push(rest.slice(i, i + take));
    }

    return `+${cc} ${groups.join(" ")}`.trim();
  }

  return "";
}

/**
 * Convert Contact API response to PartyTableRow
 */
function contactToPartyRow(c: any): PartyTableRow {
  const firstName = c.firstName ?? c.first_name ?? null;
  const lastName = c.lastName ?? c.last_name ?? null;
  const nick = c.nickname ?? null;
  const rawPartyId = c.partyId ?? c.party_id ?? c.id;
  const partyId = Number.isFinite(Number(rawPartyId)) ? Number(rawPartyId) : Number(c.id);
  const orgId =
    c.organizationId ??
    c.organization_id ??
    c.organization?.id ??
    null;
  const orgName =
    c.organizationName ??
    c.organization_name ??
    c.organization?.name ??
    c.organization?.displayName ??
    c.organization?.label ??
    null;
  const displayFromParts = [nick || firstName, lastName].filter(Boolean).join(" ").trim();
  const archived = getArchivedFlag(c);
  const status = c.status ?? (archived ? "Archived" : "Active");

  return {
    partyId, // Prefer party fields, fallback to id
    kind: "CONTACT",
    displayName: (c.displayName ?? c.display_name ?? displayFromParts) || c.email || c.phone || `Contact ${c.id}`,
    email: c.email ?? null,
    phone: c.phone ?? c.phoneMobileE164 ?? c.whatsappE164 ?? c.phoneE164 ?? null,
    phoneMobileE164: c.phoneMobileE164 ?? null,
    phoneLandlineE164: c.phoneLandlineE164 ?? null,
    whatsappE164: c.whatsappE164 ?? null,
    firstName,
    lastName,
    nickname: nick,
    street: c.street ?? null,
    street2: c.street2 ?? null,
    city: c.city ?? null,
    state: c.state ?? null,
    postalCode: c.postalCode ?? c.postal_code ?? null,
    country: c.country ?? null,
    status,
    leadStatus: c.leadStatus ?? c.lead_status ?? null,
    tags: Array.isArray(c.tags) ? c.tags.filter(Boolean) : [],
    notes: c.notes ?? null,
    contactId: c.id,
    organizationId: orgId,
    organizationName: orgName,
    created_at: c.created_at ?? c.createdAt ?? null,
    updated_at: c.updated_at ?? c.updatedAt ?? null,
    archived,
    // Map backend commPrefs object to flat prefersX fields
    prefersEmail: c.commPrefs?.email ?? null,
    prefersSms: c.commPrefs?.sms ?? null,
    prefersPhone: c.commPrefs?.phone ?? null,
    prefersMail: c.commPrefs?.mail ?? null,
    prefersWhatsapp: c.commPrefs?.whatsapp ?? null,
  } as any;
}

/**
 * Convert Organization API response to PartyTableRow
 */
function organizationToPartyRow(o: any): PartyTableRow {
  const name = o.name ?? o.displayName ?? o.display_name ?? null;
  const rawPartyId = o.partyId ?? o.party_id ?? o.id;
  const partyId = Number.isFinite(Number(rawPartyId)) ? Number(rawPartyId) : Number(o.id);
  const archived = getArchivedFlag(o);
  const status = o.status ?? (archived ? "Archived" : "Active");

  return {
    partyId, // Prefer party fields, fallback to id
    kind: "ORGANIZATION",
    displayName: o.displayName ?? o.display_name ?? name ?? `Organization ${o.id}`,
    name,
    email: o.email ?? null,
    phone: o.phone ?? null,
    phoneMobileE164: o.phoneMobileE164 ?? null,
    phoneLandlineE164: o.phoneLandlineE164 ?? null,
    whatsappE164: o.whatsappE164 ?? null,
    website: o.website ?? null,
    street: o.street ?? null,
    street2: o.street2 ?? null,
    city: o.city ?? null,
    state: o.state ?? null,
    postalCode: o.postalCode ?? o.postal_code ?? o.zip ?? null,
    country: o.country ?? null,
    status,
    tags: Array.isArray(o.tags) ? o.tags : [],
    notes: o.notes ?? null,
    contactId: null,
    organizationId: o.id,
    created_at: o.created_at ?? o.createdAt ?? null,
    updated_at: o.updated_at ?? o.updatedAt ?? null,
    archived,
  };
}

// Removed - we'll use DetailsHost's context API instead

/* ────────────────────────────────────────────────────────────────────────────
 * Table Body Component (uses DetailsHost context)
 * ────────────────────────────────────────────────────────────────────────── */

function PartyTableBody({
  pageRows,
  visibleSafe,
  loading,
  error
}: {
  pageRows: PartyTableRow[];
  visibleSafe: any[];
  loading: boolean;
  error: string | null;
}) {
  const { open } = useTableDetails<PartyTableRow>();

  if (loading) {
    return (
      <TableRow>
        <TableCell colSpan={visibleSafe.length}>
          <div className="py-8 text-center text-sm text-secondary">Loading...</div>
        </TableCell>
      </TableRow>
    );
  }

  if (error) {
    return (
      <TableRow>
        <TableCell colSpan={visibleSafe.length}>
          <div className="py-8 text-center text-sm text-red-600">Error: {error}</div>
        </TableCell>
      </TableRow>
    );
  }

  if (pageRows.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={visibleSafe.length}>
          <div className="py-8 text-center text-sm text-secondary">No entries found.</div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {pageRows.map((r) => (
        <TableRow
          key={`${r.kind}-${r.partyId}`}
          className={`cursor-pointer ${isArchivedRow(r) ? "bhq-row-archived" : ""}`}
          onClick={() => open?.(r)}
        >
          {visibleSafe.map((c) => {
            let v: any = (r as any)[c.key];

            // Column width styling
            let cellStyle: React.CSSProperties = {};
            if (c.key === "kind") cellStyle = { width: "140px", maxWidth: "140px" };
            else if (c.key === "displayName") cellStyle = { width: "280px", maxWidth: "280px" };
            else if (c.key === "email") cellStyle = { minWidth: "200px" };
            else if (c.key === "phone") cellStyle = { minWidth: "180px" };
            else if (c.key === "tags") cellStyle = { minWidth: "120px" };

            // Special rendering for kind
            if (c.key === "kind") {
              return (
                <TableCell key={c.key} style={cellStyle}>
                  {v === "CONTACT" ? "Contact" : "Organization"}
                </TableCell>
              );
            }

            // Phone formatting - use E164 format with country code
            if (c.key === "phone") {
              // Prefer phoneMobileE164, fallback to phone field
              const phoneValue = r.phoneMobileE164 || r.phone || r.whatsappE164;
              v = formatE164Phone(phoneValue);
            }

            // Date formatting
            if (c.key === "created_at" || c.key === "updated_at") {
              v = fmt(v);
            }

            // Array formatting
            if (Array.isArray(v)) {
              v = v.join(", ");
            }

            return <TableCell key={c.key} style={cellStyle}>{v ?? ""}</TableCell>;
          })}
        </TableRow>
      ))}
    </>
  );
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
        const visible = includeArchived ? merged : merged.filter((r) => !isArchivedRow(r));

        if (!cancelled) setRows(visible);
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

  // Creation overlays state
  const [createPersonOpen, setCreatePersonOpen] = React.useState(false);
  const [createBusinessOpen, setCreateBusinessOpen] = React.useState(false);
  const [newButtonOpen, setNewButtonOpen] = React.useState(false);

  const newButtonRef = React.useRef<HTMLButtonElement>(null);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const rowCacheRef = React.useRef<Map<string, PartyTableRow>>(new Map());

  React.useEffect(() => {
    rows.forEach((r) => rowCacheRef.current.set(String(r.partyId), r));
  }, [rows]);

  const applyRowUpdate = React.useCallback((updatedRow: PartyTableRow) => {
    const updateKey = String(updatedRow.partyId);
    rowCacheRef.current.set(updateKey, updatedRow);
    setRows((prev) => {
      const shouldHide = !includeArchived && isArchivedRow(updatedRow);
      let replaced = false;
      const next: PartyTableRow[] = [];
      for (const r of prev) {
        if (String(r.partyId) === updateKey) {
          if (!replaced && !shouldHide) next.push(updatedRow);
          replaced = true;
          continue;
        }
        next.push(r);
      }
      if (!replaced && !shouldHide) next.unshift(updatedRow);
      return next;
    });
  }, [includeArchived]);

  // Handler for when a contact is created
  const handleContactCreated = React.useCallback((created: any) => {
    const newRow = contactToPartyRow(created);
    setRows((prev) => {
      // Add new row and re-sort by displayName (default sort)
      const updated = [newRow, ...prev];
      return updated.sort((a, b) =>
        a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" })
      );
    });
  }, []);

  // Handler for when an organization is created
  const handleOrganizationCreated = React.useCallback((created: any) => {
    const newRow = organizationToPartyRow(created);
    setRows((prev) => {
      // Add new row and re-sort by displayName (default sort)
      const updated = [newRow, ...prev];
      return updated.sort((a, b) =>
        a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" })
      );
    });
  }, []);

  // Unified details config that handles BOTH contacts and organizations
  // Uses partyId as the canonical ID param
  const detailsConfig = React.useMemo(
    () => ({
      idParam: "partyId",
      getRowId: (r: PartyTableRow) => r.partyId,
      width: 820,
      placement: "center" as const,
      align: "top" as const,
      fetchRow: async (id: number | string) => {
        // Find the row to determine if it's a contact or org
        const row =
          rows.find((r) => r.partyId === Number(id)) ??
          rowCacheRef.current.get(String(id));
        if (!row) {
          return {
            partyId: Number(id),
            kind: "CONTACT",
            displayName: `Party ${id}`,
            tags: [],
          } as PartyTableRow;
        }

        if (row.kind === "CONTACT" && row.contactId) {
          const raw = await api.contacts.get(row.contactId);
          return contactToPartyRow(raw);
        } else if (row.kind === "ORGANIZATION" && row.organizationId) {
          const raw = await api.organizations.get(row.organizationId);
          return organizationToPartyRow(raw);
        }
        return row;
      },
      header: (r: PartyTableRow) => ({
        title: r.kind === "ORGANIZATION" ? (r.name || r.displayName) : r.displayName,
        subtitle: r.kind === "CONTACT"
          ? (r.email || r.phone || "")
          : (r.email || r.phone || r.website || ""),
      }),
      tabs: [
        { key: "overview", label: "Overview" },
        { key: "animals", label: "Animals" },
        { key: "audit", label: "Audit" },
      ],
      customChrome: true, // Use custom chrome with DetailsScaffold
      render: (props: any) => <PartyDetailsView {...props} />,
      onSave: async (id: number | string, draft: any) => {
        const row = rows.find((r) => r.partyId === Number(id));
        if (!row) return;

        if (row.kind === "CONTACT" && row.contactId) {
          // Transform communication preferences to new backend format
          const payload: any = {};
          const commPreferences: Array<{
            channel: string;
            preference: string;
          }> = [];

          for (const [key, value] of Object.entries(draft)) {
            // Transform prefersX fields to commPreferences array
            if (key.startsWith('prefers')) {
              const channel = key.replace('prefers', '').toUpperCase();
              commPreferences.push({
                channel,
                preference: value ? 'ALLOW' : 'NEVER',
              });
            } else {
              payload[key] = value;
            }
          }

          // Only include commPreferences if we have any
          if (commPreferences.length > 0) {
            payload.commPreferences = commPreferences;
          }

          await api.contacts.update(row.contactId, payload);
          const updated = await api.contacts.get(row.contactId);
          const updatedRow = contactToPartyRow(updated);
          // Preserve the original partyId to prevent key collision
          updatedRow.partyId = row.partyId;
          applyRowUpdate(updatedRow);
        } else if (row.kind === "ORGANIZATION" && row.organizationId) {
          // Transform communication preferences for organizations too
          const payload: any = {};
          const commPreferences: Array<{
            channel: string;
            preference: string;
          }> = [];

          for (const [key, value] of Object.entries(draft)) {
            if (key.startsWith('prefers')) {
              const channel = key.replace('prefers', '').toUpperCase();
              commPreferences.push({
                channel,
                preference: value ? 'ALLOW' : 'NEVER',
              });
            } else {
              payload[key] = value;
            }
          }

          if (commPreferences.length > 0) {
            payload.commPreferences = commPreferences;
          }

          await api.organizations.update(row.organizationId, draft);
          const updated = await api.organizations.get(row.organizationId);
          const updatedRow = organizationToPartyRow(updated);
          // Preserve the original partyId to prevent key collision
          updatedRow.partyId = row.partyId;
          applyRowUpdate(updatedRow);
        }
      },
    }),
    [api, rows, applyRowUpdate]
  );

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <PageHeader
        title="Contacts"
        subtitle="Unified contacts and organizations"
        actions={
          <>
            {/* Unified New button with dropdown */}
            <Button
              ref={newButtonRef}
              size="sm"
              className="gap-1"
              onClick={() => setNewButtonOpen(true)}
            >
              New
              <ChevronDown className="h-3 w-3" />
            </Button>

            <Button
              ref={menuButtonRef}
              size="sm"
              variant="outline"
              aria-label="More actions"
              onClick={() => setMenuOpen(true)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </>
        }
      />

      {/* New button popover */}
      <Popover
        anchorRef={newButtonRef}
        open={newButtonOpen}
        onClose={() => setNewButtonOpen(false)}
        width={200}
        estHeight={120}
      >
        <button
          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 rounded"
          onClick={() => {
            setNewButtonOpen(false);
            setCreatePersonOpen(true);
          }}
        >
          New Person
        </button>
        <button
          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 rounded"
          onClick={() => {
            setNewButtonOpen(false);
            setCreateBusinessOpen(true);
          }}
        >
          New Organization
        </button>
      </Popover>

      {/* Menu popover */}
      <Popover
        anchorRef={menuButtonRef}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        width={200}
        estHeight={100}
      >
        <button
          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 rounded"
          onClick={handleExportCsv}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </Popover>

      <Card>
        <DetailsHost rows={rows} config={detailsConfig}>
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
              <PartyTableBody
                pageRows={pageRows}
                visibleSafe={visibleSafe}
                loading={loading}
                error={error}
              />
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
        </DetailsHost>
      </Card>

      {/* Creation overlays */}
      <CreatePersonOverlay
        open={createPersonOpen}
        onOpenChange={setCreatePersonOpen}
        onCreated={handleContactCreated}
        existingContacts={rows.filter((r) => r.kind === "CONTACT") as any[]}
      />

      <CreateBusinessOverlay
        open={createBusinessOpen}
        onOpenChange={setCreateBusinessOpen}
        onCreated={handleOrganizationCreated}
      />
    </div>
  );
}
