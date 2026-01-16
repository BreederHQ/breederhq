# Offspring Deletion E2E Tests - Setup & Troubleshooting

**Test File:** `e2e/offspring-deletion.spec.ts`
**Created:** January 15, 2026
**Status:** ⚠️ Requires Environment Setup

---

## 🚨 Current Test Failures

The tests are failing because they require:

1. ✅ **UI Application Running** - Need offspring app at `http://localhost:6170`
2. ✅ **API Server Running** - Need API at `http://localhost:6001`
3. ❌ **Authentication** - Tests need to log in first
4. ❌ **Correct Routes** - Need to navigate to actual offspring detail URLs

---

## 📋 Prerequisites

### 1. Start the Applications

```bash
# Terminal 1: Start API server
cd C:\Users\Aaron\Documents\Projects\breederhq-api
npm run dev

# Terminal 2: Start UI (offspring app or platform)
cd C:\Users\Aaron\Documents\Projects\breederhq
npm run dev
```

### 2. Seed Test Data

```bash
cd C:\Users\Aaron\Documents\Projects\breederhq-api

# Seed test users
npm run db:dev:seed:users

# Seed test data (animals, parties, etc.)
npx tsx scripts/seed-e2e-test-data.ts
```

### 3. Verify Services Are Running

```bash
# Check API
curl http://localhost:6001/api/v1/health

# Check UI
curl http://localhost:6170
```

---

## 🔧 Test Issues to Fix

### Issue 1: Authentication Required

**Problem:** Tests navigate to `/offspring` but likely hit a login wall.

**Solution:** Add authentication setup to `beforeEach`:

```typescript
test.beforeEach(async ({ page }) => {
  // Login first
  await page.goto("/login");
  await page.fill('input[name="email"]', "admin@bhq.local");
  await page.fill('input[name="password"]', "AdminReset987!");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard", { timeout: 10000 });

  // Now navigate to offspring
  await page.goto("/offspring");
  // ... rest of setup
});
```

### Issue 2: Incorrect Route

**Problem:** `/offspring` may not be the correct route in your app.

**Possible Routes:**
- `/platform/offspring`
- `/breeding/offspring`
- `/app/offspring`

**Solution:** Check your routing configuration to find the correct offspring route.

### Issue 3: API Calls Use Wrong Base URL

**Problem:** Tests call `/api/v1/...` but baseURL is set to the UI server (port 6170), not API server (port 6001).

**Solution:** Use full API URL in fetch calls:

```typescript
const API_BASE_URL = "http://localhost:6001/api/v1";

async function createTestOffspringGroup(page: Page, tenantId: number) {
  const response = await page.evaluate(async ({ tid, apiUrl }) => {
    const res = await fetch(`${apiUrl}/offspring`, {  // Use full URL
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: tid,
        name: `E2E Test Group ${Date.now()}`,
        species: "DOG",
        birthDateExpected: new Date().toISOString().split("T")[0],
      }),
    });
    return res.json();
  }, { tid: tenantId, apiUrl: API_BASE_URL });

  return response;
}
```

### Issue 4: CSRF Protection

**Problem:** API calls may be blocked by CSRF protection.

**Solution:** Get CSRF token after login and include in all requests:

```typescript
const csrfToken = await page.evaluate(() => {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta?.getAttribute("content") || "";
});

// Include in fetch calls
headers: {
  "Content-Type": "application/json",
  "X-CSRF-Token": csrfToken,
}
```

---

## 🔄 Recommended Test Approach

Based on existing test patterns in the codebase (see `breeding-offspring-business-rules.spec.ts`), I recommend **API-level testing** instead of UI testing:

### API-Level Tests (Recommended)

**Advantages:**
- ✅ Faster execution
- ✅ More reliable (no UI timing issues)
- ✅ Easier to clean up test data
- ✅ Can test business logic directly

**Example:**

```typescript
test("should archive offspring via API", async ({ request }) => {
  const apiContext = await playwrightRequest.newContext({
    baseURL: "http://localhost:6001/api/v1",
  });

  // Create test offspring
  const createRes = await apiContext.post("/offspring/individuals", {
    data: {
      tenantId: 4,
      groupId: testGroupId,
      name: "Test Offspring",
      species: "DOG",
    },
  });
  const offspring = await createRes.json();

  // Archive it
  const archiveRes = await apiContext.post(`/offspring/individuals/${offspring.id}/archive`, {
    data: { reason: "Test archive" },
  });
  expect(archiveRes.ok()).toBe(true);

  // Verify archived
  const getRes = await apiContext.get(`/offspring/individuals/${offspring.id}`);
  const updated = await getRes.json();
  expect(updated.archivedAt).toBeTruthy();

  // Cleanup
  await apiContext.delete(`/offspring/individuals/${offspring.id}`);
});
```

### UI-Level Tests (If Required)

If you need UI tests, create a separate suite that:
1. Handles authentication properly
2. Uses correct routes
3. Has longer timeouts for UI rendering
4. Focuses on user interactions (button clicks, modal flows)

---

## 🎯 Revised Test File

I can create a revised version that:

**Option A: API-Only Tests** (Recommended)
- Test archive/restore/delete endpoints directly
- Validate business rules at API level
- Much faster and more reliable

**Option B: Hybrid Tests**
- API setup/cleanup
- UI validation for critical flows only
- Best of both worlds

**Option C: Fix Existing UI Tests**
- Add proper authentication
- Fix routes and API calls
- Add longer timeouts
- More maintenance required

---

## 🚀 Quick Fix: Skip UI, Test APIs

```bash
# Create API-only test file
cat > e2e/offspring-deletion-api.spec.ts << 'EOF'
import { test, expect, request } from "@playwright/test";

const API_BASE = "http://localhost:6001/api/v1";
const TENANT_ID = 4;

test.describe("Offspring Archive & Delete API", () => {
  let apiContext;
  let testOffspringId;
  let testGroupId;

  test.beforeEach(async () => {
    apiContext = await request.newContext({ baseURL: API_BASE });

    // Create test group
    const groupRes = await apiContext.post("/offspring", {
      data: { tenantId: TENANT_ID, name: "Test Group", species: "DOG" },
    });
    const group = await groupRes.json();
    testGroupId = group.id;

    // Create test offspring
    const offspringRes = await apiContext.post("/offspring/individuals", {
      data: { tenantId: TENANT_ID, groupId: testGroupId, species: "DOG" },
    });
    const offspring = await offspringRes.json();
    testOffspringId = offspring.id;
  });

  test("should archive offspring", async () => {
    const res = await apiContext.post(`/offspring/individuals/${testOffspringId}/archive`, {
      data: { reason: "Test" },
    });
    expect(res.ok()).toBe(true);
  });

  // More tests...
});
EOF

# Run API tests
npx playwright test offspring-deletion-api.spec.ts
```

---

## 📝 Next Steps

1. **Choose Testing Approach** (API vs UI vs Hybrid)
2. **Update Test File** with proper auth and routes
3. **Start Required Services** (API + UI)
4. **Seed Test Data**
5. **Run Tests**

---

## 🐛 Debugging Tips

### View Screenshots

```bash
# Tests captured screenshots on failure
start test-results\offspring-deletion-*\test-failed-1.png
```

### View Trace

```bash
# View detailed trace of what happened
npx playwright show-trace test-results\offspring-deletion-*\trace.zip
```

### Run Single Test

```bash
npx playwright test offspring-deletion -g "should show Danger Zone"
```

### Run in Headed Mode

```bash
npx playwright test offspring-deletion --headed
```

### Debug Mode

```bash
npx playwright test offspring-deletion --debug
```

---

## ✅ When Tests Will Pass

Tests will pass when:

1. ✅ API server running at `localhost:6001`
2. ✅ UI app running at `localhost:6170`
3. ✅ Test data seeded (users, animals, parties)
4. ✅ Tests properly authenticate
5. ✅ Tests use correct routes
6. ✅ API calls go to correct base URL
7. ✅ CSRF protection handled (if enabled)

---

**Current Status:** Tests are written but require environment setup and minor fixes to authentication and routing.

**Recommendation:** Start with API-level tests for faster, more reliable validation of the deletion/archive functionality.

**Created:** January 15, 2026
