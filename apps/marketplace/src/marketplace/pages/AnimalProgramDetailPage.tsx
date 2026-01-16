// apps/marketplace/src/marketplace/pages/AnimalProgramDetailPage.tsx
// Animal Program detail page - displays program info and participating animals

import * as React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getAnimalProgramDetail } from "../../api/client";
import { getUserMessage } from "../../api/errors";
import type { PublicAnimalProgramDetailDTO } from "../../api/types";
import { Breadcrumb } from "../components/Breadcrumb";
import { DefaultCoverImage } from "../../shared/DefaultCoverImage";
import { DefaultAnimalImage } from "../../shared/DefaultAnimalImage";
import { Users, MapPin, DollarSign, Mail, Globe, Eye, Calendar } from "lucide-react";
import { useUserProfile } from "../../gate/MarketplaceGate";

// Template type labels
const TEMPLATE_LABELS: Record<string, string> = {
  STUD_SERVICES: "Stud Services",
  GUARDIAN: "Guardian Program",
  TRAINED: "Trained Animals",
  REHOME: "Rehome Program",
  CO_OWNERSHIP: "Co-Ownership",
  CUSTOM: "Custom Program",
};

export function AnimalProgramDetailPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Check authentication status
  const userProfile = useUserProfile();
  const isAuthenticated = !!userProfile?.userId;

  const [program, setProgram] = React.useState<PublicAnimalProgramDetailDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!slug) {
      setError("Invalid program URL");
      setLoading(false);
      return;
    }

    let dead = false;

    const fetchProgram = async () => {
      try {
        const data = await getAnimalProgramDetail(slug);
        if (!dead) {
          setProgram(data);
        }
      } catch (err: any) {
        console.error("Failed to fetch animal program:", err);
        if (!dead) {
          setError(getUserMessage(err));
        }
      } finally {
        if (!dead) {
          setLoading(false);
        }
      }
    };

    fetchProgram();
    return () => { dead = true; };
  }, [slug]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-portal-surface pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-portal-card rounded-lg" />
            <div className="h-96 bg-portal-card rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !program) {
    return (
      <div className="min-h-screen bg-portal-surface pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-portal-card border border-border-subtle rounded-lg p-8 text-center">
            <h1 className="text-xl font-semibold text-white mb-2">Program Not Found</h1>
            <p className="text-text-secondary mb-6">{error || "The program you're looking for doesn't exist or has been removed."}</p>
            <button
              onClick={() => navigate("/animals")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
            >
              Back to Animals
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Price display
  const priceDisplay = (() => {
    if (program.priceModel === "fixed" && program.priceCents) {
      return `$${(program.priceCents / 100).toLocaleString()}`;
    } else if (program.priceModel === "range" && program.priceMinCents && program.priceMaxCents) {
      return `$${(program.priceMinCents / 100).toLocaleString()} - $${(program.priceMaxCents / 100).toLocaleString()}`;
    } else {
      return "Contact for pricing";
    }
  })();

  const templateLabel = TEMPLATE_LABELS[program.templateType] || program.templateType;

  return (
    <div className="min-h-screen bg-portal-surface pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumb
          items={[
            { label: "Animals", href: "/animals" },
            { label: program.name },
          ]}
        />

        {/* Header with Cover Image */}
        <div className="mt-6 bg-portal-card border border-border-subtle rounded-lg overflow-hidden">
          <div className="h-64 relative">
            {program.coverImageUrl ? (
              <img
                src={program.coverImageUrl}
                alt={program.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <DefaultCoverImage />
            )}
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent/20 text-accent border border-accent/30">
                    {templateLabel}
                  </span>
                  <div className="flex items-center gap-1.5 text-sm text-text-tertiary">
                    <Eye size={16} />
                    <span>{program.viewCount.toLocaleString()} views</span>
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-white">{program.name}</h1>
                {program.headline && (
                  <p className="text-lg text-text-secondary mt-2">{program.headline}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-accent">{priceDisplay}</div>
              </div>
            </div>

            {/* Breeder Info */}
            <div className="flex items-center gap-4 pt-4 border-t border-border-subtle">
              <Link
                to={`/breeders/${program.breeder.slug}`}
                className="text-accent hover:text-accent-hover font-medium"
              >
                {program.breeder.name}
              </Link>
              {program.breeder.location && (
                <div className="flex items-center gap-1.5 text-sm text-text-tertiary">
                  <MapPin size={16} />
                  <span>{program.breeder.location}</span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 pt-4">
              {/* Contact Breeder - only show for authenticated users */}
              {isAuthenticated && program.acceptInquiries && (
                <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors">
                  <Mail size={18} />
                  Contact Breeder
                </button>
              )}
              {/* Visit Website - show for all users */}
              {program.breeder.website && (
                <a
                  href={program.breeder.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-portal-surface border border-border-default hover:border-border-default hover:bg-portal-card text-white font-medium rounded-lg transition-colors ${
                    !isAuthenticated || !program.acceptInquiries ? 'flex-1' : ''
                  }`}
                >
                  <Globe size={18} />
                  Visit Website
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {program.description && (
              <div className="bg-portal-card border border-border-subtle rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">About This Program</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-text-secondary whitespace-pre-wrap">{program.description}</p>
                </div>
              </div>
            )}

            {/* Participating Animals */}
            <div className="bg-portal-card border border-border-subtle rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Participating Animals</h2>
                <div className="flex items-center gap-2 text-sm text-text-tertiary">
                  <Users size={16} />
                  <span>{program.participantCount} {program.participantCount === 1 ? 'animal' : 'animals'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {program.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className={`bg-portal-surface border border-border-subtle rounded-lg overflow-hidden transition-colors relative ${
                      isAuthenticated ? 'hover:border-border-default cursor-pointer' : ''
                    }`}
                  >
                    <div className="h-48 relative">
                      {participant.photoUrl ? (
                        <img
                          src={participant.photoUrl}
                          alt={participant.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <DefaultAnimalImage species={participant.species} />
                      )}
                      {participant.featured && (
                        <div className="absolute top-2 right-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent/90 text-white">
                            Featured
                          </span>
                        </div>
                      )}
                      {/* Anonymous user overlay */}
                      {!isAuthenticated && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <div className="text-center px-4">
                            <p className="text-white text-sm font-medium">Sign in to view details</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-base font-semibold text-white">{participant.name}</h3>
                      <div className="mt-1 space-y-1 text-sm text-text-secondary">
                        {participant.breed && <p>{participant.breed}</p>}
                        {participant.sex && <p>{participant.sex}</p>}
                      </div>
                      {participant.headlineOverride && (
                        <p className="mt-2 text-sm text-text-secondary">{participant.headlineOverride}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Program Stats */}
            <div className="bg-portal-card border border-border-subtle rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Program Details</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-tertiary">Animals</span>
                  <span className="text-white font-medium">{program.participantCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-tertiary">Inquiries</span>
                  <span className="text-white font-medium">{program.inquiryCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-tertiary">Views</span>
                  <span className="text-white font-medium">{program.viewCount.toLocaleString()}</span>
                </div>
                {program.publishedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-tertiary">Published</span>
                    <span className="text-white font-medium">
                      {new Date(program.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Waitlist Card */}
            {program.openWaitlist && (
              <div className="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Join the Waitlist</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Be notified when new animals are added to this program.
                </p>
                <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors">
                  Join Waitlist
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnimalProgramDetailPage;
