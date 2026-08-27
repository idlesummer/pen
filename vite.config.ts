import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  plugins: [
    dts({ entryRoot: 'src', include: ['src/index.ts', 'src/pen/**/*.ts', 'src/pen/**/*.tsx'] }),
  ],

  build: {
    // Targets Node (CLI + library), not a browser - keeps node: imports as
    // real externals instead of Vite's browser-compat shimming.
    ssr: true,

    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'), // Library API
        bin: resolve(import.meta.dirname, 'src/bin.ts'),      // CLI executable entry
      },
      formats: ['es'],
    },

    // Output options
    outDir: 'dist',
    sourcemap: true,   // Source maps for debugging
    emptyOutDir: true, // Remove dist/ before build
    minify: true,      // Minify the emitted JavaScript

    rollupOptions: {
      // External dependencies
      external: ['ink', 'react', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
      output: {
        entryFileNames: '[name].mjs',
      },
    },
  },

  // Build-time constant injection
  define: {
    __PACKAGE_NAME__: JSON.stringify(pkg.name),
    __DESCRIPTION__: JSON.stringify(pkg.description),
    __VERSION__: JSON.stringify(pkg.version),
  },
})
