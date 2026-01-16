import { useState } from 'react'
import { Box, Text, useInput } from 'ink'

export default function Screen() {
  const [count, setCount] = useState(0)

  useInput((input) => {
    if (input === ' ') setCount(c => c + 1)
  })

  return (
    <Box flexDirection="column" gap={1}>
      <Box>
        <Text>Count: <Text bold color="green">{count}</Text></Text>
      </Box>
      <Box>
        <Text dimColor>Press <Text bold>SPACE</Text> to increment</Text>
      </Box>
    </Box>
  )
}
