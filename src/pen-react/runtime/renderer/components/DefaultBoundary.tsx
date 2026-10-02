import type { FunctionComponent, ReactNode } from 'react'
import type { ParamTable } from '../types/param-table'
import { Component } from 'react'
import { Text } from 'ink'

// ── signal ───────────────────────────────────────────────────────────────

/** Thrown by notFound() to trigger the nearest default boundary. */
export class DefaultSignal extends Error {}

/** Replaces the current content with its nearest default module. */
export function notFound() {
  throw new DefaultSignal()
}

// ── fallback ─────────────────────────────────────────────────────────────

/** Built-in fallback when no root default.tsx is defined. */
export function DefaultFallback() {
  return <Text>404 - Not Found</Text>
}

// ── boundary ─────────────────────────────────────────────────────────────

/** A default module receiving the params of its route position. */
export type DefaultComponent = FunctionComponent<{ params: ParamTable }>

type Props = {
  fallback: DefaultComponent
  params: ParamTable
  children: ReactNode
}

type State = {
  triggered: boolean
}

/** Catches notFound() and renders this position's default module.
 *  Other errors are re-thrown for the nearest error boundary. */
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
