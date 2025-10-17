// apps/platform/src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App-Platform";
import "./index.css";

// --- Overlay root bootstrap (shell) -----------------------------------------
(() => {
  const ID = 'bhq-overlay-root';

  // 1) Ensure the overlay root exists at document level
  let root = document.getElementById(ID);
  if (!root) {
    root = document.createElement('div');
    root.id = ID;
    document.body.appendChild(root);
  }

  // 2) Tag ownership so we can tell where it came from during debugging
  (root as HTMLElement).dataset.owner = 'shell';

  // 3) One-file CSS hot-fix: force backdrop/panel to be viewport-fixed
  //    so they don't flow inside your card and get pushed down.
  const CSS = `
#bhq-overlay-root{
  position:fixed; inset:0; z-index:2147483647;
  pointer-events:none; isolation:isolate;
}
#bhq-overlay-root > *{ pointer-events:auto; }

#bhq-overlay-root [data-bhq-dialog-backdrop],
#bhq-overlay-root .bhq-dialog__backdrop{
  position:fixed !important; inset:0 !important; z-index:1; pointer-events:auto;
}
#bhq-overlay-root [data-bhq-dialog-panel],
#bhq-overlay-root .bhq-dialog__panel,
#bhq-overlay-root [role="dialog"]{
  position:fixed !important; top:0 !important; right:0 !important;
  height:100vh !important; max-height:100vh !important;
  width:min(720px,100vw); z-index:2; pointer-events:auto;
  overflow:auto; -webkit-overflow-scrolling:touch;
}
  `.trim();

  // Only inject once
  const MARK = 'bhq-overlay-hotfix';
  if (!document.getElementById(MARK)) {
    const style = document.createElement('style');
    style.id = MARK;
    style.textContent = CSS;
    document.head.appendChild(style);
  }
})();


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
