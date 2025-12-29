import * as React from "react";
import { PageHeader, SectionCard, Badge } from "@bhq/ui";

export default function BusinessHoursPage() {
  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState(null, "", "/marketing");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={handleBackClick}
            className="text-secondary hover:text-primary transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <Badge variant="neutral" className="text-xs">COMING SOON</Badge>
        </div>
        <PageHeader
          title="Business Hours"
          subtitle="Define when you are available for messages and inquiries"
        />
      </div>

      {/* Content */}
      <SectionCard>
        <div className="py-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-surface-strong border border-hairline flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">Business Hours Coming Soon</h3>
          <p className="text-sm text-secondary max-w-md mx-auto">
            Set your availability schedule so clients know the best times to reach you.
            This feature is currently in development.
          </p>
        </div>

        {/* Feature Preview */}
        <div className="mt-6 border-t border-hairline pt-6">
          <h4 className="text-xs font-semibold text-secondary uppercase tracking-wide mb-4">What you will be able to do</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--brand-teal))]/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-[hsl(var(--brand-teal))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-primary">Weekly Schedule</div>
                <p className="text-xs text-secondary mt-0.5">Set hours for each day of the week</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--brand-teal))]/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-[hsl(var(--brand-teal))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-primary">Time Zone Display</div>
                <p className="text-xs text-secondary mt-0.5">Show clients your local time zone</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--brand-teal))]/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-[hsl(var(--brand-teal))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-primary">Holiday Mode</div>
                <p className="text-xs text-secondary mt-0.5">Mark dates when you are unavailable</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--brand-teal))]/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-[hsl(var(--brand-teal))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-primary">Auto-Reply Integration</div>
                <p className="text-xs text-secondary mt-0.5">Connect with auto replies for after hours</p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
