import type { ModuleRegistry } from './module-registry'
import type { PenAppProps } from '@/pen-react/renderer/App'
import { compactMapRecord } from '@/lib/record'
import { createRouter } from '@/pen-core'
import { cleanModuleRegistry } from './module-registry'
import { createComponentMap } from './create-component-map'
import { createComponentMatcher } from './create-component-matcher'

/** Strips the leading './' Vite's import.meta.glob puts on every key. */
function normalizeGlobPaths<T>(registry: Record<string, T>): Record<string, T> {
  return compactMapRecord(registry, (path, value) => [path.replace(/^\.\//, ''), value])
}

/** Resolves a raw module registry into a component matcher - a function
 *  straight from pathname to a renderable match.
 *
 *  @param registry - Each role's raw glob'd entries, keyed by role. */
export function createPenAppProps(registry: ModuleRegistry): PenAppProps {
  const normalized: ModuleRegistry = {
    page: normalizeGlobPaths(registry.page),
    layout: normalizeGlobPaths(registry.layout),
    loading: normalizeGlobPaths(registry.loading),
    error: normalizeGlobPaths(registry.error),
    default: normalizeGlobPaths(registry.default),
  }
  const cleaned = cleanModuleRegistry(normalized)
  const { componentMap, allPaths } = createComponentMap(cleaned)

  const { matcher } = createRouter(allPaths)
  const componentMatcher = createComponentMatcher(matcher, componentMap)
  return { componentMatcher }
}
