import React from 'react'
import { Box, Text } from 'ink'

export default function HomeScreen() {
  return (
    <Box flexDirection="column" gap={1}>
      <Text color="green">Welcome to Pen!</Text>
      <Text dimColor>This is the home screen (/) route.</Text>
      
      <Box marginTop={1} flexDirection="column" gap={0}>
        <Text bold>Available routes:</Text>
        <Text>  - <Text color="yellow">/</Text>           Home (this page)</Text>
        <Text>  - <Text color="yellow">/about</Text>      About page</Text>
        <Text>  - <Text color="yellow">/dashboard</Text>  Dashboard with nested routes</Text>
        <Text>  - <Text color="yellow">/users/[id]</Text> Dynamic user pages</Text>
      </Box>
    </Box>
  )
}
