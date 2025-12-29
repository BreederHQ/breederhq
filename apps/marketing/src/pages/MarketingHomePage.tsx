import * as React from "react";
import { PageHeader, Button } from "@bhq/ui";

/* ───────────────── Large Hero Illustrations ───────────────── */

function InboxTrayIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none">
      {/* Back envelope */}
      <rect x="30" y="20" width="140" height="100" rx="8" fill="currentColor" fillOpacity="0.15" />
      {/* Main envelope body */}
      <rect x="20" y="35" width="160" height="110" rx="10" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" />
      {/* Envelope flap */}
      <path d="M20 50 L100 100 L180 50" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Inner tray lines */}
      <rect x="45" y="110" width="60" height="6" rx="3" fill="currentColor" fillOpacity="0.3" />
      <rect x="45" y="122" width="90" height="4" rx="2" fill="currentColor" fillOpacity="0.2" />
      <rect x="45" y="132" width="75" height="4" rx="2" fill="currentColor" fillOpacity="0.15" />
      {/* Notification dot */}
      <circle cx="165" cy="45" r="12" fill="currentColor" fillOpacity="0.6" />
      <text x="165" y="50" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">3</text>
    </svg>
  );
}

function StackedCardsIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none">
      {/* Back card (purple tint) */}
      <rect x="50" y="10" width="130" height="90" rx="8" fill="#8B7EC8" fillOpacity="0.4" stroke="#6B5CA8" strokeOpacity="0.5" strokeWidth="2" />
      <rect x="65" y="25" width="50" height="6" rx="3" fill="#A99CD8" fillOpacity="0.6" />
      <rect x="65" y="38" width="90" height="4" rx="2" fill="#A99CD8" fillOpacity="0.4" />
      <rect x="65" y="48" width="80" height="4" rx="2" fill="#A99CD8" fillOpacity="0.3" />
      <rect x="65" y="58" width="70" height="4" rx="2" fill="#A99CD8" fillOpacity="0.25" />

      {/* Middle card */}
      <rect x="30" y="40" width="130" height="90" rx="8" fill="#6B5CA8" fillOpacity="0.3" stroke="#5B4C98" strokeOpacity="0.4" strokeWidth="2" />
      <rect x="45" y="55" width="50" height="6" rx="3" fill="#9B8DC8" fillOpacity="0.5" />
      <rect x="45" y="68" width="90" height="4" rx="2" fill="#9B8DC8" fillOpacity="0.35" />
      <rect x="45" y="78" width="80" height="4" rx="2" fill="#9B8DC8" fillOpacity="0.25" />

      {/* Front card (neutral) */}
      <rect x="10" y="70" width="130" height="90" rx="8" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <rect x="25" y="85" width="50" height="6" rx="3" fill="currentColor" fillOpacity="0.35" />
      <rect x="25" y="98" width="95" height="4" rx="2" fill="currentColor" fillOpacity="0.25" />
      <rect x="25" y="108" width="85" height="4" rx="2" fill="currentColor" fillOpacity="0.2" />
      <rect x="25" y="118" width="70" height="4" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  );
}

/* ───────────────── Small Icons for Setup Tiles ───────────────── */

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

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

/* ───────────────── Badge Components ───────────────── */

function LiveBadge() {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm">
      LIVE
    </span>
  );
}

function ActiveBadge() {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide bg-neutral-700/80 text-neutral-200">
      ACTIVE
    </span>
  );
}

function ComingSoonPill() {
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide bg-secondary/10 text-secondary/40">
      Coming Soon
    </span>
  );
}

/* ───────────────── Navigation Helper ───────────────── */

function navigateTo(href: string) {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState(null, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
}

/* ───────────────── Hero Communication Card ───────────────── */

interface HeroCommCardProps {
  badgeText: "LIVE" | "ACTIVE";
  title: string;
  description: string;
  buttonText: string;
  href: string;
  illustration: React.ReactNode;
  gradientColor: "orange" | "purple";
}

function HeroCommCard({ badgeText, title, description, buttonText, href, illustration, gradientColor }: HeroCommCardProps) {
  const gradientClass = gradientColor === "orange"
    ? "from-orange-500/15 to-transparent"
    : "from-purple-500/12 to-transparent";

  return (
    <div className="rounded-2xl bg-surface border border-hairline shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] p-6 sm:p-7 gap-4 sm:gap-6">
        {/* Left: Content */}
        <div className="flex flex-col min-w-0">
          <div className="mb-3">
            {badgeText === "LIVE" ? <LiveBadge /> : <ActiveBadge />}
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
          <p className="text-sm text-secondary mb-5 leading-relaxed">{description}</p>
          <div className="mt-auto">
            <Button onClick={navigateTo(href)} variant="primary">
              {buttonText}
            </Button>
          </div>
        </div>

        {/* Right: Illustration with gradient wash */}
        <div className="relative hidden sm:flex items-center justify-center w-[140px] md:w-[180px] lg:w-[200px]">
          {/* Gradient wash behind illustration */}
          <div className={`absolute inset-0 rounded-xl bg-gradient-to-l ${gradientClass}`} />
          {/* Illustration */}
          <div className="relative opacity-75">
            {illustration}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Setup Tile Component ───────────────── */

interface SetupTileProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

function SetupTile({ icon, title, description, href }: SetupTileProps) {
  return (
    <a
      href={href}
      onClick={navigateTo(href)}
      className="group flex items-center gap-3 rounded-lg bg-surface border border-hairline p-3.5 hover:border-hairline-strong transition-colors"
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-md bg-surface-strong flex items-center justify-center text-secondary group-hover:text-primary transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-primary">{title}</div>
        <p className="text-xs text-secondary truncate">{description}</p>
      </div>
      <ChevronRightIcon className="w-4 h-4 text-secondary/40 group-hover:text-secondary transition-colors" />
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
    <div className="rounded-md bg-surface/20 border border-hairline/20 p-2.5 cursor-default select-none">
      <div className="flex items-start gap-2">
        <span className="text-xs opacity-25 flex-shrink-0 pt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-secondary/45">{title}</span>
            <ComingSoonPill />
          </div>
          <p className="text-[10px] text-secondary/35 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function MarketingHomePage() {
  return (
    <div className="p-6 space-y-10 max-w-6xl">
      {/* Page Header */}
      <PageHeader
        title="Marketing"
        subtitle="Nurture, promote, and track, all in one place."
      />

      {/* Section: Active Communications */}
      <section>
        <h2 className="text-sm font-semibold text-primary uppercase tracking-wide mb-5">
          Active Communications
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <HeroCommCard
            badgeText="LIVE"
            title="Direct Messages"
            description="Private conversations with clients."
            buttonText="Open Inbox"
            href="/marketing/messages"
            illustration={<InboxTrayIllustration className="w-36 h-32 md:w-40 md:h-36 text-orange-500" />}
            gradientColor="orange"
          />
          <HeroCommCard
            badgeText="ACTIVE"
            title="Email and Message Templates"
            description="Reusable emails, DM replies, announcements."
            buttonText="Manage Templates"
            href="/marketing/templates"
            illustration={<StackedCardsIllustration className="w-36 h-32 md:w-40 md:h-36 text-purple-400" />}
            gradientColor="purple"
          />
        </div>
      </section>

      {/* Section: Message Setup and Automation */}
      <section>
        <h2 className="text-xs font-semibold text-secondary uppercase tracking-wide mb-4">
          Message Setup and Automation
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <SetupTile
            icon={<TemplateIcon className="w-4 h-4" />}
            title="Templates"
            description="Create and reuse messages across email and DM"
            href="/marketing/templates"
          />
          <SetupTile
            icon={<AutoReplyIcon className="w-4 h-4" />}
            title="Auto Replies"
            description="Send instant replies when you're unavailable"
            href="/marketing/auto-replies"
          />
          <SetupTile
            icon={<ClockIcon className="w-4 h-4" />}
            title="Business Hours"
            description="Control when automated replies are sent"
            href="/marketing/business-hours"
          />
        </div>
      </section>

      {/* Section: Planned Capabilities (Heavily Demoted) */}
      <section className="pt-4 opacity-50">
        <div className="flex items-baseline gap-2 mb-3">
          <h2 className="text-[10px] font-medium text-secondary/40 uppercase tracking-wider">
            Planned Capabilities
          </h2>
          <span className="text-[10px] text-secondary/25 italic">Rolling out in phases</span>
        </div>

        <div className="space-y-3">
          {/* Campaign Hub */}
          <div>
            <h3 className="text-[10px] font-medium text-secondary/30 uppercase mb-1.5">Campaign Hub</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              <PlannedCapability icon="📅" title="Campaign Planning" description="Litter announcements, planned breedings, availability." />
              <PlannedCapability icon="🗓️" title="Central Calendar" description="See what is planned, posted, and coming up." />
            </div>
          </div>

          {/* Multi-Channel Publishing */}
          <div>
            <h3 className="text-[10px] font-medium text-secondary/30 uppercase mb-1.5">Multi-Channel Publishing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              <PlannedCapability icon="📱" title="Social Media" description="Facebook and Instagram business pages." />
              <PlannedCapability icon="✉️" title="Email and SMS" description="Reach waitlists, past buyers, and approved breeders." />
              <PlannedCapability icon="🌐" title="BreederHQ Surfaces" description="Public profile and Marketplace visibility." />
            </div>
          </div>

          {/* AI Assisted Writing */}
          <div>
            <h3 className="text-[10px] font-medium text-secondary/30 uppercase mb-1.5">AI Assisted Writing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              <PlannedCapability icon="✍️" title="Post Creation Help" description="Turn a few details into ready to post copy." />
              <PlannedCapability icon="🎨" title="Tone and Format Adaptation" description="Different styles for social, email, and text." />
              <PlannedCapability icon="🔄" title="Multiple Variations" description="Pick what fits your voice and audience." />
            </div>
          </div>

          {/* Audience and Performance */}
          <div>
            <h3 className="text-[10px] font-medium text-secondary/30 uppercase mb-1.5">Audience and Performance</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              <PlannedCapability icon="👥" title="Audience Selection" description="Past buyers, waitlist, breeders, public." />
              <PlannedCapability icon="📊" title="What Works" description="Views, clicks, and inquiries." />
              <PlannedCapability icon="🔔" title="Smart Suggestions" description="Reminders based on activity and interest." />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
