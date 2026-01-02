// packages/ui/src/components/ValidatedDateInput.tsx
// A date input component with integrated validation for breeding plan milestones

import * as React from "react";
import type {
  MilestoneKey,
  ValidationContext,
  ValidationResult,
  ValidationWarning,
  PlanActualDates,
} from "../utils/dateValidation/types";
import { validateSingleDate } from "../utils/dateValidation/validate";
import { getMilestoneLabel } from "../utils/dateValidation/defaults";

// ============================================================================
// Types
// ============================================================================

export interface ValidatedDateInputProps {
  /** The milestone this date represents */
  milestone: MilestoneKey;

  /** Current value (ISO date string or null) */
  value: string | null | undefined;

  /** Called when value changes */
  onChange: (value: string | null) => void;

  /** All current actual dates for the plan (for cross-field validation) */
  planActuals: PlanActualDates;

  /** Validation context (species, config, female info) */
  validationContext: ValidationContext;

  /** Called when user confirms override of warnings */
  onWarningsOverridden?: (warnings: ValidationWarning[]) => void;

  /** Additional CSS classes */
  className?: string;

  /** Whether the input is disabled */
  disabled?: boolean;

  /** Placeholder text */
  placeholder?: string;

  /** Label override (defaults to milestone label) */
  label?: string;

  /** Hide the label */
  hideLabel?: boolean;

  /** Size variant */
  size?: "sm" | "md" | "lg";
}

export interface ValidationState {
  result: ValidationResult | null;
  showWarningModal: boolean;
  pendingValue: string | null;
}

// ============================================================================
// Warning Confirmation Modal
// ============================================================================

interface WarningModalProps {
  warnings: ValidationWarning[];
  onConfirm: () => void;
  onCancel: () => void;
  fieldLabel: string;
  value: string;
}

function WarningModal({ warnings, onConfirm, onCancel, fieldLabel, value }: WarningModalProps) {
  const seriousCount = warnings.filter((w) => w.severity === "serious").length;
  const cautionCount = warnings.filter((w) => w.severity === "caution").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-surface border border-hairline rounded-xl shadow-xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-hairline bg-yellow-500/10">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium text-yellow-500">Validation Warnings</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-secondary">
            The value <span className="font-mono text-primary">{value}</span> for{" "}
            <span className="font-medium text-primary">{fieldLabel}</span> triggered the following warnings:
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {warnings.map((warning, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-sm ${
                  warning.severity === "serious"
                    ? "bg-red-500/10 border-red-500/30 text-red-300"
                    : warning.severity === "caution"
                    ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
                    : "bg-blue-500/10 border-blue-500/30 text-blue-300"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="font-medium uppercase text-xs">
                    {warning.severity}
                  </span>
                </div>
                <p className="mt-1">{warning.message}</p>
                {warning.details && (
                  <div className="mt-2 text-xs opacity-75">
                    {warning.details.actual && <div>Entered: {warning.details.actual}</div>}
                    {warning.details.expected && <div>Expected: {warning.details.expected}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {seriousCount > 0 && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-300">
                <strong>Warning:</strong> This date may indicate a data entry error or an unusual situation.
                Please verify this is correct before proceeding.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-hairline flex items-center justify-end gap-3 bg-black/20">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-hairline hover:bg-white/5 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              seriousCount > 0
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-yellow-600 hover:bg-yellow-500 text-white"
            }`}
          >
            {seriousCount > 0 ? "I Understand, Proceed Anyway" : "Proceed"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Error Display
// ============================================================================

interface ErrorDisplayProps {
  errors: ValidationResult["errors"];
}

function ErrorDisplay({ errors }: ErrorDisplayProps) {
  if (errors.length === 0) return null;

  return (
    <div className="mt-1 space-y-1">
      {errors.map((error, idx) => (
        <div key={idx} className="text-xs text-red-400 flex items-start gap-1">
          <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error.message}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ValidatedDateInput({
  milestone,
  value,
  onChange,
  planActuals,
  validationContext,
  onWarningsOverridden,
  className = "",
  disabled = false,
  placeholder = "mm/dd/yyyy",
  label,
  hideLabel = false,
  size = "md",
}: ValidatedDateInputProps) {
  const [state, setState] = React.useState<ValidationState>({
    result: null,
    showWarningModal: false,
    pendingValue: null,
  });

  const inputRef = React.useRef<HTMLInputElement>(null);

  // Compute display label
  const displayLabel = label ?? getMilestoneLabel(milestone);

  // Size classes
  const sizeClasses = {
    sm: "h-7 text-xs px-2",
    md: "h-8 text-sm px-2",
    lg: "h-10 text-base px-3",
  };

  // Validate on blur
  const handleBlur = React.useCallback(() => {
    const inputValue = inputRef.current?.value || null;

    if (!inputValue) {
      // Clear validation state if empty
      setState({ result: null, showWarningModal: false, pendingValue: null });
      if (value !== null) {
        onChange(null);
      }
      return;
    }

    // Run validation
    const result = validateSingleDate(milestone, inputValue, planActuals, validationContext);

    // If there are errors, show them but don't apply the value
    if (!result.valid) {
      setState({ result, showWarningModal: false, pendingValue: null });
      return;
    }

    // If there are warnings, show the modal
    if (result.warnings.length > 0) {
      setState({ result, showWarningModal: true, pendingValue: inputValue });
      return;
    }

    // No issues, apply the value
    setState({ result: null, showWarningModal: false, pendingValue: null });
    onChange(inputValue);
  }, [milestone, planActuals, validationContext, onChange, value]);

  // Handle warning confirmation
  const handleWarningConfirm = React.useCallback(() => {
    if (state.pendingValue && state.result) {
      // Notify about overridden warnings for audit logging
      if (onWarningsOverridden && state.result.warnings.length > 0) {
        onWarningsOverridden(state.result.warnings);
      }
      onChange(state.pendingValue);
    }
    setState({ result: null, showWarningModal: false, pendingValue: null });
  }, [state.pendingValue, state.result, onChange, onWarningsOverridden]);

  // Handle warning cancellation
  const handleWarningCancel = React.useCallback(() => {
    setState({ result: null, showWarningModal: false, pendingValue: null });
    // Reset input to original value
    if (inputRef.current) {
      inputRef.current.value = value || "";
    }
  }, [value]);

  // Handle immediate change (for controlled updates)
  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear any existing validation errors while typing
    if (state.result?.errors.length) {
      setState((s) => ({ ...s, result: null }));
    }
  }, [state.result]);

  // Determine input border color based on validation state
  const getBorderClass = () => {
    if (state.result?.errors.length) {
      return "border-red-500 focus:ring-red-500/50 focus:border-red-500";
    }
    if (state.result?.warnings.length) {
      return "border-yellow-500 focus:ring-yellow-500/50 focus:border-yellow-500";
    }
    return "border-hairline focus:ring-brand-orange/50 focus:border-brand-orange";
  };

  return (
    <div className={className}>
      {!hideLabel && (
        <label className="block text-sm font-medium text-secondary mb-1">
          {displayLabel}
        </label>
      )}

      <input
        ref={inputRef}
        type="date"
        defaultValue={value || ""}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={`
          w-full rounded border bg-surface text-primary
          focus:outline-none focus:ring-1
          disabled:opacity-50 disabled:cursor-not-allowed
          [color-scheme:dark]
          ${sizeClasses[size]}
          ${getBorderClass()}
        `}
      />

      {/* Error display */}
      {state.result && <ErrorDisplay errors={state.result.errors} />}

      {/* Warning modal */}
      {state.showWarningModal && state.result && state.pendingValue && (
        <WarningModal
          warnings={state.result.warnings}
          onConfirm={handleWarningConfirm}
          onCancel={handleWarningCancel}
          fieldLabel={displayLabel}
          value={state.pendingValue}
        />
      )}
    </div>
  );
}

// ============================================================================
// Hook for programmatic validation
// ============================================================================

export interface UseBreedingDateValidationOptions {
  planActuals: PlanActualDates;
  validationContext: ValidationContext;
}

export interface UseBreedingDateValidationResult {
  validate: (milestone: MilestoneKey, value: string | null) => ValidationResult;
  validateAll: () => ValidationResult;
}

/**
 * Hook for programmatic validation of breeding dates.
 * Useful for validating on form submit or for custom UI implementations.
 */
export function useBreedingDateValidation({
  planActuals,
  validationContext,
}: UseBreedingDateValidationOptions): UseBreedingDateValidationResult {
  const validate = React.useCallback(
    (milestone: MilestoneKey, value: string | null): ValidationResult => {
      return validateSingleDate(milestone, value, planActuals, validationContext);
    },
    [planActuals, validationContext]
  );

  const validateAll = React.useCallback((): ValidationResult => {
    // Import and use full validation
    const { validateBreedingDates } = require("../utils/dateValidation/validate");
    return validateBreedingDates(planActuals, validationContext);
  }, [planActuals, validationContext]);

  return { validate, validateAll };
}

export default ValidatedDateInput;
