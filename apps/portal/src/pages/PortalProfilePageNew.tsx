// apps/portal/src/pages/PortalProfilePageNew.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { SectionCard } from "../design/SectionCard";
import { SubjectHeader } from "../components/SubjectHeader";
import { createPortalFetch, useTenantContext } from "../derived/tenantContext";

interface ProfileData {
  name: string;
  email: string;
  organization: string;
  phone?: string;
  address?: string;
}

export default function PortalProfilePageNew() {
  const { tenantSlug, isReady } = useTenantContext();
  const [profile, setProfile] = React.useState<ProfileData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [primaryAnimal, setPrimaryAnimal] = React.useState<any>(null);

  // Animal context
  const animalName = primaryAnimal?.offspring?.name || "your reservation";
  const species = primaryAnimal?.offspring?.species || primaryAnimal?.species || null;
  const breed = primaryAnimal?.offspring?.breed || primaryAnimal?.breed || null;

  React.useEffect(() => {
    if (!isReady) return;

    const portalFetch = createPortalFetch(tenantSlug);
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        // Fetch profile and placements in parallel
        const [sessionRes, placementsData] = await Promise.all([
          fetch("/api/v1/session", { credentials: "include" }).catch(() => null),
          portalFetch<{ placements: any[] }>("/portal/placements").catch(() => null),
        ]);

        if (cancelled) return;

        if (sessionRes?.ok) {
          const data = await sessionRes.json();
          if (data.user) {
            setProfile({
              name: data.user.name || data.user.email?.split("@")[0] || "User",
              email: data.user.email || "",
              organization: data.org?.name || "",
              phone: data.user.phone,
              address: data.user.address,
            });
          }
        }

        if (placementsData) {
          const placements = placementsData.placements || [];
          if (placements.length > 0) {
            setPrimaryAnimal(placements[0]);
          }
        }
      } catch (err) {
        if (cancelled) return;
        console.error("[PortalProfile] Failed to load data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [tenantSlug, isReady]);

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
          Profile
        </h1>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: "120px",
                background: "var(--portal-bg-elevated)",
                borderRadius: "var(--portal-radius-lg)",
              }}
            />
          ))}
        </div>
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
        Profile
      </h1>

      {/* Subject Header - Species-aware context */}
      <div style={{ marginBottom: "var(--portal-space-4)" }}>
        <SubjectHeader
          name={animalName}
          species={species}
          breed={breed}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
        {profile ? (
          <>
            <SectionCard title="Personal Information">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
                <div>
                  <div
                    style={{
                      fontSize: "var(--portal-font-size-xs)",
                      color: "var(--portal-text-tertiary)",
                      marginBottom: "var(--portal-space-1)",
                    }}
                  >
                    Name
                  </div>
                  <div
                    style={{
                      fontSize: "var(--portal-font-size-sm)",
                      color: "var(--portal-text-primary)",
                    }}
                  >
                    {profile.name}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "var(--portal-font-size-xs)",
                      color: "var(--portal-text-tertiary)",
                      marginBottom: "var(--portal-space-1)",
                    }}
                  >
                    Email
                  </div>
                  <div
                    style={{
                      fontSize: "var(--portal-font-size-sm)",
                      color: "var(--portal-text-primary)",
                    }}
                  >
                    {profile.email}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "var(--portal-font-size-xs)",
                      color: "var(--portal-text-tertiary)",
                      marginBottom: "var(--portal-space-1)",
                    }}
                  >
                    Organization
                  </div>
                  <div
                    style={{
                      fontSize: "var(--portal-font-size-sm)",
                      color: "var(--portal-text-primary)",
                    }}
                  >
                    {profile.organization}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Contact Information">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
                {profile.phone && (
                  <div>
                    <div
                      style={{
                        fontSize: "var(--portal-font-size-xs)",
                        color: "var(--portal-text-tertiary)",
                        marginBottom: "var(--portal-space-1)",
                      }}
                    >
                      Phone
                    </div>
                    <div
                      style={{
                        fontSize: "var(--portal-font-size-sm)",
                        color: "var(--portal-text-primary)",
                      }}
                    >
                      {profile.phone}
                    </div>
                  </div>
                )}
                {profile.address && (
                  <div>
                    <div
                      style={{
                        fontSize: "var(--portal-font-size-xs)",
                        color: "var(--portal-text-tertiary)",
                        marginBottom: "var(--portal-space-1)",
                      }}
                    >
                      Address
                    </div>
                    <div
                      style={{
                        fontSize: "var(--portal-font-size-sm)",
                        color: "var(--portal-text-primary)",
                      }}
                    >
                      {profile.address}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          </>
        ) : (
          <SectionCard title="Account Settings">
            <p style={{ color: "var(--portal-text-secondary)", margin: 0 }}>
              Profile settings will appear here.
            </p>
          </SectionCard>
        )}
      </div>
    </PageContainer>
  );
}
