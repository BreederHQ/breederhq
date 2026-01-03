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
  ],

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
