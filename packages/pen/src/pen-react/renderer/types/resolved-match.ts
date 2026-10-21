import type { ParamEntries } from '@/pen-core'
import type { PageComponent } from '@/pen-react/renderer/components/PageComponent'
import type { DefaultComponent } from '@/pen-react/renderer/components/DefaultBoundary'
import type { LayoutComponent } from '@/pen-react/renderer/components/LayoutComponent'
import type { LoadingComponent } from '@/pen-react/renderer/components/LoadingBoundary'
import type { ErrorComponent } from '@/pen-react/renderer/components/ErrorBoundary'

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
