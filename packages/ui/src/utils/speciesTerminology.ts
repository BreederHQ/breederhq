/**
 * Species Terminology System (STS)
 *
 * Provides species-aware terminology normalization for UI presentation.
 * Converts generic breeding terms into species-appropriate language.
 *
 * Examples:
 * - DOG: "puppy", "whelping", "litter"
 * - HORSE: "foal", "foaling", "birth record"
 * - RABBIT: "kit", "kindling", "litter"
 * - GOAT: "kid", "kidding"
 *
 * Supports 11 species: DOG, CAT, HORSE, RABBIT, GOAT, SHEEP, PIG, CATTLE, CHICKEN, ALPACA, LLAMA
 */

export type SpeciesCode =
  | "DOG"
  | "CAT"
  | "HORSE"
  | "RABBIT"
  | "GOAT"
  | "SHEEP"
  | "PIG"
  | "CATTLE"
  | "CHICKEN"
  | "ALPACA"
  | "LLAMA";

export interface SpeciesTerminology {
  /** Offspring terminology (e.g., "puppy", "foal", "kit") */
  offspring: {
    singular: string;
    plural: string;
    singularCap: string;
    pluralCap: string;
  };

  /** Birth process terminology (e.g., "whelping", "foaling", "kindling") */
  birth: {
    process: string;
    processCap: string;
    verb: string;
    verbCap: string;
    dateLabel: string;
  };

  /** Group/litter terminology */
  group: {
    singular: string;
    plural: string;
    singularCap: string;
    pluralCap: string;
    inCare: string;
  };

  /** Parent terminology */
  parents: {
    female: string;
    male: string;
    femaleCap: string;
    maleCap: string;
  };

  /** Care stage terminology */
  care: {
    stage: string;
    inCareLabel: string;
  };

  /** Feature flags for conditional UI rendering */
  features: {
    /** Whether this species uses collar identification system */
    useCollars: boolean;
    /** Whether to emphasize count fields (countBorn, countLive, etc.) */
    emphasizeCounts: boolean;
    /** Whether to emphasize "group" concept (litters vs individuals) */
    showGroupConcept: boolean;
    /** Whether this species uses litter-based waitlist system */
    usesLitterWaitlist: boolean;
  };
}

/**
 * Complete terminology mappings for all supported species
 */
const SPECIES_TERMINOLOGY: Record<SpeciesCode, SpeciesTerminology> = {
  DOG: {
    offspring: {
      singular: "puppy",
      plural: "puppies",
      singularCap: "Puppy",
      pluralCap: "Puppies",
    },
    birth: {
      process: "whelping",
      processCap: "Whelping",
      verb: "whelped",
      verbCap: "Whelped",
      dateLabel: "Whelping date",
    },
    group: {
      singular: "litter",
      plural: "litters",
      singularCap: "Litter",
      pluralCap: "Litters",
      inCare: "Litters in Care",
    },
    parents: {
      female: "dam",
      male: "sire",
      femaleCap: "Dam",
      maleCap: "Sire",
    },
    care: {
      stage: "Puppy Care",
      inCareLabel: "In Care",
    },
    features: {
      useCollars: true,
      emphasizeCounts: true,
      showGroupConcept: true,
      usesLitterWaitlist: true,
    },
  },

  CAT: {
    offspring: {
      singular: "kitten",
      plural: "kittens",
      singularCap: "Kitten",
      pluralCap: "Kittens",
    },
    birth: {
      process: "birthing",
      processCap: "Birthing",
      verb: "birthed",
      verbCap: "Birthed",
      dateLabel: "Birth date",
    },
    group: {
      singular: "litter",
      plural: "litters",
      singularCap: "Litter",
      pluralCap: "Litters",
      inCare: "Litters in Care",
    },
    parents: {
      female: "dam",
      male: "sire",
      femaleCap: "Dam",
      maleCap: "Sire",
    },
    care: {
      stage: "Kitten Care",
      inCareLabel: "In Care",
    },
    features: {
      useCollars: true,
      emphasizeCounts: true,
      showGroupConcept: true,
      usesLitterWaitlist: true,
    },
  },

  HORSE: {
    offspring: {
      singular: "foal",
      plural: "foals",
      singularCap: "Foal",
      pluralCap: "Foals",
    },
    birth: {
      process: "foaling",
      processCap: "Foaling",
      verb: "foaled",
      verbCap: "Foaled",
      dateLabel: "Foaling date",
    },
    group: {
      singular: "birth record",
      plural: "birth records",
      singularCap: "Birth Record",
      pluralCap: "Birth Records",
      inCare: "Foals in Care",
    },
    parents: {
      female: "mare",
      male: "stallion",
      femaleCap: "Mare",
      maleCap: "Stallion",
    },
    care: {
      stage: "Foal Care",
      inCareLabel: "In Care",
    },
    features: {
      useCollars: false,
      emphasizeCounts: false,
      showGroupConcept: false,
      usesLitterWaitlist: false,
    },
  },

  RABBIT: {
    offspring: {
      singular: "kit",
      plural: "kits",
      singularCap: "Kit",
      pluralCap: "Kits",
    },
    birth: {
      process: "kindling",
      processCap: "Kindling",
      verb: "kindled",
      verbCap: "Kindled",
      dateLabel: "Kindling date",
    },
    group: {
      singular: "litter",
      plural: "litters",
      singularCap: "Litter",
      pluralCap: "Litters",
      inCare: "Litters in Care",
    },
    parents: {
      female: "doe",
      male: "buck",
      femaleCap: "Doe",
      maleCap: "Buck",
    },
    care: {
      stage: "Kit Care",
      inCareLabel: "In Care",
    },
    features: {
      useCollars: true,
      emphasizeCounts: true,
      showGroupConcept: true,
      usesLitterWaitlist: true,
    },
  },

  GOAT: {
    offspring: {
      singular: "kid",
      plural: "kids",
      singularCap: "Kid",
      pluralCap: "Kids",
    },
    birth: {
      process: "kidding",
      processCap: "Kidding",
      verb: "kidded",
      verbCap: "Kidded",
      dateLabel: "Kidding date",
    },
    group: {
      singular: "kidding",
      plural: "kiddings",
      singularCap: "Kidding",
      pluralCap: "Kiddings",
      inCare: "Kids in Care",
    },
    parents: {
      female: "doe",
      male: "buck",
      femaleCap: "Doe",
      maleCap: "Buck",
    },
    care: {
      stage: "Kid Care",
      inCareLabel: "In Care",
    },
    features: {
      useCollars: true,
      emphasizeCounts: true,
      showGroupConcept: true,
      usesLitterWaitlist: true,
    },
  },

  SHEEP: {
    offspring: {
      singular: "lamb",
      plural: "lambs",
      singularCap: "Lamb",
      pluralCap: "Lambs",
    },
    birth: {
      process: "lambing",
      processCap: "Lambing",
      verb: "lambed",
      verbCap: "Lambed",
      dateLabel: "Lambing date",
    },
    group: {
      singular: "lambing",
      plural: "lambings",
      singularCap: "Lambing",
      pluralCap: "Lambings",
      inCare: "Lambs in Care",
    },
    parents: {
      female: "ewe",
      male: "ram",
      femaleCap: "Ewe",
      maleCap: "Ram",
    },
    care: {
      stage: "Lamb Care",
      inCareLabel: "In Care",
    },
    features: {
      useCollars: true,
      emphasizeCounts: true,
      showGroupConcept: true,
      usesLitterWaitlist: true,
    },
  },

  PIG: {
    offspring: {
      singular: "piglet",
      plural: "piglets",
      singularCap: "Piglet",
      pluralCap: "Piglets",
    },
    birth: {
      process: "farrowing",
      processCap: "Farrowing",
      verb: "farrowed",
      verbCap: "Farrowed",
      dateLabel: "Farrowing date",
    },
    group: {
      singular: "litter",
      plural: "litters",
      singularCap: "Litter",
      pluralCap: "Litters",
      inCare: "Litters in Care",
    },
    parents: {
      female: "sow",
      male: "boar",
      femaleCap: "Sow",
      maleCap: "Boar",
    },
    care: {
      stage: "Piglet Care",
      inCareLabel: "In Care",
    },
    features: {
      useCollars: true,
      emphasizeCounts: true,
      showGroupConcept: true,
      usesLitterWaitlist: true,
    },
  },

  CATTLE: {
    offspring: {
      singular: "calf",
      plural: "calves",
      singularCap: "Calf",
      pluralCap: "Calves",
    },
    birth: {
      process: "calving",
      processCap: "Calving",
      verb: "calved",
      verbCap: "Calved",
      dateLabel: "Calving date",
    },
    group: {
      singular: "birth record",
      plural: "birth records",
      singularCap: "Birth Record",
      pluralCap: "Birth Records",
      inCare: "Calves in Care",
    },
    parents: {
      female: "cow",
      male: "bull",
      femaleCap: "Cow",
      maleCap: "Bull",
    },
    care: {
      stage: "Calf Care",
      inCareLabel: "In Care",
    },
    features: {
      useCollars: false,
      emphasizeCounts: false,
      showGroupConcept: false,
      usesLitterWaitlist: false,
    },
  },

  CHICKEN: {
    offspring: {
      singular: "chick",
      plural: "chicks",
      singularCap: "Chick",
      pluralCap: "Chicks",
    },
    birth: {
      process: "hatching",
      processCap: "Hatching",
      verb: "hatched",
      verbCap: "Hatched",
      dateLabel: "Hatch date",
    },
    group: {
      singular: "clutch",
      plural: "clutches",
      singularCap: "Clutch",
      pluralCap: "Clutches",
      inCare: "Chicks in Care",
    },
    parents: {
      female: "hen",
      male: "rooster",
      femaleCap: "Hen",
      maleCap: "Rooster",
    },
    care: {
      stage: "Chick Care",
      inCareLabel: "In Care",
    },
    features: {
      useCollars: false,
      emphasizeCounts: true,
      showGroupConcept: true,
      usesLitterWaitlist: false,
    },
  },

  ALPACA: {
    offspring: {
      singular: "cria",
      plural: "crias",
      singularCap: "Cria",
      pluralCap: "Crias",
    },
    birth: {
      process: "birthing",
      processCap: "Birthing",
      verb: "birthed",
      verbCap: "Birthed",
      dateLabel: "Birth date",
    },
    group: {
      singular: "birth record",
      plural: "birth records",
      singularCap: "Birth Record",
      pluralCap: "Birth Records",
      inCare: "Crias in Care",
    },
    parents: {
      female: "dam",
      male: "sire",
      femaleCap: "Dam",
      maleCap: "Sire",
    },
    care: {
      stage: "Cria Care",
      inCareLabel: "In Care",
    },
    features: {
      useCollars: false,
      emphasizeCounts: false,
      showGroupConcept: false,
      usesLitterWaitlist: false,
    },
  },

  LLAMA: {
    offspring: {
      singular: "cria",
      plural: "crias",
      singularCap: "Cria",
      pluralCap: "Crias",
    },
    birth: {
      process: "birthing",
      processCap: "Birthing",
      verb: "birthed",
      verbCap: "Birthed",
      dateLabel: "Birth date",
    },
    group: {
      singular: "birth record",
      plural: "birth records",
      singularCap: "Birth Record",
      pluralCap: "Birth Records",
      inCare: "Crias in Care",
    },
    parents: {
      female: "dam",
      male: "sire",
      femaleCap: "Dam",
      maleCap: "Sire",
    },
    care: {
      stage: "Cria Care",
      inCareLabel: "In Care",
    },
    features: {
      useCollars: false,
      emphasizeCounts: false,
      showGroupConcept: false,
      usesLitterWaitlist: false,
    },
  },
};

/**
 * Default terminology (falls back to DOG)
 */
const DEFAULT_TERMINOLOGY = SPECIES_TERMINOLOGY.DOG;

/**
 * Get complete terminology object for a species.
 *
 * @param species - Species code (DOG, CAT, HORSE, etc.) - case insensitive
 * @returns Complete terminology object with offspring, birth, group, parent terms and feature flags
 *
 * @example
 * ```ts
 * const terms = getSpeciesTerminology('HORSE');
 * console.log(terms.offspring.singular); // "foal"
 * console.log(terms.birth.process);      // "foaling"
 * console.log(terms.features.useCollars); // false
 * ```
 */
export function getSpeciesTerminology(species: string | null | undefined): SpeciesTerminology {
  if (!species) return DEFAULT_TERMINOLOGY;

  const normalized = species.toUpperCase().trim() as SpeciesCode;
  return SPECIES_TERMINOLOGY[normalized] || DEFAULT_TERMINOLOGY;
}

/**
 * Get offspring name for a species.
 *
 * @param species - Species code
 * @param plural - Whether to return plural form (default: true)
 * @returns Offspring name ("puppy", "foal", "kit", etc.)
 *
 * @example
 * ```ts
 * getOffspringName('DOG', false);   // "puppy"
 * getOffspringName('DOG', true);    // "puppies"
 * getOffspringName('HORSE', false); // "foal"
 * getOffspringName('HORSE', true);  // "foals"
 * ```
 */
export function getOffspringName(species: string | null | undefined, plural: boolean = true): string {
  const terms = getSpeciesTerminology(species);
  return plural ? terms.offspring.plural : terms.offspring.singular;
}

/**
 * Get capitalized offspring name for a species.
 *
 * @param species - Species code
 * @param plural - Whether to return plural form (default: true)
 * @returns Capitalized offspring name ("Puppy", "Foal", "Kit", etc.)
 */
export function getOffspringNameCap(species: string | null | undefined, plural: boolean = true): string {
  const terms = getSpeciesTerminology(species);
  return plural ? terms.offspring.pluralCap : terms.offspring.singularCap;
}

/**
 * Get birth process terminology for a species.
 *
 * @param species - Species code
 * @param capitalize - Whether to capitalize (default: false)
 * @returns Birth process term ("whelping", "foaling", "kindling", etc.)
 *
 * @example
 * ```ts
 * getBirthProcess('DOG', false);   // "whelping"
 * getBirthProcess('DOG', true);    // "Whelping"
 * getBirthProcess('HORSE', false); // "foaling"
 * ```
 */
export function getBirthProcess(species: string | null | undefined, capitalize: boolean = false): string {
  const terms = getSpeciesTerminology(species);
  return capitalize ? terms.birth.processCap : terms.birth.process;
}

/**
 * Get birth verb (past tense) for a species.
 *
 * @param species - Species code
 * @param capitalize - Whether to capitalize (default: false)
 * @returns Birth verb ("whelped", "foaled", "kindled", etc.)
 *
 * @example
 * ```ts
 * getBirthVerb('DOG', false);   // "whelped"
 * getBirthVerb('HORSE', false); // "foaled"
 * ```
 */
export function getBirthVerb(species: string | null | undefined, capitalize: boolean = false): string {
  const terms = getSpeciesTerminology(species);
  return capitalize ? terms.birth.verbCap : terms.birth.verb;
}

/**
 * Get group/litter terminology for a species.
 *
 * @param species - Species code
 * @param plural - Whether to return plural form (default: true)
 * @param capitalize - Whether to capitalize (default: false)
 * @returns Group term ("litter", "birth record", "clutch", etc.)
 *
 * @example
 * ```ts
 * getGroupName('DOG', true, false);    // "litters"
 * getGroupName('HORSE', false, true);  // "Birth Record"
 * getGroupName('CHICKEN', true, false); // "clutches"
 * ```
 */
export function getGroupName(
  species: string | null | undefined,
  plural: boolean = true,
  capitalize: boolean = false
): string {
  const terms = getSpeciesTerminology(species);
  if (capitalize) {
    return plural ? terms.group.pluralCap : terms.group.singularCap;
  }
  return plural ? terms.group.plural : terms.group.singular;
}

/**
 * Get parent terminology for a species.
 *
 * @param species - Species code
 * @param isFemale - Whether to get female parent term
 * @param capitalize - Whether to capitalize (default: false)
 * @returns Parent term ("dam"/"sire", "mare"/"stallion", etc.)
 *
 * @example
 * ```ts
 * getParentName('DOG', true, false);    // "dam"
 * getParentName('DOG', false, false);   // "sire"
 * getParentName('HORSE', true, true);   // "Mare"
 * getParentName('HORSE', false, true);  // "Stallion"
 * ```
 */
export function getParentName(
  species: string | null | undefined,
  isFemale: boolean,
  capitalize: boolean = false
): string {
  const terms = getSpeciesTerminology(species);
  if (isFemale) {
    return capitalize ? terms.parents.femaleCap : terms.parents.female;
  }
  return capitalize ? terms.parents.maleCap : terms.parents.male;
}

/**
 * Check if species uses collar identification system.
 *
 * @param species - Species code
 * @returns true if species uses collars (dogs, cats, rabbits, goats, sheep, pigs)
 *
 * @example
 * ```ts
 * speciesUsesCollars('DOG');    // true
 * speciesUsesCollars('HORSE');  // false
 * speciesUsesCollars('CATTLE'); // false
 * ```
 */
export function speciesUsesCollars(species: string | null | undefined): boolean {
  const terms = getSpeciesTerminology(species);
  return terms.features.useCollars;
}

/**
 * Check if species emphasizes count fields (countBorn, countLive, etc.).
 *
 * @param species - Species code
 * @returns true if species emphasizes counts (litter species)
 *
 * @example
 * ```ts
 * speciesEmphasizesCounts('DOG');   // true (litter of 6)
 * speciesEmphasizesCounts('HORSE'); // false (usually 1 foal)
 * ```
 */
export function speciesEmphasizesCounts(species: string | null | undefined): boolean {
  const terms = getSpeciesTerminology(species);
  return terms.features.emphasizeCounts;
}

/**
 * Check if species emphasizes group concept (litters vs individuals).
 *
 * @param species - Species code
 * @returns true if species emphasizes group concept (litter species)
 *
 * @example
 * ```ts
 * speciesShowsGroupConcept('DOG');   // true (litter-centric)
 * speciesShowsGroupConcept('HORSE'); // false (individual-centric)
 * ```
 */
export function speciesShowsGroupConcept(species: string | null | undefined): boolean {
  const terms = getSpeciesTerminology(species);
  return terms.features.showGroupConcept;
}

/**
 * Check if species uses litter-based waitlist system.
 *
 * @param species - Species code
 * @returns true if species uses litter waitlist (buyers pick from litter)
 *
 * @example
 * ```ts
 * speciesUsesLitterWaitlist('DOG');   // true (pick from litter)
 * speciesUsesLitterWaitlist('HORSE'); // false (direct purchase)
 * ```
 */
export function speciesUsesLitterWaitlist(species: string | null | undefined): boolean {
  const terms = getSpeciesTerminology(species);
  return terms.features.usesLitterWaitlist;
}
