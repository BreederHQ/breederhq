// apps/portal/src/pages/PortalProfilePage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { PortalModal } from "../design/PortalModal";
import { usePortalContext } from "../hooks/usePortalContext";
import { isPortalMockEnabled } from "../dev/mockFlag";
import { DemoBanner } from "../dev/DemoBanner";
import { mockProfile } from "../dev/mockData";

/* ────────────────────────────────────────────────────────────────────────────
 * Loading State
 * ──────────────────────────────────────────────────────────────────────────── */

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
      <div
        style={{
          height: "60px",
          background: "var(--portal-bg-elevated)",
          borderRadius: "var(--portal-radius-lg)",
        }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "var(--portal-space-4)",
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: "200px",
              background: "var(--portal-bg-elevated)",
              borderRadius: "var(--portal-radius-lg)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Error State
 * ──────────────────────────────────────────────────────────────────────────── */

interface ErrorStateProps {
  onRetry: () => void;
}

function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: "60vh",
        gap: "var(--portal-space-3)",
      }}
    >
      <div
        style={{
          fontSize: "var(--portal-font-size-xl)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
        }}
      >
        Unable to load profile
      </div>
      <div
        style={{
          fontSize: "var(--portal-font-size-base)",
          color: "var(--portal-text-secondary)",
        }}
      >
        Something went wrong. Please try again.
      </div>
      <button
        onClick={onRetry}
        style={{
          padding: "var(--portal-space-2) var(--portal-space-4)",
          background: "var(--portal-accent)",
          color: "var(--portal-text-primary)",
          border: "none",
          borderRadius: "var(--portal-radius-md)",
          fontSize: "var(--portal-font-size-sm)",
          fontWeight: "var(--portal-font-weight-medium)",
          cursor: "pointer",
        }}
      >
        Retry
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Edit Name Modal
 * ──────────────────────────────────────────────────────────────────────────── */

interface EditNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onSave: (name: string) => void;
}

function EditNameModal({ isOpen, onClose, currentName, onSave }: EditNameModalProps) {
  const [name, setName] = React.useState(currentName);

  React.useEffect(() => {
    if (isOpen) {
      setName(currentName);
    }
  }, [isOpen, currentName]);

  const handleSave = () => {
    onSave(name);
    onClose();
  };

  return (
    <PortalModal isOpen={isOpen} onClose={onClose} title="Edit name">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
        <div>
          <label
            htmlFor="name-input"
            style={{
              display: "block",
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-medium)",
              color: "var(--portal-text-primary)",
              marginBottom: "var(--portal-space-1)",
            }}
          >
            Name
          </label>
          <input
            id="name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%",
              padding: "var(--portal-space-2)",
              fontSize: "var(--portal-font-size-base)",
              color: "var(--portal-text-primary)",
              background: "var(--portal-bg-elevated)",
              border: "1px solid var(--portal-border)",
              borderRadius: "var(--portal-radius-md)",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--portal-accent)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--portal-border)";
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "var(--portal-space-2)", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "var(--portal-space-2) var(--portal-space-3)",
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-medium)",
              color: "var(--portal-text-secondary)",
              background: "transparent",
              border: "1px solid var(--portal-border)",
              borderRadius: "var(--portal-radius-md)",
              cursor: "pointer",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--portal-bg-elevated)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "var(--portal-space-2) var(--portal-space-3)",
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-medium)",
              color: "var(--portal-text-primary)",
              background: "var(--portal-accent)",
              border: "none",
              borderRadius: "var(--portal-radius-md)",
              cursor: "pointer",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </PortalModal>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Section Card Component
 * ──────────────────────────────────────────────────────────────────────────── */

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

function SectionCard({ title, children }: SectionCardProps) {
  return (
    <div
      style={{
        background: "var(--portal-bg-elevated)",
        border: "1px solid var(--portal-border-subtle)",
        borderRadius: "var(--portal-radius-lg)",
        padding: "var(--portal-space-4)",
      }}
    >
      <h2
        style={{
          fontSize: "var(--portal-font-size-base)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          marginBottom: "var(--portal-space-4)",
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Field Row Component
 * ──────────────────────────────────────────────────────────────────────────── */

interface FieldRowProps {
  label: string;
  value: string;
  action?: React.ReactNode;
}

function FieldRow({ label, value, action }: FieldRowProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "var(--portal-font-size-xs)",
            color: "var(--portal-text-secondary)",
            marginBottom: "2px",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-text-primary)",
            fontWeight: "var(--portal-font-weight-medium)",
          }}
        >
          {value}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Action Link Component
 * ──────────────────────────────────────────────────────────────────────────── */

interface ActionLinkProps {
  label: string;
  onClick: () => void;
  subtitle?: string;
}

function ActionLink({ label, onClick, subtitle }: ActionLinkProps) {
  return (
    <div>
      <button
        onClick={onClick}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          fontSize: "var(--portal-font-size-sm)",
          color: "var(--portal-accent)",
          cursor: "pointer",
          textDecoration: "none",
          fontWeight: "var(--portal-font-weight-medium)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.textDecoration = "underline";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.textDecoration = "none";
        }}
      >
        {label}
      </button>
      {subtitle && (
        <div
          style={{
            fontSize: "var(--portal-font-size-xs)",
            color: "var(--portal-text-tertiary)",
            marginTop: "2px",
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ──────────────────────────────────────────────────────────────────────────── */

export default function PortalProfilePage() {
  const { userEmail, orgName, loading, error } = usePortalContext();
  const mockEnabled = isPortalMockEnabled();
  const mock = mockEnabled && !userEmail && !orgName ? mockProfile() : null;
  const [localName, setLocalName] = React.useState<string>(mock?.name || "—");
  const [showNameUpdateNote, setShowNameUpdateNote] = React.useState(false);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = React.useState(false);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleEditName = () => {
    setIsEditNameModalOpen(true);
  };

  const handleSaveName = (name: string) => {
    // UI-only - no endpoint exists
    setLocalName(name);
    setShowNameUpdateNote(true);
  };

  const handleChangePassword = () => {
    window.history.pushState(null, "", "/forgot-password");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleSignOut = () => {
    window.history.pushState(null, "", "/logout");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <PageContainer>
        <ErrorState onRetry={handleRefresh} />
      </PageContainer>
    );
  }

  // Main view
  return (
    <PageContainer>
      {mockEnabled && (
        <div style={{ marginBottom: "var(--portal-space-3)" }}>
          <DemoBanner />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
        {/* Page header */}
        <h1
          style={{
            fontSize: "var(--portal-font-size-2xl)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            margin: 0,
          }}
        >
          Profile
        </h1>

        {/* Two-column layout on desktop, single column on mobile */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "var(--portal-space-4)",
          }}
        >
          {/* Account Section */}
          <SectionCard title="Account">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
              <FieldRow
                label="Name"
                value={localName}
                action={
                  <button
                    onClick={handleEditName}
                    style={{
                      padding: "var(--portal-space-1) var(--portal-space-2)",
                      fontSize: "var(--portal-font-size-xs)",
                      fontWeight: "var(--portal-font-weight-medium)",
                      color: "var(--portal-accent)",
                      background: "transparent",
                      border: "1px solid var(--portal-border)",
                      borderRadius: "var(--portal-radius-sm)",
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--portal-bg-elevated)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    Edit name
                  </button>
                }
              />
              {showNameUpdateNote && (
                <p
                  style={{
                    fontSize: "var(--portal-font-size-xs)",
                    color: "var(--portal-text-tertiary)",
                    margin: 0,
                  }}
                >
                  Name updates are not available yet.
                </p>
              )}
              <FieldRow label="Email" value={(mock?.email || userEmail) || "—"} />
            </div>
          </SectionCard>

          {/* Security Section */}
          <SectionCard title="Security">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
              <ActionLink
                label="Change password"
                onClick={handleChangePassword}
                subtitle="We'll email you a reset link."
              />
              <ActionLink label="Sign out" onClick={handleSignOut} />
            </div>
          </SectionCard>

          {/* Organization Section */}
          <SectionCard title="Organization">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-2)" }}>
              <div
                style={{
                  fontSize: "var(--portal-font-size-sm)",
                  color: "var(--portal-text-primary)",
                  fontWeight: "var(--portal-font-weight-medium)",
                }}
              >
                {(mock?.orgName || orgName) || "—"}
              </div>
              <p
                style={{
                  fontSize: "var(--portal-font-size-xs)",
                  color: "var(--portal-text-tertiary)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                This portal is provided by your breeder. Access is linked to your email.
              </p>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Edit Name Modal */}
      <EditNameModal
        isOpen={isEditNameModalOpen}
        onClose={() => setIsEditNameModalOpen(false)}
        currentName={localName}
        onSave={handleSaveName}
      />
    </PageContainer>
  );
}
