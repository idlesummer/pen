// Build configuration (tsdown)
// - Controls what gets built, bundled, and emitted
// - Uses tsconfig.json for TypeScript resolution and declaration rules
// - Owns entry points, output format, sourcemaps, declarations, and externals

import { defineConfig } from 'tsdown'

const tsdownConfig = defineConfig({
  // TypeScript config
  tsconfig: './tsconfig.json',

  // Entry points
  entry: {
    'index': 'src/index.ts',
    'bin': 'src/bin.ts',
  },

  // Output
  sourcemap: true,
  dts: true,

  // External dependencies
  external: [
    'commander',
    'rolldown',
    'chokidar',
    'react',
    'react-dom',
    'ink',
  ],
})

export default tsdownConfig
