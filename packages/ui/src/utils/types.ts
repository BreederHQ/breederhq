export type SpeciesUI = "Dog" | "Cat" | "Horse";
export type SpeciesAPI = "DOG" | "CAT" | "HORSE";

export type BreedHit = {
  id: string;
  species: SpeciesUI;
  name: string;
  source: "canonical" | "custom";
  canonicalBreedId?: number | null;
};
