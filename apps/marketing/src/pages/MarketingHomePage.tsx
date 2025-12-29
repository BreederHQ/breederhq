import * as React from "react";
import { PageHeader, Button } from "@bhq/ui";

/* ───────────────── Icons ───────────────── */

function MessageInboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none">
      {/* Envelope body */}
      <rect x="8" y="20" width="64" height="48" rx="4" stroke="currentColor" strokeWidth="3" fill="none" />
      {/* Envelope flap / V shape */}
      <path d="M8 24 L40 48 L72 24" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Inner checkmark or detail line */}
      <path d="M24 44 L36 56 L56 32" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TemplateCardsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 80" fill="none">
      {/* Back card (purple/violet) */}
      <rect x="30" y="4" width="56" height="40" rx="4" fill="#8B7EC8" stroke="#6B5CA8" strokeWidth="2" />
      <rect x="38" y="12" width="24" height="3" rx="1.5" fill="#A99CD8" />
      <rect x="38" y="18" width="40" height="2" rx="1" fill="#A99CD8" />
      <rect x="38" y="23" width="36" height="2" rx="1" fill="#A99CD8" />
      <rect x="38" y="28" width="32" height="2" rx="1" fill="#A99CD8" />

      {/* Front card (gray/neutral) */}
      <rect x="10" y="24" width="56" height="40" rx="4" fill="#4A4A52" stroke="#3A3A42" strokeWidth="2" />
      <rect x="18" y="32" width="24" height="3" rx="1.5" fill="#6A6A72" />
      <rect x="18" y="38" width="40" height="2" rx="1" fill="#5A5A62" />
      <rect x="18" y="43" width="36" height="2" rx="1" fill="#5A5A62" />
      <rect x="18" y="48" width="32" height="2" rx="1" fill="#5A5A62" />
    </svg>
  );
}

function TemplateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function AutoReplyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 10 4 15 9 20" />
      <path d="M20 4v7a4 4 0 0 1-4 4H4" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

/* ───────────────── Badge Components ───────────────── */

function LiveBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide border border-amber-600/60 text-amber-500 bg-transparent ${className}`}>
      LIVE
    </span>
  );
}

function ActiveBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide border border-neutral-500/60 text-neutral-400 bg-neutral-800/50 ${className}`}>
      ACTIVE
    </span>
  );
}

/* ───────────────── Primary Action Tile ───────────────── */

interface PrimaryTileProps {
  badgeType: "live" | "active";
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
  icon: React.ReactNode;
  iconColorClass?: string;
  showFloatingBadge?: boolean;
}

function PrimaryTile({ badgeType, title, description, buttonLabel, href, icon, iconColorClass = "text-secondary", showFloatingBadge = false }: PrimaryTileProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState(null, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="relative rounded-xl border border-hairline bg-[#1a1a1c] p-6 hover:border-[hsl(var(--brand-orange))]/30 transition-colors overflow-hidden min-h-[180px]">
      {/* Floating badge on right side */}
      {showFloatingBadge && badgeType === "live" && (
        <div className="absolute top-4 right-4 z-20">
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-amber-600 text-black">
            LIVE
          </span>
        </div>
      )}

      {/* Large icon positioned at the right */}
      <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${iconColorClass}`}>
        {icon}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-4 max-w-[60%]">
        {/* Top badge */}
        <div>
          {badgeType === "live" ? <LiveBadge /> : <ActiveBadge />}
        </div>

        {/* Title and description */}
        <div>
          <h3 className="text-xl font-semibold text-primary">{title}</h3>
          <p className="mt-1.5 text-sm text-secondary">{description}</p>
        </div>

        {/* Button */}
        <div className="mt-2">
          <Button onClick={handleClick} variant="primary" className="bg-amber-600 hover:bg-amber-500">
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
}

function SecondaryTile({ icon, title, description, href }: SecondaryTileProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState(null, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className="group rounded-lg border border-hairline bg-surface/50 p-4 hover:border-[hsl(var(--brand-orange))]/30 hover:bg-surface transition-colors"
    >
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
    <div className="rounded-lg border border-hairline/50 bg-surface/30 p-3">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-xl opacity-50">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-xs text-secondary">{title}</div>
          <p className="mt-0.5 text-xs text-secondary/70 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function MarketingHomePage() {
  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div>
        <PageHeader
          title="Marketing"
          subtitle="Communicate with clients and manage your messaging"
        />
        <p className="text-xs text-secondary mt-1">
          Direct messaging is live. Additional capabilities are rolling out in phases.
        </p>
      </div>

      {/* Active Communications - Primary Section */}
      <section>
        <h2 className="text-sm font-semibold text-primary uppercase tracking-wide mb-4">
          Active Communications
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PrimaryTile
            badgeType="live"
            title="Direct Messages"
            description="Private conversations with clients."
            buttonLabel="Open Inbox"
            href="/marketing/messages"
            icon={<MessageInboxIcon className="w-28 h-28" />}
            iconColorClass="text-amber-500"
            showFloatingBadge={true}
          />
          <PrimaryTile
            badgeType="active"
            title="Email and Message Templates"
            description="Reusable emails, DM replies, announcements."
            buttonLabel="Manage Templates"
            href="/marketing/templates"
            icon={<TemplateCardsIcon className="w-32 h-28" />}
          />
        </div>
      </section>

      {/* Message Setup and Automation - Secondary Section */}
      <section>
        <h2 className="text-sm font-semibold text-primary uppercase tracking-wide mb-4">
          Message Setup and Automation
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <SecondaryTile
            icon={<TemplateIcon className="w-4 h-4" />}
            title="Templates"
            description="Create and manage reusable message templates"
            href="/marketing/templates"
          />
          <SecondaryTile
            icon={<AutoReplyIcon className="w-4 h-4" />}
            title="Auto Replies"
            description="Set up automatic responses to common inquiries"
            href="/marketing/auto-replies"
          />
          <SecondaryTile
            icon={<ClockIcon className="w-4 h-4" />}
            title="Business Hours"
            description="Define when you are available for messages"
            href="/marketing/business-hours"
          />
        </div>
      </section>

      {/* Planned Capabilities - Roadmap Section */}
      <section className="opacity-75">
        <div className="flex items-baseline gap-3 mb-4">
          <h2 className="text-xs font-semibold text-secondary uppercase tracking-wide">
            Planned Capabilities
          </h2>
          <span className="text-xs text-secondary/70">Rolling out in phases</span>
        </div>

        <div className="space-y-6">
          {/* Group: Campaign Hub */}
          <div>
            <h3 className="text-xs font-medium text-secondary/80 mb-3">Campaign Hub</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <PlannedCapability
                icon="📅"
                title="Campaign Planning"
                description="Litter announcements, planned breedings, availability, services, and milestones."
              />
              <PlannedCapability
                icon="🗓️"
                title="Central Calendar"
                description="See what is planned, posted, and coming up."
              />
            </div>
          </div>

          {/* Group: Multi-Channel Publishing */}
          <div>
            <h3 className="text-xs font-medium text-secondary/80 mb-3">Multi-Channel Publishing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <PlannedCapability
                icon="📱"
                title="Social Media"
                description="Facebook and Instagram business pages."
              />
              <PlannedCapability
                icon="✉️"
                title="Email and SMS"
                description="Reach waitlists, past buyers, and approved breeders."
              />
              <PlannedCapability
                icon="🌐"
                title="BreederHQ Surfaces"
                description="Public profile and Marketplace visibility."
              />
            </div>
          </div>

          {/* Group: AI Assisted Writing */}
          <div>
            <h3 className="text-xs font-medium text-secondary/80 mb-3">AI Assisted Writing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <PlannedCapability
                icon="✍️"
                title="Post Creation Help"
                description="Turn a few details into ready to post copy."
              />
              <PlannedCapability
                icon="🎨"
                title="Tone and Format Adaptation"
                description="Different styles for social, email, and text."
              />
              <PlannedCapability
                icon="🔄"
                title="Multiple Variations"
                description="Pick what fits your voice and audience."
              />
            </div>
          </div>

          {/* Group: Visual Assets */}
          <div>
            <h3 className="text-xs font-medium text-secondary/80 mb-3">Visual Assets</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <PlannedCapability
                icon="📸"
                title="Image and Caption Support"
                description="Pair photos with clear, engaging captions."
              />
              <PlannedCapability
                icon="⭐"
                title="Program and Litter Highlights"
                description="Spotlight animals, services, and milestones."
              />
            </div>
          </div>

          {/* Group: Audience Targeting */}
          <div>
            <h3 className="text-xs font-medium text-secondary/80 mb-3">Audience Targeting</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <PlannedCapability
                icon="👥"
                title="Simple Audience Selection"
                description="Past buyers, waitlist, breeders, public."
              />
              <PlannedCapability
                icon="🎯"
                title="Right Message, Right People"
                description="Avoid overposting or misdirected outreach."
              />
            </div>
          </div>

          {/* Group: Performance Feedback */}
          <div>
            <h3 className="text-xs font-medium text-secondary/80 mb-3">Performance Feedback</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <PlannedCapability
                icon="📊"
                title="What Works"
                description="Views, clicks, and inquiries."
              />
              <PlannedCapability
                icon="💡"
                title="What Drives Interest"
                description="See which posts lead to real conversations."
              />
            </div>
          </div>

          {/* Group: Smart Suggestions */}
          <div>
            <h3 className="text-xs font-medium text-secondary/80 mb-3">Smart Suggestions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <PlannedCapability
                icon="🔔"
                title="Helpful Reminders"
                description="Upcoming litters, go home weeks, seasonal moments."
              />
              <PlannedCapability
                icon="🧭"
                title="Quiet Guidance"
                description="Suggestions based on activity and interest."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer Callout */}
      <div className="rounded-xl border border-[hsl(var(--brand-orange))]/20 bg-gradient-to-br from-[hsl(var(--brand-orange))]/5 to-[hsl(var(--brand-teal))]/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[hsl(var(--brand-orange))]/20 flex items-center justify-center text-lg">
            🔗
          </div>
          <div>
            <div className="font-semibold text-sm text-primary mb-1">Stays Connected</div>
            <p className="text-xs text-secondary">
              Marketing connects directly with Animals, Offspring, Contacts, and Marketplace so everything stays in sync.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
