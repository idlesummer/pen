import type { FunctionComponent, ReactNode } from 'react'
import type { Params } from '../types/params'
import { Component } from 'react'
import { Text } from 'ink'

// ── component ────────────────────────────────────────────────────────────

/** Props passed to a default component. */
export type DefaultComponentProps = {
  params: Params
}

/** A default component receiving the params of its route position. */
export type DefaultComponent = FunctionComponent<DefaultComponentProps>

// ── fallback ─────────────────────────────────────────────────────────────

/** Built-in fallback when no root default.tsx is defined. */
export function DefaultFallback() {
  return <Text>404 - Not Found</Text>
}

// ── boundary ─────────────────────────────────────────────────────────────

type DefaultBoundaryProps = {
  fallback: DefaultComponent
  params: Params
  children: ReactNode
}

type DefaultBoundaryState = {
  triggered: boolean
}

/** Catches notFound() and renders this position's default component.
 *  Other errors are re-thrown for the nearest error boundary. */
export class DefaultBoundary extends Component<DefaultBoundaryProps, DefaultBoundaryState> {
  constructor(props: DefaultBoundaryProps) {
    super(props)
    this.state = { triggered: false }
  }

  static getDerivedStateFromError(error: unknown): DefaultBoundaryState {
    if (!(error instanceof DefaultSignal)) throw error
    return { triggered: true }
  }

  render() {
    const { fallback: Fallback, params, children } = this.props
    return this.state.triggered ? <Fallback params={params} /> : children
  }
}

// ── signal ───────────────────────────────────────────────────────────────

/** Thrown by notFound() to trigger the nearest default boundary. */
export class DefaultSignal extends Error {}

/** Replaces the current content with its nearest default component. */
export function notFound() {
  throw new DefaultSignal()
}
