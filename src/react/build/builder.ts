import type { Diagnostic } from '@/router'
import { fileURLToPath } from 'node:url'
import { build as viteBuild } from 'vite'
import { findFiles } from '@/lib/find-files'
import { compile } from '@/router'

// Resolves next to this module both from source (src/react/build/) and once
// bundled (tsdown copies entry-template.tsx flat into dist/, alongside
// bin.mjs), so import.meta.url always has the right sibling.
const ENTRY_TEMPLATE = fileURLToPath(new URL('./entry-template.tsx', import.meta.url))

/**
 * Compiles routes for diagnostics, then bundles the app with Vite - the
 * compiled tree itself is discarded, since the bundled entry template
 * rediscovers routes on its own via `import.meta.glob`. Skips the (real,
 * costly) Vite build entirely when the tree has errors, since there's no
 * point bundling an app already known to be broken.
 */
export async function buildApp(appDir: string, outDir: string): Promise<Diagnostic[]> {
  const filePaths = findFiles(appDir, '.tsx')
  const { diagnostics } = compile(filePaths)

  if (diagnostics.some(diagnostic => diagnostic.severity === 'error'))
    return diagnostics

  await viteBuild({
    configFile: false,
    // import.meta.glob('/app/**/*.tsx') inside the entry template is root-
    // relative - this is the root it resolves against.
    root: process.cwd(),
    build: {
      outDir,
      // This bundles for Node (an Ink TUI, not a browser page) - without
      // this, Vite's default client mode silently externalizes Node
      // builtins (node:fs, ...) as browser-compat shims instead of leaving
      // them as real imports.
      ssr: true,
      rolldownOptions: {
        input: ENTRY_TEMPLATE,
        // react/ink stay real imports, resolved from the app's own
        // node_modules at runtime; everything else (pen's own runtime
        // included) gets bundled into the app.
        external: ['react', 'ink'],
        // A fixed name, not the default content-hashed one - `pen start`
        // needs a predictable path to run (`node <outDir>/entry.js`).
        output: { entryFileNames: 'entry.js' },
      },
    },
  })
  return diagnostics
}
