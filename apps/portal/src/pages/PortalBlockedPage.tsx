// apps/portal/src/pages/PortalBlockedPage.tsx
import * as React from "react";
import { HeaderBar } from "../design/HeaderBar";
import { PageContainer } from "../design/PageContainer";
import { EmptyStatePanel } from "../design/EmptyStatePanel";

interface TenantInfo {
  name: string;
  email: string | null;
  logoUrl: string | null;
}

export default function PortalBlockedPage() {
  const [tenant, setTenant] = React.useState<TenantInfo | null>(null);

  React.useEffect(() => {
    // Extract tenant slug from URL (e.g., /t/tatooine/...)
    const pathMatch = window.location.pathname.match(/^\/t\/([^/]+)/);
    const slug = pathMatch?.[1];

    if (!slug) return;

    async function fetchTenantInfo() {
      try {
        // Endpoint to get tenant info by slug
        // Only returns contactEmail if user has membership (security)
        const res = await fetch(`/api/v1/portal/org/${encodeURIComponent(slug || "")}`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setTenant({
            name: data.name || "the breeder",
            email: data.contactEmail || null,
            logoUrl: data.logoUrl || null,
          });
        }
      } catch {
        // Ignore errors - we'll show generic message
      }
    }
    fetchTenantInfo();
  }, []);

  const breederName = tenant?.name || "the breeder";
  const breederEmail = tenant?.email;
  const logoUrl = tenant?.logoUrl;

  return (
    <div style={{ minHeight: "100vh", background: "var(--portal-bg)" }}>
      <HeaderBar>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={breederName}
            style={{ height: "32px", maxWidth: "150px", objectFit: "contain" }}
          />
        ) : (
          <span style={{ fontWeight: 600, fontSize: "1.1rem", color: "var(--portal-text)" }}>
            {breederName}
          </span>
        )}
      </HeaderBar>
      <PageContainer>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "70vh",
          }}
        >
          <EmptyStatePanel
            title="Account Suspended"
            description={
              breederEmail
                ? `Your portal access has been suspended. If you believe this is a mistake, please contact ${breederName} at ${breederEmail}.`
                : `Your portal access has been suspended. If you believe this is a mistake, please contact ${breederName}.`
            }
          />
        </div>
      </PageContainer>
    </div>
  );
}
