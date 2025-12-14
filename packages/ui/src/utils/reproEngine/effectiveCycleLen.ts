import type { CycleLenInputs, EffectiveCycleLenResult } from "./types";
import { getSpeciesDefaults } from "./defaults";

function parseDay(d: string): number {
  const [y, m, dd] = d.split("-").map(Number);
  return Date.UTC(y, m - 1, dd) / 86400000;
}

export function computeEffectiveCycleLenDays(input: CycleLenInputs): EffectiveCycleLenResult {
  const bio = getSpeciesDefaults(input.species).cycleLenDays;

  const s = input.cycleStartsAsc;
  const gaps: number[] = [];
  for (let i = 1; i < s.length; i++) {
    const a = parseDay(s[i - 1]);
    const b = parseDay(s[i]);
    const gap = Math.round(b - a);
    if (gap > 0) gaps.push(gap);
  }

  const recent = gaps.slice(-3);
  const n = recent.length;

  if (n === 0) {
    return { effectiveCycleLenDays: bio, gapsUsedDays: [], weighting: { observed: 0, biology: 1 } };
  }

  const obs = Math.round(recent.reduce((x, y) => x + y, 0) / n);

  const wObs =
    n >= 3 ? 1 :
    n === 2 ? 0.67 :
    0.50;

  const eff = Math.round(obs * wObs + bio * (1 - wObs));
  return {
    effectiveCycleLenDays: eff,
    gapsUsedDays: recent,
    weighting: { observed: wObs, biology: 1 - wObs },
  };
}
