// examples/kitchen-sink/src/app/about/screen.tsx
import { Box, Text } from 'ink'

export default function AboutScreen() {
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="blue">About</Text>
      <Text>This example covers every pen feature in one place:</Text>
      <Box flexDirection="column">
        <Text>  screen.tsx     — route content</Text>
        <Text>  layout.tsx     — wraps child routes (nested layouts)</Text>
        <Text>  error.tsx      — error boundary fallback</Text>
        <Text>  not-found.tsx  — 404 fallback</Text>
        <Text>  (group)/       — route grouping, no URL segment</Text>
        <Text>  [param]/       — dynamic route segments</Text>
        <Text>  _private/      — files ignored by the router</Text>
      </Box>
    </Box>
  )
}
