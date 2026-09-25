import type { Plugin } from 'vite'

export const ENTRY_MODULE_ID = 'virtual:pen/entry-app.tsx'
const RESOLVED_ENTRY_MODULE_ID = `\0${ENTRY_MODULE_ID}`
const APP_DIR_TOKEN = '__PEN_APP_DIR__'

// The entry app's own source, kept as a string here rather than a separate
// .tsx file read at build time - it's small, changes rarely, and its real
// correctness is verified by actually building and running an app against
// it, not by tsc checking this string's syntax. Its own glob pattern has to
// stay a literal string for Vite's static analysis, so it ships with the
// placeholder token above, substituted for the real appDir per build.
const ENTRY_APP_SOURCE = `
import type { ComponentMap, RouteComponent } from '@idlesummer/pen/internal'
import { render } from 'ink'
import {
  App,
  createRouter,
  DefaultFallback,
  ErrorFallback,
  GLOBAL_DEFAULT,
  GLOBAL_ERROR,
  getRouteModuleRole,
} from '@idlesummer/pen/internal'

/** The shape of a route module file - only its default export matters. */
type RouteModule = { default: RouteComponent }

/** Discovered route modules, keyed by root-relative path (as
 *  import.meta.glob returns them), reduced to appDir-relative path ->
 *  component. */
function createComponentsByPath(modules: Record<string, RouteModule>): Map<string, RouteComponent> {
  const moduleEntries = Object.entries(modules)
  const componentsByPath = new Map(moduleEntries.map(([path, module]) => [
    path.slice(path.indexOf('/__PEN_APP_DIR__/') + '/__PEN_APP_DIR__/'.length),
    module.default,
  ]))
  componentsByPath.set(GLOBAL_DEFAULT, DefaultFallback)
  componentsByPath.set(GLOBAL_ERROR, ErrorFallback)
  return componentsByPath
}

/** Buckets the compiled route tree's module paths by role - the two
 *  sentinels get pen's own built-in fallback, everything else its real
 *  discovered component. */
function createComponentMap(modulePaths: string[], componentsByPath: Map<string, RouteComponent>): ComponentMap {
  const componentMap: ComponentMap = { page: {}, layout: {}, loading: {}, error: {}, default: {} }
  for (const modulePath of modulePaths) {
    const role = getRouteModuleRole(modulePath)
    const component = componentsByPath.get(modulePath)! // Safe since modulePaths is subset of componentsByPath.keys()
    componentMap[role][modulePath] = component
  }
  return componentMap
}

// Maps paths to module objects - pattern must stay a literal string, not a
// variable, since import.meta.glob is a build-time Vite transform.
const moduleImports = import.meta.glob<RouteModule>('/__PEN_APP_DIR__/**/{page,layout,loading,error,default}.tsx', { eager: true })
const componentsByPath = createComponentsByPath(moduleImports)

// createRouter compiles the route tree and narrows modulePaths down further -
// buildApp already validated these modules, so entry-app trusts them as-is
const { matcher, modulePaths } = createRouter([...componentsByPath.keys()])
const componentMap = createComponentMap(modulePaths, componentsByPath)

const { waitUntilExit } = render(<App matcher={matcher} componentMap={componentMap} />)
await waitUntilExit()
`

/**
 * Provides the virtual entry module used to discover and bundle the app's
 * route files. The entry template contains the glob pattern, with appDir
 * substituted at build time.
 *
 * @param appDir App route directory relative to project root.
 */
export function entryPlugin(appDir: string): Plugin {
  return {
    name: 'pen:entry-app',
    resolveId: (id) => {
      if (id === ENTRY_MODULE_ID)
        return RESOLVED_ENTRY_MODULE_ID
    },
    load: (id) => {
      if (id !== RESOLVED_ENTRY_MODULE_ID)
        return

      return ENTRY_APP_SOURCE.replaceAll(APP_DIR_TOKEN, appDir)
    },
  }
}
