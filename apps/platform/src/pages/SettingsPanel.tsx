// apps/platform/src/pages/SettingsPanel.tsx
import React from "react";
import { Button, Card, SectionCard } from "@bhq/ui";
import { createPortal } from "react-dom";
import { getOverlayRoot } from "@bhq/ui/overlay";
import { useUiScale } from "@bhq/ui/settings/UiScaleProvider";

import type { AvailabilityPrefs } from "@bhq/ui/utils/availability";
import { DEFAULT_AVAILABILITY_PREFS } from "@bhq/ui/utils/availability";
import { resolveTenantId } from "@bhq/ui/utils/tenant";
import type { BreedingProgramProfile } from "@bhq/ui/utils/breedingProgram";
import ProgramProfileSnapshot from "../components/ProgramProfileSnapshot";
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
    const res = await fetch("/api/v1/session", { credentials: "include", headers: { Accept: "application/json" } });
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
export function asCountryCode(country: string, countries: CountryDef[]): string {
  const code = normalizeCountryCode(country);
  if (!code) return "";
  return countries.some((c) => c.code === code) ? code : "";
}
export function countryNameFromValue(country: string, countries: CountryDef[]): string {
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
  | "platformSnapshot"
  | "breeds"
  | "users"
  | "groups"
  | "tags"
  | "accessibility";

type Props = { open: boolean; dirty: boolean; onDirtyChange: (v: boolean) => void; onClose: () => void; };

type NavSection = { title: string; items: Array<{ key: Tab; label: string }> };
const NAV: NavSection[] = [
  {
    title: "Account Management",
    items: [
      { key: "profile", label: "Profile" },
      { key: "security", label: "Security" },
    ],
  },
  {
    title: "Management",
    items: [
      { key: "subscription", label: "Subscription" },
      { key: "payments", label: "Payment Methods" },
      { key: "transactions", label: "Transactions" },
    ],
  },
  {
    title: "Modules",
    items: [{ key: "breeding", label: "Breeding" }],
  },
  {
    title: "Platform Management",
    items: [
      { key: "platformSnapshot", label: "Platform Snapshot" },
      { key: "programProfile", label: "Program Profile" },
      { key: "breeds", label: "Breeds" },
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
    breeding: false, programProfile: false, platformSnapshot: false, users: false, groups: false, tags: false, breeds: false, accessibility: false,
  });
  const profileRef = React.useRef<ProfileHandle>(null);
  const breedingRef = React.useRef<BreedingHandle>(null);
  const programRef = React.useRef<ProgramProfileHandle>(null);
  const [profileTitle, setProfileTitle] = React.useState<string>("");

  React.useEffect(() => { onDirtyChange(!!dirtyMap[active]); }, [active, dirtyMap, onDirtyChange]);
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

  const panel = (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-none" />
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
                            dirtyMap[active] && active !== t.key ? "cursor-not-allowed opacity-60" : "",
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
              <div className="flex items-center justify-between px-6 py-4 border-b border-hairline">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">
                    {active === "profile" && profileTitle ? `Profile - ${profileTitle}` : getTabLabel(active)}
                  </h3>
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={handleClose} disabled={dirty}>
                        Close
                      </Button>
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (active === "profile") {
                            await profileRef.current?.save(); markDirty("profile", false);
                          } else if (active === "breeding") {
                            await breedingRef.current?.save(); markDirty("breeding", false);
                          } else if (active === "programProfile") {
                            await programRef.current?.save(); markDirty("programProfile", false);
                          } else {
                            await saveActive(active, markDirty);
                            markDirty(active, false);
                          }
                        }}
                        disabled={!dirtyMap[active]}
                      >
                        Save
                      </Button>
                    </div>
                    <span
                      id="bhq-settings-dirty-banner"
                      className={[
                        "text-xs rounded px-2 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30",
                        dirtyMap[active] ? "opacity-100" : "opacity-0",
                        "transition-opacity",
                      ].join(" ")}
                    >
                      You have unsaved changes
                    </span>
                  </div>
                </div>
              </div>

              {/* scrollable body */}
              <div className="flex-1 overflow-auto p-6 space-y-6">
                {active === "profile" && (
                  <ProfileTab ref={profileRef} dirty={dirtyMap.profile} onDirty={(v) => markDirty("profile", v)} onTitle={setProfileTitle} />
                )}
                {active === "security" && <SecurityTab dirty={dirtyMap.security} onDirty={(v) => markDirty("security", v)} />}
                {active === "subscription" && <SubscriptionTab dirty={dirtyMap.subscription} onDirty={(v) => markDirty("subscription", v)} />}
                {active === "payments" && <PaymentsTab dirty={dirtyMap.payments} onDirty={(v) => markDirty("payments", v)} />}
                {active === "transactions" && <TransactionsTab dirty={dirtyMap.transactions} onDirty={(v) => markDirty("transactions", v)} />}
                {active === "breeding" && <BreedingTab ref={breedingRef} dirty={dirtyMap.breeding} onDirty={(v) => markDirty("breeding", v)} />}
                {active === "programProfile" && <ProgramProfileTab ref={programRef} dirty={dirtyMap.programProfile} onDirty={(v) => markDirty("programProfile", v)} />}
                {active === "platformSnapshot" && (
                  <PlatformSnapshotTab
                    dirty={dirtyMap.platformSnapshot}
                    onDirty={(v) => markDirty("platformSnapshot", v)}
                    onEditProfile={jumpToProgramProfile}
                    onEditPhases={() => jumpToBreeding("phases")}
                    onEditExactDates={() => jumpToBreeding("dates")}
                  />
                )}
                {active === "breeds" && <BreedsTab onDirty={(v) => markDirty("breeds", v)} />}
                {active === "users" && <UsersTab dirty={dirtyMap.users} onDirty={(v) => markDirty("users", v)} />}
                {active === "groups" && <GroupsTab dirty={dirtyMap.groups} onDirty={(v) => markDirty("groups", v)} />}
                {active === "tags" && <TagsTab dirty={dirtyMap.tags} onDirty={(v) => markDirty("tags", v)} />}
                {active === "accessibility" && <AccessibilityTab />}
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
type ProfileHandle = { save: () => Promise<void> };
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
  dirty: boolean; onDirty: (v: boolean) => void; onTitle: (t: string) => void;
}>(function ProfileTabImpl({ onDirty, onTitle }, ref) {
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
    const res = await fetch("/api/v1/session", { credentials: "include", headers: { Accept: "application/json" } });
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
  React.useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true); setError("");
        const { id } = await getSessionUserId();
        const u = await fetchJson(`/api/v1/users/${encodeURIComponent(id)}`, { method: "GET" });
        const next = mapUserToProfileForm(u, countries);
        if (!ignore) { setInitial(next); setForm(next); onTitle(deriveDisplayName(next)); }
      } catch (e: any) {
        if (!ignore) setError(e?.message || "Unable to load profile");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries]);

  React.useImperativeHandle(ref, () => ({
    async save() {
      setError("");
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

      const res = await fetch(`/api/v1/users/${encodeURIComponent(id)}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json", ...(await tenantHeaders()) },
        body: JSON.stringify(changed),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || j?.error || "User save failed");
      }
      if (changed.email) {
        await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" }).catch(() => { });
        window.location.assign("/login"); return;
      }
      const saved = await res.json().catch(() => ({}));
      const next = mapUserToProfileForm(saved, countries);
      setInitial(next); setForm(next); onTitle(deriveDisplayName(next)); onDirty(false);
    },
  }));

  return (
    <Card className="p-4 space-y-4">
      {loading ? <div className="text-sm text-secondary">Loading profile…</div> : (
        <>
          {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}
          <div className="rounded-xl border border-hairline bg-surface p-3">
            <div className="mb-2 text-xs uppercase tracking-wide text-secondary">Account</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="space-y-1">
                <div className="text-xs text-secondary">First name</div>
                <input className={`bhq-input ${INPUT_CLS}`} autoComplete="given-name" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
              </label>
              <label className="space-y-1">
                <div className="text-xs text-secondary">Last name</div>
                <input className={`bhq-input ${INPUT_CLS}`} autoComplete="family-name" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
              </label>
              <label className="space-y-1 md:col-span-2">
                <div className="text-xs text-secondary">Nickname</div>
                <input className={`bhq-input ${INPUT_CLS}`} autoComplete="nickname" placeholder="Optional" value={form.nickname} onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))} />
              </label>
              <label className="space-y-1 md:col-span-2">
                <div className="text-xs text-secondary">Email Address (username)</div>
                <div className="flex items-center gap-2">
                  <input className={`bhq-input ${INPUT_CLS} w-auto flex-1 min-w-0`} type="email" autoComplete="email" value={form.userEmail} readOnly onChange={(e) => setForm((f) => ({ ...f, userEmail: e.target.value }))} />
                </div>
                <p className="text-[11px] text-tertiary">Changing your email will require re-auth and signs you out after saving.</p>
              </label>
            </div>
          </div>

          <label className="space-y-1">
            <div className="text-xs text-secondary">Phone</div>
            <IntlPhoneField
              value={displayFromE164(form.phoneE164, countries)}
              onChange={(nextDisplay) => setForm((f) => ({ ...f, phoneE164: e164FromDisplay(nextDisplay) }))}
              inferredCountryName={countryNameFromValue(form.country, countries)} countries={countries} className="w-full"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <div className="text-xs text-secondary">WhatsApp</div>
            <IntlPhoneField
              value={displayFromE164(form.whatsappE164, countries)}
              onChange={(nextDisplay) => setForm((f) => ({ ...f, whatsappE164: e164FromDisplay(nextDisplay) }))}
              inferredCountryName={countryNameFromValue(form.country, countries)} countries={countries} className="w-full"
            />
          </label>

          <div className="rounded-xl border border-hairline bg-surface p-3">
            <div className="mb-2 text-xs uppercase tracking-wide text-secondary">Address</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className={`bhq-input ${INPUT_CLS} md:col-span-2`} placeholder="Street" value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} />
              <input className={`bhq-input ${INPUT_CLS} md:col-span-2`} placeholder="Street 2" value={form.street2} onChange={(e) => setForm((f) => ({ ...f, street2: e.target.value }))} />
              <input className={`bhq-input ${INPUT_CLS}`} placeholder="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
              <input className={`bhq-input ${INPUT_CLS}`} placeholder="State / Region" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
              <input className={`bhq-input ${INPUT_CLS}`} placeholder="Postal Code" value={form.postalCode} onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))} />
              <select className={["bhq-input", INPUT_CLS].join(" ")} value={asCountryCode(form.country, countries)} onChange={(e) => setForm((f) => ({ ...f, country: e.currentTarget.value || "" }))}>
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

type BreedingSubTab = "general" | "phases" | "dates";
const BREEDING_SUBTABS: Array<{ key: BreedingSubTab; label: string }> = [
  { key: "general", label: "General" },
  { key: "phases", label: "Timeline Phases" },
  { key: "dates", label: "Exact Dates" },
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
          try {
            const pr = await api.breeding.program.getForTenant(Number(tenantId));
            const prof = (pr?.data ?? pr) as any;
            const bands = prof?.preferences?.bands || {};
            if (!ignore) {
              const g = typeof bands.showInGantt === "boolean" ? bands.showInGantt : true;
              const c = typeof bands.showInCalendar === "boolean" ? bands.showInCalendar : true;
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

        // Save availability if changed
        const avChanged = Object.fromEntries(Object.entries(form).filter(([k, v]) => (initial as any)[k] !== v));
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
            <span className="text-sm">Show bands in Gantt</span>
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
      </div>
    );
  }
);
export { BreedingTab };

/** ───────── Program Profile (moved to Platform Management) ───────── */
type ProgramProfileHandle = { save: () => Promise<void> };
const ProgramProfileTab = React.forwardRef<ProgramProfileHandle, { dirty: boolean; onDirty: (v: boolean) => void }>(
  function ProgramProfileImpl({ onDirty }, ref) {
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

    const isDirty = React.useMemo(() => JSON.stringify(profile) !== JSON.stringify(profileInit), [profile, profileInit]);
    React.useEffect(() => onDirty(isDirty), [isDirty, onDirty]);

    React.useEffect(() => {
      let ignore = false;
      (async () => {
        try {
          setLoading(true); setError("");
          const tenantId = await resolveTenantIdSafe();
          if (!tenantId) throw new Error("Missing tenant id");
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
          if (!ignore) { setProfileInit(profMerged); setProfile(profMerged); }
        } catch (e: any) {
          if (!ignore) setError(e?.message || "Failed to load Program Profile");
        } finally { if (!ignore) setLoading(false); }
      })();
      return () => { ignore = true; };
    }, []);

    async function saveProfile() {
      setError("");
      try {
        const tenantRaw = await resolveTenantId();
        const tenantId = String(tenantRaw ?? "").trim();
        if (!tenantId) throw new Error("Missing tenant id");
        const safeBody = { ...profile, publication: profile.publication ?? { publishInDirectory: false, summary: null } };
        const prSaved = await api.breeding.program.updateForTenant(safeBody, Number(tenantId));
        const normalized = (prSaved?.data ?? prSaved) as BreedingProgramProfile;
        setProfileInit(normalized); setProfile(normalized); onDirty(false);
      } catch (e: any) {
        setError(e?.message || "Program profile save failed");
      }
    }
    React.useImperativeHandle(ref, () => ({ async save() { await saveProfile(); } }));

    // Import/Export . Export both Program Profile & Availability prefs.
    async function exportAll() {
      try {
        const tenantRaw = await resolveTenantId();
        const tenantId = String(tenantRaw ?? "").trim();
        const av = await fetchJson(`/api/v1/tenants/${encodeURIComponent(tenantId)}/availability`);
        const avData = (av?.data ?? av) as AvailabilityPrefs;
        const payload = {
          programProfile: profile,
          availability: avData,
          meta: { exportedAt: new Date().toISOString(), tenant: TENANT_ID_CACHE || null, version: 2 },
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob); const a = document.createElement("a");
        a.href = url; a.download = "breeding-program-export.json"; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      } catch (e: any) {
        alert(e?.message || "Export failed");
      }
    }
    async function importAll(file: File) {
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        const tenantRaw = await resolveTenantId();
        const tenantId = String(tenantRaw ?? "").trim();
        if (!tenantId) throw new Error("Missing tenant id");

        if (data?.programProfile) {
          const safeBody = { ...EMPTY_PROFILE, ...data.programProfile };
          const prSaved = await api.breeding.program.updateForTenant(safeBody, Number(tenantId));
          const normalized = (prSaved?.data ?? prSaved) as BreedingProgramProfile;
          setProfileInit(normalized); setProfile(normalized);
        }
        if (data?.availability) {
          await fetchJson(`/api/v1/tenants/${encodeURIComponent(tenantId)}/availability`, {
            method: "PATCH", body: JSON.stringify(data.availability),
          });
        }
        alert("Import complete.");
      } catch (e: any) {
        alert(e?.message || "Import failed");
      }
    }

    return (
      <SectionCard title="Program Profile" subtitle="Global rules and preferences that inform every plan.">
        {loading ? <div className="text-sm text-secondary">Loading…</div> : (
          <>
            {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}

            <Card className="p-3 space-y-2 mb-3">
              <div className="text-sm font-medium">Import / Export</div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={exportAll}>Export (Program + Availability)</Button>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="file" accept="application/json" onChange={(e) => {
                    const f = e.currentTarget.files?.[0]; if (f) importAll(f); e.currentTarget.value = "";
                  }} />
                </label>
              </div>
              <Hint>Local display preferences live in your browser and aren’t included.</Hint>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="space-y-1 md:col-span-2">
                <div className="text-xs text-secondary">Kennel name</div>
                <input className={`bhq-input ${INPUT_CLS}`} value={profile.kennelName} onChange={(e) => setProfile(p => ({ ...p, kennelName: e.target.value }))} />
              </label>

              <label className="space-y-1">
                <div className="text-xs text-secondary">Website</div>
                <input className={`bhq-input ${INPUT_CLS}`} value={profile.website ?? ""} onChange={(e) => setProfile(p => ({ ...p, website: e.target.value || null }))} />
              </label>

              <label className="space-y-1">
                <div className="text-xs text-secondary">Species</div>
                <div className="flex flex-wrap gap-4">
                  <Chk label="Dog" checked={profile.species.includes("DOG")} onChange={(ck) => setProfile(p => ({ ...p, species: ck ? Array.from(new Set([...(p.species || []), "DOG"])) : (p.species || []).filter(s => s !== "DOG") }))} />
                  <Chk label="Cat" checked={profile.species.includes("CAT")} onChange={(ck) => setProfile(p => ({ ...p, species: ck ? Array.from(new Set([...(p.species || []), "CAT"])) : (p.species || []).filter(s => s !== "CAT") }))} />
                  <Chk label="Horse" checked={profile.species.includes("HORSE")} onChange={(ck) => setProfile(p => ({ ...p, species: ck ? Array.from(new Set([...(p.species || []), "HORSE"])) : (p.species || []).filter(s => s !== "HORSE") }))} />
                </div>
                <Hint>Choose one or more.</Hint>
              </label>

              <label className="space-y-1">
                <div className="text-xs text-secondary">Travel policy</div>
                <select className={`bhq-input ${INPUT_CLS}`} value={profile.travelPolicy} onChange={(e) => setProfile(p => ({ ...p, travelPolicy: e.target.value as any }))}>
                  <option value="none">No travel</option>
                  <option value="limited">Limited</option>
                  <option value="case_by_case">Case by case</option>
                </select>
              </label>

              <div className="md:col-span-2 rounded-md border border-hairline p-3">
                <div className="text-sm font-medium mb-2">Cycle policy</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <FieldNum label="Min dam age (mo)" value={profile.cyclePolicy!.minDamAgeMonths} onChange={(n) => setProfile(p => ({ ...p, cyclePolicy: { ...p.cyclePolicy!, minDamAgeMonths: n } }))} />
                  <FieldNum label="Min heats between" value={profile.cyclePolicy!.minHeatsBetween} onChange={(n) => setProfile(p => ({ ...p, cyclePolicy: { ...p.cyclePolicy!, minHeatsBetween: n } }))} />
                  <FieldNum label="Max litters lifetime" value={profile.cyclePolicy!.maxLittersLifetime} onChange={(n) => setProfile(p => ({ ...p, cyclePolicy: { ...p.cyclePolicy!, maxLittersLifetime: n } }))} />
                  <FieldNum label="Retire after age (mo)" value={profile.cyclePolicy!.retireAfterAgeMonths ?? 0} onChange={(n) => setProfile(p => ({ ...p, cyclePolicy: { ...p.cyclePolicy!, retireAfterAgeMonths: n || null } }))} />
                </div>
                <label className="space-y-1 md:col-span-2">
                  <div className="text-xs text-secondary">Retirement rule</div>
                  <select className={`bhq-input ${INPUT_CLS} w-full`} value={profile.cyclePolicy!.retireRule || "either"} onChange={(e) => setProfile(p => ({ ...p, cyclePolicy: { ...p.cyclePolicy!, retireRule: e.currentTarget.value as any } }))}>
                    <option value="either">After age or after X breedings</option>
                    <option value="age_only">After age only</option>
                    <option value="litters_only">After X breedings only</option>
                  </select>
                  <Hint>Uses “Retire after age (mo)” and “Max litters lifetime.” “Either” means whichever happens first.</Hint>
                </label>
              </div>

              <div className="md:col-span-2 rounded-md border border-hairline p-3">
                <div className="text-sm font-medium mb-2">Placement</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <FieldNum label="Earliest days from birth" value={profile.placement.earliestDaysFromBirth} onChange={(n) => setProfile(p => ({ ...p, placement: { ...p.placement, earliestDaysFromBirth: n } }))} />
                  <FieldNum label="Standard days from birth" value={profile.placement.standardDaysFromBirth} onChange={(n) => setProfile(p => ({ ...p, placement: { ...p.placement, standardDaysFromBirth: n } }))} />
                  <FieldNum label="Guarantee months" value={profile.placement.healthGuaranteeMonths} onChange={(n) => setProfile(p => ({ ...p, placement: { ...p.placement, healthGuaranteeMonths: n } }))} />
                  <FieldNum label="Deposit amount USD" value={profile.placement.depositAmountUSD ?? 0} onChange={(n) => setProfile(p => ({ ...p, placement: { ...p.placement, depositAmountUSD: n || null } }))} />
                </div>

                <div className="md:col-span-2 rounded-md border border-hairline p-3 mt-3">
                  <div className="text-sm font-medium mb-2">Public directory</div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!(profile.publication && profile.publication.publishInDirectory)}
                      onChange={(e) => {
                        const isChecked = (e.currentTarget as HTMLInputElement).checked;
                        setProfile((p) => {
                          const pub = p.publication ?? { publishInDirectory: false, summary: null };
                          return { ...p, publication: { ...pub, publishInDirectory: isChecked } };
                        });
                      }}
                    />
                    <span className="text-sm">Publish this program to the public breeder directory</span>
                  </label>
                  <Hint>Off by default. Turn on to appear in public search.</Hint>

                  <label className="space-y-1 mt-3">
                    <div className="text-xs text-secondary">Directory summary (optional)</div>
                    <textarea
                      className={`bhq-input ${INPUT_CLS} h-24`}
                      placeholder="Short intro that appears in the public directory…"
                      value={profile.publication?.summary ?? ""}
                      onChange={(e) => {
                        const next = e.currentTarget.value || "";
                        setProfile((p) => {
                          const pub = p.publication ?? { publishInDirectory: !!p.publication?.publishInDirectory, summary: null };
                          return { ...p, publication: { ...pub, summary: next || null } };
                        });
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </>
        )}
      </SectionCard>
    );
  }
);

/** ───────── Platform Snapshot (read-only summary with deep links) ───────── */
function Kv({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-1 text-sm">
      <div className="text-secondary w-40 shrink-0">{label}</div>
      <div className="flex-1">{value ?? <span className="text-tertiary">—</span>}</div>
    </div>
  );
}
function Badge({ children }: { children: React.ReactNode }) {
  return <span className="px-2 py-0.5 rounded bg-surface-strong text-xs border border-hairline">{children}</span>;
}

function PlatformSnapshotTab({
  dirty,
  onDirty,
  onEditProfile,
  onEditPhases,
  onEditExactDates,
}: {
  dirty: boolean;
  onDirty: (v: boolean) => void;
  onEditProfile: () => void;
  onEditPhases: () => void;
  onEditExactDates: () => void;
}) {
  React.useEffect(() => onDirty(false), [onDirty]);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>("");
  const [profile, setProfile] = React.useState<BreedingProgramProfile | null>(null);

  React.useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setError("");
        setLoading(true);

        const tenantRaw = await resolveTenantId();
        const tenantId = String(tenantRaw ?? "").trim();
        if (!tenantId) throw new Error("Missing tenant id");

        // Load Program Profile
        const pr = await api.breeding.program.getForTenant(Number(tenantId));
        const profileData = (pr?.data ?? pr) as BreedingProgramProfile;
        if (!ignore) setProfile(profileData);

        // Load Availability and merge with defaults
      } catch (e: any) {
        if (!ignore) setError(e?.message || "Failed to load Program Profile");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
      {loading ? (
        <Card className="p-3 text-sm text-secondary">Loading…</Card>
      ) : (
        <>
          {profile && (
            <Card className="p-3 space-y-3">
              <ProgramProfileSnapshot
                profile={profile}
                onEditProfile={onEditProfile}
                onEditPhases={onEditPhases}
                onEditExactDates={onEditExactDates}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}


/** ───────── Breeds / Users / Groups / Tags (unchanged placeholders + working CRUD) ───────── */
function BreedsTab({ onDirty }: { onDirty: (v: boolean) => void }) {
  React.useEffect(() => onDirty(false), [onDirty]);
  type Species = "DOG" | "CAT" | "HORSE";
  type Canonical = { id: string; name: string; slug?: string | null; species?: Species | null; source: "canonical" };
  type Custom = { id: number; name: string; species?: Species | null; canonicalBreedId?: string | null; source: "custom" };

  const [species, setSpecies] = React.useState<Species>("DOG");
  const [q, setQ] = React.useState(""); const [searching, setSearching] = React.useState(false);
  const [canonResults, setCanonResults] = React.useState<Canonical[]>([]);
  const [customList, setCustomList] = React.useState<Custom[]>([]);
  const [loadingCustom, setLoadingCustom] = React.useState(false);
  const [err, setErr] = React.useState<string>("");

  async function fetchJsonLocal(url: string, init?: RequestInit) { return await fetchJson(url, init); }

  async function loadCustom() {
    try {
      setLoadingCustom(true); setErr("");
      const res = await fetchJsonLocal(`/api/v1/breeds/custom?species=${encodeURIComponent(species)}`);
      const items =
        (Array.isArray(res?.items) && res.items) ||
        (Array.isArray(res?.data?.items) && res.data.items) ||
        (Array.isArray(res) && res) || [];
      setCustomList(items.map((r: any) => ({ id: Number(r.id), name: String(r.name), species: (r.species as Species) ?? null, canonicalBreedId: (r.canonicalBreedId as string) ?? null, source: "custom" })));
    } catch (e: any) { setErr(e?.message || "Failed to load custom breeds"); } finally { setLoadingCustom(false); }
  }
  async function doSearch() {
    try {
      setSearching(true); setErr("");
      const url = `/api/v1/breeds/search?species=${encodeURIComponent(species)}&q=${encodeURIComponent(q)}&limit=25`;
      const res = await fetchJsonLocal(url);
      const items =
        (Array.isArray(res?.items) && res.items) ||
        (Array.isArray(res?.data?.items) && res.data.items) ||
        (Array.isArray(res) && res) || [];
      setCanonResults(items.filter((r: any) => r.source === "canonical").map((r: any) => ({ id: String(r.id), name: String(r.name), slug: r.slug ?? null, species: (r.species as Species) ?? null, source: "canonical" })));
    } catch (e: any) { setErr(e?.message || "Search failed"); } finally { setSearching(false); }
  }
  React.useEffect(() => { loadCustom(); }, [species]);

  async function addCustom(name: string, canonicalBreedId?: string | null) {
    const body = { name, species, canonicalBreedId: canonicalBreedId ?? null };
    const res = await fetchJsonLocal("/api/v1/breeds/custom", { method: "POST", body: JSON.stringify(body) });
    if (res?.error) throw new Error(res?.message || "Create failed");
    await loadCustom();
  }
  async function renameCustom(id: number, name: string) {
    const res = await fetchJsonLocal(`/api/v1/breeds/custom/${id}`, { method: "PATCH", body: JSON.stringify({ name }) });
    if (res?.error) throw new Error(res?.message || "Rename failed");
    await loadCustom();
  }
  async function linkCanonical(id: number, canonicalBreedId: string | null) {
    const res = await fetchJsonLocal(`/api/v1/breeds/custom/${id}`, { method: "PATCH", body: JSON.stringify({ canonicalBreedId }) });
    if (res?.error) throw new Error(res?.message || "Link failed");
    await loadCustom();
  }
  async function removeCustom(id: number) {
    const res = await fetchJsonLocal(`/api/v1/breeds/custom/${id}`, { method: "DELETE" });
    if (res?.error) throw new Error(res?.message || "Delete failed");
    await loadCustom();
  }

  const [newName, setNewName] = React.useState(""); const [linkFor, setLinkFor] = React.useState<number | null>(null);

  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-3">
        <h4 className="font-medium">Breeds (tenant custom and canonical lookup)</h4>
        <p className="text-sm text-secondary">Canonical breeds are read only. Add custom breeds for your org, then optionally link to a canonical breed.</p>
        {err && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

        <div className="flex flex-col md:flex-row gap-3">
          <select className={`bhq-input ${INPUT_CLS} w-40`} value={species} onChange={(e) => setSpecies(e.currentTarget.value as any)}>
            <option value="DOG">Dog</option><option value="CAT">Cat</option><option value="HORSE">Horse</option>
          </select>
          <div className="flex-1 flex gap-2">
            <input className={`bhq-input ${INPUT_CLS} flex-1`} placeholder="Search canonical breeds…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSearch()} />
            <Button size="sm" onClick={doSearch} disabled={searching}>{searching ? "Searching…" : "Search"}</Button>
          </div>
        </div>

        {!!canonResults.length && (
          <div className="rounded-md border border-hairline divide-y divide-hairline">
            {canonResults.map((b) => (
              <div key={b.id} className="flex items-center justify-between px-3 py-2">
                <div className="text-sm"><span className="font-medium">{b.name}</span>{b.slug ? <span className="ml-2 text-tertiary text-xs">({b.slug})</span> : null}</div>
                <div className="flex items-center gap-2">
                  {linkFor != null ? (
                    <Button size="sm" variant="outline" onClick={async () => { try { await linkCanonical(linkFor, b.id); setLinkFor(null); } catch (e: any) { setErr(e?.message || "Link failed"); } }}>
                      Link to selected custom
                    </Button>
                  ) : (
                    <Button size="sm" onClick={async () => { try { await addCustom(b.name, b.id); setQ(""); setCanonResults([]); } catch (e: any) { setErr(e?.message || "Create failed"); } }}>
                      Add as custom
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Your custom breeds ({species.toLowerCase()})</h4>
          <Button size="sm" variant="outline" onClick={loadCustom} disabled={loadingCustom}>{loadingCustom ? "Refreshing…" : "Refresh"}</Button>
        </div>

        <div className="flex gap-2">
          <input className={`bhq-input ${INPUT_CLS} flex-1`} placeholder={`Add custom ${species.toLowerCase()} breed…`} value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={async (e) => { if (e.key === "Enter" && newName.trim()) { try { await addCustom(newName.trim(), null); setNewName(""); } catch (e: any) { setErr(e?.message || "Create failed"); } } }} />
          <Button size="sm" onClick={async () => { if (!newName.trim()) return; try { await addCustom(newName.trim(), null); setNewName(""); } catch (e: any) { setErr(e?.message || "Create failed"); } }}>
            Add
          </Button>
        </div>

        <div className="rounded-md border border-hairline divide-y divide-hairline">
          {customList.length === 0 ? (
            <div className="px-3 py-2 text-sm text-secondary">No custom breeds yet.</div>
          ) : (
            customList.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 gap-3">
                <input className={`bhq-input ${INPUT_CLS} flex-1`} defaultValue={c.name}
                  onBlur={async (e) => {
                    const next = e.currentTarget.value.trim();
                    if (next && next !== c.name) { try { await renameCustom(c.id, next); } catch (e: any) { setErr(e?.message || "Rename failed"); } }
                  }}
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" variant={linkFor === c.id ? "outline" : "secondary"} onClick={() => setLinkFor(linkFor === c.id ? null : c.id)} title="Select this custom breed to link to a canonical result above">
                    {linkFor === c.id ? "Selected" : "Link canonical"}
                  </Button>
                  {c.canonicalBreedId && (
                    <Button size="sm" variant="outline" onClick={async () => { try { await linkCanonical(c.id, null); } catch (e: any) { setErr(e?.message || "Unlink failed"); } }}>
                      Unlink
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={async () => {
                    if (!confirm(`Delete "${c.name}"?`)) return;
                    try { await removeCustom(c.id); } catch (e: any) { setErr(e?.message || "Delete failed"); }
                  }}>Delete</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
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
function TagsTab({ onDirty }: { dirty: boolean; onDirty: (v: boolean) => void }) {
  return (
    <Card className="p-4 space-y-3">
      <h4 className="font-medium">Tag Manager</h4>
      <p className="text-sm text-secondary">Add, rename, and delete tags used across the platform (placeholder).</p>
      <div className="flex gap-2">
        <input className={`bhq-input ${INPUT_CLS} flex-1`} placeholder="New tag" onChange={() => onDirty(true)} />
        <Button size="sm" onClick={() => onDirty(true)}>Add tag</Button>
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


