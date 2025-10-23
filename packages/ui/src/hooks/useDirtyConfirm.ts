// packages/ui/src/hooks/useDirtyConfirm.ts
import * as React from "react";

export function useDirtyConfirm(
  dirty: boolean,
  message = "You have unsaved changes. Discard them?"
) {
  // Call before changing tabs, closing drawers, navigating, etc.
  const confirmAction = React.useCallback(() => {
    if (!dirty) return true;
    return window.confirm(message);
  }, [dirty, message]);

  // Optional: block browser tab close / refresh
  React.useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = message;
      return message;
    };
    if (dirty) window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, message]);

  return { confirm: confirmAction };
}

export default useDirtyConfirm;
