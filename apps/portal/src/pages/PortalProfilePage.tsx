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
          height: "180px",
          background: "var(--portal-bg-elevated)",
          borderRadius: "var(--portal-radius-2xl)",
        }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--portal-space-3)",
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: "140px",
              background: "var(--portal-bg-elevated)",
              borderRadius: "var(--portal-radius-xl)",
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
 * Identity Hero Card - Premium avatar and name presentation
 * ──────────────────────────────────────────────────────────────────────────── */

interface IdentityHeroCardProps {
  name: string;
  email: string;
  onEditName: () => void;
}

function IdentityHeroCard({ name, email, onEditName }: IdentityHeroCardProps) {
  // Get initials for avatar
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      style={{
        background: "var(--portal-gradient-hero), var(--portal-bg-card)",
        border: "1px solid var(--portal-border-glow)",
        borderRadius: "var(--portal-radius-2xl)",
        boxShadow: "var(--portal-shadow-hero)",
        padding: "var(--portal-space-6)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative gradient orb */}
      <div
        style={{
          position: "absolute",
          top: "-40%",
          right: "-15%",
          width: "350px",
          height: "350px",
          background: "radial-gradient(circle, rgba(255, 107, 53, 0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "var(--portal-space-5)" }}>
        {/* Avatar */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "var(--portal-gradient-status-reserved)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "var(--portal-font-size-2xl)",
            fontWeight: "var(--portal-font-weight-bold)",
            color: "white",
            boxShadow: "0 0 30px rgba(255, 107, 53, 0.3)",
            flexShrink: 0,
          }}
        >
          {initials || "?"}
        </div>

        {/* Identity info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--portal-space-2)", marginBottom: "var(--portal-space-1)" }}>
            <h1
              style={{
                fontSize: "var(--portal-font-size-2xl)",
                fontWeight: "var(--portal-font-weight-bold)",
                color: "var(--portal-text-primary)",
                margin: 0,
                letterSpacing: "var(--portal-letter-spacing-tight)",
              }}
            >
              {name}
            </h1>
            <button
              onClick={onEditName}
              style={{
                padding: "var(--portal-space-1) var(--portal-space-2)",
                fontSize: "var(--portal-font-size-xs)",
                fontWeight: "var(--portal-font-weight-medium)",
                color: "var(--portal-accent)",
                background: "rgba(255, 107, 53, 0.1)",
                border: "none",
                borderRadius: "var(--portal-radius-sm)",
                cursor: "pointer",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 107, 53, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 107, 53, 0.1)";
              }}
            >
              Edit
            </button>
          </div>
          <div
            style={{
              fontSize: "var(--portal-font-size-base)",
              color: "var(--portal-text-secondary)",
            }}
          >
            {email}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Action Card - For security and organization actions
 * ──────────────────────────────────────────────────────────────────────────── */

interface ActionCardProps {
  title: string;
  children: React.ReactNode;
}

function ActionCard({ title, children }: ActionCardProps) {
  return (
    <div
      style={{
        background: "var(--portal-gradient-card), var(--portal-bg-card)",
        border: "1px solid var(--portal-border-subtle)",
        borderRadius: "var(--portal-radius-xl)",
        boxShadow: "var(--portal-shadow-card)",
        padding: "var(--portal-space-4)",
      }}
    >
      <h2
        style={{
          fontSize: "var(--portal-font-size-base)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          margin: 0,
          marginBottom: "var(--portal-space-3)",
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Action Link - Clickable action within cards
 * ──────────────────────────────────────────────────────────────────────────── */

interface ActionLinkProps {
  label: string;
  onClick: () => void;
  subtitle?: string;
  variant?: "default" | "danger";
}

function ActionLink({ label, onClick, subtitle, variant = "default" }: ActionLinkProps) {
  const color = variant === "danger" ? "var(--portal-error)" : "var(--portal-accent)";

  return (
    <div
      style={{
        padding: "var(--portal-space-2) 0",
        borderBottom: "1px solid var(--portal-border-subtle)",
      }}
    >
      <button
        onClick={onClick}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          fontSize: "var(--portal-font-size-sm)",
          color: color,
          cursor: "pointer",
          fontWeight: "var(--portal-font-weight-medium)",
          display: "flex",
          alignItems: "center",
          gap: "var(--portal-space-2)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.textDecoration = "underline";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.textDecoration = "none";
        }}
      >
        {label}
        <span style={{ opacity: 0.7 }}>→</span>
      </button>
      {subtitle && (
        <div
          style={{
            fontSize: "var(--portal-font-size-xs)",
            color: "var(--portal-text-tertiary)",
            marginTop: "4px",
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

  const displayEmail = mock?.email || userEmail || "—";
  const displayOrg = mock?.orgName || orgName || "—";

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
        {/* Page title */}
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

        {/* Identity Hero Card */}
        <IdentityHeroCard
          name={localName}
          email={displayEmail}
          onEditName={handleEditName}
        />

        {showNameUpdateNote && (
          <div
            style={{
              padding: "var(--portal-space-3)",
              background: "var(--portal-warning-soft)",
              border: "1px solid rgba(234, 179, 8, 0.2)",
              borderRadius: "var(--portal-radius-md)",
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-warning)",
            }}
          >
            Name updates are not available yet. Your change has been saved locally only.
          </div>
        )}

        {/* Action Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "var(--portal-space-3)",
          }}
        >
          {/* Security Card */}
          <ActionCard title="Security">
            <div style={{ display: "flex", flexDirection: "column" }}>
              <ActionLink
                label="Change password"
                onClick={handleChangePassword}
                subtitle="We'll email you a reset link"
              />
              <ActionLink
                label="Sign out"
                onClick={handleSignOut}
                variant="danger"
              />
            </div>
          </ActionCard>

          {/* Organization Card */}
          <ActionCard title="Organization">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-2)" }}>
              <div
                style={{
                  fontSize: "var(--portal-font-size-lg)",
                  fontWeight: "var(--portal-font-weight-semibold)",
                  color: "var(--portal-text-primary)",
                }}
              >
                {displayOrg}
              </div>
              <p
                style={{
                  fontSize: "var(--portal-font-size-sm)",
                  color: "var(--portal-text-tertiary)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                This portal is provided by your breeder. Access is linked to your email address.
              </p>
            </div>
          </ActionCard>
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
