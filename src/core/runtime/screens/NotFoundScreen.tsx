import { Box, Text, useInput } from 'ink'
import { useRouter } from '@/core/router'
import { type NotFoundComponentProps } from '../boundaries/NotFoundBoundary'

/**
 * Not found error screen displayed when a route is not found.
 * Shows the URL that was attempted.
 */
export function NotFoundScreen({ url }: NotFoundComponentProps) {
  const router = useRouter()

  useInput((input) => {
    if (input === 'b') router.back()
    if (input === 'q') process.exit(0)
  })

  return (
    <Box flexDirection="column" padding={2} borderStyle="round" borderColor="red">
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="red">Route Not Found</Text>
        <Text dimColor>{'The router couldn\'t match the requested URL.'}</Text>
      </Box>

      <Box flexDirection="column" paddingLeft={1} marginBottom={1}>
        <Text>
          Requested:{' '}
          <Text color="yellow" bold>
            {url}
          </Text>
        </Text>
      </Box>

      <Box
        flexDirection="column"
        padding={1}
        borderStyle="single"
        borderColor="gray"
        marginBottom={1}
      >
        <Text bold>Actions</Text>
        <Text dimColor>  [b] Go back</Text>
        <Text dimColor>  [q] Quit</Text>
      </Box>

      <Text dimColor>
        Tip: Check the route segment name or add a screen.tsx for this path.
      </Text>
    </Box>
  )
}
