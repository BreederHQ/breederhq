// apps/portal/src/design/PageContainer.tsx
import * as React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div
      className={`portal-page-container ${className}`}
      style={{
        maxWidth: "var(--portal-max-width)",
        margin: "0 auto",
        padding: "var(--portal-space-4) var(--portal-space-2)",
      }}
    >
      {children}
    </div>
  );
}
