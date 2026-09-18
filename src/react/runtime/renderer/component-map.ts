import type { ComponentType, ReactNode } from 'react'
import type { ErrorFallbackProps } from '../boundaries/ErrorBoundary'

/** The keyed shape a page/layout component reads params.id off of - built
 *  once, wherever the router's ordered Params gets handed to a component as
 *  a prop. */
export type ParamTable = Record<string, string | string[]>

export type PageComponent = ComponentType<{ params: ParamTable }>
/** The index signature has to include ParamTable, not just ReactNode - a
 *  plain `& Record<string, ReactNode>` would force `params` itself to also
 *  satisfy the index signature, and ParamTable isn't a ReactNode. Slot props
 *  are still ReactNode in practice; this just widens what TS will accept. */
export type LayoutComponent = ComponentType<{ params: ParamTable } & Record<string, ReactNode | ParamTable>>
export type LoadingComponent = ComponentType<Record<string, never>>
export type ErrorComponent = ComponentType<ErrorFallbackProps>
/** default.tsx plays two roles: rendered directly as content (gets params,
 *  like a page) when nothing more specific matched, or invoked by
 *  DefaultBoundary with no props at all when notFound() fires deeper in the
 *  tree - params has to be optional to be valid in both. */
export type DefaultComponent = ComponentType<{ params?: ParamTable }>

/** One bucket per route module role - the thing that actually varies
 *  between modules is which of these five roles a file plays, not the
 *  individual file, so every module in a bucket genuinely shares that
 *  bucket's real prop shape. */
export type ComponentMap = {
  page: Record<string, PageComponent>
  layout: Record<string, LayoutComponent>
  loading: Record<string, LoadingComponent>
  error: Record<string, ErrorComponent>
  default: Record<string, DefaultComponent>
}

/** Looks up a route module's component by role and path. The role fixes the
 *  return type - no assertion needed, since each bucket only ever holds
 *  components with that bucket's own real shape. */
export function resolveComponent<Role extends keyof ComponentMap>(role: Role, path: string, componentMap: ComponentMap): ComponentMap[Role][string] {
  const Component = componentMap[role][path] as ComponentMap[Role][string] | undefined
  if (!Component)
    throw new Error(`No ${role} component registered for route module "${path}". Regenerate the route builder output.`)
  return Component
}

/** endpoint.content can be either a real page or the fallback default -
 *  which one won isn't known until match time, so this checks both buckets
 *  instead of the caller having to know which role won. */
export function resolveContent(path: string, componentMap: ComponentMap): PageComponent | DefaultComponent {
  const Component = componentMap.page[path] ?? componentMap.default[path]
  if (!Component)
    throw new Error(`No page or default component registered for route module "${path}". Regenerate the route builder output.`)
  return Component
}
