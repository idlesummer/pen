import { useState, useEffect } from 'react'
import { Box, Text } from 'ink'

export default function CounterPage() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setCount(c => c + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="green">Counter</Text>
      <Text>Count: <Text color="cyan" bold>{count}</Text></Text>
      <Text dimColor>
        Edit this file.
        Count should keep ticking across saves.
      </Text>
    </Box>
  )
}
