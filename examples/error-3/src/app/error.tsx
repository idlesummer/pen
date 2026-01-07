import { Box, Text } from 'ink'
import { useInput } from 'ink'
import { useRouter } from '@idlesummer/pen'
import type { ErrorComponentProps } from '@idlesummer/pen'

export default function RootError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()

  useInput((input) => {
    if (input === '1') router.push('/')
    if (input === 'r') reset()
  })

  return (
    <Box
      flexDirection="column"
      padding={1}
      borderStyle="round"
      borderColor="red"
    >
      <Text bold color="red">🚨 Error!</Text>
      <Box marginTop={1}>
        <Text color="yellow">{error.message}</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>[1] Go Home  [r] Retry</Text>
      </Box>
    </Box>
  )
}
