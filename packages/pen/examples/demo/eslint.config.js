import { defineConfig } from 'eslint/config'
import penEslintConfig from '@idlesummer/pen/eslint-config'

export default defineConfig([
  ...penEslintConfig,
  {
    ignores: ['.pen/**'],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            'eslint.config.js',
            'pen.config.ts',
          ],
        },
      },
    },
  },
])
