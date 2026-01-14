// e2e/species-terminology.spec.ts
// End-to-end tests for Species Terminology System (STS)
// Validates species-appropriate terminology across the platform

import { test, expect } from '@playwright/test';

// ============================================================================
// Test Data
// ============================================================================

type SpeciesTestCase = {
  species: string;
  offspringName: string;
  offspringPlural: string;
  birthProcess: string;
  inCareLabel: string;
  usesCollars: boolean;
  parentFemale: string;
  parentMale: string;
};

const SPECIES_TEST_CASES: SpeciesTestCase[] = [
  {
    species: 'DOG',
    offspringName: 'puppy',
    offspringPlural: 'puppies',
    birthProcess: 'whelping',
    inCareLabel: 'Litters in Care',
    usesCollars: true,
    parentFemale: 'dam',
    parentMale: 'sire',
  },
  {
    species: 'CAT',
    offspringName: 'kitten',
    offspringPlural: 'kittens',
    birthProcess: 'birthing',
    inCareLabel: 'Litters in Care',
    usesCollars: true,
    parentFemale: 'dam',
    parentMale: 'sire',
  },
  {
    species: 'HORSE',
    offspringName: 'foal',
    offspringPlural: 'foals',
    birthProcess: 'foaling',
    inCareLabel: 'Foals in Care',
    usesCollars: false,
    parentFemale: 'mare',
    parentMale: 'stallion',
  },
  {
    species: 'RABBIT',
    offspringName: 'kit',
    offspringPlural: 'kits',
    birthProcess: 'kindling',
    inCareLabel: 'Litters in Care',
    usesCollars: true,
    parentFemale: 'doe',
    parentMale: 'buck',
  },
  {
    species: 'GOAT',
    offspringName: 'kid',
    offspringPlural: 'kids',
    birthProcess: 'kidding',
    inCareLabel: 'Kids in Care',
    usesCollars: true,
    parentFemale: 'doe',
    parentMale: 'buck',
  },
  {
    species: 'SHEEP',
    offspringName: 'lamb',
    offspringPlural: 'lambs',
    birthProcess: 'lambing',
    inCareLabel: 'Lambs in Care',
    usesCollars: true,
    parentFemale: 'ewe',
    parentMale: 'ram',
  },
  {
    species: 'PIG',
    offspringName: 'piglet',
    offspringPlural: 'piglets',
    birthProcess: 'farrowing',
    inCareLabel: 'Litters in Care',
    usesCollars: true,
    parentFemale: 'sow',
    parentMale: 'boar',
  },
  {
    species: 'CATTLE',
    offspringName: 'calf',
    offspringPlural: 'calves',
    birthProcess: 'calving',
    inCareLabel: 'Calves in Care',
    usesCollars: false,
    parentFemale: 'cow',
    parentMale: 'bull',
  },
  {
    species: 'CHICKEN',
    offspringName: 'chick',
    offspringPlural: 'chicks',
    birthProcess: 'hatching',
    inCareLabel: 'Chicks in Care',
    usesCollars: false,
    parentFemale: 'hen',
    parentMale: 'rooster',
  },
  {
    species: 'ALPACA',
    offspringName: 'cria',
    offspringPlural: 'crias',
    birthProcess: 'birthing',
    inCareLabel: 'Crias in Care',
    usesCollars: false,
    parentFemale: 'dam',
    parentMale: 'sire',
  },
  {
    species: 'LLAMA',
    offspringName: 'cria',
    offspringPlural: 'crias',
    birthProcess: 'birthing',
    inCareLabel: 'Crias in Care',
    usesCollars: false,
    parentFemale: 'dam',
    parentMale: 'sire',
  },
];

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Login helper - adjust to match your auth flow
 */
async function login(page, userType: 'horse-breeder' | 'dog-breeder' | 'mixed-breeder') {
  // TODO: Replace with actual login flow
  await page.goto('/login');

  // Example credentials (adjust to your test users)
  const credentials = {
    'horse-breeder': { email: 'horse@test.com', password: 'test123' },
    'dog-breeder': { email: 'dog@test.com', password: 'test123' },
    'mixed-breeder': { email: 'mixed@test.com', password: 'test123' },
  };

  const creds = credentials[userType];
  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/);
}

/**
 * Create test offspring group for a species
 */
async function createOffspringGroup(page, species: string) {
  // TODO: Implement based on your app's offspring creation flow
  // This is a placeholder - adjust to match actual UI flow
  await page.goto('/breeding-plans');
  await page.click('text=Record Birth');

  // Select species
  await page.selectOption('select[name="species"]', species);

  // Fill in required fields
  await page.fill('input[name="identifier"]', `Test Group ${Date.now()}`);
  await page.fill('input[name="birthDate"]', '2026-01-01');
  await page.fill('input[name="countBorn"]', '1');

  // Submit
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/offspring/);
}

// ============================================================================
// Dashboard Tests
// ============================================================================

test.describe('Dashboard - Offspring Group Cards', () => {
  test('shows species-specific terminology for single-species breeders', async ({ page }) => {
    for (const speciesCase of SPECIES_TEST_CASES) {
      await test.step(`Test ${speciesCase.species} breeder`, async () => {
        // TODO: Setup test data - create offspring group for this species
        // This assumes test fixtures or API setup

        await page.goto('/dashboard');

        // Check header shows correct "in care" label
        await expect(page.locator('h2, h3, .text-sm').filter({ hasText: speciesCase.inCareLabel })).toBeVisible();

        // Verify no other species terminology appears
        const otherSpecies = SPECIES_TEST_CASES.filter(s => s.species !== speciesCase.species);
        for (const other of otherSpecies) {
          await expect(page.locator('text=' + other.inCareLabel)).not.toBeVisible();
        }
      });
    }
  });

  test('shows generic terminology for mixed-species breeders', async ({ page }) => {
    // TODO: Setup test data - create offspring groups for multiple species

    await page.goto('/dashboard');

    // Should show generic "Offspring in Care" when species are mixed
    await expect(page.locator('text=Offspring in Care')).toBeVisible();

    // Should NOT show any species-specific labels
    for (const speciesCase of SPECIES_TEST_CASES) {
      if (speciesCase.inCareLabel !== 'Offspring in Care') {
        await expect(page.locator('text=' + speciesCase.inCareLabel)).not.toBeVisible();
      }
    }
  });

  test('shows empty state with appropriate messaging', async ({ page }) => {
    // TODO: Setup test user with no offspring groups

    await page.goto('/dashboard');

    await expect(page.locator('text=No offspring groups in care')).toBeVisible();
    await expect(page.locator('text=Active groups will appear here after birth is recorded')).toBeVisible();
  });
});

// ============================================================================
// Settings Tests
// ============================================================================

test.describe('Settings - Collar Configuration', () => {
  test('collar settings show appropriate messaging for all species', async ({ page }) => {
    await page.goto('/settings');

    // Navigate to Offspring tab
    await page.click('text=Offspring');

    // Check that tab label is "Identification Collars" (not "Whelping Collars")
    await expect(page.locator('text=Identification Collars')).toBeVisible();
    await expect(page.locator('text=Whelping Collars')).not.toBeVisible();

    // Click the tab
    await page.click('text=Identification Collars');

    // Verify info box explains species applicability
    await expect(page.locator('text=Not applicable for horses, cattle, or chickens')).toBeVisible();
    await expect(page.locator('text=dogs, cats, rabbits, goats, sheep, pigs')).toBeVisible();
  });

  test('collar settings are accessible regardless of breeder species', async ({ page }) => {
    // Even horse-only breeders can see settings (but with clear note)
    await page.goto('/settings');
    await page.click('text=Offspring');
    await page.click('text=Identification Collars');

    // Settings should be visible
    await expect(page.locator('text=Identification Collar Colors')).toBeVisible();

    // But note should explain it doesn't apply to some species
    await expect(page.locator('text=Not applicable')).toBeVisible();
  });
});

// ============================================================================
// Collar Picker Tests
// ============================================================================

test.describe('Collar Picker - Conditional Rendering', () => {
  test('collar picker is hidden for non-collar species', async ({ page }) => {
    const nonCollarSpecies = SPECIES_TEST_CASES.filter(s => !s.usesCollars);

    for (const speciesCase of nonCollarSpecies) {
      await test.step(`${speciesCase.species} - collar picker hidden`, async () => {
        // TODO: Navigate to offspring detail page for this species
        // This test assumes you can create/navigate to an offspring of specific species

        await page.goto('/offspring/1'); // Adjust to actual route

        // Collar picker should not be visible
        await expect(page.locator('[data-testid="collar-picker"]')).not.toBeVisible();
        await expect(page.locator('text=Select collar color')).not.toBeVisible();
      });
    }
  });

  test('collar picker is visible for collar-using species', async ({ page }) => {
    const collarSpecies = SPECIES_TEST_CASES.filter(s => s.usesCollars);

    for (const speciesCase of collarSpecies) {
      await test.step(`${speciesCase.species} - collar picker visible`, async () => {
        // TODO: Navigate to offspring detail page for this species

        await page.goto('/offspring/1'); // Adjust to actual route

        // Collar picker should be visible and functional
        await expect(page.locator('[data-testid="collar-picker"]')).toBeVisible();

        // Should be able to select a collar
        await page.click('[data-testid="collar-picker"]');
        await expect(page.locator('text=Red')).toBeVisible();
        await expect(page.locator('text=Blue')).toBeVisible();
      });
    }
  });
});

// ============================================================================
// Breeding Pipeline Tests
// ============================================================================

test.describe('Breeding Pipeline - Stage Labels', () => {
  test('pipeline uses neutral "Care" stage label', async ({ page }) => {
    await page.goto('/dashboard');

    // Check that pipeline shows "Care" stage (not "Offspring Care")
    // This is more species-neutral for mixed-species views
    await expect(page.locator('.breeding-pipeline text=Care')).toBeVisible();

    // Old label should not appear
    await expect(page.locator('text=Offspring Care')).not.toBeVisible();
  });
});

// ============================================================================
// Offspring Module Tests
// ============================================================================

test.describe('Offspring Module - Terminology', () => {
  test.skip('offspring list uses species-appropriate terminology', async ({ page }) => {
    // TODO: Phase 3 - test GroupListView, OffspringListView components
    // Skipped until Phase 3 implementation
  });

  test.skip('offspring cards show correct count labels', async ({ page }) => {
    // TODO: Phase 3 - test GroupCardView, OffspringCardView components
    // Skipped until Phase 3 implementation
  });
});

// ============================================================================
// Cross-Species Tests
// ============================================================================

test.describe('Cross-Species Compatibility', () => {
  test('mixed-species breeder can work with multiple species simultaneously', async ({ page }) => {
    // TODO: Setup test data with dogs, horses, and goats

    await page.goto('/offspring');

    // Should see all species represented correctly in list
    await expect(page.locator('text=DOG')).toBeVisible();
    await expect(page.locator('text=HORSE')).toBeVisible();
    await expect(page.locator('text=GOAT')).toBeVisible();

    // Each row should use appropriate terminology
    // TODO: Add more specific checks based on actual table structure
  });

  test('switching between species maintains correct terminology', async ({ page }) => {
    await page.goto('/offspring');

    // Click on a dog group
    await page.click('text=Dog Group 1');
    await expect(page.locator('text=puppy, text=puppies')).toBeVisible();

    // Navigate back and click on a horse group
    await page.goto('/offspring');
    await page.click('text=Horse Group 1');
    await expect(page.locator('text=foal, text=foals')).toBeVisible();

    // Terminology should have changed appropriately
  });
});

// ============================================================================
// Regression Tests
// ============================================================================

test.describe('Backward Compatibility', () => {
  test('dog breeders experience no changes from STS implementation', async ({ page }) => {
    // Existing dog breeder workflows should be unchanged
    await page.goto('/dashboard');

    // Check familiar terminology still works
    await expect(page.locator('text=Litters in Care, text=puppies, text=whelping')).toBeVisible();

    // Collar system should still be fully functional
    await page.goto('/settings');
    await page.click('text=Offspring');
    await page.click('text=Identification Collars');
    await expect(page.locator('text=Identification Collar Colors')).toBeVisible();
  });

  test('cat breeders experience no breaking changes', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.locator('text=Litters in Care, text=kittens')).toBeVisible();
  });

  test('null/undefined species gracefully falls back to default', async ({ page }) => {
    // TODO: Create test data with species=null
    // System should default to DOG terminology without crashing

    await page.goto('/dashboard');

    // Should not crash
    await expect(page.locator('body')).toBeVisible();
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

test.describe('Performance', () => {
  test('terminology lookup does not cause performance degradation', async ({ page }) => {
    await page.goto('/dashboard');

    // Measure initial load time
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should load in reasonable time (adjust threshold as needed)
    expect(loadTime).toBeLessThan(3000);
  });

  test('dashboard with many offspring groups renders quickly', async ({ page }) => {
    // TODO: Setup test data with 50+ offspring groups

    const startTime = Date.now();
    await page.goto('/dashboard');
    await page.waitForSelector('text=Offspring in Care, text=Litters in Care, text=Foals in Care');
    const renderTime = Date.now() - startTime;

    // Should render in reasonable time even with many groups
    expect(renderTime).toBeLessThan(2000);
  });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

test.describe('Accessibility', () => {
  test('species terminology is accessible to screen readers', async ({ page }) => {
    await page.goto('/dashboard');

    // Check that labels have proper ARIA attributes
    const header = page.locator('h2, h3').filter({ hasText: /in Care/ }).first();

    // Should be properly structured for screen readers
    await expect(header).toBeVisible();

    // TODO: Add more specific accessibility checks with axe-core
  });

  test('collar picker maintains accessibility when hidden', async ({ page }) => {
    // When collar picker is hidden for horses, it should not be in accessibility tree
    await page.goto('/offspring/horse-group-1');

    const collarPicker = page.locator('[data-testid="collar-picker"]');

    // Should not be in DOM at all (returns null, not just hidden)
    await expect(collarPicker).not.toBeAttached();
  });
});

// ============================================================================
// Visual Regression Tests
// ============================================================================

test.describe('Visual Regression', () => {
  test('dashboard appearance for horse breeder', async ({ page }) => {
    await page.goto('/dashboard');

    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('dashboard-horse-breeder.png');
  });

  test('dashboard appearance for dog breeder', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveScreenshot('dashboard-dog-breeder.png');
  });

  test('settings collar tab appearance', async ({ page }) => {
    await page.goto('/settings');
    await page.click('text=Offspring');
    await page.click('text=Identification Collars');

    await expect(page).toHaveScreenshot('settings-collars.png');
  });
});
