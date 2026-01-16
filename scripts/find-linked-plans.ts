/**
 * Find breeding plans linked to offspring groups in tenant 4
 */

const API_BASE_URL = "http://localhost:6001/api/v1";
const TEST_USER_EMAIL = "admin@bhq.local";
const TEST_USER_PASSWORD = "AdminReset987!";

async function findLinkedPlans() {
  console.log("🔍 Finding breeding plans linked to offspring groups...\n");

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

    // Get offspring groups
    const groupsResponse = await apiContext.get(`${API_BASE_URL}/offspring?tenantId=${tenantId}`);
    const groupsData = await groupsResponse.json();
    const groups = Array.isArray(groupsData) ? groupsData : groupsData.items || [];

    console.log(`Found ${groups.length} offspring groups in tenant 4\n`);

    // Get all breeding plans
    const plansResponse = await apiContext.get(`${API_BASE_URL}/breeding/plans?tenantId=${tenantId}`);
    const plansData = await plansResponse.json();
    const plans = Array.isArray(plansData) ? plansData : plansData.items || [];

    console.log(`Found ${plans.length} breeding plans in tenant 4\n`);

    if (plans.length > 0) {
      console.log("📅 Breeding Plans:");
      plans.forEach((p: any) => {
        console.log(`  - ID: ${p.id}`);
        console.log(`    Name: "${p.name}"`);
        console.log(`    Status: ${p.status}`);
        console.log(`    Offspring Group ID: ${p.offspringGroupId || 'none'}`);
        console.log();
      });

      // Delete each plan
      console.log("🗑️  Deleting breeding plans...\n");
      for (const plan of plans) {
        try {
          const deleteResponse = await apiContext.post(
            `${API_BASE_URL}/breeding/plans/${plan.id}/delete`,
            {
              headers: {
                "X-Tenant-Id": String(tenantId),
                "X-CSRF-Token": csrfToken,
              },
            }
          );

          if (deleteResponse.ok()) {
            console.log(`✓ Deleted plan ${plan.id} (${plan.name})`);
          } else {
            const errorBody = await deleteResponse.text();
            console.log(`⚠ Could not delete plan ${plan.id}: ${deleteResponse.status()}`);
            console.log(`  Error: ${errorBody}`);
          }
        } catch (err) {
          console.log(`⚠ Error deleting plan ${plan.id}:`, err);
        }
      }
    }

    console.log("\n✅ Done!\n");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await apiContext.dispose();
  }
}

findLinkedPlans().catch(console.error);
