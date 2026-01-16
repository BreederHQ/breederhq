/**
 * Fetch ALL breeding plans with all possible filters disabled
 */

const API_BASE_URL = "http://localhost:6001/api/v1";
const TEST_USER_EMAIL = "admin@bhq.local";
const TEST_USER_PASSWORD = "AdminReset987!";

async function fetchAllPlans() {
  console.log("📋 Fetching ALL breeding plans (detailed)...\n");

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

    // Try different query parameters to get all plans
    const queries = [
      `tenantId=${tenantId}`,
      `tenantId=${tenantId}&includeArchived=true`,
      `tenantId=${tenantId}&status=ALL`,
      `tenantId=${tenantId}&limit=1000`,
    ];

    for (const query of queries) {
      console.log(`\n🔍 Trying: /breeding/plans?${query}`);

      const plansResponse = await apiContext.get(`${API_BASE_URL}/breeding/plans?${query}`);

      if (plansResponse.ok()) {
        const plansData = await plansResponse.json();
        const plans = Array.isArray(plansData) ? plansData : plansData.items || [];

        console.log(`   Found ${plans.length} plans`);

        if (plans.length > 0) {
          plans.forEach((p: any) => {
            console.log(`   - ID: ${p.id}, Name: "${p.name}", Status: ${p.status}`);
          });
        }
      } else {
        console.log(`   Failed: ${plansResponse.status()}`);
      }
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await apiContext.dispose();
  }
}

fetchAllPlans().catch(console.error);
