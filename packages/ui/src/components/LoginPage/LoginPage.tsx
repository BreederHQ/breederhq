// packages/ui/src/components/LoginPage/LoginPage.tsx
// Shared login UI component used by platform, portal, and marketplace.

import * as React from "react";

export interface LoginPageProps {
  /**
   * Called after successful login.
   * Defaults to redirecting to "/" if not provided.
   */
  onSuccess?: () => void;
  /**
   * Optional URL to redirect to after login. Used if onSuccess is not provided.
   * Defaults to "/".
   */
  returnUrl?: string;
  /**
   * Optional subtitle text shown below the heading.
   * E.g., "Client Portal" or "Marketplace"
   */
  subtitle?: string;
}

/**
 * Shared login page component matching the platform login UI exactly.
 * Used by platform, portal, and marketplace apps.
 */
export const LoginPage = React.memo(function LoginPage({
  onSuccess,
  returnUrl = "/",
  subtitle,
}: LoginPageProps) {
  const emailRef = React.useRef<HTMLInputElement>(null);
  const pwRef = React.useRef<HTMLInputElement>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [working, setWorking] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setWorking(true);
    try {
      const email = emailRef.current?.value?.trim() || "";
      const password = pwRef.current?.value || "";
      const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
      const r = await fetch("/api/v1/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
        },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) {
        let msg = "Invalid credentials";
        try {
          const j = await r.json();
          if (j?.message) msg = j.message;
        } catch {
          /* ignore */
        }
        setErr(msg);
        return;
      }
      // Success
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.assign(returnUrl);
      }
    } catch {
      setErr("Network error");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="auth-page min-h-screen grid place-items-center bg-page text-primary">
      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-hairline bg-surface p-6 w-full max-w-md"
      >
        <h1 className="text-xl font-semibold mb-4">Sign in</h1>
        {subtitle && (
          <p className="text-sm text-secondary -mt-2 mb-4">{subtitle}</p>
        )}
        <label className="block mb-3">
          <span className="text-sm text-secondary">Email</span>
          <input
            ref={emailRef}
            type="email"
            defaultValue=""
            className="mt-1 w-full h-10 px-3 rounded-md bg-card border border-hairline"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </label>
        <label className="block mb-4">
          <span className="text-sm text-secondary">Password</span>
          <input
            ref={pwRef}
            type="password"
            defaultValue=""
            className="mt-1 w-full h-10 px-3 rounded-md bg-card border border-hairline"
            autoComplete="current-password"
            placeholder="Your password"
            required
          />
        </label>
        {err && <div className="text-sm text-red-400 mb-3">{err}</div>}
        <button
          type="submit"
          disabled={working}
          className="h-10 px-4 rounded-md bg-[hsl(var(--brand-orange))] text-black w-full"
        >
          {working ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
});
