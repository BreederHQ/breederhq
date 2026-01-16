// Playwright script v2 - with proper session handling
import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotDir = join(__dirname, 'screenshots');

async function main() {
  await mkdir(screenshotDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  console.log('1. Going to login page...');
  await page.goto('https://marketplace.breederhq.test/login', { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for form to be ready
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });

  console.log('2. Filling credentials...');
  await page.fill('input[type="email"], input[name="email"]', 'marketplace-access@bhq.local');
  await page.fill('input[type="password"], input[name="password"]', 'Marketplace2026!');

  console.log('3. Submitting...');
  await page.click('button[type="submit"]');

  // Wait for navigation or URL change
  console.log('4. Waiting for redirect...');
  try {
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 });
    console.log('   Redirected to:', page.url());
  } catch (e) {
    console.log('   No redirect detected, current URL:', page.url());
    // Check for error messages
    const errorText = await page.textContent('body');
    if (errorText.includes('error') || errorText.includes('invalid')) {
      console.log('   Possible login error on page');
    }
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: join(screenshotDir, 'v2-01-after-login.png'), fullPage: true });
  console.log('   Screenshot: after-login');

  // Try navigating to home
  console.log('5. Going to home...');
  await page.goto('https://marketplace.breederhq.test/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: join(screenshotDir, 'v2-02-home.png'), fullPage: true });
  console.log('   URL:', page.url());

  // Check if we're logged in by looking for user-specific elements
  const pageContent = await page.content();
  const isLoggedIn = !pageContent.includes('Sign in') || pageContent.includes('Sign out') || pageContent.includes('Account');
  console.log('   Appears logged in:', isLoggedIn);

  // Capture pages
  const pages = [
    { path: '/breeders', name: 'v2-03-breeders' },
    { path: '/animals', name: 'v2-04-animals' },
    { path: '/services', name: 'v2-05-services' },
    { path: '/saved', name: 'v2-06-saved' },
    { path: '/waitlist', name: 'v2-07-waitlist' },
    { path: '/dashboard', name: 'v2-08-dashboard' },
    { path: '/inquiries', name: 'v2-09-inquiries' },
  ];

  for (const p of pages) {
    console.log(`Capturing ${p.name}...`);
    try {
      await page.goto(`https://marketplace.breederhq.test${p.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(screenshotDir, `${p.name}.png`), fullPage: true });
      console.log(`   URL: ${page.url()}`);
    } catch (err) {
      console.log(`   Failed: ${err.message}`);
    }
  }

  // Mobile
  console.log('Mobile captures...');
  await page.setViewportSize({ width: 375, height: 812 });

  await page.goto('https://marketplace.breederhq.test/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(screenshotDir, 'v2-mobile-home.png'), fullPage: true });

  await browser.close();
  console.log('\nDone!');
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
