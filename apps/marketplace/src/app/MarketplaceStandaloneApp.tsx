// apps/marketplace/src/app/MarketplaceStandaloneApp.tsx
import * as React from "react";
import { BrowserRouter } from "react-router-dom";
import { MarketplaceGate } from "../gate/MarketplaceGate";

/**
 * Root component for standalone Marketplace app.
 * Wraps everything in BrowserRouter for client-side routing.
 */
export function MarketplaceStandaloneApp() {
  return (
    <BrowserRouter>
      <MarketplaceGate />
    </BrowserRouter>
  );
}

export default MarketplaceStandaloneApp;
