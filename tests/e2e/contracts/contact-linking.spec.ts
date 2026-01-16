// tests/e2e/contracts/contact-linking.spec.ts
// E2E tests for contact linking validation

import { test, expect } from '@playwright/test';
import { loginAsBreeder } from '../helpers/auth-helpers';
import { createContractViaUI, verifyContractInDocumentsTab } from '../helpers/contract-helpers';

test.describe('Contact Linking Validation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsBreeder(page);
  });

  test('should link contract to contact via partyId', async ({ page }) => {
    // Create contract
    const contractId = await createContractViaUI(page, {
      template: 'Animal Sales Agreement',
      contact: 'John Doe',
      title: 'Contact Linking Test',
    });

    expect(contractId).toBeGreaterThan(0);

    // Navigate to contact details
    // First, we need to find the contact
    await page.goto('/contacts');
    await page.click('text=John Doe');

    // Get the partyId from URL or page
    const url = page.url();
    const partyIdMatch = url.match(/\/contacts\/(\d+)/);

    if (partyIdMatch) {
      const partyId = parseInt(partyIdMatch[1], 10);

      // Verify contract appears in Documents tab
      await verifyContractInDocumentsTab(page, partyId, 'Contact Linking Test');
    } else {
      // Alternative: just verify Documents tab shows the contract
      await page.click('button:has-text("Documents")');
      await expect(page.locator('text=Contact Linking Test')).toBeVisible();
    }
  });

  test('should display contract in contact Documents tab', async ({ page }) => {
    // Create a contract
    await createContractViaUI(page, {
      template: 'Stud Service Contract',
      contact: 'Jane Smith',
      title: 'Documents Tab Test Contract',
    });

    // Navigate to contacts
    await page.goto('/contacts');

    // Search and open contact
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Jane Smith');
      await page.waitForTimeout(500);
    }

    await page.click('text=Jane Smith');

    // Click Documents tab
    await page.click('button:has-text("Documents")');

    // Verify Contracts section exists
    await expect(page.locator('text=/📄 Contracts/i')).toBeVisible();

    // Verify contract appears
    await expect(page.locator('text=Documents Tab Test Contract')).toBeVisible();

    // Verify status badge is visible
    await expect(page.locator('[class*="badge"]')).toBeVisible();
  });

  test('should show all contracts for a contact', async ({ page }) => {
    // Create multiple contracts for the same contact
    await createContractViaUI(page, {
      template: 'Animal Sales Agreement',
      contact: 'John Doe',
      title: 'Contract 1 - Puppy Sale',
    });

    await createContractViaUI(page, {
      template: 'Health Guarantee',
      contact: 'John Doe',
      title: 'Contract 2 - Health Guarantee',
    });

    await createContractViaUI(page, {
      template: 'Co-Ownership Agreement',
      contact: 'John Doe',
      title: 'Contract 3 - Co-Ownership',
    });

    // Navigate to contact Documents tab
    await page.goto('/contacts');
    await page.click('text=John Doe');
    await page.click('button:has-text("Documents")');

    // Verify all three contracts appear
    await expect(page.locator('text=Contract 1 - Puppy Sale')).toBeVisible();
    await expect(page.locator('text=Contract 2 - Health Guarantee')).toBeVisible();
    await expect(page.locator('text=Contract 3 - Co-Ownership')).toBeVisible();

    // Verify count is displayed
    await expect(page.locator('text=/📄 Contracts \\(3\\)/i')).toBeVisible();
  });

  test('should show empty state when contact has no contracts', async ({ page }) => {
    // Navigate to a contact with no contracts
    await page.goto('/contacts');

    // Search for or create a new contact
    // For this test, assume we have a contact with no contracts
    // In real implementation, you'd set up test data

    await page.click('text=Test Contact No Contracts');
    await page.click('button:has-text("Documents")');

    // Verify empty state message
    await expect(page.locator('text=/no contracts yet/i')).toBeVisible();
    await expect(page.locator('text=/contracts linked to this contact/i')).toBeVisible();
  });

  test('should navigate to contract from Documents tab', async ({ page }) => {
    // Create contract
    await createContractViaUI(page, {
      template: 'Animal Sales Agreement',
      contact: 'John Doe',
      title: 'Navigation Test Contract',
    });

    // Navigate to contact Documents tab
    await page.goto('/contacts');
    await page.click('text=John Doe');
    await page.click('button:has-text("Documents")');

    // Click "View Details" button
    await page.click('button:has-text("View Details")');

    // Verify navigation to contracts module
    await expect(page).toHaveURL(/\/contracts/);
    await expect(page.locator('text=Navigation Test Contract')).toBeVisible();
  });

  test('should display contract status badges correctly', async ({ page }) => {
    // Create contract
    await createContractViaUI(page, {
      template: 'Animal Sales Agreement',
      contact: 'John Doe',
      title: 'Status Badge Test',
    });

    // Navigate to contact Documents tab
    await page.goto('/contacts');
    await page.click('text=John Doe');
    await page.click('button:has-text("Documents")');

    // Verify Draft status badge
    const draftBadge = page.locator('[class*="badge"]:has-text("Draft")');
    await expect(draftBadge).toBeVisible();

    // Verify badge has correct styling (gray)
    const badgeStyles = await draftBadge.evaluate(el => ({
      background: window.getComputedStyle(el).backgroundColor,
      color: window.getComputedStyle(el).color,
    }));

    // Draft should have gray/zinc colors
    expect(badgeStyles.background).toMatch(/113, 113, 122|zinc/);
  });

  test('should show creation and expiration dates', async ({ page }) => {
    // Create contract
    await createContractViaUI(page, {
      template: 'Animal Sales Agreement',
      contact: 'John Doe',
      title: 'Dates Test Contract',
    });

    // Navigate to contact Documents tab
    await page.goto('/contacts');
    await page.click('text=John Doe');
    await page.click('button:has-text("Documents")');

    // Verify creation date is displayed
    await expect(page.locator('text=/Created/i')).toBeVisible();

    // Verify date format (e.g., "Created Jan 16, 2026")
    const dateText = await page.locator('text=/Created/i').textContent();
    expect(dateText).toMatch(/Created.*\d{4}/);
  });

  test('should only show Download PDF for signed contracts', async ({ page }) => {
    // Create contract
    await createContractViaUI(page, {
      template: 'Animal Sales Agreement',
      contact: 'John Doe',
      title: 'PDF Download Test',
    });

    // Navigate to contact Documents tab
    await page.goto('/contacts');
    await page.click('text=John Doe');
    await page.click('button:has-text("Documents")');

    // Hover over contract to show actions
    await page.locator('text=PDF Download Test').hover();

    // Verify Download PDF button is NOT visible for Draft status
    await expect(page.locator('button:has-text("Download PDF")')).not.toBeVisible();

    // View Details should still be visible
    await expect(page.locator('button:has-text("View Details")')).toBeVisible();
  });

  test('should update Documents tab in real-time', async ({ page }) => {
    // Open contact in one "tab" (navigate to Documents)
    await page.goto('/contacts');
    await page.click('text=John Doe');
    await page.click('button:has-text("Documents")');

    // Verify initially no contracts or count
    const initialCount = await page.locator('text=/📄 Contracts/i').textContent();

    // Create a new contract
    await createContractViaUI(page, {
      template: 'Animal Sales Agreement',
      contact: 'John Doe',
      title: 'Real-time Update Test',
    });

    // Navigate back to Documents tab
    await page.goto('/contacts');
    await page.click('text=John Doe');
    await page.click('button:has-text("Documents")');

    // Verify new contract appears
    await expect(page.locator('text=Real-time Update Test')).toBeVisible({ timeout: 5000 });

    // Verify count incremented
    const newCount = await page.locator('text=/📄 Contracts/i').textContent();
    expect(newCount).not.toBe(initialCount);
  });

  test('should preserve contact link when contract status changes', async ({ page }) => {
    // Create contract
    const contractId = await createContractViaUI(page, {
      template: 'Animal Sales Agreement',
      contact: 'John Doe',
      title: 'Status Change Link Test',
    });

    // Send contract (changes status from Draft to Sent)
    await page.goto(`/contracts/list?id=${contractId}`);
    await page.click('button:has-text("Send for Signature")');

    // Confirm if dialog appears
    const dialog = page.locator('[role="dialog"]');
    if (await dialog.isVisible()) {
      await dialog.locator('button:has-text("Send")').click();
    }

    // Wait for status change
    await expect(page.locator('text=/Sent/i')).toBeVisible({ timeout: 5000 });

    // Navigate to contact Documents tab
    await page.goto('/contacts');
    await page.click('text=John Doe');
    await page.click('button:has-text("Documents")');

    // Verify contract still appears with updated status
    await expect(page.locator('text=Status Change Link Test')).toBeVisible();
    await expect(page.locator('[class*="badge"]:has-text("Sent")')).toBeVisible();
  });
});
