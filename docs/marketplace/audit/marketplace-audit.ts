import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://marketplace.breederhq.test';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'marketplace');
const CREDENTIALS = {
  email: 'marketplace-access@bhq.local',
  password: 'Marketplace2026!'
};

interface AuditFinding {
  category: string;
  issue: string;
  severity: 'critical' | 'major' | 'minor' | 'info';
  screenshot?: string;
}

const findings: AuditFinding[] = [];

async function screenshot(page: Page, name: string, description?: string): Promise<string> {
  const filename = `${name}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`Screenshot: ${filename}${description ? ` - ${description}` : ''}`);
  return filename;
}

async function addFinding(category: string, issue: string, severity: AuditFinding['severity'], screenshot?: string) {
  findings.push({ category, issue, severity, screenshot });
  console.log(`[${severity.toUpperCase()}] ${category}: ${issue}`);
}

async function auditHomepage(page: Page, loggedIn: boolean) {
  const prefix = loggedIn ? 'logged-in' : 'logged-out';
  console.log(`\n=== Homepage Audit (${prefix}) ===`);

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const screenshotName = await screenshot(page, `01-homepage-${prefix}`, `Homepage ${prefix}`);

  // Check for logo
  const logo = await page.$('img[alt*="BreederHQ"], img[alt*="Logo"], .logo, [class*="logo"]');
  if (!logo) {
    await addFinding('Branding', 'BreederHQ logo may not be visible or properly marked', 'major', screenshotName);
  }

  // Check for navigation items
  const navItems = await page.$$eval('nav a, header a, [role="navigation"] a', (links) =>
    links.map(l => l.textContent?.trim()).filter(Boolean)
  );
  console.log('Navigation items found:', navItems);

  const hasAnimals = navItems.some(item => item?.toLowerCase().includes('animal'));
  const hasBreeders = navItems.some(item => item?.toLowerCase().includes('breeder'));
  const hasServices = navItems.some(item => item?.toLowerCase().includes('service'));

  if (!hasAnimals || !hasBreeders || !hasServices) {
    await addFinding('Navigation', `Missing navigation items - Animals: ${hasAnimals}, Breeders: ${hasBreeders}, Services: ${hasServices}`, 'major', screenshotName);
  }

  // Check colors - look for background and text colors
  const bodyBgColor = await page.$eval('body', el => getComputedStyle(el).backgroundColor);
  const headerBgColor = await page.$eval('header, nav', el => el ? getComputedStyle(el).backgroundColor : 'not found').catch(() => 'not found');
  console.log(`Body background: ${bodyBgColor}`);
  console.log(`Header background: ${headerBgColor}`);

  // Check if colors are predominantly white/grey (potential issue)
  if (bodyBgColor.includes('255, 255, 255') || bodyBgColor.includes('rgb(255, 255, 255)')) {
    await addFinding('Branding', 'Body background is pure white - may lack brand identity', 'info', screenshotName);
  }

  return screenshotName;
}

async function login(page: Page) {
  console.log('\n=== Logging In ===');

  // Try to find login button/link
  const loginLink = await page.$('a[href*="login"], a[href*="signin"], button:has-text("Login"), button:has-text("Sign In"), a:has-text("Login"), a:has-text("Sign In")');

  if (loginLink) {
    await loginLink.click();
    await page.waitForTimeout(1000);
    await screenshot(page, '02-login-page', 'Login page');

    // Fill in credentials
    const emailField = await page.$('input[type="email"], input[name="email"], input[placeholder*="email"]');
    const passwordField = await page.$('input[type="password"], input[name="password"]');

    if (emailField && passwordField) {
      await emailField.fill(CREDENTIALS.email);
      await passwordField.fill(CREDENTIALS.password);
      await screenshot(page, '03-login-filled', 'Login form filled');

      // Submit
      const submitBtn = await page.$('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
        await screenshot(page, '04-after-login', 'After login attempt');
      }
    }
  } else {
    await addFinding('Authentication', 'Could not find login button/link on homepage', 'major');
  }
}

async function testSearchAndFilters(page: Page) {
  console.log('\n=== Testing Search and Filters ===');

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  // Look for search functionality
  const searchInput = await page.$('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"], [class*="search"] input');
  if (searchInput) {
    await searchInput.fill('dog');
    await page.waitForTimeout(500);
    await screenshot(page, '10-search-input', 'Search input filled');
  } else {
    await addFinding('Search', 'No search input found on homepage', 'major');
  }

  // Look for geo-location filter
  const geoFilter = await page.$('[class*="location"], [class*="geo"], input[placeholder*="location"], input[placeholder*="zip"], input[placeholder*="city"]');
  if (!geoFilter) {
    await addFinding('Search', 'No geo-location filter found', 'major');
  }

  // Navigate to animals page
  const animalsLink = await page.$('a[href*="animals"], a:has-text("Animals"), a:has-text("Browse Animals")');
  if (animalsLink) {
    await animalsLink.click();
    await page.waitForTimeout(1000);
    await screenshot(page, '11-animals-page', 'Animals listing page');

    // Check for species filters
    const speciesFilters = await page.$$eval('[class*="filter"], [class*="species"], select, [role="listbox"]', (els) =>
      els.map(el => el.textContent).join(' ')
    );
    console.log('Species/Filter content:', speciesFilters.substring(0, 500));

    // Look for problematic species like birds
    if (speciesFilters.toLowerCase().includes('bird')) {
      await addFinding('Species', 'Birds found in species filters - should not be available', 'critical');
    }

    await screenshot(page, '12-species-filters', 'Species filters visible');
  }
}

async function testBreedersDirectory(page: Page) {
  console.log('\n=== Testing Breeders Directory ===');

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  const breedersLink = await page.$('a[href*="breeder"], a:has-text("Breeders"), a:has-text("Find Breeders")');
  if (breedersLink) {
    await breedersLink.click();
    await page.waitForTimeout(1000);
    await screenshot(page, '20-breeders-index', 'Breeders directory page');

    // Click on first breeder if available
    const breederCard = await page.$('[class*="card"], [class*="breeder"] a, .breeder-item');
    if (breederCard) {
      await breederCard.click();
      await page.waitForTimeout(1000);
      await screenshot(page, '21-breeder-detail', 'Individual breeder page');
    }
  } else {
    await addFinding('Navigation', 'Breeders directory link not found', 'major');
  }
}

async function testServicesDirectory(page: Page) {
  console.log('\n=== Testing Services Directory ===');

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  const servicesLink = await page.$('a[href*="service"], a:has-text("Services")');
  if (servicesLink) {
    await servicesLink.click();
    await page.waitForTimeout(1000);
    await screenshot(page, '30-services-index', 'Services directory page');
  } else {
    await addFinding('Navigation', 'Services directory link not found', 'major');
  }
}

async function testListingDetail(page: Page) {
  console.log('\n=== Testing Listing Detail ===');

  // Go to animals page
  await page.goto(`${BASE_URL}/animals`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click on first listing
  const listingCard = await page.$('[class*="card"] a, [class*="listing"] a, a[href*="animal"]');
  if (listingCard) {
    await listingCard.click();
    await page.waitForTimeout(1000);
    await screenshot(page, '40-listing-detail', 'Animal listing detail page');

    // Look for inquiry/contact button
    const contactBtn = await page.$('button:has-text("Contact"), button:has-text("Inquire"), button:has-text("Message"), a:has-text("Contact")');
    if (contactBtn) {
      await contactBtn.click();
      await page.waitForTimeout(500);
      await screenshot(page, '41-inquiry-form', 'Inquiry/contact form');
    } else {
      await addFinding('Features', 'No contact/inquiry button found on listing detail', 'major');
    }
  }
}

async function testNavigation(page: Page) {
  console.log('\n=== Testing All Navigation ===');

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  // Get all navigation links
  const navLinks = await page.$$eval('nav a, header a', (links) =>
    links.map(l => ({ text: l.textContent?.trim(), href: l.getAttribute('href') })).filter(l => l.text && l.href)
  );
  console.log('All navigation links:', navLinks);

  await screenshot(page, '50-navigation-overview', 'Navigation overview');

  // Document expected vs actual navigation
  const expectedNav = ['Animals', 'Breeders', 'Services', 'Login', 'Sign Up'];
  const actualNav = navLinks.map(l => l.text);

  for (const expected of expectedNav) {
    if (!actualNav.some(a => a?.toLowerCase().includes(expected.toLowerCase()))) {
      await addFinding('Navigation', `Expected navigation item "${expected}" not found`, 'minor');
    }
  }
}

async function randomExploration(page: Page) {
  console.log('\n=== Random Exploration ===');

  const pagesToTry = [
    '/about',
    '/contact',
    '/faq',
    '/help',
    '/privacy',
    '/terms',
    '/saved',
    '/favorites',
    '/messages',
    '/account',
    '/profile'
  ];

  for (const pagePath of pagesToTry) {
    try {
      const response = await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'networkidle', timeout: 5000 });
      if (response && response.status() === 200) {
        const screenshotName = pagePath.replace('/', '').replace(/\//g, '-') || 'root';
        await screenshot(page, `60-page-${screenshotName}`, `Page: ${pagePath}`);
      }
    } catch (e) {
      // Page doesn't exist or timeout
    }
  }
}

async function mobileViewportTesting(page: Page) {
  console.log('\n=== Mobile Viewport Testing ===');

  await page.setViewportSize({ width: 375, height: 812 }); // iPhone X dimensions

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await screenshot(page, '70-mobile-homepage', 'Mobile homepage');

  // Check for mobile menu
  const hamburger = await page.$('[class*="hamburger"], [class*="menu-toggle"], button[aria-label*="menu"], .mobile-menu-btn');
  if (hamburger) {
    await hamburger.click();
    await page.waitForTimeout(500);
    await screenshot(page, '71-mobile-menu-open', 'Mobile menu opened');
  } else {
    await addFinding('Responsive', 'No mobile hamburger menu found', 'major');
  }

  // Test animals page on mobile
  await page.goto(`${BASE_URL}/animals`, { waitUntil: 'networkidle' });
  await screenshot(page, '72-mobile-animals', 'Mobile animals page');

  // Test breeders page on mobile
  await page.goto(`${BASE_URL}/breeders`, { waitUntil: 'networkidle' });
  await screenshot(page, '73-mobile-breeders', 'Mobile breeders page');

  // Reset viewport
  await page.setViewportSize({ width: 1280, height: 720 });
}

async function generateReport() {
  console.log('\n=== Generating Report ===');

  let report = `# Marketplace UI/UX Audit Report

Generated: ${new Date().toISOString()}

## Summary

Total findings: ${findings.length}
- Critical: ${findings.filter(f => f.severity === 'critical').length}
- Major: ${findings.filter(f => f.severity === 'major').length}
- Minor: ${findings.filter(f => f.severity === 'minor').length}
- Info: ${findings.filter(f => f.severity === 'info').length}

## Findings

`;

  const byCategory = findings.reduce((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {} as Record<string, AuditFinding[]>);

  for (const [category, categoryFindings] of Object.entries(byCategory)) {
    report += `### ${category}\n\n`;
    for (const finding of categoryFindings) {
      report += `- **[${finding.severity.toUpperCase()}]** ${finding.issue}`;
      if (finding.screenshot) {
        report += ` (see: ${finding.screenshot})`;
      }
      report += '\n';
    }
    report += '\n';
  }

  report += `## Screenshots Taken

All screenshots saved to: \`screenshots/marketplace/\`

`;

  const screenshotFiles = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png'));
  for (const file of screenshotFiles) {
    report += `- ${file}\n`;
  }

  fs.writeFileSync(path.join(__dirname, 'marketplace-audit-report.md'), report);
  console.log('Report saved to marketplace-audit-report.md');
}

async function main() {
  // Ensure screenshot directory exists
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors']
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  try {
    // 1. Homepage audit (before login)
    await auditHomepage(page, false);

    // 2. Login
    await login(page);

    // 3. Homepage audit (after login)
    await auditHomepage(page, true);

    // 4. Test search and filters
    await testSearchAndFilters(page);

    // 5. Test breeders directory
    await testBreedersDirectory(page);

    // 6. Test services directory
    await testServicesDirectory(page);

    // 7. Test listing detail and inquiry
    await testListingDetail(page);

    // 8. Test all navigation
    await testNavigation(page);

    // 9. Random exploration
    await randomExploration(page);

    // 10. Mobile viewport testing
    await mobileViewportTesting(page);

    // Generate report
    await generateReport();

  } catch (error) {
    console.error('Audit failed:', error);
    await screenshot(page, '99-error-state', 'Error occurred');
  } finally {
    await browser.close();
  }
}

main();
