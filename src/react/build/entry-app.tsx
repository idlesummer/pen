import type { ComponentMap, RouteComponent } from '@idlesummer/pen/internal'
import { render } from 'ink'
import {
  App,
  createRouter,
  DefaultFallback,
  ErrorFallback,
  GLOBAL_DEFAULT,
  GLOBAL_ERROR,
  getRouteModuleType,
} from '@idlesummer/pen/internal'

/** The shape of a route module file - only its default export matters. */
type RouteModule = { default: RouteComponent }

/** Discovered route modules, keyed by root-relative path (as
 *  import.meta.glob returns them), reduced to appDir-relative path ->
 *  component. */
function createComponentsByPath(modules: Record<string, RouteModule>): Map<string, RouteComponent> {
  const moduleEntries = Object.entries(modules)
  return new Map(moduleEntries.map(([path, module]) => [path.replace(/^\/app\//, ''), module.default]))
}

/** Buckets the compiled route tree's module paths by role - the two
 *  sentinels get pen's own built-in fallback, everything else its real
 *  discovered component. */
function createComponentMap(modulePaths: string[], componentsByPath: Map<string, RouteComponent>): ComponentMap {
  const componentMap: ComponentMap = { page: {}, layout: {}, loading: {}, error: {}, default: {} }
  for (const modulePath of modulePaths) {
    const role =
      modulePath === GLOBAL_DEFAULT ? 'default' :
      modulePath === GLOBAL_ERROR ? 'error' :
      getRouteModuleType(modulePath)

    const component =
      modulePath === GLOBAL_DEFAULT ? DefaultFallback :
      modulePath === GLOBAL_ERROR ? ErrorFallback :
      componentsByPath.get(modulePath)

    ;(componentMap[role] as Record<string, unknown>)[modulePath] = component
  }
  return componentMap
}

// Discovers every route module in the app - Vite resolves this glob at
// build time against whichever app this gets bundled into, so this file
// itself never needs to change per app. The brace-expansion keeps anything
// that isn't a route file (a colocated component, say) out of `modules`
// entirely, rather than relying on createRouter to drop it later.
const moduleImports = import.meta.glob<RouteModule>('/app/**/{page,layout,loading,error,default}.tsx', { eager: true })
const componentsByPath = createComponentsByPath(moduleImports)

// createRouter compiles the route tree and narrows modulePaths down further -
// a file can still be excluded here even with a valid role basename, e.g. one
// living under a private folder or a malformed segment.
const { matcher, modulePaths } = createRouter([...componentsByPath.keys()])
const componentMap = createComponentMap(modulePaths, componentsByPath)

const { waitUntilExit } = render(<App matcher={matcher} componentMap={componentMap} />)
await waitUntilExit()
