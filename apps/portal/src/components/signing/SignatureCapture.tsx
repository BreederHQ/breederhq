// apps/portal/src/components/signing/SignatureCapture.tsx
// Multi-mode signature capture component

import * as React from "react";
import { TypedSignatureInput } from "./TypedSignatureInput";
import { DrawnSignatureCanvas } from "./DrawnSignatureCanvas";
import { SigningConsentCheckbox } from "./SigningConsentCheckbox";

export type SignatureMode = "typed" | "drawn";

export interface SignatureCaptureData {
  type: SignatureMode;
  typedName?: string;
  drawnImageBase64?: string;
  consent: boolean;
}

interface Props {
  allowTyped: boolean;
  allowDrawn: boolean;
  onCapture: (data: SignatureCaptureData) => void;
  disabled?: boolean;
  initialName?: string;
}

export function SignatureCapture({
  allowTyped,
  allowDrawn,
  onCapture,
  disabled,
  initialName = "",
}: Props) {
  const [mode, setMode] = React.useState<SignatureMode>(allowTyped ? "typed" : "drawn");
  const [typedName, setTypedName] = React.useState(initialName);
  const [drawnImage, setDrawnImage] = React.useState("");
  const [consent, setConsent] = React.useState(false);

  // Notify parent of changes
  React.useEffect(() => {
    onCapture({
      type: mode,
      typedName: mode === "typed" ? typedName : undefined,
      drawnImageBase64: mode === "drawn" ? drawnImage : undefined,
      consent,
    });
  }, [mode, typedName, drawnImage, consent, onCapture]);

  const availableModes = [
    ...(allowTyped ? [{ key: "typed", label: "Type Name" }] : []),
    ...(allowDrawn ? [{ key: "drawn", label: "Draw Signature" }] : []),
  ] as const;

  return (
    <div className="space-y-6">
      {/* Mode Tabs */}
      {availableModes.length > 1 && (
        <div className="flex gap-2 border-b border-[var(--border-default)]">
          {availableModes.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key as SignatureMode)}
              disabled={disabled}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                mode === key
                  ? "text-[var(--brand-accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              } disabled:opacity-50`}
            >
              {label}
              {mode === key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand-accent)]" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Signature Input */}
      <div className="min-h-[180px]">
        {mode === "typed" && (
          <TypedSignatureInput value={typedName} onChange={setTypedName} disabled={disabled} />
        )}
        {mode === "drawn" && (
          <DrawnSignatureCanvas onCapture={setDrawnImage} disabled={disabled} />
        )}
      </div>

      {/* Consent */}
      <SigningConsentCheckbox checked={consent} onChange={setConsent} disabled={disabled} />
    </div>
  );
}
