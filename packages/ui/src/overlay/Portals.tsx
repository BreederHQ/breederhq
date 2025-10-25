// packages/ui/src/overlay/Portals.tsx
import * as React from "react";
import { createPortal } from "react-dom";
import { ensureHosts } from "./hosts";

export function OverlayPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  const { overlay } = ensureHosts();
  return overlay ? createPortal(children, overlay) : null;
}

export function FlyoutPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  const { flyout } = ensureHosts();
  return flyout ? createPortal(children, flyout) : null;
}
