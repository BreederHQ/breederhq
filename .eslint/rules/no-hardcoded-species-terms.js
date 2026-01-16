// .eslint/rules/no-hardcoded-species-terms.js
// Custom ESLint rule to prevent hardcoded species terminology

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded species-specific terminology. Use Species Terminology System instead.',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      hardcodedTerm: 'Avoid hardcoded "{{term}}". Use Species Terminology System: import { useSpeciesTerminology } from "@bhq/ui"',
    },
  },

  create(context) {
    // List of terms that should use the Species Terminology System
    const BANNED_TERMS = [
      // Offspring terms
      'puppy', 'puppies',
      'kitten', 'kittens',
      'foal', 'foals',
      'kit', 'kits',
      'kid', 'kids',
      'lamb', 'lambs',
      'piglet', 'piglets',
      'calf', 'calves',
      'chick', 'chicks',
      'cria', 'crias',

      // Birth process terms
      'whelping', 'whelped',
      'foaling', 'foaled',
      'kindling', 'kindled',
      'kidding', 'kidded',
      'lambing', 'lambed',
      'farrowing', 'farrowed',
      'calving', 'calved',
      'hatching', 'hatched',

      // Group terms
      'litter', 'litters',

      // Parent terms (be selective here)
      'mare', 'stallion',
      'doe', 'buck',
      'ewe', 'ram',
      'sow', 'boar',
      'hen', 'rooster',
    ];

    // Create regex pattern
    const pattern = new RegExp(`\\b(${BANNED_TERMS.join('|')})\\b`, 'i');

    return {
      // Check string literals
      Literal(node) {
        if (typeof node.value === 'string') {
          const match = node.value.match(pattern);
          if (match) {
            context.report({
              node,
              messageId: 'hardcodedTerm',
              data: {
                term: match[0],
              },
            });
          }
        }
      },

      // Check template literals
      TemplateLiteral(node) {
        node.quasis.forEach((quasi) => {
          const match = quasi.value.raw.match(pattern);
          if (match) {
            context.report({
              node: quasi,
              messageId: 'hardcodedTerm',
              data: {
                term: match[0],
              },
            });
          }
        });
      },
    };
  },
};
