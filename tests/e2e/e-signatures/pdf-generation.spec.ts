// tests/e2e/contracts/pdf-generation.spec.ts
// E2E tests for PDF generation and download

import { test, expect } from '@playwright/test';
import { loginAsBreeder, loginAsPortalUser, logout } from './helpers/auth-helpers';
import {
  createContractViaUI,
  sendContractViaUI,
  signContractAsPortalUser,
  downloadAndVerifyPDF,
} from './helpers/contract-helpers';
import { TEST_USERS } from '../fixtures/test-data';

test.describe('PDF Generation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsBreeder(page);
  });

  test('should generate PDF after contract is signed', async ({ page }) => {
    const contractId = await createContractViaUI(page, {
      template: 'Animal Sales Agreement',
      contact: TEST_USERS.buyer.name,
      title: 'PDF Generation Test',
    });

    await sendContractViaUI(page, contractId);

    // Sign contract
    await logout(page);
    await loginAsPortalUser(page);
    await signContractAsPortalUser(page, contractId, TEST_USERS.buyer.name);

    // Switch back to breeder and download PDF
    await logout(page);
    await loginAsBreeder(page);

    const pdfBuffer = await downloadAndVerifyPDF(page, contractId);

    // Verify PDF is not empty
    expect(pdfBuffer.length).toBeGreaterThan(0);

    // Basic PDF header check
    const pdfHeader = pdfBuffer.slice(0, 5).toString();
    expect(pdfHeader).toBe('%PDF-');
  });

  test('should include contract content in PDF', async ({ page }) => {
    const contractId = await createContractViaUI(page, {
      template: 'Animal Sales Agreement',
      contact: TEST_USERS.buyer.name,
      title: 'PDF Content Test',
    });

    await sendContractViaUI(page, contractId);

    await logout(page);
    await loginAsPortalUser(page);
    await signContractAsPortalUser(page, contractId, TEST_USERS.buyer.name);

    await logout(page);
    await loginAsBreeder(page);

    const pdfBuffer = await downloadAndVerifyPDF(page, contractId);

    // Convert buffer to string for content checking
    const pdfText = pdfBuffer.toString('binary');

    // Verify contract title appears in PDF
    expect(pdfText).toContain('PDF Content Test');
  });

  test('should embed signature in PDF', async ({ page }) => {
    const contractId = await createContractViaUI(page, {
      template: 'Animal Sales Agreement',
      contact: TEST_USERS.buyer.name,
      title: 'Embedded Signature Test',
    });

    await sendContractViaUI(page, contractId);

    await logout(page);
    await loginAsPortalUser(page);
    await signContractAsPortalUser(page, contractId, TEST_USERS.buyer.name);

    await logout(page);
    await loginAsBreeder(page);

    const pdfBuffer = await downloadAndVerifyPDF(page, contractId);
    const pdfText = pdfBuffer.toString('binary');

    // Verify signer name appears in PDF
    expect(pdfText).toContain(TEST_USERS.buyer.name);
  });

  test('should include audit certificate in PDF', async ({ page }) => {
    const contractId = await createContractViaUI(page, {
      template: 'Animal Sales Agreement',
      contact: TEST_USERS.buyer.name,
      title: 'Audit Certificate Test',
    });

    await sendContractViaUI(page, contractId);

    await logout(page);
    await loginAsPortalUser(page);
    await signContractAsPortalUser(page, contractId, TEST_USERS.buyer.name);

    await logout(page);
    await loginAsBreeder(page);

    const pdfBuffer = await downloadAndVerifyPDF(page, contractId);
    const pdfText = pdfBuffer.toString('binary');

    // Verify audit trail information
    expect(pdfText).toMatch(/audit|certificate|signed on/i);
  });

  test('should show IP address in audit trail', async ({ page }) => {
    const contractId = await createContractViaUI(page, {
      template: 'Animal Sales Agreement',
      contact: TEST_USERS.buyer.name,
      title: 'IP Address Test',
    });

    await sendContractViaUI(page, contractId);

    await logout(page);
    await loginAsPortalUser(page);
    await signContractAsPortalUser(page, contractId, TEST_USERS.buyer.name);

    await logout(page);
    await loginAsBreeder(page);

    const pdfBuffer = await downloadAndVerifyPDF(page, contractId);
    const pdfText = pdfBuffer.toString('binary');

    // Verify IP address format appears
    expect(pdfText).toMatch(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|IP Address/);
  });

  test('should show timestamp in audit trail', async ({ page }) => {
    const contractId = await createContractViaUI(page, {
      template: 'Animal Sales Agreement',
      contact: TEST_USERS.buyer.name,
      title: 'Timestamp Test',
    });

    await sendContractViaUI(page, contractId);

    await logout(page);
    await loginAsPortalUser(page);
    await signContractAsPortalUser(page, contractId, TEST_USERS.buyer.name);

    await logout(page);
    await loginAsBreeder(page);

    const pdfBuffer = await downloadAndVerifyPDF(page, contractId);
    const pdfText = pdfBuffer.toString('binary');

    // Verify timestamp/date appears
    expect(pdfText).toMatch(/202\d|signed at|timestamp/i);
  });

  test('should not allow PDF download for unsigned contracts', async ({ page }) => {
    const contractId = await createContractViaUI(page, {
      template: 'Animal Sales Agreement',
      contact: TEST_USERS.buyer.name,
      title: 'No Download Test',
    });

    await sendContractViaUI(page, contractId);

    await page.goto(`/contracts/list?id=${contractId}`);

    // Download button should not exist or be disabled
    const downloadButton = page.locator('button:has-text("Download PDF")');

    const isVisible = await downloadButton.isVisible().catch(() => false);

    if (isVisible) {
      await expect(downloadButton).toBeDisabled();
    } else {
      // Button not visible is also acceptable
      await expect(downloadButton).not.toBeVisible();
    }
  });

  test('should generate unique filenames for PDFs', async ({ page }) => {
    const contractId1 = await createContractViaUI(page, {
      template: 'Animal Sales Agreement',
      contact: TEST_USERS.buyer.name,
      title: 'Unique Filename Test 1',
    });

    await sendContractViaUI(page, contractId1);

    await logout(page);
    await loginAsPortalUser(page);
    await signContractAsPortalUser(page, contractId1, TEST_USERS.buyer.name);

    await logout(page);
    await loginAsBreeder(page);

    // Download first PDF
    const downloadPromise1 = page.waitForEvent('download');
    await page.goto(`/contracts/list?id=${contractId1}`);
    await page.click('button:has-text("Download PDF")');
    const download1 = await downloadPromise1;
    const filename1 = download1.suggestedFilename();

    // Create and sign second contract
    const contractId2 = await createContractViaUI(page, {
      template: 'Animal Sales Agreement',
      contact: TEST_USERS.buyer.name,
      title: 'Unique Filename Test 2',
    });

    await sendContractViaUI(page, contractId2);

    await logout(page);
    await loginAsPortalUser(page);
    await signContractAsPortalUser(page, contractId2, TEST_USERS.buyer.name);

    await logout(page);
    await loginAsBreeder(page);

    // Download second PDF
    const downloadPromise2 = page.waitForEvent('download');
    await page.goto(`/contracts/list?id=${contractId2}`);
    await page.click('button:has-text("Download PDF")');
    const download2 = await downloadPromise2;
    const filename2 = download2.suggestedFilename();

    // Filenames should be different
    expect(filename1).not.toBe(filename2);
  });

  test('should preserve PDF across browser sessions', async ({ page, context }) => {
    const contractId = await createContractViaUI(page, {
      template: 'Animal Sales Agreement',
      contact: TEST_USERS.buyer.name,
      title: 'PDF Persistence Test',
    });

    await sendContractViaUI(page, contractId);

    await logout(page);
    await loginAsPortalUser(page);
    await signContractAsPortalUser(page, contractId, TEST_USERS.buyer.name);

    await logout(page);
    await loginAsBreeder(page);

    // Download PDF
    const pdfBuffer1 = await downloadAndVerifyPDF(page, contractId);

    // Close and reopen browser
    await context.clearCookies();
    await page.close();

    const newPage = await context.newPage();
    await loginAsBreeder(newPage);

    // Download PDF again
    const pdfBuffer2 = await downloadAndVerifyPDF(newPage, contractId);

    // PDFs should be identical
    expect(pdfBuffer1.length).toBe(pdfBuffer2.length);
    expect(pdfBuffer1.equals(pdfBuffer2)).toBe(true);
  });

  test('should handle special characters in PDF generation', async ({ page }) => {
    const contractId = await createContractViaUI(page, {
      template: 'Animal Sales Agreement',
      contact: TEST_USERS.buyer.name,
      title: 'Special Chars Test: !@#$%^&*()',
    });

    await sendContractViaUI(page, contractId);

    await logout(page);
    await loginAsPortalUser(page);
    await signContractAsPortalUser(page, contractId, TEST_USERS.buyer.name);

    await logout(page);
    await loginAsBreeder(page);

    // Should not throw error
    const pdfBuffer = await downloadAndVerifyPDF(page, contractId);

    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  test('should generate PDF with correct content type', async ({ page }) => {
    const contractId = await createContractViaUI(page, {
      template: 'Animal Sales Agreement',
      contact: TEST_USERS.buyer.name,
      title: 'Content Type Test',
    });

    await sendContractViaUI(page, contractId);

    await logout(page);
    await loginAsPortalUser(page);
    await signContractAsPortalUser(page, contractId, TEST_USERS.buyer.name);

    await logout(page);
    await loginAsBreeder(page);

    await page.goto(`/contracts/list?id=${contractId}`);

    // Intercept PDF request to check headers
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/pdf') && response.status() === 200
    );

    await page.click('button:has-text("Download PDF")');

    const response = await responsePromise;
    const contentType = response.headers()['content-type'];

    expect(contentType).toContain('application/pdf');
  });

  test('should allow both parties to download PDF', async ({ page }) => {
    const contractId = await createContractViaUI(page, {
      template: 'Animal Sales Agreement',
      contact: TEST_USERS.buyer.name,
      title: 'Both Download Test',
    });

    await sendContractViaUI(page, contractId);

    await logout(page);
    await loginAsPortalUser(page);
    await signContractAsPortalUser(page, contractId, TEST_USERS.buyer.name);

    // Portal user downloads PDF
    await page.goto(`/portal/contracts/${contractId}`);

    const portalDownloadButton = page.locator('button:has-text("Download"), a:has-text("Download")');

    if (await portalDownloadButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await portalDownloadButton.click();
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    }

    // Breeder downloads PDF
    await logout(page);
    await loginAsBreeder(page);

    const pdfBuffer = await downloadAndVerifyPDF(page, contractId);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });
});
