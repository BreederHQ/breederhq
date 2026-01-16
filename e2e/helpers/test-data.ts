// e2e/helpers/test-data.ts
// Test data helpers for Species Terminology System E2E tests

import { type Page } from '@playwright/test';

// ============================================================================
// Types
// ============================================================================

export type SpeciesCode = 'DOG' | 'CAT' | 'HORSE' | 'RABBIT' | 'GOAT' | 'SHEEP' | 'PIG' | 'CATTLE' | 'CHICKEN' | 'ALPACA' | 'LLAMA';

export type TestUser = {
  email: string;
  password: string;
  species: SpeciesCode[];
  name: string;
};

export type TestOffspringGroup = {
  identifier: string;
  species: SpeciesCode;
  countBorn: number;
  countLive: number;
  ageWeeks: number;
  damName: string;
  sireName?: string;
};

// ============================================================================
// Test User Accounts
// ============================================================================

export const TEST_USERS: Record<string, TestUser> = {
  HORSE_BREEDER: {
    email: 'horse-breeder@test.breederhq.com',
    password: 'TestPass123!',
    species: ['HORSE'],
    name: 'Horse Test Breeder',
  },
  DOG_BREEDER: {
    email: 'dog-breeder@test.breederhq.com',
    password: 'TestPass123!',
    species: ['DOG'],
    name: 'Dog Test Breeder',
  },
  CAT_BREEDER: {
    email: 'cat-breeder@test.breederhq.com',
    password: 'TestPass123!',
    species: ['CAT'],
    name: 'Cat Test Breeder',
  },
  MIXED_BREEDER: {
    email: 'mixed-breeder@test.breederhq.com',
    password: 'TestPass123!',
    species: ['DOG', 'HORSE', 'GOAT'],
    name: 'Mixed Species Breeder',
  },
  ADMIN: {
    email: 'admin@test.breederhq.com',
    password: 'TestPass123!',
    species: ['DOG', 'CAT', 'HORSE', 'RABBIT', 'GOAT', 'SHEEP', 'PIG', 'CATTLE', 'CHICKEN', 'ALPACA', 'LLAMA'],
    name: 'Admin All Species',
  },
};

// ============================================================================
// Test Offspring Groups
// ============================================================================

export const TEST_OFFSPRING_GROUPS: TestOffspringGroup[] = [
  // Horses
  {
    identifier: 'Bella x Thunder',
    species: 'HORSE',
    countBorn: 1,
    countLive: 1,
    ageWeeks: 2,
    damName: 'Bella',
    sireName: 'Thunder',
  },
  {
    identifier: 'Luna x Storm',
    species: 'HORSE',
    countBorn: 1,
    countLive: 1,
    ageWeeks: 4,
    damName: 'Luna',
    sireName: 'Storm',
  },
  // Dogs
  {
    identifier: 'Daisy x Max',
    species: 'DOG',
    countBorn: 6,
    countLive: 6,
    ageWeeks: 3,
    damName: 'Daisy',
    sireName: 'Max',
  },
  {
    identifier: 'Bella x Duke',
    species: 'DOG',
    countBorn: 4,
    countLive: 4,
    ageWeeks: 5,
    damName: 'Bella',
    sireName: 'Duke',
  },
  // Goats
  {
    identifier: 'Nanny x Billy',
    species: 'GOAT',
    countBorn: 2,
    countLive: 2,
    ageWeeks: 1,
    damName: 'Nanny',
    sireName: 'Billy',
  },
];

// ============================================================================
// Authentication Helpers
// ============================================================================

/**
 * Login to the application
 * Adjust selectors to match your actual login form
 */
export async function login(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');

  // Fill in credentials
  await page.fill('input[name="email"], input[type="email"]', user.email);
  await page.fill('input[name="password"], input[type="password"]', user.password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Login as specific test user
 */
export async function loginAsHorseBreeder(page: Page): Promise<void> {
  await login(page, TEST_USERS.HORSE_BREEDER);
}

export async function loginAsDogBreeder(page: Page): Promise<void> {
  await login(page, TEST_USERS.DOG_BREEDER);
}

export async function loginAsMixedBreeder(page: Page): Promise<void> {
  await login(page, TEST_USERS.MIXED_BREEDER);
}

export async function loginAsAdmin(page: Page): Promise<void> {
  await login(page, TEST_USERS.ADMIN);
}

/**
 * Logout from the application
 */
export async function logout(page: Page): Promise<void> {
  // Adjust selector to match your logout button
  await page.click('[data-testid="user-menu"]');
  await page.click('text=Logout, text=Sign Out');
  await page.waitForURL(/\/login/);
}

// ============================================================================
// Data Creation Helpers
// ============================================================================

/**
 * Create offspring group via UI
 * Adjust selectors to match your actual forms
 */
export async function createOffspringGroup(
  page: Page,
  data: TestOffspringGroup
): Promise<void> {
  // Navigate to breeding plans
  await page.goto('/breeding-plans');

  // Click "Record Birth" button (adjust selector)
  await page.click('button:has-text("Record Birth"), a:has-text("Record Birth")');

  // Fill in form
  await page.selectOption('select[name="species"]', data.species);
  await page.fill('input[name="identifier"]', data.identifier);
  await page.fill('input[name="damName"]', data.damName);
  if (data.sireName) {
    await page.fill('input[name="sireName"]', data.sireName);
  }

  // Set birth date based on age weeks
  const birthDate = new Date();
  birthDate.setDate(birthDate.getDate() - data.ageWeeks * 7);
  await page.fill('input[name="birthDate"]', birthDate.toISOString().split('T')[0]);

  await page.fill('input[name="countBorn"]', data.countBorn.toString());
  await page.fill('input[name="countLive"]', data.countLive.toString());

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for success
  await page.waitForURL(/\/offspring/);
}

/**
 * Create offspring group via API (faster for test setup)
 * Requires API endpoint implementation
 */
export async function createOffspringGroupViaAPI(
  page: Page,
  data: TestOffspringGroup
): Promise<number> {
  // Get auth token from cookies/localStorage
  const authToken = await page.evaluate(() => {
    return localStorage.getItem('authToken') || document.cookie.match(/authToken=([^;]+)/)?.[1];
  });

  // Calculate birth date
  const birthDate = new Date();
  birthDate.setDate(birthDate.getDate() - data.ageWeeks * 7);

  // Make API request
  const response = await page.request.post('/api/offspring-groups', {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    data: {
      identifier: data.identifier,
      species: data.species,
      countBorn: data.countBorn,
      countLive: data.countLive,
      birthedAt: birthDate.toISOString(),
      damName: data.damName,
      sireName: data.sireName,
      status: 'in_care',
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create offspring group: ${response.status()}`);
  }

  const result = await response.json();
  return result.id;
}

/**
 * Seed test data for a user
 */
export async function seedTestData(page: Page, user: TestUser): Promise<void> {
  await login(page, user);

  // Create offspring groups for each species the user has
  for (const group of TEST_OFFSPRING_GROUPS) {
    if (user.species.includes(group.species)) {
      try {
        await createOffspringGroupViaAPI(page, group);
      } catch (error) {
        console.warn(`Failed to seed ${group.identifier}:`, error);
        // Fall back to UI creation
        await createOffspringGroup(page, group);
      }
    }
  }
}

/**
 * Clean up test data (delete all offspring groups for user)
 */
export async function cleanupTestData(page: Page): Promise<void> {
  // Navigate to offspring page
  await page.goto('/offspring');

  // Delete all groups (adjust selectors)
  const deleteButtons = page.locator('button:has-text("Delete"), button[aria-label="Delete"]');
  const count = await deleteButtons.count();

  for (let i = 0; i < count; i++) {
    await deleteButtons.first().click();
    // Confirm deletion (adjust selector)
    await page.click('button:has-text("Confirm"), button:has-text("Yes")');
    await page.waitForTimeout(500); // Wait for deletion to process
  }
}

// ============================================================================
// Navigation Helpers
// ============================================================================

export async function navigateToDashboard(page: Page): Promise<void> {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
}

export async function navigateToOffspring(page: Page): Promise<void> {
  await page.goto('/offspring');
  await page.waitForLoadState('networkidle');
}

export async function navigateToSettings(page: Page): Promise<void> {
  await page.goto('/settings');
  await page.waitForLoadState('networkidle');
}

export async function navigateToSettingsOffspring(page: Page): Promise<void> {
  await navigateToSettings(page);
  await page.click('text=Offspring');
  await page.waitForLoadState('networkidle');
}

export async function navigateToSettingsCollars(page: Page): Promise<void> {
  await navigateToSettingsOffspring(page);
  await page.click('text=Identification Collars');
  await page.waitForLoadState('networkidle');
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert species-specific terminology is visible
 */
export async function assertSpeciesTerminology(
  page: Page,
  species: SpeciesCode,
  options: {
    offspringName?: boolean;
    birthProcess?: boolean;
    inCareLabel?: boolean;
    parentNames?: boolean;
  } = {}
): Promise<void> {
  const terminology = getExpectedTerminology(species);

  if (options.offspringName !== false) {
    await page.waitForSelector(`text=${terminology.offspringName}`, { timeout: 5000 });
  }

  if (options.birthProcess) {
    await page.waitForSelector(`text=${terminology.birthProcess}`, { timeout: 5000 });
  }

  if (options.inCareLabel) {
    await page.waitForSelector(`text=${terminology.inCareLabel}`, { timeout: 5000 });
  }

  if (options.parentNames) {
    await page.waitForSelector(`text=${terminology.parentFemale}`, { timeout: 5000 });
    await page.waitForSelector(`text=${terminology.parentMale}`, { timeout: 5000 });
  }
}

/**
 * Get expected terminology for a species
 */
function getExpectedTerminology(species: SpeciesCode) {
  const terminology: Record<SpeciesCode, {
    offspringName: string;
    offspringPlural: string;
    birthProcess: string;
    inCareLabel: string;
    parentFemale: string;
    parentMale: string;
  }> = {
    DOG: {
      offspringName: 'puppy',
      offspringPlural: 'puppies',
      birthProcess: 'whelping',
      inCareLabel: 'Litters in Care',
      parentFemale: 'dam',
      parentMale: 'sire',
    },
    CAT: {
      offspringName: 'kitten',
      offspringPlural: 'kittens',
      birthProcess: 'birthing',
      inCareLabel: 'Litters in Care',
      parentFemale: 'dam',
      parentMale: 'sire',
    },
    HORSE: {
      offspringName: 'foal',
      offspringPlural: 'foals',
      birthProcess: 'foaling',
      inCareLabel: 'Foals in Care',
      parentFemale: 'mare',
      parentMale: 'stallion',
    },
    RABBIT: {
      offspringName: 'kit',
      offspringPlural: 'kits',
      birthProcess: 'kindling',
      inCareLabel: 'Litters in Care',
      parentFemale: 'doe',
      parentMale: 'buck',
    },
    GOAT: {
      offspringName: 'kid',
      offspringPlural: 'kids',
      birthProcess: 'kidding',
      inCareLabel: 'Kids in Care',
      parentFemale: 'doe',
      parentMale: 'buck',
    },
    SHEEP: {
      offspringName: 'lamb',
      offspringPlural: 'lambs',
      birthProcess: 'lambing',
      inCareLabel: 'Lambs in Care',
      parentFemale: 'ewe',
      parentMale: 'ram',
    },
    PIG: {
      offspringName: 'piglet',
      offspringPlural: 'piglets',
      birthProcess: 'farrowing',
      inCareLabel: 'Litters in Care',
      parentFemale: 'sow',
      parentMale: 'boar',
    },
    CATTLE: {
      offspringName: 'calf',
      offspringPlural: 'calves',
      birthProcess: 'calving',
      inCareLabel: 'Calves in Care',
      parentFemale: 'cow',
      parentMale: 'bull',
    },
    CHICKEN: {
      offspringName: 'chick',
      offspringPlural: 'chicks',
      birthProcess: 'hatching',
      inCareLabel: 'Chicks in Care',
      parentFemale: 'hen',
      parentMale: 'rooster',
    },
    ALPACA: {
      offspringName: 'cria',
      offspringPlural: 'crias',
      birthProcess: 'birthing',
      inCareLabel: 'Crias in Care',
      parentFemale: 'dam',
      parentMale: 'sire',
    },
    LLAMA: {
      offspringName: 'cria',
      offspringPlural: 'crias',
      birthProcess: 'birthing',
      inCareLabel: 'Crias in Care',
      parentFemale: 'dam',
      parentMale: 'sire',
    },
  };

  return terminology[species];
}

/**
 * Assert collar picker visibility based on species
 */
export async function assertCollarPickerVisibility(
  page: Page,
  species: SpeciesCode,
  shouldBeVisible: boolean
): Promise<void> {
  const collarPicker = page.locator('[data-testid="collar-picker"], text=Select collar color');

  if (shouldBeVisible) {
    await collarPicker.waitFor({ state: 'visible', timeout: 5000 });
  } else {
    await collarPicker.waitFor({ state: 'detached', timeout: 5000 });
  }
}

// ============================================================================
// Utility Helpers
// ============================================================================

/**
 * Take screenshot with descriptive name
 */
export async function takeScreenshot(
  page: Page,
  name: string,
  options?: { fullPage?: boolean }
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `screenshots/${name}-${timestamp}.png`,
    fullPage: options?.fullPage ?? false,
  });
}

/**
 * Wait for API call to complete
 */
export async function waitForAPICall(
  page: Page,
  urlPattern: string | RegExp,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
): Promise<void> {
  await page.waitForResponse(
    response => {
      const url = response.url();
      const matches = typeof urlPattern === 'string'
        ? url.includes(urlPattern)
        : urlPattern.test(url);
      return matches && response.request().method() === method;
    },
    { timeout: 10000 }
  );
}

/**
 * Check for console errors
 */
export async function checkForConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  return errors;
}
