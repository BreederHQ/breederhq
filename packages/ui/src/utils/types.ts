export type SpeciesUI = "Dog" | "Cat" | "Horse";
export type SpeciesAPI = "DOG" | "CAT" | "HORSE";

export type BreedHit = {
  id: number | string;        
  name: string;
  species: SpeciesUI;
  source: "canonical" | "custom";
  canonicalBreedId?: number | null;
  registries?: Array<{
    code: string;
    status?: string | null;
    primary?: boolean | null;
  }>;
};
