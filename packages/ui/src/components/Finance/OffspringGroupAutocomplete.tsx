// packages/ui/src/components/Finance/OffspringGroupAutocomplete.tsx
// Autocomplete for Offspring Groups

import * as React from "react";
import { AsyncAutocomplete, type AutocompleteOption } from "./AsyncAutocomplete";

export interface OffspringGroupAutocompleteProps {
  value: AutocompleteOption | null;
  onChange: (value: AutocompleteOption | null) => void;
  api: any; // The API client
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
}

export function OffspringGroupAutocomplete({
  value,
  onChange,
  api,
  placeholder = "Search offspring groups...",
  disabled = false,
  className = "",
  label = "Offspring Group",
  error,
}: OffspringGroupAutocompleteProps) {
  const handleSearch = React.useCallback(
    async (query: string): Promise<AutocompleteOption[]> => {
      try {
        const response = await api.offspring.groups.list({ q: query, limit: 20 });
        return (response?.items || []).map((group: any) => ({
          id: group.id,
          label: group.name || group.label || `Group ${group.id}`,
        }));
      } catch (err) {
        console.error("Failed to search offspring groups:", err);
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
