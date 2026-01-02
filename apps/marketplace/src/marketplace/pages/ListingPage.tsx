// apps/marketplace/src/marketplace/pages/ListingPage.tsx
import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { getListing, submitInquiry } from "../../api/client";
import { getUserMessage } from "../../api/errors";
import type { ListingDetailDTO, PublicOffspringDTO } from "../../api/types";

/**
 * Format cents to dollars display string
 */
function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Listing detail page with offspring cards and inline inquiry panel.
 */
export function ListingPage() {
  const { programSlug = "", listingSlug = "" } = useParams<{
    programSlug: string;
    listingSlug: string;
  }>();

  const [data, setData] = React.useState<ListingDetailDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // Inline inquiry panel state
  const [inquiryMessage, setInquiryMessage] = React.useState("");
  const [inquirySending, setInquirySending] = React.useState(false);
  const [inquiryError, setInquiryError] = React.useState<string | null>(null);
  const [inquirySuccess, setInquirySuccess] = React.useState(false);

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

  // Handle inquiry submission
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryMessage.trim()) return;

    setInquirySending(true);
    setInquiryError(null);

    try {
      await submitInquiry(programSlug, listingSlug, {
        message: inquiryMessage.trim(),
      });
      setInquirySuccess(true);
      setInquiryMessage("");
    } catch (err) {
      setInquiryError(getUserMessage(err));
    } finally {
      setInquirySending(false);
    }
  };

  // Reset inquiry panel to send another
  const handleSendAnother = () => {
    setInquirySuccess(false);
    setInquiryError(null);
  };

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
        <div className="h-4 bg-white/10 rounded animate-pulse w-32" />
        <div className="space-y-2">
          <div className="h-8 bg-white/10 rounded animate-pulse w-2/3" />
          <div className="h-4 bg-white/10 rounded animate-pulse w-40" />
          <div className="flex gap-3 mt-3">
            <div className="h-5 bg-white/10 rounded animate-pulse w-16" />
            <div className="h-5 bg-white/10 rounded animate-pulse w-20" />
            <div className="h-5 bg-white/10 rounded animate-pulse w-24" />
          </div>
        </div>
      </div>
    );
  }

  // Format price display from priceRange (cents)
  const priceText = data.priceRange
    ? data.priceRange.min === data.priceRange.max
      ? formatCents(data.priceRange.min)
      : `${formatCents(data.priceRange.min)} – ${formatCents(data.priceRange.max)}`
    : null;

  // Use actual birth date if available, otherwise expected
  const birthDateLabel = data.actualBirthOn ? "Born" : "Expected";
  const birthDateValue = data.actualBirthOn || data.expectedBirthOn;

  // Build metadata items for the strip
  const metadataItems: string[] = [
    data.species.charAt(0).toUpperCase() + data.species.slice(1).toLowerCase(),
  ];
  if (data.breed) metadataItems.push(data.breed);
  if (birthDateValue) metadataItems.push(`${birthDateLabel} ${birthDateValue}`);
  metadataItems.push(
    data.countAvailable > 0 ? `${data.countAvailable} available` : "Contact breeder"
  );

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to={`/programs/${programSlug}`}
        className="inline-flex items-center text-sm text-white/60 hover:text-white transition-colors"
      >
        <span className="mr-1">&larr;</span> Back to {data.programName}
      </Link>

      {/* Listing hero */}
      <div>
        {/* Title row with price */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {data.title || "Untitled Listing"}
          </h1>
          {priceText && (
            <span className="text-xl sm:text-2xl font-semibold text-orange-400 whitespace-nowrap">
              {priceText}
            </span>
          )}
        </div>

        {/* Byline */}
        <p className="text-white/60 mt-1">
          by{" "}
          <Link
            to={`/programs/${programSlug}`}
            className="text-orange-400 hover:text-orange-300 transition-colors"
          >
            {data.programName}
          </Link>
        </p>

        {/* Compact metadata strip */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3 text-sm text-white/60">
          {metadataItems.map((item, i) => (
            <React.Fragment key={item}>
              {i > 0 && <span className="text-white/30">|</span>}
              <span>{item}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Description card - only if there's content */}
      {data.description && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <p className="text-white/80 leading-relaxed max-w-prose">
            {data.description}
          </p>
        </div>
      )}

      {/* Offspring section */}
      {data.offspring && data.offspring.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            Offspring ({data.offspring.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.offspring.map((offspring) => (
              <OffspringCard key={offspring.id} offspring={offspring} />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-sm text-white/50">No offspring listed yet.</p>
        </div>
      )}

      {/* Inquiry panel */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
        {inquirySuccess ? (
          // Compact success state
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-white">Inquiry sent</p>
                <p className="text-sm text-white/60">
                  The breeder will respond via email.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSendAnother}
              className="text-sm text-orange-400 hover:text-orange-300 transition-colors whitespace-nowrap"
            >
              Send another
            </button>
          </div>
        ) : (
          // Form state
          <>
            <div className="mb-3">
              <h3 className="text-base font-semibold text-white">Interested?</h3>
              <p className="text-sm text-white/50 mt-0.5">
                Your message is sent to the breeder, your email stays private.
              </p>
            </div>

            <form onSubmit={handleInquirySubmit} className="space-y-3">
              {inquiryError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-red-500/10 border-l-2 border-red-500 text-red-300 text-sm"
                >
                  {inquiryError}
                </div>
              )}

              <label className="block">
                <span className="sr-only">Your message</span>
                <textarea
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 disabled:opacity-50 resize-none text-sm"
                  placeholder="Introduce yourself and ask any questions about this listing..."
                  disabled={inquirySending}
                  required
                />
              </label>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={inquirySending || !inquiryMessage.trim()}
                  className="w-full sm:w-auto px-5 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
                >
                  {inquirySending ? "Sending..." : "Send inquiry"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Offspring card component.
 */
function OffspringCard({ offspring }: { offspring: PublicOffspringDTO }) {
  const priceText = offspring.priceCents != null ? formatCents(offspring.priceCents) : null;

  // Status styling
  const statusStyles: Record<string, string> = {
    available: "bg-green-500/20 text-green-400",
    reserved: "bg-yellow-500/20 text-yellow-400",
    placed: "bg-white/10 text-white/50",
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      {/* Header row: Name + Status badge */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-base font-semibold text-white line-clamp-1">
          {offspring.name || "Unnamed"}
        </h4>
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium capitalize flex-shrink-0 ${statusStyles[offspring.status] || statusStyles.available}`}
        >
          {offspring.status}
        </span>
      </div>

      {/* Info row: Sex and collar */}
      <div className="flex items-center gap-3 mt-2 text-sm">
        {offspring.sex && (
          <span className="text-white/60">{offspring.sex}</span>
        )}
        {offspring.collarColorName && (
          <span className="flex items-center gap-1.5 text-white/60">
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/20"
              style={{
                backgroundColor: offspring.collarColorHex || "#888888",
              }}
            />
            {offspring.collarColorName}
          </span>
        )}
      </div>

      {/* Price row */}
      {priceText && (
        <div className="mt-3 pt-2 border-t border-white/10 flex justify-end">
          <span className="text-orange-400 font-medium">{priceText}</span>
        </div>
      )}
    </div>
  );
}
