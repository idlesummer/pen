import { defineConfig } from 'tsdown'

export default defineConfig({
  // Entry points
  entry: {
    index: 'src/pen-react/index.ts',  // Library API
    internal: 'src/internal.ts',      // Framework-internal API
    bin: 'src/pen-cli/bin.ts',        // CLI executable entry
  },
  // Output options
  dts: true,        // Generate typescript declaration files
  sourcemap: true,  // Source maps for debugging
  clean: true,      // Remove dist/ before build
  minify: true,     // Minify the emitted JavaScript
})
