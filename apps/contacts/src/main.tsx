// main.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// 1) Load design system + Tailwind + app overrides
import "./theme.css";
import "./index.css";

// 2) App
import AppContacts from "./App-Contacts";

/** Ensure a single global overlays root that sits at the top of the viewport.
 *  All createPortal(...) calls should target this node.
 */
function ensureOverlaysRoot(): HTMLElement {
  let el = document.getElementById("overlays-root") as HTMLElement | null;

  if (!el) {
    el = document.createElement("div");
    el.id = "overlays-root";
    document.body.appendChild(el);
  }

  // Normalize critical styles every boot (in case CSS or extensions override them)
  Object.assign(el.style, {
    position: "fixed",          // anchor to viewport
    inset: "0",                 // full-viewport click catcher/backdrops
    zIndex: "2147483646",       // just under any emergency banners (if you add them)
    pointerEvents: "none",      // let children opt-in (their backdrops/panels set pointer-events:auto)
    display: "block",
    isolation: "isolate",       // its own stacking context
  });

  // Make sure any portals we render inside can receive events
  // by turning events back on for direct children.
  // (Our dialogs/drawers/popovers already set pointer-events:auto,
  //  but this protects older pieces.)
  el.childNodes.forEach((n) => {
    if (n instanceof HTMLElement) n.style.pointerEvents = "auto";
  });

  return el;
}

/** Choose a mount node. Prefer #contacts-root, then #root, then #app. */
function getAppMount(): HTMLElement {
  const ids = ["contacts-root", "root", "app"];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) return el as HTMLElement;
  }
  // If none exist, create one to be safe.
  const el = document.createElement("div");
  el.id = "contacts-root";
  document.body.appendChild(el);
  return el;
}

function start() {
  // Create/normalize the overlays root before the app mounts so portals are ready.
  ensureOverlaysRoot();

  // Mount the app.
  const mount = getAppMount();
  const root = createRoot(mount);
  root.render(
    <React.StrictMode>
      <AppContacts />
    </React.StrictMode>
  );

  // Optional: expose a tiny helper for debugging overlay issues in the console.
  (window as any).__getOverlaysRoot = ensureOverlaysRoot;
}

// Kick off
start();
