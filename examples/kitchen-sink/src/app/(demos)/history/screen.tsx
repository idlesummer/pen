// examples/kitchen-sink/src/app/(demos)/history/screen.tsx
// Demonstrates useHistory — lives at /history/ via route group (demos)
import { Box, Text } from 'ink'
import { useHistory, usePathname } from '@idlesummer/pen'

export default function HistoryScreen() {
  const { stack, position } = useHistory()
  const url = usePathname()

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="magenta">useHistory</Text>
      <Text dimColor>Current position: <Text color="white">{position}</Text> of {stack.length - 1}</Text>
      <Text dimColor>Stack (oldest → newest):</Text>
      {stack.map((entry, i) => (
        <Text key={i} dimColor>
          {'  '}
          <Text color={i === position ? 'cyan' : undefined}>
            {i === position ? '→ ' : '  '}
            {i}: {entry}
          </Text>
        </Text>
      ))}
      <Text dimColor>Note: this route is inside (demos)/ — a route group that adds no URL segment</Text>
    </Box>
  )
}
