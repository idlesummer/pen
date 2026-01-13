// examples/router-2/src/app/about/screen.tsx
import { Box, Text } from 'ink'
import { text } from './_test'

export default function AboutScreen() {
  return (
    <Box flexDirection="column">
      <Text bold color="blue">ℹ️  About Screen {text}</Text>
      <Text>This is a demo of nested layouts and navigation.</Text>
      <Box flexDirection="column" marginTop={1}>
        <Text>• Uses keyboard shortcuts for navigation</Text>
        <Text>• Supports nested routes</Text>
        <Text>• Layout inheritance</Text>
      </Box>
    </Box>
  )
}
