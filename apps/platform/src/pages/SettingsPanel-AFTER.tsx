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
import { api } from "../api";

/** ───────── Tenant helpers ───────── */
let TENANT_ID_CACHE: string | null = null;
function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}
function readMeta(name: string): string | null {
  const el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  return el?.content?.trim() || null;
}
async function resolveTenantIdSafe(): Promise<string | null> {
  if (TENANT_ID_CACHE) return TENANT_ID_CACHE;
  try {
    const t = await resolveTenantId();
    const s = (t == null ? "" : String(t)).trim();
    if (s) return (TENANT_ID_CACHE = s);
  } catch {}
  const g = (globalThis as any) || {};
  const hinted = g.BHQ_TENANT_ID ?? g.__BHQ_TENANT_ID ?? (window as any).__TENANT_ID ?? null;
  if (hinted) return (TENANT_ID_CACHE = String(hinted).trim());
  try {
    const ls =
      localStorage.getItem("BHQ_TENANT_ID") ||
      localStorage.getItem("X_TENANT_ID") ||
      localStorage.getItem("x-tenant-id") || "";
    if (ls.trim()) return (TENANT_ID_CACHE = ls.trim());
  } catch {}
  const cookieTenant = readCookie("X-Tenant-Id") || readCookie("x-tenant-id");
  if (cookieTenant?.trim()) return (TENANT_ID_CACHE = cookieTenant.trim());
  const metaTenant = readMeta("x-tenant-id") || readMeta("X-Tenant-Id");
  if (metaTenant?.trim()) return (TENANT_ID_CACHE = metaTenant.trim());
  try {
    const res = await fetch("/api/v1/session", { credentials: "include", headers: { Accept: "application/json" } });
    if (res.ok) {
      const j = await res.json().catch(() => ({}));
      const t =
        j?.tenant?.id ?? j?.org?.id ?? j?.organization?.id ??
        j?.user?.tenantId ?? j?.user?.orgId ?? j?.user?.organizationId ?? null;
      if (t) return (TENANT_ID_CACHE = String(t));
    }
  } catch {}
  return null;
}
const TENANT_HEADER = "x-tenant-id";
const ORG_HEADER = "x-org-id";
async function tenantHeaders(): Promise<Record<string, string>> {
  const id = await resolveTenantIdSafe();
  if (!id) return {};
  const clean = String(id).split(",")[0].trim();
  return { [TENANT_HEADER]: clean, [ORG_HEADER]: clean };
}
async function fetchJson(url: string, init: RequestInit = {}) {
  const method = (init.method || "GET").toUpperCase();
  const hasBody = init.body != null && !(method === "GET" || method === "HEAD");
  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(await tenantHeaders()),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  const text = await res.text().catch(() => "");
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg = (body && (body.message || body.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body;
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
  | "programProfile" // NEW top-level
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
      { key: "programProfile", label: "Program Profile" }, // moved here
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
    breeding: false, programProfile: false, users: false, groups: false, tags: false, breeds: false, accessibility: false,
  });
  const profileRef = React.useRef<ProfileHandle>(null);
  const breedingRef = React.useRef<BreedingHandle>(null);
  const programRef = React.useRef<ProgramProfileHandle>(null);
  const [profileTitle, setProfileTitle] = React.useState<string>("");

  React.useEffect(() => { onDirtyChange(!!dirtyMap[active]); }, [active, dirtyMap, onDirtyChange]);
  if (!open) return null;

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
    } catch {}
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
        await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
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

/** ───────── Security (unchanged core) ───────── */
async function getSessionEmail(): Promise<string> {
  const res = await fetch("/api/v1/session", { credentials: "include", headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Unable to load session.");
  const j = await res.json().catch(() => ({}));
  const email = (j?.user?.email ?? "").toString();
  if (!email) throw new Error("Missing email in session.");
  return email;
}
async function verifyViaLogin(email: string, pw: string): Promise<{ ok: boolean; msg?: string }> {
  const res = await fetch("/api/v1/auth/login", {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json", ...(await tenantHeaders()) },
    body: JSON.stringify({ email, password: pw }),
  });
  if (res.ok) return { ok: true };
  let msg = `HTTP ${res.status}`;
  try {
    const j = await res.json();
    if (j?.message && typeof j.message === "string") msg = j.message;
    if (Array.isArray(j) && j.length) {
      const pwErr = j.find((e: any) => Array.isArray(e?.path) && e.path[0] === "password");
      if (pwErr?.code === "too_small" && pwErr?.minimum) msg = `Password must be at least ${pwErr.minimum} characters.`;
      else if (pwErr?.message) msg = pwErr.message;
      else msg = "Invalid password.";
    }
  } catch {}
  return { ok: false, msg };
}
function SecurityTab({ onDirty }: { dirty: boolean; onDirty: (v: boolean) => void }) {
  const [step, setStep] = React.useState<"idle" | "verifying" | "ready">("idle");
  const [verified, setVerified] = React.useState(false);
  const [currentPw, setCurrentPw] = React.useState(""); const [showCurrentPw, setShowCurrentPw] = React.useState(false);
  const [newPw, setNewPw] = React.useState(""); const [showNewPw, setShowNewPw] = React.useState(false);
  const [confirmPw, setConfirmPw] = React.useState(""); const [showConfirmPw, setShowConfirmPw] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string>(""); const [notice, setNotice] = React.useState<string>("");
  React.useEffect(() => { onDirty(false); }, [onDirty]);

  async function verifyCurrentPassword(pw: string): Promise<{ ok: boolean; msg?: string }> {
    setError(""); setNotice(""); setVerified(false); setStep("verifying");
    try {
      const email = await getSessionEmail();
      const result = await verifyViaLogin(email, pw);
      if (result.ok) { setVerified(true); setStep("ready"); setNotice(""); return { ok: true }; }
      setError(result.msg || "Current password is incorrect."); setStep("idle"); return { ok: false, msg: result.msg };
    } catch (e: any) { setError(e?.message || "Unable to verify current password."); setStep("idle"); return { ok: false, msg: e?.message }; }
  }
  async function submitPasswordChange() {
    try {
      setSubmitting(true); setError("");
      if (!newPw || !confirmPw) { setError("Please enter and confirm your new password."); return; }
      if (newPw !== confirmPw) { setError("New password and confirmation do not match."); return; }
      const res = await fetch("/api/v1/auth/password", {
        method: "POST", headers: { "Content-Type": "application/json", ...(await tenantHeaders()) }, credentials: "include",
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j?.message || "Password change failed"); }
      setNotice("Password changed. You will be logged out to reauthenticate…");
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
      window.location.assign("/login");
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
        <h4 className="font-medium">Password</h4>
        {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}
        {notice && <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{notice}</div>}
        {!verified && (
          <label className="space-y-1 max-w-sm">
            <div className="text-xs text-secondary">Current password</div>
            <div className="relative w-80">
              <input className={`bhq-input ${INPUT_CLS} pr-10`} type={showCurrentPw ? "text" : "password"} autoComplete="current-password"
                value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!currentPw) { setError("Please enter your current password."); return; }
                    const r = await verifyCurrentPassword(currentPw);
                    if (r.ok) (document.getElementById("new-password-input") as HTMLInputElement | null)?.focus();
                  }
                }}
              />
              <button type="button" onClick={() => setShowCurrentPw((v) => !v)} className="absolute inset-y-0 right-2 my-auto p-1 text-tertiary hover:text-primary" aria-label={showCurrentPw ? "Hide password" : "Show password"}>
                {showCurrentPw ? EyeOff : Eye}
              </button>
            </div>
            <p className="text-xs text-tertiary">We verify your current password before allowing a change.</p>
          </label>
        )}
        {!verified && (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={async () => {
              if (!currentPw) { setError("Please enter your current password."); return; }
              const res = await verifyCurrentPassword(currentPw);
              if (res.ok) (document.getElementById("new-password-input") as HTMLInputElement | null)?.focus();
            }} disabled={step === "verifying"}>
              {step === "verifying" ? "Verifying…" : "Change password"}
            </Button>
          </div>
        )}
        {verified && (
          <div className="space-y-3">
            <label className="space-y-1 max-w-sm">
              <div className="text-xs text-secondary">New password</div>
              <div className="relative w-80">
                <input id="new-password-input" className={`bhq-input ${INPUT_CLS} pr-10`} type={showNewPw ? "text" : "password"} autoComplete="new-password"
                  value={newPw} onChange={(e) => setNewPw(e.target.value)} onKeyDown={async (e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!newPw) { setError("Please enter your new password."); return; } await submitPasswordChange(); }
                  }} />
                <button type="button" onClick={() => setShowNewPw((v) => !v)} className="absolute inset-y-0 right-2 my-auto p-1 text-tertiary hover:text-primary" aria-label={showNewPw ? "Hide password" : "Show password"}>
                  {showNewPw ? EyeOff : Eye}
                </button>
              </div>
            </label>
            <label className="space-y-1 max-w-sm">
              <div className="text-xs text-secondary">Confirm new password</div>
              <div className="relative w-80">
                <input className={`bhq-input ${INPUT_CLS} pr-10`} type={showConfirmPw ? "text" : "password"} autoComplete="new-password"
                  value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} onKeyDown={async (e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (!newPw || !confirmPw) { setError("Please enter and confirm your new password."); return; }
                      if (newPw !== confirmPw) { setError("New password and confirmation do not match."); return; }
                      await submitPasswordChange();
                    }
                  }} />
                <button type="button" onClick={() => setShowConfirmPw((v) => !v)} className="absolute inset-y-0 right-2 my-auto p-1 text-tertiary hover:text-primary" aria-label={showConfirmPw ? "Hide password" : "Show password"}>
                  {showConfirmPw ? EyeOff : Eye}
                </button>
              </div>
            </label>
            <p className="text-xs text-tertiary">After you change your password, you will be signed out to reauthenticate.</p>
            <div><Button size="sm" onClick={submitPasswordChange} disabled={submitting}>{submitting ? "Submitting…" : "Submit"}</Button></div>
          </div>
        )}
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
type BreedingHandle = { save: () => Promise<void> };
type BreedingSubTab = "general" | "phases" | "dates" | "overrides";
const BREEDING_SUBTABS: Array<{ key: BreedingSubTab; label: string }> = [
  { key: "general", label: "General" },
  { key: "phases", label: "Timeline Phases" },
  { key: "dates", label: "Exact Dates" },
  { key: "overrides", label: "Global Overrides" },
];

const BreedingTab = React.forwardRef<BreedingHandle, { dirty: boolean; onDirty: (v: boolean) => void }>(
  function BreedingTabImpl({ onDirty }, ref) {
    const DEFAULTS: AvailabilityPrefs = DEFAULT_AVAILABILITY_PREFS;

    // Local-only display prefs
    const [showGanttBands, setShowGanttBands] = React.useState<boolean>(() => {
      try { return localStorage.getItem("BHQ_BREEDING_SHOW_GANTT_BANDS") !== "0"; } catch { return true; }
    });
    const [showCalendarBands, setShowCalendarBands] = React.useState<boolean>(() => {
      try { return localStorage.getItem("BHQ_BREEDING_SHOW_CAL_BANDS") !== "0"; } catch { return true; }
    });
    const [ganttHorizonMonths, setGanttHorizonMonths] = React.useState<number>(() => {
      const raw = (localStorage.getItem("BHQ_BREEDING_HORIZON_MONTHS") || "").trim();
      const n = Number(raw); return Number.isFinite(n) && n > 0 ? n : 18;
    });

    const [activeSub, setActiveSub] = React.useState<BreedingSubTab>("general");
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string>("");

    // Server-backed: availability prefs only
    const [initial, setInitial] = React.useState<AvailabilityPrefs>(DEFAULTS);
    const [form, setForm] = React.useState<AvailabilityPrefs>(DEFAULTS);

    const isDirty = React.useMemo(() => {
      const serverDirty = JSON.stringify(form) !== JSON.stringify(initial);
      const localDirty =
        showGanttBands !== (localStorage.getItem("BHQ_BREEDING_SHOW_GANTT_BANDS") !== "0") ||
        showCalendarBands !== (localStorage.getItem("BHQ_BREEDING_SHOW_CAL_BANDS") !== "0") ||
        ganttHorizonMonths !== (Number(localStorage.getItem("BHQ_BREEDING_HORIZON_MONTHS") || "18") || 18);
      return serverDirty || localDirty;
    }, [form, initial, showGanttBands, showCalendarBands, ganttHorizonMonths]);
    React.useEffect(() => onDirty(isDirty), [isDirty, onDirty]);

    React.useEffect(() => {
      let ignore = false;
      (async () => {
        try {
          setLoading(true); setError("");
          const tenantRaw = await resolveTenantId();
          const tenantId = String(tenantRaw ?? "").trim();
          if (!tenantId) throw new Error("Missing tenant id");
          const av = await fetchJson(`/api/v1/tenants/${encodeURIComponent(tenantId)}/availability`);
          const avData = (av?.data ?? av) as Partial<AvailabilityPrefs> | undefined;
          const avMerged: AvailabilityPrefs = { ...DEFAULTS, ...(avData || {}) };
          if (!ignore) { setInitial(avMerged); setForm(avMerged); }
        } catch (e: any) {
          if (!ignore) setError(e?.message || "Failed to load breeding availability");
        } finally { if (!ignore) setLoading(false); }
      })();
      return () => { ignore = true; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function saveAll() {
      setError("");
      try {
        const tenantRaw = await resolveTenantId();
        const tenantId = String(tenantRaw ?? "").trim();
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

        // Save local overrides
        try {
          localStorage.setItem("BHQ_BREEDING_SHOW_GANTT_BANDS", showGanttBands ? "1" : "0");
          localStorage.setItem("BHQ_BREEDING_SHOW_CAL_BANDS", showCalendarBands ? "1" : "0");
          localStorage.setItem("BHQ_BREEDING_HORIZON_MONTHS", String(Math.max(6, Math.min(36, ganttHorizonMonths || 18))));
        } catch {}
        onDirty(false);
      } catch (e: any) {
        setError(e?.message || "Failed to save breeding settings");
      }
    }
    React.useImperativeHandle(ref, () => ({ async save() { await saveAll(); } }));

    function _setPref<K extends keyof AvailabilityPrefs>(key: K, val: number | boolean) {
      setForm((f) => ({ ...f, [key]: val as any } as AvailabilityPrefs));
    }

    // ── Presets A: affect ONLY phase span keys
    function applyPhasePreset(kind: "tight" | "balanced" | "wide") {
      const P = { tight: 0.6, balanced: 1.0, wide: 1.4 }[kind];
      const keys: (keyof AvailabilityPrefs)[] = [
        "testing_unlikely_from_likely_start","testing_unlikely_to_likely_end",
        "testing_risky_from_full_start","testing_risky_to_full_end",
        "post_unlikely_from_likely_start","post_unlikely_to_likely_end",
        "post_risky_from_full_start","post_risky_to_full_end",
      ];
      const next = { ...form };
      for (const k of keys) (next as any)[k] = Math.round(((DEFAULTS as any)[k] || 0) * P);
      setForm(next);
    }
    function resetPhasesToDefaults() {
      const keys: (keyof AvailabilityPrefs)[] = [
        "testing_unlikely_from_likely_start","testing_unlikely_to_likely_end",
        "testing_risky_from_full_start","testing_risky_to_full_end",
        "post_unlikely_from_likely_start","post_unlikely_to_likely_end",
        "post_risky_from_full_start","post_risky_to_full_end",
      ];
      const next = { ...form };
      for (const k of keys) (next as any)[k] = (DEFAULTS as any)[k] ?? 0;
      setForm(next);
    }

    // ── Presets B: affect ONLY per-date keys (date_*), not the toggle
    function applyDatePreset(kind: "tight" | "balanced" | "wide") {
      const P = { tight: 0.6, balanced: 1.0, wide: 1.4 }[kind];
      const next = { ...form };
      (Object.keys(DEFAULTS) as (keyof AvailabilityPrefs)[])
        .filter((k) => String(k).startsWith("date_"))
        .forEach((k) => { (next as any)[k] = Math.round(((DEFAULTS as any)[k] || 0) * P); });
      setForm(next);
    }
    function resetAllDatesToDefaults() {
      const next = { ...form };
      (Object.keys(DEFAULTS) as (keyof AvailabilityPrefs)[])
        .filter((k) => String(k).startsWith("date_"))
        .forEach((k) => { (next as any)[k] = (DEFAULTS as any)[k] ?? 0; });
      setForm(next);
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

    // ── General (Local Display only)
    const GeneralTab = (
      <SectionCard title="Local Display" subtitle="Affects only what you see on this device." right={<Legend />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
            <div className="flex items-center gap-2">
              <span className="text-xs text-secondary">Gantt horizon</span>
              <input
                type="number" min={6} max={36} value={ganttHorizonMonths}
                onChange={(e) => setGanttHorizonMonths(Number(e.currentTarget.value || 18))}
                className="bhq-input w-20 h-8 rounded-md border border-hairline bg-surface px-2 text-sm"
                aria-label="Gantt horizon months"
              />
              <span className="text-xs text-tertiary">months</span>
            </div>
            <Hint>Saved in your browser. Doesn’t change tenant defaults.</Hint>
          </Card>

          <Card className="p-3 space-y-1">
            <div className="text-sm font-medium">What controls availability</div>
            <ul className="list-disc pl-5 text-xs text-secondary space-y-1">
              <li><strong>Timeline Phases</strong> wraps whole windows (Testing→Breeding, Birth→Placement).</li>
              <li><strong>Exact Dates</strong> wraps a single anchor (Cycle, Testing, Breeding, Birth, etc.).</li>
            </ul>
          </Card>
        </div>
      </SectionCard>
    );

    // ── Phases subtab (with Presets A)
    const PhasesTab = (
      <SectionCard title="Timeline Phases" subtitle="Bands that follow a whole phase span." right={<Legend />} className="space-y-4">
        {loading ? <div className="text-sm text-secondary">Loading…</div> : (
          <>
            <Card className="p-3 space-y-2">
              <div className="text-sm font-medium">Presets (Phases)</div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => applyPhasePreset("tight")}>Tight</Button>
                <Button size="sm" variant="outline" onClick={() => applyPhasePreset("balanced")}>Balanced</Button>
                <Button size="sm" variant="outline" onClick={() => applyPhasePreset("wide")}>Wide</Button>
                <Button size="sm" variant="ghost" onClick={resetPhasesToDefaults}>Reset to defaults</Button>
              </div>
              <Hint>Only affects the phase-span fields; Exact Dates are untouched here.</Hint>
            </Card>

            <PhaseBlock
              title="Testing → Breeding"
              unlikelyBeforeKey="testing_unlikely_from_likely_start"
              unlikelyAfterKey="testing_unlikely_to_likely_end"
              riskyBeforeKey="testing_risky_from_full_start"
              riskyAfterKey="testing_risky_to_full_end"
              form={form} setForm={setForm} defaults={DEFAULTS}
            />

            <PhaseBlock
              title="Birth → Placement"
              unlikelyBeforeKey="post_unlikely_from_likely_start"
              unlikelyAfterKey="post_unlikely_to_likely_end"
              riskyBeforeKey="post_risky_from_full_start"
              riskyAfterKey="post_risky_to_full_end"
              form={form} setForm={setForm} defaults={DEFAULTS}
            />
          </>
        )}
      </SectionCard>
    );

    // ── Dates subtab (with Presets B + placement toggle)
    const DatesTab = (
      <SectionCard title="Exact Dates" subtitle="Wrap a single expected or actual calendar date." right={<Legend />} className="space-y-4">
        {loading ? <div className="text-sm text-secondary">Loading…</div> : (
          <>
            <Card className="p-3 space-y-2">
              <div className="text-sm font-medium">Presets (Exact Dates)</div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => applyDatePreset("tight")}>Tight</Button>
                <Button size="sm" variant="outline" onClick={() => applyDatePreset("balanced")}>Balanced</Button>
                <Button size="sm" variant="outline" onClick={() => applyDatePreset("wide")}>Wide</Button>
                <Button size="sm" variant="ghost" onClick={resetAllDatesToDefaults}>Reset all dates</Button>
              </div>
              <Hint>Only affects date_* fields; Phase spans are untouched here.</Hint>
            </Card>

            <MiniPreview form={form} placementEnabled={!!form.placement_start_enable_bands} />

            <ExactDateRow title="Cycle Start"
              riskyFromKey="date_cycle_risky_from" riskyToKey="date_cycle_risky_to"
              unlikelyFromKey="date_cycle_unlikely_from" unlikelyToKey="date_cycle_unlikely_to"
              form={form} setForm={setForm} derivedDefaults={DEFAULTS}
            />
            <ExactDateRow title="Testing Start"
              riskyFromKey="date_testing_risky_from" riskyToKey="date_testing_risky_to"
              unlikelyFromKey="date_testing_unlikely_from" unlikelyToKey="date_testing_unlikely_to"
              form={form} setForm={setForm} derivedDefaults={DEFAULTS}
            />
            <ExactDateRow title="Breeding"
              riskyFromKey="date_breeding_risky_from" riskyToKey="date_breeding_risky_to"
              unlikelyFromKey="date_breeding_unlikely_from" unlikelyToKey="date_breeding_unlikely_to"
              form={form} setForm={setForm} derivedDefaults={DEFAULTS}
            />
            <ExactDateRow title="Birth"
              riskyFromKey="date_birth_risky_from" riskyToKey="date_birth_risky_to"
              unlikelyFromKey="date_birth_unlikely_from" unlikelyToKey="date_birth_unlikely_to"
              form={form} setForm={setForm} derivedDefaults={DEFAULTS}
            />
            <ExactDateRow title="Weaned"
              riskyFromKey="date_weaned_risky_from" riskyToKey="date_weaned_risky_to"
              unlikelyFromKey="date_weaned_unlikely_from" unlikelyToKey="date_weaned_unlikely_to"
              form={form} setForm={setForm} derivedDefaults={DEFAULTS}
            />

            {/* Toggle for Placement Start bands */}
            <Card className="p-3 space-y-2">
              <div className="text-sm font-medium">Placement Start bands</div>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!form.placement_start_enable_bands}
                  onChange={(e) => _setPref("placement_start_enable_bands", e.currentTarget.checked)}
                />
                <span className="text-sm">Enable per-date bands for Placement Start</span>
              </label>
              {form.placement_start_enable_bands && (
                <ExactDateRow title="Placement Start"
                  riskyFromKey="date_placement_start_risky_from" riskyToKey="date_placement_start_risky_to"
                  unlikelyFromKey="date_placement_start_unlikely_from" unlikelyToKey="date_placement_start_unlikely_to"
                  form={form} setForm={setForm} derivedDefaults={DEFAULTS}
                />
              )}
            </Card>

            <ExactDateRow title="Placement Completed"
              riskyFromKey="date_placement_completed_risky_from" riskyToKey="date_placement_completed_risky_to"
              unlikelyFromKey="date_placement_completed_unlikely_from" unlikelyToKey="date_placement_completed_unlikely_to"
              form={form} setForm={setForm} derivedDefaults={DEFAULTS}
            />
          </>
        )}
      </SectionCard>
    );

    // ── Local overrides subtab (same as before)
    const OverridesTab = (
      <SectionCard title="Global overrides" subtitle="Saved in your browser as your personal defaults." className="space-y-3">
        <TwoCol>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showGanttBands} onChange={(e) => setShowGanttBands(e.currentTarget.checked)} />
            <span className="text-sm">Show Availability Bands by default in Gantt</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showCalendarBands} onChange={(e) => setShowCalendarBands(e.currentTarget.checked)} />
            <span className="text-sm">Show Availability Bands by default in Calendar</span>
          </label>
        </TwoCol>
        <label className="space-y-1 mt-3">
          <div className="text-xs text-secondary">Default Gantt chart horizon in months</div>
          <input
            type="number" className="bhq-input w-40 h-9 rounded-md border border-hairline bg-surface px-2 text-sm"
            min={6} max={36} value={ganttHorizonMonths}
            onChange={(e) => setGanttHorizonMonths(Number(e.currentTarget.value || 18))}
          />
          <Hint>Range 6 to 36. Default is 18.</Hint>
        </label>
        <div className="flex items-center gap-2 mt-2">
          <Button size="sm" variant="outline" onClick={() => {
            try {
              setShowGanttBands(localStorage.getItem("BHQ_BREEDING_SHOW_GANTT_BANDS") !== "0");
              setShowCalendarBands(localStorage.getItem("BHQ_BREEDING_SHOW_CAL_BANDS") !== "0");
              const hm = Number(localStorage.getItem("BHQ_BREEDING_HORIZON_MONTHS") || "18") || 18;
              setGanttHorizonMonths(hm);
            } catch {
              setShowGanttBands(true); setShowCalendarBands(true); setGanttHorizonMonths(18);
            }
          }}>Reset to Default</Button>
        </div>
      </SectionCard>
    );

    return (
      <div className="space-y-6">
        {HELP_BOX}
        {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}
        {Tabs}
        {activeSub === "general" && GeneralTab}
        {activeSub === "phases" && PhasesTab}
        {activeSub === "dates" && DatesTab}
        {activeSub === "overrides" && OverridesTab}
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
      // NOTE: availabilityDefaults removed from here; display is local
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
          const tenantRaw = await resolveTenantId();
          const tenantId = String(tenantRaw ?? "").trim();
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

    // Import/Export (moved here). Export both Program Profile & Availability prefs.
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
function exactDateInvalid(from: number, to: number): boolean { return bandWidth(from, to) < 0; }
function phaseInvalid(beforeDays: number, afterDays: number): boolean { return bandWidth(-Math.abs(beforeDays || 0), Math.abs(afterDays || 0)) < 0; }

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
      <span className="text-tertiary">Sort order is by start date.</span>
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

/** Mini preview for date offsets */
function MiniPreview({ form, placementEnabled }: { form: AvailabilityPrefs; placementEnabled: boolean }) {
  const today = new Date();
  const W = 320, H = 12, PAD = 6, TOTAL = 120;
  const cx = (n: number) => Math.round(((n + TOTAL / 2) / TOTAL) * (W - PAD * 2)) + PAD;
  const anchors = [
    { label: "Cycle", f: form.date_cycle_risky_from, t: form.date_cycle_risky_to, uf: form.date_cycle_unlikely_from, ut: form.date_cycle_unlikely_to },
    { label: "Breed", f: form.date_breeding_risky_from, t: form.date_breeding_risky_to, uf: form.date_breeding_unlikely_from, ut: form.date_breeding_unlikely_to },
    { label: "Birth", f: form.date_birth_risky_from, t: form.date_birth_risky_to, uf: form.date_birth_unlikely_from, ut: form.date_birth_unlikely_to },
    ...(placementEnabled ? [{
      label: "Place ▶", f: form.date_placement_start_risky_from, t: form.date_placement_start_risky_to,
      uf: form.date_placement_start_unlikely_from, ut: form.date_placement_start_unlikely_to
    }] : []),
  ];
  return (
    <div className="rounded-md border border-hairline p-2 bg-surface">
      <div className="text-xs text-secondary mb-1">Live preview (relative to today)</div>
      <div className="space-y-2">
        {anchors.map((a) => {
          const riskyW = Math.max(0, cx(a.t) - cx(a.f));
          const unlikW = Math.max(0, cx(a.ut) - cx(a.uf));
          return (
            <div key={a.label} className="flex items-center gap-2">
              <div className="w-16 text-[11px] text-right text-secondary">{a.label}</div>
              <svg width={W} height={H + 2} className="shrink-0">
                <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke="currentColor" opacity="0.25" />
                <rect x={cx(a.uf)} y={1} width={unlikW} height={H - 2} fill="currentColor" opacity="0.15" stroke="currentColor" strokeOpacity="0.4" />
                <rect x={cx(a.f)} y={3} width={riskyW} height={H - 6} fill="currentColor" opacity="0.3" stroke="currentColor" strokeOpacity="0.5" />
              </svg>
            </div>
          );
        })}
      </div>
      <div className="mt-1 text-[10px] text-tertiary">Today is the vertical line. Bars update as you type.</div>
    </div>
  );
}

/** Phase editor block */
function FieldNumDerived(props: {
  label: string; value: number; derived: number; onChange: (n: number) => void; onReset?: () => void; invalid?: boolean; help?: string;
}) {
  const { label, value, derived, onChange, onReset, invalid, help } = props;
  const delta = Math.round((value || 0) - (derived || 0));
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
      </div>
      <input
        type="number"
        className={[
          "bhq-input w-28 h-9 rounded-md border bg-surface px-2 text-sm",
          invalid ? "border-red-500/60 focus:shadow-[0_0_0_2px_rgba(244,63,94,.6)]" : "border-hairline",
        ].join(" ")}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.currentTarget.value || 0))}
        aria-invalid={invalid ? "true" : "false"}
      />
      {help ? <p className="text-[10px] text-tertiary">{help}</p> : null}
    </label>
  );
}
function ExactDateRow(props: {
  title: string;
  riskyFromKey: keyof AvailabilityPrefs; riskyToKey: keyof AvailabilityPrefs;
  unlikelyFromKey: keyof AvailabilityPrefs; unlikelyToKey: keyof AvailabilityPrefs;
  form: AvailabilityPrefs; setForm: React.Dispatch<React.SetStateAction<AvailabilityPrefs>>;
  derivedDefaults?: AvailabilityPrefs;
}) {
  const { title, riskyFromKey, riskyToKey, unlikelyFromKey, unlikelyToKey, form, setForm, derivedDefaults } = props;
  const DER = derivedDefaults || DEFAULT_AVAILABILITY_PREFS;
  const riskyFrom = Number(form[riskyFromKey] ?? 0), riskyTo = Number(form[riskyToKey] ?? 0);
  const unrFrom = Number(form[unlikelyFromKey] ?? 0), unrTo = Number(form[unlikelyToKey] ?? 0);
  const invalidRisky = exactDateInvalid(riskyFrom, riskyTo); const invalidUnlk = exactDateInvalid(unrFrom, unrTo);
  function set<K extends keyof AvailabilityPrefs>(key: K, val: number) { setForm((f) => ({ ...f, [key]: val } as AvailabilityPrefs)); }
  function resetRow() {
    setForm((f) => ({
      ...f,
      [riskyFromKey]: (DER as any)[riskyFromKey] ?? 0,
      [riskyToKey]: (DER as any)[riskyToKey] ?? 0,
      [unlikelyFromKey]: (DER as any)[unlikelyFromKey] ?? 0,
      [unlikelyToKey]: (DER as any)[unlikelyToKey] ?? 0,
    } as AvailabilityPrefs));
  }
  return (
    <div className="rounded-md border border-hairline p-3 bg-surface space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{title}</div>
        <Button size="xs" variant="outline" onClick={resetRow} title="Reset all four fields in this row">Reset row</Button>
      </div>
      <div className="space-y-3">
        <TwoCol>
          <FieldNumDerived label="Unlikely: days before" value={unrFrom} derived={Number((DER as any)[unlikelyFromKey] ?? 0)} onChange={(n) => set(unlikelyFromKey, n)} onReset={() => set(unlikelyFromKey, Number((DER as any)[unlikelyFromKey] ?? 0))} invalid={invalidUnlk} help={invalidUnlk ? "Unlikely band collapses (to < from)." : undefined} />
          <FieldNumDerived label="Unlikely: days after" value={unrTo} derived={Number((DER as any)[unlikelyToKey] ?? 0)} onChange={(n) => set(unlikelyToKey, n)} onReset={() => set(unlikelyToKey, Number((DER as any)[unlikelyToKey] ?? 0))} invalid={invalidUnlk} />
        </TwoCol>
        <TwoCol>
          <FieldNumDerived label="Risky: days before" value={riskyFrom} derived={Number((DER as any)[riskyFromKey] ?? 0)} onChange={(n) => set(riskyFromKey, n)} onReset={() => set(riskyFromKey, Number((DER as any)[riskyFromKey] ?? 0))} invalid={invalidRisky} help={invalidRisky ? "Risky band collapses (to < from)." : undefined} />
          <FieldNumDerived label="Risky: days after" value={riskyTo} derived={Number((DER as any)[riskyToKey] ?? 0)} onChange={(n) => set(riskyToKey, n)} onReset={() => set(riskyToKey, Number((DER as any)[riskyToKey] ?? 0))} invalid={invalidRisky} />
        </TwoCol>
      </div>
    </div>
  );
}
function PhaseBlock(props: {
  title: string;
  unlikelyBeforeKey: keyof AvailabilityPrefs; unlikelyAfterKey: keyof AvailabilityPrefs;
  riskyBeforeKey: keyof AvailabilityPrefs; riskyAfterKey: keyof AvailabilityPrefs;
  form: AvailabilityPrefs; setForm: React.Dispatch<React.SetStateAction<AvailabilityPrefs>>; defaults: AvailabilityPrefs;
}) {
  const { title, unlikelyBeforeKey, unlikelyAfterKey, riskyBeforeKey, riskyAfterKey, form, setForm, defaults } = props;
  const set = <K extends keyof AvailabilityPrefs>(k: K, n: number) => setForm((f) => ({ ...f, [k]: n } as AvailabilityPrefs));
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
