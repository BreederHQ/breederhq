// apps/portal/src/pages/PortalOffspringPage.tsx
import * as React from "react";
import { PageHeader, Button, Badge } from "@bhq/ui";
import { mockOffspring, mockOffspringGroups, type PortalOffspring, type PortalOffspringGroup } from "../mock";

/* ───────────────── Offspring Card ───────────────── */

function OffspringCard({ offspring }: { offspring: PortalOffspring }) {
  const statusVariants: Record<PortalOffspring["status"], "amber" | "green" | "blue"> = {
    reserved: "amber",
    available: "green",
    placed: "blue",
  };

  const statusLabels: Record<PortalOffspring["status"], string> = {
    reserved: "Reserved",
    available: "Available",
    placed: "Placed",
  };

  return (
    <div className="rounded-xl border border-hairline bg-surface/50 hover:bg-surface transition-colors overflow-hidden">
      {/* Placeholder for photo */}
      <div className="h-32 bg-surface-strong flex items-center justify-center text-4xl">
        🐕
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-primary">{offspring.name}</h3>
          <Badge variant={statusVariants[offspring.status]}>
            {statusLabels[offspring.status]}
          </Badge>
        </div>
        <p className="text-sm text-secondary mt-1">{offspring.breed}</p>
        <p className="text-xs text-secondary mt-1">Born: {offspring.dob}</p>
        <div className="mt-3">
          <Button variant="secondary" size="sm" className="w-full">
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Group Card ───────────────── */

function GroupCard({ group }: { group: PortalOffspringGroup }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface/50 hover:bg-surface transition-colors overflow-hidden">
      <div className="h-32 bg-surface-strong flex items-center justify-center text-4xl">
        👪
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-primary">{group.name}</h3>
        <p className="text-sm text-secondary mt-1">{group.count} expected</p>
        <p className="text-xs text-secondary mt-1">Expected: {group.expectedDate}</p>
        <div className="mt-3">
          <Button variant="secondary" size="sm" className="w-full">
            View Group
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Empty State ───────────────── */

function EmptyOffspring() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-strong flex items-center justify-center text-3xl">
        🐾
      </div>
      <h3 className="text-lg font-medium text-primary mb-2">No offspring yet</h3>
      <p className="text-sm text-secondary max-w-sm mx-auto">
        When you have reserved or placed animals, they will appear here.
      </p>
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function PortalOffspringPage() {
  const [view, setView] = React.useState<"offspring" | "groups">("offspring");

  // Check URL for view param
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "groups") {
      setView("groups");
    }
  }, []);

  const handleBackClick = () => {
    window.history.pushState(null, "", "/portal");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="p-6">
      <PageHeader
        title="My Offspring"
        subtitle={
          view === "offspring"
            ? `${mockOffspring.length} animal${mockOffspring.length !== 1 ? "s" : ""}`
            : `${mockOffspringGroups.length} group${mockOffspringGroups.length !== 1 ? "s" : ""}`
        }
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-hairline overflow-hidden">
              <button
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === "offspring"
                    ? "bg-[hsl(var(--brand-orange))] text-white"
                    : "bg-surface text-secondary hover:text-primary"
                }`}
                onClick={() => setView("offspring")}
              >
                Offspring
              </button>
              <button
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === "groups"
                    ? "bg-[hsl(var(--brand-orange))] text-white"
                    : "bg-surface text-secondary hover:text-primary"
                }`}
                onClick={() => setView("groups")}
              >
                Groups
              </button>
            </div>
            <Button variant="secondary" onClick={handleBackClick}>
              Back to Portal
            </Button>
          </div>
        }
      />

      <div className="mt-8">
        {view === "offspring" ? (
          mockOffspring.length === 0 ? (
            <EmptyOffspring />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {mockOffspring.map((offspring) => (
                <OffspringCard key={offspring.id} offspring={offspring} />
              ))}
            </div>
          )
        ) : mockOffspringGroups.length === 0 ? (
          <EmptyOffspring />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mockOffspringGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
