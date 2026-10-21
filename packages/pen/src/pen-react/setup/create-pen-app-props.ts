import type { RoleModules } from './create-component-map'
import type { PenAppProps } from '@/pen-react/renderer/App'
import { compactMapRecord } from '@/lib/record'
import { createRouter } from '@/pen-core'
import { createComponentMap, createResolvedMatcher } from './create-component-map'

/** Strips the leading './' Vite's import.meta.glob puts on every key. */
function normalizeGlobPaths<T>(modules: Record<string, T>): Record<string, T> {
  return compactMapRecord(modules, (module, path) => [path.replace(/^\.\//, ''), module])
}

/** Resolves each role's glob'd modules into a resolved matcher - a function
 *  straight from pathname to a renderable match. Modules are expected to
 *  have been validated by `buildApp`.
 *
 *  @param modules - Each role's glob'd modules, keyed by role. */
export function createPenAppProps(modules: RoleModules): PenAppProps {
  const normalized: RoleModules = {
    page: normalizeGlobPaths(modules.page),
    layout: normalizeGlobPaths(modules.layout),
    loading: normalizeGlobPaths(modules.loading),
    error: normalizeGlobPaths(modules.error),
    default: normalizeGlobPaths(modules.default),
  }
  const { componentMap, allPaths } = createComponentMap(normalized)
  const { matcher } = createRouter(allPaths)
  const resolvedMatcher = createResolvedMatcher(matcher, componentMap)
  return { resolvedMatcher }
}
