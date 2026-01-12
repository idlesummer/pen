import React from 'react'
import { Box, Text } from 'ink'

export default function AboutScreen() {
  return (
    <Box flexDirection="column" gap={1}>
      <Text color="magenta" bold>About This App</Text>
      <Text>This is a simple example demonstrating Pen's file-based routing.</Text>
      
      <Box marginTop={1} flexDirection="column">
        <Text bold>Features showcased:</Text>
        <Text>  ✓ Nested routes</Text>
        <Text>  ✓ Dynamic parameters</Text>
        <Text>  ✓ Layout components</Text>
        <Text>  ✓ File-based routing structure</Text>
      </Box>
    </Box>
  )
}
