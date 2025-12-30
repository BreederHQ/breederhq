// apps/portal/src/pages/PortalWaitlistPage.tsx
import * as React from "react";
import { PageHeader, Button, Badge } from "@bhq/ui";
import { mockWaitlist, type PortalWaitlistEntry } from "../mock";

/* ───────────────── Waitlist Row ───────────────── */

function WaitlistRow({ entry }: { entry: PortalWaitlistEntry }) {
  return (
    <div className="p-4 rounded-lg border border-hairline bg-surface/50 hover:bg-surface transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[hsl(var(--brand-orange))]/10 border border-[hsl(var(--brand-orange))]/30 flex items-center justify-center">
            <span className="text-lg font-bold text-[hsl(var(--brand-orange))]">#{entry.position}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-primary">{entry.breed}</div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {entry.color && (
                <Badge variant="neutral">{entry.color}</Badge>
              )}
              {entry.gender && (
                <Badge variant="neutral">{entry.gender}</Badge>
              )}
              <span className="text-xs text-secondary">Joined {entry.joinedAt}</span>
            </div>
          </div>
        </div>
        <Button variant="secondary" size="sm">
          Edit Preferences
        </Button>
      </div>
    </div>
  );
}

/* ───────────────── Empty State ───────────────── */

function EmptyWaitlist() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-strong flex items-center justify-center text-3xl">
        📋
      </div>
      <h3 className="text-lg font-medium text-primary mb-2">Not on any waitlists</h3>
      <p className="text-sm text-secondary max-w-sm mx-auto">
        When you join a waitlist, your position and preferences will appear here.
      </p>
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function PortalWaitlistPage() {
  const handleBackClick = () => {
    window.history.pushState(null, "", "/portal");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Waitlist"
        subtitle={
          mockWaitlist.length > 0
            ? `You are on ${mockWaitlist.length} waitlist${mockWaitlist.length !== 1 ? "s" : ""}`
            : "Manage your waitlist positions"
        }
        actions={
          <Button variant="secondary" onClick={handleBackClick}>
            Back to Portal
          </Button>
        }
      />

      <div className="mt-8">
        {mockWaitlist.length === 0 ? (
          <EmptyWaitlist />
        ) : (
          <div className="space-y-3">
            {mockWaitlist.map((entry) => (
              <WaitlistRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {/* Info callout */}
      <div className="mt-8 rounded-xl border border-[hsl(var(--brand-teal))]/20 bg-[hsl(var(--brand-teal))]/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[hsl(var(--brand-teal))]/20 flex items-center justify-center text-lg">
            💡
          </div>
          <div>
            <div className="font-semibold text-sm text-primary mb-1">How Waitlists Work</div>
            <p className="text-xs text-secondary">
              Your position may change as others ahead of you make selections. You will be notified when it is your turn to choose.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
