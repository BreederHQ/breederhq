import * as React from "react";

export type FilterSchemaItem =
  | { key: string; label: string; editor?: "text" | "select" | "date" | "checklist" }
  | { key: string; label: string; editor: "dateRange"; fromKey: string; toKey: string };

export type FilterRowProps = {
  filters: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  schema: FilterSchemaItem[];
  registry?: Partial<Record<string, React.FC<any>>>;
};

export function FilterRow({ filters, onChange, schema, registry = {} }: FilterRowProps) {
  const Text = registry["text"] ?? ((p: any) => <input className="h-10 w-full rounded-full bg-surface border border-hairline px-3" {...p} />);
  const DateI = registry["date"] ?? Text;
  const Select = registry["select"] ?? ((p: any) => <input className="h-10 w-full rounded-full bg-surface border border-hairline px-3" {...p} />);
  const Checklist = registry["checklist"] ?? (() => <div className="text-secondary text-sm">Checklist editor not provided</div>);

  return (
    <div className="bhq-section-fixed mt-2 rounded-xl border border-hairline bg-surface-strong/70 p-3 sm:p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {schema.map((f) => {
          if ((f as any).editor === "dateRange") {
            const r = f as any;
            return (
              <div key={r.key} className="space-y-1.5">
                <div className="text-xs text-secondary">{r.label}</div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <DateI value={filters[r.fromKey] ?? ""} onChange={(e: any) => onChange({ ...filters, [r.fromKey]: e?.target?.value ?? e })} placeholder="mm/dd/yyyy" />
                  <span className="text-secondary text-xs whitespace-nowrap">to</span>
                  <DateI value={filters[r.toKey] ?? ""} onChange={(e: any) => onChange({ ...filters, [r.toKey]: e?.target?.value ?? e })} placeholder="mm/dd/yyyy" />
                </div>
              </div>
            );
          }
          const editor = (f as any).editor ?? "text";
          const Cmp = editor === "text" ? Text : editor === "date" ? DateI : editor === "select" ? Select : Checklist;
          return (
            <div key={f.key} className="space-y-1.5">
              <div className="text-xs text-secondary">{f.label}</div>
              <Cmp value={filters[f.key] ?? ""} onChange={(e: any) => onChange({ ...filters, [f.key]: e?.target?.value ?? e })} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
