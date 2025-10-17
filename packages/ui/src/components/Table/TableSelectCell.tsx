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
  const { ref, ariaChecked } = useIndeterminate({ checked, indeterminate: !!indeterminate });
  const Comp: any = header ? "th" : "td";

  return (
    <Comp className="px-3 py-2 w-10 text-center" {...(header ? { scope: "col" } : {})}>
      <Input
        ref={ref}
        type="checkbox"
        aria-label={ariaLabel}
        aria-checked={ariaChecked}
        checked={checked}
        onChange={onChange}
      />
    </Comp>
  );
}
