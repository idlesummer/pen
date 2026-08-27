import { GENERATED_HEADER } from './generated-header'

/** Emits the generated `route-files.ts`: the flat file list `createRouter`
 *  compiles at runtime, frozen at build time so no filesystem walk happens
 *  once the app is running. */
export function generateRouteFiles(routeFiles: string[]): string {
  const entries = routeFiles.map(path => `  '${path}',`)

  return [
    GENERATED_HEADER,
    '',
    'export const routeFiles = [',
    ...entries,
    '] as const',
    '',
  ].join('\n')
}
