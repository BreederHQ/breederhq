// packages/ui/src/components/Finance/BreedingPlanAutocomplete.tsx
// Autocomplete for Breeding Plans

import * as React from "react";
import { AsyncAutocomplete, type AutocompleteOption } from "./AsyncAutocomplete";

export interface BreedingPlanAutocompleteProps {
  value: AutocompleteOption | null;
  onChange: (value: AutocompleteOption | null) => void;
  api: any; // The API client
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
}

export function BreedingPlanAutocomplete({
  value,
  onChange,
  api,
  placeholder = "Search breeding plans...",
  disabled = false,
  className = "",
  label = "Breeding Plan",
  error,
}: BreedingPlanAutocompleteProps) {
  const handleSearch = React.useCallback(
    async (query: string): Promise<AutocompleteOption[]> => {
      try {
        const response = await api.breeding.plans.list({ q: query, limit: 20 });
        return (response?.items || []).map((plan: any) => ({
          id: plan.id,
          label: plan.name || plan.label || `Plan ${plan.id}`,
        }));
      } catch (err) {
        console.error("Failed to search breeding plans:", err);
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
