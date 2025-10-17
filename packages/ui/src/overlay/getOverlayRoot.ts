// packages/ui/src/overlay/getOverlayRoot.ts
let mounts = 0;

export function getOverlayRoot(): HTMLElement {
  let el = document.getElementById("bhq-overlay-root") as HTMLElement | null;
  if (!el) {
    el = document.createElement("div");
    el.id = "bhq-overlay-root";
    el.style.position = "fixed";
    (el.style as any).inset = "0";
    el.style.zIndex = String(2147483647);
    el.style.pointerEvents = "none";   // inert by default
    el.style.isolation = "isolate";
    document.body.appendChild(el);
  }
  return el;
}

/** Low-level primitive: enables pointer events while acquired. */
export function acquireOverlayHost(): () => void {
  const el = getOverlayRoot();
  mounts += 1;
  el.style.pointerEvents = "auto";
  el.style.zIndex = String(2147483647);

  return () => {
    mounts = Math.max(0, mounts - 1);
    if (mounts === 0) el.style.pointerEvents = "none";
  };
}
