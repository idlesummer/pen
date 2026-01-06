// examples/history/src/app/layout.tsx
import { Box, Text } from 'ink'
import { useInput } from 'ink'
import { useRouter } from '@idlesummer/pen'
import type { PropsWithChildren } from 'react'

export default function RootLayout({ children }: PropsWithChildren) {
  const router = useRouter()

  useInput((input) => {
    if (input === '1') router.push('/')
    if (input === '2') router.push('/page1/')
    if (input === '3') router.push('/page2/')
    if (input === '4') router.push('/page3/')
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
        <Text dimColor>  [b] Back  [f] Forward  [r] Replace with Page 1</Text>
      </Box>

      {/* Content */}
      <Box borderStyle="single" borderColor="gray" padding={1} marginBottom={1}>
        {children}
      </Box>

      {/* History Stack Visualization */}
      <Box flexDirection="column" paddingX={1} marginTop={1}>
        <Text bold>History Stack:</Text>
        <Box flexDirection="column" paddingLeft={2} marginTop={1}>
          {router.history.map((historyUrl, i) => (
            <Box key={i}>
              <Text color={i === router.index ? 'green' : 'dim'}>
                {i === router.index ? '→ ' : '  '}
                {historyUrl}
                {i === router.index && ' (current)'}
              </Text>
            </Box>
          ))}
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Index: {router.index} / Length: {router.history.length}</Text>
        </Box>
      </Box>

      {/* Current URL */}
      <Box flexDirection="column" paddingX={1} marginTop={1}>
        <Text bold>Current URL:</Text>
        <Text color="yellow">{router.url}</Text>
      </Box>
    </Box>
  )
}
