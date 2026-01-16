// apps/marketplace/src/layout/BottomTabBar.tsx
// Fixed bottom navigation bar for mobile devices (<768px)

import * as React from "react";
import { Link, useLocation } from "react-router-dom";

/**
 * Home icon
 */
function HomeIcon({ className, filled }: { className?: string; filled?: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2L2 12h3v9h6v-6h2v6h6v-9h3L12 2z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Browse/Search icon
 */
function SearchIcon({ className, filled }: { className?: string; filled?: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M10 2a8 8 0 105.293 14.707l4 4a1 1 0 001.414-1.414l-4-4A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z" />
      </svg>
    );
  }
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

/**
 * Messages icon
 */
function MessagesIcon({ className, filled }: { className?: string; filled?: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.823 1.387 5.33 3.527 6.972a.75.75 0 01.273.66l-.241 2.417a.75.75 0 001.084.76l2.687-1.342a.75.75 0 01.531-.059 10.34 10.34 0 002.139.22c5.523 0 10-4.145 10-9.628C22 6.145 17.523 2 12 2z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Heart/Saved icon
 */
function HeartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    );
  }
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

/**
 * Account/User icon
 */
function UserIcon({ className, filled }: { className?: string; filled?: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
      </svg>
    );
  }
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

interface Tab {
  id: string;
  label: string;
  path: string;
  icon: React.FC<{ className?: string; filled?: boolean }>;
}

const tabs: Tab[] = [
  { id: "home", label: "Home", path: "/", icon: HomeIcon },
  { id: "browse", label: "Browse", path: "/animals", icon: SearchIcon },
  { id: "messages", label: "Messages", path: "/inquiries", icon: MessagesIcon },
  { id: "saved", label: "Saved", path: "/saved", icon: HeartIcon },
  { id: "account", label: "Account", path: "/me/programs", icon: UserIcon },
];

interface BottomTabBarProps {
  authenticated: boolean;
  unreadMessages?: number;
  savedCount?: number;
}

export function BottomTabBar({
  authenticated,
  unreadMessages = 0,
  savedCount = 0,
}: BottomTabBarProps) {
  const location = useLocation();

  // Determine active tab based on current path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === "/") return "home";
    if (path.startsWith("/animals") || path.startsWith("/breeders") || path.startsWith("/services")) return "browse";
    if (path.startsWith("/inquiries") || path.startsWith("/updates")) return "messages";
    if (path.startsWith("/saved") || path.startsWith("/waitlist")) return "saved";
    if (path.startsWith("/me") || path.startsWith("/provider") || path.startsWith("/login") || path.startsWith("/register")) return "account";
    return "home";
  };

  const activeTab = getActiveTab();

  return (
    <nav
      role="tablist"
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-portal-elevated border-t border-border-subtle"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;

          // Get badge count for specific tabs
          let badgeCount = 0;
          if (tab.id === "messages") badgeCount = unreadMessages;
          if (tab.id === "saved") badgeCount = savedCount;

          // Determine the target path based on authentication
          let targetPath = tab.path;
          if (!authenticated && (tab.id === "messages" || tab.id === "saved")) {
            targetPath = "/login";
          }
          if (!authenticated && tab.id === "account") {
            targetPath = "/login";
          }

          return (
            <Link
              key={tab.id}
              to={targetPath}
              role="tab"
              aria-selected={isActive}
              aria-label={badgeCount > 0 ? `${tab.label}, ${badgeCount} unread` : tab.label}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive
                  ? "text-[hsl(var(--brand-orange))]"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              <div className="relative">
                <Icon className="h-6 w-6" filled={isActive} />
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${isActive ? "font-semibold" : ""}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-bottom bg-portal-elevated" />
    </nav>
  );
}

export default BottomTabBar;
