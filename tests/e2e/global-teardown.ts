// tests/e2e/global-teardown.ts
// Global teardown hook that runs after all tests

import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 Running global teardown...\n');

  // Clean up Playwright artifacts
  const dirsToClean = [
    path.resolve(__dirname, '../../test-results'),
    path.resolve(__dirname, '../../playwright-report'),
  ];

  for (const dir of dirsToClean) {
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`  ✓ Cleaned ${path.basename(dir)}`);
      } catch (err: any) {
        console.error(`  ✗ Failed to clean ${dir}:`, err.message);
      }
    }
  }

  console.log('\n✓ Cleanup complete\n');
}

export default globalTeardown;
