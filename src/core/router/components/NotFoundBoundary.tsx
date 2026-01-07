// src/core/router/components/NotFoundBoundary.tsx
import { Component, type ComponentType, type PropsWithChildren } from 'react'
import { NotFoundError } from '../errors'

/** Props passed to not-found.tsx components */
export interface NotFoundComponentProps {
  url: string
}

interface NotFoundBoundaryProps extends PropsWithChildren {
  fallback: ComponentType<NotFoundComponentProps>
}

interface NotFoundBoundaryState {
  url: string | null
}

/**
 * Catches NotFoundError thrown by notFound() function.
 * Renders fallback component when caught.
 *
 * Does NOT catch:
 * - Non-NotFoundError errors (they bubble)
 */
export class NotFoundBoundary extends Component<NotFoundBoundaryProps, NotFoundBoundaryState> {
  state: NotFoundBoundaryState

  constructor(props: NotFoundBoundaryProps) {
    super(props)
    this.state = { url: null }
  }

  static getDerivedStateFromError(error: Error): NotFoundBoundaryState | null {
    // Only catch NotFoundError, other errors bubble
    return error instanceof NotFoundError ? { url: error.url } : null
  }

  componentDidCatch(error: Error) {
    if (!(error instanceof NotFoundError))  // Only handle NotFoundError
      throw error                           // Re-throw other errors
  }

  render() {
    if (this.state.url) {
      const NotFoundComponent = this.props.fallback
      return <NotFoundComponent url={this.state.url} />
    }
    return this.props.children
  }
}
