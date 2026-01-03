// apps/marketplace/src/seo/Seo.tsx
// Lightweight SEO component for setting title, meta tags, canonical, OG, and JSON-LD
import * as React from "react";

export interface SeoProps {
  /** Page title - will be suffixed with " | BreederHQ Marketplace" */
  title: string;
  /** Meta description (optional for noindex pages) */
  description?: string;
  /** Path for canonical URL (without origin, e.g., "/animals") - optional for noindex pages */
  path?: string;
  /** Whether the page should be indexed (default: true) */
  index?: boolean;
  /** Robots directive string (e.g., "noindex, nofollow") - overrides index prop */
  robots?: string;
  /** OG type: "website" for index pages, "article" for detail pages */
  ogType?: "website" | "article";
  /** JSON-LD structured data object */
  jsonLd?: object;
}

/**
 * Get clean canonical URL without query params or demo indicators.
 * Always uses production origin to ensure consistency across environments.
 */
function getCanonicalUrl(path: string): string {
  // Always use production origin for canonical URLs
  const origin = "https://marketplace.breederhq.com";

  // Ensure path starts with /
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  // Remove any trailing slashes except for root
  const normalizedPath = cleanPath === "/" ? "/" : cleanPath.replace(/\/$/, "");

  return `${origin}${normalizedPath}`;
}

/**
 * Update or create a meta tag.
 */
function setMetaTag(name: string, content: string, isProperty = false): void {
  const attr = isProperty ? "property" : "name";
  let element = document.querySelector(`meta[${attr}="${name}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, name);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

/**
 * Update or create a link tag.
 */
function setLinkTag(rel: string, href: string): void {
  let element = document.querySelector(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

/**
 * Update or create JSON-LD script.
 */
function setJsonLd(data: object | null): void {
  const id = "seo-json-ld";
  let element = document.getElementById(id) as HTMLScriptElement | null;

  if (!data) {
    if (element) {
      element.remove();
    }
    return;
  }

  if (!element) {
    element = document.createElement("script");
    element.id = id;
    element.type = "application/ld+json";
    document.head.appendChild(element);
  }

  element.textContent = JSON.stringify(data);
}

/**
 * SEO component that manages document head meta tags.
 * Uses useEffect to update tags idempotently.
 */
export function Seo({
  title,
  description,
  path,
  index = true,
  robots,
  ogType = "website",
  jsonLd,
}: SeoProps) {
  React.useEffect(() => {
    // Set document title with suffix
    const fullTitle = `${title} | BreederHQ Marketplace`;
    document.title = fullTitle;

    // Determine if page should be indexed (robots string overrides index boolean)
    const shouldIndex = robots ? !robots.includes("noindex") : index;

    // Set robots directive
    const robotsContent = robots || (shouldIndex ? "index,follow" : "noindex,nofollow");
    setMetaTag("robots", robotsContent);

    // Set meta description (only if provided)
    if (description) {
      setMetaTag("description", description);
    }

    // Set canonical URL (only if path provided)
    if (path) {
      const canonicalUrl = getCanonicalUrl(path);
      setLinkTag("canonical", canonicalUrl);

      // Set Open Graph tags for indexable pages
      if (shouldIndex && description) {
        setMetaTag("og:title", fullTitle, true);
        setMetaTag("og:description", description, true);
        setMetaTag("og:type", ogType, true);
        setMetaTag("og:url", canonicalUrl, true);
        setMetaTag("og:site_name", "BreederHQ Marketplace", true);
      }
    }

    // Set JSON-LD structured data
    setJsonLd(jsonLd || null);

    // Cleanup function to remove JSON-LD when component unmounts
    return () => {
      setJsonLd(null);
    };
  }, [title, description, path, index, robots, ogType, jsonLd]);

  return null;
}

/**
 * Generate Product JSON-LD for listing detail pages.
 */
export function generateListingJsonLd(params: {
  title: string;
  description: string;
  url: string;
  breederName: string;
  species: string;
  breed?: string;
  priceMin?: number;
  priceMax?: number;
  countAvailable: number;
  location?: string;
}): object {
  const {
    title,
    description,
    url,
    breederName,
    species,
    breed,
    priceMin,
    priceMax,
    countAvailable,
    location,
  } = params;

  // Determine availability
  const availability = countAvailable > 0
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";

  // Build offers object
  let offers: object;
  if (priceMin != null && priceMax != null && priceMin !== priceMax) {
    // Price range - use AggregateOffer
    offers = {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: (priceMin / 100).toFixed(2),
      highPrice: (priceMax / 100).toFixed(2),
      availability,
      offerCount: countAvailable,
    };
  } else if (priceMin != null) {
    // Single price
    offers = {
      "@type": "Offer",
      priceCurrency: "USD",
      price: (priceMin / 100).toFixed(2),
      availability,
    };
  } else {
    // No price - contact for price
    offers = {
      "@type": "Offer",
      priceCurrency: "USD",
      availability,
    };
  }

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description,
    url,
    category: breed ? `${species} - ${breed}` : species,
    offers,
    brand: {
      "@type": "Organization",
      name: breederName,
    },
  };

  if (location) {
    jsonLd.areaServed = location;
  }

  return jsonLd;
}

/**
 * Generate Organization JSON-LD for breeder profile pages.
 */
export function generateBreederJsonLd(params: {
  name: string;
  description: string;
  url: string;
  website?: string;
  location?: string;
}): object {
  const { name, description, url, website, location } = params;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    description,
    url,
  };

  if (website) {
    jsonLd.sameAs = [website];
  }

  if (location) {
    jsonLd.areaServed = location;
    jsonLd.address = {
      "@type": "PostalAddress",
      addressLocality: location,
    };
  }

  return jsonLd;
}

/**
 * Generate CollectionPage JSON-LD for index pages.
 */
export function generateCollectionPageJsonLd(params: {
  name: string;
  description: string;
  url: string;
}): object {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: params.name,
    description: params.description,
    url: params.url,
    isPartOf: {
      "@type": "WebSite",
      name: "BreederHQ Marketplace",
      url: "https://marketplace.breederhq.com",
    },
  };
}
