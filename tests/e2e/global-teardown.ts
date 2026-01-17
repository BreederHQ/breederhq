// tests/e2e/global-teardown.ts
// Global teardown hook that runs after all tests

import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 Running global teardown...\n');

  // TEMPORARILY DISABLED - keeping test artifacts for debugging
  console.log('  ⚠️ Cleanup disabled for debugging\n');
  console.log('✓ Teardown complete\n');
}

export default globalTeardown;
