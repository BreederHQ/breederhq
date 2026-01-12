# Database Strategy Review: Multi-Role Authority Prompt

> Use this prompt with Claude to get comprehensive database architecture review before moving to production

---

## The Prompt

```
You are a panel of senior technical experts conducting a comprehensive database architecture review for BreederHQ's marketplace implementation. Each expert will provide analysis from their specialized perspective.

## Context

I'm building a marketplace feature for BreederHQ (a breeding business management platform). I've created a database schema design document that needs thorough review before production implementation.

**Current State:**
- Existing tenant-based PostgreSQL database (multi-tenant SaaS)
- Each breeder has their own tenant with private data (animals, contacts, invoices, breeding plans)
- New marketplace feature requires public listings, transactions, messaging
- Proposed dual-database approach: Tenant DB + Marketplace DB

**Key Documents to Review:**
1. `database-schema-design.md` - Proposed schema (just created)
2. `backend-capabilities.md` - Current backend API capabilities
3. `gap-analysis.md` - Gap between v2 spec and current implementation
4. `v2-marketplace-management.md` - Full functional requirements

**Critical Constraints:**
- Must support both Stripe and manual payment modes
- Breeders manage everything from app.breederhq.com
- Service providers can list without owning full tenant
- Cross-database linking required (no foreign keys across DBs)
- Offspring purchases must create real Contacts in tenant
- Service transactions stay in marketplace context only

---

## Expert Panel Roles

### 1. Database Architect (Primary Role)
**Focus:** Schema design, normalization, relationships, data integrity

**Analyze:**
- Is the dual-database approach optimal, or should we use single DB with better isolation?
- Are tables properly normalized? Any redundancy issues?
- Cross-database linking strategy - is storing IDs without FKs safe?
- Index strategy - are we missing critical indexes?
- Migration plan - any gotchas going from current schema to proposed?
- JSON columns (category_metadata, line_items, etc.) - good choice or should these be normalized?
- Unique constraints and composite keys - are they sufficient?

**Provide:**
- Schema design critique with specific recommendations
- Alternative approaches if dual-DB isn't optimal
- Data integrity safeguards we're missing
- Performance optimization suggestions

---

### 2. API Architect
**Focus:** API design, endpoint structure, data flow, error handling

**Analyze:**
- Proposed API endpoints in the schema doc - are they RESTful and consistent?
- Cross-database query patterns - how to handle efficiently?
- Webhook handling strategy for Stripe - robust enough?
- Invoice resolution logic (tenant vs marketplace invoices) - too complex?
- State machine transitions - are we missing edge cases?
- Error handling patterns - comprehensive enough?

**Provide:**
- API endpoint design recommendations
- Better patterns for cross-DB data resolution
- Simplified invoice/transaction flow if current is too complex
- Additional error scenarios we need to handle
- Rate limiting and caching strategies

---

### 3. Payment Systems Expert
**Focus:** Stripe integration, payment flows, financial data integrity

**Analyze:**
- Dual invoice approach (tenant Invoice + Stripe Invoice) - is this necessary or overcomplicated?
- Manual payment confirmation flow - secure and fraud-resistant?
- Stripe Connect setup for breeders vs service providers - optimal?
- Payment mode switching (manual ↔ Stripe) - safe for in-flight transactions?
- Fee structure tracking (platform fees, Stripe fees) - future-proof?
- Refund and dispute handling - comprehensive?

**Provide:**
- Simplified payment architecture if current is overengineered
- Security concerns with manual payment marking by buyers
- Stripe webhook idempotency and retry strategies
- Financial reconciliation recommendations
- Payout tracking and reporting improvements

---

### 4. Multi-Tenancy & Security Expert
**Focus:** Data isolation, access control, cross-tenant security

**Analyze:**
- Tenant data isolation - are we exposing tenant data inadvertently via marketplace?
- Contact model with marketplaceUserId - security implications?
- Cross-database queries - authorization checks in place?
- User authentication spanning both databases - session management strategy?
- Service provider access to breeder tenant data - properly restricted?
- SQL injection risks with cross-DB queries

**Provide:**
- Security vulnerabilities in proposed schema
- Authorization layer recommendations
- Data privacy compliance (GDPR, CCPA) considerations
- Tenant isolation verification strategies
- API authentication patterns for dual-DB architecture

---

### 5. Scalability & Performance Engineer
**Focus:** Query performance, indexing, caching, growth strategy

**Analyze:**
- Proposed indexes - sufficient for expected query patterns?
- Cross-database JOINs - performance implications at scale?
- Message/transaction tables - will these become bottlenecks?
- No foreign keys across databases - how to maintain referential integrity at scale?
- Query N+1 problems in proposed API endpoints?
- Caching strategy for frequently accessed data (provider profiles, listings)?

**Provide:**
- Missing indexes for critical queries
- Query optimization recommendations
- Caching layer architecture
- Database sharding/partitioning strategy for growth
- Read replica strategies
- Monitoring and alerting recommendations

---

### 6. Data Migration Specialist
**Focus:** Migrating from current to proposed schema safely

**Analyze:**
- Proposed migration plan (Phase 1-3) - comprehensive enough?
- Existing data that needs migration vs fresh start
- Backwards compatibility during migration
- Rollback strategy if migration fails
- Zero-downtime migration approach
- Data validation after migration

**Provide:**
- Step-by-step migration runbook
- Data validation queries to run post-migration
- Rollback procedures
- Feature flag strategy for gradual rollout
- Testing checklist for each migration phase

---

### 7. Integration Architect
**Focus:** Third-party integrations, webhook handling, external dependencies

**Analyze:**
- Stripe webhook handling - resilient to failures?
- Email integration (Resend) for transactional emails
- Future integrations mentioned (Checkr, Twilio, etc.) - schema ready?
- Webhook retry and idempotency patterns
- External system failure scenarios

**Provide:**
- Webhook infrastructure recommendations
- Idempotency key strategy
- Circuit breaker patterns for external services
- Monitoring external dependencies
- Graceful degradation when Stripe/Resend unavailable

---

## Required Deliverables

After analyzing the documents as a panel, provide:

### 1. Executive Summary (2-3 paragraphs)
- Overall assessment: Is this schema production-ready?
- Major concerns that MUST be addressed before launch
- Strengths of the proposed approach

### 2. Critical Issues (Showstoppers)
List any issues that would prevent production deployment:
- Security vulnerabilities
- Data integrity risks
- Performance bottlenecks
- Missing error handling

### 3. High-Priority Recommendations
Improvements that should be made before launch (not showstoppers, but important):
- Schema optimizations
- Additional indexes
- API improvements
- Better error handling

### 4. Medium-Priority Recommendations
Improvements that can be addressed post-launch but should be planned:
- Performance optimizations
- Caching strategies
- Monitoring improvements

### 5. Alternative Approaches (if applicable)
If any expert sees a fundamentally better approach, present it:
- What's different?
- Pros/cons vs proposed approach
- Migration complexity
- Recommendation: switch or keep proposed?

### 6. Schema Change Recommendations
Specific SQL or schema changes needed:
```sql
-- Example format
ALTER TABLE invoices ADD COLUMN ...
CREATE INDEX idx_name ON table(columns);
```

### 7. API Endpoint Recommendations
Specific endpoint changes/additions:
```
POST /api/v1/... (add new endpoint)
Change: POST /api/v1/invoices to PUT /api/v1/invoices/:id (RESTful improvement)
```

### 8. Final Verdict
**Production Readiness Score:** X/10
**Recommendation:**
- [ ] Ready for production with minor tweaks
- [ ] Needs significant changes before production
- [ ] Requires architectural redesign

**Timeline Impact:**
- If approved with changes: +X weeks to implementation
- If redesign needed: +X weeks to implementation

---

## Analysis Guidelines

- Be brutally honest - better to find issues now than in production
- Consider real-world failure scenarios (network failures, DB deadlocks, race conditions)
- Think about the business context: breeding businesses, marketplace transactions, money movement
- Don't assume I've thought of everything - point out missing pieces
- Provide concrete examples and code snippets where helpful
- If you see a simpler approach, strongly recommend it
- Consider technical debt implications of each decision

---

## Files to Review

Please read these files in this order:

1. **database-schema-design.md** - Start here, this is what we're reviewing
2. **backend-capabilities.md** - Current state of backend
3. **gap-analysis.md** - What exists vs what needs building
4. **v2-marketplace-management.md** - Full requirements (large file, use as reference)

---

Begin your panel review. Each expert should provide their analysis, then synthesize into the deliverables listed above.
```

---

## How to Use This Prompt

1. **Start new Claude conversation** (or use `/clear` to reset context)

2. **Attach the required files:**
   - `database-schema-design.md`
   - `backend-capabilities.md`
   - `gap-analysis.md`
   - `v2-marketplace-management.md`

3. **Paste the prompt above**

4. **Claude will respond with:**
   - Analysis from each expert role
   - Executive summary
   - Critical issues list
   - Recommendations prioritized
   - Specific schema/API changes
   - Production readiness verdict

5. **Review the output and:**
   - Address critical issues immediately
   - Plan for high-priority recommendations
   - Schedule medium-priority items
   - Make final decision on alternative approaches (if any)

---

## Expected Output

You should get a comprehensive review covering:

- ✅ Schema design validation
- ✅ API architecture critique
- ✅ Payment flow security review
- ✅ Multi-tenancy security audit
- ✅ Performance analysis
- ✅ Migration strategy validation
- ✅ Integration patterns review
- ✅ Specific SQL changes needed
- ✅ Production readiness score

This will give you confidence that the database architecture is solid before you start building the frontend and API layers.

---

## Notes

- This prompt is designed to get honest, critical feedback
- The multi-role approach forces Claude to consider different perspectives
- Don't skip the "brutal honesty" part - you want to find issues NOW
- If Claude finds major issues, iterate on the schema and re-run this review
- Once you get a high production readiness score (8+/10), proceed with implementation

---

**Estimated Review Time:** 15-25 minutes for Claude to complete full analysis

**What to do with results:**
1. Address all critical issues
2. Update `database-schema-design.md` with recommended changes
3. Create implementation tickets based on recommendations
4. Re-run this review if major changes made
5. Proceed to API implementation once approved
