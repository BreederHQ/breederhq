// tests/e2e/global-setup.ts
// Global setup hook that runs before all tests

import { chromium, FullConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function globalSetup(config: FullConfig) {
  console.log('\n🔧 Running global setup...\n');

  // Skip service checks if SKIP_SERVICE_CHECK is set
  if (process.env.SKIP_SERVICE_CHECK === 'true') {
    console.log('⚠️  Skipping service checks (SKIP_SERVICE_CHECK=true)\n');
    return;
  }

  // Check if required services are running
  const baseURL = config.use?.baseURL || process.env.BASE_URL || 'http://localhost:6001';
  const apiURL = process.env.API_BASE_URL || 'http://localhost:6001';

  console.log(`Checking services:`);
  console.log(`  Frontend: ${baseURL}`);
  console.log(`  API: ${apiURL}`);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Check frontend
  try {
    await page.goto(baseURL, { timeout: 5000 });
    console.log('  ✓ Frontend is running');
  } catch (err) {
    console.error('  ✗ Frontend is not accessible');
    console.error('  Please start the frontend with: npm run dev');
    console.error('  Or set SKIP_SERVICE_CHECK=true to skip this check');
    await browser.close();
    throw new Error('Frontend not running');
  }

  // Check API (via the frontend proxy)
  try {
    const response = await page.goto(`${baseURL}/api/v1/contract-templates`, { timeout: 5000 });
    // API responds with any status code means it's running (200, 401, 403, 500, etc.)
    if (response && response.status() >= 200) {
      console.log(`  ✓ API is running (via proxy) - status ${response.status()}`);
    } else {
      throw new Error(`API health check failed with status ${response?.status()}`);
    }
  } catch (err: any) {
    console.error('  ✗ API is not accessible');
    console.error('  Error:', err.message);
    console.error('  Please start the API with: cd ../breederhq-api && npm run dev');
    console.error('  Or set SKIP_SERVICE_CHECK=true to skip this check');
    await browser.close();
    throw new Error('API not running');
  }

  await browser.close();

  console.log('\n✓ All services are running\n');
}

export default globalSetup;
