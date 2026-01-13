// apps/marketplace/src/routes/MarketplaceRoutes.tsx
// Marketplace route definitions - separated from gate logic
//
// This file owns all authenticated marketplace route definitions.
// MarketplaceGate wraps this to enforce auth/entitlement.

import * as React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Page imports
import { HomePage } from "../marketplace/pages/HomePage";
import { AnimalsIndexPage } from "../marketplace/pages/AnimalsIndexPage";
import { BreedersIndexPage } from "../marketplace/pages/BreedersIndexPage";
import { BreederPage } from "../marketplace/pages/BreederPage";
import { ServicesPage } from "../marketplace/pages/ServicesPage";
import { InquiriesPage } from "../marketplace/pages/InquiriesPage";
import { UpdatesPage } from "../marketplace/pages/UpdatesPage";
import { ProgramPage } from "../marketplace/pages/ProgramPage";
import { ListingPage } from "../marketplace/pages/ListingPage";
import { MyListingPage } from "../marketplace/pages/MyListingPage";
import { ProgramsSettingsPage } from "../management/pages/ProgramsSettingsPage";
import { ServicesSettingsPage } from "../management/pages/ServicesSettingsPage";
import { BreedingProgramsIndexPage } from "../marketplace/pages/BreedingProgramsIndexPage";
import { ProviderDashboardPage } from "../provider/pages/ProviderDashboardPage";
import { SavedListingsPage } from "../marketplace/pages/SavedListingsPage";
import { WaitlistPositionsPage } from "../marketplace/pages/WaitlistPositionsPage";
import { BuyerDashboardPage } from "../buyer/pages/BuyerDashboardPage";

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
      <Route path="/breeding-programs" element={<BreedingProgramsIndexPage />} />
      <Route path="/services" element={<ServicesPage />} />

      {/* Buyer activity */}
      <Route path="/dashboard" element={<BuyerDashboardPage />} />
      <Route path="/inquiries" element={<InquiriesPage />} />
      <Route path="/updates" element={<UpdatesPage />} />
      <Route path="/saved" element={<SavedListingsPage />} />
      <Route path="/waitlist" element={<WaitlistPositionsPage />} />

      {/* Seller: My listing preview */}
      <Route path="/me/listing" element={<MyListingPage />} />

      {/* Seller: Programs management */}
      <Route path="/me/programs" element={<ProgramsSettingsPage />} />

      {/* Seller: Services management */}
      <Route path="/me/services" element={<ServicesSettingsPage />} />

      {/* Service Provider Portal */}
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
