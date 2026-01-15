// apps/marketplace/src/embed/MarketplaceEmbedded.tsx
// Embedded entrypoint for mounting Marketplace inside Platform shell.
// Uses MemoryRouter to provide React Router context while syncing with Platform's URL.
//
// IMPORTANT: When embedded in Platform, the user is ALWAYS a breeder/seller
// with tenant context. We provide this via GateContext from MarketplaceGate.
import * as React from "react";
import { MemoryRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

// Import Marketplace styles - provides portal-* classes and dark theme
import "../index.css";
import { HomePage } from "../marketplace/pages/HomePage";
import { AnimalsIndexPage } from "../marketplace/pages/AnimalsIndexPage";
import { BreedersIndexPage } from "../marketplace/pages/BreedersIndexPage";
import { BreederPage } from "../marketplace/pages/BreederPage";
import { ServicesIndexPage } from "../marketplace/pages/ServicesIndexPage";
import { InquiriesPage } from "../marketplace/pages/InquiriesPage";
import { UpdatesPage } from "../marketplace/pages/UpdatesPage";
import { ProgramPage } from "../marketplace/pages/ProgramPage";
import { ListingPage } from "../marketplace/pages/ListingPage";
import { MarketplaceManagePortal } from "../breeder/pages/MarketplaceManagePortal";
import { ManageAnimalsPage } from "../breeder/pages/ManageAnimalsPage";
import { ManageServicesPage } from "../breeder/pages/ManageServicesPage";
import { ManageBreedingProgramsPage } from "../breeder/pages/ManageBreedingProgramsPage";
import { AnimalProgramsPage } from "../breeder/pages/AnimalProgramsPage";
import { CreateProgramWizard } from "../breeder/pages/CreateProgramWizard";
import { CreateDirectListingWizard } from "../breeder/pages/CreateDirectListingWizard";
import { ProgramDetailPage } from "../breeder/pages/ProgramDetailPage";
// Import the shared GateContext so hooks work correctly
import { GateContext, type GateContextValue } from "../gate/MarketplaceGate";

const BASE_PATH = "/marketplace";

/**
 * Get tenant ID from window global or localStorage.
 * This is set by the Platform when it loads.
 */
function getTenantId(): string | null {
  try {
    const w = typeof window !== "undefined" ? (window as any) : {};
    const tenantId = w.__BHQ_TENANT_ID__ || localStorage.getItem("BHQ_TENANT_ID");
    return tenantId ? String(tenantId) : null;
  } catch {
    return null;
  }
}

// ============================================================================
// URL HELPERS
// ============================================================================

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
 * - EmbeddedGateProvider provides seller context (platform = breeder portal)
 */
export function MarketplaceEmbedded() {
  const initialPath = React.useMemo(() => getMarketplacePath(), []);

  // Get tenant ID - in embedded mode (platform portal), this should always exist
  const tenantId = React.useMemo(() => getTenantId(), []);

  // Gate context value - embedded mode is always seller context
  const gateContextValue = React.useMemo<GateContextValue>(
    () => ({
      status: "entitled",
      isEntitled: true,
      userProfile: null,
      tenantId,
      isSeller: !!tenantId, // True when we have tenant context
    }),
    [tenantId]
  );

  // Dispatch module announcement to Platform
  React.useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("bhq:module", { detail: { key: "marketplace", label: "Marketplace" } })
    );
  }, []);

  return (
    <GateContext.Provider value={gateContextValue}>
      <MemoryRouter initialEntries={[initialPath]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <UrlSync />
        <EmbeddedContent>
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* Seller management pages */}
            <Route path="/manage/breeder" element={<MarketplaceManagePortal />} />
            <Route path="/manage/animals-direct" element={<ManageAnimalsPage />} />
            <Route path="/manage/animals-direct/new" element={<CreateDirectListingWizard />} />
            <Route path="/manage/animal-programs" element={<AnimalProgramsPage />} />
            <Route path="/manage/animal-programs/new" element={<CreateProgramWizard />} />
            <Route path="/manage/animal-programs/:programId" element={<ProgramDetailPage />} />
            <Route path="/manage/breeding-programs" element={<ManageBreedingProgramsPage />} />
            <Route path="/manage/services-direct" element={<ManageServicesPage />} />
            {/* Legacy redirects */}
            <Route path="/manage/animals" element={<Navigate to="/manage/animals-direct" replace />} />
            <Route path="/manage/animal-listings" element={<Navigate to="/manage/animals-direct" replace />} />
            <Route path="/manage/services" element={<Navigate to="/manage/services-direct" replace />} />
            <Route path="/manage" element={<Navigate to="/manage/breeder" replace />} />
            <Route path="/animals" element={<AnimalsIndexPage />} />
            <Route path="/breeders" element={<BreedersIndexPage />} />
            <Route path="/breeders/:tenantSlug" element={<BreederPage />} />
            <Route path="/services" element={<ServicesIndexPage />} />
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
    </GateContext.Provider>
  );
}
