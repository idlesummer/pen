import type { PageComponent } from './components/PageComponent'
import type { LayoutComponent } from './components/LayoutComponent'
import type { LoadingComponent } from './components/LoadingBoundary'
import type { ErrorComponent } from './components/ErrorBoundary'
import type { FallbackComponent } from './components/FallbackBoundary'
import type { ModuleRegistry } from './module-registry'
import { GLOBAL_FALLBACK } from '@/pen-core'
import { hasFunctionDefaultExport } from '@/lib/module'
import { DefaultFallback } from './components/FallbackBoundary'

/** Components grouped by route module role, keyed by module path. */
export type ComponentMap = {
  page:     Record<string, PageComponent>
  layout:   Record<string, LayoutComponent>
  loading:  Record<string, LoadingComponent>
  error:    Record<string, ErrorComponent>
  fallback:  Record<string, FallbackComponent>
}

/** Extracts function default exports into a map keyed by paths without a leading `./`. */
function createFunctionMap<T>(moduleMap: Record<string, unknown>): Record<string, T> {
  const components: Record<string, T> = {}
  for (const [path, module] of Object.entries(moduleMap)) {
    if (hasFunctionDefaultExport<T>(module))
      components[path.replace(/^\.\//, '')] = module.default
  }
  return components
}

/** Creates role-specific component maps and collects their module paths.
 *
 *  @param moduleRegistry - Each role's raw glob'd modules, keyed by role.
 *  @returns The component map and paths with function default exports. */
export function createComponentMap(moduleRegistry: ModuleRegistry): [componentMap: ComponentMap, componentPaths: string[]] {
  const roleMaps = {
    page: createFunctionMap<PageComponent>(moduleRegistry.page),
    layout: createFunctionMap<LayoutComponent>(moduleRegistry.layout),
    loading: createFunctionMap<LoadingComponent>(moduleRegistry.loading),
    error: createFunctionMap<ErrorComponent>(moduleRegistry.error),
    fallback: createFunctionMap<FallbackComponent>(moduleRegistry.fallback),
  }
  // Collected before the sentinel is added below - it's not a real module path.
  const componentPaths = Object.values(roleMaps).flatMap(Object.keys)

  const componentMap: ComponentMap = {
    ...roleMaps,
    fallback: { ...roleMaps.fallback, [GLOBAL_FALLBACK]: DefaultFallback },
  }
  return [componentMap, componentPaths]
}
