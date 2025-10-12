// apps/animals/src/bootstrapFetch.ts
// One-shot bootstrap to ensure: (1) we have a session cookie, (2) we know the active org.
// Assumes Vite proxy maps /api/* → http://localhost:6001 so cookies are first-party.

type MeResponse = {
  id: string;
  email: string | null;
  memberships: Array<{ organizationId: number; role: string }>;
};

const isProd = (import.meta as any)?.env?.MODE === "production";

// ———————————————————————————————————————————————————————————————————————
// Helpers

function pickOrgId(me?: MeResponse): number | undefined {
  // 1) runtime global (sticky during session)
  const w: any = window;
  if (w.__BHQ_ORG_ID__) return Number(w.__BHQ_ORG_ID__);

  // 2) persisted choice
  try {
    const ls = localStorage.getItem("BHQ_ORG_ID");
    if (ls) return Number(ls);
  } catch {}

  // 3) single membership → auto-pick
  if (me && me.memberships?.length === 1) return Number(me.memberships[0].organizationId);

  return undefined;
}

function storeOrgId(orgId: number) {
  const w: any = window;
  if (Number(orgId) > 0) {
    w.__BHQ_ORG_ID__ = orgId;
    try {
      localStorage.setItem("BHQ_ORG_ID", String(orgId));
    } catch {}
  }
}

async function getMe(): Promise<MeResponse | null> {
  const res = await fetch("/api/v1/auth/me", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`auth/me failed: ${res.status} ${t}`);
  }
  return (await res.json()) as MeResponse;
}

// ———————————————————————————————————————————————————————————————————————
// Public bootstrap
// ———————————————————————————————————————————————————————————————————————

export async function bootstrapAuthAndOrg(): Promise<void> {
  // Step 1: try to read current session
  let me = await getMe();

  // Step 2: figure out which org to use
  let orgId = pickOrgId(me);

  // If we have a session but no org chosen and user has exactly one, pick it now.
  if (me && orgId == null && me.memberships?.length === 1) {
    orgId = Number(me.memberships[0].organizationId);
  }

  // At this point, we must have an orgId. If not (multi-org), your UI should prompt the user.
  if (orgId != null) {
    storeOrgId(orgId);
  }
}

// Optional helper for API layer
export function getActiveOrgId(): number | undefined {
  const w: any = window;
  return Number(w.__BHQ_ORG_ID__) || Number(localStorage.getItem("BHQ_ORG_ID") || 0) || undefined;
}
