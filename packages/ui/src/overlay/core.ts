// packages/ui/src/overlay/core.ts
export const OVERLAY_ROOT_ID = "bhq-overlay-root";
export const FLYOUT_ROOT_ID  = "bhq-flyout-root";

const MAX_Z = 2147483647;

let cachedOverlay: HTMLElement | null = null;
let cachedFlyout: HTMLElement | null = null;
let overlayRefCount = 0;

function ensureInBody(el: HTMLElement) {
  if (el.parentElement !== document.body) document.body.appendChild(el);
  return el;
}

export function getOverlayRoot(): HTMLElement {
  if (typeof document === "undefined") return {} as any;
  if (cachedOverlay && !document.contains(cachedOverlay)) cachedOverlay = null;

  let el = cachedOverlay ?? (document.getElementById(OVERLAY_ROOT_ID) as HTMLElement | null);
  if (!el) {
    el = document.createElement("div");
    el.id = OVERLAY_ROOT_ID;
    document.body.appendChild(el);
  }
  ensureInBody(el);

  // baseline styles
  el.style.position = "fixed";
  el.style.setProperty("inset", "0");
  el.style.zIndex = String(MAX_Z - 1); // below flyout
  el.style.pointerEvents = el.style.pointerEvents || "none";
  el.dataset.role ||= "bhq-overlay-root";

  cachedOverlay = el;
  return el;
}

export function getFlyoutRoot(): HTMLElement {
  if (typeof document === "undefined") return {} as any;
  if (cachedFlyout && !document.contains(cachedFlyout)) cachedFlyout = null;

  let el = cachedFlyout ?? (document.getElementById(FLYOUT_ROOT_ID) as HTMLElement | null);
  if (!el) {
    el = document.createElement("div");
    el.id = FLYOUT_ROOT_ID;
    document.body.appendChild(el);
  }
  ensureInBody(el);

  // always strictly above overlay root
  el.style.position = "fixed";
  el.style.setProperty("inset", "0");
  el.style.zIndex = String(MAX_Z);
  el.style.pointerEvents = el.style.pointerEvents || "none";
  el.dataset.role ||= "bhq-flyout-root";

  cachedFlyout = el;
  return el;
}

/** RC helper for overlay host pointer-events. */
export function acquireOverlayHost(): () => void {
  const el = getOverlayRoot();
  overlayRefCount += 1;
  el.style.pointerEvents = "auto";
  (window as any).__BHQ_OVERLAY_RC = overlayRefCount;

  return () => {
    overlayRefCount = Math.max(0, overlayRefCount - 1);
    (window as any).__BHQ_OVERLAY_RC = overlayRefCount;
    if (overlayRefCount === 0) getOverlayRoot().style.pointerEvents = "none";
  };
}

/** Optional: auto flip pointer-events based on child count. */
export function autoPointerEvents(el: HTMLElement) {
  const bump = () => { el.style.pointerEvents = el.childElementCount > 0 ? "auto" : "none"; };
  bump();
  const mo = new MutationObserver(bump);
  mo.observe(el, { childList: true });
  return () => mo.disconnect();
}
