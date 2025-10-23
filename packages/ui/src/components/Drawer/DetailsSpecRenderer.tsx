/* packages/ui/src/components/Drawer/DetailsSpecRenderer.tsx */ 
import * as React from "react";
import { SectionCard } from "../SectionCard";
import { FieldRow } from "../FieldRow";

export type FieldSpec<T> = {
  label: string;
  view: (row: T) => React.ReactNode;
  edit?: (row: T, setDraft: (patch: Partial<T>) => void) => React.ReactNode;
};

export type SectionSpec<T> = {
  title: string;
  rightSlot?: React.ReactNode;
  fields: Array<FieldSpec<T>>;
};

export function DetailsSpecRenderer<T>({
  row, mode, setDraft, sections,
}: {
  row: T;
  mode: "view" | "edit";
  setDraft: (patch: Partial<T>) => void;
  sections: Array<SectionSpec<T>>;
}) {
  return (
    <>
      {sections.map((s, i) => (
        <SectionCard key={i} title={s.title} rightSlot={s.rightSlot}>
          <div className="space-y-2">
            {s.fields.map((f, j) => (
              <FieldRow key={j} label={f.label}>
                {mode === "view" || !f.edit
                  ? (f.view(row) ?? "—")
                  : f.edit(row, setDraft)}
              </FieldRow>
            ))}
          </div>
        </SectionCard>
      ))}
    </>
  );
}
