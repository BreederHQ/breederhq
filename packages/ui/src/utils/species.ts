// File: packages/ui/src/utils/species.ts

import type { SpeciesUI, SpeciesAPI } from "./types";

export const SPECIES_UI: SpeciesUI[] = ["Dog", "Cat", "Horse", "Goat", "Sheep", "Rabbit"];

export function toApiSpecies(ui: SpeciesUI): SpeciesAPI {
  return ui.toUpperCase() as SpeciesAPI;
}

export function toUiSpecies(api: string): SpeciesUI {
  const up = String(api || "").toUpperCase();
  if (up === "DOG") return "Dog";
  if (up === "CAT") return "Cat";
  if (up === "HORSE") return "Horse";
  if (up === "GOAT") return "Goat";
  if (up === "SHEEP") return "Sheep";
  if (up === "RABBIT") return "Rabbit";
  return "Horse";
}
