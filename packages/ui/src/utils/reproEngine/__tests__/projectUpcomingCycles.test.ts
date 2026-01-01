// Frontend ReproEngine Tests - projectUpcomingCycles Integration
// NOTE: No test framework currently configured in project
// This file documents required tests for future implementation

/**
 * Test Framework Requirement: Same as effectiveCycleLen.test.ts
 * - Vitest or Jest
 * - Add test script to packages/ui/package.json
 */

/**
 * BLOCKER: Cannot run these tests without test framework
 * STATUS: Tests documented, not executable until framework added
 */

import { projectUpcomingCycleStarts } from '../projectUpcomingCycles';
import type { ReproSummary } from '../types';

// ============================================================================
// TEST SUITE: Override Integration in projectUpcomingCycles
// ============================================================================

describe('projectUpcomingCycleStarts - Override Integration', () => {

  it('should pass override to computeEffectiveCycleLenDays', () => {
    const summary: ReproSummary = {
      animalId: '1',
      species: 'DOG',
      cycleStartsAsc: ['2025-01-01'],
      femaleCycleLenOverrideDays: 100,
      today: '2025-02-01'
    };

    const result = projectUpcomingCycleStarts(summary, {
      horizonMonths: 12,
      maxCount: 5
    });

    // Check that effective cycle info includes override
    expect(result.effective.source).toBe('OVERRIDE');
    expect(result.effective.effectiveCycleLenDays).toBe(100);

    // Check that projected cycles use 100-day intervals
    if (result.projected.length >= 2) {
      const first = new Date(result.projected[0].date);
      const second = new Date(result.projected[1].date);
      const daysDiff = Math.round((second.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));

      expect(daysDiff).toBeCloseTo(100, 1); // Within 1 day tolerance
    }
  });

  it('should use biology default when no override and no history', () => {
    const summary: ReproSummary = {
      animalId: '2',
      species: 'DOG',
      cycleStartsAsc: [], // No history
      femaleCycleLenOverrideDays: null, // No override
      today: '2025-01-01'
    };

    const result = projectUpcomingCycleStarts(summary, {
      horizonMonths: 12,
      maxCount: 3
    });

    expect(result.effective.source).toBe('BIOLOGY');
    expect(result.effective.effectiveCycleLenDays).toBe(180); // Dog default

    // Projected cycles should be ~180 days apart
    if (result.projected.length >= 2) {
      const first = new Date(result.projected[0].date);
      const second = new Date(result.projected[1].date);
      const daysDiff = Math.round((second.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));

      expect(daysDiff).toBeCloseTo(180, 1);
    }
  });

  it('should include warningConflict in effective result when override conflicts', () => {
    const summary: ReproSummary = {
      animalId: '3',
      species: 'DOG',
      cycleStartsAsc: [
        '2024-01-01',
        '2024-06-01', // ~152 days
        '2024-11-01', // ~153 days
        '2025-04-01'  // ~152 days
      ], // Average ~152 days
      femaleCycleLenOverrideDays: 100, // 34% less than 152
      today: '2025-05-01'
    };

    const result = projectUpcomingCycleStarts(summary, {
      horizonMonths: 12,
      maxCount: 5
    });

    expect(result.effective.source).toBe('OVERRIDE');
    expect(result.effective.warningConflict).toBe(true);
  });

  it('should NOT show conflict when override is close to history', () => {
    const summary: ReproSummary = {
      animalId: '4',
      species: 'DOG',
      cycleStartsAsc: [
        '2024-01-01',
        '2024-06-01', // ~152 days
        '2024-11-01'  // ~153 days
      ], // Average ~152.5 days
      femaleCycleLenOverrideDays: 160, // Only 4.9% more than 152.5
      today: '2025-01-01'
    };

    const result = projectUpcomingCycleStarts(summary, {
      horizonMonths: 12,
      maxCount: 5
    });

    expect(result.effective.source).toBe('OVERRIDE');
    expect(result.effective.warningConflict).not.toBe(true);
  });

  it('should project multiple cycles with override interval', () => {
    const summary: ReproSummary = {
      animalId: '5',
      species: 'DOG',
      cycleStartsAsc: ['2025-01-01'],
      femaleCycleLenOverrideDays: 120,
      today: '2025-02-01'
    };

    const result = projectUpcomingCycleStarts(summary, {
      horizonMonths: 24,
      maxCount: 6
    });

    // Should get at least 6 cycles within 24 months (120-day intervals)
    expect(result.projected.length).toBeGreaterThanOrEqual(6);

    // Verify consistent 120-day spacing
    for (let i = 1; i < Math.min(4, result.projected.length); i++) {
      const prev = new Date(result.projected[i - 1].date);
      const curr = new Date(result.projected[i].date);
      const daysDiff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

      expect(daysDiff).toBeCloseTo(120, 1);
    }
  });

  it('should handle undefined override (backwards compatibility)', () => {
    const summary: ReproSummary = {
      animalId: '6',
      species: 'DOG',
      cycleStartsAsc: ['2025-01-01', '2025-06-01'],
      // femaleCycleLenOverrideDays not provided (old code)
      today: '2025-07-01'
    } as ReproSummary;

    const result = projectUpcomingCycleStarts(summary, {
      horizonMonths: 12,
      maxCount: 3
    });

    // Should use history without crashing
    expect(result.effective.source).toBe('HISTORY');
    expect(result.projected.length).toBeGreaterThan(0);
  });

  it('should return projected cycle metadata with explain field', () => {
    const summary: ReproSummary = {
      animalId: '7',
      species: 'DOG',
      cycleStartsAsc: [],
      femaleCycleLenOverrideDays: 150,
      today: '2025-01-01'
    };

    const result = projectUpcomingCycleStarts(summary, {
      horizonMonths: 6,
      maxCount: 2
    });

    expect(result.projected.length).toBeGreaterThan(0);

    const firstProjected = result.projected[0];
    expect(firstProjected).toHaveProperty('date');
    expect(firstProjected).toHaveProperty('source');
    expect(firstProjected).toHaveProperty('explain');
    expect(firstProjected.explain).toHaveProperty('species');
  });
});

// ============================================================================
// TEST SUITE: Safety Guards with Override
// ============================================================================

describe('projectUpcomingCycleStarts - Safety with Override', () => {

  it('should never project with 0 even if override is 0', () => {
    const summary: ReproSummary = {
      animalId: '8',
      species: 'DOG',
      cycleStartsAsc: [],
      femaleCycleLenOverrideDays: 0, // Invalid but testing safety
      today: '2025-01-01'
    };

    const result = projectUpcomingCycleStarts(summary, {
      horizonMonths: 12,
      maxCount: 3
    });

    // Should fall back to biology default, not use 0
    expect(result.effective.effectiveCycleLenDays).toBeGreaterThan(0);
    expect(result.projected.length).toBeGreaterThan(0);
  });

  it('should handle negative override gracefully', () => {
    const summary: ReproSummary = {
      animalId: '9',
      species: 'DOG',
      cycleStartsAsc: [],
      femaleCycleLenOverrideDays: -50, // Invalid
      today: '2025-01-01'
    };

    const result = projectUpcomingCycleStarts(summary, {
      horizonMonths: 12,
      maxCount: 3
    });

    // Should use biology fallback
    expect(result.effective.effectiveCycleLenDays).toBe(180);
    expect(result.projected.length).toBeGreaterThan(0);
  });

  it('should prevent infinite loops with very large override', () => {
    const summary: ReproSummary = {
      animalId: '10',
      species: 'DOG',
      cycleStartsAsc: [],
      femaleCycleLenOverrideDays: 730, // Maximum
      today: '2025-01-01'
    };

    const result = projectUpcomingCycleStarts(summary, {
      horizonMonths: 12,
      maxCount: 3
    });

    // Should complete without hanging
    expect(result.projected.length).toBeLessThanOrEqual(3);

    // Within 12 months (365 days), only 1 cycle fits with 730-day interval
    expect(result.projected.length).toBeLessThanOrEqual(2);
  });

  it('should handle very small override (30 days)', () => {
    const summary: ReproSummary = {
      animalId: '11',
      species: 'DOG',
      cycleStartsAsc: [],
      femaleCycleLenOverrideDays: 30, // Minimum
      today: '2025-01-01'
    };

    const result = projectUpcomingCycleStarts(summary, {
      horizonMonths: 6,
      maxCount: 10
    });

    // Should project many cycles (6 months = ~180 days / 30 = 6 cycles)
    expect(result.projected.length).toBeGreaterThanOrEqual(5);
    expect(result.projected.length).toBeLessThanOrEqual(10); // Respects maxCount
  });
});
