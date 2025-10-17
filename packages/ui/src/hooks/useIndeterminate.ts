import { useEffect, useMemo, useRef } from "react";

export function useIndeterminate(opts: {
  checked: boolean;
  indeterminate: boolean;
  ref?: React.RefObject<HTMLInputElement | null>;
}) {
  const internalRef = useRef<HTMLInputElement | null>(null);
  const ref = opts.ref ?? internalRef;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Native property controls the visual “mixed” state
    el.indeterminate = !!opts.indeterminate && !opts.checked;
  }, [ref, opts.checked, opts.indeterminate]);

  const ariaChecked: "true" | "false" | "mixed" = useMemo(
    () => (opts.indeterminate && !opts.checked ? "mixed" : opts.checked ? "true" : "false"),
    [opts.checked, opts.indeterminate]
  );

  // Return props you can spread onto the input
  return { ref, "aria-checked": ariaChecked } as const;
}
