// apps/portal/src/components/signing/TypedSignatureInput.tsx
// Typed signature input with cursive preview (available on all tiers)

import * as React from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TypedSignatureInput({ value, onChange, disabled }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          Type your full legal name to sign
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Enter your full name"
          className="w-full px-4 py-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:border-transparent disabled:opacity-50"
        />
      </div>

      {/* Signature Preview */}
      {value && (
        <div className="mt-4">
          <label className="block text-sm text-[var(--text-secondary)] mb-2">
            Signature Preview
          </label>
          <div className="p-6 bg-white rounded-lg border border-dashed border-[var(--border-default)]">
            <p
              className="text-3xl text-center text-gray-700"
              style={{
                fontFamily: "'Brush Script MT', 'Dancing Script', cursive",
                fontStyle: "italic",
              }}
            >
              {value}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
