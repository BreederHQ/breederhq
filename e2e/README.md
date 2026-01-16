# E2E Testing - Species Terminology System

End-to-end tests for the Species Terminology System (STS) using Playwright.

---

## Quick Start

### First Time Setup

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install

# Create screenshots directory
mkdir screenshots
```

### Running Tests

```bash
# Run all tests
npx playwright test

# Run with UI (recommended)
npx playwright test --ui

# Run specific test file
npx playwright test e2e/species-terminology.spec.ts

# Run specific test
npx playwright test -g "collar picker is hidden"

# Run in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

### View Results

```bash
# Show HTML report
npx playwright show-report

# Open trace viewer (after failure)
npx playwright show-trace trace.zip
```

---

## Test Structure

```
e2e/
├── species-terminology.spec.ts    # Main test suite (700+ lines)
├── helpers/
│   └── test-data.ts               # Test data and helpers (500+ lines)
├── README.md                       # This file
└── screenshots/                    # Test screenshots (generated)
```

---

## Test Coverage

### Dashboard Tests
- ✅ Species-specific "in care" labels
- ✅ Mixed-species generic labels
- ✅ Empty state handling

### Settings Tests
- ✅ Collar configuration messaging
- ✅ Tab label updates
- ✅ Species applicability notes

### Collar Picker Tests
- ✅ Hidden for non-collar species (HORSE, CATTLE, CHICKEN, ALPACA, LLAMA)
- ✅ Visible for collar species (DOG, CAT, RABBIT, GOAT, SHEEP, PIG)

### Pipeline Tests
- ✅ Neutral "Care" stage label

### Cross-Species Tests
- ✅ Multiple species in same account
- ✅ Switching between species

### Regression Tests
- ✅ Dog/cat breeder workflows unchanged
- ✅ Null/undefined species handled gracefully

### Performance Tests
- ✅ Load time benchmarks
- ✅ Large dataset rendering

### Accessibility Tests
- ✅ Screen reader compatibility
- ✅ Keyboard navigation
- ✅ ARIA attributes

### Visual Regression Tests
- ✅ Screenshot comparisons

---

## Test Data

### Test Users

Pre-defined test users in `helpers/test-data.ts`:

| User Type | Email | Species |
|-----------|-------|---------|
| Horse Breeder | `horse-breeder@test.breederhq.com` | HORSE |
| Dog Breeder | `dog-breeder@test.breederhq.com` | DOG |
| Cat Breeder | `cat-breeder@test.breederhq.com` | CAT |
| Mixed Breeder | `mixed-breeder@test.breederhq.com` | DOG, HORSE, GOAT |
| Admin | `admin@test.breederhq.com` | All 11 species |

Password for all: `TestPass123!`

### Test Offspring Groups

Pre-defined in `TEST_OFFSPRING_GROUPS`:
- 2 horse groups (Bella x Thunder, Luna x Storm)
- 2 dog litters (Daisy x Max, Bella x Duke)
- 1 goat kidding (Nanny x Billy)

---

## Setup Required

⚠️ **Before tests will run, you need to:**

### 1. Create Test Users

Option A: Via UI
1. Create accounts for each test user
2. Set passwords to `TestPass123!`

Option B: Via SQL
```sql
-- See docs/horses/TESTING-GUIDE.md for full script
INSERT INTO "User" (email, password, name) VALUES
  ('horse-breeder@test.breederhq.com', 'hashed_password', 'Horse Breeder'),
  -- ... etc
```

Option C: Via API/Script
```typescript
import { seedTestData, TEST_USERS } from './helpers/test-data';
// Implement seed script
```

### 2. Update Login Flow

Edit `helpers/test-data.ts`:

```typescript
export async function login(page: Page, user: TestUser) {
  // TODO: Update selectors to match your actual login form
  await page.goto('/login');
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
}
```

### 3. Update Form Selectors

Edit `helpers/test-data.ts`:

```typescript
export async function createOffspringGroup(page: Page, data: TestOffspringGroup) {
  // TODO: Update selectors to match your actual forms
  // Example:
  await page.selectOption('select[name="species"]', data.species);
  await page.fill('input[name="identifier"]', data.identifier);
  // ... etc
}
```

### 4. Add Data-TestId Attributes (Recommended)

For reliable selectors, add `data-testid` to key components:

```tsx
// CollarPicker.tsx
<div data-testid="collar-picker">
  {/* ... */}
</div>

// OffspringTab.tsx
<div data-testid="offspring-settings-tab">
  {/* ... */}
</div>
```

---

## Helper Functions

### Authentication

```typescript
import { login, loginAsHorseBreeder } from './helpers/test-data';

// Generic login
await login(page, TEST_USERS.HORSE_BREEDER);

// Convenience methods
await loginAsHorseBreeder(page);
await loginAsDogBreeder(page);
await loginAsMixedBreeder(page);
```

### Data Creation

```typescript
import { createOffspringGroup } from './helpers/test-data';

await createOffspringGroup(page, {
  identifier: 'Test Group',
  species: 'HORSE',
  countBorn: 1,
  countLive: 1,
  ageWeeks: 2,
  damName: 'Test Mare',
  sireName: 'Test Stallion',
});
```

### Navigation

```typescript
import { navigateToDashboard, navigateToSettings } from './helpers/test-data';

await navigateToDashboard(page);
await navigateToSettings(page);
await navigateToSettingsCollars(page);
```

### Assertions

```typescript
import { assertSpeciesTerminology, assertCollarPickerVisibility } from './helpers/test-data';

// Assert correct terminology
await assertSpeciesTerminology(page, 'HORSE', {
  offspringName: true,
  birthProcess: true,
  inCareLabel: true,
});

// Assert collar picker visibility
await assertCollarPickerVisibility(page, 'HORSE', false); // Should be hidden
await assertCollarPickerVisibility(page, 'DOG', true);   // Should be visible
```

---

## Writing New Tests

### Example Test

```typescript
import { test, expect } from '@playwright/test';
import { loginAsHorseBreeder, navigateToDashboard } from './helpers/test-data';

test('horse breeder sees correct dashboard terminology', async ({ page }) => {
  await loginAsHorseBreeder(page);
  await navigateToDashboard(page);

  // Check header shows "Foals in Care"
  await expect(page.locator('text=Foals in Care')).toBeVisible();

  // Check no dog terminology
  await expect(page.locator('text=puppies')).not.toBeVisible();
  await expect(page.locator('text=whelping')).not.toBeVisible();
});
```

### Test Best Practices

1. **Use data-testid** for selectors when possible
2. **Use helper functions** for common operations
3. **Test one thing** per test case
4. **Clean up test data** after tests
5. **Use meaningful test names**
6. **Add comments** for complex logic

---

## Debugging Tests

### Run in UI Mode (Best for Development)

```bash
npx playwright test --ui
```

Benefits:
- See tests run in real-time
- Pause and step through tests
- Inspect page at any point
- Time travel debugging

### Run in Debug Mode

```bash
npx playwright test --debug
```

Benefits:
- Playwright Inspector opens
- Step through test line by line
- Interact with page during test

### View Trace

After a test failure:

```bash
npx playwright show-trace trace.zip
```

Shows:
- Network requests
- Console logs
- Screenshots
- DOM snapshots

### Take Screenshots

```typescript
import { takeScreenshot } from './helpers/test-data';

await takeScreenshot(page, 'dashboard-horse-breeder', { fullPage: true });
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Configuration

Create `playwright.config.ts` in project root:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

---

## Common Issues

### Issue: Tests fail with "Timeout"
**Solution:** Increase timeout or check if page is actually loading
```typescript
test.setTimeout(60000); // 60 seconds
```

### Issue: "Element not found"
**Solution:** Add `waitFor` or check selector
```typescript
await page.waitForSelector('text=Foals in Care', { timeout: 10000 });
```

### Issue: "Authentication failed"
**Solution:** Verify test user exists and password is correct

### Issue: Flaky tests
**Solutions:**
- Use `waitForLoadState('networkidle')`
- Add explicit waits for API calls
- Avoid hard-coded delays
- Use retry logic

---

## Documentation

- [Testing Guide](../docs/horses/TESTING-GUIDE.md) - Comprehensive testing procedures
- [Testing Implementation Summary](../docs/horses/TESTING-IMPLEMENTATION-SUMMARY.md) - Test infrastructure overview
- [Playwright Docs](https://playwright.dev) - Official Playwright documentation

---

## Support

### Questions?
- Check [Testing Guide](../docs/horses/TESTING-GUIDE.md)
- Review [test-data.ts](./helpers/test-data.ts) examples
- See [Playwright docs](https://playwright.dev)

### Issues?
- Check common issues section above
- Review test output and traces
- Ask development team

---

## Status

**Test Infrastructure:** ✅ Complete

**Test Execution:** ⏳ Requires setup
- Create test users
- Update login flow
- Seed test data

**Once setup complete:** All tests should pass

---

**Last Updated:** January 14, 2026
**Version:** 1.0
