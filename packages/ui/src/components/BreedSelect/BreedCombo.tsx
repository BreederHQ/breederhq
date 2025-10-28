import * as React from "react";
import type { BreedHit } from "../../utils";
import { BreedSelect } from "../../index";

type SpeciesApi = "DOG" | "CAT" | "HORSE";
type SpeciesUI = "Dog" | "Cat" | "Horse";

function toUiSpecies(s: SpeciesApi | SpeciesUI): SpeciesUI {
  const up = String(s).toUpperCase();
  return up === "CAT" ? "Cat" : up === "HORSE" ? "Horse" : up === "DOG" ? "Dog" : (s as SpeciesUI);
}

export type BreedComboProps = {
  orgId?: number | null;
  /** Accept either API form or UI form */
  species: SpeciesApi | SpeciesUI;
  value: BreedHit | null;
  onChange: (hit: BreedHit | null) => void;
  api?: {
    breeds: {
      listCanonical: (opts: { species: string; orgId?: number; limit?: number }) => Promise<BreedHit[]>;
    };
  };
  /** kept for API compatibility, not used here */
  limit?: number;
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
          species={toUiSpecies(species)}
          value={value}
          onChange={onChange}
          placeholder="Search breed…"
        />
      </div>
    </div>
  );
}

export default BreedCombo;
