// apps/marketplace/src/core/MarketplaceRoutes.tsx
// Route tree for authenticated/entitled marketplace users.
// Auth routes (/auth/login, /auth/register) are handled at the app level.
import * as React from "react";
import { Routes, Route } from "react-router-dom";
import { ProgramsPage } from "../ui/pages/ProgramsPage";
import { ProgramPage } from "../ui/pages/ProgramPage";
import { ListingPage } from "../ui/pages/ListingPage";

/**
 * Route tree for authenticated/entitled marketplace users.
 */
export function MarketplaceRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ProgramsPage />} />
      <Route path="/programs/:programSlug" element={<ProgramPage />} />
      <Route
        path="/programs/:programSlug/offspring-groups/:listingSlug"
        element={<ListingPage />}
      />
    </Routes>
  );
}
