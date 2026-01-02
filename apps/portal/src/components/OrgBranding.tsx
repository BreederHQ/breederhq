// apps/portal/src/components/OrgBranding.tsx
import * as React from "react";

interface OrgBrandingProps {
  orgName?: string | null;
  centered?: boolean;
}

export function OrgBranding({ orgName, centered = true }: OrgBrandingProps) {
  const displayName = orgName || "Acme Breeding Co.";
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: centered ? "center" : "flex-start",
        gap: "var(--portal-space-2)",
        marginBottom: "var(--portal-space-4)",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "var(--portal-radius-md)",
          background: "var(--portal-accent)",
          color: "var(--portal-text-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "var(--portal-font-weight-semibold)",
          fontSize: "var(--portal-font-size-lg)",
        }}
      >
        {displayInitial}
      </div>
      <h1
        style={{
          fontSize: "var(--portal-font-size-xl)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          margin: 0,
          textAlign: centered ? "center" : "left",
        }}
      >
        {displayName}
      </h1>
    </div>
  );
}
