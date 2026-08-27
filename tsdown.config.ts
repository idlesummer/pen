import { defineConfig } from 'tsdown'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  // Entry points
  entry: {
    index: 'src/index.ts',  // Library API
    bin: 'src/bin.ts',  // CLI executable entry
  },

  // Output options
  dts: true,        // Generate typescript declaration files
  sourcemap: true,  // Source maps for debugging
  clean: true,      // Remove dist/ before build
  minify: true,     // Minify the emitted JavaScript

  // Build-time constant injection
  define: {
    __PACKAGE_NAME__: JSON.stringify(pkg.name),
    __DESCRIPTION__:  JSON.stringify(pkg.description),
    __VERSION__:      JSON.stringify(pkg.version),
  },
})
