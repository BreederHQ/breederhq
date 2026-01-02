// apps/portal/src/design/TextInput.tsx
import * as React from "react";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function TextInput({ label, error, style, id, ...props }: TextInputProps) {
  const inputId = id || `input-${React.useId()}`;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    fontSize: "var(--portal-font-size-base)",
    fontWeight: "var(--portal-font-weight-normal)",
    padding: "var(--portal-space-1) var(--portal-space-2)",
    borderRadius: "var(--portal-radius-md)",
    border: `1px solid ${error ? "var(--portal-error)" : "var(--portal-border)"}`,
    background: "var(--portal-bg-elevated)",
    color: "var(--portal-text-primary)",
    outline: "none",
    transition: "border-color var(--portal-transition)",
    ...style,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-1)" }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: "var(--portal-font-size-sm)",
            fontWeight: "var(--portal-font-weight-medium)",
            color: "var(--portal-text-secondary)",
          }}
        >
          {label}
        </label>
      )}
      <input
        {...props}
        id={inputId}
        style={inputStyle}
        onFocus={(e) => {
          if (!error) {
            e.currentTarget.style.borderColor = "var(--portal-accent)";
          }
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error
            ? "var(--portal-error)"
            : "var(--portal-border)";
          props.onBlur?.(e);
        }}
      />
      {error && (
        <span
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-error)",
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
