import * as React from "react";
import {
  PageHeader,
  SectionCard,
  Badge,
} from "@bhq/ui";
import MessagesPage from "./pages/MessagesPage";

export default function AppMarketing() {
  const [pathname, setPathname] = React.useState(() => {
    try {
      return window.location.pathname.toLowerCase();
    } catch {
      return "/marketing";
    }
  });

  React.useEffect(() => {
    const onPop = () => setPathname(window.location.pathname.toLowerCase());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("bhq:module", {
          detail: { key: "marketing", label: "Marketing" },
        })
      );
    }
  }, []);

  const path = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  if (path === "/marketing/messages" || path.startsWith("/marketing/messages")) {
    return <MessagesPage />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Hero Section */}
      <div className="relative">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-[hsl(var(--brand-orange))]/20 to-[hsl(var(--brand-teal))]/20 border border-[hsl(var(--brand-orange))]/30 flex items-center justify-center text-3xl">
            📣
          </div>

          {/* Title & Subtitle */}
          <div className="flex-1 min-w-0">
            <PageHeader
              title="Marketing"
              subtitle="Plan it, write it, post it, and track it, all in one place."
            />
          </div>

          {/* Status Badge */}
          <div className="flex-shrink-0">
            <Badge variant="amber" className="text-xs">Coming Soon</Badge>
          </div>
        </div>

        {/* Status Note */}
        <div className="mt-4 rounded-lg border border-dashed border-hairline bg-surface-strong/50 p-3">
          <div className="flex items-start gap-2 text-xs text-secondary">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p>
              <strong className="font-semibold text-primary">Status:</strong> This is a preview of planned capabilities. Posting and automation are rolling out in phases.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex gap-3 mb-2">
        <a
          href="/marketing/messages"
          className="px-4 py-2 rounded-md bg-surface border border-hairline hover:border-[hsl(var(--brand-orange))]/40 text-sm text-primary transition-colors"
        >
          Direct Messages
        </a>
      </div>

      {/* What This Helps You Do - Split Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard
          title={
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M18 9l-5 5-4-4-4 4" />
              </svg>
              <span>Grow Demand and Visibility</span>
            </div>
          }
          className="h-full"
        >
          <ul className="space-y-2 text-sm text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--brand-orange))] mt-0.5">•</span>
              <span>Announce litters, availability, and milestones</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--brand-orange))] mt-0.5">•</span>
              <span>Promote services, offspring, and programs</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--brand-orange))] mt-0.5">•</span>
              <span>Stay visible without juggling tools</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--brand-orange))] mt-0.5">•</span>
              <span>Keep your brand consistent everywhere</span>
            </li>
          </ul>
        </SectionCard>

        <SectionCard
          title={
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <span>Turn Ideas into Action</span>
            </div>
          }
          className="h-full"
        >
          <ul className="space-y-2 text-sm text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--brand-teal))] mt-0.5">•</span>
              <span>Plan campaigns once, reuse everywhere</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--brand-teal))] mt-0.5">•</span>
              <span>Get help writing posts that sound like you</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--brand-teal))] mt-0.5">•</span>
              <span>Schedule and track outreach in one calendar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--brand-teal))] mt-0.5">•</span>
              <span>Spend less time marketing, get more serious inquiries</span>
            </li>
          </ul>
        </SectionCard>
      </div>

      {/* Feature Grid */}
      <SectionCard title="Planned Capabilities">
        <div className="space-y-8">
          {/* Group: Campaign Hub */}
          <div>
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wide mb-4">Campaign Hub</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureCard
                icon="📅"
                title="Campaign Planning"
                description="Litter announcements, planned breedings, availability, services, and milestones."
              />
              <FeatureCard
                icon="🗓️"
                title="Central Calendar"
                description="See what is planned, posted, and coming up."
              />
            </div>
          </div>

          {/* Group: Multi-Channel Publishing */}
          <div>
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wide mb-4">Multi-Channel Publishing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureCard
                icon="📱"
                title="Social Media"
                description="Facebook and Instagram business pages."
              />
              <FeatureCard
                icon="✉️"
                title="Email and SMS"
                description="Reach waitlists, past buyers, and approved breeders."
              />
              <FeatureCard
                icon="🌐"
                title="BreederHQ Surfaces"
                description="Public profile and Marketplace visibility."
              />
            </div>
          </div>

          {/* Group: AI Assisted Writing */}
          <div>
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wide mb-4">AI Assisted Writing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureCard
                icon="✍️"
                title="Post Creation Help"
                description="Turn a few details into ready to post copy."
              />
              <FeatureCard
                icon="🎨"
                title="Tone and Format Adaptation"
                description="Different styles for social, email, and text."
              />
              <FeatureCard
                icon="🔄"
                title="Multiple Variations"
                description="Pick what fits your voice and audience."
              />
            </div>
          </div>

          {/* Group: Visual Assets */}
          <div>
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wide mb-4">Visual Assets</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureCard
                icon="📸"
                title="Image and Caption Support"
                description="Pair photos with clear, engaging captions."
              />
              <FeatureCard
                icon="⭐"
                title="Program and Litter Highlights"
                description="Spotlight animals, services, and milestones."
              />
            </div>
          </div>

          {/* Group: Audience Targeting */}
          <div>
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wide mb-4">Audience Targeting</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureCard
                icon="👥"
                title="Simple Audience Selection"
                description="Past buyers, waitlist, breeders, public."
              />
              <FeatureCard
                icon="🎯"
                title="Right Message, Right People"
                description="Avoid overposting or misdirected outreach."
              />
            </div>
          </div>

          {/* Group: Performance Feedback */}
          <div>
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wide mb-4">Performance Feedback</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureCard
                icon="📊"
                title="What Works"
                description="Views, clicks, and inquiries."
              />
              <FeatureCard
                icon="💡"
                title="What Drives Interest"
                description="See which posts lead to real conversations."
              />
            </div>
          </div>

          {/* Group: Smart Suggestions */}
          <div>
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wide mb-4">Smart Suggestions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureCard
                icon="🔔"
                title="Helpful Reminders"
                description="Upcoming litters, go home weeks, seasonal moments."
              />
              <FeatureCard
                icon="🧭"
                title="Quiet Guidance"
                description="Suggestions based on activity and interest."
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Roadmap */}
      <SectionCard
        title={
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <span>Development Roadmap</span>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <RoadmapPhase
            number="1"
            title="Phase 1"
            description="Campaign planning, AI copy help, manual posting support."
          />
          <RoadmapPhase
            number="2"
            title="Phase 2"
            description="Social publishing integrations, email and SMS outreach."
          />
          <RoadmapPhase
            number="3"
            title="Phase 3"
            description="Performance insights, smart reminders, content reuse."
          />
          <RoadmapPhase
            number="4"
            title="Phase 4"
            description="Deep Marketplace and Discovery integration."
          />
        </div>
      </SectionCard>

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

/* ───────────────── Supporting Components ───────────────── */

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface p-3 hover:border-[hsl(var(--brand-orange))]/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-2xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-primary mb-1">{title}</div>
          <p className="text-xs text-secondary leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

function RoadmapPhase({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-strong/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--brand-orange))] text-white flex items-center justify-center text-xs font-bold">
          {number}
        </div>
        <div className="font-semibold text-sm text-primary">{title}</div>
      </div>
      <p className="text-xs text-secondary leading-relaxed">{description}</p>
    </div>
  );
}
