// packages/api/src/types/vaccinations.ts
// Vaccination tracking types for date-based vaccination management

export type VaccinationStatus = "current" | "due_soon" | "expired" | "not_recorded";

/**
 * Defines a vaccination protocol (template)
 * These are the standard vaccinations for each species
 */
export type VaccinationProtocol = {
  /** Unique key for this protocol, e.g., "rabies", "dhpp", "fvrcp" */
  key: string;
  /** Human-readable name, e.g., "Rabies", "DHPP (5-in-1)" */
  name: string;
  /** Species this vaccination applies to */
  species: ("DOG" | "CAT" | "HORSE" | "GOAT" | "SHEEP" | "PIG" | "RABBIT")[];
  /** Standard interval between doses in months */
  intervalMonths: number;
  /** Whether this is a core (required) vaccination */
  isCore: boolean;
  /** Description of what the vaccine protects against */
  description?: string;
  /** Alternative names for this vaccination */
  aliases?: string[];
};

/**
 * A specific vaccination record for an animal
 */
export type VaccinationRecord = {
  id: number;
  animalId: number;
  /** The protocol key this record is for */
  protocolKey: string;
  /** When the vaccination was administered (ISO date) */
  administeredAt: string;
  /** When this vaccination expires (calculated or overridden) */
  expiresAt: string;
  /** Name of veterinarian who administered */
  veterinarian?: string;
  /** Clinic/hospital name */
  clinic?: string;
  /** Vaccine batch/lot number for traceability */
  batchLotNumber?: string;
  /** Linked document ID (certificate, receipt, etc.) */
  documentId?: number;
  /** Additional notes */
  notes?: string;
  /** Computed status based on dates */
  status: VaccinationStatus;
  /** Days remaining until expiration (negative if expired) */
  daysRemaining: number;
  /** Created timestamp */
  createdAt: string;
  /** Last updated timestamp */
  updatedAt: string;
};

/**
 * Input for creating a new vaccination record
 */
export type CreateVaccinationInput = {
  protocolKey: string;
  administeredAt: string;
  /** Optional override for expiration date (otherwise calculated from protocol interval) */
  expiresAt?: string;
  veterinarian?: string;
  clinic?: string;
  batchLotNumber?: string;
  notes?: string;
};

/**
 * Input for updating an existing vaccination record
 */
export type UpdateVaccinationInput = Partial<CreateVaccinationInput> & {
  documentId?: number | null;
};

/**
 * Summary of vaccination status for an animal
 */
export type VaccinationSummary = {
  totalProtocols: number;
  current: number;
  dueSoon: number;
  expired: number;
  notRecorded: number;
  /** Next vaccination due (if any) */
  nextDue?: {
    protocolKey: string;
    protocolName: string;
    daysRemaining: number;
    expiresAt: string;
  };
};

// ─────────────────────────────────────────────────────────────
// Standard Vaccination Protocols by Species
// ─────────────────────────────────────────────────────────────

export const DOG_VACCINATION_PROTOCOLS: VaccinationProtocol[] = [
  // Core vaccines
  {
    key: "rabies",
    name: "Rabies",
    species: ["DOG"],
    intervalMonths: 36, // 3-year vaccine (can be 1-year for first dose)
    isCore: true,
    description: "Protects against rabies virus. Required by law in most jurisdictions.",
    aliases: ["rabies-1yr", "rabies-3yr"],
  },
  {
    key: "dhpp",
    name: "DHPP (5-in-1)",
    species: ["DOG"],
    intervalMonths: 12,
    isCore: true,
    description: "Distemper, Hepatitis (Adenovirus), Parainfluenza, Parvovirus",
    aliases: ["DA2PP", "DAPP", "DHLPP", "5-in-1", "distemper-parvo"],
  },
  {
    key: "bordetella",
    name: "Bordetella",
    species: ["DOG"],
    intervalMonths: 12,
    isCore: true,
    description: "Kennel cough prevention. Often required for boarding, daycare, and grooming.",
    aliases: ["kennel-cough"],
  },
  // Non-core vaccines
  {
    key: "leptospirosis",
    name: "Leptospirosis",
    species: ["DOG"],
    intervalMonths: 12,
    isCore: false,
    description: "Bacterial infection transmitted through water/wildlife. Recommended in endemic areas.",
    aliases: ["lepto"],
  },
  {
    key: "lyme",
    name: "Lyme Disease",
    species: ["DOG"],
    intervalMonths: 12,
    isCore: false,
    description: "Tick-borne disease. Recommended in areas with high tick populations.",
  },
  {
    key: "canine-influenza",
    name: "Canine Influenza",
    species: ["DOG"],
    intervalMonths: 12,
    isCore: false,
    description: "Dog flu (H3N2/H3N8). Recommended for dogs in contact with many other dogs.",
    aliases: ["dog-flu", "CIV"],
  },
  {
    key: "rattlesnake",
    name: "Rattlesnake Vaccine",
    species: ["DOG"],
    intervalMonths: 12,
    isCore: false,
    description: "Reduces severity of rattlesnake bites. For dogs in rattlesnake-prone areas.",
  },
];

export const CAT_VACCINATION_PROTOCOLS: VaccinationProtocol[] = [
  // Core vaccines
  {
    key: "rabies",
    name: "Rabies",
    species: ["CAT"],
    intervalMonths: 36,
    isCore: true,
    description: "Protects against rabies virus. Required by law in most jurisdictions.",
  },
  {
    key: "fvrcp",
    name: "FVRCP (3-in-1)",
    species: ["CAT"],
    intervalMonths: 36, // After initial series, can be every 3 years
    isCore: true,
    description: "Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia (feline distemper)",
    aliases: ["FVRCP-C", "feline-distemper", "3-in-1"],
  },
  // Non-core vaccines
  {
    key: "felv",
    name: "FeLV (Feline Leukemia)",
    species: ["CAT"],
    intervalMonths: 12,
    isCore: false,
    description: "Feline Leukemia Virus. Recommended for cats that go outdoors or live with FeLV+ cats.",
  },
  {
    key: "fiv",
    name: "FIV",
    species: ["CAT"],
    intervalMonths: 12,
    isCore: false,
    description: "Feline Immunodeficiency Virus. For high-risk cats.",
  },
  {
    key: "chlamydia",
    name: "Chlamydia",
    species: ["CAT"],
    intervalMonths: 12,
    isCore: false,
    description: "Chlamydophila felis. For multi-cat environments with history of infection.",
  },
];

export const HORSE_VACCINATION_PROTOCOLS: VaccinationProtocol[] = [
  {
    key: "rabies",
    name: "Rabies",
    species: ["HORSE"],
    intervalMonths: 12,
    isCore: true,
    description: "Protects against rabies virus.",
  },
  {
    key: "tetanus",
    name: "Tetanus",
    species: ["HORSE"],
    intervalMonths: 12,
    isCore: true,
    description: "Tetanus toxoid. Essential for horses due to wound susceptibility.",
  },
  {
    key: "ewt",
    name: "Eastern/Western Encephalomyelitis",
    species: ["HORSE"],
    intervalMonths: 12,
    isCore: true,
    description: "EEE and WEE - mosquito-borne viral diseases.",
    aliases: ["sleeping-sickness", "EEE", "WEE"],
  },
  {
    key: "west-nile",
    name: "West Nile Virus",
    species: ["HORSE"],
    intervalMonths: 12,
    isCore: true,
    description: "Mosquito-borne virus affecting the nervous system.",
  },
  {
    key: "flu-rhino",
    name: "Influenza/Rhinopneumonitis",
    species: ["HORSE"],
    intervalMonths: 6, // May need more frequent for show horses
    isCore: false,
    description: "Equine influenza and EHV-1/4 (rhinopneumonitis).",
    aliases: ["EIV", "EHV"],
  },
  {
    key: "strangles",
    name: "Strangles",
    species: ["HORSE"],
    intervalMonths: 12,
    isCore: false,
    description: "Streptococcus equi. For horses at risk of exposure.",
  },
];

export const GOAT_VACCINATION_PROTOCOLS: VaccinationProtocol[] = [
  {
    key: "cdt",
    name: "CDT",
    species: ["GOAT", "SHEEP"],
    intervalMonths: 12,
    isCore: true,
    description: "Clostridium perfringens types C & D, and Tetanus. Essential for all goats.",
  },
  {
    key: "rabies",
    name: "Rabies",
    species: ["GOAT"],
    intervalMonths: 12,
    isCore: false,
    description: "Recommended in areas with rabies prevalence.",
  },
  {
    key: "caseous-lymphadenitis",
    name: "CL (Caseous Lymphadenitis)",
    species: ["GOAT", "SHEEP"],
    intervalMonths: 12,
    isCore: false,
    description: "Abscess-causing bacteria. For herds with CL history.",
    aliases: ["CL"],
  },
];

/**
 * Get vaccination protocols for a species
 */
export function getProtocolsForSpecies(species: string): VaccinationProtocol[] {
  const s = species.toUpperCase();
  switch (s) {
    case "DOG":
      return DOG_VACCINATION_PROTOCOLS;
    case "CAT":
      return CAT_VACCINATION_PROTOCOLS;
    case "HORSE":
      return HORSE_VACCINATION_PROTOCOLS;
    case "GOAT":
    case "SHEEP":
      return GOAT_VACCINATION_PROTOCOLS;
    default:
      return [];
  }
}

/**
 * Get a specific protocol by key
 */
export function getProtocolByKey(key: string, species: string): VaccinationProtocol | undefined {
  const protocols = getProtocolsForSpecies(species);
  return protocols.find((p) => p.key === key || p.aliases?.includes(key));
}
