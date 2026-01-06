// examples/use-router/src/app/screen.tsx
import { Text, Box } from 'ink'
import { useInput } from 'ink'
import { useRouter } from '@idlesummer/pen'

export default function HomeScreen() {
  const router = useRouter()

  useInput((input) => {
    if (input === 'a')
      router.push('/about/')
  })

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">🏠 Home Screen</Text>
      <Text>Current URL: {router.url}</Text>
      <Box marginTop={1}>
        <Text dimColor>Press 'a' to navigate to About</Text>
      </Box>
    </Box>
  )
}
