// packages/ui/src/components/GeneticMarkerPicker/GeneticMarkerPicker.tsx
import * as React from "react";
import { Search, X, ChevronDown, Dna, Heart, Palette, Sparkles, Eye } from "lucide-react";
import type { GeneticMarker, GeneticMarkerCategory, GeneticSpecies } from "@bhq/api";

export interface GeneticMarkerPickerProps {
  /** Available markers to pick from */
  markers: GeneticMarker[];
  /** Currently selected marker (if any) */
  selectedMarker?: GeneticMarker | null;
  /** Called when a marker is selected */
  onSelect: (marker: GeneticMarker) => void;
  /** Called when selection is cleared */
  onClear?: () => void;
  /** Filter by species */
  species?: GeneticSpecies;
  /** Filter by category */
  category?: GeneticMarkerCategory;
  /** Filter to breed-specific markers for these breeds */
  breeds?: string[];
  /** Show only common markers */
  commonOnly?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Disable the picker */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Class name */
  className?: string;
  /** Size variant */
  size?: "sm" | "md";
}

// Category icons and labels
const CATEGORY_CONFIG: Record<GeneticMarkerCategory, { icon: React.ReactNode; label: string; color: string }> = {
  coat_color: { icon: <Palette className="w-3.5 h-3.5" />, label: "Coat Color", color: "text-purple-500" },
  coat_type: { icon: <Sparkles className="w-3.5 h-3.5" />, label: "Coat Type", color: "text-blue-500" },
  health: { icon: <Heart className="w-3.5 h-3.5" />, label: "Health", color: "text-red-500" },
  physical_traits: { icon: <Dna className="w-3.5 h-3.5" />, label: "Physical", color: "text-green-500" },
  eye_color: { icon: <Eye className="w-3.5 h-3.5" />, label: "Eye Color", color: "text-amber-500" },
  other: { icon: <Dna className="w-3.5 h-3.5" />, label: "Other", color: "text-gray-500" },
};

/**
 * Searchable picker for genetic markers
 * Searches by: commonName, code, scientificName, gene, aliases, breedSpecific
 */
export function GeneticMarkerPicker({
  markers,
  selectedMarker,
  onSelect,
  onClear,
  species,
  category,
  breeds,
  commonOnly = false,
  placeholder = "Search genetic markers...",
  disabled = false,
  loading = false,
  className = "",
  size = "md",
}: GeneticMarkerPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Filter markers based on props
  const baseFilteredMarkers = React.useMemo(() => {
    let filtered = markers;

    // Filter by species
    if (species) {
      filtered = filtered.filter((m) => m.species === species);
    }

    // Filter by category
    if (category) {
      filtered = filtered.filter((m) => m.category === category);
    }

    // Filter by common only
    if (commonOnly) {
      filtered = filtered.filter((m) => m.isCommon);
    }

    // Filter by breed-specific (include universal + breed-specific for these breeds)
    if (breeds && breeds.length > 0) {
      const breedsLower = breeds.map((b) => b.toLowerCase());
      filtered = filtered.filter((m) => {
        // Include universal markers (no breedSpecific)
        if (!m.breedSpecific || m.breedSpecific.length === 0) return true;
        // Include breed-specific markers that match
        return m.breedSpecific.some((bs: string) =>
          breedsLower.some((breed: string) => bs.toLowerCase().includes(breed) || breed.includes(bs.toLowerCase()))
        );
      });
    }

    return filtered;
  }, [markers, species, category, commonOnly, breeds]);

  // Search filter
  const filteredMarkers = React.useMemo(() => {
    if (!query.trim()) return baseFilteredMarkers;

    const q = query.toLowerCase().trim();
    return baseFilteredMarkers.filter((marker) => {
      // Search in commonName
      if (marker.commonName.toLowerCase().includes(q)) return true;
      // Search in code
      if (marker.code.toLowerCase().includes(q)) return true;
      // Search in scientificName
      if (marker.scientificName?.toLowerCase().includes(q)) return true;
      // Search in gene
      if (marker.gene?.toLowerCase().includes(q)) return true;
      // Search in aliases
      if (marker.aliases?.some((a: string) => a.toLowerCase().includes(q))) return true;
      // Search in breedSpecific
      if (marker.breedSpecific?.some((b: string) => b.toLowerCase().includes(q))) return true;
      // Search in description
      if (marker.description.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [baseFilteredMarkers, query]);

  // Group by category for display
  const groupedMarkers = React.useMemo(() => {
    const groups: Record<GeneticMarkerCategory, GeneticMarker[]> = {
      coat_color: [],
      coat_type: [],
      health: [],
      physical_traits: [],
      eye_color: [],
      other: [],
    };

    filteredMarkers.forEach((marker) => {
      groups[marker.category].push(marker);
    });

    // Return only non-empty groups
    return Object.entries(groups)
      .filter(([, markers]) => markers.length > 0)
      .map(([cat, markers]) => ({
        category: cat as GeneticMarkerCategory,
        markers,
      }));
  }, [filteredMarkers]);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (marker: GeneticMarker) => {
    onSelect(marker);
    setOpen(false);
    setQuery("");
  };

  const handleClear = () => {
    onClear?.();
    setQuery("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  const sizeClasses = size === "sm" ? "py-1.5 px-2 text-sm" : "py-2 px-3";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input area */}
      <div
        className={`flex items-center gap-2 border border-hairline rounded-md bg-surface ${sizeClasses} ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-text"
        } ${open ? "ring-2 ring-brand/50 border-brand" : "hover:border-secondary"}`}
        onClick={() => {
          if (!disabled) {
            setOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        <Search className={`${size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} text-secondary flex-shrink-0`} />

        {selectedMarker && !open ? (
          // Show selected marker
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className={`font-mono text-xs px-1.5 py-0.5 rounded bg-surface-alt ${CATEGORY_CONFIG[selectedMarker.category].color}`}>
              {selectedMarker.code}
            </span>
            <span className="truncate">{selectedMarker.commonName}</span>
            {selectedMarker.gene && (
              <span className="text-secondary text-xs">({selectedMarker.gene})</span>
            )}
            {!disabled && onClear && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="ml-auto p-0.5 hover:bg-surface-alt rounded"
              >
                <X className="w-3.5 h-3.5 text-secondary" />
              </button>
            )}
          </div>
        ) : (
          // Show search input
          <input
            ref={inputRef}
            type="text"
            name="marker_search"
            autoComplete="off"
            data-1p-ignore="true"
            data-lpignore="true"
            data-form-type="other"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedMarker ? selectedMarker.commonName : placeholder}
            disabled={disabled}
            className={`flex-1 bg-transparent outline-none placeholder-secondary min-w-0 ${
              size === "sm" ? "text-sm" : ""
            }`}
          />
        )}

        {loading && (
          <svg className="w-4 h-4 animate-spin text-secondary flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}

        <ChevronDown className={`${size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} text-secondary flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>

      {/* Dropdown */}
      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-hairline rounded-md shadow-lg z-50 max-h-[400px] overflow-y-auto">
          {groupedMarkers.length > 0 ? (
            groupedMarkers.map((group) => (
              <div key={group.category}>
                {/* Category header */}
                <div className="px-3 py-1.5 bg-surface border-b border-hairline sticky top-0 z-10">
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${CATEGORY_CONFIG[group.category].color}`}>
                    {CATEGORY_CONFIG[group.category].icon}
                    <span>{CATEGORY_CONFIG[group.category].label}</span>
                    <span className="text-secondary">({group.markers.length})</span>
                  </div>
                </div>

                {/* Markers in category */}
                <div className="py-1">
                  {group.markers.map((marker) => (
                    <button
                      key={marker.id}
                      type="button"
                      onClick={() => handleSelect(marker)}
                      className="w-full px-3 py-2 flex items-start gap-2 hover:bg-surface-hover transition-colors text-left"
                    >
                      <span className={`font-mono text-xs px-1.5 py-0.5 rounded bg-surface-alt flex-shrink-0 mt-0.5 ${CATEGORY_CONFIG[marker.category].color}`}>
                        {marker.code}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{marker.commonName}</span>
                          {marker.gene && (
                            <span className="text-xs text-secondary">({marker.gene})</span>
                          )}
                        </div>
                        <p className="text-xs text-secondary line-clamp-2 mt-0.5">{marker.description}</p>
                        {marker.breedSpecific && marker.breedSpecific.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {marker.breedSpecific.slice(0, 3).map((breed: string) => (
                              <span key={breed} className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                                {breed}
                              </span>
                            ))}
                            {marker.breedSpecific.length > 3 && (
                              <span className="text-xs text-secondary">+{marker.breedSpecific.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="px-3 py-6 text-center text-secondary">
              {query.trim() ? (
                <>
                  <p className="font-medium">No markers found for "{query}"</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </>
              ) : (
                <p>No markers available</p>
              )}
            </div>
          )}

          {/* Footer with count */}
          {filteredMarkers.length > 0 && (
            <div className="px-3 py-2 bg-surface-alt border-t border-hairline text-xs text-secondary">
              {filteredMarkers.length} marker{filteredMarkers.length !== 1 ? "s" : ""} available
              {query && ` matching "${query}"`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
