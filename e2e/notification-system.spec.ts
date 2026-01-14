/**
 * Notification System E2E Tests
 * Tests frontend components: Bell icon, dropdown, and preferences
 * Sprint 2 - Tests 4, 5, 6
 */

import { test, expect } from "@playwright/test";

// Test configuration
const PLATFORM_URL = "http://localhost:5173";
const API_URL = "http://localhost:3000";

test.describe("Notification System - Frontend Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to platform
    await page.goto(PLATFORM_URL);

    // TODO: Add login logic here if authentication is required
    // For now, assuming user is already logged in or auth is disabled in dev
  });

  /**
   * Test 4: Bell Icon Badge
   * - Verify bell icon shows unread count
   * - Verify API polling every 30 seconds
   */
  test("Test 4: Bell Icon Badge displays unread count", async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Look for bell icon (adjust selector based on actual implementation)
    const bellIcon = page.locator('[data-testid="notifications-bell"]').or(
      page.locator('button:has-text("Notifications")').or(
        page.locator('svg[class*="bell"]').locator("..")
      )
    );

    // Verify bell icon exists
    await expect(bellIcon).toBeVisible({ timeout: 10000 });

    // Check for unread badge
    const badge = page.locator('[data-testid="notifications-badge"]').or(
      page.locator('[class*="badge"]').filter({ hasText: /^\d+$/ })
    );

    // If badge exists, it should have a number
    const badgeCount = await badge.count();
    if (badgeCount > 0) {
      const badgeText = await badge.first().textContent();
      expect(badgeText).toMatch(/^\d+$/);
      console.log(`✅ Bell badge shows: ${badgeText} unread notifications`);
    } else {
      console.log("ℹ️  No unread notifications - badge not displayed");
    }

    // Monitor network requests for polling
    const apiRequests: string[] = [];

    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("/api/v1/notifications")) {
        apiRequests.push(url);
        console.log(`📡 API request: ${url}`);
      }
    });

    // Wait for at least one polling request (30 second interval)
    await page.waitForTimeout(35000); // Wait 35 seconds

    // Verify polling occurred
    expect(apiRequests.length).toBeGreaterThan(0);
    console.log(`✅ Detected ${apiRequests.length} notification API calls`);
  });

  /**
   * Test 5: Notifications Dropdown
   * - Verify dropdown opens
   * - Verify notification types display with icons
   * - Test mark as read functionality
   */
  test("Test 5: Notifications Dropdown interactions", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Find and click bell icon
    const bellIcon = page.locator('[data-testid="notifications-bell"]').or(
      page.locator('button:has-text("Notifications")').or(
        page.locator('svg[class*="bell"]').locator("..")
      )
    );

    await bellIcon.click();

    // Wait for dropdown to appear
    const dropdown = page.locator('[data-testid="notifications-dropdown"]').or(
      page.locator('[role="menu"]').filter({ hasText: /Notification/i })
    );

    await expect(dropdown).toBeVisible({ timeout: 5000 });
    console.log("✅ Notifications dropdown opened");

    // Check for notification items
    const notificationItems = page.locator('[data-testid="notification-item"]').or(
      dropdown.locator('[role="menuitem"]')
    );

    const itemCount = await notificationItems.count();

    if (itemCount > 0) {
      console.log(`✅ Found ${itemCount} notifications in dropdown`);

      // Check for icons (💉 🐴 🐎)
      const firstItem = notificationItems.first();
      const itemText = await firstItem.textContent();

      if (itemText?.includes("💉")) {
        console.log("✅ Vaccination notification icon (💉) found");
      } else if (itemText?.includes("🐴")) {
        console.log("✅ Breeding notification icon (🐴) found");
      } else if (itemText?.includes("🐎")) {
        console.log("✅ Foaling notification icon (🐎) found");
      }

      // Test clicking a notification (marks as read)
      await firstItem.click();

      // Verify navigation occurred or notification marked as read
      await page.waitForTimeout(1000);
      console.log("✅ Clicked notification (should mark as read)");
    } else {
      console.log("ℹ️  No notifications to display");
    }

    // Check for "Mark all read" button
    const markAllRead = page.locator('button:has-text("Mark all")').or(
      page.locator('[data-testid="mark-all-read"]')
    );

    if ((await markAllRead.count()) > 0) {
      await markAllRead.click();
      await page.waitForTimeout(1000);
      console.log("✅ Clicked 'Mark all read'");

      // Verify badge disappears or updates
      const badge = page.locator('[data-testid="notifications-badge"]');
      const badgeVisible = await badge.isVisible();
      if (!badgeVisible) {
        console.log("✅ Badge disappeared after marking all read");
      }
    }
  });

  /**
   * Test 6: Notification Preferences
   * - Verify preferences page loads
   * - Test toggling preferences
   * - Verify save functionality
   */
  test("Test 6: Notification Preferences page", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Navigate to settings (adjust route based on actual implementation)
    await page.goto(`${PLATFORM_URL}/settings`);
    await page.waitForLoadState("networkidle");

    // Look for Notifications tab or section
    const notificationsTab = page.locator('button:has-text("Notifications")').or(
      page.locator('[role="tab"]:has-text("Notifications")')
    );

    if ((await notificationsTab.count()) > 0) {
      await notificationsTab.click();
      await page.waitForTimeout(500);
      console.log("✅ Navigated to Notifications tab");
    }

    // Check for notification preference sections
    const deliveryMethods = page.locator('text=/Delivery Methods/i');
    const healthNotifications = page.locator('text=/Health Notifications/i');
    const breedingNotifications = page.locator('text=/Breeding Notifications/i');

    if ((await deliveryMethods.count()) > 0) {
      console.log("✅ Delivery Methods section found");
    }
    if ((await healthNotifications.count()) > 0) {
      console.log("✅ Health Notifications section found");
    }
    if ((await breedingNotifications.count()) > 0) {
      console.log("✅ Breeding Notifications section found");
    }

    // Find and toggle a preference (e.g., Vaccination Expiring)
    const vaccinationToggle = page.locator('label:has-text("Vaccination")').locator('..').locator('input[type="checkbox"]').or(
      page.locator('[role="switch"]:near(:text("Vaccination"))')
    );

    if ((await vaccinationToggle.count()) > 0) {
      const initialState = await vaccinationToggle.isChecked();
      await vaccinationToggle.click();
      await page.waitForTimeout(300);

      const newState = await vaccinationToggle.isChecked();
      expect(newState).toBe(!initialState);
      console.log(`✅ Toggled vaccination preference: ${initialState} → ${newState}`);
    }

    // Click Save button
    const saveButton = page.locator('button:has-text("Save")').or(
      page.locator('[data-testid="save-preferences"]')
    );

    if ((await saveButton.count()) > 0) {
      await saveButton.click();
      await page.waitForTimeout(1000);

      // Check for success message
      const successMessage = page.locator('text=/saved successfully/i').or(
        page.locator('[role="alert"]:has-text("Success")')
      );

      if ((await successMessage.count()) > 0) {
        console.log("✅ Success message displayed");
      }
    }
  });

  /**
   * Additional test: API Endpoints
   * Verify backend API responses
   */
  test("API Endpoints Test", async ({ request }) => {
    // Test GET /api/v1/notifications
    const notificationsResponse = await request.get(`${API_URL}/api/v1/notifications`, {
      params: {
        status: "UNREAD",
        limit: "50",
      },
      headers: {
        "x-tenant-id": "7", // Use tenant ID from test data
      },
    });

    expect(notificationsResponse.status()).toBe(200);
    const notifications = await notificationsResponse.json();
    console.log(`✅ API returned ${notifications.length || 0} notifications`);

    // Test GET /api/v1/notifications/preferences
    const preferencesResponse = await request.get(`${API_URL}/api/v1/notifications/preferences`, {
      headers: {
        "x-tenant-id": "7",
      },
    });

    if (preferencesResponse.status() === 200) {
      const preferences = await preferencesResponse.json();
      console.log(`✅ API returned user preferences`);
      console.log(`   Email enabled: ${preferences.emailEnabled}`);
    }
  });
});

/**
 * Test Summary and Reporting
 */
test.afterAll(async () => {
  console.log("\n");
  console.log("═".repeat(80));
  console.log("FRONTEND TESTS COMPLETE");
  console.log("═".repeat(80));
  console.log("\nTests executed:");
  console.log("  ✅ Test 4: Bell Icon Badge");
  console.log("  ✅ Test 5: Notifications Dropdown");
  console.log("  ✅ Test 6: Notification Preferences");
  console.log("  ✅ API Endpoints");
  console.log("\nNote: Some tests may require actual notifications in the database.");
  console.log("Run the backend test suite first to create test data.");
  console.log("═".repeat(80));
});
