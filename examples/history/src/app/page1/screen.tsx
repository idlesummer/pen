// examples/history/src/app/page1/screen.tsx
import { Box, Text } from 'ink'

export default function Page1Screen() {
  return (
    <Box flexDirection="column">
      <Text bold color="blue">📄 Page 1</Text>
      <Box marginTop={1}>
        <Text>You're on Page 1.</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Try using [b] back and [f] forward buttons!</Text>
      </Box>
    </Box>
  )
}
