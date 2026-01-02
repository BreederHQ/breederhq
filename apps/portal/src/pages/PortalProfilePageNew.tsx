// apps/portal/src/pages/PortalProfilePageNew.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { SectionCard } from "../design/SectionCard";

interface ProfileData {
  name: string;
  email: string;
  organization: string;
  phone?: string;
  address?: string;
}

export default function PortalProfilePageNew() {
  const [profile, setProfile] = React.useState<ProfileData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadProfile() {
      setLoading(true);

      const { isPortalMockEnabled } = await import("../dev/mockFlag");

      if (isPortalMockEnabled()) {
        setProfile({
          name: "Emily Johnson",
          email: "emily.johnson@example.com",
          organization: "Acme Breeding Co.",
          phone: "(555) 123-4567",
          address: "123 Main St, Springfield, IL 62701",
        });
        setLoading(false);
        return;
      }

      // Real data fetch would go here
      setProfile(null);
      setLoading(false);
    }

    loadProfile();
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
