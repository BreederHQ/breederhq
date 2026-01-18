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

  /** Reproductive cycle terminology for anchor mode */
  cycle: {
    /** Cycle start label (e.g., "heat start" for dogs, "cycle start" for horses, "breeding" for cats) */
    startLabel: string;
    startLabelCap: string;
    /** What to call the anchor date in UI */
    anchorDateLabel: string;
    /** Explanation text for this species' cycle characteristics */
    cycleExplanation: string;
    /** Species-specific guidance for cycle start observation */
    cycleStartHelp: string;
    /** Breeding date label (may differ from cycle anchor) */
    breedingDateLabel: string;
  };

  /** Ovulation terminology and confirmation methods */
  ovulation: {
    /** Label for ovulation (usually "ovulation" for all species) */
    label: string;
    /** Date field label */
    dateLabel: string;
    /** Standard confirmation method for this species */
    confirmationMethod: string;
    /** Educational guidance about ovulation for this species */
    guidanceText: string;
    /** Available confirmation methods for this species */
    confirmationMethods: string[];
    /** When to start testing (species-specific) */
    testingGuidance: string;
  };

  /** Anchor mode recommendations and metadata */
  anchorMode: {
    /** Available anchor options for this species */
    options: Array<{
      type: "CYCLE_START" | "OVULATION" | "BREEDING_DATE";
      label: string;
      description: string;
      accuracy: string;
      recommended: boolean;
      testingAvailable: boolean;
      confirmationMethods?: string[];
    }>;
    /** Recommended primary anchor for this species */
    recommended: "CYCLE_START" | "OVULATION" | "BREEDING_DATE";
    /** Default anchor for new plans */
    defaultAnchor: "CYCLE_START" | "OVULATION" | "BREEDING_DATE";
    /** Whether ovulation testing is commonly available */
    testingAvailable: boolean;
    /** Whether testing is standard practice (available vs common) */
    testingCommon: boolean;
    /** Can users upgrade from one anchor to another? */
    supportsUpgrade: boolean;
    /** Upgrade source anchor (if applicable) */
    upgradeFrom?: "CYCLE_START";
    /** Upgrade target anchor (if applicable) */
    upgradeTo?: "OVULATION";
    /** Is this an induced ovulator? (affects UI messaging) */
    isInducedOvulator: boolean;
    /** Help text shown when breeder chooses anchor mode */
    guidanceText: string;
  };

  /** Weaning importance metadata */
  weaning: {
    /** Is weaning a distinct event or gradual process? */
    weaningType: "DISTINCT_EVENT" | "GRADUAL_PROCESS";
    /** Should weaning date be required for this species? */
    required: boolean;
    /** Typical weaning age in weeks */
    estimatedDurationWeeks: number;
    /** Veterinary guidance about weaning */
    guidanceText: string;
    /** Status label for weaning milestone */
    statusLabel: string;
    /** Actual date field label */
    actualDateLabel: string;
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
    cycle: {
      startLabel: "heat start",
      startLabelCap: "Heat Start",
      anchorDateLabel: "Heat start date",
      cycleExplanation:
        "First day of visible bleeding (proestrus). Note: 50% of bitches have minimal bleeding initially.",
      cycleStartHelp:
        "Record the first day you observe heat signs (swelling, discharge, behavioral changes)",
      breedingDateLabel: "Breeding Date(s)",
    },
    ovulation: {
      label: "ovulation",
      dateLabel: "Ovulation date",
      confirmationMethod: "progesterone blood test",
      guidanceText:
        "Ovulation occurs 12±2 days after heat start. Progesterone testing provides ±1 day accuracy. Testing should begin day 5-6 after heat signs appear.",
      confirmationMethods: ["Progesterone Test", "LH Test", "Vaginal Cytology"],
      testingGuidance:
        "Start progesterone testing on day 5-6 after heat signs appear. Test every 2-3 days until levels reach 5.0-6.0 ng/mL.",
    },
    anchorMode: {
      options: [
        {
          type: "CYCLE_START",
          label: "Heat Start Date",
          description: "Best for: Getting started quickly",
          accuracy: "±2-3 days",
          recommended: false,
          testingAvailable: false,
        },
        {
          type: "OVULATION",
          label: "Ovulation Date",
          description: "Best for: Maximum accuracy (recommended)",
          accuracy: "±1 day",
          recommended: true,
          testingAvailable: true,
          confirmationMethods: ["Progesterone Test", "LH Test", "Vaginal Cytology"],
        },
      ],
      recommended: "OVULATION",
      defaultAnchor: "CYCLE_START",
      testingAvailable: true,
      testingCommon: false,
      supportsUpgrade: true,
      upgradeFrom: "CYCLE_START",
      upgradeTo: "OVULATION",
      isInducedOvulator: false,
      guidanceText:
        "For best accuracy, use progesterone testing to confirm ovulation. Birth is 63 days from ovulation (±1 day) vs 75 days from heat start (±2-3 days).",
    },
    weaning: {
      weaningType: "GRADUAL_PROCESS",
      required: false,
      estimatedDurationWeeks: 8,
      guidanceText:
        "Weaning is a gradual 3-4 week process (weeks 3-8). Puppies benefit from staying with mother 10-12 weeks for behavioral development. Recording weaning date is optional.",
      statusLabel: "Weaned",
      actualDateLabel: "Weaning Completed",
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
    cycle: {
      startLabel: "breeding",
      startLabelCap: "Breeding",
      anchorDateLabel: "Breeding date",
      cycleExplanation:
        "Cats are induced ovulators - they ovulate when bred. There is no traditional heat cycle anchor.",
      cycleStartHelp:
        "Cats are induced ovulators - breeding triggers ovulation within 24-48 hours",
      breedingDateLabel: "Breeding Date",
    },
    ovulation: {
      label: "ovulation",
      dateLabel: "Ovulation Date (Auto-calculated)",
      confirmationMethod: "occurs automatically when bred",
      guidanceText:
        "Cats ovulate within 24 hours of breeding. Breeding date IS the ovulation anchor. Birth occurs 63±2 days later.",
      confirmationMethods: [],
      testingGuidance: "No testing needed - breeding itself triggers ovulation",
    },
    anchorMode: {
      options: [
        {
          type: "BREEDING_DATE",
          label: "Breeding Date",
          description: "Standard for cats (induced ovulators)",
          accuracy: "±2-3 days",
          recommended: true,
          testingAvailable: false,
        },
      ],
      recommended: "BREEDING_DATE",
      defaultAnchor: "BREEDING_DATE",
      testingAvailable: false,
      testingCommon: false,
      supportsUpgrade: false,
      isInducedOvulator: true,
      guidanceText:
        "Cats ovulate when bred. Enter breeding date as the anchor - this is when ovulation occurs.",
    },
    weaning: {
      weaningType: "GRADUAL_PROCESS",
      required: false,
      estimatedDurationWeeks: 8,
      guidanceText:
        "Kittens wean gradually over 4-8 weeks. Recording weaning date is optional.",
      statusLabel: "Weaned",
      actualDateLabel: "Weaning Completed (Optional)",
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
    cycle: {
      startLabel: "cycle start",
      startLabelCap: "Cycle Start",
      anchorDateLabel: "Cycle start date",
      cycleExplanation: "First day of estrus behavior. Mares have 21-day cycles on average.",
      cycleStartHelp: "Record the first day of estrus/heat",
      breedingDateLabel: "Breeding Date",
    },
    ovulation: {
      label: "ovulation",
      dateLabel: "Ovulation date",
      confirmationMethod: "veterinary ultrasound",
      guidanceText:
        "Ovulation occurs 5±2 days after cycle start (highly variable). Ultrasound confirmation is standard practice for horse breeders. Foaling is 340±10 days from ovulation.",
      confirmationMethods: ["Ultrasound", "Palpation"],
      testingGuidance:
        "Veterinary ultrasound monitoring typically requires 3-5 exams during heat to confirm ovulation.",
    },
    anchorMode: {
      options: [
        {
          type: "CYCLE_START",
          label: "Cycle Start Date",
          description: "Best for: Natural cover breeding",
          accuracy: "±5-7 days",
          recommended: false,
          testingAvailable: false,
        },
        {
          type: "OVULATION",
          label: "Ovulation Date",
          description: "Best for: AI breeding, maximum accuracy",
          accuracy: "±3 days",
          recommended: true,
          testingAvailable: true,
          confirmationMethods: ["Ultrasound", "Palpation"],
        },
      ],
      recommended: "OVULATION",
      defaultAnchor: "CYCLE_START",
      testingAvailable: true,
      testingCommon: true,
      supportsUpgrade: true,
      upgradeFrom: "CYCLE_START",
      upgradeTo: "OVULATION",
      isInducedOvulator: false,
      guidanceText:
        "Most horse breeders use ultrasound to confirm ovulation. This is the veterinary standard for accurate foaling date prediction.",
    },
    weaning: {
      weaningType: "DISTINCT_EVENT",
      required: true,
      estimatedDurationWeeks: 20,
      guidanceText:
        "Weaning is a critical milestone for horses (4-6 months). Veterinarians recommend documenting weaning date for health monitoring (ulcers, stress, nutrition).",
      statusLabel: "Weaned",
      actualDateLabel: "Weaning Date",
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
    cycle: {
      startLabel: "breeding",
      startLabelCap: "Breeding",
      anchorDateLabel: "Breeding date",
      cycleExplanation:
        "Rabbits are induced ovulators - they ovulate immediately when bred. There is no traditional heat cycle.",
      cycleStartHelp:
        "Rabbits are induced ovulators - breeding triggers ovulation immediately (0-day offset)",
      breedingDateLabel: "Breeding Date",
    },
    ovulation: {
      label: "ovulation",
      dateLabel: "Ovulation Date (Auto-calculated)",
      confirmationMethod: "occurs automatically when bred",
      guidanceText:
        "Rabbits ovulate immediately when bred (0-day offset). Breeding date IS the ovulation anchor. Kindling occurs 31 days later.",
      confirmationMethods: [],
      testingGuidance: "No testing needed - breeding itself triggers ovulation",
    },
    anchorMode: {
      options: [
        {
          type: "BREEDING_DATE",
          label: "Breeding Date",
          description: "Standard for rabbits (induced ovulators)",
          accuracy: "±1 day",
          recommended: true,
          testingAvailable: false,
        },
      ],
      recommended: "BREEDING_DATE",
      defaultAnchor: "BREEDING_DATE",
      testingAvailable: false,
      testingCommon: false,
      supportsUpgrade: false,
      isInducedOvulator: true,
      guidanceText:
        "Rabbits ovulate when bred. Enter breeding date as the anchor - this is when ovulation occurs.",
    },
    weaning: {
      weaningType: "GRADUAL_PROCESS",
      required: false,
      estimatedDurationWeeks: 6,
      guidanceText:
        "Kits wean gradually over 4-6 weeks. Recording weaning date is optional.",
      statusLabel: "Weaned",
      actualDateLabel: "Weaning Completed (Optional)",
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
    cycle: {
      startLabel: "cycle start",
      startLabelCap: "Cycle Start",
      anchorDateLabel: "Cycle start date",
      cycleExplanation:
        "First day of heat signs. Does have 21-day cycles on average during breeding season.",
      cycleStartHelp: "Record when heat signs are first observed",
      breedingDateLabel: "Breeding Date(s)",
    },
    ovulation: {
      label: "ovulation",
      dateLabel: "Ovulation date",
      confirmationMethod: "not commonly used",
      guidanceText:
        "Ovulation occurs ~2 days after cycle start. Hormone testing infrastructure is rarely available for goats. Kidding is 150 days from ovulation.",
      confirmationMethods: [],
      testingGuidance: "Ovulation testing not commonly used for goats",
    },
    anchorMode: {
      options: [
        {
          type: "CYCLE_START",
          label: "Cycle Start Date",
          description: "Standard for goats",
          accuracy: "±3-5 days",
          recommended: true,
          testingAvailable: false,
        },
      ],
      recommended: "CYCLE_START",
      defaultAnchor: "CYCLE_START",
      testingAvailable: false,
      testingCommon: false,
      supportsUpgrade: false,
      isInducedOvulator: false,
      guidanceText:
        "Cycle start is the standard anchor for goats. Ovulation testing is not commonly available.",
    },
    weaning: {
      weaningType: "GRADUAL_PROCESS",
      required: false,
      estimatedDurationWeeks: 8,
      guidanceText:
        "Kids wean gradually over 6-8 weeks. Recording weaning date is optional.",
      statusLabel: "Weaned",
      actualDateLabel: "Weaning Date (Optional)",
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
    cycle: {
      startLabel: "cycle start",
      startLabelCap: "Cycle Start",
      anchorDateLabel: "Cycle start date",
      cycleExplanation:
        "First day of heat signs. Ewes are seasonal breeders with 17-day cycles during breeding season (fall/winter).",
      cycleStartHelp: "Record when heat signs are first observed",
      breedingDateLabel: "Breeding Date(s)",
    },
    ovulation: {
      label: "ovulation",
      dateLabel: "Ovulation date",
      confirmationMethod: "not commonly used",
      guidanceText:
        "Ovulation occurs ~2 days after cycle start. Hormone testing infrastructure is rarely available for sheep. Lambing is 147 days from ovulation.",
      confirmationMethods: [],
      testingGuidance: "Ovulation testing not commonly used for sheep",
    },
    anchorMode: {
      options: [
        {
          type: "CYCLE_START",
          label: "Cycle Start Date",
          description: "Standard for sheep",
          accuracy: "±3-5 days",
          recommended: true,
          testingAvailable: false,
        },
      ],
      recommended: "CYCLE_START",
      defaultAnchor: "CYCLE_START",
      testingAvailable: false,
      testingCommon: false,
      supportsUpgrade: false,
      isInducedOvulator: false,
      guidanceText:
        "Cycle start is the standard anchor for sheep. Ovulation testing is not commonly available. Note: Sheep are seasonal breeders (fall/winter).",
    },
    weaning: {
      weaningType: "GRADUAL_PROCESS",
      required: false,
      estimatedDurationWeeks: 8,
      guidanceText:
        "Lambs wean gradually over 6-8 weeks. Recording weaning date is optional.",
      statusLabel: "Weaned",
      actualDateLabel: "Weaning Date (Optional)",
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
    cycle: {
      startLabel: "cycle start",
      startLabelCap: "Cycle Start",
      anchorDateLabel: "Cycle start date",
      cycleExplanation:
        "First day of standing heat. Sows have 21-day cycles on average.",
      cycleStartHelp: "Record when standing heat is first observed",
      breedingDateLabel: "Breeding Date(s)",
    },
    ovulation: {
      label: "ovulation",
      dateLabel: "Ovulation date",
      confirmationMethod: "not commonly used",
      guidanceText:
        "Ovulation occurs ~2 days after cycle start. Farrowing is 114 days from breeding.",
      confirmationMethods: [],
      testingGuidance: "Ovulation testing not commonly used for pigs",
    },
    anchorMode: {
      options: [
        {
          type: "CYCLE_START",
          label: "Cycle Start Date",
          description: "Standard for pigs",
          accuracy: "±3-5 days",
          recommended: true,
          testingAvailable: false,
        },
      ],
      recommended: "CYCLE_START",
      defaultAnchor: "CYCLE_START",
      testingAvailable: false,
      testingCommon: false,
      supportsUpgrade: false,
      isInducedOvulator: false,
      guidanceText:
        "Cycle start is the standard anchor for pigs. Ovulation testing is not commonly available.",
    },
    weaning: {
      weaningType: "GRADUAL_PROCESS",
      required: false,
      estimatedDurationWeeks: 4,
      guidanceText:
        "Piglets are typically weaned at 3-4 weeks. Recording weaning date is optional.",
      statusLabel: "Weaned",
      actualDateLabel: "Weaning Date (Optional)",
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
    cycle: {
      startLabel: "cycle start",
      startLabelCap: "Cycle Start",
      anchorDateLabel: "Cycle start date",
      cycleExplanation:
        "First day of standing heat. Cows have 21-day cycles on average.",
      cycleStartHelp: "Record when standing heat is first observed",
      breedingDateLabel: "Breeding Date",
    },
    ovulation: {
      label: "ovulation",
      dateLabel: "Ovulation date",
      confirmationMethod: "not commonly used",
      guidanceText:
        "Ovulation occurs near the end of standing heat. Calving is 283 days from breeding.",
      confirmationMethods: [],
      testingGuidance: "Ovulation testing not commonly used for cattle",
    },
    anchorMode: {
      options: [
        {
          type: "CYCLE_START",
          label: "Cycle Start Date",
          description: "Standard for cattle",
          accuracy: "±3-5 days",
          recommended: true,
          testingAvailable: false,
        },
      ],
      recommended: "CYCLE_START",
      defaultAnchor: "CYCLE_START",
      testingAvailable: false,
      testingCommon: false,
      supportsUpgrade: false,
      isInducedOvulator: false,
      guidanceText:
        "Cycle start is the standard anchor for cattle. Ovulation testing is not commonly available.",
    },
    weaning: {
      weaningType: "DISTINCT_EVENT",
      required: false,
      estimatedDurationWeeks: 26,
      guidanceText:
        "Calves are typically weaned at 6-8 months. Recording weaning date is optional.",
      statusLabel: "Weaned",
      actualDateLabel: "Weaning Date (Optional)",
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
    cycle: {
      startLabel: "set date",
      startLabelCap: "Set Date",
      anchorDateLabel: "Set date",
      cycleExplanation:
        "Date eggs were set for incubation. Hatching occurs 21 days after setting.",
      cycleStartHelp: "Record the date eggs were set for incubation",
      breedingDateLabel: "Set Date",
    },
    ovulation: {
      label: "ovulation",
      dateLabel: "N/A",
      confirmationMethod: "not applicable",
      guidanceText:
        "Chickens are egg layers - ovulation concept does not apply. Track set date (incubation start) for hatching predictions.",
      confirmationMethods: [],
      testingGuidance: "Not applicable for chickens",
    },
    anchorMode: {
      options: [
        {
          type: "CYCLE_START",
          label: "Set Date",
          description: "Standard for chickens (incubation start)",
          accuracy: "±1 day",
          recommended: true,
          testingAvailable: false,
        },
      ],
      recommended: "CYCLE_START",
      defaultAnchor: "CYCLE_START",
      testingAvailable: false,
      testingCommon: false,
      supportsUpgrade: false,
      isInducedOvulator: false,
      guidanceText:
        "Set date (incubation start) is the anchor for chickens. Hatching is 21 days from set date.",
    },
    weaning: {
      weaningType: "GRADUAL_PROCESS",
      required: false,
      estimatedDurationWeeks: 6,
      guidanceText:
        "Chicks are typically independent at 6-8 weeks. Recording is optional.",
      statusLabel: "Independent",
      actualDateLabel: "Independence Date (Optional)",
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
    cycle: {
      startLabel: "breeding",
      startLabelCap: "Breeding",
      anchorDateLabel: "Breeding date",
      cycleExplanation:
        "Alpacas are induced ovulators - they ovulate when bred. There is no traditional heat cycle.",
      cycleStartHelp:
        "Alpacas are induced ovulators - breeding triggers ovulation within 24-48 hours",
      breedingDateLabel: "Breeding Date",
    },
    ovulation: {
      label: "ovulation",
      dateLabel: "Ovulation Date (Auto-calculated)",
      confirmationMethod: "occurs automatically when bred",
      guidanceText:
        "Alpacas ovulate within 24-48 hours of breeding. Breeding date IS the ovulation anchor. Birth occurs ~335-345 days later.",
      confirmationMethods: [],
      testingGuidance: "No testing needed - breeding itself triggers ovulation",
    },
    anchorMode: {
      options: [
        {
          type: "BREEDING_DATE",
          label: "Breeding Date",
          description: "Standard for alpacas (induced ovulators)",
          accuracy: "±3-5 days",
          recommended: true,
          testingAvailable: false,
        },
      ],
      recommended: "BREEDING_DATE",
      defaultAnchor: "BREEDING_DATE",
      testingAvailable: false,
      testingCommon: false,
      supportsUpgrade: false,
      isInducedOvulator: true,
      guidanceText:
        "Alpacas ovulate when bred. Enter breeding date as the anchor - this is when ovulation occurs.",
    },
    weaning: {
      weaningType: "DISTINCT_EVENT",
      required: false,
      estimatedDurationWeeks: 26,
      guidanceText:
        "Crias are typically weaned at 5-6 months. Recording weaning date is optional.",
      statusLabel: "Weaned",
      actualDateLabel: "Weaning Date (Optional)",
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
    cycle: {
      startLabel: "breeding",
      startLabelCap: "Breeding",
      anchorDateLabel: "Breeding date",
      cycleExplanation:
        "Llamas are induced ovulators - they ovulate when bred. There is no traditional heat cycle.",
      cycleStartHelp:
        "Llamas are induced ovulators - breeding triggers ovulation within 24-48 hours",
      breedingDateLabel: "Breeding Date",
    },
    ovulation: {
      label: "ovulation",
      dateLabel: "Ovulation Date (Auto-calculated)",
      confirmationMethod: "occurs automatically when bred",
      guidanceText:
        "Llamas ovulate within 24-48 hours of breeding. Breeding date IS the ovulation anchor. Birth occurs ~350 days later.",
      confirmationMethods: [],
      testingGuidance: "No testing needed - breeding itself triggers ovulation",
    },
    anchorMode: {
      options: [
        {
          type: "BREEDING_DATE",
          label: "Breeding Date",
          description: "Standard for llamas (induced ovulators)",
          accuracy: "±3-5 days",
          recommended: true,
          testingAvailable: false,
        },
      ],
      recommended: "BREEDING_DATE",
      defaultAnchor: "BREEDING_DATE",
      testingAvailable: false,
      testingCommon: false,
      supportsUpgrade: false,
      isInducedOvulator: true,
      guidanceText:
        "Llamas ovulate when bred. Enter breeding date as the anchor - this is when ovulation occurs.",
    },
    weaning: {
      weaningType: "DISTINCT_EVENT",
      required: false,
      estimatedDurationWeeks: 26,
      guidanceText:
        "Crias are typically weaned at 5-6 months. Recording weaning date is optional.",
      statusLabel: "Weaned",
      actualDateLabel: "Weaning Date (Optional)",
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

// ============================================================================
// Anchor Mode Helper Functions
// ============================================================================

/**
 * Get cycle start label for a species.
 *
 * @param species - Species code
 * @param capitalize - Whether to capitalize (default: false)
 * @returns Cycle start label ("heat start" for dogs, "cycle start" for horses, "breeding" for cats)
 *
 * @example
 * ```ts
 * getCycleLabel('DOG', false);   // "heat start"
 * getCycleLabel('DOG', true);    // "Heat Start"
 * getCycleLabel('CAT', false);   // "breeding"
 * ```
 */
export function getCycleLabel(species: string | null | undefined, capitalize: boolean = false): string {
  const terms = getSpeciesTerminology(species);
  return capitalize ? terms.cycle.startLabelCap : terms.cycle.startLabel;
}

/**
 * Get ovulation guidance text for a species.
 *
 * @param species - Species code
 * @returns Educational guidance about ovulation for this species
 *
 * @example
 * ```ts
 * getOvulationGuidance('DOG');
 * // "Ovulation occurs 12±2 days after heat start..."
 * ```
 */
export function getOvulationGuidance(species: string | null | undefined): string {
  const terms = getSpeciesTerminology(species);
  return terms.ovulation.guidanceText;
}

/**
 * Get recommended anchor mode for a species.
 *
 * @param species - Species code
 * @returns Recommended anchor mode for this species
 *
 * @example
 * ```ts
 * getRecommendedAnchorMode('DOG');    // "OVULATION"
 * getRecommendedAnchorMode('HORSE');  // "OVULATION"
 * getRecommendedAnchorMode('CAT');    // "BREEDING_DATE"
 * getRecommendedAnchorMode('GOAT');   // "CYCLE_START"
 * ```
 */
export function getRecommendedAnchorMode(
  species: string | null | undefined
): "CYCLE_START" | "OVULATION" | "BREEDING_DATE" {
  const terms = getSpeciesTerminology(species);
  return terms.anchorMode.recommended;
}

/**
 * Get default anchor mode for a species (used for new plans).
 *
 * @param species - Species code
 * @returns Default anchor mode for new plans of this species
 *
 * @example
 * ```ts
 * getDefaultAnchorMode('DOG');   // "CYCLE_START" (start with cycle, upgrade to ovulation later)
 * getDefaultAnchorMode('CAT');   // "BREEDING_DATE"
 * ```
 */
export function getDefaultAnchorMode(
  species: string | null | undefined
): "CYCLE_START" | "OVULATION" | "BREEDING_DATE" {
  const terms = getSpeciesTerminology(species);
  return terms.anchorMode.defaultAnchor;
}

/**
 * Check if weaning date is required for a species.
 *
 * @param species - Species code
 * @returns true if weaning is a required milestone for this species (horses)
 *
 * @example
 * ```ts
 * isWeaningRequired('HORSE');  // true (critical milestone)
 * isWeaningRequired('DOG');    // false (gradual process)
 * ```
 */
export function isWeaningRequired(species: string | null | undefined): boolean {
  const terms = getSpeciesTerminology(species);
  return terms.weaning.required;
}

/**
 * Get weaning guidance text for a species.
 *
 * @param species - Species code
 * @returns Veterinary guidance about weaning for this species
 *
 * @example
 * ```ts
 * getWeaningGuidance('DOG');
 * // "Weaning is a gradual 3-4 week process..."
 * ```
 */
export function getWeaningGuidance(species: string | null | undefined): string {
  const terms = getSpeciesTerminology(species);
  return terms.weaning.guidanceText;
}

/**
 * Get available anchor options for a species.
 *
 * @param species - Species code
 * @returns Array of available anchor options with labels, descriptions, and accuracy
 *
 * @example
 * ```ts
 * getAvailableAnchors('DOG');
 * // [{ type: 'CYCLE_START', label: 'Heat Start Date', ... }, { type: 'OVULATION', ... }]
 * getAvailableAnchors('CAT');
 * // [{ type: 'BREEDING_DATE', label: 'Breeding Date', ... }]
 * ```
 */
export function getAvailableAnchors(species: string | null | undefined): SpeciesTerminology["anchorMode"]["options"] {
  const terms = getSpeciesTerminology(species);
  return terms.anchorMode.options;
}

/**
 * Check if a species supports upgrading from cycle start to ovulation anchor.
 *
 * @param species - Species code
 * @returns true if species can upgrade anchor mode (dogs, horses)
 *
 * @example
 * ```ts
 * supportsOvulationUpgrade('DOG');    // true
 * supportsOvulationUpgrade('HORSE');  // true
 * supportsOvulationUpgrade('CAT');    // false (induced ovulator)
 * supportsOvulationUpgrade('GOAT');   // false (no testing infrastructure)
 * ```
 */
export function supportsOvulationUpgrade(species: string | null | undefined): boolean {
  const terms = getSpeciesTerminology(species);
  return terms.anchorMode.supportsUpgrade;
}

/**
 * Check if a species is an induced ovulator (ovulates when bred).
 *
 * @param species - Species code
 * @returns true if species is an induced ovulator (cats, rabbits, alpacas, llamas)
 *
 * @example
 * ```ts
 * isInducedOvulator('CAT');    // true
 * isInducedOvulator('RABBIT'); // true
 * isInducedOvulator('DOG');    // false
 * isInducedOvulator('HORSE');  // false
 * ```
 */
export function isInducedOvulator(species: string | null | undefined): boolean {
  const terms = getSpeciesTerminology(species);
  return terms.anchorMode.isInducedOvulator;
}

/**
 * Get anchor mode guidance text for a species.
 *
 * @param species - Species code
 * @returns Help text shown when breeder chooses anchor mode
 *
 * @example
 * ```ts
 * getAnchorModeGuidance('DOG');
 * // "For best accuracy, use progesterone testing..."
 * ```
 */
export function getAnchorModeGuidance(species: string | null | undefined): string {
  const terms = getSpeciesTerminology(species);
  return terms.anchorMode.guidanceText;
}

/**
 * Check if ovulation testing is available for a species.
 *
 * @param species - Species code
 * @returns true if ovulation testing infrastructure exists for this species
 *
 * @example
 * ```ts
 * isOvulationTestingAvailable('DOG');   // true (progesterone)
 * isOvulationTestingAvailable('HORSE'); // true (ultrasound)
 * isOvulationTestingAvailable('GOAT');  // false
 * ```
 */
export function isOvulationTestingAvailable(species: string | null | undefined): boolean {
  const terms = getSpeciesTerminology(species);
  return terms.anchorMode.testingAvailable;
}

/**
 * Check if ovulation testing is commonly used for a species.
 *
 * @param species - Species code
 * @returns true if testing is standard veterinary practice for this species
 *
 * @example
 * ```ts
 * isOvulationTestingCommon('DOG');   // false (available but not all hobbyists use it)
 * isOvulationTestingCommon('HORSE'); // true (standard practice)
 * ```
 */
export function isOvulationTestingCommon(species: string | null | undefined): boolean {
  const terms = getSpeciesTerminology(species);
  return terms.anchorMode.testingCommon;
}

/**
 * Get ovulation confirmation methods for a species.
 *
 * @param species - Species code
 * @returns Array of available confirmation methods
 *
 * @example
 * ```ts
 * getOvulationConfirmationMethods('DOG');   // ['Progesterone Test', 'LH Test', 'Vaginal Cytology']
 * getOvulationConfirmationMethods('HORSE'); // ['Ultrasound', 'Palpation']
 * getOvulationConfirmationMethods('CAT');   // [] (induced ovulator)
 * ```
 */
export function getOvulationConfirmationMethods(species: string | null | undefined): string[] {
  const terms = getSpeciesTerminology(species);
  return terms.ovulation.confirmationMethods;
}

/**
 * Get ovulation testing guidance for a species.
 *
 * @param species - Species code
 * @returns When to start testing and testing protocol
 *
 * @example
 * ```ts
 * getOvulationTestingGuidance('DOG');
 * // "Start progesterone testing on day 5-6 after heat signs appear..."
 * ```
 */
export function getOvulationTestingGuidance(species: string | null | undefined): string {
  const terms = getSpeciesTerminology(species);
  return terms.ovulation.testingGuidance;
}

/**
 * Get cycle explanation for a species.
 *
 * @param species - Species code
 * @returns Explanation of how cycles work for this species
 *
 * @example
 * ```ts
 * getCycleExplanation('DOG');
 * // "First day of visible bleeding (proestrus). Note: 50% of bitches have minimal bleeding initially."
 * getCycleExplanation('CAT');
 * // "Cats are induced ovulators - they ovulate when bred. There is no traditional heat cycle anchor."
 * ```
 */
export function getCycleExplanation(species: string | null | undefined): string {
  const terms = getSpeciesTerminology(species);
  return terms.cycle.cycleExplanation;
}

/**
 * Get breeding date label for a species.
 *
 * @param species - Species code
 * @returns Label for breeding date field
 *
 * @example
 * ```ts
 * getBreedingDateLabel('DOG');   // "Breeding Date(s)"
 * getBreedingDateLabel('HORSE'); // "Breeding Date"
 * ```
 */
export function getBreedingDateLabel(species: string | null | undefined): string {
  const terms = getSpeciesTerminology(species);
  return terms.cycle.breedingDateLabel;
}

/**
 * Get anchor date label for a species.
 *
 * @param species - Species code
 * @returns Label for the anchor date field
 *
 * @example
 * ```ts
 * getAnchorDateLabel('DOG');   // "Heat start date"
 * getAnchorDateLabel('HORSE'); // "Cycle start date"
 * getAnchorDateLabel('CAT');   // "Breeding date"
 * ```
 */
export function getAnchorDateLabel(species: string | null | undefined): string {
  const terms = getSpeciesTerminology(species);
  return terms.cycle.anchorDateLabel;
}

/**
 * Get weaning type for a species.
 *
 * @param species - Species code
 * @returns Whether weaning is a distinct event or gradual process
 *
 * @example
 * ```ts
 * getWeaningType('HORSE'); // "DISTINCT_EVENT"
 * getWeaningType('DOG');   // "GRADUAL_PROCESS"
 * ```
 */
export function getWeaningType(
  species: string | null | undefined
): "DISTINCT_EVENT" | "GRADUAL_PROCESS" {
  const terms = getSpeciesTerminology(species);
  return terms.weaning.weaningType;
}

/**
 * Get estimated weaning duration in weeks for a species.
 *
 * @param species - Species code
 * @returns Typical weaning age in weeks
 *
 * @example
 * ```ts
 * getEstimatedWeaningWeeks('DOG');   // 8
 * getEstimatedWeaningWeeks('HORSE'); // 20 (4-6 months)
 * ```
 */
export function getEstimatedWeaningWeeks(species: string | null | undefined): number {
  const terms = getSpeciesTerminology(species);
  return terms.weaning.estimatedDurationWeeks;
}

// ============================================================================
// Placement Phase Helper Functions
// ============================================================================

/**
 * Check if species should show PLACEMENT_STARTED as a separate phase.
 *
 * Litter species (dogs, cats, rabbits, etc.) have staggered placements over time,
 * so they need both PLACEMENT_STARTED and PLACEMENT_COMPLETED phases.
 *
 * Individual-offspring species (horses, cattle, alpacas, llamas) typically have
 * a single placement event, so they use a combined PLACEMENT phase.
 *
 * This is determined by the `showGroupConcept` feature flag - species that
 * emphasize the "litter" concept need the two-phase placement workflow.
 *
 * @param species - Species code
 * @returns true if species should show PLACEMENT_STARTED phase (litter species)
 *
 * @example
 * ```ts
 * speciesShowsPlacementStartPhase('DOG');   // true (litter - staggered placement)
 * speciesShowsPlacementStartPhase('CAT');   // true (litter - staggered placement)
 * speciesShowsPlacementStartPhase('HORSE'); // false (single foal - combined placement)
 * speciesShowsPlacementStartPhase('CATTLE'); // false (single calf - combined placement)
 * ```
 */
export function speciesShowsPlacementStartPhase(species: string | null | undefined): boolean {
  return speciesShowsGroupConcept(species);
}
