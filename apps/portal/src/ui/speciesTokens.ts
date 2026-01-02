// apps/portal/src/ui/speciesTokens.ts
// Centralized species token utilities for the portal
// Species awareness via minimal accent styling (left borders, status dots)

/**
 * Supported species types.
 * These map to CSS variables: --portal-species-{lowercase}
 */
export type Species = "Dog" | "Cat" | "Horse" | "Sheep" | "Rabbit" | "unknown";

/**
 * Map of species to their CSS variable names.
 */
const speciesVarMap: Record<Species, string> = {
  Dog: "var(--portal-species-dog)",
  Cat: "var(--portal-species-cat)",
  Horse: "var(--portal-species-horse)",
  Sheep: "var(--portal-species-sheep)",
  Rabbit: "var(--portal-species-rabbit)",
  unknown: "var(--portal-species-unknown)",
};

/**
 * Maps common input variants to normalized species values.
 * Handles plurals, case variations, and common aliases.
 */
const speciesAliasMap: Record<string, Species> = {
  // Dog variants
  dog: "Dog",
  dogs: "Dog",
  canine: "Dog",
  // Cat variants
  cat: "Cat",
  cats: "Cat",
  feline: "Cat",
  // Horse variants
  horse: "Horse",
  horses: "Horse",
  equine: "Horse",
  // Sheep variants
  sheep: "Sheep",
  lamb: "Sheep",
  lambs: "Sheep",
  // Rabbit variants
  rabbit: "Rabbit",
  rabbits: "Rabbit",
  bunny: "Rabbit",
  bunnies: "Rabbit",
};

/**
 * Normalizes species input to a valid Species type.
 * Handles case-insensitivity, plurals, and common variants.
 *
 * @param input - Raw species string from API or user data
 * @returns Normalized Species value
 *
 * @example
 * normalizeSpecies("dog")     // "Dog"
 * normalizeSpecies("dogs")    // "Dog"
 * normalizeSpecies("DOG")     // "Dog"
 * normalizeSpecies("Cat")     // "Cat"
 * normalizeSpecies("sheep")   // "Sheep"
 * normalizeSpecies(null)      // "unknown"
 * normalizeSpecies("Hamster") // "unknown"
 */
export function normalizeSpecies(input: string | null | undefined): Species {
  if (!input) return "unknown";

  const lowered = input.toLowerCase().trim();

  // Check alias map first (handles plurals and variants)
  if (lowered in speciesAliasMap) {
    return speciesAliasMap[lowered];
  }

  return "unknown";
}

/**
 * Returns the CSS variable string for a species accent color.
 * Use this for inline styles where you need the species color.
 *
 * @param species - Species string (will be normalized)
 * @returns CSS variable reference like "var(--portal-species-dog)"
 *
 * @example
 * // In a React component:
 * <div style={{ borderLeft: `3px solid ${getSpeciesAccent(species)}` }}>
 */
export function getSpeciesAccent(species: string | null | undefined): string {
  const normalized = normalizeSpecies(species);
  return speciesVarMap[normalized];
}
