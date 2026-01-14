// Build configuration (tsdown)
// - Controls what gets built, bundled, and emitted
// - Uses tsconfig.json for TypeScript resolution and declaration rules
// - Owns entry points, output format, sourcemaps, declarations, and externals

import { defineConfig } from 'tsdown'

// Import package.json ONLY at build time.
// This is safe because this file is never shipped to users.
import pkg from './package.json' assert { type: 'json' }

const tsdownConfig = defineConfig({
  // TypeScript config
  tsconfig: './tsconfig.json',

  // Entry points
  entry: {
    index: 'src/index.ts',  // library api
    bin: 'src/bin.ts',      // cli executable entry
  },

  // Output options
  sourcemap: true,
  dts: true,

  // Build-time constant injection (values are replaced at build time)
  define: {
    __VERSION__: JSON.stringify(pkg.version),
    __PACKAGE_NAME__: JSON.stringify(pkg.name),
  },

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
