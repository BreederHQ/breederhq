// Tiny helper to reset the current page-id registry at the start of each render.
// Used only inside <Table>.
import * as React from "react";
import type { RowId } from "./TableSelectCtx";

export function usePageIdsRegistry() {
  const setRef = React.useRef<Set<RowId>>(new Set());

  // This is intentionally a ref write during render — it doesn't trigger rerender
  // and guarantees a fresh set every time Table renders.
  setRef.current = new Set<RowId>();

  const registerRowId = React.useCallback((id: RowId) => {
    setRef.current.add(id);
  }, []);

  const unregisterRowId = React.useCallback((id: RowId) => {
    setRef.current.delete(id);
  }, []);

  const pageIds = React.useMemo(() => Array.from(setRef.current), [setRef.current]);

  return { pageIdsRef: setRef, pageIds, registerRowId, unregisterRowId };
}
