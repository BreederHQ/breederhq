// apps/platform/src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App-Platform";
import "./index.css";


function mountIfPresent(id: string) {
  const el = document.getElementById(id);
  if (!el) {
    // Not this app's page – bail quietly so it doesn't break other entries.
    console.warn(`[platform] no #${id} found; skipping mount`);
    return;
  }
  const root = createRoot(el);
root.render(<App />);
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", () => mountIfPresent("platform-root"), { once: true });
} else {
  mountIfPresent("platform-root");
}
