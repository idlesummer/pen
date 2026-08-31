import type { ComponentType, ReactNode } from 'react'
import { Component } from 'react'
import { DefaultSignal } from './notFound'

export type ErrorFallbackProps = {
  error: Error
  reset: () => void
}

type Props = {
  Fallback: ComponentType<ErrorFallbackProps>
  children: ReactNode
}

type State = {
  error: Error | null
}

/** Catches render errors in its subtree and swaps in the route's `error`
 *  module, since only class components can catch errors. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    if (error instanceof DefaultSignal) throw error // let it climb to a DefaultBoundary instead
    return { error }
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    const { Fallback, children } = this.props
    if (!error) return children
    return <Fallback error={error} reset={this.reset} />
  }
}
