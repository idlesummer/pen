import type { Module } from '@/pen-core'
import type { DefaultComponent } from '../renderer/components/DefaultBoundary'
import type { ErrorComponent } from '../renderer/components/ErrorBoundary'
import type { LayoutComponent } from '../renderer/components/LayoutComponent'
import type { LoadingComponent } from '../renderer/components/LoadingBoundary'
import type { PageComponent } from '../renderer/components/PageComponent'
import type { PenAppProps } from '../renderer/App'

import { createRouter, GLOBAL_DEFAULT, GLOBAL_ERROR } from '@/pen-core'
import { DefaultFallback } from '../renderer/components/DefaultBoundary'
import { ErrorFallback } from '../renderer/components/ErrorBoundary'

import type { ComponentMap } from './component-map'
import { createDefaultExportMap } from './module-mapper'

type AppModules = {
  page: Record<string, Module<PageComponent>>
  layout: Record<string, Module<LayoutComponent>>
  loading: Record<string, Module<LoadingComponent>>
  error: Record<string, Module<ErrorComponent>>
  default: Record<string, Module<DefaultComponent>>
}

/** Resolves each role's glob'd modules into its own component map and
 *  builds the matcher from the same paths. Modules are expected to have
 *  been validated by `buildApp`.
 *
 *  A component map can carry entries createRouter didn't resolve into a
 *  route (an orphaned file, say) - harmless, since render.tsx only ever
 *  looks up paths that came from the same compiled tree the matcher did.
 *
 *  @param modules - Each role's glob'd modules, keyed by role. */
export function createAppProps(modules: AppModules): PenAppProps {
  const pageComponents = createDefaultExportMap(Object.entries(modules.page))
  const layoutComponents = createDefaultExportMap(Object.entries(modules.layout))
  const loadingComponents = createDefaultExportMap(Object.entries(modules.loading))
  const errorComponents = createDefaultExportMap(Object.entries(modules.error), { [GLOBAL_ERROR]: ErrorFallback })
  const defaultComponents = createDefaultExportMap(Object.entries(modules.default), { [GLOBAL_DEFAULT]: DefaultFallback })

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
