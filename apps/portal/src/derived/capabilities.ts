// apps/portal/src/derived/capabilities.ts
// Capability gating for portal endpoints to avoid repeated 403 errors

interface CapabilityValue {
  enabled: boolean;
  expiresAt: number;
}

const CAPABILITY_STORAGE_KEY = "portal_capabilities";

export const capabilityKeys = {
  invoices_enabled: "invoices_enabled",
} as const;

type CapabilityKey = (typeof capabilityKeys)[keyof typeof capabilityKeys];

// Get capabilities from sessionStorage
function getCapabilitiesFromStorage(): Record<string, CapabilityValue> {
  try {
    const stored = sessionStorage.getItem(CAPABILITY_STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    return parsed || {};
  } catch {
    return {};
  }
}

// Save capabilities to sessionStorage
function saveCapabilitiesToStorage(
  capabilities: Record<string, CapabilityValue>
): void {
  try {
    sessionStorage.setItem(CAPABILITY_STORAGE_KEY, JSON.stringify(capabilities));
  } catch {
    // sessionStorage not available
  }
}

/**
 * Get capability status
 * Returns true if capability is enabled (or not yet set)
 * Returns false if capability is disabled and TTL hasn't expired
 */
export function getCapability(key: CapabilityKey): boolean {
  const capabilities = getCapabilitiesFromStorage();
  const capability = capabilities[key];

  if (!capability) {
    // Not set yet, assume enabled
    return true;
  }

  const now = Date.now();
  if (now >= capability.expiresAt) {
    // Expired, reset to enabled
    delete capabilities[key];
    saveCapabilitiesToStorage(capabilities);
    return true;
  }

  return capability.enabled;
}

/**
 * Set capability status with TTL
 * @param key Capability key
 * @param enabled Whether capability is enabled
 * @param ttlMs Time to live in milliseconds (default 10 minutes)
 */
export function setCapability(
  key: CapabilityKey,
  enabled: boolean,
  ttlMs: number = 10 * 60 * 1000
): void {
  const capabilities = getCapabilitiesFromStorage();
  const expiresAt = Date.now() + ttlMs;

  capabilities[key] = {
    enabled,
    expiresAt,
  };

  saveCapabilitiesToStorage(capabilities);
}

/**
 * Clear a specific capability
 */
export function clearCapability(key: CapabilityKey): void {
  const capabilities = getCapabilitiesFromStorage();
  delete capabilities[key];
  saveCapabilitiesToStorage(capabilities);
}

/**
 * Clear all capabilities
 */
export function clearAllCapabilities(): void {
  try {
    sessionStorage.removeItem(CAPABILITY_STORAGE_KEY);
  } catch {
    // sessionStorage not available
  }
}
