# BreederHQ Production Cutover Runbook

**Version:** 1.0
**Last Updated:** 2025-01-01
**Status:** Ready for Execution

---

## Executive Summary

This runbook documents the complete production cutover sequence for BreederHQ's multi-surface authentication system. All application code is complete and merged to `dev`. This document covers infrastructure provisioning, deployment, verification, and rollback procedures.

---

## 1. Vercel Project Finalization

### 1.1 Required Projects

Each surface requires a **separate Vercel project** deployed from a specific subdirectory:

| Surface | Vercel Project Name | Root Directory | Domain |
|---------|---------------------|----------------|--------|
| PLATFORM | `breederhq-platform` | `apps/platform` | `app.breederhq.com` |
| PORTAL | `breederhq-portal` | `apps/portal` | `portal.breederhq.com` |
| MARKETPLACE | `breederhq-marketplace` | `apps/marketplace` | `marketplace.breederhq.com` |

### 1.2 Project Configuration (All Surfaces)

Each project must be configured identically:

```
Framework Preset:     Vite
Build Command:        npm run build
Output Directory:     dist
Install Command:      npm install
Node.js Version:      18.x (LTS)
```

### 1.3 Project Creation Checklist

For each surface, execute in Vercel dashboard:

- [ ] **PLATFORM**: Create project `breederhq-platform`
  - [ ] Connect to `BreederHQ/breederhq` repository
  - [ ] Set Root Directory: `apps/platform`
  - [ ] Framework: Vite
  - [ ] Build: `npm run build`
  - [ ] Output: `dist`
  - [ ] Assign domain: `app.breederhq.com`

- [ ] **PORTAL**: Create project `breederhq-portal`
  - [ ] Connect to `BreederHQ/breederhq` repository
  - [ ] Set Root Directory: `apps/portal`
  - [ ] Framework: Vite
  - [ ] Build: `npm run build`
  - [ ] Output: `dist`
  - [ ] Assign domain: `portal.breederhq.com`

- [ ] **MARKETPLACE**: Create project `breederhq-marketplace`
  - [ ] Connect to `BreederHQ/breederhq` repository
  - [ ] Set Root Directory: `apps/marketplace`
  - [ ] Framework: Vite
  - [ ] Build: `npm run build`
  - [ ] Output: `dist`
  - [ ] Assign domain: `marketplace.breederhq.com`

### 1.4 Existing Project Cleanup

If any legacy Vercel project exists that deploys from root or mixes surfaces:

1. **Do NOT delete** until new projects are verified
2. Remove domain assignments from legacy project first
3. Retire after 48h of successful new deployment monitoring

### 1.5 Critical Constraints

- **No shared routing**: Each project ONLY serves its own surface
- **No redirects between surfaces**: Cross-surface navigation is via full URL
- **Root vercel.json is inert**: Contains only metadata, no routing rules

---

## 2. Domain Assignment and DNS Readiness

### 2.1 Domain Verification in Vercel

For each project, in Vercel Dashboard → Project → Settings → Domains:

| Project | Domain to Add | Verification |
|---------|---------------|--------------|
| breederhq-platform | `app.breederhq.com` | TXT or CNAME |
| breederhq-portal | `portal.breederhq.com` | TXT or CNAME |
| breederhq-marketplace | `marketplace.breederhq.com` | TXT or CNAME |

### 2.2 DNS Records Checklist

Configure at your DNS registrar:

| Hostname | Record Type | Value | TTL |
|----------|-------------|-------|-----|
| `app.breederhq.com` | CNAME | `cname.vercel-dns.com` | 300 |
| `portal.breederhq.com` | CNAME | `cname.vercel-dns.com` | 300 |
| `marketplace.breederhq.com` | CNAME | `cname.vercel-dns.com` | 300 |

**Alternative (if CNAME at apex):**
- Use Vercel's A record: `76.76.21.21`
- But prefer CNAME for automatic failover

### 2.3 DNS Propagation Verification

After setting DNS, verify propagation:

```bash
# Check each domain resolves correctly
dig +short app.breederhq.com
dig +short portal.breederhq.com
dig +short marketplace.breederhq.com

# Should return Vercel edge IPs or cname.vercel-dns.com
```

### 2.4 SSL/TLS Certificates

Vercel automatically provisions Let's Encrypt certificates. Verify:

- [ ] Each domain shows valid HTTPS in browser
- [ ] No certificate warnings
- [ ] Certificate is for the correct hostname

---

## 3. Backend Environment Validation (Render)

### 3.1 Required Environment Variables

| Variable | Required | Expected Value | Fail Mode |
|----------|----------|----------------|-----------|
| `NODE_ENV` | Yes | `production` | Must be exact |
| `COOKIE_SECRET` | Yes | 32+ char random string | Server refuses to start |
| `COOKIE_DOMAIN` | Optional | `.breederhq.com` | Auto-detected in production |
| `ALLOWED_ORIGINS` | Yes | See below | CORS failures |
| `MARKETPLACE_PUBLIC_ENABLED` | Yes | `true` or `false` | Routes disabled if not `true` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | DB failures |

### 3.2 ALLOWED_ORIGINS Value

Set to comma-separated list:

```
https://app.breederhq.com,https://portal.breederhq.com,https://marketplace.breederhq.com
```

### 3.3 Environment Validation Script

Run on Render console or via deploy hook:

```bash
# These should NOT error
[ -z "$COOKIE_SECRET" ] && echo "FATAL: COOKIE_SECRET not set" && exit 1
[ ${#COOKIE_SECRET} -lt 32 ] && echo "FATAL: COOKIE_SECRET too short" && exit 1
[ "$NODE_ENV" != "production" ] && echo "WARN: NODE_ENV is not production"

# Info only
echo "ALLOWED_ORIGINS: $ALLOWED_ORIGINS"
echo "MARKETPLACE_PUBLIC_ENABLED: $MARKETPLACE_PUBLIC_ENABLED"
echo "COOKIE_DOMAIN: ${COOKIE_DOMAIN:-auto (.breederhq.com)}"
```

### 3.4 Fail-Closed Behaviors

| Condition | Behavior |
|-----------|----------|
| `COOKIE_SECRET` missing | Server throws on startup, does not listen |
| `COOKIE_SECRET` < 32 chars | Server throws on startup |
| `ALLOWED_ORIGINS` missing | Only localhost + Vercel preview allowed |
| `MARKETPLACE_PUBLIC_ENABLED` missing or not `true` | Marketplace routes return 404 |
| `NODE_ENV` not `production` | Dev bypasses active, hostname allowlist disabled |

### 3.5 Pre-Deploy Validation Checklist

- [ ] `NODE_ENV=production` in Render env
- [ ] `COOKIE_SECRET` set and 32+ chars
- [ ] `ALLOWED_ORIGINS` includes all three production domains
- [ ] `MARKETPLACE_PUBLIC_ENABLED=true` if marketplace should be live
- [ ] `DATABASE_URL` points to production database

---

## 4. Production Smoke Test Plan

Execute these tests **after deployment** to verify the system is operational.

### 4.1 Surface Resolution Tests

```bash
# PLATFORM surface
curl -sI https://app.breederhq.com/api/v1/healthz
# Expected: 200 OK

curl -s https://app.breederhq.com/api/v1/__diag | jq '.surface'
# Expected: "PLATFORM" (requires superadmin auth in prod)

# PORTAL surface
curl -sI https://portal.breederhq.com/api/v1/healthz
# Expected: 200 OK

# MARKETPLACE surface
curl -sI https://marketplace.breederhq.com/api/v1/healthz
# Expected: 200 OK
```

### 4.2 UNKNOWN Hostname Rejection

```bash
# Simulate request from unknown hostname
curl -s -H "Host: evil.breederhq.com" https://app.breederhq.com/api/v1/healthz
# Expected: 403 with {"error":"SURFACE_ACCESS_DENIED","surface":"UNKNOWN"}

# Note: This may not work via CDN; test directly against Render if needed
curl -s -H "Host: portal.malicious.com" https://breederhq-api.onrender.com/api/v1/healthz
# Expected: 403 SURFACE_ACCESS_DENIED
```

### 4.3 Cross-Surface CSRF Rejection

```bash
# Get a PLATFORM CSRF token
PLATFORM_CSRF=$(curl -s -c cookies.txt https://app.breederhq.com/api/v1/session | jq -r '.csrfToken // empty')

# Attempt to use PLATFORM token on PORTAL (should fail)
curl -s -X POST https://portal.breederhq.com/api/v1/session/tenant \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $PLATFORM_CSRF" \
  -H "Origin: https://portal.breederhq.com" \
  -b cookies.txt \
  -d '{"tenantId": 1}'
# Expected: 403 {"error":"CSRF_FAILED","detail":"surface_mismatch","surface":"PORTAL"}
```

### 4.4 Portal Tenant Resolution (URL Slug Only)

```bash
# Portal should NOT accept X-Tenant-Id header for tenant resolution
curl -s https://portal.breederhq.com/api/v1/t/acme-kennel/contacts \
  -H "Cookie: bhq_s=<valid_session>" \
  -H "X-Tenant-Id: 999"
# Expected: Tenant resolved from URL slug "acme-kennel", NOT from header 999
```

### 4.5 Marketplace Entitlement Enforcement

```bash
# User without MARKETPLACE_ACCESS entitlement
curl -s https://marketplace.breederhq.com/api/v1/marketplace/programs/test \
  -H "Cookie: bhq_s=<session_without_entitlement>"
# Expected: 403 {"error":"SURFACE_ACCESS_DENIED","surface":"MARKETPLACE"}

# User with MARKETPLACE_ACCESS entitlement
curl -s https://marketplace.breederhq.com/api/v1/marketplace/programs/test \
  -H "Cookie: bhq_s=<session_with_entitlement>"
# Expected: 200 or 404 (route works, access granted)
```

### 4.6 CLIENT Cannot Access Marketplace

```bash
# CLIENT user (portal access only) should be denied marketplace
curl -s https://marketplace.breederhq.com/api/v1/marketplace/programs/test \
  -H "Cookie: bhq_s=<client_only_session>"
# Expected: 403 SURFACE_ACCESS_DENIED
# Because CLIENT context cannot resolve on MARKETPLACE surface
```

### 4.7 Signed Cookie SSO Verification

```bash
# Login on PLATFORM
curl -s -c cookies.txt -X POST https://app.breederhq.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"xxx"}'

# Verify cookie works on PORTAL (SSO)
curl -s -b cookies.txt https://portal.breederhq.com/api/v1/session
# Expected: Valid session returned (same user)

# Verify cookie works on MARKETPLACE (SSO)
curl -s -b cookies.txt https://marketplace.breederhq.com/api/v1/session
# Expected: Valid session returned (same user)
```

### 4.8 Origin Validation

```bash
# Mutating request with wrong origin should fail
curl -s -X POST https://app.breederhq.com/api/v1/some-endpoint \
  -H "Origin: https://evil.com" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: PLATFORM.xxx" \
  -H "Cookie: bhq_s=xxx; XSRF-TOKEN=PLATFORM.xxx"
# Expected: 403 CSRF_FAILED origin_mismatch
```

---

## 5. Failure and Rollback Scenarios

### 5.1 Partial Deployment (One Surface Deploys, Others Fail)

**Symptoms:**
- One surface returns 200, others return 404 or redirect to parking page
- SSO works partially (login on working surface, session valid elsewhere)

**Impact:**
- Users on failed surfaces cannot access the app
- **Auth remains secure** — backend still enforces all checks
- CSRF tokens from working surface won't work on failed surfaces (by design)

**Resolution:**
1. Check Vercel deployment logs for failed surface
2. Verify root directory is correct
3. Retry deployment
4. If blocking: Revert Vercel to previous deployment

**SSO Note:** Cookie remains valid across all subdomains. Once a surface is deployed, existing sessions will work immediately.

### 5.2 Disable Marketplace Instantly

**Scenario:** Security issue or abuse on marketplace surface.

**Steps:**

1. **Backend (Render):** Set environment variable:
   ```
   MARKETPLACE_PUBLIC_ENABLED=false
   ```

2. **Redeploy backend** — routes will 404 immediately

3. **Optional (belt and suspenders):** In Vercel dashboard for `breederhq-marketplace`:
   - Go to Settings → Domains
   - Remove `marketplace.breederhq.com`
   - This causes DNS to fail, blocking all traffic

**Recovery:**
- Set `MARKETPLACE_PUBLIC_ENABLED=true`
- Redeploy backend
- Re-add domain in Vercel if removed

### 5.3 Invalidate All Sessions (Emergency)

**Scenario:** Session signing key compromised or need to force all users to re-authenticate.

**Steps:**

1. **Rotate `COOKIE_SECRET`:**
   ```bash
   # Generate new secret
   openssl rand -base64 32
   ```

2. **Update in Render:**
   - Set new `COOKIE_SECRET` value
   - Redeploy backend

3. **Effect:**
   - All existing session cookies become invalid (signature mismatch)
   - Users must log in again on all surfaces
   - New sessions use new signing key

**Warning:** This is a hard logout for all users. Use only in emergency.

### 5.4 Audit Signals for Surface Spoofing or Abuse

**Monitor for these audit events:**

| Event | Meaning | Action |
|-------|---------|--------|
| `AUTH_SURFACE_DENIED` with `reason: "unknown_hostname"` | Request from non-allowlisted hostname | Likely attack or misconfigured proxy. Investigate source IP. |
| `CSRF_FAILED` with `reason: "surface_mismatch"` | Token from one surface used on another | Cross-surface attack attempt or user confusion. |
| `CSRF_FAILED` with `reason: "origin_mismatch"` | Origin header doesn't match surface | Possible CSRF attack. |
| `AUTH_TENANT_DENIED` high volume | Someone probing tenant IDs | Possible enumeration attack. |
| `MARKETPLACE_ACCESS_DENIED` high volume | Unauthenticated marketplace access | Bot or scraper activity. |

**Query examples (assuming PostgreSQL audit table):**

```sql
-- Surface spoofing attempts in last hour
SELECT COUNT(*), detail_json->>'hostname' as hostname
FROM audit_event
WHERE action = 'AUTH_SURFACE_DENIED'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY hostname
ORDER BY 1 DESC;

-- Cross-surface CSRF attempts
SELECT COUNT(*), surface
FROM audit_event
WHERE action = 'CSRF_FAILED'
  AND detail_json->>'reason' = 'surface_mismatch'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY surface;
```

### 5.5 Rollback Procedures

**Frontend (Vercel):**

1. Go to Vercel Dashboard → Project → Deployments
2. Find last known-good deployment
3. Click "..." → "Promote to Production"
4. Deployment is instant (edge cached)

**Backend (Render):**

1. Go to Render Dashboard → Service → Events
2. Find last known-good deploy
3. Click "Rollback to this deploy"
4. Or: Revert commit in Git and push

---

## 6. Cutover Sequence

### 6.1 Pre-Cutover Checklist

- [ ] All code merged to `dev` branch
- [ ] Backend environment variables validated
- [ ] Database migrations applied and verified
- [ ] Team notified of cutover window

### 6.2 Cutover Execution Order

**Phase 1: Backend (Render)**
1. [ ] Verify `NODE_ENV=production`
2. [ ] Verify `COOKIE_SECRET` is set and 32+ chars
3. [ ] Set `ALLOWED_ORIGINS` with all three domains
4. [ ] Set `MARKETPLACE_PUBLIC_ENABLED=true` (or false if not ready)
5. [ ] Deploy backend
6. [ ] Verify healthcheck: `curl https://breederhq-api.onrender.com/healthz`

**Phase 2: Vercel Projects**
1. [ ] Create/configure `breederhq-platform` project
2. [ ] Create/configure `breederhq-portal` project
3. [ ] Create/configure `breederhq-marketplace` project
4. [ ] Trigger initial deploys (connect to `dev` or `main` branch)
5. [ ] Verify each project builds successfully

**Phase 3: DNS**
1. [ ] Add CNAME records for all three domains
2. [ ] Wait for propagation (5-30 minutes)
3. [ ] Verify with `dig` commands

**Phase 4: Domain Assignment**
1. [ ] In Vercel: Assign `app.breederhq.com` to platform project
2. [ ] In Vercel: Assign `portal.breederhq.com` to portal project
3. [ ] In Vercel: Assign `marketplace.breederhq.com` to marketplace project
4. [ ] Wait for SSL certificate provisioning

**Phase 5: Smoke Tests**
1. [ ] Execute all smoke tests from Section 4
2. [ ] Verify SSO works across all surfaces
3. [ ] Verify CSRF surface binding works
4. [ ] Verify UNKNOWN hostname rejection

**Phase 6: Monitoring**
1. [ ] Watch audit logs for anomalies
2. [ ] Monitor error rates in Render/Vercel
3. [ ] Confirm no 5xx spikes

### 6.3 Success Criteria

All of the following must pass:

- [ ] All three surfaces respond to their respective domains
- [ ] Health checks return 200
- [ ] SSO cookie works across all subdomains
- [ ] Cross-surface CSRF is rejected
- [ ] Unknown hostnames are rejected with 403
- [ ] Marketplace requires entitlement
- [ ] No 5xx errors in logs

---

## 7. Blocking Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| DNS propagation delay | Medium | Use low TTL (300s), start DNS early |
| Vercel SSL provisioning failure | Medium | Verify domain ownership, check Vercel logs |
| Cookie domain misconfiguration | High | Test SSO immediately after deploy |
| `COOKIE_SECRET` rotation during cutover | High | Set secret before first deploy, don't change |
| Database connection from new Render region | Medium | Verify DATABASE_URL works from Render |
| Rate limiter blocks legitimate traffic | Low | Monitor rate limit audit events |

---

## 8. Post-Cutover Monitoring

### First 24 Hours

- [ ] Check audit logs every 2 hours for anomalies
- [ ] Monitor Render CPU/memory for unexpected load
- [ ] Watch Vercel edge logs for 4xx/5xx spikes
- [ ] Verify no session issues reported by users

### First Week

- [ ] Review all `AUTH_SURFACE_DENIED` events
- [ ] Review all `CSRF_FAILED` events
- [ ] Confirm marketplace entitlement flow works
- [ ] Confirm portal activation flow works
- [ ] Document any issues encountered

---

## Appendix: Quick Reference

### Hostnames

```
app.breederhq.com        → PLATFORM (STAFF)
portal.breederhq.com     → PORTAL (CLIENT)
marketplace.breederhq.com → MARKETPLACE (PUBLIC + entitlement)
```

### Backend URLs

```
Production API: https://breederhq-api.onrender.com
Health Check:   https://breederhq-api.onrender.com/healthz
```

### Key Environment Variables

```bash
NODE_ENV=production
COOKIE_SECRET=<32+ char secret>
COOKIE_DOMAIN=.breederhq.com  # optional, auto-detected
ALLOWED_ORIGINS=https://app.breederhq.com,https://portal.breederhq.com,https://marketplace.breederhq.com
MARKETPLACE_PUBLIC_ENABLED=true
```

### Emergency Contacts

- **Backend Issues**: Check Render dashboard
- **Frontend Issues**: Check Vercel dashboard
- **DNS Issues**: Contact registrar support
