// apps/marketplace/src/core/MarketplaceRoutes.tsx
// Route tree for authenticated/entitled marketplace users.
// Auth routes (/auth/login, /auth/register) are handled at the app level.
import * as React from "react";
import { Routes, Route } from "react-router-dom";
import { ProgramsIndexPage } from "./pages/ProgramsIndexPage";
import { ProgramProfilePage } from "./pages/ProgramProfilePage";
import { OffspringGroupDetailPage } from "./pages/OffspringGroupDetailPage";

/**
 * Route tree for authenticated/entitled marketplace users.
 */
export function MarketplaceRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ProgramsIndexPage />} />
      <Route path="/programs/:programSlug" element={<ProgramProfilePage />} />
      <Route
        path="/programs/:programSlug/offspring-groups/:listingSlug"
        element={<OffspringGroupDetailPage />}
      />
    </Routes>
  );
}
