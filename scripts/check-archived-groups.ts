/**
 * Check archived status of tenant 4 offspring groups
 */

const API_BASE_URL = "http://localhost:6001/api/v1";
const TEST_USER_EMAIL = "admin@bhq.local";
const TEST_USER_PASSWORD = "AdminReset987!";

async function checkArchivedGroups() {
  console.log("📋 Checking archived groups in tenant 4...\n");

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

    console.log(`✓ Authenticated\n`);

    const tenantId = 4;

    // Fetch offspring groups
    console.log("🐕 Fetching offspring groups...");
    const groupsResponse = await apiContext.get(`${API_BASE_URL}/offspring?tenantId=${tenantId}`);

    if (groupsResponse.ok()) {
      const groupsData = await groupsResponse.json();
      const groups = Array.isArray(groupsData) ? groupsData : groupsData.items || [];

      console.log(`Found ${groups.length} groups\n`);

      groups.forEach((g: any) => {
        console.log(`Group ID ${g.id}:`);
        console.log(`  Name: "${g.name || 'undefined'}"`);
        console.log(`  Archived: ${g.archivedAt ? 'YES' : 'NO'}`);
        if (g.archivedAt) {
          console.log(`  Archived At: ${g.archivedAt}`);
          console.log(`  Archive Reason: ${g.archiveReason || 'none'}`);
        }
        console.log();
      });
    } else {
      console.log(`  Failed to fetch: ${groupsResponse.status()}\n`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await apiContext.dispose();
  }
}

checkArchivedGroups().catch(console.error);
