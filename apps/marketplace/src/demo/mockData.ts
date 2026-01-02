// apps/marketplace/src/demo/mockData.ts
// Realistic mock data for Marketplace demo mode
import type {
  PublicProgramSummaryDTO,
  PublicProgramDTO,
  PublicOffspringGroupListingDTO,
  ListingDetailDTO,
  PublicOffspringDTO,
  ProgramsResponse,
  ListingsResponse,
} from "../api/types";

// ============================================================================
// MOCK BREEDERS (Programs)
// ============================================================================

export const MOCK_PROGRAMS: PublicProgramSummaryDTO[] = [
  {
    slug: "sunny-meadows-goldens",
    name: "Sunny Meadows Goldens",
    location: "Austin, TX",
    species: ["dog"],
    breed: "Golden Retriever",
    photoUrl: null,
  },
  {
    slug: "riverside-shepherds",
    name: "Riverside German Shepherds",
    location: "Denver, CO",
    species: ["dog"],
    breed: "German Shepherd",
    photoUrl: null,
  },
  {
    slug: "maple-leaf-doodles",
    name: "Maple Leaf Doodles",
    location: "Seattle, WA",
    species: ["dog"],
    breed: "Goldendoodle",
    photoUrl: null,
  },
  {
    slug: "blue-ribbon-labs",
    name: "Blue Ribbon Labradors",
    location: "Nashville, TN",
    species: ["dog"],
    breed: "Labrador Retriever",
    photoUrl: null,
  },
  {
    slug: "heartland-cavaliers",
    name: "Heartland Cavaliers",
    location: "Kansas City, MO",
    species: ["dog"],
    breed: "Cavalier King Charles Spaniel",
    photoUrl: null,
  },
  {
    slug: "pacific-poodles",
    name: "Pacific Standard Poodles",
    location: "San Diego, CA",
    species: ["dog"],
    breed: "Standard Poodle",
    photoUrl: null,
  },
  {
    slug: "mountain-view-aussies",
    name: "Mountain View Aussies",
    location: "Boulder, CO",
    species: ["dog"],
    breed: "Australian Shepherd",
    photoUrl: null,
  },
  {
    slug: "southern-charm-frenchies",
    name: "Southern Charm Frenchies",
    location: "Charleston, SC",
    species: ["dog"],
    breed: "French Bulldog",
    photoUrl: null,
  },
];

export const MOCK_PROGRAM_DETAILS: Record<string, PublicProgramDTO> = {
  "sunny-meadows-goldens": {
    slug: "sunny-meadows-goldens",
    name: "Sunny Meadows Goldens",
    bio: "Family-owned breeding program dedicated to raising healthy, well-socialized Golden Retrievers since 2015. All our dogs are health tested and raised in our home with early neurological stimulation.",
    website: "https://example.com/sunny-meadows",
    publicContactEmail: null,
  },
  "riverside-shepherds": {
    slug: "riverside-shepherds",
    name: "Riverside German Shepherds",
    bio: "Specializing in working-line German Shepherds with excellent temperament and drive. Our dogs excel in protection, search and rescue, and as devoted family companions.",
    website: "https://example.com/riverside",
    publicContactEmail: null,
  },
  "maple-leaf-doodles": {
    slug: "maple-leaf-doodles",
    name: "Maple Leaf Doodles",
    bio: "We breed F1 and F1B Goldendoodles with a focus on health, temperament, and hypoallergenic coats. All puppies come with a 2-year health guarantee.",
    website: null,
    publicContactEmail: null,
  },
  "blue-ribbon-labs": {
    slug: "blue-ribbon-labs",
    name: "Blue Ribbon Labradors",
    bio: "Third-generation Labrador breeder producing exceptional hunting companions and family dogs. Our labs are known for their calm demeanor and trainability.",
    website: "https://example.com/blue-ribbon-labs",
    publicContactEmail: null,
  },
  "heartland-cavaliers": {
    slug: "heartland-cavaliers",
    name: "Heartland Cavaliers",
    bio: "Small hobby breeder focusing on heart-healthy Cavalier King Charles Spaniels. All breeding dogs are cardiac certified annually.",
    website: null,
    publicContactEmail: null,
  },
  "pacific-poodles": {
    slug: "pacific-poodles",
    name: "Pacific Standard Poodles",
    bio: "AKC Breeder of Merit producing beautiful, intelligent Standard Poodles in a variety of colors. Health testing includes hips, eyes, and genetic panels.",
    website: "https://example.com/pacific-poodles",
    publicContactEmail: null,
  },
  "mountain-view-aussies": {
    slug: "mountain-view-aussies",
    name: "Mountain View Aussies",
    bio: "Breeding versatile Australian Shepherds for sport, work, and family life. Our dogs compete in agility, herding, and conformation.",
    website: null,
    publicContactEmail: null,
  },
  "southern-charm-frenchies": {
    slug: "southern-charm-frenchies",
    name: "Southern Charm Frenchies",
    bio: "Boutique French Bulldog breeder with emphasis on health and structure. All puppies are raised in-home with extensive socialization.",
    website: "https://example.com/southern-charm",
    publicContactEmail: null,
  },
};

// ============================================================================
// MOCK LITTERS (Listings)
// ============================================================================

const MOCK_LISTINGS_BY_PROGRAM: Record<string, PublicOffspringGroupListingDTO[]> = {
  "sunny-meadows-goldens": [
    {
      slug: "spring-2024-litter",
      title: "Spring 2024 Golden Litter",
      description: "Beautiful litter of 8 Golden Retriever puppies from champion bloodlines. Both parents are OFA certified with excellent hips and elbows.",
      species: "dog",
      breed: "Golden Retriever",
      expectedBirthOn: null,
      actualBirthOn: "2024-03-15",
      countAvailable: 3,
      dam: { name: "Sunny", photoUrl: null, breed: "Golden Retriever" },
      sire: { name: "Duke", photoUrl: null, breed: "Golden Retriever" },
      coverImageUrl: null,
      priceRange: { min: 250000, max: 300000 },
      programSlug: "sunny-meadows-goldens",
      programName: "Sunny Meadows Goldens",
    },
    {
      slug: "summer-2024-planned",
      title: "Summer 2024 Planned Litter",
      description: "Expecting a wonderful litter in early summer. Reservations now open. Contact us to join the waitlist.",
      species: "dog",
      breed: "Golden Retriever",
      expectedBirthOn: "2024-07-01",
      actualBirthOn: null,
      countAvailable: 6,
      dam: { name: "Bella", photoUrl: null, breed: "Golden Retriever" },
      sire: { name: "Max", photoUrl: null, breed: "Golden Retriever" },
      coverImageUrl: null,
      priceRange: { min: 275000, max: 275000 },
      programSlug: "sunny-meadows-goldens",
      programName: "Sunny Meadows Goldens",
    },
  ],
  "riverside-shepherds": [
    {
      slug: "working-line-spring-24",
      title: "Working Line Spring 2024",
      description: "High-drive working line puppies suitable for protection, SAR, or active families. Parents are titled in IPO.",
      species: "dog",
      breed: "German Shepherd",
      expectedBirthOn: null,
      actualBirthOn: "2024-04-10",
      countAvailable: 2,
      dam: { name: "Heidi", photoUrl: null, breed: "German Shepherd" },
      sire: { name: "Klaus", photoUrl: null, breed: "German Shepherd" },
      coverImageUrl: null,
      priceRange: { min: 350000, max: 400000 },
      programSlug: "riverside-shepherds",
      programName: "Riverside German Shepherds",
    },
  ],
  "maple-leaf-doodles": [
    {
      slug: "f1b-mini-doodles",
      title: "F1B Mini Goldendoodles",
      description: "Adorable mini Goldendoodles, expected to be 25-35 lbs full grown. Great for families with allergies.",
      species: "dog",
      breed: "Goldendoodle",
      expectedBirthOn: null,
      actualBirthOn: "2024-02-20",
      countAvailable: 4,
      dam: { name: "Daisy", photoUrl: null, breed: "Goldendoodle" },
      sire: { name: "Teddy", photoUrl: null, breed: "Mini Poodle" },
      coverImageUrl: null,
      priceRange: { min: 300000, max: 350000 },
      programSlug: "maple-leaf-doodles",
      programName: "Maple Leaf Doodles",
    },
    {
      slug: "standard-doodles-may",
      title: "Standard Goldendoodles - May",
      description: "Standard size F1 Goldendoodles from health-tested parents. Will be 50-65 lbs full grown.",
      species: "dog",
      breed: "Goldendoodle",
      expectedBirthOn: "2024-05-15",
      actualBirthOn: null,
      countAvailable: 8,
      dam: { name: "Honey", photoUrl: null, breed: "Golden Retriever" },
      sire: { name: "Oliver", photoUrl: null, breed: "Standard Poodle" },
      coverImageUrl: null,
      priceRange: { min: 280000, max: 280000 },
      programSlug: "maple-leaf-doodles",
      programName: "Maple Leaf Doodles",
    },
  ],
  "blue-ribbon-labs": [
    {
      slug: "chocolate-lab-litter",
      title: "Chocolate Lab Litter",
      description: "Beautiful chocolate Labrador puppies from field trial champion lines. Excellent hunting prospects.",
      species: "dog",
      breed: "Labrador Retriever",
      expectedBirthOn: null,
      actualBirthOn: "2024-03-01",
      countAvailable: 5,
      dam: { name: "Cocoa", photoUrl: null, breed: "Labrador Retriever" },
      sire: { name: "Hunter", photoUrl: null, breed: "Labrador Retriever" },
      coverImageUrl: null,
      priceRange: { min: 200000, max: 250000 },
      programSlug: "blue-ribbon-labs",
      programName: "Blue Ribbon Labradors",
    },
  ],
  "heartland-cavaliers": [
    {
      slug: "blenheim-cavaliers",
      title: "Blenheim Cavalier Puppies",
      description: "Sweet Blenheim Cavalier King Charles Spaniel puppies. Parents are cardiac certified clear.",
      species: "dog",
      breed: "Cavalier King Charles Spaniel",
      expectedBirthOn: null,
      actualBirthOn: "2024-04-05",
      countAvailable: 3,
      dam: { name: "Princess", photoUrl: null, breed: "Cavalier King Charles Spaniel" },
      sire: { name: "Charlie", photoUrl: null, breed: "Cavalier King Charles Spaniel" },
      coverImageUrl: null,
      priceRange: { min: 350000, max: 400000 },
      programSlug: "heartland-cavaliers",
      programName: "Heartland Cavaliers",
    },
  ],
  "pacific-poodles": [
    {
      slug: "parti-poodles-spring",
      title: "Parti Standard Poodles",
      description: "Stunning parti-colored Standard Poodle puppies. UKC registered, fully health tested parents.",
      species: "dog",
      breed: "Standard Poodle",
      expectedBirthOn: null,
      actualBirthOn: "2024-03-20",
      countAvailable: 4,
      dam: { name: "Coco", photoUrl: null, breed: "Standard Poodle" },
      sire: { name: "Jacques", photoUrl: null, breed: "Standard Poodle" },
      coverImageUrl: null,
      priceRange: { min: 300000, max: 350000 },
      programSlug: "pacific-poodles",
      programName: "Pacific Standard Poodles",
    },
  ],
  "mountain-view-aussies": [
    {
      slug: "blue-merle-aussies",
      title: "Blue Merle Australian Shepherds",
      description: "Gorgeous blue merle Aussie puppies with striking markings. Great prospects for agility or herding.",
      species: "dog",
      breed: "Australian Shepherd",
      expectedBirthOn: null,
      actualBirthOn: "2024-02-28",
      countAvailable: 2,
      dam: { name: "Sky", photoUrl: null, breed: "Australian Shepherd" },
      sire: { name: "Storm", photoUrl: null, breed: "Australian Shepherd" },
      coverImageUrl: null,
      priceRange: { min: 180000, max: 220000 },
      programSlug: "mountain-view-aussies",
      programName: "Mountain View Aussies",
    },
  ],
  "southern-charm-frenchies": [
    {
      slug: "french-bulldog-spring",
      title: "French Bulldog Puppies",
      description: "Compact, healthy French Bulldog puppies in fawn and brindle. Bred for health and structure.",
      species: "dog",
      breed: "French Bulldog",
      expectedBirthOn: null,
      actualBirthOn: "2024-04-01",
      countAvailable: 3,
      dam: { name: "Fifi", photoUrl: null, breed: "French Bulldog" },
      sire: { name: "Pierre", photoUrl: null, breed: "French Bulldog" },
      coverImageUrl: null,
      priceRange: { min: 450000, max: 500000 },
      programSlug: "southern-charm-frenchies",
      programName: "Southern Charm Frenchies",
    },
  ],
};

// ============================================================================
// MOCK OFFSPRING (for detailed listing view)
// ============================================================================

const MOCK_OFFSPRING_BY_LISTING: Record<string, PublicOffspringDTO[]> = {
  "spring-2024-litter": [
    { id: 1, name: "Apollo", sex: "Male", collarColorName: "Blue", collarColorHex: "#3B82F6", priceCents: 300000, status: "available" },
    { id: 2, name: "Luna", sex: "Female", collarColorName: "Pink", collarColorHex: "#EC4899", priceCents: 300000, status: "reserved" },
    { id: 3, name: "Sunny", sex: "Female", collarColorName: "Yellow", collarColorHex: "#EAB308", priceCents: 275000, status: "available" },
    { id: 4, name: "Bear", sex: "Male", collarColorName: "Green", collarColorHex: "#22C55E", priceCents: 275000, status: "placed" },
    { id: 5, name: "Daisy", sex: "Female", collarColorName: "Purple", collarColorHex: "#A855F7", priceCents: 300000, status: "placed" },
    { id: 6, name: "Cooper", sex: "Male", collarColorName: "Red", collarColorHex: "#EF4444", priceCents: 250000, status: "available" },
    { id: 7, name: "Rosie", sex: "Female", collarColorName: "Orange", collarColorHex: "#F97316", priceCents: 275000, status: "placed" },
    { id: 8, name: "Max", sex: "Male", collarColorName: "Gray", collarColorHex: "#6B7280", priceCents: 250000, status: "placed" },
  ],
  "summer-2024-planned": [
    { id: 101, name: null, sex: "Male", collarColorName: null, collarColorHex: null, priceCents: 275000, status: "available" },
    { id: 102, name: null, sex: "Female", collarColorName: null, collarColorHex: null, priceCents: 275000, status: "available" },
    { id: 103, name: null, sex: "Male", collarColorName: null, collarColorHex: null, priceCents: 275000, status: "available" },
    { id: 104, name: null, sex: "Female", collarColorName: null, collarColorHex: null, priceCents: 275000, status: "available" },
    { id: 105, name: null, sex: null, collarColorName: null, collarColorHex: null, priceCents: 275000, status: "available" },
    { id: 106, name: null, sex: null, collarColorName: null, collarColorHex: null, priceCents: 275000, status: "available" },
  ],
  "working-line-spring-24": [
    { id: 201, name: "Axel", sex: "Male", collarColorName: "Black", collarColorHex: "#1F2937", priceCents: 400000, status: "available" },
    { id: 202, name: "Freya", sex: "Female", collarColorName: "Red", collarColorHex: "#EF4444", priceCents: 400000, status: "reserved" },
    { id: 203, name: "Thor", sex: "Male", collarColorName: "Blue", collarColorHex: "#3B82F6", priceCents: 350000, status: "placed" },
    { id: 204, name: "Valkyrie", sex: "Female", collarColorName: "Pink", collarColorHex: "#EC4899", priceCents: 375000, status: "placed" },
    { id: 205, name: "Odin", sex: "Male", collarColorName: "Green", collarColorHex: "#22C55E", priceCents: 375000, status: "available" },
  ],
  "f1b-mini-doodles": [
    { id: 301, name: "Teddy", sex: "Male", collarColorName: "Brown", collarColorHex: "#92400E", priceCents: 325000, status: "available" },
    { id: 302, name: "Coco", sex: "Female", collarColorName: "Pink", collarColorHex: "#EC4899", priceCents: 350000, status: "available" },
    { id: 303, name: "Biscuit", sex: "Male", collarColorName: "Cream", collarColorHex: "#FEF3C7", priceCents: 300000, status: "reserved" },
    { id: 304, name: "Maple", sex: "Female", collarColorName: "Orange", collarColorHex: "#F97316", priceCents: 350000, status: "available" },
    { id: 305, name: "Mochi", sex: "Female", collarColorName: "White", collarColorHex: "#F9FAFB", priceCents: 325000, status: "available" },
    { id: 306, name: "Finn", sex: "Male", collarColorName: "Blue", collarColorHex: "#3B82F6", priceCents: 300000, status: "placed" },
  ],
  "standard-doodles-may": [
    { id: 401, name: null, sex: null, collarColorName: null, collarColorHex: null, priceCents: 280000, status: "available" },
    { id: 402, name: null, sex: null, collarColorName: null, collarColorHex: null, priceCents: 280000, status: "available" },
    { id: 403, name: null, sex: null, collarColorName: null, collarColorHex: null, priceCents: 280000, status: "available" },
    { id: 404, name: null, sex: null, collarColorName: null, collarColorHex: null, priceCents: 280000, status: "available" },
    { id: 405, name: null, sex: null, collarColorName: null, collarColorHex: null, priceCents: 280000, status: "available" },
    { id: 406, name: null, sex: null, collarColorName: null, collarColorHex: null, priceCents: 280000, status: "available" },
    { id: 407, name: null, sex: null, collarColorName: null, collarColorHex: null, priceCents: 280000, status: "available" },
    { id: 408, name: null, sex: null, collarColorName: null, collarColorHex: null, priceCents: 280000, status: "available" },
  ],
  "chocolate-lab-litter": [
    { id: 501, name: "Hershey", sex: "Male", collarColorName: "Brown", collarColorHex: "#92400E", priceCents: 225000, status: "available" },
    { id: 502, name: "Mocha", sex: "Female", collarColorName: "Pink", collarColorHex: "#EC4899", priceCents: 250000, status: "available" },
    { id: 503, name: "Brownie", sex: "Male", collarColorName: "Blue", collarColorHex: "#3B82F6", priceCents: 200000, status: "available" },
    { id: 504, name: "Truffle", sex: "Female", collarColorName: "Purple", collarColorHex: "#A855F7", priceCents: 250000, status: "reserved" },
    { id: 505, name: "Fudge", sex: "Male", collarColorName: "Green", collarColorHex: "#22C55E", priceCents: 225000, status: "available" },
    { id: 506, name: "Cinnamon", sex: "Female", collarColorName: "Orange", collarColorHex: "#F97316", priceCents: 250000, status: "placed" },
  ],
  "blenheim-cavaliers": [
    { id: 601, name: "Winston", sex: "Male", collarColorName: "Blue", collarColorHex: "#3B82F6", priceCents: 375000, status: "available" },
    { id: 602, name: "Charlotte", sex: "Female", collarColorName: "Pink", collarColorHex: "#EC4899", priceCents: 400000, status: "available" },
    { id: 603, name: "Oliver", sex: "Male", collarColorName: "Green", collarColorHex: "#22C55E", priceCents: 350000, status: "available" },
    { id: 604, name: "Lily", sex: "Female", collarColorName: "Purple", collarColorHex: "#A855F7", priceCents: 400000, status: "placed" },
  ],
  "parti-poodles-spring": [
    { id: 701, name: "Domino", sex: "Male", collarColorName: "Black", collarColorHex: "#1F2937", priceCents: 325000, status: "available" },
    { id: 702, name: "Oreo", sex: "Female", collarColorName: "White", collarColorHex: "#F9FAFB", priceCents: 350000, status: "reserved" },
    { id: 703, name: "Patches", sex: "Male", collarColorName: "Blue", collarColorHex: "#3B82F6", priceCents: 300000, status: "available" },
    { id: 704, name: "Pepper", sex: "Female", collarColorName: "Gray", collarColorHex: "#6B7280", priceCents: 350000, status: "available" },
    { id: 705, name: "Spot", sex: "Male", collarColorName: "Brown", collarColorHex: "#92400E", priceCents: 325000, status: "available" },
  ],
  "blue-merle-aussies": [
    { id: 801, name: "Storm", sex: "Male", collarColorName: "Blue", collarColorHex: "#3B82F6", priceCents: 220000, status: "available" },
    { id: 802, name: "Misty", sex: "Female", collarColorName: "Purple", collarColorHex: "#A855F7", priceCents: 220000, status: "available" },
    { id: 803, name: "Cloud", sex: "Male", collarColorName: "Gray", collarColorHex: "#6B7280", priceCents: 200000, status: "placed" },
    { id: 804, name: "Rain", sex: "Female", collarColorName: "Teal", collarColorHex: "#14B8A6", priceCents: 200000, status: "placed" },
    { id: 805, name: "Thunder", sex: "Male", collarColorName: "Black", collarColorHex: "#1F2937", priceCents: 180000, status: "placed" },
  ],
  "french-bulldog-spring": [
    { id: 901, name: "Baguette", sex: "Male", collarColorName: "Blue", collarColorHex: "#3B82F6", priceCents: 475000, status: "available" },
    { id: 902, name: "Croissant", sex: "Female", collarColorName: "Pink", collarColorHex: "#EC4899", priceCents: 500000, status: "reserved" },
    { id: 903, name: "Éclair", sex: "Male", collarColorName: "Brown", collarColorHex: "#92400E", priceCents: 450000, status: "available" },
    { id: 904, name: "Brioche", sex: "Female", collarColorName: "Cream", collarColorHex: "#FEF3C7", priceCents: 500000, status: "available" },
  ],
};

// ============================================================================
// QUERY HELPERS
// ============================================================================

/**
 * Get mock programs with filtering and pagination.
 */
export function getMockPrograms(params: {
  search?: string;
  location?: string;
  offset?: number;
  limit?: number;
}): ProgramsResponse {
  const { search, location, offset = 0, limit = 24 } = params;

  let filtered = [...MOCK_PROGRAMS];

  // Filter by search (matches name or breed)
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.breed && p.breed.toLowerCase().includes(q))
    );
  }

  // Filter by location
  if (location) {
    const loc = location.toLowerCase();
    filtered = filtered.filter(
      (p) => p.location && p.location.toLowerCase().includes(loc)
    );
  }

  // Sort alphabetically for stability
  filtered.sort((a, b) => a.name.localeCompare(b.name));

  const total = filtered.length;
  const items = filtered.slice(offset, offset + limit);

  return { items, total };
}

/**
 * Get mock program detail by slug.
 */
export function getMockProgram(slug: string): PublicProgramDTO | null {
  return MOCK_PROGRAM_DETAILS[slug] || null;
}

/**
 * Get mock listings for a program.
 */
export function getMockProgramListings(programSlug: string): ListingsResponse {
  const items = MOCK_LISTINGS_BY_PROGRAM[programSlug] || [];
  return {
    items,
    total: items.length,
    page: 1,
    limit: 100,
  };
}

/**
 * Get mock listing detail with offspring.
 */
export function getMockListing(
  programSlug: string,
  listingSlug: string
): ListingDetailDTO | null {
  const listings = MOCK_LISTINGS_BY_PROGRAM[programSlug];
  if (!listings) return null;

  const listing = listings.find((l) => l.slug === listingSlug);
  if (!listing) return null;

  const offspring = MOCK_OFFSPRING_BY_LISTING[listingSlug] || [];

  return {
    ...listing,
    offspring,
  };
}

/**
 * Simulate async delay for realistic loading states.
 */
export function simulateDelay(ms: number = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
