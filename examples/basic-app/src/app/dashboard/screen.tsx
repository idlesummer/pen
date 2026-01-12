import React from 'react'
import { Box, Text } from 'ink'

export default function DashboardScreen() {
  return (
    <Box flexDirection="column" gap={1}>
      <Text color="blue">Dashboard Home</Text>
      <Text dimColor>This demonstrates nested routing with a dashboard layout.</Text>
      
      <Box marginTop={1}>
        <Text>Try navigating to <Text color="yellow">/dashboard/stats</Text> or <Text color="yellow">/dashboard/settings</Text></Text>
      </Box>
    </Box>
  )
}
