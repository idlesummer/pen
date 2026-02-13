import { Box, Text } from 'ink'

interface BarItem {
  label: string
  value: number
  maxValue: number
  unit?: string
  color: string
}

interface BarChartProps {
  items: BarItem[]
  barWidth?: number
  title?: string
  titleColor?: string
}

const FILLED = '█'
const EMPTY = '░'

export function BarChart({
  items,
  barWidth = 30,
  title,
  titleColor = 'cyan',
}: BarChartProps) {
  const longestLabel = Math.max(...items.map((item) => item.label.length))

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={titleColor}
      padding={1}
    >
      {title && (
        <Text bold color={titleColor}>
          {title}
        </Text>
      )}
      <Box marginTop={title ? 1 : 0} flexDirection="column">
        {items.map((item) => {
          const percent =
            item.maxValue > 0
              ? Math.min(Math.round((item.value / item.maxValue) * 100), 100)
              : 0
          const filledCount = Math.round((percent / 100) * barWidth)
          const emptyCount = barWidth - filledCount

          return (
            <Box key={item.label} gap={1}>
              <Text color="yellow">
                {item.label.padEnd(longestLabel)}
              </Text>
              <Text color={item.color}>
                {FILLED.repeat(filledCount)}
              </Text>
              <Text dimColor>{EMPTY.repeat(emptyCount)}</Text>
              <Text bold>
                {String(item.value).padStart(5)} {item.unit ?? 'MB'}
              </Text>
              <Text dimColor>({String(percent).padStart(3)}%)</Text>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
