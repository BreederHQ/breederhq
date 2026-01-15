/**
 * Archive all offspring groups in tenant 4
 */

const API_BASE_URL = "http://localhost:6001/api/v1";
const TEST_USER_EMAIL = "admin@bhq.local";
const TEST_USER_PASSWORD = "AdminReset987!";

async function archiveTenant4() {
  console.log("📦 Archiving tenant 4 offspring groups...\n");

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
      "Content-Type": "application/json",
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

    // Archive each group
    for (const group of groups) {
      console.log(`📦 Archiving group ID ${group.id} (name: "${group.name}")...`);

      try {
        const archiveResponse = await apiContext.post(
          `${API_BASE_URL}/offspring/${group.id}/archive`,
          {
            headers,
            data: {
              reason: "Test cleanup",
            },
          }
        );

        if (archiveResponse.ok()) {
          console.log(`   ✓ Archived group ${group.id}`);
        } else {
          const errorBody = await archiveResponse.text();
          console.log(`   ⚠ Could not archive group ${group.id}: ${archiveResponse.status()} - ${errorBody}`);
        }
      } catch (err) {
        console.log(`   ⚠ Error archiving group ${group.id}:`, err);
      }
    }

    console.log("\n✅ Archive complete!\n");

  } catch (error) {
    console.error("❌ Archive failed:", error);
  } finally {
    await apiContext.dispose();
  }
}

archiveTenant4().catch(console.error);
