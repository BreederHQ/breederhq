// apps/platform/tailwind.config.cjs
// Uses the shared preset from packages/tw-preset (keep if you already rely on it)
const preset = require('../../packages/tw-preset');

module.exports = {
  presets: [preset],
  darkMode: 'class',

  // IMPORTANT: Make sure Tailwind scans *both* the Platform app and the Contacts app,
  // plus your shared UI package. This is what lets arbitrary utilities from Contacts
  // (e.g. grid-cols-[116px_1fr]) actually be emitted in the Platform build.
  content: [
    // Platform app
    './index.html',
    './src/**/*.{ts,tsx,js,jsx,html}',

    // Shared UI package
    '../../packages/ui/src/**/*.{ts,tsx,js,jsx,html,css}',

    // Contacts app (rendered inside Platform)
    '../contacts/index.html',
    '../contacts/src/**/*.{ts,tsx,js,jsx,html}',

    // Marketplace app (embedded inside Platform)
    '../marketplace/src/**/*.{ts,tsx,js,jsx,html}',

    // Breeding app (embedded inside Platform)
    '../breeding/src/**/*.{ts,tsx,js,jsx,html}',
  ],

  theme: {
    extend: {
      // Portal-aligned colors (for embedded Marketplace)
      colors: {
        portal: {
          bg: "#08090a",
          elevated: "#0f1012",
          card: "#141618",
          "card-hover": "#1a1c1f",
        },
        "border-subtle": "#1a1c1e",
        "border-default": "#232528",
        accent: {
          DEFAULT: "#ff6b35",
          hover: "#ff8555",
          muted: "rgba(255, 107, 53, 0.15)",
        },
        "text-secondary": "#a8adb3",
        "text-tertiary": "#6b7280",
        "text-muted": "#4b5563",
      },
      borderRadius: {
        portal: "16px",
        "portal-sm": "12px",
        "portal-xs": "8px",
      },
      boxShadow: {
        portal: "0 4px 24px rgba(0, 0, 0, 0.4), 0 0 1px rgba(255, 255, 255, 0.05)",
        "portal-hover": "0 8px 32px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.4)",
      },
      maxWidth: {
        portal: "1200px",
      },
      height: {
        header: "64px",
      },
    },
  },

  // A tiny safety net so bracketed arbitrary classes don't get purged even if
  // you introduce new ones before updating content globs.
  safelist: [
    { pattern: /grid-cols-\[[^\]]+\]/ },
    { pattern: /w-\[[^\]]+\]/ },
    { pattern: /max-w-\[[^\]]+\]/ },
    { pattern: /h-\[[^\]]+\]/ },
    { pattern: /shadow-\[[^\]]+\]/ },
    { pattern: /bg-\[[^\]]+\](\/\d+)?/ },
    { pattern: /from-\[[^\]]+\]/ },
  ],
};
