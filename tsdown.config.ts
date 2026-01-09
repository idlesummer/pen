import path from 'path'
import alias from '@rollup/plugin-alias'
import { defineConfig } from 'tsdown'

const tsdownConfig = defineConfig({
  // Entry points
  entry: {
    'index': 'src/index.ts',
    'cli/index': 'src/cli/index.ts',
    // 'build/index': 'src/core/build/index.ts',   // temporary
    // 'router/index': 'src/core/router/index.ts', // temporary
  },

  // Generation
  dts: true,
  sourcemap: true,

  // External dependencies
  external: [
    'commander',
    'esbuild',
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
