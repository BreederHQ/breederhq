# Notification System - End-to-End Testing Guide

This guide walks through testing the complete notification system implementation, from backend scanning to frontend display.

---

## Prerequisites

1. **Database Migration Applied**
   ```bash
   cd breederhq-api
   npx prisma migrate deploy
   ```

2. **Server Running**
   ```bash
   npm run dev
   ```

3. **Frontend Running**
   ```bash
   cd ../breederhq  # or breederhq-www
   npm run dev
   ```

4. **Test Data**
   - At least one animal with vaccination records
   - At least one breeding plan with expected dates
   - Access to a tenant account

---

## Test 1: Manual Notification Scan Trigger

**Purpose**: Verify the notification scanner creates notifications correctly.

### Steps

1. **Add test vaccination expiring in 7 days**
   ```sql
   -- Connect to your database
   INSERT INTO "VaccinationRecord" (
     "animalId",
     "tenantId",
     "vaccineName",
     "administeredAt",
     "expiresAt",
     "createdAt",
     "updatedAt"
   )
   VALUES (
     1, -- Replace with valid animalId
     1, -- Replace with valid tenantId
     'Test Rabies',
     NOW(),
     NOW() + INTERVAL '7 days',
     NOW(),
     NOW()
   );
   ```

2. **Trigger notification scan manually**

   **Option A: Via API endpoint (create this endpoint for testing)**
   ```bash
   curl -X POST http://localhost:3000/api/v1/admin/notifications/scan \
     -H "x-tenant-id: 1" \
     -H "x-csrf-token: YOUR_CSRF_TOKEN" \
     --cookie "session=YOUR_SESSION"
   ```

   **Option B: Via node console**
   ```bash
   cd breederhq-api
   node --import tsx/esm
   ```
   ```javascript
   import { runNotificationScan } from './src/services/notification-scanner.js';
   const result = await runNotificationScan();
   console.log(result);
   ```

3. **Verify notifications created**
   ```sql
   SELECT * FROM "Notification"
   WHERE "tenantId" = 1
   ORDER BY "createdAt" DESC
   LIMIT 10;
   ```

**Expected Result**:
- One notification with type `vaccination_expiring_7d`
- Status: `UNREAD`
- Priority: `LOW`
- Title contains animal name and "7 days"

---

## Test 2: Email Delivery

**Purpose**: Verify notifications are delivered via email.

### Steps

1. **Ensure email service configured**
   ```bash
   # Check environment variables
   echo $RESEND_API_KEY
   echo $EMAIL_FROM
   ```

2. **Trigger notification delivery**

   **Option A: Via API endpoint**
   ```bash
   curl -X POST http://localhost:3000/api/v1/admin/notifications/deliver \
     -H "x-tenant-id: 1" \
     -H "x-csrf-token: YOUR_CSRF_TOKEN" \
     --cookie "session=YOUR_SESSION"
   ```

   **Option B: Via node console**
   ```javascript
   import { deliverPendingNotifications } from './src/services/notification-delivery.js';
   const result = await deliverPendingNotifications();
   console.log(result);
   ```

3. **Check email inbox**
   - Look for email with subject: `[LOW] Test Rabies expiring in 7 days`
   - Verify HTML formatting (priority badge, action button, footer)
   - Click "View Details" link to verify deep linking

**Expected Result**:
- Email received with correct formatting
- Deep link navigates to animal page
- Email footer has "Manage notification preferences" link

---

## Test 3: Cron Job Execution

**Purpose**: Verify daily automated scanning works.

### Steps

1. **Enable cron job in development**

   Edit `breederhq-api/src/jobs/notification-scan.ts`:
   ```typescript
   // Uncomment lines 94-95
   console.log(`[notification-scan-job] Running initial scan on startup...`);
   runNotificationScanJob().catch(err => console.error('[notification-scan-job] Initial scan failed:', err));
   ```

2. **Restart server**
   ```bash
   npm run dev
   ```

3. **Check console output**
   ```
   [notification-scan-job] Starting scan at 2026-01-14T12:00:00.000Z
   [notification-scan-job] Scan complete: { total: 5, vaccinations: 3, breeding: 2 }
   [notification-scan-job] Delivery complete: { sent: 10, failed: 0 }
   [notification-scan-job] Job complete in 1234ms
   [notification-scan-job] Summary:
     - Notifications created: 5
       - Vaccinations: 3
       - Breeding: 2
     - Emails sent: 10
     - Emails failed: 0
   ```

**Expected Result**:
- Cron job runs on startup (dev mode)
- Notifications created for expiring vaccinations and breeding events
- Emails sent to all tenant users

---

## Test 4: Frontend - Bell Icon Badge

**Purpose**: Verify unread notification count displays correctly.

### Steps

1. **Create unread notifications** (via Test 1)

2. **Log in to platform**
   ```
   http://localhost:5173/login
   ```

3. **Check bell icon in nav bar**
   - Look for orange badge with count
   - Count should match number of UNREAD notifications

4. **Verify polling**
   - Open browser DevTools > Network tab
   - Filter by "notifications"
   - Every 30 seconds, see request: `GET /api/v1/notifications?status=UNREAD&limit=50`

**Expected Result**:
- Bell icon shows correct unread count
- Badge color: orange (`hsl(var(--brand-orange))`)
- API polled every 30 seconds

---

## Test 5: Frontend - Notifications Dropdown

**Purpose**: Verify notification list displays and interactions work.

### Steps

1. **Click bell icon**
   - Dropdown should open
   - Header shows "Notifications" with unread count badge

2. **Verify notification types display**
   - Vaccination notifications: 💉 icon
   - Breeding notifications: 🐴 icon
   - Foaling notifications: 🐎 icon

3. **Verify notification details**
   - Title: correct animal name and event
   - Body: notification message
   - Time: "Just now", "5m ago", "2h ago", etc.
   - Unread indicator: orange dot

4. **Click a notification**
   - Should navigate to linked page (e.g., `/animals/123`)
   - Notification marked as READ
   - API request: `PUT /api/v1/notifications/{id}/read`

5. **Click "Mark all read"**
   - All notifications marked as READ
   - Orange dots disappear
   - Unread count badge disappears
   - API request: `POST /api/v1/notifications/mark-all-read`

**Expected Result**:
- Dropdown displays all notification types correctly
- Icons match notification categories
- Click interactions work (mark read, navigate)
- UI updates immediately

---

## Test 6: Frontend - Notification Preferences

**Purpose**: Verify user can control notification settings.

### Steps

1. **Open Settings panel**
   - Click settings icon in nav bar
   - Navigate to "Account Management" > "Notifications"

2. **Verify sections display**
   - **Delivery Methods**: Email, SMS (disabled), Push (disabled)
   - **Health Notifications**: Vaccination expiring, Vaccination overdue
   - **Breeding Notifications**: Breeding timeline, Heat cycle, Pregnancy check, Foaling
   - **Marketplace Notifications**: Marketplace inquiry, Waitlist signup

3. **Toggle preferences**
   - Disable "Vaccination Expiring"
   - Click "Save Preferences"
   - Success message: "Notification preferences saved successfully!"

4. **Verify preferences saved**
   ```sql
   SELECT * FROM "UserNotificationPreferences" WHERE "userId" = 'YOUR_USER_ID';
   ```

5. **Test preference enforcement**
   - Create a new vaccination expiring notification (Test 1)
   - Trigger email delivery (Test 2)
   - Verify NO email sent for vaccination expiring (preference disabled)

**Expected Result**:
- Preferences UI loads defaults
- Toggle switches work
- Save/Cancel buttons work
- Preferences persist in database
- Email delivery respects preferences

---

## Test 7: Idempotency

**Purpose**: Verify duplicate notifications are prevented.

### Steps

1. **Create initial notification** (Test 1)
   ```sql
   -- Check idempotency key
   SELECT "id", "type", "idempotencyKey"
   FROM "Notification"
   WHERE "type" = 'vaccination_expiring_7d';
   ```

   Example key: `vaccination_expiring_7d:VaccinationRecord:123:2026-01-14`

2. **Run scan again (same day)**
   ```javascript
   import { runNotificationScan } from './src/services/notification-scanner.js';
   const result = await runNotificationScan();
   console.log(result); // Should show 0 new notifications
   ```

3. **Verify no duplicate created**
   ```sql
   SELECT COUNT(*) FROM "Notification"
   WHERE "idempotencyKey" = 'vaccination_expiring_7d:VaccinationRecord:123:2026-01-14';
   -- Should return 1
   ```

**Expected Result**:
- Second scan creates 0 notifications
- Only one notification exists per idempotency key
- Logs show: "Already notified today"

---

## Test 8: Priority Levels

**Purpose**: Verify priority levels display correctly.

### Steps

1. **Create notifications at different thresholds**
   ```sql
   -- 7 days (LOW)
   INSERT INTO "VaccinationRecord" ("expiresAt", ...) VALUES (NOW() + INTERVAL '7 days', ...);

   -- 3 days (MEDIUM)
   INSERT INTO "VaccinationRecord" ("expiresAt", ...) VALUES (NOW() + INTERVAL '3 days', ...);

   -- 1 day (HIGH)
   INSERT INTO "VaccinationRecord" ("expiresAt", ...) VALUES (NOW() + INTERVAL '1 day', ...);

   -- Overdue (URGENT)
   INSERT INTO "VaccinationRecord" ("expiresAt", ...) VALUES (NOW() - INTERVAL '1 day', ...);
   ```

2. **Run scan and delivery**

3. **Check emails**
   - 7d: `[LOW]` subject, gray badge
   - 3d: `[MEDIUM]` subject, blue badge
   - 1d: `[HIGH]` subject, orange badge
   - Overdue: `[URGENT]` subject, red badge

4. **Check frontend**
   - Notifications should sort by priority (URGENT first)
   - Priority not shown in UI (just in email)

**Expected Result**:
- Different priorities create different colored email badges
- Subject line includes priority level
- Frontend displays all priorities equally

---

## Test 9: Breeding Timeline Notifications

**Purpose**: Verify breeding notifications work end-to-end.

### Steps

1. **Create breeding plan with upcoming events**
   ```sql
   INSERT INTO "BreedingPlan" (
     "tenantId",
     "damId",
     "sireId",
     "expectedCycleStart",
     "expectedHormoneTestingStart",
     "expectedBreedDate",
     "expectedBirthDate",
     "createdAt",
     "updatedAt"
   )
   VALUES (
     1,
     1, -- Dam animal ID
     2, -- Sire animal ID
     NOW() + INTERVAL '3 days', -- Heat cycle in 3 days
     NOW() + INTERVAL '4 days', -- Hormone testing in 4 days
     NOW() + INTERVAL '5 days', -- Breeding in 5 days
     NOW() + INTERVAL '30 days', -- Foaling in 30 days
     NOW(),
     NOW()
   );
   ```

2. **Run scan**
   ```javascript
   const result = await runNotificationScan();
   console.log(result.breeding); // Should show 4 notifications
   ```

3. **Verify notifications created**
   ```sql
   SELECT "type", "title", "priority" FROM "Notification"
   WHERE "type" LIKE 'breeding_%' OR "type" LIKE 'foaling_%'
   ORDER BY "priority" DESC;
   ```

4. **Check frontend**
   - 🐴 icon for breeding notifications
   - 🐎 icon for foaling notifications
   - Links navigate to `/breeding/{planId}`

**Expected Result**:
- 4 notifications created (heat cycle, hormone testing, breed date, foaling)
- Priorities: HIGH (3d), MEDIUM (30d), etc.
- Icons display correctly

---

## Test 10: Multi-Tenant Isolation

**Purpose**: Verify notifications are scoped to correct tenant.

### Steps

1. **Create data for two tenants**
   ```sql
   -- Tenant 1
   INSERT INTO "VaccinationRecord" ("tenantId", "expiresAt", ...) VALUES (1, NOW() + INTERVAL '7 days', ...);

   -- Tenant 2
   INSERT INTO "VaccinationRecord" ("tenantId", "expiresAt", ...) VALUES (2, NOW() + INTERVAL '7 days', ...);
   ```

2. **Run scan (scans all tenants)**

3. **Verify notifications created for both**
   ```sql
   SELECT "tenantId", COUNT(*) FROM "Notification" GROUP BY "tenantId";
   ```

4. **Log in as Tenant 1 user**
   - API request: `GET /api/v1/notifications?status=UNREAD`
   - Should only see Tenant 1 notifications

5. **Log in as Tenant 2 user**
   - Should only see Tenant 2 notifications

**Expected Result**:
- Notifications created for all tenants
- Each tenant only sees their own notifications
- No data leakage between tenants

---

## Test 11: Error Handling

**Purpose**: Verify system handles errors gracefully.

### Steps

1. **Test email delivery failure**
   ```bash
   # Set invalid Resend API key
   export RESEND_API_KEY="invalid_key"
   ```

   Run delivery:
   ```javascript
   const result = await deliverPendingNotifications();
   console.log(result); // Should show { sent: 0, failed: 5 }
   ```

2. **Test API error handling**
   ```bash
   # Frontend - disconnect backend server
   # Try to mark notification as read
   # Check console for error handling
   ```

3. **Test malformed data**
   ```sql
   -- Create notification with null expiresAt
   UPDATE "VaccinationRecord" SET "expiresAt" = NULL WHERE id = 123;
   ```

   Run scan (should skip gracefully)

**Expected Result**:
- Email failures logged but don't crash server
- Frontend shows error messages gracefully
- Malformed data skipped, not crashing scanner

---

## Test 12: Performance

**Purpose**: Verify system performs well at scale.

### Steps

1. **Create 1000 vaccination records**
   ```sql
   INSERT INTO "VaccinationRecord" (...)
   SELECT ... FROM generate_series(1, 1000);
   ```

2. **Run scan with timing**
   ```javascript
   const start = Date.now();
   const result = await runNotificationScan();
   const duration = Date.now() - start;
   console.log(`Scan took ${duration}ms, created ${result.total} notifications`);
   ```

3. **Check API response time**
   ```bash
   # Load 50 notifications
   time curl "http://localhost:3000/api/v1/notifications?status=UNREAD&limit=50"
   ```

**Expected Result**:
- Scan completes in < 5 seconds
- API responds in < 200ms
- No memory leaks or performance degradation

---

## Troubleshooting

### No notifications created

1. Check vaccination records exist and expire within 7 days
   ```sql
   SELECT * FROM "VaccinationRecord"
   WHERE "expiresAt" BETWEEN NOW() AND NOW() + INTERVAL '7 days';
   ```

2. Check scanner is running
   ```bash
   # Look for log: "[notification-scan-job] Cron job started"
   ```

3. Check for errors in console
   ```bash
   grep "notification" logs/*.log
   ```

### Emails not sending

1. Verify Resend API key
   ```bash
   curl https://api.resend.com/emails \
     -H "Authorization: Bearer $RESEND_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"from":"test@test.com","to":"you@example.com","subject":"Test","html":"Test"}'
   ```

2. Check user preferences
   ```sql
   SELECT "emailEnabled" FROM "UserNotificationPreferences" WHERE "userId" = 'YOUR_USER_ID';
   ```

3. Check notification was created
   ```sql
   SELECT * FROM "Notification" WHERE "status" = 'UNREAD' AND "createdAt" > NOW() - INTERVAL '1 day';
   ```

### Frontend not updating

1. Check API polling
   - DevTools > Network > Filter "notifications"
   - Should see request every 30 seconds

2. Check tenant ID
   ```javascript
   console.log(window.__BHQ_TENANT_ID__);
   ```

3. Check notification format
   ```bash
   # API response should match frontend type
   curl "http://localhost:3000/api/v1/notifications?status=UNREAD&limit=10"
   ```

---

## Success Criteria

✅ **Backend**
- [ ] Notification scanner creates notifications for expiring vaccinations
- [ ] Notification scanner creates notifications for breeding events
- [ ] Idempotency prevents duplicate notifications
- [ ] Email delivery sends HTML emails with correct formatting
- [ ] User preferences control notification delivery
- [ ] Cron job runs daily at 6 AM

✅ **Frontend**
- [ ] Bell icon shows unread count badge
- [ ] Notifications dropdown displays all notification types
- [ ] Vaccination notifications show 💉 icon
- [ ] Breeding notifications show 🐴 icon
- [ ] Foaling notifications show 🐎 icon
- [ ] Click notification marks as read and navigates
- [ ] "Mark all read" works
- [ ] API polls every 30 seconds
- [ ] Notification preferences page loads and saves

✅ **Integration**
- [ ] End-to-end flow: scan → create → deliver → display
- [ ] Multi-tenant isolation works
- [ ] Error handling graceful
- [ ] Performance acceptable

---

## Next Steps

After completing all tests:

1. **Deploy to staging**
   ```bash
   git push staging dev
   ```

2. **Run migration on staging**
   ```bash
   ssh staging
   cd breederhq-api
   npx prisma migrate deploy
   pm2 restart breederhq-api
   ```

3. **Monitor logs for 24 hours**
   ```bash
   pm2 logs breederhq-api | grep notification
   ```

4. **Gather user feedback**
   - Send test notifications to team
   - Review email formatting
   - Test on mobile devices

5. **Production deployment**
   - Schedule deployment for low-traffic time
   - Announce new feature to users
   - Monitor error rates and performance

---

## Support

If you encounter issues during testing:

1. Check [NOTIFICATION-SYSTEM-IMPLEMENTATION.md](./NOTIFICATION-SYSTEM-IMPLEMENTATION.md) for architecture details
2. Review server logs: `pm2 logs breederhq-api`
3. Check database for notification records
4. Verify email service configuration
5. Test with `NODE_ENV=development` for verbose logging

For production issues:
- Disable cron job: Set `NOTIFICATION_SCAN_ENABLED=false`
- Check Resend dashboard for email delivery status
- Review Sentry for error tracking
