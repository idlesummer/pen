import type { ModuleRegistry } from './create-component-registry'
import type { PenAppProps } from '@/pen-react/renderer/App'
import { createRouter } from '@/pen-core'
import { createComponentRegistry } from './create-component-registry'
import { createComponentMap } from './create-component-map'
import { createComponentMatcher } from './create-component-matcher'

/** Resolves a raw module registry into a component matcher - a function
 *  straight from pathname to a renderable match.
 *
 *  @param registry - Each role's raw glob'd entries, keyed by role. */
export function createPenAppProps(moduleRegistry: ModuleRegistry): PenAppProps {
  const componentRegistry = createComponentRegistry(moduleRegistry)
  const { componentMap, allPaths } = createComponentMap(componentRegistry)

  const { matcher } = createRouter(allPaths)
  const componentMatcher = createComponentMatcher(matcher, componentMap)
  return { componentMatcher }
}
