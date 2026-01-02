// apps/marketplace/src/utils/slug.ts
// Utilities for slug normalization and canonical URL handling

/**
 * Normalizes a slug to canonical form: lowercase, dash-only, no trailing slashes.
 * Returns null if the input is empty or invalid.
 */
export function normalizeSlug(slug: string | undefined | null): string | null {
  if (!slug) return null;

  // Decode URI components first (in case of encoded characters)
  let normalized: string;
  try {
    normalized = decodeURIComponent(slug);
  } catch {
    normalized = slug;
  }

  // Convert to lowercase
  normalized = normalized.toLowerCase();

  // Replace underscores with dashes
  normalized = normalized.replace(/_/g, "-");

  // Remove any characters that aren't alphanumeric or dashes
  normalized = normalized.replace(/[^a-z0-9-]/g, "");

  // Collapse multiple dashes into single dash
  normalized = normalized.replace(/-+/g, "-");

  // Remove leading/trailing dashes
  normalized = normalized.replace(/^-+|-+$/g, "");

  return normalized || null;
}

/**
 * Checks if the given slug matches canonical form.
 * Returns true if the slug is already canonical.
 */
export function isCanonicalSlug(slug: string): boolean {
  const normalized = normalizeSlug(slug);
  return normalized === slug;
}

/**
 * Builds a canonical marketplace URL path.
 */
export function buildProgramPath(programSlug: string): string {
  const normalized = normalizeSlug(programSlug);
  if (!normalized) return "/marketplace";
  return `/marketplace/programs/${normalized}`;
}

export function buildOffspringGroupPath(programSlug: string, listingSlug: string): string {
  const normalizedProgram = normalizeSlug(programSlug);
  const normalizedListing = normalizeSlug(listingSlug);
  if (!normalizedProgram || !normalizedListing) return "/marketplace";
  return `/marketplace/programs/${normalizedProgram}/offspring-groups/${normalizedListing}`;
}

export function buildAnimalPath(programSlug: string, urlSlug: string): string {
  const normalizedProgram = normalizeSlug(programSlug);
  const normalizedAnimal = normalizeSlug(urlSlug);
  if (!normalizedProgram || !normalizedAnimal) return "/marketplace";
  return `/marketplace/programs/${normalizedProgram}/animals/${normalizedAnimal}`;
}
