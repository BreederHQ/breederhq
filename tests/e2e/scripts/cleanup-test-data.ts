// tests/e2e/scripts/cleanup-test-data.ts
// Script to clean up test data after running E2E tests

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const TENANT_ID = 1;

async function cleanupDatabase() {
  console.log('Cleaning up test database...');

  const cleanupQueries = [
    // Delete contracts and related data
    'DELETE FROM signature_events WHERE contract_id IN (SELECT id FROM contracts WHERE tenant_id = ' + TENANT_ID + ')',
    'DELETE FROM contract_contents WHERE contract_id IN (SELECT id FROM contracts WHERE tenant_id = ' + TENANT_ID + ')',
    'DELETE FROM contract_parties WHERE contract_id IN (SELECT id FROM contracts WHERE tenant_id = ' + TENANT_ID + ')',
    'DELETE FROM contracts WHERE tenant_id = ' + TENANT_ID,

    // Delete test parties
    'DELETE FROM parties WHERE primary_email LIKE \'test.%\' OR primary_email LIKE \'%@example.com\'',

    // Delete test users
    'DELETE FROM users WHERE email LIKE \'test.%\'',

    // Delete notifications for test users
    'DELETE FROM notifications WHERE tenant_id = ' + TENANT_ID,
  ];

  for (const query of cleanupQueries) {
    try {
      execSync(`psql "${process.env.TEST_DATABASE_URL}" -c "${query}"`, {
        stdio: 'pipe',
      });
    } catch (err: any) {
      console.error(`  ✗ Cleanup query failed:`, err.message);
    }
  }

  console.log('  ✓ Database cleaned');
}

async function cleanupScreenshots() {
  console.log('\nCleaning up Playwright artifacts...');

  const dirs = [
    path.resolve(__dirname, '../../../test-results'),
    path.resolve(__dirname, '../../../playwright-report'),
  ];

  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`  ✓ Removed ${path.basename(dir)}`);
      } catch (err: any) {
        console.error(`  ✗ Failed to remove ${dir}:`, err.message);
      }
    }
  }
}

async function main() {
  console.log('=== E2E Test Cleanup ===\n');

  if (!process.env.TEST_DATABASE_URL) {
    console.error('ERROR: TEST_DATABASE_URL not set in environment');
    process.exit(1);
  }

  await cleanupDatabase();
  await cleanupScreenshots();

  console.log('\n✓ Cleanup complete!');
}

main().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
