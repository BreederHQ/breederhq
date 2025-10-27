// apps/platform/src/pages/SettingsPanel.tsx
import React from "react";
import { Button, Card } from "@bhq/ui";
import { createPortal } from "react-dom";
import { getOverlayRoot } from "@bhq/ui/overlay";
import { useUiScale } from "@bhq/ui/settings/UiScaleProvider";

function getAuthHeaders(): Record<string, string> {
  const w = window as any;

  const fromGlobal = Number(w.__BHQ_TENANT_ID__);

  const fromLS = (() => {
    try {
      const s = localStorage.getItem("BHQ_TENANT_ID");
      return s ? Number(s) : NaN;
    } catch {
      return NaN;
    }
  })();

  function readTenantFromCookie(): number {
    try {
      const raw = document.cookie.split("; ").find(s => s.startsWith("bhq_s="))?.split("=")[1] || "";
      if (!raw) return NaN;
      const json = atob(raw.replace(/-/g, "+").replace(/_/g, "/"));
      const obj = JSON.parse(json);
      const t = Number(obj?.tenantId || obj?.orgId);
      return Number.isFinite(t) && t > 0 ? t : NaN;
    } catch {
      return NaN;
    }
  }

  const tenantId =
    (Number.isFinite(fromGlobal) && fromGlobal > 0 ? fromGlobal :
      Number.isFinite(fromLS) && fromLS > 0 ? fromLS :
        readTenantFromCookie());

  const headers: Record<string, string> = {};
  if (Number.isFinite(tenantId) && tenantId > 0) {
    headers["X-Tenant-Id"] = String(tenantId);
    headers["X-Org-Id"] = String(tenantId);
  }
  return headers;
}

async function fetchJson(url: string, init: RequestInit = {}) {
  const method = (init.method || "GET").toUpperCase();
  const hasBody = init.body != null && !(method === "GET" || method === "HEAD");

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...getAuthHeaders(),
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers,
  });

  const text = await res.text().catch(() => "");
  const body = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const msg = (body && (body.message || body.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return body;
}

/** ───────── Accessibility tab (UI scale) ───────── */
function AccessibilityTab() {
  const { scale, setScale } = useUiScale();
  const percent = Math.round(Number.isFinite(scale) ? (scale as number) * 100 : 100);

  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-4">
        <h4 className="font-medium">Interface scale</h4>
        <p className="text-sm text-secondary">
          Adjust text and spacing across all modules. Changes apply instantly and persist for your browser.
        </p>

        <div className="flex items-center gap-4">
          <div className="text-sm w-24">
            Scale: <span className="font-medium">{percent}%</span>
          </div>
          <input
            type="range"
            min={75}
            max={200}
            step={5}
            value={percent}
            onChange={(e) => setScale(Number(e.currentTarget.value) / 100)}
            className="flex-1"
            aria-label="UI scale"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setScale(0.9)}>90%</Button>
          <Button size="sm" variant="outline" onClick={() => setScale(1.0)}>100%</Button>
          <Button size="sm" variant="outline" onClick={() => setScale(1.1)}>110%</Button>
          <Button size="sm" variant="outline" onClick={() => setScale(1.25)}>125%</Button>
          <Button size="sm" variant="outline" onClick={() => setScale(1.5)}>150%</Button>
        </div>

        <p className="text-xs text-tertiary">
          Tip: scaling works best when components use rem units. Your UI kit already does this in most places.
        </p>
      </Card>
    </div>
  );
}

/** ─────────── Phone helpers (inline, no new file) ─────────── */
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

function normalizeCountryCode(v: string | null | undefined): string {
  return (v || "").trim().toUpperCase();
}

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
  return countries.some(c => c.code === code) ? code : "";
}

export function countryNameFromValue(country: string, countries: CountryDef[]): string {
  const code = normalizeCountryCode(country);
  const found = countries.find(c => c.code === code);
  return found ? found.name : "";
}

function dialForCode(code: string, countries: CountryDef[]): string {
  const found = countries.find(c => c.code === normalizeCountryCode(code));
  return found?.dial || "";
}

export function IntlPhoneField(props: {
  value: string;
  onChange: (next: string) => void;
  inferredCountryName?: string;
  countries: CountryDef[];
  className?: string;
}) {
  const { value, onChange, inferredCountryName, countries, className } = props;

  const initialCode = React.useMemo(() => {
    const byPrefix = countries.find(c => value?.startsWith(c.dial + " "));
    if (byPrefix) return byPrefix.code;
    const byName = countries.find(c => c.name === inferredCountryName);
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
      const a = digits.slice(0, 3);
      const b = digits.slice(3, 6);
      const c = digits.slice(6, 10);
      if (digits.length <= 3) return a;
      if (digits.length <= 6) return `(${a}) ${b}`;
      return `(${a}) ${b}-${c}`;
    }
    return input;
  }

  return (
    <div className={["flex gap-2 items-stretch w-full", className].filter(Boolean).join(" ")}>
      <select
        className={[
          "bhq-input", INPUT_CLS,
          "w-32 md:w-40",
          "max-w-[40%]",
          "truncate",
        ].join(" ")}
        value={code}
        onChange={(e) => handleCountryChange(e.currentTarget.value)}
        title={countryNameFromValue(code, countries)}
      >
        {countries.map(c => (
          <option key={c.code} value={c.code} title={`${c.name} ${c.dial}`}>
            {c.code} {c.dial}
          </option>
        ))}
      </select>

      <div className="flex-1 flex min-w-0">
        <div className="flex items-center px-3 border border-hairline rounded-l-md bg-surface text-sm shrink-0">
          {dial}
        </div>
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
    const a = d.slice(0, 3);
    const b = d.slice(3, 6);
    const c = d.slice(6, 10);
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

const INPUT_CLS =
  "w-full h-10 rounded-md border border-hairline bg-surface px-3 text-sm " +
  "text-primary placeholder:text-tertiary outline-none " +
  "focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]";

type Tab =
  | "profile"
  | "security"
  | "subscription"
  | "payments"
  | "transactions"
  | "breeding"
  | "breeds"
  | "users"
  | "groups"
  | "tags"
  | "accessibility";

type Props = {
  open: boolean;
  dirty: boolean;
  onDirtyChange: (v: boolean) => void;
  onClose: () => void;
};

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

export default function SettingsPanel({ open, dirty, onDirtyChange, onClose }: Props) {
  const [active, setActive] = React.useState<Tab>("profile");
  const [dirtyMap, setDirtyMap] = React.useState<Record<Tab, boolean>>({
    profile: false,
    security: false,
    subscription: false,
    payments: false,
    transactions: false,
    breeding: false,
    users: false,
    groups: false,
    tags: false,
    breeds: false,
    accessibility: false,
  });
  const profileRef = React.useRef<ProfileHandle>(null);
  const [profileTitle, setProfileTitle] = React.useState<string>("");

  React.useEffect(() => {
    onDirtyChange(!!dirtyMap[active]);
  }, [active, dirtyMap, onDirtyChange]);

  if (!open) return null;

  function markDirty(tab: Tab, isDirty: boolean) {
    setDirtyMap((m) => (m[tab] === isDirty ? m : { ...m, [tab]: isDirty }));
  }

  function trySwitch(next: Tab) {
    if (dirtyMap[active]) {
      const el = document.getElementById("bhq-settings-dirty-banner");
      if (el) {
        el.classList.remove("opacity-0");
        el.classList.add("opacity-100");
        setTimeout(() => el.classList.add("animate-pulse"), 0);
        setTimeout(() => {
          el.classList.remove("animate-pulse");
          el.classList.add("opacity-0");
        }, 1500);
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
                            active === t.key
                              ? "bg-surface-strong text-primary"
                              : "hover:bg-surface-strong/60 text-secondary",
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
              {/* header with Save + Close */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-hairline">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">
                    {active === "profile" && profileTitle ? `Profile - ${profileTitle}` : getTabLabel(active)}
                  </h3>
                </div>

                <div className="flex items-end gap-3">
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleClose}
                        disabled={dirty}
                        title={dirty ? "Save or discard changes before closing" : "Close settings"}
                      >
                        Close
                      </Button>
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (active === "profile") {
                            await profileRef.current?.save();
                            markDirty("profile", false);
                          } else {
                            await saveActive(active, markDirty);
                          }
                        }}
                        disabled={!dirtyMap[active]}
                        title="Save changes"
                      >
                        Save
                      </Button>
                    </div>

                    <span
                      id="bhq-settings-dirty-banner"
                      className={[
                        "text-xs rounded px-2 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30",
                        active !== "security" && dirtyMap[active] ? "opacity-100" : "opacity-0",
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
                  <ProfileTab
                    ref={profileRef}
                    dirty={dirtyMap.profile}
                    onDirty={(v) => markDirty("profile", v)}
                    onTitle={setProfileTitle}
                  />
                )}
                {active === "security" && (
                  <SecurityTab dirty={dirtyMap.security} onDirty={(v) => markDirty("security", v)} />
                )}
                {active === "subscription" && (
                  <SubscriptionTab dirty={dirtyMap.subscription} onDirty={(v) => markDirty("subscription", v)} />
                )}
                {active === "payments" && (
                  <PaymentsTab dirty={dirtyMap.payments} onDirty={(v) => markDirty("payments", v)} />
                )}
                {active === "transactions" && (
                  <TransactionsTab dirty={dirtyMap.transactions} onDirty={(v) => markDirty("transactions", v)} />
                )}
                {active === "breeding" && (
                  <BreedingTab dirty={dirtyMap.breeding} onDirty={(v) => markDirty("breeding", v)} />
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

/** Save dispatcher. Replace internals with real API calls for each tab. */
async function saveActive(tab: Tab, markDirty: (tab: Tab, v: boolean) => void) {
  await new Promise((r) => setTimeout(r, 250));
  markDirty(tab, false);
}

/** ─────────── Minimal tab scaffolds — mark dirty on any change ─────────── */

function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={["bhq-input", INPUT_CLS, props.className].filter(Boolean).join(" ")}
    />
  );
}

type ProfileHandle = { save: () => Promise<void> };

type ProfileForm = {
  userName: string;
  userEmail: string;
  phoneE164: string;
  whatsappE164: string;
  street: string;
  street2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

function mapUserToProfileForm(u: any, countries: CountryDef[]): ProfileForm {
  const email = String(u?.email ?? "");
  let userName = String(u?.name ?? "");
  if (!userName && email) {
    const local = email.split("@")[0] || "";
    const parts = local.replace(/[._-]+/g, " ").split(/\s+/);
    userName = [parts[0] || "", parts.slice(1).join(" ")].filter(Boolean).join(" ");
  }
  return {
    userName,
    userEmail: email,
    phoneE164: String(u?.phoneE164 ?? ""),
    whatsappE164: String(u?.whatsappE164 ?? ""),
    street: String(u?.street ?? ""),
    street2: String(u?.street2 ?? ""),
    city: String(u?.city ?? ""),
    state: String(u?.state ?? ""),
    postalCode: String(u?.postalCode ?? ""),
    country: asCountryCode(String(u?.country ?? "").toUpperCase(), countries),
  };
}

const ProfileTab = React.forwardRef<ProfileHandle, {
  dirty: boolean;
  onDirty: (v: boolean) => void;
  onTitle: (t: string) => void;
}>(function ProfileTabImpl({ onDirty, onTitle }, ref) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>("");
  const countries = useCountries();
  const [emailEdit] = React.useState(false);
  const emailInputRef = React.useRef<HTMLInputElement>(null);

  const empty: ProfileForm = {
    userName: "",
    userEmail: "",
    phoneE164: "",
    whatsappE164: "",
    street: "",
    street2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  };

  const [initial, setInitial] = React.useState<ProfileForm>(empty);
  const [form, setForm] = React.useState<ProfileForm>(empty);

  const isDirty = React.useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);
  React.useEffect(() => onDirty(isDirty), [isDirty, onDirty]);

  async function getSessionUserId(): Promise<{ id: string; email: string }> {
    const res = await fetch("/api/v1/session", {
      credentials: "include",
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      window.location.assign("/login");
      throw new Error("Unauthorized");
    }
    if (!res.ok) throw new Error("Failed to load current session");
    const j = await res.json().catch(() => ({}));
    const id = String(j?.user?.id || "");
    const email = String(j?.user?.email || "");
    if (!id) throw new Error("Missing user id in session");
    return { id, email };
  }

  async function guardEmailChange(currentEmail: string): Promise<boolean> {
    const pw = window.prompt("To change your email, enter your current password:");
    if (!pw) return false;
    const result = await verifyViaLogin(currentEmail, pw);
    if (!result.ok) {
      throw new Error(result.msg || "Could not verify current password.");
    }
    return true;
  }

  React.useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError("");

        const { id } = await getSessionUserId();
        const u = await fetchJson(`/api/v1/users/${encodeURIComponent(id)}`, { method: "GET" });
        const next = mapUserToProfileForm(u, countries);

        if (!ignore) {
          setInitial(next);
          setForm(next);
          onTitle(next.userName || next.userEmail || "Profile");
        }
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
        name: form.userName,
        email: form.userEmail.trim().toLowerCase(),
        phoneE164: e164FromDisplay(displayFromE164(form.phoneE164, countries) || form.phoneE164) || null,
        whatsappE164: e164FromDisplay(displayFromE164(form.whatsappE164, countries) || form.whatsappE164) || null,
        street: form.street || null,
        street2: form.street2 || null,
        city: form.city || null,
        state: form.state || null,
        postalCode: form.postalCode || null,
        country: asCountryCode((form.country || "").toUpperCase(), countries) || null,
      };

      const mapInit: any = {
        name: initial.userName,
        email: initial.userEmail,
        phoneE164: initial.phoneE164 || null,
        whatsappE164: initial.whatsappE164 || null,
        street: initial.street || null,
        street2: initial.street2 || null,
        city: initial.city || null,
        state: initial.state || null,
        postalCode: initial.postalCode || null,
        country: initial.country || null,
      };

      const changed = Object.fromEntries(
        Object.entries(bodyAll).filter(([k, v]) => v !== mapInit[k])
      );

      if (Object.keys(changed).length === 0) return;

      const res = await fetch(`/api/v1/users/${encodeURIComponent(id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(changed),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || j?.error || "User save failed");
      }

      if (changed.email) {
        await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include", headers: getAuthHeaders() }).catch(() => { });
        window.location.assign("/login");
        return;
      }

      const saved = await res.json().catch(() => ({}));
      const next = mapUserToProfileForm(saved, countries);
      setInitial(next);
      setForm(next);
      onDirty(false);
    },
  }));

  return (
    <Card className="p-4 space-y-4">
      {loading ? (
        <div className="text-sm text-secondary">Loading profile…</div>
      ) : (
        <>
          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="rounded-xl border border-hairline bg-surface p-3">
            <div className="mb-2 text-xs uppercase tracking-wide text-secondary">Account</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="space-y-1 md:col-span-2">
                <div className="text-xs text-secondary">Full Name</div>
                <input
                  className={`bhq-input ${INPUT_CLS}`}
                  autoComplete="name"
                  value={form.userName}
                  onChange={(e) => setForm((f) => ({ ...f, userName: e.target.value }))}
                />
              </label>

              <label className="space-y-1 md:col-span-2">
                <div className="text-xs text-secondary">Email Address (username)</div>
                <div className="flex items-center gap-2">
                  <input
                    className={`bhq-input ${INPUT_CLS} w-auto flex-1 min-w-0`}
                    type="email"
                    autoComplete="email"
                    value={form.userEmail}
                    readOnly={true}
                    onChange={(e) => setForm((f) => ({ ...f, userEmail: e.target.value }))}
                  />
                </div>
                <p className="text-[11px] text-tertiary">
                  Changing your email will require re-auth and will sign you out after saving.
                </p>
              </label>
            </div>
          </div>

          <label className="space-y-1">
            <div className="text-xs text-secondary">Phone</div>
            <IntlPhoneField
              value={displayFromE164(form.phoneE164, countries)}
              onChange={(nextDisplay) => {
                const e164 = e164FromDisplay(nextDisplay);
                setForm((f) => ({ ...f, phoneE164: e164 }));
              }}
              inferredCountryName={countryNameFromValue(form.country, countries)}
              countries={countries}
              className="w-full"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <div className="text-xs text-secondary">WhatsApp</div>
            <IntlPhoneField
              value={displayFromE164(form.whatsappE164, countries)}
              onChange={(nextDisplay) => {
                const e164 = e164FromDisplay(nextDisplay);
                setForm((f) => ({ ...f, whatsappE164: e164 }));
              }}
              inferredCountryName={countryNameFromValue(form.country, countries)}
              countries={countries}
              className="w-full"
            />
          </label>

          <div className="rounded-xl border border-hairline bg-surface p-3">
            <div className="mb-2 text-xs uppercase tracking-wide text-secondary">Address</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className={`bhq-input ${INPUT_CLS} md:col-span-2`}
                placeholder="Street"
                value={form.street}
                onChange={(e) => setForm(f => ({ ...f, street: e.target.value }))}
              />
              <input
                className={`bhq-input ${INPUT_CLS} md:col-span-2`}
                placeholder="Street 2"
                value={form.street2}
                onChange={(e) => setForm(f => ({ ...f, street2: e.target.value }))}
              />
              <input
                className={`bhq-input ${INPUT_CLS}`}
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
              />
              <input
                className={`bhq-input ${INPUT_CLS}`}
                placeholder="State / Region"
                value={form.state}
                onChange={(e) => setForm(f => ({ ...f, state: e.target.value }))}
              />
              <input
                className={`bhq-input ${INPUT_CLS}`}
                placeholder="Postal Code"
                value={form.postalCode}
                onChange={(e) => setForm(f => ({ ...f, postalCode: e.target.value }))}
              />
              <select
                className={["bhq-input", INPUT_CLS].join(" ")}
                value={asCountryCode(form.country, countries)}
                onChange={(e) => {
                  const code = e.currentTarget.value || "";
                  setForm(f => ({ ...f, country: code }));
                }}
              >
                <option value="">Country</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}
    </Card>
  );
});

/** ───────── Password verification via login endpoint ───────── */
async function getSessionEmail(): Promise<string> {
  const res = await fetch("/api/v1/session", { credentials: "include" });
  if (!res.ok) throw new Error("Unable to load session.");
  const j = await res.json().catch(() => ({}));
  const email = (j?.user?.email ?? "").toString();
  if (!email) throw new Error("Missing email in session.");
  return email;
}

async function verifyViaLogin(email: string, pw: string): Promise<{ ok: boolean; msg?: string }> {
  const res = await fetch("/api/v1/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pw }),
  });

  if (res.ok) return { ok: true };

  let msg = `HTTP ${res.status}`;
  try {
    const j = await res.json();
    if (j?.message && typeof j.message === "string") msg = j.message;
    if (Array.isArray(j) && j.length) {
      const pwErr = j.find((e: any) => Array.isArray(e?.path) && e.path[0] === "password");
      if (pwErr?.code === "too_small" && pwErr?.minimum) {
        msg = `Password must be at least ${pwErr.minimum} characters.`;
      } else if (pwErr?.message) {
        msg = pwErr.message;
      } else {
        msg = "Invalid password.";
      }
    }
  } catch {
    /* keep default msg */
  }
  return { ok: false, msg };
}

function SecurityTab({ onDirty }: { dirty: boolean; onDirty: (v: boolean) => void }) {
  const [step, setStep] = React.useState<'idle' | 'verifying' | 'ready'>('idle');
  const [verified, setVerified] = React.useState(false);

  const [currentPw, setCurrentPw] = React.useState('');
  const [showCurrentPw, setShowCurrentPw] = React.useState(false);

  const [newPw, setNewPw] = React.useState('');
  const [showNewPw, setShowNewPw] = React.useState(false);

  const [confirmPw, setConfirmPw] = React.useState('');
  const [showConfirmPw, setShowConfirmPw] = React.useState(false);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const [notice, setNotice] = React.useState<string>('');

  React.useEffect(() => {
    onDirty(false);
  }, [onDirty]);

  async function verifyCurrentPassword(pw: string): Promise<{ ok: boolean; msg?: string }> {
    setError("");
    setNotice("");
    setVerified(false);
    setStep("verifying");
    try {
      const email = await getSessionEmail();
      const result = await verifyViaLogin(email, pw);
      if (result.ok) {
        setVerified(true);
        setStep("ready");
        setNotice("");
        return { ok: true };
      }
      setError(result.msg || "Current password is incorrect.");
      setStep("idle");
      return { ok: false, msg: result.msg };
    } catch (e: any) {
      setError(e?.message || "Unable to verify current password.");
      setStep("idle");
      return { ok: false, msg: e?.message };
    }
  }

  async function submitPasswordChange() {
    try {
      setSubmitting(true);
      setError('');
      if (!newPw || !confirmPw) {
        setError('Please enter and confirm your new password.');
        return;
      }
      if (newPw !== confirmPw) {
        setError('New password and confirmation do not match.');
        return;
      }
      const res = await fetch('/api/v1/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || 'Password change failed');
      }
      setNotice('Password changed. You will be logged out to reauthenticate…');
      await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => { });
      window.location.assign('/login');
    } catch (e: any) {
      setError(e?.message || 'Password change failed');
    } finally {
      setSubmitting(false);
    }
  }

  const Eye = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const EyeOff = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
        {notice && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            {notice}
          </div>
        )}

        {!verified && (
          <label className="space-y-1 max-w-sm">
            <div className="text-xs text-secondary">Current password</div>
            <div className="relative w-80">
              <input
                className={`bhq-input ${INPUT_CLS} pr-10`}
                type={showCurrentPw ? 'text' : 'password'}
                autoComplete="current-password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!currentPw) { setError("Please enter your current password."); return; }
                    const r = await verifyCurrentPassword(currentPw);
                    if (r.ok) (document.getElementById("new-password-input") as HTMLInputElement | null)?.focus();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(v => !v)}
                className="absolute inset-y-0 right-2 my-auto p-1 text-tertiary hover:text-primary"
                aria-label={showCurrentPw ? 'Hide password' : 'Show password'}
              >
                {showCurrentPw ? EyeOff : Eye}
              </button>
            </div>
            <p className="text-xs text-tertiary">
              We will verify your current password before allowing a change.
            </p>
          </label>
        )}

        {!verified && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                if (!currentPw) { setError('Please enter your current password.'); return; }
                const res = await verifyCurrentPassword(currentPw);
                if (res.ok) (document.getElementById("new-password-input") as HTMLInputElement | null)?.focus();
              }}
              disabled={step === 'verifying'}
              title="Verify current password"
            >
              {step === 'verifying' ? 'Verifying…' : 'Change password'}
            </Button>
          </div>
        )}

        {verified && (
          <div className="space-y-3">
            <label className="space-y-1 max-w-sm">
              <div className="text-xs text-secondary">New password</div>
              <div className="relative w-80">
                <input
                  id="new-password-input"
                  className={`bhq-input ${INPUT_CLS} pr-10`}
                  type={showNewPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (!newPw) { setError("Please enter your new password."); return; }
                      await submitPasswordChange();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(v => !v)}
                  className="absolute inset-y-0 right-2 my-auto p-1 text-tertiary hover:text-primary"
                  aria-label={showNewPw ? 'Hide password' : 'Show password'}
                >
                  {showNewPw ? EyeOff : Eye}
                </button>
              </div>
            </label>

            <label className="space-y-1 max-w-sm">
              <div className="text-xs text-secondary">Confirm new password</div>
              <div className="relative w-80">
                <input
                  className={`bhq-input ${INPUT_CLS} pr-10`}
                  type={showConfirmPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (!newPw || !confirmPw) { setError("Please enter and confirm your new password."); return; }
                      if (newPw !== confirmPw) { setError("New password and confirmation do not match."); return; }
                      await submitPasswordChange();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(v => !v)}
                  className="absolute inset-y-0 right-2 my-auto p-1 text-tertiary hover:text-primary"
                  aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPw ? EyeOff : Eye}
                </button>
              </div>
            </label>

            <p className="text-xs text-tertiary">
              After you change your password, you will be signed out to reauthenticate.
            </p>

            <div>
              <Button size="sm" onClick={submitPasswordChange} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-4 space-y-3">
        <h4 className="font-medium">Two-factor authentication</h4>
        <p className="text-sm text-secondary">Enable, verify, disable TOTP and manage recovery codes.</p>
        <div className="flex gap-2">
          <Button size="sm">Enable TOTP</Button>
          <Button size="sm" variant="outline">View recovery codes</Button>
        </div>
      </Card>
    </div>
  );
}

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

function BreedingTab({ onDirty }: { dirty: boolean; onDirty: (v: boolean) => void }) {
  return (
    <Card className="p-4 space-y-3">
      <h4 className="font-medium">Breeding defaults</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field placeholder="Cycle length (days)" onChange={() => onDirty(true)} />
        <Field placeholder="Ovulation day from heat start" onChange={() => onDirty(true)} />
        <Field placeholder="Start buffer (days)" className="md:col-span-2" onChange={() => onDirty(true)} />
      </div>
    </Card>
  );
}

function BreedsTab({ onDirty }: { onDirty: (v: boolean) => void }) {
  React.useEffect(() => onDirty(false), [onDirty]);

  type Species = "DOG" | "CAT" | "HORSE";
  type Canonical = { id: string; name: string; slug?: string | null; species?: Species | null; source: "canonical" };
  type Custom = { id: number; name: string; species?: Species | null; canonicalBreedId?: string | null; source: "custom" };

  const [species, setSpecies] = React.useState<Species>("DOG");
  const [q, setQ] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [canonResults, setCanonResults] = React.useState<Canonical[]>([]);
  const [customList, setCustomList] = React.useState<Custom[]>([]);
  const [loadingCustom, setLoadingCustom] = React.useState(false);
  const [err, setErr] = React.useState<string>("");

  async function loadCustom() {
    try {
      setLoadingCustom(true);
      setErr("");
      const res = await fetchJson(`/api/v1/breeds/custom?species=${encodeURIComponent(species)}`);
      const items =
        (Array.isArray(res?.items) && res.items) ||
        (Array.isArray(res?.data?.items) && res.data.items) ||
        (Array.isArray(res) && res) ||
        [];
      setCustomList(
        items.map((r: any) => ({
          id: Number(r.id),
          name: String(r.name),
          species: (r.species as Species) ?? null,
          canonicalBreedId: (r.canonicalBreedId as string) ?? null,
          source: "custom",
        }))
      );
    } catch (e: any) {
      setErr(e?.message || "Failed to load custom breeds");
    } finally {
      setLoadingCustom(false);
    }
  }

  async function doSearch() {
    try {
      setSearching(true);
      setErr("");
      const url = `/api/v1/breeds/search?species=${encodeURIComponent(species)}&q=${encodeURIComponent(q)}&limit=25`;
      const res = await fetchJson(url);
      const items =
        (Array.isArray(res?.items) && res.items) ||
        (Array.isArray(res?.data?.items) && res.data.items) ||
        (Array.isArray(res) && res) ||
        [];
      setCanonResults(
        items
          .filter((r: any) => r.source === "canonical")
          .map((r: any) => ({
            id: String(r.id),
            name: String(r.name),
            slug: r.slug ?? null,
            species: (r.species as Species) ?? null,
            source: "canonical",
          }))
      );
    } catch (e: any) {
      setErr(e?.message || "Search failed");
    } finally {
      setSearching(false);
    }
  }

  React.useEffect(() => {
    loadCustom();
  }, [species]);

  async function addCustom(name: string, canonicalBreedId?: string | null) {
    const body = { name, species, canonicalBreedId: canonicalBreedId ?? null };
    const res = await fetchJson("/api/v1/breeds/custom", { method: "POST", body: JSON.stringify(body) });
    if (res?.error) throw new Error(res?.message || "Create failed");
    await loadCustom();
  }

  async function renameCustom(id: number, name: string) {
    const res = await fetchJson(`/api/v1/breeds/custom/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    if (res?.error) throw new Error(res?.message || "Rename failed");
    await loadCustom();
  }

  async function linkCanonical(id: number, canonicalBreedId: string | null) {
    const res = await fetchJson(`/api/v1/breeds/custom/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ canonicalBreedId }),
    });
    if (res?.error) throw new Error(res?.message || "Link failed");
    await loadCustom();
  }

  async function removeCustom(id: number) {
    const res = await fetchJson(`/api/v1/breeds/custom/${id}`, { method: "DELETE" });
    if (res?.error) throw new Error(res?.message || "Delete failed");
    await loadCustom();
  }

  const [newName, setNewName] = React.useState("");
  const [linkFor, setLinkFor] = React.useState<number | null>(null);

  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-3">
        <h4 className="font-medium">Breeds (tenant custom + canonical lookup)</h4>
        <p className="text-sm text-secondary">
          Canonical breeds are read only. Add custom breeds for your org, then optionally link to a canonical breed for analytics and search.
        </p>

        {err && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {err}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-3">
          <select
            className={`bhq-input ${INPUT_CLS} w-40`}
            value={species}
            onChange={(e) => setSpecies(e.currentTarget.value as any)}
          >
            <option value="DOG">Dog</option>
            <option value="CAT">Cat</option>
            <option value="HORSE">Horse</option>
          </select>

          <div className="flex-1 flex gap-2">
            <input
              className={`bhq-input ${INPUT_CLS} flex-1`}
              placeholder="Search canonical breeds (name or alias)…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
            />
            <Button size="sm" onClick={doSearch} disabled={searching}>
              {searching ? "Searching…" : "Search"}
            </Button>
          </div>
        </div>

        {!!canonResults.length && (
          <div className="rounded-md border border-hairline divide-y divide-hairline">
            {canonResults.map((b) => (
              <div key={b.id} className="flex items-center justify-between px-3 py-2">
                <div className="text-sm">
                  <span className="font-medium">{b.name}</span>
                  {b.slug ? <span className="ml-2 text-tertiary text-xs">({b.slug})</span> : null}
                </div>
                <div className="flex items-center gap-2">
                  {linkFor != null ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await linkCanonical(linkFor, b.id);
                          setLinkFor(null);
                        } catch (e: any) {
                          setErr(e?.message || "Link failed");
                        }
                      }}
                    >
                      Link to selected custom
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          await addCustom(b.name, b.id);
                          setQ("");
                          setCanonResults([]);
                        } catch (e: any) {
                          setErr(e?.message || "Create failed");
                        }
                      }}
                    >
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
          <Button size="sm" variant="outline" onClick={loadCustom} disabled={loadingCustom}>
            {loadingCustom ? "Refreshing…" : "Refresh"}
          </Button>
        </div>

        <div className="flex gap-2">
          <input
            className={`bhq-input ${INPUT_CLS} flex-1`}
            placeholder={`Add custom ${species.toLowerCase()} breed…`}
            value={newName}
            onChange={(e) => (setNewName(e.target.value))}
            onKeyDown={async (e) => {
              if (e.key === "Enter" && newName.trim()) {
                try {
                  await addCustom(newName.trim(), null);
                  setNewName("");
                } catch (e: any) {
                  setErr(e?.message || "Create failed");
                }
              }
            }}
          />
          <Button
            size="sm"
            onClick={async () => {
              if (!newName.trim()) return;
              try {
                await addCustom(newName.trim(), null);
                setNewName("");
              } catch (e: any) {
                setErr(e?.message || "Create failed");
              }
            }}
          >
            Add
          </Button>
        </div>

        <div className="rounded-md border border-hairline divide-y divide-hairline">
          {customList.length === 0 ? (
            <div className="px-3 py-2 text-sm text-secondary">No custom breeds yet.</div>
          ) : (
            customList.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 gap-3">
                <input
                  className={`bhq-input ${INPUT_CLS} flex-1`}
                  defaultValue={c.name}
                  onBlur={async (e) => {
                    const next = e.currentTarget.value.trim();
                    if (next && next !== c.name) {
                      try { await renameCustom(c.id, next); } catch (e: any) { setErr(e?.message || "Rename failed"); }
                    }
                  }}
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={linkFor === c.id ? "outline" : "secondary"}
                    onClick={() => setLinkFor(linkFor === c.id ? null : c.id)}
                    title="Select this custom breed to link to a canonical result above"
                  >
                    {linkFor === c.id ? "Selected" : "Link canonical"}
                  </Button>
                  {c.canonicalBreedId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try { await linkCanonical(c.id, null); } catch (e: any) { setErr(e?.message || "Unlink failed"); }
                      }}
                    >
                      Unlink
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (!confirm(`Delete "${c.name}"?`)) return;
                      try { await removeCustom(c.id); } catch (e: any) { setErr(e?.message || "Delete failed"); }
                    }}
                  >
                    Delete
                  </Button>
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
              <select className={`bhq-input ${INPUT_CLS}`} onChange={() => onDirty(true)}>
                <option>Admin</option>
                <option>Manager</option>
                <option>Reader</option>
              </select>
              <Button size="sm" variant="outline" onClick={() => onDirty(true)}>Remove</Button>
            </div>
          </div>
        </div>
      </Card>
      <Card className="p-4 space-y-3">
        <h4 className="font-medium">Invite user</h4>
        <div className="flex gap-2">
          <Field placeholder="Email address" onChange={() => onDirty(true)} />
          <select className="bhq-input w-40" onChange={() => onDirty(true)}>
            <option>Manager</option>
            <option>Reader</option>
            <option>Admin</option>
          </select>
          <Button size="sm" onClick={() => onDirty(true)}>Send invite</Button>
        </div>
        <p className="text-xs text-secondary">
          Managers can manage users but not subscriptions, payment methods, or the primary subscriber.
        </p>
      </Card>
    </div>
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
      <div className="flex justify-end">
        <Button size="sm" onClick={() => onDirty(true)}>Add payment method</Button>
      </div>
    </Card>
  );
}

function TransactionsTab({ onDirty }: { dirty: boolean; onDirty: (v: boolean) => void }) {
  return (
    <Card className="p-4 space-y-3">
      <h4 className="font-medium">Transactions</h4>
      <p className="text-sm text-secondary">View recent charges, refunds, and invoices (placeholder).</p>
      <div className="rounded-md border border-hairline p-3 text-sm text-secondary">
        No transactions to display yet.
      </div>
    </Card>
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
