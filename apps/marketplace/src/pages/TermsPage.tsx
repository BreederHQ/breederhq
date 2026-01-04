// apps/marketplace/src/pages/TermsPage.tsx
// Terms of Service page for Marketplace
import * as React from "react";
import { Link } from "react-router-dom";
import { TermsContent } from "@bhq/ui";

import logoUrl from "@bhq/ui/assets/logo.png";

export function TermsPage() {
  return (
    <div className="min-h-screen bg-portal-bg text-white font-sans antialiased">
      {/* Simple header */}
      <header className="border-b border-border-subtle bg-portal-elevated">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img src={logoUrl} alt="BreederHQ" className="w-10 h-10 object-contain" />
            <span className="text-lg font-semibold">BreederHQ Marketplace</span>
          </Link>
          <Link
            to="/"
            className="text-sm text-text-secondary hover:text-white transition-colors"
          >
            Back to Marketplace
          </Link>
        </div>
      </header>

      {/* Terms content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <TermsContent
          style={{
            color: "inherit",
          }}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-6">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-text-tertiary">
          <p>&copy; {new Date().getFullYear()} BreederHQ LLC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default TermsPage;
