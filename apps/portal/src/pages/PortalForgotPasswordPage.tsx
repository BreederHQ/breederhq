// apps/portal/src/pages/PortalForgotPasswordPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { SectionCard } from "../design/SectionCard";
import { TextInput } from "../design/TextInput";
import { Button } from "../design/Button";

export default function PortalForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
      await fetch("/api/v1/auth/request-password-reset", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
        },
        body: JSON.stringify({ email }),
      });

      // Always show confirmation regardless of response
      setSubmitted(true);
    } catch {
      // Always show confirmation even on error
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
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
            <div style={{ width: "100%", maxWidth: "420px" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: "var(--portal-space-3)",
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
                  Check your email
                </h1>
                <p
                  style={{
                    fontSize: "var(--portal-font-size-base)",
                    color: "var(--portal-text-secondary)",
                    margin: 0,
                  }}
                >
                  If an account exists for that email, you'll receive a reset link shortly.
                </p>
                <a
                  href="/login"
                  style={{
                    fontSize: "var(--portal-font-size-sm)",
                    color: "var(--portal-text-secondary)",
                    textDecoration: "none",
                    marginTop: "var(--portal-space-2)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--portal-accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--portal-text-secondary)";
                  }}
                >
                  Back to login
                </a>
              </div>
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

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
          <div style={{ width: "100%", maxWidth: "420px" }}>
            <h1
              style={{
                fontSize: "var(--portal-font-size-xl)",
                fontWeight: "var(--portal-font-weight-semibold)",
                color: "var(--portal-text-primary)",
                marginBottom: "var(--portal-space-4)",
                textAlign: "center",
              }}
            >
              Forgot password
            </h1>
            <SectionCard>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
                <TextInput
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  aria-label="Email address"
                />
                <Button type="submit" disabled={loading} style={{ width: "100%" }} aria-busy={loading}>
                  {loading ? "Sending..." : "Send reset link"}
                </Button>
                <a
                  href="/login"
                  style={{
                    fontSize: "var(--portal-font-size-sm)",
                    color: "var(--portal-text-secondary)",
                    textAlign: "center",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--portal-accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--portal-text-secondary)";
                  }}
                >
                  Back to login
                </a>
              </form>
            </SectionCard>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
