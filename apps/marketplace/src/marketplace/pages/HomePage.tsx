// apps/marketplace/src/marketplace/pages/HomePage.tsx
// Marketplace home page with 5 primary navigation cards
import * as React from "react";
import { Link } from "react-router-dom";

interface NavCardProps {
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
}

function NavCard({ title, description, ctaLabel, href }: NavCardProps) {
  return (
    <Link to={href} className="block">
      <div className="rounded-portal border border-border-subtle bg-portal-card p-6 flex flex-col h-full transition-colors hover:bg-portal-card-hover hover:border-border-default">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-text-secondary mb-6 flex-grow">{description}</p>
        <div>
          <span className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-portal-xs bg-accent text-white hover:bg-accent-hover transition-colors">
            {ctaLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * Marketplace home page - entry point with 5 navigation cards.
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
          Browse animals, explore breeders, and request information.
        </p>
      </div>

      {/* Navigation cards - responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <NavCard
          title="Animals"
          description="Browse available animals and view details."
          ctaLabel="Browse animals"
          href="/animals"
        />
        <NavCard
          title="Breeders"
          description="Explore breeders and their published listings."
          ctaLabel="Browse breeders"
          href="/breeders"
        />
        <NavCard
          title="Services"
          description="Stud services, guardianship, and breeder offerings."
          ctaLabel="Browse services"
          href="/services"
        />
        <NavCard
          title="Inquiries"
          description="View your sent inquiries and responses."
          ctaLabel="View inquiries"
          href="/inquiries"
        />
        <NavCard
          title="Updates"
          description="Notifications about your inquiry activity."
          ctaLabel="View updates"
          href="/updates"
        />
      </div>
    </div>
  );
}
