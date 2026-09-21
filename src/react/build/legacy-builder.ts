import type { CompileDiagnostic } from '@/router'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { findFiles } from '@/lib/find-files'
import { compile } from '@/router'
import { generateComponentMap } from './generate/component-map'
import { generateEntry } from './generate/entry'

/** Discovers route modules under `appDir` and emits the generated
 *  `component-map` and `entry` files into `outDir` - the pre-Vite codegen
 *  pipeline, kept only for `pen test` while `pen build` moves to Vite. */
export function legacyBuild(appDir: string, outDir: string): CompileDiagnostic[] {
  const filePaths = findFiles(appDir, '.tsx')
  const { modulePaths, diagnostics } = compile(filePaths)

  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'component-map.ts'), generateComponentMap({ appDir, outDir, modulePaths }))
  writeFileSync(join(outDir, 'entry.ts'), generateEntry())

  return diagnostics
}
