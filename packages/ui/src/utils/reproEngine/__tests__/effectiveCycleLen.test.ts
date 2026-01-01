// Frontend ReproEngine Tests - computeEffectiveCycleLenDays
// NOTE: No test framework currently configured in project
// This file documents required tests for future implementation

/**
 * Test Framework Requirement:
 * - Install Vitest (preferred for Vite projects) or Jest
 * - Add test script to packages/ui/package.json
 *
 * Required dependencies:
 * npm install --save-dev vitest @vitest/ui
 *
 * Add to package.json:
 * "scripts": {
 *   "test": "vitest",
 *   "test:ui": "vitest --ui"
 * }
 */

/**
 * BLOCKER: Cannot run these tests without test framework
 * STATUS: Tests documented, not executable until framework added
 */

import { computeEffectiveCycleLenDays } from '../effectiveCycleLen';
import type { CycleLenInputs } from '../types';

// ============================================================================
// TEST SUITE: Override Precedence
// ============================================================================

describe('computeEffectiveCycleLenDays - Override Precedence', () => {

  it('should use override when provided, ignoring history', () => {
    const input: CycleLenInputs = {
      species: 'DOG',
      cycleStartsAsc: ['2025-01-01', '2025-06-01', '2025-11-01'], // ~150 day gaps
      femaleCycleLenOverrideDays: 100
    };

    const result = computeEffectiveCycleLenDays(input);

    expect(result.effectiveCycleLenDays).toBe(100);
    expect(result.source).toBe('OVERRIDE');
  });

  it('should use override when provided, ignoring biology default', () => {
    const input: CycleLenInputs = {
      species: 'DOG', // biology default 180
      cycleStartsAsc: [], // no history
      femaleCycleLenOverrideDays: 200
    };

    const result = computeEffectiveCycleLenDays(input);

    expect(result.effectiveCycleLenDays).toBe(200);
    expect(result.source).toBe('OVERRIDE');
  });

  it('should use history when override is null', () => {
    const input: CycleLenInputs = {
      species: 'DOG',
      cycleStartsAsc: ['2025-01-01', '2025-04-01', '2025-07-01'], // ~90 day gaps
      femaleCycleLenOverrideDays: null
    };

    const result = computeEffectiveCycleLenDays(input);

    expect(result.source).toBe('HISTORY');
    expect(result.effectiveCycleLenDays).toBeGreaterThan(0);
    expect(result.effectiveCycleLenDays).not.toBe(180); // Not using biology default
  });

  it('should use history when override is undefined', () => {
    const input: CycleLenInputs = {
      species: 'DOG',
      cycleStartsAsc: ['2025-01-01', '2025-04-01', '2025-07-01'],
      // femaleCycleLenOverrideDays not provided
    };

    const result = computeEffectiveCycleLenDays(input);

    expect(result.source).toBe('HISTORY');
  });

  it('should use biology default when no override and no history', () => {
    const input: CycleLenInputs = {
      species: 'DOG',
      cycleStartsAsc: [],
      femaleCycleLenOverrideDays: null
    };

    const result = computeEffectiveCycleLenDays(input);

    expect(result.source).toBe('BIOLOGY');
    expect(result.effectiveCycleLenDays).toBe(180); // Dog default
  });

  it('should ignore override value of 0', () => {
    // 0 is not a valid cycle length, should fall back to history/biology
    const input: CycleLenInputs = {
      species: 'DOG',
      cycleStartsAsc: ['2025-01-01', '2025-06-01'],
      femaleCycleLenOverrideDays: 0
    };

    const result = computeEffectiveCycleLenDays(input);

    // 0 treated as invalid, should fall back to history
    expect(result.source).not.toBe('OVERRIDE');
  });

  it('should ignore negative override value', () => {
    const input: CycleLenInputs = {
      species: 'DOG',
      cycleStartsAsc: [],
      femaleCycleLenOverrideDays: -50
    };

    const result = computeEffectiveCycleLenDays(input);

    // Negative treated as invalid, should use biology
    expect(result.source).toBe('BIOLOGY');
    expect(result.effectiveCycleLenDays).toBe(180);
  });
});

// ============================================================================
// TEST SUITE: Conflict Warning Detection
// ============================================================================

describe('computeEffectiveCycleLenDays - Conflict Warning', () => {

  it('should set warningConflict=true when override differs >20% from history (lower)', () => {
    const input: CycleLenInputs = {
      species: 'DOG',
      cycleStartsAsc: [
        '2024-01-01',
        '2024-07-01', // 182 days
        '2025-01-01', // 184 days
        '2025-07-01'  // 182 days
      ], // Average ~183 days
      femaleCycleLenOverrideDays: 130 // 29% less than 183
    };

    const result = computeEffectiveCycleLenDays(input);

    expect(result.source).toBe('OVERRIDE');
    expect(result.effectiveCycleLenDays).toBe(130);
    expect(result.warningConflict).toBe(true);
  });

  it('should set warningConflict=true when override differs >20% from history (higher)', () => {
    const input: CycleLenInputs = {
      species: 'DOG',
      cycleStartsAsc: [
        '2024-01-01',
        '2024-04-01', // ~90 days
        '2024-07-01', // ~91 days
        '2024-10-01'  // ~92 days
      ], // Average ~91 days
      femaleCycleLenOverrideDays: 130 // 43% more than 91
    };

    const result = computeEffectiveCycleLenDays(input);

    expect(result.warningConflict).toBe(true);
  });

  it('should NOT set warningConflict when override differs ≤20% from history', () => {
    const input: CycleLenInputs = {
      species: 'DOG',
      cycleStartsAsc: [
        '2024-01-01',
        '2024-07-01', // 182 days
        '2025-01-01'  // 184 days
      ], // Average ~183 days
      femaleCycleLenOverrideDays: 160 // 12.6% less than 183
    };

    const result = computeEffectiveCycleLenDays(input);

    expect(result.source).toBe('OVERRIDE');
    expect(result.warningConflict).not.toBe(true); // Should be false or undefined
  });

  it('should NOT set warningConflict when no history exists', () => {
    // Cannot conflict with nothing
    const input: CycleLenInputs = {
      species: 'DOG',
      cycleStartsAsc: [],
      femaleCycleLenOverrideDays: 50 // Arbitrary low value
    };

    const result = computeEffectiveCycleLenDays(input);

    expect(result.source).toBe('OVERRIDE');
    expect(result.warningConflict).not.toBe(true);
  });

  it('should NOT set warningConflict when only 1 cycle in history', () => {
    // Not enough history to calculate average gap
    const input: CycleLenInputs = {
      species: 'DOG',
      cycleStartsAsc: ['2025-01-01'], // Only 1 cycle, no gaps
      femaleCycleLenOverrideDays: 50
    };

    const result = computeEffectiveCycleLenDays(input);

    expect(result.warningConflict).not.toBe(true);
  });

  it('should calculate conflict threshold exactly at 20% boundary', () => {
    // Edge case: exactly 20% difference
    const input: CycleLenInputs = {
      species: 'DOG',
      cycleStartsAsc: [
        '2024-01-01',
        '2024-06-01', // 152 days
        '2024-11-01'  // 153 days
      ], // Average ~152.5 days
      femaleCycleLenOverrideDays: 122 // Exactly 20% less (152.5 * 0.8 = 122)
    };

    const result = computeEffectiveCycleLenDays(input);

    // At exactly 20%, should NOT trigger (uses > not >=)
    expect(result.warningConflict).not.toBe(true);
  });

  it('should trigger warning just past 20% threshold', () => {
    const input: CycleLenInputs = {
      species: 'DOG',
      cycleStartsAsc: [
        '2024-01-01',
        '2024-06-01',
        '2024-11-01'
      ], // Average ~152.5 days
      femaleCycleLenOverrideDays: 121 // Just over 20% less (20.6%)
    };

    const result = computeEffectiveCycleLenDays(input);

    expect(result.warningConflict).toBe(true);
  });
});

// ============================================================================
// TEST SUITE: Integration with Null/Undefined Override
// ============================================================================

describe('computeEffectiveCycleLenDays - Null Override Behavior', () => {

  it('should preserve existing behavior when override is null', () => {
    // Baseline: no override field existed before
    const withoutOverride = computeEffectiveCycleLenDays({
      species: 'DOG',
      cycleStartsAsc: ['2025-01-01', '2025-06-01']
    });

    // With null override: should behave identically
    const withNullOverride = computeEffectiveCycleLenDays({
      species: 'DOG',
      cycleStartsAsc: ['2025-01-01', '2025-06-01'],
      femaleCycleLenOverrideDays: null
    });

    expect(withNullOverride.effectiveCycleLenDays).toBe(withoutOverride.effectiveCycleLenDays);
    expect(withNullOverride.source).toBe(withoutOverride.source);
    expect(withNullOverride.warningConflict).toBe(withoutOverride.warningConflict);
  });

  it('should not break when override field is completely absent', () => {
    // Backwards compatibility: old callers might not pass the field at all
    const input: CycleLenInputs = {
      species: 'DOG',
      cycleStartsAsc: ['2025-01-01', '2025-06-01']
      // No femaleCycleLenOverrideDays field
    };

    const result = computeEffectiveCycleLenDays(input);

    expect(result.effectiveCycleLenDays).toBeGreaterThan(0);
    expect(result.source).toBe('HISTORY');
  });
});

// ============================================================================
// TEST SUITE: Edge Cases
// ============================================================================

describe('computeEffectiveCycleLenDays - Edge Cases', () => {

  it('should handle species with different biology defaults', () => {
    // Test CAT override (biology default different from DOG)
    const input: CycleLenInputs = {
      species: 'CAT',
      cycleStartsAsc: [],
      femaleCycleLenOverrideDays: 25
    };

    const result = computeEffectiveCycleLenDays(input);

    expect(result.source).toBe('OVERRIDE');
    expect(result.effectiveCycleLenDays).toBe(25);
    // Not testing biology default value since it depends on getSpeciesDefaults
  });

  it('should handle very large override values', () => {
    const input: CycleLenInputs = {
      species: 'DOG',
      cycleStartsAsc: [],
      femaleCycleLenOverrideDays: 730 // Maximum allowed by backend
    };

    const result = computeEffectiveCycleLenDays(input);

    expect(result.effectiveCycleLenDays).toBe(730);
    expect(result.source).toBe('OVERRIDE');
  });

  it('should handle minimum valid override values', () => {
    const input: CycleLenInputs = {
      species: 'DOG',
      cycleStartsAsc: [],
      femaleCycleLenOverrideDays: 30 // Minimum allowed by backend
    };

    const result = computeEffectiveCycleLenDays(input);

    expect(result.effectiveCycleLenDays).toBe(30);
    expect(result.source).toBe('OVERRIDE');
  });

  it('should return gapsUsedDays even when using override', () => {
    const input: CycleLenInputs = {
      species: 'DOG',
      cycleStartsAsc: ['2025-01-01', '2025-06-01', '2025-11-01'],
      femaleCycleLenOverrideDays: 100
    };

    const result = computeEffectiveCycleLenDays(input);

    expect(result.gapsUsedDays).toBeDefined();
    expect(Array.isArray(result.gapsUsedDays)).toBe(true);
    // Gaps should be calculated from cycleStartsAsc regardless of override
  });
});
