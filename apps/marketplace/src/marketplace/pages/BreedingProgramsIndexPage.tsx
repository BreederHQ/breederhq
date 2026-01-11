// apps/marketplace/src/marketplace/pages/BreedingProgramsIndexPage.tsx
// Consumer-facing page to browse all listed breeding programs
import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  getPublicBreedingPrograms,
  type PublicBreedingProgramDTO,
} from "../../api/client";

const LIMIT = 24;

const SPECIES_OPTIONS = [
  { value: "", label: "All Species" },
  { value: "DOG", label: "Dogs" },
  { value: "CAT", label: "Cats" },
  { value: "HORSE", label: "Horses" },
  { value: "GOAT", label: "Goats" },
  { value: "SHEEP", label: "Sheep" },
  { value: "RABBIT", label: "Rabbits" },
];

/**
 * Browse all listed breeding programs from verified breeders.
 */
export function BreedingProgramsIndexPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read from URL
  const urlSearch = searchParams.get("q") || "";
  const urlSpecies = searchParams.get("species") || "";
  const urlPage = Math.max(1, Number(searchParams.get("page")) || 1);

  // Local state
  const [search, setSearch] = React.useState(urlSearch);
  const [species, setSpecies] = React.useState(urlSpecies);
  const [page, setPage] = React.useState(urlPage);

  // Data state
  const [programs, setPrograms] = React.useState<PublicBreedingProgramDTO[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Sync URL
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (species) params.set("species", species);
    if (page > 1) params.set("page", String(page));
    setSearchParams(params, { replace: true });
  }, [search, species, page, setSearchParams]);

  // Fetch programs
  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getPublicBreedingPrograms({
          search: search.trim() || undefined,
          species: species || undefined,
          page,
          limit: LIMIT,
        });
        if (!cancelled) {
          setPrograms(res.items);
          setTotal(res.total);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || "Failed to load programs");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [search, species, page]);

  // Handlers
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleSpeciesChange = (value: string) => {
    setSpecies(value);
    setPage(1);
  };

  const totalPages = total > 0 ? Math.ceil(total / LIMIT) : 0;
  const hasFilters = search.trim() !== "" || species !== "";

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
          Breeding Programs
        </h1>
        <p className="text-sm text-text-tertiary mt-1">
          Explore breed-specific programs from verified breeders.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search programs..."
          className="flex-1 min-w-[200px] px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-portal-xs focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <select
          value={species}
          onChange={(e) => handleSpeciesChange(e.target.value)}
          className="px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-portal-xs focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {SPECIES_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <div className="text-[13px] text-text-tertiary">
        {loading ? (
          <span className="inline-block h-3.5 w-20 bg-border-default rounded animate-pulse" />
        ) : total > 0 ? (
          `${total} program${total === 1 ? "" : "s"}${hasFilters ? " found" : ""}`
        ) : null}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-portal border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProgramCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && programs.length === 0 && (
        <div className="rounded-portal border border-border-subtle bg-portal-card p-8 text-center">
          <p className="text-[15px] font-semibold text-white mb-1">
            {hasFilters ? "No programs match your search" : "No programs available"}
          </p>
          <p className="text-[13px] text-text-tertiary">
            {hasFilters ? "Try adjusting your filters." : "Check back later for new programs."}
          </p>
        </div>
      )}

      {/* Programs grid */}
      {!loading && !error && programs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium border border-border-subtle rounded-portal-xs bg-border-default hover:bg-portal-card disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-text-tertiary">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm font-medium border border-border-subtle rounded-portal-xs bg-border-default hover:bg-portal-card disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function ProgramCardSkeleton() {
  return (
    <div className="rounded-portal border border-border-subtle bg-portal-card p-5 space-y-3">
      <div className="h-5 bg-border-default rounded animate-pulse w-2/3" />
      <div className="h-4 bg-border-default rounded animate-pulse w-1/2" />
      <div className="h-4 bg-border-default rounded animate-pulse w-full" />
      <div className="flex gap-2">
        <div className="h-6 bg-border-default rounded-full animate-pulse w-20" />
        <div className="h-6 bg-border-default rounded-full animate-pulse w-16" />
      </div>
    </div>
  );
}

function ProgramCard({ program }: { program: PublicBreedingProgramDTO }) {
  // Link to the breeder's profile (programs live within breeder context)
  const href = program.breeder?.slug
    ? `/breeders/${program.breeder.slug}`
    : "#";

  return (
    <Link
      to={href}
      className="block rounded-portal border border-border-subtle bg-portal-card p-5 transition-all hover:bg-portal-card-hover hover:border-border-default hover:-translate-y-0.5 group"
    >
      {/* Program name and breed */}
      <h3 className="text-base font-semibold text-white group-hover:text-accent transition-colors truncate">
        {program.name}
      </h3>
      <div className="text-sm text-text-secondary mt-1">
        {program.species} {program.breedText ? `- ${program.breedText}` : ""}
      </div>

      {/* Description */}
      {program.description && (
        <p className="text-[13px] text-text-tertiary mt-2 line-clamp-2 leading-relaxed">
          {program.description}
        </p>
      )}

      {/* Breeder info */}
      {program.breeder && (
        <div className="text-[12px] text-text-muted mt-3 pt-3 border-t border-border-subtle">
          <span className="font-medium">{program.breeder.name}</span>
          {program.breeder.location && (
            <span className="ml-2">{program.breeder.location}</span>
          )}
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {program.acceptInquiries && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
            Inquiries Open
          </span>
        )}
        {program.openWaitlist && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            Waitlist Open
          </span>
        )}
        {program.activePlansCount > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-border-default text-text-tertiary border border-border-subtle">
            {program.activePlansCount} active plan{program.activePlansCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </Link>
  );
}

export default BreedingProgramsIndexPage;
