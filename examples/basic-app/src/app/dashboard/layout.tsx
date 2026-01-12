import React from 'react'
import { Box, Text } from 'ink'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box flexDirection="column">
      <Box borderStyle="single" borderColor="blue" padding={1} marginBottom={1}>
        <Text color="blue" bold>Dashboard Section</Text>
      </Box>
      <Box paddingLeft={2}>
        {children}
      </Box>
    </Box>
  )
}
