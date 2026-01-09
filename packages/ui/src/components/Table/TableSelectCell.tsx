// packages/ui/src/components/Table/TableSelectCell.tsx
import React from "react";
import { Input } from "../Input";
import { useIndeterminate } from "../../hooks/useIndeterminate";

type Props = {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  "aria-label"?: string;
  header?: boolean; // renders <th> when true, else <td>
};

export function TableSelectCell({
  checked,
  indeterminate,
  onChange,
  "aria-label": ariaLabel,
  header = false,
}: Props) {
  // useIndeterminate returns an object ref. Wrap it in a callback ref for Input.
  const { ref: objRef, ["aria-checked"]: ariaChecked } = useIndeterminate({
    checked,
    indeterminate: !!indeterminate,
  });

  const setRef = React.useCallback((el: HTMLInputElement | null) => {
    // keep original behavior
    if (objRef && "current" in objRef) {
      (objRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
    }
  }, [objRef]);

  const Comp: any = header ? "th" : "td";

  return (
    <Comp className="px-3 py-2 w-10 text-center" {...(header ? { scope: "col" } : {})}>
      <Input
        ref={setRef}
        type="checkbox"
        aria-label={ariaLabel}
        aria-checked={ariaChecked}
        checked={checked}
        onChange={onChange}
      />
    </Comp>
  );
}
