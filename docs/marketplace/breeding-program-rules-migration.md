# Breeding Program Rules Migration Guide

## Migration Name
```
add_breeding_program_rules
```

## Database Changes

### New Enums
1. **BreedingRuleCategory** - Categories of automation rules
   - LISTING
   - PRICING
   - VISIBILITY
   - BUYER_INTERACTION
   - STATUS
   - NOTIFICATIONS

2. **BreedingRuleLevel** - Hierarchy levels for rule inheritance
   - PROGRAM
   - PLAN
   - GROUP
   - OFFSPRING

### New Tables

#### 1. BreedingProgramRule
Stores automation rules that cascade through the breeding program hierarchy.

**Columns:**
- `id` - Serial primary key
- `tenantId` - Foreign key to Tenant
- `category` - BreedingRuleCategory enum
- `ruleType` - String (100 chars) - specific rule within category
- `name` - String (255 chars)
- `description` - Text (nullable)
- `enabled` - Boolean (default true)
- `config` - JSONB (default '{}') - rule-specific configuration
- `level` - BreedingRuleLevel enum
- `levelId` - String (50 chars) - program slug or entity ID
- `inheritsFromId` - Integer (nullable) - self-referential FK for inheritance
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

**Indexes:**
- `tenantId`
- `level, levelId`
- `inheritsFromId`
- `ruleType`
- `tenantId, enabled`

**Unique Constraint:**
- `tenantId, level, levelId, ruleType` - One rule of each type per level

#### 2. BreedingProgramRuleExecution
Logs every rule execution for debugging and audit purposes.

**Columns:**
- `id` - Serial primary key
- `tenantId` - Integer
- `ruleId` - Foreign key to BreedingProgramRule
- `triggeredBy` - String (50 chars) - 'user_action', 'cron_job', 'webhook'
- `entityType` - String (20 chars) - 'offspring', 'group', 'plan'
- `entityId` - Integer - ID of the entity that triggered the rule
- `success` - Boolean
- `action` - String (100 chars, nullable) - action taken
- `changes` - JSONB (nullable) - what changed
- `error` - Text (nullable) - error message if failed
- `executedAt` - Timestamp

**Indexes:**
- `tenantId`
- `ruleId`
- `entityType, entityId`
- `executedAt`

### Modified Tables

#### Tenant
Added relation: `breedingProgramRules BreedingProgramRule[]`

## Prisma Schema Changes

The changes have been added to `prisma/schema.prisma`:
- Lines 7142-7150: BreedingRuleCategory enum
- Lines 7152-7158: BreedingRuleLevel enum
- Lines 7160-7196: BreedingProgramRule model
- Lines 7198-7223: BreedingProgramRuleExecution model
- Line 883: Added relation to Tenant model

## Migration Steps

1. **Create migration:**
   ```bash
   cd breederhq-api
   npx prisma migrate dev --name add_breeding_program_rules
   ```

2. **Verify migration:**
   - Check that enums are created
   - Check that tables are created with correct columns
   - Check that indexes are created
   - Check that foreign keys are set up

3. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

## Default Rules to Seed (Optional)

After migration, you may want to seed some common rules for existing breeding programs:

```typescript
// Example seed data for common rules
const defaultRules = [
  {
    category: 'LISTING',
    ruleType: 'auto_list_available',
    name: 'Auto-list Available Offspring',
    description: 'Automatically list offspring on marketplace when Keeper Intent is AVAILABLE',
    enabled: true,
    config: {
      minAgeWeeks: 8,
      requirePhotos: true,
      minPhotoCount: 1
    }
  },
  {
    category: 'PRICING',
    ruleType: 'default_price_by_sex',
    name: 'Default Pricing by Sex',
    description: 'Set different default prices for males and females',
    enabled: false,
    config: {
      malePriceCents: 250000,
      femalePriceCents: 280000,
      applyToExisting: false
    }
  }
];
```

## Rollback Plan

If needed, you can rollback this migration:

```bash
npx prisma migrate reset
# OR
npx prisma migrate resolve --rolled-back add_breeding_program_rules
```

## Testing Checklist

- [ ] Migration runs successfully
- [ ] Can create a rule at program level
- [ ] Can create an override at offspring level
- [ ] Inheritance chain resolves correctly
- [ ] Rule execution logs are created
- [ ] Foreign keys cascade properly on delete
- [ ] Unique constraint prevents duplicate rules

## Next Steps

After migration:
1. Implement rule resolution API endpoints
2. Build rule execution engine
3. Create UI for rule management
4. Add cron jobs for scheduled rule execution
5. Set up webhooks for real-time rule triggers
