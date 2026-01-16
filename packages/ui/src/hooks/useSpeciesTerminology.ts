/**
 * React hook for species-aware terminology
 *
 * Provides species-specific UI terminology with convenience methods.
 * Memoized for performance.
 *
 * @example
 * ```tsx
 * function OffspringCard({ offspringGroup }) {
 *   const terms = useSpeciesTerminology(offspringGroup.species);
 *
 *   return (
 *     <div>
 *       <h3>{terms.group.inCare}</h3>
 *       {terms.features.useCollars && <CollarPicker />}
 *       <p>{terms.birthProcess(true)} date: {group.birthDate}</p>
 *       <p>{terms.offspringNameCap()} available: {group.countAvailable}</p>
 *     </div>
 *   );
 * }
 * ```
 */

import { useMemo } from "react";
import { getSpeciesTerminology, type SpeciesTerminology } from "../utils/speciesTerminology";

export interface UseSpeciesTerminologyReturn extends SpeciesTerminology {
  /**
   * Get offspring name (singular/plural)
   * @param plural - Whether to return plural form (default: true)
   * @returns "puppy"/"puppies", "foal"/"foals", etc.
   */
  offspringName: (plural?: boolean) => string;

  /**
   * Get capitalized offspring name (singular/plural)
   * @param plural - Whether to return plural form (default: true)
   * @returns "Puppy"/"Puppies", "Foal"/"Foals", etc.
   */
  offspringNameCap: (plural?: boolean) => string;

  /**
   * Get birth process terminology
   * @param capitalize - Whether to capitalize (default: false)
   * @returns "whelping"/"Whelping", "foaling"/"Foaling", etc.
   */
  birthProcess: (capitalize?: boolean) => string;

  /**
   * Get birth verb (past tense)
   * @param capitalize - Whether to capitalize (default: false)
   * @returns "whelped"/"Whelped", "foaled"/"Foaled", etc.
   */
  birthVerb: (capitalize?: boolean) => string;

  /**
   * Get group/litter terminology
   * @param plural - Whether to return plural form (default: true)
   * @param capitalize - Whether to capitalize (default: false)
   * @returns "litter"/"litters", "birth record"/"birth records", etc.
   */
  groupName: (plural?: boolean, capitalize?: boolean) => string;

  /**
   * Get parent terminology
   * @param isFemale - Whether to get female parent term
   * @param capitalize - Whether to capitalize (default: false)
   * @returns "dam"/"sire", "mare"/"stallion", etc.
   */
  parentName: (isFemale: boolean, capitalize?: boolean) => string;
}

/**
 * Hook to get species-specific terminology for UI display.
 *
 * @param species - Species code (DOG, CAT, HORSE, etc.) - case insensitive
 * @returns Terminology object with convenience methods
 *
 * @example
 * ```tsx
 * function BreedingPlanCard({ plan }) {
 *   const terms = useSpeciesTerminology(plan.species);
 *
 *   return (
 *     <div>
 *       <h2>{terms.parentName(true, true)}: {plan.dam?.name}</h2>
 *       <h2>{terms.parentName(false, true)}: {plan.sire?.name}</h2>
 *       <p>Expected {terms.birthProcess()}: {plan.expectedBirthDate}</p>
 *       {terms.features.useCollars && (
 *         <CollarSettings />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSpeciesTerminology(species: string | null | undefined): UseSpeciesTerminologyReturn {
  return useMemo(() => {
    const terms = getSpeciesTerminology(species);

    return {
      ...terms,

      // Convenience methods
      offspringName: (plural = true) => (plural ? terms.offspring.plural : terms.offspring.singular),

      offspringNameCap: (plural = true) => (plural ? terms.offspring.pluralCap : terms.offspring.singularCap),

      birthProcess: (capitalize = false) => (capitalize ? terms.birth.processCap : terms.birth.process),

      birthVerb: (capitalize = false) => (capitalize ? terms.birth.verbCap : terms.birth.verb),

      groupName: (plural = true, capitalize = false) => {
        if (capitalize) {
          return plural ? terms.group.pluralCap : terms.group.singularCap;
        }
        return plural ? terms.group.plural : terms.group.singular;
      },

      parentName: (isFemale: boolean, capitalize = false) => {
        if (isFemale) {
          return capitalize ? terms.parents.femaleCap : terms.parents.female;
        }
        return capitalize ? terms.parents.maleCap : terms.parents.male;
      },
    };
  }, [species]);
}
