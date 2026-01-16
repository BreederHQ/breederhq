// apps/marketplace/src/marketplace/pages/ServiceDetailPage.tsx
// Service detail page with photo gallery, full description, and inquiry form

import * as React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getPublicServiceById,
  reportServiceListing,
  type PublicServiceListing,
  ApiError,
} from "../../api/client";
import { formatCents } from "../../utils/format";
import { Breadcrumb } from "../components/Breadcrumb";
import { DefaultCoverImage } from "../../shared/DefaultCoverImage";
import { ReportListingModal } from "../../shared/ReportListingModal";
import { updateSEO } from "../../utils/seo";
import { useMarketplaceTheme } from "../../context/MarketplaceThemeContext";
import {
  MapPin,
  DollarSign,
  Tag,
  Share2,
  Flag,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Globe,
  MessageCircle,
} from "lucide-react";

const SERVICE_TYPE_LABELS: Record<string, string> = {
  STUD_SERVICE: "Stud Service",
  TRAINING: "Training",
  VETERINARY: "Veterinary",
  PHOTOGRAPHY: "Photography",
  GROOMING: "Grooming",
  TRANSPORT: "Transport",
  BOARDING: "Boarding",
  PRODUCT: "Product",
  OTHER_SERVICE: "Other Service",
};

export function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isLightMode } = useMarketplaceTheme();

  const [service, setService] = React.useState<PublicServiceListing | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [authRequired, setAuthRequired] = React.useState(false);

  // Gallery state
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [showGalleryModal, setShowGalleryModal] = React.useState(false);

  // Report modal
  const [showReportModal, setShowReportModal] = React.useState(false);

  // Inquiry form state
  const [showInquiryForm, setShowInquiryForm] = React.useState(false);
  const [inquiryMessage, setInquiryMessage] = React.useState("");
  const [inquirySubmitting, setInquirySubmitting] = React.useState(false);
  const [inquirySuccess, setInquirySuccess] = React.useState(false);

  // Load service data
  React.useEffect(() => {
    if (!slug) return;

    let dead = false;

    const fetchService = async () => {
      try {
        setLoading(true);
        setError(null);
        setAuthRequired(false);

        const data = await getPublicServiceById(slug);
        if (!dead) {
          setService(data);

          // Update SEO
          updateSEO({
            title: `${data.title} – ${data.provider?.name || "Service Provider"} – BreederHQ Marketplace`,
            description: data.description || `${data.title} provided by ${data.provider?.name || "a verified provider"}. Professional animal services on BreederHQ Marketplace.`,
            canonical: `https://marketplace.breederhq.com/services/${slug}`,
            keywords: `${data.title}, ${data.customServiceType || SERVICE_TYPE_LABELS[data.listingType]}, ${data.tags?.map(t => t.name).join(", ")}, animal services`,
            noindex: false,
          });
        }
      } catch (err) {
        if (!dead) {
          if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
            setAuthRequired(true);
          } else {
            setError(err instanceof Error ? err.message : "Failed to load service");
          }
        }
      } finally {
        if (!dead) {
          setLoading(false);
        }
      }
    };

    fetchService();

    return () => {
      dead = true;
    };
  }, [slug]);

  const handleReportSubmit = async (reason: string, description: string) => {
    if (!service) return;
    await reportServiceListing(service.id, reason, description);
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !inquiryMessage.trim()) return;

    try {
      setInquirySubmitting(true);
      // TODO: Implement inquiry submission API
      // await submitServiceInquiry(service.id, inquiryMessage);

      // Simulate success for now
      await new Promise(resolve => setTimeout(resolve, 1000));

      setInquirySuccess(true);
      setInquiryMessage("");

      setTimeout(() => {
        setInquirySuccess(false);
        setShowInquiryForm(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to submit inquiry:", err);
    } finally {
      setInquirySubmitting(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: service?.title,
          text: service?.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-portal-bg flex items-center justify-center">
        <div className="text-text-secondary">Loading service...</div>
      </div>
    );
  }

  // Error state
  if (error || !service) {
    return (
      <div className="min-h-screen bg-portal-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Service Not Found</h1>
          <p className="text-text-secondary mb-4">{error || "This service could not be found."}</p>
          <Link
            to="/services"
            className="text-[hsl(var(--brand-orange))] hover:underline"
          >
            Browse all services
          </Link>
        </div>
      </div>
    );
  }

  // Auth required state
  if (authRequired) {
    return (
      <div className="min-h-screen bg-portal-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Sign In Required</h1>
          <p className="text-text-secondary mb-4">Please sign in to view service details.</p>
        </div>
      </div>
    );
  }

  // Prepare display data
  const images = service.images && service.images.length > 0 ? service.images : [];
  const hasImages = images.length > 0;
  const location = [service.city, service.state].filter(Boolean).join(", ");
  const categoryLabel = service.customServiceType || SERVICE_TYPE_LABELS[service.listingType] || service.listingType;

  let priceText = "Contact for pricing";
  if (service.priceCents != null) {
    priceText = formatCents(service.priceCents);
    if (service.priceType === "starting_at") {
      priceText = `Starting at ${priceText}`;
    }
  }

  const providerLink =
    service.provider?.type === "breeder" && service.provider.slug
      ? `/breeders/${service.provider.slug}`
      : null;

  return (
    <div className="min-h-screen bg-portal-bg pb-12">
      {/* Breadcrumb */}
      <div className="bg-portal-card border-b border-border-subtle">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumb
            items={[
              { label: "Services", href: "/services" },
              { label: categoryLabel, href: `/services?category=${service.listingType}` },
              { label: service.title },
            ]}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Gallery */}
            <div className="bg-portal-card rounded-xl border border-border-subtle overflow-hidden">
              {hasImages ? (
                <div className="relative">
                  {/* Main Image */}
                  <div
                    className="relative aspect-[16/9] cursor-pointer group"
                    onClick={() => setShowGalleryModal(true)}
                  >
                    <img
                      src={images[selectedImageIndex]}
                      alt={`${service.title} - Image ${selectedImageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                        Click to view full size
                      </span>
                    </div>
                  </div>

                  {/* Thumbnail Strip */}
                  {images.length > 1 && (
                    <div className="p-4 border-t border-border-subtle bg-portal-bg">
                      <div className="flex gap-2 overflow-x-auto">
                        {images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImageIndex(idx)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                              selectedImageIndex === idx
                                ? "border-[hsl(var(--brand-orange))] ring-2 ring-[hsl(var(--brand-orange))]/30"
                                : "border-border-subtle hover:border-border-default"
                            }`}
                          >
                            <img
                              src={img}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white text-sm">
                      {selectedImageIndex + 1} / {images.length}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[16/9]">
                  <DefaultCoverImage lightMode={isLightMode} />
                </div>
              )}
            </div>

            {/* Service Details */}
            <div className="bg-portal-card rounded-xl border border-border-subtle p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-border-default text-text-secondary">
                      {categoryLabel}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {service.title}
                  </h1>
                  {location && (
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{location}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="w-10 h-10 rounded-full bg-portal-bg hover:bg-portal-surface flex items-center justify-center text-text-secondary hover:text-white transition-colors"
                    title="Share"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="w-10 h-10 rounded-full bg-portal-bg hover:bg-portal-surface flex items-center justify-center text-text-secondary hover:text-white transition-colors"
                    title="Report"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tags */}
              {service.tags && service.tags.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Tag className="w-4 h-4 text-text-tertiary" />
                    <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                      Tags
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map((tag) => (
                      <Link
                        key={tag.id}
                        to={`/services?tag=${tag.slug}`}
                        className="inline-block px-3 py-1.5 text-sm font-medium rounded-full bg-border-default text-text-secondary hover:bg-border-hover hover:text-white transition-colors"
                      >
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {service.description && (
                <div>
                  <h2 className="text-lg font-semibold text-white mb-3">About This Service</h2>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Right Column (1/3) */}
          <div className="space-y-6">
            {/* Price & Contact Card */}
            <div className="bg-portal-card rounded-xl border border-border-subtle p-6 sticky top-4">
              {/* Price */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-text-tertiary" />
                  <span className="text-sm font-medium text-text-tertiary uppercase tracking-wide">
                    Pricing
                  </span>
                </div>
                <p className="text-2xl font-bold text-[hsl(var(--brand-orange))]">
                  {priceText}
                </p>
              </div>

              {/* Contact Button */}
              <button
                onClick={() => setShowInquiryForm(true)}
                className="w-full px-4 py-3 bg-[hsl(var(--brand-orange))] text-white rounded-lg hover:bg-[hsl(var(--brand-orange))]/90 transition-colors font-semibold flex items-center justify-center gap-2 mb-4"
              >
                <MessageCircle className="w-5 h-5" />
                Contact Provider
              </button>

              {/* Provider Info */}
              {service.provider && (
                <div className="pt-6 border-t border-border-subtle">
                  <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">
                    Service Provider
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-white mb-1">
                        {service.provider.name}
                      </p>
                      {providerLink && (
                        <Link
                          to={providerLink}
                          className="text-sm text-[hsl(var(--brand-orange))] hover:underline"
                        >
                          View provider profile →
                        </Link>
                      )}
                    </div>

                    {/* Provider Contact Info (if available) */}
                    {service.provider.email && (
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <Mail className="w-4 h-4" />
                        <span>{service.provider.email}</span>
                      </div>
                    )}
                    {service.provider.phone && (
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <Phone className="w-4 h-4" />
                        <span>{service.provider.phone}</span>
                      </div>
                    )}
                    {service.provider.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4 text-text-secondary" />
                        <a
                          href={service.provider.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[hsl(var(--brand-orange))] hover:underline"
                        >
                          Visit website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Safety Notice */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-xs font-medium text-amber-400 mb-2">
                Safety Reminder
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Always verify credentials, meet in safe locations, and never send payment before receiving services. Report suspicious activity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry Form Modal */}
      {showInquiryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-portal-card rounded-xl max-w-lg w-full border border-border-subtle p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Contact {service.provider?.name}
            </h2>

            {inquirySuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Message Sent!
                </h3>
                <p className="text-sm text-text-secondary">
                  The provider will respond to your inquiry soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Your Message
                  </label>
                  <textarea
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 bg-portal-bg border border-border-subtle rounded-lg focus:border-[hsl(var(--brand-orange))] focus:outline-none text-white placeholder-text-tertiary"
                    placeholder={`Hi, I'm interested in your ${service.title.toLowerCase()} service. Could you provide more details about...`}
                    required
                  />
                  <p className="text-xs text-text-tertiary mt-1">
                    {inquiryMessage.length} characters
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={inquirySubmitting || !inquiryMessage.trim()}
                    className="flex-1 px-4 py-2 bg-[hsl(var(--brand-orange))] text-white rounded-lg hover:bg-[hsl(var(--brand-orange))]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {inquirySubmitting ? "Sending..." : "Send Message"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInquiryForm(false)}
                    className="px-4 py-2 text-text-secondary hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {showGalleryModal && hasImages && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowGalleryModal(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={() => setShowGalleryModal(false)}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <img
            src={images[selectedImageIndex]}
            alt={`${service.title} - Full size`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportListingModal
          listingId={service.id}
          listingTitle={service.title}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReportSubmit}
        />
      )}
    </div>
  );
}

export default ServiceDetailPage;
