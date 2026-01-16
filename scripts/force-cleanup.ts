/**
 * Force cleanup - directly delete by ID
 * Based on the IDs visible in screenshots
 */

const API_BASE_URL = "http://localhost:6001/api/v1";
const TEST_USER_EMAIL = "admin@bhq.local";
const TEST_USER_PASSWORD = "AdminReset987!";

// IDs from screenshots
const OFFSPRING_GROUP_IDS = [
  184856600900,  // Test Plan 176848560090...
  184855596793,  // Test Plan 176848559679...
  184855592749,  // Test Plan 176848559274...
];

const BREEDING_PLAN_IDS = [
  176848560081,  // Test Plan 176848560081...
];

async function forceCleanup() {
  console.log("🧹 Force cleanup starting...\n");

  const { request } = await import("@playwright/test");
  const apiContext = await request.newContext({ baseURL: API_BASE_URL });

  try {
    // Login
    const loginResponse = await apiContext.fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD },
    });

    if (!loginResponse.ok()) {
      throw new Error(`Login failed: ${loginResponse.status()}`);
    }

    const loginData = await loginResponse.json();
    const memberships = loginData.memberships || [];

    const setCookieHeaders = loginResponse.headers()["set-cookie"] || "";
    const csrfMatch = setCookieHeaders.match(/XSRF-TOKEN=([^;]+)/);
    const csrfToken = csrfMatch ? decodeURIComponent(csrfMatch[1]) : "";

    console.log(`✓ Authenticated with ${memberships.length} tenant(s)\n`);

    // Try tenant 4 explicitly (where UI shows the data)
    const TENANT_IDS = [1, 4, 78]; // Check tenant 4 explicitly

    for (const tenantId of TENANT_IDS) {
      console.log(`\n🔍 Cleaning tenant ${tenantId}...`);

      const headers = {
        "X-Tenant-Id": String(tenantId),
        "X-CSRF-Token": csrfToken,
      };

      // Delete offspring groups by ID
      console.log("\n🗑️  Deleting offspring groups:");
      for (const groupId of OFFSPRING_GROUP_IDS) {
        try {
          const response = await apiContext.delete(`${API_BASE_URL}/offspring/${groupId}`, {
            headers,
            data: { tenantId },
          });

          if (response.ok() || response.status() === 404) {
            console.log(`  ✓ Deleted offspring group ${groupId}`);
          } else {
            const errorBody = await response.text();
            console.log(`  ⚠ Could not delete group ${groupId}: ${response.status()} - ${errorBody}`);
          }
        } catch (err) {
          console.log(`  ⚠ Error deleting group ${groupId}`);
        }
      }

      // Delete breeding plans by ID
      console.log("\n🗑️  Deleting breeding plans:");
      for (const planId of BREEDING_PLAN_IDS) {
        try {
          const response = await apiContext.post(`${API_BASE_URL}/breeding/plans/${planId}/delete`, {
            headers,
          });

          if (response.ok()) {
            console.log(`  ✓ Deleted breeding plan ${planId}`);
          } else {
            const errorBody = await response.text();
            console.log(`  ⚠ Could not delete plan ${planId}: ${response.status()} - ${errorBody}`);
          }
        } catch (err) {
          console.log(`  ⚠ Error deleting plan ${planId}`);
        }
      }
    }

    console.log("\n✅ Force cleanup complete!\n");

  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  } finally {
    await apiContext.dispose();
  }
}

forceCleanup().catch(console.error);
