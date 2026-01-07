import { Box, Text } from 'ink'
import { useInput } from 'ink'
import { useRouter } from '@idlesummer/pen'
import type { PropsWithChildren } from 'react'

export default function RootLayout({ children }: PropsWithChildren) {
  const router = useRouter()

  useInput((input) => {
    if (input === '1') router.push('/')
    if (input === '2') router.push('/broken/')
  })

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">Error Test</Text>
      <Text dimColor>[1] Home  [2] Broken</Text>
      <Box marginTop={1}>
        {children}
      </Box>
    </Box>
  )
}
