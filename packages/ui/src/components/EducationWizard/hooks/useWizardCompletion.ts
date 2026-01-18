/**
 * useWizardCompletion Hook
 *
 * Manages localStorage persistence for the education wizard completion state.
 * Tracks whether the user has completed or dismissed the wizard.
 */

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "bhq_anchor_education";

export interface WizardState {
  completed: boolean;
  dismissed: boolean;
  completedAt?: string;
  species?: string;
}

const DEFAULT_STATE: WizardState = {
  completed: false,
  dismissed: false,
};

function getStoredState(): WizardState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_STATE;
    return JSON.parse(stored) as WizardState;
  } catch {
    return DEFAULT_STATE;
  }
}

function setStoredState(state: WizardState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage not available
  }
}

export interface UseWizardCompletionResult {
  /** Whether the wizard should be shown (not completed and not dismissed) */
  shouldShow: boolean;
  /** Whether the wizard has been completed */
  isCompleted: boolean;
  /** Whether the wizard has been dismissed */
  isDismissed: boolean;
  /** Mark the wizard as completed */
  markCompleted: (species?: string) => void;
  /** Mark the wizard as dismissed (don't show again) */
  markDismissed: () => void;
  /** Reset the wizard state (for testing or re-education) */
  reset: () => void;
}

/**
 * Hook to manage education wizard completion state.
 *
 * @example
 * ```tsx
 * const { shouldShow, markCompleted, markDismissed } = useWizardCompletion();
 *
 * if (shouldShow) {
 *   return <EducationWizard onComplete={markCompleted} onDismiss={markDismissed} />;
 * }
 * ```
 */
export function useWizardCompletion(): UseWizardCompletionResult {
  const [state, setState] = useState<WizardState>(DEFAULT_STATE);

  // Load state from localStorage on mount
  useEffect(() => {
    setState(getStoredState());
  }, []);

  const shouldShow = !state.completed && !state.dismissed;

  const markCompleted = useCallback((species?: string) => {
    const newState: WizardState = {
      completed: true,
      dismissed: false,
      completedAt: new Date().toISOString(),
      species,
    };
    setState(newState);
    setStoredState(newState);
  }, []);

  const markDismissed = useCallback(() => {
    const newState: WizardState = {
      ...getStoredState(),
      dismissed: true,
    };
    setState(newState);
    setStoredState(newState);
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT_STATE);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    shouldShow,
    isCompleted: state.completed,
    isDismissed: state.dismissed,
    markCompleted,
    markDismissed,
    reset,
  };
}
