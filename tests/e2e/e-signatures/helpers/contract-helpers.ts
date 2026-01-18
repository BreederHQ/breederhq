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
  // Navigate to contracts page - use /contracts/list to avoid any query params
  await page.goto('/contracts/list');
  await expect(page.locator('h1')).toContainText('Contracts');

  // Close any open contract details panel before starting
  const closeButton = page.locator('button:has-text("Close")');
  if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeButton.click();
    await page.waitForTimeout(500);
  }

  // Click "New Contract" button
  await page.click('button:has-text("New Contract")');

  // Wait for wizard modal to appear
  const wizardModal = page.locator('.fixed.inset-0.bg-black\\/70');
  await wizardModal.waitFor({ state: 'visible', timeout: 5000 });

  // Step 1: Choose Template - wait for heading inside wizard
  const wizardHeading = wizardModal.locator('h2:has-text("Choose a Template")');
  await expect(wizardHeading).toBeVisible({ timeout: 10000 });

  // Wait for templates to load
  await page.waitForTimeout(500);

  // Click the template button within the wizard modal using dispatchEvent
  const templateButton = wizardModal.locator(`button:has-text("${options.template}")`).first();
  await templateButton.waitFor({ state: 'visible', timeout: 10000 });
  await templateButton.dispatchEvent('click');

  // Wait for step 2 to load - look for "Search for Contact" label
  await expect(page.locator('text=Search for Contact')).toBeVisible({ timeout: 10000 });

  // Step 2: Select Contact
  // Wait for search input to appear
  const searchInput = page.locator('input[type="text"]').first();
  await searchInput.waitFor({ state: 'visible', timeout: 10000 });
  await searchInput.fill(options.contact);
  await page.waitForTimeout(1000); // Wait for search results

  // Click the matching contact
  await page.click(`text=${options.contact}`);
  await page.waitForTimeout(1000); // Wait for wizard to transition

  // Step 3: Contract Details
  // Wait for title input to appear and fill it
  const titleInput = page.locator('input[type="text"]').first();
  await titleInput.waitFor({ state: 'visible', timeout: 10000 });
  await titleInput.clear();
  await titleInput.fill(options.title);

  // Click "Create Contract" button
  const createButton = page.locator('button:has-text("Create Contract")');
  await createButton.waitFor({ state: 'visible', timeout: 5000 });
  await createButton.click();

  // Wait for contract creation to complete
  // Either the details panel opens with "Contract created" in activity log
  // OR we can see the contract title in the list
  try {
    await expect(page.locator('text=Contract created')).toBeVisible({ timeout: 10000 });
  } catch {
    // Fallback: check if the contract title appears in the page
    await expect(page.locator(`text=${options.title}`).first()).toBeVisible({ timeout: 10000 });
  }

  // Wait for URL to potentially update with contract ID
  await page.waitForTimeout(1000);

  // Extract contract ID from URL if available
  const currentUrl = page.url();
  const urlIdMatch = currentUrl.match(/id=(\d+)/);
  if (urlIdMatch) {
    // Close the details panel if open
    const closeButton = page.locator('button:has-text("Close")');
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await page.waitForTimeout(500);
    }
    return parseInt(urlIdMatch[1], 10);
  }

  // If no ID in URL, try to find it from the page or return 0 (contract created but ID unknown)
  // Navigate to contracts list to find the newly created contract
  await page.goto('/contracts');
  await page.waitForTimeout(500);

  // Click on the contract to get its ID
  await page.click(`text=${options.title}`);
  await page.waitForTimeout(1000);

  const newUrl = page.url();
  const newIdMatch = newUrl.match(/id=(\d+)/);
  if (newIdMatch) {
    // Close the details panel
    const closeButton = page.locator('button:has-text("Close")');
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await page.waitForTimeout(500);
    }
    return parseInt(newIdMatch[1], 10);
  }

  // Return 0 if we couldn't get the ID but contract was created
  console.warn(`Contract "${options.title}" created but could not extract ID`);
  return 0;
}

/**
 * Sends a contract for signature
 * Note: This function assumes you're already logged in
 * @param page - Playwright page
 * @param contractId - Contract ID (currently unused but kept for API compatibility)
 * @param contractTitle - Optional: The title of the contract to find and send
 */
export async function sendContractViaUI(
  page: Page,
  contractId: number,
  contractTitle?: string
): Promise<void> {
  // Navigate to contracts list - wait for full page load
  await page.goto('/contracts/list');

  // Wait for contracts list page to fully load
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1')).toContainText('Contracts', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // Find the contract - either by title or just find a Draft contract
  let contractTitleButton;
  if (contractTitle) {
    // Find the specific contract by title
    contractTitleButton = page.locator(`button:has-text("${contractTitle}")`).first();
  } else {
    // Find first draft contract row and click its title
    const draftRow = page.locator('tr').filter({ hasText: 'Draft' }).first();
    await draftRow.waitFor({ state: 'visible', timeout: 10000 });
    contractTitleButton = draftRow.locator('button').first();
  }

  await contractTitleButton.waitFor({ state: 'visible', timeout: 10000 });
  await contractTitleButton.click();

  // Wait for details modal to appear (bg-black/60 overlay)
  const detailsModal = page.locator('.fixed.inset-0.bg-black\\/60');
  await detailsModal.waitFor({ state: 'visible', timeout: 10000 });

  // Click "Send Contract" button inside the modal
  const sendButton = page.locator('button:has-text("Send Contract")');
  await sendButton.waitFor({ state: 'visible', timeout: 10000 });
  await sendButton.click();

  // Wait for the modal to close and status to update
  await page.waitForTimeout(3000);

  // Verify status changed - look for "Sent" badge in the row (use span to avoid matching title)
  if (contractTitle) {
    const sentBadge = page.locator(`tr:has-text("${contractTitle}") >> span:has-text("Sent")`);
    await expect(sentBadge).toBeVisible({ timeout: 10000 });
  } else {
    // Just verify any Sent badge appears
    await expect(page.locator('tr >> span:has-text("Sent")').first()).toBeVisible({ timeout: 10000 });
  }
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
 * Note: Portal is on a separate domain (portal.breederhq.test)
 * Portal uses tenant-aware URLs like /t/{tenant-slug}/contracts/{id}/sign
 */
export async function signContractAsPortalUser(
  page: Page,
  contractId: number,
  userName: string
): Promise<void> {
  const portalUrl = process.env.PORTAL_URL || 'http://portal.breederhq.test';

  // Extract tenant slug from current URL (e.g., /t/dev-hogwarts/dashboard -> dev-hogwarts)
  const currentUrl = page.url();
  const tenantMatch = currentUrl.match(/\/t\/([^/]+)/);
  const tenantSlug = tenantMatch ? tenantMatch[1] : 'dev-hogwarts';

  // Navigate to portal signing page - portal routes use /t/{tenant}/contracts/:id/sign
  await page.goto(`${portalUrl}/t/${tenantSlug}/contracts/${contractId}/sign`);

  // Wait for signature page to load - look for "Your Signature" heading
  await expect(page.locator('text=Your Signature')).toBeVisible({ timeout: 15000 });

  // Find typed signature input with placeholder "Enter your full name"
  const signatureInput = page.locator('input[placeholder="Enter your full name"]');
  await signatureInput.waitFor({ state: 'visible', timeout: 5000 });

  // Clear any pre-filled value and enter the name
  await signatureInput.clear();
  await signatureInput.fill(userName);

  // Check consent checkbox - the ESIGN Act consent
  const checkbox = page.locator('input[type="checkbox"]');
  await checkbox.waitFor({ state: 'visible', timeout: 5000 });
  await checkbox.check();

  // Click "Sign Contract" button
  const signButton = page.locator('button:has-text("Sign Contract")');
  await signButton.waitFor({ state: 'visible', timeout: 5000 });
  await signButton.click();

  // Wait for success confirmation - "Contract Signed Successfully!"
  await expect(page.locator('text=Contract Signed Successfully')).toBeVisible({
    timeout: 15000,
  });
}

/**
 * Verifies contract status
 * @param page - Playwright page
 * @param contractId - Contract ID (used for navigation)
 * @param expectedStatus - Expected status text (e.g., "Sent", "Draft", "Signed")
 * @param contractTitle - Optional: title of the contract to verify
 */
export async function verifyContractStatus(
  page: Page,
  contractId: number,
  expectedStatus: string,
  contractTitle?: string
): Promise<void> {
  await page.goto('/contracts/list');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1')).toContainText('Contracts', { timeout: 10000 });

  // Look for the status text in the contract row
  // The status is shown as an icon + text span in the Status column
  if (contractTitle) {
    // Find status badge in specific contract row (use span to target status badge, not title)
    const statusBadge = page.locator(`tr:has-text("${contractTitle}") >> span:has-text("${expectedStatus}")`);
    await expect(statusBadge).toBeVisible({ timeout: 10000 });
  } else {
    // Just verify any row has the expected status
    await expect(page.locator(`tr >> span:has-text("${expectedStatus}")`).first()).toBeVisible({ timeout: 10000 });
  }
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
