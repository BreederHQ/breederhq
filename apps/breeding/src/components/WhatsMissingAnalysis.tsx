// apps/breeding/src/components/WhatsMissingAnalysis.tsx
import * as React from "react";

/**
 * Types for genetic data structure
 */
export interface GeneticLocus {
  locus: string;
  locusName: string;
  allele1?: string;
  allele2?: string;
  genotype?: string;
  category?: "coatColor" | "coatType" | "health" | "physicalTraits" | "eyeColor" | "other";
}

export interface GeneticsData {
  coatColor?: GeneticLocus[];
  coatType?: GeneticLocus[];
  health?: GeneticLocus[];
  physicalTraits?: GeneticLocus[];
  eyeColor?: GeneticLocus[];
}

export type Species = "DOG" | "CAT" | "HORSE" | "GOAT" | "RABBIT" | "OTHER";

export type TestPriority = "critical" | "recommended" | "optional";

/**
 * Missing test information
 */
export interface MissingTest {
  locus: string;
  locusName: string;
  priority: TestPriority;
  category: "coatColor" | "health" | "coatType" | "physicalTraits" | "other";
  reason: string;
  breedSpecific?: boolean;
  estimatedCost?: { min: number; max: number };
  providers?: string[];
}

/**
 * Comparison result between dam and sire
 */
export interface CoverageComparison {
  bothMissing: MissingTest[];
  damOnlyMissing: MissingTest[];
  sireOnlyMissing: MissingTest[];
  bothTested: string[];
}

/**
 * Standard loci definitions by species
 */
const STANDARD_COAT_LOCI: Record<Species, { locus: string; name: string; priority: TestPriority }[]> = {
  DOG: [
    { locus: "E", name: "E Locus (Extension)", priority: "recommended" },
    { locus: "K", name: "K Locus (Dominant Black)", priority: "recommended" },
    { locus: "A", name: "A Locus (Agouti)", priority: "recommended" },
    { locus: "B", name: "B Locus (Brown/Liver)", priority: "recommended" },
    { locus: "D", name: "D Locus (Dilution)", priority: "recommended" },
    { locus: "M", name: "M Locus (Merle)", priority: "critical" },
    { locus: "S", name: "S Locus (White Spotting)", priority: "optional" },
    { locus: "H", name: "H Locus (Harlequin)", priority: "optional" },
    { locus: "I", name: "I Locus (Intensity)", priority: "optional" },
    { locus: "Em", name: "Em (Melanistic Mask)", priority: "optional" },
  ],
  CAT: [
    { locus: "A", name: "A Locus (Agouti)", priority: "recommended" },
    { locus: "B", name: "B Locus (Brown)", priority: "recommended" },
    { locus: "C", name: "C Locus (Colorpoint)", priority: "recommended" },
    { locus: "D", name: "D Locus (Dilution)", priority: "recommended" },
    { locus: "O", name: "O Locus (Orange)", priority: "recommended" },
    { locus: "W", name: "W Locus (White)", priority: "critical" },
    { locus: "Fd", name: "Fd (Fold)", priority: "critical" },
    { locus: "Ta", name: "Ta (Tabby Pattern)", priority: "optional" },
    { locus: "Sp", name: "Sp (Spotted)", priority: "optional" },
  ],
  HORSE: [
    { locus: "E", name: "E (Extension/Red Factor)", priority: "recommended" },
    { locus: "A", name: "A (Agouti)", priority: "recommended" },
    { locus: "Cr", name: "Cr (Cream)", priority: "recommended" },
    { locus: "D", name: "D (Dun)", priority: "optional" },
    { locus: "G", name: "G (Gray)", priority: "recommended" },
    { locus: "LP", name: "LP (Leopard Complex)", priority: "optional" },
    { locus: "TO", name: "TO (Tobiano)", priority: "optional" },
    { locus: "O", name: "O (Frame Overo)", priority: "critical" },
    { locus: "Rn", name: "Rn (Roan)", priority: "optional" },
    { locus: "W", name: "W (White)", priority: "critical" },
  ],
  GOAT: [
    { locus: "A", name: "A Locus (Agouti)", priority: "recommended" },
    { locus: "E", name: "E Locus (Extension)", priority: "recommended" },
    { locus: "B", name: "B Locus (Brown)", priority: "optional" },
    { locus: "S", name: "S Locus (Spotting)", priority: "optional" },
  ],
  RABBIT: [
    { locus: "A", name: "A (Agouti)", priority: "recommended" },
    { locus: "B", name: "B (Brown)", priority: "recommended" },
    { locus: "C", name: "C (Color)", priority: "recommended" },
    { locus: "D", name: "D (Dilution)", priority: "recommended" },
    { locus: "E", name: "E (Extension)", priority: "recommended" },
    { locus: "En", name: "En (English Spotting)", priority: "critical" },
    { locus: "V", name: "V (Vienna)", priority: "optional" },
  ],
  OTHER: [],
};

/**
 * Standard health tests by species
 */
const STANDARD_HEALTH_TESTS: Record<Species, { locus: string; name: string; priority: TestPriority }[]> = {
  DOG: [
    { locus: "DM", name: "Degenerative Myelopathy", priority: "critical" },
    { locus: "PRA", name: "Progressive Retinal Atrophy", priority: "critical" },
    { locus: "vWD", name: "Von Willebrand Disease", priority: "critical" },
    { locus: "MDR1", name: "MDR1 Drug Sensitivity", priority: "critical" },
    { locus: "EIC", name: "Exercise Induced Collapse", priority: "recommended" },
    { locus: "HUU", name: "Hyperuricosuria", priority: "recommended" },
    { locus: "CMR", name: "Canine Multifocal Retinopathy", priority: "recommended" },
    { locus: "CEA", name: "Collie Eye Anomaly", priority: "recommended" },
    { locus: "HC", name: "Hereditary Cataracts", priority: "recommended" },
    { locus: "NCL", name: "Neuronal Ceroid Lipofuscinosis", priority: "recommended" },
  ],
  CAT: [
    { locus: "PKD", name: "Polycystic Kidney Disease", priority: "critical" },
    { locus: "HCM", name: "Hypertrophic Cardiomyopathy", priority: "critical" },
    { locus: "PRA", name: "Progressive Retinal Atrophy", priority: "critical" },
    { locus: "SMA", name: "Spinal Muscular Atrophy", priority: "recommended" },
    { locus: "PK", name: "Pyruvate Kinase Deficiency", priority: "recommended" },
    { locus: "GM1", name: "Gangliosidosis", priority: "recommended" },
  ],
  HORSE: [
    { locus: "HYPP", name: "Hyperkalemic Periodic Paralysis", priority: "critical" },
    { locus: "GBED", name: "Glycogen Branching Enzyme Deficiency", priority: "critical" },
    { locus: "HERDA", name: "Hereditary Equine Regional Dermal Asthenia", priority: "critical" },
    { locus: "PSSM1", name: "Polysaccharide Storage Myopathy Type 1", priority: "critical" },
    { locus: "MH", name: "Malignant Hyperthermia", priority: "critical" },
    { locus: "LWO", name: "Lethal White Overo", priority: "critical" },
    { locus: "OLWS", name: "Overo Lethal White Syndrome", priority: "critical" },
    { locus: "CA", name: "Cerebellar Abiotrophy", priority: "recommended" },
    { locus: "SCID", name: "Severe Combined Immunodeficiency", priority: "recommended" },
    { locus: "JEB", name: "Junctional Epidermolysis Bullosa", priority: "recommended" },
  ],
  GOAT: [
    { locus: "CAE", name: "Caprine Arthritis Encephalitis", priority: "critical" },
    { locus: "CL", name: "Caseous Lymphadenitis", priority: "critical" },
    { locus: "G6S", name: "G6S Deficiency", priority: "recommended" },
  ],
  RABBIT: [
    { locus: "RHDA", name: "Rabbit Hemorrhagic Disease", priority: "critical" },
  ],
  OTHER: [],
};

/**
 * Breed-specific health tests for dogs
 */
const BREED_SPECIFIC_HEALTH_TESTS: Record<string, { locus: string; name: string; priority: TestPriority }[]> = {
  // Retrievers
  "labrador retriever": [
    { locus: "EIC", name: "Exercise Induced Collapse", priority: "critical" },
    { locus: "CNM", name: "Centronuclear Myopathy", priority: "critical" },
    { locus: "HNPK", name: "Hereditary Nasal Parakeratosis", priority: "recommended" },
    { locus: "SD2", name: "Skeletal Dysplasia 2", priority: "recommended" },
  ],
  "golden retriever": [
    { locus: "ICT-A", name: "Ichthyosis Type A", priority: "critical" },
    { locus: "NCL", name: "Neuronal Ceroid Lipofuscinosis", priority: "critical" },
    { locus: "PRA1", name: "Progressive Retinal Atrophy GR1", priority: "critical" },
    { locus: "PRA2", name: "Progressive Retinal Atrophy GR2", priority: "critical" },
  ],
  // Herding breeds
  "border collie": [
    { locus: "CEA", name: "Collie Eye Anomaly", priority: "critical" },
    { locus: "TNS", name: "Trapped Neutrophil Syndrome", priority: "critical" },
    { locus: "IGS", name: "Imerslund-Grasbeck Syndrome", priority: "recommended" },
    { locus: "SN", name: "Sensory Neuropathy", priority: "recommended" },
  ],
  "australian shepherd": [
    { locus: "MDR1", name: "MDR1 Drug Sensitivity", priority: "critical" },
    { locus: "HSF4", name: "Hereditary Cataracts", priority: "critical" },
    { locus: "CEA", name: "Collie Eye Anomaly", priority: "critical" },
    { locus: "CMR1", name: "Canine Multifocal Retinopathy", priority: "recommended" },
  ],
  "german shepherd": [
    { locus: "DM", name: "Degenerative Myelopathy", priority: "critical" },
    { locus: "HEM", name: "Hemophilia A", priority: "recommended" },
    { locus: "MH", name: "Malignant Hyperthermia", priority: "recommended" },
  ],
  // Bulldogs and Brachycephalic
  "french bulldog": [
    { locus: "DM", name: "Degenerative Myelopathy", priority: "critical" },
    { locus: "CMR1", name: "Canine Multifocal Retinopathy", priority: "critical" },
    { locus: "JHC", name: "Juvenile Hereditary Cataracts", priority: "critical" },
    { locus: "HUU", name: "Hyperuricosuria", priority: "recommended" },
  ],
  "english bulldog": [
    { locus: "HUU", name: "Hyperuricosuria", priority: "critical" },
    { locus: "CMR1", name: "Canine Multifocal Retinopathy", priority: "recommended" },
  ],
  // Poodles
  "poodle": [
    { locus: "vWD1", name: "Von Willebrand Disease Type 1", priority: "critical" },
    { locus: "NE", name: "Neonatal Encephalopathy", priority: "critical" },
    { locus: "PRA-prcd", name: "Progressive Retinal Atrophy prcd", priority: "critical" },
    { locus: "GM2", name: "GM2 Gangliosidosis", priority: "recommended" },
  ],
  // Dachshunds
  "dachshund": [
    { locus: "PRA-cord1", name: "Progressive Retinal Atrophy cord1", priority: "critical" },
    { locus: "IVDD", name: "Intervertebral Disc Disease Risk", priority: "recommended" },
    { locus: "NCCD", name: "Narcolepsy", priority: "optional" },
  ],
  // Doberman
  "doberman pinscher": [
    { locus: "vWD1", name: "Von Willebrand Disease Type 1", priority: "critical" },
    { locus: "DCM", name: "Dilated Cardiomyopathy", priority: "critical" },
    { locus: "NAPD", name: "Narcolepsy", priority: "recommended" },
  ],
  // Cavalier King Charles Spaniel
  "cavalier king charles spaniel": [
    { locus: "EFS", name: "Episodic Falling Syndrome", priority: "critical" },
    { locus: "CC", name: "Curly Coat/Dry Eye Syndrome", priority: "critical" },
    { locus: "MVD", name: "Mitral Valve Disease Risk", priority: "recommended" },
  ],
  // Boxers
  "boxer": [
    { locus: "DM", name: "Degenerative Myelopathy", priority: "critical" },
    { locus: "ARVC", name: "Arrhythmogenic Right Ventricular Cardiomyopathy", priority: "critical" },
  ],
  // Great Danes
  "great dane": [
    { locus: "M", name: "Merle (Double Merle Risk)", priority: "critical" },
    { locus: "H", name: "Harlequin", priority: "recommended" },
  ],
};

/**
 * Testing providers by species
 */
const TESTING_PROVIDERS: Record<Species, { name: string; url: string; costRange?: { min: number; max: number } }[]> = {
  DOG: [
    { name: "Embark", url: "https://embarkvet.com", costRange: { min: 129, max: 229 } },
    { name: "Wisdom Panel", url: "https://www.wisdompanel.com", costRange: { min: 99, max: 199 } },
    { name: "UC Davis VGL", url: "https://vgl.ucdavis.edu", costRange: { min: 50, max: 150 } },
    { name: "Animal Genetics", url: "https://animalgenetics.us", costRange: { min: 25, max: 75 } },
    { name: "Paw Print Genetics", url: "https://www.pawprintgenetics.com", costRange: { min: 45, max: 200 } },
  ],
  CAT: [
    { name: "UC Davis VGL", url: "https://vgl.ucdavis.edu", costRange: { min: 40, max: 120 } },
    { name: "Wisdom Panel", url: "https://www.wisdompanel.com", costRange: { min: 99, max: 149 } },
    { name: "Optimal Selection", url: "https://www.optimal-selection.com", costRange: { min: 99, max: 149 } },
    { name: "Basepaws", url: "https://basepaws.com", costRange: { min: 129, max: 299 } },
  ],
  HORSE: [
    { name: "UC Davis VGL", url: "https://vgl.ucdavis.edu", costRange: { min: 25, max: 100 } },
    { name: "Animal Genetics", url: "https://animalgenetics.us", costRange: { min: 25, max: 75 } },
    { name: "Etalon Diagnostics", url: "https://www.etalondx.com", costRange: { min: 75, max: 350 } },
    { name: "Texas A&M", url: "https://vetmed.tamu.edu/vgl", costRange: { min: 30, max: 80 } },
  ],
  GOAT: [
    { name: "UC Davis VGL", url: "https://vgl.ucdavis.edu", costRange: { min: 25, max: 75 } },
    { name: "BioTracking", url: "https://biotracking.com", costRange: { min: 20, max: 50 } },
  ],
  RABBIT: [
    { name: "UC Davis VGL", url: "https://vgl.ucdavis.edu", costRange: { min: 25, max: 50 } },
  ],
  OTHER: [],
};

/**
 * Props for the WhatsMissingAnalysis component
 */
export interface WhatsMissingAnalysisProps {
  damGenetics: GeneticsData | null;
  sireGenetics: GeneticsData | null;
  species: Species;
  breed?: string;
  damName?: string;
  sireName?: string;
  onAddTestResults?: (animal: "dam" | "sire") => void;
  className?: string;
}

/**
 * Check if a locus has complete data (both alleles known)
 */
function isLocusComplete(locus: GeneticLocus): boolean {
  if (locus.genotype) {
    const parts = locus.genotype.split("/");
    return parts.length === 2 && parts[0] !== "?" && parts[1] !== "?";
  }
  return !!(locus.allele1 && locus.allele2 && locus.allele1 !== "?" && locus.allele2 !== "?");
}

/**
 * Get tested loci from genetics data
 */
function getTestedLoci(genetics: GeneticsData | null): Set<string> {
  if (!genetics) return new Set();

  const tested = new Set<string>();
  const allLoci = [
    ...(genetics.coatColor || []),
    ...(genetics.coatType || []),
    ...(genetics.health || []),
    ...(genetics.physicalTraits || []),
    ...(genetics.eyeColor || []),
  ];

  for (const locus of allLoci) {
    if (isLocusComplete(locus)) {
      tested.add(locus.locus.toUpperCase());
    }
  }

  return tested;
}

/**
 * Get incomplete loci (only one allele known)
 */
function getIncompleteLoci(genetics: GeneticsData | null): GeneticLocus[] {
  if (!genetics) return [];

  const incomplete: GeneticLocus[] = [];
  const allLoci = [
    ...(genetics.coatColor || []),
    ...(genetics.coatType || []),
    ...(genetics.health || []),
    ...(genetics.physicalTraits || []),
    ...(genetics.eyeColor || []),
  ];

  for (const locus of allLoci) {
    if (!isLocusComplete(locus) && (locus.allele1 || locus.allele2 || locus.genotype)) {
      incomplete.push(locus);
    }
  }

  return incomplete;
}

/**
 * Analyze missing tests for an animal
 */
function analyzeMissingTests(
  genetics: GeneticsData | null,
  species: Species,
  breed?: string
): MissingTest[] {
  const testedLoci = getTestedLoci(genetics);
  const missing: MissingTest[] = [];

  // Check standard coat color loci
  const coatLoci = STANDARD_COAT_LOCI[species] || [];
  for (const locus of coatLoci) {
    if (!testedLoci.has(locus.locus.toUpperCase())) {
      missing.push({
        locus: locus.locus,
        locusName: locus.name,
        priority: locus.priority,
        category: "coatColor",
        reason: `Standard ${species.toLowerCase()} coat color test`,
      });
    }
  }

  // Check standard health tests
  const healthTests = STANDARD_HEALTH_TESTS[species] || [];
  for (const test of healthTests) {
    if (!testedLoci.has(test.locus.toUpperCase())) {
      missing.push({
        locus: test.locus,
        locusName: test.name,
        priority: test.priority,
        category: "health",
        reason: `Standard ${species.toLowerCase()} health test`,
      });
    }
  }

  // Check breed-specific tests (for dogs)
  if (species === "DOG" && breed) {
    const normalizedBreed = breed.toLowerCase().trim();
    const breedTests = BREED_SPECIFIC_HEALTH_TESTS[normalizedBreed] || [];

    for (const test of breedTests) {
      // Skip if already in the list or already tested
      if (testedLoci.has(test.locus.toUpperCase())) continue;
      if (missing.some((m) => m.locus.toUpperCase() === test.locus.toUpperCase())) continue;

      missing.push({
        locus: test.locus,
        locusName: test.name,
        priority: test.priority,
        category: "health",
        reason: `Recommended for ${breed}`,
        breedSpecific: true,
      });
    }
  }

  return missing;
}

/**
 * Compare coverage between dam and sire
 */
function compareCoverage(
  damMissing: MissingTest[],
  sireMissing: MissingTest[],
  damTested: Set<string>,
  sireTested: Set<string>
): CoverageComparison {
  const damMissingSet = new Set(damMissing.map((m) => m.locus.toUpperCase()));
  const sireMissingSet = new Set(sireMissing.map((m) => m.locus.toUpperCase()));

  const bothMissing: MissingTest[] = [];
  const damOnlyMissing: MissingTest[] = [];
  const sireOnlyMissing: MissingTest[] = [];

  for (const test of damMissing) {
    if (sireMissingSet.has(test.locus.toUpperCase())) {
      bothMissing.push(test);
    } else {
      damOnlyMissing.push(test);
    }
  }

  for (const test of sireMissing) {
    if (!damMissingSet.has(test.locus.toUpperCase())) {
      sireOnlyMissing.push(test);
    }
  }

  // Find loci tested in both
  const bothTested: string[] = [];
  for (const locus of damTested) {
    if (sireTested.has(locus)) {
      bothTested.push(locus);
    }
  }

  return {
    bothMissing,
    damOnlyMissing,
    sireOnlyMissing,
    bothTested,
  };
}

/**
 * Priority badge component
 */
function PriorityBadge({ priority }: { priority: TestPriority }) {
  const styles: Record<TestPriority, string> = {
    critical: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
    recommended: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
    optional: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20",
  };

  const labels: Record<TestPriority, string> = {
    critical: "Critical",
    recommended: "Recommended",
    optional: "Optional",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${styles[priority]}`}>
      {priority === "critical" && (
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )}
      {labels[priority]}
    </span>
  );
}

/**
 * Category badge component
 */
function CategoryBadge({ category }: { category: MissingTest["category"] }) {
  const styles: Record<MissingTest["category"], string> = {
    health: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    coatColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    coatType: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    physicalTraits: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    other: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400",
  };

  const labels: Record<MissingTest["category"], string> = {
    health: "Health",
    coatColor: "Color",
    coatType: "Coat",
    physicalTraits: "Physical",
    other: "Other",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded ${styles[category]}`}>
      {labels[category]}
    </span>
  );
}

/**
 * Missing test row component
 */
function MissingTestRow({ test }: { test: MissingTest }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-alt/50 hover:bg-surface-alt transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <PriorityBadge priority={test.priority} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium">{test.locus}</span>
            <CategoryBadge category={test.category} />
            {test.breedSpecific && (
              <span className="text-xs text-accent">Breed-specific</span>
            )}
          </div>
          <div className="text-sm text-secondary truncate">{test.locusName}</div>
        </div>
      </div>
      <div className="text-xs text-secondary text-right shrink-0 ml-2">
        {test.reason}
      </div>
    </div>
  );
}

/**
 * Animal missing tests panel
 */
function AnimalMissingPanel({
  name,
  role,
  missing,
  incomplete,
  onAddResults,
}: {
  name: string;
  role: "dam" | "sire";
  missing: MissingTest[];
  incomplete: GeneticLocus[];
  onAddResults?: () => void;
}) {
  const [expanded, setExpanded] = React.useState(true);

  const criticalCount = missing.filter((m) => m.priority === "critical").length;
  const recommendedCount = missing.filter((m) => m.priority === "recommended").length;
  const optionalCount = missing.filter((m) => m.priority === "optional").length;

  const roleColor = role === "dam" ? "pink" : "blue";
  const roleIcon = role === "dam" ? (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div className={`rounded-xl border-2 border-${roleColor}-500/30 bg-surface overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-4 bg-${roleColor}-500/5 hover:bg-${roleColor}-500/10 transition-colors`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full bg-${roleColor}-500/20 flex items-center justify-center text-${roleColor}-600 dark:text-${roleColor}-400`}>
            {roleIcon}
          </div>
          <div className="text-left">
            <div className="font-medium">{name || (role === "dam" ? "Dam" : "Sire")}</div>
            <div className="text-xs text-secondary">
              {missing.length === 0 ? "Fully tested" : `${missing.length} tests missing`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-red-500/15 text-red-600">
              {criticalCount} critical
            </span>
          )}
          {recommendedCount > 0 && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-yellow-500/15 text-yellow-600">
              {recommendedCount} recommended
            </span>
          )}
          <svg
            className={`w-5 h-5 text-secondary transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Incomplete Data Warning */}
          {incomplete.length > 0 && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <div className="font-medium text-orange-700 dark:text-orange-300 text-sm">
                    Incomplete Data Detected
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    {incomplete.length} {incomplete.length === 1 ? "locus has" : "loci have"} only one allele known:
                    <span className="font-mono ml-1">
                      {incomplete.slice(0, 3).map((l) => l.locus).join(", ")}
                      {incomplete.length > 3 && ` +${incomplete.length - 3} more`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Missing Tests by Priority */}
          {missing.length > 0 ? (
            <div className="space-y-2">
              {/* Critical Tests */}
              {criticalCount > 0 && (
                <div>
                  <div className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Critical Tests ({criticalCount})
                  </div>
                  <div className="space-y-1">
                    {missing
                      .filter((m) => m.priority === "critical")
                      .map((test) => (
                        <MissingTestRow key={test.locus} test={test} />
                      ))}
                  </div>
                </div>
              )}

              {/* Recommended Tests */}
              {recommendedCount > 0 && (
                <div>
                  <div className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide mb-2 mt-3">
                    Recommended Tests ({recommendedCount})
                  </div>
                  <div className="space-y-1">
                    {missing
                      .filter((m) => m.priority === "recommended")
                      .map((test) => (
                        <MissingTestRow key={test.locus} test={test} />
                      ))}
                  </div>
                </div>
              )}

              {/* Optional Tests */}
              {optionalCount > 0 && (
                <div>
                  <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2 mt-3">
                    Optional Tests ({optionalCount})
                  </div>
                  <div className="space-y-1">
                    {missing
                      .filter((m) => m.priority === "optional")
                      .slice(0, 5)
                      .map((test) => (
                        <MissingTestRow key={test.locus} test={test} />
                      ))}
                    {optionalCount > 5 && (
                      <div className="text-xs text-secondary text-center py-1">
                        +{optionalCount - 5} more optional tests
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="font-medium text-green-600 dark:text-green-400">Comprehensive Testing Complete</div>
              <div className="text-sm text-secondary mt-1">All standard tests have results</div>
            </div>
          )}

          {/* Action Button */}
          {onAddResults && missing.length > 0 && (
            <button
              onClick={onAddResults}
              className={`w-full mt-4 px-4 py-2.5 rounded-lg font-medium text-sm bg-${roleColor}-500/10 text-${roleColor}-600 dark:text-${roleColor}-400 hover:bg-${roleColor}-500/20 transition-colors flex items-center justify-center gap-2`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Test Results for {name || (role === "dam" ? "Dam" : "Sire")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Main WhatsMissingAnalysis Component
 */
export default function WhatsMissingAnalysis({
  damGenetics,
  sireGenetics,
  species,
  breed,
  damName = "Dam",
  sireName = "Sire",
  onAddTestResults,
  className = "",
}: WhatsMissingAnalysisProps) {
  // Analyze missing tests for each animal
  const damMissing = React.useMemo(
    () => analyzeMissingTests(damGenetics, species, breed),
    [damGenetics, species, breed]
  );

  const sireMissing = React.useMemo(
    () => analyzeMissingTests(sireGenetics, species, breed),
    [sireGenetics, species, breed]
  );

  // Get tested loci
  const damTested = React.useMemo(() => getTestedLoci(damGenetics), [damGenetics]);
  const sireTested = React.useMemo(() => getTestedLoci(sireGenetics), [sireGenetics]);

  // Get incomplete loci
  const damIncomplete = React.useMemo(() => getIncompleteLoci(damGenetics), [damGenetics]);
  const sireIncomplete = React.useMemo(() => getIncompleteLoci(sireGenetics), [sireGenetics]);

  // Compare coverage
  const comparison = React.useMemo(
    () => compareCoverage(damMissing, sireMissing, damTested, sireTested),
    [damMissing, sireMissing, damTested, sireTested]
  );

  // Get providers for species
  const providers = TESTING_PROVIDERS[species] || [];

  // Calculate overall score
  const totalPossibleTests = damMissing.length + sireMissing.length + damTested.size + sireTested.size;
  const totalTested = damTested.size + sireTested.size;
  const coveragePercent = totalPossibleTests > 0 ? Math.round((totalTested / totalPossibleTests) * 100) : 0;

  // Count critical gaps
  const criticalBothMissing = comparison.bothMissing.filter((m) => m.priority === "critical").length;

  return (
    <div className={`rounded-xl border-2 border-accent/30 bg-surface ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-hairline">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              What's Missing Analysis
            </h3>
            <p className="text-sm text-secondary mt-1">
              Identify gaps in genetic testing coverage for this pairing
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-accent">{coveragePercent}%</div>
            <div className="text-xs text-secondary">Coverage</div>
          </div>
        </div>
      </div>

      {/* Critical Alert - Both Missing */}
      {criticalBothMissing > 0 && (
        <div className="p-4 bg-red-500/10 border-b border-red-500/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-red-700 dark:text-red-300">
                {criticalBothMissing} Critical Test{criticalBothMissing !== 1 ? "s" : ""} Missing from Both Parents
              </div>
              <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                These tests could identify health conditions that may produce affected offspring.
                Testing both parents before breeding is strongly recommended.
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {comparison.bothMissing
                  .filter((m) => m.priority === "critical")
                  .slice(0, 5)
                  .map((test) => (
                    <span
                      key={test.locus}
                      className="inline-flex items-center px-2 py-1 text-xs font-mono bg-red-500/20 text-red-700 dark:text-red-300 rounded"
                    >
                      {test.locus}: {test.locusName}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Both Missing Section (non-critical) */}
      {comparison.bothMissing.filter((m) => m.priority !== "critical").length > 0 && (
        <div className="p-4 bg-yellow-500/5 border-b border-hairline">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-yellow-700 dark:text-yellow-300 text-sm">
                {comparison.bothMissing.filter((m) => m.priority !== "critical").length} Tests Missing from Both Parents
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Testing either parent for these loci would improve prediction accuracy.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Animal Panels */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimalMissingPanel
          name={damName}
          role="dam"
          missing={damMissing}
          incomplete={damIncomplete}
          onAddResults={onAddTestResults ? () => onAddTestResults("dam") : undefined}
        />
        <AnimalMissingPanel
          name={sireName}
          role="sire"
          missing={sireMissing}
          incomplete={sireIncomplete}
          onAddResults={onAddTestResults ? () => onAddTestResults("sire") : undefined}
        />
      </div>

      {/* Coverage Comparison */}
      {comparison.bothTested.length > 0 && (
        <div className="p-4 border-t border-hairline">
          <div className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">
            Complete Coverage ({comparison.bothTested.length} loci tested in both)
          </div>
          <div className="flex flex-wrap gap-1">
            {comparison.bothTested.slice(0, 15).map((locus) => (
              <span
                key={locus}
                className="inline-flex items-center px-2 py-1 text-xs font-mono bg-green-500/10 text-green-600 dark:text-green-400 rounded"
              >
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {locus}
              </span>
            ))}
            {comparison.bothTested.length > 15 && (
              <span className="text-xs text-secondary px-2">
                +{comparison.bothTested.length - 15} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Testing Providers */}
      {providers.length > 0 && (
        <div className="p-4 border-t border-hairline bg-surface-alt/50">
          <div className="text-sm font-semibold mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Recommended Testing Providers for {species === "DOG" ? "Dogs" : species === "CAT" ? "Cats" : species === "HORSE" ? "Horses" : species}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {providers.slice(0, 6).map((provider) => (
              <a
                key={provider.name}
                href={provider.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg border border-hairline bg-surface hover:border-accent hover:shadow-sm transition-all group"
              >
                <div>
                  <div className="font-medium text-sm group-hover:text-accent transition-colors">
                    {provider.name}
                  </div>
                  {provider.costRange && (
                    <div className="text-xs text-secondary">
                      ${provider.costRange.min} - ${provider.costRange.max}
                    </div>
                  )}
                </div>
                <svg className="w-4 h-4 text-secondary group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4 border-t border-hairline flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-secondary">
          {breed && species === "DOG" && (
            <span className="inline-flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Breed-specific tests included for {breed}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {species === "DOG" && (
            <a
              href="https://embarkvet.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-accent text-white hover:bg-accent/90 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Embark Testing
            </a>
          )}
          {onAddTestResults && (
            <button
              onClick={() => onAddTestResults("dam")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm border border-accent text-accent hover:bg-accent/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Test Results
            </button>
          )}
        </div>
      </div>

      {/* Educational Footer */}
      <div className="p-4 border-t border-hairline bg-accent/5">
        <div className="flex items-start gap-2 text-xs text-secondary">
          <svg className="w-4 h-4 shrink-0 mt-0.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <strong>Why genetic testing matters:</strong> Testing both parents helps predict offspring traits
            and identify potential health risks. Critical tests can reveal carriers of serious conditions
            that may produce affected puppies when both parents carry the same mutation.
            {species === "DOG" && (
              <span className="block mt-1">
                Comprehensive panels like Embark test for 200+ health conditions and 35+ traits in a single test.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Summary component for quick display
 */
export function WhatsMissingSummary({
  damGenetics,
  sireGenetics,
  species,
  breed,
  onClick,
}: {
  damGenetics: GeneticsData | null;
  sireGenetics: GeneticsData | null;
  species: Species;
  breed?: string;
  onClick?: () => void;
}) {
  const damMissing = analyzeMissingTests(damGenetics, species, breed);
  const sireMissing = analyzeMissingTests(sireGenetics, species, breed);

  const totalCritical =
    damMissing.filter((m) => m.priority === "critical").length +
    sireMissing.filter((m) => m.priority === "critical").length;

  const totalMissing = damMissing.length + sireMissing.length;

  if (totalMissing === 0) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 text-sm ${
          onClick ? "cursor-pointer hover:bg-green-500/20 transition-colors" : ""
        }`}
        onClick={onClick}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        <span className="font-medium">Testing Complete</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${
        totalCritical > 0
          ? "bg-red-500/10 text-red-600 dark:text-red-400"
          : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
      } text-sm ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
      onClick={onClick}
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <span className="font-medium">
        {totalCritical > 0
          ? `${totalCritical} Critical Test${totalCritical !== 1 ? "s" : ""} Missing`
          : `${totalMissing} Test${totalMissing !== 1 ? "s" : ""} Recommended`}
      </span>
    </div>
  );
}
