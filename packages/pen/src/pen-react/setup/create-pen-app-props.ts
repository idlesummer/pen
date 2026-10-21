import type { RoleModules } from './create-component-map'
import type { PenAppProps } from '@/pen-react/renderer/App'
import { createRouter } from '@/pen-core'
import { createComponentMap, createResolvedMatcher } from './create-component-map'

/** Resolves each role's glob'd modules into a resolved matcher - a function
 *  straight from pathname to a renderable match. Modules are expected to
 *  have been validated by `buildApp`.
 *
 *  @param modules - Each role's glob'd modules, keyed by role. */
export function createPenAppProps(modules: RoleModules): PenAppProps {
  const { componentMap, allPaths } = createComponentMap(modules)
  const { matcher } = createRouter(allPaths)
  const resolvedMatcher = createResolvedMatcher(matcher, componentMap)
  return { resolvedMatcher }
}
