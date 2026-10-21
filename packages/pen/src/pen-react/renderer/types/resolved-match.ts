import type { ParamEntries } from '@/pen-core'
import type { PageComponent, LayoutComponent, LoadingComponent, ErrorComponent, DefaultComponent } from './component-map'

/** A frame with every path reference already resolved to a component. */
export type ResolvedFrame = {
  layout?: LayoutComponent
  loading?: LoadingComponent
  error?: ErrorComponent
  default?: DefaultComponent
  slots?: string[]
  paramCount: number
}

/** An endpoint with its content and frame chain already resolved. */
export type ResolvedEndpoint = {
  frames: ResolvedFrame[]
  content: PageComponent | DefaultComponent
  paramCount: number
}

/** A route match with every path reference resolved into a real component -
 *  everything the renderer needs to build a React tree, and nothing else. */
export type ResolvedMatch = {
  endpoint: ResolvedEndpoint
  params: ParamEntries
  slots?: Record<string, ResolvedMatch>
}

/** Resolves a pathname straight into a renderable match. */
export type ResolvedMatcher = (pathname: string) => ResolvedMatch
