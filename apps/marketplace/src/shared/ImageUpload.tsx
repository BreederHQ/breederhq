// apps/marketplace/src/shared/ImageUpload.tsx
// Reusable image upload component with hybrid URL input + upload functionality

import * as React from "react";
import { Upload } from "lucide-react";
import { DefaultCoverImage } from "./DefaultCoverImage";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  label: string;
  placeholder?: string;
  recommendedSize?: string;
  previewClassName?: string;
  showDefaultWhenEmpty?: boolean;
  emptyStateHint?: string;
  emptyStateExplanation?: string;
  showVisibilityToggle?: boolean;
  isVisible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
  visibilityDisabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  label,
  placeholder = "https://example.com/image.png",
  recommendedSize,
  previewClassName = "w-24 h-24",
  showDefaultWhenEmpty = false,
  emptyStateHint,
  emptyStateExplanation,
}: ImageUploadProps) {
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  // TODO: S3 Upload Integration
  // This handler will be updated to:
  // 1. Call backend API to get presigned S3 URL
  // 2. Upload file directly to S3 from browser
  // 3. Receive CDN URL and call onChange with it
  const handleUploadClick = () => {
    setUploadError("Upload functionality coming soon. Please use URL input for now.");
    setTimeout(() => setUploadError(null), 3000);
  };

  return (
    <div className="flex-1">
      <label className="block text-sm font-medium text-text-secondary mb-1">
        {label}
      </label>

      {/* URL Input Field */}
      <input
        type="url"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-portal-surface border border-border-subtle rounded-lg focus:border-accent focus:outline-none"
      />

      {/* Recommended Size Hint */}
      {recommendedSize && (
        <p className="text-xs text-text-tertiary mt-1">
          {recommendedSize}
        </p>
      )}

      {/* Upload Button - Placeholder for S3 Integration */}
      <div className="mt-2">
        <button
          type="button"
          onClick={handleUploadClick}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-secondary bg-portal-surface border border-border-subtle rounded-lg hover:bg-portal-card transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload from device
        </button>
        {uploadError && (
          <p className="text-xs text-amber-400 mt-1">{uploadError}</p>
        )}
      </div>

      {/* Preview Area */}
      <div className="mt-3 p-3 bg-portal-surface border border-border-subtle rounded-lg">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs font-medium text-text-secondary">
            {value ? "Your Image:" : "Default:"}
          </p>
          {!value && emptyStateHint && (
            <p className="text-xs text-amber-400">
              {emptyStateHint}
            </p>
          )}
        </div>

        {/* Image Preview */}
        {value ? (
          <img
            src={value}
            alt={`${label} preview`}
            className={`${previewClassName} rounded-lg object-cover border border-border-subtle`}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : showDefaultWhenEmpty ? (
          <div className={`${previewClassName} rounded-lg overflow-hidden border border-border-subtle`}>
            <DefaultCoverImage />
          </div>
        ) : (
          <div className={`${previewClassName} rounded-lg bg-portal-card border border-border-subtle flex items-center justify-center`}>
            <p className="text-xs text-text-tertiary">No image</p>
          </div>
        )}

        {/* Empty State Explanation */}
        {!value && emptyStateExplanation && (
          <p className="text-xs text-text-tertiary mt-2">
            {emptyStateExplanation}
          </p>
        )}
      </div>
    </div>
  );
}
