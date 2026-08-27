import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'unplugin-dts/vite'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  build: {
    ssr: true,  // Targets Node (CLI + library), not a browser
    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'),  // Library API
        bin: resolve(import.meta.dirname, 'src/bin.ts'),      // CLI executable entry
      },
      formats: ['es'],
    },

    sourcemap: true, // Source maps for debugging
    minify: true,    // SSR builds default to no minification - opt back in

    rolldownOptions: {
      // External dependencies
      external: [
        'ink',
        'react',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
      ],
      output: {
        entryFileNames: '[name].mjs',
      },
    },
  },
  plugins: [
    dts({
      entryRoot: 'src',
      include: [
        'src/index.ts',
        'src/pen/**/*.ts',
        'src/pen/**/*.tsx'],
      },
    ),
  ],

  // Build-time constant injection
  define: {
    __PACKAGE_NAME__: JSON.stringify(pkg.name),
    __DESCRIPTION__: JSON.stringify(pkg.description),
    __VERSION__: JSON.stringify(pkg.version),
  },
})
