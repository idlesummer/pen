import { RouterProvider } from '@/core/navigation/RouterProvider'
import { Router } from '@/core/router/components/Router'
import type { RouteManifest } from '@/core/route-builder/builders/route-manifest'
import { ComponentMap } from '../runtime/composer'
import { ErrorBoundary } from './ErrorBoundary'
import { GlobalErrorFallback } from './GlobalErrorFallback'

export interface AppProps {
  initialUrl: string
  manifest: RouteManifest
  components: ComponentMap
}

export function App({ initialUrl, manifest, components }: AppProps) {
  return (
    <ErrorBoundary ErrorComponent={GlobalErrorFallback}>
      <RouterProvider initialUrl={initialUrl}>
        <Router manifest={manifest} components={components} />
      </RouterProvider>
    </ErrorBoundary>
  )
}
