// apps/marketplace/src/routes/MarketplaceRoutes.tsx
// Marketplace route definitions - separated from gate logic
//
// This file owns all authenticated marketplace route definitions.
// MarketplaceGate wraps this to enforce auth/entitlement.

import * as React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useIsSeller } from "../gate/MarketplaceGate";

// Page imports
import { HomePage } from "../marketplace/pages/HomePage";
import { AnimalsIndexPage } from "../marketplace/pages/AnimalsIndexPage";
import { BreedersIndexPage } from "../marketplace/pages/BreedersIndexPage";
import { BreederPage } from "../marketplace/pages/BreederPage";
import { BreedingProgramPage } from "../marketplace/pages/BreedingProgramPage";
import { ServicesIndexPage } from "../marketplace/pages/ServicesIndexPage";
import { InquiriesPage } from "../marketplace/pages/InquiriesPage";
import { UpdatesPage } from "../marketplace/pages/UpdatesPage";
import { ProgramPage } from "../marketplace/pages/ProgramPage";
import { ListingPage } from "../marketplace/pages/ListingPage";
import { MyListingPage } from "../marketplace/pages/MyListingPage";
import { DirectListingPage } from "../marketplace/pages/DirectListingPage";
// import { BreedingProgramsIndexPage } from "../marketplace/pages/BreedingProgramsIndexPage"; // ARCHIVED
import { AnimalProgramDetailPage } from "../marketplace/pages/AnimalProgramDetailPage";
import { ProviderDashboardPage } from "../provider/pages/ProviderDashboardPage";
import { SavedListingsPage } from "../marketplace/pages/SavedListingsPage";
import { WaitlistPositionsPage } from "../marketplace/pages/WaitlistPositionsPage";
import { BuyerDashboardPage } from "../buyer/pages/BuyerDashboardPage";

// V2 Breeder Management Portal
import { MarketplaceManagePortal } from "../breeder/pages/MarketplaceManagePortal";
import { ManageAnimalsPage } from "../breeder/pages/ManageAnimalsPage";
import { ManageServicesPage } from "../breeder/pages/ManageServicesPage";
import { ManageBreedingProgramsPage } from "../breeder/pages/ManageBreedingProgramsPage";
import { AnimalProgramsPage } from "../breeder/pages/AnimalProgramsPage";
import BreedingProgramRulesPage from "../breeder/pages/BreedingProgramRulesPage";
import { CreateDirectListingWizard } from "../breeder/pages/CreateDirectListingWizard";
import { CreateServiceWizard } from "../breeder/pages/CreateServiceWizard";
import { FoalingCalendarPage } from "../breeder/pages/FoalingCalendarPage";

/**
 * Route guard for seller-only routes.
 * Redirects to home if user doesn't have seller context.
 */
function SellerOnlyRoute({ children }: { children: React.ReactNode }) {
  const isSeller = useIsSeller();

  if (!isSeller) {
    // Buyers trying to access seller routes get redirected to home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/**
 * Route tree for authenticated/entitled marketplace users.
 * This component should be rendered inside MarketplaceGate.
 */
export function MarketplaceRoutes() {
  return (
    <Routes>
      {/* Home - Marketplace entry point */}
      <Route path="/" element={<HomePage />} />

      {/* Browse pages */}
      <Route path="/animals" element={<AnimalsIndexPage />} />
      <Route path="/breeders" element={<BreedersIndexPage />} />
      <Route path="/breeders/:tenantSlug" element={<BreederPage />} />
      {/* <Route path="/breeding-programs" element={<BreedingProgramsIndexPage />} /> */} {/* ARCHIVED - redundant with animal-programs */}
      <Route path="/breeding-programs/:slug" element={<BreedingProgramPage />} />
      <Route path="/animal-programs/:slug" element={<AnimalProgramDetailPage />} />
      <Route path="/services" element={<ServicesIndexPage />} />

      {/* V2 Direct Listing Detail */}
      <Route path="/listings/:slug" element={<DirectListingPage />} />

      {/* Buyer activity */}
      <Route path="/dashboard" element={<BuyerDashboardPage />} />
      <Route path="/inquiries" element={<InquiriesPage />} />
      <Route path="/updates" element={<UpdatesPage />} />
      <Route path="/saved" element={<SavedListingsPage />} />
      <Route path="/waitlist" element={<WaitlistPositionsPage />} />

      {/* Seller: My listing preview (legacy) */}
      <Route path="/me/listing" element={<MyListingPage />} />

      {/* V2 Unified Marketplace Management Portal - Seller only */}
      <Route
        path="/manage/breeder"
        element={
          <SellerOnlyRoute>
            <MarketplaceManagePortal />
          </SellerOnlyRoute>
        }
      />

      {/* V2 Dedicated Management Pages - Seller only */}
      <Route
        path="/manage/individual-animals"
        element={
          <SellerOnlyRoute>
            <ManageAnimalsPage />
          </SellerOnlyRoute>
        }
      />
      <Route
        path="/manage/individual-animals/new"
        element={
          <SellerOnlyRoute>
            <CreateDirectListingWizard />
          </SellerOnlyRoute>
        }
      />
      <Route
        path="/manage/animal-programs"
        element={
          <SellerOnlyRoute>
            <AnimalProgramsPage />
          </SellerOnlyRoute>
        }
      />
      <Route
        path="/manage/your-services"
        element={
          <SellerOnlyRoute>
            <ManageServicesPage />
          </SellerOnlyRoute>
        }
      />
      <Route
        path="/manage/your-services/new"
        element={
          <SellerOnlyRoute>
            <CreateServiceWizard />
          </SellerOnlyRoute>
        }
      />
      {/* Legacy route redirects */}
      <Route
        path="/manage/animal-listings"
        element={<Navigate to="/manage/individual-animals" replace />}
      />
      <Route
        path="/manage/services"
        element={<Navigate to="/manage/your-services" replace />}
      />
      <Route
        path="/manage/breeding-programs"
        element={
          <SellerOnlyRoute>
            <ManageBreedingProgramsPage />
          </SellerOnlyRoute>
        }
      />
      <Route
        path="/manage/breeding-programs/:programSlug/rules"
        element={
          <SellerOnlyRoute>
            <BreedingProgramRulesPage />
          </SellerOnlyRoute>
        }
      />
      <Route
        path="/manage/breeding-programs/foaling-calendar"
        element={
          <SellerOnlyRoute>
            <FoalingCalendarPage />
          </SellerOnlyRoute>
        }
      />

      {/* Legacy seller routes - redirect to new management pages */}
      <Route
        path="/manage"
        element={
          <SellerOnlyRoute>
            <Navigate to="/manage/breeder" replace />
          </SellerOnlyRoute>
        }
      />
      <Route
        path="/me/programs"
        element={
          <SellerOnlyRoute>
            <Navigate to="/manage/breeder" replace />
          </SellerOnlyRoute>
        }
      />
      <Route
        path="/me/services"
        element={
          <SellerOnlyRoute>
            <Navigate to="/manage/your-services" replace />
          </SellerOnlyRoute>
        }
      />
      <Route
        path="/me/animals"
        element={
          <SellerOnlyRoute>
            <Navigate to="/manage/breeder" replace />
          </SellerOnlyRoute>
        }
      />
      <Route
        path="/me/litters"
        element={
          <SellerOnlyRoute>
            <Navigate to="/manage/breeder" replace />
          </SellerOnlyRoute>
        }
      />

      {/* Service Provider Portal - Open to all authenticated marketplace users */}
      <Route path="/provider" element={<ProviderDashboardPage />} />
      <Route path="/provider/*" element={<ProviderDashboardPage />} />

      {/* Legacy redirects */}
      <Route path="/litters" element={<Navigate to="/animals" replace />} />
      <Route path="/programs" element={<Navigate to="/breeders" replace />} />

      {/* Program detail pages (preserve existing deep links) */}
      <Route path="/programs/:programSlug" element={<ProgramPage />} />
      <Route
        path="/programs/:programSlug/offspring-groups/:listingSlug"
        element={<ListingPage />}
      />
    </Routes>
  );
}

export default MarketplaceRoutes;
