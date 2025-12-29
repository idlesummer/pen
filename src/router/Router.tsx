import { createElement, type ComponentType, type ReactElement } from 'react'
import { Text, Box } from 'ink'
import { matchRoute } from '@/router/matcher'
import type { RouteManifest } from '@/build/manifest'


// ====================
// Component Loader
// ====================

/**
 * Component registry for loading components by path.
 * In a real implementation, this would use dynamic imports.
 */
type ComponentRegistry = Record<string, ComponentType>

let componentRegistry: ComponentRegistry = {}

/**
 * Register components for the router to use.
 * This is a simplified approach - in production you'd use dynamic imports.
 */
export function registerComponents(registry: ComponentRegistry): void {
  componentRegistry = registry
}

/**
 * Load a component from the registry.
 */
function loadComponent(path: string): ComponentType {
  const component = componentRegistry[path]
  
  if (!component)
    throw new Error(
      `Component not found: ${path}\n` +
      `Available components: ${Object.keys(componentRegistry).join(', ')}`,
    )
  
  return component
}

// ====================
// Router Component
// ====================

interface RouterProps {
  url: string
  manifest: RouteManifest
}

/**
 * Static Router - renders a route based on the provided URL.
 * 
 * How it works:
 * 1. Matches the URL against the manifest
 * 2. Loads all required components (layouts + screen)
 * 3. Nests them from root to leaf
 * 4. Returns the composed component tree
 */
export function Router({ url, manifest }: RouterProps): ReactElement {
  // Step 1: Match the route
  const metadata = matchRoute(url, manifest)

  // Step 2: Handle 404
  if (!metadata || !metadata.screen)
    return <NotFound url={url} />

  // Step 3: Load the screen component
  const Screen = loadComponent(metadata.screen)

  // Step 4: Build the nested component tree
  let element: ReactElement = createElement(Screen)

  // Step 5: Wrap with layouts (root → leaf order, so reverse for nesting)
  if (metadata.layouts && metadata.layouts.length > 0) {
    for (const layoutPath of metadata.layouts) {
      const Layout = loadComponent(layoutPath)
      element = createElement(Layout, null, element)
    }
  }

  return element
}

// ====================
// Not Found Component
// ====================

interface NotFoundProps {
  url: string
}

function NotFound({ url }: NotFoundProps): ReactElement {
  return (
    <Box flexDirection="column" padding={1}>
      <Text color="red" bold>
        404 - Route Not Found
      </Text>
      <Text>
        The route <Text color="yellow">{url}</Text> does not exist.
      </Text>
    </Box>
  )
}
