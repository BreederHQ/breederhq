import React, { useEffect, useState } from "react";

type Subscriber = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  createdAt: string;
};

export default function AccountManagement() {
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [email, setEmail] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setError(null);
      try {
        const res = await fetch("/api/v1/account/subscribers", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load.");
        const data = await res.json();
        setSubs(data.items);
      } catch (e: any) {
        setError(e.message || "Load failed");
      }
    })();
  }, []);

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/v1/account/invites", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Invite failed");
      }
      const data = await res.json();
      setInviteLink(data.link);
      setEmail("");
    } catch (e: any) {
      setError(e.message || "Invite failed");
    }
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-xl font-semibold mb-4">Account Management</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-neutral-800 rounded-xl p-4">
          <h2 className="font-medium mb-2">Subscribers</h2>
          {error && <div className="text-sm text-red-500 mb-2">{error}</div>}
          <ul className="divide-y divide-neutral-800">
            {subs.map(s => (
              <li key={s.id} className="py-2 text-sm">
                {s.firstName} {s.lastName} <span className="text-neutral-400">{s.email ?? ""}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-neutral-800 rounded-xl p-4">
          <h2 className="font-medium mb-2">Invite a new tester</h2>
          <form onSubmit={createInvite} className="space-y-2">
            <input className="w-full px-2 py-2 rounded-md border border-neutral-800 bg-neutral-950"
                   placeholder="email@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="px-3 py-2 rounded-md bg-orange-500 text-black">Create invite</button>
          </form>
          {inviteLink && (
            <div className="mt-3 text-xs">
              Invite link created: <a className="underline" href={inviteLink}>{inviteLink}</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
