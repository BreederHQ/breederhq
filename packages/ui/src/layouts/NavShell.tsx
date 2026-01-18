// packages/ui/src/layouts/NavShell.tsx
import * as React from "react";
import logoUrl from "../assets/logo.png";
import { AccountMenu, type TenantMembership, type UserInfo } from "../components/AccountMenu";

export type NavItem = {
  key: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export type NavShellProps = {
  title?: string;
  items?: NavItem[];
  navItems?: NavItem[]; // alias for items
  brand?: {
    name?: string;
    logoSrc?: string;
  };
  envBadge?: "Dev" | "Staging" | "Prod" | string;
  actions?: React.ReactNode;
  showGlobalSearch?: boolean;
  auth?: {
    isAuthenticated: boolean;
    onLogin?: () => void;
    onLogout?: () => void;
  };
  orgName?: string;
  /** @deprecated Use currentTenant instead */
  onOrgClick?: () => void;
  onSettingsClick?: () => void;
  onNotificationsClick?: () => void;
  onMessagesClick?: () => void;
  unreadCount?: number;
  unreadMessagesCount?: number;
  notificationsDropdownContent?: React.ReactNode;
  children?: React.ReactNode;
  // New props for tenant switching
  /** Current active tenant for the account menu */
  currentTenant?: { id: number; name: string; slug: string } | null;
  /** All tenants the user has access to */
  memberships?: TenantMembership[];
  /** Called when user switches tenant */
  onTenantSwitch?: (tenantId: number) => void;
  /** Whether current user is a super admin */
  isSuperAdmin?: boolean;
  /** Whether current tenant is a demo tenant */
  isDemoTenant?: boolean;
  /** Called when user clicks reset demo tenant */
  onDemoReset?: () => void;
  /** Current user information for account menu display */
  user?: UserInfo | null;
};

const Icon = {
  ChevronLeft: (p: any) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className}>
      <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  Menu: (p: any) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className}>
      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  Bell: (p: any) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className}>
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14v-3a6 6 0 1 0-12 0v3c0 .53-.21 1.04-.59 1.41L4 17h5m3 4a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  Gear: (p: any) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className}>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="2" />
      <path d="M19.4 15a7.97 7.97 0 0 0 .1-2 7.97 7.97 0 0 0-.1-2l2-1.5-2-3.5-2.4 1a7.98 7.98 0 0 0-3.4-2l-.3-2.6h-4l-.3 2.6a7.98 7.98 0 0 0-3.4 2l-2.4-1-2 3.5 2 1.5a7.97 7.97 0 0 0-.1 2c0 .67.04 1.34.1 2l-2 1.5 2 3.5 2.4-1a7.98 7.98 0 0 0 3.4 2l.3 2.6h4l.3-2.6a7.98 7.98 0 0 0 3.4-2l2.4 1 2-3.5-2-1.5Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  Login: (p: any) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  Logout: (p: any) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className}>
      <path d="M9 21H7a2 2 0 0 1-2-2V5a2 2 0  1 2-2h2M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  Message: (p: any) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  CircleUser: (p: any) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className}>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
};

function emojiFor(label: string) {
  const k = label.toLowerCase();
  if (k.includes("dashboard")) return "🌐";
  if (k.includes("contact")) return "📇";
  if (k.includes("organizations")) return "🏤";
  if (k.includes("animal")) return "🐾";
  if (k.includes("admin")) return "🛠️";
  if (k.includes("offspring")) return "🍼";
  if (k.includes("waitlist")) return "📋";
  if (k.includes("finance")) return "💰";
  if (k.includes("marketplace")) return "🛒";
  if (k.includes("marketing")) return "📣";
  if (k.includes("bloodline")) return "🏆";
  if (k.includes("breed")) return "🧬";
  if (k.includes("calendar")) return "📅";
  if (k.includes("plan")) return "🗂️";
  if (k.includes("contract")) return "✍️";
  return "🧭";
}

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function normPath(s: string) {
  return String(s || "").toLowerCase().replace(/\/+$/, "");
}

export const NavShell: React.FC<NavShellProps> = ({
  title = "BreederHQ",
  items,
  navItems: navItemsProp,
  brand,
  envBadge,
  actions,
  showGlobalSearch = false,
  children,
  auth,
  orgName,
  onOrgClick,
  onSettingsClick,
  onNotificationsClick,
  onMessagesClick,
  unreadCount = 0,
  unreadMessagesCount = 0,
  notificationsDropdownContent,
  // New tenant switching props
  currentTenant,
  memberships,
  onTenantSwitch,
  isSuperAdmin,
  isDemoTenant,
  onDemoReset,
  user,
}) => {
  const [announcedTitle, setAnnouncedTitle] = React.useState<string>();

  React.useEffect(() => {
    const onModule = (e: Event) => {
      const detail = (e as CustomEvent).detail as { label?: string };
      if (detail?.label) {
        setAnnouncedTitle(detail.label);
        try { localStorage.setItem("BHQ_LAST_MODULE", detail.label); } catch {}
      }
    };
    window.addEventListener("bhq:module", onModule as any);
    return () => window.removeEventListener("bhq:module", onModule as any);
  }, []);

  const displayTitle = announcedTitle || title || "BreederHQ";

  const [notificationsOpen, setNotificationsOpen] = React.useState(false);

  const [railOpen, setRailOpen] = React.useState<boolean>(() => {
    try {
      const v = localStorage.getItem("BHQ_RAIL_OPEN");
      return v ? JSON.parse(v) : true;
    } catch {
      return true;
    }
  });
  React.useEffect(() => {
    try { localStorage.setItem("BHQ_RAIL_OPEN", JSON.stringify(railOpen)); } catch {}
  }, [railOpen]);

  const loggedIn = !!(auth && auth.isAuthenticated);
  const defaultItems: NavItem[] = [
    { key: "dashboard", label: "Dashboard", href: "/" },
    { key: "contacts", label: "Contacts", href: "/contacts/" },
    { key: "animals", label: "Animals", href: "/animals/" },
    { key: "waitlist", label: "Waitlist", href: "/waitlist/" },
    { key: "breeding", label: "Breeding", href: "/breeding/" },
    { key: "offspring", label: "Offspring", href: "/offspring/" },
    { key: "marketing", label: "Marketing", href: "/marketing/" },
    { key: "marketplace", label: "Marketplace", href: "/marketplace/" },
    { key: "finance", label: "Finance", href: "/finance/" },
    { key: "admin", label: "Admin", href: "/admin/" },
  ];
  const navItems = (navItemsProp ?? items)?.length ? (navItemsProp ?? items)! : defaultItems;

  // INITIAL title bootstrap from URL, but **ignore "/"** so Dashboard doesn't claim everything.
  React.useEffect(() => {
    if (announcedTitle) return;
    const path = typeof location !== "undefined" ? normPath(location.pathname) : "";
    let next: string | undefined;

    if (path === "" || path === "/") {
      next = "Dashboard";
    } else {
      const hit = navItems.find(i => {
        const href = normPath(i.href || "");
        if (!href || href === "/") return false; // don't let root hijack
        return path === href || path.startsWith(href + "/");
      });
      next = hit?.label;
    }

    if (!next) {
      try { next = localStorage.getItem("BHQ_LAST_MODULE") || undefined; } catch {}
    }
    if (next) setAnnouncedTitle(next);
  }, [announcedTitle, navItems]);

  // ACTIVE key prefers path (URL) first, then falls back to title
  const activeKey = React.useMemo(() => {
    const path = typeof location !== "undefined" ? normPath(location.pathname) : "";

    // 1) strict path match
    const byPath = navItems.find(i => {
      const href = normPath(i.href || "");
      if (!href) return false;
      if (href === "/" || href === "") return path === "" || path === "/";
      return path === href || path.startsWith(href + "/");
    });
    if (byPath?.key) return byPath.key;

    // 2) title/key fallback
    const t = (displayTitle || "").toLowerCase();
    const byTitle = navItems.find(i => i.label.toLowerCase() === t || i.key.toLowerCase() === t);
    if (byTitle?.key) return byTitle.key;

    return undefined;
  }, [displayTitle, navItems]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background text-foreground">
      {/* Top bar */}
      <div className="shrink-0 z-40">
        <div className="backdrop-blur bg-surface/70 border-b border-hairline">
          <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-[hsl(var(--brand-orange))/60%] to-transparent" />
          </div>
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between gap-3">
              {/* Left: burger + brand */}
              <div className="flex items-center gap-3">
                <button
                  aria-label="Toggle navigation"
                  onClick={() => setRailOpen(v => !v)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-hairline bg-surface hover:bg-surface-strong transition"
                >
                  {railOpen ? <Icon.ChevronLeft className="h-5 w-5" /> : <Icon.Menu className="h-5 w-5" />}
                </button>

                <div className="flex items-center gap-2">
                  <img
                    src={brand?.logoSrc ?? logoUrl}
                    alt={brand?.name || "BreederHQ"}
                    className="h-14 w-14 object-contain shrink-0 max-h-full"
                  />
                  <div className="flex items-baseline gap-2">
                    <div className="text-base font-medium tracking-wide">{brand?.name || "BreederHQ"}</div>
                    {envBadge ? (
                      <span
                        className={cls(
                          "text-[11px] px-2 py-0.5 rounded-full border",
                          envBadge === "Prod"
                            ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-300"
                            : envBadge === "Staging"
                            ? "border-amber-600/30 bg-amber-500/10 text-amber-300"
                            : "border-sky-600/30 bg-sky-500/10 text-sky-300"
                        )}
                      >
                        {envBadge}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Page title */}
                <div className="ml-4 text-sm text-muted-foreground">/</div>
                <div className="text-sm font-semibold">{displayTitle}</div>
              </div>

              {/* Middle: global search (optional) */}
              {showGlobalSearch && (
                <div className="hidden md:block flex-1 max-w-xl">
                  <div className="relative">
                    <input
                      placeholder="Search"
                      className="w-full h-9 rounded-lg bg-surface-strong border border-hairline px-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/40"
                    />
                    <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                      ⌘K
                    </div>
                  </div>
                </div>
              )}

              {/* Right: actions + auth */}
              <div className="flex items-center gap-5">
                {actions}

                {/* Icon buttons group */}
                <div className="flex items-center gap-1">
                  <button
                    aria-label="Messages"
                    onClick={onMessagesClick}
                    className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-surface hover:bg-surface-strong transition"
                  >
                    <Icon.Message className="h-5 w-5" />
                    {unreadMessagesCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[hsl(var(--brand-orange))] px-1 text-[11px] font-semibold text-white">
                        {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                      </span>
                    )}
                  </button>

                  <div className="relative">
                    <button
                      aria-label="Notifications"
                      onClick={() => {
                        if (notificationsDropdownContent) {
                          setNotificationsOpen((v) => !v);
                        } else {
                          onNotificationsClick?.();
                        }
                      }}
                      className={cls(
                        "relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-surface hover:bg-surface-strong transition",
                        notificationsOpen && "bg-surface-strong"
                      )}
                    >
                      <Icon.Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[hsl(var(--brand-orange))] px-1 text-[11px] font-semibold text-white">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </button>
                    {notificationsOpen && notificationsDropdownContent && (
                      <div className="absolute right-0 top-full mt-2 z-50">
                        {React.cloneElement(notificationsDropdownContent as React.ReactElement<{ onClose?: () => void }>, {
                          onClose: () => setNotificationsOpen(false),
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Menu - combines tenant switching, settings, and logout */}
                {loggedIn ? (
                  <AccountMenu
                    currentTenant={currentTenant ?? (orgName ? { id: 0, name: orgName, slug: "" } : null)}
                    memberships={memberships}
                    onTenantSwitch={onTenantSwitch}
                    onSettingsClick={onSettingsClick}
                    onLogout={() => auth?.onLogout?.()}
                    isSuperAdmin={isSuperAdmin}
                    isDemoTenant={isDemoTenant}
                    onDemoReset={onDemoReset}
                    user={user}
                  />
                ) : (
                  <button
                    onClick={() => auth?.onLogin?.()}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-hairline bg-surface px-3 hover:bg-surface-strong transition"
                    aria-label="Login"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                      <path d="M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <span className="hidden md:inline text-sm">Login</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 flex flex-col w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex gap-4 flex-1 min-h-0">
          <aside className={cls("shrink-0 transition-all overflow-y-auto", railOpen ? "w-56" : "w-[72px]")}>
            <nav className="rounded-2xl border border-hairline bg-surface p-1.5">
              {navItems.map(it => {
                const isActive = activeKey === it.key;
                const compact = !railOpen;

                return (
                  <a
                    key={it.key}
                    href={it.href}
                    title={it.label}
                    data-active={isActive || undefined}
                    aria-current={isActive ? "page" : undefined}
                    className={cls(
                      "group relative rounded-lg border transition min-h-[48px] w-full",
                      compact ? "flex items-center justify-center px-0 py-2 gap-0" : "flex items-center px-3 py-2 gap-3",
                      isActive
                        ? "border-[hsl(var(--brand-orange))/40] bg-transparent text-foreground"
                        : "border-transparent hover:bg-[hsl(var(--brand-orange))]/10 text-muted-foreground"
                    )}
                  >
                    <span className="h-8 w-8 shrink-0 flex items-center justify-center">
                      {typeof it.icon === "object" && it.icon !== null
                        ? it.icon
                        : <span aria-hidden className="text-[28px] leading-none">{emojiFor(it.label)}</span>}
                    </span>

                    {railOpen && <span className="text-[20px] font-normal">{it.label}</span>}

                    {isActive && (
                      <span className="pointer-events-none absolute left-1.5 right-1.5 bottom-1 h-0.5 rounded bg-[hsl(var(--brand-orange))]" />
                    )}
                  </a>
                );
              })}
            </nav>
          </aside>

          <main className="min-w-0 flex-1 min-h-0 flex flex-col overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default NavShell;
