import { createElement, type ComponentType, type ReactElement } from 'react'
import { Text, Box } from 'ink'
import { matchRoute } from './matcher'
import type { RouteManifest } from '../build/manifest'


interface RouterProps {
  url: string
  manifest: RouteManifest
  components: Record<string, ComponentType>
}

export function Router({ url, manifest, components }: RouterProps): ReactElement {
  // Step 1: Match the route
  const metadata = matchRoute(url, manifest)

  // Step 2: Handle 404
  if (!metadata || !metadata.screen)
    return <NotFound url={url} />

  // Step 3: Load the screen component
  const Screen = components[metadata.screen]
  if (!Screen)
    throw new Error(`Component not found: ${metadata.screen}`)

  // Step 4: Build the nested component tree
  let element = createElement(Screen)

  // Step 5: Wrap with layouts (leaf → root order, so iterate forward)
  if (metadata.layouts && metadata.layouts.length) {
    for (const layoutPath of metadata.layouts) {
      const Layout = components[layoutPath]
      if (!Layout)
        throw new Error(`Layout not found: ${layoutPath}`)
      element = createElement(Layout, null, element)
    }
  }
  return element
}

// 404 Component
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
