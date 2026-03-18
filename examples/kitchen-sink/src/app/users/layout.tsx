// examples/kitchen-sink/src/app/users/layout.tsx
// Nested layout — wraps /users/ and /users/[id]/
import type { PropsWithChildren } from 'react'
import { Box, Text } from 'ink'

export default function UsersLayout({ children }: PropsWithChildren) {
  return (
    <Box flexDirection="column">
      <Box borderStyle="single" borderColor="blue" paddingX={1} marginBottom={1}>
        <Text bold color="blue">Users</Text>
        <Text dimColor>  (nested layout)</Text>
      </Box>
      <Box paddingLeft={2}>
        {children}
      </Box>
    </Box>
  )
}
