import { join, relative, sep } from 'node:path'
import { GENERATED_HEADER } from './header'

type ComponentMapOptions = {
  appDir: string
  outDir: string
  modulePaths: string[] // relative to appDir
}

/** Converts a module path relative to `appDir` into an import specifier
 *  relative to `outDir`. */
function toImportSpecifier(appDir: string, outDir: string, modulePath: string): string {
  const moduleFile = join(appDir, modulePath)
  return relative(outDir, moduleFile).replaceAll(sep, '/')
}

/** Emits the generated `component-map.ts`, statically importing each route
 *  module and mapping its path to the imported component. Assumes `outDir`
 *  is outside `appDir`. */
export function generateComponentMap({ appDir, outDir, modulePaths }: ComponentMapOptions): string {
  const imports: string[] = []
  const entries: string[] = []

  for (const [index, modulePath] of modulePaths.entries()) {
    imports.push(`import Component${index} from "${toImportSpecifier(appDir, outDir, modulePath)}"`)
    entries.push(`  "${modulePath}": Component${index},`)
  }

  return [
    GENERATED_HEADER,
    '',
    'import type { ComponentMap } from "@idlesummer/pen"',
    ...imports,
    '',
    'export const componentMap: ComponentMap = {',
    ...entries,
    '}',
    '',
  ].join('\n')
}
