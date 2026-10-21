import type { Module } from '@/pen-core'
import type {
  ComponentMap,
  PageComponent,
  LayoutComponent,
  LoadingComponent,
  ErrorComponent,
  DefaultComponent,
} from '@/pen-react/renderer/types/component-map'
import type { PenAppProps } from '@/pen-react/renderer/App'
import { createRouter } from '@/pen-core'
import { createDefaultExportMap } from './default-export-map'

type AppModules = {
  page:     Record<string, Module<PageComponent>>
  layout:   Record<string, Module<LayoutComponent>>
  loading:  Record<string, Module<LoadingComponent>>
  error:    Record<string, Module<ErrorComponent>>
  default:  Record<string, Module<DefaultComponent>>
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
export function createPenAppProps(modules: AppModules): PenAppProps {
  const pageComponents = createDefaultExportMap(Object.entries(modules.page))
  const layoutComponents = createDefaultExportMap(Object.entries(modules.layout))
  const loadingComponents = createDefaultExportMap(Object.entries(modules.loading))
  const errorComponents = createDefaultExportMap(Object.entries(modules.error))
  const defaultComponents = createDefaultExportMap(Object.entries(modules.default))

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
