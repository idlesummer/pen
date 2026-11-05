import { defineConfig } from 'eslint/config'
import penEslintConfig from '@idlesummer/pen/eslint-config'

export default defineConfig([
  // Recommended ESLint configs from Pen
  ...penEslintConfig,
  {
    ignores: ['.pen/**'],
  },
  {
    languageOptions: {
      parserOptions: {
        // Enable project service for better TypeScript integration
        projectService: {
          allowDefaultProject: ['eslint.config.js', 'pen.config.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
