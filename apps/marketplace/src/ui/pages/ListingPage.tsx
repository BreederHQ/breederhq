// apps/marketplace/src/ui/pages/ListingPage.tsx
import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { getListing } from "../api";
import type { ListingDetailDTO, PublicOffspringDTO } from "../types";

/**
 * Listing detail page with offspring cards.
 */
export function ListingPage() {
  const { programSlug = "", listingSlug = "" } = useParams<{
    programSlug: string;
    listingSlug: string;
  }>();

  const [data, setData] = React.useState<ListingDetailDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!programSlug || !listingSlug) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getListing(programSlug, listingSlug);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [programSlug, listingSlug]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Error state
  if (error) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-white/70 mb-4">Unable to load listing.</p>
        <button
          type="button"
          onClick={fetchData}
          className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-sm font-medium text-white hover:bg-white/15 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  // Loading state
  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-4 bg-white/10 rounded animate-pulse w-24" />
        <div className="h-8 bg-white/10 rounded animate-pulse w-1/2" />
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-3">
          <div className="h-4 bg-white/10 rounded animate-pulse w-full" />
          <div className="h-4 bg-white/10 rounded animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  const priceText =
    data.priceMin != null && data.priceMax != null
      ? data.priceMin === data.priceMax
        ? `${data.currency || "$"}${data.priceMin}`
        : `${data.currency || "$"}${data.priceMin} - ${data.currency || "$"}${data.priceMax}`
      : data.priceMin != null
      ? `From ${data.currency || "$"}${data.priceMin}`
      : null;

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        to={`/programs/${programSlug}`}
        className="inline-flex items-center text-sm text-white/60 hover:text-white transition-colors"
      >
        <span className="mr-1">&larr;</span> Back to {data.programName}
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          {data.title}
        </h1>
        <p className="text-white/60 mt-2">
          by{" "}
          <Link
            to={`/programs/${programSlug}`}
            className="text-orange-400 hover:text-orange-300 transition-colors"
          >
            {data.programName}
          </Link>
        </p>
      </div>

      {/* Listing info card */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
        {data.description && (
          <p className="text-white/80 leading-relaxed">{data.description}</p>
        )}

        <div className="flex flex-wrap gap-4 pt-2 border-t border-white/10">
          {data.species && (
            <div>
              <span className="text-xs text-white/50 block">Species</span>
              <span className="text-sm text-white">{data.species}</span>
            </div>
          )}
          {data.expectedDate && (
            <div>
              <span className="text-xs text-white/50 block">Expected</span>
              <span className="text-sm text-white">{data.expectedDate}</span>
            </div>
          )}
          {priceText && (
            <div>
              <span className="text-xs text-white/50 block">Price</span>
              <span className="text-sm font-medium text-orange-400">{priceText}</span>
            </div>
          )}
        </div>
      </div>

      {/* Offspring section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          Offspring ({data.offspring?.length || 0})
        </h2>

        {(!data.offspring || data.offspring.length === 0) && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-white/70">No offspring listed yet.</p>
          </div>
        )}

        {data.offspring && data.offspring.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.offspring.map((offspring) => (
              <OffspringCard key={offspring.id} offspring={offspring} />
            ))}
          </div>
        )}
      </div>

      {/* Inquiry CTA */}
      <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Interested?</h3>
            <p className="text-white/70 text-sm mt-1">
              Contact the breeder to learn more about this listing.
            </p>
          </div>
          <button
            type="button"
            className="px-6 py-3 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
          >
            Send Inquiry
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Offspring card component.
 */
function OffspringCard({ offspring }: { offspring: PublicOffspringDTO }) {
  const priceText =
    offspring.price != null
      ? `${offspring.currency || "$"}${offspring.price}`
      : null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Image or placeholder */}
      <div className="h-32 bg-gradient-to-br from-gray-800 to-gray-900">
        {offspring.photoUrl ? (
          <img
            src={offspring.photoUrl}
            alt={offspring.name || "Offspring"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white/30 text-sm">No photo</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-base font-semibold text-white">
            {offspring.name || "Unnamed"}
          </h4>
          {offspring.collarColor && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: getCollarColorBg(offspring.collarColor),
                color: getCollarColorText(offspring.collarColor),
              }}
            >
              {offspring.collarColor}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm">
          {offspring.sex && (
            <span className="text-white/60">{offspring.sex}</span>
          )}
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              offspring.status === "available"
                ? "bg-green-500/20 text-green-400"
                : offspring.status === "reserved"
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-white/10 text-white/60"
            }`}
          >
            {offspring.status}
          </span>
        </div>

        {priceText && (
          <div className="text-orange-400 font-medium">{priceText}</div>
        )}
      </div>
    </div>
  );
}

/**
 * Get background color for collar color chip.
 */
function getCollarColorBg(color: string): string {
  const colorMap: Record<string, string> = {
    red: "rgba(239, 68, 68, 0.2)",
    blue: "rgba(59, 130, 246, 0.2)",
    green: "rgba(34, 197, 94, 0.2)",
    yellow: "rgba(234, 179, 8, 0.2)",
    purple: "rgba(168, 85, 247, 0.2)",
    pink: "rgba(236, 72, 153, 0.2)",
    orange: "rgba(249, 115, 22, 0.2)",
    black: "rgba(0, 0, 0, 0.4)",
    white: "rgba(255, 255, 255, 0.2)",
  };
  return colorMap[color.toLowerCase()] || "rgba(255, 255, 255, 0.1)";
}

/**
 * Get text color for collar color chip.
 */
function getCollarColorText(color: string): string {
  const colorMap: Record<string, string> = {
    red: "#f87171",
    blue: "#60a5fa",
    green: "#4ade80",
    yellow: "#facc15",
    purple: "#c084fc",
    pink: "#f472b6",
    orange: "#fb923c",
    black: "#a3a3a3",
    white: "#ffffff",
  };
  return colorMap[color.toLowerCase()] || "#ffffff";
}
