# Frontend Runtime Verification: Cycle Length Override v1

## Prerequisites
- Node.js 20.19.0+
- npm 10.8.0+
- Backend API running (see breederhq-api/RUNTIME_VERIFICATION.md)
- Test animals seeded in database

## Setup

### 1. Install Dependencies
```bash
cd c:/Users/Aaron/Documents/Projects/breederhq
npm install
```

### 2. Build Shared UI Package
```bash
npm -C ./packages/ui run build
```

Expected output:
```
CLI Building entry: index
CLI Building entry: overlay
✓ Built in XXXms
```

### 3. Start Animals App
```bash
npm -C ./apps/animals run dev
```

Expected output:
```
VITE v5.4.8  ready in XXX ms

  ➜  Local:   http://localhost:6174/
```

### 4. Start Breeding App (in separate terminal)
```bash
npm -C ./apps/breeding run dev
```

Expected output:
```
VITE v5.4.8  ready in XXX ms

  ➜  Local:   http://localhost:6175/
```

## Animals App Verification (http://localhost:6174)

### Test Scenario 1: Override on Female with No Cycle History

**Setup**: Use animal ID from seed (e.g., "Zero-Cycles")

**Steps**:
1. Navigate to http://localhost:6174
2. Click on "Zero-Cycles" female animal
3. Click on "Cycle Info" tab
4. Observe "Next Heat Calculation" section shows:
   - Source: "BIOLOGY" or "No cycle history - using species default"
   - Effective cycle length: 180 days (dog default)
5. In "Cycle Length Override" field, enter `150`
6. Click "Save Override"
7. Observe immediate update (no page reload):
   - Next heat date changes
   - "Next Heat Calculation" shows effective cycle length: 150 days
   - Source changes to "OVERRIDE" or similar indicator
8. **NO WARNING** should appear (no history to conflict with)

**Expected Result**:
- Override persists (refresh page, value still 150)
- Projections immediately use 150-day cycles
- No conflict warning (no history exists)

### Test Scenario 2: Override with Conflict Warning

**Setup**: Use animal with cycle history where override differs >20%

**Steps**:
1. Navigate to animal with 180-day average cycle history
2. Go to "Cycle Info" tab
3. Note current cycle length (e.g., 180 days from history)
4. Enter override: `130` (27.8% less than 180)
5. Click "Save Override"
6. Observe:
   - **Yellow warning banner** appears with text like:
     "Warning: Override differs by more than 20% from historical average."
   - Next heat projections update to 130-day intervals
   - Source indicates "OVERRIDE"

**Expected Result**:
- Warning banner visible
- Projections use override despite warning
- Warning persists on page reload

### Test Scenario 3: Clear Override

**Steps**:
1. From animal with override set (from previous test)
2. Clear the override input field (delete all text)
3. Click "Save Override" or "Clear Override" button
4. Observe:
   - Warning banner disappears
   - Projections revert to history-based or biology-based cycle length
   - Source changes back to "HISTORY" or "BIOLOGY"

**Expected Result**:
- Override field empty
- Automatic calculation restored
- No warning banner

### Test Scenario 4: Invalid Value Rejection

**Steps**:
1. Enter override value: `25` (below minimum 30)
2. Click "Save Override"
3. Observe: Error toast/message "Cycle length must be a positive number" or validation error
4. Enter override value: `800` (above maximum 730)
5. Click "Save Override"
6. Observe: Validation error
7. Enter override value: `abc` (non-numeric)
8. Observe: Validation error or input rejected

**Expected Result**:
- Invalid values rejected client-side or by API
- No update to database
- User shown clear error message

## Breeding App Verification (http://localhost:6175)

### Test Scenario 5: What-If Planner Uses Override

**Setup**: Animal with override set (e.g., 150 days)

**Steps**:
1. Navigate to http://localhost:6175
2. Open "What-If Planner" or breeding planning section
3. Select the female with override (150 days) as dam
4. Observe projected cycle dates in dropdown or calendar
5. Note cycle spacing: should be ~150 days apart
6. Select a projected cycle start date
7. Observe projected breeding windows/milestones
8. Calculate expected dates manually:
   - If cycle starts Jan 1, next should be ~May 30 (150 days)
   - Verify UI shows consistent 150-day intervals

**Expected Result**:
- Projected cycles use 150-day override (not biology default 180)
- Consistent spacing in UI
- Milestones calculated from override-based cycle dates

### Test Scenario 6: Locked Plans Unchanged by Override Change

**Setup**: Create a locked breeding plan first

**Steps**:
1. In Breeding app, create a plan with specific dates
2. Lock the plan (if locking mechanism exists) OR note the current expectedWeaned date
3. Return to Animals app
4. Change the female's cycle override (e.g., 150 → 100)
5. Return to Breeding app
6. Observe the locked plan dates

**Expected Result**:
- Locked plan dates do NOT change
- Only future/unlocked projections use new override
- Past commitments preserved

### Test Scenario 7: Override Persists Across Apps

**Steps**:
1. Set override to 120 in Animals app
2. Navigate to Breeding app
3. Select that female in what-if planner
4. Verify projections use 120-day cycles
5. Change override to 200 in Animals app (keep Breeding app open in another tab)
6. Refresh Breeding app
7. Select female again

**Expected Result**:
- Override value consistent across apps
- Breeding app picks up changes after refresh
- No data loss or desync

## ReproEngine Unit Verification (Manual Console Tests)

Since no test framework exists, verify reproEngine logic in browser console:

### Test A: Override Precedence

Open browser console on Animals app and run:

```javascript
// Assuming reproEngine is globally available or import from dev tools
const { computeEffectiveCycleLenDays } = window.reproEngineForDebug || {};

// Test 1: Override wins over history
const result1 = computeEffectiveCycleLenDays({
  species: 'DOG',
  cycleStartsAsc: ['2025-01-01', '2025-06-01', '2025-11-01'], // ~150 day gaps
  femaleCycleLenOverrideDays: 100
});

console.assert(result1.effectiveCycleLenDays === 100, 'Override should win');
console.assert(result1.source === 'OVERRIDE', 'Source should be OVERRIDE');

// Test 2: Null override uses history
const result2 = computeEffectiveCycleLenDays({
  species: 'DOG',
  cycleStartsAsc: ['2025-01-01', '2025-06-01', '2025-11-01'],
  femaleCycleLenOverrideDays: null
});

console.assert(result2.source === 'HISTORY', 'Should use history when override is null');
console.assert(result2.effectiveCycleLenDays > 0, 'Should calculate from gaps');

// Test 3: No history, no override uses biology
const result3 = computeEffectiveCycleLenDays({
  species: 'DOG',
  cycleStartsAsc: [],
  femaleCycleLenOverrideDays: null
});

console.assert(result3.source === 'BIOLOGY', 'Should use biology default');
console.assert(result3.effectiveCycleLenDays === 180, 'Dog default is 180');
```

### Test B: Conflict Warning

```javascript
// Test 4: >20% difference triggers warning
const result4 = computeEffectiveCycleLenDays({
  species: 'DOG',
  cycleStartsAsc: ['2025-01-01', '2025-06-01', '2025-11-01'], // ~150 day avg
  femaleCycleLenOverrideDays: 100 // 33% less than 150
});

console.assert(result4.warningConflict === true, 'Should warn on >20% diff');

// Test 5: ≤20% difference no warning
const result5 = computeEffectiveCycleLenDays({
  species: 'DOG',
  cycleStartsAsc: ['2025-01-01', '2025-06-01', '2025-11-01'], // ~150 day avg
  femaleCycleLenOverrideDays: 130 // 13.3% less than 150
});

console.assert(result5.warningConflict !== true, 'Should NOT warn on ≤20% diff');

// Test 6: No history = no warning (can't conflict with nothing)
const result6 = computeEffectiveCycleLenDays({
  species: 'DOG',
  cycleStartsAsc: [],
  femaleCycleLenOverrideDays: 50 // any value
});

console.assert(result6.warningConflict !== true, 'No warning when no history');
```

**Note**: If reproEngine is not exposed globally, add temporary export in dev:
```typescript
// In packages/ui/src/utils/reproEngine/effectiveCycleLen.ts (temporary)
if (typeof window !== 'undefined') {
  (window as any).reproEngineForDebug = { computeEffectiveCycleLenDays };
}
```

## Complete Verification Checklist

### Animals App
- [ ] Override input field visible in Cycle Info tab
- [ ] Save button triggers PATCH to backend
- [ ] Next heat updates immediately on save (no reload)
- [ ] Warning banner appears when override differs >20% from history
- [ ] Warning banner disappears when override cleared
- [ ] Clear/null override restores automatic calculation
- [ ] Invalid values rejected (client-side validation)
- [ ] Override persists across page refreshes

### Breeding App
- [ ] What-if planner dam selector includes females
- [ ] Selected female's override used in cycle projections
- [ ] Projected cycle dates space correctly (override interval)
- [ ] Changing override in Animals app affects new Breeding projections
- [ ] Locked plans unaffected by override changes

### ReproEngine (Console Tests)
- [ ] Override source wins (precedence)
- [ ] Null override falls back to history
- [ ] No history + no override uses biology
- [ ] warningConflict=true when >20% diff from history
- [ ] warningConflict=false when ≤20% diff
- [ ] No warning when history doesn't exist

### Integration
- [ ] Backend PATCH persists to database
- [ ] Frontend GET retrieves persisted value
- [ ] Both apps read same value from backend
- [ ] Changes in one app visible in other after refresh
