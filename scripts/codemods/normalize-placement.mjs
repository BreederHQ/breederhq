// scripts/codemods/normalize-placement.mjs
import fs from "node:fs";
import path from "node:path";
import glob from "fast-glob";

/**
 * Run like:
 *   node scripts/codemods/normalize-placement.mjs
 * Optionally pass globs:
 *   node scripts/codemods/normalize-placement.mjs "apps/**/{src,lib}/**/*.{ts,tsx}" "packages/**/src/**/*.{ts,tsx}"
 */

const globs = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      "apps/**/{src,lib}/**/*.{ts,tsx}",
      "packages/**/src/**/*.{ts,tsx}",
      "packages/**/resources/**/*.{ts,tsx}",
      "packages/**/types/**/*.{ts,tsx}",
    ];

const mappings = [
  // UI labels first
  { name: `Homing → Placement (labels)`, from: /Homing\b/g, to: "Placement" },
  { name: `Whelped → Birthed (labels)`, from: /\bWhelped\b/g, to: "Birthed" },
  { name: `Whelping → Birth (labels)`, from: /\bWhelping\b/g, to: "Birth" },

  // Status literals
  { name: `HOMING → PLACEMENT`, from: /\bHOMING\b/g, to: "PLACEMENT" },
  { name: `WHELPED → BIRTHED`, from: /\bWHELPED\b/g, to: "BIRTHED" },

  // Field names: expected/locked/actual
  { name: "expectedWhelpDate → expectedBirthDate", from: /\bexpectedWhelpDate\b/g, to: "expectedBirthDate" },
  { name: "whelpDateActual → birthDateActual", from: /\bwhelpDateActual\b/g, to: "birthDateActual" },

  { name: "expectedGoHome → expectedPlacementStart", from: /\bexpectedGoHome\b/g, to: "expectedPlacementStart" },
  { name: "expectedGoHomeExtendedEnd → expectedPlacementCompleted", from: /\bexpectedGoHomeExtendedEnd\b/g, to: "expectedPlacementCompleted" },
  { name: "lockedGoHomeDate → lockedPlacementStartDate", from: /\blockedGoHomeDate\b/g, to: "lockedPlacementStartDate" },

  { name: "goHomeDateActual → placementStartDateActual", from: /\bgoHomeDateActual\b/g, to: "placementStartDateActual" },
  { name: "lastGoHomeDateActual → placementCompletedDateActual", from: /\blastGoHomeDateActual\b/g, to: "placementCompletedDateActual" },
  { name: "actualHomingStartedDate → placementStartDateActual", from: /\bactualHomingStartedDate\b/g, to: "placementStartDateActual" },
  { name: "actualHomingExtendedEnds → placementCompletedDateActual", from: /\bactualHomingExtendedEnds\b/g, to: "placementCompletedDateActual" },

  // Stage keys used by adapters, gantt, calendar
  { name: `key "whelping" → "birth"`, from: /(["'`])whelping\1/g, to: `$1birth$1` },
  { name: `key "goHomeNormal" → "placement"`, from: /(["'`])goHomeNormal\1/g, to: `$1placement$1` },
  { name: `key "goHomeExtended" → "placementExtended"`, from: /(["'`])goHomeExtended\1/g, to: `$1placementExtended$1` },

  // Method/property shards where safe by whole word
  { name: `whelping_* → birth_*`, from: /\bwhelping_/g, to: "birth_" },
  { name: `gohome_* → placement_*`, from: /\bgohome_/g, to: "placement_" },

  // Settings help text
  { name: `help text Whelping FULL → Birth FULL`, from: /Whelping FULL/g, to: "Birth FULL" },
];

function run() {
  const files = glob.sync(globs, { dot: true });
  let changed = 0;

  for (const file of files) {
    const abs = path.resolve(file);
    const orig = fs.readFileSync(abs, "utf8");
    let txt = orig;

    for (const m of mappings) {
      txt = txt.replace(m.from, m.to);
    }

    if (txt !== orig) {
      fs.writeFileSync(abs, txt, "utf8");
      changed++;
      process.stdout.write(`updated: ${file}\n`);
    }
  }

  process.stdout.write(`\nDone. Updated ${changed} file(s).\n`);
}

run();
