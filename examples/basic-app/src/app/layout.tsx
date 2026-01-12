import React from 'react'
import { Box, Text } from 'ink'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="round" borderColor="cyan" padding={1} marginBottom={1}>
        <Text bold color="cyan">Pen Basic App - File-based Routing Demo</Text>
      </Box>
      {children}
    </Box>
  )
}
