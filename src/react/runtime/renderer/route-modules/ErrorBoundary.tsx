import type { ComponentType, ReactNode } from 'react'
import { Component } from 'react'
import { DefaultSignal } from './DefaultBoundary'

export type ErrorFallbackProps = {
  error: Error
  reset: () => void
}

export type ErrorComponent = ComponentType<ErrorFallbackProps>

type Props = {
  fallback: ErrorComponent
  pathname: string
  children: ReactNode
}

type State = {
  error: Error | null
  pathname: string
}

/** Catches render errors in its subtree and swaps in the route's `error`
 *  module, since only class components can catch errors. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, pathname: this.props.pathname }

  static getDerivedStateFromError(error: Error): Partial<State> {
    if (error instanceof DefaultSignal) throw error // let it climb to a DefaultBoundary instead
    return { error }
  }

  /** Clears a caught error once navigation moves past the route that threw
   *  it, so a stale error doesn't keep blocking content the user has since
   *  navigated away from - matches Next.js's own auto-reset on segment
   *  change, since nothing else here ever clears state on its own. */
  static getDerivedStateFromProps(props: Props, state: State): State {
    if (props.pathname === state.pathname) return state
    return { error: null, pathname: props.pathname }
  }

  reset = () =>
    this.setState({ error: null })

  render() {
    const { fallback: Fallback, children } = this.props
    const error = this.state.error
    return error
      ? <Fallback error={error} reset={this.reset} />
      : children
  }
}
