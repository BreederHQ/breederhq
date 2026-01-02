// apps/marketplace/src/marketplace/pages/ListingPage.tsx
// Portal-aligned page hierarchy, card styling, and inquiry panel
import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { getListing, submitInquiry } from "../../api/client";
import { getUserMessage } from "../../api/errors";
import { Breadcrumb } from "../components/Breadcrumb";
import type { ListingDetailDTO, PublicOffspringDTO } from "../../api/types";

/**
 * Format cents to dollars display string
 */
function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Listing detail page with Portal-aligned styling.
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

  // Error state - Portal styling
  if (error) {
    return (
      <div className="rounded-portal border border-border-subtle bg-portal-card shadow-portal p-8 text-center">
        <p className="text-text-secondary text-sm mb-4">Unable to load listing.</p>
        <button
          type="button"
          onClick={fetchData}
          className="px-4 py-2 rounded-portal-xs bg-border-default border border-border-subtle text-sm font-medium text-white hover:bg-portal-card-hover transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  // Loading state - Portal styling
  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-border-default rounded animate-pulse w-40" />
        <div className="space-y-2">
          <div className="h-8 bg-border-default rounded animate-pulse w-2/3" />
          <div className="h-4 bg-border-default rounded animate-pulse w-32" />
        </div>
        <div className="h-12 bg-border-default rounded-portal-sm animate-pulse w-full" />
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

  const hasOffspring = data.offspring && data.offspring.length > 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "All programs", href: "/" },
          { label: data.programName, href: `/programs/${programSlug}` },
        ]}
      />

      {/* Listing hero */}
      <div>
        {/* Title row with price */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-6">
          <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
            {data.title || "Untitled Listing"}
          </h1>
          {priceText && (
            <span className="text-2xl font-semibold text-accent whitespace-nowrap">
              {priceText}
            </span>
          )}
        </div>

        {/* Byline */}
        <p className="text-sm text-text-tertiary mt-2">
          by{" "}
          <Link
            to={`/programs/${programSlug}`}
            className="text-accent font-medium hover:text-accent-hover transition-colors"
          >
            {data.programName}
          </Link>
        </p>

        {/* Metadata strip - Portal card styling */}
        <div className="mt-4 py-3 px-4 rounded-portal-sm bg-portal-card border border-border-subtle">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary">
            {metadataItems.map((item, i) => (
              <React.Fragment key={item}>
                {i > 0 && <span className="text-text-muted">•</span>}
                <span>{item}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Description card - Portal styling */}
      {data.description && (
        <div className="rounded-portal border border-border-subtle bg-portal-card shadow-portal p-5">
          <p className="text-[15px] text-text-secondary leading-relaxed max-w-prose">
            {data.description}
          </p>
        </div>
      )}

      {/* Offspring section */}
      {hasOffspring ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">Offspring</h2>
            <span className="px-2.5 py-1 rounded-portal-xs text-[13px] font-medium bg-border-default text-text-secondary">
              {data.offspring.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.offspring.map((offspring) => (
              <OffspringCard key={offspring.id} offspring={offspring} />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-portal border border-border-subtle bg-portal-card p-6 text-center">
          <p className="text-[13px] text-text-tertiary">No offspring listed yet.</p>
        </div>
      )}

      {/* Inquiry panel - Portal action panel styling */}
      <div className="max-w-xl">
        <div className="rounded-portal border border-border-subtle bg-portal-card shadow-portal p-5">
          {inquirySuccess ? (
            // Compact success state
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3.5 h-3.5 text-green-400"
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
                  <p className="text-[15px] font-semibold text-white">Inquiry sent</p>
                  <p className="text-[13px] text-text-tertiary mt-0.5">The breeder will respond via email.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSendAnother}
                className="text-[13px] text-accent font-medium hover:text-accent-hover transition-colors whitespace-nowrap"
              >
                Send another
              </button>
            </div>
          ) : (
            // Form state
            <>
              <div className="mb-3">
                <h3 className="text-base font-semibold text-white">Interested?</h3>
                <p className="text-[13px] text-text-tertiary mt-1">
                  Your message is sent to the breeder, your email stays private.
                </p>
              </div>

              <form onSubmit={handleInquirySubmit} className="space-y-3">
                {inquiryError && (
                  <div
                    role="alert"
                    className="p-3 rounded-portal-xs bg-red-500/10 border-l-3 border-red-500 text-red-300 text-[13px]"
                  >
                    {inquiryError}
                  </div>
                )}

                <label className="block">
                  <span className="sr-only">Your message</span>
                  <textarea
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3.5 py-3 rounded-portal-sm bg-portal-elevated border border-border-subtle text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 disabled:opacity-50 resize-none transition-colors"
                    placeholder="Introduce yourself and ask any questions..."
                    disabled={inquirySending}
                    required
                  />
                </label>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={inquirySending || !inquiryMessage.trim()}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-portal-xs bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                  >
                    {inquirySending ? "Sending..." : "Send inquiry"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Offspring card with Portal card styling.
 */
function OffspringCard({ offspring }: { offspring: PublicOffspringDTO }) {
  const priceText = offspring.priceCents != null ? formatCents(offspring.priceCents) : null;

  // Status styling - Portal status colors
  const statusStyles: Record<string, string> = {
    available: "bg-green-500/15 text-green-400",
    reserved: "bg-accent-muted text-accent",
    placed: "bg-border-default text-text-tertiary",
  };

  return (
    <div className="rounded-portal-sm border border-border-subtle bg-portal-card shadow-portal p-4">
      {/* Header row: Name + Status badge */}
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-[15px] font-semibold text-white line-clamp-1">
          {offspring.name || "Unnamed"}
        </h4>
        <span
          className={`px-2.5 py-1 rounded-portal-xs text-[12px] font-semibold capitalize flex-shrink-0 ${statusStyles[offspring.status] || statusStyles.available}`}
        >
          {offspring.status}
        </span>
      </div>

      {/* Info row: Sex and collar */}
      <div className="flex items-center gap-3 mt-2 text-[13px]">
        {offspring.sex && (
          <span className="text-text-secondary">{offspring.sex}</span>
        )}
        {offspring.collarColorName && (
          <span className="flex items-center gap-1.5 text-text-secondary">
            <span
              className="w-2.5 h-2.5 rounded-full border border-border-subtle"
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
        <div className="mt-3 pt-3 border-t border-border-subtle flex justify-end">
          <span className="text-[15px] text-accent font-semibold">{priceText}</span>
        </div>
      )}
    </div>
  );
}
