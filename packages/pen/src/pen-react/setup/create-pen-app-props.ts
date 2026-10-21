import type { Module } from '@/pen-core'
import type { PageComponent } from '@/pen-react/renderer/components/PageComponent'
import type { LayoutComponent } from '@/pen-react/renderer/components/LayoutComponent'
import type { LoadingComponent } from '@/pen-react/renderer/components/LoadingBoundary'
import type { ErrorComponent } from '@/pen-react/renderer/components/ErrorBoundary'
import type { DefaultComponent } from '@/pen-react/renderer/components/DefaultBoundary'
import type { PenAppProps } from '@/pen-react/renderer/App'
import { createRouter } from '@/pen-core'
import { createComponentMap, createResolvedMatcher } from './create-component-map'

type AppModules = {
  page:     Record<string, Module<PageComponent>>
  layout:   Record<string, Module<LayoutComponent>>
  loading:  Record<string, Module<LoadingComponent>>
  error:    Record<string, Module<ErrorComponent>>
  default:  Record<string, Module<DefaultComponent>>
}

/** Resolves each role's glob'd modules into a resolved matcher - a function
 *  straight from pathname to a renderable match. Modules are expected to
 *  have been validated by `buildApp`.
 *
 *  @param modules - Each role's glob'd modules, keyed by role. */
export function createPenAppProps(modules: AppModules): PenAppProps {
  const { componentMap, allPaths } = createComponentMap({
    page: Object.entries(modules.page),
    layout: Object.entries(modules.layout),
    loading: Object.entries(modules.loading),
    error: Object.entries(modules.error),
    default: Object.entries(modules.default),
  })
  const { matcher } = createRouter(allPaths)
  const resolvedMatcher = createResolvedMatcher(matcher, componentMap)
  return { resolvedMatcher }
}
