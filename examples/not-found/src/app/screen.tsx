import { Box, Text, useInput } from 'ink'
import { useRouter } from '@idlesummer/pen'

export default function HomeScreen() {
  const router = useRouter()

  useInput((input) => {
    if (input === '1') router.push('/')
    if (input === '2') router.push('/broken/')
  })

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">Not-found Test</Text>
      <Text dimColor>[1] Home  [2] Broken</Text>
    </Box>
  )
}
