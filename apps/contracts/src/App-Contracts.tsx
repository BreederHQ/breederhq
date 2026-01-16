// apps/contracts/src/App-Contracts.tsx
// Contracts module for e-signatures with routing and SafeNavLink navigation

import * as React from "react";
import { PageHeader } from "@bhq/ui";
import { OverlayMount } from "@bhq/ui/overlay/OverlayMount";
import { NavLink, useInRouterContext } from "react-router-dom";
import { makeApi } from "./api";
import ContractsHome from "./ContractsHome";
import ContractsListPage from "./ContractsListPage";
import TemplatesPage from "./TemplatesPage";

/* SafeNavLink component - works both in and out of React Router context */
function SafeNavLink({
  to,
  children,
  className,
  style,
  end,
}: {
  to: string;
  children: React.ReactNode | ((arg: { isActive: boolean }) => React.ReactNode);
  className: ((arg: { isActive: boolean }) => string) | string;
  style?: ((arg: { isActive: boolean }) => React.CSSProperties) | React.CSSProperties;
  end?: boolean;
}) {
  const inRouter = useInRouterContext();

  // helper to compute active when not in a Router
  const computeActive = React.useCallback(() => {
    try {
      const here = (typeof window !== "undefined" ? window.location.pathname : "/").replace(/\/+$/, "") || "/";
      const target = new URL(to, typeof window !== "undefined" ? window.location.href : "http://x").pathname
        .replace(/\/+$/, "") || "/";
      if (end) {
        return here === target;
      }
      // treat '/contracts' as active for '/contracts' and '/contracts/...'
      return here === target || here.startsWith(target + "/");
    } catch {
      return false;
    }
  }, [to, end]);

  if (inRouter) {
    return (
      <NavLink to={to} end={end} className={className as any} style={style as any}>
        {children as any}
      </NavLink>
    );
  }

  // Fallback: manual anchor
  const [isActive, setIsActive] = React.useState(computeActive);

  React.useEffect(() => {
    const check = () => setIsActive(computeActive());
    check();
    window.addEventListener("popstate", check);
    return () => window.removeEventListener("popstate", check);
  }, [computeActive]);

  const finalClassName = typeof className === "function" ? className({ isActive }) : className;
  const finalStyle = typeof style === "function" ? style({ isActive }) : style;
  const resolvedChildren = typeof children === "function" ? children({ isActive }) : children;

  return (
    <a
      href={to}
      className={finalClassName}
      style={finalStyle}
      onClick={(e) => {
        e.preventDefault();
        window.history.pushState(null, "", to);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }}
    >
      {resolvedChildren}
    </a>
  );
}

export default function AppContracts() {
  const api = React.useMemo(() => makeApi("/api/v1"), []);

  /* ───────── View routing (home | list | templates) ───────── */
  type ViewRoute = "home" | "list" | "templates";

  // Determine the module base path
  const getBasePath = React.useCallback(() => {
    if (typeof window === "undefined") return "";
    const p = window.location.pathname || "/";
    const clean = p.replace(/\/+$/, "");
    if (clean.endsWith("/list")) return clean.slice(0, -"/list".length) || "/";
    if (clean.endsWith("/templates")) return clean.slice(0, -"/templates".length) || "/";
    return clean || "/";
  }, []);

  const getViewFromLocation = (): ViewRoute => {
    if (typeof window === "undefined") return "home";
    const p = window.location.pathname || "/";
    if (p.includes("/list")) return "list";
    if (p.includes("/templates")) return "templates";
    return "home";
  };

  // Current view state
  const [currentView, setCurrentView] = React.useState<ViewRoute>(getViewFromLocation());
  React.useEffect(() => {
    const onPop = () => setCurrentView(getViewFromLocation());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Module event emission
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("bhq:module", {
          detail: { key: "contracts", label: "Contracts" },
        })
      );
    }
  }, []);

  const basePath = getBasePath();

  /* ============================ RENDER ============================ */
  return (
    <>
      <OverlayMount />

      <div className="p-4 space-y-4">
        <div className="relative">
          <PageHeader
            title="Contracts"
            subtitle={
              currentView === "home"
                ? "Create, send, and track e-signature contracts with your buyers"
                : currentView === "list"
                ? "All contracts across your breeding program"
                : "Manage contract templates"
            }
          />
          <div className="absolute right-0 top-0 h-full flex items-center gap-2 pr-1" style={{ zIndex: 50, pointerEvents: "auto" }}>
            {/* Top-right page navigation */}
            <nav className="flex items-center gap-1 mr-1">
              <SafeNavLink
                to={basePath === "/" ? "/" : `${basePath}/`}
                end
                className={({ isActive }) =>
                  [
                    "relative h-10 px-4 text-base font-semibold leading-10 border-b-2 transition-all duration-300 ease-out flex items-center gap-2",
                    isActive
                      ? "text-primary border-[var(--brand-orange)]"
                      : "text-secondary hover:text-primary border-transparent hover:border-[var(--brand-orange)]/30",
                  ].join(" ")
                }
              >
                {({ isActive }: { isActive: boolean }) => (
                  <>
                    {isActive && (
                      <span className="absolute inset-0 bg-[var(--brand-orange)]/15 blur-lg rounded-lg animate-pulse" />
                    )}
                    <span className="relative z-10">🏠</span>
                    <span className="relative z-10">Home</span>
                  </>
                )}
              </SafeNavLink>

              <SafeNavLink
                to={`${basePath}/list`}
                className={({ isActive }) =>
                  [
                    "relative h-10 px-4 text-base font-semibold leading-10 border-b-2 transition-all duration-300 ease-out flex items-center gap-2",
                    isActive
                      ? "text-primary border-[var(--brand-orange)]"
                      : "text-secondary hover:text-primary border-transparent hover:border-[var(--brand-orange)]/30",
                  ].join(" ")
                }
              >
                {({ isActive }: { isActive: boolean }) => (
                  <>
                    {isActive && (
                      <span className="absolute inset-0 bg-[var(--brand-orange)]/15 blur-lg rounded-lg animate-pulse" />
                    )}
                    <span className="relative z-10">📄</span>
                    <span className="relative z-10">All Contracts</span>
                  </>
                )}
              </SafeNavLink>

              <SafeNavLink
                to={`${basePath}/templates`}
                className={({ isActive }) =>
                  [
                    "relative h-10 px-4 text-base font-semibold leading-10 border-b-2 transition-all duration-300 ease-out flex items-center gap-2",
                    isActive
                      ? "text-primary border-[var(--brand-orange)]"
                      : "text-secondary hover:text-primary border-transparent hover:border-[var(--brand-orange)]/30",
                  ].join(" ")
                }
              >
                {({ isActive }: { isActive: boolean }) => (
                  <>
                    {isActive && (
                      <span className="absolute inset-0 bg-[var(--brand-orange)]/15 blur-lg rounded-lg animate-pulse" />
                    )}
                    <span className="relative z-10">📝</span>
                    <span className="relative z-10">Templates</span>
                  </>
                )}
              </SafeNavLink>
            </nav>
          </div>
        </div>

        {/* Page Content */}
        {currentView === "home" && <ContractsHome api={api} />}
        {currentView === "list" && <ContractsListPage api={api} />}
        {currentView === "templates" && <TemplatesPage api={api} />}
      </div>
    </>
  );
}
