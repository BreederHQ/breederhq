// packages/ui/src/components/Finance/AnimalAutocomplete.tsx
// Autocomplete for Animals

import * as React from "react";
import { AsyncAutocomplete, type AutocompleteOption } from "./AsyncAutocomplete";

export interface AnimalAutocompleteProps {
  value: AutocompleteOption | null;
  onChange: (value: AutocompleteOption | null) => void;
  api: any; // The API client
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
}

export function AnimalAutocomplete({
  value,
  onChange,
  api,
  placeholder = "Search animals...",
  disabled = false,
  className = "",
  label = "Animal",
  error,
}: AnimalAutocompleteProps) {
  const handleSearch = React.useCallback(
    async (query: string): Promise<AutocompleteOption[]> => {
      try {
        const response = await api.animals.list({ q: query, limit: 20 });
        return (response?.items || []).map((animal: any) => ({
          id: animal.id,
          label: animal.name || `Animal ${animal.id}`,
        }));
      } catch (err) {
        console.error("Failed to search animals:", err);
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
