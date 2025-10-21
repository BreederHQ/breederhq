// packages/ui/src/components/Table/TableToolbar.tsx
import * as React from "react";
import { Button } from "../Button";
import { Input } from "../Input";
import { useTable } from "./TableContext";

export type TableToolbarProps = {
  left?: React.ReactNode;
  right?: React.ReactNode;
  placeholder?: string;
};

export function TableToolbar(props: TableToolbarProps) {
  const ctrl = useTable<any>();

  // Soft-adapt to various controller query APIs:
  // supports { q, setQ, clear } OR { value, set, clear } OR missing entirely.
  const query = (ctrl as any)?.query ?? {};
  const value: string =
    typeof query.q === "string" ? query.q :
    typeof query.value === "string" ? query.value :
    "";
  const setValue: ((v: string) => void) | undefined =
    typeof query.setQ === "function" ? query.setQ :
    typeof query.set === "function" ? query.set :
    undefined;
  const clear: (() => void) =
    typeof query.clear === "function" ? query.clear :
    () => setValue?.("");

  const placeholder = props.placeholder ?? "Search…";

  return (
    <div className="p-4 sm:p-5 bg-surface bg-gradient-to-b from-[hsl(var(--glass))/35] to-[hsl(var(--glass-strong))/55] rounded-t-xl">
      <div className="flex items-center gap-3 justify-between min-w-0">
        <div className="pr-2 flex-none w-full sm:w-[480px] md:w-[560px] lg:w-[640px] max-w-full">
          <div className="relative w-full">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>

            <Input
              value={value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setValue?.(e.currentTarget?.value ?? "")
              }
              placeholder={placeholder}
              aria-label="Search"
              className="pl-9 pr-20 w-full h-10 rounded-full shadow-sm bg-surface border border-hairline focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]"
              disabled={!setValue}
            />

            {!!value && (
              <Button
                type="button"
                aria-label="Clear search"
                onClick={clear}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-grid place-items-center rounded-full text-secondary hover:bg-white/10"
              >
                ×
              </Button>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">{props.right}</div>
      </div>

      {props.left && <div className="mt-3">{props.left}</div>}
    </div>
  );
}

export default TableToolbar;
