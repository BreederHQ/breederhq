// apps/portal/src/pages/PortalDashboardPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { InlineNotice } from "../design/InlineNotice";
import { Button } from "../design/Button";

const WELCOME_NOTICE_KEY = "portal_welcome_dismissed";

export default function PortalDashboardPage() {
  const [showWelcome, setShowWelcome] = React.useState(false);

  React.useEffect(() => {
    // Check if welcome notice has been dismissed
    const dismissed = localStorage.getItem(WELCOME_NOTICE_KEY);
    if (!dismissed) {
      setShowWelcome(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(WELCOME_NOTICE_KEY, "true");
    setShowWelcome(false);
  };

  return (
    <PageContainer>
      {showWelcome && (
        <div style={{ marginBottom: "var(--portal-space-4)" }}>
          <InlineNotice type="info">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-2)" }}>
              <div>
                <strong style={{ display: "block", marginBottom: "var(--portal-space-1)" }}>Welcome</strong>
                <span>This is your private portal for messages, agreements, documents, and updates.</span>
              </div>
              <div>
                <Button
                  variant="ghost"
                  onClick={handleDismiss}
                  style={{
                    fontSize: "var(--portal-font-size-sm)",
                    padding: "var(--portal-space-1) var(--portal-space-2)",
                  }}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </InlineNotice>
        </div>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          minHeight: "60vh",
          gap: "var(--portal-space-2)",
        }}
      >
        <h1
          style={{
            fontSize: "var(--portal-font-size-xl)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            margin: 0,
          }}
        >
          You're all set
        </h1>
        <p
          style={{
            fontSize: "var(--portal-font-size-base)",
            color: "var(--portal-text-secondary)",
            margin: 0,
          }}
        >
          New messages, tasks, and updates will appear here.
        </p>
      </div>
    </PageContainer>
  );
}
