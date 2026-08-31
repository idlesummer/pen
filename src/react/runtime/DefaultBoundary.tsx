import type { ComponentType, ReactNode } from 'react'
import { Component } from 'react'
import { DefaultSignal } from './notFound'

type Props = {
  Fallback: ComponentType
  children: ReactNode
}

type State = {
  triggered: boolean
}

/** Catches notFound() calls in its subtree and swaps in this position's
 *  default module - same climb-and-catch mechanism as ErrorBoundary, since
 *  only class components can catch. Re-throws anything that isn't a
 *  DefaultSignal from getDerivedStateFromError itself, so real errors keep
 *  climbing to find an actual ErrorBoundary instead of being swallowed here. */
export class DefaultBoundary extends Component<Props, State> {
  state: State = { triggered: false }

  static getDerivedStateFromError(error: unknown): State {
    if (!(error instanceof DefaultSignal)) throw error
    return { triggered: true }
  }

  render() {
    const { triggered } = this.state
    const { Fallback, children } = this.props
    if (!triggered) return children
    return <Fallback />
  }
}
