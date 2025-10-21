// packages/ui/src/components/Filters/FiltersPanel.tsx
import * as React from "react";
import { Input, Button } from "../";
import { cn } from "../../utils/cn";

export type FilterKind = "text" | "select";
export type FilterOption = { label: string; value: string };

export type FilterField = {
  key: string;
  label: string;
  kind: FilterKind;
  placeholder?: string;
  options?: FilterOption[]; // for select
  colSpan?: 1 | 2 | 3; // grid width
};

type Props = {
  open: boolean;
  schema: FilterField[];
  value: Record<string, string | undefined>;
  onChange: (next: Record<string, string | undefined>) => void;
  onClear?: () => void;
  className?: string;
};

export function FiltersPanel({ open, schema, value, onChange, onClear, className }: Props) {
  if (!open) return null;

  const set = (k: string, v: string) => onChange({ ...value, [k]: v || undefined });

  return (
    <div className={cn("px-2 pb-2", className)}>
      <div className="rounded-lg border border-hairline p-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {schema.map((f) => {
            const col = f.colSpan ?? 1;
            const cls = col === 3 ? "lg:col-span-3" : col === 2 ? "lg:col-span-2" : "";
            return (
              <div key={f.key} className={cls}>
                <div className="text-xs mb-1 opacity-70">{f.label}</div>
                {f.kind === "select" ? (
                  <select
                    value={value[f.key] ?? ""}
                    onChange={(e) => set(f.key, e.target.value)}
                    className="w-full h-9 rounded-md border border-hairline bg-surface px-2 text-sm"
                  >
                    <option value="">{f.placeholder || "Any"}</option>
                    {(f.options || []).map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={value[f.key] ?? ""}
                    onChange={(e) => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                  />
                )}
              </div>
            );
          })}
          <div className="lg:col-span-3 flex justify-end">
            <Button variant="ghost" size="sm" onClick={onClear} className="text-secondary">Clear</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FiltersPanel;
