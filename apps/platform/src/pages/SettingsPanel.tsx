// apps/platform/src/pages/SettingsPanel.tsx
import React from "react";
import { Button, Card, SectionCard, BreedCombo, CustomBreedDialog } from "@bhq/ui";
import type { BreedHit } from "@bhq/ui";
import { createPortal } from "react-dom";
import { getOverlayRoot } from "@bhq/ui/overlay";
import { useUiScale } from "@bhq/ui/settings/UiScaleProvider";

import type { AvailabilityPrefs } from "@bhq/ui/utils/availability";
import { DEFAULT_AVAILABILITY_PREFS } from "@bhq/ui/utils/availability";
import { resolveTenantId } from "@bhq/ui/utils/tenant";
import type { BreedingProgramProfile } from "@bhq/ui/utils/breedingProgram";
import BiologySettingsTab from "../components/BiologySettingsTab";
import DateValidationSettingsTab from "../components/DateValidationSettingsTab";
import { TagsManagerTab } from "../components/TagsManagerTab";
import MarketplaceSettingsTab, { type MarketplaceHandle } from "../components/MarketplaceSettingsTab";
import { api } from "../api";

/** ───────── Tenant helpers ───────── */
let TENANT_ID_CACHE: string | null = null;
function cleanTenantId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // take the first entry, trim spaces, keep only [A-Za-z0-9-_] to be safe
  const first = String(raw).split(",")[0].trim();
  const safe = first.replace(/[^A-Za-z0-9_-]/g, "");
  return safe || null;
}
function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}
function readMeta(name: string): string | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  return el?.content?.trim() || null;
}

// --- Exact date rows meta (ids + keys) used for locks, resets, shifts/scales, and preview
const EXACT_ROWS = [
  { id: "cycle", title: "Cycle Start", keys: { rf: "date_cycle_risky_from", rt: "date_cycle_risky_to", uf: "date_cycle_unlikely_from", ut: "date_cycle_unlikely_to" } },
  { id: "testing", title: "Testing Start", keys: { rf: "date_testing_risky_from", rt: "date_testing_risky_to", uf: "date_testing_unlikely_from", ut: "date_testing_unlikely_to" } },
  { id: "breed", title: "Breeding Date", keys: { rf: "date_breeding_risky_from", rt: "date_breeding_risky_to", uf: "date_breeding_unlikely_from", ut: "date_breeding_unlikely_to" } },
  { id: "birth", title: "Birth Date", keys: { rf: "date_birth_risky_from", rt: "date_birth_risky_to", uf: "date_birth_unlikely_from", ut: "date_birth_unlikely_to" } },
  { id: "weaned", title: "Weaned Date", keys: { rf: "date_weaned_risky_from", rt: "date_weaned_risky_to", uf: "date_weaned_unlikely_from", ut: "date_weaned_unlikely_to" } },
  { id: "placement_start", title: "Placement Start", keys: { rf: "date_placement_start_risky_from", rt: "date_placement_start_risky_to", uf: "date_placement_start_unlikely_from", ut: "date_placement_start_unlikely_to" } },
  { id: "placed", title: "Placement Completed", keys: { rf: "date_placement_completed_risky_from", rt: "date_placement_completed_risky_to", uf: "date_placement_completed_unlikely_from", ut: "date_placement_completed_unlikely_to" } },
] as const;

/** ENSURE: Unlikely is visibly wider than Risky when Risky ≠ 0; Placement has no BEFORE band */
function normalizeExactBands(draft: AvailabilityPrefs, enforcePlusOne: boolean = true) {
  EXACT_ROWS.forEach((row) => {
    const k = row.keys as any;

    // BEFORE side
    if (enforcePlusOne) {
      const rf = Number(draft[k.rf] ?? 0); // risky before (days)
      const uf = Number(draft[k.uf] ?? 0); // unlikely before (days)
      // Only enforce widening when Risky is present; otherwise preserve Unlikely
      if (rf > 0 && uf <= rf) draft[k.uf] = rf + 1;
    }

    // AFTER (positive): only widen if Risky side is non-zero
    if (enforcePlusOne) {
      const rt = Number(draft[k.rt] ?? 0); // risky after
      const ut = Number(draft[k.ut] ?? 0); // unlikely after
      if (rt > 0 && ut <= rt) draft[k.ut] = rt + 1;
    }
  });
  return draft;
}

/** ENSURE (Phases): Unlikely is strictly wider than Risky when Risky ≠ 0 */
function normalizePhaseBands(draft: AvailabilityPrefs, enforcePlusOne = true) {
  if (!enforcePlusOne) return draft;

  const QUADS = [
    {
      ub: "cycle_breeding_unlikely_from_likely_start",
      ua: "cycle_breeding_unlikely_to_likely_end",
      rb: "cycle_breeding_risky_from_full_start",
      ra: "cycle_breeding_risky_to_full_end",
    },
    {
      ub: "post_unlikely_from_likely_start",
      ua: "post_unlikely_to_likely_end",
      rb: "post_risky_from_full_start",
      ra: "post_risky_to_full_end",
    },
  ] as const;

  QUADS.forEach((q) => {
    // BEFORE (negative numbers): compare by magnitude, always write negative
    const rbAbs = Math.abs(Number((draft as any)[q.rb] ?? 0));
    const ubAbs = Math.abs(Number((draft as any)[q.ub] ?? 0));
    const needBefore = rbAbs === 0 ? 0 : Math.max(ubAbs, rbAbs + 1);
    (draft as any)[q.ub] = needBefore ? -needBefore : 0;

    // AFTER (positive numbers): current logic is fine
    const ra = Number((draft as any)[q.ra] ?? 0);
    const ua = Number((draft as any)[q.ua] ?? 0);
    if (ra === 0) (draft as any)[q.ua] = 0;
    else if (ua <= ra) (draft as any)[q.ua] = ra + 1;
  });

  return draft;
}

function readCsrfToken(): string | null {
  // meta tags first
  const meta =
    readMeta("csrf-token") ||
    readMeta("x-csrf-token") ||
    readMeta("csrf") ||
    null;
  if (meta?.trim()) return meta.trim();

  // cookies (now includes your cookie name)
  const cookie =
    readCookie("csrfToken") ||
    readCookie("X-CSRF-Token") ||
    readCookie("x-csrf-token") ||
    readCookie("XSRF-TOKEN") ||
    readCookie("xsrf-token") ||
    readCookie("csrftoken") ||
    null;

  return cookie?.trim() || null;
}

async function resolveTenantIdSafe(): Promise<string | null> {
  if (TENANT_ID_CACHE) return TENANT_ID_CACHE;
  try {
    const raw = await resolveTenantId();
    const trimmed = (raw == null ? "" : String(raw)).trim();
    const cleaned = cleanTenantId(trimmed);
    if (cleaned) return (TENANT_ID_CACHE = cleaned);
  } catch { }

  const g = (globalThis as any) || {};
  const hinted = cleanTenantId(
    g.BHQ_TENANT_ID ??
    g.__BHQ_TENANT_ID ??
    g.window?.__TENANT_ID ??
    null
  );
  if (hinted) return (TENANT_ID_CACHE = hinted);

  try {
    const ls =
      localStorage.getItem("BHQ_TENANT_ID") ||
      localStorage.getItem("X_TENANT_ID") ||
      localStorage.getItem("x-tenant-id") || "";
    const s = cleanTenantId(ls);
    if (s) return (TENANT_ID_CACHE = s);
  } catch { }

  const cookieTenant = cleanTenantId(readCookie("X-Tenant-Id") || readCookie("x-tenant-id"));
  if (cookieTenant) return (TENANT_ID_CACHE = cookieTenant);

  const metaTenant = cleanTenantId(readMeta("x-tenant-id") || readMeta("X-Tenant-Id"));
  if (metaTenant) return (TENANT_ID_CACHE = metaTenant);

  try {
    const res = await fetch("/api/v1/session", { credentials: "include", cache: "no-store", headers: { Accept: "application/json" } });
    if (res.ok) {
      const j = await res.json().catch(() => ({}));
      const t =
        j?.tenant?.id ?? j?.org?.id ?? j?.organization?.id ??
        j?.user?.tenantId ?? j?.user?.orgId ?? j?.user?.organizationId ?? null;
      const s = cleanTenantId(t);
      if (s) return (TENANT_ID_CACHE = s);
    }
  } catch { }
  return null;
}

const TENANT_HEADER = "x-tenant-id";
const ORG_HEADER = "x-org-id";
async function tenantHeaders(): Promise<Record<string, string>> {
  const id = await resolveTenantIdSafe();
  if (!id) return {};
  return { [TENANT_HEADER]: id, [ORG_HEADER]: id };
}
async function fetchJson(url: string, init: RequestInit = {}) {
  const method = (init.method || "GET").toUpperCase();
  const hasBody = init.body != null && !(method === "GET" || method === "HEAD");

  let csrf = readCsrfToken();

  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(await tenantHeaders()),
      ...(csrf ? { "x-csrf-token": csrf, "x-xsrf-token": csrf, "X-XSRF-TOKEN": csrf } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  });

  // SAFE JSON PARSE
  const ct = res.headers.get("content-type") || "";
  const rawText = await res.text().catch(() => "");
  let body: any = {};
  try { body = ct.includes("application/json") && rawText ? JSON.parse(rawText) : {}; } catch { body = {}; }

  // Happy path
  if (res.ok) return body;

  // 403 → try to acquire CSRF once, then retry original call
  if (res.status === 403) {
    if (!csrf) {
      const candidates = ["/csrf", "/csrf-token", "/auth/csrf"];
      for (const path of candidates) {
        try {
          const probe = await fetch(path, { credentials: "include" });
          if (probe.ok) {
            csrf = readCsrfToken();
            if (csrf) {
              const retry = await fetch(url, {
                credentials: "include",
                ...init,
                headers: {
                  Accept: "application/json",
                  "X-Requested-With": "XMLHttpRequest",
                  ...(hasBody ? { "Content-Type": "application/json" } : {}),
                  ...(await tenantHeaders()),
                  "x-csrf-token": csrf,
                  "x-xsrf-token": csrf,
                  "X-XSRF-TOKEN": csrf,
                  ...(init.headers as Record<string, string> | undefined),
                },
              });
              const retryText = await retry.text().catch(() => "");
              let retryBody: any = {};
              try { retryBody = retryText ? JSON.parse(retryText) : {}; } catch { retryBody = {}; }
              if (retry.ok) return retryBody;

              const retryMsg =
                (retryBody && (retryBody.message || retryBody.error)) ||
                `HTTP ${retry.status}`;
              throw new Error(retry.status === 403
                ? (retryBody?.message || "Forbidden. You may lack permission to update Availability, or a CSRF token is missing/invalid.")
                : retryMsg);
            }
          }
        } catch { /* keep trying */ }
      }
    }

    // Some servers echo a token back in headers (rare but harmless to support)
    const hdrToken =
      res.headers.get("x-csrf-token") ||
      res.headers.get("x-xsrf-token") ||
      res.headers.get("X-XSRF-TOKEN");
    if (hdrToken) {
      const retry = await fetch(url, {
        credentials: "include",
        ...init,
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          ...(hasBody ? { "Content-Type": "application/json" } : {}),
          ...(await tenantHeaders()),
          "x-csrf-token": hdrToken,
          "x-xsrf-token": hdrToken,
          "X-XSRF-TOKEN": hdrToken,
          ...(init.headers as Record<string, string> | undefined),
        },
      });
      const retryText = await retry.text().catch(() => "");
      let retryBody: any = {};
      try { retryBody = retryText ? JSON.parse(retryText) : {}; } catch { retryBody = {}; }
      if (retry.ok) return retryBody;

      const retryMsg =
        (retryBody && (retryBody.message || retryBody.error)) ||
        `HTTP ${retry.status}`;
      throw new Error(retry.status === 403
        ? (retryBody?.message || "Forbidden. You may lack permission to update Availability, or a CSRF token is missing/invalid.")
        : retryMsg);
    }
  }

  const msg =
    (body && (body.message || body.error)) ||
    (res.status === 403
      ? "Forbidden. You may lack permission to update Availability, or a CSRF token is missing/invalid."
      : `HTTP ${res.status}`);
  throw new Error(msg);
}

/** ───────── Accessibility tab (unchanged) ───────── */
function AccessibilityTab() {
  const { scale, setScale } = useUiScale();
  const percent = Math.round(Number.isFinite(scale) ? (scale as number) * 100 : 100);
  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-4">
        <h4 className="font-medium">Interface scale</h4>
        <p className="text-sm text-secondary">Adjust text and spacing across all modules. Persists in your browser.</p>
        <div className="flex items-center gap-4">
          <div className="text-sm w-24">Scale: <span className="font-medium">{percent}%</span></div>
          <input type="range" min={75} max={200} step={5} value={percent} onChange={(e) => setScale(Number(e.currentTarget.value) / 100)} className="flex-1" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setScale(0.9)}>90%</Button>
          <Button size="sm" variant="outline" onClick={() => setScale(1.0)}>100%</Button>
          <Button size="sm" variant="outline" onClick={() => setScale(1.1)}>110%</Button>
          <Button size="sm" variant="outline" onClick={() => setScale(1.25)}>125%</Button>
          <Button size="sm" variant="outline" onClick={() => setScale(1.5)}>150%</Button>
        </div>
      </Card>
    </div>
  );
}

/** ───────── Intl phone bits (unchanged) ───────── */
type CountryDef = { code: string; name: string; dial: string };
const FALLBACK_COUNTRIES: CountryDef[] = [
  { code: "US", name: "United States", dial: "+1" },
  { code: "CA", name: "Canada", dial: "+1" },
  { code: "GB", name: "United Kingdom", dial: "+44" },
  { code: "AU", name: "Australia", dial: "+61" },
  { code: "NZ", name: "New Zealand", dial: "+64" },
  { code: "MX", name: "Mexico", dial: "+52" },
  { code: "BR", name: "Brazil", dial: "+55" },
  { code: "DE", name: "Germany", dial: "+49" },
  { code: "FR", name: "France", dial: "+33" },
  { code: "ES", name: "Spain", dial: "+34" },
];
function normalizeCountryCode(v: string | null | undefined): string { return (v || "").trim().toUpperCase(); }
export function useCountries(): CountryDef[] {
  const [list, setList] = React.useState<CountryDef[]>(() => {
    const injected = (globalThis as any)?.BHQ_COUNTRIES as CountryDef[] | undefined;
    return Array.isArray(injected) && injected.length ? injected : FALLBACK_COUNTRIES;
  });
  React.useEffect(() => {
    const injected = (globalThis as any)?.BHQ_COUNTRIES as CountryDef[] | undefined;
    if (Array.isArray(injected) && injected.length) setList(injected);
  }, []);
  return list;
}
function asCountryCode(country: string, countries: CountryDef[]): string {
  const code = normalizeCountryCode(country);
  if (!code) return "";
  return countries.some((c) => c.code === code) ? code : "";
}
function countryNameFromValue(country: string, countries: CountryDef[]): string {
  const code = normalizeCountryCode(country);
  const found = countries.find((c) => c.code === code);
  return found ? found.name : "";
}
function dialForCode(code: string, countries: CountryDef[]): string {
  const found = countries.find((c) => c.code === normalizeCountryCode(code));
  return found?.dial || "";
}
export function IntlPhoneField(props: {
  value: string; onChange: (next: string) => void; inferredCountryName?: string; countries: CountryDef[]; className?: string;
}) {
  const { value, onChange, inferredCountryName, countries, className } = props;
  const initialCode = React.useMemo(() => {
    const byPrefix = countries.find((c) => value?.startsWith(c.dial + " "));
    if (byPrefix) return byPrefix.code;
    const byName = countries.find((c) => c.name === inferredCountryName);
    return byName?.code || "US";
  }, [value, inferredCountryName, countries]);
  const [code, setCode] = React.useState<string>(initialCode);
  const dial = dialForCode(code, countries);
  const localPart = React.useMemo(() => {
    if (value?.startsWith(dial + " ")) return value.slice((dial + " ").length);
    const maybe = value?.replace(/^\+\d+\s*/, "") ?? "";
    return maybe;
  }, [value, dial]);
  function handleCountryChange(nextCode: string) {
    setCode(nextCode);
    onChange([dialForCode(nextCode, countries), localPart].filter(Boolean).join(" ").trim());
  }
  function formatLocal(input: string): string {
    if (dial === "+1") {
      const digits = input.replace(/\D/g, "").slice(0, 10);
      const a = digits.slice(0, 3), b = digits.slice(3, 6), c = digits.slice(6, 10);
      if (digits.length <= 3) return a;
      if (digits.length <= 6) return `(${a}) ${b}`;
      return `(${a}) ${b}-${c}`;
    }
    return input;
  }
  return (
    <div className={["flex gap-2 items-stretch w-full", className].filter(Boolean).join(" ")}>
      <select
        className={["bhq-input", INPUT_CLS, "w-32 md:w-40", "max-w-[40%]", "truncate"].join(" ")}
        value={code}
        onChange={(e) => handleCountryChange(e.currentTarget.value)}
        title={countryNameFromValue(code, countries)}
      >
        {countries.map((c) => (
          <option key={c.code} value={c.code} title={`${c.name} ${c.dial}`}>{c.code} {c.dial}</option>
        ))}
      </select>
      <div className="flex-1 flex min-w-0">
        <div className="flex items-center px-3 border border-hairline rounded-l-md bg-surface text-sm shrink-0">{dial}</div>
        <input
          className={["bhq-input", INPUT_CLS, "rounded-l-none flex-1 min-w-0"].join(" ")}
          inputMode="tel"
          placeholder={dial === "+1" ? "(555) 111-2222" : "phone number"}
          value={localPart}
          onChange={(e) => onChange([dial, formatLocal(e.target.value)].join(" ").trim())}
        />
      </div>
    </div>
  );
}
function onlyDigits(s: string) { return (s || "").replace(/\D/g, ""); }
function formatLocalForDial(localDigits: string, dial: string) {
  if (dial === "+1") {
    const d = onlyDigits(localDigits).slice(0, 10);
    const a = d.slice(0, 3), b = d.slice(3, 6), c = d.slice(6, 10);
    if (d.length <= 3) return a;
    if (d.length <= 6) return `(${a}) ${b}`;
    return `(${a}) ${b}-${c}`;
  }
  return localDigits;
}
function displayFromE164(e164: string, countries: CountryDef[]) {
  const raw = (e164 || "").trim();
  if (!raw.startsWith("+")) return "";
  const digits = onlyDigits(raw);
  if (!digits) return "";
  const byLenDesc = [...countries].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of byLenDesc) {
    const dialDigits = onlyDigits(c.dial);
    if (digits.startsWith(dialDigits)) {
      const local = digits.slice(dialDigits.length);
      const formattedLocal = formatLocalForDial(local, c.dial);
      return `${c.dial} ${formattedLocal}`.trim();
    }
  }
  return `+${digits}`;
}
function e164FromDisplay(display: string) {
  const s = (display || "").trim();
  const digits = onlyDigits(s);
  if (!digits) return "";
  return "+" + digits;
}

/** ───────── Tab scaffolding ───────── */
const INPUT_CLS =
  "w-full h-10 rounded-md border border-hairline bg-surface px-3 text-sm text-primary placeholder:text-tertiary outline-none " +
  "focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]";
type Tab =
  | "profile"
  | "security"
  | "subscription"
  | "payments"
  | "transactions"
  | "breeding"
  | "programProfile"
  | "breeds"
  | "policies"
  | "credentials"
  | "users"
  | "groups"
  | "tags"
  | "accessibility"
  | "marketplace";

type Props = { open: boolean; dirty: boolean; onDirtyChange: (v: boolean) => void; onClose: () => void; };

type NavSection = { title: string; items: Array<{ key: Tab; label: string }> };
const NAV: NavSection[] = [
  {
    title: "Account Management",
    items: [
      { key: "profile", label: "Your Profile" },
      { key: "security", label: "Security" },
      { key: "subscription", label: "Subscription" },
      { key: "payments", label: "Payment Methods" },
      { key: "transactions", label: "Transactions" },
    ],
  },
  {
    title: "Modules",
    items: [
      { key: "breeding", label: "Breeding" },
      { key: "marketplace", label: "Marketplace" },
    ],
  },
  {
    title: "Breeding Program",
    items: [
      { key: "programProfile", label: "Program Profile" },
      { key: "breeds", label: "Breeds" },
      { key: "policies", label: "Policies" },
      { key: "credentials", label: "Standards and Credentials" },
    ],
  },
  {
    title: "Platform Management",
    items: [
      { key: "users", label: "Users" },
      { key: "groups", label: "Groups" },
      { key: "tags", label: "Tag Manager" },
      { key: "accessibility", label: "Accessibility" },
    ],
  },
];
function getTabLabel(k: Tab): string {
  for (const section of NAV) {
    const found = section.items.find((i) => i.key === k);
    if (found) return found.label;
  }
  return "Settings";
}

/** ───────── SettingsPanel ───────── */
export default function SettingsPanel({ open, dirty, onDirtyChange, onClose }: Props) {
  const [active, setActive] = React.useState<Tab>("profile");
  const [dirtyMap, setDirtyMap] = React.useState<Record<Tab, boolean>>({
    profile: false, security: false, subscription: false, payments: false, transactions: false,
    breeding: false, programProfile: false, breeds: false, policies: false, credentials: false, users: false, groups: false, tags: false, accessibility: false, marketplace: false,
  });
  // Edit mode state at panel level
  const [editMode, setEditMode] = React.useState(false);
  const profileRef = React.useRef<ProfileHandle>(null);
  const breedingRef = React.useRef<BreedingHandle>(null);
  const breedsRef = React.useRef<BreedsHandle>(null);
  const policiesRef = React.useRef<PoliciesHandle>(null);
  const credentialsRef = React.useRef<CredentialsHandle>(null);
  const programRef = React.useRef<ProgramProfileHandle>(null);
  const marketplaceRef = React.useRef<MarketplaceHandle>(null);
  const [profileTitle, setProfileTitle] = React.useState<string>("");

  // Tabs that support edit mode
  const editableTabs: Tab[] = ["profile", "programProfile", "breeds", "policies", "credentials", "marketplace"];
  const isEditableTab = editableTabs.includes(active);

  React.useEffect(() => { onDirtyChange(!!dirtyMap[active]); }, [active, dirtyMap, onDirtyChange]);

  // Reload profile data when switching to profile tab or when panel opens
  React.useEffect(() => {
    if (open && active === "profile") {
      // Use requestAnimationFrame to ensure the ProfileTab component is mounted
      requestAnimationFrame(() => {
        profileRef.current?.reload();
      });
    }
  }, [open, active]);

  if (!open) return null;

  function jumpToProgramProfile() {
    setActive("programProfile");
  }

  function jumpToBreeding(sub: BreedingSubTab) {
    setActive("breeding");
    // ensure the child is mounted, then switch subtab
    requestAnimationFrame(() => breedingRef.current?.goto(sub));
  }

  function markDirty(tab: Tab, isDirty: boolean) {
    setDirtyMap((m) => (m[tab] === isDirty ? m : { ...m, [tab]: isDirty }));
  }
  function trySwitch(next: Tab) {
    // Block switching if in edit mode (user must Save or Cancel first)
    if (editMode) {
      return;
    }
    if (dirtyMap[active]) {
      const el = document.getElementById("bhq-settings-dirty-banner");
      if (el) {
        el.classList.remove("opacity-0"); el.classList.add("opacity-100");
        setTimeout(() => el.classList.add("animate-pulse"), 0);
        setTimeout(() => { el.classList.remove("animate-pulse"); el.classList.add("opacity-0"); }, 1500);
      }
      return;
    }
    setActive(next);
  }
  function handleClose() {
    if (dirty) return;
    onClose();
  }

  // Cancel editing - revert changes and exit edit mode
  async function handleCancel() {
    // For programProfile, use the cancel handler
    if (active === "programProfile") {
      programRef.current?.cancel();
    }
    // For other tabs, reload the data to revert
    else if (active === "profile") {
      await profileRef.current?.reload();
    }
    setEditMode(false);
    markDirty(active, false);
  }

  // Save and exit edit mode
  async function handleSave() {
    if (active === "profile") {
      await profileRef.current?.save(); markDirty("profile", false);
    } else if (active === "breeding") {
      await breedingRef.current?.save(); markDirty("breeding", false);
    } else if (active === "programProfile") {
      await programRef.current?.save(); markDirty("programProfile", false);
    } else if (active === "breeds") {
      await breedsRef.current?.save(); markDirty("breeds", false);
    } else if (active === "policies") {
      await policiesRef.current?.save(); markDirty("policies", false);
    } else if (active === "credentials") {
      await credentialsRef.current?.save(); markDirty("credentials", false);
    } else if (active === "marketplace") {
      await marketplaceRef.current?.save(); markDirty("marketplace", false);
    } else {
      await saveActive(active, markDirty);
      markDirty(active, false);
    }
    setEditMode(false);
  }

  const panel = (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        role="button"
        tabIndex={-1}
        aria-label="Close settings"
      />
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
        <div className="pointer-events-auto w-[min(1200px,100%)] h-[min(90vh,100%)]">
          <div className="flex h-full bg-surface border border-hairline shadow-2xl rounded-xl overflow-hidden">
            {/* left nav */}
            <aside className="w-64 shrink-0 border-r border-hairline bg-card/60 p-3">
              <h2 className="text-sm font-semibold text-secondary mb-2">Settings</h2>
              <nav className="space-y-4">
                {NAV.map((section) => (
                  <div key={section.title}>
                    <div className="px-3 pb-1 text-[11px] uppercase tracking-wide text-tertiary">{section.title}</div>
                    <div className="space-y-1">
                      {section.items.map((t) => (
                        <button
                          key={t.key}
                          onClick={() => trySwitch(t.key)}
                          className={[
                            "w-full text-left px-3 py-2 rounded-md transition",
                            active === t.key ? "bg-surface-strong text-primary" : "hover:bg-surface-strong/60 text-secondary",
                            (editMode || dirtyMap[active]) && active !== t.key ? "cursor-not-allowed opacity-60" : "",
                          ].join(" ")}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </aside>

            {/* right content */}
            <main className="flex-1 min-w-0 flex flex-col">
              <div className={`flex items-center justify-between px-6 py-4 border-b transition-colors ${editMode ? "bg-amber-500/5 border-amber-500/30" : "border-hairline"}`}>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">
                    {active === "profile" && profileTitle ? `Profile - ${profileTitle}` : getTabLabel(active)}
                  </h3>
                  {editMode && (
                    <span className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      Editing
                    </span>
                  )}
                  {editMode && dirtyMap[active] && (
                    <span className="text-xs text-amber-300/70">· Unsaved changes</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Close button - always visible but disabled when dirty */}
                  <Button size="sm" variant="outline" onClick={handleClose} disabled={dirty}>
                    Close
                  </Button>

                  {/* Edit mode controls for editable tabs */}
                  {isEditableTab && !editMode && (
                    <Button size="sm" onClick={() => setEditMode(true)}>
                      Edit
                    </Button>
                  )}

                  {isEditableTab && editMode && (
                    <>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={!dirtyMap[active]}>
                        Save
                      </Button>
                    </>
                  )}

                  {/* Non-editable tabs still get the old Save button */}
                  {!isEditableTab && (
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={!dirtyMap[active]}
                    >
                      Save
                    </Button>
                  )}
                </div>
              </div>

              {/* scrollable body */}
              <div className="flex-1 overflow-auto p-6 space-y-6">
                {active === "profile" && (
                  <ProfileTab ref={profileRef} dirty={dirtyMap.profile} onDirty={(v) => markDirty("profile", v)} onTitle={setProfileTitle} editMode={editMode} />
                )}
                {active === "security" && <SecurityTab dirty={dirtyMap.security} onDirty={(v) => markDirty("security", v)} />}
                {active === "subscription" && <SubscriptionTab dirty={dirtyMap.subscription} onDirty={(v) => markDirty("subscription", v)} />}
                {active === "payments" && <PaymentsTab dirty={dirtyMap.payments} onDirty={(v) => markDirty("payments", v)} />}
                {active === "transactions" && <TransactionsTab dirty={dirtyMap.transactions} onDirty={(v) => markDirty("transactions", v)} />}
                {active === "breeding" && <BreedingTab ref={breedingRef} dirty={dirtyMap.breeding} onDirty={(v) => markDirty("breeding", v)} />}
                {active === "programProfile" && <ProgramProfileTab ref={programRef} dirty={dirtyMap.programProfile} onDirty={(v) => markDirty("programProfile", v)} editMode={editMode} />}
                {active === "breeds" && <BreedsTab ref={breedsRef} dirty={dirtyMap.breeds} onDirty={(v) => markDirty("breeds", v)} />}
                {active === "policies" && <PoliciesTab ref={policiesRef} dirty={dirtyMap.policies} onDirty={(v) => markDirty("policies", v)} />}
                {active === "credentials" && <CredentialsTab ref={credentialsRef} dirty={dirtyMap.credentials} onDirty={(v) => markDirty("credentials", v)} editMode={editMode} />}
                {active === "users" && <UsersTab dirty={dirtyMap.users} onDirty={(v) => markDirty("users", v)} />}
                {active === "groups" && <GroupsTab dirty={dirtyMap.groups} onDirty={(v) => markDirty("groups", v)} />}
                {active === "tags" && <TagsManagerTab dirty={dirtyMap.tags} onDirty={(v) => markDirty("tags", v)} />}
                {active === "accessibility" && <AccessibilityTab />}
                {active === "marketplace" && <MarketplaceSettingsTab ref={marketplaceRef} dirty={dirtyMap.marketplace} onDirty={(v) => markDirty("marketplace", v)} onNavigateToBreeds={() => setActive("breeds")} editMode={editMode} onExitEditMode={() => setEditMode(false)} />}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
  return createPortal(panel, getOverlayRoot());
}
async function saveActive(_tab: Tab, markDirty: (tab: Tab, v: boolean) => void) {
  await new Promise((r) => setTimeout(r, 150));
  // real saves are in tab handles
  markDirty(_tab, false);
}

/** ───────── Profile (unchanged core) ───────── */
function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={["bhq-input", INPUT_CLS, props.className].filter(Boolean).join(" ")} />;
}
type ProfileHandle = { save: () => Promise<void>; reload: () => Promise<void> };
type ProfileForm = {
  firstName: string; lastName: string; nickname: string; userEmail: string;
  phoneE164: string; whatsappE164: string;
  street: string; street2: string; city: string; state: string; postalCode: string; country: string;
};
function mapUserToProfileForm(u: any, countries: CountryDef[]): ProfileForm {
  const email = String(u?.email ?? "");
  const firstName = String(u?.firstName ?? ""); const lastName = String(u?.lastName ?? ""); const nickname = String(u?.nickname ?? "");
  return {
    firstName, lastName, nickname, userEmail: email,
    phoneE164: String(u?.phoneE164 ?? ""), whatsappE164: String(u?.whatsappE164 ?? ""),
    street: String(u?.street ?? ""), street2: String(u?.street2 ?? ""), city: String(u?.city ?? ""), state: String(u?.state ?? ""), postalCode: String(u?.postalCode ?? ""),
    country: asCountryCode(String(u?.country ?? "").toUpperCase(), countries),
  };
}
const ProfileTab = React.forwardRef<ProfileHandle, {
  dirty: boolean; onDirty: (v: boolean) => void; onTitle: (t: string) => void; editMode?: boolean;
}>(function ProfileTabImpl({ onDirty, onTitle, editMode = false }, ref) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>("");
  const countries = useCountries();

  const empty: ProfileForm = { firstName: "", lastName: "", nickname: "", userEmail: "", phoneE164: "", whatsappE164: "", street: "", street2: "", city: "", state: "", postalCode: "", country: "" };
  const [initial, setInitial] = React.useState<ProfileForm>(empty);
  const [form, setForm] = React.useState<ProfileForm>(empty);
  const isDirty = React.useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);
  React.useEffect(() => onDirty(isDirty), [isDirty, onDirty]);

  function deriveDisplayName(f: ProfileForm): string {
    const emailLocal = (f.userEmail || "").split("@")[0] || "";
    const emailGuess = emailLocal.replace(/[._-]+/g, " ").trim();
    return (f.nickname || `${f.firstName} ${f.lastName}`.trim() || emailGuess || "Profile").trim();
  }
  async function getSessionUserId(): Promise<{ id: string; email: string }> {
    const res = await fetch("/api/v1/session", { credentials: "include", cache: "no-store", headers: { Accept: "application/json" } });
    if (res.status === 401) { window.location.assign("/login"); throw new Error("Unauthorized"); }
    if (!res.ok) throw new Error("Failed to load current session");
    const j = await res.json().catch(() => ({}));
    const id = String(j?.user?.id || ""); const email = String(j?.user?.email || "");
    if (!id) throw new Error("Missing user id in session");
    try {
      const t =
        j?.tenant?.id ?? j?.org?.id ?? j?.organization?.id ??
        j?.user?.tenantId ?? j?.user?.orgId ?? j?.user?.organizationId ?? null;
      if (t) (TENANT_ID_CACHE = String(t));
    } catch { }
    return { id, email };
  }
  async function guardEmailChange(currentEmail: string): Promise<boolean> {
    const pw = window.prompt("To change your email, enter your current password:");
    if (!pw) return false;
    const result = await verifyViaLogin(currentEmail, pw);
    if (!result.ok) { throw new Error(result.msg || "Could not verify current password."); }
    return true;
  }
  const loadProfile = React.useCallback(async () => {
    try {
      setLoading(true); setError("");
      const { id } = await getSessionUserId();
      const u = await fetchJson(`/api/v1/users/${encodeURIComponent(id)}`, { method: "GET" });
      const next = mapUserToProfileForm(u, countries);
      setInitial(next); setForm(next); onTitle(deriveDisplayName(next));
    } catch (e: any) {
      setError(e?.message || "Unable to load profile");
    } finally {
      setLoading(false);
    }
  }, [countries, onTitle]);

  React.useEffect(() => {
    let ignore = false;
    (async () => {
      if (!ignore) await loadProfile();
    })();
    return () => { ignore = true; };
  }, [loadProfile]);

  React.useImperativeHandle(ref, () => ({
    async reload() {
      await loadProfile();
    },
    async save() {
      setError("");
      try {
        const { id } = await getSessionUserId();
        if (form.userEmail !== initial.userEmail) {
          const ok = await guardEmailChange(initial.userEmail);
          if (!ok) return;
        }
        const bodyAll: any = {
          firstName: form.firstName || null, lastName: form.lastName || null, nickname: form.nickname || null,
          email: form.userEmail.trim().toLowerCase(),
          phoneE164: e164FromDisplay(displayFromE164(form.phoneE164, countries) || form.phoneE164) || null,
          whatsappE164: e164FromDisplay(displayFromE164(form.whatsappE164, countries) || form.whatsappE164) || null,
          street: form.street || null, street2: form.street2 || null, city: form.city || null, state: form.state || null,
          postalCode: form.postalCode || null, country: asCountryCode((form.country || "").toUpperCase(), countries) || null,
        };
        const mapInit: any = {
          firstName: initial.firstName || null, lastName: initial.lastName || null, nickname: initial.nickname || null,
          email: initial.userEmail, phoneE164: initial.phoneE164 || null, whatsappE164: initial.whatsappE164 || null,
          street: initial.street || null, street2: initial.street2 || null, city: initial.city || null, state: initial.state || null,
          postalCode: initial.postalCode || null, country: initial.country || null,
        };
        const changed = Object.fromEntries(Object.entries(bodyAll).filter(([k, v]) => v !== mapInit[k]));
        if (Object.keys(changed).length === 0) return;

        const saved = await fetchJson(`/api/v1/users/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify(changed),
        });
        if (changed.email) {
          await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" }).catch(() => { });
          window.location.assign("/login"); return;
        }
        const next = mapUserToProfileForm(saved, countries);
        setInitial(next); setForm(next); onTitle(deriveDisplayName(next)); onDirty(false);
      } catch (e: any) {
        if (e?.status === 403) {
          setError("You do not have permission to update this profile.");
        } else if (e?.message?.includes("email_already_exists") || e?.message?.includes("Unique constraint failed")) {
          setError("This email address is already in use by another account.");
        } else {
          setError(e?.message || "Failed to save profile. Please try again.");
        }
      }
    },
  }));

  const disabledCls = !editMode ? "opacity-70 cursor-not-allowed" : "";

  return (
    <Card className="p-4 space-y-4">
      {loading ? <div className="text-sm text-secondary">Loading profile…</div> : (
        <>
          {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}
          <div className={`rounded-xl border border-hairline bg-surface p-3 ${!editMode ? "pointer-events-none" : ""}`}>
            <div className="mb-2 text-xs uppercase tracking-wide text-secondary">Account</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="space-y-1">
                <div className="text-xs text-secondary">First name</div>
                <input className={`bhq-input ${INPUT_CLS} ${disabledCls}`} disabled={!editMode} autoComplete="given-name" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
              </label>
              <label className="space-y-1">
                <div className="text-xs text-secondary">Last name</div>
                <input className={`bhq-input ${INPUT_CLS} ${disabledCls}`} disabled={!editMode} autoComplete="family-name" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
              </label>
              <label className="space-y-1 md:col-span-2">
                <div className="text-xs text-secondary">Nickname</div>
                <input className={`bhq-input ${INPUT_CLS} ${disabledCls}`} disabled={!editMode} autoComplete="nickname" placeholder="Optional" value={form.nickname} onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))} />
              </label>
              <label className="space-y-1 md:col-span-2">
                <div className="text-xs text-secondary">Email Address (username)</div>
                <div className="flex items-center gap-2">
                  <input className={`bhq-input ${INPUT_CLS} w-auto flex-1 min-w-0 ${disabledCls}`} disabled type="email" autoComplete="email" value={form.userEmail} readOnly onChange={(e) => setForm((f) => ({ ...f, userEmail: e.target.value }))} />
                </div>
                <p className="text-[11px] text-tertiary">Changing your email will require re-auth and signs you out after saving.</p>
              </label>
            </div>
          </div>

          <div className={!editMode ? "pointer-events-none" : ""}>
            <label className="space-y-1">
              <div className="text-xs text-secondary">Phone</div>
              <div className={disabledCls}>
                <IntlPhoneField
                  value={displayFromE164(form.phoneE164, countries)}
                  onChange={(nextDisplay) => editMode && setForm((f) => ({ ...f, phoneE164: e164FromDisplay(nextDisplay) }))}
                  inferredCountryName={countryNameFromValue(form.country, countries)} countries={countries} className="w-full"
                />
              </div>
            </label>

            <label className="space-y-1 md:col-span-2 mt-4 block">
              <div className="text-xs text-secondary">WhatsApp</div>
              <div className={disabledCls}>
                <IntlPhoneField
                  value={displayFromE164(form.whatsappE164, countries)}
                  onChange={(nextDisplay) => editMode && setForm((f) => ({ ...f, whatsappE164: e164FromDisplay(nextDisplay) }))}
                  inferredCountryName={countryNameFromValue(form.country, countries)} countries={countries} className="w-full"
                />
              </div>
            </label>
          </div>

          <div className={`rounded-xl border border-hairline bg-surface p-3 ${!editMode ? "pointer-events-none" : ""}`}>
            <div className="mb-2 text-xs uppercase tracking-wide text-secondary">Address</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className={`bhq-input ${INPUT_CLS} md:col-span-2 ${disabledCls}`} disabled={!editMode} placeholder="Street" value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} />
              <input className={`bhq-input ${INPUT_CLS} md:col-span-2 ${disabledCls}`} disabled={!editMode} placeholder="Street 2" value={form.street2} onChange={(e) => setForm((f) => ({ ...f, street2: e.target.value }))} />
              <input className={`bhq-input ${INPUT_CLS} ${disabledCls}`} disabled={!editMode} placeholder="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
              <input className={`bhq-input ${INPUT_CLS} ${disabledCls}`} disabled={!editMode} placeholder="State / Region" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
              <input className={`bhq-input ${INPUT_CLS} ${disabledCls}`} disabled={!editMode} placeholder="Postal Code" value={form.postalCode} onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))} />
              <select className={`bhq-input ${INPUT_CLS} ${disabledCls}`} disabled={!editMode} value={asCountryCode(form.country, countries)} onChange={(e) => setForm((f) => ({ ...f, country: e.currentTarget.value || "" }))}>
                <option value="">Country</option>
                {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </>
      )}
    </Card>
  );
});

/** ───────── Security ───────── */
function SecurityTab({ onDirty }: { dirty: boolean; onDirty: (v: boolean) => void }) {
  const [currentPw, setCurrentPw] = React.useState(""); const [showCurrentPw, setShowCurrentPw] = React.useState(false);
  const [newPw, setNewPw] = React.useState(""); const [showNewPw, setShowNewPw] = React.useState(false);
  const [confirmPw, setConfirmPw] = React.useState(""); const [showConfirmPw, setShowConfirmPw] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string>(""); const [notice, setNotice] = React.useState<string>("");
  React.useEffect(() => { onDirty(false); }, [onDirty]);

  async function submitPasswordChange() {
    try {
      setSubmitting(true); setError("");
      if (!currentPw) { setError("Please enter your current password."); return; }
      if (!newPw || !confirmPw) { setError("Please enter and confirm your new password."); return; }
      if (newPw !== confirmPw) { setError("New password and confirmation do not match."); return; }
      if (newPw.length < 8) { setError("New password must be at least 8 characters."); return; }
      const res = await fetch("/api/v1/auth/password", {
        method: "POST", headers: { "Content-Type": "application/json", ...(await tenantHeaders()) }, credentials: "include",
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "Password change failed");
      }
      setNotice("Password changed. You will be logged out to reauthenticate…");
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" }).catch(() => { });
      setTimeout(() => { window.location.assign("/login"); }, 1500);
    } catch (e: any) { setError(e?.message || "Password change failed"); } finally { setSubmitting(false); }
  }
  const Eye = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
  const EyeOff = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 2 12 2 12a21.3 21.3 0 0 1 5.2-6" />
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M12 5c6.5 0 10 7 10 7a20.9 20.9 0 0 1-2.1 3.6" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-4">
        <h4 className="font-medium">Change Password</h4>
        {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}
        {notice && <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{notice}</div>}
        <form onSubmit={(e) => { e.preventDefault(); submitPasswordChange(); }} className="space-y-3">
          <label className="space-y-1 max-w-sm">
            <div className="text-xs text-secondary">Current password</div>
            <div className="relative w-80">
              <input className={`bhq-input ${INPUT_CLS} pr-10`} type={showCurrentPw ? "text" : "password"} autoComplete="current-password"
                value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} disabled={submitting}
              />
              <button type="button" onClick={() => setShowCurrentPw((v) => !v)} className="absolute inset-y-0 right-2 my-auto p-1 text-tertiary hover:text-primary" aria-label={showCurrentPw ? "Hide password" : "Show password"}>
                {showCurrentPw ? EyeOff : Eye}
              </button>
            </div>
          </label>
          <label className="space-y-1 max-w-sm">
            <div className="text-xs text-secondary">New password</div>
            <div className="relative w-80">
              <input className={`bhq-input ${INPUT_CLS} pr-10`} type={showNewPw ? "text" : "password"} autoComplete="new-password"
                value={newPw} onChange={(e) => setNewPw(e.target.value)} disabled={submitting}
              />
              <button type="button" onClick={() => setShowNewPw((v) => !v)} className="absolute inset-y-0 right-2 my-auto p-1 text-tertiary hover:text-primary" aria-label={showNewPw ? "Hide password" : "Show password"}>
                {showNewPw ? EyeOff : Eye}
              </button>
            </div>
          </label>
          <label className="space-y-1 max-w-sm">
            <div className="text-xs text-secondary">Confirm new password</div>
            <div className="relative w-80">
              <input className={`bhq-input ${INPUT_CLS} pr-10`} type={showConfirmPw ? "text" : "password"} autoComplete="new-password"
                value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} disabled={submitting}
              />
              <button type="button" onClick={() => setShowConfirmPw((v) => !v)} className="absolute inset-y-0 right-2 my-auto p-1 text-tertiary hover:text-primary" aria-label={showConfirmPw ? "Hide password" : "Show password"}>
                {showConfirmPw ? EyeOff : Eye}
              </button>
            </div>
          </label>
          <p className="text-xs text-tertiary">After changing your password, you will be signed out to reauthenticate.</p>
          <div><Button type="submit" size="sm" disabled={submitting}>{submitting ? "Changing…" : "Change Password"}</Button></div>
        </form>
      </Card>

      <Card className="p-4 space-y-3">
        <h4 className="font-medium">Two factor authentication</h4>
        <p className="text-sm text-secondary">Enable, verify, disable TOTP and manage recovery codes.</p>
        <div className="flex gap-2">
          <Button size="sm">Enable TOTP</Button>
          <Button size="sm" variant="outline">View recovery codes</Button>
        </div>
      </Card>
    </div>
  );
}

/** ───────── Subscription/Payments/Transactions (placeholders) ───────── */
function SubscriptionTab({ onDirty }: { dirty: boolean; onDirty: (v: boolean) => void }) {
  return (
    <Card className="p-4 space-y-3">
      <h4 className="font-medium">Subscription</h4>
      <p className="text-sm text-secondary">Toggle modules. Billing provider to be added.</p>
      <label className="flex items-center gap-2"><input type="checkbox" onChange={() => onDirty(true)} /> Contacts</label>
      <label className="flex items-center gap-2"><input type="checkbox" onChange={() => onDirty(true)} /> Animals</label>
      <label className="flex items-center gap-2"><input type="checkbox" onChange={() => onDirty(true)} /> Breeding</label>
      <label className="flex items-center gap-2"><input type="checkbox" onChange={() => onDirty(true)} /> Offspring</label>
    </Card>
  );
}
function PaymentsTab({ onDirty }: { dirty: boolean; onDirty: (v: boolean) => void }) {
  return (
    <Card className="p-4 space-y-3">
      <h4 className="font-medium">Payment methods</h4>
      <div className="rounded-md border border-hairline divide-y divide-hairline">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="text-sm">•••• •••• •••• 4242 — Visa</div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => onDirty(true)}>Set default</Button>
            <Button size="sm" variant="outline" onClick={() => onDirty(true)}>Remove</Button>
          </div>
        </div>
      </div>
      <div className="flex justify-end"><Button size="sm" onClick={() => onDirty(true)}>Add payment method</Button></div>
    </Card>
  );
}
function TransactionsTab({ onDirty }: { dirty: boolean; onDirty: (v: boolean) => void }) {
  return (
    <Card className="p-4 space-y-3">
      <h4 className="font-medium">Transactions</h4>
      <p className="text-sm text-secondary">View recent charges, refunds, and invoices (placeholder).</p>
      <div className="rounded-md border border-hairline p-3 text-sm text-secondary">No transactions to display yet.</div>
    </Card>
  );
}

/** ───────── Breeding (now: General=Local Display only; Phases Presets A; Dates Presets B) ───────── */
type BreedingHandle = {
  save: () => Promise<void>;
  goto: (sub: BreedingSubTab) => void;
};

type BreedingSubTab = "general" | "phases" | "dates" | "biology" | "validation";
const BREEDING_SUBTABS: Array<{ key: BreedingSubTab; label: string }> = [
  { key: "general", label: "General" },
  { key: "phases", label: "Timeline Phases" },
  { key: "dates", label: "Exact Dates" },
  { key: "biology", label: "Biology & Calculations" },
  { key: "validation", label: "Validation Rules" },
];

const BreedingTab = React.forwardRef<BreedingHandle, { dirty: boolean; onDirty: (v: boolean) => void }>(
  function BreedingTabImpl({ onDirty }, ref) {
    const DEFAULTS: AvailabilityPrefs = DEFAULT_AVAILABILITY_PREFS;

    // Display prefs, saved to tenant profile
    const [showGanttBands, setShowGanttBands] = React.useState<boolean>(true);
    const [showCalendarBands, setShowCalendarBands] = React.useState<boolean>(true);
    const [initialBands, setInitialBands] = React.useState<{ showInGantt: boolean; showInCalendar: boolean }>({
      showInGantt: true,
      showInCalendar: true,
    });

    // Local-only: auto-widen (+1) overrides
    const [enforcePlusOneDates, setEnforcePlusOneDates] = React.useState<boolean>(() => {
      try { return localStorage.getItem("BHQ_ENFORCE_PLUSONE_DATES") !== "0"; } catch { return true; }
    });
    const [enforcePlusOnePhases, setEnforcePlusOnePhases] = React.useState<boolean>(() => {
      try { return localStorage.getItem("BHQ_ENFORCE_PLUSONE_PHASES") !== "0"; } catch { return true; }
    });

    function isZeroish(v: any) {
      const n = Number(v ?? 0);
      return !Number.isFinite(n) || n === 0;
    }
    function availabilityLooksEmpty(av: AvailabilityPrefs) {
      // any non-zero across either phases or exact-date bands = "initialized"
      const keys: (keyof AvailabilityPrefs)[] = [
        // Phases
        "cycle_breeding_unlikely_from_likely_start",
        "cycle_breeding_unlikely_to_likely_end",
        "cycle_breeding_risky_from_full_start",
        "cycle_breeding_risky_to_full_end",
        "post_unlikely_from_likely_start",
        "post_unlikely_to_likely_end",
        "post_risky_from_full_start",
        "post_risky_to_full_end",
        // Exact Dates
        "date_cycle_risky_from", "date_cycle_risky_to", "date_cycle_unlikely_from", "date_cycle_unlikely_to",
        "date_testing_risky_from", "date_testing_risky_to", "date_testing_unlikely_from", "date_testing_unlikely_to",
        "date_breeding_risky_from", "date_breeding_risky_to", "date_breeding_unlikely_from", "date_breeding_unlikely_to",
        "date_birth_risky_from", "date_birth_risky_to", "date_birth_unlikely_from", "date_birth_unlikely_to",
        "date_weaned_risky_from", "date_weaned_risky_to", "date_weaned_unlikely_from", "date_weaned_unlikely_to",
        "date_placement_start_risky_from", "date_placement_start_risky_to",
        "date_placement_start_unlikely_from", "date_placement_start_unlikely_to",
        "date_placement_completed_risky_from", "date_placement_completed_risky_to",
        "date_placement_completed_unlikely_from", "date_placement_completed_unlikely_to",
      ];
      return keys.every(k => isZeroish((av as any)[k]));
    }

    function seedBalancedIfEmpty(
      current: AvailabilityPrefs,
      defaults: AvailabilityPrefs,
      plusOneDates: boolean,
      plusOnePhases: boolean
    ): AvailabilityPrefs {
      if (!availabilityLooksEmpty(current)) return current; // respect existing values

      // Start from defaults, then apply Balanced to phases & dates
      const next: AvailabilityPrefs = { ...defaults, ...current };

      // —— Phases (Balanced multiplier = 1.0)
      ([
        ["cycle_breeding_unlikely_from_likely_start", BASE_PHASE.unlikelyBefore],
        ["cycle_breeding_unlikely_to_likely_end", BASE_PHASE.unlikelyAfter],
        ["cycle_breeding_risky_from_full_start", BASE_PHASE.riskyBefore],
        ["cycle_breeding_risky_to_full_end", BASE_PHASE.riskyAfter],
        ["post_unlikely_from_likely_start", BASE_PHASE.unlikelyBefore],
        ["post_unlikely_to_likely_end", BASE_PHASE.unlikelyAfter],
        ["post_risky_from_full_start", BASE_PHASE.riskyBefore],
        ["post_risky_to_full_end", BASE_PHASE.riskyAfter],
      ] as Array<[keyof AvailabilityPrefs, number]>).forEach(([k, seed]) => {
        const seeded = seedOrCurrent((next as any)[k], (defaults as any)[k], seed);
        (next as any)[k] = Math.round(seeded * 1.0);
      });

      // —— Exact dates (Balanced multiplier = 1.0)
      EXACT_ROWS.forEach((row) => {
        const k = row.keys as any;
        const rfCur = seedOrCurrent((next as any)[k.rf], (defaults as any)[k.rf], BASE_DATE.riskyBefore);
        const rtCur = seedOrCurrent((next as any)[k.rt], (defaults as any)[k.rt], BASE_DATE.riskyAfter);
        const ufCur = seedOrCurrent((next as any)[k.uf], (defaults as any)[k.uf], BASE_DATE.unlikelyBefore);
        const utCur = seedOrCurrent((next as any)[k.ut], (defaults as any)[k.ut], BASE_DATE.unlikelyAfter);
        (next as any)[k.rf] = Math.round(rfCur * 1.0);
        (next as any)[k.rt] = Math.round(rtCur * 1.0);
        (next as any)[k.uf] = Math.round(ufCur * 1.0);
        (next as any)[k.ut] = Math.round(utCur * 1.0);
      });

      // Normalize (placement before bands, “+1” widening, etc.)
      const withDates = normalizeExactBands(next, plusOneDates);
      const withPhases = normalizePhaseBands(withDates, plusOnePhases);
      return withPhases;
    }

    const [activeSub, setActiveSub] = React.useState<BreedingSubTab>("general");
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string>("");

    // Server-backed: availability prefs only
    const [initial, setInitial] = React.useState<AvailabilityPrefs>(DEFAULTS);
    const [form, setForm] = React.useState<AvailabilityPrefs>(DEFAULTS);
    // Run normalization immediately when the toggle turns ON
    React.useEffect(() => {
      if (enforcePlusOneDates) {
        setForm((f) => normalizeExactBands({ ...f }, true));
      }
    }, [enforcePlusOneDates]); // setForm is stable; no need to depend on it

    React.useEffect(() => {
      if (enforcePlusOnePhases) {
        setForm((f) => normalizePhaseBands({ ...f }, true));
      }
    }, [enforcePlusOnePhases]); // same note as above


    const isDirty = React.useMemo(() => {
      const serverDirty = JSON.stringify(form) !== JSON.stringify(initial);
      const bandDirty =
        showGanttBands !== initialBands.showInGantt ||
        showCalendarBands !== initialBands.showInCalendar;
      const localTogglesDirty =
        enforcePlusOneDates !== (localStorage.getItem("BHQ_ENFORCE_PLUSONE_DATES") !== "0") ||
        enforcePlusOnePhases !== (localStorage.getItem("BHQ_ENFORCE_PLUSONE_PHASES") !== "0");
      return serverDirty || bandDirty || localTogglesDirty;
    }, [
      form,
      initial,
      showGanttBands,
      showCalendarBands,
      initialBands.showInGantt,
      initialBands.showInCalendar,
      enforcePlusOneDates,
      enforcePlusOnePhases,
    ]);
    React.useEffect(() => onDirty(isDirty), [isDirty, onDirty]);

    React.useEffect(() => {
      let ignore = false;
      (async () => {
        try {
          setLoading(true); setError("");
          const tenantId = await resolveTenantIdSafe();
          if (!tenantId) throw new Error("Missing tenant id");
          const av = await fetchJson(`/api/v1/tenants/${encodeURIComponent(tenantId)}/availability`);
          const avData = (av?.data ?? av) as Partial<AvailabilityPrefs> | undefined;
          const avMerged: AvailabilityPrefs = { ...DEFAULTS, ...(avData || {}) };
          const seeded = seedBalancedIfEmpty(avMerged, DEFAULTS, enforcePlusOneDates, enforcePlusOnePhases);
          const wasEmpty =
            availabilityLooksEmpty(avMerged); // all zeros on server?
          if (!ignore) {
            // If we seeded, keep "initial" equal to what the server actually had,
            // so the form is dirty and Save will PATCH the seeded values.
            setInitial(wasEmpty ? avMerged : seeded);
            setForm(seeded);
          }
        } catch (e: any) {
          if (!ignore) setError(e?.message || "Failed to load breeding availability");
        } finally { if (!ignore) setLoading(false); }
      })();
      return () => { ignore = true; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    React.useEffect(() => {
      let ignore = false;
      (async () => {
        try {
          const tenantId = await resolveTenantIdSafe();
          if (!tenantId) return;

          // Load from availability preferences first (new location)
          let ganttDefault: boolean | undefined;
          let calendarDefault: boolean | undefined;

          try {
            const av = await fetchJson(`/api/v1/tenants/${encodeURIComponent(tenantId)}/availability`);
            const avData = (av?.data ?? av) as Partial<AvailabilityPrefs> | undefined;
            if (avData) {
              if (typeof avData.gantt_perplan_default_exact_bands_visible === "boolean") {
                ganttDefault = avData.gantt_perplan_default_exact_bands_visible;
              } else if (typeof avData.gantt_master_default_exact_bands_visible === "boolean") {
                ganttDefault = avData.gantt_master_default_exact_bands_visible;
              }
              // Note: Calendar bands don't have an equivalent in availability prefs yet
            }
          } catch { /* ignore */ }

          // Fall back to breeding program preferences (legacy location)
          try {
            const pr = await api.breeding.program.getForTenant(Number(tenantId));
            const prof = (pr?.data ?? pr) as any;
            const bands = prof?.preferences?.bands || {};
            if (!ignore) {
              const g = ganttDefault !== undefined ? ganttDefault : (typeof bands.showInGantt === "boolean" ? bands.showInGantt : true);
              const c = calendarDefault !== undefined ? calendarDefault : (typeof bands.showInCalendar === "boolean" ? bands.showInCalendar : true);
              setShowGanttBands(g);
              setShowCalendarBands(c);
              setInitialBands({ showInGantt: g, showInCalendar: c });
            }
          } catch { /* ignore */ }
        } catch { /* ignore */ }
      })();
      return () => { ignore = true; };
    }, []);

    async function saveAll() {
      setError("");
      try {
        const tenantId = await resolveTenantIdSafe();
        if (!tenantId) throw new Error("Missing tenant id");

        // Save availability if changed (including band visibility defaults)
        const avChanged = Object.fromEntries(Object.entries(form).filter(([k, v]) => (initial as any)[k] !== v));

        // Also include the gantt band visibility setting if it changed
        const ganttBandsChanged = showGanttBands !== initialBands.showInGantt;
        if (ganttBandsChanged) {
          avChanged.gantt_perplan_default_exact_bands_visible = !!showGanttBands;
          avChanged.gantt_master_default_exact_bands_visible = !!showGanttBands;
        }

        if (Object.keys(avChanged).length > 0) {
          const avRes = await fetchJson(`/api/v1/tenants/${encodeURIComponent(tenantId)}/availability`, {
            method: "PATCH", body: JSON.stringify(avChanged),
          });
          const avSaved = (avRes?.data ?? avRes) as AvailabilityPrefs;
          setInitial(avSaved); setForm(avSaved);
        }

        // Save tenant band-visibility preferences
        try {
          const tenantRaw2 = await resolveTenantId();
          const tenantId2 = String(tenantRaw2 ?? "").trim();
          if (tenantId2) {
            try {
              const prCurr = await api.breeding.program.getForTenant(Number(tenantId2));
              const prof = (prCurr?.data ?? prCurr) as any;
              const prevPrefs = prof?.preferences || {};
              const nextPrefs = {
                ...prevPrefs,
                bands: {
                  ...(prevPrefs.bands || {}),
                  showInGantt: !!showGanttBands,
                  showInCalendar: !!showCalendarBands,
                },
              };
              await api.breeding.program.updateForTenant({ preferences: nextPrefs } as any, Number(tenantId2));
            } catch {
              await fetch(`/api/v1/breeding/program/tenant/${encodeURIComponent(tenantId2)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                credentials: "include",
                body: JSON.stringify({ preferences: { bands: { showInGantt: !!showGanttBands, showInCalendar: !!showCalendarBands } } }),
              });
            }
          }
        } catch { }
        setInitialBands({ showInGantt: !!showGanttBands, showInCalendar: !!showCalendarBands });
        try {
          localStorage.setItem("BHQ_ENFORCE_PLUSONE_DATES", enforcePlusOneDates ? "1" : "0");
          localStorage.setItem("BHQ_ENFORCE_PLUSONE_PHASES", enforcePlusOnePhases ? "1" : "0");
        } catch { /* ignore */ }

        // Dispatch custom event to notify same-tab planner components
        try {
          window.dispatchEvent(new CustomEvent("bhq:breeding:planner:settings:updated", {
            detail: { timestamp: Date.now() }
          }));
        } catch { /* ignore */ }

        onDirty(false);
      } catch (e: any) {
        setError(e?.message || "Failed to save breeding settings");
      }
    }
    React.useImperativeHandle(ref, () => ({
      async save() { await saveAll(); },
      goto(sub: BreedingSubTab) { setActiveSub(sub); },
    }));

    function _setPref<K extends keyof AvailabilityPrefs>(key: K, val: number | boolean) {
      setForm((f) => ({ ...f, [key]: val as any } as AvailabilityPrefs));
    }

    // ── Presets: fixed values per spec
    const PRESET = {
      tight: { U: 4, R: 2 },
      balanced: { U: 7, R: 3 },
      wide: { U: 10, R: 4 },
    } as const;

    function applyPhasePreset(kind: "tight" | "balanced" | "wide") {
      const { U, R } = PRESET[kind];
      setForm((f) => {
        const next = { ...f };
        // Cycle Start → Breeding
        (next as any).cycle_breeding_unlikely_from_likely_start = -U;
        (next as any).cycle_breeding_unlikely_to_likely_end = +U;
        (next as any).cycle_breeding_risky_from_full_start = -R;
        (next as any).cycle_breeding_risky_to_full_end = +R;
        // Birth → Placement
        (next as any).post_unlikely_from_likely_start = -U;
        (next as any).post_unlikely_to_likely_end = +U;
        (next as any).post_risky_from_full_start = -R;
        (next as any).post_risky_to_full_end = +R;
        return normalizePhaseBands(next, enforcePlusOnePhases);
      });
    }

    function adjustPhasesBy(delta: number) {
      if (!delta) return;
      const keys: (keyof AvailabilityPrefs)[] = [
        "cycle_breeding_unlikely_from_likely_start", "cycle_breeding_unlikely_to_likely_end",
        "cycle_breeding_risky_from_full_start", "cycle_breeding_risky_to_full_end",
        "post_unlikely_from_likely_start", "post_unlikely_to_likely_end",
        "post_risky_from_full_start", "post_risky_to_full_end",
      ];
      setForm(f => {
        const next = { ...f };
        for (const k of keys) (next as any)[k] = Number((next as any)[k] || 0) + delta;
        return normalizePhaseBands(next, enforcePlusOnePhases);
      });
    }
    function scalePhases(mult: number) {
      const keys: (keyof AvailabilityPrefs)[] = [
        "cycle_breeding_unlikely_from_likely_start", "cycle_breeding_unlikely_to_likely_end",
        "cycle_breeding_risky_from_full_start", "cycle_breeding_risky_to_full_end",
        "post_unlikely_from_likely_start", "post_unlikely_to_likely_end",
        "post_risky_from_full_start", "post_risky_to_full_end",
      ];
      setForm(f => {
        const next = { ...f };
        for (const k of keys) (next as any)[k] = Math.round(((DEFAULTS as any)[k] || 0) * mult);
        return normalizePhaseBands(next, enforcePlusOnePhases);
      });
    }

    // ── Presets B: affect ONLY per-date keys, respect row locks
    function applyDatePreset(kind: "tight" | "balanced" | "wide") {
      const { U, R } = PRESET[kind];
      setForm((f) => {
        const next = { ...f };
        withUnlockedRows((row) => {
          const k = row.keys as any;
          (next as any)[k.rf] = -R;  // Risky from
          (next as any)[k.rt] = +R;  // Risky to
          (next as any)[k.uf] = -U;  // Unlikely from
          (next as any)[k.ut] = +U;  // Unlikely to
        });
        return normalizeExactBands(next, enforcePlusOneDates);
      });
    }


    function shiftAllDatesBy(delta: number) {
      if (!delta) return;
      setForm((f) => {
        const next = { ...f };
        withUnlockedRows((row) => {
          const k = row.keys as any;
          (next as any)[k.rf] = Number((next as any)[k.rf] || 0) + delta;
          (next as any)[k.rt] = Number((next as any)[k.rt] || 0) + delta;
          (next as any)[k.uf] = Number((next as any)[k.uf] || 0) + delta;
          (next as any)[k.ut] = Number((next as any)[k.ut] || 0) + delta;
        });
        return normalizeExactBands(next, enforcePlusOneDates);
      });
    }

    function scaleAllDates(mult: number) {
      setForm((f) => {
        const next = { ...f };
        withUnlockedRows((row) => {
          const k = row.keys as any;
          (next as any)[k.rf] = Math.round(((DEFAULTS as any)[k.rf] || 0) * mult);
          (next as any)[k.rt] = Math.round(((DEFAULTS as any)[k.rt] || 0) * mult);
          (next as any)[k.uf] = Math.round(((DEFAULTS as any)[k.uf] || 0) * mult);
          (next as any)[k.ut] = Math.round(((DEFAULTS as any)[k.ut] || 0) * mult);
        });
        return normalizeExactBands(next, enforcePlusOneDates);
      });
    }


    // ── Subtab headers
    const Tabs = (
      <div className="flex items-center gap-2 border-b border-hairline">
        {BREEDING_SUBTABS.map((t) => (
          <button
            key={t.key} onClick={() => setActiveSub(t.key)}
            className={["px-3 py-2 text-sm", activeSub === t.key ? "border-b-2 border-[hsl(var(--brand-orange))] text-primary" : "text-secondary"].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>
    );

    // ── General
    const GeneralTab = (
      <SectionCard title="Default Settings" subtitle="Saved to tenant preferences and used by Planner." right={<Legend />}>        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-3 space-y-2">
          <div className="text-sm font-medium">Default bands visibility</div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showGanttBands} onChange={(e) => setShowGanttBands(e.currentTarget.checked)} />
            <span className="text-sm">Show Bands in Planning Charts by Default</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showCalendarBands} onChange={(e) => setShowCalendarBands(e.currentTarget.checked)} />
            <span className="text-sm">Show bands in Calendar</span>
          </label>
        </Card>
      </div>
      </SectionCard>
    );

    // ── Phases subtab (with Presets A)
    const PhasesTab = (
      <SectionCard title="Timeline Phases" subtitle="Bands that follow a whole phase span." right={<Legend />} className="space-y-4">
        {loading ? <div className="text-sm text-secondary">Loading…</div> : (
          <>
            <Card className="p-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Left: Presets (Phases) */}
                <div>
                  <div className="text-sm font-medium mb-1">Presets (Phases)</div>
                  {/* Presets (Phases) */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => applyPhasePreset("tight")}>Tight</Button>
                    <Button size="sm" variant="outline" onClick={() => applyPhasePreset("balanced")}>Balanced</Button>
                    <Button size="sm" variant="outline" onClick={() => applyPhasePreset("wide")}>Wide</Button>
                    <Button size="sm" variant="ghost" onClick={resetPhasesToDefaults}>Reset to defaults</Button>
                  </div>
                </div>
                {/* Right: Quick adjust (mirror Exact Dates: Shift-only) */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Quick adjust</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-secondary">Shift</span>
                    <Button size="xs" variant="outline" onClick={() => adjustPhasesBy(-14)}>-14d</Button>
                    <Button size="xs" variant="outline" onClick={() => adjustPhasesBy(-7)}>-7d</Button>
                    <Button size="xs" variant="outline" onClick={() => adjustPhasesBy(-1)}>-1d</Button>
                    <Button size="xs" variant="outline" onClick={() => adjustPhasesBy(+1)}>+1d</Button>
                    <Button size="xs" variant="outline" onClick={() => adjustPhasesBy(+7)}>+7d</Button>
                    <Button size="xs" variant="outline" onClick={() => adjustPhasesBy(+14)}>+14d</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Behavior</div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={enforcePlusOnePhases}
                      onChange={(e) => {
                        const checked = e.currentTarget.checked;
                        setEnforcePlusOnePhases(checked);
                        if (checked) setForm((f) => normalizePhaseBands({ ...f }, true));
                      }}
                    />
                    <span className="text-sm">Auto-widen Unlikely to be ≥ Risky + 1</span>
                  </label>
                </div>
              </div>
            </Card>
            {/* Inline planner preview for phases */}
            <div className="rounded-md border border-hairline p-2 bg-surface">
              <div className="text-sm font-medium mb-1">Planner Preview (Phases)</div>
              <PhasePreview form={form} />
            </div>

            <PhaseBlock
              title="Cycle Start → Breeding"
              unlikelyBeforeKey="cycle_breeding_unlikely_from_likely_start"
              unlikelyAfterKey="cycle_breeding_unlikely_to_likely_end"
              riskyBeforeKey="cycle_breeding_risky_from_full_start"
              riskyAfterKey="cycle_breeding_risky_to_full_end"
              form={form} setForm={setForm} defaults={DEFAULTS} plusOnePhases={enforcePlusOnePhases}
            />

            <PhaseBlock
              title="Birth → Placement"
              unlikelyBeforeKey="post_unlikely_from_likely_start"
              unlikelyAfterKey="post_unlikely_to_likely_end"
              riskyBeforeKey="post_risky_from_full_start"
              riskyAfterKey="post_risky_to_full_end"
              form={form} setForm={setForm} defaults={DEFAULTS} plusOnePhases={enforcePlusOnePhases}
            />
          </>
        )}
      </SectionCard>
    );

    type LockMap = Partial<Record<(typeof EXACT_ROWS)[number]["id"], boolean>>;
    const LOCKS_KEY = "BHQ_EXACT_DATE_LOCKS";


    function loadLocks(): LockMap {
      try { return JSON.parse(localStorage.getItem(LOCKS_KEY) || "{}") || {}; } catch { return {}; }
    }
    function saveLocks(m: LockMap) { try { localStorage.setItem(LOCKS_KEY, JSON.stringify(m)); } catch { } }

    const [locks, setLocks] = React.useState<LockMap>(() => loadLocks());
    const isLocked = (id: (typeof EXACT_ROWS)[number]["id"]) => !!locks[id];
    const toggleLock = (id: (typeof EXACT_ROWS)[number]["id"]) =>
      setLocks(m => { const next = { ...m, [id]: !m[id] }; saveLocks(next); return next; });

    // helper: iterate keys in unlocked rows
    function withUnlockedRows(fn: (row: typeof EXACT_ROWS[number]) => void) {
      EXACT_ROWS.forEach(row => { if (!isLocked(row.id)) fn(row); });
    }

    // Reset ALL per-date fields (Exact Dates) back to defaults. Respects row locks.
    function resetAllDatesToDefaults() {
      setForm((f) => {
        const next = { ...f };
        withUnlockedRows((row) => {
          const k = row.keys as any;
          (next as any)[k.rf] = (DEFAULTS as any)[k.rf] ?? 0;
          (next as any)[k.rt] = (DEFAULTS as any)[k.rt] ?? 0;
          (next as any)[k.uf] = (DEFAULTS as any)[k.uf] ?? 0;
          (next as any)[k.ut] = (DEFAULTS as any)[k.ut] ?? 0;
        });
        return normalizeExactBands(next, enforcePlusOneDates);
      });
    }

    function resetPhasesToDefaults() {
      setForm((f) => normalizePhaseBands({
        ...f,
        cycle_breeding_unlikely_from_likely_start: DEFAULTS.cycle_breeding_unlikely_from_likely_start,
        cycle_breeding_unlikely_to_likely_end: DEFAULTS.cycle_breeding_unlikely_to_likely_end,
        cycle_breeding_risky_from_full_start: DEFAULTS.cycle_breeding_risky_from_full_start,
        cycle_breeding_risky_to_full_end: DEFAULTS.cycle_breeding_risky_to_full_end,
        post_unlikely_from_likely_start: DEFAULTS.post_unlikely_from_likely_start,
        post_unlikely_to_likely_end: DEFAULTS.post_unlikely_to_likely_end,
        post_risky_from_full_start: DEFAULTS.post_risky_from_full_start,
        post_risky_to_full_end: DEFAULTS.post_risky_to_full_end,
      } as AvailabilityPrefs, enforcePlusOnePhases));
    }


    // ── Dates subtab (with Presets B + placement toggle)
    const DatesTab = (
      <SectionCard title="Exact Dates" subtitle="Wrap a single expected or actual calendar date." right={<Legend />} className="space-y-4">
        {loading ? <div className="text-sm text-secondary">Loading…</div> : (
          <>
            <Card className="p-3 space-y-3">
              {/* Row 1: side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-medium mb-1">Presets (Exact Dates)</div>
                  {/* Presets (Phases) */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => applyDatePreset("tight")}>Tight</Button>
                    <Button size="sm" variant="outline" onClick={() => applyDatePreset("balanced")}>Balanced</Button>
                    <Button size="sm" variant="outline" onClick={() => applyDatePreset("wide")}>Wide</Button>
                    <Button size="sm" variant="ghost" onClick={resetAllDatesToDefaults}>Reset to defaults</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Quick adjust</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-secondary">Shift</span>
                    <Button size="xs" variant="outline" onClick={() => shiftAllDatesBy(-14)}>-14d</Button>
                    <Button size="xs" variant="outline" onClick={() => shiftAllDatesBy(-7)}>-7d</Button>
                    <Button size="xs" variant="outline" onClick={() => shiftAllDatesBy(-1)}>-1d</Button>
                    <Button size="xs" variant="outline" onClick={() => shiftAllDatesBy(+1)}>+1d</Button>
                    <Button size="xs" variant="outline" onClick={() => shiftAllDatesBy(+7)}>+7d</Button>
                    <Button size="xs" variant="outline" onClick={() => shiftAllDatesBy(+14)}>+14d</Button>
                  </div>
                </div>
              </div>
              {/* Row 2: chart full width */}
              <div className="rounded-md border border-hairline p-2 bg-surface">
                <div className="text-sm font-medium mb-1">Planner Preview (Exact Dates) </div>
                <MiniPreview form={form} />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Behavior</div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={enforcePlusOneDates}
                    onChange={(e) => {
                      const checked = e.currentTarget.checked;
                      setEnforcePlusOneDates(checked);
                      if (checked) setForm((f) => normalizeExactBands({ ...f }, true));
                    }}
                  />
                  <span className="text-sm">Auto-widen Unlikely to be ≥ Risky + 1</span>
                </label>
              </div>

            </Card>
            {EXACT_ROWS.map((row) => (
              <ExactDateRow
                key={row.id}
                rowId={row.id}
                title={row.title}
                locked={isLocked(row.id)}
                onToggleLock={() => toggleLock(row.id)}
                riskyFromKey={row.keys.rf as keyof AvailabilityPrefs}
                riskyToKey={row.keys.rt as keyof AvailabilityPrefs}
                unlikelyFromKey={row.keys.uf as keyof AvailabilityPrefs}
                unlikelyToKey={row.keys.ut as keyof AvailabilityPrefs}
                form={form}
                setForm={setForm}
                derivedDefaults={DEFAULTS}
                hideBefore={false}
                plusOneDates={enforcePlusOneDates}
              />
            ))}
          </>
        )
        }
      </SectionCard >
    );

    return (
      <div className="space-y-6">
        {HELP_BOX}
        {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}
        {Tabs}
        {activeSub === "general" && GeneralTab}
        {activeSub === "phases" && PhasesTab}
        {activeSub === "dates" && DatesTab}
        {activeSub === "biology" && <BiologySettingsTab ref={null} dirty={false} onDirty={() => {}} />}
        {activeSub === "validation" && <DateValidationSettingsTab ref={null} dirty={false} onDirty={() => {}} />}
      </div>
    );
  }
);
export { BreedingTab };

/** ───────── Program Profile (moved to Platform Management) ───────── */
type ProgramProfileHandle = {
  save: () => Promise<void>;
  cancel: () => void;
};

// Business Identity types (shared with MarketplaceSettingsTab)
type PublicLocationMode = "city_state" | "zip_only" | "full" | "hidden";
type BusinessIdentityDraft = {
  businessName: string;
  logoAssetId: string | null;
  bio: string;
  showBusinessIdentity: boolean; // Controls visibility of name, logo, bio as a group
  websiteUrl: string;
  showWebsite: boolean;
  instagram: string;
  showInstagram: boolean;
  facebook: string;
  showFacebook: boolean;
  address: { street: string; city: string; state: string; zip: string; country: string };
  publicLocationMode: PublicLocationMode;
  searchParticipation: { distanceSearch: boolean; citySearch: boolean; zipRadius: boolean };
};

function createEmptyBusinessIdentity(): BusinessIdentityDraft {
  return {
    businessName: "", logoAssetId: null, bio: "",
    showBusinessIdentity: true,
    websiteUrl: "", showWebsite: false,
    instagram: "", showInstagram: false, facebook: "", showFacebook: false,
    address: { street: "", city: "", state: "", zip: "", country: "" },
    publicLocationMode: "city_state",
    searchParticipation: { distanceSearch: true, citySearch: true, zipRadius: true },
  };
}

// Visibility toggle pill button
function VisibilityToggle({ isPublic, onChange, disabled }: { isPublic: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!isPublic)}
      disabled={disabled}
      className={`
        inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium transition-all
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${isPublic
          ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
          : "bg-zinc-500/15 text-zinc-400 hover:bg-zinc-500/25"
        }
      `}
    >
      {isPublic ? (
        <>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          Public
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
          </svg>
          Unlisted
        </>
      )}
    </button>
  );
}

// Toggle component for Business Identity section
function ProfileToggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <label className={["inline-flex items-center gap-2 cursor-pointer", disabled ? "opacity-50 cursor-not-allowed" : ""].join(" ")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={["relative w-10 h-5 rounded-full transition-colors", checked ? "bg-[hsl(var(--brand-orange))]" : "bg-surface-strong border border-hairline"].join(" ")}
      >
        <span className={["absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "translate-x-0"].join(" ")} />
      </button>
      {label && <span className="text-sm text-secondary">{label}</span>}
    </label>
  );
}

function ProfileCheckbox({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label className={["flex items-center gap-2 cursor-pointer", disabled ? "opacity-50 cursor-not-allowed" : ""].join(" ")}>
      <input type="checkbox" checked={checked} onChange={(e) => !disabled && onChange(e.target.checked)} disabled={disabled} className="w-4 h-4 rounded border-hairline bg-card accent-[hsl(var(--brand-orange))]" />
      <span className="text-sm text-primary">{label}</span>
    </label>
  );
}

function ProfileRadioGroup({ value, onChange, options, name }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; name: string }) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name={name} value={opt.value} checked={value === opt.value} onChange={(e) => onChange(e.target.value)} className="w-4 h-4 border-hairline bg-card accent-[hsl(var(--brand-orange))]" />
          <span className="text-sm text-primary">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

const ProgramProfileTab = React.forwardRef<ProgramProfileHandle, { dirty: boolean; onDirty: (v: boolean) => void; editMode?: boolean }>(
  function ProgramProfileImpl({ onDirty, editMode = false }, ref) {
    const EMPTY_PROFILE: BreedingProgramProfile & {
      cyclePolicy?: (BreedingProgramProfile["cyclePolicy"] & { retireRule?: "age_only" | "litters_only" | "either" });
      publication?: { publishInDirectory: boolean; summary?: string | null };
    } = {
      kennelName: "", registryPrefixes: [], website: null, socials: [], species: ["DOG"], sellRegions: [],
      shippingAllowed: false, travelPolicy: "case_by_case",
      cyclePolicy: { minDamAgeMonths: 18, minDamWeightLbs: null, minHeatsBetween: 1, maxLittersLifetime: 4, retireAfterAgeMonths: null, retireRule: "either", lockApproverRole: "manager" },
      methods: { allowed: ["natural", "ai_fresh", "ai_chilled"], preferredBySpecies: {}, externalStudDocsRequired: ["brucellosis"] },
      hormoneTesting: { progesteroneInHouse: true, progesteroneLab: true, lhTesting: false, ovulationNgMlTarget: 5, decisionOwnerRole: "manager" },
      pregnancyChecks: { ultrasoundDayFromOvulation: 28, relaxinUsed: false, xrayDayFromOvulation: 55 },
      whelping: { expectedDaysFromOvulation: 63, interveneIfNoPupHours: 2, emergencyVetName: null, emergencyVetPhone: null },
      puppyCare: { dewclawPolicy: "breed_specific", tailPolicy: "breed_specific", dewormScheduleDays: [14, 28, 42], firstVaccineDay: 56, microchipAtWeeks: 8, registrationAuthority: null },
      placement: { earliestDaysFromBirth: 56, standardDaysFromBirth: 63, extendedHoldPolicy: "offered_fee", contractTemplateId: null, healthGuaranteeMonths: 24, depositRequired: true, depositAmountUSD: 300, paymentMethods: ["ach", "zelle"], waitlistPolicy: "priority_order" },
      healthTesting: { requiredByBreed: {}, acceptedLabs: ["Embark", "OFA"], recheckMonths: 24 },
      docsAndData: { readyToBreedChecklist: ["dam_health_tests", "stud_clearances", "contract_ready"], marketingMediaPolicy: "buyers_only", showClientNames: false },
      comms: { prospectDuringPregnancyCadenceDays: 7, postBirthUpdateCadenceDays: 7, channels: ["email"], sendAutoMilestones: true },
      publication: { publishInDirectory: false, summary: null },
    };

    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string>("");
    const [profileInit, setProfileInit] = React.useState<BreedingProgramProfile>(EMPTY_PROFILE);
    const [profile, setProfile] = React.useState<BreedingProgramProfile>(EMPTY_PROFILE);

    // Business Identity state (from marketplace draft)
    const [bizIdentity, setBizIdentity] = React.useState<BusinessIdentityDraft>(createEmptyBusinessIdentity);
    const [bizIdentityInit, setBizIdentityInit] = React.useState<BusinessIdentityDraft>(createEmptyBusinessIdentity);

    const isDirty = React.useMemo(() => {
      const profileDirty = JSON.stringify(profile) !== JSON.stringify(profileInit);
      const bizDirty = JSON.stringify(bizIdentity) !== JSON.stringify(bizIdentityInit);
      return profileDirty || bizDirty;
    }, [profile, profileInit, bizIdentity, bizIdentityInit]);
    React.useEffect(() => onDirty(isDirty), [isDirty, onDirty]);

    React.useEffect(() => {
      let ignore = false;
      (async () => {
        try {
          setLoading(true); setError("");
          const tenantId = await resolveTenantIdSafe();
          if (!tenantId) throw new Error("Missing tenant id");

          // Load breeding program profile
          let profMerged: BreedingProgramProfile;
          try {
            const pr = await api.breeding.program.getForTenant(Number(tenantId));
            const prData = (pr?.data ?? pr) as Partial<BreedingProgramProfile> | undefined;
            const safePublication = prData?.publication ?? { publishInDirectory: false, summary: null };
            profMerged = { ...EMPTY_PROFILE, ...(prData || {}), publication: safePublication };
          } catch (e: any) {
            if (e?.status === 404) profMerged = { ...EMPTY_PROFILE };
            else { profMerged = { ...EMPTY_PROFILE }; setError(e?.message || "Program profile load failed"); }
          }

          // Load marketplace draft for business identity
          let bizMerged: BusinessIdentityDraft = createEmptyBusinessIdentity();
          try {
            const mpRes = await fetch("/api/v1/marketplace/profile", {
              credentials: "include",
              headers: { Accept: "application/json", "X-Tenant-Id": String(tenantId) },
            });
            if (mpRes.ok) {
              const mpData = await mpRes.json();
              if (mpData.draft) {
                bizMerged = {
                  businessName: mpData.draft.businessName || "",
                  logoAssetId: mpData.draft.logoAssetId || null,
                  bio: mpData.draft.bio || "",
                  showBusinessIdentity: mpData.draft.showBusinessIdentity ?? true,
                  websiteUrl: mpData.draft.websiteUrl || "",
                  showWebsite: mpData.draft.showWebsite ?? false,
                  instagram: mpData.draft.instagram || "",
                  showInstagram: mpData.draft.showInstagram ?? false,
                  facebook: mpData.draft.facebook || "",
                  showFacebook: mpData.draft.showFacebook ?? false,
                  address: { ...createEmptyBusinessIdentity().address, ...(mpData.draft.address || {}) },
                  publicLocationMode: mpData.draft.publicLocationMode === "hidden" ? "city_state" : (mpData.draft.publicLocationMode || "city_state"),
                  searchParticipation: { ...createEmptyBusinessIdentity().searchParticipation, ...(mpData.draft.searchParticipation || {}) },
                };
              }
            }
          } catch (e) {
            console.error("Failed to load marketplace profile:", e);
          }

          if (!ignore) {
            setProfileInit(profMerged); setProfile(profMerged);
            setBizIdentityInit(bizMerged); setBizIdentity(bizMerged);
          }
        } catch (e: any) {
          if (!ignore) setError(e?.message || "Failed to load Program Profile");
        } finally { if (!ignore) setLoading(false); }
      })();
      return () => { ignore = true; };
    }, []);

    // Business identity updaters
    function updateBizIdentity<K extends keyof BusinessIdentityDraft>(key: K, value: BusinessIdentityDraft[K]) {
      setBizIdentity((prev) => ({ ...prev, [key]: value }));
    }
    function updateAddress<K extends keyof BusinessIdentityDraft["address"]>(key: K, value: string) {
      setBizIdentity((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }));
    }
    function updateSearchParticipation<K extends keyof BusinessIdentityDraft["searchParticipation"]>(key: K, value: boolean) {
      setBizIdentity((prev) => ({ ...prev, searchParticipation: { ...prev.searchParticipation, [key]: value } }));
    }

    async function saveProfile() {
      setError("");
      try {
        const tenantRaw = await resolveTenantId();
        const tenantId = String(tenantRaw ?? "").trim();
        if (!tenantId) throw new Error("Missing tenant id");

        // Save breeding program profile
        const safeBody = { ...profile, publication: profile.publication ?? { publishInDirectory: false, summary: null } };
        const prSaved = await api.breeding.program.updateForTenant(safeBody, Number(tenantId));
        const normalized = (prSaved?.data ?? prSaved) as BreedingProgramProfile;
        setProfileInit(normalized); setProfile(normalized);

        // Save marketplace draft (merge with existing draft to preserve other fields)
        const mpRes = await fetch("/api/v1/marketplace/profile", {
          credentials: "include",
          headers: { Accept: "application/json", "X-Tenant-Id": tenantId },
        });
        let existingDraft: Record<string, unknown> = {};
        let isPublished = false;
        if (mpRes.ok) {
          const mpData = await mpRes.json();
          existingDraft = mpData.draft || {};
          isPublished = !!mpData.published;
        }

        const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") ||
          (document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/) || [])[1];
        const mergedDraft = {
          ...existingDraft,
          businessName: bizIdentity.businessName,
          logoAssetId: bizIdentity.logoAssetId,
          bio: bizIdentity.bio,
          showBusinessIdentity: bizIdentity.showBusinessIdentity,
          websiteUrl: bizIdentity.websiteUrl,
          showWebsite: bizIdentity.showWebsite,
          instagram: bizIdentity.instagram,
          showInstagram: bizIdentity.showInstagram,
          facebook: bizIdentity.facebook,
          showFacebook: bizIdentity.showFacebook,
          address: bizIdentity.address,
          publicLocationMode: bizIdentity.publicLocationMode,
          searchParticipation: bizIdentity.searchParticipation,
        };

        // Save draft
        await fetch("/api/v1/marketplace/profile/draft", {
          method: "PUT",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Tenant-Id": tenantId,
            ...(csrf ? { "X-CSRF-Token": csrf } : {}),
          },
          body: JSON.stringify(mergedDraft),
        });

        // If already published, also republish to update public listing immediately
        if (isPublished) {
          // Build publish payload with required fields
          const listedBreeds = Array.isArray(mergedDraft.listedBreeds) ? mergedDraft.listedBreeds : [];
          const programs = Array.isArray(mergedDraft.programs) ? mergedDraft.programs : [];
          const listedPrograms = programs
            .filter((p: any) => p.status)
            .map((p: any) => ({
              name: p.name,
              description: p.description,
              acceptInquiries: p.acceptInquiries,
              openWaitlist: p.openWaitlist,
              comingSoon: p.comingSoon,
            }));

          const publishPayload = {
            ...mergedDraft,
            breeds: listedBreeds.map((name: string) => ({ name })),
            listedPrograms,
          };

          await fetch("/api/v1/marketplace/profile/publish", {
            method: "POST",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "X-Tenant-Id": tenantId,
              ...(csrf ? { "X-CSRF-Token": csrf } : {}),
            },
            body: JSON.stringify(publishPayload),
          });
        }

        setBizIdentityInit(bizIdentity);

        onDirty(false);
      } catch (e: any) {
        setError(e?.message || "Program profile save failed");
      }
    }

    // Cancel editing and revert to saved values
    function cancelEdit() {
      setProfile(profileInit);
      setBizIdentity(bizIdentityInit);
      onDirty(false);
    }

    React.useImperativeHandle(ref, () => ({
      async save() { await saveProfile(); },
      cancel() { cancelEdit(); },
    }));

    // Static badge for always-private fields
    const PrivateBadge = () => (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-zinc-500/15 text-zinc-400 font-medium">
        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
        Private
      </span>
    );

    return (
      <div className="space-y-4">
        {loading ? <div className="text-sm text-secondary">Loading…</div> : (
          <>
            {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}

            <div className="space-y-6">
                {/* Business Identity Section */}
                <SectionCard
                  title={
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏢</span>
                      <div className="flex-1">
                        <div className="text-base font-semibold text-primary">Business Identity</div>
                        <div className="text-xs text-secondary font-normal">Your program name, logo, and description</div>
                      </div>
                    </div>
                  }
                  right={
                    <VisibilityToggle
                      isPublic={bizIdentity.showBusinessIdentity}
                      onChange={(v) => updateBizIdentity("showBusinessIdentity", v)}
                      disabled={!editMode}
                    />
                  }
                >
                  <div className={`space-y-5 pt-2 ${!bizIdentity.showBusinessIdentity ? "opacity-60" : ""} ${!editMode ? "pointer-events-none" : ""}`}>
                    {/* Business Name */}
                    <div>
                      <label className="text-sm font-medium text-primary mb-1.5 block">Business Name</label>
                      <input
                        type="text"
                        value={bizIdentity.businessName}
                        onChange={(e) => updateBizIdentity("businessName", e.target.value)}
                        placeholder="Your breeding program name"
                        disabled={!editMode}
                        className={`bhq-input ${INPUT_CLS} w-full ${!editMode ? "opacity-70 cursor-not-allowed" : ""}`}
                      />
                    </div>

                    {/* About Your Program (Bio) */}
                    <div>
                      <label className="text-sm font-medium text-primary mb-1.5 block">About Your Program</label>
                      <textarea
                        value={bizIdentity.bio}
                        onChange={(e) => updateBizIdentity("bio", e.target.value.slice(0, 500))}
                        placeholder="Tell potential clients about your breeding program, your experience, and what makes you unique..."
                        rows={4}
                        disabled={!editMode}
                        className={`bhq-input ${INPUT_CLS} w-full resize-none ${!editMode ? "opacity-70 cursor-not-allowed" : ""}`}
                      />
                      <div className="text-xs text-secondary text-right mt-1">{bizIdentity.bio.length}/500</div>
                    </div>

                    {/* Logo */}
                    <div>
                      <label className="text-sm font-medium text-primary mb-1.5 block">Logo</label>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-surface-strong border-2 border-dashed border-hairline flex items-center justify-center text-xl text-secondary shrink-0">
                          🐾
                        </div>
                        <div className="flex-1">
                          <button type="button" disabled={!editMode} className={`bhq-btn bhq-btn-secondary text-xs px-3 py-1.5 ${!editMode ? "opacity-50 cursor-not-allowed" : ""}`}>Upload</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* Website & Social Links Section */}
                <SectionCard
                  title={
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌐</span>
                      <div>
                        <div className="text-base font-semibold text-primary">Website & Social Links</div>
                        <div className="text-xs text-secondary font-normal">Control visibility for each link individually</div>
                      </div>
                    </div>
                  }
                >
                  <div className={`space-y-4 pt-2 ${!editMode ? "pointer-events-none" : ""}`}>
                    {/* Website */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm font-medium text-primary">Website</span>
                        </div>
                        <input
                          type="url"
                          value={bizIdentity.websiteUrl}
                          onChange={(e) => updateBizIdentity("websiteUrl", e.target.value)}
                          placeholder="https://yoursite.com"
                          disabled={!editMode}
                          className={`bhq-input ${INPUT_CLS} w-full ${!editMode ? "opacity-70 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <div className="pt-5">
                        <VisibilityToggle
                          isPublic={bizIdentity.showWebsite}
                          onChange={(v) => updateBizIdentity("showWebsite", v)}
                          disabled={!editMode}
                        />
                      </div>
                    </div>

                    {/* Instagram & Facebook */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm font-medium text-primary">Instagram</span>
                          </div>
                          <input
                            type="text"
                            value={bizIdentity.instagram}
                            onChange={(e) => updateBizIdentity("instagram", e.target.value)}
                            placeholder="@yourbusiness"
                            disabled={!editMode}
                            className={`bhq-input ${INPUT_CLS} w-full ${!editMode ? "opacity-70 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <div className="pt-5">
                          <VisibilityToggle
                            isPublic={bizIdentity.showInstagram}
                            onChange={(v) => updateBizIdentity("showInstagram", v)}
                            disabled={!editMode}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm font-medium text-primary">Facebook</span>
                          </div>
                          <input
                            type="text"
                            value={bizIdentity.facebook}
                            onChange={(e) => updateBizIdentity("facebook", e.target.value)}
                            placeholder="YourPage"
                            disabled={!editMode}
                            className={`bhq-input ${INPUT_CLS} w-full ${!editMode ? "opacity-70 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <div className="pt-5">
                          <VisibilityToggle
                            isPublic={bizIdentity.showFacebook}
                            onChange={(v) => updateBizIdentity("showFacebook", v)}
                            disabled={!editMode}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* Location Section */}
                <SectionCard
                  title={
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📍</span>
                      <div>
                        <div className="text-base font-semibold text-primary">Location</div>
                        <div className="text-xs text-secondary font-normal">Control what location details are visible on the marketplace</div>
                      </div>
                    </div>
                  }
                >
                  <div className={`space-y-5 pt-2 ${!editMode ? "pointer-events-none" : ""}`}>
                    {/* Address Fields */}
                    <div className="bg-surface-strong/50 rounded-lg p-4 border border-hairline">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-primary">Your Address</span>
                        <PrivateBadge />
                      </div>
                      <p className="text-xs text-secondary mb-3">Your full address is never shown publicly. Use the options below to choose what location info to display.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="md:col-span-2">
                          <div className="text-xs text-secondary mb-1">Street Address</div>
                          <input
                            type="text"
                            value={bizIdentity.address.street}
                            onChange={(e) => updateAddress("street", e.target.value)}
                            placeholder="123 Main St"
                            disabled={!editMode}
                            className={`bhq-input ${INPUT_CLS} w-full ${!editMode ? "opacity-70 cursor-not-allowed" : ""}`}
                          />
                        </label>
                        <label>
                          <div className="text-xs text-secondary mb-1">City</div>
                          <input
                            type="text"
                            value={bizIdentity.address.city}
                            onChange={(e) => updateAddress("city", e.target.value)}
                            placeholder="City"
                            disabled={!editMode}
                            className={`bhq-input ${INPUT_CLS} w-full ${!editMode ? "opacity-70 cursor-not-allowed" : ""}`}
                          />
                        </label>
                        <label>
                          <div className="text-xs text-secondary mb-1">State/Province</div>
                          <input
                            type="text"
                            value={bizIdentity.address.state}
                            onChange={(e) => updateAddress("state", e.target.value)}
                            placeholder="State"
                            disabled={!editMode}
                            className={`bhq-input ${INPUT_CLS} w-full ${!editMode ? "opacity-70 cursor-not-allowed" : ""}`}
                          />
                        </label>
                        <label>
                          <div className="text-xs text-secondary mb-1">ZIP/Postal Code</div>
                          <input
                            type="text"
                            value={bizIdentity.address.zip}
                            onChange={(e) => updateAddress("zip", e.target.value)}
                            placeholder="12345"
                            disabled={!editMode}
                            className={`bhq-input ${INPUT_CLS} w-full ${!editMode ? "opacity-70 cursor-not-allowed" : ""}`}
                          />
                        </label>
                        <label>
                          <div className="text-xs text-secondary mb-1">Country</div>
                          <input
                            type="text"
                            value={bizIdentity.address.country}
                            onChange={(e) => updateAddress("country", e.target.value)}
                            placeholder="Country"
                            disabled={!editMode}
                            className={`bhq-input ${INPUT_CLS} w-full ${!editMode ? "opacity-70 cursor-not-allowed" : ""}`}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Location Visibility */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-primary">What buyers see</span>
                      </div>
                      <p className="text-xs text-secondary mb-3">Choose how your location appears on your marketplace profile</p>
                      <div className="flex flex-wrap gap-2">
                        {([
                          { value: "city_state", label: "City + State" },
                          { value: "full", label: "City, State + ZIP" },
                          { value: "zip_only", label: "ZIP Code Only" },
                        ] as const).map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={!editMode}
                            onClick={() => updateBizIdentity("publicLocationMode", opt.value)}
                            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                              bizIdentity.publicLocationMode === opt.value
                                ? "bg-[hsl(var(--brand-orange))] text-white border-[hsl(var(--brand-orange))] font-medium"
                                : "bg-surface border-hairline text-secondary hover:text-primary hover:border-[hsl(var(--brand-orange))]/50"
                            } ${!editMode ? "opacity-70 cursor-not-allowed" : ""}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </SectionCard>
            </div>
          </>
        )}
      </div>
    );
  }
);

/** ───────── Breeds Types ───────── */
type BreedsSpecies = "DOG" | "CAT" | "HORSE" | "GOAT" | "SHEEP" | "RABBIT";
type BreedsSpeciesUI = "Dog" | "Cat" | "Horse" | "Goat" | "Sheep" | "Rabbit";
type SelectedBreed = {
  id: string | number;
  breedId?: number | null;       // For canonical breeds
  customBreedId?: number | null; // For custom breeds
  name: string;
  species: BreedsSpeciesUI;
  source: "canonical" | "custom";
};

function toUiSpecies(api: string): BreedsSpeciesUI {
  const up = String(api).toUpperCase();
  if (up === "DOG") return "Dog";
  if (up === "CAT") return "Cat";
  if (up === "HORSE") return "Horse";
  if (up === "GOAT") return "Goat";
  if (up === "SHEEP") return "Sheep";
  if (up === "RABBIT") return "Rabbit";
  return "Dog";
}

/** ───────── Standalone BreedsTab ───────── */
type BreedsHandle = { save: () => Promise<void> };
const BreedsTab = React.forwardRef<BreedsHandle, { dirty: boolean; onDirty: (v: boolean) => void }>(
  function BreedsTab({ onDirty }, ref) {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string>("");
    const [selectedBreeds, setSelectedBreeds] = React.useState<SelectedBreed[]>([]);
    const [initialBreeds, setInitialBreeds] = React.useState<SelectedBreed[]>([]);
    const [breedsSpecies, setBreedsSpecies] = React.useState<BreedsSpeciesUI>("Dog");
    const [selectedBreed, setSelectedBreed] = React.useState<BreedHit | null>(null);
    const [customBreedOpen, setCustomBreedOpen] = React.useState(false);

    const SPECIES_OPTIONS: BreedsSpeciesUI[] = ["Dog", "Cat", "Horse", "Goat", "Sheep", "Rabbit"];
    function toApiSpecies(ui: BreedsSpeciesUI): BreedsSpecies {
      return ui.toUpperCase() as BreedsSpecies;
    }

    const isDirty = React.useMemo(() => {
      const currentBreedIds = selectedBreeds.map(b => `${b.id}-${b.species}`).sort().join(",");
      const initialBreedIds = initialBreeds.map(b => `${b.id}-${b.species}`).sort().join(",");
      return currentBreedIds !== initialBreedIds;
    }, [selectedBreeds, initialBreeds]);
    React.useEffect(() => onDirty(isDirty), [isDirty, onDirty]);

    React.useEffect(() => {
      let ignore = false;
      (async () => {
        try {
          setLoading(true); setError("");
          let breedsMapped: SelectedBreed[] = [];
          const breedsRes = await fetchJson("/api/v1/breeds/program");
          const breedsData = (breedsRes as any)?.data || [];
          breedsMapped = breedsData.map((b: any) => ({
            id: b.source === "custom" ? `custom-${b.customBreedId}` : `breed-${b.breedId}`,
            breedId: b.breedId ?? null,
            customBreedId: b.customBreedId ?? null,
            name: b.name,
            species: toUiSpecies(b.species),
            source: b.source,
          }));
          if (!ignore) {
            setSelectedBreeds(breedsMapped);
            setInitialBreeds(breedsMapped);
          }
        } catch (e: any) {
          if (!ignore) setError(e?.message || "Failed to load breeds");
        } finally { if (!ignore) setLoading(false); }
      })();
      return () => { ignore = true; };
    }, []);

    function addBreed(hit: BreedHit) {
      const exists = selectedBreeds.some(
        (b) => b.name.toLowerCase() === hit.name.toLowerCase() && b.species === hit.species
      );
      if (exists) {
        setError(`"${hit.name}" is already in your breeding program.`);
        return;
      }
      const isCustom = hit.source === "custom";
      const breedId = isCustom ? null : (hit.canonicalBreedId ?? (typeof hit.id === "number" ? hit.id : null));
      const customBreedId = isCustom ? (typeof hit.id === "number" ? hit.id : null) : null;

      setSelectedBreeds((prev) => [
        ...prev,
        {
          id: isCustom ? `custom-${customBreedId}` : `breed-${breedId}`,
          breedId,
          customBreedId,
          name: hit.name,
          species: hit.species,
          source: hit.source,
        },
      ]);
      setSelectedBreed(null);
      setError("");
    }
    function removeBreed(id: string | number) {
      setSelectedBreeds((prev) => prev.filter((b) => b.id !== id));
    }
    const breedsBySpecies = SPECIES_OPTIONS.map((sp) => ({
      species: sp,
      breeds: selectedBreeds.filter((b) => b.species === sp),
    })).filter((g) => g.breeds.length > 0);

    async function saveBreeds() {
      setError("");
      try {
        const breedsPayload = selectedBreeds.map((b) => ({
          breedId: b.source === "canonical" ? b.breedId : null,
          customBreedId: b.source === "custom" ? b.customBreedId : null,
          species: toApiSpecies(b.species),
        }));
        const breedsRes = await fetchJson("/api/v1/breeds/program", {
          method: "PUT",
          body: JSON.stringify({ breeds: breedsPayload }),
        });
        const breedsData = (breedsRes as any)?.data || [];
        const breedsMapped: SelectedBreed[] = breedsData.map((b: any) => ({
          id: b.source === "custom" ? `custom-${b.customBreedId}` : `breed-${b.breedId}`,
          breedId: b.breedId ?? null,
          customBreedId: b.customBreedId ?? null,
          name: b.name,
          species: toUiSpecies(b.species),
          source: b.source,
        }));
        setSelectedBreeds(breedsMapped);
        setInitialBreeds(breedsMapped);
        onDirty(false);
      } catch (e: any) {
        setError(e?.message || "Breeds save failed");
      }
    }
    React.useImperativeHandle(ref, () => ({ async save() { await saveBreeds(); } }));

    return (
      <div className="space-y-6">
        {loading ? <div className="text-sm text-secondary">Loading…</div> : (
          <>
            {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}

            {/* Header */}
            <div>
              <h3 className="text-lg font-semibold">Breeding Program Breeds</h3>
              <p className="text-sm text-secondary mt-1">
                Select the breeds you work with in your breeding program. These will be available for marketplace listings.
              </p>
            </div>

            {/* Add Breed Section */}
            <Card className="p-5 space-y-4 relative z-10 overflow-visible">
              <h4 className="font-medium">Add Breed</h4>

              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr_auto] gap-3 items-end">
                {/* Species Select */}
                <div>
                  <div className="mb-1 text-xs text-secondary">Species</div>
                  <select
                    className="h-10 w-full rounded-md border border-hairline bg-surface px-3 text-sm text-primary"
                    value={breedsSpecies}
                    onChange={(e) => {
                      setBreedsSpecies(e.currentTarget.value as BreedsSpeciesUI);
                      setSelectedBreed(null);
                    }}
                  >
                    {SPECIES_OPTIONS.map((sp) => (
                      <option key={sp} value={sp}>{sp}</option>
                    ))}
                  </select>
                </div>

                {/* Breed Combo */}
                <div className="relative">
                  <div className="mb-1 text-xs text-secondary">Breed</div>
                  <BreedCombo
                    species={breedsSpecies}
                    value={selectedBreed}
                    onChange={(hit) => {
                      if (hit) {
                        addBreed(hit);
                      } else {
                        setSelectedBreed(null);
                      }
                    }}
                  />
                </div>

                {/* New Custom Button */}
                <div>
                  <Button
                    variant="secondary"
                    onClick={() => setCustomBreedOpen(true)}
                  >
                    New Custom
                  </Button>
                </div>
              </div>
            </Card>

            {/* Selected Breeds Display */}
            <Card className="p-5 space-y-4 relative z-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Your Breeds</h4>
                <span className="text-sm text-secondary">{selectedBreeds.length} breed{selectedBreeds.length !== 1 ? "s" : ""}</span>
              </div>

              {selectedBreeds.length === 0 ? (
                <div className="text-center py-8 text-secondary">
                  <p>No breeds selected yet.</p>
                  <p className="text-sm mt-1">Use the form above to add breeds to your program.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {breedsBySpecies.map(({ species: sp, breeds }) => (
                    <div key={sp}>
                      <div className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">{sp}s</div>
                      <div className="flex flex-wrap gap-2">
                        {breeds.map((b) => (
                          <span
                            key={b.id}
                            className="inline-flex items-center gap-2 text-sm bg-surface-strong px-3 py-1.5 rounded-full border border-hairline"
                          >
                            {b.name}
                            {b.source === "custom" && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                                Custom
                              </span>
                            )}
                            <button
                              type="button"
                              className="text-secondary hover:text-red-400 transition-colors"
                              onClick={() => removeBreed(b.id)}
                              title="Remove breed"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Custom Breed Dialog */}
            {getOverlayRoot() && createPortal(
              <CustomBreedDialog
                open={customBreedOpen}
                onClose={() => setCustomBreedOpen(false)}
                api={{
                  breeds: {
                    customCreate: async (payload) => {
                      const res = await fetchJson("/api/v1/breeds/custom", {
                        method: "POST",
                        body: JSON.stringify(payload),
                      });
                      if (res?.error) throw new Error(res?.message || "Create failed");
                      return res;
                    },
                  },
                }}
                species={toApiSpecies(breedsSpecies)}
                onCreated={(created) => {
                  addBreed({
                    id: created.id,
                    name: created.name,
                    species: breedsSpecies,
                    source: "custom",
                  });
                  setCustomBreedOpen(false);
                }}
              />,
              getOverlayRoot()!
            )}
          </>
        )}
      </div>
    );
  }
);

/** ───────── Standalone PoliciesTab ───────── */
type PoliciesHandle = { save: () => Promise<void> };
type PoliciesProfile = {
  cyclePolicy: {
    minDamAgeMonths: number;
    minHeatsBetween: number;
    maxLittersLifetime: number;
    retireAfterAgeMonths: number | null;
    retireRule: "age_only" | "litters_only" | "either";
  };
  placement: {
    earliestDaysFromBirth: number;
    standardDaysFromBirth: number;
    healthGuaranteeMonths: number;
    depositAmountUSD: number | null;
  };
  placementPolicies: {
    requireApplication: boolean;
    showRequireApplication: boolean;
    requireInterview: boolean;
    showRequireInterview: boolean;
    requireContract: boolean;
    showRequireContract: boolean;
    hasReturnPolicy: boolean;
    showHasReturnPolicy: boolean;
    offersSupport: boolean;
    showOffersSupport: boolean;
    note: string;
    showNote: boolean;
  };
};
const EMPTY_POLICIES: PoliciesProfile = {
  cyclePolicy: { minDamAgeMonths: 18, minHeatsBetween: 1, maxLittersLifetime: 4, retireAfterAgeMonths: null, retireRule: "either" },
  placement: { earliestDaysFromBirth: 56, standardDaysFromBirth: 63, healthGuaranteeMonths: 24, depositAmountUSD: 300 },
  placementPolicies: {
    requireApplication: false,
    showRequireApplication: false,
    requireInterview: false,
    showRequireInterview: false,
    requireContract: false,
    showRequireContract: false,
    hasReturnPolicy: false,
    showHasReturnPolicy: false,
    offersSupport: false,
    showOffersSupport: false,
    note: "",
    showNote: false,
  },
};

const PoliciesTab = React.forwardRef<PoliciesHandle, { dirty: boolean; onDirty: (v: boolean) => void }>(
  function PoliciesTab({ onDirty }, ref) {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string>("");
    const [profile, setProfile] = React.useState<PoliciesProfile>(EMPTY_POLICIES);
    const [profileInit, setProfileInit] = React.useState<PoliciesProfile>(EMPTY_POLICIES);

    const isDirty = React.useMemo(() => {
      return JSON.stringify(profile) !== JSON.stringify(profileInit);
    }, [profile, profileInit]);
    React.useEffect(() => onDirty(isDirty), [isDirty, onDirty]);

    React.useEffect(() => {
      let ignore = false;
      (async () => {
        try {
          setLoading(true); setError("");
          const tenantId = await resolveTenantIdSafe();
          if (!tenantId) throw new Error("Missing tenant id");
          const pr = await api.breeding.program.getForTenant(Number(tenantId));
          const prData = (pr?.data ?? pr) as Partial<BreedingProgramProfile> | undefined;
          const loaded: PoliciesProfile = {
            cyclePolicy: {
              minDamAgeMonths: prData?.cyclePolicy?.minDamAgeMonths ?? 18,
              minHeatsBetween: prData?.cyclePolicy?.minHeatsBetween ?? 1,
              maxLittersLifetime: prData?.cyclePolicy?.maxLittersLifetime ?? 4,
              retireAfterAgeMonths: prData?.cyclePolicy?.retireAfterAgeMonths ?? null,
              retireRule: (prData?.cyclePolicy as any)?.retireRule ?? "either",
            },
            placement: {
              earliestDaysFromBirth: prData?.placement?.earliestDaysFromBirth ?? 56,
              standardDaysFromBirth: prData?.placement?.standardDaysFromBirth ?? 63,
              healthGuaranteeMonths: prData?.placement?.healthGuaranteeMonths ?? 24,
              depositAmountUSD: prData?.placement?.depositAmountUSD ?? 300,
            },
            placementPolicies: {
              requireApplication: (prData as any)?.placementPolicies?.requireApplication ?? false,
              showRequireApplication: (prData as any)?.placementPolicies?.showRequireApplication ?? false,
              requireInterview: (prData as any)?.placementPolicies?.requireInterview ?? false,
              showRequireInterview: (prData as any)?.placementPolicies?.showRequireInterview ?? false,
              requireContract: (prData as any)?.placementPolicies?.requireContract ?? false,
              showRequireContract: (prData as any)?.placementPolicies?.showRequireContract ?? false,
              hasReturnPolicy: (prData as any)?.placementPolicies?.hasReturnPolicy ?? false,
              showHasReturnPolicy: (prData as any)?.placementPolicies?.showHasReturnPolicy ?? false,
              offersSupport: (prData as any)?.placementPolicies?.offersSupport ?? false,
              showOffersSupport: (prData as any)?.placementPolicies?.showOffersSupport ?? false,
              note: (prData as any)?.placementPolicies?.note ?? "",
              showNote: (prData as any)?.placementPolicies?.showNote ?? false,
            },
          };
          if (!ignore) {
            setProfile(loaded);
            setProfileInit(loaded);
          }
        } catch (e: any) {
          if (!ignore) setError(e?.message || "Failed to load policies");
        } finally { if (!ignore) setLoading(false); }
      })();
      return () => { ignore = true; };
    }, []);

    async function savePolicies() {
      setError("");
      try {
        const tenantId = await resolveTenantId();
        if (!tenantId) throw new Error("Missing tenant id");
        // We need to merge with existing profile data, so load first
        const existing = await api.breeding.program.getForTenant(Number(tenantId));
        const existingData = (existing?.data ?? existing) as BreedingProgramProfile | undefined;
        const merged = {
          ...existingData,
          cyclePolicy: { ...existingData?.cyclePolicy, ...profile.cyclePolicy },
          placement: { ...existingData?.placement, ...profile.placement },
          placementPolicies: { ...(existingData as any)?.placementPolicies, ...profile.placementPolicies },
        };
        await api.breeding.program.updateForTenant(merged, Number(tenantId));
        setProfileInit(profile);
        onDirty(false);
      } catch (e: any) {
        setError(e?.message || "Policies save failed");
      }
    }
    React.useImperativeHandle(ref, () => ({ async save() { await savePolicies(); } }));

    return (
      <div className="space-y-4">
        {loading ? <div className="text-sm text-secondary">Loading…</div> : (
          <>
            {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}

            {/* Header */}
            <div>
              <h3 className="text-lg font-semibold">Breeding Policies</h3>
              <p className="text-sm text-secondary mt-1">
                Configure your breeding program's cycle and placement policies.
              </p>
            </div>

            <div className="rounded-md border border-hairline p-3">
              <div className="text-sm font-medium mb-2">Cycle policy</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <FieldNum label="Min dam age (mo)" value={profile.cyclePolicy.minDamAgeMonths} onChange={(n) => setProfile(p => ({ ...p, cyclePolicy: { ...p.cyclePolicy, minDamAgeMonths: n } }))} />
                <FieldNum label="Min heats between" value={profile.cyclePolicy.minHeatsBetween} onChange={(n) => setProfile(p => ({ ...p, cyclePolicy: { ...p.cyclePolicy, minHeatsBetween: n } }))} />
                <FieldNum label="Max litters lifetime" value={profile.cyclePolicy.maxLittersLifetime} onChange={(n) => setProfile(p => ({ ...p, cyclePolicy: { ...p.cyclePolicy, maxLittersLifetime: n } }))} />
                <FieldNum label="Retire after age (mo)" value={profile.cyclePolicy.retireAfterAgeMonths ?? 0} onChange={(n) => setProfile(p => ({ ...p, cyclePolicy: { ...p.cyclePolicy, retireAfterAgeMonths: n || null } }))} />
              </div>
              <label className="space-y-1 md:col-span-2">
                <div className="text-xs text-secondary">Retirement rule</div>
                <select className={`bhq-input ${INPUT_CLS} w-full`} value={profile.cyclePolicy.retireRule || "either"} onChange={(e) => setProfile(p => ({ ...p, cyclePolicy: { ...p.cyclePolicy, retireRule: e.currentTarget.value as any } }))}>
                  <option value="either">After age or after X breedings</option>
                  <option value="age_only">After age only</option>
                  <option value="litters_only">After X breedings only</option>
                </select>
                <Hint>Uses "Retire after age (mo)" and "Max litters lifetime." "Either" means whichever happens first.</Hint>
              </label>
            </div>

            <div className="rounded-md border border-hairline p-3">
              <div className="text-sm font-medium mb-2">Placement</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <FieldNum label="Earliest days from birth" value={profile.placement.earliestDaysFromBirth} onChange={(n) => setProfile(p => ({ ...p, placement: { ...p.placement, earliestDaysFromBirth: n } }))} />
                <FieldNum label="Standard days from birth" value={profile.placement.standardDaysFromBirth} onChange={(n) => setProfile(p => ({ ...p, placement: { ...p.placement, standardDaysFromBirth: n } }))} />
                <FieldNum label="Guarantee months" value={profile.placement.healthGuaranteeMonths} onChange={(n) => setProfile(p => ({ ...p, placement: { ...p.placement, healthGuaranteeMonths: n } }))} />
                <FieldNum label="Deposit amount USD" value={profile.placement.depositAmountUSD ?? 0} onChange={(n) => setProfile(p => ({ ...p, placement: { ...p.placement, depositAmountUSD: n || null } }))} />
              </div>
            </div>

            <div className="rounded-md border border-hairline p-3 space-y-3">
              <div>
                <div className="text-sm font-medium mb-1">Marketplace Placement Policies</div>
                <div className="text-xs text-secondary">Control which policies are displayed on your marketplace profile. Toggle visibility for each policy.</div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-hairline">
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={profile.placementPolicies.requireApplication}
                      onChange={(e) => setProfile(p => ({ ...p, placementPolicies: { ...p.placementPolicies, requireApplication: e.target.checked } }))}
                      className="w-4 h-4 rounded border-hairline bg-card accent-blue-500"
                    />
                    <span className="text-sm">Require application</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="text-xs text-secondary">Show in marketplace</span>
                    <input
                      type="checkbox"
                      checked={profile.placementPolicies.showRequireApplication}
                      onChange={(e) => setProfile(p => ({ ...p, placementPolicies: { ...p.placementPolicies, showRequireApplication: e.target.checked } }))}
                      disabled={!profile.placementPolicies.requireApplication}
                      className="w-4 h-4 rounded border-hairline bg-card accent-[hsl(var(--brand-orange))]"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-hairline">
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={profile.placementPolicies.requireInterview}
                      onChange={(e) => setProfile(p => ({ ...p, placementPolicies: { ...p.placementPolicies, requireInterview: e.target.checked } }))}
                      className="w-4 h-4 rounded border-hairline bg-card accent-blue-500"
                    />
                    <span className="text-sm">Require interview/meeting</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="text-xs text-secondary">Show in marketplace</span>
                    <input
                      type="checkbox"
                      checked={profile.placementPolicies.showRequireInterview}
                      onChange={(e) => setProfile(p => ({ ...p, placementPolicies: { ...p.placementPolicies, showRequireInterview: e.target.checked } }))}
                      disabled={!profile.placementPolicies.requireInterview}
                      className="w-4 h-4 rounded border-hairline bg-card accent-[hsl(var(--brand-orange))]"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-hairline">
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={profile.placementPolicies.requireContract}
                      onChange={(e) => setProfile(p => ({ ...p, placementPolicies: { ...p.placementPolicies, requireContract: e.target.checked } }))}
                      className="w-4 h-4 rounded border-hairline bg-card accent-blue-500"
                    />
                    <span className="text-sm">Require signed contract</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="text-xs text-secondary">Show in marketplace</span>
                    <input
                      type="checkbox"
                      checked={profile.placementPolicies.showRequireContract}
                      onChange={(e) => setProfile(p => ({ ...p, placementPolicies: { ...p.placementPolicies, showRequireContract: e.target.checked } }))}
                      disabled={!profile.placementPolicies.requireContract}
                      className="w-4 h-4 rounded border-hairline bg-card accent-[hsl(var(--brand-orange))]"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-hairline">
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={profile.placementPolicies.hasReturnPolicy}
                      onChange={(e) => setProfile(p => ({ ...p, placementPolicies: { ...p.placementPolicies, hasReturnPolicy: e.target.checked } }))}
                      className="w-4 h-4 rounded border-hairline bg-card accent-blue-500"
                    />
                    <span className="text-sm">Lifetime return policy</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="text-xs text-secondary">Show in marketplace</span>
                    <input
                      type="checkbox"
                      checked={profile.placementPolicies.showHasReturnPolicy}
                      onChange={(e) => setProfile(p => ({ ...p, placementPolicies: { ...p.placementPolicies, showHasReturnPolicy: e.target.checked } }))}
                      disabled={!profile.placementPolicies.hasReturnPolicy}
                      className="w-4 h-4 rounded border-hairline bg-card accent-[hsl(var(--brand-orange))]"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-hairline">
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={profile.placementPolicies.offersSupport}
                      onChange={(e) => setProfile(p => ({ ...p, placementPolicies: { ...p.placementPolicies, offersSupport: e.target.checked } }))}
                      className="w-4 h-4 rounded border-hairline bg-card accent-blue-500"
                    />
                    <span className="text-sm">Ongoing breeder support</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="text-xs text-secondary">Show in marketplace</span>
                    <input
                      type="checkbox"
                      checked={profile.placementPolicies.showOffersSupport}
                      onChange={(e) => setProfile(p => ({ ...p, placementPolicies: { ...p.placementPolicies, showOffersSupport: e.target.checked } }))}
                      disabled={!profile.placementPolicies.offersSupport}
                      className="w-4 h-4 rounded border-hairline bg-card accent-[hsl(var(--brand-orange))]"
                    />
                  </label>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Additional Placement Notes</label>
                    <label className="flex items-center gap-2">
                      <span className="text-xs text-secondary">Show in marketplace</span>
                      <input
                        type="checkbox"
                        checked={profile.placementPolicies.showNote}
                        onChange={(e) => setProfile(p => ({ ...p, placementPolicies: { ...p.placementPolicies, showNote: e.target.checked } }))}
                        disabled={!profile.placementPolicies.note.trim()}
                        className="w-4 h-4 rounded border-hairline bg-card accent-[hsl(var(--brand-orange))]"
                      />
                    </label>
                  </div>
                  <textarea
                    value={profile.placementPolicies.note}
                    onChange={(e) => setProfile(p => ({ ...p, placementPolicies: { ...p.placementPolicies, note: e.target.value.slice(0, 300) } }))}
                    placeholder="Describe any additional details about your placement process..."
                    rows={3}
                    className="w-full bg-card border border-hairline rounded-md px-3 py-2 text-sm placeholder:text-secondary outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))] resize-none"
                  />
                  <div className="text-xs text-secondary text-right mt-1">{profile.placementPolicies.note.length}/300</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
);

/** ───────── Standalone CredentialsTab ───────── */
type CredentialsHandle = { save: () => Promise<void> };
type CredentialsProfile = {
  registrations: string[];
  showRegistrations: boolean;
  registrationsNote: string;
  healthPractices: string[];
  showHealthPractices: boolean;
  healthNote: string;
  breedingPractices: string[];
  showBreedingPractices: boolean;
  breedingNote: string;
  carePractices: string[];
  showCarePractices: boolean;
  careNote: string;
};

const EMPTY_CREDENTIALS: CredentialsProfile = {
  registrations: [],
  showRegistrations: false,
  registrationsNote: "",
  healthPractices: [],
  showHealthPractices: false,
  healthNote: "",
  breedingPractices: [],
  showBreedingPractices: false,
  breedingNote: "",
  carePractices: [],
  showCarePractices: false,
  careNote: "",
};

const CredentialsTab = React.forwardRef<CredentialsHandle, { dirty: boolean; onDirty: (v: boolean) => void; editMode: boolean }>(
  function CredentialsTab({ onDirty, editMode }, ref) {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string>("");
    const [profile, setProfile] = React.useState<CredentialsProfile>(EMPTY_CREDENTIALS);
    const [profileInit, setProfileInit] = React.useState<CredentialsProfile>(EMPTY_CREDENTIALS);

    const isDirty = React.useMemo(() => {
      return JSON.stringify(profile) !== JSON.stringify(profileInit);
    }, [profile, profileInit]);
    React.useEffect(() => onDirty(isDirty), [isDirty, onDirty]);

    React.useEffect(() => {
      let ignore = false;
      (async () => {
        try {
          setLoading(true); setError("");
          const tenantId = await resolveTenantIdSafe();
          if (!tenantId) throw new Error("Missing tenant id");
          const pr = await api.breeding.program.getForTenant(Number(tenantId));
          const prData = (pr?.data ?? pr) as Partial<BreedingProgramProfile> | undefined;
          const loaded: CredentialsProfile = {
            registrations: (prData as any)?.standardsAndCredentials?.registrations ?? [],
            showRegistrations: (prData as any)?.standardsAndCredentials?.showRegistrations ?? false,
            registrationsNote: (prData as any)?.standardsAndCredentials?.registrationsNote ?? "",
            healthPractices: (prData as any)?.standardsAndCredentials?.healthPractices ?? [],
            showHealthPractices: (prData as any)?.standardsAndCredentials?.showHealthPractices ?? false,
            healthNote: (prData as any)?.standardsAndCredentials?.healthNote ?? "",
            breedingPractices: (prData as any)?.standardsAndCredentials?.breedingPractices ?? [],
            showBreedingPractices: (prData as any)?.standardsAndCredentials?.showBreedingPractices ?? false,
            breedingNote: (prData as any)?.standardsAndCredentials?.breedingNote ?? "",
            carePractices: (prData as any)?.standardsAndCredentials?.carePractices ?? [],
            showCarePractices: (prData as any)?.standardsAndCredentials?.showCarePractices ?? false,
            careNote: (prData as any)?.standardsAndCredentials?.careNote ?? "",
          };
          if (!ignore) {
            setProfile(loaded);
            setProfileInit(loaded);
          }
        } catch (e: any) {
          if (!ignore) setError(e?.message || "Failed to load credentials");
        } finally { if (!ignore) setLoading(false); }
      })();
      return () => { ignore = true; };
    }, []);

    async function saveCredentials() {
      setError("");
      try {
        const tenantId = await resolveTenantId();
        if (!tenantId) throw new Error("Missing tenant id");
        const existing = await api.breeding.program.getForTenant(Number(tenantId));
        const existingData = (existing?.data ?? existing) as BreedingProgramProfile | undefined;
        const merged = {
          ...existingData,
          standardsAndCredentials: {
            ...(existingData as any)?.standardsAndCredentials,
            registrations: profile.registrations,
            showRegistrations: profile.showRegistrations,
            registrationsNote: profile.registrationsNote,
            healthPractices: profile.healthPractices,
            showHealthPractices: profile.showHealthPractices,
            healthNote: profile.healthNote,
            breedingPractices: profile.breedingPractices,
            showBreedingPractices: profile.showBreedingPractices,
            breedingNote: profile.breedingNote,
            carePractices: profile.carePractices,
            showCarePractices: profile.showCarePractices,
            careNote: profile.careNote,
          },
        };
        await api.breeding.program.updateForTenant(merged, Number(tenantId));
        setProfileInit(profile);
        onDirty(false);
      } catch (e: any) {
        setError(e?.message || "Credentials save failed");
      }
    }
    React.useImperativeHandle(ref, () => ({ async save() { await saveCredentials(); } }));

    function toggleItem(section: keyof Pick<CredentialsProfile, "registrations" | "healthPractices" | "breedingPractices" | "carePractices">, item: string) {
      setProfile((p) => {
        const list = p[section];
        const newList = list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
        return { ...p, [section]: newList };
      });
    }

    return (
      <div className="space-y-4">
        {loading ? <div className="text-sm text-secondary">Loading…</div> : (
          <>
            {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}

            <div>
              <h3 className="text-lg font-semibold">Standards and Credentials</h3>
              <p className="text-sm text-secondary mt-1">
                Configure your breeding program's standards, credentials, and practices.
              </p>
            </div>

            <div className="space-y-4">
              {/* Registrations and Affiliations */}
              <div className={`rounded-md border border-hairline p-4 space-y-3 ${!editMode ? "pointer-events-none" : ""}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-base font-semibold text-primary">Registrations and Affiliations</div>
                  <VisibilityToggle
                    isPublic={profile.showRegistrations}
                    onChange={(v) => setProfile(p => ({ ...p, showRegistrations: v }))}
                    disabled={!editMode || profile.registrations.length === 0}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {["AKC Breeder of Merit", "AKC Bred with H.E.A.R.T.", "GANA Member", "GRCA Member", "UKC Registered", "CKC Registered"].map((item) => (
                    <label key={item} className={`flex items-center gap-2 ${!editMode ? "cursor-not-allowed" : "cursor-pointer"}`}>
                      <input
                        type="checkbox"
                        checked={profile.registrations.includes(item)}
                        onChange={() => toggleItem("registrations", item)}
                        disabled={!editMode}
                        className="w-4 h-4 rounded border-hairline bg-card accent-blue-500"
                      />
                      <span className={`text-sm ${!editMode ? "text-secondary" : ""}`}>{item}</span>
                    </label>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-secondary">Standards and Credentials Notes</label>
                  <textarea
                    value={profile.registrationsNote}
                    onChange={(e) => setProfile(p => ({ ...p, registrationsNote: e.target.value.slice(0, 200) }))}
                    placeholder="Optional notes..."
                    rows={2}
                    disabled={!editMode}
                    className={`w-full mt-1 bg-card border border-hairline rounded-md px-3 py-2 text-sm placeholder:text-secondary outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))] resize-none ${!editMode ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                  <div className="text-xs text-secondary text-right mt-1">{profile.registrationsNote.length}/200</div>
                </div>
              </div>

              {/* Health and Genetic Practices */}
              <div className={`rounded-md border border-hairline p-4 space-y-3 ${!editMode ? "pointer-events-none" : ""}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-base font-semibold text-primary">Health and Genetic Practices</div>
                  <VisibilityToggle
                    isPublic={profile.showHealthPractices}
                    onChange={(v) => setProfile(p => ({ ...p, showHealthPractices: v }))}
                    disabled={!editMode || profile.healthPractices.length === 0}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {["OFA Hip/Elbow", "OFA Cardiac", "OFA Eyes (CAER)", "PennHIP", "Genetic Testing", "Embark/Wisdom Panel"].map((item) => (
                    <label key={item} className={`flex items-center gap-2 ${!editMode ? "cursor-not-allowed" : "cursor-pointer"}`}>
                      <input
                        type="checkbox"
                        checked={profile.healthPractices.includes(item)}
                        onChange={() => toggleItem("healthPractices", item)}
                        disabled={!editMode}
                        className="w-4 h-4 rounded border-hairline bg-card accent-blue-500"
                      />
                      <span className={`text-sm ${!editMode ? "text-secondary" : ""}`}>{item}</span>
                    </label>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-secondary">Health and Genetic Practices Notes</label>
                  <textarea
                    value={profile.healthNote}
                    onChange={(e) => setProfile(p => ({ ...p, healthNote: e.target.value.slice(0, 200) }))}
                    placeholder="Optional notes..."
                    rows={2}
                    disabled={!editMode}
                    className={`w-full mt-1 bg-card border border-hairline rounded-md px-3 py-2 text-sm placeholder:text-secondary outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))] resize-none ${!editMode ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                  <div className="text-xs text-secondary text-right mt-1">{profile.healthNote.length}/200</div>
                </div>
              </div>

              {/* Breeding Practices */}
              <div className={`rounded-md border border-hairline p-4 space-y-3 ${!editMode ? "pointer-events-none" : ""}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-base font-semibold text-primary">Breeding Practices</div>
                  <VisibilityToggle
                    isPublic={profile.showBreedingPractices}
                    onChange={(v) => setProfile(p => ({ ...p, showBreedingPractices: v }))}
                    disabled={!editMode || profile.breedingPractices.length === 0}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {["Health-tested parents only", "Puppy Culture", "Avidog Program", "Breeding soundness exam", "Limited breeding rights", "Co-ownership available"].map((item) => (
                    <label key={item} className={`flex items-center gap-2 ${!editMode ? "cursor-not-allowed" : "cursor-pointer"}`}>
                      <input
                        type="checkbox"
                        checked={profile.breedingPractices.includes(item)}
                        onChange={() => toggleItem("breedingPractices", item)}
                        disabled={!editMode}
                        className="w-4 h-4 rounded border-hairline bg-card accent-blue-500"
                      />
                      <span className={`text-sm ${!editMode ? "text-secondary" : ""}`}>{item}</span>
                    </label>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-secondary">Breeding Practices Notes</label>
                  <textarea
                    value={profile.breedingNote}
                    onChange={(e) => setProfile(p => ({ ...p, breedingNote: e.target.value.slice(0, 200) }))}
                    placeholder="Optional notes..."
                    rows={2}
                    disabled={!editMode}
                    className={`w-full mt-1 bg-card border border-hairline rounded-md px-3 py-2 text-sm placeholder:text-secondary outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))] resize-none ${!editMode ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                  <div className="text-xs text-secondary text-right mt-1">{profile.breedingNote.length}/200</div>
                </div>
              </div>

              {/* Care and Early Life */}
              <div className={`rounded-md border border-hairline p-4 space-y-3 ${!editMode ? "pointer-events-none" : ""}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-base font-semibold text-primary">Care and Early Life</div>
                  <VisibilityToggle
                    isPublic={profile.showCarePractices}
                    onChange={(v) => setProfile(p => ({ ...p, showCarePractices: v }))}
                    disabled={!editMode || profile.carePractices.length === 0}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {["ENS/ESI", "Vet checked", "First vaccinations", "Microchipped", "Crate/potty training started", "Socialization protocol"].map((item) => (
                    <label key={item} className={`flex items-center gap-2 ${!editMode ? "cursor-not-allowed" : "cursor-pointer"}`}>
                      <input
                        type="checkbox"
                        checked={profile.carePractices.includes(item)}
                        onChange={() => toggleItem("carePractices", item)}
                        disabled={!editMode}
                        className="w-4 h-4 rounded border-hairline bg-card accent-blue-500"
                      />
                      <span className={`text-sm ${!editMode ? "text-secondary" : ""}`}>{item}</span>
                    </label>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-secondary">Care and Early Life Notes</label>
                  <textarea
                    value={profile.careNote}
                    onChange={(e) => setProfile(p => ({ ...p, careNote: e.target.value.slice(0, 200) }))}
                    placeholder="Optional notes..."
                    rows={2}
                    disabled={!editMode}
                    className={`w-full mt-1 bg-card border border-hairline rounded-md px-3 py-2 text-sm placeholder:text-secondary outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))] resize-none ${!editMode ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                  <div className="text-xs text-secondary text-right mt-1">{profile.careNote.length}/200</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
);

function UsersTab({ onDirty }: { dirty: boolean; onDirty: (v: boolean) => void }) {
  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-3">
        <h4 className="font-medium">Members</h4>
        <div className="rounded-md border border-hairline divide-y divide-hairline">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="text-sm">you@example.com</div>
            <div className="flex items-center gap-2">
              <select className={`bhq-input ${INPUT_CLS}`} onChange={() => onDirty(true)}><option>Admin</option><option>Manager</option><option>Reader</option></select>
              <Button size="sm" variant="outline" onClick={() => onDirty(true)}>Remove</Button>
            </div>
          </div>
        </div>
      </Card>
      <Card className="p-4 space-y-3">
        <h4 className="font-medium">Invite user</h4>
        <div className="flex gap-2">
          <Field placeholder="Email address" onChange={() => onDirty(true)} />
          <select className="bhq-input w-40" onChange={() => onDirty(true)}><option>Manager</option><option>Reader</option><option>Admin</option></select>
          <Button size="sm" onClick={() => onDirty(true)}>Send invite</Button>
        </div>
        <p className="text-xs text-secondary">Managers can manage users but not subscriptions, payment methods, or the primary subscriber.</p>
      </Card>
    </div>
  );
}
function GroupsTab({ onDirty }: { dirty: boolean; onDirty: (v: boolean) => void }) {
  return (
    <Card className="p-4 space-y-3">
      <h4 className="font-medium">Groups</h4>
      <p className="text-sm text-secondary">Create and manage user groups (placeholder).</p>
      <div className="flex gap-2">
        <input className={`bhq-input ${INPUT_CLS} flex-1`} placeholder="New group name" onChange={() => onDirty(true)} />
        <Button size="sm" onClick={() => onDirty(true)}>Add group</Button>
      </div>
    </Card>
  );
}
/** ───────── Small UI helpers ───────── */
function Chk({ label, checked, onChange }: { label: string; checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm select-none">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.currentTarget.checked)} />
      <span>{label}</span>
    </label>
  );
}
function bandWidth(from: number, to: number) { return (to || 0) - (from || 0); }
function exactDateInvalid(from?: number | null, to?: number | null): boolean {
  // If either side is not a finite number, don't mark invalid yet.
  if (!Number.isFinite(from as number) || !Number.isFinite(to as number)) return false;
  return (to as number) < (from as number);
}

function phaseInvalid(beforeDays: number, afterDays: number): boolean {
  return bandWidth(-Math.abs(beforeDays || 0), Math.abs(afterDays || 0)) < 0;
}

function FieldNum(props: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="space-y-1">
      <div className="text-xs text-secondary">{props.label}</div>
      <input type="number" className="bhq-input w-28 h-9 rounded-md border border-hairline bg-surface px-2 text-sm"
        value={Number.isFinite(props.value) ? props.value : 0} onChange={(e) => props.onChange(Number(e.currentTarget.value || 0))}
      />
    </label>
  );
}
function TwoCol({ children }: { children: React.ReactNode }) { return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>; }
function Hint({ children }: { children: React.ReactNode }) { return <p className="text-xs text-tertiary">{children}</p>; }
function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <span className="inline-flex items-center gap-1">
        <span className="inline-block w-3 h-3 rounded bg-[hsl(var(--brand-orange))]/30 border border-[hsl(var(--brand-orange))]/50" /> Risky
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="inline-block w-3 h-3 rounded bg-[hsl(var(--brand-orange))]/15 border border-[hsl(var(--brand-orange))]/40" /> Unlikely
      </span>
    </div>
  );
}
const HELP_BOX = (
  <Card className="p-3">
    <div className="text-sm font-medium mb-1">How availability works</div>
    <p className="text-xs text-tertiary">
      Use phase wraps to follow a whole window like Testing→Breeding, or use exact date wraps to follow a single
      calendar date. “Risky” marks strong conflicts; “Unlikely” is softer caution.
    </p>
  </Card>
);

/** Mini preview v3: one solid center line, solid per-row bars, unique colors */
function MiniPreview({ form }: { form: AvailabilityPrefs }) {
  // layout
  const PAD_X = 10;
  const ROW_H = 16;
  const VIEW_W = 800;

  function niceStep(span: number) {
    const candidates = [1, 2, 5, 10, 15, 20, 25, 30];
    const approx = span / 10;
    return candidates.reduce((best, c) =>
      Math.abs(c - approx) < Math.abs(best - approx) ? c : best, candidates[0]);
  }

  // center line color
  const colToday = "hsl(var(--brand-orange, 20 90% 55%))";
  const strokeHair = "hsl(var(--hairline, 0 0% 35% / 0.6))";

  const rows = [
    {
      id: "cycle",
      label: "Cycle",
      rf: form.date_cycle_risky_from,
      rt: form.date_cycle_risky_to,
      uf: form.date_cycle_unlikely_from,
      ut: form.date_cycle_unlikely_to,
    },
    {
      id: "testing",
      label: "Testing",
      rf: form.date_testing_risky_from,
      rt: form.date_testing_risky_to,
      uf: form.date_testing_unlikely_from,
      ut: form.date_testing_unlikely_to,
    },
    {
      id: "breed",
      label: "Breeding",
      rf: form.date_breeding_risky_from,
      rt: form.date_breeding_risky_to,
      uf: form.date_breeding_unlikely_from,
      ut: form.date_breeding_unlikely_to,
    },
    {
      id: "birth",
      label: "Birth",
      rf: form.date_birth_risky_from,
      rt: form.date_birth_risky_to,
      uf: form.date_birth_unlikely_from,
      ut: form.date_birth_unlikely_to,
    },
    {
      id: "weaned",
      label: "Weaned",
      rf: form.date_weaned_risky_from,
      rt: form.date_weaned_risky_to,
      uf: form.date_weaned_unlikely_from,
      ut: form.date_weaned_unlikely_to,
    },
    {
      id: "placement_start",
      label: "Placement Start",
      rf: form.date_placement_start_risky_from,
      rt: form.date_placement_start_risky_to,
      uf: form.date_placement_start_unlikely_from,
      ut: form.date_placement_start_unlikely_to,
    },
    {
      id: "placed",
      label: "Placement",
      rf: form.date_placement_completed_risky_from,
      rt: form.date_placement_completed_risky_to,
      uf: form.date_placement_completed_unlikely_from,
      ut: form.date_placement_completed_unlikely_to,
    },
  ];

  const palette: Record<string, string> = {
    cycle: "hsl(200 90% 55%)",
    testing: "hsl(160 70% 45%)",
    breed: "hsl(30  90% 55%)",
    birth: "hsl(345 80% 55%)",
    weaned: "hsl(260 70% 55%)",
    placement_start: "hsl(120 65% 50%)",
    placed: "hsl(120 65% 45%)",
  };

  const maxBefore = Math.max(...rows.map(r => Math.max(Math.abs(Number(r.rf || 0)), Math.abs(Number(r.uf || 0)))));
  const maxAfter = Math.max(...rows.map(r => Math.max(Math.abs(Number(r.rt || 0)), Math.abs(Number(r.ut || 0)))));
  let minDay = -maxBefore, maxDay = maxAfter;
  if (!Number.isFinite(minDay) || !Number.isFinite(maxDay) || (minDay === 0 && maxDay === 0)) { minDay = -7; maxDay = 7; }
  const span0 = Math.max(1, maxDay - minDay);
  const pad = Math.max(2, Math.round(span0 * 0.10));
  minDay = Math.floor((minDay - pad) / 5) * 5;
  maxDay = Math.ceil((maxDay + pad) / 5) * 5;
  const span = maxDay - minDay;
  const step = niceStep(span);
  const cx = (day: number) => Math.round(((day - minDay) / span) * (VIEW_W - PAD_X * 2)) + PAD_X;

  const svgH = rows.length * ROW_H;
  const ticks: Array<{ x: number; day: number }> = [];
  const startTick = Math.ceil(minDay / step) * step;
  for (let d = startTick; d <= maxDay; d += step) ticks.push({ x: cx(d), day: d });

  return (
    <div className="mt-2">
      <div className="flex gap-2">
        <div className="flex flex-col items-end justify-between w-16 text-[11px] text-secondary py-[2px] pr-1">
          {rows.map(r => <div key={r.id} style={{ height: ROW_H }} className="leading-none">{r.label}</div>)}
          <div style={{ height: 24 }} className="leading-none mt-1">Days</div>
        </div>
        <div className="flex-1 min-w-0">
          <svg viewBox={`0 0 ${VIEW_W} ${svgH}`} className="w-full" style={{ height: svgH }}>
            <defs>
              {rows.map((r) => (
                <pattern id={`hatch-${r.id}`} key={`pat-${r.id}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                  <rect width="6" height="6" fill="transparent" />
                  <line x1="0" y1="0" x2="0" y2="6" stroke={palette[r.id]} strokeOpacity="0.35" strokeWidth="2" />
                </pattern>
              ))}
            </defs>
            <line x1={cx(0)} x2={cx(0)} y1={0} y2={svgH} stroke={colToday} strokeWidth="1.5" />
            {rows.map((r, i) => {
              const y = i * ROW_H + 3;
              let rf = -Math.abs(Number(r.rf || 0)), rt = Math.abs(Number(r.rt || 0));
              let uf = -Math.abs(Number(r.uf || 0)), ut = Math.abs(Number(r.ut || 0));

              const x1u = cx(uf), x2u = cx(ut), x1r = cx(rf), x2r = cx(rt);
              const xu = Math.min(x1u, x2u), wu = Math.max(1, Math.abs(x2u - x1u));
              const xr = Math.min(x1r, x2r), wr = Math.max(1, Math.abs(x2r - x1r));
              return (
                <g key={r.id}>
                  {/* Unlikely UNDER, then Risky OVER */}
                  <rect x={xu} y={y} width={wu} height={ROW_H - 6} rx="2"
                    fill={`url(#hatch-${r.id})`} stroke={palette[r.id]} strokeOpacity="0.5" />
                  <rect x={xr} y={y} width={wr} height={ROW_H - 6} rx="2"
                    fill={palette[r.id]} fillOpacity="1" stroke={palette[r.id]} strokeOpacity="0.9" />
                </g>
              );
            })}
          </svg>
          <svg viewBox={`0 0 ${VIEW_W} 24`} className="w-full h-[24px] mt-1">
            <line x1={PAD_X} y1={9} x2={VIEW_W - PAD_X} y2={9} stroke={strokeHair} />
            {ticks.map((t, i) => (
              <g key={i}>
                <line x1={t.x} y1={6} x2={t.x} y2={12} stroke={strokeHair} />
                <text x={t.x} y={17} textAnchor="middle" fontSize="9" className="fill-current opacity-70">
                  {t.day > 0 ? `+${t.day}` : t.day}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
} // ← make sure this brace closes MiniPreview


/** Phase preview (Testing→Breeding and Birth→Placement) */
function PhasePreview({ form }: { form: AvailabilityPrefs }) {
  const PAD_X = 10;
  const ROW_H = 18;
  const VIEW_W = 800;

  const colToday = "hsl(var(--brand-orange, 20 90% 55%))";
  const strokeHair = "hsl(var(--hairline, 0 0% 35% / 0.6))";

  const phases = [
    {
      id: "cb",
      label: "Cycle Start → Breeding",
      uf: -Math.abs(Number(form.cycle_breeding_unlikely_from_likely_start || 0)),
      ut: Math.abs(Number(form.cycle_breeding_unlikely_to_likely_end || 0)),
      rf: -Math.abs(Number(form.cycle_breeding_risky_from_full_start || 0)),
      rt: Math.abs(Number(form.cycle_breeding_risky_to_full_end || 0)),
      color: "hsl(200 85% 55%)",
    },
    {
      id: "bp",
      label: "Birth → Placement",
      uf: -Math.abs(Number(form.post_unlikely_from_likely_start || 0)),
      ut: Math.abs(Number(form.post_unlikely_to_likely_end || 0)),
      rf: -Math.abs(Number(form.post_risky_from_full_start || 0)),
      rt: Math.abs(Number(form.post_risky_to_full_end || 0)),
      color: "hsl(345 80% 55%)",
    },
  ];

  const maxBefore = Math.max(...phases.map(p => Math.max(Math.abs(p.uf), Math.abs(p.rf))));
  const maxAfter = Math.max(...phases.map(p => Math.max(Math.abs(p.ut), Math.abs(p.rt))));
  let minDay = -maxBefore, maxDay = maxAfter;
  if (!Number.isFinite(minDay) || !Number.isFinite(maxDay) || (minDay === 0 && maxDay === 0)) { minDay = -7; maxDay = 7; }
  const span0 = Math.max(1, maxDay - minDay);
  const pad = Math.max(2, Math.round(span0 * 0.10));
  minDay = Math.floor((minDay - pad) / 5) * 5;
  maxDay = Math.ceil((maxDay + pad) / 5) * 5;
  const span = maxDay - minDay;
  const cx = (day: number) => Math.round(((day - minDay) / span) * (VIEW_W - PAD_X * 2)) + PAD_X;

  const niceStep = (s: number) => [1, 2, 5, 10, 15, 20, 25, 30].reduce((b, x) => Math.abs(x - (s / 10)) < Math.abs(b - (s / 10)) ? x : b, 1);
  const step = niceStep(span);
  const ticks: Array<{ x: number; day: number }> = [];
  const startTick = Math.ceil(minDay / step) * step;
  for (let d = startTick; d <= maxDay; d += step) ticks.push({ x: cx(d), day: d });

  const svgH = phases.length * ROW_H;

  return (
    <div className="mt-2">
      <div className="flex gap-2">
        <div className="flex flex-col items-end justify-between w-32 text-[11px] text-secondary py-[2px] pr-1">
          {phases.map(p => <div key={p.id} style={{ height: ROW_H }} className="leading-none">{p.label}</div>)}
          <div style={{ height: 24 }} className="leading-none mt-1">Days</div>
        </div>
        <div className="flex-1 min-w-0">
          <svg viewBox={`0 0 ${VIEW_W} ${svgH}`} className="w-full" style={{ height: svgH }}>
            <defs>
              {phases.map(p => (
                <pattern id={`phase-hatch-${p.id}`} key={p.id} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                  <rect width="6" height="6" fill="transparent" />
                  <line x1="0" y1="0" x2="0" y2="6" stroke={p.color} strokeOpacity="0.35" strokeWidth="2" />
                </pattern>
              ))}
            </defs>
            <line x1={cx(0)} x2={cx(0)} y1={0} y2={svgH} stroke={colToday} strokeWidth="1.5" />
            {phases.map((p, i) => {
              const y = i * ROW_H + 3;
              const x1u = cx(p.uf), x2u = cx(p.ut);
              const x1r = cx(p.rf), x2r = cx(p.rt);
              const xu = Math.min(x1u, x2u), wu = Math.max(1, Math.abs(x2u - x1u));
              const xr = Math.min(x1r, x2r), wr = Math.max(1, Math.abs(x2r - x1r));
              return (
                <g key={p.id}>
                  <rect x={xu} y={y} width={wu} height={ROW_H - 6} rx="2"
                    fill={`url(#phase-hatch-${p.id})`} stroke={p.color} strokeOpacity="0.5" />
                  <rect x={xr} y={y} width={wr} height={ROW_H - 6} rx="2"
                    fill={p.color} fillOpacity="1" stroke={p.color} strokeOpacity="0.9" />
                </g>
              );
            })}
          </svg>
          <svg viewBox={`0 0 ${VIEW_W} 24`} className="w-full h-[24px] mt-1">
            <line x1={PAD_X} y1={9} x2={VIEW_W - PAD_X} y2={9} stroke={strokeHair} />
            {ticks.map((t, i) => (
              <g key={i}>
                <line x1={t.x} y1={6} x2={t.x} y2={12} stroke={strokeHair} />
                <text x={t.x} y={17} textAnchor="middle" fontSize="9" className="fill-current opacity-70">
                  {t.day > 0 ? `+${t.day}` : t.day}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

/** Phase editor block */
function FieldNumDerived(props: {
  label: string;
  value: number;
  derived: number;
  onChange: (n: number) => void;
  onReset?: () => void;
  invalid?: boolean;
  help?: string;
  disabled?: boolean;
}) {
  const { label, value, derived, onChange, onReset, invalid, help, disabled } = props;
  const delta = Math.round((value || 0) - (derived || 0));
  const [text, setText] = React.useState<string>(() => String(Number.isFinite(value) ? value : ""));
  const lastCommitted = React.useRef<string>(String(Number.isFinite(value) ? value : ""));
  React.useEffect(() => {
    // keep external changes in sync
    const next = Number.isFinite(value) ? String(value) : "";
    setText(next);
    lastCommitted.current = next;
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  function commit(vRaw: string) {
    const v = vRaw.trim();
    // Allow a leading '-' while typing, but on commit treat lone '-' as unchanged.
    if (v === "" || v === "-") { setText(lastCommitted.current); return; }
    // Parse as base-10 integer (no floats here)
    const n = Number.parseInt(v, 10);
    if (Number.isNaN(n)) { setText(lastCommitted.current); return; }
    const next = String(n);
    if (next === lastCommitted.current) return; // idempotent
    lastCommitted.current = next;
    onChange(n);
  }
  return (
    <label className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="text-xs text-secondary">{label}</div>
        <span className="text-[10px] text-tertiary">Default:</span>
        <span className="text-[11px]">{Number.isFinite(derived) ? derived : 0}</span>
        {delta !== 0 && (
          <span className="ml-2 inline-flex items-center rounded px-1.5 py-[1px] text-[10px] border border-[hsl(var(--brand-orange))/40] text-[hsl(var(--brand-orange))] bg-[hsl(var(--brand-orange))/10]">
            {delta > 0 ? "+" : ""}{delta}
          </span>
        )}
        {onReset && (
          <button type="button" className="ml-2 text-[11px] px-2 py-0.5 rounded border border-hairline text-secondary hover:text-primary" onClick={onReset} title="Reset to default">
            Reset
          </button>
        )}
        <input
          type="number"
          step="1"
          inputMode="numeric"
          disabled={!!disabled}
          className={[
            "bhq-input w-24 h-8 rounded-md border bg-surface px-2 text-sm",
            disabled ? "opacity-60 cursor-not-allowed" : "",
            invalid ? "border-red-500/60 focus:shadow-[0_0_0_2px_rgba(244,63,94,.6)]" : "border-hairline",
          ].join(" ")}
          value={text}
          onChange={(e) => {
            const v = e.currentTarget.value;
            if (!/^-?\d*$/.test(v)) return;
            setText(v);
            // if it is a complete integer (not empty or lone "-"), push it to parent immediately
            if (/^-?\d+$/.test(v)) onChange(Number.parseInt(v, 10));
          }}
          onBlur={() => commit(text)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commit(text); }
          }}
          aria-invalid={invalid ? "true" : "false"}
        />
        {help ? <p className="text-[10px] text-tertiary">{help}</p> : null}
      </div>
    </label>
  );
}
function ExactDateRow(props: {
  rowId: string; locked: boolean; onToggleLock: () => void;
  title: string;
  riskyFromKey: keyof AvailabilityPrefs; riskyToKey: keyof AvailabilityPrefs;
  unlikelyFromKey: keyof AvailabilityPrefs; unlikelyToKey: keyof AvailabilityPrefs;
  form: AvailabilityPrefs; setForm: React.Dispatch<React.SetStateAction<AvailabilityPrefs>>;
  derivedDefaults?: AvailabilityPrefs;
  hideBefore?: boolean;
  plusOneDates: boolean;
}) {
  const {
    title, riskyFromKey, riskyToKey, unlikelyFromKey, unlikelyToKey,
    form, setForm, derivedDefaults, hideBefore,
  } = props;
  const DER = derivedDefaults || DEFAULT_AVAILABILITY_PREFS;

  const riskyFrom = Number.isFinite(form[riskyFromKey] as any) ? Number(form[riskyFromKey] as any) : 0;
  const riskyTo = Number.isFinite(form[riskyToKey] as any) ? Number(form[riskyToKey] as any) : 0;
  const unrFrom = Number.isFinite(form[unlikelyFromKey] as any) ? Number(form[unlikelyFromKey] as any) : 0;
  const unrTo = Number.isFinite(form[unlikelyToKey] as any) ? Number(form[unlikelyToKey] as any) : 0;

  const invalidRisky = exactDateInvalid(-Math.abs(riskyFrom), Math.abs(riskyTo));
  const invalidUnlk = exactDateInvalid(-Math.abs(unrFrom), Math.abs(unrTo));

  function set<K extends keyof AvailabilityPrefs>(key: K, val: number) {
    props.setForm((f) => normalizeExactBands({ ...f, [key]: val } as AvailabilityPrefs, props.plusOneDates));
  }

  function resetRow() {
    if (props.locked) return;
    setForm((f) => normalizeExactBands({
      ...f,
      [riskyFromKey]: (DER as any)[riskyFromKey] ?? 0,
      [riskyToKey]: (DER as any)[riskyToKey] ?? 0,
      [unlikelyFromKey]: (DER as any)[unlikelyFromKey] ?? 0,
      [unlikelyToKey]: (DER as any)[unlikelyToKey] ?? 0,
    } as AvailabilityPrefs, enforcePlusOneDates));
  }

  return (
    <div className="rounded-md border border-hairline p-3 bg-surface space-y-3">
      <div className="text-sm font-medium">{title}</div>

      <div className="space-y-3">
        <TwoCol>
          {!hideBefore && (
            <FieldNumDerived
              label="Unlikely: days before"
              value={unrFrom}
              derived={Number((DER as any)[unlikelyFromKey] ?? 0)}
              onChange={(n) => set(unlikelyFromKey, n)}
              onReset={() => set(unlikelyFromKey, Number((DER as any)[unlikelyFromKey] ?? 0))}
              invalid={invalidUnlk}
              help={invalidUnlk ? "Unlikely band collapses (to < from)." : undefined}
              disabled={props.locked}
            />
          )}
          <FieldNumDerived
            label="Unlikely: days after"
            value={unrTo} // <-- was wrong before
            derived={Number((DER as any)[unlikelyToKey] ?? 0)}
            onChange={(n) => set(unlikelyToKey, n)}
            onReset={() => set(unlikelyToKey, Number((DER as any)[unlikelyToKey] ?? 0))}
            invalid={invalidUnlk}
            disabled={props.locked}
          />
        </TwoCol>

        <TwoCol>
          {!hideBefore && (
            <FieldNumDerived
              label="Risky: days before"
              value={riskyFrom}
              derived={Number((DER as any)[riskyFromKey] ?? 0)}
              onChange={(n) => set(riskyFromKey, n)}
              onReset={() => set(riskyFromKey, Number((DER as any)[riskyFromKey] ?? 0))}
              invalid={invalidRisky}
              help={invalidRisky ? "Risky band collapses (to < from)." : undefined}
              disabled={props.locked}
            />
          )}
          <FieldNumDerived
            label="Risky: days after"
            value={riskyTo}
            derived={Number((DER as any)[riskyToKey] ?? 0)}
            onChange={(n) => set(riskyToKey, n)}
            onReset={() => set(riskyToKey, Number((DER as any)[riskyToKey] ?? 0))}
            invalid={invalidRisky}
            disabled={props.locked}
          />
        </TwoCol>

        <div className="flex items-center gap-2 pt-1">
          <Button
            size="xs"
            variant={props.locked ? "secondary" : "outline"}
            onClick={props.onToggleLock}
            title={props.locked ? "Unlock this row" : "Lock this row to prevent edits and bulk actions"}
          >
            {props.locked ? "LOCKED" : "Lock"}
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={resetRow}
            disabled={props.locked}
            title="Reset all four fields in this row"
          >
            Reset row
          </Button>
        </div>
      </div>
    </div>
  );
}

function PhaseBlock(props: {
  title: string;
  unlikelyBeforeKey: keyof AvailabilityPrefs;
  unlikelyAfterKey: keyof AvailabilityPrefs;
  riskyBeforeKey: keyof AvailabilityPrefs;
  riskyAfterKey: keyof AvailabilityPrefs;
  form: AvailabilityPrefs;
  setForm: React.Dispatch<React.SetStateAction<AvailabilityPrefs>>;
  defaults: AvailabilityPrefs;
  plusOnePhases: boolean;
}) {
  const { title, unlikelyBeforeKey, unlikelyAfterKey, riskyBeforeKey, riskyAfterKey, form, setForm, defaults } = props;
  const set = <K extends keyof AvailabilityPrefs>(k: K, n: number) =>
    props.setForm((f) => normalizePhaseBands({ ...f, [k]: n } as AvailabilityPrefs, props.plusOnePhases));
  return (
    <div className="rounded-md border border-hairline p-3 bg-surface space-y-3">
      <div className="text-sm font-medium">{title}</div>
      <TwoCol>
        <FieldNumDerived
          label="Unlikely: days before"
          value={Number(form[unlikelyBeforeKey] ?? 0)} derived={Number((defaults as any)[unlikelyBeforeKey] ?? 0)}
          onChange={(n) => set(unlikelyBeforeKey, n)}
          onReset={() => set(unlikelyBeforeKey, Number((defaults as any)[unlikelyBeforeKey] ?? 0))}
          invalid={phaseInvalid(Number(form[unlikelyBeforeKey] || 0), Number(form[unlikelyAfterKey] || 0))}
        />
        <FieldNumDerived
          label="Unlikely: days after"
          value={Number(form[unlikelyAfterKey] ?? 0)} derived={Number((defaults as any)[unlikelyAfterKey] ?? 0)}
          onChange={(n) => set(unlikelyAfterKey, n)}
          onReset={() => set(unlikelyAfterKey, Number((defaults as any)[unlikelyAfterKey] ?? 0))}
          invalid={phaseInvalid(Number(form[unlikelyBeforeKey] || 0), Number(form[unlikelyAfterKey] || 0))}
        />
      </TwoCol>
      <TwoCol>
        <FieldNumDerived
          label="Risky: days before"
          value={Number(form[riskyBeforeKey] ?? 0)} derived={Number((defaults as any)[riskyBeforeKey] ?? 0)}
          onChange={(n) => set(riskyBeforeKey, n)}
          onReset={() => set(riskyBeforeKey, Number((defaults as any)[riskyBeforeKey] ?? 0))}
        />
        <FieldNumDerived
          label="Risky: days after"
          value={Number(form[riskyAfterKey] ?? 0)} derived={Number((defaults as any)[riskyAfterKey] ?? 0)}
          onChange={(n) => set(riskyAfterKey, n)}
          onReset={() => set(riskyAfterKey, Number((defaults as any)[riskyAfterKey] ?? 0))}
        />
      </TwoCol>
    </div>
  );
}


