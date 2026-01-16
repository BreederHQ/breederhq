// apps/breeding/src/components/CoatColorPreview.tsx
import * as React from "react";
import { Tooltip } from "@bhq/ui";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

/**
 * Color definitions for different species and coat color genetics.
 * These use CSS gradients and colors to approximate actual coat appearances.
 */

type Species = "DOG" | "CAT" | "HORSE" | "GOAT" | "RABBIT";

type ColorDefinition = {
  name: string;
  description: string;
  css: string; // CSS gradient or color value
  genotypes?: string[]; // Related genotypes
};

// Base coat colors (applies to most species)
const BASE_COLORS: Record<string, ColorDefinition> = {
  // Black-based colors
  black: {
    name: "Black",
    description: "Solid black pigmentation",
    css: "linear-gradient(135deg, #1a1a1a 0%, #333333 50%, #1a1a1a 100%)",
    genotypes: ["E/E K/K", "E/e K/K", "E/E K/k", "B/B", "E/E", "E/e"],
  },
  liver: {
    name: "Liver/Chocolate",
    description: "Brown pigmentation (diluted black)",
    css: "linear-gradient(135deg, #5c3d2e 0%, #8b5a2b 50%, #5c3d2e 100%)",
    genotypes: ["b/b"],
  },
  blue: {
    name: "Blue/Gray",
    description: "Diluted black pigmentation",
    css: "linear-gradient(135deg, #4a5568 0%, #718096 50%, #4a5568 100%)",
    genotypes: ["d/d B/-", "d/d"],
  },
  isabella: {
    name: "Isabella/Lilac",
    description: "Diluted liver/chocolate",
    css: "linear-gradient(135deg, #a08090 0%, #c0a0b0 50%, #a08090 100%)",
    genotypes: ["d/d b/b"],
  },
  // Red/Yellow based colors
  red: {
    name: "Red/Yellow",
    description: "Phaeomelanin (red/yellow pigment)",
    css: "linear-gradient(135deg, #c4763c 0%, #e8a060 50%, #c4763c 100%)",
    genotypes: ["e/e"],
  },
  cream: {
    name: "Cream",
    description: "Diluted red/yellow",
    css: "linear-gradient(135deg, #f5deb3 0%, #fff8dc 50%, #f5deb3 100%)",
    genotypes: ["e/e I/I"],
  },
  fawn: {
    name: "Fawn",
    description: "Light tan/beige color",
    css: "linear-gradient(135deg, #d4a574 0%, #e8c89e 50%, #d4a574 100%)",
    genotypes: ["A/at", "A/a", "Ay/Ay", "Ay/a"],
  },
  // White
  white: {
    name: "White",
    description: "Absence of pigment",
    css: "linear-gradient(135deg, #f8f8f8 0%, #ffffff 50%, #f8f8f8 100%)",
    genotypes: ["S/S", "e/e I/I (extreme)"],
  },
};

// Pattern definitions
const PATTERNS: Record<string, ColorDefinition> = {
  solid: {
    name: "Solid",
    description: "Uniform color without markings",
    css: "linear-gradient(135deg, #2d2d2d 0%, #4a4a4a 50%, #2d2d2d 100%)",
    genotypes: ["K/K", "K/k"],
  },
  brindle: {
    name: "Brindle",
    description: "Tiger-stripe pattern",
    css: `repeating-linear-gradient(
      60deg,
      #5c3d2e 0px,
      #5c3d2e 4px,
      #1a1a1a 4px,
      #1a1a1a 8px
    )`,
    genotypes: ["k(br)/k(br)", "k(br)/k", "kbr/kbr", "kbr/k"],
  },
  merle: {
    name: "Merle",
    description: "Mottled patches of color",
    css: `radial-gradient(ellipse at 20% 30%, #4a5568 20%, transparent 40%),
          radial-gradient(ellipse at 70% 60%, #4a5568 15%, transparent 35%),
          radial-gradient(ellipse at 40% 80%, #4a5568 10%, transparent 30%),
          linear-gradient(135deg, #1a1a1a 0%, #333333 100%)`,
    genotypes: ["M/m"],
  },
  doubleMerle: {
    name: "Double Merle",
    description: "High white, often with vision/hearing issues",
    css: `radial-gradient(ellipse at 30% 30%, #4a5568 10%, transparent 25%),
          radial-gradient(ellipse at 70% 70%, #4a5568 8%, transparent 20%),
          linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)`,
    genotypes: ["M/M"],
  },
  tanPoints: {
    name: "Tan Points",
    description: "Black with tan markings (eyebrows, chest, legs)",
    css: `radial-gradient(ellipse at 50% 20%, #c4763c 15%, transparent 25%),
          radial-gradient(ellipse at 30% 70%, #c4763c 20%, transparent 30%),
          radial-gradient(ellipse at 70% 70%, #c4763c 20%, transparent 30%),
          linear-gradient(135deg, #1a1a1a 0%, #333333 100%)`,
    genotypes: ["at/at", "at/a"],
  },
  sable: {
    name: "Sable/Fawn",
    description: "Red/fawn with black-tipped hairs",
    css: `linear-gradient(180deg,
          #1a1a1a 0%,
          #8b5a2b 20%,
          #c4763c 50%,
          #e8a060 80%,
          #c4763c 100%)`,
    genotypes: ["A/A", "A/at", "A/a", "Ay/Ay", "Ay/at"],
  },
  agouti: {
    name: "Agouti/Wolf Gray",
    description: "Banded hairs creating gray/wolf appearance",
    css: `linear-gradient(180deg,
          #1a1a1a 0%,
          #5c5c5c 15%,
          #a0a0a0 30%,
          #5c5c5c 45%,
          #1a1a1a 60%,
          #5c5c5c 75%,
          #a0a0a0 90%,
          #5c5c5c 100%)`,
    genotypes: ["aw/aw"],
  },
  piebald: {
    name: "Piebald/Parti",
    description: "White with colored patches",
    css: `radial-gradient(ellipse at 20% 20%, #1a1a1a 25%, transparent 40%),
          radial-gradient(ellipse at 80% 40%, #1a1a1a 20%, transparent 35%),
          radial-gradient(ellipse at 30% 80%, #1a1a1a 15%, transparent 30%),
          linear-gradient(135deg, #f8f8f8 0%, #ffffff 100%)`,
    genotypes: ["sp/sp", "S/sp"],
  },
  tuxedo: {
    name: "Tuxedo",
    description: "Black with white chest/paws",
    css: `radial-gradient(ellipse at 50% 65%, #ffffff 25%, transparent 40%),
          radial-gradient(ellipse at 35% 90%, #ffffff 15%, transparent 25%),
          radial-gradient(ellipse at 65% 90%, #ffffff 15%, transparent 25%),
          linear-gradient(135deg, #1a1a1a 0%, #333333 100%)`,
    genotypes: ["S/s"],
  },
  harlequin: {
    name: "Harlequin",
    description: "White with black torn patches",
    css: `radial-gradient(ellipse at 15% 25%, #1a1a1a 18%, transparent 25%),
          radial-gradient(ellipse at 55% 35%, #1a1a1a 22%, transparent 32%),
          radial-gradient(ellipse at 85% 55%, #1a1a1a 15%, transparent 25%),
          radial-gradient(ellipse at 35% 75%, #1a1a1a 20%, transparent 30%),
          linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%)`,
    genotypes: ["H/h M/m"],
  },
  roan: {
    name: "Roan",
    description: "White hairs mixed with colored",
    css: `repeating-linear-gradient(
      90deg,
      #1a1a1a 0px,
      #1a1a1a 1px,
      #ffffff 1px,
      #ffffff 2px
    )`,
    genotypes: ["R/r", "R/R"],
  },
  ticking: {
    name: "Ticking",
    description: "Colored flecks on white areas",
    css: `radial-gradient(circle at 10% 10%, #1a1a1a 2px, transparent 2px),
          radial-gradient(circle at 30% 20%, #1a1a1a 1px, transparent 1px),
          radial-gradient(circle at 50% 15%, #1a1a1a 2px, transparent 2px),
          radial-gradient(circle at 70% 25%, #1a1a1a 1px, transparent 1px),
          radial-gradient(circle at 20% 40%, #1a1a1a 2px, transparent 2px),
          radial-gradient(circle at 40% 35%, #1a1a1a 1px, transparent 1px),
          radial-gradient(circle at 60% 45%, #1a1a1a 2px, transparent 2px),
          radial-gradient(circle at 80% 50%, #1a1a1a 1px, transparent 1px),
          radial-gradient(circle at 15% 60%, #1a1a1a 1px, transparent 1px),
          radial-gradient(circle at 35% 70%, #1a1a1a 2px, transparent 2px),
          radial-gradient(circle at 55% 65%, #1a1a1a 1px, transparent 1px),
          radial-gradient(circle at 75% 75%, #1a1a1a 2px, transparent 2px),
          radial-gradient(circle at 25% 85%, #1a1a1a 1px, transparent 1px),
          radial-gradient(circle at 45% 90%, #1a1a1a 2px, transparent 2px),
          radial-gradient(circle at 65% 80%, #1a1a1a 1px, transparent 1px),
          radial-gradient(circle at 85% 95%, #1a1a1a 2px, transparent 2px),
          linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%)`,
    genotypes: ["T/T", "T/t"],
  },
};

// Horse-specific patterns
const HORSE_PATTERNS: Record<string, ColorDefinition> = {
  tobiano: {
    name: "Tobiano",
    description: "White crossing the back, dark head",
    css: `radial-gradient(ellipse at 20% 30%, #1a1a1a 30%, transparent 45%),
          radial-gradient(ellipse at 75% 25%, #1a1a1a 25%, transparent 40%),
          linear-gradient(180deg, #ffffff 40%, #1a1a1a 40%, #1a1a1a 60%, #ffffff 60%)`,
    genotypes: ["TO/to", "TO/TO"],
  },
  overo: {
    name: "Frame Overo",
    description: "Horizontal white patches, colored back",
    css: `radial-gradient(ellipse at 40% 50%, #ffffff 25%, transparent 45%),
          radial-gradient(ellipse at 70% 45%, #ffffff 20%, transparent 35%),
          linear-gradient(135deg, #1a1a1a 0%, #333333 100%)`,
    genotypes: ["O/o"],
  },
  lethalWhite: {
    name: "Lethal White Overo",
    description: "Homozygous overo - fatal condition",
    css: "linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%)",
    genotypes: ["O/O"],
  },
  appaloosa: {
    name: "Appaloosa/Leopard",
    description: "Spotted pattern over white base",
    css: `radial-gradient(circle at 15% 20%, #1a1a1a 5%, transparent 8%),
          radial-gradient(circle at 35% 15%, #1a1a1a 4%, transparent 7%),
          radial-gradient(circle at 55% 25%, #1a1a1a 6%, transparent 9%),
          radial-gradient(circle at 75% 18%, #1a1a1a 3%, transparent 6%),
          radial-gradient(circle at 25% 45%, #1a1a1a 5%, transparent 8%),
          radial-gradient(circle at 45% 40%, #1a1a1a 4%, transparent 7%),
          radial-gradient(circle at 65% 50%, #1a1a1a 6%, transparent 9%),
          radial-gradient(circle at 85% 42%, #1a1a1a 3%, transparent 6%),
          radial-gradient(circle at 20% 70%, #1a1a1a 4%, transparent 7%),
          radial-gradient(circle at 40% 65%, #1a1a1a 5%, transparent 8%),
          radial-gradient(circle at 60% 75%, #1a1a1a 4%, transparent 7%),
          radial-gradient(circle at 80% 68%, #1a1a1a 5%, transparent 8%),
          linear-gradient(135deg, #f8f8f8 0%, #ffffff 100%)`,
    genotypes: ["LP/LP", "LP/lp"],
  },
  palomino: {
    name: "Palomino",
    description: "Golden body with white mane/tail",
    css: "linear-gradient(135deg, #d4a94c 0%, #f0c966 50%, #d4a94c 100%)",
    genotypes: ["Cr/cr e/e"],
  },
  buckskin: {
    name: "Buckskin",
    description: "Golden body with black points",
    css: `linear-gradient(180deg, #1a1a1a 0%, #1a1a1a 15%, #d4a94c 25%, #f0c966 50%, #d4a94c 75%, #1a1a1a 85%, #1a1a1a 100%)`,
    genotypes: ["Cr/cr A/-"],
  },
  cremello: {
    name: "Cremello/Perlino",
    description: "Double cream dilution - very pale",
    css: "linear-gradient(135deg, #f5f0e6 0%, #fffaf0 50%, #f5f0e6 100%)",
    genotypes: ["Cr/Cr"],
  },
  dun: {
    name: "Dun",
    description: "Diluted body with primitive markings",
    css: `linear-gradient(180deg, #1a1a1a 0%, #8b7355 20%, #c4a882 50%, #8b7355 80%, #1a1a1a 100%)`,
    genotypes: ["D/d", "D/D"],
  },
  gray: {
    name: "Gray (Horse)",
    description: "Born colored, progressively whitens",
    css: `linear-gradient(135deg, #a0a0a0 0%, #d0d0d0 30%, #ffffff 70%, #e8e8e8 100%)`,
    genotypes: ["G/g", "G/G"],
  },
};

// Cat-specific patterns
const CAT_PATTERNS: Record<string, ColorDefinition> = {
  tabby: {
    name: "Tabby",
    description: "Striped pattern with M on forehead",
    css: `repeating-linear-gradient(
      75deg,
      #8b5a2b 0px,
      #8b5a2b 6px,
      #1a1a1a 6px,
      #1a1a1a 10px
    )`,
    genotypes: ["Ta/Ta", "Ta/ta (mackerel)", "tb/tb (classic)"],
  },
  colorpoint: {
    name: "Colorpoint (Siamese)",
    description: "Light body with dark extremities",
    css: `radial-gradient(ellipse at 50% 50%, #f5deb3 40%, #5c3d2e 80%)`,
    genotypes: ["cs/cs"],
  },
  tortoiseshell: {
    name: "Tortoiseshell",
    description: "Mixed black and orange patches (females)",
    css: `radial-gradient(ellipse at 25% 30%, #c4763c 20%, transparent 35%),
          radial-gradient(ellipse at 65% 45%, #1a1a1a 25%, transparent 40%),
          radial-gradient(ellipse at 35% 70%, #1a1a1a 20%, transparent 35%),
          radial-gradient(ellipse at 75% 80%, #c4763c 15%, transparent 30%),
          linear-gradient(135deg, #c4763c 0%, #1a1a1a 100%)`,
    genotypes: ["O/o (female X-linked)"],
  },
  calico: {
    name: "Calico",
    description: "Tortoiseshell with white patches",
    css: `radial-gradient(ellipse at 20% 25%, #c4763c 18%, transparent 30%),
          radial-gradient(ellipse at 55% 35%, #1a1a1a 22%, transparent 35%),
          radial-gradient(ellipse at 80% 70%, #c4763c 15%, transparent 28%),
          radial-gradient(ellipse at 35% 65%, #ffffff 25%, transparent 40%),
          radial-gradient(ellipse at 70% 45%, #ffffff 20%, transparent 35%),
          linear-gradient(135deg, #f8f8f8 0%, #ffffff 100%)`,
    genotypes: ["O/o S/s (female)"],
  },
};

/** Parsed prediction outcome */
interface PredictionOutcome {
  percentage: number;
  genotype: string;
  phenotype?: string;
}

/** Coat color prediction from pairing calculation */
interface CoatColorPrediction {
  trait: string;
  damGenotype: string;
  sireGenotype: string;
  prediction: string;
  breedSpecific?: string | null;
}

interface CoatColorPreviewProps {
  /** The species to show colors for */
  species: Species;
  /** Coat color predictions from the pairing calculation */
  predictions?: CoatColorPrediction[];
  /** Dam's name for display */
  damName?: string;
  /** Sire's name for display */
  sireName?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Parse prediction string into structured outcomes
 * e.g., "25% E/E, 50% E/e, 25% e/e" -> [{percentage: 25, genotype: "E/E"}, ...]
 */
function parsePrediction(prediction: string): PredictionOutcome[] {
  const outcomes: PredictionOutcome[] = [];
  const parts = prediction.split(",").map((p) => p.trim());

  for (const part of parts) {
    const match = part.match(/^(\d+)%\s+(.+)$/);
    if (match) {
      outcomes.push({
        percentage: parseInt(match[1], 10),
        genotype: match[2],
      });
    }
  }

  return outcomes.sort((a, b) => b.percentage - a.percentage);
}

/**
 * Extract locus name from trait string
 * e.g., "E Locus (Extension)" -> "E"
 */
function extractLocus(trait: string): string {
  const match = trait.match(/^([A-Za-z]+)\s+Locus/);
  return match ? match[1].toUpperCase() : trait;
}

/**
 * Get color definition that matches a genotype
 */
function getColorForGenotype(
  genotype: string,
  species: Species
): ColorDefinition | null {
  const allColors = [
    ...Object.values(BASE_COLORS),
    ...Object.values(PATTERNS),
    ...(species === "HORSE" ? Object.values(HORSE_PATTERNS) : []),
    ...(species === "CAT" ? Object.values(CAT_PATTERNS) : []),
  ];

  const normalizedGenotype = genotype.toLowerCase().replace(/\s+/g, "");

  for (const color of allColors) {
    if (color.genotypes) {
      for (const g of color.genotypes) {
        const normalizedG = g.toLowerCase().replace(/\s+/g, "");
        if (
          normalizedG.includes(normalizedGenotype) ||
          normalizedGenotype.includes(normalizedG)
        ) {
          return color;
        }
      }
    }
  }

  return null;
}

/**
 * Get color for a specific locus and genotype combination
 * This provides more intelligent color matching based on locus context
 */
function getColorForLocusGenotype(
  locus: string,
  genotype: string,
  species: Species
): ColorDefinition | null {
  const l = locus.toUpperCase();
  const g = genotype.replace(/\s+/g, "");
  const gLower = g.toLowerCase();

  // Helper to check if genotype has mixed case (heterozygous indicator)
  const hasMixedCase = (str: string, letter: string) => {
    return str.includes(letter.toUpperCase()) && str.includes(letter.toLowerCase());
  };

  // Helper to check if all same case (homozygous indicator)
  const isHomozygousDominant = (str: string, letter: string) => {
    const upper = letter.toUpperCase();
    return str.includes(upper) && !str.includes(letter.toLowerCase());
  };

  const isHomozygousRecessive = (str: string, letter: string) => {
    const lower = letter.toLowerCase();
    return str.includes(lower) && !str.includes(letter.toUpperCase());
  };

  // E Locus (Extension) - determines if black pigment can be produced
  if (l === "E") {
    // Homozygous recessive - e/e (red/yellow only)
    if (isHomozygousRecessive(g, "e")) {
      return BASE_COLORS.red;
    }
    // Heterozygous - E/e (carries red)
    if (hasMixedCase(g, "e")) {
      return {
        name: "Normal (carries cream/red)",
        description: "Can produce black pigment, carries red gene",
        css: `linear-gradient(135deg, #1a1a1a 0%, #333333 40%, #c4763c 60%, #333333 100%)`,
      };
    }
    // Homozygous dominant - E/E
    if (isHomozygousDominant(g, "e")) {
      return BASE_COLORS.black;
    }
    // Fallback for E locus - any genotype at this locus
    return BASE_COLORS.black;
  }

  // B Locus (Brown/Chocolate)
  if (l === "B") {
    // Homozygous recessive - b/b (chocolate/liver)
    if (isHomozygousRecessive(g, "b")) {
      return BASE_COLORS.liver;
    }
    // Heterozygous - B/b (carries chocolate)
    if (hasMixedCase(g, "b")) {
      return {
        name: "Black pigment (carries brown)",
        description: "Black pigment, carries chocolate gene",
        css: `linear-gradient(135deg, #1a1a1a 0%, #333333 40%, #5c3d2e 60%, #333333 100%)`,
      };
    }
    // Homozygous dominant - B/B
    if (isHomozygousDominant(g, "b")) {
      return BASE_COLORS.black;
    }
    // Fallback for B locus
    return BASE_COLORS.black;
  }

  // D Locus (Dilution)
  if (l === "D") {
    // Homozygous recessive - d/d (dilute)
    if (isHomozygousRecessive(g, "d")) {
      return BASE_COLORS.blue;
    }
    // Heterozygous - D/d (carries dilute)
    if (hasMixedCase(g, "d")) {
      return {
        name: "Full color (carries dilute)",
        description: "Full color intensity, carries dilute gene",
        css: `linear-gradient(135deg, #1a1a1a 0%, #333333 40%, #4a5568 60%, #333333 100%)`,
      };
    }
    // Homozygous dominant - D/D
    if (isHomozygousDominant(g, "d")) {
      return {
        name: "Full color",
        description: "Full color intensity, no dilution",
        css: "linear-gradient(135deg, #1a1a1a 0%, #333333 50%, #1a1a1a 100%)",
      };
    }
    // Fallback for D locus
    return {
      name: "Full color",
      description: "Full color intensity, no dilution",
      css: "linear-gradient(135deg, #1a1a1a 0%, #333333 50%, #1a1a1a 100%)",
    };
  }

  // A Locus (Agouti)
  if (l === "A") {
    // Sable - Ay (dominant)
    if (gLower.includes("ay")) {
      return PATTERNS.sable;
    }
    // Agouti/Wolf - Aw
    if (gLower.includes("aw")) {
      return PATTERNS.agouti;
    }
    // Tan points - at/at, at/a
    if (gLower.includes("at")) {
      return PATTERNS.tanPoints;
    }
    // Recessive black - a/a
    if (gLower === "a/a") {
      return BASE_COLORS.black;
    }
    // Fallback for A locus - tan points is most common
    return PATTERNS.tanPoints;
  }

  // K Locus (Dominant Black)
  if (l === "K") {
    // Brindle - kbr (check first as it's more specific)
    if (gLower.includes("kbr") || gLower.includes("brindle")) {
      return PATTERNS.brindle;
    }
    // Dominant black - KB
    if (gLower.includes("kb")) {
      return {
        name: "Solid",
        description: "Solid color expression",
        css: "linear-gradient(135deg, #2d2d2d 0%, #4a4a4a 50%, #2d2d2d 100%)",
      };
    }
    // Wild type - ky/ky (allows agouti)
    if (gLower.includes("ky")) {
      return PATTERNS.agouti;
    }
    // Fallback for K locus
    return PATTERNS.agouti;
  }

  // M Locus (Merle)
  if (l === "M") {
    // Double merle - M/M (both uppercase)
    if (g === "M/M") {
      return PATTERNS.doubleMerle;
    }
    // Non-merle - m/m (both lowercase)
    if (g === "m/m") {
      return PATTERNS.solid;
    }
    // Merle - M/m or m/M (mixed case)
    if (hasMixedCase(g, "m")) {
      return PATTERNS.merle;
    }
    // Fallback for M locus
    return PATTERNS.solid;
  }

  // S Locus (White Spotting)
  if (l === "S") {
    // Piebald - s/s or sp/sp
    if (isHomozygousRecessive(g, "s") || gLower.includes("sp")) {
      return PATTERNS.piebald;
    }
    // Irish/parti carrier - S/s
    if (hasMixedCase(g, "s")) {
      return PATTERNS.tuxedo;
    }
    // Solid - S/S
    if (isHomozygousDominant(g, "s")) {
      return PATTERNS.solid;
    }
    // Fallback for S locus
    return PATTERNS.solid;
  }

  // Try generic matching as fallback
  return getColorForGenotype(genotype, species);
}

/**
 * Get phenotype description for a genotype at a specific locus
 */
function getPhenotypeForLocus(
  locus: string,
  genotype: string
): string {
  const l = locus.toUpperCase();
  const g = genotype.toUpperCase();

  // E Locus (Extension)
  if (l === "E") {
    if (g === "E/E" || g === "E/E") return "Can produce black pigment";
    if (g === "E/E" || g === "E/E") return "Can produce black pigment (carrier)";
    if (g === "E/E") return "Red/Yellow only (no black pigment)";
  }

  // B Locus (Brown)
  if (l === "B") {
    if (g.includes("B/B")) return "Black pigment";
    if (g.includes("B/B") || g.includes("B/B")) return "Black (chocolate carrier)";
    if (g === "B/B") return "Chocolate/Liver";
  }

  // D Locus (Dilution)
  if (l === "D") {
    if (g.includes("D/D")) return "Full color intensity";
    if (g.includes("D/D")) return "Full color (dilute carrier)";
    if (g === "D/D") return "Diluted color (blue/isabella)";
  }

  // K Locus (Dominant Black)
  if (l === "K") {
    if (g.includes("K/K") || g.includes("KB")) return "Solid color";
    if (g.includes("KBR") || g.includes("K(BR)")) return "Brindle";
    if (g === "K/K" || g === "KY/KY") return "Allows agouti expression";
  }

  // A Locus (Agouti)
  if (l === "A") {
    if (g.includes("AY")) return "Sable/Fawn";
    if (g.includes("AW")) return "Agouti/Wolf gray";
    if (g.includes("AT")) return "Tan points";
    if (g === "A/A") return "Recessive black";
  }

  // M Locus (Merle)
  if (l === "M") {
    if (g === "M/M") return "Double merle (health risk)";
    if (g.includes("M/M")) return "Merle pattern";
    if (g === "M/M") return "Non-merle";
  }

  // S Locus (White Spotting)
  if (l === "S") {
    if (g === "S/S") return "Solid (no white)";
    if (g === "S/S") return "Irish spotting/Parti carrier";
    if (g === "S/S" || g.includes("SP")) return "Parti/Piebald";
  }

  return genotype;
}

/**
 * Prediction card for a single locus
 */
function LocusPredictionCard({
  prediction,
  species,
  damName,
  sireName,
}: {
  prediction: CoatColorPrediction;
  species: Species;
  damName?: string;
  sireName?: string;
}) {
  const locus = extractLocus(prediction.trait);
  const outcomes = parsePrediction(prediction.prediction);
  const locusNameMatch = prediction.trait.match(/\(([^)]+)\)/);
  const locusFullName = locusNameMatch ? locusNameMatch[1] : prediction.trait;

  return (
    <div className="rounded-xl border border-hairline bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-base">{locus} Locus</h4>
          <p className="text-xs text-secondary">{locusFullName}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-secondary">
          <span className="px-2 py-1 rounded bg-pink-500/10 text-pink-400">
            {damName || "Dam"}: {prediction.damGenotype}
          </span>
          <span>×</span>
          <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400">
            {sireName || "Sire"}: {prediction.sireGenotype}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {outcomes.map((outcome, idx) => {
          const color = getColorForLocusGenotype(locus, outcome.genotype, species);
          const phenotype = getPhenotypeForLocus(locus, outcome.genotype);

          return (
            <div
              key={idx}
              className="p-3 rounded-lg bg-surface-alt space-y-2"
            >
              {/* Top row: phenotype, genotype, percentage */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-sm">
                    {phenotype}
                  </span>
                  {color && (
                    <span className="text-xs text-secondary px-1.5 py-0.5 rounded bg-surface whitespace-nowrap">
                      {color.name}
                    </span>
                  )}
                  <span className="text-xs text-secondary font-mono">
                    {outcome.genotype}
                  </span>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <div className="w-16 h-2 rounded-full bg-hairline overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        outcome.percentage >= 50
                          ? "bg-green-500"
                          : outcome.percentage >= 25
                          ? "bg-yellow-500"
                          : "bg-orange-500"
                      }`}
                      style={{ width: `${outcome.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-10 text-right">
                    {outcome.percentage}%
                  </span>
                </div>
              </div>

              {/* Color swatch - wide bar matching reference guide */}
              {color ? (
                <Tooltip content={color.description}>
                  <div
                    className="w-[320px] h-10 rounded-md border border-hairline shadow-sm"
                    style={{ background: color.css }}
                  />
                </Tooltip>
              ) : (
                <div className="w-[320px] h-10 rounded-md border border-hairline bg-surface flex items-center justify-center">
                  <span className="text-xs text-secondary">?</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Reference grid showing all colors for a species
 */
function ColorReferenceGrid({ species }: { species: Species }) {
  const colors = React.useMemo(() => {
    const allColors: Record<string, ColorDefinition[]> = {
      "Base Colors": Object.values(BASE_COLORS),
      Patterns: Object.values(PATTERNS),
    };

    if (species === "HORSE") {
      allColors["Horse Patterns"] = Object.values(HORSE_PATTERNS);
    }
    if (species === "CAT") {
      allColors["Cat Patterns"] = Object.values(CAT_PATTERNS);
    }

    return allColors;
  }, [species]);

  return (
    <div className="space-y-4">
      {Object.entries(colors).map(([category, categoryColors]) => (
        <div key={category}>
          <h4 className="text-sm font-semibold text-secondary mb-2">
            {category}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {categoryColors.map((color, idx) => (
              <div
                key={idx}
                className="p-2 rounded-lg border border-hairline bg-surface-alt"
              >
                <Tooltip content={color.description}>
                  <div
                    className="w-full h-10 rounded-md border border-hairline mb-2"
                    style={{ background: color.css }}
                  />
                </Tooltip>
                <div className="text-xs font-medium truncate">{color.name}</div>
                {color.genotypes && (
                  <div className="text-[10px] text-secondary truncate">
                    {color.genotypes[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CoatColorPreview({
  species,
  predictions,
  damName,
  sireName,
  className = "",
}: CoatColorPreviewProps) {
  const [showReference, setShowReference] = React.useState(false);

  const hasPredictions = predictions && predictions.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Pairing Predictions - Primary View */}
      {hasPredictions ? (
        <div className="rounded-xl border border-hairline bg-surface p-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🎨</span>
            <div>
              <h3 className="text-lg font-bold">
                Predicted Offspring Coat Colors
              </h3>
              <p className="text-sm text-secondary">
                Based on genetic analysis of {damName || "Dam"} ×{" "}
                {sireName || "Sire"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {predictions.map((pred, idx) => (
              <LocusPredictionCard
                key={idx}
                prediction={pred}
                species={species}
                damName={damName}
                sireName={sireName}
              />
            ))}
          </div>

          {/* Educational note */}
          <div className="mt-4 pt-4 border-t border-hairline">
            <div className="flex items-start gap-2 text-xs text-secondary">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                <strong>Note:</strong> These are predicted probabilities based
                on Mendelian genetics. Actual offspring colors may vary due to
                modifier genes, epistasis, and other genetic factors.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-hairline bg-surface p-6 text-center">
          <div className="text-4xl mb-3">🎨</div>
          <h3 className="font-semibold mb-2">No Coat Color Data Available</h3>
          <p className="text-sm text-secondary max-w-md mx-auto">
            Add coat color genetic markers to both animals to see predicted
            offspring color probabilities.
          </p>
        </div>
      )}

      {/* Reference Toggle */}
      <div className="rounded-xl border border-hairline bg-surface overflow-hidden">
        <button
          onClick={() => setShowReference(!showReference)}
          className="w-full p-4 flex items-center justify-between hover:bg-surface-alt transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📚</span>
            <div className="text-left">
              <h4 className="font-semibold">
                {species.charAt(0) + species.slice(1).toLowerCase()} Color
                Reference Guide
              </h4>
              <p className="text-xs text-secondary">
                View all possible coat colors and patterns for this species
              </p>
            </div>
          </div>
          {showReference ? (
            <ChevronUp className="w-5 h-5 text-secondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-secondary" />
          )}
        </button>

        {showReference && (
          <div className="p-4 border-t border-hairline">
            <ColorReferenceGrid species={species} />

            <div className="mt-4 pt-4 border-t border-hairline">
              <div className="flex items-start gap-2 text-xs text-secondary">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  <strong>Note:</strong> Actual coat colors may vary due to
                  modifier genes, environmental factors, and polygenic traits
                  not represented here. These previews are approximations for
                  educational purposes.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Mini color preview for inline display
 */
export function MiniColorPreview({
  genotype,
  species = "DOG",
}: {
  genotype: string;
  species?: Species;
}) {
  const color = getColorForGenotype(genotype, species);

  if (!color) return null;

  return (
    <Tooltip content={`${color.name}: ${color.description}`}>
      <div
        className="w-5 h-5 rounded border border-hairline inline-block align-middle"
        style={{ background: color.css }}
      />
    </Tooltip>
  );
}

/**
 * Export color definitions for use elsewhere
 */
export {
  BASE_COLORS,
  PATTERNS,
  HORSE_PATTERNS,
  CAT_PATTERNS,
  type ColorDefinition,
};
