import type { Diagnostic } from '@/router'
import { fileURLToPath } from 'node:url'
import { createBuilder } from 'vite'
import { PACKAGE_NAME } from '@/lib/constants'
import { findFiles } from '@/lib/find-files'
import { compileApp } from '@/router'

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
  const diagnostics = compileApp(filePaths).diagnostics
  if (diagnostics.some(diagnostic => diagnostic.severity === 'error'))
    return diagnostics

  const builder = await createBuilder({
    configFile: false,
    // import.meta.glob('/app/**/*.tsx') inside the entry template is root-
    // relative - this is the root it resolves against.
    root: process.cwd(),
    // ssr:true already externalizes every resolvable node_modules package
    // by default (confirmed empirically - react, ink, and react/jsx-runtime
    // all stay real imports with no explicit `external` needed at all).
    // pen's own runtime is the one package that default would ALSO
    // externalize but shouldn't - it's meant to bundle into the app like any
    // of the app's own source, not be a separate runtime dependency of it.
    ssr: {
      noExternal: [PACKAGE_NAME],
    },
    build: {
      outDir,
      // This bundles for Node (an Ink TUI, not a browser page) - without
      // this, Vite's default client mode silently externalizes Node
      // builtins (node:fs, ...) as browser-compat shims instead of leaving
      // them as real imports.
      ssr: true,
      rolldownOptions: {
        input: ENTRY_TEMPLATE,
        // A fixed name, not the default content-hashed one - `pen start`
        // needs a predictable path to run (`node <outDir>/entry.js`).
        output: { entryFileNames: 'entry.js' },
      },
    },
  })

  // createBuilder always sets up a default 'client' environment alongside
  // 'ssr' (confirmed empirically - build.ssr:true doesn't suppress it the
  // way it does for the plain build() function), so builder.buildApp()
  // would waste a whole redundant browser-mode build. Build only the one
  // environment this app actually has.
  await builder.build(builder.environments.ssr!)
  return diagnostics
}
