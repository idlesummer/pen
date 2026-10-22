import type { ModuleRegistry } from './create-component-registry'
import type { ComponentMatcher } from '@/pen-react/renderer/types/matcher'
import { createRouter } from '@/pen-core'
import { createComponentRegistry } from './create-component-registry'
import { createComponentMap } from './create-component-map'
import { createComponentMatcher } from './create-component-matcher'

/** Resolves a raw module registry into a component matcher - a function
 *  straight from pathname to a renderable match.
 *
 *  @param moduleRegistry - Each role's raw glob'd entries, keyed by role. */
export function createAppMatcher(moduleRegistry: ModuleRegistry): ComponentMatcher {
  const componentRegistry = createComponentRegistry(moduleRegistry)
  const { componentMap, componentPaths } = createComponentMap(componentRegistry)

  const { routeMatcher } = createRouter(componentPaths)
  return createComponentMatcher(routeMatcher, componentMap)
}
