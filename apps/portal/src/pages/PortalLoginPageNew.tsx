// apps/portal/src/pages/PortalLoginPageNew.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { SectionCard } from "../design/SectionCard";
import { TextInput } from "../design/TextInput";
import { PasswordInput } from "../design/PasswordInput";
import { Button } from "../design/Button";
import { InlineNotice } from "../design/InlineNotice";

// BreederHQ logo - same asset used by app.breederhq.com
import logoUrl from "@bhq/ui/assets/logo.png";

export default function PortalLoginPageNew() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Extract tenant slug from URL path (e.g., /t/tatooine/login) or returnUrl
  const tenantSlug = React.useMemo(() => {
    // First try to get from current URL
    const pathMatch = window.location.pathname.match(/^\/t\/([^/]+)/);
    if (pathMatch) return pathMatch[1];

    // Then try from returnUrl
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get("returnUrl") || "";
    const returnMatch = returnUrl.match(/^\/t\/([^/]+)/);
    if (returnMatch) return returnMatch[1];

    return null;
  }, []);

  const returnUrl = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("returnUrl");
    if (url && url.startsWith("/") && !url.startsWith("//")) {
      return url;
    }
    // Default to tenant-prefixed dashboard if we have a slug
    if (tenantSlug) {
      return `/t/${tenantSlug}/dashboard`;
    }
    return "/";
  }, [tenantSlug]);

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

      // If we don't have a tenant slug yet, fetch session to get it
      let targetUrl = returnUrl;
      if (!tenantSlug) {
        try {
          const sessionRes = await fetch("/api/v1/session", { credentials: "include" });
          if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            const slug = sessionData.tenant?.slug;
            if (slug) {
              targetUrl = `/t/${slug}/dashboard`;
            }
          }
        } catch {
          // Ignore - use default returnUrl
        }
      }

      window.location.assign(targetUrl);
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
            {/* BreederHQ branding - static, platform-owned */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "var(--portal-space-2)",
                marginBottom: "var(--portal-space-4)",
              }}
            >
              <img
                src={logoUrl}
                alt="BreederHQ"
                style={{
                  width: "64px",
                  height: "64px",
                  objectFit: "contain",
                }}
              />
              <h1
                style={{
                  fontSize: "var(--portal-font-size-xl)",
                  fontWeight: "var(--portal-font-weight-semibold)",
                  color: "var(--portal-text-primary)",
                  margin: 0,
                  textAlign: "center",
                }}
              >
                BreederHQ
              </h1>
              <h2
                style={{
                  fontSize: "var(--portal-font-size-base)",
                  fontWeight: "var(--portal-font-weight-medium)",
                  color: "var(--portal-text-secondary)",
                  margin: 0,
                  textAlign: "center",
                }}
              >
                Client Portal
              </h2>
              <p
                style={{
                  fontSize: "var(--portal-font-size-sm)",
                  color: "var(--portal-text-tertiary)",
                  margin: 0,
                  textAlign: "center",
                  maxWidth: "300px",
                }}
              >
                Access your placements, messages, documents, and scheduling.
              </p>
            </div>
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
                  Forgot password
                </a>
              </form>
            </SectionCard>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
