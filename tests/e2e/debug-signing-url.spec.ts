// Quick debug to check what URL the signing page navigates to

import { test, expect } from '@playwright/test';
import { loginAsBreeder, loginAsPortalUser, logout } from './helpers/auth-helpers';
import { createContractViaUI, sendContractViaUI } from './helpers/contract-helpers';
import { TEST_USERS } from './fixtures/test-data';

const PORTAL_URL = process.env.PORTAL_URL || 'http://portal.breederhq.test';

test('debug signing URL', async ({ page }) => {
  test.setTimeout(120000);

  // Create and send a contract
  await loginAsBreeder(page);
  const uniqueTitle = `Debug URL Test ${Date.now()}`;

  const contractId = await createContractViaUI(page, {
    template: 'Animal Sales Agreement',
    contact: TEST_USERS.buyer.name,
    title: uniqueTitle,
  });

  console.log('Contract ID:', contractId);

  await sendContractViaUI(page, contractId, uniqueTitle);

  // Logout and login as portal user
  await logout(page);
  await loginAsPortalUser(page);

  console.log('Portal URL after login:', page.url());

  // Extract tenant slug
  const currentUrl = page.url();
  const tenantMatch = currentUrl.match(/\/t\/([^/]+)/);
  const tenantSlug = tenantMatch ? tenantMatch[1] : 'dev-hogwarts';

  console.log('Tenant slug:', tenantSlug);

  // First check agreements page
  await page.goto(`${PORTAL_URL}/t/${tenantSlug}/agreements`);
  await page.waitForLoadState('networkidle');
  console.log('Agreements page URL:', page.url());

  await page.screenshot({ path: 'debug-agreements.png' });

  // Check if the contract is visible in agreements
  const contractVisible = await page.locator(`text=${uniqueTitle}`).isVisible().catch(() => false);
  console.log('Contract visible in agreements:', contractVisible);

  // Now try to navigate to the signing page
  const signingUrl = `${PORTAL_URL}/t/${tenantSlug}/contracts/${contractId}/sign`;
  console.log('Navigating to signing URL:', signingUrl);

  await page.goto(signingUrl);
  await page.waitForLoadState('networkidle');

  console.log('Final URL:', page.url());

  await page.screenshot({ path: 'debug-signing.png' });

  // Log page content
  const bodyText = await page.locator('body').textContent();
  console.log('Page content preview:', bodyText?.substring(0, 500));
});
