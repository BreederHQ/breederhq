import { useState } from "react";

type Species = "Dog" | "Cat" | "Horse";
type BreedProgram = Record<Species, string[]>;

const defaultProgram: BreedProgram = {
  Dog: ["Labrador Retriever", "Poodle", "German Shepherd", "French Bulldog"],
  Cat: ["Siamese", "British Shorthair", "Maine Coon", "Sphynx"],
  Horse: ["Paint", "Arabian", "Appaloosa", "Thoroughbred"],
};

export function useBreedProgram() {
  const store = (window as any).__breed_program ?? defaultProgram;
  if (!(window as any).__breed_program) (window as any).__breed_program = store;
  const [program, setProgram] = useState<BreedProgram>(store);
  function addBreed(species: Species, breed: string) {
    const cur = program[species] ?? [];
    if (!cur.includes(breed)) {
      const next = { ...program, [species]: [...cur, breed].sort() };
      (window as any).__breed_program = next;
      setProgram(next);
    }
  }
  return { program, addBreed };
}
