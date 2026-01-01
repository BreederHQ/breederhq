# BreederHQ API

Backend API server for BreederHQ platform.

Party migration docs: [docs/migrations/party/README.md](docs/migrations/party/README.md)

## Features Implemented

### Cycle Length Override (v1)
- **Field**: `Animal.femaleCycleLenOverrideDays`
- **Type**: Integer (nullable)
- **Range**: 30-730 days
- **Purpose**: Override automatic cycle length calculation from history/biology

#### API Endpoints

**PATCH /api/v1/animals/:id**
```json
{
  "femaleCycleLenOverrideDays": 25
}
```

Validation:
- Must be integer between 30-730 (inclusive)
- Can be `null` to clear override
- Returns 400 with error code `invalid_cycle_len_override` if invalid

**GET /api/v1/animals/:id**
Returns full animal including `femaleCycleLenOverrideDays` field.

## Database Setup

```bash
# Run migration
npm run migrate

# Or deploy to production
npm run migrate:deploy
```

## Migration

Migration `20260101113710_add_cycle_len_override` adds:
- Column `femaleCycleLenOverrideDays INTEGER` to `animals` table
- Documentation comment on column
