// packages/ui/src/components/Finance/PartyAutocomplete.tsx
// Autocomplete for Contacts and Organizations (Parties)

import * as React from "react";
import { AsyncAutocomplete, type AutocompleteOption } from "./AsyncAutocomplete";

export interface PartyAutocompleteProps {
  value: AutocompleteOption | null;
  onChange: (value: AutocompleteOption | null) => void;
  api: any; // The API client
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
}

export function PartyAutocomplete({
  value,
  onChange,
  api,
  placeholder = "Search contacts or organizations...",
  disabled = false,
  className = "",
  label = "Contact / Organization",
  error,
}: PartyAutocompleteProps) {
  const handleSearch = React.useCallback(
    async (query: string): Promise<AutocompleteOption[]> => {
      try {
        const response = await api.contacts.list({ q: query, limit: 20 });
        return (response?.items || []).map((party: any) => ({
          id: party.id,
          label: party.organizationName || party.displayName || party.email || `Party ${party.id}`,
        }));
      } catch (err) {
        console.error("Failed to search parties:", err);
        return [];
      }
    },
    [api]
  );

  return (
    <AsyncAutocomplete
      value={value}
      onChange={onChange}
      onSearch={handleSearch}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      label={label}
      error={error}
    />
  );
}
