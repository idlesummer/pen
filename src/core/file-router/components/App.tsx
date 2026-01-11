import { RouterProvider } from '@/core/navigation'
import { type RouteManifest } from '@/core/route-builder'
import { ComponentMap } from '../runtime/composer'
import { ErrorBoundary } from './ErrorBoundary'
import { ErrorScreen } from './ErrorScreen'
import { FileRouter } from './FileRouter'
import { NotFoundScreen } from './NotFoundScreen'
import { NotFoundBoundary } from './NotFoundBoundary'

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
