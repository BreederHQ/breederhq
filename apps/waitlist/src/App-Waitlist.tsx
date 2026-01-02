// apps/waitlist/src/App-Waitlist.tsx
// Standalone Waitlist module with Approved/Pending tabs
import * as React from "react";
import { PageHeader } from "@bhq/ui";
import { ToastViewport } from "@bhq/ui/atoms/Toast";
import { OverlayMount } from "@bhq/ui/overlay/OverlayMount";
import "@bhq/ui/bhq.css";
import "@bhq/ui/styles/table.css";
import "@bhq/ui/styles/details.css";
import { readTenantIdFast, resolveTenantId } from "@bhq/ui/utils/tenant";
import { makeWaitlistApiClient, WaitlistApi } from "./api";

// Import the WaitlistTab component (which is the core content)
import WaitlistTab from "./pages/WaitlistTab";

/* ─────────────────────────────────────────────────────────────────────────────
 * Waitlist Shell with Approved/Pending tabs
 * Pattern copied from Breeding Planner (Your Breeding Plans | What If Planning)
 * ───────────────────────────────────────────────────────────────────────────── */

type WaitlistView = "approved" | "pending";

export default function AppWaitlist() {
  // Tenant and API initialization
  const [tenantId, setTenantId] = React.useState<number | null>(() => readTenantIdFast() ?? null);
  const [api, setApi] = React.useState<WaitlistApi | null>(null);
  const [readOnlyGlobal] = React.useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("bhq_read_only");
      return raw === "1" || raw === "true";
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const t = tenantId ?? (await resolveTenantId());
      if (!alive) return;
      setTenantId(t ?? null);
      if (t) setApi(makeWaitlistApiClient());
    })();
    return () => {
      alive = false;
    };
  }, [tenantId]);

  // Tab state - Approved is default
  const [activeView, setActiveView] = React.useState<WaitlistView>("approved");

  return (
    <div className="bhq-waitlist-app">
      <PageHeader
        title="Waitlist"
        subtitle={
          activeView === "approved"
            ? "Manage your approved waitlist entries"
            : "Review pending waitlist requests"
        }
        rightSlot={null}
      />

      <div className="p-4">
        {/* Page-level tabs: Approved | Pending */}
        {/* Pattern from apps/breeding/src/App-Breeding.tsx lines 2703-2728 */}
        <nav className="inline-flex items-end gap-6 mb-4" role="tablist" aria-label="Waitlist views">
          {(["approved", "pending"] as const).map((tabKey) => {
            const isActive = activeView === tabKey;
            const label = tabKey === "approved" ? "Approved" : "Pending";
            return (
              <button
                key={tabKey}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveView(tabKey)}
                className={[
                  "pb-1 text-sm font-medium transition-colors select-none",
                  isActive
                    ? "text-neutral-900 dark:text-neutral-50"
                    : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
                ].join(" ")}
                style={{
                  borderBottom: isActive ? "2px solid #f97316" : "2px solid transparent",
                }}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* Tab content */}
        {activeView === "approved" ? (
          <WaitlistTab
            api={api}
            tenantId={tenantId}
            readOnlyGlobal={readOnlyGlobal}
          />
        ) : (
          <PendingWaitlistTab
            api={api}
            tenantId={tenantId}
            readOnlyGlobal={readOnlyGlobal}
          />
        )}
      </div>

      <ToastViewport />
      <OverlayMount />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Pending Waitlist Tab (placeholder - identical structure, different data source)
 * TODO: wire pending waitlist sources (marketplace inquiries, portal actions, etc.)
 * ───────────────────────────────────────────────────────────────────────────── */
function PendingWaitlistTab({
  api,
  tenantId,
  readOnlyGlobal,
}: {
  api: WaitlistApi | null;
  tenantId: number | null;
  readOnlyGlobal: boolean;
}) {
  // TODO: wire pending waitlist sources (marketplace inquiries, portal actions, etc.)
  // For now, render the same WaitlistTab structure but with empty data placeholder
  // Actions that would mutate Approved data are disabled in Pending view

  return (
    <div className="rounded-lg border border-hairline bg-surface p-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
        <svg
          className="w-6 h-6 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-primary mb-1">Pending Waitlist</h3>
      <p className="text-sm text-secondary max-w-sm mx-auto mb-4">
        Marketplace inquiries and portal requests will appear here for your review before being added to the approved waitlist.
      </p>
      <p className="text-xs text-secondary/70">
        {/* TODO: wire pending waitlist sources (marketplace inquiries, portal actions, etc.) */}
        Coming soon - this view will show entries awaiting breeder approval.
      </p>
    </div>
  );
}

// Export for standalone mounting
if (typeof window !== "undefined") {
  (window as any).AppWaitlist = AppWaitlist;
}
