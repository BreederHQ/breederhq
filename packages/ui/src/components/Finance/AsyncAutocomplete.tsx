// packages/ui/src/components/Finance/AsyncAutocomplete.tsx
// Base async autocomplete component with debounced search

import * as React from "react";
import { Input } from "../Input";
import clsx from "clsx";

export interface AutocompleteOption {
  id: number;
  label: string;
}

export interface AsyncAutocompleteProps {
  value: AutocompleteOption | null;
  onChange: (value: AutocompleteOption | null) => void;
  onSearch: (query: string) => Promise<AutocompleteOption[]>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
}

export function AsyncAutocomplete({
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  disabled = false,
  className = "",
  label,
  error,
}: AsyncAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [options, setOptions] = React.useState<AutocompleteOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Debounced search
  React.useEffect(() => {
    if (!open || query.length < 2) {
      setOptions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await onSearch(query);
        setOptions(results);
        setSelectedIndex(0);
      } catch (err) {
        console.error("Autocomplete search failed:", err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, open, onSearch]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (options[selectedIndex]) {
        onChange(options[selectedIndex]);
        setOpen(false);
        setQuery("");
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleSelect = (option: AutocompleteOption) => {
    onChange(option);
    setOpen(false);
    setQuery("");
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className={clsx("relative", className)}>
      {label && (
        <label className="block text-xs text-secondary mb-1">{label}</label>
      )}
      <div className="relative">
        {value ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-10 px-3 bg-card border border-hairline rounded-md flex items-center justify-between text-sm">
              <span>{value.label}</span>
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled}
                className="text-secondary hover:text-primary"
                aria-label="Clear selection"
              >
                ×
              </button>
            </div>
          </div>
        ) : (
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
          />
        )}
        {open && !value && (
          <div
            ref={dropdownRef}
            className="absolute z-50 mt-1 w-full bg-card border border-hairline rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {loading && (
              <div className="px-3 py-2 text-sm text-secondary">Loading...</div>
            )}
            {!loading && query.length < 2 && (
              <div className="px-3 py-2 text-sm text-secondary">
                Type at least 2 characters to search
              </div>
            )}
            {!loading && query.length >= 2 && options.length === 0 && (
              <div className="px-3 py-2 text-sm text-secondary">No results found</div>
            )}
            {!loading &&
              options.map((option, idx) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={clsx(
                    "w-full text-left px-3 py-2 text-sm hover:bg-muted/40",
                    idx === selectedIndex && "bg-muted/40"
                  )}
                >
                  {option.label}
                </button>
              ))}
          </div>
        )}
      </div>
      {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
    </div>
  );
}
