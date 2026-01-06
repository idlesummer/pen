// examples/history/src/app/screen.tsx
import { Box, Text } from 'ink'

export default function HomeScreen() {
  return (
    <Box flexDirection="column">
      <Text bold color="green">🏠 Home Page</Text>
      <Box marginTop={1}>
        <Text>This is the home page. Navigate using the number keys above.</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold>Try this:</Text>
        <Text>1. Press [2] to go to Page 1</Text>
        <Text>2. Press [3] to go to Page 2</Text>
        <Text>3. Press [b] to go back to Page 1</Text>
        <Text>4. Press [f] to go forward to Page 2</Text>
        <Text>5. Press [4] - forward history gets cleared!</Text>
      </Box>
    </Box>
  )
}
