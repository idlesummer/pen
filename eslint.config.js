import eslintReact from '@eslint-react/eslint-plugin'
import eslintJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

// Same check as core no-undef, except __LIKE_THIS__ names are codegen
// placeholders substituted into templates before they ever run - not real
// identifiers - so they're exempt instead of allowlisted one by one.
const TOKEN_PATTERN = /^__[A-Z0-9_]+__$/
const noUndefExceptTokens = {
  rules: {
    'no-undef-except-tokens': {
      create(context) {
        return {
          'Program:exit'(node) {
            for (const ref of context.sourceCode.getScope(node).through) {
              if (!TOKEN_PATTERN.test(ref.identifier.name))
                context.report({ node: ref.identifier, message: `'${ref.identifier.name}' is not defined.` })
            }
          },
        }
      },
    },
  },
}

export default defineConfig(
  {
    ignores: ['**/.*/**', 'dist'],
  },
  {
    files: ['**/*.{js,ts,jsx,tsx}', '**/*.tsx.txt', '**/*.ts.txt'],

    // Extend recommended rule sets from:
    // 1. ESLint JS's recommended rules
    // 2. TypeScript ESLint recommended rules
    // 3. ESLint React's recommended-typescript rules
    extends: [
      eslintJs.configs.recommended,
      tseslint.configs.recommended,
      eslintReact.configs['recommended-typescript'],
    ],

    // Configure language/parsing options
    languageOptions: {
      // Use TypeScript ESLint parser for TypeScript files
      parser: tseslint.parser,
      parserOptions: {
        // Enable project service for better TypeScript integration
        projectService: {
          allowDefaultProject: ['eslint.config.js'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },

    // Custom rule overrides
    rules: {
      '@eslint-react/no-missing-key': 'warn',
      'comma-dangle': ['warn', 'always-multiline'],
      'eol-last': ['warn', 'always'],
      'object-curly-spacing': ['warn', 'always'],
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'semi': ['warn', 'never'],
    },
  },
  {
    // Template files aren't part of any tsconfig project, and the project
    // service always treats unknown extensions as plain TS - so parse these
    // standalone (no type info) and tell the parser directly whether to
    // expect JSX instead of inferring it from the (non-standard) extension.
    files: ['**/*.ts.txt', '**/*.tsx.txt'],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: false,
      },
    },
  },
  {
    files: ['**/*.tsx.txt'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
  {
    // Templates reference ambient .d.ts files stripped out at scaffold time -
    // not a real import the rule below can see.
    files: ['**/*.ts.txt', '**/*.tsx.txt'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
  {
    files: ['**/*.ts.txt', '**/*.tsx.txt'],
    plugins: { local: noUndefExceptTokens },
    rules: {
      'no-undef': 'off',
      'local/no-undef-except-tokens': 'error',
    },
  },
)
