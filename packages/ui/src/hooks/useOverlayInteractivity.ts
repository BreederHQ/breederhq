// packages/ui/src/hooks/useOverlayInteractivity.ts
import { useEffect } from "react";
import { getOverlayRoot, acquireOverlayHost } from "../overlay";

/**
 * When `enabled` is truthy, makes the overlay host pointer-interactive while mounted.
 * Safe for SSR and resilient to HMR re-creates.
 */
export function useOverlayInteractivity(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    // Narrow the Element to HTMLElement for style access
    const host = getOverlayRoot() as HTMLElement;

    // SSR/defensive: if no real DOM node, do nothing
    if (!host || typeof (host as any).style === "undefined") return;

    // Enable overlay interactions and keep a release handle
    const release = acquireOverlayHost();

    // Preserve previous pointerEvents just in case, then force "auto"
    const prevPointer = host.style.pointerEvents;
    host.style.pointerEvents = "auto";

    return () => {
      // Release RC first (may flip pointer-events if last user)
      release();

      // Re-fetch in case HMR replaced the node
      const root = getOverlayRoot() as HTMLElement;
      if (root && typeof (root as any).style !== "undefined") {
        // If other overlays are still mounted, acquireOverlayHost() logic will keep this "auto"
        // Otherwise we restore/force "none" for click-through
        root.style.pointerEvents = "none";
      }

      // If you prefer to restore exactly what we saw before:
      // host.style.pointerEvents = prevPointer;
    };
  }, [enabled]);
}
