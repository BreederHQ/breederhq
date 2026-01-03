// apps/marketplace/src/app/MarketplaceStandaloneApp.tsx
import * as React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MarketplaceGate } from "../gate/MarketplaceGate";
import { LoginPage } from "../auth/LoginPage";
import { RegisterPage } from "../auth/RegisterPage";
import { TermsPage } from "../pages/TermsPage";

/**
 * Root component for standalone Marketplace app.
 * Auth routes are handled at the top level, outside the gate.
 * All other routes go through MarketplaceGate for auth/entitlement checks.
 */
export function MarketplaceStandaloneApp() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Routes>
        {/* Auth routes are outside the gate - accessible without authentication */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        {/* Legal pages are public - accessible without authentication */}
        <Route path="/terms" element={<TermsPage />} />
        {/* All other routes go through the gate */}
        <Route path="*" element={<MarketplaceGate />} />
      </Routes>
    </BrowserRouter>
  );
}

export default MarketplaceStandaloneApp;
