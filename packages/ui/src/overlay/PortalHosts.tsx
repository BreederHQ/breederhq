// packages/ui/src/overlay/PortalHosts.tsx
import * as React from "react";
import { getOverlayRoot, getFlyoutRoot } from "./core";

export function PortalHosts() {
  React.useEffect(() => { getOverlayRoot(); getFlyoutRoot(); }, []);
  return null;
}
