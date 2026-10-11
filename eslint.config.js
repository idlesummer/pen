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
      // bans <Foo>x casts in favor of x as Foo, so forcing jsx mode below never changes their meaning
      '@typescript-eslint/consistent-type-assertions': 'error',
      'comma-dangle': ['warn', 'always-multiline'],
      'eol-last': ['warn', 'always'],
      'object-curly-spacing': ['warn', 'always'],
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'semi': ['warn', 'never'],
    },
  },
  {
    // Templates aren't in any tsconfig project, and the project service parses unknown
    // extensions as plain TS. So parse standalone (no type info) and set JSX explicitly
    files: ['**/*.ts.txt', '**/*.tsx.txt'],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: false,
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // The `/// <reference>` targets are stripped at scaffold time, so skip
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
)
