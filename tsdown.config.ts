import type { Plugin } from 'vite'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'tsdown'
import pkg from './package.json' with { type: 'json' }

// enforce: 'pre' so this claims a .tsx?raw id before rolldown's own
// built-in TSX loader would otherwise compile it - rolldown's own Plugin
// type doesn't declare `enforce` even though it honors it at runtime, so
// this is typed against Vite's instead, which does declare it.
const rawImportPlugin: Plugin = {
  name: 'pen:raw-import',
  enforce: 'pre',
  resolveId(id, importer) {
    if (!id.endsWith('.tsx?raw')) return
    // id arrives relative to its importer, not to process.cwd() - resolve
    // it to an absolute path now so load() can read the real file later.
    const relativePath = id.slice(0, -'?raw'.length)
    const absolutePath = importer ? resolve(dirname(importer), relativePath) : resolve(relativePath)
    return `${absolutePath}?raw`
  },
  load(id) {
    if (!id.endsWith('.tsx?raw')) return
    const realPath = id.slice(0, -'?raw'.length)
    return `export default ${JSON.stringify(readFileSync(realPath, 'utf-8'))}`
  },
}

export default defineConfig({
  // Entry points
  entry: {
    index: 'src/pen-react/index.ts',        // Library API
    internal: 'src/pen-react/internal.ts',  // Framework-internal API
    bin: 'src/pen-react/bin.ts',            // CLI executable entry
  },

  // Output options
  dts: true,        // Generate typescript declaration files
  sourcemap: true,  // Source maps for debugging
  clean: true,      // Remove dist/ before build
  minify: true,     // Minify the emitted JavaScript

  // entry-app.tsx stays a real, type-checked, lintable file, but Vite needs
  // its literal source text (untouched by rolldown's own TSX loader) to
  // transform fresh against each app it builds - `?raw` inlines that text
  // as a plain string at pen's own build time, matching entry-plugin.ts's
  // ambient '*.tsx?raw' declaration.
  plugins: [rawImportPlugin],

  // Build-time constant injection
  define: {
    __PACKAGE_NAME__: JSON.stringify(pkg.name),
    __DESCRIPTION__: JSON.stringify(pkg.description),
    __VERSION__: JSON.stringify(pkg.version),
  },
})
