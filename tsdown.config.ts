// Build configuration (tsdown)
// - Controls what gets built, bundled, and emitted
// - Uses tsconfig.json for TypeScript resolution and declaration rules
// - Owns entry points, output format, sourcemaps, declarations, and externals

import { createRequire } from 'module'
import { defineConfig } from 'tsdown'

// Load package.json
const require = createRequire(import.meta.url)
const pkg = require('./package.json')

// Define main config
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

  // Build-time constant injection
  define: {
    __DESCRIPTION__: JSON.stringify(pkg.description),
    __PACKAGE_NAME__: JSON.stringify(pkg.name),
    __VERSION__: JSON.stringify(pkg.version),
  },

  // External dependencies
  external: [
    'chokidar',
    'commander',
    'ink',
    'react',
    'react-dom',
    'rolldown',
  ],
})

export default tsdownConfig
