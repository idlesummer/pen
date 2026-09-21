import type { ComponentMap } from '@idlesummer/pen'
import { render } from 'ink'
import { App, createRouter, getRouteModuleType, GLOBAL_DEFAULT, GLOBAL_ERROR, DefaultFallback, ErrorFallback } from '@idlesummer/pen'

// Discovers every route module in the app - Vite resolves this glob at
// build time against whichever app this gets bundled into, so this file
// itself never needs to change per app.
const modules = import.meta.glob('/app/**/*.tsx', { eager: true })

const moduleByPath = new Map(
  Object.entries(modules).map(([path, module]) => [path.replace(/^\/app\//, ''), (module as { default: unknown }).default]),
)

// createRouter compiles the route tree and narrows modulePaths down to real
// route module files, dropping anything else that got glob-matched (e.g. a
// colocated component that isn't itself a page/layout/loading/error/default).
const { matcher, modulePaths } = createRouter([...moduleByPath.keys()])

const componentMap: ComponentMap = { page: {}, layout: {}, loading: {}, error: {}, default: {} }
for (const modulePath of modulePaths) {
  const role = modulePath === GLOBAL_DEFAULT ? 'default' : modulePath === GLOBAL_ERROR ? 'error' : getRouteModuleType(modulePath)
  const component = modulePath === GLOBAL_DEFAULT ? DefaultFallback : modulePath === GLOBAL_ERROR ? ErrorFallback : moduleByPath.get(modulePath)
  ;(componentMap[role] as Record<string, unknown>)[modulePath] = component
}

const { waitUntilExit } = render(<App matcher={matcher} componentMap={componentMap} />)
await waitUntilExit()
