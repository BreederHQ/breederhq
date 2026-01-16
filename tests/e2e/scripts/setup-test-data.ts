// tests/e2e/scripts/setup-test-data.ts
// Script to set up test data before running E2E tests

import { execSync } from 'child_process';
import * as crypto from 'crypto';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:6170';
const TENANT_ID = 1;

interface TestUser {
  email: string;
  password: string;
  role: string;
  name: string;
}

const TEST_USERS: TestUser[] = [
  {
    email: 'test.breeder@example.com',
    password: 'TestPassword123!',
    role: 'BREEDER',
    name: 'Test Breeder',
  },
  {
    email: 'test.buyer@example.com',
    password: 'TestPassword123!',
    role: 'PORTAL',
    name: 'John Doe',
  },
  {
    email: 'test.buyer2@example.com',
    password: 'TestPassword123!',
    role: 'PORTAL',
    name: 'Jane Smith',
  },
];

async function hashPassword(password: string): Promise<string> {
  // Using bcryptjs if available, otherwise return a placeholder
  try {
    const bcrypt = require('bcryptjs');
    return await bcrypt.hash(password, 10);
  } catch {
    console.warn('bcryptjs not available, using placeholder hash');
    return '$2a$10$placeholder' + crypto.randomBytes(32).toString('hex');
  }
}

async function setupUsers() {
  console.log('Setting up test users...');

  for (const user of TEST_USERS) {
    const passwordHash = await hashPassword(user.password);

    const userSql = `
      INSERT INTO users (email, password_hash, role, tenant_id, created_at, updated_at)
      VALUES ('${user.email}', '${passwordHash}', '${user.role}', ${TENANT_ID}, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        updated_at = NOW();
    `;

    console.log(`  - Creating user: ${user.email}`);

    try {
      execSync(`psql "${process.env.TEST_DATABASE_URL}" -c "${userSql}"`, {
        stdio: 'pipe',
      });
    } catch (err: any) {
      console.error(`  ✗ Failed to create user ${user.email}:`, err.message);
    }
  }
}

async function setupParties() {
  console.log('\nSetting up test parties (contacts)...');

  const parties = [
    { name: 'John Doe', email: 'test.buyer@example.com', type: 'INDIVIDUAL' },
    { name: 'Jane Smith', email: 'test.buyer2@example.com', type: 'INDIVIDUAL' },
    { name: 'ABC Kennels', email: 'contact@abckennels.com', type: 'ORGANIZATION' },
    { name: 'Empty Contact', email: 'empty@example.com', type: 'INDIVIDUAL' },
  ];

  for (const party of parties) {
    const partySql = `
      INSERT INTO parties (display_name, primary_email, type, tenant_id, created_at, updated_at)
      VALUES ('${party.name}', '${party.email}', '${party.type}', ${TENANT_ID}, NOW(), NOW())
      ON CONFLICT (primary_email, tenant_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        type = EXCLUDED.type,
        updated_at = NOW();
    `;

    console.log(`  - Creating party: ${party.name}`);

    try {
      execSync(`psql "${process.env.TEST_DATABASE_URL}" -c "${partySql}"`, {
        stdio: 'pipe',
      });
    } catch (err: any) {
      console.error(`  ✗ Failed to create party ${party.name}:`, err.message);
    }
  }
}

async function setupTemplates() {
  console.log('\nSetting up contract templates...');

  try {
    execSync('npm run db:seed:contracts', {
      cwd: '../breederhq-api',
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL,
      },
    });
    console.log('  ✓ Templates seeded');
  } catch (err: any) {
    console.error('  ✗ Failed to seed templates:', err.message);
  }
}

async function verifySetup() {
  console.log('\nVerifying test data setup...');

  const checks = [
    { name: 'Users', query: 'SELECT COUNT(*) FROM users WHERE email LIKE \'test.%\'' },
    { name: 'Parties', query: 'SELECT COUNT(*) FROM parties WHERE tenant_id = 1' },
    { name: 'Templates', query: 'SELECT COUNT(*) FROM contract_templates WHERE type = \'SYSTEM\'' },
  ];

  for (const check of checks) {
    try {
      const result = execSync(`psql "${process.env.TEST_DATABASE_URL}" -t -c "${check.query}"`, {
        encoding: 'utf-8',
      });
      const count = parseInt(result.trim());
      console.log(`  ✓ ${check.name}: ${count} records`);
    } catch (err: any) {
      console.error(`  ✗ ${check.name} check failed:`, err.message);
    }
  }
}

async function main() {
  console.log('=== E2E Test Data Setup ===\n');

  if (!process.env.TEST_DATABASE_URL) {
    console.error('ERROR: TEST_DATABASE_URL not set in environment');
    process.exit(1);
  }

  await setupUsers();
  await setupParties();
  await setupTemplates();
  await verifySetup();

  console.log('\n✓ Test data setup complete!');
}

main().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
