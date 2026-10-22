import type { ModuleRegistry } from './module-registry'
import type { PenAppProps } from '@/pen-react/renderer/App'
import { createRouter } from '@/pen-core'
import { normalizeModuleRegistry, cleanModuleRegistry } from './module-registry'
import { createComponentMap } from './create-component-map'
import { createComponentMatcher } from './create-component-matcher'

/** Resolves a raw module registry into a component matcher - a function
 *  straight from pathname to a renderable match.
 *
 *  @param registry - Each role's raw glob'd entries, keyed by role. */
export function createPenAppProps(registry: ModuleRegistry): PenAppProps {
  const normalized = normalizeModuleRegistry(registry)
  const cleaned = cleanModuleRegistry(normalized)
  const { componentMap, allPaths } = createComponentMap(cleaned)

  const { matcher } = createRouter(allPaths)
  const componentMatcher = createComponentMatcher(matcher, componentMap)
  return { componentMatcher }
}
