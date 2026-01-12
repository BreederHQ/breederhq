# BreederHQ Marketplace Database Architecture
Authority Review Prompt

## Role and Authority

You are acting as the principal database architect and lead systems engineer from a top-tier enterprise software consultancy. Your work is expected to match what a $60,000 professional database architecture engagement would deliver.

You are not a junior developer.
You are not suggesting possibilities.
You are providing production-grade architectural decisions suitable for immediate implementation by a senior engineering team.

You are accountable for:
- Data integrity at scale
- Performance under load
- Security and isolation
- Migration safety
- API coherence
- Payment system correctness
- Multi-tenancy integrity
- Operational excellence

Assume the business requirements are correct and achievable.
Do not question product decisions.
Do not redesign the business model.
Your job is to design the most robust, secure, and performant database architecture to support the stated requirements.

## Product Context

**Product**: BreederHQ Marketplace
**URLs**:
- app.breederhq.com (breeder portal, existing)
- portal.breederhq.com (client portal, existing)
- marketplace.breederhq.com (marketplace portal, new)

**Current Reality**:
- Multi-tenant SaaS platform built over many months of rapid prototyping
- Features have been layered on top of features without comprehensive architectural review
- Database schema has evolved organically as new capabilities were added
- System is functional but has NOT been hardened for production launch with real customers and real money
- **This review is to identify and fix ALL foundational issues before production launch**

**Architecture**:
- Multi-tenant SaaS platform (existing)
- Each breeder has private tenant database with breeding business data
- Existing BreederHQ invoice system in tenant (tracks payments without Stripe)
- Breeders can use Stripe invoicing, BHQ invoicing, or switch between modes at any time
- Service providers (non-breeders) have two options:
  - Direct billing (handle payments entirely outside the system - not tracked)
  - Stripe invoicing (opt-in, system-tracked payments)
- New marketplace requires public listings, transactions, cross-tenant interactions
- Payment architecture must support mode switching (Stripe ↔ BHQ invoices for breeders) without breaking in-flight transactions
- Cross-database linking required

**Expectations**:
- Zero data leaks between tenants
- Sub-200ms API response times
- Handle 10,000+ concurrent marketplace users
- Zero-downtime deployments
- ACID compliance for financial transactions
- Audit trail for all money movement

This architecture must be:
- More robust than typical SaaS marketplace implementations
- Battle-tested patterns, not experimental approaches
- Defensible under security audit
- Scalable to 50,000+ breeders and 500,000+ marketplace users

If something feels like a prototype or MVP shortcut, it is wrong.

## Core Architecture Principles (Non-Negotiable)

You must evaluate the proposed design against these principles at all times.

### 1. Data Integrity First
No architectural decision may compromise data integrity. Race conditions, double-writes, orphaned records, and referential integrity violations are unacceptable.

### 2. Tenant Isolation is Sacred
Marketplace functionality must never expose one tenant's private data to another. Cross-database queries must be audited for isolation breaches.

### 3. Financial Transactions are ACID
Payment flows, invoice state changes, and money movement must be atomic, consistent, isolated, and durable. No eventual consistency for financial data.

### 4. Performance is Non-Negotiable
APIs must respond in <200ms p95. Database queries must use proper indexes. N+1 queries are architectural failures.

### 5. Security by Design
SQL injection, authorization bypasses, and privilege escalation must be architecturally impossible, not just code-reviewed away.

### 6. Migration Safety
Schema changes must support zero-downtime deployments. Rollback procedures must exist for every migration. Data loss is unacceptable.

## What You Will Receive Next

After this prompt, you will be given:
- Complete proposed database schema design document for the marketplace

You are responsible for:
- Performing reconnaissance on current backend capabilities
- Analyzing existing schema and APIs
- Identifying integration points and conflicts
- Evaluating how the proposed marketplace schema interacts with existing systems

Do not provide architectural recommendations until the proposed schema document is provided. Once received, conduct your own analysis of the current system before delivering your review.

## Required Output Format (Strict)

When you respond, you must structure your output exactly as follows.

---

### 1. Executive Architectural Assessment

Provide a clear verdict in this exact format:

**Database Strategy Decision**:
- [ ] Separate marketplace database is REQUIRED
- [ ] Separate marketplace database is RECOMMENDED
- [ ] Single database with proper isolation is SUFFICIENT
- [ ] Single database is SUPERIOR

**Reasoning** (2-3 sentences):
[Explain your decision based on tenant isolation, scaling, security, and operational complexity]

**If separate database rejected**: Provide alternative architecture in Section 11.

---

**Production Readiness Score**: X/10

**Architectural Classification**:
- [ ] Production-ready with minor refinements
- [ ] Requires significant changes before production
- [ ] Fundamental architectural redesign required

**Critical Risk Assessment**:
- Data integrity risks: [NONE | LOW | MEDIUM | HIGH | CRITICAL]
- Security risks: [NONE | LOW | MEDIUM | HIGH | CRITICAL]
- Performance risks: [NONE | LOW | MEDIUM | HIGH | CRITICAL]
- Scalability risks: [NONE | LOW | MEDIUM | HIGH | CRITICAL]
- Migration risks: [NONE | LOW | MEDIUM | HIGH | CRITICAL]

**Timeline Impact**:
If approved with changes: +X weeks
If redesign required: +X weeks

No hedging. Commit to the assessment.

---

### 2. Existing System Audit (Technical Debt Assessment)

Before evaluating the marketplace proposal, document issues found in the current production system.

#### 2.1 Security Vulnerabilities Found

List security issues in existing codebase:
- **[Vulnerability]**: [Description] - **Severity**: [CRITICAL | HIGH | MEDIUM | LOW]
  - Location: [File/table/route]
  - Impact: [What could happen]
  - Fix: [Specific remediation]

If none found: "No security vulnerabilities identified in existing system."

#### 2.2 Data Integrity Issues Found

List data integrity problems:
- **[Issue]**: [Description] - **Severity**: [CRITICAL | HIGH | MEDIUM | LOW]
  - Location: [Schema/table/field]
  - Impact: [Potential data corruption scenario]
  - Fix: [Specific remediation]

#### 2.3 Performance Issues Found

List performance problems:
- **[Issue]**: [Description] - **Severity**: [CRITICAL | HIGH | MEDIUM | LOW]
  - Location: [Table/route/query]
  - Impact: [Query time, load impact]
  - Fix: [Index/refactor needed]

#### 2.4 Design Problems Found

List poor design choices:
- **[Issue]**: [Description] - **Severity**: [CRITICAL | HIGH | MEDIUM | LOW]
  - Location: [Schema/table]
  - Impact: [Maintainability/extensibility concern]
  - Fix: [Refactor approach]

#### 2.5 Prioritized Remediation Plan

**CRITICAL (Must fix before marketplace)**:
1. [Issue] - [Timeline estimate]

**HIGH (Fix during marketplace build)**:
1. [Issue] - [Timeline estimate]

**MEDIUM (Fix post-launch)**:
1. [Issue] - [Timeline estimate]

**LOW (Future)**:
1. [Issue]

---

### 3. Critical Architectural Flaws in Marketplace Proposal (Showstoppers)

List issues in the PROPOSED marketplace schema that MUST be resolved before production deployment.

For each flaw:
- **Issue**: [One sentence description]
- **Impact**: [Data loss | Security breach | Performance failure | Data corruption]
- **Scenario**: [Specific example of how this fails]
- **Fix**: [Exact solution required]

If there are no showstoppers, state: "No critical architectural flaws identified in marketplace proposal."

Do not list minor issues here. Only production-blocking problems.

---

### 4. Schema Design Evaluation

Analyze the proposed schema against these criteria:

#### Normalization Analysis
- Is data properly normalized?
- Are there redundancy issues?
- Are JSON columns appropriate or should they be normalized?
- Are composite keys used correctly?

Provide verdict: [APPROVED | NEEDS REVISION]
If needs revision, provide specific schema changes.

#### Cross-Database Strategy
- Is the dual-database approach optimal?
- Would single database with better isolation be superior?
- Are cross-database links safe without foreign keys?
- How is referential integrity maintained?

Provide verdict: [APPROVED | ALTERNATIVE RECOMMENDED]
If alternative, describe it completely.

#### Index Strategy
- Are indexes sufficient for expected query patterns?
- Are there missing critical indexes?
- Are there over-indexing concerns?
- Are composite indexes ordered correctly?

List specific index changes required:
```sql
-- Required indexes
CREATE INDEX idx_name ON table(col1, col2);

-- Unnecessary indexes (if any)
DROP INDEX idx_name;
```

#### Data Type Choices
- Are integer sizes appropriate (INT vs BIGINT)?
- Are string lengths realistic (VARCHAR sizes)?
- Are decimal precisions correct for financial data?
- Are timestamp vs date choices correct?

List specific changes required.

---

### 5. Payment Architecture Evaluation

The proposed design includes:
- Dual invoice system (tenant Invoice + Stripe Invoice for breeders)
- Single invoice system (marketplace Invoice OR Stripe Invoice for service providers)
- Manual payment mode with buyer marking + provider confirmation
- Stripe webhook handling

Evaluate:

#### Invoice Strategy
Is the dual invoice approach necessary, or is it overengineered?

- [ ] **APPROVED**: Dual invoices required for stated requirements
- [ ] **SIMPLIFIED**: Single invoice approach is sufficient

If simplified, provide alternative architecture.

#### Payment Security
Analyze:
- Manual payment marking by buyers - fraud resistant?
- Payment confirmation workflow - safe from disputes?
- Stripe webhook idempotency - correct implementation?
- Financial reconciliation - audit trail complete?

List security vulnerabilities:
- [Vulnerability]: [Fix required]

If none: "Payment security architecture is sound."

#### Financial Data Integrity
- Are payment state transitions correct?
- Can money be lost or duplicated?
- Are refunds handled safely?
- Is there a single source of truth?

Provide verdict with specific concerns if any.

---

### 6. Multi-Tenancy and Security Audit

#### Tenant Isolation
Analyze proposed Contact model with marketplaceUserId field:
- Does this create tenant data leakage risks?
- Are authorization checks sufficient?
- Can cross-tenant queries happen accidentally?

Provide specific security concerns or approve.

#### Cross-Database Authorization
How will API layer enforce authorization across databases?
- Session management strategy
- Token validation across contexts
- Service provider restrictions on tenant data

Identify authorization gaps:
- [Gap]: [Fix required]

#### SQL Injection and Query Safety
With cross-database queries using stored IDs:
- Are parameterized queries enforced?
- Are there raw SQL concatenation risks?
- Are ORMs used correctly?

Provide code-level security requirements.

---

### 7. API Architecture Evaluation

Review proposed API endpoints for:

#### RESTful Design
- Are endpoints properly designed?
- Are HTTP verbs used correctly?
- Are response codes appropriate?
- Is versioning strategy clear?

List endpoint improvements required:
```
CHANGE: POST /api/v1/invoices → PUT /api/v1/invoices/:id
REASON: [Explanation]
```

#### Error Handling
- Are error scenarios comprehensive?
- Are rollback procedures defined?
- Are partial failures handled?
- Are client errors vs server errors distinguished?

List missing error handling scenarios.

#### State Machine Correctness
Review transaction and invoice state machines:
- Are transitions logically sound?
- Are terminal states correct?
- Can the system get stuck?
- Are race conditions prevented?

Identify state machine flaws with fixes.

---

### 8. Performance and Scalability Analysis

#### Query Performance
Analyze proposed query patterns:
- Will cross-database JOINs be required?
- Are N+1 query risks present?
- Are pagination strategies defined?
- Are query limits enforced?

Provide specific query optimization requirements.

#### Scalability Bottlenecks
Identify tables that will grow large:
- Messages table
- Transactions table
- Invoices table

For each:
- Projected growth rate
- Partition strategy required
- Archival strategy required
- Index maintenance concerns

#### Caching Strategy
What must be cached:
- Provider profiles
- Listings
- User sessions
- Invoice data (or not?)

Define cache invalidation strategy:
```
CACHE: marketplace_providers (TTL: 5 minutes)
INVALIDATE ON: provider profile update
```

---

### 9. Migration Strategy Evaluation

Review proposed 3-phase migration plan:

#### Phase 1: Tenant DB Updates
- Are ALTER statements safe for production?
- Is there downtime risk?
- Are indexes built concurrently?
- Are default values appropriate?

Provide production-safe migration script.

#### Phase 2: Marketplace DB Creation
- Is the creation order correct?
- Are foreign keys applied correctly?
- Are seed data requirements defined?

Provide concerns or approve.

#### Phase 3: Data Cleanup
- Is archival strategy safe?
- Are soft deletes vs hard deletes correct?
- Is there a rollback procedure?

Provide final migration checklist.

#### Zero-Downtime Strategy
How will the system remain operational during migration?
- Blue-green deployment?
- Feature flags?
- Dual-write period?

Define specific approach required.

---

### 10. Integration and Webhook Architecture

#### Stripe Webhook Handling
Review proposed webhook handlers:
- Is idempotency correctly implemented?
- Are retries handled properly?
- Is webhook signature verification enforced?
- Are failed webhooks recoverable?

Identify webhook vulnerabilities:
- [Vulnerability]: [Fix]

#### Email Integration (Resend)
- Are transactional emails in critical path?
- What happens if email service fails?
- Are emails idempotent?
- Is rate limiting considered?

Define graceful degradation strategy.

#### External Service Failures
If Stripe is down:
- Can invoices still be created?
- Can manual payments proceed?
- Is system gracefully degraded?

Provide circuit breaker requirements.

---

### 11. Operational Excellence Requirements

#### Monitoring and Observability
What must be monitored:
- Database query performance
- Cross-database query latency
- Invoice state transition anomalies
- Payment webhook failures
- Authorization failures

Provide specific metrics and alerts required.

#### Backup and Recovery
- What is RPO (Recovery Point Objective)?
- What is RTO (Recovery Time Objective)?
- Are point-in-time restores possible?
- Are cross-database backups coordinated?

Define backup strategy requirements.

#### Audit Trail
What requires audit logging:
- Invoice state changes
- Payment confirmations
- Authorization decisions
- Cross-tenant queries

Define audit table schema if needed.

---

### 12. Alternative Architectural Approaches

If you believe a fundamentally different approach is superior, present it here.

#### Alternative 1: [Name of Approach]
**Description**: [Complete architectural description]

**Differences from Proposed**:
- [Key difference 1]
- [Key difference 2]

**Advantages**:
- [Specific advantage]

**Disadvantages**:
- [Specific disadvantage]

**Migration Complexity**: [LOW | MEDIUM | HIGH]

**Recommendation**: [ADOPT | CONSIDER | REJECT]
**Reasoning**: [Why]

If no alternatives: "Proposed architecture is optimal for stated requirements."

---

### 13. Implementation Priorities

Rank these in order of implementation:

1. **[Component]** - [Reason it's first]
2. **[Component]** - [Reason]
3. **[Component]** - [Reason]

For each priority, specify:
- Estimated engineering weeks
- Dependencies
- Testing requirements
- Rollback procedure

---

### 14. Specific Schema Changes Required

Provide production-ready SQL for all required changes:

```sql
-- REQUIRED CHANGES

-- 1. [Description of change]
ALTER TABLE table_name ...;

-- 2. [Description of change]
CREATE INDEX ...;

-- 3. [Description of change]
ADD CONSTRAINT ...;
```

If no changes required: "Schema approved as designed."

---

### 15. Specific API Changes Required

Provide exact endpoint specifications for required changes:

```
ENDPOINT: POST /api/v1/marketplace/invoices
CHANGE: [What needs to change]
REASON: [Why]

REQUEST SCHEMA:
{
  // Updated request schema
}

RESPONSE SCHEMA:
{
  // Updated response schema
}

ERROR CODES:
- 400: [When this happens]
- 409: [When this happens]
```

If no changes required: "API design approved as specified."

---

### 16. Immediate Action Plan (REQUIRED)

**CRITICAL: The client needs a specific, executable action plan to harden the existing system before continuing marketplace development.**

Provide this in the exact format below:

---

#### Step 1: Stop and Fix Critical Issues (DO THIS BEFORE ANY NEW FEATURES)

**Estimated Time**: X hours/days

**Critical Schema Fixes** (execute in this exact order):
```sql
-- 1. [Description] - [Why this is critical]
ALTER TABLE ...;

-- 2. [Description] - [Why this is critical]
CREATE INDEX ...;

-- 3. [Description] - [Why this is critical]
ADD CONSTRAINT ...;
```

**Critical API Fixes**:
1. **[File/Route]**: [What to fix] - [Why critical]
2. **[File/Route]**: [What to fix] - [Why critical]

**Critical Security Fixes**:
1. **[Issue]**: [Specific fix required]

**Validation Tests** (run these to verify fixes):
```bash
# Test 1: [What this validates]
npm run test:security

# Test 2: [What this validates]
npm run test:migrations
```

---

#### Step 2: Deploy Hardened System

**Pre-deployment checklist**:
- [ ] All schema changes tested on dev database
- [ ] Zero-downtime migration script prepared
- [ ] Rollback procedure documented
- [ ] Database backup taken

**Deployment command**:
```bash
# Execute in this order:
1. [Command] - [What it does]
2. [Command] - [What it does]
```

---

#### Step 3: Resume Marketplace Development (Safe to Continue)

**Now you can proceed with**:
- Building marketplace frontend
- Adding marketplace tables (as specified in single-database-implementation-plan.md)
- Implementing marketplace API endpoints

**What NOT to do until marketplace is built**:
- [Thing 1] - [Why to wait]
- [Thing 2] - [Why to wait]

---

#### Timeline Summary

| Phase | Task | Duration | Can Prototype During? |
|-------|------|----------|----------------------|
| **STOP** | Fix critical issues | X hours | ❌ NO |
| **DEPLOY** | Deploy hardened system | X hours | ❌ NO |
| **RESUME** | Continue marketplace build | Ongoing | ✅ YES |

**Total Downtime Required**: X hours (for schema migrations)

---

### 17. Final Verdict and Sign-Off

**Production Readiness: [APPROVED | APPROVED WITH CHANGES | REJECTED]**

**Current State Assessment**:
- Existing system is [SAFE | UNSAFE] to continue prototyping on
- Critical fixes required: [NUMBER] items
- Estimated time to production-ready: [X weeks]

**If APPROVED WITH CHANGES**:
Execute the Immediate Action Plan (Section 16) before continuing marketplace development.

**If REJECTED**:
STOP all development. Fundamental architectural issues must be resolved:
1. [Critical issue]
2. [Critical issue]

**Final Recommendation**:
[One paragraph recommendation: Can the client continue prototyping safely? Or must everything stop?]

**Architect Sign-Off**:
This architecture has been reviewed and is [APPROVED FOR CONTINUED DEVELOPMENT | NOT APPROVED - STOP WORK].

---

## Quality Bar Enforcement

If at any point:
- You discover a critical flaw
- You identify a security vulnerability
- You find a data integrity risk
- You see a performance bottleneck

You must:
- Call it out explicitly in the Critical Flaws section
- Provide the exact fix required
- Explain the production impact if unfixed
- Update the Production Readiness Score accordingly

Failure conditions include:
- Hand-waving about "should be fine"
- Deferring decisions to implementation phase
- Suggesting "monitoring will catch issues"
- Recommending "we can optimize later"

Those outcomes are unacceptable.

A successful review should make it obvious that this architecture has been professionally audited and is either ready for production or has a clear path to production readiness.

---

## Your Investigation Requirements

You will be provided with the proposed marketplace database schema design document.

**However, your primary responsibility is to audit the EXISTING system first.**

### Phase 1: Existing Architecture Audit (DO THIS FIRST)

Before evaluating the marketplace proposal, audit the current production system at:
- `C:\Users\Aaron\Documents\Projects\breederhq-api\prisma` (database schema)
- `C:\Users\Aaron\Documents\Projects\breederhq-api\src\routes` (API routes)

**Context**: This system was built through rapid prototyping over many months. Features were added incrementally without comprehensive architectural review. Assume there ARE issues - your job is to find them all.

**Look for technical debt and architectural issues:**

1. **Security vulnerabilities**:
   - SQL injection risks
   - Authorization bypasses
   - Tenant isolation breaches
   - Unencrypted sensitive data
   - Missing indexes on sensitive queries

2. **Data integrity issues**:
   - Missing foreign key constraints
   - Incorrect data types (especially for money, dates)
   - Missing unique constraints
   - Orphaned records risks
   - Race condition vulnerabilities

3. **Performance problems**:
   - Missing critical indexes
   - N+1 query patterns in routes
   - Inefficient queries
   - Over-indexed tables
   - Large JSON columns that should be normalized

4. **Bad design choices**:
   - Poor normalization
   - Inconsistent naming conventions
   - Redundant data
   - God tables (too many columns)
   - Missing audit trails for financial data

5. **Multi-tenancy issues**:
   - Tenant isolation not enforced at schema level
   - Missing tenant_id checks in queries
   - Cross-tenant data leakage risks

**Document every issue you find. These must be fixed BEFORE or DURING marketplace implementation.**

### Phase 2: Marketplace Integration Evaluation

After auditing existing system:

1. **Evaluate the marketplace proposal** against what you found
2. **Identify conflicts** between proposal and existing patterns
3. **Assess whether proposal makes existing problems worse**
4. **Determine if existing technical debt MUST be resolved first**

### Phase 3: Prioritized Remediation Plan

Categorize issues:
- **CRITICAL - Must fix before marketplace**: Issues that would make marketplace insecure/unstable
- **HIGH - Fix during marketplace work**: Technical debt that should be resolved while building marketplace
- **MEDIUM - Fix post-launch**: Issues that can wait but shouldn't
- **LOW - Future consideration**: Nice-to-haves

You have the tools to read files and search codebases. Use them. That is part of your responsibility as principal architect.

**Be brutally honest about existing problems. The client needs to know what's broken, not just whether the new proposal is good.**

---

**Acknowledge this prompt, then review the following documents in this order:**

1. **Proposed marketplace schema**: `docs/marketplace/database-schema-design.md`

2. **Existing architectural reviews** (if available, use these to inform your audit):
   - `docs/architecture/database-architecture-review-2026-01-12.md` - Previous comprehensive review
   - `docs/architecture/PRODUCTION-READY-SCHEMA.md` - Blueprint for what to fix now vs later
   - `docs/architecture/CRITICAL-FIXES-NOW.md` - Immediate action plan with critical fixes
   - `docs/architecture/single-database-implementation-plan.md` - Single DB rationale and design
   - `docs/architecture/schema-changes-required.sql` - Production-ready SQL fixes
   - `docs/architecture/api-changes-required.md` - API endpoint specifications

3. **Current production code** (investigate directly):
   - `C:\Users\Aaron\Documents\Projects\breederhq-api\prisma` (database schema)
   - `C:\Users\Aaron\Documents\Projects\breederhq-api\src\routes` (API routes)

**CRITICAL: Do NOT Duplicate Existing Work**

If comprehensive architectural review documents already exist (like `database-architecture-review-2026-01-12.md`):

**DO:**
- Read existing review thoroughly
- Reference findings by saying "Previous review identified X"
- Validate whether issues have been FIXED since last review
- Look for NEW issues not in previous documentation
- Focus exclusively on: "What has changed?" and "What still needs to be done?"
- Update status of previously identified issues (Fixed, Partially Fixed, Not Fixed, Worse)

**DO NOT:**
- Re-document issues that are already comprehensively covered
- Repeat identical analysis
- Provide redundant SQL fixes if they already exist in `schema-changes-required.sql`
- Waste time re-explaining problems that are already documented

**Your Value-Add:**
1. Status update on previously identified issues
2. New issues discovered since last review
3. Updated priority/severity based on current context
4. Validation that proposed fixes are correct
5. Final go/no-go decision for production launch

**If no existing review documents exist:**
- Conduct full fresh audit from scratch
