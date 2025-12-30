import React, { type PropsWithChildren } from 'react'
import { Box, Text } from 'ink'

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
