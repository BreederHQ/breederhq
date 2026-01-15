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
    card: "border-border-default bg-portal-elevated hover:border-[#FF6B35]/30 hover:shadow-xl",
    iconBg: "bg-[#FF6B35]/10",
    iconColor: "text-[#FF6B35]",
    primaryButton: "bg-[#FF6B35] text-white hover:bg-[#FF8555] shadow-md",
  },
  breeder: {
    card: "border-border-default bg-portal-elevated hover:border-[#FF6B35]/30 hover:shadow-xl",
    iconBg: "bg-[#FF6B35]/10",
    iconColor: "text-[#FF6B35]",
    primaryButton: "bg-[#FF6B35] text-white hover:bg-[#FF8555] shadow-md",
  },
  provider: {
    card: "border-border-default bg-portal-elevated hover:border-[#FF6B35]/30 hover:shadow-xl",
    iconBg: "bg-[#FF6B35]/10",
    iconColor: "text-[#FF6B35]",
    primaryButton: "bg-[#FF6B35] text-white hover:bg-[#FF8555] shadow-md",
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
      className={`rounded-2xl border p-12 h-full flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-lg ${styles.card}`}
      aria-labelledby={`pathway-${variant}-title`}
    >
      {/* Icon */}
      <div className={`w-24 h-24 rounded-2xl ${styles.iconBg} flex items-center justify-center mb-8 mx-auto`}>
        <div className={`${styles.iconColor} scale-150`}>{icon}</div>
      </div>

      {/* Content */}
      <h3 id={`pathway-${variant}-title`} className="text-3xl font-bold text-white mb-4 text-center">
        {title}
      </h3>
      <p className="text-lg text-text-secondary mb-8 text-center flex-grow leading-relaxed">
        {description}
      </p>

      {/* CTAs */}
      <div className="space-y-3">
        <Link
          to={primaryCTA.href}
          className={`inline-flex items-center justify-center gap-3 w-full px-8 py-4 rounded-lg text-lg font-semibold transition-colors ${styles.primaryButton}`}
          style={{ minHeight: "60px" }}
        >
          {primaryCTA.label}
          <ArrowRightIcon className="h-6 w-6" />
        </Link>

        {secondaryCTA && (
          secondaryCTA.external ? (
            <a
              href={secondaryCTA.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 w-full px-8 py-3 rounded-lg border border-border-subtle text-text-secondary text-lg font-medium hover:text-white hover:border-border-default transition-colors"
              style={{ minHeight: "56px" }}
            >
              {secondaryCTA.label}
              <ArrowRightIcon className="h-5 w-5" />
            </a>
          ) : (
            <Link
              to={secondaryCTA.href}
              className="inline-flex items-center justify-center gap-3 w-full px-8 py-3 rounded-lg border border-border-subtle text-text-secondary text-lg font-medium hover:text-white hover:border-border-default transition-colors"
              style={{ minHeight: "56px" }}
            >
              {secondaryCTA.label}
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
          )
        )}
      </div>
    </section>
  );
}

export default HeroPathwayCard;
