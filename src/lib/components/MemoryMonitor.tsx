import { Box, Text } from 'ink'
import { useMemoryMonitor } from '../hooks'

export interface MemoryMonitorProps {
  /** Update interval in milliseconds (default: 1000) */
  interval?: number
  /** Border color (default: 'gray') */
  borderColor?: string
  /** Whether to show detailed stats (default: false) */
  detailed?: boolean
}

/**
 * Display real-time memory usage statistics
 *
 * @example
 * ```tsx
 * // Simple usage
 * <MemoryMonitor />
 *
 * // Detailed view with faster updates
 * <MemoryMonitor interval={500} detailed />
 * ```
 */
export function MemoryMonitor({
  interval = 1000,
  borderColor = 'gray',
  detailed = false,
}: MemoryMonitorProps = {}) {
  const { heapUsed, heapTotal, rss, external } = useMemoryMonitor(interval)
  const percentage = Math.round((heapUsed / heapTotal) * 100)

  if (detailed) {
    return (
      <Box borderStyle="single" borderColor={borderColor} padding={0} paddingX={1}>
        <Box flexDirection="column">
          <Text dimColor>
            🧠 Heap: {heapUsed}/{heapTotal} MB ({percentage}%)
          </Text>
          <Text dimColor>
            📊 RSS: {rss} MB • External: {external} MB
          </Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box borderStyle="single" borderColor={borderColor} padding={0} paddingX={1}>
      <Text dimColor>
        🧠 {heapUsed}/{heapTotal} MB ({percentage}%) • RSS: {rss} MB
      </Text>
    </Box>
  )
}
