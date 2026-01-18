export type ISODate = string; // "YYYY-MM-DD" date-only everywhere in engine

export type SpeciesCode = "DOG" | "CAT" | "HORSE" | "GOAT" | "RABBIT" | "SHEEP" | (string & {});

export type ReproOutcome = "UNKNOWN" | "PREGNANT" | "BIRTHED" | "FAILED" | "ABORTED";

// ────────────────────────────────────────────────────────────────────────────
// Anchor Mode System Types (Ovulation Anchor Breeding System)
// ────────────────────────────────────────────────────────────────────────────

/** User-selected primary anchor mode for a breeding plan */
export type ReproAnchorMode = "CYCLE_START" | "OVULATION" | "BREEDING_DATE";

/** Anchor type used for timeline calculations */
export type AnchorType = "CYCLE_START" | "OVULATION" | "BREEDING_DATE" | "BIRTH" | "LOCKED_CYCLE";

/** How the ovulation date was determined */
export type OvulationMethod =
  | "CALCULATED"
  | "PROGESTERONE_TEST"
  | "LH_TEST"
  | "ULTRASOUND"
  | "VAGINAL_CYTOLOGY"
  | "PALPATION"
  | "AT_HOME_TEST"
  | "VETERINARY_EXAM"
  | "BREEDING_INDUCED";

/** Confidence level for date accuracy */
export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

/** How a date was determined (observed vs calculated) */
export type DataSource = "OBSERVED" | "DERIVED" | "ESTIMATED";

/** Anchor configuration for timeline building */
export type AnchorConfig = {
  mode: ReproAnchorMode;
  date: ISODate;
  method?: OvulationMethod;
  confidence?: ConfidenceLevel;
};

export type ReproSummary = {
  animalId: string;
  species: SpeciesCode;
  dob?: ISODate | null;
  lastBirthIso?: string | null;

  // Canonical cycle history. Sorted asc, date-only.
  cycleStartsAsc: ISODate[];

  // Plan outcomes, for postpartum gating.
  lastBredAt?: ISODate | null;
  lastBirthedAt?: ISODate | null; // species neutral birth date
  lastOutcome?: ReproOutcome | null;

  // Animal-level override for cycle length (female only)
  femaleCycleLenOverrideDays?: number | null;

  // Deterministic "today", passed in by caller.
  today: ISODate;
};

export type CycleLenInputs = {
  species: SpeciesCode;
  cycleStartsAsc: ISODate[];
  femaleCycleLenOverrideDays?: number | null; // Animal-level override
};

export type EffectiveCycleLenResult = {
  effectiveCycleLenDays: number;
  gapsUsedDays: number[];        // last 3 gaps used
  weighting: { observed: number; biology: number };
  source: "OVERRIDE" | "HISTORY" | "BIOLOGY"; // Precedence winner
  warningConflict?: boolean;     // True if override differs >20% from history
};

export type ProjectUpcomingCyclesOpts = {
  horizonMonths: number;         // 18 default, caller controlled
  maxCount?: number;             // optional cap
};

export type ProjectedCycleStart = {
  date: ISODate;
  source: "POSTPARTUM" | "HISTORY" | "BIOLOGY" | "JUVENILE";
  explain: string;
};

export type ReproTimeline = {
  projectedCycleStarts: ProjectedCycleStart[];
  effectiveCycleLen?: EffectiveCycleLenResult;

  // Optional. Filled when a seed is provided (locked cycle start or what-if selection).
  seedCycleStart?: ISODate | null;
  seedOvulationDate?: ISODate | null; // NEW: Primary anchor for ovulation-based timeline
  milestones?: Record<string, ISODate | null>;
  windows?: Partial<Record<string, { full: [ISODate, ISODate]; likely: [ISODate, ISODate] }>>;

  explain: {
    species: SpeciesCode;
    seedType?: "POSTPARTUM" | "HISTORY" | "BIOLOGY" | "JUVENILE" | "ACTUAL_BIRTH" | "OVULATION_CONFIRMED";
    anchorDate?: ISODate;
    anchorMode?: ReproAnchorMode;
    derivedCycleStart?: ISODate; // When ovulation is primary, cycle start is derived
    confidence?: ConfidenceLevel;
  };
};
