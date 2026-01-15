// packages/api/src/types/coat-colors.ts
// Coat color definitions for different species - used in offspring and animal forms

export type CoatColorCategory = "base" | "pattern" | "horse" | "cat";

export type CoatColorDefinition = {
  id: string;           // Unique identifier (e.g., "black", "merle")
  name: string;         // Display name (e.g., "Black", "Merle")
  description: string;  // Brief description of the color/pattern
  css: string;          // CSS gradient or color value for swatch
  category: CoatColorCategory;
  species: ("DOG" | "CAT" | "HORSE" | "GOAT" | "RABBIT" | "CHICKEN")[]; // Which species this color applies to
  genotypes?: string[]; // Related genotypes (optional, for reference)
  sortOrder: number;    // Display order in UI
};

// ============================================================================
// BASE COLORS - Apply to most species
// ============================================================================

const BASE_COLORS: CoatColorDefinition[] = [
  {
    id: "black",
    name: "Black",
    description: "Solid black pigmentation",
    css: "linear-gradient(135deg, #1a1a1a 0%, #333333 50%, #1a1a1a 100%)",
    category: "base",
    species: ["DOG", "CAT", "HORSE", "GOAT", "RABBIT"],
    genotypes: ["E/E K/K", "E/e K/K", "E/E K/k", "B/B"],
    sortOrder: 0,
  },
  {
    id: "liver",
    name: "Liver/Chocolate",
    description: "Brown pigmentation (diluted black)",
    css: "linear-gradient(135deg, #5c3d2e 0%, #8b5a2b 50%, #5c3d2e 100%)",
    category: "base",
    species: ["DOG", "CAT", "HORSE", "GOAT", "RABBIT"],
    genotypes: ["b/b"],
    sortOrder: 1,
  },
  {
    id: "blue",
    name: "Blue/Gray",
    description: "Diluted black pigmentation",
    css: "linear-gradient(135deg, #4a5568 0%, #718096 50%, #4a5568 100%)",
    category: "base",
    species: ["DOG", "CAT", "HORSE", "GOAT", "RABBIT"],
    genotypes: ["d/d B/-", "d/d"],
    sortOrder: 2,
  },
  {
    id: "isabella",
    name: "Isabella/Lilac",
    description: "Diluted liver/chocolate",
    css: "linear-gradient(135deg, #a08090 0%, #c0a0b0 50%, #a08090 100%)",
    category: "base",
    species: ["DOG", "CAT", "RABBIT"],
    genotypes: ["d/d b/b"],
    sortOrder: 3,
  },
  {
    id: "red",
    name: "Red/Yellow",
    description: "Phaeomelanin (red/yellow pigment)",
    css: "linear-gradient(135deg, #c4763c 0%, #e8a060 50%, #c4763c 100%)",
    category: "base",
    species: ["DOG", "CAT", "HORSE", "GOAT", "RABBIT"],
    genotypes: ["e/e"],
    sortOrder: 4,
  },
  {
    id: "cream",
    name: "Cream",
    description: "Diluted red/yellow",
    css: "linear-gradient(135deg, #f5deb3 0%, #fff8dc 50%, #f5deb3 100%)",
    category: "base",
    species: ["DOG", "CAT", "HORSE", "RABBIT"],
    genotypes: ["e/e I/I"],
    sortOrder: 5,
  },
  {
    id: "fawn",
    name: "Fawn",
    description: "Light tan/beige color",
    css: "linear-gradient(135deg, #d4a574 0%, #e8c89e 50%, #d4a574 100%)",
    category: "base",
    species: ["DOG", "CAT", "GOAT", "RABBIT"],
    genotypes: ["A/at", "A/a", "Ay/Ay", "Ay/a"],
    sortOrder: 6,
  },
  {
    id: "white",
    name: "White",
    description: "Absence of pigment",
    css: "linear-gradient(135deg, #f8f8f8 0%, #ffffff 50%, #f8f8f8 100%)",
    category: "base",
    species: ["DOG", "CAT", "HORSE", "GOAT", "RABBIT", "CHICKEN"],
    genotypes: ["S/S", "e/e I/I (extreme)"],
    sortOrder: 7,
  },
];

// ============================================================================
// PATTERN COLORS - General patterns (mostly dogs, some apply to cats/others)
// ============================================================================

const PATTERN_COLORS: CoatColorDefinition[] = [
  {
    id: "solid",
    name: "Solid",
    description: "Uniform color without markings",
    css: "linear-gradient(135deg, #2d2d2d 0%, #4a4a4a 50%, #2d2d2d 100%)",
    category: "pattern",
    species: ["DOG", "CAT", "HORSE", "GOAT", "RABBIT"],
    genotypes: ["K/K", "K/k"],
    sortOrder: 10,
  },
  {
    id: "brindle",
    name: "Brindle",
    description: "Tiger-stripe pattern",
    css: "repeating-linear-gradient(60deg, #5c3d2e 0px, #5c3d2e 4px, #1a1a1a 4px, #1a1a1a 8px)",
    category: "pattern",
    species: ["DOG", "HORSE"],
    genotypes: ["k(br)/k(br)", "k(br)/k", "kbr/kbr", "kbr/k"],
    sortOrder: 11,
  },
  {
    id: "merle",
    name: "Merle",
    description: "Mottled patches of color",
    css: "radial-gradient(ellipse at 20% 30%, #4a5568 20%, transparent 40%), radial-gradient(ellipse at 70% 60%, #4a5568 15%, transparent 35%), radial-gradient(ellipse at 40% 80%, #4a5568 10%, transparent 30%), linear-gradient(135deg, #1a1a1a 0%, #333333 100%)",
    category: "pattern",
    species: ["DOG"],
    genotypes: ["M/m"],
    sortOrder: 12,
  },
  {
    id: "doubleMerle",
    name: "Double Merle",
    description: "High white, vision/hearing concerns",
    css: "radial-gradient(ellipse at 30% 30%, #4a5568 10%, transparent 25%), radial-gradient(ellipse at 70% 70%, #4a5568 8%, transparent 20%), linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)",
    category: "pattern",
    species: ["DOG"],
    genotypes: ["M/M"],
    sortOrder: 13,
  },
  {
    id: "tanPoints",
    name: "Tan Points",
    description: "Black with tan markings",
    css: "radial-gradient(ellipse at 50% 20%, #c4763c 15%, transparent 25%), radial-gradient(ellipse at 30% 70%, #c4763c 20%, transparent 30%), radial-gradient(ellipse at 70% 70%, #c4763c 20%, transparent 30%), linear-gradient(135deg, #1a1a1a 0%, #333333 100%)",
    category: "pattern",
    species: ["DOG"],
    genotypes: ["at/at", "at/a"],
    sortOrder: 14,
  },
  {
    id: "sable",
    name: "Sable/Fawn",
    description: "Red/fawn with black-tipped hairs",
    css: "linear-gradient(180deg, #1a1a1a 0%, #8b5a2b 20%, #c4763c 50%, #e8a060 80%, #c4763c 100%)",
    category: "pattern",
    species: ["DOG"],
    genotypes: ["A/A", "A/at", "A/a", "Ay/Ay", "Ay/at"],
    sortOrder: 15,
  },
  {
    id: "agouti",
    name: "Agouti/Wolf Gray",
    description: "Banded hairs creating gray appearance",
    css: "linear-gradient(180deg, #1a1a1a 0%, #5c5c5c 15%, #a0a0a0 30%, #5c5c5c 45%, #1a1a1a 60%, #5c5c5c 75%, #a0a0a0 90%, #5c5c5c 100%)",
    category: "pattern",
    species: ["DOG", "RABBIT"],
    genotypes: ["aw/aw"],
    sortOrder: 16,
  },
  {
    id: "piebald",
    name: "Piebald/Parti",
    description: "White with colored patches",
    css: "radial-gradient(ellipse at 20% 20%, #1a1a1a 25%, transparent 40%), radial-gradient(ellipse at 80% 40%, #1a1a1a 20%, transparent 35%), radial-gradient(ellipse at 30% 80%, #1a1a1a 15%, transparent 30%), linear-gradient(135deg, #f8f8f8 0%, #ffffff 100%)",
    category: "pattern",
    species: ["DOG"],
    genotypes: ["sp/sp", "S/sp"],
    sortOrder: 17,
  },
  {
    id: "tuxedo",
    name: "Tuxedo",
    description: "Dark with white chest/paws",
    css: "radial-gradient(ellipse at 50% 65%, #ffffff 25%, transparent 40%), radial-gradient(ellipse at 35% 90%, #ffffff 15%, transparent 25%), radial-gradient(ellipse at 65% 90%, #ffffff 15%, transparent 25%), linear-gradient(135deg, #1a1a1a 0%, #333333 100%)",
    category: "pattern",
    species: ["DOG", "CAT"],
    genotypes: ["S/s"],
    sortOrder: 18,
  },
  {
    id: "harlequin",
    name: "Harlequin",
    description: "White with black torn patches",
    css: "radial-gradient(ellipse at 15% 25%, #1a1a1a 18%, transparent 25%), radial-gradient(ellipse at 55% 35%, #1a1a1a 22%, transparent 32%), radial-gradient(ellipse at 85% 55%, #1a1a1a 15%, transparent 25%), radial-gradient(ellipse at 35% 75%, #1a1a1a 20%, transparent 30%), linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%)",
    category: "pattern",
    species: ["DOG"],
    genotypes: ["H/h M/m"],
    sortOrder: 19,
  },
  {
    id: "roan",
    name: "Roan",
    description: "White hairs mixed with colored",
    css: "repeating-linear-gradient(90deg, #1a1a1a 0px, #1a1a1a 1px, #ffffff 1px, #ffffff 2px)",
    category: "pattern",
    species: ["DOG", "HORSE"],
    genotypes: ["R/r", "R/R"],
    sortOrder: 20,
  },
  {
    id: "ticking",
    name: "Ticking",
    description: "Colored flecks on white areas",
    css: "radial-gradient(circle at 10% 10%, #1a1a1a 2px, transparent 2px), radial-gradient(circle at 30% 20%, #1a1a1a 1px, transparent 1px), radial-gradient(circle at 50% 15%, #1a1a1a 2px, transparent 2px), radial-gradient(circle at 70% 25%, #1a1a1a 1px, transparent 1px), radial-gradient(circle at 20% 40%, #1a1a1a 2px, transparent 2px), radial-gradient(circle at 40% 35%, #1a1a1a 1px, transparent 1px), radial-gradient(circle at 60% 45%, #1a1a1a 2px, transparent 2px), radial-gradient(circle at 80% 50%, #1a1a1a 1px, transparent 1px), linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%)",
    category: "pattern",
    species: ["DOG"],
    genotypes: ["T/T", "T/t"],
    sortOrder: 21,
  },
];

// ============================================================================
// HORSE-SPECIFIC COLORS/PATTERNS
// ============================================================================

const HORSE_COLORS: CoatColorDefinition[] = [
  {
    id: "bay",
    name: "Bay",
    description: "Brown body with black points",
    css: "linear-gradient(180deg, #1a1a1a 0%, #1a1a1a 15%, #8b4513 25%, #a0522d 50%, #8b4513 75%, #1a1a1a 85%, #1a1a1a 100%)",
    category: "horse",
    species: ["HORSE"],
    genotypes: ["E/E A/A", "E/e A/A"],
    sortOrder: 30,
  },
  {
    id: "chestnut",
    name: "Chestnut",
    description: "Reddish-brown with matching mane/tail",
    css: "linear-gradient(135deg, #8b4513 0%, #cd853f 50%, #8b4513 100%)",
    category: "horse",
    species: ["HORSE"],
    genotypes: ["e/e"],
    sortOrder: 31,
  },
  {
    id: "tobiano",
    name: "Tobiano",
    description: "White crossing the back, dark head",
    css: "radial-gradient(ellipse at 20% 30%, #1a1a1a 30%, transparent 45%), radial-gradient(ellipse at 75% 25%, #1a1a1a 25%, transparent 40%), linear-gradient(180deg, #ffffff 40%, #1a1a1a 40%, #1a1a1a 60%, #ffffff 60%)",
    category: "horse",
    species: ["HORSE"],
    genotypes: ["TO/to", "TO/TO"],
    sortOrder: 32,
  },
  {
    id: "overo",
    name: "Frame Overo",
    description: "Horizontal white patches, colored back",
    css: "radial-gradient(ellipse at 40% 50%, #ffffff 25%, transparent 45%), radial-gradient(ellipse at 70% 45%, #ffffff 20%, transparent 35%), linear-gradient(135deg, #1a1a1a 0%, #333333 100%)",
    category: "horse",
    species: ["HORSE"],
    genotypes: ["O/o"],
    sortOrder: 33,
  },
  {
    id: "appaloosa",
    name: "Appaloosa/Leopard",
    description: "Spotted pattern over white base",
    css: "radial-gradient(circle at 15% 20%, #1a1a1a 5%, transparent 8%), radial-gradient(circle at 35% 15%, #1a1a1a 4%, transparent 7%), radial-gradient(circle at 55% 25%, #1a1a1a 6%, transparent 9%), radial-gradient(circle at 75% 18%, #1a1a1a 3%, transparent 6%), radial-gradient(circle at 25% 45%, #1a1a1a 5%, transparent 8%), radial-gradient(circle at 45% 40%, #1a1a1a 4%, transparent 7%), radial-gradient(circle at 65% 50%, #1a1a1a 6%, transparent 9%), linear-gradient(135deg, #f8f8f8 0%, #ffffff 100%)",
    category: "horse",
    species: ["HORSE"],
    genotypes: ["LP/LP", "LP/lp"],
    sortOrder: 34,
  },
  {
    id: "palomino",
    name: "Palomino",
    description: "Golden body with white mane/tail",
    css: "linear-gradient(135deg, #d4a94c 0%, #f0c966 50%, #d4a94c 100%)",
    category: "horse",
    species: ["HORSE"],
    genotypes: ["Cr/cr e/e"],
    sortOrder: 35,
  },
  {
    id: "buckskin",
    name: "Buckskin",
    description: "Golden body with black points",
    css: "linear-gradient(180deg, #1a1a1a 0%, #1a1a1a 15%, #d4a94c 25%, #f0c966 50%, #d4a94c 75%, #1a1a1a 85%, #1a1a1a 100%)",
    category: "horse",
    species: ["HORSE"],
    genotypes: ["Cr/cr A/-"],
    sortOrder: 36,
  },
  {
    id: "cremello",
    name: "Cremello/Perlino",
    description: "Double cream dilution - very pale",
    css: "linear-gradient(135deg, #f5f0e6 0%, #fffaf0 50%, #f5f0e6 100%)",
    category: "horse",
    species: ["HORSE"],
    genotypes: ["Cr/Cr"],
    sortOrder: 37,
  },
  {
    id: "dun",
    name: "Dun",
    description: "Diluted body with primitive markings",
    css: "linear-gradient(180deg, #1a1a1a 0%, #8b7355 20%, #c4a882 50%, #8b7355 80%, #1a1a1a 100%)",
    category: "horse",
    species: ["HORSE"],
    genotypes: ["D/d", "D/D"],
    sortOrder: 38,
  },
  {
    id: "grayHorse",
    name: "Gray",
    description: "Born colored, progressively whitens",
    css: "linear-gradient(135deg, #a0a0a0 0%, #d0d0d0 30%, #ffffff 70%, #e8e8e8 100%)",
    category: "horse",
    species: ["HORSE"],
    genotypes: ["G/g", "G/G"],
    sortOrder: 39,
  },
];

// ============================================================================
// CAT-SPECIFIC COLORS/PATTERNS
// ============================================================================

const CAT_COLORS: CoatColorDefinition[] = [
  {
    id: "tabby",
    name: "Tabby",
    description: "Striped pattern with M on forehead",
    css: "repeating-linear-gradient(75deg, #8b5a2b 0px, #8b5a2b 6px, #1a1a1a 6px, #1a1a1a 10px)",
    category: "cat",
    species: ["CAT"],
    genotypes: ["Ta/Ta", "Ta/ta (mackerel)", "tb/tb (classic)"],
    sortOrder: 40,
  },
  {
    id: "colorpoint",
    name: "Colorpoint (Siamese)",
    description: "Light body with dark extremities",
    css: "radial-gradient(ellipse at 50% 50%, #f5deb3 40%, #5c3d2e 80%)",
    category: "cat",
    species: ["CAT"],
    genotypes: ["cs/cs"],
    sortOrder: 41,
  },
  {
    id: "tortoiseshell",
    name: "Tortoiseshell",
    description: "Mixed black and orange patches",
    css: "radial-gradient(ellipse at 25% 30%, #c4763c 20%, transparent 35%), radial-gradient(ellipse at 65% 45%, #1a1a1a 25%, transparent 40%), radial-gradient(ellipse at 35% 70%, #1a1a1a 20%, transparent 35%), radial-gradient(ellipse at 75% 80%, #c4763c 15%, transparent 30%), linear-gradient(135deg, #c4763c 0%, #1a1a1a 100%)",
    category: "cat",
    species: ["CAT"],
    genotypes: ["O/o (female X-linked)"],
    sortOrder: 42,
  },
  {
    id: "calico",
    name: "Calico",
    description: "Tortoiseshell with white patches",
    css: "radial-gradient(ellipse at 20% 25%, #c4763c 18%, transparent 30%), radial-gradient(ellipse at 55% 35%, #1a1a1a 22%, transparent 35%), radial-gradient(ellipse at 80% 70%, #c4763c 15%, transparent 28%), radial-gradient(ellipse at 35% 65%, #ffffff 25%, transparent 40%), radial-gradient(ellipse at 70% 45%, #ffffff 20%, transparent 35%), linear-gradient(135deg, #f8f8f8 0%, #ffffff 100%)",
    category: "cat",
    species: ["CAT"],
    genotypes: ["O/o S/s (female)"],
    sortOrder: 43,
  },
];

// ============================================================================
// CHICKEN-SPECIFIC COLORS
// ============================================================================

const CHICKEN_COLORS: CoatColorDefinition[] = [
  {
    id: "barred",
    name: "Barred",
    description: "Alternating dark and light bars",
    css: "repeating-linear-gradient(0deg, #1a1a1a 0px, #1a1a1a 4px, #a0a0a0 4px, #a0a0a0 8px)",
    category: "pattern",
    species: ["CHICKEN"],
    sortOrder: 50,
  },
  {
    id: "buff",
    name: "Buff",
    description: "Golden/tan feathers",
    css: "linear-gradient(135deg, #d4a574 0%, #e8c89e 50%, #d4a574 100%)",
    category: "base",
    species: ["CHICKEN"],
    sortOrder: 51,
  },
  {
    id: "silver",
    name: "Silver",
    description: "Silver/white base with dark markings",
    css: "linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 50%, #c0c0c0 100%)",
    category: "base",
    species: ["CHICKEN"],
    sortOrder: 52,
  },
  {
    id: "golden",
    name: "Golden",
    description: "Rich golden/red feathers",
    css: "linear-gradient(135deg, #b8860b 0%, #daa520 50%, #b8860b 100%)",
    category: "base",
    species: ["CHICKEN"],
    sortOrder: 53,
  },
  {
    id: "partridge",
    name: "Partridge",
    description: "Complex pattern with penciling",
    css: "repeating-linear-gradient(45deg, #8b4513 0px, #8b4513 3px, #1a1a1a 3px, #1a1a1a 6px)",
    category: "pattern",
    species: ["CHICKEN"],
    sortOrder: 54,
  },
  {
    id: "laced",
    name: "Laced",
    description: "Contrasting edge on each feather",
    css: "radial-gradient(ellipse at 50% 50%, #d4a574 60%, #1a1a1a 70%, #1a1a1a 100%)",
    category: "pattern",
    species: ["CHICKEN"],
    sortOrder: 55,
  },
  {
    id: "mottled",
    name: "Mottled",
    description: "Black with white tips",
    css: "radial-gradient(circle at 20% 20%, #ffffff 10%, transparent 15%), radial-gradient(circle at 60% 30%, #ffffff 8%, transparent 12%), radial-gradient(circle at 40% 60%, #ffffff 12%, transparent 18%), radial-gradient(circle at 80% 70%, #ffffff 6%, transparent 10%), linear-gradient(135deg, #1a1a1a 0%, #333333 100%)",
    category: "pattern",
    species: ["CHICKEN"],
    sortOrder: 56,
  },
];

// ============================================================================
// COMBINED EXPORTS
// ============================================================================

/** All coat color definitions */
export const ALL_COAT_COLORS: CoatColorDefinition[] = [
  ...BASE_COLORS,
  ...PATTERN_COLORS,
  ...HORSE_COLORS,
  ...CAT_COLORS,
  ...CHICKEN_COLORS,
];

/** Get coat colors for a specific species */
export function getCoatColorsForSpecies(species: string): CoatColorDefinition[] {
  const speciesUpper = species.toUpperCase();
  return ALL_COAT_COLORS
    .filter(c => c.species.includes(speciesUpper as any))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Get coat colors grouped by category for a species */
export function getCoatColorsByCategory(species: string): Record<CoatColorCategory, CoatColorDefinition[]> {
  const colors = getCoatColorsForSpecies(species);
  return {
    base: colors.filter(c => c.category === "base"),
    pattern: colors.filter(c => c.category === "pattern"),
    horse: colors.filter(c => c.category === "horse"),
    cat: colors.filter(c => c.category === "cat"),
  };
}

/** Find a coat color by ID */
export function findCoatColorById(id: string): CoatColorDefinition | undefined {
  return ALL_COAT_COLORS.find(c => c.id === id);
}

/** Find a coat color by name (case-insensitive) */
export function findCoatColorByName(name: string): CoatColorDefinition | undefined {
  const nameLower = name.toLowerCase().trim();
  return ALL_COAT_COLORS.find(c => c.name.toLowerCase() === nameLower || c.id === nameLower);
}
