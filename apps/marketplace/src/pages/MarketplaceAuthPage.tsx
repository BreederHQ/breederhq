// apps/marketplace/src/pages/MarketplaceAuthPage.tsx
// Login/register page for marketplace access.

import * as React from "react";
import { Button } from "@bhq/ui";

interface Props {
  mode: "login" | "register";
  onModeChange: (mode: "login" | "register") => void;
  onSuccess: () => void;
}

export function MarketplaceAuthPage({ mode, onModeChange, onSuccess }: Props) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isLogin = mode === "login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const res = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok && data.ok) {
          onSuccess();
        } else {
          setError(getErrorMessage(data.error || "login_failed"));
        }
      } else {
        // Register
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        if (password.length < 8) {
          setError("Password must be at least 8 characters");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password, name: name || undefined }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok && data.ok) {
          // After registration, log in automatically
          const loginRes = await fetch("/api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password }),
          });

          if (loginRes.ok) {
            onSuccess();
          } else {
            // Registration succeeded but login failed - show login form
            setError("Account created. Please log in.");
            onModeChange("login");
          }
        } else {
          setError(getErrorMessage(data.error || "registration_failed"));
        }
      }
    } catch (err: any) {
      console.error("[MarketplaceAuthPage] Auth failed:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function getErrorMessage(code: string): string {
    switch (code) {
      case "invalid_credentials":
        return "Invalid email or password.";
      case "email_and_password_required":
        return "Email and password are required.";
      case "password_too_short":
        return "Password must be at least 8 characters.";
      default:
        return "Something went wrong. Please try again.";
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-page p-4">
      <div className="w-full max-w-md rounded-xl border border-hairline bg-surface p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[hsl(var(--brand-orange))]/10 border border-[hsl(var(--brand-orange))]/30 flex items-center justify-center text-3xl">
            {isLogin ? "M" : "+"}
          </div>
          <h1 className="text-xl font-semibold text-primary mb-2">
            {isLogin ? "Sign in to Marketplace" : "Create Marketplace Account"}
          </h1>
          <p className="text-secondary text-sm">
            {isLogin
              ? "Enter your credentials to access the marketplace."
              : "Create an account to browse and inquire about listings."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-primary mb-1">
                Name (optional)
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2 rounded-lg border border-hairline bg-surface text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-primary mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 rounded-lg border border-hairline bg-surface text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-primary mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3 py-2 rounded-lg border border-hairline bg-surface text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
              minLength={8}
              required
              disabled={loading}
            />
            {!isLogin && (
              <p className="mt-1 text-xs text-secondary">At least 8 characters</p>
            )}
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-3 py-2 rounded-lg border border-hairline bg-surface text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
                minLength={8}
                required
                disabled={loading}
              />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            disabled={loading}
          >
            {loading
              ? isLogin
                ? "Signing in..."
                : "Creating account..."
              : isLogin
              ? "Sign In"
              : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-secondary">
          {isLogin ? (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => onModeChange("register")}
                className="text-[hsl(var(--brand-orange))] hover:underline font-medium"
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => onModeChange("login")}
                className="text-[hsl(var(--brand-orange))] hover:underline font-medium"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
