// apps/marketplace/src/marketplace/components/FiltersBar.tsx
// Portal-aligned input styling

interface FiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
}

/**
 * Filters bar with Portal-aligned input styling.
 */
export function FiltersBar({
  search,
  onSearchChange,
  location,
  onLocationChange,
}: FiltersBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <label htmlFor="filter-search" className="sr-only">
          Search programs
        </label>
        <input
          id="filter-search"
          type="text"
          placeholder="Search programs..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-11 px-3.5 rounded-portal-sm bg-portal-elevated border border-border-subtle text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
        />
      </div>
      <div className="sm:w-48">
        <label htmlFor="filter-location" className="sr-only">
          Location
        </label>
        <input
          id="filter-location"
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          className="w-full h-11 px-3.5 rounded-portal-sm bg-portal-elevated border border-border-subtle text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
        />
      </div>
    </div>
  );
}
