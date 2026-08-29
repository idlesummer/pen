import { join, relative, sep } from 'node:path'
import { GENERATED_HEADER } from './generated-header'

type ComponentMapOptions = {
  appDir: string
  outDir: string
  modulePaths: string[] // relative to appDir
}

function toImportSpecifier(appDir: string, outDir: string, modulePath: string): string {
  const relativePath = relative(outDir, join(appDir, modulePath)).split(sep).join('/')
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`
}

/** Emits the generated `component-map.ts`: a real, statically-imported
 *  component per route module, keyed by the same path `RenderNode` carries -
 *  turning the router's path strings into bundler-visible imports instead
 *  of runtime dynamic `import()` calls. */
export function generateComponentMap({ appDir, outDir, modulePaths }: ComponentMapOptions): string {
  const imports = modulePaths.map((modulePath, index) =>
    `import Component${index} from '${toImportSpecifier(appDir, outDir, modulePath)}'`)

  const entries = modulePaths.map((modulePath, index) =>
    `  '${modulePath}': Component${index},`)

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
