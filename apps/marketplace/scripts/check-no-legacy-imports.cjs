#!/usr/bin/env node
/**
 * Guard script to prevent legacy imports.
 * Run in prebuild to catch any regressions.
 */

const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "..", "src");
const FORBIDDEN_PATTERNS = [
  /from\s+["']\.\.?\/?core\//,
  /from\s+["']\.\.?\/?shared\//,
  /from\s+["']\.\.?\/?shells\//,
  /from\s+["']\.\.?\/?ui\//,
];

const FORBIDDEN_FOLDERS = ["core", "shared", "shells", "ui"];

let errors = [];

// Check for forbidden folders
for (const folder of FORBIDDEN_FOLDERS) {
  const folderPath = path.join(SRC_DIR, folder);
  if (fs.existsSync(folderPath)) {
    errors.push(`Forbidden folder exists: src/${folder}/`);
  }
}

// Recursively find all .ts and .tsx files
function findTsFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findTsFiles(fullPath, files);
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }
  return files;
}

// Check all source files for forbidden imports
const files = findTsFiles(SRC_DIR);
for (const file of files) {
  const content = fs.readFileSync(file, "utf-8");
  const relativePath = path.relative(SRC_DIR, file);

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(content)) {
      errors.push(`Forbidden import in src/${relativePath}: matches ${pattern}`);
    }
  }
}

if (errors.length > 0) {
  console.error("\n❌ MARKETPLACE STRUCTURE GUARD FAILED\n");
  for (const error of errors) {
    console.error(`  • ${error}`);
  }
  console.error("\nLegacy imports/folders are not allowed. Use the new structure:\n");
  console.error("  src/api/       - API client, types, errors");
  console.error("  src/auth/      - LoginPage, RegisterPage, AuthPage");
  console.error("  src/gate/      - MarketplaceGate, AccessNotAvailable");
  console.error("  src/layout/    - MarketplaceLayout");
  console.error("  src/marketplace/pages/      - ProgramsPage, ProgramPage, ListingPage");
  console.error("  src/marketplace/components/ - FiltersBar, Pager, ProgramTile, etc.");
  console.error("  src/marketplace/hooks/      - useProgramsQuery, etc.");
  console.error("");
  process.exit(1);
}

console.log("✓ Marketplace structure guard passed - no legacy imports or folders found");
