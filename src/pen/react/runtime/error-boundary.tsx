import type { ReactNode } from 'react'
import { Component, Suspense, use } from 'react'
import { loadModule } from './module-loader'

export type ErrorFallbackProps = {
  error: Error
  reset: () => void
}

type Props = {
  path: string
  children: ReactNode
}

type State = {
  error: Error | null
}

function Fallback({ path, error, reset }: { path: string } & ErrorFallbackProps) {
  // eslint-disable-next-line @eslint-react/static-components -- resolved by `use()`, not created here
  const FallbackComponent = use(loadModule(path))
  // eslint-disable-next-line @eslint-react/static-components -- resolved by `use()`, not created here
  return <FallbackComponent error={error} reset={reset} />
}

/** Catches render errors in its subtree and swaps in the route's lazily
 *  loaded `error` module, since only class components can catch errors. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    const { path, children } = this.props
    if (!error) return children

    return (
      <Suspense fallback={null}>
        <Fallback path={path} error={error} reset={this.reset} />
      </Suspense>
    )
  }
}
