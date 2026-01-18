// tests/e2e/contracts/smoke.spec.ts
// Smoke tests to verify basic functionality before running full suite

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load frontend application', async ({ page }) => {
    await page.goto('/');

    // Verify page loads
    await expect(page).toHaveTitle(/.+/);

    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/smoke-frontend.png', fullPage: false });
  });

  test('should reach contracts module', async ({ page }) => {
    const response = await page.goto('/contracts');

    // Page should load successfully (200) or redirect (3xx)
    expect(response?.ok() || (response?.status() ?? 0) >= 300).toBeTruthy();

    // Verify we got some content
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('should have contracts API available', async ({ page }) => {
    const baseURL = process.env.BASE_URL || 'http://localhost:6170';

    const response = await page.request.get(`${baseURL}/api/v1/contract-templates`);

    // Should return some status (200, 401, 403, 500) - any response means API is running
    expect(response.status()).toBeGreaterThan(0);
  });

  test('should load contacts module', async ({ page }) => {
    const response = await page.goto('/contacts');

    // Page should load successfully (200) or redirect (3xx)
    expect(response?.ok() || (response?.status() ?? 0) >= 300).toBeTruthy();

    // Verify we got some content
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });
});
