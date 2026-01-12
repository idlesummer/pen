// examples/router-2/src/app/screen.tsx
import { Box, Text } from 'ink'

export default function HomeScreen() {
  return (
    <Box flexDirection="column">
      <Text bold color="green">🏠 Home Screen</Text>
      <Text>Welcome to the home page!</Text>
      <Box marginTop={1}>
        <Text dimColor>Press number keys to navigate</Text>
      </Box>
    </Box>
  )
}
