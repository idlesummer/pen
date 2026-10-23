import type { PageComponent } from '@/pen-react/render/components/PageComponent'
import type { LayoutComponent } from '@/pen-react/render/components/LayoutComponent'
import type { LoadingComponent } from '@/pen-react/render/components/LoadingBoundary'
import type { ErrorComponent } from '@/pen-react/render/components/ErrorBoundary'
import type { DefaultComponent } from '@/pen-react/render/components/DefaultBoundary'
import type { AnyFunctionConstraint } from '@/lib/module'
import type { ModuleRegistry } from './module-registry'
import { hasFunctionDefaultExport } from '@/lib/module'

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
  componentPaths: string[]
}

/** Resolves a role's glob entries into components, keyed by normalized path.
 *  Drops entries that don't contain a function default export. */
function createFunctionMap<T extends AnyFunctionConstraint>(moduleMap: Record<string, unknown>): Record<string, T> {
  const components: Record<string, T> = {}
  for (const [path, module] of Object.entries(moduleMap)) {
    if (hasFunctionDefaultExport<T>(module))
      components[path.replace(/^\.\//, '')] = module.default
  }
  return components
}

/** Verifies and assembles a raw module registry into a usable component map,
 *  shared by both the production app-building path and the dev-time diagnostics path.
 *
 *  @param moduleRegistry - Each role's raw glob'd entries, keyed by role.
 *  @returns The role-separated map, a flat merge of every role, and every discovered path. */
export function createComponentMap(moduleRegistry: ModuleRegistry): BuiltComponentMap {
  const page = createFunctionMap<PageComponent>(moduleRegistry.page)
  const layout = createFunctionMap<LayoutComponent>(moduleRegistry.layout)
  const loading = createFunctionMap<LoadingComponent>(moduleRegistry.loading)
  const error = createFunctionMap<ErrorComponent>(moduleRegistry.error)
  const default_ = createFunctionMap<DefaultComponent>(moduleRegistry.default)

  return {
    componentMap: { page, layout, loading, error, default: default_ },
    allComponents: { ...page, ...layout, ...loading, ...error, ...default_ },
    componentPaths: [
      ...Object.keys(page),
      ...Object.keys(layout),
      ...Object.keys(loading),
      ...Object.keys(error),
      ...Object.keys(default_),
    ],
  }
}
