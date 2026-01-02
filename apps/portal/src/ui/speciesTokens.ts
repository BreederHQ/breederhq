// apps/portal/src/ui/speciesTokens.ts
// Centralized species token utilities for the portal
// Species awareness via minimal accent styling (left borders, status dots)

/**
 * Supported species types.
 * These map to CSS variables: --portal-species-{lowercase}
 */
export type Species = "Dog" | "Cat" | "Bird" | "Rabbit" | "Horse" | "unknown";

/**
 * Map of species to their CSS variable names.
 */
const speciesVarMap: Record<Species, string> = {
  Dog: "var(--portal-species-dog)",
  Cat: "var(--portal-species-cat)",
  Bird: "var(--portal-species-bird)",
  Rabbit: "var(--portal-species-rabbit)",
  Horse: "var(--portal-species-horse)",
  unknown: "var(--portal-species-unknown)",
};

/**
 * Normalizes species input to a valid Species type.
 * Handles case-insensitivity and null/undefined values.
 *
 * @param input - Raw species string from API or user data
 * @returns Normalized Species value
 *
 * @example
 * normalizeSpecies("dog")     // "Dog"
 * normalizeSpecies("DOG")     // "Dog"
 * normalizeSpecies("Cat")     // "Cat"
 * normalizeSpecies(null)      // "unknown"
 * normalizeSpecies("Hamster") // "unknown"
 */
export function normalizeSpecies(input: string | null | undefined): Species {
  if (!input) return "unknown";

  const normalized = input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();

  if (normalized in speciesVarMap) {
    return normalized as Species;
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
