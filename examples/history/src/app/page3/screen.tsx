// examples/history/src/app/page3/screen.tsx
import { Box, Text } from 'ink'
import { useRouter } from '@idlesummer/pen'

export default function Page3Screen() {
  const router = useRouter()

  return (
    <Box flexDirection="column">
      <Text bold color="yellow">📄 Page 3</Text>
      <Box marginTop={1}>
        <Text>You're on Page 3.</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold>Understanding Replace:</Text>
        <Text>• Press [r] to replace current URL with Page 1</Text>
        <Text>• Notice: Page 3 disappears from history</Text>
        <Text>• Press [b] - you won't come back here!</Text>
      </Box>
    </Box>
  )
}
