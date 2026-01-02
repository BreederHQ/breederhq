// apps/breeding/src/pages/plannerV2/dev-entry.tsx
// Standalone entry point for viewing Planner V2 pages in development
//
// To use this:
// 1. Create a temporary HTML file that loads this entry point
// 2. Or import PlannerV2DevPreview into an existing dev harness
//
// This file is NOT imported by App-Breeding.tsx and has zero impact on production.

import * as React from "react";
import { createRoot } from "react-dom/client";
import { PlannerV2DevPreview } from "./DevPreview";

// Import base styles (same as main app)
import "../../index.css";

function mount() {
  const container = document.getElementById("planner-v2-root");
  if (!container) {
    console.warn("[PlannerV2] No #planner-v2-root element found. Skipping mount.");
    return;
  }

  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <PlannerV2DevPreview />
    </React.StrictMode>
  );
}

// Auto-mount when DOM is ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
}

// Also export for manual mounting
export { PlannerV2DevPreview, mount };
