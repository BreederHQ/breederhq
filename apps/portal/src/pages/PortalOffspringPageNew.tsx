// apps/portal/src/pages/PortalOffspringPageNew.tsx
import * as React from "react";
import { PageScaffold } from "../design/PageScaffold";
import { EmptyStatePanel } from "../design/EmptyStatePanel";
import { getSpeciesAccent } from "../ui/speciesTokens";
import { StatusBadge, type StatusVariant } from "../components/SubjectHeader";
import { createPortalFetch, useTenantContext } from "../derived/tenantContext";

// Format date
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Map placement status to StatusVariant
function getStatusVariant(status: string): StatusVariant {
  switch (status) {
    case "reserved":
      return "action";
    case "placed":
      return "success";
    case "pending":
      return "warning";
    default:
      return "neutral";
  }
}

export default function PortalOffspringPageNew() {
  const { tenantSlug, isReady } = useTenantContext();
  const [offspring, setOffspring] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isReady) return;

    const portalFetch = createPortalFetch(tenantSlug);
    let cancelled = false;

    async function loadOffspring() {
      setLoading(true);
      try {
        const data = await portalFetch<{ placements: any[] }>("/portal/placements");
        if (cancelled) return;
        setOffspring(data.placements || []);
      } catch (err) {
        if (cancelled) return;
        console.error("[PortalOffspringPage] Failed to load offspring:", err);
        setOffspring([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOffspring();
    return () => { cancelled = true; };
  }, [tenantSlug, isReady]);

  if (loading) {
    return (
      <PageScaffold title="Offspring">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: "100px",
                background: "var(--portal-bg-elevated)",
                borderRadius: "var(--portal-radius-lg)",
              }}
            />
          ))}
        </div>
      </PageScaffold>
    );
  }

  if (offspring.length === 0) {
    return (
      <PageScaffold title="Offspring">
        <EmptyStatePanel title="No offspring" description="Offspring records will appear here." />
      </PageScaffold>
    );
  }

  return (
    <PageScaffold title="Offspring" subtitle={`${offspring.length} record${offspring.length !== 1 ? "s" : ""}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
        {offspring.map((item) => {
          const accent = getSpeciesAccent(item.species);
          const statusVariant = getStatusVariant(item.placementStatus);

          return (
            <a
              key={item.id}
              href={`/offspring/${item.offspring?.id || item.id}`}
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, "", `/offspring/${item.offspring?.id || item.id}`);
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              style={{
                textDecoration: "none",
                display: "block",
              }}
            >
              <div
                style={{
                  background: "var(--portal-bg-card)",
                  border: "1px solid var(--portal-border-subtle)",
                  borderLeft: `3px solid ${accent}`,
                  borderRadius: "var(--portal-radius-lg)",
                  padding: "var(--portal-space-3)",
                  transition: "border-color var(--portal-transition)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--portal-border)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--portal-border-subtle)";
                  e.currentTarget.style.borderLeftColor = accent;
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--portal-space-3)" }}>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "var(--portal-font-size-base)",
                        fontWeight: "var(--portal-font-weight-semibold)",
                        color: "var(--portal-text-primary)",
                        marginBottom: "2px",
                      }}
                    >
                      {item.offspring?.name || "Unnamed"} ({item.offspring?.sex || "Unknown"})
                    </div>
                    <div
                      style={{
                        fontSize: "var(--portal-font-size-xs)",
                        color: "var(--portal-text-tertiary)",
                        marginBottom: "var(--portal-space-2)",
                      }}
                    >
                      {item.species ? `${item.species} · ` : ""}{item.breed} · {item.offspringGroupLabel}
                    </div>
                    <div
                      style={{
                        fontSize: "var(--portal-font-size-xs)",
                        color: "var(--portal-text-tertiary)",
                      }}
                    >
                      Born {formatDate(item.birthDate)}
                      {item.dam && ` · Dam: ${item.dam.name}`}
                      {item.sire && ` · Sire: ${item.sire.name}`}
                    </div>
                  </div>
                  <StatusBadge
                    label={item.placementStatus}
                    variant={statusVariant}
                    speciesAccent={accent}
                  />
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </PageScaffold>
  );
}
