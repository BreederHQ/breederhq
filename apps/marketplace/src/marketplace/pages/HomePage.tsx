// apps/marketplace/src/marketplace/pages/HomePage.tsx
// Marketplace home page with IA navigation cards
import * as React from "react";
import { Link } from "react-router-dom";

interface NavCardProps {
  title: string;
  description: string;
  ctaLabel: string;
  href?: string;
  disabled?: boolean;
  badge?: string;
}

function NavCard({ title, description, ctaLabel, href, disabled, badge }: NavCardProps) {
  const cardContent = (
    <div
      className={`rounded-portal border border-border-subtle bg-portal-card p-6 flex flex-col h-full transition-colors ${
        disabled ? "opacity-60" : "hover:bg-portal-card-hover hover:border-border-default"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {badge && (
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-text-muted/20 text-text-tertiary border border-text-muted/30 whitespace-nowrap">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-text-secondary mb-6 flex-grow">{description}</p>
      <div>
        <span
          className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-portal-xs transition-colors ${
            disabled
              ? "bg-border-default text-text-muted cursor-not-allowed"
              : "bg-accent text-white hover:bg-accent-hover"
          }`}
        >
          {ctaLabel}
        </span>
      </div>
    </div>
  );

  if (disabled || !href) {
    return <div className="cursor-not-allowed">{cardContent}</div>;
  }

  return (
    <Link to={href} className="block">
      {cardContent}
    </Link>
  );
}

/**
 * Marketplace home page - entry point with navigation cards.
 */
export function HomePage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
          Marketplace
        </h1>
        <p className="text-sm text-text-tertiary mt-1">
          Browse litters, learn about breeders, and send an inquiry.
        </p>
      </div>

      {/* Navigation cards - 3-up grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NavCard
          title="Litters"
          description="Browse available litters and view offspring details."
          ctaLabel="Browse litters"
          href="/litters"
        />
        <NavCard
          title="Breeders"
          description="Explore breeders and what they publish."
          ctaLabel="Browse breeders"
          href="/breeders"
        />
        <NavCard
          title="Services"
          description="Stud services, guardianship, and breeder offerings."
          ctaLabel="Browse services"
          disabled
          badge="Coming soon"
        />
      </div>

      {/* MVP scope note */}
      <p className="text-xs text-text-muted">
        Messaging, notifications, and watchlists arrive in a later phase.
      </p>
    </div>
  );
}
