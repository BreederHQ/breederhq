// apps/marketplace/src/embed/MarketplaceEmbedded.tsx
// Embedded entrypoint for mounting Marketplace inside Platform shell.
// Uses MemoryRouter to provide React Router context while syncing with Platform's URL.
import * as React from "react";
import { MemoryRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { HomePage } from "../marketplace/pages/HomePage";
import { AnimalsIndexPage } from "../marketplace/pages/AnimalsIndexPage";
import { BreedersIndexPage } from "../marketplace/pages/BreedersIndexPage";
import { ServicesPage } from "../marketplace/pages/ServicesPage";
import { InquiriesPage } from "../marketplace/pages/InquiriesPage";
import { UpdatesPage } from "../marketplace/pages/UpdatesPage";
import { ProgramPage } from "../marketplace/pages/ProgramPage";
import { ListingPage } from "../marketplace/pages/ListingPage";

const BASE_PATH = "/marketplace";

function getMarketplacePath(): string {
  const full = window.location.pathname.toLowerCase();
  if (full.startsWith(BASE_PATH)) {
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
 * Platform's NavShell provides the navigation.
 */
function EmbeddedContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-portal mx-auto px-6 pt-4 pb-16">
      {children}
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
    <MemoryRouter initialEntries={[initialPath]}>
      <UrlSync />
      <EmbeddedContent>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/animals" element={<AnimalsIndexPage />} />
          <Route path="/breeders" element={<BreedersIndexPage />} />
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
