import { defineConfig } from 'tsdown'

export default defineConfig({
  // Entry points
  entry: {
    index: 'src/index.ts',                    // Library API
    internal: 'src/internal.ts',              // Framework-internal API
    bin: 'src/pen-cli/bin.ts',                // CLI executable entry
    'eslint-config': 'src/eslint-config.ts',  // Shared lint config for scaffolded apps
  },
  // Output options
  dts: true,        // Generate typescript declaration files
  sourcemap: true,  // Source maps for debugging
  clean: true,      // Remove dist/ before build
  minify: {         // Minify the emitted JavaScript
    mangle: {       // Mangling breaks validateComponentExports's capital-letter component name check
      reserved: ['DefaultFallback', 'ErrorFallback'],
    },
  },
})
