import type { ComponentType } from 'react'

export type RouteComponent = ComponentType<Record<string, unknown>>
export type ComponentMap = Record<string, RouteComponent>

/** Looks up a route module's component by path. The specific prop shape
 *  (`TProps`) can't be verified statically - it's resolved from a path
 *  string at runtime - so callers assert the shape they expect. */
export function resolveComponent<TProps extends object = Record<string, unknown>>(path: string, componentMap: ComponentMap): ComponentType<TProps> {
  const Component = componentMap[path]
  if (!Component)
    throw new Error(`No component registered for route module "${path}". Regenerate the route builder output.`)
  return Component as unknown as ComponentType<TProps>
}
