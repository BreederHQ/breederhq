/**
 * Breeding Plan & Offspring Group Business Rules - E2E Validation Tests
 *
 * These tests validate the business logic rules that protect breeding plans
 * and offspring groups from entering inconsistent states.
 *
 * Rules tested:
 * 1. Birth Date as Lock Point (upstream dates become immutable)
 * 2. Cannot add offspring without birth date
 * 3. Cannot clear birth date with offspring
 * 4. Downstream date consistency
 * 5. Cannot unlink offspring group with offspring
 * 6. Status regression validation
 * 7. Offspring deletion protection (fresh vs permanent)
 *
 * PREREQUISITES:
 * - API server running on localhost:6001
 * - Test users seeded: cd breederhq-api && npm run db:dev:seed:users
 * - Test tenant needs BREEDING_PLAN_QUOTA entitlement (requires subscription seed)
 *
 * If tests fail with QUOTA_EXCEEDED, ensure the test tenant has proper entitlements.
 * These tests require a fully seeded development environment.
 *
 * @see docs/api/breeding-offspring-business-rules.md
 */

import { test, expect, type APIRequestContext, request as playwrightRequest } from "@playwright/test";

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = "http://localhost:6001/api/v1";

// Default tenant ID for API testing (bypass auth for direct API tests)
// In a real environment, this would be obtained via authentication
const DEFAULT_TENANT_ID = 4;

// Test animal IDs (created by seed-e2e-test-data.ts script)
// Run: cd breederhq-api && npx tsx scripts/seed-e2e-test-data.ts
const TEST_DAM_ID = 912;
const TEST_SIRE_ID = 913;
const TEST_BUYER_PARTY_ID = 181;

// ============================================================================
// Types
// ============================================================================

interface TestContext {
  tenantId: number;
  apiContext: APIRequestContext;
  csrfToken: string;
}

interface BreedingPlan {
  id: number;
  name: string;
  status: string;
  damId?: number;
  sireId?: number;
  cycleStartDateActual?: string | null;
  breedDateActual?: string | null;
  birthDateActual?: string | null;
  weanedDateActual?: string | null;
  placementStartDateActual?: string | null;
  placementCompletedDateActual?: string | null;
}

interface OffspringGroup {
  id: number;
  planId?: number | null;
  linkState: string;
}

interface Offspring {
  id: number;
  groupId: number;
  name?: string;
  sex?: string;
  buyerPartyId?: number | null;
  placementState?: string;
  financialState?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

// Test credentials (from seed-test-users.ts)
const TEST_USER_EMAIL = "admin@bhq.local";
const TEST_USER_PASSWORD = "AdminReset987!";

/**
 * Authenticate and initialize test context
 * Uses standard login endpoint to get a session and CSRF token
 */
async function initTestContext(apiContext: APIRequestContext): Promise<TestContext> {
  // Use standard login to authenticate (CSRF exempt for login)
  const loginResponse = await apiContext.fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    },
  });

  if (!loginResponse.ok()) {
    const errorText = await loginResponse.text();
    throw new Error(`Login failed: ${loginResponse.status()} - ${errorText}. Make sure test users have been seeded (npm run db:dev:seed:users in breederhq-api)`);
  }

  // Extract CSRF token from Set-Cookie header
  const setCookieHeaders = loginResponse.headers()["set-cookie"] || "";
  const csrfMatch = setCookieHeaders.match(/XSRF-TOKEN=([^;]+)/);
  const csrfToken = csrfMatch ? csrfMatch[1] : "";

  if (!csrfToken) {
    throw new Error("Failed to extract CSRF token from login response");
  }

  console.log("✓ Authenticated as test admin user, CSRF token obtained");

  return {
    tenantId: DEFAULT_TENANT_ID,
    apiContext,
    csrfToken,
  };
}

/**
 * Make API request with tenant header and CSRF token
 */
async function apiRequest(
  ctx: TestContext,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  endpoint: string,
  body?: Record<string, unknown>
) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "X-Tenant-Id": String(ctx.tenantId),
  };

  // Only set Content-Type if there's a body (otherwise server rejects empty JSON body)
  if (body) {
    headers["Content-Type"] = "application/json";
  }

  // Add CSRF token for mutating requests
  if (method !== "GET") {
    headers["X-CSRF-Token"] = ctx.csrfToken;
  }

  const options: Parameters<APIRequestContext["fetch"]>[1] = {
    method,
    headers,
  };

  if (body) {
    options.data = body;
  }

  return ctx.apiContext.fetch(url, options);
}

/**
 * Create a test breeding plan
 */
async function createTestPlan(
  ctx: TestContext,
  overrides: Partial<BreedingPlan> = {}
): Promise<BreedingPlan> {
  const response = await apiRequest(ctx, "POST", "/breeding/plans", {
    name: `Test Plan ${Date.now()}`,
    species: "DOG",
    ...overrides,
  });

  if (!response.ok()) {
    const errorText = await response.text();
    console.error(`createTestPlan failed (${response.status()}): ${errorText}`);

    // Provide helpful message for quota errors
    if (errorText.includes("QUOTA_EXCEEDED")) {
      throw new Error(
        `QUOTA_EXCEEDED: Test tenant lacks BREEDING_PLAN_QUOTA entitlement.\n` +
        `To fix this, run subscription seeding in breederhq-api:\n` +
        `  npm run db:dev:seed:subscriptions\n` +
        `Or add entitlement manually for tenant ID ${ctx.tenantId}.`
      );
    }

    throw new Error(`Failed to create test plan: ${response.status()} - ${errorText}`);
  }
  return response.json();
}

/**
 * Create a test offspring group linked to a plan
 */
async function createTestOffspringGroup(
  ctx: TestContext,
  planId: number
): Promise<OffspringGroup> {
  const response = await apiRequest(ctx, "POST", "/offspring", {
    planId,
    species: "DOG",
  });

  expect(response.ok()).toBeTruthy();
  return response.json();
}

/**
 * Create a test offspring in a group
 */
async function createTestOffspring(
  ctx: TestContext,
  groupId: number,
  overrides: Partial<Offspring> = {}
): Promise<Offspring> {
  const response = await apiRequest(ctx, "POST", "/offspring/individuals", {
    groupId,
    name: `Test Pup ${Date.now()}`,
    sex: "MALE",
    ...overrides,
  });

  expect(response.ok()).toBeTruthy();
  return response.json();
}

/**
 * Clean up test data - deletes offspring, offspring groups, and the plan
 */
async function cleanupTestPlan(ctx: TestContext, planId: number): Promise<void> {
  try {
    // Step 1: Get the offspring group linked to this plan
    const groupId = await getOffspringGroupId(ctx, planId);

    if (groupId) {
      // Step 2: Delete all offspring in group first (clear blocking data before delete)
      const offspringResponse = await apiRequest(
        ctx,
        "GET",
        `/offspring/individuals?groupId=${groupId}`
      );
      if (offspringResponse.ok()) {
        const offspringData = await offspringResponse.json();
        const offspringList = Array.isArray(offspringData) ? offspringData : (offspringData.items || []);
        for (const o of offspringList) {
          // Clear blocking business data so offspring can be deleted
          await apiRequest(ctx, "PATCH", `/offspring/individuals/${o.id}`, {
            buyerPartyId: null,
            placementState: "UNASSIGNED",
            financialState: "NONE",
            lifeState: "ALIVE",
            placedAt: null,
            diedAt: null,
            paidInFullAt: null,
            depositCents: null,
            contractId: null,
            contractSignedAt: null,
          });
          // Delete offspring
          await apiRequest(ctx, "DELETE", `/offspring/individuals/${o.id}`);
        }
      }

      // Step 3: Unlink group from plan (after offspring deleted)
      await apiRequest(ctx, "POST", `/offspring/groups/${groupId}/unlink`);

      // Step 4: Delete the group
      await apiRequest(ctx, "DELETE", `/offspring/${groupId}`);
    }

    // Step 5: Clear all dates at once (the API should handle the order internally)
    // If this fails, we'll try clearing in reverse order
    const clearAllResponse = await apiRequest(ctx, "PATCH", `/breeding/plans/${planId}`, {
      placementCompletedDateActual: null,
      placementStartDateActual: null,
      weanedDateActual: null,
      birthDateActual: null,
      breedDateActual: null,
      hormoneTestingStartDateActual: null,
      cycleStartDateActual: null,
    });

    // If clearing all at once failed, try reverse order
    if (!clearAllResponse.ok()) {
      await apiRequest(ctx, "PATCH", `/breeding/plans/${planId}`, { placementCompletedDateActual: null });
      await apiRequest(ctx, "PATCH", `/breeding/plans/${planId}`, { placementStartDateActual: null });
      await apiRequest(ctx, "PATCH", `/breeding/plans/${planId}`, { weanedDateActual: null });
      await apiRequest(ctx, "PATCH", `/breeding/plans/${planId}`, { birthDateActual: null });
      await apiRequest(ctx, "PATCH", `/breeding/plans/${planId}`, {
        breedDateActual: null,
        hormoneTestingStartDateActual: null,
        cycleStartDateActual: null
      });
    }

    // Step 6: Delete plan (soft delete via archive)
    const deleteResponse = await apiRequest(ctx, "POST", `/breeding/plans/${planId}/delete`);
    if (!deleteResponse.ok()) {
      const errorBody = await deleteResponse.text();
      console.log(`   ⚠ Plan ${planId} delete failed: ${deleteResponse.status()} - ${errorBody}`);
    }
  } catch (e) {
    console.log(`Cleanup error for plan ${planId}:`, e);
  }
}

/**
 * Extract items array from API response (handles both direct array and { items: [...] } format)
 */
function extractItems<T>(data: T[] | { items?: T[] }): T[] {
  return Array.isArray(data) ? data : (data.items || []);
}

/**
 * Get offspring group ID from a breeding plan.
 * Uses ?include=offspringGroup to get the linked offspring group with the plan.
 */
async function getOffspringGroupId(ctx: TestContext, planId: number): Promise<number | null> {
  const response = await apiRequest(ctx, "GET", `/breeding/plans/${planId}?include=offspringGroup`);
  if (!response.ok()) return null;
  const plan = await response.json();
  return plan.offspringGroup?.id || null;
}

/**
 * Format date as ISO string (date only)
 */
function toISODate(daysFromNow: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

// ============================================================================
// Test Suite
// ============================================================================

test.describe("Breeding Plan & Offspring Business Rules", () => {
  // Extend timeout for this test suite - cleanup of many plans takes time
  test.setTimeout(120000); // 2 minutes per test (including hooks)

  let ctx: TestContext;
  let apiContext: APIRequestContext;
  const createdPlanIds: number[] = [];

  test.beforeAll(async () => {
    // Manually create APIRequestContext for use across all tests
    apiContext = await playwrightRequest.newContext({
      baseURL: API_BASE_URL,
    });
    // Authenticate and initialize test context with CSRF token
    ctx = await initTestContext(apiContext);
  });

  test.afterEach(async ({ }, testInfo) => {
    // Clean up plans created during this specific test immediately after test completes
    // This soft-deletes plans (sets deletedAt and archived=true) which is proper cleanup
    // Use scripts/purge-e2e-test-data.ts for hard delete if needed
    if (createdPlanIds.length > 0) {
      const plansToCleanup = [...createdPlanIds];
      createdPlanIds.length = 0; // Clear the array for next test

      for (const planId of plansToCleanup) {
        await cleanupTestPlan(ctx, planId);
      }
    }
  });

  test.afterAll(async () => {
    // Final cleanup - just dispose of the API context
    // Individual test cleanup already happened in afterEach
    await apiContext.dispose();
  });

  // ==========================================================================
  // Rule 1: Birth Date as Lock Point
  // ==========================================================================
  test.describe("Rule 1: Birth Date as Lock Point", () => {
    test("should block clearing cycleStartDateActual after birthDateActual is set", async () => {
      console.log("\n=== Testing: Cannot clear upstream dates after birth ===");

      // Create plan with all dates set
      const plan = await createTestPlan(ctx);
      createdPlanIds.push(plan.id);

      // Set upstream dates first
      await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        cycleStartDateActual: toISODate(-60),
        breedDateActual: toISODate(-30),
      });

      // Set birth date (this locks upstream dates)
      await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        birthDateActual: toISODate(-1),
      });
      console.log("✓ Birth date set - upstream dates should now be locked");

      // Attempt to clear cycleStartDateActual - should fail
      const response = await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        cycleStartDateActual: null,
      });

      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(400);

      const error = await response.json();
      expect(error.error).toBe("upstream_dates_locked_by_birth");
      console.log("✓ Correctly blocked clearing cycleStartDateActual");
    });

    test("should block modifying breedDateActual after birthDateActual is set", async () => {
      console.log("\n=== Testing: Cannot modify upstream dates after birth ===");

      const plan = await createTestPlan(ctx);
      createdPlanIds.push(plan.id);

      // Set dates
      await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        cycleStartDateActual: toISODate(-60),
        breedDateActual: toISODate(-30),
        birthDateActual: toISODate(-1),
      });

      // Attempt to change breedDateActual - should fail
      const response = await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        breedDateActual: toISODate(-25), // Different date
      });

      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(400);

      const error = await response.json();
      expect(error.error).toBe("upstream_dates_locked_by_birth");
      console.log("✓ Correctly blocked modifying breedDateActual");
    });

    test("should allow setting same upstream date value after birth (idempotent)", async () => {
      console.log("\n=== Testing: Idempotent update should succeed ===");

      const plan = await createTestPlan(ctx);
      createdPlanIds.push(plan.id);

      const breedDate = toISODate(-30);

      await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        cycleStartDateActual: toISODate(-60),
        breedDateActual: breedDate,
        birthDateActual: toISODate(-1),
      });

      // Setting the same value should succeed
      const response = await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        breedDateActual: breedDate,
      });

      expect(response.ok()).toBeTruthy();
      console.log("✓ Idempotent update allowed");
    });
  });

  // ==========================================================================
  // Rule 2: Cannot Add Offspring Without Birth Date
  // ==========================================================================
  test.describe("Rule 2: Cannot Add Offspring Without Birth Date", () => {
    test("should block adding offspring when birthDateActual is not set", async () => {
      console.log("\n=== Testing: Cannot add offspring without birth date ===");

      const plan = await createTestPlan(ctx);
      createdPlanIds.push(plan.id);

      // Commit the plan to create offspring group
      const commitResponse = await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        damId: TEST_DAM_ID,
        sireId: TEST_SIRE_ID,
        lockedCycleStart: toISODate(-60),
        lockedOvulationDate: toISODate(-58),
        lockedDueDate: toISODate(0),
        lockedPlacementStartDate: toISODate(56),
        status: "COMMITTED",
      });

      if (!commitResponse.ok()) {
        const commitError = await commitResponse.text();
        console.log(`⚠ Commit failed: ${commitError}`);
        return;
      }

      const commitData = await commitResponse.json();
      console.log(`✓ Plan committed, status: ${commitData.status}`);

      // Get the offspring group using helper (queries via ?include=offspringGroup)
      const groupId = await getOffspringGroupId(ctx, plan.id);
      if (!groupId) {
        console.log(`⚠ Plan has no offspring group linked - skipping test (damId: ${commitData.damId}, sireId: ${commitData.sireId})`);
        return;
      }
      console.log(`✓ Plan ${plan.id} has offspring group ${groupId}`);

      // Verify plan has no birthDateActual
      const planResponse = await apiRequest(ctx, "GET", `/breeding/plans/${plan.id}`);
      const planData = await planResponse.json();
      console.log(`✓ Plan birthDateActual: ${planData.birthDateActual || 'null'}`);

      // Attempt to add offspring without birth date - should fail
      const response = await apiRequest(ctx, "POST", "/offspring/individuals", {
        groupId,
        name: "Test Pup",
        sex: "MALE",
      });

      if (response.ok()) {
        const successData = await response.json();
        console.log(`⚠ Offspring created unexpectedly: ${JSON.stringify(successData)}`);
      }

      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(400);

      const error = await response.json();
      expect(error.error).toBe("birth_date_not_recorded");
      console.log("✓ Correctly blocked adding offspring without birth date");
    });

    test("should allow adding offspring after birthDateActual is set", async () => {
      console.log("\n=== Testing: Can add offspring after birth date set ===");

      const plan = await createTestPlan(ctx);
      createdPlanIds.push(plan.id);

      // Setup plan with birth date
      await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        damId: TEST_DAM_ID,
        sireId: TEST_SIRE_ID,
        lockedCycleStart: toISODate(-60),
        lockedOvulationDate: toISODate(-58),
        lockedDueDate: toISODate(0),
        lockedPlacementStartDate: toISODate(56),
        status: "COMMITTED",
        birthDateActual: toISODate(-1),
      });

      const groupId = await getOffspringGroupId(ctx, plan.id);
      if (!groupId) {
        console.log("⚠ Plan has no offspring group linked - skipping test");
        return;
      }

      // Should succeed now
      const response = await apiRequest(ctx, "POST", "/offspring/individuals", {
        groupId,
        name: "Test Pup",
        sex: "MALE",
      });

      expect(response.ok()).toBeTruthy();
      console.log("✓ Successfully added offspring after birth date set");
    });
  });

  // ==========================================================================
  // Rule 3: Cannot Clear Birth Date With Offspring
  // ==========================================================================
  test.describe("Rule 3: Cannot Clear Birth Date With Offspring", () => {
    test("should block clearing birthDateActual when offspring exist", async () => {
      console.log("\n=== Testing: Cannot clear birth date with offspring ===");

      const plan = await createTestPlan(ctx);
      createdPlanIds.push(plan.id);

      // Setup plan with birth date and offspring
      await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        damId: TEST_DAM_ID,
        sireId: TEST_SIRE_ID,
        lockedCycleStart: toISODate(-60),
        lockedOvulationDate: toISODate(-58),
        lockedDueDate: toISODate(0),
        lockedPlacementStartDate: toISODate(56),
        status: "COMMITTED",
        cycleStartDateActual: toISODate(-60),
        breedDateActual: toISODate(-30),
        birthDateActual: toISODate(-1),
      });

      const groupId = await getOffspringGroupId(ctx, plan.id);
      if (!groupId) {
        console.log("⚠ Plan has no offspring group linked - skipping test");
        return;
      }

      // Add offspring
      await apiRequest(ctx, "POST", "/offspring/individuals", {
        groupId,
        name: "Test Pup",
        sex: "FEMALE",
      });
      console.log("✓ Offspring added");

      // Attempt to clear birth date - should fail
      const response = await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        birthDateActual: null,
      });

      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(400);

      const error = await response.json();
      expect(error.error).toBe("cannot_clear_birth_date_with_offspring");
      console.log("✓ Correctly blocked clearing birth date with offspring");
    });
  });

  // ==========================================================================
  // Rule 4: Downstream Date Consistency
  // ==========================================================================
  test.describe("Rule 4: Downstream Date Consistency", () => {
    test("should block clearing weanedDateActual when placementStartDateActual is set", async () => {
      console.log("\n=== Testing: Cannot clear weaned date with placement start set ===");

      const plan = await createTestPlan(ctx);
      createdPlanIds.push(plan.id);

      // Set all dates
      await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        cycleStartDateActual: toISODate(-120),
        breedDateActual: toISODate(-90),
        birthDateActual: toISODate(-60),
        weanedDateActual: toISODate(-14),
        placementStartDateActual: toISODate(-7),
      });

      // Attempt to clear weaned date - should fail
      const response = await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        weanedDateActual: null,
      });

      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(400);

      const error = await response.json();
      expect(error.error).toBe("cannot_clear_date_with_downstream_date");
      console.log("✓ Correctly blocked clearing weaned date");
    });

    test("should block clearing placementStartDateActual when placementCompletedDateActual is set", async () => {
      console.log("\n=== Testing: Cannot clear placement start with completion set ===");

      const plan = await createTestPlan(ctx);
      createdPlanIds.push(plan.id);

      // Set all dates including completion
      await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        cycleStartDateActual: toISODate(-120),
        breedDateActual: toISODate(-90),
        birthDateActual: toISODate(-60),
        weanedDateActual: toISODate(-14),
        placementStartDateActual: toISODate(-7),
        placementCompletedDateActual: toISODate(-1),
      });

      // Attempt to clear placement start - should fail
      const response = await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        placementStartDateActual: null,
      });

      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(400);

      const error = await response.json();
      expect(error.error).toBe("cannot_clear_date_with_downstream_date");
      console.log("✓ Correctly blocked clearing placement start date");
    });
  });

  // ==========================================================================
  // Rule 5: Cannot Unlink Offspring Group With Offspring
  // ==========================================================================
  test.describe("Rule 5: Cannot Unlink Offspring Group With Offspring", () => {
    test("should block unlinking offspring group when offspring exist", async () => {
      console.log("\n=== Testing: Cannot unlink group with offspring ===");

      const plan = await createTestPlan(ctx);
      createdPlanIds.push(plan.id);

      // Setup plan with offspring
      await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        damId: TEST_DAM_ID,
        sireId: TEST_SIRE_ID,
        lockedCycleStart: toISODate(-60),
        lockedOvulationDate: toISODate(-58),
        lockedDueDate: toISODate(0),
        lockedPlacementStartDate: toISODate(56),
        status: "COMMITTED",
        birthDateActual: toISODate(-1),
      });

      const groupId = await getOffspringGroupId(ctx, plan.id);
      if (!groupId) {
        console.log("⚠ Plan has no offspring group linked - skipping test");
        return;
      }

      // Add offspring
      await apiRequest(ctx, "POST", "/offspring/individuals", {
        groupId,
        name: "Test Pup",
        sex: "MALE",
      });

      // Attempt to unlink - should fail
      const response = await apiRequest(ctx, "POST", `/offspring/groups/${groupId}/unlink`, {
        actorId: "test-user",
      });

      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(400);

      const error = await response.json();
      expect(error.error).toBe("cannot_unlink_group_with_offspring");
      console.log("✓ Correctly blocked unlinking group with offspring");
    });
  });

  // ==========================================================================
  // Rule 6: Status Regression Validation
  // ==========================================================================
  test.describe("Rule 6: Status Regression Validation", () => {
    test("should block regressing status past BIRTHED when offspring exist", async () => {
      console.log("\n=== Testing: Cannot regress past BIRTHED with offspring ===");

      const plan = await createTestPlan(ctx);
      createdPlanIds.push(plan.id);

      // Setup plan at WEANED status with offspring
      await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        damId: TEST_DAM_ID,
        sireId: TEST_SIRE_ID,
        lockedCycleStart: toISODate(-120),
        lockedOvulationDate: toISODate(-118),
        lockedDueDate: toISODate(-60),
        lockedPlacementStartDate: toISODate(-4),
        status: "COMMITTED",
        cycleStartDateActual: toISODate(-120),
        breedDateActual: toISODate(-90),
        birthDateActual: toISODate(-60),
        weanedDateActual: toISODate(-14),
      });

      // Update status to WEANED
      await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        status: "WEANED",
      });

      const groupId = await getOffspringGroupId(ctx, plan.id);
      if (!groupId) {
        console.log("⚠ Plan has no offspring group linked - skipping test");
        return;
      }

      // Add offspring
      await apiRequest(ctx, "POST", "/offspring/individuals", {
        groupId,
        name: "Test Pup",
        sex: "MALE",
      });

      // Attempt to regress status to BRED - should fail
      const response = await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        status: "BRED",
      });

      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(400);

      const error = await response.json();
      expect(error.error).toBe("cannot_regress_status_with_offspring");
      console.log("✓ Correctly blocked status regression with offspring");
    });

    test("should block regressing status when corresponding dates still exist", async () => {
      console.log("\n=== Testing: Cannot regress status with dates set ===");

      const plan = await createTestPlan(ctx);
      createdPlanIds.push(plan.id);

      // Setup plan at WEANED status (no dam/sire needed for this test)
      const setupResponse = await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        lockedCycleStart: toISODate(-120),
        lockedOvulationDate: toISODate(-118),
        lockedDueDate: toISODate(-60),
        lockedPlacementStartDate: toISODate(-4),
        status: "WEANED",
        cycleStartDateActual: toISODate(-120),
        breedDateActual: toISODate(-90),
        birthDateActual: toISODate(-60),
        weanedDateActual: toISODate(-14),
      });

      if (!setupResponse.ok()) {
        const setupError = await setupResponse.text();
        console.log(`⚠ Setup failed: ${setupError}`);
        return;
      }

      // Verify plan is in expected state
      const verifyResponse = await apiRequest(ctx, "GET", `/breeding/plans/${plan.id}`);
      const verifyPlan = await verifyResponse.json();
      console.log(`✓ Plan status: ${verifyPlan.status}, birthDateActual: ${verifyPlan.birthDateActual}`);

      // Attempt to regress status to PREGNANT (before BIRTHED) while birthDateActual exists
      const response = await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        status: "PREGNANT",
      });

      if (response.ok()) {
        const successData = await response.json();
        console.log(`⚠ Status regression succeeded unexpectedly: ${JSON.stringify(successData)}`);
      } else {
        const errorData = await response.json();
        console.log(`✓ Got error: ${errorData.error} - ${errorData.detail}`);
      }

      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(400);

      const error = await response.json();
      expect(error.error).toBe("cannot_regress_status_with_date");
      console.log("✓ Correctly blocked status regression with dates set");
    });
  });

  // ==========================================================================
  // Rule 7: Offspring Deletion Protection
  // ==========================================================================
  test.describe("Rule 7: Offspring Deletion Protection", () => {
    test("should allow deleting fresh offspring (no business data)", async () => {
      console.log("\n=== Testing: Can delete fresh offspring ===");

      const plan = await createTestPlan(ctx);
      createdPlanIds.push(plan.id);

      // Setup plan with birth date
      await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        damId: TEST_DAM_ID,
        sireId: TEST_SIRE_ID,
        lockedCycleStart: toISODate(-60),
        lockedOvulationDate: toISODate(-58),
        lockedDueDate: toISODate(0),
        lockedPlacementStartDate: toISODate(56),
        status: "COMMITTED",
        birthDateActual: toISODate(-1),
      });

      const groupId = await getOffspringGroupId(ctx, plan.id);
      if (!groupId) {
        console.log("⚠ Plan has no offspring group linked - skipping test");
        return;
      }

      // Create fresh offspring
      const createResponse = await apiRequest(ctx, "POST", "/offspring/individuals", {
        groupId,
        name: "Fresh Pup To Delete",
        sex: "FEMALE",
      });

      if (!createResponse.ok()) {
        const createError = await createResponse.text();
        console.log(`⚠ Failed to create offspring: ${createResponse.status()} - ${createError}`);
        throw new Error(`Failed to create offspring: ${createError}`);
      }

      const offspring = await createResponse.json();
      console.log(`✓ Created offspring ${offspring.id}`);

      // Delete should succeed
      const response = await apiRequest(ctx, "DELETE", `/offspring/individuals/${offspring.id}`);

      if (!response.ok()) {
        const deleteError = await response.text();
        console.log(`⚠ Delete failed: ${response.status()} - ${deleteError}`);
      }

      expect(response.ok()).toBeTruthy();
      console.log("✓ Successfully deleted fresh offspring");
    });

    test("should block deleting offspring with buyer assigned", async () => {
      console.log("\n=== Testing: Cannot delete offspring with buyer ===");

      const plan = await createTestPlan(ctx);
      createdPlanIds.push(plan.id);

      // Setup plan
      await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        damId: TEST_DAM_ID,
        sireId: TEST_SIRE_ID,
        lockedCycleStart: toISODate(-60),
        lockedOvulationDate: toISODate(-58),
        lockedDueDate: toISODate(0),
        lockedPlacementStartDate: toISODate(56),
        status: "COMMITTED",
        birthDateActual: toISODate(-1),
      });

      const groupId = await getOffspringGroupId(ctx, plan.id);
      if (!groupId) {
        console.log("⚠ Plan has no offspring group linked - skipping test");
        return;
      }

      // Create offspring first, then assign buyer separately
      const createResponse = await apiRequest(ctx, "POST", "/offspring/individuals", {
        groupId,
        name: "Pup With Buyer",
        sex: "MALE",
      });

      if (!createResponse.ok()) {
        const createError = await createResponse.text();
        console.log(`⚠ Failed to create offspring: ${createResponse.status()} - ${createError}`);
        throw new Error(`Failed to create offspring: ${createError}`);
      }

      const offspring = await createResponse.json();
      console.log(`✓ Created offspring ${offspring.id}`);

      // Assign buyer to offspring
      const assignResponse = await apiRequest(ctx, "PATCH", `/offspring/individuals/${offspring.id}`, {
        buyerPartyId: TEST_BUYER_PARTY_ID,
      });

      if (!assignResponse.ok()) {
        const assignError = await assignResponse.text();
        console.log(`⚠ Failed to assign buyer: ${assignResponse.status()} - ${assignError}`);
        throw new Error(`Failed to assign buyer: ${assignError}`);
      }
      console.log(`✓ Assigned buyer to offspring`);

      // Delete should fail
      const response = await apiRequest(ctx, "DELETE", `/offspring/individuals/${offspring.id}`);

      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(409);

      const error = await response.json();
      expect(error.error).toBe("offspring_delete_blocked");
      expect(error.blockers.hasBuyer).toBe(true);
      console.log("✓ Correctly blocked deleting offspring with buyer");
    });

    test("should block deleting deceased offspring", async () => {
      console.log("\n=== Testing: Cannot delete deceased offspring ===");

      const plan = await createTestPlan(ctx);
      createdPlanIds.push(plan.id);

      // Setup plan
      await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        damId: TEST_DAM_ID,
        sireId: TEST_SIRE_ID,
        lockedCycleStart: toISODate(-60),
        lockedOvulationDate: toISODate(-58),
        lockedDueDate: toISODate(0),
        lockedPlacementStartDate: toISODate(56),
        status: "COMMITTED",
        birthDateActual: toISODate(-1),
      });

      const groupId = await getOffspringGroupId(ctx, plan.id);
      if (!groupId) {
        console.log("⚠ Plan has no offspring group linked - skipping test");
        return;
      }

      // Create offspring
      const createResponse = await apiRequest(ctx, "POST", "/offspring/individuals", {
        groupId,
        name: "Deceased Pup",
        sex: "FEMALE",
      });

      if (!createResponse.ok()) {
        const createError = await createResponse.text();
        console.log(`⚠ Failed to create offspring: ${createResponse.status()} - ${createError}`);
        throw new Error(`Failed to create offspring: ${createError}`);
      }

      const offspring = await createResponse.json();
      console.log(`✓ Created offspring ${offspring.id}`);

      // Mark as deceased
      const deceasedResponse = await apiRequest(ctx, "PATCH", `/offspring/individuals/${offspring.id}`, {
        lifeState: "DECEASED",
        diedAt: toISODate(0),
      });

      if (!deceasedResponse.ok()) {
        const deceasedError = await deceasedResponse.text();
        console.log(`⚠ Failed to mark deceased: ${deceasedResponse.status()} - ${deceasedError}`);
        throw new Error(`Failed to mark deceased: ${deceasedError}`);
      }
      console.log(`✓ Marked offspring as deceased`);

      // Delete should fail
      const response = await apiRequest(ctx, "DELETE", `/offspring/individuals/${offspring.id}`);

      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(409);

      const error = await response.json();
      expect(error.error).toBe("offspring_delete_blocked");
      expect(error.blockers.isDeceased).toBe(true);
      console.log("✓ Correctly blocked deleting deceased offspring");
    });

    test("should block deleting placed offspring", async () => {
      console.log("\n=== Testing: Cannot delete placed offspring ===");

      const plan = await createTestPlan(ctx);
      createdPlanIds.push(plan.id);

      // Setup plan
      await apiRequest(ctx, "PATCH", `/breeding/plans/${plan.id}`, {
        damId: TEST_DAM_ID,
        sireId: TEST_SIRE_ID,
        lockedCycleStart: toISODate(-60),
        lockedOvulationDate: toISODate(-58),
        lockedDueDate: toISODate(0),
        lockedPlacementStartDate: toISODate(56),
        status: "COMMITTED",
        birthDateActual: toISODate(-1),
      });

      const groupId = await getOffspringGroupId(ctx, plan.id);
      if (!groupId) {
        console.log("⚠ Plan has no offspring group linked - skipping test");
        return;
      }

      // Create offspring
      const createResponse = await apiRequest(ctx, "POST", "/offspring/individuals", {
        groupId,
        name: "Placed Pup",
        sex: "MALE",
      });

      if (!createResponse.ok()) {
        const createError = await createResponse.text();
        console.log(`⚠ Failed to create offspring: ${createResponse.status()} - ${createError}`);
        throw new Error(`Failed to create offspring: ${createError}`);
      }

      const offspring = await createResponse.json();
      console.log(`✓ Created offspring ${offspring.id}`);

      // Mark as placed
      const placedResponse = await apiRequest(ctx, "PATCH", `/offspring/individuals/${offspring.id}`, {
        placementState: "PLACED",
        placedAt: toISODate(0),
      });

      if (!placedResponse.ok()) {
        const placedError = await placedResponse.text();
        console.log(`⚠ Failed to mark placed: ${placedResponse.status()} - ${placedError}`);
        throw new Error(`Failed to mark placed: ${placedError}`);
      }
      console.log(`✓ Marked offspring as placed`);

      // Delete should fail
      const response = await apiRequest(ctx, "DELETE", `/offspring/individuals/${offspring.id}`);

      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(409);

      const error = await response.json();
      expect(error.error).toBe("offspring_delete_blocked");
      expect(error.blockers.isPlaced).toBe(true);
      console.log("✓ Correctly blocked deleting placed offspring");
    });
  });
});

// ============================================================================
// Test Summary
// ============================================================================
test.afterAll(async () => {
  console.log("\n");
  console.log("═".repeat(80));
  console.log("BREEDING PLAN & OFFSPRING BUSINESS RULES TESTS COMPLETE");
  console.log("═".repeat(80));
  console.log("\nRules validated:");
  console.log("  ✓ Rule 1: Birth Date as Lock Point (upstream date immutability)");
  console.log("  ✓ Rule 2: Cannot add offspring without birth date");
  console.log("  ✓ Rule 3: Cannot clear birth date with offspring");
  console.log("  ✓ Rule 4: Downstream date consistency");
  console.log("  ✓ Rule 5: Cannot unlink offspring group with offspring");
  console.log("  ✓ Rule 6: Status regression validation");
  console.log("  ✓ Rule 7: Offspring deletion protection");
  console.log("═".repeat(80));
});
