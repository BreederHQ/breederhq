# E2E Tests - Quick Start Guide

Get the contract E2E tests running in 5 minutes.

## Prerequisites Check

```bash
# Check Node version (need 20+)
node --version

# Check npm version (need 10+)
npm --version

# Check PostgreSQL is running
psql --version
```

## 1. Install Dependencies (2 min)

```bash
# Install project dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

## 2. Setup Email Capture (1 min)

**Option A: MailHog (Recommended for macOS/Linux)**
```bash
# macOS
brew install mailhog
mailhog

# Windows - Download from https://github.com/mailhog/MailHog/releases
# Run mailhog.exe
```

**Option B: smtp4dev (Docker)**
```bash
docker run -d -p 8025:80 -p 2525:25 --name smtp4dev rnwood/smtp4dev
```

**Verify**: Open http://localhost:8025 - you should see the email UI.

## 3. Setup Test Database (2 min)

```bash
# Navigate to API directory
cd ../breederhq-api

# Create test database
createdb breederhq_test

# Run migrations
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/breederhq_test" npx prisma migrate deploy

# Seed contract templates
npm run db:seed:contracts
```

## 4. Create Test Users

Run this SQL in your test database:

```sql
-- Test breeder user (CHANGE PASSWORD HASH)
INSERT INTO users (email, password_hash, role, tenant_id, created_at, updated_at)
VALUES (
  'test.breeder@example.com',
  '$2a$10$YourHashedPasswordHere',
  'BREEDER',
  1,
  NOW(),
  NOW()
);

-- Test portal user (buyer)
INSERT INTO users (email, password_hash, role, tenant_id, created_at, updated_at)
VALUES (
  'test.buyer@example.com',
  '$2a$10$YourHashedPasswordHere',
  'PORTAL',
  1,
  NOW(),
  NOW()
);

-- Test contact (party) for buyer
INSERT INTO parties (display_name, primary_email, type, tenant_id, created_at, updated_at)
VALUES (
  'John Doe',
  'test.buyer@example.com',
  'INDIVIDUAL',
  1,
  NOW(),
  NOW()
);

-- Another test contact
INSERT INTO parties (display_name, primary_email, type, tenant_id, created_at, updated_at)
VALUES (
  'Jane Smith',
  'test.buyer2@example.com',
  'INDIVIDUAL',
  1,
  NOW(),
  NOW()
);
```

**Generate password hashes:**
```bash
node -e "console.log(require('bcryptjs').hashSync('TestPassword123!', 10))"
```

## 5. Configure Environment

```bash
# Copy environment template
cp tests/e2e/.env.example tests/e2e/.env

# Edit .env and update:
# - TEST_BREEDER_EMAIL
# - TEST_BREEDER_PASSWORD
# - TEST_PORTAL_EMAIL
# - TEST_PORTAL_PASSWORD
```

## 6. Start Services

**Terminal 1 - API Server:**
```bash
cd ../breederhq-api
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd breederhq
npm run dev
```

**Terminal 3 - MailHog (if not running):**
```bash
mailhog
```

## 7. Run Tests

```bash
# From breederhq directory

# Run all tests
npm run test:e2e

# Run in UI mode (recommended for first time)
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/e2e/contracts/contract-creation.spec.ts

# Run with headed browser (see what's happening)
npm run test:e2e:headed
```

## Verification Checklist

Before running tests, verify:

- [ ] PostgreSQL is running on port 5432
- [ ] Test database `breederhq_test` exists
- [ ] Contract templates are seeded
- [ ] Test users exist in database
- [ ] MailHog is running on port 8025
- [ ] API server is running on port 6170
- [ ] Frontend is running on port 5173
- [ ] .env file is configured with correct credentials

## Quick Test

Run just the first test to verify everything works:

```bash
npx playwright test tests/e2e/contracts/contract-creation.spec.ts -g "should complete 3-step"
```

If this passes, everything is set up correctly!

## Common Issues

### "Element not found"
- **Cause**: Frontend not running or wrong URL
- **Fix**: Check `BASE_URL` in .env matches your dev server

### "Cannot connect to database"
- **Cause**: Database not running or wrong credentials
- **Fix**: Check PostgreSQL is running and `TEST_DATABASE_URL` is correct

### "Email not received"
- **Cause**: MailHog not running or API not configured
- **Fix**: Check MailHog UI at http://localhost:8025 and verify API SMTP settings

### "User login failed"
- **Cause**: Test user doesn't exist or wrong password
- **Fix**: Verify test users exist in database and credentials match .env

### Tests timeout
- **Cause**: Services slow to respond
- **Fix**: Increase `TIMEOUT` in .env (default 60000ms)

## Next Steps

Once tests are running:

1. Read [README.md](./README.md) for detailed documentation
2. Review [IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md) for architecture
3. Check [testing-plan.md](../../docs/features/e-signatures/testing-plan.md) for test strategy
4. Explore test files in `tests/e2e/contracts/`

## Getting Help

- **Test failures**: Check screenshots in `test-results/`
- **Videos**: Videos saved on failure in `test-results/`
- **Traces**: Run with `--trace on` for detailed debugging
- **HTML report**: Run `npx playwright show-report` after tests

## Pro Tips

1. **Use UI mode** for development: `npm run test:e2e:ui`
2. **Debug specific test**: Add `.only` to test name
3. **Skip tests**: Add `.skip` to test name
4. **Update snapshots**: Set `UPDATE_SNAPSHOTS=true` in .env
5. **Parallel execution**: Increase `workers` in playwright.config.ts

---

**Estimated setup time**: 5-10 minutes (assuming services are already installed)
**First test run**: ~5 minutes for all 77 tests
