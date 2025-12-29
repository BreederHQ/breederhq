import * as React from "react";
import { PageHeader, Badge, Button } from "@bhq/ui";

/* ───────────────── Icons ───────────────── */

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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

/* ───────────────── Primary Action Tile ───────────────── */

interface PrimaryTileProps {
  badge: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
  icon: React.ReactNode;
}

function PrimaryTile({ badge, title, description, buttonLabel, href, icon }: PrimaryTileProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState(null, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="relative rounded-xl border border-hairline bg-surface p-5 hover:border-[hsl(var(--brand-orange))]/30 transition-colors overflow-hidden">
      {/* Large inset icon */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none">
        {icon}
      </div>

      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {badge}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-primary">{title}</h3>
          <p className="mt-1 text-sm text-secondary">{description}</p>
        </div>

        <div className="mt-2">
          <Button onClick={handleClick}>
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
            badge={<Badge variant="amber" className="text-xs font-semibold">LIVE</Badge>}
            title="Direct Messages"
            description="Private conversations with clients."
            buttonLabel="Open Inbox"
            href="/marketing/messages"
            icon={<MessageIcon className="w-32 h-32" />}
          />
          <PrimaryTile
            badge={<Badge variant="neutral" className="text-xs font-semibold">ACTIVE</Badge>}
            title="Email and Message Templates"
            description="Reusable emails, DM replies, announcements."
            buttonLabel="Manage Templates"
            href="/marketing/templates"
            icon={<TemplateIcon className="w-32 h-32" />}
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
