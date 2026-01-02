// apps/marketplace/src/marketplace/components/FiltersBar.tsx

interface FiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
}

/**
 * Compact filters bar with search and location inputs.
 */
export function FiltersBar({
  search,
  onSearchChange,
  location,
  onLocationChange,
}: FiltersBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
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
          className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-colors"
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
          className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-colors"
        />
      </div>
    </div>
  );
}
