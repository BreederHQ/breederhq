import * as React from "react";
import { PageHeader, Button } from "@bhq/ui";

/* ───────────────── Icons ───────────────── */

function MessageInboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none">
      <rect x="8" y="20" width="64" height="48" rx="4" stroke="currentColor" strokeWidth="3" fill="none" />
      <path d="M8 24 L40 48 L72 24" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 44 L36 56 L56 32" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TemplateCardsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 80" fill="none">
      <rect x="30" y="4" width="56" height="40" rx="4" fill="#8B7EC8" stroke="#6B5CA8" strokeWidth="2" />
      <rect x="38" y="12" width="24" height="3" rx="1.5" fill="#A99CD8" />
      <rect x="38" y="18" width="40" height="2" rx="1" fill="#A99CD8" />
      <rect x="38" y="23" width="36" height="2" rx="1" fill="#A99CD8" />
      <rect x="38" y="28" width="32" height="2" rx="1" fill="#A99CD8" />
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

/* ───────────────── Navigation Helper ───────────────── */

function navigateTo(href: string) {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState(null, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
}

/* ───────────────── Hero Card Component ───────────────── */

interface HeroCardProps {
  badge: "live" | "active";
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
  icon: React.ReactNode;
}

function HeroCard({ badge, title, description, buttonLabel, href, icon }: HeroCardProps) {
  return (
    <div className="rounded-xl bg-surface border border-hairline p-6 shadow-md hover:shadow-lg hover:border-[hsl(var(--brand-orange))]/50 transition-all duration-200">
      <div className="flex gap-5">
        {/* Left: Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="mb-3">
            {badge === "live" ? <LiveBadge /> : <ActiveBadge />}
          </div>
          <h3 className="text-lg font-semibold text-primary mb-1.5">{title}</h3>
          <p className="text-sm text-secondary mb-5">{description}</p>
          <div className="mt-auto">
            <Button onClick={navigateTo(href)} variant="primary">
              {buttonLabel}
            </Button>
          </div>
        </div>
        {/* Right: Icon (constrained size, reduced opacity) */}
        <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center text-[hsl(var(--brand-orange))]/50 opacity-70">
          {icon}
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
    <div className="rounded-md bg-surface/30 border border-hairline/30 p-2.5 cursor-default select-none">
      <div className="flex items-start gap-2">
        <span className="text-xs opacity-30">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-medium text-secondary/50">{title}</div>
          <p className="text-[11px] text-secondary/40 mt-0.5 leading-relaxed">{description}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <HeroCard
            badge="live"
            title="Direct Messages"
            description="Private conversations with clients."
            buttonLabel="Open Inbox"
            href="/marketing/messages"
            icon={<MessageInboxIcon className="w-14 h-14 sm:w-16 sm:h-16" />}
          />
          <HeroCard
            badge="active"
            title="Email and Message Templates"
            description="Reusable emails, DM replies, announcements."
            buttonLabel="Manage Templates"
            href="/marketing/templates"
            icon={<TemplateCardsIcon className="w-16 h-14 sm:w-20 sm:h-16" />}
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
      <section className="pt-4 opacity-60">
        <div className="flex items-baseline gap-2 mb-3">
          <h2 className="text-[10px] font-medium text-secondary/50 uppercase tracking-wider">
            Planned Capabilities
          </h2>
          <span className="text-[10px] text-secondary/30 italic">Rolling out in phases</span>
        </div>

        <div className="space-y-3">
          {/* Campaign Hub */}
          <div>
            <h3 className="text-[10px] font-medium text-secondary/40 uppercase mb-1.5">Campaign Hub</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              <PlannedCapability icon="📅" title="Campaign Planning" description="Litter announcements, planned breedings, availability." />
              <PlannedCapability icon="🗓️" title="Central Calendar" description="See what is planned, posted, and coming up." />
            </div>
          </div>

          {/* Multi-Channel Publishing */}
          <div>
            <h3 className="text-[10px] font-medium text-secondary/40 uppercase mb-1.5">Multi-Channel Publishing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              <PlannedCapability icon="📱" title="Social Media" description="Facebook and Instagram business pages." />
              <PlannedCapability icon="✉️" title="Email and SMS" description="Reach waitlists, past buyers, and approved breeders." />
              <PlannedCapability icon="🌐" title="BreederHQ Surfaces" description="Public profile and Marketplace visibility." />
            </div>
          </div>

          {/* AI Assisted Writing */}
          <div>
            <h3 className="text-[10px] font-medium text-secondary/40 uppercase mb-1.5">AI Assisted Writing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              <PlannedCapability icon="✍️" title="Post Creation Help" description="Turn a few details into ready to post copy." />
              <PlannedCapability icon="🎨" title="Tone and Format Adaptation" description="Different styles for social, email, and text." />
              <PlannedCapability icon="🔄" title="Multiple Variations" description="Pick what fits your voice and audience." />
            </div>
          </div>

          {/* Audience and Performance */}
          <div>
            <h3 className="text-[10px] font-medium text-secondary/40 uppercase mb-1.5">Audience and Performance</h3>
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
