// apps/marketplace/src/utils/seo.ts
// SEO utilities for dynamically updating meta tags, titles, and structured data

import * as React from "react";

interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  keywords?: string;
  noindex?: boolean; // Set to true for protected pages
}

/**
 * Update page SEO metadata dynamically.
 * Call this from page components to set appropriate meta tags.
 */
export function updateSEO(config: SEOConfig) {
  const {
    title,
    description,
    canonical,
    ogType = "website",
    ogImage = "https://marketplace.breederhq.com/og-image.png",
    keywords,
    noindex = false,
  } = config;

  // Update title
  document.title = title;

  // Helper to update or create meta tag
  const updateMetaTag = (selector: string, content: string) => {
    let tag = document.querySelector(selector);
    if (!tag) {
      tag = document.createElement("meta");
      const [attr, value] = selector.replace(/[\[\]]/g, "").split("=");
      tag.setAttribute(attr, value.replace(/['"]/g, ""));
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", content);
  };

  // Update robots meta
  if (noindex) {
    updateMetaTag('meta[name="robots"]', "noindex,nofollow");
  } else {
    updateMetaTag('meta[name="robots"]', "index,follow");
  }

  // Update basic meta tags
  updateMetaTag('meta[name="title"]', title);
  updateMetaTag('meta[name="description"]', description);

  if (keywords) {
    updateMetaTag('meta[name="keywords"]', keywords);
  }

  // Update Open Graph tags
  updateMetaTag('meta[property="og:type"]', ogType);
  updateMetaTag('meta[property="og:title"]', title);
  updateMetaTag('meta[property="og:description"]', description);
  updateMetaTag('meta[property="og:image"]', ogImage);

  if (canonical) {
    updateMetaTag('meta[property="og:url"]', canonical);
  }

  // Update Twitter tags
  updateMetaTag('meta[property="twitter:title"]', title);
  updateMetaTag('meta[property="twitter:description"]', description);
  updateMetaTag('meta[property="twitter:image"]', ogImage);

  if (canonical) {
    updateMetaTag('meta[property="twitter:url"]', canonical);
  }

  // Update canonical link
  if (canonical) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);
  }
}

/**
 * Add JSON-LD structured data to the page.
 * This helps search engines understand your content better.
 */
export function addStructuredData(data: Record<string, any>) {
  // Remove any existing structured data script for this page
  const existing = document.querySelector('script[type="application/ld+json"]');
  if (existing) {
    existing.remove();
  }

  // Add new structured data
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.text = JSON.stringify(data);
  document.head.appendChild(script);
}

/**
 * Generate Organization structured data
 */
export function getOrganizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BreederHQ",
    url: "https://marketplace.breederhq.com",
    logo: "https://marketplace.breederhq.com/logo.png",
    description:
      "Connect with verified animal breeders. Find quality animals from trusted breeding programs.",
    sameAs: [
      // Add social media URLs here when available
    ],
  };
}

/**
 * Generate Product listing structured data for animal listings
 */
export function getAnimalListingStructuredData(params: {
  name: string;
  description: string;
  image: string;
  price?: number;
  breed?: string;
  species?: string;
  location?: string;
  breederName?: string;
}) {
  const data: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: params.name,
    description: params.description,
    image: params.image,
  };

  if (params.price) {
    data.offers = {
      "@type": "Offer",
      price: params.price / 100, // Convert cents to dollars
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    };
  }

  if (params.breed) {
    data.brand = {
      "@type": "Brand",
      name: params.breed,
    };
  }

  if (params.breederName) {
    data.seller = {
      "@type": "Organization",
      name: params.breederName,
    };
  }

  return data;
}

/**
 * Generate LocalBusiness structured data for breeder profiles
 */
export function getBreederStructuredData(params: {
  name: string;
  description: string;
  location?: string;
  breeds?: string[];
  imageUrl?: string;
}) {
  const data: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `https://marketplace.breederhq.com/breeders/${params.name}`,
    name: params.name,
    description: params.description,
  };

  if (params.imageUrl) {
    data.image = params.imageUrl;
  }

  if (params.location) {
    data.address = {
      "@type": "PostalAddress",
      addressLocality: params.location,
    };
  }

  return data;
}

/**
 * Generate BreadcrumbList structured data
 */
export function getBreadcrumbStructuredData(items: Array<{ name: string; url?: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

/**
 * Generate FAQ structured data - critical for AI assistants (ChatGPT, Claude, etc.)
 * AI assistants heavily rely on FAQPage schema when answering questions
 */
export function getFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

/**
 * Generate SoftwareApplication structured data
 * Critical for being recommended by AI assistants for software-related queries
 */
export function getSoftwareApplicationStructuredData(params: {
  name: string;
  description: string;
  features: string[];
  category?: string;
  subcategory?: string;
  price?: string;
  priceCurrency?: string;
  operatingSystem?: string;
  url?: string;
  screenshot?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": params.name,
    "description": params.description,
    "applicationCategory": params.category || "BusinessApplication",
    "applicationSubCategory": params.subcategory,
    "operatingSystem": params.operatingSystem || "Web Browser",
    "featureList": params.features,
    "url": params.url,
    "screenshot": params.screenshot,
    "offers": params.price ? {
      "@type": "Offer",
      "price": params.price,
      "priceCurrency": params.priceCurrency || "USD"
    } : undefined,
    "provider": {
      "@type": "Organization",
      "name": "BreederHQ",
      "url": "https://breederhq.com"
    }
  };
}

/**
 * Generate Service structured data for marketplace services
 */
export function getServiceStructuredData(params: {
  serviceType: string;
  description: string;
  areaServed?: string;
  services?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": params.serviceType,
    "description": params.description,
    "provider": {
      "@type": "Organization",
      "name": "BreederHQ"
    },
    "areaServed": params.areaServed ? {
      "@type": "Country",
      "name": params.areaServed
    } : undefined,
    "hasOfferCatalog": params.services ? {
      "@type": "OfferCatalog",
      "name": "Services",
      "itemListElement": params.services.map(service => ({
        "@type": "Service",
        "name": service
      }))
    } : undefined
  };
}

/**
 * Custom hook for SEO - use in page components
 */
export function useSEO(config: SEOConfig, structuredData?: Record<string, any>) {
  // Use React.useEffect if available, otherwise just call directly
  if (typeof window !== "undefined") {
    // Client-side only
    try {
      React.useEffect(() => {
        updateSEO(config);
        if (structuredData) {
          addStructuredData(structuredData);
        }

        // Cleanup on unmount - reset to defaults
        return () => {
          updateSEO({
            title: "BreederHQ Marketplace – Connect with Verified Animal Breeders",
            description:
              "Find verified breeders and quality animals. Browse dogs, cats, horses, and more from trusted breeding programs.",
          });
        };
      }, [config.title, config.canonical, config.noindex]);
    } catch {
      // React not available, call directly
      updateSEO(config);
      if (structuredData) {
        addStructuredData(structuredData);
      }
    }
  }
}
