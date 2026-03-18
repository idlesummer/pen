// examples/kitchen-sink/src/app/(demos)/type/screen.tsx
// Demonstrates useInput for freeform text entry — lives at /type/
import { useState } from 'react'
import { Box, Text, useInput } from 'ink'

export default function TypeScreen() {
  const [text, setText] = useState('')

  useInput((char, key) => {
    if (key.backspace || key.delete) {
      setText(prev => prev.slice(0, -1))
    } else if (key.escape) {
      setText('')
    } else if (key.return) {
      setText(prev => prev + '\n')
    } else if (char && !key.ctrl && !key.meta) {
      setText(prev => prev + char)
    }
  })

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="white">Type something</Text>

      {/* Input area */}
      <Box borderStyle="single" paddingX={1} flexDirection="column" minHeight={4}>
        <Text>{text}<Text inverse> </Text></Text>
      </Box>

      <Text dimColor>Backspace to delete · Esc to clear · Enter for newline</Text>
    </Box>
  )
}
