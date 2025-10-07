import React from "react";
import { Button, Card } from "@bhq/ui";
import { api } from "../api";
import { bootstrapAuthAndOrg } from "../bootstrapFetch";


// --- org header helper (mirrors App-Contacts.tsx) ---
function getAuthHeaders(): Record<string, string> {
    const w = window as any;
    const orgId =
        Number(w.__BHQ_ORG_ID__) ||
        (() => {
            try {
                const r = localStorage.getItem("BHQ_ORG_ID");
                return r ? Number(r) : NaN;
            } catch {
                return NaN;
            }
        })() ||
        Number((import.meta as any)?.env?.VITE_DEV_ORG_ID || "");
    const headers: Record<string, string> = {};
    if (Number.isFinite(orgId) && orgId > 0) headers["X-Org-Id"] = String(orgId);
    return headers;
}

// Reusable JSON fetch with cookies and X-Org-Id header
async function fetchJson(url: string, init: RequestInit = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...(init.headers || {}),
    } as Record<string, string>;

    const res = await fetch(url, {
        credentials: "include",
        ...init,
        headers,
    });

    // Try to parse JSON; if none, return empty object
    const body = await res.json().catch(() => ({}));
    return body;
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

// Use window.BHQ_COUNTRIES if you already inject a full list elsewhere.
// Falls back to a small built-in list so this page still works standalone.
export function useCountries(): CountryDef[] {
    const [list, setList] = React.useState<CountryDef[]>(() => {
        const injected = (globalThis as any)?.BHQ_COUNTRIES as CountryDef[] | undefined;
        return (Array.isArray(injected) && injected.length ? injected : FALLBACK_COUNTRIES);
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

function computeDisplayName(f: { firstName: string; lastName: string; nickname: string }) {
    const base = (f.nickname || f.firstName || "").trim();
    return [base, f.lastName].filter(Boolean).join(" ").trim();
}


/** Phone input with country select + dial code */
export function IntlPhoneField(props: {
    value: string;
    onChange: (next: string) => void;
    inferredCountryName?: string;
    countries: CountryDef[];
    className?: string;
}) {
    const { value, onChange, inferredCountryName, countries, className } = props;

    // Try to infer code from value, else from inferredCountryName, else US.
    const initialCode = React.useMemo(() => {
        const byPrefix = countries.find(c => value?.startsWith(c.dial + " "));
        if (byPrefix) return byPrefix.code;
        const byName = countries.find(c => c.name === inferredCountryName);
        return byName?.code || "US";
    }, [value, inferredCountryName, countries]);

    const [code, setCode] = React.useState<string>(initialCode);

    // Keep dial + local part separated for UX
    const dial = dialForCode(code, countries);
    const localPart = React.useMemo(() => {
        if (value?.startsWith(dial + " ")) return value.slice((dial + " ").length);
        // Strip any leading +NN… if user pasted, keep remainder as localPart
        const maybe = value?.replace(/^\+\d+\s*/, "") ?? "";
        return maybe;
    }, [value, dial]);

    function handleCountryChange(nextCode: string) {
        setCode(nextCode);
        onChange([dialForCode(nextCode, countries), localPart].filter(Boolean).join(" ").trim());
    }

    function formatLocal(input: string): string {
        // super lightweight “(xxx) xxx-xxxx” ONLY for +1 countries; pass-through otherwise
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
        <div className={["flex gap-2 items-stretch", className].filter(Boolean).join(" ")}>
            <select
                className={["bhq-input", INPUT_CLS, "w-48"].join(" ")}
                value={code}
                onChange={(e) => handleCountryChange(e.currentTarget.value)}
            >
                {countries.map(c => (
                    <option key={c.code} value={c.code}>
                        {c.code.toLowerCase()}  {c.name}   {c.dial}
                    </option>
                ))}
            </select>

            <div className="flex-1 flex">
                <div className={["flex items-center px-3 border border-hairline rounded-l-md bg-surface text-sm"].join(" ")}>
                    {dial}
                </div>
                <input
                    className={["bhq-input", INPUT_CLS, "rounded-l-none"].join(" ")}
                    inputMode="tel"
                    placeholder={dial === "+1" ? "(555) 111-2222" : "phone number"}
                    value={localPart}
                    onChange={(e) => onChange([dial, formatLocal(e.target.value)].join(" ").trim())}
                />
            </div>
        </div>
    );
}
/** ───────── End phone helpers ───────── */


// Shared dark style for inputs/selects (fallback even if .bhq-input is empty)
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
    | "tags";

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
        if (dirty) return; // cannot close while dirty
        onClose();
    }

    return (
        <div className="fixed inset-0 z-[60] pointer-events-none">
            {/* inert backdrop (no click-to-close) */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-none" />

            {/* centered panel */}
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
                                {/* Left: title only */}
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold">
                                        {active === "profile" && profileTitle
                                            ? `Profile — ${profileTitle}`
                                            : getTabLabel(active)}
                                    </h3>
                                </div>

                                {/* Right: buttons + (moved) banner */}
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

                                        {/* Banner is now under the buttons and hidden for Security */}
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
                                {active === "breeds" && (
                                    <BreedsTab onDirty={(v) => markDirty("breeds", v)} />
                                )}
                                {active === "users" && (
                                    <UsersTab dirty={dirtyMap.users} onDirty={(v) => markDirty("users", v)} />
                                )}
                                {active === "groups" && (
                                    <GroupsTab dirty={dirtyMap.groups} onDirty={(v) => markDirty("groups", v)} />
                                )}
                                {active === "tags" && (
                                    <TagsTab dirty={dirtyMap.tags} onDirty={(v) => markDirty("tags", v)} />
                                )}
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
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

type ContactSubset = {
    id?: string | number | null;
    firstName?: string | null;
    lastName?: string | null;
    nickname?: string | null;
    email?: string | null;
    phone?: string | null;
    street?: string | null;
    street2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
    organizationId?: string | number | null;
    whatsappPhone?: string | null;
};

type ProfileForm = {
    // user table
    userName: string;
    userEmail: string;

    // contact table (subset we show in Profile)
    contactId?: string | number | null;
    firstName: string;
    lastName: string;
    nickname: string;
    phone: string;
    street: string;
    street2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    organizationId?: string | number | null;
    whatsappPhone: string;
};

const ProfileTab = React.forwardRef<ProfileHandle, {
    dirty: boolean;
    onDirty: (v: boolean) => void;
    onTitle: (t: string) => void;
}>(function ProfileTabImpl({ onDirty, onTitle }, ref) {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string>("");
    const countries = useCountries();

    const [orgId, setOrgId] = React.useState<number | null>(null);

    const empty: ProfileForm = {
        userName: "",
        userEmail: "",
        contactId: null,
        firstName: "",
        lastName: "",
        nickname: "",
        phone: "",
        street: "",
        street2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        organizationId: null,
        whatsappPhone: "",
    };

    const [initial, setInitial] = React.useState<ProfileForm>(empty);
    const [form, setForm] = React.useState<ProfileForm>(empty);

    // util to compare
    const isDirty = React.useMemo(() => {
        return JSON.stringify(form) !== JSON.stringify(initial);
    }, [form, initial]);

    React.useEffect(() => onDirty(isDirty), [isDirty, onDirty]);

    // normalize helpers (align with Contacts app)
    function asString(v: any): string { return (v ?? "").toString(); }
    function asOpt<T extends string | number | null | undefined>(v: T): T { return (v === undefined ? null as any : v); }
    function pickContactFromList(items: any[], email: string) {
        const lower = (email || "").trim().toLowerCase();

        // normalize an API contact into a common shape
        function normalize(dto: any) {
            const getPath = (obj: any, ...path: (string | number)[]) => {
                let cur = obj;
                for (const seg of path) {
                    if (cur == null) return undefined;

                    // allow dotted segments: "address.line1"
                    const bits = typeof seg === "string" ? seg.split(".") : [seg];
                    for (const b of bits) {
                        if (typeof b === "number") {
                            cur = Array.isArray(cur) ? cur[b] : undefined;
                        } else if (/^\d+$/.test(b)) {
                            const idx = Number(b);
                            cur = Array.isArray(cur) ? cur[idx] : undefined;
                        } else {
                            // try exact, snake_case, and camelCase variants
                            const snake = b.replace(/([A-Z])/g, "_$1").toLowerCase();
                            cur = cur?.[b] ?? cur?.[snake];
                        }
                        if (cur == null) break;
                    }
                }
                return cur;
            };

            // email could be dto.email, dto.emails[0], dto.contact.email, etc.
            const primaryEmail =
                (dto?.email && String(dto.email)) ||
                (Array.isArray(dto?.emails) && dto.emails[0]) ||
                (dto?.contact?.email && String(dto.contact.email)) ||
                "";

            // names could be many shapes:
            const first =
                getPath(dto, "firstName") ||
                getPath(dto, "first_name") ||
                getPath(dto, "givenName") ||
                getPath(dto, "given_name") ||
                getPath(dto, "name", "first") ||
                getPath(dto, "contact", "firstName") ||
                getPath(dto, "contact", "first_name") ||
                "";

            const last =
                getPath(dto, "lastName") ||
                getPath(dto, "last_name") ||
                getPath(dto, "familyName") ||
                getPath(dto, "family_name") ||
                getPath(dto, "name", "last") ||
                getPath(dto, "contact", "lastName") ||
                getPath(dto, "contact", "last_name") ||
                "";

            const nickname =
                getPath(dto, "nickname") ||
                getPath(dto, "nick") ||
                getPath(dto, "preferredName") ||
                getPath(dto, "preferred_name") ||
                "";

            const full =
                getPath(dto, "name") && typeof getPath(dto, "name") === "string"
                    ? String(getPath(dto, "name"))
                    : "";

            let firstFromFull = "";
            let lastFromFull = "";
            if (!first && !last && full) {
                const parts = full.trim().split(/\s+/);
                firstFromFull = parts[0] || "";
                lastFromFull = parts.slice(1).join(" ");
            }

            return {
                id: dto?.id ?? dto?.contact?.id ?? null,
                raw: dto,

                // identity
                email:
                    String(
                        getPath(dto, "email") ??
                        getPath(dto, "emails", 0) ??
                        getPath(dto, "contact", "email") ??
                        ""
                    ).trim(),

                firstName:
                    String(
                        getPath(dto, "firstName") ??
                        getPath(dto, "first_name") ??
                        getPath(dto, "givenName") ??
                        getPath(dto, "given_name") ??
                        getPath(dto, "name", "first") ??
                        getPath(dto, "contact", "firstName") ??
                        getPath(dto, "contact", "first_name") ??
                        ""
                    ),

                lastName:
                    String(
                        getPath(dto, "lastName") ??
                        getPath(dto, "last_name") ??
                        getPath(dto, "familyName") ??
                        getPath(dto, "family_name") ??
                        getPath(dto, "name", "last") ??
                        getPath(dto, "contact", "lastName") ??
                        getPath(dto, "contact", "last_name") ??
                        ""
                    ),

                nickname:
                    String(
                        getPath(dto, "nickname") ??
                        getPath(dto, "nick") ??
                        getPath(dto, "preferredName") ??
                        getPath(dto, "preferred_name") ??
                        ""
                    ),

                // if only a single string name exists, split it
                ...(function () {
                    const full = getPath(dto, "name");
                    if (!full || typeof full !== "string") return {};
                    const parts = full.trim().split(/\s+/);
                    return {
                        firstName: (this.firstName || parts[0] || "").toString(),
                        lastName: (this.lastName || parts.slice(1).join(" ") || "").toString(),
                    };
                }).call({ firstName: undefined, lastName: undefined }),

                // phones
                phone:
                    ((): string => {
                        const direct =
                            getPath(dto, "phone") ??
                            getPath(dto, "contact", "phone");
                        if (typeof direct === "string" && direct) return direct;

                        const phones =
                            getPath(dto, "phones") ??
                            getPath(dto, "contact", "phones");
                        if (Array.isArray(phones)) {
                            // prefer preferred/mobile/cell/primary
                            const preferred = phones.find((p: any) =>
                                p?.preferred ||
                                /^(mobile|cell|primary)$/i.test(String(p?.label ?? p?.type ?? ""))
                            ) ?? phones[0];
                            const n =
                                preferred?.number ??
                                preferred?.value ??
                                (typeof preferred === "string" ? preferred : "");
                            if (typeof n === "string") return n;
                        }
                        return "";
                    })(),
                whatsappPhone:
                    ((): string => {
                        const direct =
                            getPath(dto, "whatsappPhone") ??
                            getPath(dto, "contact", "whatsappPhone") ??
                            getPath(dto, "commPrefs", "whatsappPhone") ??
                            getPath(dto, "messengers", "whatsapp");
                        if (typeof direct === "string" && direct) return direct;

                        const phones =
                            getPath(dto, "phones") ??
                            getPath(dto, "contact", "phones");
                        if (Array.isArray(phones)) {
                            const wa = phones.find((p: any) =>
                                /whats/i.test(String(p?.label ?? p?.type ?? ""))
                            );
                            const n = wa?.number ?? wa?.value ?? "";
                            if (typeof n === "string") return n;
                        }
                        return "";
                    })(),

                // address
                street:
                    String(
                        getPath(dto, "street") ??
                        getPath(dto, "street1") ??
                        getPath(dto, "address1") ??
                        getPath(dto, "address", "street") ??
                        getPath(dto, "address", "line1") ??
                        getPath(dto, "addresses", 0, "street") ??
                        getPath(dto, "addresses", 0, "line1") ??
                        getPath(dto, "contact", "street") ??
                        ""
                    ),
                street2:
                    String(
                        getPath(dto, "street2") ??
                        getPath(dto, "address2") ??
                        getPath(dto, "address", "street2") ??
                        getPath(dto, "address", "line2") ??
                        getPath(dto, "addresses", 0, "street2") ??
                        getPath(dto, "addresses", 0, "line2") ??
                        getPath(dto, "contact", "street2") ??
                        ""
                    ),
                city:
                    String(
                        getPath(dto, "city") ??
                        getPath(dto, "address", "city") ??
                        getPath(dto, "addresses", 0, "city") ??
                        getPath(dto, "contact", "city") ??
                        ""
                    ),
                state:
                    String(
                        getPath(dto, "state") ??
                        getPath(dto, "region") ??
                        getPath(dto, "province") ??
                        getPath(dto, "address", "state") ??
                        getPath(dto, "address", "region") ??
                        getPath(dto, "addresses", 0, "state") ??
                        getPath(dto, "addresses", 0, "region") ??
                        getPath(dto, "contact", "state") ??
                        ""
                    ),
                postalCode:
                    ((): string => {
                        const v =
                            getPath(dto, "postalCode") ??
                            getPath(dto, "zip") ??
                            getPath(dto, "zipCode") ??
                            getPath(dto, "postcode") ??
                            getPath(dto, "address", "postalCode") ??
                            getPath(dto, "address", "zip") ??
                            getPath(dto, "address", "zipCode") ??
                            getPath(dto, "addresses", 0, "postalCode") ??
                            getPath(dto, "addresses", 0, "zip") ??
                            getPath(dto, "addresses", 0, "zipCode") ??
                            getPath(dto, "contact", "postalCode") ??
                            "";
                        return typeof v === "string" ? v : "";
                    })(),
                country: ((): string => {
                    const val =
                        getPath(dto, "country") ??
                        getPath(dto, "countryCode") ??
                        getPath(dto, "address", "country") ??
                        getPath(dto, "address", "countryCode") ??
                        getPath(dto, "address", "country", "code") ??
                        getPath(dto, "addresses", 0, "country") ??
                        getPath(dto, "addresses", 0, "countryCode") ??
                        getPath(dto, "addresses", 0, "country", "code") ??
                        getPath(dto, "contact", "country") ??
                        getPath(dto, "contact", "countryCode") ??
                        "";
                    return typeof val === "string" ? val : "";
                })(),

                organizationId:
                    getPath(dto, "organizationId") ??
                    getPath(dto, "orgId") ??
                    getPath(dto, "contact", "organizationId") ??
                    null,
            };
        }

        const normalized = items.map(normalize);

        // prefer exact email match
        const exact = normalized.find(n => n.email.toLowerCase() === lower);
        return exact || normalized[0] || null;
    }

    // Load session → then contact by email (scoped by X-Org-Id)
    React.useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                setLoading(true); setError("");

                // 1) session
                const sRes = await fetch("/api/v1/session", { credentials: "include" });
                if (!sRes.ok) throw new Error("Failed to load current session");
                const sData = await sRes.json();

                const userName = asString(sData?.user?.name || "");
                const userEmail = asString(sData?.user?.email || "");
                const _orgId = Number(sData?.org?.id) || null;
                if (!ignore) setOrgId(_orgId);

                // Ensure org header is set (dev + prod safe)
                await bootstrapAuthAndOrg();

                // 2) contact lookup by email — deterministic + debuggable
                let contact: any = null;
                let items: any[] = [];
                let debugDump: any = {};

                // helper: normalize any common list result into an array
                const asList = (j: any): any[] =>
                    (Array.isArray(j?.items) && j.items) ||
                    (Array.isArray(j?.data?.items) && j.data.items) ||
                    (Array.isArray(j?.data) && j.data) ||
                    (Array.isArray(j?.results) && j.results) ||
                    (Array.isArray(j) && j) ||
                    [];

                if (userEmail) {
                    // call 1: /contacts?q=<email>
                    const res1 = await api.contacts.list({ q: userEmail, limit: 5 });
                    items = asList(res1);
                    debugDump.firstCall = { url: `/contacts?q=${userEmail}&limit=5`, raw: res1, parsedLen: items.length };

                    // if empty, call 2: /contacts?email=<email>  (some backends use explicit filter)
                    if (!items.length) {
                        const url = `/api/v1/contacts?email=${encodeURIComponent(userEmail)}&limit=5`;
                        const res2 = await fetchJson(url, { method: "GET" });
                        items = asList(res2);
                        debugDump.secondCall = { url, raw: res2, parsedLen: items.length };
                    }
                    // choose best match
                    contact =
                        items.find((c: any) => String(c?.email || "").toLowerCase() === userEmail.toLowerCase()) ||
                        items[0] ||
                        null;

                    // if still nothing, surface debug in the UI so we can see shapes quickly
                    if (!contact) {
                        setError(
                            `No contact rows matched ${userEmail} in org ${_orgId ?? "(unknown)"}. ` +
                            `Debug: ${JSON.stringify({
                                firstCallLen: debugDump.firstCall?.parsedLen ?? 0,
                                secondCallLen: debugDump.secondCall?.parsedLen ?? 0,
                                keysFirst: debugDump.firstCall?.raw ? Object.keys(debugDump.firstCall.raw) : [],
                                keysSecond: debugDump.secondCall?.raw ? Object.keys(debugDump.secondCall.raw) : []
                            })}`
                        );
                    }
                }

                // 3) merge → initial + form
                const next: ProfileForm = {
                    userName,
                    userEmail,
                    contactId: contact?.id ?? null,

                    // identity
                    firstName: String(contact?.firstName ?? sData?.user?.firstName ?? ""),
                    lastName: String(contact?.lastName ?? sData?.user?.lastName ?? ""),
                    nickname: String(contact?.nickname ?? sData?.user?.nickname ?? ""),

                    // phones
                    phone: String(contact?.phone ?? ""),
                    whatsappPhone: String(contact?.whatsappPhone ?? contact?.commPrefs?.whatsappPhone ?? ""),

                    // address (flat)
                    street: String(contact?.street ?? ""),
                    street2: String(contact?.street2 ?? ""),
                    city: String(contact?.city ?? ""),
                    state: String(contact?.state ?? ""),
                    postalCode: String(contact?.postalCode ?? ""),

                    // country as ISO-2 if possible
                    country: String(contact?.country ?? "").toUpperCase(),

                    organizationId: contact?.organizationId ?? _orgId ?? null,
                };
                // ─── SIMPLE, AGGRESSIVE FALLBACKS ─────────────────────────────────────────────

                // If country is a full name (e.g., "United States"), convert to 2-letter code.
                if (next.country && next.country.length > 2) {
                    const match = countries.find(c => c.name.toLowerCase() === next.country.toLowerCase());
                    if (match) next.country = match.code;
                }
                // Ensure it's a recognized 2-letter code or blank.
                next.country = asCountryCode(next.country, countries);

                // Fill address from session if contact had none.
                const uaddr = sData?.user?.address || sData?.user?.addr || sData?.user?.location || null;
                if (uaddr) {
                    if (!next.street) next.street = asString(uaddr.street || uaddr.street1 || uaddr.line1 || "");
                    if (!next.street2) next.street2 = asString(uaddr.street2 || uaddr.line2 || "");
                    if (!next.city) next.city = asString(uaddr.city || "");
                    if (!next.state) next.state = asString(uaddr.state || uaddr.region || uaddr.province || "");
                    if (!next.postalCode) next.postalCode = asString(uaddr.postalCode || uaddr.zip || uaddr.postcode || "");
                    if (!next.country) next.country = asString(uaddr.country || uaddr.countryCode || "").toUpperCase();
                    next.country = asCountryCode(next.country, countries);
                }

                // If both first & last name are still empty, split session display name.
                if (!next.firstName && !next.lastName) {
                    const full = asString(sData?.user?.name || userName || "");
                    if (full) {
                        const parts = full.trim().split(/\s+/);
                        next.firstName = parts[0] || "";
                        next.lastName = parts.slice(1).join(" ");
                    }
                }

                // If still empty, derive from the email (john.smith → John / Smith).
                if (!next.firstName && !next.lastName && next.userEmail) {
                    const local = String(next.userEmail).split("@")[0] || "";
                    if (local) {
                        const parts = local.replace(/[._-]+/g, " ").split(/\s+/);
                        next.firstName = (parts[0] || "").replace(/^./, c => c.toUpperCase());
                        next.lastName = parts.slice(1).map(w => w.replace(/^./, c => c.toUpperCase())).join(" ");
                    }
                }


                // Normalize country to a 2-letter ISO code for the <select>
                if (next.country && next.country.length > 2) {
                    const match = countries.find(
                        c => c.name.toLowerCase() === next.country.toLowerCase()
                    );
                    if (match) next.country = match.code; // convert "United States" -> "US"
                }

                // Ensure it's a recognized code (uppercased) or blank
                next.country = asCountryCode(next.country, countries);

                // ------- Address fallbacks from session/org if contact had none -------
                const sessAddr =
                    sData?.user?.address ||
                    sData?.user?.addr ||
                    sData?.user?.location ||
                    sData?.address ||
                    null;

                if (!next.street && sessAddr) {
                    next.street =
                        asString(sessAddr.street || sessAddr.street1 || sessAddr.line1 || "");
                }
                if (!next.street2 && sessAddr) {
                    next.street2 = asString(sessAddr.street2 || sessAddr.line2 || "");
                }
                if (!next.city && sessAddr) {
                    next.city = asString(sessAddr.city || "");
                }
                if (!next.state && sessAddr) {
                    next.state =
                        asString(sessAddr.state || sessAddr.region || sessAddr.province || "");
                }
                if (!next.postalCode && sessAddr) {
                    next.postalCode =
                        asString(sessAddr.postalCode || sessAddr.zip || sessAddr.postcode || "");
                }
                // Country from session user or org if still empty
                if (!next.country) {
                    next.country = asString(
                        sData?.user?.country ||
                        sData?.user?.countryCode ||
                        sData?.org?.country ||
                        sData?.org?.countryCode ||
                        ""
                    ).toUpperCase();
                }

                // Final fallbacks for name if both still empty
                if (!next.firstName && !next.lastName) {
                    // 1) Split the session's display name (user.name)
                    const full = String(sData?.user?.name || userName || "").trim();
                    if (full) {
                        const parts = full.split(/\s+/);
                        next.firstName = parts[0] || "";
                        next.lastName = parts.slice(1).join(" ");
                    }

                    // 2) If still empty, infer from email local-part (before @)
                    if (!next.firstName && !next.lastName && next.userEmail) {
                        const local = String(next.userEmail).split("@")[0] || "";
                        if (local) {
                            const parts2 = local.replace(/[._-]+/g, " ").split(/\s+/);
                            next.firstName = parts2[0] || "";
                            next.lastName = parts2.slice(1).join(" ");
                        }
                    }
                }

                if (!ignore) {
                    setInitial(next);
                    setForm(next);
                    onTitle(computeDisplayName(next) || next.userName);
                }
            } catch (e: any) {
                if (!ignore) setError(e?.message || "Unable to load profile");
            } finally {
                if (!ignore) setLoading(false);
            }
        })();
        return () => { ignore = true; };
    }, []);

    // save()
    React.useImperativeHandle(ref, () => ({
        async save() {
            setError("");

            const ops: Array<() => Promise<void>> = [];

            // 1) user save if changed (name/email)
            if (form.userName !== initial.userName || form.userEmail !== initial.userEmail) {
                const body: any = {};
                if (form.userName !== initial.userName) body.name = form.userName;
                if (form.userEmail !== initial.userEmail) body.email = form.userEmail;
                ops.push(async () => {
                    const res = await fetch("/api/v1/user", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(body),
                    });
                    if (!res.ok) {
                        const j = await res.json().catch(() => ({}));
                        throw new Error(j?.message || "User save failed");
                    }
                });
            }

            // 2) contact save if we have a contactId and any contact fields changed
            const contactChanged =
                form.firstName !== initial.firstName ||
                form.lastName !== initial.lastName ||
                form.nickname !== initial.nickname ||
                form.phone !== initial.phone ||
                form.street !== initial.street ||
                form.street2 !== initial.street2 ||
                form.city !== initial.city ||
                form.state !== initial.state ||
                form.postalCode !== initial.postalCode ||
                form.country !== initial.country ||
                String(form.organizationId || "") !== String(initial.organizationId || "") ||
                form.whatsappPhone !== initial.whatsappPhone;
            if (form.contactId != null && contactChanged) {
                const payload: ContactSubset = {
                    firstName: form.firstName || null,
                    lastName: form.lastName || null,
                    nickname: form.nickname || null,
                    email: form.userEmail || null,
                    phone: form.phone || null,
                    whatsappPhone: form.whatsappPhone || null,
                    street: form.street || null,
                    street2: form.street2 || null,
                    city: form.city || null,
                    state: form.state || null,
                    postalCode: form.postalCode || null,
                    country: form.country || null,
                    organizationId:
                        form.organizationId === "" || form.organizationId === undefined
                            ? null
                            : form.organizationId!,
                };

                ops.push(async () => {
                    await api.contacts.update(String(form.contactId), payload);
                });
            }

            // Execute saves
            for (const op of ops) await op();

            // If email changed, force fresh login to refresh cookies/session
            if (form.userEmail !== initial.userEmail) {
                await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" }).catch(() => { });
                window.location.assign("/login");
                return;
            }

            // success → update baseline + clear dirty
            setInitial(form);
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

                    {/* Account */}
                    <div className="rounded-xl border border-hairline bg-surface p-3">
                        <div className="mb-2 text-xs uppercase tracking-wide text-secondary">Account</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className="space-y-1">
                                <div className="text-xs text-secondary">First Name</div>
                                <input
                                    className={`bhq-input ${INPUT_CLS}`}
                                    autoComplete="given-name"
                                    value={form.firstName}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setForm((f) => {
                                            const nf = { ...f, firstName: v };
                                            onTitle(computeDisplayName(nf));
                                            return nf;
                                        });
                                    }}
                                />
                            </label>

                            <label className="space-y-1">
                                <div className="text-xs text-secondary">Last Name</div>
                                <input
                                    className={`bhq-input ${INPUT_CLS}`}
                                    autoComplete="family-name"
                                    value={form.lastName}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setForm((f) => {
                                            const nf = { ...f, lastName: v };
                                            onTitle(computeDisplayName(nf));
                                            return nf;
                                        });
                                    }}
                                />
                            </label>

                            <label className="space-y-1">
                                <div className="text-xs text-secondary">Nickname</div>
                                <input
                                    className={`bhq-input ${INPUT_CLS}`}
                                    value={form.nickname}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setForm((f) => {
                                            const nf = { ...f, nickname: v };
                                            onTitle(computeDisplayName(nf));
                                            return nf;
                                        });
                                    }}
                                />
                            </label>

                            <label className="space-y-1">
                                <div className="text-xs text-secondary">Display Name</div>
                                <div
                                    className="h-10 flex items-center rounded-md border border-hairline bg-surface-strong px-3 text-sm text-secondary"
                                    aria-readonly="true"
                                    title="Derived from Nickname + Last name, or First name + Last name"
                                >
                                    {computeDisplayName(form) || "—"}
                                </div>
                            </label>

                            <label className="space-y-1 md:col-span-2">
                                <div className="text-xs text-secondary">Email Address (username)</div>
                                <input
                                    className={`bhq-input ${INPUT_CLS}`}
                                    type="email"
                                    autoComplete="email"
                                    value={form.userEmail}
                                    onChange={(e) => setForm((f) => ({ ...f, userEmail: e.target.value }))}
                                />
                            </label>
                        </div>
                    </div>

                    <label className="space-y-1">
                        <div className="text-xs text-secondary">Phone</div>
                        <IntlPhoneField
                            value={form.phone}
                            onChange={(next) => setForm((f) => ({ ...f, phone: next }))}
                            inferredCountryName={countryNameFromValue(form.country, countries)}
                            countries={countries}
                            className="w-full"
                        />
                    </label>

                    <label className="space-y-1 md:col-span-2">
                        <div className="text-xs text-secondary">WhatsApp</div>
                        <IntlPhoneField
                            value={form.whatsappPhone}
                            onChange={(next) => setForm((f) => ({ ...f, whatsappPhone: next }))}
                            inferredCountryName={countryNameFromValue(form.country, countries)}
                            countries={countries}
                            className="w-full"
                        />
                    </label>

                    {/* Address */}
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
}
);

/** ───────── Password verification via login endpoint ─────────
 * Reuse the same API as the login page: POST /api/v1/auth/login
 * Body: { email, password }
 * We fetch the current user's email from /api/v1/session.
 */
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

    // Try to turn Zod arrays (and other shapes) into a single friendly line
    let msg = `HTTP ${res.status}`;
    try {
        const j = await res.json();
        // 1) API-style message
        if (j?.message && typeof j.message === "string") msg = j.message;

        // 2) Zod array for password
        if (Array.isArray(j) && j.length) {
            const pwErr = j.find((e: any) =>
                Array.isArray(e?.path) && e.path[0] === "password"
            );
            if (pwErr?.code === "too_small" && pwErr?.minimum) {
                msg = `Password must be at least ${pwErr.minimum} characters.`;
            } else if (pwErr?.message) {
                msg = pwErr.message;
            } else {
                msg = "Invalid password.";
            }
        }
    } catch {
        /* non-json body – keep default msg */
    }
    return { ok: false, msg };
}

function SecurityTab({ onDirty }: { dirty: boolean; onDirty: (v: boolean) => void }) {
    // flow: 'idle' (enter current) → 'verifying' → 'ready' (show new/confirm)
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

    // when user edits current password, clear previous verification
    React.useEffect(() => {
        setVerified(false);
        setStep('idle');
    }, [currentPw]);

    // Security uses its own submit; never mark the global panel as "dirty"
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
            // Adjust endpoint if yours differs
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

    // simple, valid eye icons (avoid broken SVG paths)
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

                {/* Current password (verification first) */}
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
                            We’ll verify your current password before allowing a change.
                        </p>
                    </label>
                )}

                {/* Primary action: verify then reveal change form */}
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

                {/* New password fields (shown only after success) */}
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
                                            if (!verified) {
                                                const r = await verifyCurrentPassword(currentPw);
                                                if (!r.ok) return;
                                            }
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
                                            if (!verified) {
                                                const r = await verifyCurrentPassword(currentPw);
                                                if (!r.ok) return;
                                            }
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
                            After you change your password, you’ll be signed out to re-authenticate.
                        </p>

                        <div>
                            <Button
                                size="sm"
                                onClick={async () => {
                                    if (!verified) {
                                        // force a verify for the current value if user skipped or lost state
                                        const r = await verifyCurrentPassword(currentPw);
                                        if (!r.ok) return;
                                    }
                                    await submitPasswordChange();
                                }}
                                disabled={submitting}
                            >
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
                    <Button size="sm" onClick={() => onDirty(true)}>Enable TOTP</Button>
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
  // This tab does immediate CRUD calls; it never blocks panel close with “dirty”
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

  // helpers
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

  // initial loads
  React.useEffect(() => {
    loadCustom();
  }, [species]);

  // CRUD
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

  // local UI state
  const [newName, setNewName] = React.useState("");
  const [linkFor, setLinkFor] = React.useState<number | null>(null); // custom id we’re linking

  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-3">
        <h4 className="font-medium">Breeds (tenant custom + canonical lookup)</h4>
        <p className="text-sm text-secondary">
          Canonical breeds are read-only. Add <em>custom</em> breeds for your org (kept private), and optionally link them to a canonical breed for analytics/search.
        </p>

        {err && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {err}
          </div>
        )}

        {/* Species + Search */}
        <div className="flex flex-col md:flex-row gap-3">
          <select
            className={`bhq-input ${INPUT_CLS} w-40`}
            value={species}
            onChange={(e) => setSpecies(e.currentTarget.value as Species)}
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

        {/* Canonical results */}
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

      {/* Custom list + quick add */}
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
