import { RouterProvider } from '@/core/router'
import { ErrorBoundary } from './boundaries/ErrorBoundary'
import { NotFoundBoundary } from './boundaries/NotFoundBoundary'
import { ErrorScreen } from './screens/ErrorScreen'
import { NotFoundScreen } from './screens/NotFoundScreen'
import { FileRouter } from './FileRouter'

import type { RouteManifest } from '@/core/route-builder'
import type { ComponentMap } from './types'

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
