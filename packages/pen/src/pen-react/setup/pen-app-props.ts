import type { Module } from '@/pen-core'
import type {
  PageComponent,
  LayoutComponent,
  LoadingComponent,
  ErrorComponent,
  DefaultComponent,
} from '@/pen-react/renderer/types/component-map'
import type { PenAppProps } from '@/pen-react/renderer/App'
import { createRouter } from '@/pen-core'
import { buildComponentMap } from './build-component-map'

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
  const { componentMap, allPaths } = buildComponentMap({
    page: Object.entries(modules.page),
    layout: Object.entries(modules.layout),
    loading: Object.entries(modules.loading),
    error: Object.entries(modules.error),
    default: Object.entries(modules.default),
  })
  const { matcher } = createRouter(allPaths)
  return { matcher, componentMap }
}
