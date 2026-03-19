import { Box, Text } from 'ink'
import { useParams } from '@idlesummer/pen'

export default function DocsScreen() {
  const { slug } = useParams()
  const segments = Array.isArray(slug) ? slug : [slug]

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="blue">Docs</Text>
      <Box flexDirection="column">
        <Text dimColor>slug segments:</Text>
        {segments.map((s, i) => (
          <Text key={i}>  [{i}] <Text bold color="yellow">{s}</Text></Text>
        ))}
      </Box>
      <Text dimColor>Try /docs/guide/introduction/ or /docs/api/hooks/</Text>
    </Box>
  )
}
