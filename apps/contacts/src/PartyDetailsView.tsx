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
} from "@bhq/ui";
import { Copy } from "lucide-react";
import { getOverlayRoot } from "@bhq/ui/overlay";
import { makeApi } from "./api";

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

function formatNextFollowUpLabel(iso?: string | null) {
  if (!iso) return null;
  const dt = new Date(iso);
  if (!Number.isFinite(dt.getTime())) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const diffDays = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 1 && diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays > -7) return `${Math.abs(diffDays)} days ago`;

  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/* ─────────────── NextFollowUpChip ─────────────── */

const NextFollowUpChip: React.FC<{
  value?: string | null;
  onChange: (iso: string | null) => void;
}> = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const [anchorRect, setAnchorRect] = React.useState<DOMRect | null>(null);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);

  const label = formatNextFollowUpLabel(value) || "Set follow-up";

  const recompute = React.useCallback(() => {
    if (!btnRef.current) return;
    setAnchorRect(btnRef.current.getBoundingClientRect());
  }, []);

  React.useEffect(() => {
    if (!open) return;
    recompute();
    const onScroll = () => recompute();
    const onResize = () => recompute();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, recompute]);

  const overlayRoot = getOverlayRoot();

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={btnRef}
        type="button"
        className="text-xs px-2 py-1 rounded border border-hairline hover:bg-white/5 whitespace-nowrap"
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      {open && overlayRoot && anchorRect && createPortal(
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 999 }}
            onClick={() => setOpen(false)}
          />
          <div
            className="rounded-md border border-hairline bg-surface shadow-lg p-2"
            style={{
              position: "fixed",
              top: anchorRect.bottom + 4,
              left: anchorRect.left,
              zIndex: 1000,
              minWidth: 200,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1">
              <button
                type="button"
                className="text-left px-2 py-1 text-sm hover:bg-white/5 rounded"
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  onChange(tomorrow.toISOString());
                  setOpen(false);
                }}
              >
                Tomorrow
              </button>
              <button
                type="button"
                className="text-left px-2 py-1 text-sm hover:bg-white/5 rounded"
                onClick={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  onChange(nextWeek.toISOString());
                  setOpen(false);
                }}
              >
                Next week
              </button>
              <button
                type="button"
                className="text-left px-2 py-1 text-sm hover:bg-white/5 rounded"
                onClick={() => {
                  const nextMonth = new Date();
                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                  onChange(nextMonth.toISOString());
                  setOpen(false);
                }}
              >
                Next month
              </button>
              {value && (
                <button
                  type="button"
                  className="text-left px-2 py-1 text-sm text-red-400 hover:bg-white/5 rounded border-t border-hairline mt-1 pt-2"
                  onClick={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </>,
        overlayRoot
      )}
    </div>
  );
};

export function PartyDetailsView({
  row,
  mode,
  setMode,
  setDraft,
  activeTab,
  setActiveTab,
  requestSave,
}: {
  row: PartyTableRow;
  mode: "view" | "edit";
  setMode: (m: "view" | "edit") => void;
  setDraft: (updater: (prev: any) => any) => void;
  activeTab: string;
  setActiveTab: (k: string) => void;
  requestSave: () => Promise<void>;
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
  const [prefs, setPrefs] = React.useState(() => ({
    email: !!(row as any).prefersEmail,
    sms: !!(row as any).prefersSms,
    phone: !!(row as any).prefersPhone,
    mail: !!(row as any).prefersMail,
    whatsapp: !!(row as any).prefersWhatsapp,
  }));

  React.useEffect(() => {
    setPrefs({
      email: !!(row as any).prefersEmail,
      sms: !!(row as any).prefersSms,
      phone: !!(row as any).prefersPhone,
      mail: !!(row as any).prefersMail,
      whatsapp: !!(row as any).prefersWhatsapp,
    });
  }, [row]);

  const togglePref = React.useCallback(
    (key: keyof typeof prefs) => {
      if (mode === "view") return;
      setPrefs((prev) => {
        const next = !prev[key];
        const camel = `prefers${key[0].toUpperCase()}${key.slice(1)}`;
        setDraft((d: any) => ({ ...d, [camel]: next }));
        return { ...prev, [key]: next };
      });
    },
    [mode, setDraft]
  );

  // Animals loading for Contacts
  const [animals, setAnimals] = React.useState<AnimalRow[] | null>(null);
  const [animalsErr, setAnimalsErr] = React.useState<string | null>(null);

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

  // Compliance confirmation modal
  const [confirmReset, setConfirmReset] = React.useState<
    null | { channel: "email" | "sms"; onAnswer: (ok: boolean) => void }
  >(null);

  const overlayRoot = typeof document !== "undefined" ? document.getElementById("bhq-overlay-root") : null;

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

  const headerRight = row.kind === "CONTACT" || mode === "edit" ? (
    <div className="flex items-center gap-2">
      {row.kind === "CONTACT" && (
        <NextFollowUpChip
          value={row.nextFollowUp}
          onChange={async (iso) => {
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
          }}
        />
      )}
      {mode === "edit" && row.archived && (
        <Button size="sm" variant="outline" onClick={handleUnarchive} disabled={archiving}>
          {archiving ? "Unarchiving…" : "Unarchive"}
        </Button>
      )}
      {mode === "edit" && !row.archived && (
        <Button size="sm" variant="outline" onClick={handleArchive} disabled={archiving}>
          {archiving ? "Archiving…" : "Archive"}
        </Button>
      )}
    </div>
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
    />
  );

  return (
    <>
      <DetailsScaffold
        title={row.kind === "ORGANIZATION" ? (row.name || row.displayName) : row.displayName}
        subtitle={
          row.kind === "CONTACT"
            ? row.organizationName || row.email || ""
            : row.email || row.phone || row.website || ""
        }
        mode={mode}
        onEdit={() => setMode("edit")}
        onCancel={() => setMode("view")}
        onSave={requestSave}
        tabs={[
          { key: "overview", label: "Overview" },
          { key: "animals", label: "Animals" },
          { key: "audit", label: "Audit" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        rightActions={headerRight}
      >
        {activeTab === "overview" && (
          <div className="space-y-3">
            {/* Identity section - for Contacts only */}
            {row.kind === "CONTACT" && (
              <SectionCard title="Identity">
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
                    <div className="text-xs text-secondary mb-1">Organization</div>
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
              <SectionCard title="Organization">
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
                      />
                    )}
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Address */}
            <SectionCard title="Address">
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

            {/* Communication Preferences - for Contacts only */}
            {row.kind === "CONTACT" && (
              <SectionCard title="Communication Preferences">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <PillToggle
                    on={!!prefs.email}
                    label="Email"
                    onClick={() => togglePref("email")}
                    className={mode === "view" ? "opacity-50 pointer-events-none" : ""}
                  />
                  <PillToggle
                    on={!!prefs.sms}
                    label="SMS"
                    onClick={() => togglePref("sms")}
                    className={mode === "view" ? "opacity-50 pointer-events-none" : ""}
                  />
                  <PillToggle
                    on={!!prefs.phone}
                    label="Phone"
                    onClick={() => togglePref("phone")}
                    className={mode === "view" ? "opacity-50 pointer-events-none" : ""}
                  />
                  <PillToggle
                    on={!!prefs.mail}
                    label="Mail"
                    onClick={() => togglePref("mail")}
                    className={mode === "view" ? "opacity-50 pointer-events-none" : ""}
                  />
                  <PillToggle
                    on={!!prefs.whatsapp}
                    label="WhatsApp"
                    onClick={() => togglePref("whatsapp")}
                    className={mode === "view" ? "opacity-50 pointer-events-none" : ""}
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

            {/* Compliance - for Contacts only */}
            {row.kind === "CONTACT" && (
              <SectionCard title="Compliance">
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

            {/* Communication Preferences - for Organizations only */}
            {row.kind === "ORGANIZATION" && (
              <SectionCard title="Communication Preferences">
                <div className="flex items-center gap-3">
                  <div className="text-xs text-secondary min-w-[80px]">Website</div>
                  {mode === "view" ? (
                    <div className="text-sm">{row.website || "-"}</div>
                  ) : (
                    <div className="flex-1">
                      {editText("website")}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs text-secondary min-w-[80px]">Email</div>
                  {mode === "view" ? (
                    <div className="text-sm flex items-center gap-2">
                      <span>{row.email || "-"}</span>
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
                      />
                    </div>
                  )}
                </div>

                {/* Phones */}
                <div className="flex items-center gap-3">
                  <div className="text-xs text-secondary min-w-[80px]">Cell Phone</div>
                  {mode === "view" ? (
                    <div className="text-sm">
                      {formatE164Phone((row as any).phoneMobileE164 || row.phone) || "-"}
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
                    <div className="text-sm">{formatE164Phone((row as any).phoneLandlineE164) || "-"}</div>
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
                    <div className="text-sm">{formatE164Phone((row as any).whatsappE164) || "-"}</div>
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
          </div>
        )}

        {activeTab === "animals" && (
          <div className="space-y-3">
            <SectionCard title="Animals">
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
            <SectionCard title="Audit Events">
              <div className="text-sm text-secondary">Audit events will appear here once available.</div>
            </SectionCard>
          </div>
        )}
      </DetailsScaffold>

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
    </>
  );
}
