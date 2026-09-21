import { join, relative, sep } from 'node:path'
import { PACKAGE_NAME } from '@/lib/constants'
import { GLOBAL_DEFAULT, GLOBAL_ERROR, getRouteModuleRole } from '@/router'
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
 *  fallback for a sentinel path, otherwise a real app file. */
function toImportStatement(appDir: string, outDir: string, modulePath: string, index: number): string {
  if (modulePath === GLOBAL_DEFAULT)
    return `import { DefaultFallback as Component${index} } from "${PACKAGE_NAME}/internal"`
  if (modulePath === GLOBAL_ERROR)
    return `import { ErrorFallback as Component${index} } from "${PACKAGE_NAME}/internal"`

  return `import Component${index} from "${toImportSpecifier(appDir, outDir, modulePath)}"`
}

/** Emits the generated `component-map.ts`, statically importing each route
 *  module and bucketing it by role (page/layout/loading/error/default) into
 *  the generated ComponentMap. Assumes `outDir` is outside `appDir`. */
export function generateComponentMap({ appDir, outDir, modulePaths }: ComponentMapOptions): string {
  const imports: string[] = []
  const entriesByRole: Record<string, string[]> = { page: [], layout: [], loading: [], error: [], default: [] }

  for (const [index, modulePath] of modulePaths.entries()) {
    imports.push(toImportStatement(appDir, outDir, modulePath, index))
    entriesByRole[getRouteModuleRole(modulePath)]!.push(`    ${JSON.stringify(modulePath)}: Component${index},`)
  }

  const roleBlocks = Object.entries(entriesByRole).flatMap(([role, entries]) =>
    [`  ${role}: {`, ...entries, '  },'])

  return [
    GENERATED_HEADER,
    '',
    `import type { ComponentMap } from "${PACKAGE_NAME}/internal"`,
    ...imports,
    '',
    'export const componentMap: ComponentMap = {',
    ...roleBlocks,
    '}',
    '',
  ].join('\n')
}
