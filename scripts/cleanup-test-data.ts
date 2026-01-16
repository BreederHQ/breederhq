/**
 * Cleanup orphaned test data from failed E2E test runs
 *
 * Removes:
 * - Offspring groups with "E2E Test Group" in the name
 * - Breeding plans with "Test Plan" or "E2E" in the name
 * - Related offspring individuals
 */

import { test } from "@playwright/test";

const API_BASE_URL = "http://localhost:6001/api/v1";
const TEST_USER_EMAIL = "admin@bhq.local";
const TEST_USER_PASSWORD = "AdminReset987!";

async function cleanup() {
  console.log("🧹 Starting cleanup of orphaned test data...\n");

  // Create API context
  const { request } = await import("@playwright/test");
  const apiContext = await request.newContext({
    baseURL: API_BASE_URL,
  });

  try {
    // Login
    console.log("🔐 Authenticating...");
    const loginResponse = await apiContext.fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      },
    });

    if (!loginResponse.ok()) {
      throw new Error(`Login failed: ${loginResponse.status()}`);
    }

    const loginData = await loginResponse.json();
    const memberships = loginData.memberships || [];

    // Extract CSRF token
    const setCookieHeaders = loginResponse.headers()["set-cookie"] || "";
    const csrfMatch = setCookieHeaders.match(/XSRF-TOKEN=([^;]+)/);
    const csrfToken = csrfMatch ? decodeURIComponent(csrfMatch[1]) : "";

    console.log(`✓ Authenticated with ${memberships.length} tenant(s)\n`);

    // Clean up test data in ALL tenants
    for (const membership of memberships) {
      const tenantId = membership.tenantId;
      console.log(`\n🔍 Checking tenant ${tenantId}...`);

      const headers = {
        "X-Tenant-Id": String(tenantId),
        "X-CSRF-Token": csrfToken,
      };

    // Get all offspring groups
    console.log("📋 Fetching offspring groups...");
    const groupsResponse = await apiContext.get(`${API_BASE_URL}/offspring?tenantId=${tenantId}`);

    if (!groupsResponse.ok()) {
      console.error("Failed to fetch offspring groups");
      return;
    }

    const groupsData = await groupsResponse.json();
    const groups = Array.isArray(groupsData) ? groupsData : groupsData.items || [];

    // Filter test groups (containing "E2E Test Group" or "Test Group" or "Cleanup Test" or starts with "Test Plan")
    const testGroups = groups.filter((g: any) =>
      g.name?.includes("E2E Test") ||
      g.name?.includes("Test Group") ||
      g.name?.includes("Cleanup Test") ||
      g.name?.startsWith("Test Plan")
    );

    console.log(`Found ${testGroups.length} test offspring groups to clean up`);

    // Delete each test group and its offspring
    for (const group of testGroups) {
      console.log(`\n🗑️  Cleaning group: ${group.name} (ID: ${group.id})`);

      // Get offspring in this group
      const offspringResponse = await apiContext.get(
        `${API_BASE_URL}/offspring/individuals?groupId=${group.id}&tenantId=${tenantId}`
      );

      if (offspringResponse.ok()) {
        const offspringData = await offspringResponse.json();
        const offspring = Array.isArray(offspringData) ? offspringData : offspringData.items || [];

        // Delete each offspring first
        for (const o of offspring) {
          try {
            const deleteOffspringResponse = await apiContext.delete(
              `${API_BASE_URL}/offspring/individuals/${o.id}`,
              {
                headers,
                data: { tenantId },
              }
            );

            if (deleteOffspringResponse.ok()) {
              console.log(`   ✓ Deleted offspring: ${o.name || o.id}`);
            } else {
              console.log(`   ⚠ Could not delete offspring ${o.id}: ${deleteOffspringResponse.status()}`);
            }
          } catch (err) {
            console.log(`   ⚠ Error deleting offspring ${o.id}`);
          }
        }
      }

      // Delete the group
      try {
        const deleteGroupResponse = await apiContext.delete(
          `${API_BASE_URL}/offspring/${group.id}`,
          {
            headers,
            data: { tenantId },
          }
        );

        if (deleteGroupResponse.ok() || deleteGroupResponse.status() === 404) {
          console.log(`   ✓ Deleted group: ${group.name}`);
        } else {
          console.log(`   ⚠ Could not delete group ${group.id}: ${deleteGroupResponse.status()}`);
        }
      } catch (err) {
        console.log(`   ⚠ Error deleting group ${group.id}`);
      }
    }

    // Get all breeding plans
    console.log("\n📋 Fetching breeding plans...");
    const plansResponse = await apiContext.get(`${API_BASE_URL}/breeding/plans?tenantId=${tenantId}`);

    if (!plansResponse.ok()) {
      console.error("Failed to fetch breeding plans");
      return;
    }

    const plansData = await plansResponse.json();
    const plans = Array.isArray(plansData) ? plansData : plansData.items || [];

    // Filter test plans (starting with "Test Plan" or containing E2E)
    const testPlans = plans.filter((p: any) =>
      p.name?.startsWith("Test Plan") ||
      p.name?.includes("E2E") ||
      p.name?.includes("Cleanup Test")
    );

    console.log(`Found ${testPlans.length} test breeding plans to clean up`);

    // Delete each test plan
    for (const plan of testPlans) {
      console.log(`\n🗑️  Cleaning plan: ${plan.name} (ID: ${plan.id})`);

      try {
        // Use the delete endpoint for breeding plans
        const deletePlanResponse = await apiContext.post(
          `${API_BASE_URL}/breeding/plans/${plan.id}/delete`,
          { headers }
        );

        if (deletePlanResponse.ok()) {
          console.log(`   ✓ Deleted plan: ${plan.name}`);
        } else {
          console.log(`   ⚠ Could not delete plan ${plan.id}: ${deletePlanResponse.status()}`);
        }
      } catch (err) {
        console.log(`   ⚠ Error deleting plan ${plan.id}`);
      }
    }

    }

    console.log("\n✅ Cleanup complete!\n");

  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  } finally {
    await apiContext.dispose();
  }
}

// Run cleanup
cleanup().catch(console.error);
