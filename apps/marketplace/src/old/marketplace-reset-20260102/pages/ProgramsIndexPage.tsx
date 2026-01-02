// apps/marketplace/src/pages/ProgramsIndexPage.tsx
import * as React from "react";
import { PageHeader, EmptyState } from "@bhq/ui";
import { publicMarketplaceApi } from "../api";
import type { PublicProgramSummary, ApiError } from "../types";
import { ProgramCard } from "../components/ProgramCard";

type ProgramsIndexPageProps = {
  onNavigate: (path: string) => void;
};

type LoadState = "loading" | "success" | "error";
type ViewMode = "grid" | "directory";

const DEBOUNCE_MS = 300;
const DEFAULT_LIMIT = 24;

export function ProgramsIndexPage({ onNavigate }: ProgramsIndexPageProps) {
  const [loadState, setLoadState] = React.useState<LoadState>("loading");
  const [programs, setPrograms] = React.useState<PublicProgramSummary[]>([]);
  const [total, setTotal] = React.useState(0);
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

  // Filters and pagination
  const [search, setSearch] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [offset, setOffset] = React.useState(0);

  // View mode with localStorage
  const [viewMode, setViewMode] = React.useState<ViewMode>(() => {
    if (typeof localStorage === "undefined") return "grid";
    const stored = localStorage.getItem("marketplace:viewMode");
    return stored === "directory" ? "directory" : "grid";
  });

  // Debounced filters
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  const [debouncedLocation, setDebouncedLocation] = React.useState(location);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setDebouncedLocation(location);
      setOffset(0);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search, location]);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadState("loading");
      try {
        const data = await publicMarketplaceApi.programs.list({
          search: debouncedSearch || undefined,
          location: debouncedLocation || undefined,
          limit: DEFAULT_LIMIT,
          offset,
        });
        if (cancelled) return;
        setPrograms(data.items || []);
        setTotal(data.total || 0);
        setLoadState("success");
      } catch (err) {
        if (cancelled) return;
        const apiErr = err as ApiError;
        setErrorMessage(apiErr.message || "Failed to load programs");
        setLoadState("error");
      }
    }
    load();
    return () => { cancelled = true; };
  }, [debouncedSearch, debouncedLocation, offset]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("marketplace:viewMode", mode);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setLocation("");
    setOffset(0);
  };

  const hasActiveFilters = search || location;
  const currentPage = Math.floor(offset / DEFAULT_LIMIT) + 1;
  const totalPages = Math.ceil(total / DEFAULT_LIMIT);
  const hasPrev = offset > 0;
  const hasNext = offset + DEFAULT_LIMIT < total;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-[hsl(var(--brand-orange))]/20 to-[hsl(var(--brand-teal))]/20 border border-[hsl(var(--brand-orange))]/30 flex items-center justify-center text-2xl">
          🔍
        </div>
        <div className="flex-1 min-w-0">
          <PageHeader title="Browse Programs" subtitle="Find breeding programs by species, breed, or location" />
        </div>
      </div>

      <div className="rounded-xl border border-hairline bg-surface p-4 space-y-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Search programs..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-hairline bg-surface-strong/30 text-sm text-primary placeholder-secondary focus:outline-none focus:border-[hsl(var(--brand-orange))]/50" />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-secondary mb-1">Location</label>
            <input type="text" placeholder="e.g. California, USA" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-hairline bg-surface-strong/30 text-sm text-primary placeholder-secondary focus:outline-none focus:border-[hsl(var(--brand-orange))]/50" />
          </div>
          {hasActiveFilters && (
            <div className="flex items-end">
              <button type="button" onClick={clearFilters} className="px-3 py-1.5 text-xs text-secondary hover:text-primary transition-colors">Clear filters</button>
            </div>
          )}
        </div>
      </div>

      {loadState === "success" && programs.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-secondary">
            {total} program{total === 1 ? "" : "s"} found{totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
          </div>
          <div className="flex gap-1 rounded-lg border border-hairline bg-surface p-1">
            <button type="button" onClick={() => handleViewModeChange("grid")} className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === "grid" ? "bg-surface-strong text-primary" : "text-secondary hover:text-primary"}`}>Grid</button>
            <button type="button" onClick={() => handleViewModeChange("directory")} className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === "directory" ? "bg-surface-strong text-primary" : "text-secondary hover:text-primary"}`}>Directory</button>
          </div>
        </div>
      )}

      {loadState === "loading" && <ProgramsLoadingSkeleton viewMode={viewMode} />}

      {loadState === "error" && (
        <div className="rounded-xl border border-hairline bg-surface p-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-primary mb-1">Unable to load programs</h3>
              <p className="text-sm text-secondary max-w-md">{errorMessage || "An unexpected error occurred. Please try again."}</p>
            </div>
          </div>
        </div>
      )}

      {loadState === "success" && programs.length === 0 && (
        <EmptyState title={hasActiveFilters ? "No programs found" : "No programs yet"} hint={hasActiveFilters ? "Try adjusting your search or filters." : "Check back later for breeding programs."} />
      )}

      {loadState === "success" && programs.length > 0 && (
        <div className="space-y-4">
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-3" : "space-y-2"}>
            {programs.map((program) => (
              <ProgramCardWrapper key={program.slug} program={program} onClick={() => onNavigate(`/marketplace/programs/${program.slug}`)} viewMode={viewMode} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 pt-2">
              <button type="button" onClick={() => { if (hasPrev) { setOffset(Math.max(0, offset - DEFAULT_LIMIT)); window.scrollTo({ top: 0, behavior: "smooth" }); } }} disabled={!hasPrev} className="px-4 py-2 text-sm rounded-lg border border-hairline bg-surface text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:border-[hsl(var(--brand-orange))]/40 transition-colors">Previous</button>
              <div className="text-sm text-secondary">Page {currentPage} of {totalPages}</div>
              <button type="button" onClick={() => { if (hasNext) { setOffset(offset + DEFAULT_LIMIT); window.scrollTo({ top: 0, behavior: "smooth" }); } }} disabled={!hasNext} className="px-4 py-2 text-sm rounded-lg border border-hairline bg-surface text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:border-[hsl(var(--brand-orange))]/40 transition-colors">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProgramCardWrapper({ program, onClick, viewMode }: { program: PublicProgramSummary; onClick: () => void; viewMode: ViewMode }) {
  const locationParts = [program.location].filter(Boolean);
  const location = locationParts.join(", ");

  if (viewMode === "directory") {
    return (
      <button type="button" onClick={onClick} className="w-full text-left rounded-lg border border-hairline bg-surface hover:border-[hsl(var(--brand-orange))]/40 transition-colors p-3 flex items-center gap-4">
        <div className="flex-1 min-w-0"><div className="font-semibold text-primary truncate">{program.name}</div></div>
        {location && (
          <div className="text-sm text-secondary flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            <span className="truncate">{location}</span>
          </div>
        )}
        <div className="flex-shrink-0 text-secondary"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg></div>
      </button>
    );
  }

  return <ProgramCard program={program} onClick={onClick} />;
}

function ProgramsLoadingSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "directory") {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-lg border border-hairline bg-surface p-3 flex items-center gap-4">
            <div className="flex-1 h-5 bg-surface-strong/50 rounded" />
            <div className="w-32 h-4 bg-surface-strong/30 rounded" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 w-24 bg-surface-strong/50 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-hairline bg-surface p-4 flex gap-4">
            <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-surface-strong/50" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-32 bg-surface-strong/50 rounded" />
              <div className="h-3 w-20 bg-surface-strong/30 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
