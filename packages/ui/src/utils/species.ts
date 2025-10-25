import type { SpeciesUI, SpeciesAPI } from "./types";

export const SPECIES_UI: SpeciesUI[] = ["Dog", "Cat", "Horse"];

export function toApiSpecies(ui: SpeciesUI): SpeciesAPI {
  return ui.toUpperCase() as SpeciesAPI;
}

export function toUiSpecies(api: string): SpeciesUI {
  const up = String(api || "").toUpperCase();
  if (up === "DOG") return "Dog";
  if (up === "CAT") return "Cat";
  return "Horse";
}
