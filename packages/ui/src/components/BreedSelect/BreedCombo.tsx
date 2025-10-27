import * as React from "react";
import { BreedSelect, BreedHit } from "@bhq/ui";

export type BreedComboProps = {
  orgId?: number | null;
  species: "Dog" | "Cat" | "Horse";
  value: BreedHit | null;
  onChange: (hit: BreedHit | null) => void;
  api?: {
    breeds: {
      listCanonical: (opts: { species: string; orgId?: number; limit?: number }) => Promise<BreedHit[]>;
    };
  };
  limit?: number; // kept for API compatibility, not used here
};

export function BreedCombo({
  orgId,
  species,
  value,
  onChange,
}: BreedComboProps) {
  return (
    <div className="relative flex items-center gap-2">
      <div className="flex-1">
        <BreedSelect
          orgId={orgId ?? undefined}
          species={species}
          value={value}
          onChange={onChange}
          placeholder="Search breed…"
        />
      </div>
    </div>
  );
}

export default BreedCombo;
export type { BreedComboProps };
