import { RouterProvider } from '@/core/router'
import { ErrorBoundary } from './ui/ErrorBoundary'
import { NotFoundBoundary } from './ui/NotFoundBoundary'
import { ErrorScreen } from './ui/ErrorScreen'
import { NotFoundScreen } from './ui/NotFoundScreen'
import { FileRouter } from './routing/FileRouter'
import type { CompiledRoutes } from './types'

export interface AppProps {
  initialUrl: string
  routes: CompiledRoutes
}

/**
 * Root application component.
 * Routes are compiled at build time via codegen - no runtime composition needed!
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
