// examples/router-2/src/app/layout.tsx
import { Box, Text } from 'ink'
import { useInput } from 'ink'
import { useRouter } from '@idlesummer/pen'
import type { PropsWithChildren } from 'react'

export default function RootLayout({ children }: PropsWithChildren) {
  const router = useRouter()

  useInput((input) => {
    if (input === '1') router.push('/')
    if (input === '2') router.push('/about/')
    if (input === '3') router.push('/settings/')
    if (input === '4') router.push('/settings/profile/')
  })

  return (
    <Box borderStyle="round"  flexDirection="column" padding={1}>
      {/* Header */}
      <Text bold color="cyan">{'My App\n'}</Text>

      {/* Navigation */}
      <Box marginBottom={1}>
        <Text dimColor>
          [1] Home  [2] About  [3] Settings  [4] Profile
        </Text>
      </Box>

      {/* Content */}
      <Box flexDirection="column" paddingX={1}>
        {children}
      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>Current: {router.url}</Text>
      </Box>
    </Box>
  )
}
