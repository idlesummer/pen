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
  const componentsByPath = new Map(moduleEntries.map(([path, module]) => [
    path.slice('/app/'.length),
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
    const role =
      modulePath === GLOBAL_DEFAULT ? 'default' :
      modulePath === GLOBAL_ERROR ? 'error' :
      getRouteModuleType(modulePath)

    // Safe to assert since modulePaths is a subset of componentsByPath.keys()
    const component = componentsByPath.get(modulePath)!
    componentMap[role][modulePath] = component
  }
  return componentMap
}

// Converts module imports to app-relative path -> component
const moduleImports = import.meta.glob<RouteModule>('/app/**/{page,layout,loading,error,default}.tsx', { eager: true })
const componentsByPath = createComponentsByPath(moduleImports)

// createRouter compiles the route tree and narrows modulePaths down further
const { matcher, modulePaths } = createRouter([...componentsByPath.keys()])
const componentMap = createComponentMap(modulePaths, componentsByPath)

const { waitUntilExit } = render(<App matcher={matcher} componentMap={componentMap} />)
await waitUntilExit()
