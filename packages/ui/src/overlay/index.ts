// Barrel for the overlay module
export { getOverlayRoot, acquireOverlayHost } from "./core";
export { OverlayRoot } from "./OverlayRoot";

// Re-export the hook from the hooks package (see step #2)
export { useOverlayHost } from "../hooks/useOverlayHost";

// Back-compat alias so old code that imports OverlayMount keeps working
export { OverlayRoot as OverlayMount } from "./OverlayRoot";
