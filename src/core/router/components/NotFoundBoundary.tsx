import { Component, type ComponentType, type PropsWithChildren } from 'react'
import { useRouter } from '@/core/navigation'
import { NotFoundError } from '../errors'

/** Props passed to not-found.tsx components */
export interface NotFoundComponentProps {
  url: string
}

interface NotFoundErrorBoundaryProps extends PropsWithChildren {
  fallback: ComponentType<NotFoundComponentProps>
  url: string
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
class NotFoundErrorBoundary extends Component<NotFoundErrorBoundaryProps, NotFoundBoundaryState> {
  state: NotFoundBoundaryState

  constructor(props: NotFoundErrorBoundaryProps) {
    super(props)
    this.state = { url: null }
  }

  /** Called when a child component throws during render. */
  static getDerivedStateFromError(error: Error) {
    // Only catch NotFoundError, other errors bubble
    return error instanceof NotFoundError ? { url: error.url } : null
  }

  componentDidCatch(error: Error) {
    if (!(error instanceof NotFoundError))  // Only handle NotFoundError
      throw error                           // Re-throw other errors
  }

  componentDidUpdate(prevProps: NotFoundErrorBoundaryProps) {
    if (prevProps.url !== this.props.url && this.state.url) // URL changed → clear not-found state
      this.setState({ url: null })
  }

  render() {
    if (this.state.url) {
      const NotFoundComponent = this.props.fallback
      return <NotFoundComponent url={this.state.url} />
    }
    return this.props.children
  }
}

export interface NotFoundBoundaryProps extends PropsWithChildren {
  fallback: ComponentType<NotFoundComponentProps>
}

export function NotFoundBoundary({ fallback, children }: NotFoundBoundaryProps) {
  const { url } = useRouter()
  return (
    <NotFoundErrorBoundary fallback={fallback} url={url}>
      {children}
    </NotFoundErrorBoundary>
  )
}
