// apps/marketplace/src/app/MarketplaceStandaloneApp.tsx
import * as React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MarketplaceGate } from "../gate/MarketplaceGate";
import { AuthLoginPlaceholderPage } from "../core/pages/AuthLoginPlaceholderPage";
import { AuthRegisterPlaceholderPage } from "../core/pages/AuthRegisterPlaceholderPage";

/**
 * Root component for standalone Marketplace app.
 * Auth routes are handled at the top level, outside the gate.
 * All other routes go through MarketplaceGate for auth/entitlement checks.
 */
export function MarketplaceStandaloneApp() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes are outside the gate - accessible without authentication */}
        <Route path="/auth/login" element={<AuthLoginPlaceholderPage />} />
        <Route path="/auth/register" element={<AuthRegisterPlaceholderPage />} />
        {/* All other routes go through the gate */}
        <Route path="*" element={<MarketplaceGate />} />
      </Routes>
    </BrowserRouter>
  );
}

export default MarketplaceStandaloneApp;
