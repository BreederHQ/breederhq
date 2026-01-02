// apps/portal/src/pages/PortalLoginPageNew.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { SectionCard } from "../design/SectionCard";
import { TextInput } from "../design/TextInput";
import { PasswordInput } from "../design/PasswordInput";
import { Button } from "../design/Button";
import { InlineNotice } from "../design/InlineNotice";

export default function PortalLoginPageNew() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const returnUrl = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("returnUrl");
    if (url && url.startsWith("/") && !url.startsWith("//")) {
      return url;
    }
    return "/";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError("We couldn't sign you in with that email and password.");
        setLoading(false);
        return;
      }

      window.location.assign(returnUrl);
    } catch {
      setError("We couldn't sign you in with that email and password.");
      setLoading(false);
    }
  };

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
              Client Portal
            </h1>
            <SectionCard>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
                {error && (
                  <div role="alert" aria-live="polite">
                    <InlineNotice type="error">{error}</InlineNotice>
                  </div>
                )}
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
                <PasswordInput
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                  required
                  aria-label="Password"
                />
                <Button type="submit" disabled={loading} style={{ width: "100%" }} aria-busy={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
                <a
                  href="/forgot-password"
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
                  Forgot password?
                </a>
              </form>
            </SectionCard>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
