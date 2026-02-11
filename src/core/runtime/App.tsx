import type { RouteManifest } from '@/core/route-builder'
import type { ComponentMap } from './types'

import { RouterProvider } from '@/core/router'
import { ErrorBoundary } from './ui/ErrorBoundary'
import { NotFoundBoundary } from './ui/NotFoundBoundary'
import { ErrorScreen } from './ui/ErrorScreen'
import { NotFoundScreen } from './ui/NotFoundScreen'
import { FileRouter } from './routing/FileRouter'

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
          <FileRouter
            manifest={manifest}
            components={components}
          />
        </NotFoundBoundary>
      </RouterProvider>
    </ErrorBoundary>
  )
}
