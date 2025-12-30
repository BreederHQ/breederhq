// packages/ui/src/components/Finance/PartyAutocomplete.tsx
// Autocomplete for Contacts and Organizations (Parties) with Quick Add functionality

import * as React from "react";
import { AsyncAutocomplete, type AutocompleteOption } from "./AsyncAutocomplete";
import { Button } from "../Button";
import { Input } from "../Input";

export interface PartyAutocompleteProps {
  value: AutocompleteOption | null;
  onChange: (value: AutocompleteOption | null) => void;
  api: any; // The API client
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  /** Show quick add buttons (default: true) */
  showQuickAdd?: boolean;
}

export { type AutocompleteOption };

export function PartyAutocomplete({
  value,
  onChange,
  api,
  placeholder = "Search contacts or organizations...",
  disabled = false,
  className = "",
  label = "Contact / Organization",
  error,
  showQuickAdd = true,
}: PartyAutocompleteProps) {
  // Quick add state
  const [quickAddMode, setQuickAddMode] = React.useState<null | "contact" | "organization">(null);
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  // Contact form state
  const [contactForm, setContactForm] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // Organization form state
  const [orgForm, setOrgForm] = React.useState({
    name: "",
    website: "",
  });

  const handleSearch = React.useCallback(
    async (query: string): Promise<AutocompleteOption[]> => {
      try {
        const response = await api.finance.parties.search(query, { limit: 20 });
        return (response || []).map((party: any) => {
          // Backend returns partyId, party_id, or id - normalize to id
          const partyId = party.partyId ?? party.party_id ?? party.id;
          return {
            id: partyId,
            label: party.displayName || party.organizationName || party.email || `Party ${partyId}`,
          };
        });
      } catch (err) {
        console.error("Failed to search parties:", err);
        return [];
      }
    },
    [api]
  );

  const resetForms = () => {
    setContactForm({ firstName: "", lastName: "", email: "", phone: "" });
    setOrgForm({ name: "", website: "" });
    setCreateError(null);
  };

  const handleQuickAddContact = async () => {
    if (!contactForm.firstName && !contactForm.lastName && !contactForm.email) {
      setCreateError("Please provide at least a name or email");
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const displayName = `${contactForm.firstName.trim()} ${contactForm.lastName.trim()}`.trim();
      const result = await api.finance.contacts.create({
        first_name: contactForm.firstName.trim() || undefined,
        last_name: contactForm.lastName.trim() || undefined,
        display_name: displayName || undefined,
        email: contactForm.email.trim() || undefined,
        phone_e164: contactForm.phone.trim() || undefined,
      });

      // Select the newly created contact
      const partyId = result.partyId ?? result.party_id ?? result.id;
      onChange({
        id: partyId,
        label: result.display_name || displayName || result.email || `Contact ${partyId}`,
      });

      // Reset and close
      resetForms();
      setQuickAddMode(null);
    } catch (err: any) {
      console.error("Failed to create contact:", err);
      // Handle 409 conflict - contact may already exist
      if (err?.status === 409) {
        setCreateError("A contact with this email already exists. Try searching for them instead.");
      } else {
        setCreateError(err?.message || "Failed to create contact");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleQuickAddOrganization = async () => {
    if (!orgForm.name.trim()) {
      setCreateError("Organization name is required");
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const result = await api.finance.organizations.create({
        name: orgForm.name.trim(),
        website: orgForm.website.trim() || null,
      });

      // Select the newly created organization
      const partyId = result.partyId ?? result.party_id ?? result.id;
      onChange({
        id: partyId,
        label: result.name || `Organization ${partyId}`,
      });

      // Reset and close
      resetForms();
      setQuickAddMode(null);
    } catch (err: any) {
      console.error("Failed to create organization:", err);
      // Handle 409 conflict - org may already exist
      if (err?.status === 409) {
        setCreateError("An organization with this name already exists. Try searching for it instead.");
      } else {
        setCreateError(err?.message || "Failed to create organization");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCancelQuickAdd = () => {
    resetForms();
    setQuickAddMode(null);
  };

  return (
    <div className={className}>
      <AsyncAutocomplete
        value={value}
        onChange={onChange}
        onSearch={handleSearch}
        placeholder={placeholder}
        disabled={disabled || quickAddMode !== null}
        label={label}
        error={error}
      />

      {/* Quick Add Buttons - show when no value selected and not in quick add mode */}
      {showQuickAdd && !disabled && !value && quickAddMode === null && (
        <div className="mt-2 flex items-center gap-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setQuickAddMode("contact")}
          >
            + Quick Add Contact
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setQuickAddMode("organization")}
          >
            + Quick Add Organization
          </Button>
        </div>
      )}

      {/* Quick Add Contact Form */}
      {quickAddMode === "contact" && (
        <div className="mt-3 p-3 bg-muted/20 rounded-md border border-hairline space-y-3">
          <div className="text-xs font-medium text-secondary">Quick Add Contact</div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="First Name"
              value={contactForm.firstName}
              onChange={(e) => setContactForm((f) => ({ ...f, firstName: e.target.value }))}
              disabled={creating}
            />
            <Input
              placeholder="Last Name"
              value={contactForm.lastName}
              onChange={(e) => setContactForm((f) => ({ ...f, lastName: e.target.value }))}
              disabled={creating}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Email"
              type="email"
              value={contactForm.email}
              onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
              disabled={creating}
            />
            <Input
              placeholder="Phone"
              type="tel"
              value={contactForm.phone}
              onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
              disabled={creating}
            />
          </div>
          {createError && (
            <div className="text-xs text-red-400">{createError}</div>
          )}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleQuickAddContact}
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Contact"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCancelQuickAdd}
              disabled={creating}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Quick Add Organization Form */}
      {quickAddMode === "organization" && (
        <div className="mt-3 p-3 bg-muted/20 rounded-md border border-hairline space-y-3">
          <div className="text-xs font-medium text-secondary">Quick Add Organization</div>
          <Input
            placeholder="Organization Name *"
            value={orgForm.name}
            onChange={(e) => setOrgForm((f) => ({ ...f, name: e.target.value }))}
            disabled={creating}
          />
          <Input
            placeholder="Website (optional)"
            type="url"
            value={orgForm.website}
            onChange={(e) => setOrgForm((f) => ({ ...f, website: e.target.value }))}
            disabled={creating}
          />
          {createError && (
            <div className="text-xs text-red-400">{createError}</div>
          )}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleQuickAddOrganization}
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Organization"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCancelQuickAdd}
              disabled={creating}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
