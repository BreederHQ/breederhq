// apps/portal/src/pages/PortalOffspringPageNew.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { EmptyStatePanel } from "../design/EmptyStatePanel";
import { SectionCard } from "../design/SectionCard";

// Format date
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    reserved: { bg: "rgba(211, 134, 91, 0.15)", text: "rgb(211, 134, 91)" },
    placed: { bg: "rgba(129, 179, 96, 0.15)", text: "rgb(129, 179, 96)" },
    available: { bg: "rgba(163, 163, 163, 0.15)", text: "rgb(163, 163, 163)" },
  };

  const color = colors[status] || colors.available;

  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: "var(--portal-radius-full)",
        fontSize: "var(--portal-font-size-xs)",
        fontWeight: "var(--portal-font-weight-medium)",
        background: color.bg,
        color: color.text,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
}

export default function PortalOffspringPageNew() {
  const [offspring, setOffspring] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadOffspring() {
      setLoading(true);

      const { isPortalMockEnabled } = await import("../dev/mockFlag");
      const { mockOffspring } = await import("../dev/mockData");

      if (isPortalMockEnabled()) {
        setOffspring(mockOffspring());
        setLoading(false);
        return;
      }

      // Real data fetch would go here
      setOffspring([]);
      setLoading(false);
    }

    loadOffspring();
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <h1
          style={{
            fontSize: "var(--portal-font-size-xl)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            marginBottom: "var(--portal-space-4)",
          }}
        >
          Offspring
        </h1>
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
      </PageContainer>
    );
  }

  if (offspring.length === 0) {
    return (
      <PageContainer>
        <h1
          style={{
            fontSize: "var(--portal-font-size-xl)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            marginBottom: "var(--portal-space-4)",
          }}
        >
          Offspring
        </h1>
        <EmptyStatePanel title="No offspring" description="Offspring records will appear here." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1
        style={{
          fontSize: "var(--portal-font-size-xl)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          marginBottom: "var(--portal-space-4)",
        }}
      >
        Offspring
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
        {offspring.map((item) => (
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
            <SectionCard>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--portal-space-3)" }}>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "var(--portal-font-size-base)",
                      fontWeight: "var(--portal-font-weight-semibold)",
                      color: "var(--portal-text-primary)",
                      marginBottom: "var(--portal-space-1)",
                    }}
                  >
                    {item.offspring?.name || "Unnamed"} ({item.offspring?.sex || "Unknown"})
                  </div>
                  <div
                    style={{
                      fontSize: "var(--portal-font-size-sm)",
                      color: "var(--portal-text-secondary)",
                      marginBottom: "var(--portal-space-1)",
                    }}
                  >
                    {item.breed} • {item.offspringGroupLabel}
                  </div>
                  <div
                    style={{
                      fontSize: "var(--portal-font-size-xs)",
                      color: "var(--portal-text-tertiary)",
                    }}
                  >
                    Born {formatDate(item.birthDate)}
                    {item.dam && ` • Dam: ${item.dam.name}`}
                    {item.sire && ` • Sire: ${item.sire.name}`}
                  </div>
                </div>
                <StatusBadge status={item.placementStatus} />
              </div>
            </SectionCard>
          </a>
        ))}
      </div>
    </PageContainer>
  );
}
