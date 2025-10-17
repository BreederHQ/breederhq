// packages/ui/src/overlay/OverlayMount.tsx
import * as React from "react";
import { getOverlayRoot } from "./core";

/** Ensures the overlay root exists as soon as this mounts. Renders nothing. */
export function OverlayMount() {
  React.useEffect(() => { getOverlayRoot(); }, []);
  return null;
}
