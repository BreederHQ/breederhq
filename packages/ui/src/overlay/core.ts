// packages/ui/src/overlay/core.ts
let mounts = 0;
let cached: HTMLElement | null = null;

// Create (if needed) and return a stable #bhq-overlay-root element.
// Works across HMR and doesn't require index.html edits.
export function getOverlayRoot(): HTMLElement {
  // SSR guard: if there's no DOM, give a no-op stub (never actually used client-side)
  if (typeof document === "undefined") {
    // @ts-expect-error - create a tiny stub so type stays HTMLElement-ish
    return { style: {} } as HTMLElement;
  }

  // Reuse a stable node between renders/HMR as long as it's still in the DOM
  if (cached && document.contains(cached)) return cached;

  // Find existing node or create one
  let el = document.getElementById("bhq-overlay-root") as HTMLElement | null;
  if (!el) {
    el = document.createElement("div");
    el.id = "bhq-overlay-root";
    document.body.appendChild(el);
  }

  // Baseline safety styles (idempotent)
  el.style.position = el.style.position || "fixed";
  // @ts-ignore - "inset" not in older TS DOM typings
  el.style.inset = (el.style as any).inset || "0";
  el.style.zIndex = el.style.zIndex || String(2147483647);
  // default block pointer events; enable only while overlays mounted
  el.style.pointerEvents = el.style.pointerEvents || "none";

  cached = el;
  return el;
}

// Reference-count pointer event enabling while any overlay is open.
export function acquireOverlayHost(): () => void {
  const el = getOverlayRoot();
  mounts += 1;

  // Enable interactions while at least one consumer is mounted
  el.style.pointerEvents = "auto";

  return () => {
    mounts = Math.max(0, mounts - 1);
    if (mounts === 0) {
      el.style.pointerEvents = "none";
    }
  };
}
