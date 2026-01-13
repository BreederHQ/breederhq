// Playwright script to capture marketplace screenshots for design audit
import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotDir = join(__dirname, 'screenshots');

async function main() {
  // Ensure screenshot directory exists
  await mkdir(screenshotDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  console.log('1. Navigating to marketplace...');
  await page.goto('https://marketplace.breederhq.test', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: join(screenshotDir, '01-home-logged-out.png'), fullPage: true });
  console.log('   Captured: home-logged-out');

  console.log('2. Navigating to login...');
  // Look for login link or navigate directly
  await page.goto('https://marketplace.breederhq.test/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: join(screenshotDir, '02-login-page.png'), fullPage: true });
  console.log('   Captured: login-page');

  console.log('3. Logging in...');
  // Fill login form
  await page.fill('input[type="email"], input[name="email"]', 'marketplace-access@bhq.local');
  await page.fill('input[type="password"], input[name="password"]', 'Marketplace2026!');
  await page.screenshot({ path: join(screenshotDir, '03-login-filled.png'), fullPage: true });

  // Submit
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  await page.screenshot({ path: join(screenshotDir, '04-after-login.png'), fullPage: true });
  console.log('   Captured: after-login');

  // Capture all main pages
  const pages = [
    { path: '/', name: '05-home-logged-in' },
    { path: '/breeders', name: '06-browse-breeders' },
    { path: '/animals', name: '07-browse-animals' },
    { path: '/services', name: '08-browse-services' },
    { path: '/inquiries', name: '09-inquiries' },
    { path: '/saved', name: '10-saved-listings' },
    { path: '/waitlist', name: '11-waitlist-positions' },
    { path: '/dashboard', name: '12-buyer-dashboard' },
    { path: '/me/programs', name: '13-my-programs' },
    { path: '/me/services', name: '14-my-services' },
    { path: '/provider', name: '15-provider-dashboard' },
  ];

  for (const p of pages) {
    console.log(`Capturing ${p.name}...`);
    try {
      await page.goto(`https://marketplace.breederhq.test${p.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(500); // Let animations settle
      await page.screenshot({ path: join(screenshotDir, `${p.name}.png`), fullPage: true });
      console.log(`   Captured: ${p.name}`);
    } catch (err) {
      console.log(`   Failed to capture ${p.name}: ${err.message}`);
    }
  }

  // Mobile viewport captures
  console.log('Capturing mobile views...');
  await page.setViewportSize({ width: 375, height: 812 });

  const mobilePages = [
    { path: '/', name: '20-mobile-home' },
    { path: '/breeders', name: '21-mobile-breeders' },
    { path: '/services', name: '22-mobile-services' },
  ];

  for (const p of mobilePages) {
    console.log(`Capturing mobile ${p.name}...`);
    try {
      await page.goto(`https://marketplace.breederhq.test${p.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(screenshotDir, `${p.name}.png`), fullPage: true });
      console.log(`   Captured: ${p.name}`);
    } catch (err) {
      console.log(`   Failed to capture ${p.name}: ${err.message}`);
    }
  }

  await browser.close();
  console.log('\nDone! Screenshots saved to:', screenshotDir);
}

main().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
