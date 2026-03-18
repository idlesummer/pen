// examples/kitchen-sink/src/app/screen.tsx
import { Box, Text } from 'ink'
import { ROUTES } from './_private/routes'

export default function HomeScreen() {
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="green">Kitchen Sink</Text>
      <Text>A comprehensive example demonstrating all pen features.</Text>
      <Box flexDirection="column">
        <Text dimColor>Routes in this app:</Text>
        {ROUTES.map(r => (
          <Text key={r.key} dimColor>  {r.key}  <Text color="white">{r.path}</Text>  {r.desc}</Text>
        ))}
      </Box>
    </Box>
  )
}
