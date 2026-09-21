import type { RouteModule } from '@idlesummer/pen/internal'
import { render } from 'ink'
import { App, createRouter, toModuleByPath, toComponentMap } from '@idlesummer/pen/internal'

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
const componentMap = toComponentMap(modulePaths, moduleByPath)

const { waitUntilExit } = render(<App matcher={matcher} componentMap={componentMap} />)
await waitUntilExit()
