import type { ComponentType, ReactNode } from 'react'
import type { ParamTable } from '../params'
import type { ErrorComponent } from '../boundaries/ErrorBoundary'
import type { DefaultComponent } from '../boundaries/DefaultBoundary'

export type PageComponent = ComponentType<{ params: ParamTable }>
/** Index signature must include ParamTable, not just ReactNode, or `params`
 *  itself fails to satisfy its own index signature. */
export type LayoutComponent = ComponentType<{ params: ParamTable } & Record<string, ReactNode | ParamTable>>
export type LoadingComponent = ComponentType<Record<string, never>>

/** One bucket per route module role; every module in a bucket shares that
 *  role's real prop shape. */
export type ComponentMap = {
  page: Record<string, PageComponent>
  layout: Record<string, LayoutComponent>
  loading: Record<string, LoadingComponent>
  error: Record<string, ErrorComponent>
  default: Record<string, DefaultComponent>
}

/** Looks up a component by role and path - role determines the return type,
 *  no assertion needed. */
export function resolveComponent<Role extends keyof ComponentMap>(role: Role, path: string, componentMap: ComponentMap): ComponentMap[Role][string] {
  const Component = componentMap[role][path] as ComponentMap[Role][string] | undefined
  if (!Component)
    throw new Error(`No ${role} component registered for route module "${path}". Regenerate the route builder output.`)
  return Component
}

/** endpoint.content can be a page or the fallback default, decided at match
 *  time, so this checks both buckets. */
export function resolveContent(path: string, componentMap: ComponentMap): PageComponent | DefaultComponent {
  const Component = componentMap.page[path] ?? componentMap.default[path]
  if (!Component)
    throw new Error(`No page or default component registered for route module "${path}". Regenerate the route builder output.`)
  return Component
}
