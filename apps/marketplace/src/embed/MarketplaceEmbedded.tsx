// apps/marketplace/src/embed/MarketplaceEmbedded.tsx
// Embedded entrypoint for mounting Marketplace inside Platform shell.
// Uses MemoryRouter to provide React Router context while syncing with Platform's URL.
import * as React from "react";
import { MemoryRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

// Import Marketplace styles - provides portal-* classes and dark theme
import "../index.css";
import { HomePage } from "../marketplace/pages/HomePage";
import { AnimalsIndexPage } from "../marketplace/pages/AnimalsIndexPage";
import { BreedersIndexPage } from "../marketplace/pages/BreedersIndexPage";
import { BreederPage } from "../marketplace/pages/BreederPage";
import { ServicesPage } from "../marketplace/pages/ServicesPage";
import { InquiriesPage } from "../marketplace/pages/InquiriesPage";
import { UpdatesPage } from "../marketplace/pages/UpdatesPage";
import { ProgramPage } from "../marketplace/pages/ProgramPage";
import { ListingPage } from "../marketplace/pages/ListingPage";

const BASE_PATH = "/marketplace";

function getMarketplacePath(): string {
  const full = window.location.pathname;
  const fullLower = full.toLowerCase();
  if (fullLower.startsWith(BASE_PATH.toLowerCase())) {
    // Preserve original casing in the returned path
    return full.slice(BASE_PATH.length) || "/";
  }
  return "/";
}

/**
 * Syncs MemoryRouter with browser URL bidirectionally:
 * - Browser URL changes (popstate) → update MemoryRouter
 * - MemoryRouter changes (Link clicks) → update browser URL
 */
function UrlSync() {
  const navigate = useNavigate();
  const location = useLocation();

  // Sync browser URL → MemoryRouter
  React.useEffect(() => {
    const onPop = () => {
      const newPath = getMarketplacePath();
      if (newPath !== location.pathname) {
        navigate(newPath, { replace: true });
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [navigate, location.pathname]);

  // Sync MemoryRouter → browser URL (for <Link> clicks inside Marketplace)
  React.useEffect(() => {
    const targetBrowserPath = BASE_PATH + (location.pathname === "/" ? "" : location.pathname);
    if (window.location.pathname.toLowerCase() !== targetBrowserPath.toLowerCase()) {
      window.history.pushState(null, "", targetBrowserPath);
      // Notify Platform's RouteView
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, [location.pathname]);

  return null;
}

/**
 * Embedded content wrapper - renders content without MarketplaceLayout header.
 * Platform's NavShell provides the navigation and handles scrolling.
 * Applies Marketplace theme styles (dark background, portal colors).
 *
 * Note: This is rendered inside NavShell's scrollable main area.
 * We should NOT create a nested scroll container - let the platform handle scrolling.
 */
function EmbeddedContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-portal-bg text-white font-sans antialiased rounded-2xl border border-border-subtle">
      {/* Content frame - matches standalone MarketplaceLayout main element */}
      <div className="w-full max-w-portal mx-auto px-6 pt-8 pb-16">
        {children}
      </div>
    </div>
  );
}

/**
 * Embedded Marketplace root for mounting inside Platform.
 * - No BrowserRouter (Platform controls URL)
 * - No MarketplaceGate (Platform handles auth)
 * - No MarketplaceLayout header (Platform provides NavShell)
 * - MemoryRouter provides React Router context for internal components
 */
export function MarketplaceEmbedded() {
  const initialPath = React.useMemo(() => getMarketplacePath(), []);

  // Dispatch module announcement to Platform
  React.useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("bhq:module", { detail: { key: "marketplace", label: "Marketplace" } })
    );
  }, []);

  return (
    <MemoryRouter initialEntries={[initialPath]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <UrlSync />
      <EmbeddedContent>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/manage" element={<Navigate to="/" replace />} />
          <Route path="/animals" element={<AnimalsIndexPage />} />
          <Route path="/breeders" element={<BreedersIndexPage />} />
          <Route path="/breeders/:tenantSlug" element={<BreederPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/inquiries" element={<InquiriesPage />} />
          <Route path="/updates" element={<UpdatesPage />} />
          <Route path="/litters" element={<Navigate to="/animals" replace />} />
          <Route path="/programs" element={<Navigate to="/breeders" replace />} />
          <Route path="/programs/:programSlug" element={<ProgramPage />} />
          <Route path="/programs/:programSlug/offspring-groups/:listingSlug" element={<ListingPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </EmbeddedContent>
    </MemoryRouter>
  );
}
