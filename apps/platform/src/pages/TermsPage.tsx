// apps/platform/src/pages/TermsPage.tsx
// Terms of Service page for Platform
import * as React from "react";
import { TermsContent } from "@bhq/ui";
import logoUrl from "@bhq/ui/assets/logo.png";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-page text-primary">
      {/* Simple header */}
      <header className="border-b border-hairline bg-surface">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-3 hover:opacity-90 transition-opacity text-primary no-underline"
          >
            <img
              src={logoUrl}
              alt="BreederHQ"
              className="w-10 h-10 object-contain"
            />
            <span className="text-lg font-semibold">BreederHQ</span>
          </a>
          <a
            href="/"
            className="text-sm text-secondary hover:text-primary transition-colors no-underline"
          >
            Back to Dashboard
          </a>
        </div>
      </header>

      {/* Terms content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <TermsContent style={{ color: "inherit" }} />
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline py-6">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-secondary">
          <p>&copy; {new Date().getFullYear()} BreederHQ LLC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
