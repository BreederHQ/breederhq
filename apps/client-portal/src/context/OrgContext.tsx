// apps/client-portal/src/context/OrgContext.tsx
// Provides organization slug context throughout the portal app

import * as React from "react";

interface OrgContextValue {
  orgSlug: string;
  /** Base path for portal routes: /p/:orgSlug */
  basePath: string;
  /** Navigate within portal (prepends basePath) */
  navigate: (path: string) => void;
}

const OrgContext = React.createContext<OrgContextValue | null>(null);

export function useOrg(): OrgContextValue {
  const ctx = React.useContext(OrgContext);
  if (!ctx) {
    throw new Error("useOrg must be used within OrgProvider");
  }
  return ctx;
}

interface OrgProviderProps {
  orgSlug: string;
  children: React.ReactNode;
}

export function OrgProvider({ orgSlug, children }: OrgProviderProps) {
  const basePath = `/p/${orgSlug}`;

  const navigate = React.useCallback(
    (path: string) => {
      const fullPath = path.startsWith("/") ? `${basePath}${path}` : `${basePath}/${path}`;
      window.history.pushState(null, "", fullPath);
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    [basePath]
  );

  const value = React.useMemo(
    () => ({ orgSlug, basePath, navigate }),
    [orgSlug, basePath, navigate]
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}
