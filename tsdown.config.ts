import { defineConfig } from 'tsdown'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  // Entry points
  entry: {
    index: 'src/pen-react/index.ts',  // Library API
    internal: 'src/pen-react/internal.ts',  // Framework-internal API - for pen's own generated/bundled code
    bin: 'src/pen-react/bin.ts',  // CLI executable entry
  },

  // Output options
  dts: true,        // Generate typescript declaration files
  sourcemap: true,  // Source maps for debugging
  clean: true,      // Remove dist/ before build
  minify: true,     // Minify the emitted JavaScript

  // Ships raw (never bundled by tsdown) - Vite needs the literal
  // import.meta.glob call, transformed fresh against each app it builds.
  copy: { from: 'src/pen-react/build/templates/entry-app.tsx', to: 'dist/templates' },

  // Build-time constant injection
  define: {
    __PACKAGE_NAME__: JSON.stringify(pkg.name),
    __DESCRIPTION__: JSON.stringify(pkg.description),
    __VERSION__: JSON.stringify(pkg.version),
  },
})
