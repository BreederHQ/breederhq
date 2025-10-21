import * as React from "react";
import { getOverlayRoot } from "./core";

/**
 * Mount this once near the app root (e.g., NavShell).
 * It ensures the #bhq-overlay-root exists early.
 */
export function OverlayRoot() {
  React.useEffect(() => { getOverlayRoot(); }, []);
  return null;
}
