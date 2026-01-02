// packages/ui/src/utils/dateValidation/auditLog.ts
// Audit logging utilities for tracking validation warning overrides

import type { ValidationWarning, WarningOverride } from "./types";

// ============================================================================
// Types
// ============================================================================

export interface AuditLogContext {
  /** The tenant ID */
  tenantId: string | number;

  /** The breeding plan ID */
  planId: string | number;

  /** The user ID who performed the action */
  userId?: string | number;

  /** The user's name/email for display */
  userName?: string;
}

export interface AuditLogEntry extends WarningOverride {
  /** The plan ID this override was recorded for */
  planId: string | number;

  /** Tenant context */
  tenantId: string | number;
}

// ============================================================================
// Local Storage Cache (for offline/retry support)
// ============================================================================

const PENDING_OVERRIDES_KEY = "bhq_pending_validation_overrides";

interface PendingOverride {
  context: AuditLogContext;
  override: WarningOverride;
  attempts: number;
  lastAttempt: string;
}

function loadPendingOverrides(): PendingOverride[] {
  try {
    const raw = localStorage.getItem(PENDING_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePendingOverrides(overrides: PendingOverride[]): void {
  try {
    localStorage.setItem(PENDING_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    // Ignore storage errors
  }
}

function addPendingOverride(context: AuditLogContext, override: WarningOverride): void {
  const pending = loadPendingOverrides();
  pending.push({
    context,
    override,
    attempts: 0,
    lastAttempt: new Date().toISOString(),
  });
  savePendingOverrides(pending);
}

function removePendingOverride(index: number): void {
  const pending = loadPendingOverrides();
  pending.splice(index, 1);
  savePendingOverrides(pending);
}

// ============================================================================
// API Integration
// ============================================================================

/**
 * Log a single warning override to the server.
 * Falls back to local storage if the request fails.
 */
async function logOverrideToServer(
  context: AuditLogContext,
  override: WarningOverride
): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/v1/tenants/${encodeURIComponent(String(context.tenantId))}/breeding-plans/${encodeURIComponent(String(context.planId))}/validation-overrides`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "x-tenant-id": String(context.tenantId),
        },
        body: JSON.stringify(override),
      }
    );

    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Retry sending pending overrides that failed previously.
 * Call this on app init or periodically.
 */
export async function retryPendingOverrides(): Promise<number> {
  const pending = loadPendingOverrides();
  let successCount = 0;

  for (let i = pending.length - 1; i >= 0; i--) {
    const item = pending[i];

    // Skip if too many attempts
    if (item.attempts >= 5) {
      removePendingOverride(i);
      continue;
    }

    const success = await logOverrideToServer(item.context, item.override);

    if (success) {
      removePendingOverride(i);
      successCount++;
    } else {
      // Update attempt count
      item.attempts++;
      item.lastAttempt = new Date().toISOString();
      savePendingOverrides(pending);
    }
  }

  return successCount;
}

// ============================================================================
// Main Logging Function
// ============================================================================

/**
 * Log validation warning overrides for audit purposes.
 * This creates a record that the user acknowledged and overrode validation warnings.
 *
 * @param warnings - The warnings that were overridden
 * @param field - The field that triggered the warnings
 * @param value - The value that was entered despite the warnings
 * @param context - The context (tenant, plan, user)
 */
export async function logValidationOverrides(
  warnings: ValidationWarning[],
  field: string,
  value: string,
  context: AuditLogContext
): Promise<void> {
  const now = new Date().toISOString();

  // Create override records for each warning
  const overrides: WarningOverride[] = warnings.map((warning) => ({
    warningCode: warning.code,
    field,
    acknowledgedAt: now,
    acknowledgedBy: context.userName || String(context.userId || "unknown"),
    message: warning.message,
    valueEntered: value,
  }));

  // Log each override
  for (const override of overrides) {
    const success = await logOverrideToServer(context, override);

    if (!success) {
      // Store locally for retry
      addPendingOverride(context, override);
      console.warn(
        `[DateValidation] Failed to log override for ${field}, stored for retry:`,
        override.warningCode
      );
    }
  }
}

/**
 * Create a logging function bound to a specific context.
 * Useful for creating a logger once and reusing it throughout a form.
 *
 * @param context - The context (tenant, plan, user)
 * @returns A function that logs warnings with the bound context
 */
export function createOverrideLogger(
  context: AuditLogContext
): (warnings: ValidationWarning[], field: string, value: string) => Promise<void> {
  return (warnings, field, value) => logValidationOverrides(warnings, field, value, context);
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Fetch all validation overrides for a plan.
 * Useful for audit review.
 */
export async function fetchPlanOverrides(
  planId: string | number,
  tenantId: string | number
): Promise<WarningOverride[]> {
  try {
    const res = await fetch(
      `/api/v1/tenants/${encodeURIComponent(String(tenantId))}/breeding-plans/${encodeURIComponent(String(planId))}/validation-overrides`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "x-tenant-id": String(tenantId),
        },
      }
    );

    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error(`Failed to fetch overrides: ${res.status}`);
    }

    const json = await res.json();
    return json.data ?? json ?? [];
  } catch (error) {
    console.warn("[DateValidation] Failed to fetch overrides:", error);
    return [];
  }
}

/**
 * Check if a plan has any validation overrides.
 * Useful for showing a warning indicator on plans.
 */
export async function planHasOverrides(
  planId: string | number,
  tenantId: string | number
): Promise<boolean> {
  const overrides = await fetchPlanOverrides(planId, tenantId);
  return overrides.length > 0;
}

// ============================================================================
// React Hook
// ============================================================================

/**
 * React hook for validation override logging.
 * Provides a stable logging function and tracks pending overrides.
 */
export function useValidationAuditLog(context: AuditLogContext | null) {
  const [pendingCount, setPendingCount] = React.useState(0);

  // Check pending count on mount
  React.useEffect(() => {
    setPendingCount(loadPendingOverrides().length);
  }, []);

  // Create stable logger
  const log = React.useCallback(
    async (warnings: ValidationWarning[], field: string, value: string) => {
      if (!context) return;
      await logValidationOverrides(warnings, field, value, context);
      setPendingCount(loadPendingOverrides().length);
    },
    [context]
  );

  // Retry pending on mount
  React.useEffect(() => {
    if (context) {
      retryPendingOverrides().then(() => {
        setPendingCount(loadPendingOverrides().length);
      });
    }
  }, [context]);

  return { log, pendingCount };
}

// Need React for the hook
import * as React from "react";
