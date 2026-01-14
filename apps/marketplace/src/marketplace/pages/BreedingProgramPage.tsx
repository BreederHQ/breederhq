// apps/marketplace/src/marketplace/pages/BreedingProgramPage.tsx
// Public breeding program detail page with inquiry form

import * as React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Breadcrumb } from "../components/Breadcrumb";

interface BreedingProgramDTO {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  programStory: string | null;
  species: string;
  breedText: string | null;
  coverImageUrl: string | null;
  showCoverImage: boolean;
  listed: boolean;
  acceptInquiries: boolean;
  openWaitlist: boolean;
  pricingTiers: Array<{
    tier: string;
    priceRange: string;
    description: string;
  }> | null;
  whatsIncluded: string | null;
  showWhatsIncluded: boolean;
  typicalWaitTime: string | null;
  showWaitTime: boolean;
  media: Array<{
    id: number;
    assetUrl: string;
    caption: string | null;
    sortOrder: number;
  }>;
  breeder: {
    name: string;
    location: string;
  } | null;
  stats: {
    activeBreedingPlans: number;
    upcomingLitters: number;
    availableLitters: number;
    totalAvailable: number;
  };
  publishedAt: string | null;
  createdAt: string;
}

type TabId = "overview" | "gallery" | "pricing" | "contact";

export function BreedingProgramPage() {
  const navigate = useNavigate();
  const { slug = "" } = useParams<{ slug: string }>();

  const [program, setProgram] = React.useState<BreedingProgramDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabId>("overview");

  // Fetch program data
  React.useEffect(() => {
    let cancelled = false;

    const fetchProgram = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/v1/public/breeding-programs/${slug}`);

        if (!res.ok) {
          if (res.status === 404) {
            setError("Program not found");
          } else {
            setError("Failed to load program");
          }
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setProgram(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load program");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProgram();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-border-default rounded animate-pulse w-32" />
        <div className="h-96 bg-border-default rounded animate-pulse" />
      </div>
    );
  }

  // Error state
  if (error || !program) {
    return (
      <div className="rounded-portal border border-border-subtle bg-portal-card shadow-portal p-8 text-center">
        <p className="text-text-secondary text-sm mb-4">{error || "Program not found"}</p>
        <button
          type="button"
          onClick={() => navigate("/breeding-programs")}
          className="px-4 py-2 rounded-portal-xs bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          View All Programs
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Breeding Programs", href: "/breeding-programs" },
          { label: program.name },
        ]}
      />

      {/* Hero Section */}
      <ProgramHero program={program} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === "overview" && <ProgramOverview program={program} />}
        {activeTab === "gallery" && <ProgramGallery media={program.media} />}
        {activeTab === "pricing" && (
          <ProgramPricing
            pricingTiers={program.pricingTiers}
            whatsIncluded={program.whatsIncluded}
            typicalWaitTime={program.typicalWaitTime}
          />
        )}
        {activeTab === "contact" && (
          <ContactForm program={program} onSuccess={() => setActiveTab("overview")} />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Hero Section
   ═══════════════════════════════════════════════════════════════════════════ */

interface ProgramHeroProps {
  program: BreedingProgramDTO;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

function ProgramHero({ program, activeTab, onTabChange }: ProgramHeroProps) {
  const showImage = program.showCoverImage && program.coverImageUrl;

  return (
    <div className="relative rounded-portal overflow-hidden">
      {/* Cover Image */}
      {showImage ? (
        <div className="relative h-96">
          <img
            src={program.coverImageUrl!}
            alt={program.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <HeroContent program={program} activeTab={activeTab} onTabChange={onTabChange} />
        </div>
      ) : (
        <div className="relative bg-portal-card border border-border-subtle p-8">
          <HeroContent program={program} activeTab={activeTab} onTabChange={onTabChange} />
        </div>
      )}
    </div>
  );
}

function HeroContent({ program, activeTab, onTabChange }: ProgramHeroProps) {
  const showImage = program.showCoverImage && program.coverImageUrl;

  return (
    <div className={showImage ? "absolute inset-0 flex flex-col justify-end p-8" : ""}>
      {/* Program Info */}
      <div className="space-y-2 mb-6">
        <h1 className={`text-4xl font-bold ${showImage ? "text-white" : "text-white"}`}>
          {program.name}
        </h1>
        {program.breedText && (
          <p className={`text-xl ${showImage ? "text-white/90" : "text-text-secondary"}`}>
            {program.breedText} • {program.species.toLowerCase()}
          </p>
        )}
        {program.breeder && (
          <p className={`text-sm ${showImage ? "text-white/80" : "text-text-tertiary"}`}>
            By {program.breeder.name}
            {program.breeder.location && ` • ${program.breeder.location}`}
          </p>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4">
        <TabButton
          active={activeTab === "overview"}
          onClick={() => onTabChange("overview")}
          showImage={showImage}
        >
          Overview
        </TabButton>
        {program.media.length > 0 && (
          <TabButton
            active={activeTab === "gallery"}
            onClick={() => onTabChange("gallery")}
            showImage={showImage}
          >
            Gallery ({program.media.length})
          </TabButton>
        )}
        {program.pricingTiers && program.pricingTiers.length > 0 && (
          <TabButton
            active={activeTab === "pricing"}
            onClick={() => onTabChange("pricing")}
            showImage={showImage}
          >
            Pricing
          </TabButton>
        )}
        {program.acceptInquiries && (
          <TabButton
            active={activeTab === "contact"}
            onClick={() => onTabChange("contact")}
            showImage={showImage}
          >
            Contact
          </TabButton>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  showImage,
  children,
}: {
  active: boolean;
  onClick: () => void;
  showImage: boolean;
  children: React.ReactNode;
}) {
  const baseClasses = "px-4 py-2 rounded-portal-xs text-sm font-medium transition-colors";
  const activeClasses = showImage
    ? "bg-white text-gray-900"
    : "bg-accent text-white";
  const inactiveClasses = showImage
    ? "bg-white/20 text-white hover:bg-white/30"
    : "bg-border-default text-text-secondary hover:bg-portal-card-hover";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}
    >
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Overview Tab
   ═══════════════════════════════════════════════════════════════════════════ */

function ProgramOverview({ program }: { program: BreedingProgramDTO }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Description */}
        {program.description && (
          <div className="rounded-portal border border-border-subtle bg-portal-card p-6">
            <h2 className="text-xl font-semibold text-white mb-3">About This Program</h2>
            <p className="text-text-secondary leading-relaxed">{program.description}</p>
          </div>
        )}

        {/* Program Story */}
        {program.programStory && (
          <div className="rounded-portal border border-border-subtle bg-portal-card p-6">
            <h2 className="text-xl font-semibold text-white mb-3">Our Story</h2>
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: program.programStory }}
            />
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-4">
        {/* Stats Card */}
        <div className="rounded-portal border border-border-subtle bg-portal-card p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Program Stats</h3>
          <div className="space-y-3">
            <StatRow label="Active Plans" value={program.stats.activeBreedingPlans} />
            <StatRow label="Upcoming Litters" value={program.stats.upcomingLitters} />
            <StatRow
              label="Available Now"
              value={program.stats.totalAvailable}
              highlight={program.stats.totalAvailable > 0}
            />
          </div>
        </div>

        {/* Quick Info */}
        {(program.typicalWaitTime || program.whatsIncluded) && (
          <div className="rounded-portal border border-border-subtle bg-portal-card p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Info</h3>
            <div className="space-y-3">
              {program.typicalWaitTime && (
                <div>
                  <div className="text-xs text-text-muted mb-1">Typical Wait Time</div>
                  <div className="text-sm text-text-secondary">{program.typicalWaitTime}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-text-tertiary">{label}</span>
      <span
        className={`text-sm font-semibold ${
          highlight ? "text-green-400" : "text-text-secondary"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Gallery Tab
   ═══════════════════════════════════════════════════════════════════════════ */

function ProgramGallery({
  media,
}: {
  media: Array<{ id: number; assetUrl: string; caption: string | null }>;
}) {
  const [lightboxIndex, setLightboxIndex] = React.useState(-1);

  if (media.length === 0) {
    return (
      <div className="rounded-portal border border-border-subtle bg-portal-card p-8 text-center">
        <p className="text-text-secondary">No media available</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Gallery</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {media.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setLightboxIndex(index)}
            className="relative group overflow-hidden rounded-portal aspect-video cursor-pointer"
          >
            <img
              src={item.assetUrl}
              alt={item.caption || ""}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {item.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-sm">{item.caption}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Simple lightbox */}
      {lightboxIndex >= 0 && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(-1)}
        >
          <img
            src={media[lightboxIndex].assetUrl}
            alt={media[lightboxIndex].caption || ""}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Pricing Tab
   ═══════════════════════════════════════════════════════════════════════════ */

function ProgramPricing({
  pricingTiers,
  whatsIncluded,
  typicalWaitTime,
}: {
  pricingTiers: Array<{ tier: string; priceRange: string; description: string }> | null;
  whatsIncluded: string | null;
  typicalWaitTime: string | null;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Pricing</h2>

      {pricingTiers && pricingTiers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pricingTiers.map((tier, index) => (
            <div
              key={index}
              className="rounded-portal border-2 border-border-subtle bg-portal-card p-6 hover:border-accent transition-colors"
            >
              <h3 className="text-lg font-bold text-white mb-2">{tier.tier}</h3>
              <p className="text-3xl font-bold text-accent mb-4">{tier.priceRange}</p>
              <p className="text-sm text-text-tertiary">{tier.description}</p>
            </div>
          ))}
        </div>
      )}

      {whatsIncluded && (
        <div className="rounded-portal border border-border-subtle bg-portal-card p-6">
          <h3 className="text-lg font-semibold text-white mb-3">What's Included</h3>
          <p className="text-text-secondary leading-relaxed">{whatsIncluded}</p>
        </div>
      )}

      {typicalWaitTime && (
        <div className="rounded-portal border border-border-subtle bg-portal-card p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Typical Wait Time</h3>
          <p className="text-text-secondary">{typicalWaitTime}</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Contact Form
   ═══════════════════════════════════════════════════════════════════════════ */

interface ContactFormProps {
  program: BreedingProgramDTO;
  onSuccess: () => void;
}

function ContactForm({ program, onSuccess }: ContactFormProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    subject: `Inquiry about ${program.name}`,
    message: "",
    interestedIn: "",
    priceRange: "",
    timeline: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/v1/public/breeding-programs/${program.slug}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to submit inquiry");
        return;
      }

      setSuccess(true);
      setForm({
        buyerName: "",
        buyerEmail: "",
        buyerPhone: "",
        subject: `Inquiry about ${program.name}`,
        message: "",
        interestedIn: "",
        priceRange: "",
        timeline: "",
      });

      setTimeout(() => onSuccess(), 3000);
    } catch (err) {
      setError("Failed to submit inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-portal border border-green-500/20 bg-green-500/10 p-8 text-center">
        <div className="text-4xl mb-4">✓</div>
        <h3 className="text-xl font-semibold text-green-400 mb-2">
          Inquiry Submitted Successfully!
        </h3>
        <p className="text-text-secondary">
          We'll respond to your inquiry within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">Contact Breeder</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Your Name *
          </label>
          <input
            type="text"
            required
            value={form.buyerName}
            onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
            className="w-full px-4 py-2 rounded-portal-xs bg-border-default border border-border-subtle text-white placeholder-text-muted focus:border-accent focus:outline-none"
            placeholder="John Doe"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={form.buyerEmail}
            onChange={(e) => setForm({ ...form, buyerEmail: e.target.value })}
            className="w-full px-4 py-2 rounded-portal-xs bg-border-default border border-border-subtle text-white placeholder-text-muted focus:border-accent focus:outline-none"
            placeholder="john@example.com"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Phone Number (optional)
          </label>
          <input
            type="tel"
            value={form.buyerPhone}
            onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })}
            className="w-full px-4 py-2 rounded-portal-xs bg-border-default border border-border-subtle text-white placeholder-text-muted focus:border-accent focus:outline-none"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Subject *
          </label>
          <input
            type="text"
            required
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full px-4 py-2 rounded-portal-xs bg-border-default border border-border-subtle text-white placeholder-text-muted focus:border-accent focus:outline-none"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Message *
          </label>
          <textarea
            required
            rows={5}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full px-4 py-2 rounded-portal-xs bg-border-default border border-border-subtle text-white placeholder-text-muted focus:border-accent focus:outline-none resize-none"
            placeholder="Tell us about what you're looking for..."
          />
        </div>

        {/* Optional fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Interested In
            </label>
            <select
              value={form.interestedIn}
              onChange={(e) => setForm({ ...form, interestedIn: e.target.value })}
              className="w-full px-4 py-2 rounded-portal-xs bg-border-default border border-border-subtle text-white focus:border-accent focus:outline-none"
            >
              <option value="">Select...</option>
              <option value="Next litter">Next litter</option>
              <option value="Specific horse">Specific horse</option>
              <option value="General info">General info</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Price Range
            </label>
            <select
              value={form.priceRange}
              onChange={(e) => setForm({ ...form, priceRange: e.target.value })}
              className="w-full px-4 py-2 rounded-portal-xs bg-border-default border border-border-subtle text-white focus:border-accent focus:outline-none"
            >
              <option value="">Select...</option>
              <option value="Under $5K">Under $5K</option>
              <option value="$5K-$10K">$5K-$10K</option>
              <option value="$10K-$20K">$10K-$20K</option>
              <option value="$20K+">$20K+</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Timeline
            </label>
            <select
              value={form.timeline}
              onChange={(e) => setForm({ ...form, timeline: e.target.value })}
              className="w-full px-4 py-2 rounded-portal-xs bg-border-default border border-border-subtle text-white focus:border-accent focus:outline-none"
            >
              <option value="">Select...</option>
              <option value="Immediate">Immediate</option>
              <option value="Next 3 months">Next 3 months</option>
              <option value="6+ months">6+ months</option>
              <option value="Just researching">Just researching</option>
            </select>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-portal border border-red-500/20 bg-red-500/10 p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-6 py-3 rounded-portal-xs bg-accent text-white font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Send Inquiry"}
        </button>
      </form>
    </div>
  );
}

export default BreedingProgramPage;
