// scripts/codemods/normalize-placement.mjs
import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";

// Usage (repo root):
//   node scripts/codemods/normalize-placement.mjs
//   node scripts/codemods/normalize-placement.mjs "apps/breeding/src/**/*.{ts,tsx}" "packages/ui/src/**/*.{ts,tsx}"

const defaultGlobs = [
  "apps/**/{src,lib}/**/*.{ts,tsx}",
  "packages/**/src/**/*.{ts,tsx}",
  "packages/**/resources/**/*.{ts,tsx}",
  "packages/**/types/**/*.{ts,tsx}",
  // exclude backups
  "!**/*.bak",
  "!**/*.backup.*",
];

const globs = process.argv.slice(2).length ? process.argv.slice(2) : defaultGlobs;

const mappings = [
  // ── Labels & statuses ─────────────────────────────────────────────────────
  { name: "Homing → Placement (labels)", from: /Homing\b/g, to: "Placement" },
  { name: "Whelped → Birthed (labels)", from: /\bWhelped\b/g, to: "Birthed" },
  { name: "Whelping → Birth (labels)", from: /\bWhelping\b/g, to: "Birth" },
  { name: "HOMING → PLACEMENT", from: /\bHOMING\b/g, to: "PLACEMENT" },
  { name: "WHELPED → BIRTHED", from: /\bWHELPED\b/g, to: "BIRTHED" },

  // ── API / field names (camelCase) ─────────────────────────────────────────
  { name: "expectedWhelpDate → expectedBirthDate", from: /\bexpectedWhelpDate\b/g, to: "expectedBirthDate" },
  { name: "whelpDateActual → birthDateActual", from: /\bwhelpDateActual\b/g, to: "birthDateActual" },
  { name: "expectedGoHome → expectedPlacementStart", from: /\bexpectedGoHome\b/g, to: "expectedPlacementStart" },
  { name: "expectedGoHomeExtendedEnd → expectedPlacementCompleted", from: /\bexpectedGoHomeExtendedEnd\b/g, to: "expectedPlacementCompleted" },
  { name: "lockedGoHomeDate → lockedPlacementStartDate", from: /\blockedGoHomeDate\b/g, to: "lockedPlacementStartDate" },
  { name: "goHomeDateActual → placementStartDateActual", from: /\bgoHomeDateActual\b/g, to: "placementStartDateActual" },
  { name: "lastGoHomeDateActual → placementCompletedDateActual", from: /\blastGoHomeDateActual\b/g, to: "placementCompletedDateActual" },
  { name: "actualHomingStartedDate → placementStartDateActual", from: /\bactualHomingStartedDate\b/g, to: "placementStartDateActual" },
  { name: "actualHomingExtendedEnds → placementCompletedDateActual", from: /\bactualHomingExtendedEnds\b/g, to: "placementCompletedDateActual" },

  // ── Stage keys in quoted strings ──────────────────────────────────────────
  { name: `key "whelping" → "birth"`, from: /(["'`])whelping\1/g, to: `$1birth$1` },
  { name: `key "goHomeNormal" → "placement"`, from: /(["'`])goHomeNormal\1/g, to: `$1placement$1` },
  { name: `key "goHomeExtended" → "placementExtended"`, from: /(["'`])goHomeExtended\1/g, to: `$1placementExtended$1` },

  // ── Variable tokens used in math/hooks (camelCase) ────────────────────────
  { name: "whelpFull → birthFull", from: /\bwhelpFull\b/g, to: "birthFull" },
  { name: "whelpLikely → birthLikely", from: /\bwhelpLikely\b/g, to: "birthLikely" },

  { name: "whelpFullStart → birthFullStart", from: /\bwhelpFullStart\b/g, to: "birthFullStart" },
  { name: "whelpFullEnd → birthFullEnd", from: /\bwhelpFullEnd\b/g, to: "birthFullEnd" },
  { name: "whelpLikelyStart → birthLikelyStart", from: /\bwhelpLikelyStart\b/g, to: "birthLikelyStart" },
  { name: "whelpLikelyEnd → birthLikelyEnd", from: /\bwhelpLikelyEnd\b/g, to: "birthLikelyEnd" },

  { name: "goHomeNormalFullStart → placementFullStart", from: /\bgoHomeNormalFullStart\b/g, to: "placementFullStart" },
  { name: "goHomeNormalFullEnd → placementFullEnd", from: /\bgoHomeNormalFullEnd\b/g, to: "placementFullEnd" },
  { name: "goHomeExtendedFullStart → placementExtendedFullStart", from: /\bgoHomeExtendedFullStart\b/g, to: "placementExtendedFullStart" },
  { name: "goHomeExtendedFullEnd → placementExtendedFullEnd", from: /\bgoHomeExtendedFullEnd\b/g, to: "placementExtendedFullEnd" },

  { name: "goHomeLikelyStart → placementLikelyStart", from: /\bgoHomeLikelyStart\b/g, to: "placementLikelyStart" },
  { name: "goHomeLikelyEnd → placementLikelyEnd", from: /\bgoHomeLikelyEnd\b/g, to: "placementLikelyEnd" },

  // ── Underscore shards / snake_case used in hooks/types ───────────────────
  { name: "whelping_* → birth_*", from: /\bwhelping_/g, to: "birth_" },
  { name: "gohome_* → placement_*", from: /\bgohome_/g, to: "placement_" },
  { name: "last_offspring_gohome_expected → last_offspring_placement_expected", from: /\blast_offspring_gohome_expected\b/g, to: "last_offspring_placement_expected" },

  // ── Straggler identifiers in PlanDrawer etc. ─────────────────────────────
  { name: "whelped_actual → birthDateActual", from: /\bwhelped_actual\b/g, to: "birthDateActual" },

  // ── Help text / comments that leak to UI ─────────────────────────────────
  { name: "Whelping FULL → Birth FULL", from: /Whelping FULL/g, to: "Birth FULL" },
];

function applyMappings(text) {
  let out = text;
  for (const m of mappings) out = out.replace(m.from, m.to);
  return out;
}

function run() {
  const files = fg.sync(globs, { dot: true, onlyFiles: true });
  let changed = 0;

  for (const file of files) {
    const abs = path.resolve(file);
    const orig = fs.readFileSync(abs, "utf8");
    const next = applyMappings(orig);
    if (next !== orig) {
      fs.writeFileSync(abs, next, "utf8");
      process.stdout.write(`updated: ${file}\n`);
      changed++;
    }
  }

  process.stdout.write(`\nDone. Updated ${changed} file(s).\n`);
}

run();
