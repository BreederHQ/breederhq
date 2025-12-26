// apps/contacts/src/CreateOverlays.tsx
// Reusable creation overlays for Person (Contact) and Business (Organization)

import * as React from "react";
import { Overlay } from "@bhq/ui/overlay";
import { Button, Input, Badge, IntlPhoneField } from "@bhq/ui";
import { X } from "lucide-react";
import { makeApi } from "./api";

/* ────────────────────────────────────────────────────────────────────────────
 * Types
 * ────────────────────────────────────────────────────────────────────────── */

type ID = number | string;

type PhoneValue = {
  countryCode: string;
  callingCode: string;
  national: string;
  e164: string | null;
};

type OrgOption = { id: number; name: string };

type ContactRow = {
  id: ID;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  displayName?: string | null;
  organizationId?: ID | null;
  organizationName?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  leadStatus?: string | null;
  tags: string[];
  notes?: string | null;
  street?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  birthday?: string | null;
  lastContacted?: string | null;
  nextFollowUp?: string | null;
  phoneMobileE164?: string | null;
  phoneLandlineE164?: string | null;
  whatsappE164?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  archived?: boolean | null;
};

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

function tinyDebounce<T extends (...args: any[]) => any>(fn: T, ms = 300) {
  let t: any;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function normalizePhone(e164?: string | null) {
  return (e164 || "").replace(/[^\+\d]/g, "");
}

function sameStr(a?: string | null, b?: string | null) {
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}

function computeDisplayName(r: any) {
  const display = String(r.displayName ?? r.display_name ?? "").trim();
  if (display) return display;
  const nick = String(r.nickname ?? "").trim();
  const first = String(r.firstName ?? r.first_name ?? "").trim();
  const last = String(r.lastName ?? r.last_name ?? "").trim();
  const base = nick || first;
  const full = [base, last].filter(Boolean).join(" ").trim();
  return full || r.email || r.phone || `Contact ${r.id}`;
}

function findDuplicates(all: ContactRow[], currentId: ID | null, email?: string | null, mobile?: string | null, whatsapp?: string | null, anyPhone?: string | null) {
  const emailLc = (email || "").trim().toLowerCase();
  const phones = new Set<string>([
    normalizePhone(mobile || ""),
    normalizePhone(whatsapp || ""),
    normalizePhone(anyPhone || ""),
  ].filter(Boolean));

  return all.filter((r) => {
    if (String(r.id) === String(currentId ?? "")) return false;
    const rEmailLc = (r.email || "").trim().toLowerCase();
    if (emailLc && rEmailLc && emailLc === rEmailLc) return true;

    const rPhones = [
      normalizePhone(r.phoneMobileE164 || ""),
      normalizePhone(r.whatsappE164 || ""),
      normalizePhone(r.phone || ""),
    ].filter(Boolean);

    return rPhones.some((p) => phones.has(p));
  });
}

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

/* ────────────────────────────────────────────────────────────────────────────
 * Person (Contact) Creation Overlay
 * ────────────────────────────────────────────────────────────────────────── */

export interface CreatePersonOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (contact: any) => void;
  existingContacts?: ContactRow[];
}

export const CreatePersonOverlay: React.FC<CreatePersonOverlayProps> = ({
  open,
  onOpenChange,
  onCreated,
  existingContacts = [],
}) => {
  const api = React.useMemo(() => makeApi(), []);
  const [working, setWorking] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [nickname, setNickname] = React.useState("");
  const [email, setEmail] = React.useState("");

  // Phones (IntlPhoneField)
  const [cell, setCell] = React.useState<PhoneValue>({ countryCode: "US", callingCode: "+1", national: "", e164: null });
  const [landline, setLandline] = React.useState<PhoneValue>({ countryCode: "US", callingCode: "+1", national: "", e164: null });
  const [whatsapp, setWhatsapp] = React.useState<PhoneValue>({ countryCode: "US", callingCode: "+1", national: "", e164: null });

  // Org
  const [org, setOrg] = React.useState<{ id: number; name: string } | null>(null);

  const [status, setStatus] = React.useState<"Active" | "Inactive" | "Prospect">("Active");
  const [leadStatus, setLeadStatus] = React.useState("");
  const [birthday, setBirthday] = React.useState("");
  const [nextFollowUp, setNextFollowUp] = React.useState("");

  // Address
  const [street, setStreet] = React.useState("");
  const [street2, setStreet2] = React.useState("");
  const [city, setCity] = React.useState("");
  const [stateRegion, setStateRegion] = React.useState("");
  const [postalCode, setPostalCode] = React.useState("");
  const [country, setCountry] = React.useState("United States");

  // Tags/Notes
  const [tagsStr, setTagsStr] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // Duplicate detection
  const createDups = React.useMemo(() => {
    return findDuplicates(
      existingContacts,
      null,
      email || null,
      cell?.e164 || null,
      whatsapp?.e164 || null,
      cell?.e164 || whatsapp?.e164 || null
    );
  }, [existingContacts, email, cell?.e164, whatsapp?.e164]);

  const resetForm = () => {
    setFirstName(""); setLastName(""); setNickname(""); setEmail("");
    setCell({ countryCode: "US", callingCode: "+1", national: "", e164: null });
    setLandline({ countryCode: "US", callingCode: "+1", national: "", e164: null });
    setWhatsapp({ countryCode: "US", callingCode: "+1", national: "", e164: null });
    setOrg(null);
    setStatus("Active"); setLeadStatus(""); setBirthday(""); setNextFollowUp("");
    setStreet(""); setStreet2(""); setCity(""); setStateRegion(""); setPostalCode(""); setCountry("United States");
    setTagsStr(""); setNotes(""); setError(null);
  };

  const canCreate = firstName.trim().length > 0 && lastName.trim().length > 0;

  const CREATE_ERROR_MAP: Record<string, string> = {
    display_name_required: "Display name is generated automatically. Please enter first and last name.",
    organizationId_invalid: "Organization is invalid.",
    organization_not_found: "Organization not found.",
    organization_not_found_or_wrong_tenant: "Organization not found.",
    missing_tenant: "Missing tenant context.",
    conflict: "Email must be unique within this tenant.",
  };

  const formatCreateError = (e: any) => {
    const payload = e?.payload || {};
    if (payload?.fieldErrors && typeof payload.fieldErrors === "object") {
      const messages = Object.values(payload.fieldErrors).filter(Boolean);
      if (messages.length > 0) return String(messages.join(" "));
    }
    const raw = payload?.message || payload?.error || e?.message || "Failed to create contact";
    const msg = typeof raw === "string" ? raw : "Failed to create contact";
    if (CREATE_ERROR_MAP[msg]) return CREATE_ERROR_MAP[msg];
    if (/^[a-z0-9_]+$/.test(msg)) return "Unable to create contact. Please check the form.";
    return msg;
  };

  const doCreate = async () => {
    if (!canCreate) { setError("Please enter First and Last name."); return; }
    try {
      setWorking(true);
      setError(null);

      const cellE164 = cell?.e164 || null;
      const landE164 = landline?.e164 || null;
      const waE164 = whatsapp?.e164 || null;

      const payload: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nickname: nickname.trim() || null,
        email: email.trim() || null,
        phone: cellE164 || waE164 || null,
        phoneMobileE164: cellE164,
        phoneLandlineE164: landE164,
        whatsappE164: waE164,
        status,
        leadStatus: leadStatus.trim() || null,
        birthday: birthday || null,
        nextFollowUp: nextFollowUp || null,
        organizationId: org?.id ?? null,
        street, street2, city, state: stateRegion, postalCode, country,
        tags: tagsStr.split(",").map((s) => s.trim()).filter(Boolean),
        notes: notes || null,
      };

      const created = await (api.contacts as any).create?.(payload);
      onCreated(created);
      resetForm();
      onOpenChange(false);
    } catch (e: any) {
      setError(formatCreateError(e));
      console.error("[CreatePersonOverlay] Create failed:", e);
    } finally {
      setWorking(false);
    }
  };

  return (
    <Overlay
      open={open}
      onOpenChange={(v) => { if (!working) onOpenChange(v); }}
      ariaLabel="Create Contact"
      disableEscClose={working}
      disableOutsideClose={working}
      size="xl"
    >
      <div data-bhq-overlay-slot="header">
        <div className="w-full max-w-[900px] mx-auto flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">Create Contact</div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div data-bhq-overlay-slot="body">
        <div className="w-full max-w-[900px] mx-auto">
          {createDups.length > 0 && (
            <div className="mb-3 rounded-md border border-[color:var(--brand-orange)]/40 bg-[color:var(--brand-orange)]/10 p-2">
              <div className="text-sm font-medium">Possible duplicates found</div>
              <div className="text-xs text-secondary">
                Another contact shares the same email or phone.
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                {createDups.slice(0, 3).map((d) => (
                  <Badge key={String(d.id)}>{computeDisplayName(d)}</Badge>
                ))}
                {createDups.length > 3 && <span className="text-xs text-secondary">+{createDups.length - 3} more</span>}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Names */}
            <div>
              <div className="text-xs text-secondary mb-1">
                First name <span className="text-[hsl(var(--brand-orange))]">*</span>
              </div>
              <Input value={firstName} onChange={(e) => setFirstName((e.currentTarget as HTMLInputElement).value)} />
            </div>
            <div>
              <div className="text-xs text-secondary mb-1">
                Last name <span className="text-[hsl(var(--brand-orange))]">*</span>
              </div>
              <Input value={lastName} onChange={(e) => setLastName((e.currentTarget as HTMLInputElement).value)} />
            </div>

            {/* Nickname */}
            <div className="sm:col-span-2">
              <div className="text-xs text-secondary mb-1">Preferred / Nickname</div>
              <Input value={nickname} onChange={(e) => setNickname((e.currentTarget as HTMLInputElement).value)} />
            </div>

            {/* Organization */}
            <div className="sm:col-span-2">
              <div className="text-xs text-secondary mb-1">Organizational Association</div>
              <OrganizationSelect value={org} onChange={setOrg} />
            </div>

            {/* Email */}
            <div className="sm:col-span-2">
              <div className="text-xs text-secondary mb-1">Email</div>
              <Input type="email" value={email} onChange={(e) => setEmail((e.currentTarget as HTMLInputElement).value)} />
            </div>

            {/* Phones */}
            <div className="sm:col-span-2">
              <div className="text-xs text-secondary mb-1">Cell Phone</div>
              {/* @ts-ignore */}
              <IntlPhoneField value={cell} onChange={setCell} />
            </div>

            <div className="sm:col-span-2">
              <div className="text-xs text-secondary mb-1">Landline</div>
              {/* @ts-ignore */}
              <IntlPhoneField value={landline} onChange={setLandline} />
            </div>

            <div className="sm:col-span-2">
              <div className="text-xs text-secondary mb-1">WhatsApp</div>
              {/* @ts-ignore */}
              <IntlPhoneField value={whatsapp} onChange={setWhatsapp} />
              <div className="text-xs text-secondary mt-1">
                If Cell Phone is left empty, this will be used as the phone on save.
              </div>
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <div className="text-xs text-secondary mb-1">Street</div>
              <Input value={street} onChange={(e) => setStreet((e.currentTarget as HTMLInputElement).value)} />
            </div>
            <div className="sm:col-span-2">
              <div className="text-xs text-secondary mb-1">Street 2</div>
              <Input value={street2} onChange={(e) => setStreet2((e.currentTarget as HTMLInputElement).value)} />
            </div>

            <div>
              <div className="text-xs text-secondary mb-1">City</div>
              <Input value={city} onChange={(e) => setCity((e.currentTarget as HTMLInputElement).value)} />
            </div>
            <div>
              <div className="text-xs text-secondary mb-1">State / Region</div>
              <Input value={stateRegion} onChange={(e) => setStateRegion((e.currentTarget as HTMLInputElement).value)} />
            </div>

            <div className="sm:col-span-2">
              <div className="text-xs text-secondary mb-1">Zip / Postal code</div>
              <Input value={postalCode} onChange={(e) => setPostalCode((e.currentTarget as HTMLInputElement).value)} />
            </div>

            <div className="sm:col-span-2">
              <div className="text-xs text-secondary mb-1">Country</div>
              <select
                className="w-full h-9 rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                value={country}
                onChange={(e) => setCountry((e.target as HTMLSelectElement).value)}
              >
                {COUNTRIES.filter((c) => c !== "— Select country").map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <div className="text-xs text-secondary mb-1">Notes</div>
              <textarea
                className="h-24 w-full rounded-md bg-surface border border-hairline px-3 text-sm text-primary placeholder:text-secondary outline-none"
                value={notes}
                onChange={(e) => setNotes((e.currentTarget as HTMLTextAreaElement).value)}
                placeholder="Context, preferences, etc."
              />
            </div>

            {error && <div className="sm:col-span-2 text-sm text-red-600">{error}</div>}
          </div>
        </div>
      </div>

      <div data-bhq-overlay-slot="footer">
        <div className="w-full max-w-[900px] mx-auto flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => { resetForm(); onOpenChange(false); }}
            disabled={working}
          >
            Cancel
          </Button>
          <Button onClick={doCreate} disabled={!canCreate || working}>
            {working ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Overlay>
  );
};

/* ────────────────────────────────────────────────────────────────────────────
 * Business (Organization) Creation Overlay
 * ────────────────────────────────────────────────────────────────────────── */

export interface CreateBusinessOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (organization: any) => void;
}

const isEmail = (s: string) => /\S+@\S+\.\S+/.test(s);

export const CreateBusinessOverlay: React.FC<CreateBusinessOverlayProps> = ({
  open,
  onOpenChange,
  onCreated,
}) => {
  const api = React.useMemo(() => makeApi(), []);
  const [working, setWorking] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [website, setWebsite] = React.useState("");

  // Phones (IntlPhoneField) - same as Person form
  const [cell, setCell] = React.useState<PhoneValue>({ countryCode: "US", callingCode: "+1", national: "", e164: null });
  const [landline, setLandline] = React.useState<PhoneValue>({ countryCode: "US", callingCode: "+1", national: "", e164: null });
  const [whatsapp, setWhatsapp] = React.useState<PhoneValue>({ countryCode: "US", callingCode: "+1", national: "", e164: null });

  const resetForm = () => {
    setName("");
    setEmail("");
    setWebsite("");
    setCell({ countryCode: "US", callingCode: "+1", national: "", e164: null });
    setLandline({ countryCode: "US", callingCode: "+1", national: "", e164: null });
    setWhatsapp({ countryCode: "US", callingCode: "+1", national: "", e164: null });
    setError(null);
  };

  const canCreate = name.trim().length > 0 && (email.trim() === "" || isEmail(email.trim()));

  const doCreate = async () => {
    if (!canCreate) {
      setError("Please enter a name and a valid email (or leave email blank).");
      return;
    }
    try {
      setWorking(true);
      setError(null);

      const cellE164 = cell?.e164 || null;
      const landE164 = landline?.e164 || null;
      const waE164 = whatsapp?.e164 || null;

      const created = await (api.organizations as any).create?.({
        name: name.trim(),
        email: email.trim() || null,
        phone: cellE164 || waE164 || null,
        phoneMobileE164: cellE164,
        phoneLandlineE164: landE164,
        whatsappE164: waE164,
        website: website.trim() || null,
        status: "Active",
      });

      onCreated(created);
      resetForm();
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.payload?.error || e?.message || "Failed to create organization");
    } finally {
      setWorking(false);
    }
  };

  return (
    <Overlay
      open={open}
      onOpenChange={(v) => { if (!working) onOpenChange(v); }}
      ariaLabel="Create Organization"
      disableEscClose={working}
      disableOutsideClose={working}
      size="md"
    >
      <div data-bhq-overlay-slot="header">
        <div className="w-full max-w-[560px] mx-auto flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">New organization</div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div data-bhq-overlay-slot="body">
        <div className="w-full max-w-[560px] mx-auto">
          <div className="text-sm text-secondary mb-4">
            Create an organization record. Only the name is required.
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-secondary mb-1">
                Organization name <span className="text-[hsl(var(--brand-orange))]">*</span>
              </div>
              <Input
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                placeholder="Acme Ranch LLC"
              />
            </div>

            <div>
              <div className="text-xs text-secondary mb-1">Email</div>
              <Input
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                placeholder="info@acme-ranch.test"
              />
            </div>

            {/* Phones - matching Person form */}
            <div>
              <div className="text-xs text-secondary mb-1">Cell Phone</div>
              {/* @ts-ignore */}
              <IntlPhoneField value={cell} onChange={setCell} />
            </div>

            <div>
              <div className="text-xs text-secondary mb-1">Landline</div>
              {/* @ts-ignore */}
              <IntlPhoneField value={landline} onChange={setLandline} />
            </div>

            <div>
              <div className="text-xs text-secondary mb-1">WhatsApp</div>
              {/* @ts-ignore */}
              <IntlPhoneField value={whatsapp} onChange={setWhatsapp} />
              <div className="text-xs text-secondary mt-1">
                If Cell Phone is left empty, this will be used as the phone on save.
              </div>
            </div>

            <div>
              <div className="text-xs text-secondary mb-1">Website</div>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.currentTarget.value)}
                placeholder="https://acme.example"
              />
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>
        </div>
      </div>

      <div data-bhq-overlay-slot="footer">
        <div className="w-full max-w-[560px] mx-auto flex items-center justify-between">
          <div className="text-xs text-secondary">
            <span className="text-[hsl(var(--brand-orange))]">*</span> Required
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }} disabled={working}>
              Cancel
            </Button>
            <Button onClick={doCreate} disabled={!canCreate || working}>
              {working ? "Creating..." : "Create organization"}
            </Button>
          </div>
        </div>
      </div>
    </Overlay>
  );
};
