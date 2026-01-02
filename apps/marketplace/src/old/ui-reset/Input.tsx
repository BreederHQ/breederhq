// apps/marketplace/src/shared/ui/Input.tsx
import * as React from "react";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

/**
 * Styled text input with optional visually hidden label.
 * Consistent with design system tokens.
 */
export const Input = React.forwardRef<HTMLInputElement, Props>(
  function Input({ label, id, className = "", ...props }, ref) {
    const inputId = id || React.useId();

    return (
      <div className="relative">
        {label && (
          <label htmlFor={inputId} className="sr-only">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-hairline text-primary placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange/50 transition-colors ${className}`}
          {...props}
        />
      </div>
    );
  }
);
