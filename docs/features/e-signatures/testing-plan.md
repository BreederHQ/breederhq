# E-Signatures Module - End-to-End Testing Plan

**Last Updated**: 2026-01-16
**Status**: Draft
**Testing Framework**: Playwright

## Overview

This document outlines the comprehensive end-to-end testing strategy for the e-signatures/contracts module, including UI workflows, API integration, notification delivery, and cross-module functionality.

## Test Environment Setup

### Prerequisites

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install

# Set up test database
npm run db:test:reset
npm run db:test:migrate
npm run db:test:seed:contracts
```

### Environment Configuration

```env
# .env.test
DATABASE_URL="postgresql://user:pass@localhost:5432/breederhq_test"
API_BASE_URL="http://localhost:6170"
PLATFORM_URL="http://app.breederhq.test:5180"
PORTAL_URL="http://portal.breederhq.test:5180"
SMTP_TEST_MODE=true
```

## Test Suite Structure

```
tests/
├── e2e/
│   ├── contracts/
│   │   ├── contract-creation.spec.ts
│   │   ├── contact-linking.spec.ts
│   │   ├── documents-tab.spec.ts
│   │   ├── portal-signing.spec.ts
│   │   ├── notifications.spec.ts
│   │   ├── pdf-generation.spec.ts
│   │   └── template-management.spec.ts
│   └── fixtures/
│       ├── test-data.ts
│       └── helpers.ts
└── playwright.config.ts
```

## Test Cases

### 1. Contract Creation Workflow

**File**: `tests/e2e/contracts/contract-creation.spec.ts`

#### 1.1 Three-Step Wizard Flow
```typescript
test.describe('Contract Creation Wizard', () => {
  test('should complete 3-step contract creation successfully', async ({ page }) => {
    // Setup: Login as breeder
    await page.goto('/contracts');
    await page.click('button:has-text("New Contract")');

    // Step 1: Template Selection
    await expect(page.locator('h2')).toContainText('Choose a Template');
    await page.click('button:has-text("Puppy Sale Agreement")');

    // Step 2: Contact Selection
    await expect(page.locator('h2')).toContainText('Select Contact');
    await page.fill('input[placeholder*="Search by name or email"]', 'John Doe');
    await page.waitForSelector('.animate-spin', { state: 'detached' }); // Wait for search
    await expect(page.locator('text=John Doe')).toBeVisible();
    await page.click('button:has-text("John Doe")');

    // Step 3: Contract Details
    await expect(page.locator('h2')).toContainText('Contract Details');
    await page.fill('input[placeholder*="Puppy Sale Agreement"]', 'Sale - Golden Retriever Puppy - Buddy');
    await expect(page.locator('text=John Doe')).toBeVisible(); // Verify buyer info

    // Submit
    await page.click('button:has-text("Create Contract")');
    await expect(page.locator('text=Sale - Golden Retriever Puppy - Buddy')).toBeVisible();
  });
});
```

#### 1.2 Required Field Validation
```typescript
test('should show amber borders for required empty fields', async ({ page }) => {
  await page.goto('/contracts');
  await page.click('button:has-text("New Contract")');

  // Select template
  await page.click('button:has-text("Puppy Sale Agreement")');

  // Step 2: Search should have amber border when empty
  const searchInput = page.locator('input[placeholder*="Search by name"]');
  const borderColor = await searchInput.evaluate(el =>
    window.getComputedStyle(el).borderColor
  );
  // Verify amber border: rgba(245, 158, 11, 0.6)
  expect(borderColor).toContain('245');
});
```

#### 1.3 Contact Search Functionality
```typescript
test('should search and filter contacts by name', async ({ page }) => {
  await page.goto('/contracts');
  await page.click('button:has-text("New Contract")');
  await page.click('button:has-text("Puppy Sale Agreement")');

  // Search by partial name
  await page.fill('input[placeholder*="Search"]', 'John');
  await page.waitForTimeout(400); // Debounce

  // Verify results
  await expect(page.locator('text=John Doe')).toBeVisible();
  await expect(page.locator('text=John Smith')).toBeVisible();

  // Refine search
  await page.fill('input[placeholder*="Search"]', 'John Doe');
  await page.waitForTimeout(400);
  await expect(page.locator('text=John Doe')).toBeVisible();
  await expect(page.locator('text=John Smith')).not.toBeVisible();
});

test('should search contacts by email', async ({ page }) => {
  await page.goto('/contracts');
  await page.click('button:has-text("New Contract")');
  await page.click('button:has-text("Puppy Sale Agreement")');

  await page.fill('input[placeholder*="Search"]', 'john.doe@example.com');
  await page.waitForTimeout(400);

  await expect(page.locator('text=john.doe@example.com')).toBeVisible();
});
```

#### 1.4 Error Handling
```typescript
test('should show error when creating contract without contact', async ({ page }) => {
  await page.goto('/contracts');
  await page.click('button:has-text("New Contract")');
  await page.click('button:has-text("Puppy Sale Agreement")');

  // Skip contact selection - try to submit empty
  await page.fill('input[placeholder*="Search"]', 'NonExistentUser');
  await page.waitForTimeout(400);

  // Should not allow proceeding without selection
  await expect(page.locator('button:has-text("Next")')).not.toBeVisible();
});
```

### 2. Contact Linking Validation

**File**: `tests/e2e/contracts/contact-linking.spec.ts`

#### 2.1 Party ID Linkage
```typescript
test('should link contract to contact via partyId', async ({ page, request }) => {
  // Create contract through UI
  await createContractViaUI(page, {
    template: 'Puppy Sale Agreement',
    contact: 'John Doe',
    title: 'Test Contract'
  });

  // Verify via API that partyId is set
  const response = await request.get('/api/v1/contracts?limit=1');
  const contracts = await response.json();

  expect(contracts.items[0].parties).toHaveLength(2);
  const buyerParty = contracts.items[0].parties.find(p => p.role === 'BUYER');
  expect(buyerParty.partyId).toBeDefined();
  expect(buyerParty.name).toBe('John Doe');
});
```

#### 2.2 Database Integrity
```typescript
test('should maintain referential integrity between contracts and parties', async ({ page }) => {
  // Create contract
  const contractId = await createContractViaUI(page, {
    template: 'Deposit Agreement',
    contact: 'Jane Smith',
    title: 'Deposit - Golden Retriever'
  });

  // Verify in database (using API)
  const response = await page.request.get(`/api/v1/contracts/${contractId}`);
  const contract = await response.json();

  const buyerParty = contract.parties.find(p => p.role === 'BUYER');

  // Verify party exists
  const partyResponse = await page.request.get(`/api/v1/parties/${buyerParty.partyId}`);
  expect(partyResponse.ok()).toBeTruthy();

  const party = await partyResponse.json();
  expect(party.party.displayName).toBe('Jane Smith');
});
```

### 3. Documents Tab Integration

**File**: `tests/e2e/contracts/documents-tab.spec.ts`

#### 3.1 Contract Display
```typescript
test('should display contracts in contact Documents tab', async ({ page }) => {
  // Setup: Create contract for John Doe
  await createContractViaUI(page, {
    template: 'Puppy Sale Agreement',
    contact: 'John Doe',
    title: 'Sale - Puppy - Buddy'
  });

  // Navigate to Contacts > John Doe > Documents tab
  await page.goto('/contacts');
  await page.fill('input[placeholder*="Search contacts"]', 'John Doe');
  await page.click('button:has-text("John Doe")');

  // Click Documents tab
  await page.click('button[role="tab"]:has-text("Documents")');

  // Verify contract appears
  await expect(page.locator('text=Sale - Puppy - Buddy')).toBeVisible();
  await expect(page.locator('text=Puppy Sale Agreement')).toBeVisible();
});
```

#### 3.2 Status Badges
```typescript
test('should display correct status badges', async ({ page }) => {
  await page.goto('/contacts');
  await page.click('text=John Doe');
  await page.click('button[role="tab"]:has-text("Documents")');

  // Draft status
  await expect(page.locator('.bg-zinc-500\\/20:has-text("Draft")')).toBeVisible();

  // Send contract
  await page.click('button:has-text("View Details")');
  await page.click('button:has-text("Send")');

  // Return to Documents tab
  await page.goto('/contacts');
  await page.click('text=John Doe');
  await page.click('button[role="tab"]:has-text("Documents")');

  // Sent status
  await expect(page.locator('.bg-amber-500\\/20:has-text("Sent")')).toBeVisible();
});
```

#### 3.3 Quick Actions
```typescript
test('should navigate to contract details from Documents tab', async ({ page }) => {
  await page.goto('/contacts');
  await page.click('text=John Doe');
  await page.click('button[role="tab"]:has-text("Documents")');

  // Click View Details
  await page.hover('text=Sale - Puppy - Buddy'); // Trigger hover for actions
  await page.click('button:has-text("View Details")');

  // Should navigate to contracts module
  await expect(page).toHaveURL(/\/contracts\/list\?id=\d+/);
  await expect(page.locator('text=Sale - Puppy - Buddy')).toBeVisible();
});

test('should download PDF for signed contracts', async ({ page }) => {
  // Setup: Create and sign contract
  const contractId = await createAndSignContract(page, {
    template: 'Puppy Sale Agreement',
    contact: 'John Doe',
    title: 'Signed Contract'
  });

  // Navigate to Documents tab
  await page.goto('/contacts');
  await page.click('text=John Doe');
  await page.click('button[role="tab"]:has-text("Documents")');

  // Download PDF
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Download PDF")')
  ]);

  expect(download.suggestedFilename()).toContain('.pdf');
});
```

#### 3.4 Empty State
```typescript
test('should show empty state when contact has no contracts', async ({ page }) => {
  // Create new contact with no contracts
  await createContact(page, { name: 'New User', email: 'new@example.com' });

  await page.goto('/contacts');
  await page.click('text=New User');
  await page.click('button[role="tab"]:has-text("Documents")');

  await expect(page.locator('text=No contracts yet')).toBeVisible();
  await expect(page.locator('text=Contracts linked to this contact will appear here')).toBeVisible();
});
```

### 4. Notification System

**File**: `tests/e2e/contracts/notifications.spec.ts`

#### 4.1 Email Notifications
```typescript
test.describe('Email Notifications', () => {
  test('should send email when contract is sent', async ({ page }) => {
    // Setup email capture
    const emailCapture = await setupEmailCapture();

    // Create and send contract
    await createContractViaUI(page, {
      template: 'Puppy Sale Agreement',
      contact: 'John Doe',
      title: 'Test Contract'
    });

    await page.click('button:has-text("Send Contract")');
    await page.click('button:has-text("Confirm")');

    // Wait for email
    const email = await emailCapture.waitForEmail({
      to: 'john.doe@example.com',
      timeout: 5000
    });

    // Verify email content
    expect(email.subject).toContain('Contract Ready for Signature');
    expect(email.html).toContain('Test Contract');
    expect(email.html).toContain('Puppy Sale Agreement');
    expect(email.html).toContain('portal.breederhq.test'); // Signing link
  });

  test('should send reminder emails at configured intervals', async ({ page }) => {
    const emailCapture = await setupEmailCapture();

    // Create contract expiring in 7 days
    const contractId = await createContractViaAPI({
      templateId: 1,
      title: 'Expiring Contract',
      expiresInDays: 7,
      reminderDays: [7, 3, 1]
    });

    // Run notification cron job
    await runCronJob('contract-reminders');

    // Verify 7-day reminder sent
    const reminder7d = await emailCapture.waitForEmail({
      subject: /7 days.*sign/i,
      timeout: 5000
    });
    expect(reminder7d.html).toContain('Expiring Contract');
  });

  test('should send signed notification to breeder', async ({ page }) => {
    const emailCapture = await setupEmailCapture();

    // Create and send contract
    const contractId = await createAndSendContract(page, {
      contact: 'John Doe',
      title: 'Puppy Sale'
    });

    // Sign as buyer (portal)
    await signContractAsPortalUser(page, contractId, 'John Doe');

    // Verify breeder receives notification
    const notification = await emailCapture.waitForEmail({
      to: 'breeder@example.com',
      subject: /signed/i,
      timeout: 5000
    });

    expect(notification.html).toContain('Puppy Sale');
    expect(notification.html).toContain('John Doe');
  });
});
```

#### 4.2 In-App Notifications
```typescript
test('should display notification alert when contract is signed', async ({ page, context }) => {
  // Breeder session
  const breederPage = page;

  // Buyer session (portal)
  const buyerPage = await context.newPage();

  // Create and send contract as breeder
  const contractId = await createAndSendContract(breederPage, {
    contact: 'John Doe',
    title: 'Test Contract'
  });

  // Sign as buyer
  await signContractAsPortalUser(buyerPage, contractId, 'John Doe');

  // Switch back to breeder page
  await breederPage.bringToFront();

  // Wait for notification bell/alert
  await expect(breederPage.locator('[data-testid="notification-badge"]')).toBeVisible();

  // Click notifications
  await breederPage.click('[data-testid="notifications-button"]');

  // Verify notification content
  await expect(breederPage.locator('text=Contract Signed')).toBeVisible();
  await expect(breederPage.locator('text=Test Contract')).toBeVisible();
  await expect(breederPage.locator('text=John Doe')).toBeVisible();
});
```

#### 4.3 Notification Types Coverage
```typescript
test('should send notification when contract is declined', async ({ page }) => {
  const emailCapture = await setupEmailCapture();

  const contractId = await createAndSendContract(page, {
    contact: 'John Doe',
    title: 'Declined Contract'
  });

  // Decline as buyer
  await declineContractAsPortalUser(page, contractId, 'John Doe', 'Not interested');

  // Verify breeder notification
  const email = await emailCapture.waitForEmail({
    to: 'breeder@example.com',
    subject: /declined/i
  });

  expect(email.html).toContain('Declined Contract');
  expect(email.html).toContain('Not interested');
});

test('should send notification when contract is voided', async ({ page }) => {
  const emailCapture = await setupEmailCapture();

  const contractId = await createAndSendContract(page, {
    contact: 'John Doe',
    title: 'Voided Contract'
  });

  // Void as breeder
  await page.goto(`/contracts/list?id=${contractId}`);
  await page.click('button:has-text("Void Contract")');
  await page.fill('textarea[placeholder*="reason"]', 'Changed plans');
  await page.click('button:has-text("Confirm Void")');

  // Verify buyer notification
  const email = await emailCapture.waitForEmail({
    to: 'john.doe@example.com',
    subject: /voided/i
  });

  expect(email.html).toContain('Voided Contract');
  expect(email.html).toContain('Changed plans');
});

test('should send notification when contract expires', async ({ page }) => {
  const emailCapture = await setupEmailCapture();

  // Create contract that expires immediately
  const contractId = await createContractViaAPI({
    templateId: 1,
    title: 'Expired Contract',
    expiresAt: new Date(Date.now() - 1000).toISOString() // 1 second ago
  });

  // Run expiration check cron
  await runCronJob('contract-expiration');

  // Verify both parties notified
  const breederEmail = await emailCapture.waitForEmail({
    to: 'breeder@example.com',
    subject: /expired/i
  });

  const buyerEmail = await emailCapture.waitForEmail({
    to: 'john.doe@example.com',
    subject: /expired/i
  });

  expect(breederEmail.html).toContain('Expired Contract');
  expect(buyerEmail.html).toContain('Expired Contract');
});
```

### 5. Portal Signing Flow

**File**: `tests/e2e/contracts/portal-signing.spec.ts`

#### 5.1 Complete Signing Flow
```typescript
test('should complete full portal signing workflow', async ({ page }) => {
  // Create and send contract as breeder
  const contractId = await createAndSendContract(page, {
    contact: 'John Doe',
    title: 'Puppy Sale Agreement - Buddy'
  });

  // Get signing link from email
  const emailCapture = await setupEmailCapture();
  const email = await emailCapture.getLatestEmail();
  const signingLink = extractLinkFromEmail(email.html, /sign/i);

  // Navigate to signing page (as buyer)
  await page.goto(signingLink);

  // Portal login
  await page.fill('input[type="email"]', 'john.doe@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("Sign In")');

  // Review contract
  await expect(page.locator('text=Puppy Sale Agreement - Buddy')).toBeVisible();
  await page.click('button:has-text("Review Contract")');

  // Scroll through contract
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  // Signature capture
  await page.click('button:has-text("Sign Contract")');

  // Typed signature
  await page.fill('input[placeholder*="Type your full name"]', 'John Doe');

  // Consent checkbox
  await page.check('input[type="checkbox"]');

  // Submit signature
  await page.click('button:has-text("Submit Signature")');

  // Success message
  await expect(page.locator('text=Contract Signed Successfully')).toBeVisible();
});
```

#### 5.2 Audit Trail Capture
```typescript
test('should capture audit trail during signing', async ({ page }) => {
  const contractId = await createAndSendContract(page, {
    contact: 'John Doe',
    title: 'Test Contract'
  });

  // Sign contract
  await signContractAsPortalUser(page, contractId, 'John Doe');

  // Verify audit events via API
  const response = await page.request.get(`/api/v1/contracts/${contractId}/events`);
  const events = await response.json();

  expect(events.items).toHaveLength(3); // sent, viewed, signed

  const signedEvent = events.items.find(e => e.status === 'signed');
  expect(signedEvent.ipAddress).toBeDefined();
  expect(signedEvent.userAgent).toContain('Mozilla');
  expect(signedEvent.at).toBeDefined();
});
```

### 6. PDF Generation

**File**: `tests/e2e/contracts/pdf-generation.spec.ts`

#### 6.1 PDF Creation After Signing
```typescript
test('should generate PDF with embedded signature', async ({ page }) => {
  const contractId = await createAndSignContract(page, {
    contact: 'John Doe',
    title: 'Signed Contract'
  });

  // Download PDF
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.goto(`/api/v1/contracts/${contractId}/pdf`)
  ]);

  const path = await download.path();

  // Verify PDF contains signature
  const pdfContent = await extractPdfText(path);
  expect(pdfContent).toContain('John Doe'); // Signature
  expect(pdfContent).toContain('Signed Contract');
  expect(pdfContent).toContain('AUDIT CERTIFICATE');
});
```

#### 6.2 Audit Footer
```typescript
test('should include audit certificate in PDF footer', async ({ page }) => {
  const contractId = await createAndSignContract(page, {
    contact: 'John Doe',
    title: 'Test Contract'
  });

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.goto(`/api/v1/contracts/${contractId}/pdf`)
  ]);

  const path = await download.path();
  const pdfContent = await extractPdfText(path);

  expect(pdfContent).toContain('AUDIT CERTIFICATE');
  expect(pdfContent).toContain('IP Address:');
  expect(pdfContent).toContain('Timestamp:');
  expect(pdfContent).toContain('Document Hash:');
});
```

### 7. UI Visual Regression

**File**: `tests/e2e/contracts/visual-regression.spec.ts`

```typescript
test('contract creation modal matches design', async ({ page }) => {
  await page.goto('/contracts');
  await page.click('button:has-text("New Contract")');

  await expect(page).toHaveScreenshot('contract-modal-step1.png');

  await page.click('button:has-text("Puppy Sale Agreement")');
  await expect(page).toHaveScreenshot('contract-modal-step2.png');
});

test('documents tab layout matches design', async ({ page }) => {
  await page.goto('/contacts');
  await page.click('text=John Doe');
  await page.click('button[role="tab"]:has-text("Documents")');

  await expect(page).toHaveScreenshot('documents-tab-with-contracts.png');
});
```

## Test Helpers & Fixtures

**File**: `tests/e2e/fixtures/helpers.ts`

```typescript
import { Page } from '@playwright/test';

export async function createContractViaUI(
  page: Page,
  options: {
    template: string;
    contact: string;
    title: string;
  }
): Promise<number> {
  await page.goto('/contracts');
  await page.click('button:has-text("New Contract")');

  // Step 1: Template
  await page.click(`button:has-text("${options.template}")`);

  // Step 2: Contact
  await page.fill('input[placeholder*="Search"]', options.contact);
  await page.waitForTimeout(400);
  await page.click(`button:has-text("${options.contact}")`);

  // Step 3: Details
  await page.fill('input[placeholder*="Contract Title"]', options.title);
  await page.click('button:has-text("Create Contract")');

  // Extract ID from URL
  await page.waitForURL(/\/contracts\/list\?id=(\d+)/);
  const url = page.url();
  const match = url.match(/id=(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

export async function setupEmailCapture() {
  // Implement email capture logic (MailHog, SMTP mock, etc.)
  return {
    async waitForEmail(options: { to?: string; subject?: RegExp; timeout?: number }) {
      // Implementation
    },
    async getLatestEmail() {
      // Implementation
    }
  };
}

export async function signContractAsPortalUser(
  page: Page,
  contractId: number,
  userName: string
) {
  const signingUrl = `http://portal.breederhq.test:5180/contracts/${contractId}/sign`;
  await page.goto(signingUrl);

  // Sign in if needed
  if (await page.isVisible('input[type="email"]')) {
    await page.fill('input[type="email"]', `${userName.toLowerCase().replace(' ', '.')}@example.com`);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
  }

  // Complete signature
  await page.fill('input[placeholder*="Type your full name"]', userName);
  await page.check('input[type="checkbox"]');
  await page.click('button:has-text("Submit Signature")');
}
```

## Test Data Setup

**File**: `tests/e2e/fixtures/test-data.ts`

```typescript
export const TEST_CONTACTS = [
  { id: 1, name: 'John Doe', email: 'john.doe@example.com', partyId: 100 },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', partyId: 101 },
  { id: 3, name: 'Bob Johnson', email: 'bob.johnson@example.com', partyId: 102 },
];

export const TEST_TEMPLATES = [
  { id: 1, name: 'Puppy Sale Agreement', type: 'SYSTEM', category: 'SALES_AGREEMENT' },
  { id: 2, name: 'Deposit Agreement', type: 'SYSTEM', category: 'DEPOSIT_AGREEMENT' },
  { id: 3, name: 'Co-Ownership Agreement', type: 'SYSTEM', category: 'CO_OWNERSHIP' },
];
```

## Playwright Configuration

**File**: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://app.breederhq.test:5180',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://app.breederhq.test:5180',
    reuseExistingServer: !process.env.CI,
  },
});
```

## CI/CD Integration

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests - Contracts Module

on:
  push:
    branches: [main, dev]
  pull_request:
    paths:
      - 'apps/contracts/**'
      - 'apps/contacts/src/components/ContractsSection.tsx'
      - 'tests/e2e/contracts/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Setup test database
        run: |
          npm run db:test:reset
          npm run db:test:migrate
          npm run db:test:seed:contracts

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e:contracts

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## Test Execution Commands

```bash
# Run all contract tests
npm run test:e2e:contracts

# Run specific test file
npx playwright test tests/e2e/contracts/contract-creation.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Run specific test
npx playwright test -g "should complete 3-step contract creation"

# Generate test report
npx playwright show-report
```

## Success Criteria

All tests must pass with:
- ✅ 100% pass rate on critical path tests
- ✅ < 30 seconds total execution time
- ✅ Zero accessibility violations (axe-core)
- ✅ No console errors during test execution
- ✅ Email notifications delivered within 5 seconds
- ✅ PDF generation completes within 3 seconds
- ✅ All API responses < 500ms

## Test Coverage Goals

- **Contract Creation**: 100% coverage
- **Contact Linking**: 100% coverage
- **Documents Tab**: 100% coverage
- **Portal Signing**: 100% coverage
- **Notifications**: 100% coverage (all 8 types)
- **PDF Generation**: 100% coverage

## Known Limitations

1. **Email Testing**: Requires SMTP mock server (MailHog recommended)
2. **Cron Jobs**: Manual trigger needed in tests
3. **Multi-tenancy**: Tests run against single tenant
4. **File Uploads**: Signature image upload tests require file fixtures

## Next Steps

1. [ ] Implement email capture infrastructure
2. [ ] Create seed data scripts for test database
3. [ ] Set up visual regression baseline images
4. [ ] Configure CI/CD pipeline
5. [ ] Document manual test cases for edge scenarios
6. [ ] Create performance benchmark tests
