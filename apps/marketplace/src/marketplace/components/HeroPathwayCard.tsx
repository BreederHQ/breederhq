// apps/marketplace/src/marketplace/components/HeroPathwayCard.tsx
// Pathway card component for hero section - represents one of three audience pathways

import * as React from "react";
import { Link } from "react-router-dom";

export interface HeroPathwayCardProps {
  variant: "neutral" | "breeder" | "provider";
  icon: React.ReactNode;
  title: string;
  description: string;
  primaryCTA: {
    label: string;
    href: string;
  };
  secondaryCTA?: {
    label: string;
    href: string;
    external?: boolean;
  };
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M14 5l7 7m0 0l-7 7m7-7H3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const variantStyles = {
  neutral: {
    card: "border-border-subtle bg-portal-card hover:border-border-default",
    iconBg: "bg-white/10",
    iconColor: "text-white",
    primaryButton: "border border-white/20 bg-transparent text-white hover:bg-white/10",
  },
  breeder: {
    card: "border-[hsl(var(--brand-blue))]/30 bg-[hsl(var(--brand-blue))]/5 hover:border-[hsl(var(--brand-blue))]/50",
    iconBg: "bg-[hsl(var(--brand-blue))]/20",
    iconColor: "text-[hsl(var(--brand-blue))]",
    primaryButton: "bg-[hsl(var(--brand-blue))] text-white hover:bg-[hsl(var(--brand-blue))]/90",
  },
  provider: {
    card: "border-[hsl(var(--brand-teal))]/30 bg-[hsl(var(--brand-teal))]/5 hover:border-[hsl(var(--brand-teal))]/50",
    iconBg: "bg-[hsl(var(--brand-teal))]/20",
    iconColor: "text-[hsl(var(--brand-teal))]",
    primaryButton: "bg-[hsl(var(--brand-teal))] text-white hover:bg-[hsl(var(--brand-teal))]/90",
  },
};

export function HeroPathwayCard({
  variant,
  icon,
  title,
  description,
  primaryCTA,
  secondaryCTA,
}: HeroPathwayCardProps) {
  const styles = variantStyles[variant];

  return (
    <section
      className={`rounded-2xl border p-8 h-full flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-lg ${styles.card}`}
      aria-labelledby={`pathway-${variant}-title`}
    >
      {/* Icon */}
      <div className={`w-16 h-16 rounded-2xl ${styles.iconBg} flex items-center justify-center mb-5 mx-auto`}>
        <div className={styles.iconColor}>{icon}</div>
      </div>

      {/* Content */}
      <h3 id={`pathway-${variant}-title`} className="text-xl font-bold text-white mb-2 text-center">
        {title}
      </h3>
      <p className="text-sm text-text-secondary mb-5 text-center flex-grow">
        {description}
      </p>

      {/* CTAs */}
      <div className="space-y-2">
        <Link
          to={primaryCTA.href}
          className={`inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${styles.primaryButton}`}
          style={{ minHeight: "48px" }}
        >
          {primaryCTA.label}
          <ArrowRightIcon className="h-4 w-4" />
        </Link>

        {secondaryCTA && (
          secondaryCTA.external ? (
            <a
              href={secondaryCTA.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg border border-border-subtle text-text-secondary text-sm font-medium hover:text-white hover:border-border-default transition-colors"
              style={{ minHeight: "48px" }}
            >
              {secondaryCTA.label}
              <span className="text-xs">↗</span>
            </a>
          ) : (
            <Link
              to={secondaryCTA.href}
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg border border-border-subtle text-text-secondary text-sm font-medium hover:text-white hover:border-border-default transition-colors"
              style={{ minHeight: "48px" }}
            >
              {secondaryCTA.label}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          )
        )}
      </div>
    </section>
  );
}

export default HeroPathwayCard;
