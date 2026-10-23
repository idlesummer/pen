import type { ReactNode } from 'react'
import type { ModuleRegistry } from './modules'
import { createRouter } from '@/pen-core'
import { createComponentRegistry, createComponentMap } from './modules'
import { createRouteElement } from './resolve'

/** Resolves a raw module registry into a function straight from pathname
 *  to a rendered route element.
 *
 *  @param moduleRegistry - Each role's raw glob'd entries, keyed by role. */
export function createComponentMatcher(moduleRegistry: ModuleRegistry): (pathname: string) => ReactNode {
  const componentRegistry = createComponentRegistry(moduleRegistry)
  const { componentMap, componentPaths } = createComponentMap(componentRegistry)
  const { routeMatcher } = createRouter(componentPaths)
  const componentMatcher = (pathname: string) => createRouteElement(routeMatcher(pathname), componentMap, pathname)
  return componentMatcher
}
