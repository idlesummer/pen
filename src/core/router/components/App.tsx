// core/router/components/App.tsx
import { RouterProvider } from '@/core/navigation/RouterProvider'
import { Router } from '@/core/router/components/Router'
import type { RouteManifest } from '@/core/route-builder/route-manifest'
import type { ComponentMap } from '@/core/router'

export interface AppProps {
  initialUrl: string
  manifest: RouteManifest
  components: ComponentMap
}

export function App({ initialUrl, manifest, components }: AppProps) {
  return (
    <RouterProvider initialUrl={initialUrl}>
      <Router manifest={manifest} components={components} />
    </RouterProvider>
  )
}
