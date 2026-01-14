// apps/marketplace/src/components/useAuthPrompt.tsx
// Hook to easily prompt for authentication when needed

import * as React from "react";
import { useGateStatus } from "../gate/MarketplaceGate";

type AuthAction = "save" | "contact" | "waitlist" | "view";

interface UseAuthPromptOptions {
  action: AuthAction;
  itemType?: "listing" | "program" | "breeder";
  returnTo?: string;
}

interface UseAuthPromptReturn {
  /** Whether the modal is currently open */
  isPromptOpen: boolean;
  /** Open the auth prompt modal */
  openPrompt: () => void;
  /** Close the auth prompt modal */
  closePrompt: () => void;
  /** Check if action requires auth, and show prompt if needed. Returns true if action can proceed. */
  requireAuth: () => boolean;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
}

/**
 * Hook to handle authentication prompts for protected actions.
 *
 * @example
 * ```tsx
 * const { requireAuth, isPromptOpen, closePrompt } = useAuthPrompt({
 *   action: "save",
 *   itemType: "listing"
 * });
 *
 * const handleSave = () => {
 *   if (!requireAuth()) return; // Will show prompt if not authenticated
 *   // Proceed with save action
 * };
 *
 * return (
 *   <>
 *     <button onClick={handleSave}>Save</button>
 *     <AuthPromptModal isOpen={isPromptOpen} onClose={closePrompt} {...} />
 *   </>
 * );
 * ```
 */
export function useAuthPrompt(options: UseAuthPromptOptions): UseAuthPromptReturn {
  const [isPromptOpen, setIsPromptOpen] = React.useState(false);
  const gateStatus = useGateStatus();
  const isAuthenticated = gateStatus?.isEntitled || false;

  const openPrompt = React.useCallback(() => {
    setIsPromptOpen(true);
  }, []);

  const closePrompt = React.useCallback(() => {
    setIsPromptOpen(false);
  }, []);

  const requireAuth = React.useCallback(() => {
    if (isAuthenticated) {
      return true; // User is authenticated, action can proceed
    }

    // User is not authenticated, show prompt
    setIsPromptOpen(true);
    return false;
  }, [isAuthenticated]);

  return {
    isPromptOpen,
    openPrompt,
    closePrompt,
    requireAuth,
    isAuthenticated,
  };
}
