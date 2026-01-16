// apps/portal/src/design/SectionCard.tsx
import * as React from "react";

interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionCard({ children, title, subtitle, action, className = "" }: SectionCardProps) {
  return (
    <div
      className={`portal-section-card ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0) 100%), var(--portal-bg-card)",
        border: "1px solid var(--portal-border)",
        borderRadius: "var(--portal-radius-lg)",
        padding: "var(--portal-space-3)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 12px 48px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)";
      }}
    >
      {(title || subtitle || action) && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "var(--portal-space-3)",
            paddingBottom: "var(--portal-space-2)",
            borderBottom: title || subtitle ? "1px solid rgba(139, 92, 246, 0.2)" : "none",
          }}
        >
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "3px",
                height: "20px",
                background: "linear-gradient(180deg, #8b5cf6 0%, rgba(139, 92, 246, 0.4) 100%)",
                borderRadius: "2px",
              }}
            />
            <div>
              {title && (
                <h2
                  style={{
                    fontSize: "var(--portal-font-size-base)",
                    fontWeight: "var(--portal-font-weight-bold)",
                    margin: 0,
                    color: "var(--portal-text-primary)",
                    letterSpacing: "var(--portal-letter-spacing-tight)",
                  }}
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p
                  style={{
                    fontSize: "var(--portal-font-size-xs)",
                    color: "var(--portal-text-secondary)",
                    margin: title ? "4px 0 0 0" : 0,
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div style={{ marginLeft: "var(--portal-space-3)" }}>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
