import eslintReact from '@eslint-react/eslint-plugin'
import eslintJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

export default defineConfig(
  {
    ignores: ['.pen/**'],
  },
  {
    // Extend recommended rule sets from:
    // 1. ESLint JS's recommended rules
    // 2. TypeScript ESLint recommended rules
    // 3. ESLint React's recommended-typescript rules
    extends: [
      eslintJs.configs.recommended,
      tseslint.configs.recommended,
      eslintReact.configs['recommended-typescript'],
    ],

    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
      },
    },

    rules: {
      '@eslint-react/no-missing-key': 'warn',
      // bans <Foo>x casts in favor of x as Foo, which doesn't collide with JSX
      '@typescript-eslint/consistent-type-assertions': 'error',
    },
  },
)
