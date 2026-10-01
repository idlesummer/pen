import type { Matcher, Module } from '@/pen-core'
import type { ComponentMap } from './component-map'
import type { DefaultComponent } from './components/DefaultBoundary'
import type { ErrorComponent } from './components/ErrorBoundary'
import type { LayoutComponent } from './components/LayoutComponent'
import type { LoadingComponent } from './components/LoadingBoundary'
import type { PageComponent } from './components/PageComponent'
import { createRouter, GLOBAL_DEFAULT, GLOBAL_ERROR } from '@/pen-core'
import { DefaultFallback } from './components/DefaultBoundary'
import { ErrorFallback } from './components/ErrorBoundary'
import { createDefaultExportMap } from './module-mapper'

/** Resolves each role's glob'd modules into its own component map and
 *  builds the matcher from the same paths. A component map can carry
 *  entries createRouter didn't resolve into a route (an orphaned file,
 *  say) - harmless, since render.tsx only ever looks up paths that came
 *  from the same compiled tree the matcher did. Modules should be
 *  already validated by buildApp. */
export function createApp(
  pageModules: Record<string, Module<PageComponent>>,
  layoutModules: Record<string, Module<LayoutComponent>>,
  loadingModules: Record<string, Module<LoadingComponent>>,
  errorModules: Record<string, Module<ErrorComponent>>,
  defaultModules: Record<string, Module<DefaultComponent>>,
): { matcher: Matcher, componentMap: ComponentMap } {
  const pageComponents = createDefaultExportMap(Object.entries(pageModules))
  const layoutComponents = createDefaultExportMap(Object.entries(layoutModules))
  const loadingComponents = createDefaultExportMap(Object.entries(loadingModules))
  const errorComponents = createDefaultExportMap(Object.entries(errorModules), { [GLOBAL_ERROR]: ErrorFallback })
  const defaultComponents = createDefaultExportMap(Object.entries(defaultModules), { [GLOBAL_DEFAULT]: DefaultFallback })

  const { matcher } = createRouter([
    ...Object.keys(pageComponents),
    ...Object.keys(layoutComponents),
    ...Object.keys(loadingComponents),
    ...Object.keys(errorComponents),
    ...Object.keys(defaultComponents),
  ])
  const componentMap: ComponentMap = {
    page: pageComponents,
    layout: layoutComponents,
    loading: loadingComponents,
    error: errorComponents,
    default: defaultComponents,
  }
  return { matcher, componentMap }
}
