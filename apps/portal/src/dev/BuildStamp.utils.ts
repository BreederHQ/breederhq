// apps/portal/src/dev/buildStamp.ts
// Build stamp for debug visibility

export function getBuildStamp(): string {
  // Try to get build info from Vite define or env vars
  const hash = (import.meta.env.VITE_GIT_HASH as string) || "unknown";
  const timestamp = (import.meta.env.VITE_BUILD_TIMESTAMP as string) || new Date().toISOString();

  return `Build: ${hash} ${timestamp}`;
}
