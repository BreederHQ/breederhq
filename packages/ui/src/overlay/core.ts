// packages/ui/src/overlay/core.ts

// ---- runtime marker (for quick DevTools verification) ----
;(window as any).__BHQ_OVERLAY_IMPL = "overlay/core.ts";

// ---- constants ----
export const OVERLAY_ROOT_ID = "bhq-overlay-root";
const MAX_Z = 2147483647; // 2^31-1 (fits in CSS int z-index)

// ---- module state ----
let mounts = 0;
let cached: HTMLElement | null = null;

/**
 * Always typed as Element for consumers (e.g., createPortal expects Element|DocumentFragment).
 * In SSR, we return a typed stub so DTS is happy. Callers that actually render should only run in the browser.
 */
export function getOverlayRoot(): Element {
  // SSR: return a typed no-op stub to satisfy types; rendering code should bail on the server
  if (typeof document === "undefined") {
    return {} as unknown as Element;
  }

  // If we have a cached node but it got detached, forget it
  if (cached && !document.contains(cached)) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[overlay] cached root was detached; recreating");
    }
    cached = null;
  }

  // Find existing node or create one
  let el = (cached ?? document.getElementById(OVERLAY_ROOT_ID)) as HTMLElement | null;
  const created = !el;

  if (!el) {
    el = document.createElement("div");
    el.id = OVERLAY_ROOT_ID;
    document.body.appendChild(el);
  } else if (el.parentNode !== document.body) {
    // Ensure it's a direct child of <body> (avoid weird stacking/transform contexts)
    document.body.appendChild(el);
  }

  // Baseline safety styles (idempotent). Use inline so consumers don’t need global CSS.
  if (!el.style.position) el.style.position = "fixed";
  if (!el.style.zIndex) el.style.zIndex = String(MAX_Z);
  if (!el.style.pointerEvents) el.style.pointerEvents = "none";
  if (!el.style.getPropertyValue("inset")) el.style.setProperty("inset", "0");

  // Helpful to distinguish in DevTools
  if (!el.dataset.role) el.dataset.role = "bhq-overlay-root";

  cached = el;

  if (process.env.NODE_ENV !== "production") {
    console.debug(
      `[overlay] getOverlayRoot() ${created ? "created" : "reused"} #${OVERLAY_ROOT_ID}`,
      {
        zIndex: el.style.zIndex,
        position: el.style.position,
        pointerEvents: el.style.pointerEvents,
      }
    );
  }

  return el;
}

// Reference-count pointer event enabling while any overlay is open.
export function acquireOverlayHost(): () => void {
  const el = getOverlayRoot() as HTMLElement;

  // increment mounts & enable interactions
  mounts += 1;
  el.style.pointerEvents = "auto";
  (window as any).__BHQ_OVERLAY_RC = mounts; // tiny breadcrumb for DevTools

  if (process.env.NODE_ENV !== "production") {
    console.debug("[overlay] acquire → mounts =", mounts);
  }

  // disposer
  return () => {
    mounts = Math.max(0, mounts - 1);
    (window as any).__BHQ_OVERLAY_RC = mounts;

    if (process.env.NODE_ENV !== "production") {
      console.debug("[overlay] release → mounts =", mounts);
    }

    if (mounts === 0) {
      // disable click-through when nothing is mounted
      const root = getOverlayRoot() as HTMLElement; // revalidate after HMR
      root.style.pointerEvents = "none";
    }
  };
}
