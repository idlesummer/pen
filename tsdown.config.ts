import path from 'path'
import alias from '@rollup/plugin-alias'
import { defineConfig } from 'tsdown'

const tsdownConfig = defineConfig({
  // Entry points
  entry: {
    'index': 'src/index.ts',
    'cli/index': 'src/cli/index.ts',
  },

  // Generation
  dts: true,
  sourcemap: true,

  // External dependencies
  external: [
    'commander',
    'rolldown',
    'chokidar',
    'react',
    'react-dom',
    'ink',
  ],

  // Build customization (Rolldown-style)
  plugins: [
    alias({
      // Equivalent to: options.alias = { ...options.alias, '@': './src' }
      entries: [{ find: '@', replacement: path.resolve(import.meta.dirname, 'src') }],
    }),
  ],
})

export default tsdownConfig
