# Finance Recon Package

## Overview

This package documents the platform recon for the **BreederHQ Finance MVP**. The objective was to inventory existing Finance-related schema, API endpoints, and UI surfaces, then define gaps and recommend a concrete MVP implementation path.

**Date:** 2025-12-28
**Scope:** Finance module (Invoice, Payment, Expense)
**Approach:** Documentation-based recon (backend repo not directly accessible)
**Status:** Complete

## What Was Scanned

### Backend (via Documentation)
- **Party migration docs:** `breederhq-api/docs/migrations/party/`
  - `TEST_PLAN_FINANCE.md` — Documents Invoice, OffspringContract, ContractParty models
  - `VALIDATION_QUERIES_FINANCE.md` — SQL validation scripts
- **Migration strategy:** Party Phase 5 (adding `partyId` to Finance models)
- **Schema inference:** Based on test plans, validation queries, and frontend types

### Frontend (Direct Access)
- **Finance app:** `apps/finance/src/App-Finance.tsx` (standalone module with mock data)
- **Finance tabs:** Existing placeholders in Contact/Organization detail views
- **Tab patterns:** `@bhq/ui` component library (`DetailsScaffold`, `Tabs`)
- **API client patterns:** `packages/api/src/` (HTTP layer, resource functions)
- **Type definitions:** `packages/api/src/types/` (animals, breeding, offspring, party)

### Entity Graph
- **Breeding flow:** BreedingPlan → OffspringGroup → Offspring → Buyer (Party)
- **Animal relations:** Animal ↔ BreedingPlan (as dam/sire)
- **Finance anchors:** Invoice/Expense → Animal/OffspringGroup/BreedingPlan/Party

## Key Findings Summary

### 1. Schema Findings
- **Invoice model EXISTS** with Party migration in progress (`clientPartyId` added, legacy `contactId`/`organizationId` deprecated)
- **Payment model DOES NOT EXIST** — critical gap for MVP
- **Expense model DOES NOT EXIST** — critical gap for MVP
- **Invoice explicit anchors MISSING** — Current schema has no `offspringGroupId`, `offspringId`, `animalId`, `breedingPlanId` FKs
- **Legacy polymorphic pattern** — Invoice has `scope` enum (OFFSPRING, GENERAL) instead of explicit typed FKs

**Risk:** Medium. Schema additions are straightforward (new models, new FKs, new indexes). No complex migrations required.

### 2. API Findings
- **Finance CRUD endpoints DO NOT EXIST** (per migration docs: "Finance write endpoints NOT YET IMPLEMENTED")
- **Party resolver service EXISTS** — `party-resolver-finance.ts` ready for use when endpoints are built
- **Tenant enforcement patterns ESTABLISHED** — All modules use `tenantId` filter + middleware
- **Pagination pattern ESTABLISHED** — `{ items, total }` envelope, client normalizes

**Risk:** Medium. Backend work required, but patterns are well-established. Follow existing CRUD patterns.

### 3. UI Findings
- **Finance tabs EXIST** on Contact/Organization (placeholder "Coming Soon")
- **Finance tabs MISSING** on Animal, OffspringGroup, BreedingPlan
- **Finance module EXISTS** — Standalone app with invoice list, detail drawer, create/edit modal (mock data only)
- **Tab component pattern ESTABLISHED** — `DetailsScaffold` + `Tabs` from `@bhq/ui`

**Risk:** Low. UI patterns are consistent. Finance tab content is copy/paste with API integration.

### 4. Entity Graph Findings
- **Breeding rollup path CLEAR:** BreedingPlan → OffspringGroup → Offspring → Invoice
- **Animal Finance path CLEAR:** Animal → BreedingPlan → OffspringGroup → Invoice (via dam/sire)
- **Party Finance path CLEAR:** Party → Invoice (as client), Party → Expense (as vendor)
- **Explicit anchor FKs RECOMMENDED** over polymorphic pattern for referential integrity and query performance

**Risk:** Low. Paths are well-defined. Explicit FKs eliminate join complexity.

### 5. Gaps Identified
| Gap | Priority | Impact |
|-----|----------|--------|
| Payment model missing | CRITICAL | Cannot record invoice payments |
| Expense model missing | CRITICAL | Cannot track expenses |
| Invoice explicit anchors missing | CRITICAL | Cannot build Finance tabs efficiently |
| Finance CRUD API endpoints missing | CRITICAL | Backend not functional |
| Finance tab content missing (3 objects) | HIGH | UX incomplete |
| Autocomplete components missing | HIGH | Poor UX for Party/Animal/OffspringGroup selection |
| Payment recording UI missing | MEDIUM | Cannot record payments (even with backend) |
| Expense UI missing | MEDIUM | Cannot create expenses |

## Documentation Files

### [schema-findings.md](schema-findings.md)
**What exists:** Invoice, OffspringContract, ContractParty models (from Party migration docs)
**What's missing:** Payment, Expense, explicit Invoice anchors
**Recommendations:** Add Payment/Expense models, add nullable FKs (offspringGroupId, offspringId, animalId, breedingPlanId) to Invoice/Expense, add composite indexes

**Key tables:**
- Invoice model field inventory (existing + proposed)
- Payment model schema (NEW)
- Expense model schema (NEW)
- Index plan for Finance tab queries

### [api-findings.md](api-findings.md)
**What exists:** API infrastructure (HTTP layer, tenant scoping, pagination), Party resolver service
**What's missing:** Invoice/Payment/Expense CRUD endpoints, Finance tab query endpoints
**Recommendations:** Build REST endpoints for Invoice/Payment/Expense, implement balance recalculation service, enforce tenant scoping middleware

**Key sections:**
- API endpoint patterns (GET/POST/PATCH/DELETE)
- Finance tab query patterns (anchor-based filters)
- Request/response schemas
- Party resolver integration

### [ui-findings.md](ui-findings.md)
**What exists:** Finance module (standalone), Finance tab placeholders (Contact/Organization), tab component patterns
**What's missing:** Finance tab content (Animal/OffspringGroup/BreedingPlan), Payment/Expense modals, autocomplete components
**Recommendations:** Extract FinanceTabContent component, build PaymentFormModal, build ExpenseFormModal, build autocomplete components

**Key sections:**
- Finance tab status table (by object type)
- Tab component pattern (`DetailsScaffold`)
- Invoice mock data structure
- Required UI components (modals, autocompletes)
- Component hierarchy

### [entity-graph.md](entity-graph.md)
**Join paths:** BreedingPlan → OffspringGroup → Offspring → Party, Animal → BreedingPlan, Party → Invoice/Expense
**Rollup queries:** Revenue by BreedingPlan, Expenses by Animal, Net profit calculations
**Recommendations:** Use explicit anchor FKs (not polymorphic), create composite indexes, validate with sample data

**Key sections:**
- Entity relationship diagrams (as join paths)
- SQL queries for Finance tab data
- Rollup/aggregation queries
- Index requirements
- Polymorphic vs explicit anchors comparison

### [gaps-and-recommendations.md](gaps-and-recommendations.md)
**MVP schema proposal:** Payment model, Expense model, Invoice explicit anchors, indexes
**Guardrails:** Tenant enforcement, soft delete (void invoices), balance integrity, mutually exclusive anchors
**Migration strategy:** Align with Party migration workflow (dev uses `db push`)
**Implementation order:** Schema → Backend API → Frontend API clients → Shared components → Finance tab integration

**Key sections:**
- Complete Prisma schema for Payment, Expense, Invoice enhancements
- Business rules (balance recalculation, anchor exclusivity, currency handling)
- Migration steps (dev + production)
- Implementation prerequisites (backend + frontend checklists)
- Risk matrix
- MVP feature scope (in/out)
- Development order (11-17 day estimate)

## Implementation Prerequisites

### Backend (breederhq-api)
- [ ] Add Payment model to `schema.prisma`
- [ ] Add Expense model to `schema.prisma`
- [ ] Add explicit anchor FKs to Invoice model (offspringGroupId, offspringId, animalId, breedingPlanId)
- [ ] Add composite indexes (tenantId + anchor fields)
- [ ] Run `npx prisma db push` (dev)
- [ ] Build Invoice CRUD API endpoints (`/api/v1/invoices`)
- [ ] Build Payment CRUD API endpoints (`/api/v1/payments`)
- [ ] Build Expense CRUD API endpoints (`/api/v1/expenses`)
- [ ] Implement `recalculateInvoiceBalance()` service
- [ ] Enforce tenant scoping middleware on all Finance endpoints
- [ ] Write API integration tests (Invoice/Payment/Expense CRUD + balance updates)

### Frontend (monorepo)
- [ ] Create `packages/api/src/resources/invoices.ts` API client
- [ ] Create `packages/api/src/resources/payments.ts` API client
- [ ] Create `packages/api/src/resources/expenses.ts` API client
- [ ] Export resources from `packages/api/src/index.ts`
- [ ] Build `FinanceTabContent.tsx` component (reusable for all objects)
- [ ] Build `PaymentFormModal.tsx` component
- [ ] Build `ExpenseFormModal.tsx` component
- [ ] Build `PartyAutocomplete.tsx` component
- [ ] Build `AsyncAutocomplete.tsx` generic component
- [ ] Build `AnimalAutocomplete.tsx`, `OffspringGroupAutocomplete.tsx`, `BreedingPlanAutocomplete.tsx`
- [ ] Add Finance tab to Animal detail view ([apps/animals/src/App-Animals.tsx:4345](../../../apps/animals/src/App-Animals.tsx#L4345))
- [ ] Add Finance tab to OffspringGroup detail view ([apps/offspring/src/App-Offspring.tsx:5040](../../../apps/offspring/src/App-Offspring.tsx#L5040))
- [ ] Add Finance tab to BreedingPlan detail view ([apps/breeding/src/App-Breeding.tsx:64](../../../apps/breeding/src/App-Breeding.tsx#L64))
- [ ] Replace Finance tab placeholder in Contact/Party detail view ([apps/contacts/src/PartyDetailsView.tsx:675](../../../apps/contacts/src/PartyDetailsView.tsx#L675))
- [ ] Replace Finance tab placeholder in Organization detail view ([apps/organizations/src/App-Organizations.tsx:345](../../../apps/organizations/src/App-Organizations.tsx#L345))
- [ ] Write frontend integration tests (Finance tab workflows)

## Highest-Impact Findings

1. **Payment model does not exist.** Invoice payments cannot be recorded. CRITICAL blocker for MVP.

2. **Expense model does not exist.** Expense tracking is non-functional. CRITICAL blocker for MVP.

3. **Invoice has no explicit anchor FKs.** Finance tabs cannot query "invoices for this animal" efficiently. Requires multi-join through BreedingPlan → OffspringGroup. CRITICAL for performance.

4. **Finance CRUD API endpoints not implemented.** Backend is not functional. Per migration docs: "Finance write endpoints NOT YET IMPLEMENTED." CRITICAL blocker.

5. **Finance tabs missing on Animal, OffspringGroup, BreedingPlan.** Users cannot see Finance data in context. HIGH priority UX gap.

6. **No autocomplete components for Party/Animal/OffspringGroup.** Invoice creation UX relies on free-text input (no validation, no FK enforcement). HIGH priority UX gap.

7. **No Payment recording UI.** Even if backend exists, frontend cannot record payments. MEDIUM priority UX gap.

8. **Invoice explicit anchors eliminate need for polymorphic joins.** Direct `Invoice.animalId` FK is faster and safer than `scope + contextId` polymorphism. HIGH impact architectural decision.

9. **Party migration (Phase 5) foundation is solid.** `clientPartyId` exists, resolver service exists, dual-write pattern established. LOW risk for Finance integration.

10. **Finance module (standalone app) demonstrates MVP UX.** Mock data shows expected invoice list, detail drawer, create/edit flow. Use as blueprint for Finance tab content. MEDIUM impact for implementation speed.

11. **Tenant enforcement patterns are consistent.** All modules filter by `tenantId`. Finance must follow suit. CRITICAL for security, LOW risk (pattern exists).

12. **Currency stored as cents (Int) avoids precision errors.** Standard accounting practice. Follow existing pattern. LOW risk, HIGH impact for data integrity.

## Next Steps

### Immediate (Before Implementation)
1. **Obtain backend repo access** to validate schema assumptions (recommended but not blocking)
2. **Review this recon package** with backend/frontend leads for alignment
3. **Estimate effort** for backend API + frontend integration (recommend 2-3 weeks per gaps-and-recommendations.md)
4. **Prioritize MVP scope** — confirm Payment/Expense are in scope, defer line items to Phase 2

### Implementation Phase
1. **Backend:** Schema changes → API endpoints → tests (5-7 days)
2. **Frontend:** API clients → shared components → Finance tab integration (6-10 days)
3. **Testing:** E2E workflows, performance tests, security audit (2-3 days)

### Post-MVP (Phase 2)
- Line items (itemized invoices)
- Multi-currency support
- Invoice PDF generation
- Payment gateway integration (Stripe, PayPal)
- Expense budgeting and reports
- Financial dashboards (P&L, cash flow)

## Files in This Package

```
docs/recon/finance/
├── README.md                         (this file)
├── schema-findings.md                (Invoice/Payment/Expense models)
├── api-findings.md                   (Endpoints, patterns, tenant scoping)
├── ui-findings.md                    (Finance tabs, components, UX gaps)
├── entity-graph.md                   (Join paths, rollup queries, indexes)
└── gaps-and-recommendations.md       (MVP schema, guardrails, implementation plan)
```

## Contact

For questions or clarifications on this recon:
- **Schema questions:** See [schema-findings.md](schema-findings.md)
- **API questions:** See [api-findings.md](api-findings.md)
- **UI questions:** See [ui-findings.md](ui-findings.md)
- **Implementation plan:** See [gaps-and-recommendations.md](gaps-and-recommendations.md)

---

**Recon complete.** Ready for implementation planning.
