import type { ReactNode } from 'react'
import type { ModuleRegistry } from '@/pen-react/modules'
import { createRouter } from '@/pen-core'
import { createComponentRegistry, createComponentMap } from '@/pen-react/modules'
import { createRouteElement } from '@/pen-react/resolver'

/** Resolves a raw module registry into a function straight from pathname
 *  to a rendered route element.
 *
 *  @param moduleRegistry - Each role's raw glob'd entries, keyed by role. */
export function createComponentMatcher(moduleRegistry: ModuleRegistry): (url: string) => ReactNode {
  const componentRegistry = createComponentRegistry(moduleRegistry)
  const { componentMap, componentPaths } = createComponentMap(componentRegistry)
  const { routeMatcher } = createRouter(componentPaths)
  const componentMatcher = (url: string) => createRouteElement(routeMatcher(url), componentMap, url)
  return componentMatcher
}
