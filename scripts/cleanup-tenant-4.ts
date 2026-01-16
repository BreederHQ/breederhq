/**
 * Clean up tenant 4 test data
 */

const API_BASE_URL = "http://localhost:6001/api/v1";
const TEST_USER_EMAIL = "admin@bhq.local";
const TEST_USER_PASSWORD = "AdminReset987!";

async function cleanupTenant4() {
  console.log("🧹 Cleaning tenant 4...\n");

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

    // Extract CSRF token
    const setCookieHeaders = loginResponse.headers()["set-cookie"] || "";
    const csrfMatch = setCookieHeaders.match(/XSRF-TOKEN=([^;]+)/);
    const csrfToken = csrfMatch ? decodeURIComponent(csrfMatch[1]) : "";

    console.log(`✓ Authenticated\n`);

    const tenantId = 4;
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

    console.log(`Found ${groups.length} offspring groups\n`);

    // Delete each group
    for (const group of groups) {
      console.log(`🗑️  Deleting group ID ${group.id} (name: "${group.name}")...`);

      // First, get offspring in this group
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
          console.log(`   ✓ Deleted group ${group.id}`);
        } else {
          const errorBody = await deleteGroupResponse.text();
          console.log(`   ⚠ Could not delete group ${group.id}: ${deleteGroupResponse.status()} - ${errorBody}`);
        }
      } catch (err) {
        console.log(`   ⚠ Error deleting group ${group.id}:`, err);
      }

      console.log();
    }

    console.log("✅ Cleanup complete!\n");

  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  } finally {
    await apiContext.dispose();
  }
}

cleanupTenant4().catch(console.error);
