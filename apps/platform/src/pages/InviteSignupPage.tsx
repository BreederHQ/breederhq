import React, { useEffect, useRef, useState } from "react";
import { createTosAcceptancePayload } from "@bhq/ui";

export default function InviteSignupPage() {
  // token from URL, read once
  const [token, setToken] = useState<string>(() => new URLSearchParams(window.location.search).get("token") || "");
  const [inviteStatus, setInviteStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [inviteMsg, setInviteMsg] = useState<string>("");

  // form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [tosAccepted, setTosAccepted] = useState(false);

  // submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string>("");
  const [done, setDone] = useState(false);

  // keep focus resilient (if something re-renders, refocus the field the user was on)
  const firstNameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!token) {
      setInviteStatus("error");
      setInviteMsg("Missing invite token.");
      return;
    }
    let cancelled = false;
    setInviteStatus("loading");
    (async () => {
      try {
        const r = await fetch(`/api/v1/account/invites/${encodeURIComponent(token)}`, { credentials: "include" });
        if (!r.ok) throw new Error("Invite not found or expired.");
        const j = await r.json();
        if (!cancelled) {
          setEmail(j.email || "");
          setInviteStatus("ok");
        }
      } catch (e: any) {
        if (!cancelled) {
          setInviteStatus("error");
          setInviteMsg(e?.message || "Unable to load invite.");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  function strongPassword(s: string) {
    return s.length >= 12 && /[a-z]/.test(s) && /[A-Z]/.test(s) && /[0-9]/.test(s) && /[^a-zA-Z0-9]/.test(s);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitMsg("");
    if (!token) return setSubmitMsg("Missing invite token.");
    if (!firstName || !lastName || !email || !password) return setSubmitMsg("All required fields must be filled.");
    if (!strongPassword(password)) return setSubmitMsg("Password must be 12+ chars with upper, lower, number, and symbol.");
    if (!tosAccepted) return setSubmitMsg("You must accept the Terms of Service to continue.");

    setSubmitting(true);
    try {
      const tosPayload = createTosAcceptancePayload("platform", "invite_signup");
      const r = await fetch("/api/v1/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, captchaToken: null, firstName, lastName, email, password, displayName, phone, tosAcceptance: tosPayload }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.message || `Sign up failed (${r.status})`);
      }
      setDone(true);
    } catch (e: any) {
      setSubmitMsg(e?.message || "Sign up failed.");
    } finally {
      setSubmitting(false);
    }
  }

  // minimal style so CSS cannot hide it
  const shell: React.CSSProperties = { minHeight: "100vh", display: "grid", placeItems: "center", background: "#000", color: "#fff" };
  const card: React.CSSProperties = { maxWidth: 520, width: "100%", background: "#111", color: "#fff", border: "1px solid #2a2a2a", borderRadius: 12, padding: 24 };

  return (
    <div style={shell}>
      <div style={card}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Accept Invite</h1>

        {/* Banner line, but keep the form mounted at all times */}
        {inviteStatus === "loading" && <div style={{ fontSize: 12, color: "#bbb", marginBottom: 12 }}>Loading invite…</div>}
        {inviteStatus === "error" && <div style={{ fontSize: 12, color: "#ff6b6b", marginBottom: 12 }}>Error: {inviteMsg}</div>}
        {inviteStatus === "ok" && <div style={{ fontSize: 12, color: "#77dd77", marginBottom: 12 }}>Invite loaded for {email}</div>}

        {done ? (
          <>
            <p style={{ fontSize: 14, color: "#bbb" }}>
              Thanks! Check your email for a verification link to activate your account.
            </p>
            <a href="/" style={{ display: "inline-block", marginTop: 12, background: "#ff8a00", color: "#000", padding: "10px 12px", borderRadius: 8, textAlign: "center", width: "100%" }}>
              Back to sign in
            </a>
          </>
        ) : (
          <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
            {/* Keep token editable but do not conditionally render the input */}
            <label style={{ fontSize: 12 }}>
              Invite token
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                style={{ width: "100%", height: 40, marginTop: 6, borderRadius: 8, border: "1px solid #2a2a2a", background: "#0a0a0a", color: "#fff", padding: "0 12px" }}
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={{ fontSize: 12 }}>
                First name
                <input
                  ref={firstNameRef}
                  autoFocus
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{ width: "100%", height: 40, marginTop: 6, borderRadius: 8, border: "1px solid #2a2a2a", background: "#0a0a0a", color: "#fff", padding: "0 12px" }}
                />
              </label>
              <label style={{ fontSize: 12 }}>
                Last name
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={{ width: "100%", height: 40, marginTop: 6, borderRadius: 8, border: "1px solid #2a2a2a", background: "#0a0a0a", color: "#fff", padding: "0 12px" }}
                />
              </label>
            </div>

            <label style={{ fontSize: 12 }}>Email
              <input
                type="email"
                value={email}
                readOnly
                style={{ width: "100%", height: 40, marginTop: 6, borderRadius: 8, border: "1px solid #2a2a2a", background: "#0a0a0a", color: "#fff", padding: "0 12px", opacity: 0.9 }}
              />
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>
                This email was invited and cannot be changed.
              </div>
            </label>

            <label style={{ fontSize: 12 }}>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", height: 40, marginTop: 6, borderRadius: 8, border: "1px solid #2a2a2a", background: "#0a0a0a", color: "#fff", padding: "0 12px" }}
              />
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>12+ chars, upper, lower, number, and symbol.</div>
            </label>

            <label style={{ fontSize: 12 }}>
              Display name (optional)
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={{ width: "100%", height: 40, marginTop: 6, borderRadius: 8, border: "1px solid #2a2a2a", background: "#0a0a0a", color: "#fff", padding: "0 12px" }}
              />
            </label>

            <label style={{ fontSize: 12 }}>
              Phone (optional)
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: "100%", height: 40, marginTop: 6, borderRadius: 8, border: "1px solid #2a2a2a", background: "#0a0a0a", color: "#fff", padding: "0 12px" }}
              />
            </label>

            {/* Terms of Service acceptance */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12, cursor: "pointer", marginTop: 4 }}>
              <input
                type="checkbox"
                checked={tosAccepted}
                onChange={(e) => setTosAccepted(e.target.checked)}
                style={{ marginTop: 2, width: 16, height: 16, cursor: "pointer" }}
              />
              <span style={{ color: "#bbb" }}>
                I agree to the{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: "#ff8a00", textDecoration: "underline" }}>
                  Terms of Service
                </a>
              </span>
            </label>

            {submitMsg && <div style={{ fontSize: 12, color: "#ff6b6b" }}>Error: {submitMsg}</div>}

            <button type="submit" disabled={submitting || !tosAccepted} style={{ height: 40, borderRadius: 8, background: tosAccepted ? "#ff8a00" : "#555", color: tosAccepted ? "#000" : "#888", cursor: tosAccepted ? "pointer" : "not-allowed" }}>
              {submitting ? "Creating…" : "Accept invite and create account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
