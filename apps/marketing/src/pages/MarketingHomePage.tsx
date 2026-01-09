import * as React from "react";
import { PageHeader, Button } from "@bhq/ui";

/* ───────────────── Icons ───────────────── */

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="chatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e87924" />
          <stop offset="100%" stopColor="#c45a10" />
        </linearGradient>
      </defs>
      {/* Main chat bubble */}
      <path
        d="M8 12 h40 a6 6 0 0 1 6 6 v20 a6 6 0 0 1-6 6 h-24 l-12 10 v-10 h-4 a6 6 0 0 1-6-6 v-20 a6 6 0 0 1 6-6z"
        stroke="url(#chatGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Three dots for typing/message indicator - horizontally centered in bubble */}
      <circle cx="17" cy="28" r="3" fill="url(#chatGradient)" />
      <circle cx="29" cy="28" r="3" fill="url(#chatGradient)" />
      <circle cx="41" cy="28" r="3" fill="url(#chatGradient)" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="emailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e87924" />
          <stop offset="100%" stopColor="#c45a10" />
        </linearGradient>
      </defs>
      {/* Main envelope body */}
      <rect x="6" y="14" width="52" height="40" rx="4" stroke="url(#emailGradient)" strokeWidth="3" fill="none" />
      {/* Envelope flap / V shape */}
      <path d="M6 22 L32 38 L58 22" stroke="url(#emailGradient)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
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
}

function PrimaryTile({ title, description, buttonLabel, href, icon }: PrimaryTileProps) {
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
      {/* Live pill in top-left */}
      <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
        <span
          className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: '#16a34a',
            color: '#fff',
          }}
        >
          Live
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
            backgroundColor: '#16a34a',
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

      {/* Communications Hub - Hero Section */}
      <section className="mt-8">
        <div
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState(null, "", "/marketing/hub");
            window.dispatchEvent(new PopStateEvent("popstate"));
          }}
          className="relative rounded-2xl hover:brightness-110 transition-all overflow-hidden cursor-pointer group"
          style={{
            background: 'linear-gradient(135deg, rgba(232, 121, 36, 0.15) 0%, rgba(20, 184, 166, 0.1) 100%)',
            border: '2px solid rgba(232, 121, 36, 0.3)',
            height: '180px',
          }}
        >
          {/* Animated gradient border effect */}
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(232, 121, 36, 0.3) 0%, rgba(20, 184, 166, 0.2) 100%)',
            }}
          />

          {/* Live pill */}
          <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
            <span
              className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full animate-pulse"
              style={{
                backgroundColor: '#16a34a',
                color: '#fff',
              }}
            >
              Live
            </span>
          </div>

          {/* Icon cluster in top-right */}
          <div style={{ position: 'absolute', top: '16px', right: '24px' }} className="flex gap-2">
            <ChatIcon className="w-16 h-16 opacity-80" />
            <EmailIcon className="w-16 h-16 opacity-80" />
          </div>

          {/* Content */}
          <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px' }}>
            <h3 className="text-2xl font-bold text-primary">Communications Hub</h3>
            <p className="mt-1 text-sm text-secondary">
              All your messages, emails, and templates unified in one powerful inbox
            </p>
            <div className="mt-4">
              <Button>
                Open Hub
                <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access - Secondary Section */}
      <section className="mt-6">
        <div style={{ marginBottom: '1rem' }}>
          <h2 className="text-lg font-semibold text-primary">Quick Access</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PrimaryTile
            title="Messages"
            description="Private conversations with clients."
            buttonLabel="Open Inbox"
            href="/marketing/messages"
            icon={<ChatIcon className="w-20 h-20" />}
          />
          <PrimaryTile
            title="Email Templates"
            description="Reusable emails, DM replies, announcements."
            buttonLabel="Manage Templates"
            href="/marketing/templates"
            icon={<EmailIcon className="w-20 h-20" />}
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
