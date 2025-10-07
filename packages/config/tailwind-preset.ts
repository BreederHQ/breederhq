// packages/config/tailwind-preset.cjs
/** BHQ Tailwind preset (CommonJS shim for Tailwind runtime) */
module.exports = {
  darkMode: "class",

  theme: {
    extend: {
      // Token → utility mapping
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        surface: "hsl(var(--surface))",
        "surface-2": "hsl(var(--surface-2))",

        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",

        border: "hsl(var(--border))",

        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",

        teal: "hsl(var(--teal))",
      },

      // ring-accent / focus:ring-accent
      ringColor: {
        accent: "hsl(var(--accent))",
      },

      // preset canary: proves the preset is loaded
      spacing: { 13: "3.25rem" },
    },
  },

  // preset canary: utility exists only if preset is loaded
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".bhq-preset-ok": {
          outline: "3px dashed #ff9800",
          outlineOffset: "3px",
        },
      });
    },
  ],
};
