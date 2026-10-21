import type { ComponentMap, PageComponent, LayoutComponent, LoadingComponent, ErrorComponent, DefaultComponent } from '@/pen-react/renderer/types/component-map'
import type { ModuleEntries } from './default-export-map'
import { createDefaultExportMap } from './default-export-map'

/** Each role's glob'd module entries, keyed by role. */
export type RoleModuleEntries = {
  page: ModuleEntries<PageComponent>
  layout: ModuleEntries<LayoutComponent>
  loading: ModuleEntries<LoadingComponent>
  error: ModuleEntries<ErrorComponent>
  default: ModuleEntries<DefaultComponent>
}

/** Any role's component, once resolved - for checks that don't care which role a path belongs to. */
export type AnyComponent = PageComponent | LayoutComponent | LoadingComponent | ErrorComponent | DefaultComponent

export type BuiltComponentMap = {
  /** Each role's components, kept separate - what render.tsx actually looks up from. */
  componentMap: ComponentMap
  /** Every component merged into one map, regardless of role. */
  allComponents: Record<string, AnyComponent>
  /** Every discovered path, across all roles - the full input createRouter expects. */
  allPaths: string[]
}

/** Resolves a role-separated set of glob'd module entries into one component map,
 *  shared by both the production app-building path and the dev-time diagnostics path.
 *
 *  @param modules - Each role's glob'd module entries, keyed by role.
 *  @returns The role-separated map, a flat merge of every role, and every discovered path. */
export function buildComponentMap(modules: RoleModuleEntries): BuiltComponentMap {
  const page = createDefaultExportMap(modules.page)
  const layout = createDefaultExportMap(modules.layout)
  const loading = createDefaultExportMap(modules.loading)
  const error = createDefaultExportMap(modules.error)
  const default_ = createDefaultExportMap(modules.default)

  return {
    componentMap: { page, layout, loading, error, default: default_ },
    allComponents: { ...page, ...layout, ...loading, ...error, ...default_ },
    allPaths: [...Object.keys(page), ...Object.keys(layout), ...Object.keys(loading), ...Object.keys(error), ...Object.keys(default_)],
  }
}
