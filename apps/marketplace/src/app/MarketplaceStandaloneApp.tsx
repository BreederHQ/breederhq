// apps/marketplace/src/app/MarketplaceStandaloneApp.tsx
import * as React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MarketplaceGate } from "../gate/MarketplaceGate";
import { AuthLoginPage } from "../core/pages/AuthLoginPage";
import { AuthRegisterPage } from "../core/pages/AuthRegisterPage";

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
        <Route path="/auth/login" element={<AuthLoginPage />} />
        <Route path="/auth/register" element={<AuthRegisterPage />} />
        {/* All other routes go through the gate */}
        <Route path="*" element={<MarketplaceGate />} />
      </Routes>
    </BrowserRouter>
  );
}

export default MarketplaceStandaloneApp;
