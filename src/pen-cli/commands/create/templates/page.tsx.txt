import { useState } from 'react'
import { Box, Text, useAnimation, useApp, useInput, useWindowSize } from 'ink'

const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const COLORS = ['cyan', 'magenta', 'yellow', 'green'] as const

export default function Page() {
  const { exit } = useApp()
  const { columns, rows } = useWindowSize()
  const { frame, time } = useAnimation({ interval: 80 })
  const [count, setCount] = useState(0)

  useInput((input, key) => {
    if (input === 'q') exit()
    else if (input === 'r') setCount(0)
    else if (key.upArrow || input === '+') setCount(n => n + 1)
    else if (key.downArrow || input === '-') setCount(n => n - 1)
  })

  const accent = COLORS[Math.floor(time / 1500) % COLORS.length]!
  const barWidth = Math.max(8, Math.min(columns - 8, 40))
  const filled = Math.round(((Math.sin(time / 600) + 1) / 2) * barWidth)

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={accent} paddingX={2} paddingY={1}>
      <Text bold color={accent}>
        {SPINNER[frame % SPINNER.length]} Welcome to pen
      </Text>
      <Text dimColor>Edit this file and save, and this page updates live.</Text>

      <Box marginTop={1} flexDirection="column">
        <Text>
          Time <Text bold>{new Date().toLocaleTimeString()}</Text>
          <Text dimColor>  up {(time / 1000).toFixed(1)}s</Text>
        </Text>
        <Text>
          Terminal <Text bold>{columns}×{rows}</Text>
          <Text dimColor>  (resize the window)</Text>
        </Text>
        <Text>
          Count <Text bold color={count < 0 ? 'red' : 'green'}>{count}</Text>
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text color={accent}>{'█'.repeat(filled)}</Text>
        <Text dimColor>{'░'.repeat(barWidth - filled)}</Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>↑/↓ or +/- change count · r reset · q quit</Text>
      </Box>
    </Box>
  )
}
