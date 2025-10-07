// apps/platform/src/lib/bootstrapFetch.ts
// Minimal bootstrap to ensure we have session + an org id set for X-Org-Id.

type MeResponse = {
  id: string | number;
  email: string | null;
  memberships?: Array<{ organizationId: number; role: string }>;
  org?: { id?: number };
};

function storeOrgId(id: number | null | undefined) {
  if (!id) return;
  (window as any).__BHQ_ORG_ID__ = id;
  try { localStorage.setItem("BHQ_ORG_ID", String(id)); } catch {}
}

export async function bootstrapAuthAndOrg() {
  const meRes = await fetch("/api/v1/session", { credentials: "include" });
  if (!meRes.ok) return; // let the page handle login if needed
  const me: MeResponse = await meRes.json().catch(() => ({} as any));

  // prefer explicit org on session; else first membership
  const orgId = me?.org?.id || me?.memberships?.[0]?.organizationId || null;
  if (orgId) storeOrgId(orgId);
}
