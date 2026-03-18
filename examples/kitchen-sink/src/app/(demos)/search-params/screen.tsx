// examples/kitchen-sink/src/app/(demos)/search-params/screen.tsx
// Demonstrates useSearchParams — lives at /search-params/ via route group (demos)
// Navigate here via [5] in the root layout to pass { greeting, count } as search params
import { Box, Text } from 'ink'
import { useSearchParams } from '@idlesummer/pen'

interface Params {
  greeting?: string
  count?: number
}

export default function SearchParamsScreen() {
  const params = useSearchParams() as Params

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="yellow">useSearchParams</Text>
      <Text dimColor>Data passed via router.push(url, searchParams):</Text>
      {params && Object.keys(params).length > 0 ? (
        <Box flexDirection="column">
          {Object.entries(params).map(([k, v]) => (
            <Text key={k}>  {k}: <Text color="cyan">{String(v)}</Text></Text>
          ))}
        </Box>
      ) : (
        <Text dimColor>  (no params — navigate here with [5] to see them)</Text>
      )}
    </Box>
  )
}
