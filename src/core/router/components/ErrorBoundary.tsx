import { Component, type ComponentType, type PropsWithChildren } from 'react'

/**
 * Props passed to error.tsx components
 */
export interface ErrorComponentProps {
  error: Error
  reset: () => void
}

interface ErrorBoundaryProps extends PropsWithChildren {
  ErrorComponent: ComponentType<ErrorComponentProps>
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * React Error Boundary that catches errors in child components.
 * Renders the provided ErrorComponent when an error occurs.
 *
 * Catches:
 * - Errors during rendering
 * - Errors in lifecycle methods
 * - Errors in constructors
 *
 * Does NOT catch:
 * - Event handlers (use try-catch)
 * - Async code (use try-catch)
 * - Errors in the error boundary itself
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
    this.reset = this.reset.bind(this)  // Bind all methods that will be passed as callbacks
  }

  /** Called when a child component throws during render. */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  /** Called after error is caught (for side effects like logging). */
  componentDidCatch() {
    // Error is passed to error.tsx component via props
    // React automatically logs errors in development mode
  }

  /** Resets error state and attempts to re-render children. */
  reset() {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      const { ErrorComponent } = this.props
      return <ErrorComponent error={this.state.error} reset={this.reset} />
    }
    return this.props.children
  }
}
