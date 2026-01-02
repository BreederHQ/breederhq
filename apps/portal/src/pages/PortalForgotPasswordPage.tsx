// apps/portal/src/pages/PortalForgotPasswordPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { SectionCard } from "../design/SectionCard";
import { TextInput } from "../design/TextInput";
import { Button } from "../design/Button";

export default function PortalForgotPasswordPage() {
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
          <div style={{ width: "100%", maxWidth: "400px" }}>
            <h1
              style={{
                fontSize: "var(--portal-font-size-xl)",
                fontWeight: "var(--portal-font-weight-semibold)",
                color: "var(--portal-text-primary)",
                marginBottom: "var(--portal-space-4)",
                textAlign: "center",
              }}
            >
              Forgot Password
            </h1>
            <SectionCard>
              <form>
                <TextInput
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  style={{ marginBottom: "var(--portal-space-3)" }}
                />
                <Button type="submit" style={{ width: "100%" }}>
                  Reset Password
                </Button>
              </form>
            </SectionCard>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
