// packages/api/src/types/genetics.ts
// Types for genetic markers registry and animal genetic results

/**
 * Category of genetic marker
 */
export type GeneticMarkerCategory =
  | "coat_color"
  | "coat_type"
  | "health"
  | "physical_traits"
  | "eye_color"
  | "other";

/**
 * How the marker result is entered/displayed
 */
export type GeneticMarkerInputType =
  | "allele_pair"    // Two alleles: E/e, N/N, etc.
  | "status"         // Clear, Carrier, Affected, At Risk
  | "genotype"       // Single value like "ky/ky"
  | "percentage"     // Numeric percentage
  | "text";          // Free text

/**
 * Species supported for genetic testing
 */
export type GeneticSpecies = "DOG" | "CAT" | "HORSE" | "OTHER";

/**
 * Master registry of all known genetic markers
 * This is the source of truth for what markers exist
 */
export interface GeneticMarker {
  id: number;
  species: GeneticSpecies;
  category: GeneticMarkerCategory;

  // Identifiers - all searchable
  code: string;              // Short code: "DM", "A", "EFS"
  commonName: string;        // "Degenerative Myelopathy", "Agouti"
  scientificName?: string;   // Scientific/gene name if different
  gene?: string;             // Gene name: "SOD1", "ASIP"
  aliases?: string[];        // Other names this goes by

  // Description
  description: string;       // Plain English explanation

  // Filtering
  breedSpecific?: string[];  // ["Labrador Retriever", "Golden Retriever"] or null for universal
  isCommon: boolean;         // Show in default UI when no data exists

  // Input configuration
  inputType: GeneticMarkerInputType;
  allowedValues?: string[];  // For status type: ["Clear", "Carrier", "Affected"]

  // Admin
  pendingReview: boolean;    // Flagged for admin to categorize
  source: string;            // Where we learned about it: "seed", "embark_import", etc.

  createdAt: string;
  updatedAt: string;
}

/**
 * Result status for health markers
 */
export type GeneticResultStatus =
  | "clear"
  | "carrier"
  | "affected"
  | "at_risk"
  | "not_tested";

/**
 * Animal-specific genetic test result
 * Links an animal to a marker with their specific result
 */
export interface AnimalGeneticResult {
  id: number;
  animalId: number;
  markerId: number;

  // The actual result (use appropriate field based on marker inputType)
  allele1?: string;          // First allele: "E", "N", "ky"
  allele2?: string;          // Second allele: "e", "DM", "ky"
  status?: GeneticResultStatus;  // For health markers
  rawValue?: string;         // Store exactly what the lab gave us
  genotype?: string;         // Combined: "E/e", "N/N", "ky/ky"

  // Test info
  testProvider?: string;     // "Embark", "UC Davis VGL", etc.
  testDate?: string;         // ISO date

  // Documentation
  documentId?: number;       // Link to uploaded certificate

  // Sharing
  networkVisible: boolean;   // Share with network breeders
  marketplaceVisible: boolean; // Show on marketplace listing

  createdAt: string;
  updatedAt: string;

  // Joined data (when fetched with marker)
  marker?: GeneticMarker;
}

/**
 * Breed composition from DNA test
 */
export interface BreedCompositionEntry {
  breed: string;
  percentage: number;
}

/**
 * MHC (Major Histocompatibility Complex) diversity data
 * Higher allele counts = more diverse immune system
 */
export interface MHCDiversity {
  drb1Alleles?: number;        // DLA-DRB1 allele count (typically 1-2)
  dqa1Dqb1Alleles?: number;    // DLA-DQA1/DQB1 allele count (typically 1-2)
  diversityScore?: number;     // Calculated overall diversity (0-100)
}

/**
 * Maternal and paternal lineage from DNA test
 */
export interface GeneticLineage {
  // Maternal (mitochondrial) lineage - all dogs have this
  mtHaplotype?: string;        // e.g., "A228_MT"
  mtHaplogroup?: string;       // e.g., "A1e_MT"
  // Paternal (Y-chromosome) lineage - males only
  yHaplotype?: string;         // e.g., "H1a.23"
  yHaplogroup?: string;        // e.g., "H1a"
}

/**
 * COI risk level based on coefficient value
 */
export type COIRiskLevel = "excellent" | "good" | "moderate" | "high" | "critical";

/**
 * Coefficient of Inbreeding data
 */
export interface COIData {
  coefficient: number;         // Raw value (e.g., 0.00178111 = 0.18%)
  percentage: number;          // As percentage (e.g., 0.18)
  riskLevel: COIRiskLevel;     // Interpreted risk level
  source?: "embark" | "calculated" | "manual";  // Where this came from
}

/**
 * Overall genetic profile for an animal
 */
export interface AnimalGeneticProfile {
  animalId: number;

  // Test metadata
  testProvider?: string;
  testDate?: string;
  testId?: string;

  // Breed composition
  breedComposition: BreedCompositionEntry[];

  // Results grouped by category
  results: AnimalGeneticResult[];

  // Summary counts
  summary: {
    total: number;
    byCategory: Record<GeneticMarkerCategory, number>;
  };

  // === NEW: Extended genetic data from Embark ===

  // Coefficient of Inbreeding
  coi?: COIData;

  // MHC/Immune diversity
  mhcDiversity?: MHCDiversity;

  // Lineage/Ancestry
  lineage?: GeneticLineage;

  // Physical predictions
  predictedAdultWeight?: {
    value: number;             // e.g., 57.41
    unit: "lbs" | "kg";        // Weight unit
  };

  // Life stage at time of test
  lifeStage?: string;          // e.g., "Mature adult", "Puppy", etc.
}

/**
 * Search/filter params for genetic markers
 */
export interface GeneticMarkerSearchParams {
  species?: GeneticSpecies;
  category?: GeneticMarkerCategory;
  search?: string;           // Searches code, commonName, scientificName, gene, aliases
  breedSpecific?: string;    // Filter to markers for this breed
  isCommon?: boolean;        // Only common markers
  pendingReview?: boolean;   // For admin: only pending review
  limit?: number;
  offset?: number;
}

/**
 * Response for marker list
 */
export interface GeneticMarkerListResponse {
  markers: GeneticMarker[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Input for creating/updating a genetic result
 */
export interface CreateGeneticResultInput {
  markerId: number;
  allele1?: string;
  allele2?: string;
  status?: GeneticResultStatus;
  rawValue?: string;
  testProvider?: string;
  testDate?: string;
  documentId?: number;
  networkVisible?: boolean;
  marketplaceVisible?: boolean;
}

/**
 * Bulk import result from lab CSV
 */
export interface GeneticImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  newMarkers: number;        // Markers we didn't recognize (flagged for review)
  results: AnimalGeneticResult[];
  warnings: string[];
  unmapped: Array<{
    name: string;
    value: string;
    reason: string;
  }>;

  // === NEW: Extended data extracted from import ===

  // Breed composition (from "Breed mix" category)
  breedComposition?: BreedCompositionEntry[];

  // COI (from "Coefficient Of Inbreeding" field)
  coi?: COIData;

  // MHC diversity (from "MHC Class II" fields)
  mhcDiversity?: MHCDiversity;

  // Lineage (from "Lineage" category)
  lineage?: GeneticLineage;

  // Predicted weight (from "Genetic Stats" category)
  predictedAdultWeight?: {
    value: number;
    unit: "lbs" | "kg";
  };

  // Life stage (from "Genetic Stats" category)
  lifeStage?: string;

  // Dog identity from file (for verification)
  dogIdentity?: {
    name?: string;
    sex?: string;
    swabCode?: string;
  };
}
