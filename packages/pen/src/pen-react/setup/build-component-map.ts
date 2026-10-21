import type { Module } from '@/pen-core'
import type { ComponentMap, PageComponent, LayoutComponent, LoadingComponent, ErrorComponent, DefaultComponent } from '@/pen-react/renderer/types/component-map'

type ModuleEntries<T> = Array<readonly [string, Partial<Module<T>>?]>
type DefaultExportMap<T> = Record<string, T>

/**
 * Extracts each module's default export, keyed by path. A leading './' is
 * stripped from each path - callers whose source already produces bare
 * relative paths are unaffected, since there's nothing to strip.
 *
 * A module with no default export is skipped entirely rather than stored
 * as undefined - modulePaths (from createRouter) is the source of truth
 * for which paths exist, independent of this map, so skipping loses no
 * diagnosability for an invalid export.
 *
 * @param entries - Module entries containing a path and optional module.
 * @returns Default exports keyed by module path.
 */
export function createDefaultExportMap<T>(modules: ModuleEntries<T>): DefaultExportMap<T> {
  const moduleExports: DefaultExportMap<T> = {}
  for (const [path, module] of modules) {
    const component = module?.default
    if (component)
      moduleExports[path.replace(/^\.\//, '')] = component
  }
  return moduleExports
}


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
    allPaths: [
      ...Object.keys(page),
      ...Object.keys(layout),
      ...Object.keys(loading),
      ...Object.keys(error),
      ...Object.keys(default_),
    ],
  }
}
