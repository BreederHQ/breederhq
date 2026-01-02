// apps/marketplace/src/marketplace/components/FiltersBar.tsx
import * as React from "react";

interface FiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
}

/**
 * Filters card with search and location inputs.
 */
export function FiltersBar({
  search,
  onSearchChange,
  location,
  onLocationChange,
}: FiltersBarProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="filter-search" className="sr-only">
            Search programs
          </label>
          <input
            id="filter-search"
            type="text"
            placeholder="Search programs..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-colors"
          />
        </div>
        <div>
          <label htmlFor="filter-location" className="sr-only">
            Location
          </label>
          <input
            id="filter-location"
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
