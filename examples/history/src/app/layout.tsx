// examples/history/src/app/layout.tsx
import { Box, Text } from 'ink'
import { useInput } from 'ink'
import { useRouter } from '@idlesummer/pen'
import type { PropsWithChildren } from 'react'

export default function RootLayout({ children }: PropsWithChildren) {
  const router = useRouter()

  useInput((input) => {
    // Navigation
    if (input === '1') router.push('/')
    if (input === '2') router.push('/page1/')
    if (input === '3') router.push('/page2/')
    if (input === '4') router.push('/page3/')

    // History
    if (input === 'b') router.back()
    if (input === 'f') router.forward()
    if (input === 'r') router.replace('/page1/')
  })

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="round" borderColor="cyan" paddingX={2} marginBottom={1}>
        <Text bold color="cyan">History Management Demo</Text>
      </Box>

      {/* Navigation Controls */}
      <Box flexDirection="column" marginBottom={1} paddingX={1}>
        <Text bold>Navigate:</Text>
        <Text dimColor>  [1] Home  [2] Page 1  [3] Page 2  [4] Page 3</Text>
        <Box marginTop={1}>
          <Text bold>History:</Text>
        </Box>
        <Text dimColor>
          {`  [b] Back ${!router.canGoBack ? '(disabled)' : ''}`}
          {`  [f] Forward ${!router.canGoForward ? '(disabled)' : ''}`}
        </Text>
        <Text dimColor>  [r] Replace with Page 1</Text>
      </Box>

      {/* Content */}
      <Box borderStyle="single" borderColor="gray" padding={1} marginBottom={1}>
        {children}
      </Box>

      {/* Status */}
      <Box flexDirection="column" paddingX={1}>
        <Text bold>Status:</Text>
        <Text>Current URL: <Text color="yellow">{router.url}</Text></Text>
        <Text>
          Can go back: {router.canGoBack ? <Text color="green">✓</Text> : <Text color="red">✗</Text>}
          {' | '}
          Can go forward: {router.canGoForward ? <Text color="green">✓</Text> : <Text color="red">✗</Text>}
        </Text>
      </Box>
    </Box>
  )
}
