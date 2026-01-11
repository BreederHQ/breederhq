// apps/contacts/src/PartyDetailsView.tsx
// COMPLETE Contact/Organization details drawer - EXACT replica of original App-Contacts.tsx
import * as React from "react";
import { createPortal } from "react-dom";
import {
  DetailsScaffold,
  SectionCard,
  Input,
  IntlPhoneField,
  PillToggle,
  Badge,
  Button,
  TagPicker,
  TagCreateModal,
  Popover,
  Tooltip,
  type TagOption,
} from "@bhq/ui";
import { FinanceTab } from "@bhq/ui/components/Finance";
import { PortalAccessTab } from "@bhq/ui/components/PortalAccess";
import { Copy, MoreVertical, Archive, Trash2 } from "lucide-react";
import { getOverlayRoot } from "@bhq/ui/overlay";
import { makeApi } from "./api";
import { NotesTab } from "./components/NotesTab";
import { ActivityTab } from "./components/ActivityTab";
import { MessagesTab } from "./components/MessagesTab";
import { EmailComposer } from "./components/EmailComposer";
import { QuickDMComposer } from "./components/QuickDMComposer";
import { HeaderQuickActions } from "./components/HeaderQuickActions";
import { EventsSection } from "./components/EventsSection";

type ID = number | string;

type PhoneValue = {
  countryCode: string;
  callingCode: string;
  national: string;
  e164: string | null;
};

export type PartyTableRow = {
  partyId: number;
  kind: "CONTACT" | "ORGANIZATION";
  displayName: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  street?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  status?: string | null;
  leadStatus?: string | null;
  tags: string[];
  notes?: string | null;
  contactId?: number | null;
  organizationId?: number | null;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  organizationName?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  archived?: boolean | null;

  // Contact-specific fields
  nextFollowUp?: string | null;
  prefersEmail?: boolean | null;
  prefersSms?: boolean | null;
  prefersPhone?: boolean | null;
  prefersMail?: boolean | null;
  prefersWhatsapp?: boolean | null;
  emailUnsubscribed?: boolean | null;
  smsUnsubscribed?: boolean | null;
  phoneMobileE164?: string | null;
  phoneLandlineE164?: string | null;
  whatsappE164?: string | null;
};

type OrgOption = { id: number; name: string };

type AnimalRow = {
  id: ID;
  name: string | null;
  species: string | null;
  sex: string | null;
  status: string | null;
  role: string | null;
  sharePct: number | null;
};

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

function tinyDebounce<T extends (...args: any[]) => any>(fn: T, ms = 300) {
  let t: any;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

const OrganizationSelect: React.FC<{
  value: OrgOption | null;
  onChange: (v: OrgOption | null) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = "Select Organization" }) => {
  const api = React.useMemo(() => makeApi(), []);
  const [query, setQuery] = React.useState(value?.name ?? "");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<OrgOption[]>([]);
  const [highlight, setHighlight] = React.useState<number>(-1);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const doSearch = React.useMemo(
    () =>
      tinyDebounce(async (q: string) => {
        setLoading(true);
        setError(null);
        try {
          const list = await api.lookups.searchOrganizations(q);
          const mapped = (list || []).map((o: any) => ({
            id: Number(o.id),
            name: String(o.name || o.displayName || o.label || ""),
          }));
          setItems(mapped);
          setHighlight(mapped.length ? 0 : -1);
        } catch (e: any) {
          setError(e?.message || "Unable to load organizations");
          setItems([]);
        } finally {
          setLoading(false);
        }
      }, 200),
    [api]
  );

  React.useEffect(() => {
    if (open) doSearch(query);
  }, [query, open, doSearch]);

  React.useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const choose = (opt: OrgOption | null) => {
    onChange(opt);
    setQuery(opt?.name ?? "");
    setOpen(false);
  };

  return (
    <div className="relative" ref={rootRef}>
      <Input
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onChange={(e) => {
          setQuery((e.currentTarget as HTMLInputElement).value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, items.length - 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          }
          if (e.key === "Enter") {
            e.preventDefault();
            if (items[highlight]) choose(items[highlight]);
          }
          if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
        data-form-type="other"
      />
      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-md border border-hairline bg-surface shadow-lg max-height-60 overflow-auto"
          role="listbox"
        >
          {loading ? (
            <div className="px-3 py-2 text-sm text-secondary">Searching…</div>
          ) : error ? (
            <div className="px-3 py-2">
              <div className="text-sm text-red-400">{error}</div>
              <button
                type="button"
                className="mt-2 text-xs text-secondary hover:text-primary underline"
                onClick={() => doSearch(query)}
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="px-3 py-2">
              <div className="text-sm text-secondary mb-2">No organizations found</div>
              {query.trim() && (
                <button
                  type="button"
                  className="w-full text-left px-2 py-1.5 text-sm text-primary bg-white/5 rounded hover:bg-white/10"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const created = await api.organizations.create({ name: query.trim() });
                      const newOrg = { id: Number(created.id), name: String(created.name || query.trim()) };
                      choose(newOrg);
                    } catch (e: any) {
                      setError(e?.payload?.error || e?.message || "Failed to create organization");
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  + Create "{query.trim()}"
                </button>
              )}
            </div>
          ) : (
            items.map((opt, i) => (
              <button
                key={opt.id}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm ${i === highlight ? "bg-white/5" : ""}`}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(opt)}
                role="option"
                aria-selected={i === highlight}
              >
                {opt.name}
              </button>
            ))
          )}
          {value && !error && (
            <div className="border-t border-hairline">
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-xs text-secondary hover:bg-white/5"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(null)}
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const COUNTRIES = [
  "— Select country",
  "United States",
  "Argentina",
  "Australia",
  "Brazil",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "France",
  "Germany",
  "India",
  "Ireland",
  "Italy",
  "Japan",
  "Mexico",
  "Netherlands",
  "New Zealand",
  "Norway",
  "Peru",
  "Poland",
  "Portugal",
  "South Africa",
  "Spain",
  "Sweden",
  "Switzerland",
  "United Kingdom",
] as const;

const CountrySelect: React.FC<{
  value: string | null | undefined;
  onChange: (v: string | null) => void;
}> = ({ value, onChange }) => (
  <select
    className="w-full h-9 rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
    value={value ?? ""}
    onChange={(e) => onChange((e.target as HTMLSelectElement).value || null)}
  >
    {COUNTRIES.map((c) => (
      <option key={c} value={c === "— Select country" ? "" : c}>
        {c}
      </option>
    ))}
  </select>
);

function formatE164Phone(e164?: string | null) {
  if (!e164) return null;
  const digits = e164.replace(/\D/g, "");

  // US/NANP format: +1 (XXX) XXX-XXXX
  if (digits.startsWith("1") && digits.length === 11) {
    const local = digits.slice(1);
    return `+1 (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6, 10)}`;
  }

  // Other countries: just return as-is with + prefix
  return `+${digits}`;
}

export function PartyDetailsView({
  row,
  mode,
  setMode,
  setDraft,
  activeTab,
  setActiveTab,
  requestSave,
  close,
  hasPendingChanges,
  justSaved,
  onDelete,
}: {
  row: PartyTableRow;
  mode: "view" | "edit";
  setMode: (m: "view" | "edit") => void;
  setDraft: (updater: (prev: any) => any) => void;
  activeTab: string;
  setActiveTab: (k: string) => void;
  requestSave: () => Promise<void>;
  close?: () => void;
  hasPendingChanges?: boolean;
  justSaved?: boolean;
  onDelete?: () => Promise<void>;
}) {
  const api = React.useMemo(() => makeApi(), []);

  // Phone state management
  const [cell, setCell] = React.useState<string | PhoneValue>("");
  const [land, setLand] = React.useState<string | PhoneValue>("");
  const [wa, setWa] = React.useState<string | PhoneValue>("");

  // Sync phone fields when row changes
  React.useEffect(() => {
    setCell((row as any).phoneMobileE164 || row.phone || "");
    setLand((row as any).phoneLandlineE164 ?? "");
    setWa((row as any).whatsappE164 ?? "");
  }, [row]);

  // Communication preferences for Contacts
  // Backend returns PreferenceLevel enum: 'ALLOW', 'NOT_PREFERRED', 'NEVER'
  // UI treats 'ALLOW' as true (ON), everything else as false (OFF)
  const [prefs, setPrefs] = React.useState(() => ({
    email: (row as any).prefersEmail === 'ALLOW',
    sms: (row as any).prefersSms === 'ALLOW',
    phone: (row as any).prefersPhone === 'ALLOW',
    mail: (row as any).prefersMail === 'ALLOW',
    whatsapp: (row as any).prefersWhatsapp === 'ALLOW',
  }));

  React.useEffect(() => {
    setPrefs({
      email: (row as any).prefersEmail === 'ALLOW',
      sms: (row as any).prefersSms === 'ALLOW',
      phone: (row as any).prefersPhone === 'ALLOW',
      mail: (row as any).prefersMail === 'ALLOW',
      whatsapp: (row as any).prefersWhatsapp === 'ALLOW',
    });
  }, [row]);

  const togglePref = React.useCallback(
    (key: keyof typeof prefs) => {
      if (mode === "view") return;
      setPrefs((prev) => {
        const next = !prev[key];
        const camel = `prefers${key[0].toUpperCase()}${key.slice(1)}`;
        // Set enum value: true = 'ALLOW', false = 'NEVER'
        setDraft((d: any) => ({ ...d, [camel]: next ? 'ALLOW' : 'NEVER' }));
        return { ...prev, [key]: next };
      });
    },
    [mode, setDraft]
  );

  // Animals loading for Contacts
  const [animals, setAnimals] = React.useState<AnimalRow[] | null>(null);
  const [animalsErr, setAnimalsErr] = React.useState<string | null>(null);

  // Tags state
  const [availableTags, setAvailableTags] = React.useState<TagOption[]>([]);
  const [selectedTags, setSelectedTags] = React.useState<TagOption[]>([]);
  const [tagsLoading, setTagsLoading] = React.useState(false);
  const [tagsError, setTagsError] = React.useState<string | null>(null);
  const [showTagCreateModal, setShowTagCreateModal] = React.useState(false);

  React.useEffect(() => {
    if (activeTab !== "animals") {
      setAnimals(null);
    }
  }, [activeTab]);

  const loadAnimals = React.useCallback(async () => {
    if (row.kind !== "CONTACT" || !row.contactId) {
      setAnimalsErr(null);
      setAnimals([]);
      return;
    }

    try {
      setAnimalsErr(null);
      const res: any = await api.contactsExtras.animalsForContact(row.contactId);
      const scoped = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];

      const mapped: AnimalRow[] = scoped.map((a: any) => {
        const ownersList = Array.isArray(a.owners) ? a.owners : [];
        const contactOwnership = ownersList.find((o: any) =>
          String(o.contactId ?? o.contact_id) === String(row.contactId)
        );

        return {
          id: a.id,
          name: a.name ?? a.displayName ?? a.callName ?? null,
          species: a.species ?? null,
          sex: a.sex ?? null,
          status: a.status ?? null,
          role:
            contactOwnership?.role ??
            a.ownershipRole ??
            a.role ??
            a?.owner?.role ??
            a?.primaryOwner?.role ??
            (contactOwnership?.is_primary || contactOwnership?.isPrimary ? "Owner" : "Co-owner"),
          sharePct:
            contactOwnership?.percent ??
            contactOwnership?.sharePct ??
            a.ownershipSharePct ??
            a.sharePct ??
            a?.owner?.sharePct ??
            a?.primaryOwner?.sharePct ??
            null,
        };
      });

      setAnimals(mapped);
    } catch (e: any) {
      setAnimalsErr(e?.message || "Failed to load animals");
    }
  }, [api, row]);

  React.useEffect(() => {
    if (activeTab !== "animals" || animals !== null) return;
    loadAnimals();
  }, [activeTab, animals, loadAnimals]);

  // Load tags when component mounts or entity changes
  const loadTags = React.useCallback(async () => {
    const module = row.kind === "CONTACT" ? "CONTACT" : "ORGANIZATION";
    const entityId = row.kind === "CONTACT" ? row.contactId : row.organizationId;
    if (!entityId) return;

    setTagsLoading(true);
    setTagsError(null);
    try {
      // Load available tags for this module
      const availableRes = await api.tags.list({ module, limit: 200 });
      const available = (availableRes?.items || []).map((t: any) => ({
        id: Number(t.id),
        name: String(t.name),
        color: t.color ?? null,
      }));
      setAvailableTags(available);

      // Load currently assigned tags using unified tags API
      const target = row.kind === "CONTACT"
        ? { contactId: entityId }
        : { organizationId: entityId };
      const assignedRes = await api.tags.listForEntity(target);
      const assigned = (assignedRes || []).map((t: any) => ({
        id: Number(t.id),
        name: String(t.name),
        color: t.color ?? null,
      }));
      setSelectedTags(assigned);
    } catch (e: any) {
      setTagsError(e?.message || "Failed to load tags");
    } finally {
      setTagsLoading(false);
    }
  }, [api, row.kind, row.contactId, row.organizationId]);

  React.useEffect(() => {
    loadTags();
  }, [loadTags]);

  // Tag assignment handlers
  const handleTagSelect = React.useCallback(async (tag: TagOption) => {
    const entityId = row.kind === "CONTACT" ? row.contactId : row.organizationId;
    if (!entityId) return;

    // Optimistic update
    setSelectedTags((prev) => [...prev, tag]);
    setTagsError(null);

    try {
      const target = row.kind === "CONTACT"
        ? { contactId: entityId }
        : { organizationId: entityId };
      await api.tags.assign(tag.id, target);
    } catch (e: any) {
      // Rollback on error
      setSelectedTags((prev) => prev.filter((t) => t.id !== tag.id));
      setTagsError(e?.message || "Failed to assign tag");
    }
  }, [api, row.kind, row.contactId, row.organizationId]);

  const handleTagRemove = React.useCallback(async (tag: TagOption) => {
    const entityId = row.kind === "CONTACT" ? row.contactId : row.organizationId;
    if (!entityId) return;

    // Optimistic update
    setSelectedTags((prev) => prev.filter((t) => t.id !== tag.id));
    setTagsError(null);

    try {
      const target = row.kind === "CONTACT"
        ? { contactId: entityId }
        : { organizationId: entityId };
      await api.tags.unassign(tag.id, target);
    } catch (e: any) {
      // Rollback on error
      setSelectedTags((prev) => [...prev, tag]);
      setTagsError(e?.message || "Failed to remove tag");
    }
  }, [api, row.kind, row.contactId, row.organizationId]);

  const handleTagCreate = React.useCallback(async (name: string): Promise<TagOption> => {
    const module = row.kind === "CONTACT" ? "CONTACT" : "ORGANIZATION";
    const created = await api.tags.create({ name, module });
    const newTag: TagOption = {
      id: Number(created.id),
      name: String(created.name),
      color: created.color ?? null,
    };
    // Add to available tags list
    setAvailableTags((prev) => [...prev, newTag]);
    return newTag;
  }, [api, row.kind]);

  // Handler for TagCreateModal (includes color) - auto-assigns tag after creation
  const handleModalTagCreate = React.useCallback(async (data: { name: string; module: string; color: string | null }) => {
    const module = row.kind === "CONTACT" ? "CONTACT" : "ORGANIZATION";
    const entityId = row.kind === "CONTACT" ? row.contactId : row.organizationId;

    const created = await api.tags.create({ name: data.name, module, color: data.color });
    const newTag: TagOption = {
      id: Number(created.id),
      name: String(created.name),
      color: created.color ?? null,
    };
    setAvailableTags((prev) => [...prev, newTag]);

    // Auto-assign the newly created tag to this entity
    if (entityId) {
      setSelectedTags((prev) => [...prev, newTag]);
      try {
        const target = row.kind === "CONTACT"
          ? { contactId: entityId }
          : { organizationId: entityId };
        await api.tags.assign(newTag.id, target);
      } catch (e: any) {
        // Rollback on error
        setSelectedTags((prev) => prev.filter((t) => t.id !== newTag.id));
        setTagsError(e?.message || "Failed to assign tag");
      }
    }
  }, [api, row.kind, row.contactId, row.organizationId]);

  // Compliance confirmation modal
  const [confirmReset, setConfirmReset] = React.useState<
    null | { channel: "email" | "sms"; onAnswer: (ok: boolean) => void }
  >(null);

  const overlayRoot = typeof document !== "undefined" ? document.getElementById("bhq-overlay-root") : null;

  // Overflow menu state
  const [overflowMenuOpen, setOverflowMenuOpen] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [canDelete, setCanDelete] = React.useState<boolean | null>(null); // null = not checked yet
  const [deleteBlockers, setDeleteBlockers] = React.useState<{
    blockers: Record<string, boolean | string[] | undefined>;
    details?: Record<string, number | undefined>;
  } | null>(null);

  // Fetch delete eligibility when entering edit mode
  React.useEffect(() => {
    if (mode !== "edit" || !onDelete) return;

    let cancelled = false;
    const checkDelete = async () => {
      try {
        let result: { canDelete: boolean; blockers: Record<string, any>; details?: Record<string, any> };
        if (row.kind === "CONTACT" && row.contactId) {
          result = await api.contacts.canDelete(row.contactId);
        } else if (row.kind === "ORGANIZATION" && row.organizationId) {
          result = await api.organizations.canDelete(row.organizationId);
        } else {
          // No valid entity to check
          if (!cancelled) {
            setCanDelete(true);
            setDeleteBlockers(null);
          }
          return;
        }

        if (!cancelled) {
          setCanDelete(result.canDelete);
          setDeleteBlockers(result.canDelete ? null : { blockers: result.blockers, details: result.details });
        }
      } catch (e) {
        console.error("[Contacts] canDelete check failed", e);
        // If check fails, allow delete attempt (API will block if needed)
        if (!cancelled) {
          setCanDelete(true);
          setDeleteBlockers(null);
        }
      }
    };

    checkDelete();
    return () => { cancelled = true; };
  }, [mode, onDelete, row.kind, row.contactId, row.organizationId, api]);

  // Archive button
  const [archiving, setArchiving] = React.useState(false);
  const handleArchive = async () => {
    try {
      setArchiving(true);
      setDraft((d: any) => ({ ...d, archived: true }));
      await requestSave();
    } catch (e) {
      console.error("Archive failed", e);
    } finally {
      setArchiving(false);
    }
  };
  const handleUnarchive = async () => {
    try {
      setArchiving(true);
      setDraft((d: any) => ({ ...d, archived: false }));
      await requestSave();
    } catch (e) {
      console.error("Unarchive failed", e);
    } finally {
      setArchiving(false);
    }
  };

  // Next follow-up
  const [snoozing, setSnoozing] = React.useState(false);

  // Email composer state
  const [showEmailComposer, setShowEmailComposer] = React.useState(false);

  // Quick DM composer state
  const [showDMComposer, setShowDMComposer] = React.useState(false);

  // Get WhatsApp number - prefer dedicated field, fallback to mobile
  const whatsappNumber = (row as any).whatsappE164 || (prefs.whatsapp ? (row as any).phoneMobileE164 || row.phone : null);

  // Handler for follow-up changes
  const handleFollowUpChange = React.useCallback(async (iso: string | null) => {
    const value = iso ? new Date(iso).toISOString() : null;
    try {
      setSnoozing(true);
      if (row.contactId) {
        await api.contacts.update(row.contactId, { nextFollowUp: value });
        setDraft((d: any) => ({ ...d, nextFollowUp: value }));
      }
    } catch (e) {
      console.error("nextFollowUp save failed", e);
    } finally {
      setSnoozing(false);
    }
  }, [api, row.contactId, setDraft]);

  // Quick actions in header (only in view mode for Contacts)
  const headerRight = row.kind === "CONTACT" && mode === "view" ? (
    <HeaderQuickActions
      email={row.email}
      phone={(row as any).phoneMobileE164 || row.phone}
      whatsapp={whatsappNumber}
      partyName={row.displayName}
      onComposeEmail={() => row.email && setShowEmailComposer(true)}
      onComposeDM={() => setShowDMComposer(true)}
      nextFollowUp={row.nextFollowUp}
      onFollowUpChange={handleFollowUpChange}
    />
  ) : undefined;

  // Build tooltip text for disabled delete button
  const deleteBlockerTooltip = React.useMemo(() => {
    if (!deleteBlockers) return null;
    const lines: string[] = [];
    const b = deleteBlockers.blockers;
    const d = deleteBlockers.details;
    if (b.hasAnimals) lines.push(`Owns ${d?.animalCount ?? "some"} animal${(d?.animalCount ?? 0) !== 1 ? "s" : ""}`);
    if (b.hasInvoices) lines.push(`Has ${d?.invoiceCount ?? "some"} invoice${(d?.invoiceCount ?? 0) !== 1 ? "s" : ""}`);
    if (b.hasPayments) lines.push(`Has ${d?.paymentCount ?? "some"} payment${(d?.paymentCount ?? 0) !== 1 ? "s" : ""}`);
    if (b.hasWaitlistEntries) lines.push(`Has ${d?.waitlistEntryCount ?? "some"} waitlist ${(d?.waitlistEntryCount ?? 0) !== 1 ? "entries" : "entry"}`);
    if (b.hasBreedingPlans) lines.push(`Has ${d?.breedingPlanCount ?? "some"} breeding plan${(d?.breedingPlanCount ?? 0) !== 1 ? "s" : ""}`);
    if (b.hasDocuments) lines.push(`Has ${d?.documentCount ?? "some"} document${(d?.documentCount ?? 0) !== 1 ? "s" : ""}`);
    if (b.hasPortalAccess) lines.push("Has active portal access");
    if (b.hasMembers) lines.push(`Has ${d?.memberCount ?? "some"} member${(d?.memberCount ?? 0) !== 1 ? "s" : ""}`);
    if (b.hasExpenses) lines.push(`Has ${d?.expenseCount ?? "some"} expense${(d?.expenseCount ?? 0) !== 1 ? "s" : ""}`);
    if (Array.isArray(b.other)) lines.push(...b.other);
    return lines.length > 0 ? lines.join("\n") : "Cannot delete due to related records";
  }, [deleteBlockers]);

  // Handle delete action
  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
      close?.();
    } catch (e) {
      console.error("[Contacts] delete failed", e);
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  // Overflow menu content (only in edit mode)
  const tabsRightContent = mode === "edit" ? (
    <Popover open={overflowMenuOpen} onOpenChange={setOverflowMenuOpen}>
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
        {/* Archive / Unarchive */}
        <button
          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 rounded disabled:opacity-50"
          disabled={archiving}
          onClick={async () => {
            setOverflowMenuOpen(false);
            if (row.archived) {
              await handleUnarchive();
            } else {
              await handleArchive();
            }
          }}
        >
          <Archive className="h-4 w-4" />
          {archiving
            ? (row.archived ? "Unarchiving…" : "Archiving…")
            : (row.archived ? "Unarchive" : "Archive")}
        </button>
        {/* Delete */}
        {onDelete && (
          <Tooltip
            content={
              canDelete === false && deleteBlockerTooltip ? (
                <div className="max-w-xs">
                  <div className="font-semibold mb-1">Cannot delete</div>
                  <div className="text-xs whitespace-pre-line">{deleteBlockerTooltip}</div>
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
                setDeleteConfirmOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
              {canDelete === null ? "Checking…" : "Delete"}
            </button>
          </Tooltip>
        )}
      </Popover.Content>
    </Popover>
  ) : undefined;

  const editText = (k: keyof PartyTableRow, placeholder?: string) => (
    <Input
      size="sm"
      defaultValue={(row as any)[k] ?? ""}
      placeholder={placeholder}
      onChange={(e) => {
        const value = e.target.value;
        setDraft((d: any) => ({ ...d, [k]: value }));
      }}
      autoComplete="off"
      data-1p-ignore
      data-lpignore="true"
      data-form-type="other"
    />
  );

  return (
    <>
      <DetailsScaffold
        title={row.kind === "ORGANIZATION" ? (row.name || row.displayName) : row.displayName}
        subtitle={
          row.archived
            ? <span className="text-amber-400">(Archived)</span>
            : row.kind === "CONTACT"
              ? row.organizationName || row.email || ""
              : row.email || row.phone || row.website || ""
        }
        mode={row.archived ? "view" : mode}
        onEdit={row.archived ? undefined : () => setMode("edit")}
        onCancel={() => setMode("view")}
        onSave={requestSave}
        tabs={[
          { key: "overview", label: "Overview" },
          { key: "messages", label: "Messages" },
          { key: "notes", label: "Notes" },
          { key: "finances", label: "Finances" },
          { key: "animals", label: "Animals" },
          { key: "documents", label: "Documents" },
          { key: "portal", label: "Portal" },
          { key: "activity", label: "Activity" },
          { key: "audit", label: "Audit" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        rightActions={headerRight}
        tabsRightContent={tabsRightContent}
        onClose={close}
        hasPendingChanges={hasPendingChanges}
        justSaved={justSaved}
        hideCloseButton
        showFooterClose
      >
        {activeTab === "overview" && (
          <div className="space-y-3">
            {/* Identity section - for Contacts only */}
            {row.kind === "CONTACT" && (
              <SectionCard title={<SectionTitle icon="🆔">Identity</SectionTitle>} highlight={mode === "edit"}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-secondary mb-1">First Name</div>
                    {mode === "view" ? (
                      <div className="text-sm">{row.firstName || "—"}</div>
                    ) : (
                      editText("firstName")
                    )}
                  </div>

                  <div>
                    <div className="text-xs text-secondary mb-1">Last Name</div>
                    {mode === "view" ? (
                      <div className="text-sm">{row.lastName || "—"}</div>
                    ) : (
                      editText("lastName")
                    )}
                  </div>

                  <div>
                    <div className="text-xs text-secondary mb-1">Nickname</div>
                    {mode === "view" ? (
                      <div className="text-sm">{row.nickname || "—"}</div>
                    ) : (
                      editText("nickname")
                    )}
                  </div>

                  <div className="sm:col-span-3">
                    <div className="text-xs text-secondary mb-1">Affiliated Organization</div>
                    {mode === "view" ? (
                      <div className="text-sm">{row.organizationName || "—"}</div>
                    ) : (
                      <OrganizationSelect
                        value={
                          row.organizationId
                            ? { id: Number(row.organizationId), name: row.organizationName || "" }
                            : null
                        }
                        onChange={(opt) =>
                          setDraft((d: any) => ({
                            ...d,
                            organizationId: opt?.id ?? null,
                            organizationName: opt?.name ?? null,
                          }))
                        }
                        placeholder="— Select Organization"
                      />
                    )}
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Organization section - for Organizations only */}
            {row.kind === "ORGANIZATION" && (
              <SectionCard title={<SectionTitle icon="🏢">Organization</SectionTitle>} highlight={mode === "edit"}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <div className="text-xs text-secondary mb-1">Name</div>
                    {mode === "view" ? (
                      <div className="text-sm">{row.name || row.displayName || "-"}</div>
                    ) : (
                      <Input
                        size="sm"
                        defaultValue={row.name ?? row.displayName ?? ""}
                        onChange={(e) =>
                          setDraft((d: any) => ({ ...d, name: (e.currentTarget as HTMLInputElement).value }))
                        }
                        autoComplete="off"
                        data-1p-ignore
                        data-lpignore="true"
                        data-form-type="other"
                      />
                    )}
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Address */}
            <SectionCard title={<SectionTitle icon="📍">Address</SectionTitle>} highlight={mode === "edit"}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-secondary mb-1">Street</div>
                  {mode === "view" ? (
                    <div className="text-sm">{row.street || "—"}</div>
                  ) : (
                    editText("street")
                  )}
                </div>

                <div>
                  <div className="text-xs text-secondary mb-1">Street 2</div>
                  {mode === "view" ? (
                    <div className="text-sm">{row.street2 || "—"}</div>
                  ) : (
                    editText("street2")
                  )}
                </div>

                <div>
                  <div className="text-xs text-secondary mb-1">City</div>
                  {mode === "view" ? (
                    <div className="text-sm">{row.city || "—"}</div>
                  ) : (
                    editText("city")
                  )}
                </div>

                <div>
                  <div className="text-xs text-secondary mb-1">State / Region</div>
                  {mode === "view" ? (
                    <div className="text-sm">{row.state || "—"}</div>
                  ) : (
                    editText("state")
                  )}
                </div>

                <div>
                  <div className="text-xs text-secondary mb-1">Postal Code</div>
                  {mode === "view" ? (
                    <div className="text-sm">{row.postalCode || "—"}</div>
                  ) : (
                    editText("postalCode")
                  )}
                </div>

                <div>
                  <div className="text-xs text-secondary mb-1">Country</div>
                  {mode === "view" ? (
                    <div className="text-sm">{row.country || "—"}</div>
                  ) : (
                    <CountrySelect
                      value={row.country}
                      onChange={(v) => setDraft((d: any) => ({ ...d, country: v }))}
                    />
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Tags - Compact inline layout */}
            <SectionCard
              title={<SectionTitle icon="🏷️">Tags</SectionTitle>}
              right={
                <TagPicker
                  availableTags={availableTags}
                  selectedTags={selectedTags}
                  onSelect={handleTagSelect}
                  onRemove={handleTagRemove}
                  onCreate={handleTagCreate}
                  loading={tagsLoading}
                  error={tagsError}
                  placeholder="Add tags..."
                  disabled={mode === "view"}
                  onNewTagClick={() => setShowTagCreateModal(true)}
                />
              }
            />

            {/* Communication Preferences + Compliance side by side - for Contacts only */}
            {row.kind === "CONTACT" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <SectionCard title={<SectionTitle icon="📞">Communication Preferences</SectionTitle>} highlight={mode === "edit"}>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <PillToggle
                      on={!!prefs.email}
                      label="Email"
                      onClick={() => togglePref("email")}
                      className={`inline-flex h-7 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-[11px] leading-none border transition-colors select-none${mode === "view" ? " pointer-events-none" : ""}`}
                    />
                    <PillToggle
                      on={!!prefs.sms}
                      label="SMS"
                      onClick={() => togglePref("sms")}
                      className={`inline-flex h-7 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-[11px] leading-none border transition-colors select-none${mode === "view" ? " pointer-events-none" : ""}`}
                    />
                    <PillToggle
                      on={!!prefs.phone}
                      label="Phone"
                      onClick={() => togglePref("phone")}
                      className={`inline-flex h-7 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-[11px] leading-none border transition-colors select-none${mode === "view" ? " pointer-events-none" : ""}`}
                    />
                    <PillToggle
                      on={!!prefs.mail}
                      label="Mail"
                      onClick={() => togglePref("mail")}
                      className={`inline-flex h-7 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-[11px] leading-none border transition-colors select-none${mode === "view" ? " pointer-events-none" : ""}`}
                    />
                    <PillToggle
                      on={!!prefs.whatsapp}
                      label="WhatsApp"
                      onClick={() => togglePref("whatsapp")}
                      className={`inline-flex h-7 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-[11px] leading-none border transition-colors select-none${mode === "view" ? " pointer-events-none" : ""}`}
                    />
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-secondary min-w-[80px]">Email</div>
                    {mode === "view" ? (
                      <div className="text-sm flex items-center gap-2">
                        <span>{row.email || "—"}</span>
                        {row.email ? (
                          <button
                            type="button"
                            className="inline-flex h-6 w-6 items-center justify-center rounded text-secondary hover:text-primary hover:bg-white/5"
                            onClick={() => navigator.clipboard.writeText(row.email || "")}
                            aria-label="Copy email address"
                            title="Copy email address"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex-1">
                        <Input
                          type="email"
                          defaultValue={row.email ?? ""}
                          onChange={(e) =>
                            setDraft((d: any) => ({ ...d, email: (e.currentTarget as HTMLInputElement).value }))
                          }
                          autoComplete="off"
                          data-1p-ignore
                          data-lpignore="true"
                          data-form-type="other"
                        />
                      </div>
                    )}
                  </div>

                  {/* Phones */}
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-secondary min-w-[80px]">Cell Phone</div>
                    {mode === "view" ? (
                      <div className="text-sm">
                        {formatE164Phone((row as any).phoneMobileE164 || row.phone) || "—"}
                      </div>
                    ) : (
                      <div className="flex-1">
                        {/* @ts-ignore */}
                        <IntlPhoneField
                          value={cell}
                          onChange={(v) => {
                            setCell(v);
                            const e164 = typeof v === "string" ? v : v?.e164;
                            const waE164 = typeof wa === "string" ? wa : wa?.e164;
                            setDraft((d: any) => ({
                              ...d,
                              phoneMobileE164: e164 || null,
                              phone: e164 || waE164 || null,
                            }));
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-xs text-secondary min-w-[80px]">Landline</div>
                    {mode === "view" ? (
                      <div className="text-sm">{formatE164Phone((row as any).phoneLandlineE164) || "—"}</div>
                    ) : (
                      <div className="flex-1">
                        {/* @ts-ignore */}
                        <IntlPhoneField
                          value={land}
                          onChange={(v) => {
                            setLand(v);
                            const e164 = typeof v === "string" ? v : v?.e164;
                            setDraft((d: any) => ({
                              ...d,
                              phoneLandlineE164: e164 || null,
                            }));
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-xs text-secondary min-w-[80px]">WhatsApp</div>
                    {mode === "view" ? (
                      <div className="text-sm">{formatE164Phone((row as any).whatsappE164) || "—"}</div>
                    ) : (
                      <div className="flex-1">
                        {/* @ts-ignore */}
                        <IntlPhoneField
                          value={wa}
                          onChange={(v) => {
                            setWa(v);
                            const e164 = typeof v === "string" ? v : v?.e164;
                            const cellE164 = typeof cell === "string" ? cell : cell?.e164;
                            setDraft((d: any) => ({
                              ...d,
                              whatsappE164: e164 || null,
                              phone: cellE164 || e164 || null,
                            }));
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {mode === "edit" && (
                    <div className="text-xs text-secondary">
                      If Cell Phone is left empty, WhatsApp will be used as the phone on save.
                    </div>
                  )}
                </SectionCard>

                <SectionCard title={<SectionTitle icon="⚖️">Compliance</SectionTitle>} highlight={mode === "edit"}>
                  <div className="text-xs text-secondary mb-2">
                    System sets these from unsubscribes. Select Reset to opt the user back in. Action is logged on save.
                  </div>

                  {mode === "view" ? (
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">EMAIL</span>
                        <span className="text-xs px-2 py-0.5 rounded border border-hairline">
                          {(row as any).emailUnsubscribed ? "unsubscribed" : "subscribed"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">SMS</span>
                        <span className="text-xs px-2 py-0.5 rounded border border-hairline">
                          {(row as any).smsUnsubscribed ? "unsubscribed" : "subscribed"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-8">
                      {/* EMAIL Reset */}
                      <label className="flex items-center gap-2 text-xs">
                        <span>EMAIL</span>
                        <span className="px-2 py-0.5 rounded border border-hairline text-xs">
                          {(row as any).emailUnsubscribed ? "unsubscribed" : "subscribed"}
                        </span>
                        <input
                          type="checkbox"
                          defaultChecked={!!(row as any).emailOptOutOverride}
                          onChange={(e) => {
                            const el = e.currentTarget as HTMLInputElement;
                            const checked = el.checked;

                            if (checked) {
                              setConfirmReset({
                                channel: "email",
                                onAnswer: (ok) => {
                                  if (ok) {
                                    setDraft((d: any) => ({ ...d, emailOptOutOverride: true }));
                                    el.checked = true;
                                  } else {
                                    el.checked = false;
                                  }
                                  setConfirmReset(null);
                                },
                              });
                            } else {
                              setDraft((d: any) => ({ ...d, emailOptOutOverride: false }));
                            }
                          }}
                        />
                        <span>Reset</span>
                      </label>

                      {/* SMS Reset */}
                      <label className="flex items-center gap-2 text-xs">
                        <span>SMS</span>
                        <span className="px-2 py-0.5 rounded border border-hairline text-xs">
                          {(row as any).smsUnsubscribed ? "unsubscribed" : "subscribed"}
                        </span>
                        <input
                          type="checkbox"
                          defaultChecked={!!(row as any).smsOptOutOverride}
                          onChange={(e) => {
                            const el = e.currentTarget as HTMLInputElement;
                            const checked = el.checked;

                            if (checked) {
                              setConfirmReset({
                                channel: "sms",
                                onAnswer: (ok) => {
                                  if (ok) {
                                    setDraft((d: any) => ({ ...d, smsOptOutOverride: true }));
                                    el.checked = true;
                                  } else {
                                    el.checked = false;
                                  }
                                  setConfirmReset(null);
                                },
                              });
                            } else {
                              setDraft((d: any) => ({ ...d, smsOptOutOverride: false }));
                            }
                          }}
                        />
                        <span>Reset</span>
                      </label>
                    </div>
                  )}
                </SectionCard>
              </div>
            )}

            {/* Communication Preferences - for Organizations only */}
            {row.kind === "ORGANIZATION" && (
              <SectionCard title={<SectionTitle icon="📞">Communication Preferences</SectionTitle>} highlight={mode === "edit"}>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <PillToggle
                    on={!!prefs.email}
                    label="Email"
                    onClick={() => togglePref("email")}
                    className={`inline-flex h-7 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-[11px] leading-none border transition-colors select-none${mode === "view" ? " pointer-events-none" : ""}`}
                  />
                  <PillToggle
                    on={!!prefs.sms}
                    label="SMS"
                    onClick={() => togglePref("sms")}
                    className={`inline-flex h-7 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-[11px] leading-none border transition-colors select-none${mode === "view" ? " pointer-events-none" : ""}`}
                  />
                  <PillToggle
                    on={!!prefs.phone}
                    label="Phone"
                    onClick={() => togglePref("phone")}
                    className={`inline-flex h-7 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-[11px] leading-none border transition-colors select-none${mode === "view" ? " pointer-events-none" : ""}`}
                  />
                  <PillToggle
                    on={!!prefs.mail}
                    label="Mail"
                    onClick={() => togglePref("mail")}
                    className={`inline-flex h-7 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-[11px] leading-none border transition-colors select-none${mode === "view" ? " pointer-events-none" : ""}`}
                  />
                  <PillToggle
                    on={!!prefs.whatsapp}
                    label="WhatsApp"
                    onClick={() => togglePref("whatsapp")}
                    className={`inline-flex h-7 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-[11px] leading-none border transition-colors select-none${mode === "view" ? " pointer-events-none" : ""}`}
                  />
                </div>

                {/* Website */}
                <div className="flex items-center gap-3">
                  <div className="text-xs text-secondary min-w-[80px]">Website</div>
                  {mode === "view" ? (
                    <div className="text-sm">{row.website || "—"}</div>
                  ) : (
                    <div className="flex-1">
                      {editText("website")}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="flex items-center gap-3">
                  <div className="text-xs text-secondary min-w-[80px]">Email</div>
                  {mode === "view" ? (
                    <div className="text-sm flex items-center gap-2">
                      <span>{row.email || "—"}</span>
                      {row.email ? (
                        <button
                          type="button"
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-secondary hover:text-primary hover:bg-white/5"
                          onClick={() => navigator.clipboard.writeText(row.email || "")}
                          aria-label="Copy email address"
                          title="Copy email address"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex-1">
                      <Input
                        size="sm"
                        type="email"
                        defaultValue={row.email ?? ""}
                        onChange={(e) => setDraft((d: any) => ({ ...d, email: e.target.value }))}
                        autoComplete="off"
                        data-1p-ignore
                        data-lpignore="true"
                        data-form-type="other"
                      />
                    </div>
                  )}
                </div>

                {/* Phones */}
                <div className="flex items-center gap-3">
                  <div className="text-xs text-secondary min-w-[80px]">Cell Phone</div>
                  {mode === "view" ? (
                    <div className="text-sm">
                      {formatE164Phone((row as any).phoneMobileE164 || row.phone) || "—"}
                    </div>
                  ) : (
                    <div className="flex-1">
                      {/* @ts-ignore */}
                      <IntlPhoneField
                        value={cell}
                        onChange={(v) => {
                          setCell(v);
                          const e164 = typeof v === "string" ? v : v?.e164;
                          const waE164 = typeof wa === "string" ? wa : wa?.e164;
                          setDraft((d: any) => ({
                            ...d,
                            phoneMobileE164: e164 || null,
                            phone: e164 || waE164 || null,
                          }));
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs text-secondary min-w-[80px]">Landline</div>
                  {mode === "view" ? (
                    <div className="text-sm">{formatE164Phone((row as any).phoneLandlineE164) || "—"}</div>
                  ) : (
                    <div className="flex-1">
                      {/* @ts-ignore */}
                      <IntlPhoneField
                        value={land}
                        onChange={(v) => {
                          setLand(v);
                          const e164 = typeof v === "string" ? v : v?.e164;
                          setDraft((d: any) => ({
                            ...d,
                            phoneLandlineE164: e164 || null,
                          }));
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs text-secondary min-w-[80px]">WhatsApp</div>
                  {mode === "view" ? (
                    <div className="text-sm">{formatE164Phone((row as any).whatsappE164) || "—"}</div>
                  ) : (
                    <div className="flex-1">
                      {/* @ts-ignore */}
                      <IntlPhoneField
                        value={wa}
                        onChange={(v) => {
                          setWa(v);
                          const e164 = typeof v === "string" ? v : v?.e164;
                          const cellE164 = typeof cell === "string" ? cell : cell?.e164;
                          setDraft((d: any) => ({
                            ...d,
                            whatsappE164: e164 || null,
                            phone: cellE164 || e164 || null,
                          }));
                        }}
                      />
                    </div>
                  )}
                </div>

                {mode === "edit" && (
                  <div className="text-xs text-secondary">
                    If Cell Phone is left empty, WhatsApp will be used as the phone on save.
                  </div>
                )}
              </SectionCard>
            )}

            {/* Compliance - for Organizations */}
            {row.kind === "ORGANIZATION" && (
              <SectionCard title={<SectionTitle icon="⚖️">Compliance</SectionTitle>} highlight={mode === "edit"}>
                <div className="text-xs text-secondary mb-2">
                  System sets these from unsubscribes. Select Reset to opt the user back in. Action is logged on save.
                </div>

                {mode === "view" ? (
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">EMAIL</span>
                      <span className="text-xs px-2 py-0.5 rounded border border-hairline">
                        {(row as any).emailUnsubscribed ? "unsubscribed" : "subscribed"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">SMS</span>
                      <span className="text-xs px-2 py-0.5 rounded border border-hairline">
                        {(row as any).smsUnsubscribed ? "unsubscribed" : "subscribed"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-8">
                    {/* EMAIL Reset */}
                    <label className="flex items-center gap-2 text-xs">
                      <span>EMAIL</span>
                      <span className="px-2 py-0.5 rounded border border-hairline text-xs">
                        {(row as any).emailUnsubscribed ? "unsubscribed" : "subscribed"}
                      </span>
                      <input
                        type="checkbox"
                        defaultChecked={!!(row as any).emailOptOutOverride}
                        onChange={(e) => {
                          const el = e.currentTarget as HTMLInputElement;
                          const checked = el.checked;

                          if (checked) {
                            setConfirmReset({
                              channel: "email",
                              onAnswer: (ok) => {
                                if (ok) {
                                  setDraft((d: any) => ({ ...d, emailOptOutOverride: true }));
                                  el.checked = true;
                                } else {
                                  el.checked = false;
                                }
                                setConfirmReset(null);
                              },
                            });
                          } else {
                            setDraft((d: any) => ({ ...d, emailOptOutOverride: false }));
                          }
                        }}
                      />
                      <span>Reset</span>
                    </label>

                    {/* SMS Reset */}
                    <label className="flex items-center gap-2 text-xs">
                      <span>SMS</span>
                      <span className="px-2 py-0.5 rounded border border-hairline text-xs">
                        {(row as any).smsUnsubscribed ? "unsubscribed" : "subscribed"}
                      </span>
                      <input
                        type="checkbox"
                        defaultChecked={!!(row as any).smsOptOutOverride}
                        onChange={(e) => {
                          const el = e.currentTarget as HTMLInputElement;
                          const checked = el.checked;

                          if (checked) {
                            setConfirmReset({
                              channel: "sms",
                              onAnswer: (ok) => {
                                if (ok) {
                                  setDraft((d: any) => ({ ...d, smsOptOutOverride: true }));
                                  el.checked = true;
                                } else {
                                  el.checked = false;
                                }
                                setConfirmReset(null);
                              },
                            });
                          } else {
                            setDraft((d: any) => ({ ...d, smsOptOutOverride: false }));
                          }
                        }}
                      />
                      <span>Reset</span>
                    </label>
                  </div>
                )}
              </SectionCard>
            )}

            {/* Events & Reminders Section */}
            <EventsSection
              partyId={row.partyId}
              partyName={row.displayName}
              birthday={(row as any).birthday}
              api={api}
            />
          </div>
        )}

        {activeTab === "animals" && (
          <div className="space-y-3">
            <SectionCard title={<SectionTitle icon="🐾">Animals</SectionTitle>}>
              {!animals && !animalsErr && <div className="text-sm text-secondary py-4">Loading…</div>}
              {animalsErr && <div className="text-sm text-red-600 py-4">Error: {animalsErr}</div>}
              {animals && animals.length === 0 && <div className="text-sm text-secondary py-4">No animals yet.</div>}
              {animals && animals.length > 0 && (
                <div className="overflow-auto">
                  <table className="min-w-max w-full text-sm">
                    <thead>
                      <tr className="border-b border-hairline">
                        <th className="text-left py-2 pr-3 font-medium">Name</th>
                        <th className="text-left py-2 pr-3 font-medium">Species</th>
                        <th className="text-left py-2 pr-3 font-medium">Sex</th>
                        <th className="text-left py-2 pr-3 font-medium">Status</th>
                        <th className="text-left py-2 pr-3 font-medium">Role</th>
                        <th className="text-left py-2 pr-3 font-medium">% Share</th>
                        <th className="text-right py-2 pl-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {animals.map((a) => (
                        <tr key={String(a.id)} className="border-b border-hairline/60">
                          <td className="py-2 pr-3">{a.name || "—"}</td>
                          <td className="py-2 pr-3">{a.species || "—"}</td>
                          <td className="py-2 pr-3">{a.sex || "—"}</td>
                          <td className="py-2 pr-3">{a.status || "—"}</td>
                          <td className="py-2 pr-3">{a.role || "—"}</td>
                          <td className="py-2 pr-3">{a.sharePct ?? "—"}</td>
                          <td className="py-2 pl-3 text-right">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => (window as any).bhq?.nav?.open?.("animal", a.id)}
                            >
                              Open
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {activeTab === "audit" && (
          <div className="space-y-3">
            <SectionCard title={<SectionTitle icon="📋">Audit Events</SectionTitle>}>
              <div className="text-sm text-secondary">Audit events will appear here once available.</div>
            </SectionCard>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-3">
            <SectionCard title={<SectionTitle icon="📄">Documents</SectionTitle>}>
              <div className="text-sm text-secondary">Coming Soon</div>
            </SectionCard>
          </div>
        )}

        {activeTab === "finances" && (
          <FinanceTab
            invoiceFilters={{ clientPartyId: row.partyId }}
            expenseFilters={{ vendorPartyId: row.partyId }}
            api={api}
            defaultClientParty={{ id: row.partyId, label: row.displayName }}
          />
        )}

        {activeTab === "portal" && (
          <PortalAccessTab
            partyId={row.partyId}
            partyEmail={row.email || null}
            api={api}
          />
        )}

        {activeTab === "notes" && (
          <NotesTab partyId={row.partyId} api={api} />
        )}

        {activeTab === "activity" && (
          <ActivityTab partyId={row.partyId} partyKind={row.kind} api={api} />
        )}

        {activeTab === "messages" && (
          <MessagesTab
            partyId={row.partyId}
            partyEmail={row.email}
            partyName={row.displayName}
            api={api}
            onComposeEmail={() => row.email && setShowEmailComposer(true)}
          />
        )}
      </DetailsScaffold>

      {/* Email Composer Modal */}
      {showEmailComposer && row.email && (
        <EmailComposer
          partyId={row.partyId}
          partyName={row.displayName}
          partyEmail={row.email}
          onClose={() => setShowEmailComposer(false)}
          api={api}
        />
      )}

      {/* Quick DM Composer Modal */}
      {showDMComposer && (
        <QuickDMComposer
          partyId={row.partyId}
          partyName={row.displayName}
          onClose={() => setShowDMComposer(false)}
          api={api}
        />
      )}

      {/* Tag Create Modal */}
      <TagCreateModal
        open={showTagCreateModal}
        onOpenChange={setShowTagCreateModal}
        mode="create"
        fixedModule={row.kind === "CONTACT" ? "CONTACT" : "ORGANIZATION"}
        onSubmit={handleModalTagCreate}
        description={
          row.kind === "CONTACT"
            ? "This tag will be available for organizing contacts."
            : "This tag will be available for organizing organizations."
        }
      />

      {/* Compliance reset confirmation modal */}
      {confirmReset && overlayRoot && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => confirmReset.onAnswer(false)} />
          <div className="relative w-[480px] max-w-[92vw] rounded-xl border border-hairline bg-surface shadow-xl p-4">
            <div className="text-lg font-semibold mb-1">Confirm opt-in reset</div>
            <div className="text-sm text-secondary mb-4">
              This will reset the {confirmReset.channel.toUpperCase()} unsubscribe for this contact, allowing them to
              receive messages again. This action will be logged.
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => confirmReset.onAnswer(false)}>
                Cancel
              </Button>
              <Button onClick={() => confirmReset.onAnswer(true)}>Confirm</Button>
            </div>
          </div>
        </div>,
        overlayRoot
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmOpen && overlayRoot && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirmOpen(false)} />
          <div className="relative w-[480px] max-w-[92vw] rounded-xl border border-hairline bg-surface shadow-xl p-4">
            <div className="text-lg font-semibold mb-1">
              Delete {row.kind === "CONTACT" ? "contact" : "organization"}?
            </div>
            <div className="text-sm text-secondary mb-4">
              This will permanently delete this {row.kind === "CONTACT" ? "contact" : "organization"} and all associated data.
              This action cannot be undone.
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>,
        overlayRoot
      )}

    </>
  );
}

