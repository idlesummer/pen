import type { ComponentMap, RouteComponent } from '@idlesummer/pen/internal'
import { render } from 'ink'
import {
  App,
  createRouter,
  DefaultFallback,
  ErrorFallback,
  formatDiagnostics,
  GLOBAL_DEFAULT,
  GLOBAL_ERROR,
  getRouteModuleRole,
  validateModules,
} from '@idlesummer/pen/internal'

/** The shape of a route module file - only its default export matters. */
type RouteModule = { default: RouteComponent }

/** Discovered route modules, keyed by root-relative path (as
 *  import.meta.glob returns them), reduced to appDir-relative path ->
 *  component. */
function createComponentsByPath(modules: Record<string, RouteModule>): Map<string, RouteComponent> {
  const moduleEntries = Object.entries(modules)
  const componentsByPath = new Map(moduleEntries.map(([path, module]) => [
    path.slice(path.indexOf('/app/') + '/app/'.length),
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
// variable, since import.meta.glob is a build-time Vite transform
const moduleImports = import.meta.glob<RouteModule>('/src/app/**/{page,layout,loading,error,default}.tsx', { eager: true })
const componentsByPath = createComponentsByPath(moduleImports)

// createRouter compiles the route tree and narrows modulePaths down further
const { matcher, modulePaths, pageEndpoints } = createRouter([...componentsByPath.keys()])

// Module validation: checks only decidable once real components are
// imported, unlike compileApp's own file-tree diagnostics further upstream.
const diagnostics = validateModules(pageEndpoints, modulePaths, componentsByPath)
for (const { severity, text } of formatDiagnostics(diagnostics))
  console[severity](text)
if (diagnostics.some(diagnostic => diagnostic.severity === 'error'))
  throw new Error('App failed to start')

const componentMap = createComponentMap(modulePaths, componentsByPath)

// Ink's own auto-detection treats a CI-flagged env as non-interactive even
// with a real TTY attached, which some sandboxed/cloud terminals set by
// default - deciding by stdout.isTTY alone avoids that false negative,
// without forcing interactive mode onto genuinely piped output.
const { waitUntilExit } = render(<App matcher={matcher} componentMap={componentMap} />, {
  interactive: process.stdout.isTTY,
})
await waitUntilExit()
