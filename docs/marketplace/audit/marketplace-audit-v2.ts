import { chromium, Browser, Page, BrowserContext } from 'playwright';
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
  details?: string;
}

const findings: AuditFinding[] = [];
let screenshotCounter = 1;

async function screenshot(page: Page, name: string, description?: string): Promise<string> {
  const filename = `${String(screenshotCounter++).padStart(2, '0')}-${name}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`  [Screenshot] ${filename}${description ? ` - ${description}` : ''}`);
  return filename;
}

function addFinding(category: string, issue: string, severity: AuditFinding['severity'], screenshot?: string, details?: string) {
  findings.push({ category, issue, severity, screenshot, details });
  const icon = severity === 'critical' ? '!!!' : severity === 'major' ? '!!' : severity === 'minor' ? '!' : 'i';
  console.log(`  [${icon}] ${category}: ${issue}`);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loginFlow(page: Page) {
  console.log('\n=== LOGIN FLOW ===');

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await sleep(1000);

  const screenshotName = await screenshot(page, 'landing-page', 'Initial landing page');

  // Check if this is a login page on the homepage
  const isLoginPage = await page.$('input[type="password"]');
  if (isLoginPage) {
    addFinding('UX', 'Public marketplace requires login immediately - no anonymous browsing', 'critical', screenshotName,
      'Users cannot browse animals, breeders, or services without first creating an account');
  }

  // Fill credentials
  const emailInput = await page.$('input[type="email"], input[placeholder*="email"], input[name="email"]');
  const passwordInput = await page.$('input[type="password"]');

  if (emailInput && passwordInput) {
    await emailInput.fill(CREDENTIALS.email);
    await passwordInput.fill(CREDENTIALS.password);
    await sleep(500);
    await screenshot(page, 'login-filled', 'Login form filled');

    // Find and click submit - try multiple selectors
    const submitBtn = await page.$('button:has-text("Sign in"), button:has-text("Login"), button[type="submit"]');
    if (submitBtn) {
      // Wait for it to be enabled
      await page.waitForSelector('button:has-text("Sign in"):not([disabled])', { timeout: 5000 }).catch(() => {});
      await submitBtn.click();
      await sleep(3000);
      await screenshot(page, 'after-login', 'After login attempt');

      // Check if we're still on login page (login failed)
      const stillOnLogin = await page.$('input[type="password"]');
      if (stillOnLogin) {
        addFinding('Authentication', 'Login may have failed - still on login page', 'major');
        return false;
      }
    }
  }

  return true;
}

async function auditHomepageAfterLogin(page: Page) {
  console.log('\n=== HOMEPAGE AFTER LOGIN ===');

  const currentUrl = page.url();
  console.log(`  Current URL: ${currentUrl}`);

  const screenshotName = await screenshot(page, 'homepage-logged-in', 'Homepage after login');

  // Check for logo
  const logoImg = await page.$('img[alt*="BreederHQ"], img[alt*="logo" i], img[src*="logo"]');
  const logoText = await page.$('text=BreederHQ');
  if (!logoImg && !logoText) {
    addFinding('Branding', 'BreederHQ logo/text not prominently visible on homepage', 'major', screenshotName);
  }

  // Check navigation
  const navContent = await page.$$eval('nav, header, [role="navigation"]', els =>
    els.map(el => el.textContent || '').join(' ')
  );
  console.log(`  Navigation content: ${navContent.substring(0, 200)}...`);

  // Get all links
  const allLinks = await page.$$eval('a', links =>
    links.map(l => ({ text: l.textContent?.trim(), href: l.getAttribute('href') })).filter(l => l.text)
  );
  console.log(`  Found ${allLinks.length} links`);

  // Check for Animals | Breeders | Services navigation
  const hasAnimals = navContent.toLowerCase().includes('animal');
  const hasBreeders = navContent.toLowerCase().includes('breeder');
  const hasServices = navContent.toLowerCase().includes('service');

  if (!hasAnimals || !hasBreeders || !hasServices) {
    addFinding('Navigation', `Main nav missing: Animals=${hasAnimals}, Breeders=${hasBreeders}, Services=${hasServices}`, 'major', screenshotName);
  }

  // Check colors
  const bgColor = await page.$eval('body', el => window.getComputedStyle(el).backgroundColor);
  console.log(`  Body background: ${bgColor}`);

  // Light/white background issue check
  if (bgColor.includes('255, 255, 255') || bgColor.includes('white')) {
    addFinding('Branding', 'Background is white - may indicate missing brand styling', 'minor', screenshotName);
  }

  return screenshotName;
}

async function exploreAnimalsPage(page: Page) {
  console.log('\n=== ANIMALS PAGE ===');

  // Try different ways to navigate to animals
  const animalsUrl = `${BASE_URL}/animals`;
  await page.goto(animalsUrl, { waitUntil: 'networkidle' });
  await sleep(1000);

  const screenshotName = await screenshot(page, 'animals-index', 'Animals listing page');

  // Look for species filters
  const filterContent = await page.textContent('body');
  console.log(`  Looking for species filters...`);

  // Check for birds (should NOT be there)
  if (filterContent?.toLowerCase().includes('bird')) {
    addFinding('Species', 'Birds found in species options - birds should not be supported', 'critical', screenshotName);
  }

  // Check for search/filter UI
  const searchInput = await page.$('input[type="search"], input[placeholder*="search" i], input[placeholder*="location" i]');
  if (!searchInput) {
    addFinding('Search', 'No search input found on animals page', 'major', screenshotName);
  }

  // Check for geo-location filter
  const locationFilter = await page.$('input[placeholder*="location" i], input[placeholder*="zip" i], input[placeholder*="city" i], [class*="location"], [class*="geo"]');
  if (!locationFilter) {
    addFinding('Search', 'No geo-location filter found on animals page', 'major', screenshotName);
  }

  // Look for species dropdown/filter
  const speciesFilter = await page.$('select, [role="listbox"], [class*="species"], [class*="filter"]');
  if (speciesFilter) {
    // Try to open it
    try {
      await speciesFilter.click();
      await sleep(500);
      await screenshot(page, 'species-filter-open', 'Species filter opened');
    } catch {}
  }

  // Check for any animal cards
  const animalCards = await page.$$('[class*="card"], [class*="listing"], article');
  console.log(`  Found ${animalCards.length} potential animal cards`);

  return screenshotName;
}

async function exploreAnimalDetail(page: Page) {
  console.log('\n=== ANIMAL DETAIL PAGE ===');

  await page.goto(`${BASE_URL}/animals`, { waitUntil: 'networkidle' });
  await sleep(1000);

  // Click on first animal card/link
  const animalLink = await page.$('a[href*="/animals/"], a[href*="/animal/"], [class*="card"] a');
  if (animalLink) {
    await animalLink.click();
    await sleep(1000);

    const screenshotName = await screenshot(page, 'animal-detail', 'Individual animal listing');

    // Look for contact/inquiry button
    const contactBtn = await page.$('button:has-text("Contact"), button:has-text("Inquire"), button:has-text("Message"), a:has-text("Contact")');
    if (!contactBtn) {
      addFinding('Features', 'No contact/inquiry button on animal detail page', 'major', screenshotName);
    } else {
      // Try clicking it
      try {
        await contactBtn.click();
        await sleep(500);
        await screenshot(page, 'inquiry-form', 'Inquiry/contact form');
      } catch {}
    }

    return screenshotName;
  } else {
    addFinding('Content', 'No animal listings found to click on', 'major');
    return null;
  }
}

async function exploreBreedersPage(page: Page) {
  console.log('\n=== BREEDERS PAGE ===');

  await page.goto(`${BASE_URL}/breeders`, { waitUntil: 'networkidle' });
  await sleep(1000);

  const screenshotName = await screenshot(page, 'breeders-index', 'Breeders directory');

  // Check for breeder cards
  const breederCards = await page.$$('[class*="card"], [class*="breeder"], article');
  console.log(`  Found ${breederCards.length} potential breeder cards`);

  // Click on first breeder
  const breederLink = await page.$('a[href*="/breeder"], [class*="card"] a');
  if (breederLink) {
    await breederLink.click();
    await sleep(1000);
    await screenshot(page, 'breeder-detail', 'Individual breeder profile');
  }

  return screenshotName;
}

async function exploreServicesPage(page: Page) {
  console.log('\n=== SERVICES PAGE ===');

  await page.goto(`${BASE_URL}/services`, { waitUntil: 'networkidle' });
  await sleep(1000);

  const screenshotName = await screenshot(page, 'services-index', 'Services directory');

  return screenshotName;
}

async function exploreNavigation(page: Page) {
  console.log('\n=== NAVIGATION EXPLORATION ===');

  // Go back to main page
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await sleep(1000);

  // Get all visible navigation items
  const navItems = await page.$$eval('nav a, header a, [role="navigation"] a', links =>
    links.map(l => ({
      text: l.textContent?.trim(),
      href: l.getAttribute('href'),
      visible: window.getComputedStyle(l).display !== 'none'
    })).filter(l => l.text && l.visible)
  );

  console.log('  Navigation items found:');
  navItems.forEach(item => console.log(`    - ${item.text}: ${item.href}`));

  // Check for expected vs actual nav
  const expectedNav = ['Animals', 'Breeders', 'Services', 'Saved', 'Messages', 'Account', 'Help'];
  const actualTexts = navItems.map(i => i.text?.toLowerCase());

  expectedNav.forEach(expected => {
    if (!actualTexts.some(a => a?.includes(expected.toLowerCase()))) {
      addFinding('Navigation', `Expected navigation item "${expected}" not found`, 'minor');
    }
  });

  await screenshot(page, 'navigation-overview', 'Navigation structure');
}

async function randomExploration(page: Page) {
  console.log('\n=== RANDOM EXPLORATION ===');

  const pagesToExplore = [
    { path: '/saved', name: 'Saved listings' },
    { path: '/favorites', name: 'Favorites' },
    { path: '/messages', name: 'Messages' },
    { path: '/inquiries', name: 'Inquiries' },
    { path: '/account', name: 'Account' },
    { path: '/profile', name: 'Profile' },
    { path: '/settings', name: 'Settings' },
    { path: '/about', name: 'About' },
    { path: '/help', name: 'Help' },
    { path: '/contact', name: 'Contact' },
    { path: '/waitlist', name: 'Waitlist' },
  ];

  for (const { path: pagePath, name } of pagesToExplore) {
    try {
      const response = await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'networkidle', timeout: 10000 });
      await sleep(500);

      if (response && response.status() !== 404) {
        console.log(`  Found page: ${pagePath} (${response.status()})`);
        await screenshot(page, `explore-${pagePath.replace('/', '').replace(/\//g, '-') || 'root'}`, name);
      }
    } catch (e) {
      // Page doesn't exist or error
    }
  }
}

async function mobileViewportTest(page: Page) {
  console.log('\n=== MOBILE VIEWPORT TEST ===');

  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 812 });

  // Test homepage
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await sleep(1000);
  const mobileHome = await screenshot(page, 'mobile-homepage', 'Mobile homepage');

  // Check for mobile navigation (hamburger menu)
  const hamburger = await page.$('[class*="hamburger" i], [class*="menu-toggle" i], button[aria-label*="menu" i], [class*="mobile-menu"]');
  if (!hamburger) {
    addFinding('Responsive', 'No hamburger/mobile menu button found', 'major', mobileHome);
  } else {
    // Try opening it
    try {
      await hamburger.click();
      await sleep(500);
      await screenshot(page, 'mobile-menu-open', 'Mobile menu opened');
    } catch {}
  }

  // Test animals page on mobile
  await page.goto(`${BASE_URL}/animals`, { waitUntil: 'networkidle' });
  await sleep(500);
  await screenshot(page, 'mobile-animals', 'Mobile animals page');

  // Test breeders on mobile
  await page.goto(`${BASE_URL}/breeders`, { waitUntil: 'networkidle' });
  await sleep(500);
  await screenshot(page, 'mobile-breeders', 'Mobile breeders page');

  // Reset viewport
  await page.setViewportSize({ width: 1280, height: 720 });
}

async function generateReport() {
  console.log('\n=== GENERATING REPORT ===');

  const report = `# Marketplace UI/UX Audit Report

**Generated:** ${new Date().toISOString()}
**URL Tested:** ${BASE_URL}

## Executive Summary

Total findings: **${findings.length}**

| Severity | Count |
|----------|-------|
| Critical | ${findings.filter(f => f.severity === 'critical').length} |
| Major | ${findings.filter(f => f.severity === 'major').length} |
| Minor | ${findings.filter(f => f.severity === 'minor').length} |
| Info | ${findings.filter(f => f.severity === 'info').length} |

## Critical Issues

${findings.filter(f => f.severity === 'critical').map(f => `
### ${f.category}
**Issue:** ${f.issue}
${f.details ? `\n**Details:** ${f.details}` : ''}
${f.screenshot ? `\n**Screenshot:** \`${f.screenshot}\`` : ''}
`).join('\n') || 'None found.'}

## Major Issues

${findings.filter(f => f.severity === 'major').map(f => `
### ${f.category}
**Issue:** ${f.issue}
${f.details ? `\n**Details:** ${f.details}` : ''}
${f.screenshot ? `\n**Screenshot:** \`${f.screenshot}\`` : ''}
`).join('\n') || 'None found.'}

## Minor Issues

${findings.filter(f => f.severity === 'minor').map(f => `- **${f.category}:** ${f.issue}${f.screenshot ? ` (${f.screenshot})` : ''}`).join('\n') || 'None found.'}

## Informational

${findings.filter(f => f.severity === 'info').map(f => `- **${f.category}:** ${f.issue}${f.screenshot ? ` (${f.screenshot})` : ''}`).join('\n') || 'None found.'}

## All Findings by Category

${(() => {
  const byCategory = findings.reduce((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {} as Record<string, AuditFinding[]>);

  return Object.entries(byCategory).map(([cat, items]) => `
### ${cat}
${items.map(f => `- [${f.severity.toUpperCase()}] ${f.issue}`).join('\n')}
`).join('\n');
})()}

## Screenshots Captured

All screenshots saved to: \`screenshots/marketplace/\`

${fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png')).map(f => `- \`${f}\``).join('\n')}

---
*Audit conducted using Playwright automated testing*
`;

  const reportPath = path.join(__dirname, 'marketplace-audit-report.md');
  fs.writeFileSync(reportPath, report);
  console.log(`Report saved to: ${reportPath}`);

  return report;
}

async function main() {
  console.log('==========================================');
  console.log('  MARKETPLACE UI/UX AUDIT');
  console.log('==========================================');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Screenshots: ${SCREENSHOT_DIR}`);

  // Ensure screenshot directory exists
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  // Clear old screenshots
  const oldScreenshots = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png'));
  oldScreenshots.forEach(f => fs.unlinkSync(path.join(SCREENSHOT_DIR, f)));
  console.log(`Cleared ${oldScreenshots.length} old screenshots`);

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
    // 1. Login flow
    const loggedIn = await loginFlow(page);

    if (loggedIn) {
      // 2. Homepage after login
      await auditHomepageAfterLogin(page);

      // 3. Animals page
      await exploreAnimalsPage(page);

      // 4. Animal detail
      await exploreAnimalDetail(page);

      // 5. Breeders page
      await exploreBreedersPage(page);

      // 6. Services page
      await exploreServicesPage(page);

      // 7. Navigation exploration
      await exploreNavigation(page);

      // 8. Random exploration
      await randomExploration(page);

      // 9. Mobile viewport
      await mobileViewportTest(page);
    }

    // Generate report
    await generateReport();

    console.log('\n==========================================');
    console.log('  AUDIT COMPLETE');
    console.log('==========================================');
    console.log(`Total findings: ${findings.length}`);
    console.log(`Critical: ${findings.filter(f => f.severity === 'critical').length}`);
    console.log(`Major: ${findings.filter(f => f.severity === 'major').length}`);
    console.log(`Minor: ${findings.filter(f => f.severity === 'minor').length}`);
    console.log(`Info: ${findings.filter(f => f.severity === 'info').length}`);

  } catch (error) {
    console.error('\n!!! Audit failed with error:', error);
    await screenshot(page, 'error-state', 'Error occurred during audit');
  } finally {
    await browser.close();
  }
}

main();
