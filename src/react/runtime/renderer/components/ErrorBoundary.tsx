import type { FunctionComponent, ReactNode } from 'react'
import { Component } from 'react'
import { Text } from 'ink'
import { DefaultSignal } from './DefaultBoundary'

// ── fallback ─────────────────────────────────────────────────────────────

export type ErrorFallbackProps = {
  error: Error
  reset: () => void
}

export type ErrorComponent = FunctionComponent<ErrorFallbackProps>

/** Built-in fallback rendered when an app defines no root `error.tsx` -
 *  guarantees an uncaught throw never crashes the whole process. */
export function ErrorFallback({ error }: ErrorFallbackProps) {
  return <Text>Something went wrong: {error.message}</Text>
}

// ── boundary ─────────────────────────────────────────────────────────────

type Props = {
  fallback: ErrorComponent
  pathname: string
  children: ReactNode
}

type State = {
  error?: Error
  pathname: string
}

/** Catches render errors and renders the route's `error` module. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { pathname: this.props.pathname }

  static getDerivedStateFromError(error: Error): Partial<State> {
    if (error instanceof DefaultSignal) throw error // let it climb to a DefaultBoundary instead
    return { error }
  }

  /** Resets the error when the route changes. */
  static getDerivedStateFromProps(props: Props, state: State): State {
    return props.pathname !== state.pathname
      ? { error: undefined, pathname: props.pathname }
      : state
  }

  reset() {
    this.setState({ error: undefined })
  }

  render() {
    const { fallback: Fallback, children } = this.props
    const error = this.state.error
    return error
      ? <Fallback error={error} reset={this.reset.bind(this)} />
      : children
  }
}
