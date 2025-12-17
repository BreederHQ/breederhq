// eslint.config.js (repo root) - ESLint v9 flat config
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/node_modules/**",

      "**/*.old",
      "**/*.copy",
      "**/*.bak",
      "**/*.old.*",
      "**/*.copy.*",
      "**/*.bak.*",

      "scripts/codemods/**",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Quiet mode: turn off noisy rules repo-wide
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-undef": "off",
    },
  },

  // The only thing we care about for Step 3: legacy import bans
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    // Ignore legacy scratch files
    "**/*.old",
    "**/*.old.*",
    "**/*.copy",
    "**/*.copy.*",
    "**/*.bak",
    "**/*.bak.*",
    "**/* - Copy.*",
    "**/* - New* Copy.*",
    "**/*.old.old",
    "**/*.old.old.*",
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@bhq/ui/utils/breedingMath",
              message: "Legacy breedingMath import banned. Use reproEngine.",
            },
            {
              name: "@bhq/ui/hooks/useCyclePlanner",
              message: "Legacy useCyclePlanner import banned. Use reproEngine.",
            },
            {
              name: "./breedingMath",
              message: "Legacy breedingMath import banned. Use reproEngine.",
            },
            {
              name: "../utils/breedingMath",
              message: "Legacy breedingMath import banned. Use reproEngine.",
            },
            {
              name: "../utils/breedingMath.ts",
              message: "Legacy breedingMath import banned. Use reproEngine.",
            },
          ],
          patterns: [
            {
              group: ["**/utils/breedingMath", "**/utils/breedingMath.ts"],
              message: "Legacy breedingMath import banned. Use reproEngine.",
            },
          ],
        },
      ],
    },
  },
];
