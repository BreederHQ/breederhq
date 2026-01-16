// apps/portal/src/components/signing/SigningConsentCheckbox.tsx
// Legal consent checkbox for e-signature

import * as React from "react";

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function SigningConsentCheckbox({ checked, onChange, disabled }: Props) {
  const id = React.useId();

  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center h-6">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="h-5 w-5 rounded border-[var(--border-default)] text-[var(--brand-accent)] focus:ring-[var(--brand-accent)] disabled:opacity-50 cursor-pointer"
        />
      </div>
      <label htmlFor={id} className="text-sm text-[var(--text-secondary)] cursor-pointer">
        I agree to sign this document electronically. I understand that my electronic signature
        has the same legal effect as a handwritten signature under the{" "}
        <a
          href="https://www.fdic.gov/resources/supervision-and-examinations/consumer-compliance-examination-manual/documents/10/x-3-1.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--brand-accent)] hover:underline"
        >
          ESIGN Act
        </a>
        .
      </label>
    </div>
  );
}
