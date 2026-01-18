import * as React from "react";
import { PageHeader, Button } from "@bhq/ui";

/* ───────────────── Styles ───────────────── */

const pageStyles = `
  .hub-card {
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-top-color: rgba(255, 255, 255, 0.15) !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
  }

  .hub-card:hover {
    border-color: rgba(255, 255, 255, 0.2) !important;
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.08), 0 12px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
    transform: translateY(-2px);
  }

  .config-card {
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-top-color: rgba(255, 255, 255, 0.15) !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
  }

  .open-hub-btn {
    background: linear-gradient(180deg, #e87924 0%, #c45a10 100%) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
    transition: all 0.2s ease !important;
  }

  .open-hub-btn:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25) !important;
    transform: translateY(-1px);
  }

  @keyframes subtle-pulse {
    0%, 100% { opacity: 0.85; }
    50% { opacity: 1; }
  }

  .hub-icons {
    animation: subtle-pulse 3s ease-in-out infinite;
  }
`;

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
      className="group rounded-lg p-4 cursor-pointer transition-all relative border border-hairline hover:border-white/20 bg-surface hover:bg-white/[0.03]"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-md bg-white/[0.05] border border-hairline flex items-center justify-center text-secondary group-hover:text-primary transition-colors">
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

/* ───────────────── Config Row (for Configure Your Hub) ───────────────── */

interface ConfigRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  accentColor: string;
  isLast?: boolean;
}

function ConfigRow({ icon, title, description, href, accentColor, isLast }: ConfigRowProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState(null, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className={`px-3 py-2 ${!isLast ? 'border-b border-hairline' : ''}`}>
      <a
        href={href}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group flex items-center gap-4 px-3 py-3 cursor-pointer transition-all duration-150 rounded-lg"
        style={{
          outline: isHovered ? '2px solid #6b7280' : '2px solid transparent',
          backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
        }}
      >
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center transition-colors duration-150">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="font-medium text-sm transition-colors duration-150"
            style={{ color: isHovered ? '#fff' : accentColor }}
          >
            {title}
          </div>
          <p className="mt-0.5 text-xs text-secondary">{description}</p>
        </div>
        <svg
          className="w-4 h-4 transition-all duration-150"
          style={{ color: isHovered ? accentColor : 'rgb(75, 85, 99)' }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </div>
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
      <style>{pageStyles}</style>
      {/* Page Header */}
      <PageHeader
        title="Marketing"
        subtitle="Plan it, write it, post it and track it - all in one place!"
      />

      {/* Communications Hub + Configure Your Hub - Side by Side */}
      <section className="mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Communications Hub - Primary Action */}
          <div
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState(null, "", "/marketing/hub");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            className="hub-card relative rounded-xl transition-all duration-200 overflow-hidden cursor-pointer group flex flex-col justify-between bg-surface"
            style={{ minHeight: '260px' }}
          >
            {/* Hover overlay */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/[0.02]" />

            {/* Top section with icon */}
            <div className="relative p-6 pb-2 flex justify-center items-center flex-1">
              <div className="hub-icons flex items-center gap-4">
                <ChatIcon className="w-16 h-16" />
                <EmailIcon className="w-16 h-16" />
              </div>
            </div>

            {/* Bottom content */}
            <div className="relative p-6 pt-0">
              <h3 className="text-lg font-semibold text-primary text-center">Communications Hub</h3>
              <p className="mt-1 text-sm text-secondary text-center">
                Messages, emails, and templates in one unified inbox
              </p>
              <div className="mt-4 flex justify-center">
                <Button
                  size="md"
                  className="open-hub-btn w-full"
                >
                  Open Hub
                  <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Configure Your Hub */}
          <div
            className="config-card rounded-xl bg-surface flex flex-col"
          >
            <div className="px-5 py-4 border-b border-hairline">
              <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide">Configure Your Hub</h2>
            </div>
            <div className="flex flex-col flex-1">
              <ConfigRow
                icon={<span className="text-base">📦</span>}
                title="Document Bundles"
                description="Group documents together for easy email attachments"
                href="/marketing/document-bundles"
                accentColor="#f59e0b"
              />
              <ConfigRow
                icon={<span className="text-base">⚡</span>}
                title="Auto Replies"
                description="Set up automatic responses to common inquiries"
                href="/marketing/auto-replies"
                accentColor="#14b8a6"
              />
              <ConfigRow
                icon={<span className="text-base">🕐</span>}
                title="Business Hours"
                description="Define when you are available for messages"
                href="/marketing/business-hours"
                accentColor="#8b5cf6"
                isLast
              />
            </div>
          </div>
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
