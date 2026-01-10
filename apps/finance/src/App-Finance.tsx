// apps/finance/src/App-Finance-New.tsx
// Finance module with routing and SafeNavLink navigation matching Breeding module pattern

import * as React from "react";
import { PageHeader } from "@bhq/ui";
import { OverlayMount } from "@bhq/ui/overlay/OverlayMount";
import { NavLink, useInRouterContext } from "react-router-dom";
import { makeApi } from "./api";
import FinanceHome from "./FinanceHome";
import InvoicesPage from "./InvoicesPage";
import ExpensesPage from "./ExpensesPage";

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
      // treat '/invoices' as active for '/invoices' and '/invoices/...'
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

export default function AppFinance() {
  const api = React.useMemo(() => makeApi("/api/v1"), []);

  /* ───────── View routing (home | invoices | expenses) ───────── */
  type ViewRoute = "home" | "invoices" | "expenses";

  // Determine the module base path
  const getBasePath = React.useCallback(() => {
    if (typeof window === "undefined") return "";
    const p = window.location.pathname || "/";
    const clean = p.replace(/\/+$/, "");
    if (clean.endsWith("/invoices")) return clean.slice(0, -"/invoices".length) || "/";
    if (clean.endsWith("/expenses")) return clean.slice(0, -"/expenses".length) || "/";
    return clean || "/";
  }, []);

  const getViewFromLocation = (): ViewRoute => {
    if (typeof window === "undefined") return "home";
    const p = window.location.pathname || "/";
    if (p.includes("/invoices")) return "invoices";
    if (p.includes("/expenses")) return "expenses";
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
          detail: { key: "finance", label: "Finance" },
        })
      );
    }
  }, []);

  const basePath = getBasePath();

  // Navigation handler for FinanceHome
  const handleNavigate = React.useCallback((view: "invoices" | "expenses") => {
    const targetPath = `${basePath === "/" ? "" : basePath}/${view}`;
    window.history.pushState(null, "", targetPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, [basePath]);

  /* ============================ RENDER ============================ */
  return (
    <>
      <OverlayMount />

      <div className="p-4 space-y-4">
        <div className="relative">
          <PageHeader
            title="Finance"
            subtitle={
              currentView === "home"
                ? "Track invoices, payments, and expenses across your breeding program"
                : currentView === "invoices"
                ? "Tenant-wide invoice ledger"
                : "Tenant-wide expense ledger"
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
                      ? "text-primary border-[hsl(var(--brand-orange))]"
                      : "text-secondary hover:text-primary border-transparent hover:border-[hsl(var(--brand-orange))]/30",
                  ].join(" ")
                }
              >
                {({ isActive }: { isActive: boolean }) => (
                  <>
                    {isActive && (
                      <span className="absolute inset-0 bg-[hsl(var(--brand-orange))]/15 blur-lg rounded-lg animate-pulse" />
                    )}
                    <span className="relative z-10">🏠</span>
                    <span className="relative z-10">Home</span>
                  </>
                )}
              </SafeNavLink>

              <SafeNavLink
                to={`${basePath}/invoices`}
                className={({ isActive }) =>
                  [
                    "relative h-10 px-4 text-base font-semibold leading-10 border-b-2 transition-all duration-300 ease-out flex items-center gap-2",
                    isActive
                      ? "text-primary border-[hsl(var(--brand-orange))]"
                      : "text-secondary hover:text-primary border-transparent hover:border-[hsl(var(--brand-orange))]/30",
                  ].join(" ")
                }
              >
                {({ isActive }: { isActive: boolean }) => (
                  <>
                    {isActive && (
                      <span className="absolute inset-0 bg-[hsl(var(--brand-orange))]/15 blur-lg rounded-lg animate-pulse" />
                    )}
                    <span className="relative z-10">📄</span>
                    <span className="relative z-10">Invoices</span>
                  </>
                )}
              </SafeNavLink>

              <SafeNavLink
                to={`${basePath}/expenses`}
                className={({ isActive }) =>
                  [
                    "relative h-10 px-4 text-base font-semibold leading-10 border-b-2 transition-all duration-300 ease-out flex items-center gap-2",
                    isActive
                      ? "text-primary border-[hsl(var(--brand-orange))]"
                      : "text-secondary hover:text-primary border-transparent hover:border-[hsl(var(--brand-orange))]/30",
                  ].join(" ")
                }
              >
                {({ isActive }: { isActive: boolean }) => (
                  <>
                    {isActive && (
                      <span className="absolute inset-0 bg-[hsl(var(--brand-orange))]/15 blur-lg rounded-lg animate-pulse" />
                    )}
                    <span className="relative z-10">💸</span>
                    <span className="relative z-10">Expenses</span>
                  </>
                )}
              </SafeNavLink>
            </nav>
          </div>
        </div>

        {/* Page Content */}
        {currentView === "home" && <FinanceHome api={api} />}
        {currentView === "invoices" && <InvoicesPage api={api} />}
        {currentView === "expenses" && <ExpensesPage api={api} />}
      </div>
    </>
  );
}
