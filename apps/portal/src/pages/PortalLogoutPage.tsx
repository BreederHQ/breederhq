// apps/portal/src/pages/PortalLogoutPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";

export default function PortalLogoutPage() {
  React.useEffect(() => {
    async function logout() {
      try {
        await fetch("/api/v1/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch (err) {
        console.error("Logout error:", err);
      } finally {
        window.location.replace("/login");
      }
    }
    logout();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--portal-bg)" }}>
      <PageContainer>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "80vh",
          }}
        >
          <p style={{ color: "var(--portal-text-secondary)" }}>Logging out...</p>
        </div>
      </PageContainer>
    </div>
  );
}
