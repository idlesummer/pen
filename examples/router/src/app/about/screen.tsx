// examples/router/src/app/about/screen.tsx
import { Text, Box } from 'ink'
import { useInput } from 'ink'
import { useRouter } from '@idlesummer/pen'

export default function AboutScreen() {
  const router = useRouter()

  useInput((input) => {
    if (input === 'h')
      router.push('/')
  })

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="green">ℹ️  About Screen</Text>
      <Text>Current URL: {router.url}</Text>
      <Box marginTop={1}>
        <Text dimColor>Press 'h' to go back Home</Text>
      </Box>
    </Box>
  )
}
