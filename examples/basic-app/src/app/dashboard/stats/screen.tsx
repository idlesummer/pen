import React from 'react'
import { Box, Text } from 'ink'

export default function StatsScreen() {
  return (
    <Box flexDirection="column" gap={1}>
      <Text color="green" bold>Statistics</Text>
      <Box flexDirection="column">
        <Text>📊 Total Users: 1,234</Text>
        <Text>📈 Active Sessions: 56</Text>
        <Text>💰 Revenue: $12,345</Text>
      </Box>
    </Box>
  )
}
