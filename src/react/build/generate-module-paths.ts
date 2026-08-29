import { GENERATED_HEADER } from './generated-header'

/** Emits the generated `module-paths.ts`: the flat file list `createRouter`
 *  compiles at runtime, frozen at build time so no filesystem walk happens
 *  once the app is running. */
export function generateModulePaths(routeFiles: string[]): string {
  const entries = routeFiles.map(path => `  ${JSON.stringify(path)},`)

  return [
    GENERATED_HEADER,
    '',
    'export const modulePaths = [',
    ...entries,
    ']',
    '',
  ].join('\n')
}
