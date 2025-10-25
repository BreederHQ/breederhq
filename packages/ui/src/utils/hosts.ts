// packages/ui/src/overlay/hosts.ts
export function ensureHosts() {
  if (typeof document === "undefined") {
    return { overlay: null as HTMLElement | null, flyout: null as HTMLElement | null };
  }
  let overlay = document.getElementById("bhq-overlay-root") as HTMLElement | null;
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "bhq-overlay-root";
    document.body.appendChild(overlay);
  }
  let flyout = document.getElementById("bhq-flyout-root") as HTMLElement | null;
  if (!flyout) {
    flyout = document.createElement("div");
    flyout.id = "bhq-flyout-root";
    document.body.appendChild(flyout);
  }
  // keep them directly under <body>
  if (overlay.parentElement !== document.body) document.body.appendChild(overlay);
  if (flyout.parentElement !== document.body) document.body.appendChild(flyout);
  return { overlay, flyout };
}

export function getOverlayRoot(): HTMLElement | null {
  return ensureHosts().overlay;
}

export function getFlyoutRoot(): HTMLElement | null {
  return ensureHosts().flyout;
}
