import * as React from "react";

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
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm ${className}`}>
      LIVE
    </span>
  );
}

function ActiveBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-neutral-700 text-neutral-300 ${className}`}>
      ACTIVE
    </span>
  );
}

/* ───────────────── Orange CTA Button ───────────────── */

interface OrangeButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

function OrangeButton({ children, onClick, className = "" }: OrangeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center justify-center px-5 py-2.5
        bg-gradient-to-r from-orange-500 to-amber-500
        hover:from-orange-400 hover:to-amber-400
        active:from-orange-600 active:to-amber-600
        text-white font-semibold text-sm
        rounded-lg shadow-md shadow-orange-500/25
        hover:shadow-lg hover:shadow-orange-500/30
        hover:-translate-y-0.5
        active:translate-y-0
        transition-all duration-150
        ${className}
      `}
    >
      {children}
    </button>
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
}

function PrimaryTile({ badgeType, title, description, buttonLabel, href, icon, iconColorClass = "text-neutral-600" }: PrimaryTileProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState(null, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="relative rounded-2xl bg-[#1e1e22] p-7 shadow-xl shadow-black/30 hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-1 transition-all duration-200 overflow-hidden min-h-[220px]">
      {/* Large icon positioned at the right */}
      <div className={`absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-90 ${iconColorClass}`}>
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
          <h3 className="text-2xl font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{description}</p>
        </div>

        {/* Button */}
        <div className="mt-auto pt-3">
          <OrangeButton onClick={handleClick}>
            {buttonLabel}
          </OrangeButton>
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
      className="group rounded-lg bg-[#1a1a1e] p-4 shadow-md shadow-black/10 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#27272b] flex items-center justify-center text-neutral-400 group-hover:text-orange-400 transition-colors">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-white group-hover:text-orange-400 transition-colors">{title}</div>
          <p className="mt-1 text-xs text-neutral-500 leading-relaxed">{description}</p>
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
    <div className="rounded-lg bg-[#19191c] p-4 shadow-sm shadow-black/10">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-base opacity-50">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-xs text-neutral-500">{title}</div>
          <p className="mt-1 text-xs text-neutral-600 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#141417] to-[#0f0f11] p-6 space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Marketing</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Communicate with clients and manage your messaging
        </p>
        <p className="text-xs text-neutral-500 mt-2">
          Direct messaging is live. Additional capabilities are rolling out in phases.
        </p>
      </div>

      {/* Active Communications - Primary Section */}
      <section>
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-5">
          Active Communications
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PrimaryTile
            badgeType="live"
            title="Direct Messages"
            description="Private conversations with clients."
            buttonLabel="Open Inbox"
            href="/marketing/messages"
            icon={<MessageInboxIcon className="w-32 h-32" />}
            iconColorClass="text-orange-500/70"
          />
          <PrimaryTile
            badgeType="active"
            title="Email and Message Templates"
            description="Reusable emails, DM replies, announcements."
            buttonLabel="Manage Templates"
            href="/marketing/templates"
            icon={<TemplateCardsIcon className="w-36 h-32" />}
          />
        </div>
      </section>

      {/* Message Setup and Automation - Secondary Section */}
      <section>
        <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wide mb-4">
          Message Setup and Automation
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Planned Capabilities - Roadmap Section (Demoted) */}
      <section className="pt-4">
        <div className="flex items-baseline gap-3 mb-4">
          <h2 className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
            Planned Capabilities
          </h2>
          <span className="text-[11px] text-neutral-600">Rolling out in phases</span>
        </div>

        <div className="space-y-5">
          {/* Group: Campaign Hub */}
          <div>
            <h3 className="text-[11px] font-medium text-neutral-600 mb-2.5">Campaign Hub</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
            <h3 className="text-[11px] font-medium text-neutral-600 mb-2.5">Multi-Channel Publishing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
            <h3 className="text-[11px] font-medium text-neutral-600 mb-2.5">AI Assisted Writing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
            <h3 className="text-[11px] font-medium text-neutral-600 mb-2.5">Visual Assets</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
            <h3 className="text-[11px] font-medium text-neutral-600 mb-2.5">Audience Targeting</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
            <h3 className="text-[11px] font-medium text-neutral-600 mb-2.5">Performance Feedback</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
            <h3 className="text-[11px] font-medium text-neutral-600 mb-2.5">Smart Suggestions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
      <div className="rounded-xl bg-gradient-to-br from-[#1e1e22] to-[#1a1a1e] p-5 shadow-lg shadow-black/10">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/10 flex items-center justify-center text-lg">
            🔗
          </div>
          <div>
            <div className="font-semibold text-sm text-white mb-1">Stays Connected</div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Marketing connects directly with Animals, Offspring, Contacts, and Marketplace so everything stays in sync.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
