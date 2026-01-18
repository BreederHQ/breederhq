// packages/ui/src/components/AccountMenu/AccountMenu.tsx
// User account dropdown menu with tenant switching and logout

import * as React from "react";

export interface TenantMembership {
  tenantId: number;
  tenantName: string;
  tenantSlug: string;
  role: string | null;
}

export interface UserInfo {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export interface AccountMenuProps {
  /** Current active tenant */
  currentTenant?: { id: number; name: string; slug: string } | null;
  /** All tenants the user has access to */
  memberships?: TenantMembership[];
  /** Called when user selects a different tenant */
  onTenantSwitch?: (tenantId: number) => void;
  /** Called when user clicks settings */
  onSettingsClick?: () => void;
  /** Called when user clicks logout */
  onLogout: () => void;
  /** Whether user is a super admin */
  isSuperAdmin?: boolean;
  /** Whether current tenant is a demo tenant */
  isDemoTenant?: boolean;
  /** Called when user clicks reset demo tenant */
  onDemoReset?: () => void;
  /** Current user information for display */
  user?: UserInfo | null;
}

// Icons
const Icon = {
  CircleUser: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className}>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  ChevronDown: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Check: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className}>
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Building: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className}>
      <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Settings: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className}>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="2" />
      <path d="M19.4 15a7.97 7.97 0 0 0 .1-2 7.97 7.97 0 0 0-.1-2l2-1.5-2-3.5-2.4 1a7.98 7.98 0 0 0-3.4-2l-.3-2.6h-4l-.3 2.6a7.98 7.98 0 0 0-3.4 2l-2.4-1-2 3.5 2 1.5a7.97 7.97 0 0 0-.1 2c0 .67.04 1.34.1 2l-2 1.5 2 3.5 2.4-1a7.98 7.98 0 0 0 3.4 2l.3 2.6h4l.3-2.6a7.98 7.98 0 0 0 3.4-2l2.4 1 2-3.5-2-1.5Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  Logout: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className}>
      <path d="M9 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  RefreshCw: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className}>
      <path d="M23 4v6h-6M1 20v-6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/** Get initials from user info */
function getUserInitials(user?: UserInfo | null): string {
  if (!user) return "?";

  // Try firstName + lastName first
  const first = user.firstName?.trim();
  const last = user.lastName?.trim();
  if (first && last) {
    return `${first[0]}${last[0]}`.toUpperCase();
  }
  if (first) {
    return first.slice(0, 2).toUpperCase();
  }
  if (last) {
    return last.slice(0, 2).toUpperCase();
  }

  // Fall back to email
  if (user.email) {
    const emailName = user.email.split("@")[0];
    // If email has a dot (like first.last@...), use initials from that
    if (emailName.includes(".")) {
      const parts = emailName.split(".");
      return `${parts[0][0]}${parts[1]?.[0] ?? ""}`.toUpperCase();
    }
    return emailName.slice(0, 2).toUpperCase();
  }

  return "?";
}

/** Get display name from user info */
function getUserDisplayName(user?: UserInfo | null): string | null {
  if (!user) return null;

  const first = user.firstName?.trim();
  const last = user.lastName?.trim();
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (last) return last;
  return user.email ?? null;
}

export const AccountMenu: React.FC<AccountMenuProps> = ({
  currentTenant,
  memberships = [],
  onTenantSwitch,
  onSettingsClick,
  onLogout,
  isSuperAdmin,
  isDemoTenant,
  onDemoReset,
  user,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const initials = getUserInitials(user);
  const displayName = getUserDisplayName(user);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowResetConfirm(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setShowResetConfirm(false);
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  // Filter out current tenant from switchable tenants
  const otherTenants = memberships.filter(
    (m) => m.tenantId !== currentTenant?.id
  );
  const hasMultipleTenants = memberships.length > 1;

  const handleTenantClick = (tenantId: number) => {
    if (onTenantSwitch) {
      onTenantSwitch(tenantId);
    }
    setIsOpen(false);
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmReset = () => {
    if (onDemoReset) {
      onDemoReset();
    }
    setShowResetConfirm(false);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 rounded-full p-0.5 hover:bg-surface-strong/50 transition"
        aria-label="Account menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-600 text-white text-xs font-semibold">
          {initials}
        </div>
        <Icon.ChevronDown className={cls("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-hairline bg-surface shadow-lg z-50 overflow-hidden"
          role="menu"
        >
          {/* User Info Section */}
          {(displayName || user?.email) && (
            <div className="p-3 border-b border-hairline">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--brand-orange))]/15 text-[hsl(var(--brand-orange))] text-sm font-semibold shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  {displayName && displayName !== user?.email && (
                    <div className="text-sm font-medium truncate">{displayName}</div>
                  )}
                  {user?.email && (
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Current Tenant Section */}
          {currentTenant && (
            <div className="p-3 border-b border-hairline">
              <div className="text-xs text-muted-foreground mb-1.5">Signed into</div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--brand-orange))]/10 text-[hsl(var(--brand-orange))]">
                  <Icon.Building className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{currentTenant.name}</div>
                </div>
                <Icon.Check className="h-4 w-4 text-[hsl(var(--brand-orange))] shrink-0" />
              </div>
            </div>
          )}

          {/* Other Tenants Section */}
          {hasMultipleTenants && otherTenants.length > 0 && (
            <div className="p-2 border-b border-hairline">
              <div className="text-xs text-muted-foreground px-2 py-1">Switch to</div>
              {otherTenants.map((tenant) => (
                <button
                  key={tenant.tenantId}
                  onClick={() => handleTenantClick(tenant.tenantId)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-surface-strong transition text-left"
                  role="menuitem"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-strong">
                    <Icon.Building className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{tenant.tenantName}</div>
                    {tenant.role && (
                      <div className="text-xs text-muted-foreground capitalize">{tenant.role.toLowerCase()}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Demo Reset Section */}
          {isDemoTenant && isSuperAdmin && onDemoReset && (
            <div className="p-2 border-b border-hairline">
              {showResetConfirm ? (
                <div className="px-2 py-2">
                  <div className="text-sm text-amber-500 mb-2">
                    Reset this demo tenant? All data will be cleared and reseeded.
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-hairline hover:bg-surface-strong transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmReset}
                      className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleResetClick}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-strong transition text-left text-amber-500"
                  role="menuitem"
                >
                  <Icon.RefreshCw className="h-5 w-5" />
                  <span className="text-sm">Reset Demo Tenant</span>
                </button>
              )}
            </div>
          )}

          {/* Actions Section */}
          <div className="p-2">
            {onSettingsClick && (
              <button
                onClick={() => {
                  onSettingsClick();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-strong transition text-left"
                role="menuitem"
              >
                <Icon.Settings className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">Settings</span>
              </button>
            )}
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-strong transition text-left"
              role="menuitem"
            >
              <Icon.Logout className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
