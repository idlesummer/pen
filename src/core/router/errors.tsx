import { type ReactElement } from 'react'
import { Text, Box } from 'ink'

interface NotFoundProps {
  url: string
}

/**
 * 404 error screen displayed when a route is not found.
 * Shows the URL that was attempted.
 */
export function NotFoundScreen({ url }: NotFoundProps): ReactElement {
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
