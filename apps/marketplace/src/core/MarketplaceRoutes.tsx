// apps/marketplace/src/core/MarketplaceRoutes.tsx
import * as React from "react";
import { Routes, Route, Link, useSearchParams } from "react-router-dom";
import { ProgramsIndexPage } from "./pages/ProgramsIndexPage";
import { ProgramProfilePage } from "./pages/ProgramProfilePage";
import { OffspringGroupDetailPage } from "./pages/OffspringGroupDetailPage";

/**
 * Placeholder login page with Back link.
 */
function LoginPlaceholder() {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";

  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-primary mb-4">Login Placeholder</h1>
        <Link
          to={returnTo}
          className="text-brand-orange hover:underline"
        >
          Back
        </Link>
      </div>
    </div>
  );
}

/**
 * Placeholder register page with Back link.
 */
function RegisterPlaceholder() {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";

  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-primary mb-4">Register Placeholder</h1>
        <Link
          to={returnTo}
          className="text-brand-orange hover:underline"
        >
          Back
        </Link>
      </div>
    </div>
  );
}

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
      <Route path="/auth/login" element={<LoginPlaceholder />} />
      <Route path="/auth/register" element={<RegisterPlaceholder />} />
    </Routes>
  );
}
