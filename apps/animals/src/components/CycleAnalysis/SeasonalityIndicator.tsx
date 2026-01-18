import * as React from "react";
import { Badge, Tooltip } from "@bhq/ui";

type SeasonalityIndicatorProps = {
  species: string;
  /** Hemisphere: "N" for Northern, "S" for Southern. Defaults to "N" */
  hemisphere?: "N" | "S";
};

type SeasonInfo = {
  label: string;
  months: string;
  peakMonths: number[]; // 1-12 (January = 1)
  icon: string;
  description: string;
};

// Northern hemisphere breeding seasons by species
const NORTHERN_SEASONS: Record<string, SeasonInfo> = {
  HORSE: {
    label: "Spring/Summer Breeder",
    months: "April – August",
    peakMonths: [4, 5, 6, 7, 8],
    icon: "☀️",
    description: "Horses are long-day breeders. Cycles become regular as daylight increases in spring and continue through summer.",
  },
  GOAT: {
    label: "Fall Breeder",
    months: "September – February",
    peakMonths: [9, 10, 11, 12, 1, 2],
    icon: "🍂",
    description: "Goats are short-day breeders. Heat cycles begin as daylight decreases in fall and continue through winter.",
  },
  SHEEP: {
    label: "Fall Breeder",
    months: "August – January",
    peakMonths: [8, 9, 10, 11, 12, 1],
    icon: "🍂",
    description: "Sheep are short-day breeders. Heat cycles begin as daylight decreases in late summer/fall.",
  },
};

// Southern hemisphere is offset by ~6 months
const SOUTHERN_SEASONS: Record<string, SeasonInfo> = {
  HORSE: {
    label: "Spring/Summer Breeder",
    months: "October – February",
    peakMonths: [10, 11, 12, 1, 2],
    icon: "☀️",
    description: "Horses are long-day breeders. Cycles become regular as daylight increases in spring and continue through summer.",
  },
  GOAT: {
    label: "Fall Breeder",
    months: "March – August",
    peakMonths: [3, 4, 5, 6, 7, 8],
    icon: "🍂",
    description: "Goats are short-day breeders. Heat cycles begin as daylight decreases in fall and continue through winter.",
  },
  SHEEP: {
    label: "Fall Breeder",
    months: "February – July",
    peakMonths: [2, 3, 4, 5, 6, 7],
    icon: "🍂",
    description: "Sheep are short-day breeders. Heat cycles begin as daylight decreases in late summer/fall.",
  },
};

// Non-seasonal species (for reference)
const NON_SEASONAL_SPECIES = ["DOG", "CAT", "RABBIT", "PIG", "CATTLE"];

function isSeasonalBreeder(species: string): boolean {
  const s = species.toUpperCase();
  return s === "HORSE" || s === "GOAT" || s === "SHEEP";
}

function getCurrentMonth(): number {
  return new Date().getMonth() + 1; // 1-12
}

function isInBreedingSeason(peakMonths: number[], currentMonth: number): boolean {
  return peakMonths.includes(currentMonth);
}

export function SeasonalityIndicator({ species, hemisphere = "N" }: SeasonalityIndicatorProps) {
  const speciesUpper = species.toUpperCase();

  if (!isSeasonalBreeder(speciesUpper)) {
    return null;
  }

  const seasons = hemisphere === "S" ? SOUTHERN_SEASONS : NORTHERN_SEASONS;
  const seasonInfo = seasons[speciesUpper];

  if (!seasonInfo) {
    return null;
  }

  const currentMonth = getCurrentMonth();
  const inSeason = isInBreedingSeason(seasonInfo.peakMonths, currentMonth);

  const tooltipContent = (
    <div className="text-xs max-w-xs">
      <div className="font-medium mb-1">{seasonInfo.label}</div>
      <div className="text-secondary mb-2">{seasonInfo.description}</div>
      <div className="text-secondary">
        Peak breeding: {seasonInfo.months} ({hemisphere === "N" ? "Northern" : "Southern"} Hemisphere)
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent}>
      <Badge variant={inSeason ? "green" : "neutral"}>
        {seasonInfo.icon} {inSeason ? "In Season" : "Off Season"}
        <span className="ml-1 opacity-70">({seasonInfo.months})</span>
      </Badge>
    </Tooltip>
  );
}

// Export helper for use in cycle projection adjustments
export function getSeasonalBreedingInfo(species: string, hemisphere: "N" | "S" = "N") {
  const speciesUpper = species.toUpperCase();
  if (!isSeasonalBreeder(speciesUpper)) {
    return null;
  }

  const seasons = hemisphere === "S" ? SOUTHERN_SEASONS : NORTHERN_SEASONS;
  const seasonInfo = seasons[speciesUpper];

  if (!seasonInfo) {
    return null;
  }

  const currentMonth = getCurrentMonth();
  return {
    ...seasonInfo,
    inSeason: isInBreedingSeason(seasonInfo.peakMonths, currentMonth),
    currentMonth,
    hemisphere,
  };
}

export { isSeasonalBreeder };
