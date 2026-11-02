import type { ReactNode } from 'react'
import type { ModuleRegistry } from '@/pen-react/modules'
import { createRouter } from '@/pen-core'
import { createComponentMap } from '@/pen-react/modules'
import { createRouteElement } from './composer/create-element'

/** Resolves a route straight to its rendered route element. */
export type RouteRenderer = (route: string) => ReactNode

/** Resolves a raw module registry into a function straight from route
 *  to a rendered route element.
 *
 *  @param moduleRegistry - Each role's raw glob'd entries, keyed by role.
 */
export function createRouteRenderer(moduleRegistry: ModuleRegistry): RouteRenderer {
  const [componentMap, componentPaths] = createComponentMap(moduleRegistry)
  const { routeMatcher } = createRouter(componentPaths)
  const routeRenderer = (route: string) => createRouteElement(route, routeMatcher, componentMap)
  return routeRenderer
}
