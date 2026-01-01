export type ISODate = string; // "YYYY-MM-DD" date-only everywhere in engine

export type SpeciesCode = "DOG" | "CAT" | "HORSE" | "GOAT" | "RABBIT" | (string & {});

export type ReproOutcome = "UNKNOWN" | "PREGNANT" | "BIRTHED" | "FAILED" | "ABORTED";

export type ReproSummary = {
  animalId: string;
  species: SpeciesCode;
  dob?: ISODate | null;
  lastBirthIso?: string | null;

  // Canonical cycle history. Sorted asc, date-only.
  cycleStartsAsc: ISODate[];

  // Plan outcomes, for postpartum gating.
  lastBredAt?: ISODate | null;
  lastBirthedAt?: ISODate | null; // species neutral, maps to whelping/foaling/kitting
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
  milestones?: Record<string, ISODate | null>;
  windows?: Record<string, { full: [ISODate, ISODate]; likely: [ISODate, ISODate] }>;

  explain: {
    species: SpeciesCode;
    seedType?: "POSTPARTUM" | "HISTORY" | "BIOLOGY" | "JUVENILE";
  };
};
