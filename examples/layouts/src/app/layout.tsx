import React, { type PropsWithChildren } from 'react'
import { Box, Text } from 'ink'

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">Header (from root layout)</Text>
      </Box>
      {children}
      <Box marginTop={1}>
        <Text dimColor>Footer (from root layout)</Text>
      </Box>
    </Box>
  )
}
