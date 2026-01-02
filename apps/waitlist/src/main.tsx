// apps/waitlist/src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// Change per app:
import App from "./App-Waitlist";

// One stylesheet to rule them all
import "@bhq/ui/bhq.css";

function ensureOverlayRoot() {
  const mode = (window as any).__BHQ_OVERLAY_MODE as "local" | "global" | undefined;
  if (mode === "global") return;                               // Platform owns it
  if (document.getElementById("bhq-overlay-root")) return;     // Already present

  // Only for truly-standalone local runs:
  const el = document.createElement("div");
  el.id = "bhq-overlay-root";
  el.style.position = "fixed";
  el.style.inset = "0";
  el.style.zIndex = "2147483647";
  el.style.pointerEvents = "none";
  document.body.appendChild(el);
}

function mount() {
  ensureOverlayRoot();

  let rootEl = document.getElementById("root");
  if (!rootEl) {
    rootEl = document.createElement("div");
    rootEl.id = "root";
    document.body.appendChild(rootEl);
  }

  createRoot(rootEl).render(<App />);
}

mount();
