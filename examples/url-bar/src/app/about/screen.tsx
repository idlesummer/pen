import { Box, Text } from 'ink'

export default function AboutScreen() {
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="blue">About</Text>
      <Text>This example shows a sticky URL bar built with useInput.</Text>
      <Text>Type any path and press Enter to navigate.</Text>
    </Box>
  )
}
