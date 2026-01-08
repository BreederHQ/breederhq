// apps/breeding/src/components/BreedGeneticProfiles.tsx
import * as React from "react";
import { AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

/**
 * Breed-specific genetic profiles containing recommended tests,
 * common genetic issues, and breed standards for coat/traits.
 */

type HealthTestRecommendation = {
  name: string;
  gene?: string;
  importance: "required" | "recommended" | "optional";
  description: string;
  prevalence?: string; // e.g., "~15% carrier rate"
};

type CoatStandard = {
  trait: string;
  accepted: string[];
  faults?: string[];
  disqualifications?: string[];
};

type BreedProfile = {
  breed: string;
  species: "DOG" | "CAT" | "HORSE";
  aliases?: string[];
  healthTests: HealthTestRecommendation[];
  coatStandards?: CoatStandard[];
  geneticNotes?: string[];
  resources?: { name: string; url: string }[];
};

// Dog breed profiles
const DOG_PROFILES: BreedProfile[] = [
  {
    breed: "Australian Shepherd",
    species: "DOG",
    aliases: ["Aussie"],
    healthTests: [
      { name: "MDR1", gene: "ABCB1", importance: "required", description: "Multi-Drug Resistance - affects medication sensitivity", prevalence: "~50% affected or carrier" },
      { name: "HSF4 Hereditary Cataracts", gene: "HSF4", importance: "required", description: "Progressive cataracts leading to blindness", prevalence: "~10% carrier rate" },
      { name: "CEA/CH", gene: "NHEJ1", importance: "required", description: "Collie Eye Anomaly - eye development defect" },
      { name: "PRA-PRCD", gene: "PRCD", importance: "recommended", description: "Progressive Retinal Atrophy" },
      { name: "DM", gene: "SOD1", importance: "recommended", description: "Degenerative Myelopathy - spinal cord disease" },
      { name: "HC", gene: "HSF4", importance: "required", description: "Hereditary Cataracts" },
    ],
    coatStandards: [
      {
        trait: "Color",
        accepted: ["Black", "Red (Liver)", "Blue Merle", "Red Merle"],
        faults: ["White body splashes", "Dudley nose"],
        disqualifications: ["White spotting on body between withers and tail"],
      },
      {
        trait: "Markings",
        accepted: ["White markings", "Tan points (copper)"],
      },
    ],
    geneticNotes: [
      "Merle to Merle breeding produces 25% double merle puppies with serious health issues",
      "Natural bobtail (NBT) gene present - NBT x NBT can produce lethal homozygotes",
      "High incidence of MDR1 mutation - always test before anesthesia/medications",
    ],
    resources: [
      { name: "ASHGI Health Testing", url: "https://www.ashgi.org" },
      { name: "ASCA Breed Standard", url: "https://www.asca.org" },
    ],
  },
  {
    breed: "Labrador Retriever",
    species: "DOG",
    aliases: ["Lab"],
    healthTests: [
      { name: "EIC", gene: "DNM1", importance: "required", description: "Exercise-Induced Collapse", prevalence: "~30% carrier rate" },
      { name: "PRA-PRCD", gene: "PRCD", importance: "required", description: "Progressive Retinal Atrophy", prevalence: "~5% carrier rate" },
      { name: "CNM", gene: "PTPLA", importance: "required", description: "Centronuclear Myopathy - muscle weakness" },
      { name: "DM", gene: "SOD1", importance: "recommended", description: "Degenerative Myelopathy" },
      { name: "HNPK", gene: "FAM83G", importance: "recommended", description: "Hereditary Nasal Parakeratosis" },
      { name: "SD2", gene: "COL11A2", importance: "optional", description: "Skeletal Dysplasia 2 - dwarfism" },
    ],
    coatStandards: [
      {
        trait: "Color",
        accepted: ["Black", "Yellow", "Chocolate"],
        faults: ["Brindle", "Tan markings"],
        disqualifications: ["Any color other than black, yellow, chocolate"],
      },
    ],
    geneticNotes: [
      "Yellow color is recessive (e/e) - two yellows always produce yellow",
      "Chocolate is recessive (b/b) - two chocolates always produce chocolate",
      "Silver/charcoal Labs carry dilute gene (d/d) - controversial in breed community",
    ],
  },
  {
    breed: "German Shepherd",
    species: "DOG",
    aliases: ["GSD", "Alsatian"],
    healthTests: [
      { name: "DM", gene: "SOD1", importance: "required", description: "Degenerative Myelopathy - progressive paralysis", prevalence: "~20% at risk" },
      { name: "Hip Dysplasia", importance: "required", description: "OFA or PennHIP evaluation recommended" },
      { name: "Elbow Dysplasia", importance: "required", description: "OFA evaluation recommended" },
      { name: "MDR1", gene: "ABCB1", importance: "recommended", description: "Multi-Drug Resistance", prevalence: "~10% carrier rate" },
    ],
    coatStandards: [
      {
        trait: "Color",
        accepted: ["Black and Tan", "Black and Red", "Sable", "Bi-color", "Solid Black"],
        faults: ["Pale colors", "Blues", "Livers"],
        disqualifications: ["White"],
      },
    ],
    geneticNotes: [
      "White GSDs carry recessive white (e/e or extreme white spotting) - not breed standard",
      "Panda pattern is a dominant mutation - controversial",
      "Long coat is recessive - both parents must carry",
    ],
  },
  {
    breed: "French Bulldog",
    species: "DOG",
    aliases: ["Frenchie"],
    healthTests: [
      { name: "DM", gene: "SOD1", importance: "required", description: "Degenerative Myelopathy" },
      { name: "JHC", gene: "HSF4", importance: "required", description: "Juvenile Hereditary Cataracts" },
      { name: "CMR1", gene: "BEST1", importance: "required", description: "Canine Multifocal Retinopathy" },
      { name: "HUU", gene: "SLC2A9", importance: "recommended", description: "Hyperuricosuria - bladder stones" },
    ],
    coatStandards: [
      {
        trait: "Color",
        accepted: ["Brindle", "Fawn", "White", "Brindle and White", "Fawn and White"],
        disqualifications: ["Solid black", "Black and tan", "Black and white", "Liver", "Mouse gray"],
      },
    ],
    geneticNotes: [
      "Merle in Frenchies is highly controversial - often indicates mixed breeding",
      "Blue/lilac colors are dilute (d/d) - associated with Color Dilution Alopecia",
      "Cream is caused by intensity dilution",
    ],
  },
  {
    breed: "Golden Retriever",
    species: "DOG",
    healthTests: [
      { name: "PRA1", gene: "SLC4A3", importance: "required", description: "Progressive Retinal Atrophy - GR specific" },
      { name: "PRA2", gene: "TTC8", importance: "required", description: "Progressive Retinal Atrophy - GR specific" },
      { name: "ICT-A", gene: "PPT1", importance: "required", description: "Ichthyosis - skin disorder", prevalence: "~50% carrier rate" },
      { name: "DM", gene: "SOD1", importance: "recommended", description: "Degenerative Myelopathy" },
      { name: "NCL", gene: "CLN5", importance: "recommended", description: "Neuronal Ceroid Lipofuscinosis" },
    ],
    coatStandards: [
      {
        trait: "Color",
        accepted: ["Rich lustrous golden", "Various shades of gold"],
        faults: ["Extremely pale", "Extremely dark (setter red)"],
      },
    ],
    geneticNotes: [
      "All Goldens are e/e (recessive red) - cannot produce black pigmented puppies",
      "Shade variation is polygenic - not single gene controlled",
      "Field vs Show lines may have different shade preferences",
    ],
  },
  {
    breed: "Poodle",
    species: "DOG",
    aliases: ["Standard Poodle", "Miniature Poodle", "Toy Poodle"],
    healthTests: [
      { name: "vWD", gene: "VWF", importance: "required", description: "Von Willebrand Disease - bleeding disorder" },
      { name: "DM", gene: "SOD1", importance: "required", description: "Degenerative Myelopathy" },
      { name: "PRA-PRCD", gene: "PRCD", importance: "required", description: "Progressive Retinal Atrophy" },
      { name: "NEwS", gene: "ATF2", importance: "recommended", description: "Neonatal Encephalopathy with Seizures" },
    ],
    coatStandards: [
      {
        trait: "Color",
        accepted: ["Black", "White", "Brown", "Gray", "Apricot", "Red", "Cream", "Silver", "Blue", "Cafe au lait"],
        faults: ["Parti-color in conformation"],
      },
    ],
    geneticNotes: [
      "Parti-color (piebald) is recessive - AKC does not allow in conformation",
      "Phantom pattern is tan points (at/at)",
      "Progressive graying is common - puppies born dark may lighten",
      "Brown dogs have liver (bb) nose pigment",
    ],
  },
  {
    breed: "Border Collie",
    species: "DOG",
    healthTests: [
      { name: "CEA", gene: "NHEJ1", importance: "required", description: "Collie Eye Anomaly" },
      { name: "TNS", gene: "VPS13B", importance: "required", description: "Trapped Neutrophil Syndrome" },
      { name: "CL", gene: "CLN5", importance: "required", description: "Neuronal Ceroid Lipofuscinosis" },
      { name: "MDR1", gene: "ABCB1", importance: "recommended", description: "Multi-Drug Resistance" },
      { name: "IGS", gene: "CUBN", importance: "recommended", description: "Imerslund-Gräsbeck Syndrome" },
    ],
    coatStandards: [
      {
        trait: "Color",
        accepted: ["Black and white", "Red and white", "Blue merle", "Red merle", "Tricolor", "Sable", "Many others"],
      },
    ],
    geneticNotes: [
      "Working breed - health and temperament prioritized over color",
      "Merle to merle breeding should be avoided",
      "ee red Border Collies exist but are less common",
    ],
  },
  {
    breed: "Cavalier King Charles Spaniel",
    species: "DOG",
    aliases: ["CKCS", "Cavalier"],
    healthTests: [
      { name: "EFS", gene: "FAM83G", importance: "required", description: "Episodic Falling Syndrome" },
      { name: "CC/DE", gene: "PSEN1", importance: "required", description: "Curly Coat/Dry Eye - keratoconjunctivitis" },
      { name: "DM", gene: "SOD1", importance: "recommended", description: "Degenerative Myelopathy" },
      { name: "Cardiac Exam", importance: "required", description: "Annual heart exam for MVD" },
      { name: "MRI for SM", importance: "recommended", description: "Syringomyelia screening" },
    ],
    coatStandards: [
      {
        trait: "Color",
        accepted: ["Blenheim (chestnut/white)", "Tricolor (black/white/tan)", "Black and Tan", "Ruby (solid red)"],
      },
    ],
    geneticNotes: [
      "Breed has high incidence of Mitral Valve Disease - cardiac screening essential",
      "Syringomyelia (SM) is a significant concern - MRI screening recommended",
      "Color breeding: Whole colors (Black & Tan, Ruby) should not be bred to Parti colors (Blenheim, Tricolor)",
    ],
  },
];

// Horse breed profiles
const HORSE_PROFILES: BreedProfile[] = [
  {
    breed: "American Quarter Horse",
    species: "HORSE",
    aliases: ["AQHA", "Quarter Horse"],
    healthTests: [
      { name: "HYPP", gene: "SCN4A", importance: "required", description: "Hyperkalemic Periodic Paralysis - muscle disease", prevalence: "Impressive bloodline" },
      { name: "HERDA", gene: "PPIB", importance: "required", description: "Hereditary Equine Regional Dermal Asthenia - skin fragility" },
      { name: "GBED", gene: "GBE1", importance: "required", description: "Glycogen Branching Enzyme Deficiency - fatal" },
      { name: "PSSM1", gene: "GYS1", importance: "required", description: "Polysaccharide Storage Myopathy - muscle disorder" },
      { name: "MH", gene: "RYR1", importance: "recommended", description: "Malignant Hyperthermia - anesthesia risk" },
    ],
    coatStandards: [
      {
        trait: "Color",
        accepted: ["Sorrel", "Bay", "Black", "Brown", "Buckskin", "Palomino", "Gray", "Roan", "Dun", "Grullo", "Cremello", "Perlino"],
      },
    ],
    geneticNotes: [
      "HYPP traces to stallion Impressive - N/H horses have restrictions",
      "Five Panel test is standard: HYPP, HERDA, GBED, PSSM1, MH",
      "LWO (Lethal White Overo) testing required if breeding Paints",
    ],
  },
  {
    breed: "Arabian",
    species: "HORSE",
    healthTests: [
      { name: "CA", gene: "MUTYH", importance: "required", description: "Cerebellar Abiotrophy - neurological", prevalence: "~10% carrier rate" },
      { name: "SCID", gene: "PRKDC", importance: "required", description: "Severe Combined Immunodeficiency - fatal" },
      { name: "LFS", gene: "MYO18B", importance: "required", description: "Lavender Foal Syndrome - fatal" },
      { name: "OAAM", gene: "HOXD3", importance: "recommended", description: "Occipitoatlantoaxial Malformation" },
    ],
    coatStandards: [
      {
        trait: "Color",
        accepted: ["Bay", "Gray", "Chestnut", "Black", "Roan"],
        faults: ["White markings above knees/hocks (sabino)"],
      },
    ],
    geneticNotes: [
      "Sabino pattern exists but can be confused with rabicano",
      "Gray gene very common - most grays are heterozygous",
      "No cream dilution, champagne, or dun in purebreds",
    ],
  },
  {
    breed: "Paint Horse",
    species: "HORSE",
    aliases: ["APHA"],
    healthTests: [
      { name: "LWO", gene: "EDNRB", importance: "required", description: "Lethal White Overo - fatal in homozygotes" },
      { name: "HYPP", gene: "SCN4A", importance: "required", description: "Hyperkalemic Periodic Paralysis" },
      { name: "HERDA", gene: "PPIB", importance: "required", description: "Hereditary Equine Regional Dermal Asthenia" },
      { name: "GBED", gene: "GBE1", importance: "required", description: "Glycogen Branching Enzyme Deficiency" },
      { name: "PSSM1", gene: "GYS1", importance: "recommended", description: "Polysaccharide Storage Myopathy" },
    ],
    coatStandards: [
      {
        trait: "Pattern",
        accepted: ["Tobiano", "Overo (Frame, Sabino, Splash)", "Tovero"],
      },
    ],
    geneticNotes: [
      "Frame Overo x Frame Overo produces 25% lethal white foals",
      "Solid horses may carry frame overo - always test",
      "Tobiano is dominant - visible in heterozygotes",
    ],
  },
];

// Cat breed profiles
const CAT_PROFILES: BreedProfile[] = [
  {
    breed: "Maine Coon",
    species: "CAT",
    healthTests: [
      { name: "HCM", gene: "MYBPC3", importance: "required", description: "Hypertrophic Cardiomyopathy - heart disease", prevalence: "~30% carrier rate" },
      { name: "SMA", gene: "LIX1", importance: "required", description: "Spinal Muscular Atrophy" },
      { name: "PKD", gene: "PKD1", importance: "recommended", description: "Polycystic Kidney Disease" },
    ],
    coatStandards: [
      {
        trait: "Color",
        accepted: ["All colors except pointed", "All patterns including tabby, solid, tortie"],
        disqualifications: ["Pointed pattern (colorpoint)"],
      },
    ],
    geneticNotes: [
      "Annual echocardiogram recommended even for HCM clear cats",
      "Polydactyly is common but not accepted in show",
    ],
  },
  {
    breed: "Scottish Fold",
    species: "CAT",
    healthTests: [
      { name: "Fd", importance: "required", description: "Fold gene - causes cartilage issues in homozygotes" },
      { name: "PKD", gene: "PKD1", importance: "required", description: "Polycystic Kidney Disease" },
      { name: "HCM", gene: "MYBPC3", importance: "recommended", description: "Hypertrophic Cardiomyopathy" },
    ],
    coatStandards: [
      {
        trait: "Ears",
        accepted: ["Folded ears (heterozygous Fd)", "Straight ears (non-fold)"],
      },
    ],
    geneticNotes: [
      "NEVER breed Fold x Fold - produces severe osteochondrodysplasia",
      "All Scottish Folds should be bred to Straights only",
      "Even heterozygous Folds may develop arthritis",
    ],
  },
  {
    breed: "Bengal",
    species: "CAT",
    healthTests: [
      { name: "PK-Def", gene: "PKLR", importance: "required", description: "Pyruvate Kinase Deficiency - anemia" },
      { name: "PRA-b", gene: "TBD", importance: "required", description: "Progressive Retinal Atrophy - Bengal specific" },
      { name: "HCM", gene: "MYBPC3", importance: "recommended", description: "Hypertrophic Cardiomyopathy" },
    ],
    coatStandards: [
      {
        trait: "Pattern",
        accepted: ["Spotted", "Marble", "Rosetted"],
      },
      {
        trait: "Color",
        accepted: ["Brown", "Snow (Lynx, Mink, Sepia)", "Silver", "Blue", "Charcoal"],
      },
    ],
    geneticNotes: [
      "Glitter gene is desirable - gives coat sparkle",
      "Charcoal pattern involves Apb gene from Asian Leopard Cat",
      "Snow colors: Lynx (cs/cs), Mink (cb/cs), Sepia (cb/cb)",
    ],
  },
];

// Combine all profiles
const ALL_PROFILES: BreedProfile[] = [...DOG_PROFILES, ...HORSE_PROFILES, ...CAT_PROFILES];

// Helper to find a breed profile
function findBreedProfile(breed: string, species?: string): BreedProfile | undefined {
  const normalizedBreed = breed.toLowerCase().trim();
  return ALL_PROFILES.find(
    (p) =>
      (p.breed.toLowerCase() === normalizedBreed ||
        p.aliases?.some((a) => a.toLowerCase() === normalizedBreed)) &&
      (!species || p.species === species)
  );
}

// Helper to get profiles by species
function getProfilesBySpecies(species: string): BreedProfile[] {
  return ALL_PROFILES.filter((p) => p.species === species);
}

interface BreedGeneticProfileProps {
  breed: string;
  species: "DOG" | "CAT" | "HORSE";
  currentHealthTests?: Array<{ name: string; status: "clear" | "carrier" | "affected" | "unknown" }>;
  onTestClick?: (testName: string) => void;
  className?: string;
}

export default function BreedGeneticProfile({
  breed,
  species,
  currentHealthTests = [],
  onTestClick,
  className = "",
}: BreedGeneticProfileProps) {
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set(["health"]));

  const profile = React.useMemo(() => findBreedProfile(breed, species), [breed, species]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Get test status from current health tests
  const getTestStatus = (testName: string): "clear" | "carrier" | "affected" | "unknown" => {
    const test = currentHealthTests.find(
      (t) => t.name.toLowerCase().includes(testName.toLowerCase()) ||
             testName.toLowerCase().includes(t.name.toLowerCase())
    );
    return test?.status || "unknown";
  };

  const statusColors = {
    clear: "bg-green-500/10 text-green-600 border-green-500/30",
    carrier: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    affected: "bg-red-500/10 text-red-600 border-red-500/30",
    unknown: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  };

  const statusLabels = {
    clear: "Clear",
    carrier: "Carrier",
    affected: "Affected",
    unknown: "Not Tested",
  };

  if (!profile) {
    return (
      <div className={`rounded-xl border border-hairline bg-surface p-4 ${className}`}>
        <div className="text-center py-6">
          <Info className="w-10 h-10 mx-auto text-secondary mb-3" />
          <h3 className="font-medium mb-1">Breed Profile Not Found</h3>
          <p className="text-sm text-secondary">
            No specific genetic profile available for "{breed}".
          </p>
          <p className="text-xs text-secondary mt-2">
            General {species.toLowerCase()} health testing recommendations apply.
          </p>
        </div>
      </div>
    );
  }

  // Calculate testing completion
  const requiredTests = profile.healthTests.filter((t) => t.importance === "required");
  const testedRequired = requiredTests.filter((t) => getTestStatus(t.name) !== "unknown").length;
  const completionPercent = requiredTests.length > 0
    ? Math.round((testedRequired / requiredTests.length) * 100)
    : 0;

  return (
    <div className={`rounded-xl border border-hairline bg-surface ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-hairline">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold">{profile.breed}</h3>
            <p className="text-sm text-secondary">Breed-Specific Genetic Profile</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-accent">{completionPercent}%</div>
            <div className="text-xs text-secondary">Required Tests Complete</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 bg-hairline rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Health Tests Section */}
      <div className="border-b border-hairline">
        <button
          onClick={() => toggleSection("health")}
          className="w-full p-4 flex items-center justify-between hover:bg-surface-alt transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🧬</span>
            <span className="font-medium">Recommended Health Tests</span>
            <span className="text-xs text-secondary">({profile.healthTests.length})</span>
          </div>
          {expandedSections.has("health") ? (
            <ChevronUp className="w-5 h-5 text-secondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-secondary" />
          )}
        </button>

        {expandedSections.has("health") && (
          <div className="px-4 pb-4 space-y-2">
            {/* Required tests */}
            {requiredTests.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Required Tests
                </div>
                <div className="space-y-2">
                  {requiredTests.map((test, idx) => {
                    const status = getTestStatus(test.name);
                    return (
                      <div
                        key={idx}
                        onClick={() => onTestClick?.(test.name)}
                        className={`
                          p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm
                          ${statusColors[status]}
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm flex items-center gap-2">
                              {test.name}
                              {test.gene && (
                                <span className="text-xs font-mono text-secondary">({test.gene})</span>
                              )}
                            </div>
                            <div className="text-xs text-secondary mt-0.5">{test.description}</div>
                            {test.prevalence && (
                              <div className="text-xs text-secondary mt-1 italic">{test.prevalence}</div>
                            )}
                          </div>
                          <div className={`text-xs font-medium px-2 py-1 rounded border ${statusColors[status]}`}>
                            {statusLabels[status]}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommended tests */}
            {profile.healthTests.filter((t) => t.importance === "recommended").length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-2">
                  Recommended Tests
                </div>
                <div className="space-y-2">
                  {profile.healthTests
                    .filter((t) => t.importance === "recommended")
                    .map((test, idx) => {
                      const status = getTestStatus(test.name);
                      return (
                        <div
                          key={idx}
                          onClick={() => onTestClick?.(test.name)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${statusColors[status]}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{test.name}</div>
                              <div className="text-xs text-secondary mt-0.5">{test.description}</div>
                            </div>
                            <div className={`text-xs font-medium px-2 py-1 rounded border ${statusColors[status]}`}>
                              {statusLabels[status]}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Optional tests */}
            {profile.healthTests.filter((t) => t.importance === "optional").length > 0 && (
              <div>
                <div className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">
                  Optional Tests
                </div>
                <div className="space-y-2">
                  {profile.healthTests
                    .filter((t) => t.importance === "optional")
                    .map((test, idx) => {
                      const status = getTestStatus(test.name);
                      return (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg border text-sm ${statusColors[status]}`}
                        >
                          <span className="font-medium">{test.name}</span>
                          <span className="text-secondary ml-2">- {test.description}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Coat Standards Section */}
      {profile.coatStandards && profile.coatStandards.length > 0 && (
        <div className="border-b border-hairline">
          <button
            onClick={() => toggleSection("coat")}
            className="w-full p-4 flex items-center justify-between hover:bg-surface-alt transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🎨</span>
              <span className="font-medium">Breed Standard Colors</span>
            </div>
            {expandedSections.has("coat") ? (
              <ChevronUp className="w-5 h-5 text-secondary" />
            ) : (
              <ChevronDown className="w-5 h-5 text-secondary" />
            )}
          </button>

          {expandedSections.has("coat") && (
            <div className="px-4 pb-4 space-y-3">
              {profile.coatStandards.map((standard, idx) => (
                <div key={idx} className="p-3 bg-surface-alt rounded-lg">
                  <div className="font-medium text-sm mb-2">{standard.trait}</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-secondary">Accepted: </span>
                        {standard.accepted.join(", ")}
                      </div>
                    </div>
                    {standard.faults && standard.faults.length > 0 && (
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-secondary">Faults: </span>
                          {standard.faults.join(", ")}
                        </div>
                      </div>
                    )}
                    {standard.disqualifications && standard.disqualifications.length > 0 && (
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-secondary">DQ: </span>
                          {standard.disqualifications.join(", ")}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Genetic Notes Section */}
      {profile.geneticNotes && profile.geneticNotes.length > 0 && (
        <div className="border-b border-hairline">
          <button
            onClick={() => toggleSection("notes")}
            className="w-full p-4 flex items-center justify-between hover:bg-surface-alt transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📝</span>
              <span className="font-medium">Breeding Notes</span>
            </div>
            {expandedSections.has("notes") ? (
              <ChevronUp className="w-5 h-5 text-secondary" />
            ) : (
              <ChevronDown className="w-5 h-5 text-secondary" />
            )}
          </button>

          {expandedSections.has("notes") && (
            <div className="px-4 pb-4">
              <ul className="space-y-2">
                {profile.geneticNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Resources Section */}
      {profile.resources && profile.resources.length > 0 && (
        <div className="p-4">
          <div className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">
            Resources
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.resources.map((resource, idx) => (
              <a
                key={idx}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                {resource.name}
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Export helper functions for use elsewhere
 */
export { findBreedProfile, getProfilesBySpecies, ALL_PROFILES };
export type { BreedProfile, HealthTestRecommendation, CoatStandard };
