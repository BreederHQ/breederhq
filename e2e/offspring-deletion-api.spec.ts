/**
 * E2E API Tests: Offspring Deletion & Archive Functionality
 *
 * Tests the archive, restore, and delete endpoints for individual offspring.
 * Uses API-level testing for reliability and speed.
 *
 * PREREQUISITES:
 * - API server running on localhost:6001
 * - Test users seeded: cd breederhq-api && npm run db:dev:seed:users
 * - Test animals seeded: cd breederhq-api && npx tsx scripts/seed-e2e-test-data.ts
 *   (Creates test dam/sire with IDs 912/913 for offspring group creation)
 *
 * Test Coverage:
 * 1. Archive offspring (soft delete)
 * 2. Restore archived offspring
 * 3. Delete fresh offspring (hard delete)
 * 4. Blocked deletion when offspring has business data
 * 5. Cleanup verification
 */

import { test, expect, type APIRequestContext, request as playwrightRequest } from "@playwright/test";

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = "http://localhost:6001/api/v1";
const DEFAULT_TENANT_ID = 4;

// Test credentials (from seed-test-users.ts)
const TEST_USER_EMAIL = "admin@bhq.local";
const TEST_USER_PASSWORD = "AdminReset987!";

// Test animal IDs (created by seed-e2e-test-data.ts script)
const TEST_DAM_ID = 912;
const TEST_SIRE_ID = 913;

// ============================================================================
// Types
// ============================================================================

interface TestContext {
  tenantId: number;
  apiContext: APIRequestContext;
  csrfToken: string;
}

interface OffspringGroup {
  id: number;
  name: string;
  species: string;
}

interface Offspring {
  id: number;
  groupId: number;
  name?: string;
  species: string;
  archivedAt?: string | null;
  archiveReason?: string | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Authenticate and initialize test context
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
    throw new Error(`Login failed: ${loginResponse.status()} ${await loginResponse.text()}`);
  }

  const loginData = await loginResponse.json();

  // Extract tenantId from memberships (API returns memberships array, not direct tenantId)
  const tenantId = loginData.memberships?.[0]?.tenantId || DEFAULT_TENANT_ID;

  // Extract CSRF token from Set-Cookie header (following breeding-offspring-business-rules.spec.ts pattern)
  const setCookieHeaders = loginResponse.headers()["set-cookie"] || "";
  const csrfMatch = setCookieHeaders.match(/XSRF-TOKEN=([^;]+)/);
  const csrfToken = csrfMatch ? decodeURIComponent(csrfMatch[1]) : "";

  if (!csrfToken) {
    console.warn("Warning: No CSRF token found in login response");
  }

  return { tenantId, apiContext, csrfToken };
}

/**
 * Create a test offspring group
 */
async function createTestOffspringGroup(
  sharedCtx: TestContext,
  name?: string
): Promise<OffspringGroup> {
  const groupName = name || `E2E Test Group ${Date.now()}`;

  const response = await sharedCtx.apiContext.post(`${API_BASE_URL}/offspring`, {
    headers: {
      "X-Tenant-Id": String(sharedCtx.tenantId),
      "X-CSRF-Token": sharedCtx.csrfToken,
    },
    data: {
      tenantId: sharedCtx.tenantId,
      identifier: groupName,  // Use 'identifier' not 'name'
      species: "DOG",
      // Use birthDateActual instead of expected since we don't have a breeding plan
      birthDateActual: new Date().toISOString().split("T")[0],
      // Provide at least one parent ID (using hardcoded test animal IDs)
      // If these don't exist, tests will fail with clear error
      damId: TEST_DAM_ID,
      sireId: TEST_SIRE_ID,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create group: ${response.status()} ${await response.text()}`);
  }

  const group = await response.json();

  // Update the auto-created breeding plan to set birthDateActual
  // This is required for creating individual offspring
  if (group.plan?.id) {
    await sharedCtx.apiContext.patch(`${API_BASE_URL}/breeding/plans/${group.plan.id}`, {
      headers: {
        "X-Tenant-Id": String(sharedCtx.tenantId),
        "X-CSRF-Token": sharedCtx.csrfToken,
      },
      data: {
        birthDateActual: new Date().toISOString().split("T")[0],
      },
    });
  }

  return group;
}

/**
 * Create a test offspring individual
 */
async function createTestOffspring(
  sharedCtx: TestContext,
  groupId: number,
  name?: string
): Promise<Offspring> {
  const offspringName = name || `E2E Test Offspring ${Date.now()}`;

  const response = await sharedCtx.apiContext.post(`${API_BASE_URL}/offspring/individuals`, {
    headers: {
      "X-Tenant-Id": String(sharedCtx.tenantId),
      "X-CSRF-Token": sharedCtx.csrfToken,
    },
    data: {
      tenantId: sharedCtx.tenantId,
      groupId,
      name: offspringName,
      species: "DOG",
      sex: "MALE",
      collarColorName: `TEST-${Date.now()}`,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create offspring: ${response.status()} ${await response.text()}`);
  }

  return await response.json();
}

/**
 * Delete offspring via API (cleanup)
 */
async function deleteOffspringViaAPI(sharedCtx: TestContext, offspringId: number): Promise<boolean> {
  try {
    const response = await sharedCtx.apiContext.delete(`${API_BASE_URL}/offspring/individuals/${offspringId}`, {
      headers: {
        "X-Tenant-Id": String(sharedCtx.tenantId),
        "X-CSRF-Token": sharedCtx.csrfToken,
      },
      data: { tenantId: sharedCtx.tenantId },
    });

    return response.ok() || response.status() === 404;
  } catch (err) {
    console.warn(`Cleanup: Could not delete offspring ${offspringId}:`, err);
    return false;
  }
}

/**
 * Delete offspring group via API (cleanup)
 */
async function deleteGroupViaAPI(sharedCtx: TestContext, groupId: number): Promise<boolean> {
  try {
    const response = await sharedCtx.apiContext.delete(`${API_BASE_URL}/offspring/${groupId}`, {
      headers: {
        "X-Tenant-Id": String(sharedCtx.tenantId),
        "X-CSRF-Token": sharedCtx.csrfToken,
      },
      data: { tenantId: sharedCtx.tenantId },
    });

    return response.ok() || response.status() === 404 || response.status() === 409;
  } catch (err) {
    console.warn(`Cleanup: Could not delete group ${groupId}:`, err);
    return false;
  }
}

// ============================================================================
// Test Suite: All Offspring Deletion & Archive Tests (Shared Context)
// ============================================================================

// Shared context for all tests (single login session)
let sharedCtx: TestContext;
let sharedApiContext: APIRequestContext;

test.beforeAll(async () => {
  // Create ONE context for all test suites to share
  sharedApiContext = await playwrightRequest.newContext({
    baseURL: API_BASE_URL,
  });
  sharedCtx = await initTestContext(sharedApiContext);
  console.log("✓ Authenticated - shared context ready for all tests");
});

test.afterAll(async () => {
  // Dispose context after all tests complete
  if (sharedApiContext) {
    await sharedApiContext.dispose();
  }
});

// ============================================================================
// Test Suite: Offspring Archive Functionality
// ============================================================================

test.describe("Offspring Archive API", () => {
  let testGroupId: number;
  let testOffspringId: number;

  test.beforeEach(async () => {
    // Create fresh test data for each test using shared context
    const group = await createTestOffspringGroup(sharedCtx);
    testGroupId = group.id;

    const offspring = await createTestOffspring(sharedCtx, testGroupId);
    testOffspringId = offspring.id;
  });

  test.afterEach(async () => {
    // Cleanup: Delete test offspring and group using shared context
    if (testOffspringId) {
      await deleteOffspringViaAPI(sharedCtx, testOffspringId);
    }
    if (testGroupId) {
      await deleteGroupViaAPI(sharedCtx, testGroupId);
    }
  });

  test("should archive offspring with reason", async () => {
    const archiveReason = "E2E Test - Accidental creation";

    // Archive the offspring
    const response = await sharedCtx.apiContext.post(
      `${API_BASE_URL}/offspring/individuals/${testOffspringId}/archive`,
      {
        headers: {
          "X-Tenant-Id": String(sharedCtx.tenantId),
          "X-CSRF-Token": sharedCtx.csrfToken,
        },
        data: { reason: archiveReason },
      }
    );

    expect(response.ok()).toBe(true);

    const result = await response.json();
    expect(result.ok).toBe(true);
    expect(result.archived).toBeDefined();
    expect(result.archived.id).toBe(testOffspringId);
    expect(result.archived.archivedAt).toBeTruthy();
    expect(result.archived.archiveReason).toBe(archiveReason);
  });

  test("should archive offspring without reason", async () => {
    // Archive without reason
    const response = await sharedCtx.apiContext.post(
      `${API_BASE_URL}/offspring/individuals/${testOffspringId}/archive`,
      {
        headers: {
          "X-Tenant-Id": String(sharedCtx.tenantId),
          "X-CSRF-Token": sharedCtx.csrfToken,
        },
        data: {},
      }
    );

    expect(response.ok()).toBe(true);

    const result = await response.json();
    expect(result.archived.archivedAt).toBeTruthy();
    expect(result.archived.archiveReason).toBeNull();
  });

  test("should restore archived offspring", async () => {
    // First archive
    await sharedCtx.apiContext.post(
      `${API_BASE_URL}/offspring/individuals/${testOffspringId}/archive`,
      {
        headers: {
          "X-Tenant-Id": String(sharedCtx.tenantId),
          "X-CSRF-Token": sharedCtx.csrfToken,
        },
        data: { reason: "Test archive" },
      }
    );

    // Then restore
    const response = await sharedCtx.apiContext.post(
      `${API_BASE_URL}/offspring/individuals/${testOffspringId}/restore`,
      {
        headers: {
          "X-Tenant-Id": String(sharedCtx.tenantId),
          "X-CSRF-Token": sharedCtx.csrfToken,
        },
        data: {},
      }
    );

    expect(response.ok()).toBe(true);

    const result = await response.json();
    expect(result.ok).toBe(true);
    expect(result.restored).toBeDefined();
    expect(result.restored.archivedAt).toBeNull();
    expect(result.restored.archiveReason).toBeNull();
  });

  test("should fail to restore non-archived offspring", async () => {
    // Try to restore offspring that isn't archived
    const response = await sharedCtx.apiContext.post(
      `${API_BASE_URL}/offspring/individuals/${testOffspringId}/restore`,
      {
        headers: {
          "X-Tenant-Id": String(sharedCtx.tenantId),
          "X-CSRF-Token": sharedCtx.csrfToken,
        },
        data: {},
      }
    );

    expect(response.status()).toBe(400);

    const result = await response.json();
    expect(result.error).toBe("offspring_not_archived");
  });

  test("should return 404 for non-existent offspring", async () => {
    const fakeId = 999999999;

    const response = await sharedCtx.apiContext.post(
      `${API_BASE_URL}/offspring/individuals/${fakeId}/archive`,
      {
        headers: {
          "X-Tenant-Id": String(sharedCtx.tenantId),
          "X-CSRF-Token": sharedCtx.csrfToken,
        },
        data: {},
      }
    );

    expect(response.status()).toBe(404);
  });
});

// ============================================================================
// Test Suite: Offspring Deletion
// ============================================================================

test.describe("Offspring Deletion API", () => {
  let testGroupId: number;
  let testOffspringId: number;

  test.beforeEach(async () => {
    const group = await createTestOffspringGroup(sharedCtx);
    testGroupId = group.id;

    const offspring = await createTestOffspring(sharedCtx, testGroupId);
    testOffspringId = offspring.id;
  });

  test.afterEach(async () => {
    // Cleanup
    if (testOffspringId) {
      await deleteOffspringViaAPI(sharedCtx, testOffspringId);
    }
    if (testGroupId) {
      await deleteGroupViaAPI(sharedCtx, testGroupId);
    }
  });

  test("should successfully delete fresh offspring", async () => {
    // Delete offspring with no business data
    const response = await sharedCtx.apiContext.delete(
      `${API_BASE_URL}/offspring/individuals/${testOffspringId}`,
      {
        headers: {
          "X-Tenant-Id": String(sharedCtx.tenantId),
          "X-CSRF-Token": sharedCtx.csrfToken,
        },
        data: { tenantId: sharedCtx.tenantId },
      }
    );

    expect(response.ok()).toBe(true);

    const result = await response.json();
    expect(result.ok).toBe(true);
    expect(result.deleted).toBe(testOffspringId);

    // Verify offspring is actually deleted
    const getResponse = await sharedCtx.apiContext.get(
      `${API_BASE_URL}/offspring/individuals/${testOffspringId}?tenantId=${sharedCtx.tenantId}`
    );
    expect(getResponse.status()).toBe(404);

    // Mark as cleaned up so afterEach doesn't try again
    testOffspringId = 0;
  });

  test("should block deletion when offspring has buyer", async () => {
    // Use existing party from tenant 4 as buyer (Party ID 89)
    const buyerPartyId = 89;

    // Assign buyer to offspring
    const patchResponse = await sharedCtx.apiContext.patch(`${API_BASE_URL}/offspring/individuals/${testOffspringId}`, {
      headers: {
        "X-Tenant-Id": String(sharedCtx.tenantId),
        "X-CSRF-Token": sharedCtx.csrfToken,
      },
      data: {
        tenantId: sharedCtx.tenantId,
        buyerPartyId: buyerPartyId,
      },
    });

    // Verify PATCH succeeded and buyer was assigned
    expect(patchResponse.ok()).toBe(true);
    const updated = await patchResponse.json();
    expect(updated.buyerPartyId).toBe(buyerPartyId);

    // Fetch the offspring again to verify it was persisted to database
    const verifyResponse = await sharedCtx.apiContext.get(
      `${API_BASE_URL}/offspring/individuals/${testOffspringId}?tenantId=${sharedCtx.tenantId}`
    );
    expect(verifyResponse.ok()).toBe(true);
    const verified = await verifyResponse.json();
    console.log(`Verified offspring ${testOffspringId} has buyerPartyId:`, verified.buyerPartyId, "expected:", buyerPartyId);
    expect(verified.buyerPartyId).toBe(buyerPartyId);

    // Try to delete (should be blocked)
    const deleteResponse = await sharedCtx.apiContext.delete(
      `${API_BASE_URL}/offspring/individuals/${testOffspringId}`,
      {
        headers: {
          "X-Tenant-Id": String(sharedCtx.tenantId),
          "X-CSRF-Token": sharedCtx.csrfToken,
        },
        data: { tenantId: sharedCtx.tenantId },
      }
    );

    // Log what we actually got
    if (deleteResponse.status() !== 409) {
      const actualResult = await deleteResponse.json();
      console.log("Expected 409 but got:", deleteResponse.status());
      console.log("Response body:", JSON.stringify(actualResult, null, 2));
    }

    expect(deleteResponse.status()).toBe(409);

    const result = await deleteResponse.json();
    expect(result.error).toBe("offspring_delete_blocked");
    expect(result.blockers).toBeDefined();
    expect(result.blockers.hasBuyer).toBe(true);

    // Remove buyer for cleanup
    await sharedCtx.apiContext.patch(`${API_BASE_URL}/offspring/individuals/${testOffspringId}`, {
      headers: {
        "X-Tenant-Id": String(sharedCtx.tenantId),
        "X-CSRF-Token": sharedCtx.csrfToken,
      },
      data: {
        tenantId: sharedCtx.tenantId,
        buyerPartyId: null,
      },
    });
  });

  test("should archive instead of delete when offspring has business data", async () => {
    // Use existing party from tenant 4 as buyer (Party ID 90)
    const buyerPartyId = 90;

    await sharedCtx.apiContext.patch(`${API_BASE_URL}/offspring/individuals/${testOffspringId}`, {
      headers: {
        "X-Tenant-Id": String(sharedCtx.tenantId),
        "X-CSRF-Token": sharedCtx.csrfToken,
      },
      data: {
        tenantId: sharedCtx.tenantId,
        buyerPartyId: buyerPartyId,
      },
    });

    // Deletion should be blocked
    const deleteResponse = await sharedCtx.apiContext.delete(
      `${API_BASE_URL}/offspring/individuals/${testOffspringId}`,
      {
        headers: {
          "X-Tenant-Id": String(sharedCtx.tenantId),
          "X-CSRF-Token": sharedCtx.csrfToken,
        },
        data: { tenantId: sharedCtx.tenantId },
      }
    );
    expect(deleteResponse.status()).toBe(409);

    // But archive should work
    const archiveResponse = await sharedCtx.apiContext.post(
      `${API_BASE_URL}/offspring/individuals/${testOffspringId}/archive`,
      {
        headers: {
          "X-Tenant-Id": String(sharedCtx.tenantId),
          "X-CSRF-Token": sharedCtx.csrfToken,
        },
        data: { reason: "Has buyer, cannot delete" },
      }
    );

    expect(archiveResponse.ok()).toBe(true);

    const result = await archiveResponse.json();
    expect(result.archived.archivedAt).toBeTruthy();

    // Remove buyer for cleanup
    await sharedCtx.apiContext.patch(`${API_BASE_URL}/offspring/individuals/${testOffspringId}`, {
      headers: {
        "X-Tenant-Id": String(sharedCtx.tenantId),
        "X-CSRF-Token": sharedCtx.csrfToken,
      },
      data: {
        tenantId: sharedCtx.tenantId,
        buyerPartyId: null,
      },
    });
  });
});

// ============================================================================
// Test Suite: Cleanup Verification
// ============================================================================

test.describe("Test Data Cleanup", () => {
  test("should not leave orphaned test data", async () => {
    // Create test data
    const group = await createTestOffspringGroup(sharedCtx, "Cleanup Test Group");
    const offspring = await createTestOffspring(sharedCtx, group.id, "Cleanup Test Offspring");

    console.log(`Created group ${group.id} and offspring ${offspring.id}`);

    // Delete offspring
    const deleteOffspringResponse = await sharedCtx.apiContext.delete(
      `${API_BASE_URL}/offspring/individuals/${offspring.id}`,
      {
        headers: {
          "X-Tenant-Id": String(sharedCtx.tenantId),
          "X-CSRF-Token": sharedCtx.csrfToken,
        },
        data: { tenantId: sharedCtx.tenantId },
      }
    );
    console.log(`Delete offspring response: ${deleteOffspringResponse.status()}`);
    expect(deleteOffspringResponse.ok()).toBe(true);

    // Archive group (linked groups cannot be deleted, only archived)
    const archiveGroupResponse = await sharedCtx.apiContext.post(
      `${API_BASE_URL}/offspring/${group.id}/archive`,
      {
        headers: {
          "X-Tenant-Id": String(sharedCtx.tenantId),
          "X-CSRF-Token": sharedCtx.csrfToken,
        },
        data: { reason: "Test cleanup" },
      }
    );
    console.log(`Archive group response: ${archiveGroupResponse.status()}`);
    if (!archiveGroupResponse.ok()) {
      const errorBody = await archiveGroupResponse.json();
      console.log(`Archive group error:`, JSON.stringify(errorBody, null, 2));
    }
    expect(archiveGroupResponse.ok()).toBe(true);

    // Verify offspring is gone (deleted)
    const offspringCheck = await sharedCtx.apiContext.get(
      `${API_BASE_URL}/offspring/individuals/${offspring.id}?tenantId=${sharedCtx.tenantId}`
    );
    expect(offspringCheck.status()).toBe(404);

    // Group is archived (cannot verify via GET since archived items may still be retrievable)
    // The important thing is that archive succeeded, which means cleanup is working
  });
});
