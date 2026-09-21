import type { ComponentMap, RouteModule } from '@idlesummer/pen/internal'
import { render } from 'ink'
import { App, createRouter, getRouteModuleType, GLOBAL_DEFAULT, GLOBAL_ERROR, DefaultFallback, ErrorFallback, toModuleByPath } from '@idlesummer/pen/internal'

// Discovers every route module in the app - Vite resolves this glob at
// build time against whichever app this gets bundled into, so this file
// itself never needs to change per app. The brace-expansion keeps anything
// that isn't a route file (a colocated component, say) out of `modules`
// entirely, rather than relying on createRouter to drop it later.
const modules = import.meta.glob<RouteModule>('/app/**/{page,layout,loading,error,default}.tsx', { eager: true })
const moduleByPath = toModuleByPath(modules)

// createRouter compiles the route tree and narrows modulePaths down further -
// a file can still be excluded here even with a valid role basename, e.g. one
// living under a private folder or a malformed segment.
const { matcher, modulePaths } = createRouter([...moduleByPath.keys()])

const componentMap: ComponentMap = { page: {}, layout: {}, loading: {}, error: {}, default: {} }
for (const modulePath of modulePaths) {
  const role = modulePath === GLOBAL_DEFAULT ? 'default' : modulePath === GLOBAL_ERROR ? 'error' : getRouteModuleType(modulePath)
  const component = modulePath === GLOBAL_DEFAULT ? DefaultFallback : modulePath === GLOBAL_ERROR ? ErrorFallback : moduleByPath.get(modulePath)
  ;(componentMap[role] as Record<string, unknown>)[modulePath] = component
}

const { waitUntilExit } = render(<App matcher={matcher} componentMap={componentMap} />)
await waitUntilExit()
