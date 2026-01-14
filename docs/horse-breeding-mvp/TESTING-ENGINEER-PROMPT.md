# Testing Engineer Prompt - Notification System Sprint 2

**Project:** BreederHQ Horse Breeding MVP
**Sprint:** Sprint 2 - Notification System
**Task:** Complete end-to-end testing and validation
**Estimated Time:** 8-12 hours

---

## Your Mission

You are a QA engineer responsible for thoroughly testing the newly implemented Notification System (Sprint 2). The system was just completed and includes:

- ✅ Backend notification scanner (vaccination + breeding alerts)
- ✅ Email delivery service
- ✅ REST API (7 endpoints)
- ✅ Daily cron job (6 AM automated scanning)
- ✅ Frontend notifications dropdown with icons (💉 🐴 🐎)
- ✅ API polling (30 seconds)
- ✅ Notification preferences page

**Your job:** Execute all test scenarios, document findings, and report issues.

---

## Getting Started

### 1. Read the Implementation Documentation

**Primary Reference:**
`C:\Users\Aaron\Documents\Projects\breederhq\docs\horse-breeding-mvp\NOTIFICATION-TESTING-GUIDE.md`

This 600+ line guide contains:
- 12 comprehensive test scenarios
- SQL queries for creating test data
- Expected results for each test
- Troubleshooting tips

**Secondary Reference:**
`C:\Users\Aaron\Documents\Projects\breederhq\docs\horse-breeding-mvp\NOTIFICATION-SYSTEM-IMPLEMENTATION.md`

Architecture overview and API documentation.

### 2. Environment Setup

**Backend:**
```bash
cd C:\Users\Aaron\Documents\Projects\breederhq-api
npm run dev
```

**Frontend:**
```bash
cd C:\Users\Aaron\Documents\Projects\breederhq\apps\platform
npm run dev
```

**Database:**
- Migration already applied: `20260114155932_add_notification_system`
- No additional setup needed

### 3. Access the Testing Guide

The testing guide is located at:
```
C:\Users\Aaron\Documents\Projects\breederhq\docs\horse-breeding-mvp\NOTIFICATION-TESTING-GUIDE.md
```

Read it completely before starting tests.

---

## Your Testing Checklist

Execute these tests **in order** and document results:

### Phase 1: Backend Functionality (Tests 1-3)

**Test 1: Manual Notification Scan Trigger**
- [ ] Create test vaccination expiring in 7 days (SQL provided in guide)
- [ ] Trigger notification scan manually
- [ ] Verify notifications created in database
- [ ] Document: How many notifications created? Correct type/priority?

**Test 2: Email Delivery**
- [ ] Verify Resend API key configured
- [ ] Trigger email delivery
- [ ] Check email inbox for notification
- [ ] Verify HTML formatting and deep links work
- [ ] Document: Email received? Formatting correct?

**Test 3: Cron Job Execution**
- [ ] Enable startup trigger (instructions in guide)
- [ ] Restart backend server
- [ ] Verify cron job runs automatically
- [ ] Check console logs for job execution
- [ ] Document: Cron started successfully? Logs show execution?

### Phase 2: Frontend Integration (Tests 4-6)

**Test 4: Bell Icon Badge**
- [ ] Log in to platform (http://localhost:5173)
- [ ] Verify bell icon shows unread count
- [ ] Check badge color (should be orange)
- [ ] Verify API polling every 30 seconds (DevTools Network tab)
- [ ] Document: Badge displays correctly? Polling works?

**Test 5: Notifications Dropdown**
- [ ] Click bell icon to open dropdown
- [ ] Verify all notification types display with correct icons:
  - 💉 Vaccination
  - 🐴 Breeding
  - 🐎 Foaling
- [ ] Click a notification and verify:
  - Marks as READ
  - Navigates to linked page
  - API call to `/notifications/{id}/read`
- [ ] Click "Mark all read" and verify:
  - All notifications marked READ
  - Unread count badge disappears
  - API call to `/notifications/mark-all-read`
- [ ] Document: All interactions work? UI updates correctly?

**Test 6: Notification Preferences**
- [ ] Open Settings panel
- [ ] Navigate to "Notifications" tab
- [ ] Verify all sections display:
  - Delivery Methods (Email, SMS, Push)
  - Health Notifications (Vaccination expiring, Vaccination overdue)
  - Breeding Notifications (Timeline, Heat cycle, Pregnancy, Foaling)
  - Marketplace Notifications (Inquiry, Waitlist)
- [ ] Toggle "Vaccination Expiring" OFF
- [ ] Click "Save Preferences"
- [ ] Verify success message displays
- [ ] Check database: `SELECT * FROM "UserNotificationPreferences" WHERE "userId" = 'YOUR_ID';`
- [ ] Document: Preferences save correctly? UI responsive?

### Phase 3: Advanced Testing (Tests 7-9)

**Test 7: Idempotency**
- [ ] Create notification (Test 1)
- [ ] Run scan again (same day)
- [ ] Verify NO duplicate notification created
- [ ] Check idempotency key in database
- [ ] Document: Idempotency working? No duplicates?

**Test 8: Priority Levels**
- [ ] Create vaccinations at different thresholds:
  - 7 days (LOW)
  - 3 days (MEDIUM)
  - 1 day (HIGH)
  - Overdue (URGENT)
- [ ] Trigger scan and delivery
- [ ] Check emails for priority badges (different colors)
- [ ] Document: Priority levels correct in emails?

**Test 9: Breeding Timeline Notifications**
- [ ] Create breeding plan with upcoming events (SQL in guide)
- [ ] Trigger scan
- [ ] Verify 4 notifications created:
  - Heat cycle (3d)
  - Hormone testing (4d)
  - Breed date (5d)
  - Foaling (30d)
- [ ] Check frontend displays 🐴 and 🐎 icons
- [ ] Document: Breeding notifications work? Icons correct?

### Phase 4: Edge Cases & Error Handling (Tests 10-12)

**Test 10: Multi-Tenant Isolation**
- [ ] Create data for two different tenants
- [ ] Trigger scan (scans all tenants)
- [ ] Log in as Tenant 1 user
- [ ] Verify only Tenant 1 notifications visible
- [ ] Log in as Tenant 2 user
- [ ] Verify only Tenant 2 notifications visible
- [ ] Document: Tenant isolation working? No data leakage?

**Test 11: Error Handling**
- [ ] Test email delivery failure (invalid API key)
- [ ] Test API error handling (disconnect backend)
- [ ] Test malformed data (NULL expiresAt)
- [ ] Document: Errors handled gracefully? No crashes?

**Test 12: Performance**
- [ ] Create 1000 vaccination records (SQL in guide)
- [ ] Run scan with timing
- [ ] Check API response time (should be < 200ms)
- [ ] Verify scan completes in < 5 seconds
- [ ] Document: Performance acceptable? Any bottlenecks?

---

## Test Data Creation

The testing guide provides all necessary SQL queries. Key examples:

**Create Vaccination Expiring in 7 Days:**
```sql
INSERT INTO "VaccinationRecord" (
  "animalId", "tenantId", "vaccineName",
  "administeredAt", "expiresAt", "createdAt", "updatedAt"
)
VALUES (
  1, 1, 'Test Rabies',
  NOW(), NOW() + INTERVAL '7 days', NOW(), NOW()
);
```

**Create Breeding Plan:**
```sql
INSERT INTO "BreedingPlan" (
  "tenantId", "damId", "sireId",
  "expectedCycleStart", "expectedBreedDate", "expectedBirthDate",
  "createdAt", "updatedAt"
)
VALUES (
  1, 1, 2,
  NOW() + INTERVAL '3 days',
  NOW() + INTERVAL '5 days',
  NOW() + INTERVAL '30 days',
  NOW(), NOW()
);
```

**All other SQL queries are in the testing guide.**

---

## Manual Testing Triggers

### Trigger Notification Scan

**Option A: Node Console**
```bash
cd breederhq-api
node --import tsx/esm
```
```javascript
import { runNotificationScan } from './src/services/notification-scanner.js';
const result = await runNotificationScan();
console.log(result);
```

**Option B: Uncomment Startup Trigger**
Edit `src/jobs/notification-scan.ts:94-95`:
```typescript
// Uncomment these lines:
console.log(`[notification-scan-job] Running initial scan on startup...`);
runNotificationScanJob().catch(err => console.error('[notification-scan-job] Initial scan failed:', err));
```

Then restart server: `npm run dev`

### Trigger Email Delivery

```javascript
import { deliverPendingNotifications } from './src/services/notification-delivery.js';
const result = await deliverPendingNotifications();
console.log(result);
```

---

## Reporting Your Findings

### Create Test Report

Create a new file: `NOTIFICATION-TESTING-REPORT.md`

**Template:**
```markdown
# Notification System - Testing Report

**Tester:** [Your Name]
**Date:** [Date]
**Duration:** [Hours]
**Environment:** Development (localhost)

---

## Executive Summary

- **Tests Executed:** X/12
- **Tests Passed:** X
- **Tests Failed:** X
- **Critical Issues:** X
- **Minor Issues:** X
- **Overall Status:** ✅ PASS / ⚠️ NEEDS WORK / ❌ FAIL

---

## Test Results

### Phase 1: Backend Functionality

#### Test 1: Manual Notification Scan Trigger
- **Status:** ✅ PASS / ❌ FAIL
- **Execution Time:** X minutes
- **Notifications Created:** X
- **Notes:** [Any observations]
- **Issues Found:** [List any issues]

[Repeat for all tests...]

---

## Issues Found

### Critical Issues
1. **[Issue Title]**
   - **Severity:** Critical
   - **Test:** Test #X
   - **Description:** [Detailed description]
   - **Expected:** [What should happen]
   - **Actual:** [What actually happened]
   - **Reproduction Steps:** [How to reproduce]
   - **Screenshots/Logs:** [If applicable]

### Minor Issues
[Same format as above]

---

## Performance Metrics

- **Notification Scan Time:** X seconds
- **Email Delivery Time:** X seconds per email
- **API Response Time:** X ms
- **Frontend Load Time:** X ms

---

## Recommendations

1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

---

## Test Data Used

- **Vaccinations Created:** X
- **Breeding Plans Created:** X
- **Tenants Used:** X
- **User Accounts:** X

---

## Sign-Off

- [ ] All tests executed
- [ ] All issues documented
- [ ] Report reviewed
- [ ] Ready for review

**Tested By:** [Name]
**Date:** [Date]
```

---

## Success Criteria

Your testing is complete when:

✅ **All 12 tests executed** and documented
✅ **Test report created** with detailed findings
✅ **All critical issues identified** with reproduction steps
✅ **Performance metrics collected** and within acceptable ranges
✅ **Screenshots captured** for any UI issues
✅ **Database queries verified** notifications stored correctly
✅ **Email samples collected** and formatting validated

---

## Important Notes

### DO:
- ✅ Follow the testing guide exactly
- ✅ Document EVERYTHING (even if tests pass)
- ✅ Take screenshots of UI issues
- ✅ Capture console errors/warnings
- ✅ Test on both Chrome and Firefox (if time permits)
- ✅ Verify database state after each test
- ✅ Ask questions if instructions unclear

### DON'T:
- ❌ Skip tests because they "probably work"
- ❌ Make code changes (testing only!)
- ❌ Delete test data until all tests complete
- ❌ Assume previous tests covered edge cases
- ❌ Rush through tests to finish faster

---

## Key Files to Reference

**Testing Guide:**
```
C:\Users\Aaron\Documents\Projects\breederhq\docs\horse-breeding-mvp\NOTIFICATION-TESTING-GUIDE.md
```

**Implementation Docs:**
```
C:\Users\Aaron\Documents\Projects\breederhq\docs\horse-breeding-mvp\NOTIFICATION-SYSTEM-IMPLEMENTATION.md
```

**Backend Code:**
```
C:\Users\Aaron\Documents\Projects\breederhq-api\src\services\notification-scanner.ts
C:\Users\Aaron\Documents\Projects\breederhq-api\src\services\notification-delivery.ts
C:\Users\Aaron\Documents\Projects\breederhq-api\src\routes\notifications.ts
C:\Users\Aaron\Documents\Projects\breederhq-api\src\jobs\notification-scan.ts
```

**Frontend Code:**
```
C:\Users\Aaron\Documents\Projects\breederhq\apps\platform\src\App-Platform.tsx
C:\Users\Aaron\Documents\Projects\breederhq\apps\platform\src\components\NotificationsDropdown.tsx
C:\Users\Aaron\Documents\Projects\breederhq\apps\platform\src\components\NotificationPreferencesTab.tsx
```

**Database Schema:**
```
C:\Users\Aaron\Documents\Projects\breederhq-api\prisma\schema.prisma
```

---

## Troubleshooting

### Backend Not Starting
- Check `npm run dev` logs for errors
- Verify PostgreSQL is running
- Confirm environment variables set

### Frontend Not Loading
- Clear browser cache
- Check console for errors
- Verify backend API is accessible

### Notifications Not Creating
- Check database connection
- Verify test data exists (correct tenantId, animalId)
- Check console logs for error messages

### Emails Not Sending
- Verify `RESEND_API_KEY` environment variable
- Check Resend dashboard for delivery status
- Verify user has email address in database

**For detailed troubleshooting, see the testing guide Section: Troubleshooting**

---

## Estimated Timeline

- **Phase 1 (Backend):** 2-3 hours
- **Phase 2 (Frontend):** 2-3 hours
- **Phase 3 (Advanced):** 2-3 hours
- **Phase 4 (Edge Cases):** 1-2 hours
- **Report Writing:** 1-2 hours

**Total:** 8-13 hours

---

## Questions?

If you encounter issues or have questions:

1. Check the testing guide troubleshooting section
2. Review implementation documentation
3. Check console logs and database state
4. Document the issue clearly in your report

---

## Final Deliverable

Submit your completed test report to:
```
C:\Users\Aaron\Documents\Projects\breederhq\docs\horse-breeding-mvp\NOTIFICATION-TESTING-REPORT.md
```

**Good luck! 🚀**

The notification system is production-critical, so thorough testing is essential. Take your time and document everything.
