export type BreedingProgramProfile = {
  kennelName: string;
  registryPrefixes: string[];
  website?: string | null;
  socials?: { platform: string; handle: string }[];

  species: Array<"DOG" | "CAT" | "HORSE">;
  sellRegions: string[];
  shippingAllowed: boolean;
  travelPolicy: "none" | "limited" | "case_by_case";

  cyclePolicy: {
    minDamAgeMonths: number;
    minDamWeightLbs?: number | null;
    minHeatsBetween: number; // in cycles
    maxLittersLifetime: number;
    retireAfterAgeMonths?: number | null;
    lockApproverRole: "admin" | "manager" | "any";
  };

  methods: {
    allowed: Array<"natural" | "ai_fresh" | "ai_chilled" | "ai_frozen" | "surgical">;
    preferredBySpecies: Partial<Record<"DOG" | "CAT" | "HORSE", "natural" | "ai_fresh" | "ai_chilled" | "ai_frozen" | "surgical">>;
    externalStudDocsRequired: string[]; // e.g. ["brucellosis", "dna", "health_panel"]
  };

  hormoneTesting: {
    progesteroneInHouse: boolean;
    progesteroneLab: boolean;
    lhTesting: boolean;
    ovulationNgMlTarget?: number | null;
    decisionOwnerRole: "admin" | "manager" | "vet_only";
  };

  pregnancyChecks: {
    ultrasoundDayFromOvulation: number; // e.g. 28
    relaxinUsed: boolean;
    xrayDayFromOvulation: number; // e.g. 55
  };

  birth: {
    expectedDaysFromOvulation: number; // usually 63
    interveneIfNoPupHours: number;
    emergencyVetName?: string | null;
    emergencyVetPhone?: string | null;
  };

  puppyCare: {
    dewclawPolicy: "keep" | "remove" | "breed_specific";
    tailPolicy: "keep" | "dock" | "breed_specific";
    dewormScheduleDays: number[]; // e.g. [14,28,42]
    firstVaccineDay: number; // from birth
    microchipAtWeeks: number;
    registrationAuthority?: string | null; // AKC, TICA, etc.
  };

  placement: {
    earliestDaysFromBirth: number;
    standardDaysFromBirth: number;
    extendedHoldPolicy: "not_offered" | "offered_fee" | "offered_free";
    contractTemplateId?: string | null;
    healthGuaranteeMonths: number;
    depositRequired: boolean;
    depositAmountUSD?: number | null;
    requireDepositBeforeApproval?: boolean; // Block waitlist approval until deposit is paid
    paymentMethods: Array<"cash" | "zelle" | "ach" | "card" | "paypal" | "other">;
    waitlistPolicy: "first_ready" | "priority_order" | "breeder_choice";
  };

  healthTesting: {
    requiredByBreed: Record<string, string[]>; // breed -> list of test codes
    acceptedLabs: string[]; // e.g. ["Embark","OFA","PennHIP"]
    recheckMonths: number; // cadence
  };

  docsAndData: {
    readyToBreedChecklist: string[]; // keys of docs required before status advance
    marketingMediaPolicy: "private" | "buyers_only" | "public";
    showClientNames: boolean;
  };

  comms: {
    prospectDuringPregnancyCadenceDays: number;
    postBirthUpdateCadenceDays: number;
    channels: Array<"email" | "sms" | "whatsapp" | "portal">;
    sendAutoMilestones: boolean;
  };

  availabilityDefaults: {
    showGanttBands: boolean;
    showCalendarBands: boolean;
    horizonMonths: number;
  };
};
