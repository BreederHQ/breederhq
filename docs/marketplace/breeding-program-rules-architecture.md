# Breeding Program Rules & Automation Architecture

## Overview

A cascading rules engine that allows breeders to set automation rules at the Breeding Program level that cascade down through Breeding Plans → Offspring Groups → Individual Offspring. Rules can be overridden at each level for granular control.

## Rule Hierarchy (Inheritance Chain)

```
Breeding Program (top-level defaults)
  ↓ overrides
Breeding Plan (plan-specific rules)
  ↓ overrides
Offspring Group (litter-specific rules)
  ↓ overrides
Individual Offspring (final override)
```

## Rule Categories

### 1. Listing Automation
- **Auto-list offspring when Available**: Automatically set `marketplaceListed = true` when `keeperIntent = AVAILABLE`
- **Auto-list at age threshold**: Only list offspring when age >= X weeks
- **Require photos for listing**: Only auto-list if at least N photos exist
- **Auto-unlist on status change**: Unlist when keeper intent changes from AVAILABLE
- **Auto-list group on first birth**: List group when first offspring is born
- **Auto-unlist group when empty**: Unlist when all offspring are placed

### 2. Pricing Rules
- **Default price by sex**: Set different default prices for males vs females
- **Coat color pricing**: Apply multipliers or adjustments based on coat color/pattern
- **Early deposit discount**: Apply discount if deposit received before birth
- **Age-based pricing**: Adjust price as offspring age (older = cheaper)
- **Copy group price**: Automatically copy group price to all offspring
- **Dynamic pricing tiers**: Multiple pricing levels based on demand

### 3. Visibility & Privacy
- **Hide photos until age**: Don't show photos until offspring reach X weeks
- **Blur photos until deposit**: Show blurred previews until deposit received
- **Limited info for non-depositors**: Show only basic info to non-paying viewers
- **Hide offspring until group listed**: Don't show individual offspring until group is public
- **Auto-hide completed plans**: Automatically hide plans from public view when completed

### 4. Buyer Interaction
- **Accept inquiries**: Enable/disable inquiry form
- **Accept waitlist signups**: Enable/disable waitlist
- **Max waitlist size**: Cap waitlist at N people
- **Accept reservations**: Enable/disable deposit-based reservations
- **Deposit amount**: Fixed amount or percentage of price
- **Auto-respond to inquiries**: Send template response to new inquiries

### 5. Status Updates
- **Auto-update group status**: Sync group status with breeding plan status
- **Auto-mark as placed**: Mark offspring as PLACED when deposit >= full price
- **Auto-archive plans**: Archive plan X days after completion
- **Auto-update availability**: Recalculate availability counts on status changes

### 6. Notifications
- **Notify waitlist on photos**: Send email when new photos added
- **Notify on status change**: Alert buyers when offspring status changes
- **Weekly update emails**: Send progress updates every X days
- **Notify on availability**: Alert waitlist when offspring becomes available

## Data Model

### Rule Structure

```typescript
interface BreedingProgramRule {
  id: number;
  tenantId: number;

  // Rule identity
  category: 'listing' | 'pricing' | 'visibility' | 'buyer_interaction' | 'status' | 'notifications';
  ruleType: string; // Specific rule within category (e.g., 'auto_list_available')
  name: string;
  description: string;
  enabled: boolean;

  // Configuration (varies by rule type)
  config: Record<string, any>;

  // Hierarchy
  level: 'program' | 'plan' | 'group' | 'offspring';
  levelId: string; // Program slug or entity ID
  inheritsFromId?: number; // Parent rule ID if overriding

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### Example Configurations

#### Auto-list Available Offspring
```json
{
  "ruleType": "auto_list_available",
  "config": {
    "triggerOn": "keeperIntent",
    "triggerValue": "AVAILABLE",
    "conditions": {
      "minAgeWeeks": 8,
      "requirePhotos": true,
      "minPhotoCount": 1
    }
  }
}
```

#### Default Pricing by Sex
```json
{
  "ruleType": "default_price_by_sex",
  "config": {
    "malePriceCents": 250000,
    "femalePriceCents": 280000,
    "applyToExisting": false
  }
}
```

#### Coat Color Pricing Adjustments
```json
{
  "ruleType": "coat_color_pricing",
  "config": {
    "adjustments": [
      { "pattern": "merle", "type": "multiplier", "value": 1.5 },
      { "pattern": "sable", "type": "add", "value": 20000 },
      { "pattern": "black", "type": "add", "value": 0 }
    ]
  }
}
```

#### Hide Photos Until Age
```json
{
  "ruleType": "hide_photos_until_age",
  "config": {
    "minAgeWeeks": 6,
    "showBlurred": true,
    "showCount": true
  }
}
```

## Rule Resolution Algorithm

```typescript
function getEffectiveRules(
  level: 'offspring' | 'group' | 'plan' | 'program',
  id: string | number,
  tenantId: number
): BreedingProgramRule[] {
  // 1. Build inheritance chain
  const chain = buildInheritanceChain(level, id);
  // Example: offspring(123) → group(45) → plan(6) → program('german-shepherds')

  // 2. Fetch all rules for entities in chain
  const allRules = await prisma.breedingProgramRule.findMany({
    where: {
      tenantId,
      OR: chain.map(node => ({
        level: node.level,
        levelId: node.id.toString()
      }))
    }
  });

  // 3. Group by ruleType (same rule at different levels)
  const rulesByType = groupBy(allRules, 'ruleType');

  // 4. For each rule type, apply cascading logic
  const effectiveRules = [];
  for (const [type, rules] of Object.entries(rulesByType)) {
    // Sort by specificity (offspring > group > plan > program)
    const sorted = sortBySpecificity(rules, chain);

    // Most specific (closest to leaf) wins
    const effective = sorted[0];
    if (effective.enabled) {
      effectiveRules.push(effective);
    }
  }

  return effectiveRules;
}

function buildInheritanceChain(
  level: string,
  id: string | number
): ChainNode[] {
  const chain: ChainNode[] = [];

  switch (level) {
    case 'offspring':
      const offspring = await prisma.offspring.findUnique({
        where: { id: Number(id) },
        include: { OffspringGroup: { include: { BreedingPlan: true } } }
      });
      if (offspring) {
        chain.push({ level: 'offspring', id: offspring.id });
        if (offspring.OffspringGroup) {
          chain.push({ level: 'group', id: offspring.OffspringGroup.id });
          if (offspring.OffspringGroup.BreedingPlan) {
            chain.push({ level: 'plan', id: offspring.OffspringGroup.BreedingPlan.id });
            // Find program via species/breed match
            const programSlug = findProgramForPlan(offspring.OffspringGroup.BreedingPlan);
            if (programSlug) {
              chain.push({ level: 'program', id: programSlug });
            }
          }
        }
      }
      break;

    case 'group':
      // Similar logic...
      break;

    // ... other cases
  }

  return chain;
}
```

## Rule Execution Triggers

### 1. On Data Change (Webhooks)
- **Offspring created**: Check listing rules
- **Keeper intent changed**: Check auto-list/unlist rules
- **Age milestone reached**: Check age-based rules (via cron)
- **Photo added**: Check photo-based rules, send notifications
- **Price changed**: Check pricing rules

### 2. On Scheduled Basis (Cron Jobs)
- **Daily**: Age-based rules (check all offspring birthdays)
- **Weekly**: Send update emails to buyers
- **On milestone**: Send notifications for status changes

### 3. On User Action
- **Before save**: Validate pricing rules, apply defaults
- **After save**: Execute notification rules
- **On publish**: Validate all rules are satisfied

## Database Schema

```sql
-- Main rules table
CREATE TABLE BreedingProgramRule (
  id SERIAL PRIMARY KEY,
  tenantId INTEGER NOT NULL REFERENCES Tenant(id),

  -- Rule identity
  category VARCHAR(50) NOT NULL,
  ruleType VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,

  -- Configuration (JSONB for flexibility)
  config JSONB NOT NULL DEFAULT '{}',

  -- Hierarchy tracking
  level VARCHAR(20) NOT NULL,
  levelId VARCHAR(50) NOT NULL,
  inheritsFromId INTEGER REFERENCES BreedingProgramRule(id),

  -- Metadata
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_level CHECK (level IN ('program', 'plan', 'group', 'offspring')),
  CONSTRAINT valid_category CHECK (category IN ('listing', 'pricing', 'visibility', 'buyer_interaction', 'status', 'notifications')),
  CONSTRAINT unique_rule_per_level UNIQUE (tenantId, level, levelId, ruleType)
);

CREATE INDEX idx_breeding_rule_tenant ON BreedingProgramRule(tenantId);
CREATE INDEX idx_breeding_rule_level ON BreedingProgramRule(level, levelId);
CREATE INDEX idx_breeding_rule_parent ON BreedingProgramRule(inheritsFromId);
CREATE INDEX idx_breeding_rule_type ON BreedingProgramRule(ruleType);

-- Rule execution log (for debugging and audit)
CREATE TABLE BreedingProgramRuleExecution (
  id SERIAL PRIMARY KEY,
  tenantId INTEGER NOT NULL REFERENCES Tenant(id),
  ruleId INTEGER NOT NULL REFERENCES BreedingProgramRule(id),

  -- Execution context
  triggeredBy VARCHAR(50) NOT NULL, -- 'user_action', 'cron_job', 'webhook'
  entityType VARCHAR(20) NOT NULL, -- 'offspring', 'group', 'plan'
  entityId INTEGER NOT NULL,

  -- Result
  success BOOLEAN NOT NULL,
  action VARCHAR(100), -- 'set_marketplace_listed', 'update_price', etc.
  changes JSONB, -- What actually changed
  error TEXT,

  -- Metadata
  executedAt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_breeding_rule_exec_tenant ON BreedingProgramRuleExecution(tenantId);
CREATE INDEX idx_breeding_rule_exec_rule ON BreedingProgramRuleExecution(ruleId);
CREATE INDEX idx_breeding_rule_exec_entity ON BreedingProgramRuleExecution(entityType, entityId);
```

## Implementation Phases

### Phase 1: Core Infrastructure (MVP)
- [ ] Database schema and migrations
- [ ] Prisma models for rules
- [ ] Rule resolution engine (inheritance chain)
- [ ] Basic CRUD API endpoints
- [ ] Implement first 2 rules: auto-list available, default pricing

### Phase 2: Program-Level UI
- [ ] Rules management tab in Program Editor
- [ ] Toggle switches for basic rules
- [ ] Configuration forms for complex rules
- [ ] Rule preview/testing mode

### Phase 3: Cascade & Override
- [ ] Inheritance tracking in API
- [ ] Override UI at plan/group/offspring levels
- [ ] Visual indicators (inherited vs overridden)
- [ ] Conflict detection and warnings

### Phase 4: Rule Execution
- [ ] Trigger hooks on offspring CRUD
- [ ] Trigger on status changes
- [ ] Background cron jobs for time-based rules
- [ ] Execution logging and audit trail

### Phase 5: Advanced Features
- [ ] Rule templates library
- [ ] Bulk apply rules to existing data
- [ ] Rule impact preview ("X offspring will be affected")
- [ ] Analytics dashboard for rule effectiveness

## API Endpoints

```typescript
// Create/update rule
POST /api/v1/breeding-programs/rules
{
  level: 'program',
  levelId: 'german-shepherds',
  ruleType: 'auto_list_available',
  config: { minAgeWeeks: 8, requirePhotos: true }
}

// Get effective rules for entity
GET /api/v1/breeding-programs/rules/effective?level=offspring&id=123

// Get all rules for a level
GET /api/v1/breeding-programs/rules?level=program&levelId=german-shepherds

// Override a rule
POST /api/v1/breeding-programs/rules/:ruleId/override
{
  level: 'offspring',
  levelId: '123',
  enabled: false
}

// Delete rule (remove override, revert to inherited)
DELETE /api/v1/breeding-programs/rules/:ruleId

// Test rule impact (preview)
POST /api/v1/breeding-programs/rules/preview
{
  ruleType: 'auto_list_available',
  config: { minAgeWeeks: 8 },
  dryRun: true
}

// Get rule execution history
GET /api/v1/breeding-programs/rules/:ruleId/executions
```

## Security Considerations

1. **Tenant Isolation**: All rules scoped to tenantId
2. **Permission Checks**: Only tenant members can create/edit rules
3. **Validation**: Validate config schema for each rule type
4. **Rate Limiting**: Prevent abuse of rule execution API
5. **Audit Logging**: Track all rule changes and executions

## Testing Strategy

### Unit Tests
- Rule resolution logic (inheritance chain)
- Individual rule execution functions
- Config validation

### Integration Tests
- End-to-end rule execution
- Cascade behavior
- Override scenarios

### User Acceptance Tests
- Create rule at program level
- Verify it applies to offspring
- Override at offspring level
- Verify override takes precedence

## Success Metrics

1. **Adoption**: % of breeders using at least 1 rule
2. **Time Saved**: Reduction in manual listing operations
3. **Errors Prevented**: Fewer incorrectly listed offspring
4. **Satisfaction**: User feedback on automation value
