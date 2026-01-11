import { RouterProvider } from '@/core/router'
import { type RouteManifest } from '@/core/route-builder'
import { ErrorBoundary } from './boundaries/ErrorBoundary'
import { NotFoundBoundary } from './boundaries/NotFoundBoundary'
import { type ComponentMap } from './routing/composer'
import { ErrorScreen } from './screens/ErrorScreen'
import { NotFoundScreen } from './screens/NotFoundScreen'
import { FileRouter } from './FileRouter'

export interface AppProps {
  initialUrl: string
  manifest: RouteManifest
  components: ComponentMap
}

export function App({ initialUrl, manifest, components }: AppProps) {
  return (
    <ErrorBoundary fallback={ErrorScreen}>
      <RouterProvider initialUrl={initialUrl}>
        <NotFoundBoundary fallback={NotFoundScreen}>
          <FileRouter manifest={manifest} components={components} />
        </NotFoundBoundary>
      </RouterProvider>
    </ErrorBoundary>
  )
}
