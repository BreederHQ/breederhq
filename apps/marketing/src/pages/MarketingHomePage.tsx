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
  const [isHovered, setIsHovered] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState(null, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group rounded-lg p-4 cursor-pointer transition-all relative"
      style={{
        border: isHovered ? '2px solid hsl(var(--brand-orange))' : '2px solid rgba(232, 121, 36, 0.3)',
        backgroundColor: isHovered ? 'var(--surface)' : 'rgba(var(--surface-rgb), 0.5)',
      }}
    >
      {/* Live pill */}
      <div className="absolute top-2 right-2">
        <span
          className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: 'rgba(74, 124, 89, 0.9)',
            color: '#fff',
          }}
        >
          Live
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

export default function MarketingHomePage() {
  return (
    <div className="p-6">
      {/* Page Header */}
      <PageHeader
        title="Marketing"
        subtitle="Plan it, write it, post it and track it - all in one place!"
      />

      {/* Active Communications - Primary Section */}
      <section className="mt-8">
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 className="text-xl font-semibold text-primary">Active Communications</h2>
        </div>
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
      <section style={{ marginTop: '3rem' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 className="text-xl font-semibold text-primary">Message Setup and Automation</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <SecondaryTile
            icon={<span className="text-base">📝</span>}
            title="Templates"
            description="Create and manage reusable message templates"
            href="/marketing/templates"
          />
          <SecondaryTile
            icon={<span className="text-base">⚡</span>}
            title="Auto Replies"
            description="Set up automatic responses to common inquiries"
            href="/marketing/auto-replies"
          />
          <SecondaryTile
            icon={<span className="text-base">🕐</span>}
            title="Business Hours"
            description="Define when you are available for messages"
            href="/marketing/business-hours"
          />
        </div>
      </section>

      {/* Planned Capabilities - Roadmap Section */}
      <section style={{ marginTop: '3rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 className="text-xl font-semibold text-primary">Planned Capabilities</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Group: Campaign Hub */}
          <div>
            <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">Campaign Hub</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
            <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">Multi-Channel Publishing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
            <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">AI Assisted Writing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
            <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">Visual Assets</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
            <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">Audience Targeting</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
            <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">Performance Feedback</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
            <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">Smart Suggestions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
      <div style={{ marginTop: '3rem' }} className="rounded-xl border border-[hsl(var(--brand-orange))]/20 bg-gradient-to-br from-[hsl(var(--brand-orange))]/5 to-[hsl(var(--brand-teal))]/5 p-4">
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
