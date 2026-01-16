# Hybrid SEO Implementation Guide

## Overview

Your marketplace now uses a **hybrid approach** - public pages are indexed by search engines while protected features require authentication.

## What's Been Implemented

### ✅ 1. Core SEO Infrastructure

**File: `apps/marketplace/index.html`**
- ✅ Removed `noindex` directive - pages now indexable
- ✅ Added comprehensive meta tags (title, description, keywords)
- ✅ Added OpenGraph tags for social sharing
- ✅ Added Twitter Card tags
- ✅ Added canonical URL support

**File: `apps/marketplace/src/utils/seo.ts`**
- ✅ Dynamic SEO utility functions
- ✅ `updateSEO()` - Update meta tags per page
- ✅ `addStructuredData()` - Add JSON-LD for rich results
- ✅ Helpers for Organization, Product, LocalBusiness, Breadcrumb schemas

**File: `apps/marketplace/public/robots.txt`**
- ✅ Allow indexing of public routes (`/animals`, `/breeders`, `/services`, etc.)
- ✅ Block indexing of protected routes (`/dashboard`, `/saved`, `/manage`, etc.)
- ✅ Block auth pages (`/auth/*`)

### ✅ 2. Public vs Protected Routes

**Already in place from `MarketplaceGate.tsx`:**

**Public Routes (Anonymous browsing allowed):**
- `/` - Home page
- `/animals` - Browse animals
- `/animals/:slug` - Animal detail pages
- `/breeders` - Browse breeders
- `/breeders/:slug` - Breeder profile pages
- `/services` - Browse services
- `/programs/*` - Program pages
- `/breeding-programs/*` - Breeding program pages

**Protected Routes (Require login):**
- `/dashboard` - Buyer dashboard
- `/inquiries` - Messages/inquiries
- `/saved` - Saved listings
- `/waitlist` - Waitlist positions
- `/updates` - Updates feed
- `/manage/*` - Seller management pages
- `/provider/*` - Service provider pages

### ✅ 3. SEO Applied to Pages

**File: `apps/marketplace/src/marketplace/pages/HomePage.tsx`**
- ✅ Added SEO meta tags
- ✅ Added Organization structured data
- ✅ Marked as public (noindex: false)

## What You Need to Do Next

### 🔨 TODO #1: Add SEO to Other Public Pages

Apply the same pattern to these files:

**`AnimalsIndexPage.tsx`** - Add at the top of component:
```tsx
React.useEffect(() => {
  const speciesText = filters.species
    ? SPECIES_OPTIONS.find(s => s.value === filters.species)?.label
    : "Animals";

  updateSEO({
    title: `Browse ${speciesText} from Verified Breeders – BreederHQ`,
    description: `Find quality ${speciesText.toLowerCase()} from trusted breeding programs. Direct connection with professional breeders.`,
    canonical: `https://marketplace.breederhq.com/animals${filters.species ? `?species=${filters.species}` : ''}`,
    keywords: `${speciesText.toLowerCase()}, animal breeders, verified breeders`,
    noindex: false,
  });
}, [filters.species]);
```

**`BreedersIndexPage.tsx`** - Add at the top of component:
```tsx
React.useEffect(() => {
  updateSEO({
    title: "Find Verified Animal Breeders – BreederHQ Marketplace",
    description: "Browse verified breeders and their programs. Find trusted breeding programs for dogs, cats, horses, and more.",
    canonical: "https://marketplace.breederhq.com/breeders",
    keywords: "animal breeders, verified breeders, breeding programs, dog breeders, cat breeders",
    noindex: false,
  });
}, []);
```

**`BreederPage.tsx`** (Individual breeder profile) - Dynamic SEO:
```tsx
React.useEffect(() => {
  if (!breederData) return;

  updateSEO({
    title: `${breederData.businessName} – Verified Breeder | BreederHQ`,
    description: breederData.description || `Browse animals and breeding programs from ${breederData.businessName}.`,
    canonical: `https://marketplace.breederhq.com/breeders/${breederData.tenantSlug}`,
    noindex: false,
  });

  // Add LocalBusiness structured data
  addStructuredData(getBreederStructuredData({
    name: breederData.businessName,
    description: breederData.description || "",
    location: breederData.location,
    breeds: breederData.breeds?.map(b => b.name),
    imageUrl: breederData.logoAssetId ? `/api/assets/${breederData.logoAssetId}` : undefined,
  }));
}, [breederData]);
```

**Protected pages (dashboard, saved, etc.)** - Mark as noindex:
```tsx
React.useEffect(() => {
  updateSEO({
    title: "My Dashboard – BreederHQ Marketplace",
    description: "Manage your marketplace activity",
    noindex: true, // Protected page - don't index
  });
}, []);
```

### 🔨 TODO #2: Add Auth Prompts for Anonymous Users

For interactive actions (save, contact, waitlist), show login prompts:

**Example in `AnimalCard` component:**
```tsx
const { isAuthenticated } = useGateStatus() || { isAuthenticated: false };

const handleSaveClick = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();

  if (!isAuthenticated) {
    // Show login prompt
    navigate(`/auth/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
    return;
  }

  toggleSave();
};
```

### 🔨 TODO #3: Create Dynamic Sitemap

Create an API endpoint that generates sitemap.xml dynamically:

**File: `apps/api/src/routes/sitemap.ts` (or similar):**
```typescript
// Generate sitemap with all public URLs
export async function generateSitemap() {
  const urls = [
    { loc: 'https://marketplace.breederhq.com/', priority: 1.0 },
    { loc: 'https://marketplace.breederhq.com/animals', priority: 0.9 },
    { loc: 'https://marketplace.breederhq.com/breeders', priority: 0.9 },
    { loc: 'https://marketplace.breederhq.com/services', priority: 0.8 },
  ];

  // Add all public animal listings
  const animals = await db.getPublicAnimalListings();
  animals.forEach(animal => {
    urls.push({
      loc: `https://marketplace.breederhq.com/programs/${animal.programSlug}/animals/${animal.urlSlug}`,
      priority: 0.7,
    });
  });

  // Add all breeder profiles
  const breeders = await db.getBreeders();
  breeders.forEach(breeder => {
    urls.push({
      loc: `https://marketplace.breederhq.com/breeders/${breeder.tenantSlug}`,
      priority: 0.8,
    });
  });

  // Generate XML
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <priority>${url.priority}</priority>
    <changefreq>weekly</changefreq>
  </url>`).join('')}
</urlset>`;
}
```

### 🔨 TODO #4: Create OG Image

Create a branded Open Graph image:
- Size: 1200x630px
- Include your logo and tagline
- Save as: `apps/marketplace/public/og-image.png`

## SEO Best Practices

### For Listing Pages
- Use descriptive titles: "Golden Retriever Puppies – [Breeder Name] | BreederHQ"
- Include location in meta description
- Add Product structured data with price, availability
- Include high-quality images

### For Breeder Profiles
- Title format: "[Breeder Name] – Verified [Species] Breeder | BreederHQ"
- Description should include breeds, location, unique selling points
- Add LocalBusiness structured data
- Include contact information (if public)

### For Category Pages
- Title format: "Browse [Category] from Verified Breeders – BreederHQ"
- Description should explain what users will find
- Include facet navigation in content (breeds, locations)
- Add BreadcrumbList structured data

## Testing Your SEO

### 1. Google Search Console
- Submit your sitemap: `https://marketplace.breederhq.com/sitemap.xml`
- Monitor indexing status
- Check for mobile usability issues

### 2. Rich Results Test
- Test your structured data: https://search.google.com/test/rich-results
- Ensure Product, LocalBusiness, Organization schemas validate

### 3. Facebook Debugger
- Test OpenGraph tags: https://developers.facebook.com/tools/debug/
- Ensure images and descriptions appear correctly

### 4. Twitter Card Validator
- Test Twitter cards: https://cards-dev.twitter.com/validator

## Benefits of This Approach

✅ **Discovery** - Google can index your public listings
✅ **Social Sharing** - Rich previews when shared on social media
✅ **Privacy** - Protected content (messages, saved items) not indexed
✅ **Conversion** - Users can browse before signing up
✅ **Trust** - Public visibility = credibility
✅ **SEO** - Rich results in Google (stars, prices, breadcrumbs)

## Important Notes

1. **Login Wall for Actions** - Browsing is public, but actions (save, contact, waitlist) require login
2. **Pricing Transparency** - Showing prices publicly builds trust and SEO value
3. **Breeder Control** - Breeders can control their public profile visibility
4. **Data Protection** - User data (inquiries, saved items, dashboard) remains private
5. **Performance** - Public pages should load fast for SEO (consider SSR/SSG in future)

## Next Steps Priority

1. **High Priority**: Add SEO to AnimalsIndexPage, BreedersIndexPage, BreederPage
2. **Medium Priority**: Add auth prompts to interactive elements
3. **Medium Priority**: Create dynamic sitemap endpoint
4. **Low Priority**: Create OG image
5. **Low Priority**: Add SEO to all remaining public pages

## Questions?

- How much control do breeders have over their SEO? (Can they edit meta descriptions?)
- Should pricing be public or require login?
- Do you want location-based SEO (e.g., "Dog breeders in California")?
- Should we implement server-side rendering for better SEO?

---

**Implementation Status**: Partially Complete
**SEO Mode**: Hybrid (Public browse, Private actions)
**Ready for**: Testing and refinement
