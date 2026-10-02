import type { FunctionComponent, ReactNode } from 'react'
import type { Params } from '../types/params'
import { Component } from 'react'
import { Text } from 'ink'

// ── signal ───────────────────────────────────────────────────────────────

/** Thrown by notFound() and caught only by DefaultBoundary - ErrorBoundary
 *  re-throws it unrecognized so it keeps climbing past any error.tsx that
 *  doesn't also own a default.tsx, until it reaches one that does. */
export class DefaultSignal extends Error {}

/** Call from anywhere in a page's render to show that position's default
 *  module instead of the page. */
export function notFound() {
  throw new DefaultSignal()
}

// ── fallback ─────────────────────────────────────────────────────────────

/** Built-in fallback rendered when an app defines no root `default.tsx` -
 *  guarantees every URL resolves to something instead of a blank screen. */
export function DefaultFallback() {
  return <Text>404 - Not Found</Text>
}

// ── boundary ─────────────────────────────────────────────────────────────

/** default.tsx is used two ways - direct content, or here as DefaultBoundary's
 *  fallback on a notFound() call - both always have params to offer, scoped to
 *  whichever position owns the default (the matched position for direct
 *  content, this boundary's own frame when triggered). */
export type DefaultComponent = FunctionComponent<{ params: Params }>

type Props = {
  fallback: DefaultComponent
  params: Params
  children: ReactNode
}

type State = {
  triggered: boolean
}

/** Catches notFound() calls in its subtree and swaps in this position's
 *  default module. Re-throws anything that isn't a DefaultSignal so real
 *  errors keep climbing to find an actual ErrorBoundary instead of being
 *  swallowed here. */
export class DefaultBoundary extends Component<Props, State> {
  state: State = { triggered: false }

  static getDerivedStateFromError(error: unknown): State {
    if (!(error instanceof DefaultSignal)) throw error
    return { triggered: true }
  }

  render() {
    const { fallback: Fallback, params, children } = this.props
    return this.state.triggered ? <Fallback params={params} /> : children
  }
}
