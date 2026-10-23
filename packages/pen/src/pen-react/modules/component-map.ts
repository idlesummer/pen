import type { PageComponent } from '@/pen-react/render/components/PageComponent'
import type { LayoutComponent } from '@/pen-react/render/components/LayoutComponent'
import type { LoadingComponent } from '@/pen-react/render/components/LoadingBoundary'
import type { ErrorComponent } from '@/pen-react/render/components/ErrorBoundary'
import type { DefaultComponent } from '@/pen-react/render/components/DefaultBoundary'
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

/** Resolves a role's glob entries into components, keyed by normalized path.
 *  Drops entries that don't contain a function default export. */
function createFunctionMap<T>(moduleMap: Record<string, unknown>): Record<string, T> {
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
 *  @returns The role-separated map, and every discovered path - the full input createRouter expects. */
export function createComponentMap(moduleRegistry: ModuleRegistry): [componentMap: ComponentMap, componentPaths: string[]] {
  const componentMap: ComponentMap = {
    page: createFunctionMap<PageComponent>(moduleRegistry.page),
    layout: createFunctionMap<LayoutComponent>(moduleRegistry.layout),
    loading: createFunctionMap<LoadingComponent>(moduleRegistry.loading),
    error: createFunctionMap<ErrorComponent>(moduleRegistry.error),
    default: createFunctionMap<DefaultComponent>(moduleRegistry.default),
  }
  const componentPaths = Object.values(componentMap).flatMap(Object.keys)
  return [componentMap, componentPaths]
}
