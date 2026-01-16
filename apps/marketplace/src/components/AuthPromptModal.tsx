// apps/marketplace/src/components/AuthPromptModal.tsx
// Reusable modal to prompt anonymous users to sign in for protected actions

import * as React from "react";
import { useNavigate } from "react-router-dom";

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: "save" | "contact" | "waitlist" | "view";
  itemType?: "listing" | "program" | "breeder";
  returnTo?: string;
}

/**
 * Modal that prompts anonymous users to sign in or create an account
 * to perform protected actions like saving, contacting, or joining waitlists.
 */
export function AuthPromptModal({
  isOpen,
  onClose,
  action,
  itemType = "listing",
  returnTo,
}: AuthPromptModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const actionText = {
    save: "save this",
    contact: "contact this",
    waitlist: "join the waitlist for this",
    view: "view this",
  }[action];

  const benefits = [
    "Save favorites and create collections",
    "Contact breeders directly",
    "Join waitlists for upcoming litters",
    "Track your inquiries and conversations",
    "Get notifications about new listings",
  ];

  const handleSignIn = () => {
    const encodedReturnTo = encodeURIComponent(returnTo || window.location.pathname);
    navigate(`/auth/login?returnTo=${encodedReturnTo}`);
  };

  const handleCreateAccount = () => {
    const encodedReturnTo = encodeURIComponent(returnTo || window.location.pathname);
    navigate(`/auth/register?returnTo=${encodedReturnTo}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close modal"
      />

      <div className="relative bg-portal-card border border-border-subtle rounded-lg shadow-2xl max-w-md w-full">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-text-tertiary hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-white text-center mb-2">
            Sign in to {actionText} {itemType}
          </h3>

          {/* Description */}
          <p className="text-sm text-text-secondary text-center mb-6">
            Create a free account to unlock all marketplace features
          </p>

          {/* Benefits */}
          <div className="space-y-2 mb-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-text-secondary">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleCreateAccount}
              className="w-full px-4 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors"
            >
              Create free account
            </button>

            <button
              type="button"
              onClick={handleSignIn}
              className="w-full px-4 py-3 bg-portal-surface hover:bg-portal-surface-hover text-white rounded-lg font-medium transition-colors border border-border-subtle"
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2 text-text-tertiary hover:text-white text-sm transition-colors"
            >
              Continue browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
