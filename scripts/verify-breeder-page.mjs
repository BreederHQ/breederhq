#!/usr/bin/env node
/**
 * verify-breeder-page.mjs
 * Verifies the BreederPage renders correctly using Playwright headless browser.
 * Requires authenticated session cookie for embedded Platform route.
 *
 * Environment variables:
 *   TARGET_URL - URL to test (default: https://app.breederhq.test/marketplace/breeders/tattoine-cuddly-buggers)
 *   BHQ_SESSION_COOKIE - Required. Full cookie string (e.g., "bhq_s=...")
 *
 * Exit codes:
 *   0 - All assertions pass
 *   1 - Assertions failed
 *   2 - Missing required environment variable
 *   3 - Page load or auth failure
 */

import { chromium } from "playwright";

const DEFAULT_URL = "http://localhost:6170/marketplace/breeders/tattoine-cuddly-buggers";
const TARGET_URL = process.env.TARGET_URL || DEFAULT_URL;
const API_BASE = process.env.API_BASE || "http://localhost:6001";
const SESSION_COOKIE = process.env.BHQ_SESSION_COOKIE;

async function main() {
  console.log("=== Playwright DOM Verification: Breeder Detail ===\n");

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
      // Wait for any H1 to appear first
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

    // Check if we're on the breeder page (not Platform shell header)
    if (h1Text === "BreederHQ" || !h1Text?.toLowerCase().includes("cuddly")) {
      console.error("✗ FAILURE: Page did not load breeder content");
      console.error("  H1 shows Platform shell header instead of breeder name.");
      console.error("  This may indicate:");
      console.error("    - The embedded Marketplace route is not rendering");
      console.error("    - Authentication failed silently");
      console.error("    - The API call to fetch breeder data failed");
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
      console.error(`\n  Body preview:\n  ${bodyText.replace(/\n/g, "\n  ")}`);
      await browser.close();
      process.exit(3);
    }

    // === DOM ASSERTIONS ===
    console.log("=== DOM Assertion Results ===\n");

    // Assertion A: H1 contains "Tattoine Cuddly Buggers"
    const h1Pass = h1Text?.toLowerCase().includes("tattoine cuddly buggers");
    results.push({
      name: 'A) H1 text "Tattoine Cuddly Buggers"',
      pass: h1Pass,
      actual: h1Text,
    });
    if (!h1Pass) allPass = false;

    // Assertion B: Page contains "Programs" heading
    const programsHeading = await page.locator("h2:has-text('Programs')").count();
    const programsPass = programsHeading > 0;
    results.push({
      name: 'B) Section heading "Programs"',
      pass: programsPass,
      actual: programsHeading > 0 ? "Found" : "Not found",
    });
    if (!programsPass) allPass = false;

    // Assertion C: Page contains "Standards & Credentials" heading
    const credsHeading = await page.locator("h2:has-text('Standards & Credentials')").count();
    const credsPass = credsHeading > 0;
    results.push({
      name: 'C) Section heading "Standards & Credentials"',
      pass: credsPass,
      actual: credsHeading > 0 ? "Found" : "Not found",
    });
    if (!credsPass) allPass = false;

    // Assertion D: Page SHOULD contain "Placement Policies" heading (after republish with policy)
    const policiesHeading = await page.locator("h2:has-text('Placement Policies')").count();
    const policiesPass = policiesHeading > 0;
    results.push({
      name: 'D) Section heading "Placement Policies" present',
      pass: policiesPass,
      actual: policiesHeading > 0 ? "Found" : "Not found",
    });
    if (!policiesPass) allPass = false;

    // Assertion E: Breeds section present with breed chips
    const breedsHeading = await page.locator("h2:has-text('Breeds')").count();
    const breedChips = await page.locator(".rounded-full").count();
    const breedsPass = breedsHeading > 0 || breedChips > 0;
    results.push({
      name: "E) Breeds section with chips visible",
      pass: breedsPass,
      actual: `Breeds heading: ${breedsHeading > 0 ? "Found" : "Not found"}, Chips: ${breedChips}`,
    });
    if (!breedsPass) allPass = false;

    // Assertion F: Breadcrumb navigation present
    const breadcrumb = await page.locator("text=All breeders").count();
    const breadcrumbPass = breadcrumb > 0;
    results.push({
      name: 'F) Breadcrumb "All breeders" link present',
      pass: breadcrumbPass,
      actual: breadcrumb > 0 ? "Found" : "Not found",
    });
    if (!breadcrumbPass) allPass = false;

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
