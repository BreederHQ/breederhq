import React, { useEffect, useState } from "react";

export default function VerifyPage() {
  const [status, setStatus] = useState<"verifying"|"ok"|"error">("verifying");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token") || "";
    (async () => {
      try {
        const res = await fetch("/api/v1/auth/verify", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, redirect: "/contacts" }),
        });
        if (res.ok) {
          setStatus("ok");
          location.replace("/contacts");
        } else setStatus("error");
      } catch { setStatus("error"); }
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-page text-primary">
      <div className="bg-surface border border-hairline rounded-xl p-6">
        {status === "verifying" && "Verifying…"}
        {status === "ok" && "Redirecting…"}
        {status === "error" && "Verification failed. Request a new link."}
      </div>
    </div>
  );
}
