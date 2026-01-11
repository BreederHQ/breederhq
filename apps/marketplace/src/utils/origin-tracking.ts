// apps/marketplace/src/utils/origin-tracking.ts
// Origin tracking utility for marketplace conversion attribution
//
// Captures and persists origin parameters (UTM, referrer, source) from URL on page load.
// Provides captured data for inclusion in conversion actions (inquiries, waitlist requests).

const STORAGE_KEY = "marketplace_origin";

export interface OriginData {
  source: string; // "direct" | "utm" | "referrer" | "embed" | "social"
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  pagePath?: string;
  programSlug?: string;
  capturedAt: number; // timestamp
}

/**
 * Capture origin parameters from URL and document.referrer.
 * Should be called once on initial page load or route change.
 */
export function captureOrigin(): void {
  try {
    const url = new URL(window.location.href);
    const params = url.searchParams;

    // Check for UTM parameters
    const utmSource = params.get("utm_source") || undefined;
    const utmMedium = params.get("utm_medium") || undefined;
    const utmCampaign = params.get("utm_campaign") || undefined;

    // Check for custom source param
    const sourceParam = params.get("source") || params.get("ref") || undefined;

    // Determine source type
    let source: string;
    if (utmSource) {
      source = "utm";
    } else if (sourceParam) {
      // Map common source values
      if (sourceParam === "embed" || sourceParam === "embedded") {
        source = "embed";
      } else if (
        ["facebook", "instagram", "twitter", "tiktok", "linkedin"].includes(
          sourceParam.toLowerCase()
        )
      ) {
        source = "social";
      } else {
        source = "referrer";
      }
    } else if (document.referrer && !isInternalReferrer(document.referrer)) {
      source = "referrer";
    } else {
      source = "direct";
    }

    // Extract referrer (external only)
    const referrer =
      sourceParam ||
      (document.referrer && !isInternalReferrer(document.referrer)
        ? document.referrer
        : undefined);

    // Build origin data
    const origin: OriginData = {
      source,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      pagePath: url.pathname,
      capturedAt: Date.now(),
    };

    // Only store if we have meaningful data (not just "direct" with no extra info)
    if (
      source !== "direct" ||
      utmSource ||
      utmMedium ||
      utmCampaign ||
      referrer
    ) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(origin));
    }
  } catch {
    // Silently fail - origin tracking is non-critical
  }
}

/**
 * Check if referrer is from the same site (internal navigation).
 */
function isInternalReferrer(referrer: string): boolean {
  try {
    const refUrl = new URL(referrer);
    return refUrl.host === window.location.host;
  } catch {
    return true; // Assume internal if we can't parse
  }
}

/**
 * Get captured origin data for inclusion in API requests.
 * Returns undefined if no meaningful origin was captured.
 */
export function getOriginData(): Omit<OriginData, "capturedAt"> | undefined {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Return current page path as minimal origin
      return {
        source: "direct",
        pagePath: window.location.pathname,
      };
    }

    const origin: OriginData = JSON.parse(stored);

    // Check if origin is stale (older than 24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - origin.capturedAt > maxAge) {
      sessionStorage.removeItem(STORAGE_KEY);
      return {
        source: "direct",
        pagePath: window.location.pathname,
      };
    }

    // Return origin without capturedAt timestamp
    const { capturedAt: _, ...originData } = origin;

    // Update pagePath to current page for conversion context
    return {
      ...originData,
      pagePath: window.location.pathname,
    };
  } catch {
    return {
      source: "direct",
      pagePath: window.location.pathname,
    };
  }
}

/**
 * Set the current program slug for origin tracking.
 * Call this when viewing a breeder/program page to track which program led to conversion.
 */
export function setOriginProgramSlug(programSlug: string): void {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const origin: OriginData = JSON.parse(stored);
      origin.programSlug = programSlug;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(origin));
    } else {
      // Create minimal origin with program slug
      const origin: OriginData = {
        source: "direct",
        programSlug,
        pagePath: window.location.pathname,
        capturedAt: Date.now(),
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(origin));
    }
  } catch {
    // Silently fail
  }
}

/**
 * Clear origin data (e.g., after successful conversion).
 */
export function clearOriginData(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}
