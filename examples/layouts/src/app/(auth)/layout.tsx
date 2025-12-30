import { Box, Text } from 'ink'
import type { PropsWithChildren } from 'react'

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="green">Auth Header (from auth layout)</Text>
      </Box>
      {children}
      <Box marginTop={1}>
        <Text dimColor>Auth Footer (from auth layout)</Text>
      </Box>
    </Box>
  )
}
