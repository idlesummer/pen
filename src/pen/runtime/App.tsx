import type { RoutingTable } from './routing/composer'
import { RouterProvider } from '@/pen/api'
import { ErrorBoundary } from './ui/ErrorBoundary'
import { NotFoundBoundary } from './ui/NotFoundBoundary'
import { ErrorScreen } from './ui/ErrorScreen'
import { NotFoundScreen } from './ui/NotFoundScreen'
import { FileRouter } from './FileRouter'
import { buildRoutes } from './routing/resolver'

export type AppProps = {
  initialUrl: string
  routingTable: RoutingTable
}

/**
 * Root application component.
 * Routes are compiled at build time via codegen - no runtime composition needed!
 */
export function App({ initialUrl, routingTable }: AppProps) {
  const routes = buildRoutes(routingTable)

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
