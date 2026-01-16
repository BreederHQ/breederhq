/**
 * Sitemap Generation Script for BreederHQ Marketplace
 *
 * This script generates dynamic sitemap.xml files by:
 * 1. Fetching public entity data from the API
 * 2. Combining with static page URLs
 * 3. Outputting sitemap files with proper priorities and change frequencies
 *
 * Usage:
 *   npx tsx scripts/generate-sitemap.ts
 *
 * Environment:
 *   SITEMAP_API_URL - Base URL for API (defaults to http://localhost:6001)
 *   SITEMAP_BASE_URL - Base URL for sitemap (defaults to https://marketplace.breederhq.com)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_URL = process.env.SITEMAP_API_URL || 'http://localhost:6001';
const BASE_URL = process.env.SITEMAP_BASE_URL || 'https://marketplace.breederhq.com';
const OUTPUT_DIR = path.resolve(__dirname, '../dist');
const MAX_URLS_PER_SITEMAP = 50000;

// Types
interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

interface SitemapEntity {
  loc: string;
  lastmod: string;
}

interface SitemapEntitiesResponse {
  breeders: SitemapEntity[];
  animals: SitemapEntity[]; // Currently empty - no individual animal detail pages
  services: SitemapEntity[]; // Currently empty - no individual service detail pages
  animalPrograms: SitemapEntity[];
  breedingPrograms: SitemapEntity[];
  generatedAt: string;
}

// Static URLs with their configurations
const STATIC_URLS: SitemapUrl[] = [
  // Homepage
  { loc: '/', changefreq: 'daily', priority: 1.0 },

  // Main browse pages
  { loc: '/animals', changefreq: 'daily', priority: 0.9 },
  { loc: '/breeders', changefreq: 'daily', priority: 0.9 },
  { loc: '/services', changefreq: 'daily', priority: 0.9 },
  { loc: '/breeding-programs', changefreq: 'daily', priority: 0.9 },

  // Species-filtered animal pages
  { loc: '/animals?species=DOG', changefreq: 'daily', priority: 0.8 },
  { loc: '/animals?species=CAT', changefreq: 'daily', priority: 0.8 },
  { loc: '/animals?species=HORSE', changefreq: 'daily', priority: 0.8 },
  { loc: '/animals?species=GOAT', changefreq: 'daily', priority: 0.8 },
  { loc: '/animals?species=RABBIT', changefreq: 'daily', priority: 0.8 },
  { loc: '/animals?species=SHEEP', changefreq: 'daily', priority: 0.8 },

  // Species-filtered breeder pages
  { loc: '/breeders?species=DOG', changefreq: 'daily', priority: 0.8 },
  { loc: '/breeders?species=CAT', changefreq: 'daily', priority: 0.8 },
  { loc: '/breeders?species=HORSE', changefreq: 'daily', priority: 0.8 },
  { loc: '/breeders?species=GOAT', changefreq: 'daily', priority: 0.8 },
  { loc: '/breeders?species=RABBIT', changefreq: 'daily', priority: 0.8 },
  { loc: '/breeders?species=SHEEP', changefreq: 'daily', priority: 0.8 },

  // Service category pages
  { loc: '/services?category=TRAINING', changefreq: 'weekly', priority: 0.7 },
  { loc: '/services?category=GROOMING', changefreq: 'weekly', priority: 0.7 },
  { loc: '/services?category=TRANSPORT', changefreq: 'weekly', priority: 0.7 },
  { loc: '/services?category=VETERINARY', changefreq: 'weekly', priority: 0.7 },
  { loc: '/services?category=PHOTOGRAPHY', changefreq: 'weekly', priority: 0.7 },
  { loc: '/services?category=BOARDING', changefreq: 'weekly', priority: 0.7 },
  { loc: '/services?category=STUD_SERVICE', changefreq: 'weekly', priority: 0.7 },

  // Auth pages (low priority)
  { loc: '/login', changefreq: 'monthly', priority: 0.3 },
  { loc: '/register', changefreq: 'monthly', priority: 0.3 },
];

/**
 * Escape special XML characters in a string
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format a date as ISO 8601 date string (YYYY-MM-DD)
 */
function formatDate(dateString?: string): string {
  if (!dateString) {
    return new Date().toISOString().split('T')[0];
  }
  return new Date(dateString).toISOString().split('T')[0];
}

/**
 * Generate XML for a single URL entry
 */
function urlToXml(url: SitemapUrl): string {
  const lines: string[] = ['  <url>'];

  lines.push(`    <loc>${escapeXml(BASE_URL + url.loc)}</loc>`);

  if (url.lastmod) {
    lines.push(`    <lastmod>${escapeXml(formatDate(url.lastmod))}</lastmod>`);
  }

  if (url.changefreq) {
    lines.push(`    <changefreq>${url.changefreq}</changefreq>`);
  }

  if (url.priority !== undefined) {
    lines.push(`    <priority>${url.priority.toFixed(1)}</priority>`);
  }

  lines.push('  </url>');

  return lines.join('\n');
}

/**
 * Generate a complete sitemap XML string
 */
function generateSitemapXml(urls: SitemapUrl[]): string {
  const header = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const footer = '</urlset>';

  const urlEntries = urls.map(urlToXml).join('\n');

  return `${header}\n${urlEntries}\n${footer}\n`;
}

/**
 * Generate a sitemap index XML string
 */
function generateSitemapIndexXml(sitemapFiles: string[], lastmod: string): string {
  const header = '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const footer = '</sitemapindex>';

  const entries = sitemapFiles.map((file) => {
    return [
      '  <sitemap>',
      `    <loc>${escapeXml(BASE_URL + '/' + file)}</loc>`,
      `    <lastmod>${escapeXml(formatDate(lastmod))}</lastmod>`,
      '  </sitemap>',
    ].join('\n');
  });

  return `${header}\n${entries.join('\n')}\n${footer}\n`;
}

/**
 * Fetch sitemap entities from the API
 */
async function fetchSitemapEntities(): Promise<SitemapEntitiesResponse | null> {
  try {
    const response = await fetch(`${API_URL}/api/sitemap/entities`);

    if (!response.ok) {
      console.error(`API request failed: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json() as SitemapEntitiesResponse;
  } catch (error) {
    console.error('Failed to fetch sitemap entities:', error);
    return null;
  }
}

/**
 * Transform entity data into sitemap URLs with appropriate settings
 */
function transformEntitiesToUrls(entities: SitemapEntitiesResponse): {
  breeders: SitemapUrl[];
  animals: SitemapUrl[];
  services: SitemapUrl[];
  programs: SitemapUrl[];
} {
  // Breeders - high priority individual pages
  const breeders: SitemapUrl[] = entities.breeders.map((e) => ({
    loc: e.loc,
    lastmod: e.lastmod,
    changefreq: 'weekly' as const,
    priority: 0.7,
  }));

  // Animals - individual listing pages
  const animals: SitemapUrl[] = entities.animals.map((e) => ({
    loc: e.loc,
    lastmod: e.lastmod,
    changefreq: 'weekly' as const,
    priority: 0.7,
  }));

  // Services - individual service listing pages
  const services: SitemapUrl[] = entities.services.map((e) => ({
    loc: e.loc,
    lastmod: e.lastmod,
    changefreq: 'weekly' as const,
    priority: 0.7,
  }));

  // Combine animal programs and breeding programs
  const programs: SitemapUrl[] = [
    ...entities.animalPrograms.map((e) => ({
      loc: e.loc,
      lastmod: e.lastmod,
      changefreq: 'weekly' as const,
      priority: 0.7,
    })),
    ...entities.breedingPrograms.map((e) => ({
      loc: e.loc,
      lastmod: e.lastmod,
      changefreq: 'weekly' as const,
      priority: 0.7,
    })),
  ];

  return { breeders, animals, services, programs };
}

/**
 * Ensure output directory exists
 */
function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * Write sitemap file to disk
 */
function writeSitemapFile(filename: string, content: string): void {
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`  Written: ${filepath}`);
}

/**
 * Main sitemap generation function
 */
async function generateSitemaps(): Promise<void> {
  console.log('=== BreederHQ Marketplace Sitemap Generation ===\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Output Dir: ${OUTPUT_DIR}\n`);

  // Fetch dynamic entity data
  console.log('Fetching entity data from API...');
  const entities = await fetchSitemapEntities();

  if (!entities) {
    console.warn('Warning: Could not fetch entity data. Generating static sitemap only.');
    // Generate static-only sitemap
    ensureOutputDir();
    const staticSitemap = generateSitemapXml(STATIC_URLS);
    writeSitemapFile('sitemap.xml', staticSitemap);
    console.log('\nStatic sitemap generated successfully.');
    return;
  }

  console.log(`  Breeders: ${entities.breeders.length}`);
  console.log(`  Animals: ${entities.animals.length}`);
  console.log(`  Services: ${entities.services.length}`);
  console.log(`  Animal Programs: ${entities.animalPrograms.length}`);
  console.log(`  Breeding Programs: ${entities.breedingPrograms.length}`);

  const { breeders, animals, services, programs } = transformEntitiesToUrls(entities);

  // Calculate total URLs
  const totalUrls =
    STATIC_URLS.length + breeders.length + animals.length + services.length + programs.length;

  console.log(`\nTotal URLs to generate: ${totalUrls}`);

  ensureOutputDir();

  // Decide whether to use sitemap index pattern
  if (totalUrls <= MAX_URLS_PER_SITEMAP) {
    // Single sitemap - combine all URLs
    console.log('\nGenerating single sitemap...');
    const allUrls = [...STATIC_URLS, ...breeders, ...animals, ...services, ...programs];
    const sitemap = generateSitemapXml(allUrls);
    writeSitemapFile('sitemap.xml', sitemap);
  } else {
    // Multiple sitemaps with index
    console.log('\nGenerating sitemap index with multiple sitemaps...');

    const sitemapFiles: string[] = [];

    // Static sitemap
    if (STATIC_URLS.length > 0) {
      const staticSitemap = generateSitemapXml(STATIC_URLS);
      writeSitemapFile('sitemap-static.xml', staticSitemap);
      sitemapFiles.push('sitemap-static.xml');
    }

    // Breeders sitemap(s)
    if (breeders.length > 0) {
      const breedersSitemap = generateSitemapXml(breeders);
      writeSitemapFile('sitemap-breeders.xml', breedersSitemap);
      sitemapFiles.push('sitemap-breeders.xml');
    }

    // Animals sitemap(s)
    if (animals.length > 0) {
      const animalsSitemap = generateSitemapXml(animals);
      writeSitemapFile('sitemap-animals.xml', animalsSitemap);
      sitemapFiles.push('sitemap-animals.xml');
    }

    // Services sitemap
    if (services.length > 0) {
      const servicesSitemap = generateSitemapXml(services);
      writeSitemapFile('sitemap-services.xml', servicesSitemap);
      sitemapFiles.push('sitemap-services.xml');
    }

    // Programs sitemap
    if (programs.length > 0) {
      const programsSitemap = generateSitemapXml(programs);
      writeSitemapFile('sitemap-programs.xml', programsSitemap);
      sitemapFiles.push('sitemap-programs.xml');
    }

    // Sitemap index
    const sitemapIndex = generateSitemapIndexXml(sitemapFiles, entities.generatedAt);
    writeSitemapFile('sitemap.xml', sitemapIndex);
  }

  console.log('\nSitemap generation completed successfully!');
  console.log(`Generated at: ${entities.generatedAt}`);
}

// Run the script
generateSitemaps().catch((error) => {
  console.error('Sitemap generation failed:', error);
  process.exit(1);
});
