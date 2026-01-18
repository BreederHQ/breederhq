/**
 * WizardStep Component
 *
 * Wrapper for individual wizard step content.
 * Provides consistent layout and styling for step content.
 */

import * as React from "react";

export interface WizardStepProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function WizardStep({ title, subtitle, children, className = "" }: WizardStepProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      {/* Step header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-primary">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-sm text-secondary">{subtitle}</p>
        )}
      </div>

      {/* Step content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
