// tests/e2e/helpers/contract-helpers.ts
// Helper functions for contract E2E tests

import { Page, expect } from '@playwright/test';

export interface CreateContractOptions {
  template: string;
  contact: string;
  title: string;
}

/**
 * Creates a contract via the UI wizard flow
 * Returns the contract ID after successful creation
 */
export async function createContractViaUI(
  page: Page,
  options: CreateContractOptions
): Promise<number> {
  // Navigate to contracts page
  await page.goto('/contracts');
  await expect(page.locator('h1')).toContainText('Contracts');

  // Click "New Contract" button
  await page.click('button:has-text("New Contract")');

  // Step 1: Choose Template
  await expect(page.locator('h2')).toContainText('Choose a Template');
  await page.click(`button:has-text("${options.template}")`);

  // Step 2: Select Contact
  await expect(page.locator('h2')).toContainText('Select Contact');

  // Search for contact
  const searchInput = page.locator('input[placeholder*="Search by name or email"]');
  await searchInput.fill(options.contact);

  // Wait for search to complete (spinner disappears)
  await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 5000 });

  // Click the first matching contact
  await page.click(`button:has-text("${options.contact}")`);

  // Step 3: Contract Details
  await expect(page.locator('h2')).toContainText('Contract Details');

  // Fill in title
  const titleInput = page.locator('input[placeholder*="Agreement"]').first();
  await titleInput.fill(options.title);

  // Create contract
  await page.click('button:has-text("Create Contract")');

  // Wait for navigation and contract to appear in list
  await page.waitForSelector(`text=${options.title}`, { timeout: 10000 });

  // Extract contract ID from URL or page
  const url = page.url();
  const idMatch = url.match(/id=(\d+)/);
  if (idMatch) {
    return parseInt(idMatch[1], 10);
  }

  // Fallback: find the contract in the list and extract ID
  const contractRow = page.locator(`text=${options.title}`).first();
  await expect(contractRow).toBeVisible();

  // Click to view details and extract ID from URL
  await contractRow.click();
  const detailUrl = page.url();
  const detailIdMatch = detailUrl.match(/id=(\d+)/);
  if (detailIdMatch) {
    return parseInt(detailIdMatch[1], 10);
  }

  throw new Error('Could not extract contract ID after creation');
}

/**
 * Sends a contract for signature
 */
export async function sendContractViaUI(page: Page, contractId: number): Promise<void> {
  await page.goto(`/contracts/list?id=${contractId}`);
  await page.click('button:has-text("Send for Signature")');

  // Confirm in dialog if present
  const dialog = page.locator('[role="dialog"]');
  if (await dialog.isVisible()) {
    await dialog.locator('button:has-text("Send")').click();
  }

  // Wait for success message or status change
  await expect(page.locator('text=/sent|Sent/')).toBeVisible({ timeout: 5000 });
}

/**
 * Verifies contract appears in contact's Documents tab
 */
export async function verifyContractInDocumentsTab(
  page: Page,
  contactId: number,
  contractTitle: string
): Promise<void> {
  // Navigate to contact details
  await page.goto(`/contacts/${contactId}`);

  // Click Documents tab
  await page.click('button:has-text("Documents")');

  // Verify contracts section exists
  await expect(page.locator('text=/📄 Contracts/')).toBeVisible();

  // Verify specific contract appears
  await expect(page.locator(`text=${contractTitle}`)).toBeVisible();
}

/**
 * Signs a contract as a portal user
 */
export async function signContractAsPortalUser(
  page: Page,
  contractId: number,
  userName: string
): Promise<void> {
  // Navigate to portal signing page
  await page.goto(`/portal/contracts/${contractId}/sign`);

  // Wait for contract content to load
  await expect(page.locator('.contract-content')).toBeVisible({ timeout: 10000 });

  // Scroll to signature section
  await page.locator('text=/Sign this document/i').scrollIntoViewIfNeeded();

  // Fill in typed signature
  const signatureInput = page.locator('input[placeholder*="Type your full name"]');
  await signatureInput.fill(userName);

  // Check consent checkbox
  await page.check('input[type="checkbox"]');

  // Click sign button
  await page.click('button:has-text("Sign Document")');

  // Wait for success confirmation
  await expect(page.locator('text=/successfully signed|Signed successfully/i')).toBeVisible({
    timeout: 10000,
  });
}

/**
 * Verifies contract status badge
 */
export async function verifyContractStatus(
  page: Page,
  contractId: number,
  expectedStatus: string
): Promise<void> {
  await page.goto(`/contracts/list?id=${contractId}`);

  const statusBadge = page.locator(`[class*="badge"]:has-text("${expectedStatus}")`);
  await expect(statusBadge).toBeVisible();
}

/**
 * Downloads contract PDF and verifies it exists
 */
export async function downloadAndVerifyPDF(
  page: Page,
  contractId: number
): Promise<Buffer> {
  const downloadPromise = page.waitForEvent('download');

  await page.goto(`/contracts/list?id=${contractId}`);
  await page.click('button:has-text("Download PDF")');

  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);

  const buffer = await download.createReadStream().then(stream => {
    const chunks: Buffer[] = [];
    return new Promise<Buffer>((resolve, reject) => {
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  });

  expect(buffer.length).toBeGreaterThan(0);
  return buffer;
}

/**
 * Searches for a contract in the list
 */
export async function searchContract(
  page: Page,
  searchTerm: string
): Promise<void> {
  await page.goto('/contracts');

  const searchInput = page.locator('input[placeholder*="Search"]');
  if (await searchInput.isVisible()) {
    await searchInput.fill(searchTerm);
    await page.waitForTimeout(500); // Debounce delay
  }
}

/**
 * Voids a contract
 */
export async function voidContractViaUI(
  page: Page,
  contractId: number,
  reason?: string
): Promise<void> {
  await page.goto(`/contracts/list?id=${contractId}`);
  await page.click('button:has-text("Void")');

  // Fill in reason if provided
  if (reason) {
    const reasonInput = page.locator('textarea[placeholder*="reason"]');
    await reasonInput.fill(reason);
  }

  // Confirm void
  await page.click('button:has-text("Void Contract")');

  // Wait for status update
  await expect(page.locator('text=/voided|Voided/i')).toBeVisible({ timeout: 5000 });
}
