// apps/marketplace/src/layout/TopNav.tsx
// Primary desktop navigation header for the standalone marketplace

import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { MarketplaceUserProfile } from "../gate/MarketplaceGate";
import { useIsSeller } from "../gate/MarketplaceGate";
import { useMarketplaceTheme } from "../context/MarketplaceThemeContext";
import logo from "@bhq/ui/assets/logo.png";

/**
 * Icon components for the navigation
 */
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14v-3a6 6 0 1 0-12 0v3c0 .53-.21 1.04-.59 1.41L4 17h5m3 4a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 12h18M3 6h18M3 18h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface TopNavProps {
  user: MarketplaceUserProfile | null;
  authenticated: boolean;
  unreadMessages?: number;
  unreadInquiries?: number;
  savedCount?: number;
  onLogout: () => void;
  onOpenSettings?: () => void;
}

interface NavLinkProps {
  to: string;
  active: boolean;
  children: React.ReactNode;
  isLightMode?: boolean;
}

function NavLink({ to, active, children, isLightMode = false }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
        active
          ? isLightMode
            ? "text-gray-900 bg-gray-100"
            : "text-white bg-white/10"
          : isLightMode
            ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            : "text-text-secondary hover:text-white hover:bg-white/5"
      }`}
    >
      {children}
    </Link>
  );
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: Array<{
    label?: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
    divider?: boolean;
    header?: boolean;
  }>;
  align?: "left" | "right";
}

function DropdownMenu({ trigger, items, align = "left" }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
      >
        {trigger}
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          className={`absolute top-full mt-1 min-w-[200px] rounded-lg border border-border-subtle bg-portal-elevated shadow-xl z-50 py-1 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item, idx) => {
            if (item.divider) {
              return <div key={idx} className="my-1 border-t border-border-subtle" />;
            }
            if (item.header) {
              return (
                <div key={idx} className="px-3 py-1.5 text-xs font-medium text-text-tertiary uppercase tracking-wide">
                  {item.label}
                </div>
              );
            }
            const className = "flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors";
            if (item.href) {
              return (
                <Link key={idx} to={item.href} className={className} onClick={() => setOpen(false)}>
                  {item.icon}
                  {item.label}
                </Link>
              );
            }
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
                className={className}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TopNav({
  user,
  authenticated,
  unreadMessages = 0,
  unreadInquiries = 0,
  savedCount = 0,
  onLogout,
  onOpenSettings,
}: TopNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isSeller = useIsSeller();
  const { theme, toggleTheme, isLightMode } = useMarketplaceTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const totalNotifications = unreadMessages + unreadInquiries;

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/animals?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchOpen(false);
    }
  };

  // Build account menu items - seller items only shown when in seller context
  const accountItems = authenticated
    ? [
        { label: "Buyer", header: true },
        { label: "My Inquiries", href: "/inquiries" },
        { label: "Saved Items", href: "/saved" },
        { label: "My Waitlists", href: "/waitlist" },
        // Seller section - only shown when accessed via breeder portal
        ...(isSeller
          ? [
              { divider: true },
              { label: "Seller", header: true },
              { label: "Manage Listings", href: "/manage" },
              { label: "Provider Portal", href: "/provider" },
            ]
          : []),
        { divider: true },
        { label: "Settings", onClick: onOpenSettings },
        { label: "Sign Out", onClick: onLogout },
      ]
    : [
        { label: "Sign In", href: "/login" },
        { label: "Create Account", href: "/register" },
      ];

  return (
    <header className={`sticky top-0 z-40 h-16 border-b transition-colors ${
      isLightMode
        ? "bg-white border-gray-200"
        : "bg-portal-elevated border-border-subtle"
    }`}>
      <div className="h-full w-full px-4 md:px-8 lg:px-12 xl:px-16 flex items-center justify-between">
        {/* Left side: Logo + Desktop Navigation */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link
            to="/"
            className={`flex items-center gap-2 text-base font-semibold tracking-tight transition-colors ${
              isLightMode
                ? "text-gray-900 hover:text-gray-700"
                : "text-white hover:text-white/90"
            }`}
          >
            <img
              src={logo}
              alt="BreederHQ"
              className="h-8 w-auto"
            />
            <span className="hidden sm:block">
              Breeder<span className="text-[hsl(var(--brand-orange))]">HQ</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
            <NavLink to="/" active={isActive("/") && location.pathname === "/"} isLightMode={isLightMode}>
              Home
            </NavLink>
            <NavLink to="/animals" active={isActive("/animals")} isLightMode={isLightMode}>
              Animals
            </NavLink>
            <NavLink to="/breeders" active={isActive("/breeders")} isLightMode={isLightMode}>
              Breeders
            </NavLink>
            <NavLink to="/services" active={isActive("/services")} isLightMode={isLightMode}>
              Services
            </NavLink>
          </nav>
        </div>

        {/* Right side: Search, Notifications, Account */}
        <div className="flex items-center gap-2">
          {/* Search (Desktop) */}
          <div className="hidden md:block">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search animals, breeders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className={`w-64 px-3 py-1.5 text-sm rounded-md border focus:outline-none focus:ring-1 focus:ring-accent ${
                    isLightMode
                      ? "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                      : "border-border-subtle bg-portal-card text-white placeholder-text-tertiary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className={`p-2 rounded-md transition-colors ${
                    isLightMode
                      ? "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                      : "text-text-secondary hover:text-white hover:bg-white/5"
                  }`}
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className={`p-2 rounded-md transition-colors ${
                  isLightMode
                    ? "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    : "text-text-secondary hover:text-white hover:bg-white/5"
                }`}
                aria-label="Open search"
              >
                <SearchIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Theme Toggle (Desktop) */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`hidden md:flex p-2 rounded-md transition-colors ${
              isLightMode
                ? "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                : "text-text-secondary hover:text-white hover:bg-white/5"
            }`}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            title={theme === "light" ? "Dark mode" : "Light mode"}
          >
            {theme === "light" ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
          </button>

          {/* Authenticated user actions */}
          {authenticated && (
            <>
              {/* Saved Items */}
              <Link
                to="/saved"
                className={`relative p-2 rounded-md transition-colors ${
                  isLightMode
                    ? "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    : "text-text-secondary hover:text-white hover:bg-white/5"
                }`}
                aria-label={savedCount > 0 ? `Saved items, ${savedCount} saved` : "Saved items"}
              >
                <HeartIcon className="h-5 w-5" />
                {savedCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                    {savedCount > 99 ? "99+" : savedCount}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <Link
                to="/inquiries"
                className={`relative p-2 rounded-md transition-colors ${
                  isLightMode
                    ? "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    : "text-text-secondary hover:text-white hover:bg-white/5"
                }`}
                aria-label={totalNotifications > 0 ? `Notifications, ${totalNotifications} unread` : "Notifications"}
              >
                <BellIcon className="h-5 w-5" />
                {totalNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                    {totalNotifications > 99 ? "99+" : totalNotifications}
                  </span>
                )}
              </Link>
            </>
          )}

          {/* Account Dropdown (Desktop) */}
          <div className="hidden md:block">
            <DropdownMenu
              trigger={
                <span className="flex items-center gap-2">
                  {user ? (
                    <span className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent">
                      {user.firstName?.[0] || user.email[0].toUpperCase()}
                    </span>
                  ) : (
                    <UserIcon className="h-5 w-5" />
                  )}
                  <span className="sr-only">Account</span>
                </span>
              }
              items={accountItems}
              align="right"
            />
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-md transition-colors ${
              isLightMode
                ? "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                : "text-text-secondary hover:text-white hover:bg-white/5"
            }`}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={`md:hidden absolute top-full left-0 right-0 shadow-xl ${
          isLightMode
            ? "bg-white border-b border-gray-200"
            : "bg-portal-elevated border-b border-border-subtle"
        }`}>
          {/* Mobile Search */}
          <div className={`px-4 py-3 border-b ${isLightMode ? "border-gray-200" : "border-border-subtle"}`}>
            <form onSubmit={handleSearch}>
              <div className="relative">
                <SearchIcon className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isLightMode ? "text-gray-400" : "text-text-tertiary"}`} />
                <input
                  type="text"
                  placeholder="Search animals, breeders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-md border focus:outline-none focus:ring-1 focus:ring-accent ${
                    isLightMode
                      ? "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                      : "border-border-subtle bg-portal-card text-white placeholder-text-tertiary"
                  }`}
                />
              </div>
            </form>
          </div>

          {/* Mobile Nav Links */}
          <nav className="px-4 py-3 space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 text-sm font-medium rounded-md ${
                isLightMode
                  ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  : "text-text-secondary hover:text-white hover:bg-white/5"
              }`}
            >
              Home
            </Link>
            <Link
              to="/animals"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 text-sm font-medium rounded-md ${
                isLightMode
                  ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  : "text-text-secondary hover:text-white hover:bg-white/5"
              }`}
            >
              Animals
            </Link>
            <Link
              to="/breeders"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 text-sm font-medium rounded-md ${
                isLightMode
                  ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  : "text-text-secondary hover:text-white hover:bg-white/5"
              }`}
            >
              Breeders
            </Link>
            <Link
              to="/services"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 text-sm font-medium rounded-md ${
                isLightMode
                  ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  : "text-text-secondary hover:text-white hover:bg-white/5"
              }`}
            >
              Services
            </Link>

            {authenticated && (
              <>
                <div className={`my-2 border-t ${isLightMode ? "border-gray-200" : "border-border-subtle"}`} />
                <Link
                  to="/inquiries"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md ${
                    isLightMode
                      ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      : "text-text-secondary hover:text-white hover:bg-white/5"
                  }`}
                >
                  My Inquiries
                  {totalNotifications > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-white">
                      {totalNotifications > 99 ? "99+" : totalNotifications}
                    </span>
                  )}
                </Link>
                <Link
                  to="/saved"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md ${
                    isLightMode
                      ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      : "text-text-secondary hover:text-white hover:bg-white/5"
                  }`}
                >
                  Saved Items
                  {savedCount > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-white">
                      {savedCount > 99 ? "99+" : savedCount}
                    </span>
                  )}
                </Link>
                {/* Seller link - only shown when in seller context */}
                {isSeller && (
                  <Link
                    to="/manage"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 text-sm font-medium rounded-md ${
                      isLightMode
                        ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        : "text-text-secondary hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Manage Listings
                  </Link>
                )}
              </>
            )}

            <div className={`my-2 border-t ${isLightMode ? "border-gray-200" : "border-border-subtle"}`} />

            {/* Theme Toggle (Mobile) */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-md ${
                isLightMode
                  ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  : "text-text-secondary hover:text-white hover:bg-white/5"
              }`}
            >
              {theme === "light" ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />}
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </button>

            {authenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSettings?.();
                  }}
                  className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                    isLightMode
                      ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      : "text-text-secondary hover:text-white hover:bg-white/5"
                  }`}
                >
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                    isLightMode
                      ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      : "text-text-secondary hover:text-white hover:bg-white/5"
                  }`}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-sm font-medium rounded-md ${
                    isLightMode
                      ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      : "text-text-secondary hover:text-white hover:bg-white/5"
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium rounded-md bg-[hsl(var(--brand-orange))] text-white hover:bg-[hsl(var(--brand-orange))]/90 text-center"
                >
                  Create Account
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default TopNav;
