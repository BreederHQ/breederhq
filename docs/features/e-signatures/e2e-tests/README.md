# E2E Tests for Contracts Module

Comprehensive end-to-end tests for the BreederHQ Contracts module using Playwright.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install
```

### 3. Configure Environment

Copy the example environment file:

```bash
cp tests/e2e/.env.example tests/e2e/.env
```

Edit `.env` and update with your test environment values.

### 4. Set Up Test Database

Create a separate test database and run migrations:

```bash
# From breederhq-api directory
npm run db:test:migrate
npm run db:test:seed:contracts
```

### 5. Set Up Email Capture

Install and run MailHog or smtp4dev for capturing test emails:

**Using MailHog:**
```bash
# macOS
brew install mailhog
mailhog

# Windows (download from GitHub releases)
mailhog.exe

# Access UI at http://localhost:8025
```

**Using smtp4dev:**
```bash
docker run -p 8025:80 -p 2525:25 rnwood/smtp4dev
```

### 6. Create Test Users

Seed the test database with test users:

```sql
-- Breeder user
INSERT INTO users (email, password_hash, role, tenant_id)
VALUES ('test.breeder@example.com', '$2a$10$...', 'BREEDER', 1);

-- Portal users (buyers)
INSERT INTO users (email, password_hash, role, tenant_id)
VALUES ('test.buyer@example.com', '$2a$10$...', 'PORTAL', 1);

INSERT INTO parties (display_name, primary_email, type, tenant_id)
VALUES ('John Doe', 'test.buyer@example.com', 'INDIVIDUAL', 1);

INSERT INTO parties (display_name, primary_email, type, tenant_id)
VALUES ('Jane Smith', 'test.buyer2@example.com', 'INDIVIDUAL', 1);
```

## Running Tests

### Run All Tests

```bash
npm run test:e2e
```

### Run Specific Test Suite

```bash
npx playwright test tests/e2e/contracts/contract-creation.spec.ts
```

### Run Tests in UI Mode

```bash
npm run test:e2e:ui
```

### Run Tests in Headed Mode

```bash
npm run test:e2e:headed
```

### Run Tests with Debug

```bash
npx playwright test --debug
```

### Run Specific Test

```bash
npx playwright test -g "should complete 3-step contract creation"
```

## Test Structure

```
tests/e2e/
├── e-signatures/                       # eSignature/Contracts E2E tests
│   ├── smoke.spec.ts                   # Smoke tests for basic validation
│   ├── contract-creation.spec.ts       # Contract creation workflow tests
│   ├── contact-linking.spec.ts         # Contact linking validation tests
│   ├── documents-tab.spec.ts           # Documents tab integration tests
│   ├── portal-signing.spec.ts          # Portal signing flow tests
│   ├── notifications.spec.ts           # Notification system tests
│   ├── pdf-generation.spec.ts          # PDF generation tests
│   └── helpers/
│       ├── contract-helpers.ts         # Contract-specific helper functions
│       ├── auth-helpers.ts             # Authentication helpers
│       └── email-helpers.ts            # Email capture helpers
├── fixtures/
│   └── test-data.ts                    # Test data and constants
├── global-setup.ts                     # Service validation
└── global-teardown.ts                  # Artifact cleanup
```

## Test Coverage

### Contract Creation Workflow (contract-creation.spec.ts)
- ✅ Complete 3-step wizard flow
- ✅ Required field validation
- ✅ Contact search and filtering
- ✅ Template selection
- ✅ Cancellation at each step
- ✅ Multiple contracts with different templates

### Contact Linking Validation (contact-linking.spec.ts)
- ✅ Contract linked via partyId
- ✅ Contract appears in Documents tab
- ✅ Multiple contracts per contact
- ✅ Empty state when no contracts
- ✅ Navigation from Documents tab
- ✅ Status badges
- ✅ Date display

### Documents Tab Integration (documents-tab.spec.ts)
- ✅ Contracts section display
- ✅ Status badge colors
- ✅ Status icons
- ✅ Template name display
- ✅ Hover effects
- ✅ Quick actions
- ✅ Loading and error states
- ✅ Contract count
- ✅ Date formatting

### Portal Signing Workflow (portal-signing.spec.ts) - ✅ ALL PASSING
- ✅ Complete signing workflow
- ✅ Contract content display
- ✅ Typed signature input
- ✅ Consent checkbox requirement
- ✅ Audit trail capture
- ✅ Viewed status tracking
- ✅ Success message
- ✅ Double-signing prevention
- ✅ Signature validation
- ✅ Contract declining
- ✅ Expiration warning display
- ✅ Portal agreements page

**Note**: Portal tests use tenant-prefixed URLs (`/t/dev-hogwarts/...`). The `portalUrl()` helper function automatically adds the tenant prefix.

### Notification System (notifications.spec.ts)
- ✅ Email on contract sent
- ✅ Signing link in email
- ✅ Email on contract signed
- ✅ Email on contract declined
- ✅ Email on contract voided
- ✅ Reminder emails
- ✅ In-app notifications
- ✅ Notification badges
- ✅ Mark as read
- ✅ No duplicate notifications

### PDF Generation (pdf-generation.spec.ts)
- ✅ PDF generation after signing
- ✅ Contract content in PDF
- ✅ Embedded signatures
- ✅ Audit certificate
- ✅ IP address in audit trail
- ✅ Timestamp in audit trail
- ✅ No download for unsigned contracts
- ✅ Unique filenames
- ✅ PDF persistence
- ✅ Special characters handling

## Continuous Integration

Tests are configured to run in CI/CD pipelines. See `.github/workflows/e2e-tests.yml` for the workflow configuration.

### Running in CI

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

## Debugging

### View Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

### Generate Trace

Run tests with trace enabled:

```bash
npx playwright test --trace on
```

View trace:

```bash
npx playwright show-trace trace.zip
```

### Screenshots on Failure

Playwright automatically captures screenshots on test failure. Find them in `test-results/`.

## Best Practices

1. **Isolation**: Each test is independent and can run in any order
2. **Cleanup**: Tests clean up their own data
3. **Stability**: Use proper waits (`waitForSelector`, `waitForTimeout`) instead of fixed delays
4. **Reusability**: Common actions are abstracted into helper functions
5. **Readability**: Test names clearly describe what they test
6. **Assertions**: Use specific assertions with clear error messages

## Troubleshooting

### Tests Fail with "Element not found"

- Increase timeout values in helper functions
- Check if the application is running
- Verify test data exists in database

### Email Notifications Not Captured

- Ensure MailHog/smtp4dev is running
- Verify EMAIL_CAPTURE_URL in .env
- Check API email configuration points to test SMTP server

### Authentication Failures

- Verify test users exist in database
- Check password hashes match test passwords
- Ensure tenant_id is correct

### PDF Download Failures

- Ensure contracts are fully signed before download
- Check browser download permissions
- Verify PDF generation service is running

### Portal Signing Test Failures

- Portal URLs must include tenant prefix (e.g., `/t/dev-hogwarts/contracts/123/sign`)
- The `portalUrl()` helper in portal-signing.spec.ts handles this automatically
- Ensure `TEST_TENANT_SLUG` environment variable is set (defaults to `dev-hogwarts`)
- Portal login navigates to `${PORTAL_URL}/login` and fetches tenant from session
- After logout, cookies are cleared for all domains - subsequent logins are fresh

## Contributing

When adding new tests:

1. Follow existing test structure and naming conventions
2. Add helper functions for reusable actions
3. Update this README with new test coverage
4. Ensure tests pass locally before committing
5. Add appropriate error handling and timeouts
