import { Box, Text } from 'ink'
import { useParams } from '@idlesummer/pen'

export default function WikiScreen() {
  const { path } = useParams()
  const segments = Array.isArray(path) ? path : path ? [path] : []

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="magenta">Wiki</Text>
      {segments.length === 0 ? (
        <Text dimColor>No path segments — showing wiki root.</Text>
      ) : (
        <Box flexDirection="column">
          <Text dimColor>path segments:</Text>
          {segments.map((s, i) => (
            <Text key={i}>  [{i}] <Text bold color="yellow">{s}</Text></Text>
          ))}
        </Box>
      )}
      <Text dimColor>Try /wiki/ (no segments) or /wiki/install/linux/</Text>
    </Box>
  )
}
