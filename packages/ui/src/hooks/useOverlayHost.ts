import { useEffect } from "react";
import { acquireOverlayHost } from "../overlay/core";

export function useOverlayHost(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const release = acquireOverlayHost();
    return () => release();
  }, [active]);
}
