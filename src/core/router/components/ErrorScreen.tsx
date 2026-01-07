// src/core/router/components/GlobalErrorFallback.tsx
import { Box, Text, useInput } from 'ink'
import { useState } from 'react'
import { type ErrorComponentProps } from './ErrorBoundary'

/** Global error fallback that always wraps the app. */
export function ErrorScreen({ error, reset }: ErrorComponentProps) {
  const [showStack, setShowStack] = useState(false)

  useInput((input) => {
    if (input === 'r') reset()
    if (input === 's') setShowStack(prev => !prev)
    if (input === 'q') process.exit(1)
  })

  return (
    <Box
      flexDirection="column"
      padding={2}
      borderStyle="double"
      borderColor="red"
    >
      <Box marginBottom={1}>
        <Text bold color="red">💥 Critical Application Error</Text>
      </Box>

      <Box marginBottom={1}>
        <Text color="red">The application encountered a fatal error and cannot continue.</Text>
      </Box>

      <Box
        flexDirection="column"
        padding={1}
        borderStyle="round"
        borderColor="yellow"
        marginBottom={1}
      >
        <Text bold color="yellow">Error Details:</Text>
        <Text>{error.message}</Text>
      </Box>

      {showStack && error.stack && (
        <Box
          flexDirection="column"
          padding={1}
          borderStyle="single"
          borderColor="gray"
          marginBottom={1}
        >
          <Text bold dimColor>Stack Trace:</Text>
          <Text dimColor>{error.stack}</Text>
        </Box>
      )}

      <Box flexDirection="column" marginTop={1}>
        <Text bold>Options:</Text>
        <Text dimColor>  [r] Retry   [s] Toggle Stack Trace   [q] Quit</Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          If this error persists, please report it.
        </Text>
      </Box>
    </Box>
  )
}
