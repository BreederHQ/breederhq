/**
 * E2E Tests: Offspring Deletion & Archive Functionality
 *
 * Tests the 3-step deletion flow, archive functionality, and business rule enforcement
 * for individual offspring records.
 *
 * Test Coverage:
 * 1. Archive fresh offspring (soft delete)
 * 2. Restore archived offspring
 * 3. Delete fresh offspring (hard delete with 3-step confirmation)
 * 4. Blocked deletion when offspring has business data
 * 5. UI visibility and state management
 */

import { test, expect, type Page } from "@playwright/test";

// Helper to get tenant ID from localStorage or cookies
async function getTenantId(page: Page): Promise<number> {
  const tenantId = await page.evaluate(() => {
    const stored = localStorage.getItem("tenantId");
    if (stored) return Number(stored);

    // Try to extract from cookie
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split("=");
      if (key === "tenantId") return Number(value);
    }
    return 1; // Default fallback
  });
  return tenantId;
}

// Helper to create a test offspring group via API
async function createTestOffspringGroup(page: Page, tenantId: number) {
  const response = await page.evaluate(async (tid) => {
    const res = await fetch("/api/v1/offspring", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tenantId: tid,
        name: `E2E Test Group ${Date.now()}`,
        species: "DOG",
        birthDateExpected: new Date().toISOString().split("T")[0],
      }),
    });
    return res.json();
  }, tenantId);

  return response;
}

// Helper to create a test offspring individual via API
async function createTestOffspring(page: Page, tenantId: number, groupId: number) {
  const response = await page.evaluate(async ({ tid, gid }) => {
    const res = await fetch("/api/v1/offspring/individuals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tenantId: tid,
        groupId: gid,
        name: `E2E Test Offspring ${Date.now()}`,
        species: "DOG",
        sex: "MALE",
        collarColorName: `TEST-${Date.now()}`,
      }),
    });
    return res.json();
  }, { tid: tenantId, gid: groupId });

  return response;
}

// Helper to delete offspring via API (cleanup)
async function deleteOffspringViaAPI(page: Page, offspringId: number, tenantId: number) {
  try {
    await page.evaluate(async ({ oid, tid }) => {
      const res = await fetch(`/api/v1/offspring/individuals/${oid}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenantId: tid }),
      });
      if (!res.ok && res.status !== 404 && res.status !== 409) {
        throw new Error(`Failed to delete: ${res.status}`);
      }
      return res.ok ? await res.json() : null;
    }, { oid: offspringId, tid: tenantId });
  } catch (err) {
    console.warn(`Cleanup: Could not delete offspring ${offspringId}:`, err);
  }
}

// Helper to delete offspring group via API (cleanup)
async function deleteGroupViaAPI(page: Page, groupId: number, tenantId: number) {
  try {
    await page.evaluate(async ({ gid, tid }) => {
      const res = await fetch(`/api/v1/offspring/${gid}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenantId: tid }),
      });
      if (!res.ok && res.status !== 404 && res.status !== 409) {
        throw new Error(`Failed to delete: ${res.status}`);
      }
      return res.ok ? await res.json() : null;
    }, { gid: groupId, tid: tenantId });
  } catch (err) {
    console.warn(`Cleanup: Could not delete group ${groupId}:`, err);
  }
}

// ============================================================================
// Test Suite: Offspring Archive Functionality
// ============================================================================

test.describe("Offspring Archive Functionality", () => {
  let testGroupId: number;
  let testOffspringId: number;
  let tenantId: number;

  test.beforeEach(async ({ page }) => {
    // Navigate to offspring app and wait for load
    await page.goto("/offspring");
    await page.waitForLoadState("networkidle");

    // Get tenant ID
    tenantId = await getTenantId(page);

    // Create test data
    const group = await createTestOffspringGroup(page, tenantId);
    testGroupId = group.id;

    const offspring = await createTestOffspring(page, tenantId, testGroupId);
    testOffspringId = offspring.id;

    // Navigate to the offspring detail view
    await page.goto(`/offspring?offspringId=${testOffspringId}`);
    await page.waitForLoadState("networkidle");
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: Delete test offspring and group
    if (testOffspringId) {
      await deleteOffspringViaAPI(page, testOffspringId, tenantId);
    }
    if (testGroupId) {
      await deleteGroupViaAPI(page, testGroupId, tenantId);
    }
  });

  test("should show Danger Zone section in offspring detail view", async ({ page }) => {
    // Verify Danger Zone section is visible
    await expect(page.locator("text=Danger Zone")).toBeVisible();

    // Verify Archive and Delete buttons are visible
    await expect(page.locator('button:has-text("Archive Offspring")')).toBeVisible();
    await expect(page.locator('button:has-text("Delete Offspring")')).toBeVisible();
  });

  test("should archive offspring with reason", async ({ page }) => {
    const archiveReason = "E2E Test - Accidental creation";

    // Click Archive button
    await page.click('button:has-text("Archive Offspring")');

    // Verify archive modal appears
    await expect(page.locator("text=Archive This Offspring?")).toBeVisible();
    await expect(page.locator("text=Archiving will:")).toBeVisible();

    // Enter archive reason
    await page.fill('textarea[placeholder*="Accidental creation"]', archiveReason);

    // Click Archive button in modal
    await page.click('button:has-text("Archive"):not(:has-text("Archive Offspring"))');

    // Wait for success (modal should close)
    await expect(page.locator("text=Archive This Offspring?")).not.toBeVisible({ timeout: 5000 });

    // Verify archived banner appears
    await expect(page.locator("text=This offspring is archived")).toBeVisible();
    await expect(page.locator(`text=${archiveReason}`)).toBeVisible();

    // Verify Restore button is visible
    await expect(page.locator('button:has-text("Restore Offspring")')).toBeVisible();
  });

  test("should restore archived offspring", async ({ page }) => {
    // First archive the offspring
    await page.click('button:has-text("Archive Offspring")');
    await page.click('button:has-text("Archive"):not(:has-text("Archive Offspring"))');
    await page.waitForTimeout(1000);

    // Verify archived state
    await expect(page.locator("text=This offspring is archived")).toBeVisible();

    // Click Restore button
    await page.click('button:has-text("Restore Offspring")');

    // Wait for restore to complete (alert or banner disappearance)
    await page.waitForTimeout(1000);

    // Verify archived banner is gone
    await expect(page.locator("text=This offspring is archived")).not.toBeVisible();

    // Verify Archive and Delete buttons are back
    await expect(page.locator('button:has-text("Archive Offspring")')).toBeVisible();
    await expect(page.locator('button:has-text("Delete Offspring")')).toBeVisible();
  });
});

// ============================================================================
// Test Suite: Offspring Deletion - 3-Step Confirmation
// ============================================================================

test.describe("Offspring Deletion - 3-Step Confirmation", () => {
  let testGroupId: number;
  let testOffspringId: number;
  let collarName: string;
  let tenantId: number;

  test.beforeEach(async ({ page }) => {
    await page.goto("/offspring");
    await page.waitForLoadState("networkidle");

    tenantId = await getTenantId(page);

    // Create test data
    const group = await createTestOffspringGroup(page, tenantId);
    testGroupId = group.id;

    collarName = `TEST-${Date.now()}`;
    const offspring = await createTestOffspring(page, tenantId, testGroupId);
    testOffspringId = offspring.id;

    // Update offspring with unique collar
    await page.evaluate(async ({ oid, tid, collar }) => {
      await fetch(`/api/v1/offspring/individuals/${oid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tid,
          collarColorName: collar,
        }),
      });
    }, { oid: testOffspringId, tid: tenantId, collar: collarName });

    await page.goto(`/offspring?offspringId=${testOffspringId}`);
    await page.waitForLoadState("networkidle");
  });

  test.afterEach(async ({ page }) => {
    // Cleanup
    if (testOffspringId) {
      await deleteOffspringViaAPI(page, testOffspringId, tenantId);
    }
    if (testGroupId) {
      await deleteGroupViaAPI(page, testGroupId, tenantId);
    }
  });

  test("should show Step 1 modal when clicking Delete", async ({ page }) => {
    // Click Delete Offspring button
    await page.click('button:has-text("Delete Offspring")');

    // Verify Step 1 modal appears
    await expect(page.locator("text=Delete This Offspring?")).toBeVisible();
    await expect(page.locator("text=Consider archiving instead")).toBeVisible();

    // Verify both buttons are present
    await expect(page.locator('button:has-text("Archive Offspring")')).toBeVisible();
    await expect(page.locator('button:has-text("Continue to Delete")')).toBeVisible();
  });

  test("should navigate to archive modal from Step 1", async ({ page }) => {
    // Click Delete, then Archive from Step 1
    await page.click('button:has-text("Delete Offspring")');
    await page.click('button:has-text("Archive Offspring")');

    // Verify archive modal appears
    await expect(page.locator("text=Archive This Offspring?")).toBeVisible();
    await expect(page.locator("text=Archiving will:")).toBeVisible();
  });

  test("should show Step 2 modal after clicking Continue", async ({ page }) => {
    // Navigate to Step 2
    await page.click('button:has-text("Delete Offspring")');
    await page.click('button:has-text("Continue to Delete")');

    // Verify Step 2 modal appears
    await expect(page.locator("text=Are You Sure?")).toBeVisible();
    await expect(page.locator("text=Deleting this offspring will:")).toBeVisible();
    await expect(page.locator("text=Permanently remove all photos and notes")).toBeVisible();
    await expect(page.locator("text=Cannot be undone or restored")).toBeVisible();
  });

  test("should show Step 3 phrase confirmation", async ({ page }) => {
    // Navigate to Step 3
    await page.click('button:has-text("Delete Offspring")');
    await page.click('button:has-text("Continue to Delete")');
    await page.click('button:has-text("Yes, Delete")');

    // Verify Step 3 modal appears
    await expect(page.locator("text=Final Confirmation Required")).toBeVisible();
    await expect(page.locator("text=Type the offspring")).toBeVisible();

    // Verify collar name is displayed
    await expect(page.locator(`text=${collarName}`)).toBeVisible();

    // Verify input field exists
    await expect(page.locator('input[placeholder="Type here..."]')).toBeVisible();

    // Verify Delete button is disabled initially
    const deleteButton = page.locator('button:has-text("Delete Permanently")');
    await expect(deleteButton).toBeDisabled();
  });

  test("should enable delete button only when text matches exactly", async ({ page }) => {
    // Navigate to Step 3
    await page.click('button:has-text("Delete Offspring")');
    await page.click('button:has-text("Continue to Delete")');
    await page.click('button:has-text("Yes, Delete")');

    const input = page.locator('input[placeholder="Type here..."]');
    const deleteButton = page.locator('button:has-text("Delete Permanently")');

    // Type incorrect text
    await input.fill("WRONG-TEXT");
    await expect(deleteButton).toBeDisabled();

    // Verify error message shows
    await expect(page.locator("text=Text does not match")).toBeVisible();

    // Type correct text
    await input.fill(collarName);
    await expect(deleteButton).toBeEnabled();

    // Verify error message is gone
    await expect(page.locator("text=Text does not match")).not.toBeVisible();
  });

  test("should successfully delete offspring after phrase confirmation", async ({ page }) => {
    // Navigate through all 3 steps
    await page.click('button:has-text("Delete Offspring")');
    await page.click('button:has-text("Continue to Delete")');
    await page.click('button:has-text("Yes, Delete")');

    // Fill in confirmation text
    const input = page.locator('input[placeholder="Type here..."]');
    await input.fill(collarName);

    // Click Delete Permanently
    await page.click('button:has-text("Delete Permanently")');

    // Wait for deletion to complete
    await page.waitForTimeout(2000);

    // Verify offspring drawer closed or success message
    // The exact behavior depends on your implementation
    // Could check for redirect, closed drawer, or success alert

    // Verify offspring is actually deleted via API
    const stillExists = await page.evaluate(async ({ oid, tid }) => {
      try {
        const res = await fetch(`/api/v1/offspring/individuals/${oid}?tenantId=${tid}`);
        return res.ok;
      } catch {
        return false;
      }
    }, { oid: testOffspringId, tid: tenantId });

    expect(stillExists).toBe(false);

    // Mark as cleaned up so afterEach doesn't try to delete again
    testOffspringId = 0;
  });

  test("should allow cancellation at any step", async ({ page }) => {
    // Test Cancel at Step 1
    await page.click('button:has-text("Delete Offspring")');
    await page.click('button:has-text("Cancel")');
    await expect(page.locator("text=Delete This Offspring?")).not.toBeVisible();

    // Test Back at Step 2
    await page.click('button:has-text("Delete Offspring")');
    await page.click('button:has-text("Continue to Delete")');
    await page.click('button:has-text("Back")');
    await expect(page.locator("text=Are You Sure?")).not.toBeVisible();
    await expect(page.locator("text=Delete This Offspring?")).toBeVisible();

    // Test Back at Step 3
    await page.click('button:has-text("Continue to Delete")');
    await page.click('button:has-text("Yes, Delete")');
    await page.click('button:has-text("Back")');
    await expect(page.locator("text=Final Confirmation Required")).not.toBeVisible();
    await expect(page.locator("text=Are You Sure?")).toBeVisible();
  });
});

// ============================================================================
// Test Suite: Blocked Deletion (Business Rules)
// ============================================================================

test.describe("Blocked Deletion - Business Rules", () => {
  let testGroupId: number;
  let testOffspringId: number;
  let tenantId: number;

  test.beforeEach(async ({ page }) => {
    await page.goto("/offspring");
    await page.waitForLoadState("networkidle");

    tenantId = await getTenantId(page);

    // Create test data
    const group = await createTestOffspringGroup(page, tenantId);
    testGroupId = group.id;

    const offspring = await createTestOffspring(page, tenantId, testGroupId);
    testOffspringId = offspring.id;
  });

  test.afterEach(async ({ page }) => {
    // Remove buyer first to allow deletion
    if (testOffspringId) {
      await page.evaluate(async ({ oid, tid }) => {
        await fetch(`/api/v1/offspring/individuals/${oid}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: tid,
            buyerPartyId: null,
          }),
        });
      }, { oid: testOffspringId, tid: tenantId });

      await deleteOffspringViaAPI(page, testOffspringId, tenantId);
    }
    if (testGroupId) {
      await deleteGroupViaAPI(page, testGroupId, tenantId);
    }
  });

  test("should block deletion when offspring has buyer", async ({ page }) => {
    // First, assign a buyer to the offspring (blocker)
    await page.evaluate(async ({ oid, tid }) => {
      // Create a dummy party/contact for buyer
      const partyRes = await fetch("/api/v1/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tid,
          type: "CONTACT",
          firstName: "Test",
          lastName: "Buyer",
          email: "testbuyer@example.com",
        }),
      });
      const party = await partyRes.json();

      // Assign buyer to offspring
      await fetch(`/api/v1/offspring/individuals/${oid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tid,
          buyerPartyId: party.id,
        }),
      });
    }, { oid: testOffspringId, tid: tenantId });

    // Navigate to offspring detail
    await page.goto(`/offspring?offspringId=${testOffspringId}`);
    await page.waitForLoadState("networkidle");

    // Try to delete
    await page.click('button:has-text("Delete Offspring")');
    await page.click('button:has-text("Continue to Delete")');

    // Wait a moment for API check
    await page.waitForTimeout(1500);

    // Verify blocked modal appears
    await expect(page.locator("text=Cannot Delete This Offspring")).toBeVisible();
    await expect(page.locator("text=permanent business records")).toBeVisible();

    // Verify blocker is listed
    await expect(page.locator("text=Has assigned buyer")).toBeVisible();

    // Verify Archive Instead button is present
    await expect(page.locator('button:has-text("Archive Instead")')).toBeVisible();
  });

  test("should offer archive from blocked modal", async ({ page }) => {
    // Assign buyer to block deletion
    await page.evaluate(async ({ oid, tid }) => {
      const partyRes = await fetch("/api/v1/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tid,
          type: "CONTACT",
          firstName: "Test",
          lastName: "Buyer2",
          email: "testbuyer2@example.com",
        }),
      });
      const party = await partyRes.json();

      await fetch(`/api/v1/offspring/individuals/${oid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tid,
          buyerPartyId: party.id,
        }),
      });
    }, { oid: testOffspringId, tid: tenantId });

    await page.goto(`/offspring?offspringId=${testOffspringId}`);
    await page.waitForLoadState("networkidle");

    // Try to delete (will be blocked)
    await page.click('button:has-text("Delete Offspring")');
    await page.click('button:has-text("Continue to Delete")');
    await page.waitForTimeout(1500);

    // Click Archive Instead from blocked modal
    await page.click('button:has-text("Archive Instead")');

    // Verify archive modal opens
    await expect(page.locator("text=Archive This Offspring?")).toBeVisible();
    await expect(page.locator("text=Archiving will:")).toBeVisible();
  });
});

// ============================================================================
// Test Suite: Edge Cases
// ============================================================================

test.describe("Offspring Deletion - Edge Cases", () => {
  let testGroupId: number;
  let testOffspringId: number;
  let tenantId: number;

  test.beforeEach(async ({ page }) => {
    await page.goto("/offspring");
    await page.waitForLoadState("networkidle");

    tenantId = await getTenantId(page);

    const group = await createTestOffspringGroup(page, tenantId);
    testGroupId = group.id;

    const offspring = await createTestOffspring(page, tenantId, testGroupId);
    testOffspringId = offspring.id;
  });

  test.afterEach(async ({ page }) => {
    if (testOffspringId) {
      await deleteOffspringViaAPI(page, testOffspringId, tenantId);
    }
    if (testGroupId) {
      await deleteGroupViaAPI(page, testGroupId, tenantId);
    }
  });

  test("should handle offspring with no collar (uses name)", async ({ page }) => {
    const offspringName = "EdgeCase Offspring";

    // Update offspring to have no collar but a name
    await page.evaluate(async ({ oid, tid, name }) => {
      await fetch(`/api/v1/offspring/individuals/${oid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tid,
          name: name,
          collarColorName: null,
        }),
      });
    }, { oid: testOffspringId, tid: tenantId, name: offspringName });

    await page.goto(`/offspring?offspringId=${testOffspringId}`);
    await page.waitForLoadState("networkidle");

    // Navigate to Step 3
    await page.click('button:has-text("Delete Offspring")');
    await page.click('button:has-text("Continue to Delete")');
    await page.click('button:has-text("Yes, Delete")');

    // Verify name is shown instead of collar
    await expect(page.locator(`text=${offspringName}`)).toBeVisible();

    // Type name to confirm
    const input = page.locator('input[placeholder="Type here..."]');
    await input.fill(offspringName);

    const deleteButton = page.locator('button:has-text("Delete Permanently")');
    await expect(deleteButton).toBeEnabled();
  });

  test("should handle offspring with neither name nor collar (uses ID)", async ({ page }) => {
    // Update offspring to have no collar or name
    await page.evaluate(async ({ oid, tid }) => {
      await fetch(`/api/v1/offspring/individuals/${oid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tid,
          name: null,
          collarColorName: null,
        }),
      });
    }, { oid: testOffspringId, tid: tenantId });

    await page.goto(`/offspring?offspringId=${testOffspringId}`);
    await page.waitForLoadState("networkidle");

    // Navigate to Step 3
    await page.click('button:has-text("Delete Offspring")');
    await page.click('button:has-text("Continue to Delete")');
    await page.click('button:has-text("Yes, Delete")');

    // Verify ID format is shown
    await expect(page.locator(`text=Offspring #${testOffspringId}`)).toBeVisible();

    // Type ID format to confirm
    const input = page.locator('input[placeholder="Type here..."]');
    await input.fill(`Offspring #${testOffspringId}`);

    const deleteButton = page.locator('button:has-text("Delete Permanently")');
    await expect(deleteButton).toBeEnabled();
  });

  test("should not show Danger Zone in edit mode", async ({ page }) => {
    await page.goto(`/offspring?offspringId=${testOffspringId}`);
    await page.waitForLoadState("networkidle");

    // Verify Danger Zone is visible in view mode
    await expect(page.locator("text=Danger Zone")).toBeVisible();

    // Switch to edit mode (if there's an Edit button)
    const editButton = page.locator('button:has-text("Edit")');
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(500);

      // Verify Danger Zone is hidden in edit mode
      await expect(page.locator("text=Danger Zone")).not.toBeVisible();
    }
  });
});

// ============================================================================
// Test Suite: Cleanup Verification
// ============================================================================

test.describe("Test Data Cleanup Verification", () => {
  test("should not leave orphaned test data", async ({ page }) => {
    await page.goto("/offspring");
    await page.waitForLoadState("networkidle");

    const tenantId = await getTenantId(page);

    // Create and immediately delete test data
    const group = await createTestOffspringGroup(page, tenantId);
    const offspring = await createTestOffspring(page, tenantId, group.id);

    // Delete offspring
    await deleteOffspringViaAPI(page, offspring.id, tenantId);

    // Delete group
    await deleteGroupViaAPI(page, group.id, tenantId);

    // Verify both are gone
    const offspringExists = await page.evaluate(async ({ oid, tid }) => {
      try {
        const res = await fetch(`/api/v1/offspring/individuals/${oid}?tenantId=${tid}`);
        return res.ok;
      } catch {
        return false;
      }
    }, { oid: offspring.id, tid: tenantId });

    const groupExists = await page.evaluate(async ({ gid, tid }) => {
      try {
        const res = await fetch(`/api/v1/offspring/${gid}?tenantId=${tid}`);
        return res.ok;
      } catch {
        return false;
      }
    }, { gid: group.id, tid: tenantId });

    expect(offspringExists).toBe(false);
    expect(groupExists).toBe(false);
  });
});
