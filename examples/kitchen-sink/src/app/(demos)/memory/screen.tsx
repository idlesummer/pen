// examples/kitchen-sink/src/app/(demos)/memory/screen.tsx
// Demonstrates useMemoryMonitor — lives at /memory/ via route group (demos)
import { Box, Text } from 'ink'
import { useMemoryMonitor } from '@idlesummer/pen'

export default function MemoryScreen() {
  const { heapUsed, heapTotal, rss, external } = useMemoryMonitor(500)

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="green">useMemoryMonitor</Text>
      <Text dimColor>Live memory usage (updates every 500ms):</Text>
      <Box flexDirection="column">
        <Text>  heapUsed:  <Text color="cyan">{heapUsed} MB</Text></Text>
        <Text>  heapTotal: <Text color="cyan">{heapTotal} MB</Text></Text>
        <Text>  rss:       <Text color="cyan">{rss} MB</Text></Text>
        <Text>  external:  <Text color="cyan">{external} MB</Text></Text>
      </Box>
    </Box>
  )
}
