import { RouterProvider } from '@/core/navigation'
import { type RouteManifest } from '@/core/route-builder'
import { Router } from '@/core/router'
import { ComponentMap } from '../runtime/composer'
import { ErrorBoundary } from './ErrorBoundary'
import { ErrorFallback } from './ErrorFallback'

export interface AppProps {
  initialUrl: string
  manifest: RouteManifest
  components: ComponentMap
}

export function App({ initialUrl, manifest, components }: AppProps) {
  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <RouterProvider initialUrl={initialUrl}>
        <Router manifest={manifest} components={components} />
      </RouterProvider>
    </ErrorBoundary>
  )
}
