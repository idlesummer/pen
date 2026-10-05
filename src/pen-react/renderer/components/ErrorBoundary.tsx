import type { FunctionComponent, ReactNode } from 'react'
import { Component } from 'react'
import { Text } from 'ink'
import { DefaultSignal } from './DefaultBoundary'

// ── component ────────────────────────────────────────────────────────────

/** Props passed to an error component. */
export type ErrorComponentProps = {
  error: Error
  reset: () => void
}

/** An error component receiving the current error and a reset function. */
export type ErrorComponent = FunctionComponent<ErrorComponentProps>

// ── fallback ─────────────────────────────────────────────────────────────

/** Built-in fallback rendered when an app defines no root `error.tsx`. */
export function ErrorFallback({ error }: ErrorComponentProps) {
  return <Text>Something went wrong: {error.message}{'\n\n'}{error.stack}</Text>
}

// ── boundary ─────────────────────────────────────────────────────────────

type ErrorBoundaryProps = {
  fallback: ErrorComponent
  pathname: string
  children: ReactNode
}

type ErrorBoundaryState = {
  error?: Error
  pathname: string
}

/** Catches render errors and renders the route's `error` module. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { pathname: this.props.pathname }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    if (error instanceof DefaultSignal) throw error // let it climb to a DefaultBoundary instead
    return { error }
  }

  /** Resets the error when the route changes. */
  static getDerivedStateFromProps(props: ErrorBoundaryProps, state: ErrorBoundaryState): ErrorBoundaryState {
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
