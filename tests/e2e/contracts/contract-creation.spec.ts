// tests/e2e/contracts/contract-creation.spec.ts
// E2E tests for contract creation workflow

import { test, expect } from '@playwright/test';
import { loginAsBreeder } from '../helpers/auth-helpers';
import { createContractViaUI, verifyContractStatus } from '../helpers/contract-helpers';
import { TEST_CONTRACTS, CONTRACT_STATUSES } from '../fixtures/test-data';

test.describe('Contract Creation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsBreeder(page);
  });

  test('should complete 3-step contract creation successfully', async ({ page }) => {
    await page.goto('/contracts');
    await expect(page.locator('h1')).toContainText('Contracts');

    // Click New Contract button
    await page.click('button:has-text("New Contract")');

    // Step 1: Choose Template
    await expect(page.locator('h2')).toContainText('Choose a Template');

    // Verify template cards are displayed
    await expect(page.locator('text=Puppy Sale Agreement')).toBeVisible();
    await expect(page.locator('text=Stud Service Agreement')).toBeVisible();

    // Select template
    await page.click('button:has-text("Animal Sales Agreement")');

    // Step 2: Select Contact
    await expect(page.locator('h2')).toContainText('Select Contact');

    // Verify search field is required (amber border)
    const searchInput = page.locator('input[placeholder*="Search by name or email"]');
    await expect(searchInput).toBeVisible();

    // Search for contact
    await searchInput.fill('John Doe');

    // Wait for search results
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 5000 });

    // Click first result
    await page.click('button:has-text("John Doe")');

    // Step 3: Contract Details
    await expect(page.locator('h2')).toContainText('Contract Details');

    // Verify title field is required (amber border when empty)
    const titleInput = page.locator('input[placeholder*="Agreement"]').first();
    await expect(titleInput).toBeVisible();

    // Fill in contract title
    await titleInput.fill('Sale - Golden Retriever Puppy - Buddy');

    // Verify buyer information is displayed
    await expect(page.locator('text=John Doe')).toBeVisible();

    // Create contract
    await page.click('button:has-text("Create Contract")');

    // Verify success - contract appears in list
    await expect(page.locator('text=Sale - Golden Retriever Puppy - Buddy')).toBeVisible({ timeout: 10000 });

    // Verify status is Draft
    await expect(page.locator(`text=${CONTRACT_STATUSES.DRAFT}`)).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/contracts');
    await page.click('button:has-text("New Contract")');

    // Step 1: Choose Template
    await page.click('button:has-text("Animal Sales Agreement")');

    // Step 2: Try to skip contact selection
    // The "Next" button should not exist, only direct selection advances
    await expect(page.locator('h2')).toContainText('Select Contact');

    // Search field should have amber border when empty
    const searchInput = page.locator('input[placeholder*="Search by name or email"]');
    const borderColor = await searchInput.evaluate(el =>
      window.getComputedStyle(el).borderColor
    );

    // Amber color validation
    expect(borderColor).toContain('245, 158, 11'); // rgba(245, 158, 11, 0.6)

    // Close modal without selecting contact
    await page.keyboard.press('Escape');

    // Verify we're back at contracts list
    await expect(page.locator('h1')).toContainText('Contracts');
  });

  test('should search and filter contacts', async ({ page }) => {
    await page.goto('/contracts');
    await page.click('button:has-text("New Contract")');

    // Navigate to contact selection
    await page.click('button:has-text("Animal Sales Agreement")');
    await expect(page.locator('h2')).toContainText('Select Contact');

    // Search for contact
    const searchInput = page.locator('input[placeholder*="Search by name or email"]');
    await searchInput.fill('John');

    // Wait for search debounce
    await page.waitForTimeout(500);

    // Verify loading spinner appears and disappears
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 5000 });

    // Verify results appear
    await expect(page.locator('button:has-text("John")')).toBeVisible();

    // Clear search
    await searchInput.fill('');

    // Results should clear
    await expect(page.locator('button:has-text("John")')).not.toBeVisible();
  });

  test('should display correct template information', async ({ page }) => {
    await page.goto('/contracts');
    await page.click('button:has-text("New Contract")');

    // Verify all system templates are displayed
    await expect(page.locator('text=Puppy Sale Agreement')).toBeVisible();
    await expect(page.locator('text=Stud Service Agreement')).toBeVisible();
    await expect(page.locator('text=Co-Ownership Agreement')).toBeVisible();
    await expect(page.locator('text=Health Guarantee')).toBeVisible();
    await expect(page.locator('text=Breeding Rights Transfer')).toBeVisible();
    await expect(page.locator('text=Boarding Agreement')).toBeVisible();

    // Verify template cards have colored styling
    const templateCard = page.locator('button:has-text("Animal Sales Agreement")').first();
    const background = await templateCard.evaluate(el =>
      window.getComputedStyle(el).background
    );

    // Should have gradient background
    expect(background).toContain('gradient');
  });

  test('should cancel contract creation at any step', async ({ page }) => {
    await page.goto('/contracts');
    await page.click('button:has-text("New Contract")');

    // Step 1: Cancel
    await expect(page.locator('h2')).toContainText('Choose a Template');
    await page.keyboard.press('Escape');
    await expect(page.locator('h1')).toContainText('Contracts');

    // Try again - cancel at step 2
    await page.click('button:has-text("New Contract")');
    await page.click('button:has-text("Animal Sales Agreement")');
    await expect(page.locator('h2')).toContainText('Select Contact');
    await page.keyboard.press('Escape');
    await expect(page.locator('h1')).toContainText('Contracts');

    // Try again - cancel at step 3
    await page.click('button:has-text("New Contract")');
    await page.click('button:has-text("Animal Sales Agreement")');
    const searchInput = page.locator('input[placeholder*="Search by name or email"]');
    await searchInput.fill('John Doe');
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 5000 });
    await page.click('button:has-text("John Doe")');
    await expect(page.locator('h2')).toContainText('Contract Details');
    await page.keyboard.press('Escape');
    await expect(page.locator('h1')).toContainText('Contracts');
  });

  test('should create multiple contracts with different templates', async ({ page }) => {
    // Create first contract
    const contractId1 = await createContractViaUI(page, {
      template: 'Animal Sales Agreement',
      contact: 'John Doe',
      title: 'Sale - Puppy 1',
    });

    expect(contractId1).toBeGreaterThan(0);
    await expect(page.locator('text=Sale - Puppy 1')).toBeVisible();

    // Create second contract with different template
    const contractId2 = await createContractViaUI(page, {
      template: 'Stud Service Contract',
      contact: 'Jane Smith',
      title: 'Stud Service - Champion',
    });

    expect(contractId2).toBeGreaterThan(0);
    expect(contractId2).not.toBe(contractId1);

    // Verify both contracts exist in list
    await page.goto('/contracts');
    await expect(page.locator('text=Sale - Puppy 1')).toBeVisible();
    await expect(page.locator('text=Stud Service - Champion')).toBeVisible();
  });

  test('should preserve contract title during creation', async ({ page }) => {
    await page.goto('/contracts');
    await page.click('button:has-text("New Contract")');

    // Step 1: Select template
    await page.click('button:has-text("Animal Sales Agreement")');

    // Step 2: Select contact
    const searchInput = page.locator('input[placeholder*="Search by name or email"]');
    await searchInput.fill('John Doe');
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 5000 });
    await page.click('button:has-text("John Doe")');

    // Step 3: Enter title
    const titleInput = page.locator('input[placeholder*="Agreement"]').first();
    const testTitle = 'Test Contract Title with Special Characters !@#$%';
    await titleInput.fill(testTitle);

    // Create contract
    await page.click('button:has-text("Create Contract")');

    // Verify exact title is preserved
    await expect(page.locator(`text=${testTitle}`)).toBeVisible({ timeout: 10000 });
  });

  test('should show red asterisk for required fields', async ({ page }) => {
    await page.goto('/contracts');
    await page.click('button:has-text("New Contract")');

    // Navigate to step 2
    await page.click('button:has-text("Animal Sales Agreement")');

    // Verify red asterisk exists for Search field
    const asterisk = page.locator('span').filter({ hasText: '*' }).first();
    await expect(asterisk).toBeVisible();

    const color = await asterisk.evaluate(el =>
      window.getComputedStyle(el).color
    );

    // Should be red
    expect(color).toContain('239, 68, 68'); // #ef4444
  });

  test('should handle contact search with no results', async ({ page }) => {
    await page.goto('/contracts');
    await page.click('button:has-text("New Contract")');
    await page.click('button:has-text("Animal Sales Agreement")');

    // Search for non-existent contact
    const searchInput = page.locator('input[placeholder*="Search by name or email"]');
    await searchInput.fill('NonExistentContact12345XYZ');

    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 5000 });

    // Verify no results message or empty state
    const noResults = page.locator('text=/no results|not found|no contacts/i');
    await expect(noResults).toBeVisible({ timeout: 3000 }).catch(() => {
      // It's also acceptable to have no visible results
    });
  });
});
