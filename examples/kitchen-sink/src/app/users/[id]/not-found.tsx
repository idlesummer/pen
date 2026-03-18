// examples/kitchen-sink/src/app/users/[id]/not-found.tsx
// Route-level not-found — only catches 404s thrown inside /users/[id]/
import { Box, Text } from 'ink'
import type { NotFoundComponentProps } from '@idlesummer/pen'

export default function UserNotFound({ url }: NotFoundComponentProps) {
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="yellow">User Not Found</Text>
      <Text dimColor>No user at: <Text color="white">{url}</Text></Text>
      <Text dimColor>(route-level not-found.tsx — closer than the root one)</Text>
    </Box>
  )
}
