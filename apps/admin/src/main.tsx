// apps/admin/src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// 1) Load design system + Tailwind + app overrides
import "./theme.css";
import "./index.css";

// 2) App
import AppAdmin from "./App-Admin";

/** Ensure a single global overlays root that sits at the top of the viewport. */
function ensureOverlaysRoot(): HTMLElement {
  let el = document.getElementById("overlays-root") as HTMLElement | null;
  if (!el) {
    el = document.createElement("div");
    el.id = "overlays-root";
    Object.assign(el.style, {
      position: "fixed",
      inset: "0",
      zIndex: "2147483647",
      pointerEvents: "none",
    });
    document.body.appendChild(el);
  }
  return el;
}
function getAppMount(): HTMLElement {
  let el = document.getElementById("root") as HTMLElement | null;
  if (!el) {
    el = document.createElement("div");
    el.id = "root";
    document.body.appendChild(el);
  }
  return el;
}

function start() {
  ensureOverlaysRoot();
  const mount = getAppMount();
  const root = createRoot(mount);
  root.render(
    <React.StrictMode>
      <AppAdmin />
    </React.StrictMode>
  );
  (window as any).__getOverlaysRoot = ensureOverlaysRoot;
}

start();
