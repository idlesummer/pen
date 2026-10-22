import type { Module } from '@/pen-core'
import type { PageComponent } from '@/pen-react/renderer/components/PageComponent'
import type { LayoutComponent } from '@/pen-react/renderer/components/LayoutComponent'
import type { LoadingComponent } from '@/pen-react/renderer/components/LoadingBoundary'
import type { ErrorComponent } from '@/pen-react/renderer/components/ErrorBoundary'
import type { DefaultComponent } from '@/pen-react/renderer/components/DefaultBoundary'

/** Each role's raw glob'd entries, keyed by path - not yet confirmed to be valid modules. */
export type ModuleRegistry = {
  page: Record<string, unknown>
  layout: Record<string, unknown>
  loading: Record<string, unknown>
  error: Record<string, unknown>
  default: Record<string, unknown>
}

/** Any role's component, once resolved - for checks that don't care which role a path belongs to. */
export type AnyComponent =
  PageComponent | LayoutComponent | LoadingComponent | ErrorComponent | DefaultComponent

/** Maps each route module role to its components by file path. Internal to
 *  setup - the renderer never sees path strings or this map, only the
 *  components create-component-matcher.ts's resolveMatch looks up from it. */
export type ComponentMap = {
  page:     Record<string, PageComponent>
  layout:   Record<string, LayoutComponent>
  loading:  Record<string, LoadingComponent>
  error:    Record<string, ErrorComponent>
  default:  Record<string, DefaultComponent>
}

export type BuiltComponentMap = {
  /** Each role's components, kept separate - what create-component-matcher.ts's resolveMatch actually looks up from. */
  componentMap: ComponentMap
  /** Every component merged into one map, regardless of role. */
  allComponents: Record<string, AnyComponent>
  /** Every discovered path, across all roles - the full input createRouter expects. */
  allPaths: string[]
}

/** Checks that a glob'd registry entry really is a module with a component default export. */
function isModule(value: unknown): value is Module<AnyComponent> {
  return typeof value === 'object' && value !== null
    && typeof (value as Partial<Module<AnyComponent>>).default === 'function'
}

/** Resolves one role's registry entries into real components, keyed by path.
 *  Drops any entry that doesn't pass the module guard.
 *  @param registry - Raw, unconfirmed registry entries keyed by path.
 *  @returns Components keyed by path. */
function resolveModules<T>(registry: Record<string, unknown>): Record<string, T> {
  const components: Record<string, T> = {}
  for (const [path, value] of Object.entries(registry)) {
    if (isModule(value))
      components[path] = value.default as T
  }
  return components
}

/** Converts a raw module registry into a usable component map,
 *  shared by both the production app-building path and the dev-time diagnostics path.
 *
 *  @param registry - Each role's raw glob'd entries, keyed by role.
 *  @returns The role-separated map, a flat merge of every role, and every discovered path. */
export function createComponentMap(registry: ModuleRegistry): BuiltComponentMap {
  const page = resolveModules<PageComponent>(registry.page)
  const layout = resolveModules<LayoutComponent>(registry.layout)
  const loading = resolveModules<LoadingComponent>(registry.loading)
  const error = resolveModules<ErrorComponent>(registry.error)
  const default_ = resolveModules<DefaultComponent>(registry.default)

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
