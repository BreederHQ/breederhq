// apps/marketplace/src/marketplace/components/HeroPathwayCard.tsx
// Pathway card component for hero section - bold, clickable cards that command attention

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

// Bold cards - each card IS a clickable action, not just a container
const variantStyles = {
  neutral: {
    card: "bg-white border-2 border-gray-200 hover:border-[hsl(var(--brand-orange))] hover:shadow-2xl hover:shadow-orange-500/20 shadow-xl hover:-translate-y-1",
    iconBg: "bg-gradient-to-br from-[hsl(var(--brand-orange))] to-orange-600",
    iconColor: "text-white",
    titleColor: "text-gray-900",
    button: "bg-[hsl(var(--brand-orange))] text-white hover:bg-orange-600 shadow-lg shadow-orange-500/30",
    secondaryLink: "text-gray-600 hover:text-[hsl(var(--brand-orange))]",
  },
  breeder: {
    card: "bg-white border-2 border-gray-200 hover:border-[hsl(var(--brand-blue))] hover:shadow-2xl hover:shadow-blue-500/20 shadow-xl hover:-translate-y-1",
    iconBg: "bg-gradient-to-br from-[hsl(var(--brand-blue))] to-blue-700",
    iconColor: "text-white",
    titleColor: "text-gray-900",
    button: "bg-[hsl(var(--brand-blue))] text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30",
    secondaryLink: "text-gray-600 hover:text-[hsl(var(--brand-blue))]",
  },
  provider: {
    card: "bg-white border-2 border-gray-200 hover:border-[hsl(var(--brand-teal))] hover:shadow-2xl hover:shadow-teal-500/20 shadow-xl hover:-translate-y-1",
    iconBg: "bg-gradient-to-br from-[hsl(var(--brand-teal))] to-teal-600",
    iconColor: "text-white",
    titleColor: "text-gray-900",
    button: "bg-[hsl(var(--brand-teal))] text-white hover:bg-teal-600 shadow-lg shadow-teal-500/30",
    secondaryLink: "text-gray-600 hover:text-[hsl(var(--brand-teal))]",
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
      className={`rounded-2xl p-8 md:p-10 h-full flex flex-col transition-all duration-200 ${styles.card}`}
      aria-labelledby={`pathway-${variant}-title`}
    >
      {/* Large Icon - 20x20 with big icon inside */}
      <div className={`w-20 h-20 rounded-2xl ${styles.iconBg} flex items-center justify-center mb-6 mx-auto shadow-xl`}>
        <div className={`${styles.iconColor} [&>svg]:w-10 [&>svg]:h-10`}>{icon}</div>
      </div>

      {/* Content */}
      <h3 id={`pathway-${variant}-title`} className={`text-2xl md:text-3xl font-bold ${styles.titleColor} mb-3 text-center`}>
        {title}
      </h3>
      <p className="text-base md:text-lg text-gray-600 mb-8 text-center flex-grow leading-relaxed">
        {description}
      </p>

      {/* Primary CTA - Bold Button */}
      <div className="space-y-3">
        <Link
          to={primaryCTA.href}
          className={`inline-flex items-center justify-center gap-2 w-full py-4 px-6 text-lg font-bold rounded-xl transition-all hover:scale-[1.02] ${styles.button}`}
        >
          {primaryCTA.label}
          <ArrowRightIcon className="h-5 w-5" />
        </Link>

        {secondaryCTA && (
          secondaryCTA.external ? (
            <a
              href={secondaryCTA.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center gap-1.5 w-full py-2.5 text-sm font-semibold transition-colors ${styles.secondaryLink}`}
            >
              {secondaryCTA.label}
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          ) : (
            <Link
              to={secondaryCTA.href}
              className={`inline-flex items-center justify-center gap-1.5 w-full py-2.5 text-sm font-semibold transition-colors ${styles.secondaryLink}`}
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
