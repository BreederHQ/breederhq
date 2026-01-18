/**
 * WizardProgress Component
 *
 * Horizontal step indicator for the education wizard.
 * Shows completed, current, and upcoming steps with visual indicators.
 */

import * as React from "react";

export interface WizardStep {
  key: string;
  label: string;
  shortLabel?: string;
}

export interface WizardProgressProps {
  steps: WizardStep[];
  currentStep: number;
  className?: string;
}

export function WizardProgress({ steps, currentStep, className = "" }: WizardProgressProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [lineSegments, setLineSegments] = React.useState<Array<{ left: number; width: number; top: number }>>([]);

  // Measure positions of all line segments after render
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      setLineSegments([]);
      return;
    }

    const measure = () => {
      const circles = container.querySelectorAll("[data-step-circle]");
      const segments: Array<{ left: number; width: number; top: number }> = [];
      const containerRect = container.getBoundingClientRect();

      for (let i = 0; i < circles.length - 1; i++) {
        const currentCircle = circles[i] as HTMLElement;
        const nextCircle = circles[i + 1] as HTMLElement;

        const currentRect = currentCircle.getBoundingClientRect();
        const nextRect = nextCircle.getBoundingClientRect();

        const left = currentRect.right - containerRect.left;
        const width = nextRect.left - currentRect.right;
        const top = (currentRect.top + currentRect.height / 2) - containerRect.top;

        if (width > 0) {
          segments.push({ left, width, top });
        }
      }

      setLineSegments(segments);
    };

    const timer = setTimeout(measure, 50);
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(container);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [steps.length]);

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="flex items-center justify-between relative">
        {/* Line segments between circles */}
        {lineSegments.map((segment, idx) => {
          const isCompleted = idx < currentStep;

          return (
            <div
              key={idx}
              className="absolute"
              style={{ left: segment.left, width: segment.width, top: segment.top, transform: 'translateY(-50%)' }}
            >
              <div className={`h-0.5 rounded-full ${isCompleted ? "bg-emerald-500" : "bg-zinc-700"}`} />
            </div>
          );
        })}

        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              {/* Circle */}
              <div
                data-step-circle
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                  transition-all duration-300
                  ${isCompleted
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                      ? "bg-amber-500 text-white ring-4 ring-amber-500/30"
                      : "bg-surface border-2 border-hairline text-secondary"
                  }
                `}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Label */}
              <span
                className={`
                  mt-2 text-[10px] font-medium whitespace-nowrap text-center max-w-[60px]
                  ${isCompleted ? "text-emerald-500" : isCurrent ? "text-amber-500" : "text-secondary"}
                `}
              >
                {step.shortLabel || step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
