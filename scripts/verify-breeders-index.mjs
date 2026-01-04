#!/usr/bin/env node
/**
 * verify-breeders-index.mjs
 * Verifies the BreedersIndexPage renders breeder cards (not program cards) using Playwright.
 * Requires authenticated session cookie for embedded Platform route.
 *
 * Environment variables:
 *   TARGET_URL - URL to test (default: https://app.breederhq.test/marketplace/breeders)
 *   BHQ_SESSION_COOKIE - Required. Full cookie string (e.g., "bhq_s=...")
 *
 * Exit codes:
 *   0 - All assertions pass
 *   1 - Assertions failed
 *   2 - Missing required environment variable
 *   3 - Page load or auth failure
 */

import { chromium } from "playwright";

const DEFAULT_URL = "http://localhost:6170/marketplace/breeders";
const TARGET_URL = process.env.TARGET_URL || DEFAULT_URL;
const API_BASE = process.env.API_BASE || "http://localhost:6001";
const SESSION_COOKIE = process.env.BHQ_SESSION_COOKIE;

async function main() {
  console.log("=== Playwright DOM Verification: Breeders Index ===\n");

  console.log(`Target URL: ${TARGET_URL}`);
  console.log(`API Base: ${API_BASE}`);
  if (SESSION_COOKIE) {
    console.log(`Session cookie: ${SESSION_COOKIE.substring(0, 20)}...`);
  } else {
    console.log("No session cookie (using localhost dev server)");
  }
  console.log("");

  const browser = await chromium.launch({ headless: true });

  const contextOptions = {
    ignoreHTTPSErrors: true,
  };

  // Add cookie if provided (for authenticated routes)
  if (SESSION_COOKIE) {
    contextOptions.extraHTTPHeaders = { Cookie: SESSION_COOKIE };
  }

  const context = await browser.newContext(contextOptions);

  // Set cookie on context if provided
  if (SESSION_COOKIE) {
    const cookieParts = SESSION_COOKIE.split("=");
    const cookieName = cookieParts[0];
    const cookieValue = cookieParts.slice(1).join("=");
    const urlObj = new URL(TARGET_URL);
    await context.addCookies([
      {
        name: cookieName,
        value: cookieValue,
        domain: urlObj.hostname,
        path: "/",
        httpOnly: true,
        secure: urlObj.protocol === "https:",
      },
    ]);
  }

  const page = await context.newPage();
  let allPass = true;
  const results = [];

  try {
    console.log("Navigating to page...");
    const response = await page.goto(TARGET_URL, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Check for redirects (login page)
    const finalUrl = page.url();
    console.log(`Final URL: ${finalUrl}`);

    if (finalUrl.includes("/login") || finalUrl.includes("/auth")) {
      console.error("\n✗ FAILURE: Redirected to login page");
      console.error("  The session cookie may be invalid or expired.");
      console.error("  Please obtain a fresh cookie from an authenticated session.");
      const title = await page.title();
      console.error(`  Page title: ${title}`);
      await browser.close();
      process.exit(3);
    }

    // Wait for React app to hydrate and load data
    console.log("Waiting for page content (up to 15s)...");

    try {
      // Wait for the H1 "Breeders" heading to appear
      await page.waitForSelector("h1", { timeout: 15000 });
    } catch {
      console.error("\n✗ FAILURE: No H1 element found within 15 seconds");
      const title = await page.title();
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 200));
      console.error(`  Page title: ${title}`);
      console.error(`  Body preview: ${bodyText}`);
      await browser.close();
      process.exit(3);
    }

    // Additional wait for SPA content to stabilize
    await page.waitForTimeout(2000);

    // Get page state for debugging
    const pageTitle = await page.title();
    const h1Text = await page.locator("h1").first().textContent();
    console.log(`Page title: ${pageTitle}`);
    console.log(`H1 text: ${h1Text}\n`);

    // Check if page shows only Platform shell (auth required)
    if (h1Text === "BreederHQ") {
      console.error("✗ FAILURE: Page shows Platform shell only, not Marketplace content.");
      console.error("  The embedded Marketplace route requires authentication.");
      console.error("");
      console.error("To authenticate:");
      console.error("  1. Open http://localhost:6170 in your browser");
      console.error("  2. Log in as Rene (tenant with tattoine-cuddly-buggers)");
      console.error("  3. Open DevTools → Application → Cookies");
      console.error("  4. Copy the bhq_s cookie value");
      console.error("  5. Run: BHQ_SESSION_COOKIE='bhq_s=...' node scripts/verify-breeders-index.mjs");
      await browser.close();
      process.exit(3);
    }

    // === DOM ASSERTIONS ===
    console.log("=== DOM Assertion Results ===\n");

    // Assertion A: H1 contains "Breeders"
    const h1Pass = h1Text?.toLowerCase().includes("breeders");
    results.push({
      name: 'A) H1 text "Breeders"',
      pass: h1Pass,
      actual: h1Text,
    });
    if (!h1Pass) allPass = false;

    // Assertion B: Page contains at least one breeder card link to /breeders/:slug
    const breederCardLinks = await page.locator("a[href*='/breeders/']").count();
    const breederCardsPass = breederCardLinks > 0;
    results.push({
      name: "B) Breeder card links present",
      pass: breederCardsPass,
      actual: `${breederCardLinks} links found`,
    });
    if (!breederCardsPass) allPass = false;

    // Assertion C: Cards contain businessName (not program name) - look for "Tattoine Cuddly Buggers"
    const businessNameFound = await page.locator("text=Tattoine Cuddly Buggers").count();
    const businessNamePass = businessNameFound > 0;
    results.push({
      name: 'C) Business name "Tattoine Cuddly Buggers" visible',
      pass: businessNamePass,
      actual: businessNameFound > 0 ? "Found" : "Not found",
    });
    if (!businessNamePass) allPass = false;

    // Assertion D: Cards show breed chips (not program descriptions)
    const breedChips = await page.locator(".rounded-full").count();
    const breedChipsPass = breedChips > 0;
    results.push({
      name: "D) Breed chips (rounded-full elements) present",
      pass: breedChipsPass,
      actual: `${breedChips} chips found`,
    });
    if (!breedChipsPass) allPass = false;

    // Assertion E: NO "Programs" section heading (this is index, not detail)
    const programsHeading = await page.locator("h2:has-text('Programs')").count();
    const noProgramsPass = programsHeading === 0;
    results.push({
      name: 'E) No "Programs" section heading (this is index page)',
      pass: noProgramsPass,
      actual: programsHeading === 0 ? "Correctly absent" : `Found ${programsHeading} - unexpected`,
    });
    if (!noProgramsPass) allPass = false;

    // Assertion F: Card links to correct breeder detail URL
    const firstCardHref = await page.locator("a[href*='/breeders/']").first().getAttribute("href");
    const correctLinkPass = firstCardHref?.includes("/breeders/tattoine-cuddly-buggers");
    results.push({
      name: "F) Card links to /breeders/tattoine-cuddly-buggers",
      pass: correctLinkPass,
      actual: firstCardHref || "No href found",
    });
    if (!correctLinkPass) allPass = false;

    // Print results
    for (const r of results) {
      const status = r.pass ? "✓ PASS" : "✗ FAIL";
      console.log(`${status}: ${r.name}`);
      console.log(`         Actual: ${r.actual}\n`);
    }

  } catch (err) {
    console.error(`\nError during verification: ${err.message}`);
    allPass = false;
  } finally {
    await browser.close();
  }

  // Final result
  console.log("=== OVERALL RESULT ===");
  if (allPass) {
    console.log("✓ ALL DOM ASSERTIONS PASS");
    process.exit(0);
  } else {
    console.log("✗ SOME ASSERTIONS FAILED");
    process.exit(1);
  }
}

main();
