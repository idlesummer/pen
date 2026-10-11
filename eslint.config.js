import eslintReact from '@eslint-react/eslint-plugin'
import eslintJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

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
    // They also reference ambient .d.ts files stripped out at scaffold time -
    // not a real import for the triple-slash rule to flag.
    files: ['**/*.ts.txt', '**/*.tsx.txt'],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: false,
      },
    },
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
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
)
