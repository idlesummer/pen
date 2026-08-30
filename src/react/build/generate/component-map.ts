import { join, relative, sep } from 'node:path'
import { PACKAGE_NAME } from '@/lib/constants'
import { DEFAULT_FALLBACK_PATH } from '@/router'
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

/** Emits the import statement for one module path - pen's own built-in
 *  fallback for the sentinel `default` path, otherwise a real app file. */
function toImportStatement(appDir: string, outDir: string, modulePath: string, index: number): string {
  if (modulePath === DEFAULT_FALLBACK_PATH)
    return `import { DefaultFallback as Component${index} } from "${PACKAGE_NAME}"`

  return `import Component${index} from "${toImportSpecifier(appDir, outDir, modulePath)}"`
}

/** Emits the generated `component-map.ts`, statically importing each route
 *  module and mapping its path to the imported component. Assumes `outDir`
 *  is outside `appDir`. */
export function generateComponentMap({ appDir, outDir, modulePaths }: ComponentMapOptions): string {
  const imports: string[] = []
  const entries: string[] = []

  for (const [index, modulePath] of modulePaths.entries()) {
    imports.push(toImportStatement(appDir, outDir, modulePath, index))
    entries.push(`  ${JSON.stringify(modulePath)}: Component${index},`)
  }

  return [
    GENERATED_HEADER,
    '',
    `import type { ComponentMap } from "${PACKAGE_NAME}"`,
    ...imports,
    '',
    'export const componentMap: ComponentMap = {',
    ...entries,
    '}',
    '',
  ].join('\n')
}
