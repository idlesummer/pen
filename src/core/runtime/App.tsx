import { RouterProvider } from '@/core/router'
import { ErrorBoundary } from './ui/ErrorBoundary'
import { NotFoundBoundary } from './ui/NotFoundBoundary'
import { ErrorScreen } from './ui/ErrorScreen'
import { NotFoundScreen } from './ui/NotFoundScreen'
import { FileRouter, type CompiledRoutes } from './routing/FileRouter'

export interface AppProps {
  initialUrl: string
  routes: CompiledRoutes
}

/**
 * Root application component.
 * Routes are pre-built at build time via codegen - no runtime composition needed!
 */
export function App({ initialUrl, routes }: AppProps) {
  return (
    <ErrorBoundary fallback={ErrorScreen}>
      <RouterProvider initialUrl={initialUrl}>
        <NotFoundBoundary fallback={NotFoundScreen}>
          <FileRouter routes={routes} />
        </NotFoundBoundary>
      </RouterProvider>
    </ErrorBoundary>
  )
}
