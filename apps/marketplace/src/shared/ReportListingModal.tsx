// apps/marketplace/src/shared/ReportListingModal.tsx
// Modal for reporting abusive/fraudulent service listings

import * as React from "react";
import { useState } from "react";
import { Flag, AlertCircle } from "lucide-react";

interface ReportListingModalProps {
  listingId: number;
  listingTitle: string;
  onClose: () => void;
  onSubmit: (reason: string, description: string) => Promise<void>;
}

const REPORT_REASONS = [
  { value: "FRAUD", label: "Fraudulent or scam listing", description: "This listing appears to be fraudulent or a scam" },
  { value: "SPAM", label: "Spam or duplicate content", description: "Repetitive, off-topic, or spammy content" },
  { value: "INAPPROPRIATE", label: "Inappropriate content", description: "Contains offensive, harmful, or inappropriate material" },
  { value: "MISLEADING", label: "Misleading information", description: "False claims, fake credentials, or deceptive practices" },
  { value: "PROHIBITED", label: "Prohibited service", description: "Offers services that violate BreederHQ policies" },
  { value: "COPYRIGHT", label: "Copyright infringement", description: "Uses copyrighted images or content without permission" },
  { value: "OTHER", label: "Other issue", description: "Something else that needs review" },
];

export function ReportListingModal({
  listingId,
  listingTitle,
  onClose,
  onSubmit,
}: ReportListingModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReason) {
      setError("Please select a reason for reporting");
      return;
    }

    if (description.trim().length < 20) {
      setError("Please provide at least 20 characters of detail");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(selectedReason, description.trim());
      setSubmitted(true);

      // Auto-close after success message
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Report Submitted
          </h3>
          <p className="text-sm text-gray-600">
            Thank you for helping keep our marketplace safe. Our team will review this listing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">Report Listing</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Reporting:</p>
          <p className="text-sm font-medium text-gray-900 truncate">{listingTitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What's wrong with this listing? *
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason.value}
                  type="button"
                  onClick={() => setSelectedReason(reason.value)}
                  className={`w-full text-left p-3 border rounded-lg transition-colors ${
                    selectedReason === reason.value
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedReason === reason.value
                        ? "border-red-500 bg-red-500"
                        : "border-gray-300"
                    }`}>
                      {selectedReason === reason.value && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{reason.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{reason.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional details *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Please provide specific details to help our team review this report (minimum 20 characters)..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/500 characters {description.length < 20 && `(${20 - description.length} more required)`}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-xs text-gray-700">
                <p className="font-medium mb-1">Your report helps keep our marketplace safe</p>
                <p>
                  Our team reviews all reports within 24-48 hours. False reports may result in account restrictions.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!selectedReason || description.trim().length < 20 || submitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportListingModal;
