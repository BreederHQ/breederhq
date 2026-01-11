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
}
