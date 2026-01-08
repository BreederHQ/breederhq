// apps/breeding/src/components/CoatColorPreview.tsx
import * as React from "react";

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
    genotypes: ["E/E K/K", "E/e K/K", "E/E K/k"],
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
    genotypes: ["d/d B/-"],
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
    genotypes: ["A/at", "A/a"],
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
    genotypes: ["k(br)/k(br)", "k(br)/k"],
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
    genotypes: ["A/A", "A/at", "A/a"],
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

interface ColorSwatchProps {
  color: ColorDefinition;
  size?: "sm" | "md" | "lg";
  showGenotypes?: boolean;
  className?: string;
}

function ColorSwatch({ color, size = "md", showGenotypes = false, className = "" }: ColorSwatchProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-lg border border-hairline shadow-sm`}
        style={{ background: color.css }}
        title={color.description}
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{color.name}</div>
        {showGenotypes && color.genotypes && (
          <div className="text-xs text-secondary truncate">
            {color.genotypes.slice(0, 2).join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}

interface CoatColorPreviewProps {
  /** The species to show colors for */
  species: Species;
  /** Selected genotype to highlight (optional) */
  selectedGenotype?: string;
  /** Callback when a color is selected */
  onSelectColor?: (color: ColorDefinition) => void;
  /** Whether to show the full grid or compact list */
  variant?: "grid" | "compact";
  /** Additional CSS classes */
  className?: string;
}

export default function CoatColorPreview({
  species,
  selectedGenotype,
  onSelectColor,
  variant = "grid",
  className = "",
}: CoatColorPreviewProps) {
  // Get colors for the species
  const colors = React.useMemo(() => {
    const allColors: Record<string, ColorDefinition[]> = {
      "Base Colors": Object.values(BASE_COLORS),
      "Patterns": Object.values(PATTERNS),
    };

    // Add species-specific patterns
    if (species === "HORSE") {
      allColors["Horse Patterns"] = Object.values(HORSE_PATTERNS);
    }
    if (species === "CAT") {
      allColors["Cat Patterns"] = Object.values(CAT_PATTERNS);
    }

    return allColors;
  }, [species]);

  // Find colors matching selected genotype
  const matchingColors = React.useMemo(() => {
    if (!selectedGenotype) return [];

    const matches: ColorDefinition[] = [];
    const normalizedGenotype = selectedGenotype.toLowerCase().replace(/\s+/g, "");

    for (const category of Object.values(colors)) {
      for (const color of category) {
        if (color.genotypes) {
          for (const g of color.genotypes) {
            if (g.toLowerCase().replace(/\s+/g, "").includes(normalizedGenotype) ||
                normalizedGenotype.includes(g.toLowerCase().replace(/\s+/g, ""))) {
              matches.push(color);
              break;
            }
          }
        }
      }
    }

    return matches;
  }, [colors, selectedGenotype]);

  if (variant === "compact") {
    return (
      <div className={`space-y-2 ${className}`}>
        {matchingColors.length > 0 ? (
          <>
            <div className="text-xs font-medium text-secondary">Possible Appearance:</div>
            <div className="flex flex-wrap gap-2">
              {matchingColors.map((color, idx) => (
                <ColorSwatch key={idx} color={color} size="sm" />
              ))}
            </div>
          </>
        ) : (
          <div className="text-xs text-secondary">
            Select a genotype to see color preview
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-hairline bg-surface p-4 ${className}`}>
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-2xl">🎨</span>
        Coat Color Reference
      </h3>

      {/* Selected genotype preview */}
      {selectedGenotype && (
        <div className="mb-4 p-3 bg-accent/5 rounded-lg border border-accent/20">
          <div className="text-xs font-medium text-secondary mb-2">
            Colors matching <span className="font-mono">{selectedGenotype}</span>:
          </div>
          {matchingColors.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {matchingColors.map((color, idx) => (
                <ColorSwatch key={idx} color={color} size="md" showGenotypes />
              ))}
            </div>
          ) : (
            <div className="text-sm text-secondary">
              No specific color match found for this genotype
            </div>
          )}
        </div>
      )}

      {/* Color categories */}
      <div className="space-y-4">
        {Object.entries(colors).map(([category, categoryColors]) => (
          <div key={category}>
            <h4 className="text-sm font-semibold text-secondary mb-2">{category}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {categoryColors.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectColor?.(color)}
                  className={`
                    p-2 rounded-lg border transition-all hover:shadow-md
                    ${onSelectColor ? "cursor-pointer hover:border-accent" : "cursor-default"}
                    border-hairline bg-surface-alt
                  `}
                >
                  <div
                    className="w-full h-10 rounded-md border border-hairline mb-2"
                    style={{ background: color.css }}
                  />
                  <div className="text-xs font-medium truncate">{color.name}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Educational note */}
      <div className="mt-4 pt-4 border-t border-hairline">
        <div className="flex items-start gap-2 text-xs text-secondary">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>
            <strong>Note:</strong> Actual coat colors may vary due to modifier genes,
            environmental factors, and polygenic traits not represented here.
            These previews are approximations for educational purposes.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Mini color preview for inline display
 */
export function MiniColorPreview({ genotype, species = "DOG" }: { genotype: string; species?: Species }) {
  const color = React.useMemo(() => {
    const allColors = [
      ...Object.values(BASE_COLORS),
      ...Object.values(PATTERNS),
      ...(species === "HORSE" ? Object.values(HORSE_PATTERNS) : []),
      ...(species === "CAT" ? Object.values(CAT_PATTERNS) : []),
    ];

    const normalizedGenotype = genotype.toLowerCase().replace(/\s+/g, "");

    for (const c of allColors) {
      if (c.genotypes) {
        for (const g of c.genotypes) {
          if (g.toLowerCase().replace(/\s+/g, "").includes(normalizedGenotype) ||
              normalizedGenotype.includes(g.toLowerCase().replace(/\s+/g, ""))) {
            return c;
          }
        }
      }
    }

    return null;
  }, [genotype, species]);

  if (!color) return null;

  return (
    <div
      className="w-5 h-5 rounded border border-hairline inline-block align-middle"
      style={{ background: color.css }}
      title={`${color.name}: ${color.description}`}
    />
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
