// scripts/codemods/normalize-placement.mjs
// Usage:
//   node scripts/codemods/normalize-placement.mjs --dry --list
//   node scripts/codemods/normalize-placement.mjs --dry --list --patch
//   node scripts/codemods/normalize-placement.mjs                 (writes)
// Flags:
//   --dry   do not write files
//   --list  print per-file summary of what would change
//   --patch print inline previews for touched files (truncated)
//   --csv   write summary CSV to ./codemod-report/summary.csv

import fg from "fast-glob";
import fs from "node:fs";
import path from "node:path";

const argv = new Set(process.argv.slice(2));
const DRY = argv.has("--dry");
const LIST = argv.has("--list");
const PATCH = argv.has("--patch");
const CSV = argv.has("--csv");

const INCLUDE_GLOBS = ["apps/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"];
const EXCLUDE = [
  "**/node_modules/**",
  "**/dist/**",
  "**/.turbo/**",
  "**/.next/**",
  "**/build/**",
  "**/*.d.ts",
  "**/prisma/**",
  "**/migrations/**",
];

const IDENT_RENAMES = [
  // placement fields
  { name: "lockedGoHomeDate → lockedPlacementStartDate",   from: /\blockedGoHomeDate\b/g,             to: "lockedPlacementStartDate" },
  { name: "expectedGoHomeExtendedEnd → expectedPlacementCompleted", from: /\bexpectedGoHomeExtendedEnd\b/g,  to: "expectedPlacementCompleted" },
  { name: "expectedGoHome → expectedPlacementStart",       from: /\bexpectedGoHome\b/g,                to: "expectedPlacementStart" },

  // actuals / legacy actuals
  { name: "actualHomingStartedDate → placementStartDateActual",      from: /\bactualHomingStartedDate\b/g,    to: "placementStartDateActual" },
  { name: "actualHomingExtendedEnds → placementCompletedDateActual", from: /\bactualHomingExtendedEnds\b/g,   to: "placementCompletedDateActual" },
  { name: "actualGoHomeDate → placementStartDateActual",             from: /\bactualGoHomeDate\b/g,           to: "placementStartDateActual" },

  // computed milestone aliases
  { name: "gohome_expected → placement_start_expected",              from: /\bgohome_expected\b/g,            to: "placement_start_expected" },
  { name: "gohome_extended_end_expected → placement_completed_expected", from: /\bgohome_extended_end_expected\b/g, to: "placement_completed_expected" },

  // availability kind normalization
  { name: 'kind: "risk" → kind: "risky"',                            from: /\bkind:\s*"risk"\b/g,             to: 'kind: "risky"' },
];

const STRING_SWAPS = [
  {
    name: `"Go Home" → "Placement" (labels)`,
    from: /(["'`])Go Home( \((Extended)\))?\1/g,
    to: (m) => `"Placement${m.includes("Extended") ? " (Extended)" : ""}"`,
  },
  { name: `Homing Starts (Expected) → Placement Starts (Expected)`,             from: /Homing Starts \(Expected\)/g,             to: "Placement Starts (Expected)" },
  { name: `Homing Extended End(s) (Expected) → Placement Extended Ends (Expected)`, from: /Homing Extended End\(s?\) \(Expected\)/g, to: "Placement Extended Ends (Expected)" },
  { name: `Homing Started (Actual) → Placement Started (Actual)`,               from: /Homing Started \(Actual\)/g,              to: "Placement Started (Actual)" },
  { name: `Homing Extended Ends (Actual) → Placement Completed (Actual)`,       from: /Homing Extended Ends \(Actual\)/g,        to: "Placement Completed (Actual)" },
];

// last resort plain phrase
const LOOSE_GO_HOME = [
  { name: `"Go Home" → "Placement" (loose text)`, from: /\bGo Home\b/g, to: "Placement" },
];

function countMatches(regex, text) {
  if (!regex.global) {
    // clone with global
    const flags = `${regex.ignoreCase ? "i" : ""}${regex.multiline ? "m" : ""}${regex.unicode ? "u" : ""}${regex.dotAll ? "s" : ""}g`;
    regex = new RegExp(regex.source, flags);
  }
  let m, c = 0;
  while ((m = regex.exec(text)) !== null) c++;
  return c;
}

function applyAll(text, renames) {
  const perRule = [];
  let out = text;
  for (const r of renames) {
    const before = countMatches(r.from, out);
    if (before > 0) {
      const replaced = typeof r.to === "function" ? out.replace(r.from, (...args) => r.to(...args)) : out.replace(r.from, r.to);
      const after = countMatches(r.from, replaced);
      const delta = before - after; // number consumed
      perRule.push({ name: r.name, hits: before, applied: delta });
      out = replaced;
    } else {
      perRule.push({ name: r.name, hits: 0, applied: 0 });
    }
  }
  return { text: out, perRule };
}

function summarizePerFile(perRuleArrays) {
  // merge IDENT_RENAMES, STRING_SWAPS, LOOSE into one ordered list
  const flat = [...IDENT_RENAMES, ...STRING_SWAPS, ...LOOSE_GO_HOME].map(r => r.name);
  const totals = new Map(flat.map(n => [n, 0]));
  for (const arr of perRuleArrays) {
    for (const item of arr) {
      totals.set(item.name, (totals.get(item.name) || 0) + (item.applied || 0));
    }
  }
  return totals;
}

function makePreview(original, modified, maxShown = 8) {
  // naive line diff preview, show only changed lines with a little context
  const o = original.split(/\r?\n/);
  const m = modified.split(/\r?\n/);
  const maxLines = 8000; // safety
  if (o.length > maxLines || m.length > maxLines) {
    return "[preview truncated: file very large]";
  }

  const changed = [];
  const len = Math.max(o.length, m.length);
  for (let i = 0; i < len; i++) {
    if (o[i] !== m[i]) {
      changed.push(i);
    }
  }
  if (changed.length === 0) return "[no visible line changes]";

  const blocks = [];
  for (let i = 0; i < Math.min(changed.length, maxShown); i++) {
    const idx = changed[i];
    const start = Math.max(0, idx - 2);
    const end = Math.min(len - 1, idx + 2);
    const lines = [];
    lines.push(`@@ ${idx + 1} @@`);
    for (let j = start; j <= end; j++) {
      const oldL = o[j] ?? "";
      const newL = m[j] ?? "";
      if (oldL === newL) lines.push(`  ${oldL}`);
      else {
        if (oldL !== undefined) lines.push(`- ${oldL}`);
        if (newL !== undefined) lines.push(`+ ${newL}`);
      }
    }
    blocks.push(lines.join("\n"));
  }
  if (changed.length > maxShown) blocks.push(`... (${changed.length - maxShown} more changed hunks)`);
  return blocks.join("\n");
}

async function main() {
  const files = await fg(INCLUDE_GLOBS, { ignore: EXCLUDE, dot: true });

  let touched = 0;
  let totalApplied = 0;
  const perFile = []; // { file, appliedByRule: [{name,hits,applied}], totalApplied }

  for (const filePath of files) {
    const original = fs.readFileSync(filePath, "utf8");
    let text = original;

    const r1 = applyAll(text, IDENT_RENAMES);  text = r1.text;
    const r2 = applyAll(text, STRING_SWAPS);   text = r2.text;
    const r3 = applyAll(text, LOOSE_GO_HOME);  text = r3.text;

    const appliedByRule = [...r1.perRule, ...r2.perRule, ...r3.perRule];
    const fileApplied = appliedByRule.reduce((a, b) => a + (b.applied || 0), 0);

    if (fileApplied > 0) {
      touched++;
      totalApplied += fileApplied;

      perFile.push({ file: filePath, appliedByRule, totalApplied: fileApplied });

      if (!DRY) {
        const dir = path.dirname(filePath);
        const base = path.basename(filePath);
        const bak = path.join(dir, base + ".bak.codemod");
        if (!fs.existsSync(bak)) fs.writeFileSync(bak, original, "utf8"); // one-time backup
        fs.writeFileSync(filePath, text, "utf8");
      } else if (PATCH || LIST) {
        // only generate preview when asked, and only for dry mode
        if (PATCH) {
          const preview = makePreview(original, text);
          console.log("\n" + "=".repeat(80));
          console.log(filePath);
          console.log("-".repeat(80));
          console.log(preview);
        }
      }
    }
  }

  // Console summary
  console.log(`${DRY ? "[dry]" : "[write]"} scanned ${files.length} files`);
  console.log(`touched ${touched} files, applied ~${totalApplied} replacements`);

  if (LIST || CSV) {
    // print table of touched files with totals
    console.log("\nFiles to be changed:");
    perFile
      .sort((a, b) => b.totalApplied - a.totalApplied)
      .forEach((f) => console.log(`${f.totalApplied.toString().padStart(4)}  ${f.file}`));

    // top-level totals by rule
    const totals = summarizePerFile(perFile.map(f => f.appliedByRule));
    console.log("\nBy rule:");
    for (const [name, n] of totals.entries()) {
      if (n > 0) console.log(`${n.toString().padStart(4)}  ${name}`);
    }
  }

  if (CSV) {
    const outDir = path.resolve("codemod-report");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const csvPath = path.join(outDir, "summary.csv");
    const header = ["file", ...[...IDENT_RENAMES, ...STRING_SWAPS, ...LOOSE_GO_HOME].map(r => r.name), "total"].join(",");
    const rows = [header];

    for (const f of perFile) {
      const map = new Map(f.appliedByRule.map(x => [x.name, x.applied || 0]));
      const cols = [...IDENT_RENAMES, ...STRING_SWAPS, ...LOOSE_GO_HOME].map(r => map.get(r.name) || 0);
      rows.push([f.file, ...cols, f.totalApplied].join(","));
    }
    fs.writeFileSync(csvPath, rows.join("\n"), "utf8");
    console.log(`\nCSV written to ${csvPath}`);
  }

  if (DRY && !LIST && !PATCH) {
    console.log("Tip: add --list to see which files, and --patch for inline previews.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
