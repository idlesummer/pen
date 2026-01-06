// examples/history/src/app/page2/screen.tsx
import { Box, Text } from 'ink'

export default function Page2Screen() {
  return (
    <Box flexDirection="column">
      <Text bold color="magenta">📄 Page 2</Text>
      <Box marginTop={1}>
        <Text>You're on Page 2.</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Notice how [b] and [f] work like browser back/forward!</Text>
      </Box>
    </Box>
  )
}