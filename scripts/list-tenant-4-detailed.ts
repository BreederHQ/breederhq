/**
 * List data from tenant 4 with full details
 */

const API_BASE_URL = "http://localhost:6001/api/v1";
const TEST_USER_EMAIL = "admin@bhq.local";
const TEST_USER_PASSWORD = "AdminReset987!";

async function listTenant4Detailed() {
  console.log("📋 Listing tenant 4 data (detailed)...\n");

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
    console.log(`🔍 TENANT ${tenantId}\n`);

    // Offspring Groups with full details
    console.log("🐕 Offspring Groups:");
    const groupsResponse = await apiContext.get(`${API_BASE_URL}/offspring?tenantId=${tenantId}`);

    if (groupsResponse.ok()) {
      const groupsData = await groupsResponse.json();
      const groups = Array.isArray(groupsData) ? groupsData : groupsData.items || [];

      if (groups.length === 0) {
        console.log("  (none)\n");
      } else {
        groups.forEach((g: any) => {
          console.log(`  - ID: ${g.id}`);
          console.log(`    Name: "${g.name || 'undefined'}"`);
          console.log(`    Breeding Plan ID: ${g.breedingPlanId || 'none'}`);
          console.log(`    Created: ${g.createdAt}`);
          console.log();
        });
      }
    } else {
      console.log(`  Failed to fetch: ${groupsResponse.status()}\n`);
    }

    // Breeding Plans with full details
    console.log("📅 Breeding Plans:");
    const plansResponse = await apiContext.get(`${API_BASE_URL}/breeding/plans?tenantId=${tenantId}`);

    if (plansResponse.ok()) {
      const plansData = await plansResponse.json();
      const plans = Array.isArray(plansData) ? plansData : plansData.items || [];

      if (plans.length === 0) {
        console.log("  (none)\n");
      } else {
        plans.forEach((p: any) => {
          console.log(`  - ID: ${p.id}`);
          console.log(`    Name: "${p.name || 'undefined'}"`);
          console.log(`    Status: ${p.status}`);
          console.log(`    Created: ${p.createdAt}`);
          console.log();
        });
      }
    } else {
      console.log(`  Failed to fetch: ${plansResponse.status()}\n`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await apiContext.dispose();
  }
}

listTenant4Detailed().catch(console.error);
