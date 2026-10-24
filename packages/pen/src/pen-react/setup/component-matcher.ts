import type { ReactNode } from 'react'
import type { ModuleRegistry } from '@/pen-react/modules'
import { createRouter } from '@/pen-core'
import { createComponentMap } from '@/pen-react/modules'
import { createRouteElement } from '@/pen-react/resolver'

/** Custom HMR event name a dev server sends a freshly-loaded `ModuleRegistry`
 *  under, after a route file is added or removed, so the running app can
 *  rebuild its component matcher and re-render without a restart. */
export const ROUTES_CHANGED_EVENT = 'pen:routes-changed'

/** Resolves a raw module registry into a function straight from pathname
 *  to a rendered route element.
 *
 *  @param moduleRegistry - Each role's raw glob'd entries, keyed by role. */
export function createComponentMatcher(moduleRegistry: ModuleRegistry): (url: string) => ReactNode {
  const [componentMap, componentPaths] = createComponentMap(moduleRegistry)
  const { routeMatcher } = createRouter(componentPaths)
  const componentMatcher = (url: string) => createRouteElement(url, routeMatcher, componentMap)
  return componentMatcher
}
