// apps/portal/src/pages/PortalProfilePageNew.tsx
// Client profile page with self-service editing and name change requests
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { SectionCard } from "../design/SectionCard";
import { TextInput } from "../design/TextInput";
import { Button } from "../design/Button";
import { PortalModal } from "../design/PortalModal";
import { createPortalFetch, useTenantContext } from "../derived/tenantContext";

// API response types
interface ProfileData {
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  email: string;
  phoneMobile: string | null;
  phoneLandline: string | null;
  whatsapp: string | null;
  street: string | null;
  street2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

interface PendingChange {
  id: number;
  fieldName: string;
  newValue: string;
  requestedAt: string;
  status: string;
}

interface PendingEmailChange {
  newEmail: string;
  requestedAt: string;
  status: string;
}

interface ProfileResponse {
  profile: ProfileData;
  pendingChanges: PendingChange[];
  pendingEmailChange: PendingEmailChange | null;
}

// Field display names
const FIELD_LABELS: Record<string, string> = {
  firstName: "First Name",
  lastName: "Last Name",
  nickname: "Nickname",
  email: "Email",
  phoneMobile: "Mobile Phone",
  whatsapp: "WhatsApp",
  street: "Street Address",
  street2: "Address Line 2",
  city: "City",
  state: "State/Province",
  postalCode: "Postal Code",
  country: "Country",
};

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, React.CSSProperties> = {
    PENDING: {
      background: "var(--portal-warning-soft)",
      color: "var(--portal-warning)",
      border: "1px solid var(--portal-warning)",
    },
    PENDING_VERIFICATION: {
      background: "var(--portal-info-soft)",
      color: "var(--portal-info)",
      border: "1px solid var(--portal-info)",
    },
    APPROVED: {
      background: "var(--portal-success-soft)",
      color: "var(--portal-success)",
      border: "1px solid var(--portal-success)",
    },
    REJECTED: {
      background: "var(--portal-error-soft)",
      color: "var(--portal-error)",
      border: "1px solid var(--portal-error)",
    },
  };

  const displayText: Record<string, string> = {
    PENDING: "Pending Approval",
    PENDING_VERIFICATION: "Pending Verification",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: "var(--portal-radius-full)",
        fontSize: "var(--portal-font-size-xs)",
        fontWeight: "var(--portal-font-weight-semibold)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        ...statusStyles[status],
      }}
    >
      {displayText[status] || status}
    </span>
  );
}

// Editable field row component
function EditableField({
  label,
  value,
  fieldName,
  editValue,
  isEditing,
  onChange,
}: {
  label: string;
  value: string | null;
  fieldName: string;
  editValue: string;
  isEditing: boolean;
  onChange: (value: string) => void;
}) {
  if (isEditing) {
    return (
      <TextInput
        label={label}
        value={editValue}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <div
      style={{
        padding: "12px 14px",
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 100%), rgba(255, 255, 255, 0.02)",
        borderRadius: "var(--portal-radius-md)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(10px)",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%), rgba(255, 255, 255, 0.03)";
        e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 100%), rgba(255, 255, 255, 0.02)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
      }}
    >
      <div
        style={{
          fontSize: "10px",
          color: "#8b5cf6",
          marginBottom: "5px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontWeight: "600",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "var(--portal-font-size-sm)",
          color: value ? "var(--portal-text-primary)" : "var(--portal-text-tertiary)",
          fontWeight: value ? "500" : "var(--portal-font-weight-normal)",
        }}
      >
        {value || "Not set"}
      </div>
    </div>
  );
}

// Identity field with request change option
function IdentityField({
  label,
  value,
  fieldName,
  pendingChange,
  onRequestChange,
  onCancelRequest,
}: {
  label: string;
  value: string | null;
  fieldName: string;
  pendingChange?: PendingChange;
  onRequestChange: (fieldName: string) => void;
  onCancelRequest: (requestId: number) => void;
}) {
  return (
    <div
      style={{
        padding: "12px 14px",
        background: pendingChange
          ? "linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(234, 179, 8, 0.02) 100%), rgba(255, 255, 255, 0.02)"
          : "linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 100%), rgba(255, 255, 255, 0.02)",
        borderRadius: "var(--portal-radius-md)",
        border: pendingChange ? "1px solid rgba(234, 179, 8, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "12px",
        transition: "all 0.2s ease",
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "10px",
            color: "#8b5cf6",
            marginBottom: "5px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: "600",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: value ? "var(--portal-text-primary)" : "var(--portal-text-tertiary)",
            fontWeight: value ? "500" : "var(--portal-font-weight-normal)",
            marginBottom: pendingChange ? "10px" : 0,
          }}
        >
          {value || "Not set"}
        </div>
        {pendingChange && (
          <div
            style={{
              marginTop: "var(--portal-space-2)",
              padding: "var(--portal-space-2)",
              background: "var(--portal-warning-soft)",
              borderRadius: "var(--portal-radius-sm)",
              display: "flex",
              alignItems: "center",
              gap: "var(--portal-space-2)",
              flexWrap: "wrap",
            }}
          >
            <StatusBadge status={pendingChange.status} />
            <span style={{ fontSize: "var(--portal-font-size-xs)", color: "var(--portal-text-secondary)" }}>
              Requested: <strong>&quot;{pendingChange.newValue}&quot;</strong>
            </span>
            {pendingChange.status === "PENDING" && (
              <button
                onClick={() => onCancelRequest(pendingChange.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--portal-warning)",
                  fontSize: "var(--portal-font-size-xs)",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontWeight: "var(--portal-font-weight-medium)",
                  padding: "0",
                }}
              >
                Cancel Request
              </button>
            )}
          </div>
        )}
      </div>
      {!pendingChange && (
        <Button
          variant="secondary"
          onClick={() => onRequestChange(fieldName)}
          style={{
            fontSize: "var(--portal-font-size-xs)",
            padding: "8px 16px",
            whiteSpace: "nowrap",
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)",
            borderColor: "rgba(139, 92, 246, 0.3)",
            color: "#a78bfa",
            fontWeight: "600",
          }}
        >
          Request Change
        </Button>
      )}
    </div>
  );
}

export default function PortalProfilePageNew() {
  const { tenantSlug, isReady } = useTenantContext();
  const [profile, setProfile] = React.useState<ProfileData | null>(null);
  const [pendingChanges, setPendingChanges] = React.useState<PendingChange[]>([]);
  const [pendingEmailChange, setPendingEmailChange] = React.useState<PendingEmailChange | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Contact info editing state
  const [isEditingContact, setIsEditingContact] = React.useState(false);
  const [contactForm, setContactForm] = React.useState({
    phoneMobile: "",
    whatsapp: "",
  });
  const [savingContact, setSavingContact] = React.useState(false);

  // Address editing state
  const [isEditingAddress, setIsEditingAddress] = React.useState(false);
  const [addressForm, setAddressForm] = React.useState({
    street: "",
    street2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });
  const [savingAddress, setSavingAddress] = React.useState(false);

  // Name change request modal
  const [changeRequestModal, setChangeRequestModal] = React.useState<{
    open: boolean;
    fieldName: string;
    currentValue: string | null;
  }>({ open: false, fieldName: "", currentValue: null });
  const [newValueInput, setNewValueInput] = React.useState("");
  const [submittingRequest, setSubmittingRequest] = React.useState(false);

  // Load profile data
  const loadProfile = React.useCallback(async () => {
    if (!isReady || !tenantSlug) return;

    const portalFetch = createPortalFetch(tenantSlug);
    try {
      const data = await portalFetch<ProfileResponse>("/portal/profile");
      setProfile(data.profile);
      setPendingChanges(data.pendingChanges);
      setPendingEmailChange(data.pendingEmailChange);
      setError(null);

      // Initialize form values
      setContactForm({
        phoneMobile: data.profile.phoneMobile || "",
        whatsapp: data.profile.whatsapp || "",
      });
      setAddressForm({
        street: data.profile.street || "",
        street2: data.profile.street2 || "",
        city: data.profile.city || "",
        state: data.profile.state || "",
        postalCode: data.profile.postalCode || "",
        country: data.profile.country || "",
      });
    } catch (err: any) {
      console.error("[PortalProfile] Failed to load profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, isReady]);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Save contact info
  const handleSaveContact = async () => {
    if (!tenantSlug) return;

    setSavingContact(true);
    const portalFetch = createPortalFetch(tenantSlug);
    try {
      await portalFetch<{ ok: boolean }>("/portal/profile", {
        method: "PATCH",
        body: JSON.stringify({
          phoneMobile: contactForm.phoneMobile || null,
          whatsapp: contactForm.whatsapp || null,
        }),
      });
      await loadProfile();
      setIsEditingContact(false);
    } catch (err: any) {
      console.error("[PortalProfile] Failed to save contact:", err);
      alert("Failed to save contact information. Please try again.");
    } finally {
      setSavingContact(false);
    }
  };

  // Save address
  const handleSaveAddress = async () => {
    if (!tenantSlug) return;

    setSavingAddress(true);
    const portalFetch = createPortalFetch(tenantSlug);
    try {
      await portalFetch<{ ok: boolean }>("/portal/profile", {
        method: "PATCH",
        body: JSON.stringify({
          street: addressForm.street || null,
          street2: addressForm.street2 || null,
          city: addressForm.city || null,
          state: addressForm.state || null,
          postalCode: addressForm.postalCode || null,
          country: addressForm.country || null,
        }),
      });
      await loadProfile();
      setIsEditingAddress(false);
    } catch (err: any) {
      console.error("[PortalProfile] Failed to save address:", err);
      alert("Failed to save address. Please try again.");
    } finally {
      setSavingAddress(false);
    }
  };

  // Request name change
  const handleRequestChange = (fieldName: string) => {
    const currentValue = profile?.[fieldName as keyof ProfileData] as string | null;
    setChangeRequestModal({ open: true, fieldName, currentValue });
    setNewValueInput(currentValue || "");
  };

  const handleSubmitChangeRequest = async () => {
    if (!tenantSlug || !changeRequestModal.fieldName || !newValueInput.trim()) return;

    setSubmittingRequest(true);
    const portalFetch = createPortalFetch(tenantSlug);
    try {
      await portalFetch<{ ok: boolean }>("/portal/profile/request-name-change", {
        method: "POST",
        body: JSON.stringify({
          fieldName: changeRequestModal.fieldName,
          newValue: newValueInput.trim(),
        }),
      });
      await loadProfile();
      setChangeRequestModal({ open: false, fieldName: "", currentValue: null });
      setNewValueInput("");
    } catch (err: any) {
      console.error("[PortalProfile] Failed to submit change request:", err);
      alert(err.message || "Failed to submit change request. Please try again.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Cancel change request
  const handleCancelRequest = async (requestId: number) => {
    if (!tenantSlug) return;
    if (!confirm("Are you sure you want to cancel this change request?")) return;

    const portalFetch = createPortalFetch(tenantSlug);
    try {
      await portalFetch<{ ok: boolean }>(`/portal/profile/change-requests/${requestId}`, {
        method: "DELETE",
      });
      await loadProfile();
    } catch (err: any) {
      console.error("[PortalProfile] Failed to cancel request:", err);
      alert("Failed to cancel request. Please try again.");
    }
  };

  // Get pending change for a field
  const getPendingChange = (fieldName: string) => {
    return pendingChanges.find((c) => c.fieldName === fieldName);
  };

  if (loading) {
    return (
      <PageContainer>
        <div style={{ marginBottom: "var(--portal-space-6)" }}>
          <h1
            style={{
              fontSize: "var(--portal-font-size-2xl)",
              fontWeight: "var(--portal-font-weight-bold)",
              color: "var(--portal-text-primary)",
              marginBottom: "var(--portal-space-1)",
              letterSpacing: "var(--portal-letter-spacing-tight)",
            }}
          >
            Profile
          </h1>
          <p
            style={{
              fontSize: "var(--portal-font-size-base)",
              color: "var(--portal-text-secondary)",
              margin: 0,
            }}
          >
            Loading your profile...
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)", maxWidth: "800px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: "160px",
                background: "var(--portal-bg-card)",
                borderRadius: "var(--portal-radius-xl)",
                border: "1px solid var(--portal-border-subtle)",
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (error || !profile) {
    return (
      <PageContainer>
        <div style={{ marginBottom: "var(--portal-space-6)" }}>
          <h1
            style={{
              fontSize: "var(--portal-font-size-2xl)",
              fontWeight: "var(--portal-font-weight-bold)",
              color: "var(--portal-text-primary)",
              marginBottom: "var(--portal-space-1)",
              letterSpacing: "var(--portal-letter-spacing-tight)",
            }}
          >
            Profile
          </h1>
        </div>
        <SectionCard>
          <div
            style={{
              padding: "var(--portal-space-4)",
              textAlign: "center",
              background: "var(--portal-error-soft)",
              borderRadius: "var(--portal-radius-md)",
            }}
          >
            <p style={{ color: "var(--portal-error)", margin: 0, fontSize: "var(--portal-font-size-base)", fontWeight: "var(--portal-font-weight-medium)" }}>
              {error || "Failed to load profile data."}
            </p>
          </div>
        </SectionCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Hero Header */}
      <div
        style={{
          marginBottom: "var(--portal-space-3)",
          padding: "var(--portal-space-3)",
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)",
          borderRadius: "var(--portal-radius-lg)",
          border: "1px solid rgba(139, 92, 246, 0.25)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "150px",
            height: "150px",
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1
            style={{
              fontSize: "var(--portal-font-size-xl)",
              fontWeight: "var(--portal-font-weight-bold)",
              color: "var(--portal-text-primary)",
              marginBottom: "4px",
              letterSpacing: "var(--portal-letter-spacing-tight)",
              background: "linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Your Profile
          </h1>
          <p
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-secondary)",
              margin: 0,
            }}
          >
            Manage your personal information and preferences
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-2)", maxWidth: "900px" }}>
        {/* Identity Section (Approval Required) */}
        <SectionCard
          title="Identity"
          subtitle="Changes to your name require approval from your breeder"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <IdentityField
              label="First Name"
              value={profile.firstName}
              fieldName="firstName"
              pendingChange={getPendingChange("firstName")}
              onRequestChange={handleRequestChange}
              onCancelRequest={handleCancelRequest}
            />
            <IdentityField
              label="Last Name"
              value={profile.lastName}
              fieldName="lastName"
              pendingChange={getPendingChange("lastName")}
              onRequestChange={handleRequestChange}
              onCancelRequest={handleCancelRequest}
            />
            <IdentityField
              label="Nickname"
              value={profile.nickname}
              fieldName="nickname"
              pendingChange={getPendingChange("nickname")}
              onRequestChange={handleRequestChange}
              onCancelRequest={handleCancelRequest}
            />
          </div>
        </SectionCard>

        {/* Email Section */}
        <SectionCard
          title="Email"
          subtitle="Contact your breeder to change your email address"
        >
          <div
            style={{
              padding: "12px 14px",
              background: pendingEmailChange
                ? "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.02) 100%), rgba(255, 255, 255, 0.02)"
                : "linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 100%), rgba(255, 255, 255, 0.02)",
              borderRadius: "var(--portal-radius-md)",
              border: pendingEmailChange ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "#8b5cf6",
                marginBottom: "5px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: "600",
              }}
            >
              Email Address
            </div>
            <div
              style={{
                fontSize: "var(--portal-font-size-sm)",
                color: "var(--portal-text-primary)",
                fontWeight: "500",
              }}
            >
              {profile.email}
            </div>
            {pendingEmailChange && (
              <div
                style={{
                  marginTop: "var(--portal-space-2)",
                  padding: "var(--portal-space-2)",
                  background: "var(--portal-info-soft)",
                  borderRadius: "var(--portal-radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--portal-space-2)",
                  flexWrap: "wrap",
                }}
              >
                <StatusBadge status={pendingEmailChange.status} />
                <span style={{ fontSize: "var(--portal-font-size-xs)", color: "var(--portal-text-secondary)" }}>
                  Verification email sent to: <strong>{pendingEmailChange.newEmail}</strong>
                </span>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Contact Information Section (Self-Service) */}
        <SectionCard
          title="Contact Information"
          action={
            isEditingContact ? (
              <div style={{ display: "flex", gap: "var(--portal-space-2)" }}>
                <Button variant="ghost" onClick={() => setIsEditingContact(false)} disabled={savingContact}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveContact} disabled={savingContact}>
                  {savingContact ? "Saving..." : "Save"}
                </Button>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setIsEditingContact(true)}>
                Edit
              </Button>
            )
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <EditableField
              label="Mobile Phone"
              value={profile.phoneMobile}
              fieldName="phoneMobile"
              editValue={contactForm.phoneMobile}
              isEditing={isEditingContact}
              onChange={(v) => setContactForm((f) => ({ ...f, phoneMobile: v }))}
            />
            <EditableField
              label="WhatsApp"
              value={profile.whatsapp}
              fieldName="whatsapp"
              editValue={contactForm.whatsapp}
              isEditing={isEditingContact}
              onChange={(v) => setContactForm((f) => ({ ...f, whatsapp: v }))}
            />
          </div>
        </SectionCard>

        {/* Address Section (Self-Service) */}
        <SectionCard
          title="Address"
          action={
            isEditingAddress ? (
              <div style={{ display: "flex", gap: "var(--portal-space-2)" }}>
                <Button variant="ghost" onClick={() => setIsEditingAddress(false)} disabled={savingAddress}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveAddress} disabled={savingAddress}>
                  {savingAddress ? "Saving..." : "Save"}
                </Button>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setIsEditingAddress(true)}>
                Edit
              </Button>
            )
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <EditableField
              label="Street Address"
              value={profile.street}
              fieldName="street"
              editValue={addressForm.street}
              isEditing={isEditingAddress}
              onChange={(v) => setAddressForm((f) => ({ ...f, street: v }))}
            />
            <EditableField
              label="Address Line 2"
              value={profile.street2}
              fieldName="street2"
              editValue={addressForm.street2}
              isEditing={isEditingAddress}
              onChange={(v) => setAddressForm((f) => ({ ...f, street2: v }))}
            />
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "8px" }}>
              <EditableField
                label="City"
                value={profile.city}
                fieldName="city"
                editValue={addressForm.city}
                isEditing={isEditingAddress}
                onChange={(v) => setAddressForm((f) => ({ ...f, city: v }))}
              />
              <EditableField
                label="State/Province"
                value={profile.state}
                fieldName="state"
                editValue={addressForm.state}
                isEditing={isEditingAddress}
                onChange={(v) => setAddressForm((f) => ({ ...f, state: v }))}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <EditableField
                label="Postal Code"
                value={profile.postalCode}
                fieldName="postalCode"
                editValue={addressForm.postalCode}
                isEditing={isEditingAddress}
                onChange={(v) => setAddressForm((f) => ({ ...f, postalCode: v }))}
              />
              <EditableField
                label="Country"
                value={profile.country}
                fieldName="country"
                editValue={addressForm.country}
                isEditing={isEditingAddress}
                onChange={(v) => setAddressForm((f) => ({ ...f, country: v }))}
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Name Change Request Modal */}
      <PortalModal
        isOpen={changeRequestModal.open}
        onClose={() => setChangeRequestModal({ open: false, fieldName: "", currentValue: null })}
        title={`Request ${FIELD_LABELS[changeRequestModal.fieldName] || "Name"} Change`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
          <p style={{ margin: 0, color: "var(--portal-text-secondary)", fontSize: "var(--portal-font-size-sm)" }}>
            Your request will be sent to your breeder for approval. You&apos;ll be notified when they respond.
          </p>

          <div>
            <div
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-tertiary)",
                marginBottom: "var(--portal-space-1)",
              }}
            >
              Current Value
            </div>
            <div
              style={{
                fontSize: "var(--portal-font-size-sm)",
                color: changeRequestModal.currentValue ? "var(--portal-text-primary)" : "var(--portal-text-tertiary)",
              }}
            >
              {changeRequestModal.currentValue || "Not set"}
            </div>
          </div>

          <TextInput
            label="New Value"
            value={newValueInput}
            onChange={(e) => setNewValueInput(e.target.value)}
            placeholder={`Enter new ${FIELD_LABELS[changeRequestModal.fieldName]?.toLowerCase() || "value"}`}
          />

          <div style={{ display: "flex", gap: "var(--portal-space-2)", justifyContent: "flex-end" }}>
            <Button
              variant="secondary"
              onClick={() => setChangeRequestModal({ open: false, fieldName: "", currentValue: null })}
              disabled={submittingRequest}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitChangeRequest}
              disabled={submittingRequest || !newValueInput.trim() || newValueInput.trim() === changeRequestModal.currentValue}
            >
              {submittingRequest ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </div>
      </PortalModal>
    </PageContainer>
  );
}
