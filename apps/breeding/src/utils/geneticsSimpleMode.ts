/**
 * Genetics Simple Mode - Plain English translations for genetic predictions
 * Translates technical genetic terminology into breeder-friendly language
 */

// Species-specific offspring names
export const OFFSPRING_NAMES: Record<string, { singular: string; plural: string }> = {
  DOG: { singular: "puppy", plural: "puppies" },
  CAT: { singular: "kitten", plural: "kittens" },
  HORSE: { singular: "foal", plural: "foals" },
  RABBIT: { singular: "kit", plural: "kits" },
  GOAT: { singular: "kid", plural: "kids" },
  SHEEP: { singular: "lamb", plural: "lambs" },
  PIG: { singular: "piglet", plural: "piglets" },
  CATTLE: { singular: "calf", plural: "calves" },
  CHICKEN: { singular: "chick", plural: "chicks" },
};

export function getOffspringName(species: string, plural: boolean = true): string {
  const names = OFFSPRING_NAMES[species?.toUpperCase()] || { singular: "offspring", plural: "offspring" };
  return plural ? names.plural : names.singular;
}

// Coat color translations - maps locus + phenotype to plain English
const COAT_COLOR_TRANSLATIONS: Record<string, Record<string, string>> = {
  // Agouti locus (A)
  A: {
    "Sable/Fawn": "golden/fawn colored",
    "Tan Points/Tricolor": "black with tan markings (like a Rottweiler or Doberman pattern)",
    "Recessive black": "solid black",
    "Wild type": "natural wild coloring",
    "carries recessive black": "could produce solid black offspring if bred to another carrier",
    "carries tan points": "could produce tan-pointed offspring if bred to another carrier",
  },
  // Brown locus (B)
  B: {
    "Black pigment": "black nose, eye rims, and paw pads",
    "Brown pigment": "brown/liver nose, eye rims, and paw pads (chocolate coloring)",
    "carries brown": "could produce chocolate/liver colored offspring if bred to another carrier",
  },
  // Dilute locus (D)
  D: {
    "Full color intensity": "rich, full color",
    "Full color": "rich, full color",
    "Dilute": "lightened/washed out color (blue, lilac, or fawn)",
    "Blue/Isabella/Lilac": "diluted coat color (appears grayish or faded)",
    "carries dilute": "could produce blue/lilac offspring if bred to another carrier",
  },
  // Extension locus (E)
  E: {
    "Normal extension": "normal pigment distribution",
    "Normal": "normal pigment distribution",
    "Melanistic mask": "dark face mask",
    "Cream/Red/Yellow": "red, cream, or yellow coat (no black pigment in coat)",
    "no black pigment": "red, cream, or yellow (no black in the coat)",
    "carries cream/red": "could produce cream/red/yellow offspring if bred to another carrier",
    "carries cream": "could produce cream/red offspring if bred to another carrier",
  },
  // Black Extension / K locus
  K: {
    "Dominant black": "solid black coat color",
    "Brindle": "tiger-striped pattern",
    "Agouti pattern expressed": "allows other color patterns to show through",
    "carries pattern": "could produce patterned offspring if bred to another carrier",
    "carries brindle": "could produce brindle offspring if bred to another carrier",
  },
  // Merle locus (M)
  M: {
    "Merle": "mottled/marbled coat pattern with patches",
    "Non-merle": "solid (non-merle) pattern",
    "carries merle": "carries merle but doesn't show it (cryptic merle)",
  },
  // Spotting locus (S)
  S: {
    "Solid": "minimal white markings",
    "Irish spotting": "classic white markings (chest, paws, face)",
    "Piebald": "large white patches",
    "Extreme white": "mostly white coat",
    "carries white": "could produce offspring with more white if bred to another carrier",
  },
};

// Coat type translations
const COAT_TYPE_TRANSLATIONS: Record<string, Record<string, string>> = {
  // Furnishings (F)
  F: {
    "F/F": "have the 'teddy bear' face with beard and eyebrows",
    "F/f": "have facial furnishings (could produce smooth-faced offspring)",
    "f/f": "have a smooth face (no beard/eyebrows)",
    "Furnished": "have the 'teddy bear' face with beard and eyebrows",
    "Unfurnished": "have a smooth, clean face",
    "carries unfurnished": "have furnishings but carry the smooth-face gene",
  },
  // Curly coat (Cu)
  Cu: {
    "Cu/Cu": "have a curly coat",
    "Cu/+": "have a wavy coat",
    "+/Cu": "have a wavy coat",
    "+/+": "have a straight coat",
    "Curly": "have a curly coat",
    "Wavy": "have a wavy coat",
    "Straight": "have a straight coat",
  },
  // Long hair (L)
  L: {
    "L/L": "have short hair",
    "L/l": "have short hair (but carry the long hair gene)",
    "l/L": "have short hair (but carry the long hair gene)",
    "l/l": "have long/fluffy hair",
    "Short": "have short hair",
    "Long": "have long/fluffy hair",
    "carries long": "have short hair but carry the long hair gene",
  },
  // Shedding (Sd)
  Sd: {
    "Low shedding": "be low-shedding (great for allergies)",
    "Normal shedding": "shed normally",
    "High shedding": "be heavy shedders",
    "IC": "be low-shedding (Improper Coat)",
    "+/+": "shed normally",
    "IC/+": "be low-shedding",
    "+/IC": "be low-shedding",
    "IC/IC": "be very low-shedding",
    "carries normal shedding": "be low-shedding but could produce normal-shedding offspring",
  },
  // Fluffy gene for French Bulldogs (L4)
  L4: {
    "Fluffy": "have long, fluffy coat",
    "Short": "have normal short coat",
    "Fluffy carrier": "have normal coat but could produce fluffy offspring",
    "carries fluffy": "have normal coat but carry the fluffy gene",
    "L/L": "have normal short coat",
    "L/l": "have short coat (but carry the fluffy gene)",
    "l/l": "have long, fluffy coat",
  },
};

// Health translations
const HEALTH_TRANSLATIONS: Record<string, string> = {
  Clear: "not affected and cannot pass on this condition",
  "N/N": "completely clear - no risk of this condition",
  "N/m": "carrier - healthy but could pass the gene to offspring",
  "m/m": "affected - has this condition",
  Carrier: "healthy but carries one copy of the gene",
  Affected: "has two copies and is affected by this condition",
};

// Eye color translations
const EYE_COLOR_TRANSLATIONS: Record<string, Record<string, string>> = {
  // Blue eyes / ALX4
  ALX4: {
    "Blue eyes": "have blue eyes",
    "Brown eyes": "have brown eyes",
    "N/N": "have brown eyes (normal)",
    "N/P": "have brown or partially blue eyes",
    "P/P": "have blue eyes",
    "carries blue": "have brown eyes but could produce blue-eyed offspring",
  },
  // General eye patterns
  general: {
    "Blue": "have blue eyes",
    "Brown": "have brown eyes",
    "Amber": "have amber/golden eyes",
    "Green": "have green eyes",
    "Hazel": "have hazel eyes",
    "Heterochromia": "have two different colored eyes",
  },
};

// Physical traits translations
const PHYSICAL_TRAITS_TRANSLATIONS: Record<string, Record<string, string>> = {
  // Natural Bobtail (T)
  T: {
    "Natural bobtail": "have a naturally short tail",
    "Normal tail": "have a full-length tail",
    "T/T": "not survive (double bobtail is lethal)",
    "T/t": "have a naturally short tail",
    "t/t": "have a full-length tail",
    "carries bobtail": "have normal tail but could produce bobtail offspring",
  },
  // Dewclaw
  LMBR1: {
    "Hind dewclaws": "have rear dewclaws",
    "No hind dewclaws": "not have rear dewclaws",
    "D/D": "have rear dewclaws",
    "D/N": "possibly have rear dewclaws",
    "N/N": "not have rear dewclaws",
  },
  // Body size
  IGF1: {
    "Small": "be on the smaller side",
    "Medium": "be medium-sized",
    "Large": "be on the larger side",
    "I/I": "be on the smaller side",
    "I/N": "be medium-sized",
    "N/N": "be on the larger side",
  },
  // Leg length
  CDDY: {
    "Normal legs": "have normal leg length",
    "Short legs": "have shorter legs (chondrodysplasia)",
    "+/+": "have normal leg length",
    "CDDY/+": "have slightly shortened legs",
    "CDDY/CDDY": "have short legs (like a Dachshund or Corgi)",
  },
  // Skull shape
  BMP3: {
    "Normal skull": "have a normal skull shape",
    "Brachycephalic": "have a flat/shortened face",
  },
};

/**
 * Translates a genetic prediction to plain English
 */
export function translatePrediction(
  category: "coatColor" | "coatType" | "health" | "physicalTraits" | "eyeColor",
  locus: string,
  prediction: string,
  species: string
): string {
  const offspring = getOffspringName(species);

  // Parse the prediction (e.g., "50% Sable/Fawn · 50% Tan Points")
  const parts = prediction.split(/[,·]/).map(p => p.trim());

  const translatedParts = parts.map(part => {
    // Extract percentage and phenotype
    const match = part.match(/^(\d+)%\s+(.+)$/);
    if (!match) return part;

    const [, percentage, rawPhenotype] = match;
    const pct = parseInt(percentage);

    // Separate main phenotype from carrier info in parentheses
    // e.g., "Sable/Fawn (carries recessive black)" -> "Sable/Fawn" + "carries recessive black"
    const carrierMatch = rawPhenotype.match(/^(.+?)\s*\(([^)]+)\)$/);
    const mainPhenotype = carrierMatch ? carrierMatch[1].trim() : rawPhenotype;
    const carrierInfo = carrierMatch ? carrierMatch[2].trim() : null;

    // Get translation based on category and locus
    let translations: Record<string, string> = {};
    if (category === "coatColor") {
      translations = COAT_COLOR_TRANSLATIONS[locus] || {};
    } else if (category === "coatType") {
      translations = COAT_TYPE_TRANSLATIONS[locus] || {};
    } else if (category === "health") {
      translations = HEALTH_TRANSLATIONS;
    } else if (category === "eyeColor") {
      translations = { ...(EYE_COLOR_TRANSLATIONS[locus] || {}), ...EYE_COLOR_TRANSLATIONS.general };
    } else if (category === "physicalTraits") {
      translations = PHYSICAL_TRAITS_TRANSLATIONS[locus] || {};
    }

    // Find matching translation for main phenotype
    let translation = findTranslation(mainPhenotype, translations);

    // If we still have the raw phenotype and it looks like a genotype (e.g., +/Cu), make it friendly
    if (translation === mainPhenotype && isGenotype(mainPhenotype)) {
      translation = makeGenotypeReadable(mainPhenotype, locus, category);
    }

    // Add carrier info if present
    if (carrierInfo) {
      const carrierTranslation = findTranslation(carrierInfo, translations);
      if (carrierTranslation !== carrierInfo) {
        translation += ` (and ${carrierTranslation})`;
      } else {
        // Make carrier info more readable
        translation += ` (${makeCarrierReadable(carrierInfo)})`;
      }
    }

    // Convert percentage to friendly language
    let chanceWord: string;
    if (pct === 100) {
      chanceWord = `All ${offspring} will`;
    } else if (pct === 75) {
      chanceWord = `Most ${offspring} (3 in 4) will`;
    } else if (pct === 50) {
      chanceWord = `Half the ${offspring} will`;
    } else if (pct === 25) {
      chanceWord = `Some ${offspring} (1 in 4) could`;
    } else {
      chanceWord = `About ${pct}% of ${offspring} will`;
    }

    return `${chanceWord} ${translation}`;
  });

  return translatedParts.join(". ");
}

/**
 * Find translation in dictionary, checking for partial matches
 */
function findTranslation(phenotype: string, translations: Record<string, string>): string {
  // Try exact match first
  if (translations[phenotype]) {
    return translations[phenotype];
  }

  // Try case-insensitive exact match
  for (const [key, value] of Object.entries(translations)) {
    if (key.toLowerCase() === phenotype.toLowerCase()) {
      return value;
    }
  }

  // Try partial match (phenotype contains key)
  for (const [key, value] of Object.entries(translations)) {
    if (phenotype.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  return phenotype;
}

/**
 * Check if a string looks like a genotype (e.g., +/Cu, L/l, N/N)
 */
function isGenotype(str: string): boolean {
  return /^[A-Za-z+]+\/[A-Za-z+]+$/.test(str);
}

/**
 * Convert a raw genotype to something more readable
 */
function makeGenotypeReadable(genotype: string, locus: string, category: string): string {
  // Common patterns
  const genotypePatterns: Record<string, string> = {
    "+/+": "be normal/standard",
    "N/N": "be clear (normal)",
    "+/Cu": "have a wavy coat",
    "Cu/+": "have a wavy coat",
    "Cu/Cu": "have a curly coat",
    "L/L": "have short hair",
    "L/l": "have short hair (carrying long)",
    "l/L": "have short hair (carrying long)",
    "l/l": "have long hair",
    "F/F": "have facial furnishings",
    "F/f": "have facial furnishings (carrying smooth)",
    "f/F": "have facial furnishings (carrying smooth)",
    "f/f": "have a smooth face",
  };

  if (genotypePatterns[genotype]) {
    return genotypePatterns[genotype];
  }

  // If still unknown, describe it generically based on pattern
  const [allele1, allele2] = genotype.split("/");
  if (allele1 === allele2) {
    if (allele1 === "+" || allele1 === "N") {
      return "be normal for this trait";
    }
    return `be homozygous for ${allele1}`;
  } else {
    if (allele1 === "+" || allele2 === "+") {
      const variant = allele1 === "+" ? allele2 : allele1;
      return `carry one copy of ${variant}`;
    }
    return `be heterozygous (${genotype})`;
  }
}

/**
 * Make carrier info more readable
 */
function makeCarrierReadable(carrierInfo: string): string {
  // "carries recessive black" -> "could produce black offspring"
  // "carries brown" -> "could produce chocolate/brown offspring"
  const carrierPatterns: Record<string, string> = {
    "carries recessive black": "could produce solid black offspring",
    "carries brown": "could produce chocolate/liver offspring",
    "carries dilute": "could produce blue/lilac offspring",
    "carries cream": "could produce cream/red offspring",
    "carries cream/red": "could produce cream/red offspring",
    "carries pattern": "could produce patterned offspring",
    "carries brindle": "could produce brindle offspring",
    "carries long": "could produce long-haired offspring",
    "carries unfurnished": "could produce smooth-faced offspring",
    "smooth face": "will have a smooth face",
  };

  return carrierPatterns[carrierInfo.toLowerCase()] || carrierInfo;
}

/**
 * Generates a simple summary for a trait category
 */
export function getSimpleCategorySummary(
  category: "coatColor" | "coatType" | "health",
  items: Array<{ trait: string; prediction: string }>,
  species: string
): string {
  const offspring = getOffspringName(species);

  if (category === "coatColor") {
    return `What colors and patterns the ${offspring} might have`;
  } else if (category === "coatType") {
    return `What type of coat the ${offspring} will have (curly, straight, fluffy, etc.)`;
  } else if (category === "health") {
    return `Health conditions to be aware of for the ${offspring}`;
  }

  return "";
}

/**
 * Extracts the locus code from a trait string like "A Locus (Agouti)"
 */
export function extractLocusFromTrait(trait: string): string {
  const match = trait.match(/^([A-Za-z0-9]+)\s+Locus/);
  if (match) return match[1];

  // Try to extract from parentheses format
  const parenMatch = trait.match(/\(([A-Za-z0-9]+)\)/);
  if (parenMatch) return parenMatch[1];

  return trait;
}
