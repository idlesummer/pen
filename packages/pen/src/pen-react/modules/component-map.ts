import type { PageComponent } from '@/pen-react/components/PageComponent'
import type { LayoutComponent } from '@/pen-react/components/LayoutComponent'
import type { LoadingComponent } from '@/pen-react/components/LoadingBoundary'
import type { ErrorComponent } from '@/pen-react/components/ErrorBoundary'
import type { DefaultComponent } from '@/pen-react/components/DefaultBoundary'
import type { ModuleRegistry } from './module-registry'
import { hasFunctionDefaultExport } from '@/lib/module'

/** Components grouped by route module role, keyed by module path. */
export type ComponentMap = {
  page:     Record<string, PageComponent>
  layout:   Record<string, LayoutComponent>
  loading:  Record<string, LoadingComponent>
  error:    Record<string, ErrorComponent>
  default:  Record<string, DefaultComponent>
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
