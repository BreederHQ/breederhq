import React, { useEffect, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("verified") === "1") setNotice("Email verified! You can sign in now.");
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        let msg = `Login failed (${res.status})`;
        try { const j = await res.json(); msg = j.message || msg; } catch {}
        throw new Error(msg);
      }
      window.location.href = "/";
    } catch (e: any) {
      setErr(e?.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-4">
        <h1 className="text-xl font-semibold">Sign in</h1>

        {notice && (
          <div className="text-sm rounded-md border border-emerald-800/40 bg-emerald-950/30 p-2">{notice}</div>
        )}
        {err && (
          <div className="text-sm rounded-md border border-red-800/40 bg-red-950/30 p-2">{err}</div>
        )}

        <label className="block text-sm">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="mt-1 w-full h-10 rounded-md border border-neutral-800 bg-neutral-900 px-3"
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>

        <label className="block text-sm">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="mt-1 w-full h-10 rounded-md border border-neutral-800 bg-neutral-900 px-3"
            autoComplete="current-password"
            placeholder="Your password"
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="w-full h-10 rounded-md bg-white text-black font-medium hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>

      </form>
    </div>
  );
}
