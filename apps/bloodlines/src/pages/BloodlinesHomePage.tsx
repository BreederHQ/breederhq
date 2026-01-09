// apps/bloodlines/src/pages/BloodlinesHomePage.tsx
import * as React from "react";
import { PageHeader, Button } from "@bhq/ui";

/* ───────────────── Icons ───────────────── */

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="trophyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e87924" />
          <stop offset="100%" stopColor="#c45a10" />
        </linearGradient>
      </defs>
      {/* Trophy cup */}
      <path
        d="M20 8 h24 v12 c0 8 -4 14 -12 16 c-8 -2 -12 -8 -12 -16 v-12z"
        stroke="url(#trophyGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left handle */}
      <path
        d="M20 12 h-4 c-4 0 -6 4 -6 8 s2 8 6 8 h4"
        stroke="url(#trophyGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right handle */}
      <path
        d="M44 12 h4 c4 0 6 4 6 8 s-2 8 -6 8 h-4"
        stroke="url(#trophyGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Stem */}
      <path
        d="M32 36 v8"
        stroke="url(#trophyGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Base */}
      <path
        d="M22 44 h20 v6 c0 2 -2 4 -4 4 h-12 c-2 0 -4 -2 -4 -4 v-6z"
        stroke="url(#trophyGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RibbonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="ribbonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e87924" />
          <stop offset="100%" stopColor="#c45a10" />
        </linearGradient>
      </defs>
      {/* Ribbon circle */}
      <circle
        cx="32"
        cy="24"
        r="16"
        stroke="url(#ribbonGradient)"
        strokeWidth="3"
        fill="none"
      />
      {/* Left tail */}
      <path
        d="M22 36 l-6 20 l8 -6 l4 8 l6 -22"
        stroke="url(#ribbonGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right tail */}
      <path
        d="M42 36 l6 20 l-8 -6 l-4 8 l-6 -22"
        stroke="url(#ribbonGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Star in center */}
      <path
        d="M32 14 l2 6 l6 0 l-5 4 l2 6 l-5 -4 l-5 4 l2 -6 l-5 -4 l6 0 z"
        stroke="url(#ribbonGradient)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PedigreeTreeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="pedigreeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e87924" />
          <stop offset="100%" stopColor="#c45a10" />
        </linearGradient>
      </defs>
      {/* Root node (left) */}
      <rect
        x="4"
        y="24"
        width="16"
        height="16"
        rx="3"
        stroke="url(#pedigreeGradient)"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Parent nodes (middle) */}
      <rect
        x="28"
        y="12"
        width="12"
        height="12"
        rx="2"
        stroke="url(#pedigreeGradient)"
        strokeWidth="2"
        fill="none"
      />
      <rect
        x="28"
        y="40"
        width="12"
        height="12"
        rx="2"
        stroke="url(#pedigreeGradient)"
        strokeWidth="2"
        fill="none"
      />
      {/* Grandparent nodes (right) */}
      <rect
        x="48"
        y="4"
        width="10"
        height="10"
        rx="2"
        stroke="url(#pedigreeGradient)"
        strokeWidth="1.5"
        fill="none"
      />
      <rect
        x="48"
        y="18"
        width="10"
        height="10"
        rx="2"
        stroke="url(#pedigreeGradient)"
        strokeWidth="1.5"
        fill="none"
      />
      <rect
        x="48"
        y="36"
        width="10"
        height="10"
        rx="2"
        stroke="url(#pedigreeGradient)"
        strokeWidth="1.5"
        fill="none"
      />
      <rect
        x="48"
        y="50"
        width="10"
        height="10"
        rx="2"
        stroke="url(#pedigreeGradient)"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Connecting lines */}
      <path
        d="M20 32 L28 18 M20 32 L28 46"
        stroke="url(#pedigreeGradient)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M40 18 L48 9 M40 18 L48 23"
        stroke="url(#pedigreeGradient)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M40 46 L48 41 M40 46 L48 55"
        stroke="url(#pedigreeGradient)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ───────────────── Primary Action Tile ───────────────── */

interface PrimaryTileProps {
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
  icon: React.ReactNode;
  status?: "live" | "coming-soon";
}

function PrimaryTile({ title, description, buttonLabel, href, icon, status = "live" }: PrimaryTileProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState(null, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div
      className="relative rounded-2xl hover:brightness-110 transition-all overflow-hidden"
      style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid rgba(60, 60, 60, 0.5)',
        height: '200px',
      }}
    >
      {/* Status pill in top-left */}
      <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
        <span
          className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: status === "live" ? '#16a34a' : '#6b7280',
            color: '#fff',
          }}
        >
          {status === "live" ? "Live" : "Coming Soon"}
        </span>
      </div>

      {/* Icon positioned in top-right */}
      <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
        {icon}
      </div>

      {/* Content positioned at bottom-left */}
      <div style={{ position: 'absolute', bottom: '24px', left: '24px' }}>
        <h3 className="text-xl font-semibold text-primary">{title}</h3>
        <p className="mt-1 text-sm text-secondary">{description}</p>
        <div className="mt-4">
          <Button onClick={handleClick} disabled={status !== "live"}>
            {buttonLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Secondary Tile ───────────────── */

interface SecondaryTileProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  status?: "live" | "coming-soon";
}

function SecondaryTile({ icon, title, description, href, status = "live" }: SecondaryTileProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const isLive = status === "live";

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLive) return;
    window.history.pushState(null, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group rounded-lg p-4 transition-all relative ${isLive ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
      style={{
        border: isHovered && isLive ? '2px solid hsl(var(--brand-orange))' : '2px solid rgba(232, 121, 36, 0.3)',
        backgroundColor: isHovered && isLive ? 'var(--surface)' : 'rgba(var(--surface-rgb), 0.5)',
      }}
    >
      {/* Status pill */}
      <div className="absolute top-2 right-2">
        <span
          className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: isLive ? '#16a34a' : '#6b7280',
            color: '#fff',
          }}
        >
          {isLive ? "Live" : "Coming Soon"}
        </span>
      </div>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-md bg-surface-strong border border-hairline flex items-center justify-center text-secondary group-hover:text-primary transition-colors">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-primary">{title}</div>
          <p className="mt-0.5 text-xs text-secondary">{description}</p>
        </div>
      </div>
    </a>
  );
}

/* ───────────────── Planned Capability Card ───────────────── */

interface PlannedCapabilityProps {
  icon: string;
  title: string;
  description: string;
}

function PlannedCapability({ icon, title, description }: PlannedCapabilityProps) {
  return (
    <div className="rounded-lg p-3" style={{ border: '1px solid rgba(55, 55, 55, 0.8)' }}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-base" style={{ backgroundColor: 'rgba(40, 40, 40, 0.9)' }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-primary">{title}</div>
          <p className="mt-0.5 text-xs text-secondary leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function BloodlinesHomePage() {
  return (
    <div className="p-6">
      {/* Page Header */}
      <PageHeader
        title="Bloodlines"
        subtitle="Track titles, competition records, and producing stats for serious show and performance breeders."
      />

      {/* Primary Features Section */}
      <section className="mt-8">
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 className="text-xl font-semibold text-primary">Title and Competition Tracking</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PrimaryTile
            title="Titles"
            description="Track earned titles, championships, and certifications."
            buttonLabel="Manage Titles"
            href="/bloodlines/titles"
            icon={<TrophyIcon className="w-20 h-20" />}
            status="live"
          />
          <PrimaryTile
            title="Competitions"
            description="Log show entries, placements, points, and major wins."
            buttonLabel="View Competitions"
            href="/bloodlines/competitions"
            icon={<RibbonIcon className="w-20 h-20" />}
            status="live"
          />
          <PrimaryTile
            title="Explore Pedigrees"
            description="Interactive pedigree tree with cross-breeder data."
            buttonLabel="Explore Now"
            href="/bloodlines/explore"
            icon={<PedigreeTreeIcon className="w-20 h-20" />}
            status="live"
          />
        </div>
      </section>

      {/* Secondary Features Section */}
      <section style={{ marginTop: '3rem' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 className="text-xl font-semibold text-primary">Connections and Discovery</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SecondaryTile
            icon={<span className="text-base">🔗</span>}
            title="Connections"
            description="Match identities across breeders and manage info requests"
            href="/bloodlines/connections"
            status="coming-soon"
          />
          <SecondaryTile
            icon={<span className="text-base">📊</span>}
            title="Producing Records"
            description="View offspring title stats for sires and dams"
            href="/bloodlines/producing"
            status="coming-soon"
          />
        </div>
      </section>

      {/* Planned Capabilities - Roadmap Section */}
      <section style={{ marginTop: '3rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 className="text-xl font-semibold text-primary">Planned Capabilities</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Group: Cross-Breeder Network */}
          <div>
            <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">Cross-Breeder Network</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <PlannedCapability
                icon="🌐"
                title="Global Identity Matching"
                description="Automatic matching of animals across breeders via registry numbers, microchips, and DNA."
              />
              <PlannedCapability
                icon="🔒"
                title="Privacy Controls"
                description="Choose what information to share with other breeders who own related animals."
              />
              <PlannedCapability
                icon="📬"
                title="Info Requests"
                description="Request and share pedigree information with owners of related animals."
              />
            </div>
          </div>

          {/* Group: Title Verification */}
          <div>
            <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">Title Verification</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <PlannedCapability
                icon="✓"
                title="Registry Integration"
                description="Verify titles directly with AKC, UKC, and other registries."
              />
              <PlannedCapability
                icon="📄"
                title="Document Attachments"
                description="Attach certificates and proof of titles."
              />
              <PlannedCapability
                icon="🏅"
                title="Title Progress Tracking"
                description="Track points toward upcoming titles."
              />
            </div>
          </div>

          {/* Group: Analysis Tools */}
          <div>
            <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">Analysis Tools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <PlannedCapability
                icon="📈"
                title="Producing Sire/Dam Reports"
                description="Comprehensive breakdown of offspring achievements."
              />
              <PlannedCapability
                icon="🧬"
                title="COI with Titles"
                description="See inbreeding coefficient alongside title achievements in pedigree view."
              />
              <PlannedCapability
                icon="🎯"
                title="Breeding Recommendations"
                description="Find complementary bloodlines based on titles and health."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer Callout */}
      <div style={{ marginTop: '3rem' }} className="rounded-xl border border-[hsl(var(--brand-orange))]/20 bg-gradient-to-br from-[hsl(var(--brand-orange))]/5 to-[hsl(var(--brand-teal))]/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[hsl(var(--brand-orange))]/20 flex items-center justify-center text-lg">
            🔗
          </div>
          <div>
            <div className="font-semibold text-sm text-primary mb-1">Connected to Your Animals</div>
            <p className="text-xs text-secondary">
              Titles and competitions are linked to your Animals module. Add titles from an animal's profile or manage them all here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
