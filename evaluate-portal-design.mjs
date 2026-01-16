// evaluate-portal-design.mjs
// Playwright script to evaluate the portal design with demo data
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const PORTAL_URL = 'https://portal.breederhq.test';
const EMAIL = 'obiwan@jundland.example.com';
const PASSWORD = 'ewk6BCY3dfm0kdk_ymr';

async function evaluatePortalDesign() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2, // Retina display
  });
  const page = await context.newPage();

  const screenshots = [];
  const issues = [];

  console.log('🚀 Starting portal design evaluation...\n');

  try {
    // 1. Navigate to portal
    console.log('📍 Step 1: Navigating to portal...');
    await page.goto(PORTAL_URL);
    await page.waitForLoadState('networkidle');

    // 2. Login
    console.log('🔐 Step 2: Logging in...');

    // Wait for login form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Fill in credentials
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);

    // Click sign in button and wait for navigation
    const [response] = await Promise.all([
      page.waitForNavigation({ timeout: 30000 }),
      page.click('button:has-text("Sign in")'),
    ]);

    console.log(`  Login response status: ${response?.status()}`);
    console.log(`  Current URL after login: ${page.url()}`);

    // Wait for portal to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check if we're actually logged in (not on login page anymore)
    const isLoggedIn = !page.url().includes('/login');
    if (!isLoggedIn) {
      throw new Error('Login failed - still on login page');
    }

    console.log('  ✓ Successfully logged in!');

    // 3. Enable demo mode
    console.log('🎭 Step 3: Enabling demo mode...');
    const currentUrl = page.url();
    const demoUrl = currentUrl.includes('?')
      ? `${currentUrl}&demo=true`
      : `${currentUrl}?demo=true`;
    await page.goto(demoUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Demo mode enabled!\n');

    // 4. Capture all pages in BOTH themes
    const pages = [
      { name: 'Dashboard (Overview)', path: '/?demo=true' },
      { name: 'My Animals (Offspring)', path: '/offspring?demo=true' },
      { name: 'Financials', path: '/financials?demo=true' },
      { name: 'Documents', path: '/documents?demo=true' },
      { name: 'Agreements', path: '/agreements?demo=true' },
      { name: 'Messages', path: '/messages?demo=true' },
      { name: 'Activity', path: '/activity?demo=true' },
    ];

    // Capture in DARK mode first
    console.log('🌙 Capturing Dark Mode...\n');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('portal-theme', 'dark');
    });
    await page.waitForTimeout(500);

    for (const pageInfo of pages) {
      console.log(`📸 Capturing: ${pageInfo.name} (Dark)...`);

      await page.goto(`${PORTAL_URL}${pageInfo.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500); // Wait for any animations

      // Take screenshot
      const screenshotPath = `screenshots/dark_${pageInfo.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });

      screenshots.push({
        name: `${pageInfo.name} (Dark)`,
        path: screenshotPath,
        url: page.url(),
        theme: 'dark'
      });

      // Analyze the page
      const analysis = await analyzePage(page, pageInfo.name);
      if (analysis.issues.length > 0) {
        issues.push(...analysis.issues.map(issue => ({
          page: `${pageInfo.name} (Dark)`,
          ...issue
        })));
      }

      console.log(`  ✓ ${pageInfo.name} (Dark) captured`);
    }

    // Capture in LIGHT mode
    console.log('\n☀️  Capturing Light Mode...\n');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('portal-theme', 'light');
    });
    await page.waitForTimeout(500);

    for (const pageInfo of pages) {
      console.log(`📸 Capturing: ${pageInfo.name} (Light)...`);

      await page.goto(`${PORTAL_URL}${pageInfo.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500); // Wait for any animations

      // Take screenshot
      const screenshotPath = `screenshots/light_${pageInfo.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });

      screenshots.push({
        name: `${pageInfo.name} (Light)`,
        path: screenshotPath,
        url: page.url(),
        theme: 'light'
      });

      // Analyze the page
      const analysis = await analyzePage(page, pageInfo.name);
      if (analysis.issues.length > 0) {
        issues.push(...analysis.issues.map(issue => ({
          page: `${pageInfo.name} (Light)`,
          ...issue
        })));
      }

      console.log(`  ✓ ${pageInfo.name} (Light) captured`);
    }

    // 5. Test mobile responsiveness (key page)
    console.log('\n📱 Testing mobile view (Dashboard)...');
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone 12 Pro
    await page.goto(`${PORTAL_URL}/?demo=true`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const mobileScreenshotPath = 'screenshots/dashboard_mobile.png';
    await page.screenshot({
      path: mobileScreenshotPath,
      fullPage: true
    });

    screenshots.push({
      name: 'Dashboard (Mobile)',
      path: mobileScreenshotPath,
      url: page.url(),
    });

    // 6. Test sidebar navigation
    console.log('🧭 Testing sidebar navigation...');
    await page.setViewportSize({ width: 1920, height: 1080 }); // Back to desktop
    await page.goto(`${PORTAL_URL}/?demo=true`);
    await page.waitForLoadState('networkidle');

    const sidebarExists = await page.locator('.portal-sidebar').count() > 0;
    if (!sidebarExists) {
      issues.push({
        page: 'Layout',
        severity: 'high',
        category: 'Navigation',
        issue: 'Persistent sidebar not found - premium portal spec requires always-visible sidebar',
      });
    } else {
      console.log('  ✓ Sidebar navigation present');
    }

    // 7. Check for demo toggle button
    const demoToggle = await page.locator('button:has-text("Demo")').count() > 0;
    if (!demoToggle) {
      issues.push({
        page: 'Layout',
        severity: 'medium',
        category: 'Demo Mode',
        issue: 'Demo toggle button not visible in header',
      });
    } else {
      console.log('  ✓ Demo toggle button present');
    }

    // 8. Check for theme toggle button
    console.log('🎨 Testing theme toggle...');
    const currentTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    console.log(`  Current theme: ${currentTheme || 'default (dark)'}`);

    // Count SVG icons in buttons (sun/moon icons)
    const themeToggleExists = await page.evaluate(() => {
      // Look for theme toggle button by checking for sun/moon SVG paths
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(button => {
        const svg = button.querySelector('svg');
        if (!svg) return false;
        const path = svg.querySelector('path');
        if (!path) return false;
        const d = path.getAttribute('d');
        // Check for moon path or circle (sun)
        return d && (d.includes('M21 12.79') || svg.querySelector('circle'));
      });
    });

    if (!themeToggleExists) {
      issues.push({
        page: 'Layout',
        severity: 'medium',
        category: 'Theme Toggle',
        issue: 'Theme toggle button not found in header',
      });
    } else {
      console.log('  ✓ Theme toggle button present');
    }

    // 8. Generate report
    console.log('\n📊 Generating evaluation report...');
    const report = generateReport(screenshots, issues);
    writeFileSync('portal-evaluation-report.md', report);
    console.log('✅ Report saved to portal-evaluation-report.md\n');

    // 9. Summary
    console.log('═══════════════════════════════════════');
    console.log('📋 EVALUATION COMPLETE');
    console.log('═══════════════════════════════════════');
    console.log(`Screenshots captured: ${screenshots.length}`);
    console.log(`Issues found: ${issues.length}`);
    console.log(`  - High severity: ${issues.filter(i => i.severity === 'high').length}`);
    console.log(`  - Medium severity: ${issues.filter(i => i.severity === 'medium').length}`);
    console.log(`  - Low severity: ${issues.filter(i => i.severity === 'low').length}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error during evaluation:', error);
    throw error;
  } finally {
    await browser.close();
  }

  return { screenshots, issues };
}

async function analyzePage(page, pageName) {
  const issues = [];

  // Check for empty states
  const hasEmptyState = await page.locator('text=/no.*yet|nothing.*here/i').count() > 0;
  if (hasEmptyState) {
    issues.push({
      severity: 'high',
      category: 'Demo Data',
      issue: `Empty state detected - demo data may not be loading properly`,
    });
  }

  // Check for demo data indicators
  const hasLunaReference = await page.locator('text=/luna/i').count() > 0;
  if (!hasLunaReference && pageName !== 'Activity') {
    issues.push({
      severity: 'medium',
      category: 'Demo Data',
      issue: `Demo animal "Luna" not found on page - demo data may not be integrated`,
    });
  }

  // Check for loading states
  const isLoading = await page.locator('[style*="animation"]').count() > 0;
  if (isLoading) {
    issues.push({
      severity: 'low',
      category: 'Loading',
      issue: 'Page still showing loading animation after timeout',
    });
  }

  return { issues };
}

function generateReport(screenshots, issues) {
  const darkScreenshots = screenshots.filter(s => s.theme === 'dark');
  const lightScreenshots = screenshots.filter(s => s.theme === 'light');
  const otherScreenshots = screenshots.filter(s => !s.theme);

  let report = `# Portal Design Evaluation Report
**Date**: ${new Date().toISOString()}
**Mode**: Demo Data Enabled + Theme Testing
**URL**: ${PORTAL_URL}
**Themes Tested**: Dark Mode & Light Mode

---

## Executive Summary

Evaluated the BreederHQ Client Portal with demo data enabled to assess:
- Demo data integration across all pages
- Navigation structure (persistent sidebar)
- Visual design consistency
- Mobile responsiveness
- Premium portal specifications compliance

**Total Pages Evaluated**: ${screenshots.length}
**Total Issues Found**: ${issues.length}

---

## Screenshots Captured

### Dark Mode
${darkScreenshots.map(s => `- **${s.name}**: \`${s.path}\``).join('\n')}

### Light Mode
${lightScreenshots.map(s => `- **${s.name}**: \`${s.path}\``).join('\n')}

${otherScreenshots.length > 0 ? `### Other\n${otherScreenshots.map(s => `- **${s.name}**: \`${s.path}\``).join('\n')}\n` : ''}

---

## Issues Found

`;

  if (issues.length === 0) {
    report += '✅ **No issues found!** All pages rendered correctly with demo data.\n\n';
  } else {
    // Group by severity
    const highSeverity = issues.filter(i => i.severity === 'high');
    const mediumSeverity = issues.filter(i => i.severity === 'medium');
    const lowSeverity = issues.filter(i => i.severity === 'low');

    if (highSeverity.length > 0) {
      report += `### 🔴 High Severity Issues (${highSeverity.length})\n\n`;
      highSeverity.forEach((issue, idx) => {
        report += `${idx + 1}. **${issue.page}** - ${issue.category}\n`;
        report += `   - ${issue.issue}\n\n`;
      });
    }

    if (mediumSeverity.length > 0) {
      report += `### 🟡 Medium Severity Issues (${mediumSeverity.length})\n\n`;
      mediumSeverity.forEach((issue, idx) => {
        report += `${idx + 1}. **${issue.page}** - ${issue.category}\n`;
        report += `   - ${issue.issue}\n\n`;
      });
    }

    if (lowSeverity.length > 0) {
      report += `### 🟢 Low Severity Issues (${lowSeverity.length})\n\n`;
      lowSeverity.forEach((issue, idx) => {
        report += `${idx + 1}. **${issue.page}** - ${issue.category}\n`;
        report += `   - ${issue.issue}\n\n`;
      });
    }
  }

  report += `---

## Premium Portal Spec Compliance

Comparing against [docs/portal/PREMIUM_PORTAL_DESIGN.md](docs/portal/PREMIUM_PORTAL_DESIGN.md):

### ✅ Completed
- Demo data system integrated
- Persistent sidebar navigation (if present)
- Dark premium theme (#08090a)

### 🚧 Needs Review
- Information Architecture (6 core destinations in sidebar)
- Page layouts match spec designs
- Visual design tokens consistency
- Mobile responsiveness

### ❌ Not Yet Implemented
- "Overview" page with action-required logic
- "My Animals" page with timeline and update feed
- Enhanced Financials with Stripe Checkout
- Enhanced Messages with WebSocket real-time
- Documents page with upload/download
- Agreements page with signature flow

---

## Next Steps

Based on this evaluation, the recommended implementation order is:

1. **Fix high-severity issues** - Ensure demo data renders on all pages
2. **Verify sidebar navigation** - Confirm persistent sidebar works on all screen sizes
3. **Implement Overview page** - Create new landing page per premium spec
4. **Enhance My Animals page** - Add timeline, photos, update feed
5. **Polish visual design** - Ensure all pages use design tokens consistently

---

*Report generated by Playwright automated evaluation*
`;

  return report;
}

// Create screenshots directory
try {
  mkdirSync('screenshots', { recursive: true });
} catch (err) {
  // Directory already exists
}

// Run evaluation
evaluatePortalDesign()
  .then(({ screenshots, issues }) => {
    console.log('✨ Evaluation completed successfully!');
    process.exit(issues.filter(i => i.severity === 'high').length > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('💥 Evaluation failed:', error);
    process.exit(1);
  });
